# Private Inhaltssicherung (kostenlos)

Im angemeldeten Haupt-Studio steht oben „Deine Inhalte privat sichern“ bereit.
„Inhaltssicherung vorbereiten“ liest die Daten und Originale mit der bestehenden
Admin-Sitzung. Erst „ZIP-Datei herunterladen“ startet den lokalen Download.
Auf dem iPhone in „Dateien“ sichern, die ZIP öffnen und Stichproben ansehen.
Eine heruntergeladene Datei kann die App nicht nachträglich widerrufen.

Die ZIP ist **nicht verschlüsselt** und enthält auch zukünftige Überraschungen.
Nur auf eigenen geschützten Geräten aufbewahren, nicht per öffentlichem Link
teilen und niemals ins Repository hochladen. Vor Weitergabe eines Geräts den
Download entfernen. Für eine zusätzliche Kopie vorhandenen privaten,
verschlüsselten Speicher nutzen; es wird kein Dienst gebucht.

## Umfang und Format v1

- `data.json`: content_items, content_media, year_moments, moment_photos,
  calendar_ranges; explizite Spaltenliste statt unbegrenztem `select=*`.
- `media/content/`, `media/moments/`, `media/teasers/`: die von diesen Zeilen
  referenzierten Originaldateien, unverändert, dedupliziert nach Bucket/Pfad.
- `manifest.json`: Exportzeitraum, Zeilenzahlen, Medienzahl, Dateigrößen und SHA-256.
- `BITTE-LESEN.txt`: lokale Erklärung des Inhalts und der Grenzen.

YouTube-/Deezer-IDs werden gesichert, fremde Videos und Musik nicht heruntergeladen.
Nicht enthalten: unzugeordnete Storage-Objekte, Konten, Passwörter/PIN, Sitzungen,
Push-Abos/Schlüssel, Auth-/SMTP-Konfiguration, Schema und RLS. Dies ist eine
**Inhaltssicherung**, kein vollständiges Supabase-Backup oder fertiger Restore.

## Grenzen und Schutz

Maximal 150 MiB Nutzdaten und 50.000 Zeilen je Tabelle; darüber bricht der mobile
Export explizit ab. Ein größerer/streamender Export ist noch offen. Der Export
benötigt Browser-RAM und überträgt Originale; Supabase-Transferkontingente gelten.
Keine regelmäßigen automatischen Downloads. Nach wichtigen Änderungen erneut sichern.

Keyset-Paginierung lädt alle Zeilen auch bei kleineren API-Seitenlimits.
Adminstatus wird vor dem Export und abschließend geprüft. RLS und bestehende private
Storage-Regeln bleiben unverändert. Keine neuen Service-Schlüssel, Endpunkte,
Datenbankrechte oder öffentlichen Medien. Originale werden mit Bearer-Auth,
`no-store`, ohne Cookies und ohne Redirects abgefragt. Export nur im Haupt-Studio;
die alte Testvorschau erhält keine neue Exportoberfläche.

Vor und nach dem Mediendownload werden sämtliche exportierten Tabellen verglichen;
Änderungen, fehlende Dateien, Netzwerkfehler und ungültige Zuordnungen verhindern
ein scheinbar erfolgreiches Teilarchiv. Dies ist kein atomarer DB/Storage-Snapshot:
Währenddessen auch auf anderen Geräten nichts bearbeiten, insbesondere Dateien
nicht unter gleichem Pfad ersetzen. Abmelden, Abbrechen und Verlassen der Seite
brechen laufende Downloads ab und entfernen erzeugte Blob-URLs.

## Prüfung und Wiederherstellung

Offline ohne Netzwerkzugriff:

```sh
python3 tools/verify-content-backup.py /privater/pfad/sicherung.zip
```

Prüft ZIP-CRC, SHA-256, Größen, Dateiinventar, Zeilenzahlen und Medienzuordnungen.
Prüfsummen schützen vor versehentlicher Beschädigung, nicht vor gezielter Manipulation.
Es wird nichts importiert, extrahiert oder hochgeladen.

Technisch getestet: synthetischer Export mit privaten Entwürfen, externen Links,
Unicode-Pfaden, mehreren API-Seiten; unabhängige Python-ZIP-Prüfung; Fehler bei
fehlenden Medien, Größenlimit, Änderungen, Abbruch und fehlender Adminrolle;
mobile Chromium-/WebKit-Tests für Download und Logout.

Noch offen: Sophies erster echter iPhone-Download und lokale Sichtprüfung,
separate vollständige DB-/Konfigurationssicherung sowie Wiederherstellung in
isolierter Umgebung. Keine echten privaten Inhalte in Test-Artefakten.

Für einen zukünftigen Restore: Schema aus dem überprüften Code aufbauen,
Konten neu zuordnen (created_by), Datensätze in FK-Reihenfolge und Medien privat
wiederherstellen, PIN/Push separat neu konfigurieren. Zunächst ausschließlich
isoliert mit deaktivierten Push-/E-Mail-Aufträgen; keine Produktionsdaten
überschreiben. Ein Importwerkzeug ist bewusst noch nicht vorhanden.
