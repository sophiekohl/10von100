import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const context={window:{},TextEncoder,Uint8Array,Uint32Array,DataView,Blob,crypto};
vm.runInNewContext(await fs.readFile(new URL('../backup.js',import.meta.url),'utf8'),context);
const {build,safePath}=context.window.AppBackup;
function fixture({deny=false,fail=false,change=false,abort=false}={}){
 const data={content_items:[{id:'a',title:'Private future draft',published:false,teaser_image_path:'a/teaser.jpg'}],content_media:[{id:'b',content_item_id:'a',media_type:'image',storage_path:'a/photo.jpg'},{id:'c',content_item_id:'a',media_type:'youtube',youtube_video_id:'abcdefghijk'},{id:'d',content_item_id:'a',media_type:'deezer',deezer_id:'123',deezer_kind:'track'}],year_moments:[{id:'m',caption:'Our moment'}],moment_photos:[{id:'p',moment_id:'m',storage_path:'u/m/Ä.jpg'}],calendar_ranges:[{id:'r',start_date:'2026-12-09',end_date:'2026-12-12'}]};
 let reads=0,cancelled=false;const calls=[],downloads=[];
 const request=async url=>{calls.push(url);if(url==='/auth/v1/user')return {id:'admin'};if(url.includes('admin_users'))return deny?[]:[{user_id:'admin'}];const parsed=new URL(url,'https://test.invalid'),name=parsed.pathname.split('/').at(-1);if(name==='content_items'&&!parsed.searchParams.has('id'))reads++;
 let rows=data[name];if(parsed.searchParams.has('id'))rows=rows.filter(r=>r.id>parsed.searchParams.get('id').slice(3));
 // Deliberately cap to one row, below the requested page size.
 rows=rows.slice(0,1).map(r=>({...r}));if(change&&reads>1&&name==='content_items')rows=rows.map(r=>({...r,title:'Changed'}));return rows;};
 const download=async(bucket,p)=>{downloads.push([bucket,p]);if(fail)throw Error('Unavailable');if(abort)cancelled=true;return new Uint8Array([0,1,2,255]);};
 return {request,download,check:()=>{if(cancelled)throw Error('Cancelled');},calls,downloads};
}
test('ZIP independently opens, verifies checksums and preserves drafts, links, Unicode and original bytes',async()=>{
 const f=fixture(),result=await build(f),folder=await fs.mkdtemp(path.join(os.tmpdir(),'content-backup-test-'));
 try{const file=path.join(folder,'synthetic.zip');await fs.writeFile(file,new Uint8Array(await result.blob.arrayBuffer()));
 const verified=execFileSync('python3',['tools/verify-content-backup.py',file],{encoding:'utf8'});assert.match(verified,/OK:/);
 execFileSync('python3',['-c',`import zipfile,json,sys\nz=zipfile.ZipFile(sys.argv[1]);d=json.loads(z.read('data.json'));assert d['content_items'][0]['published'] is False;assert len(d['content_media'])==3;assert z.read('media/moments/u/m/Ä.jpg')==bytes([0,1,2,255]);assert not any('token' in n or 'secret' in n for n in z.namelist())`,file]);
 assert.equal(result.manifest.media_count,3);assert.equal(f.downloads.length,3);
 }finally{await fs.rm(folder,{recursive:true,force:true});}
});
test('non-admin fails before any content or original is downloaded',async()=>{const f=fixture({deny:true});await assert.rejects(build(f),/Adminzugang/);assert.equal(f.downloads.length,0);assert.equal(f.calls.length,2);});
test('missing media, changed rows, cancellation and size limits fail without returning an archive',async()=>{
 await assert.rejects(build(fixture({fail:true})),/Unavailable/);await assert.rejects(build(fixture({change:true})),/geändert/);await assert.rejects(build(fixture({abort:true})),/Cancelled/);await assert.rejects(build({...fixture(),maxBytes:2}),/150 MB/);
});
test('unsafe archive paths fail closed',()=>{for(const p of ['../a','a/../b','/a','a//b','a\\b','a:bad','a/\0'])assert.throws(()=>safePath(p));});
