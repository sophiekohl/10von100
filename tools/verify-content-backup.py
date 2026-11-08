#!/usr/bin/env python3
"""Offline integrity check. Never extracts, uploads, or imports private files."""
import hashlib
import json
import sys
import zipfile


def verify(path):
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError('Duplicate archive entries')
        for name in names:
            if any(part in ('', '.', '..') for part in name.split('/')) or '\\' in name or ':' in name:
                raise ValueError('Unsafe archive path')
        if sum(info.file_size for info in archive.infolist()) > 160 * 1024 * 1024:
            raise ValueError('Archive exceeds the supported size')
        if archive.testzip() is not None:
            raise ValueError('ZIP checksum mismatch')
        manifest = json.loads(archive.read('manifest.json'))
        if manifest['format'] != '10von100-content' or manifest['version'] != 1:
            raise ValueError('Unknown format')
        expected = {item['name'] for item in manifest['files']}
        if len(expected) != len(manifest['files']) or set(names) != expected | {'manifest.json'}:
            raise ValueError('File inventory mismatch')
        for item in manifest['files']:
            raw = archive.read(item['name'])
            if len(raw) != item['bytes'] or hashlib.sha256(raw).hexdigest() != item['sha256']:
                raise ValueError('File integrity mismatch')
        data = json.loads(archive.read('data.json'))
        tables = {'content_items', 'content_media', 'year_moments', 'moment_photos', 'calendar_ranges'}
        if set(data) != tables or set(manifest['counts']) != tables:
            raise ValueError('Table inventory mismatch')
        for table, rows in data.items():
            if len(rows) != manifest['counts'][table] or len({row['id'] for row in rows}) != len(rows):
                raise ValueError('Row count mismatch')
        items = {row['id'] for row in data['content_items']}
        moments = {row['id'] for row in data['year_moments']}
        if any(row['content_item_id'] not in items for row in data['content_media']):
            raise ValueError('Content relation missing')
        if any(row['moment_id'] not in moments for row in data['moment_photos']):
            raise ValueError('Moment relation missing')
        refs = set()
        for table, field, bucket in [('content_items', 'teaser_image_path', 'teasers'),
                                     ('content_media', 'storage_path', 'content'),
                                     ('moment_photos', 'storage_path', 'moments')]:
            for row in data[table]:
                if row.get(field):
                    refs.add('media/' + bucket + '/' + row[field])
        if refs != {name for name in names if name.startswith('media/')} or len(refs) != manifest['media_count']:
            raise ValueError('Media inventory mismatch')
        return manifest


if __name__ == '__main__':
    try:
        manifest = verify(sys.argv[1])
        print('OK: ZIP, SHA-256, row counts, media and relations verified locally.')
        print('This is not a full project backup or a restore test.')
    except Exception as error:
        # Never print private filenames, captions, or credentials from the archive.
        print('FAILED: archive is incomplete, damaged, or unsupported.', file=sys.stderr)
        sys.exit(1)
