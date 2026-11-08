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

Sophie hat den ersten echten ZIP-Download und das Öffnen eines entpackten Fotos auf
ihrem iPhone bestätigt. Das bereitgestellte echte Archiv wurde unabhängig auf
ZIP-CRC, SHA-256, Dateigrößen, Inventar und Zuordnungen geprüft. Das bestätigt die
Inhaltssicherung, noch keine vollständige Wiederherstellung. Keine echten privaten
Inhalte in Repository oder CI-Artefakten.

Für einen zukünftigen Restore: Schema aus dem überprüften Code aufbauen,
Konten neu zuordnen (created_by), Datensätze in FK-Reihenfolge und Medien privat
wiederherstellen, PIN/Push separat neu konfigurieren. Zunächst ausschließlich
isoliert mit deaktivierten Push-/E-Mail-Aufträgen; keine Produktionsdaten
überschreiben. Ein Importwerkzeug ist bewusst noch nicht vorhanden.


## Lokale Wiederherstellungsprobe (Betreiberwerkzeug)

```sh
node tools/rehearse-content-restore.mjs /privater/pfad/sicherung.zip
```

Das Werkzeug hat **keine Ziel-URL oder Zugangsdatenparameter**. Es erstellt stets
neues PostgreSQL-WASM im Arbeitsspeicher und verbindet sich nicht mit dem echten
Projekt. Ein Wiederholungsaufruf kann dadurch keine bestehenden Inhalte überschreiben.
Benötigt die bereits fest gepinnten npm-Abhängigkeiten und Python 3; keine neuen
kostenpflichtigen Dienste oder Pakete. Abhängigkeiten vorher installieren.

Ablauf:
1. ZIP mit dem unabhängigen Python-Prüfer validieren, dann ausschließlich in ein
   neues temporäres Verzeichnis (Modus 0700) entpacken.
2. Schema-Abbild und eingecheckte Migrationen lokal aufbauen. Auth und Storage sind
   dabei reduzierte Testmodelle; Cron-/Netzwerkerweiterungen werden nicht zugelassen.
3. Referenzierte Autoren als lokale Platzhalter ohne E-Mail oder Anmeldedaten
   anlegen. Zusätzlich zufällige lokale Testidentitäten für Admin, Partner, Fremdkonto.
   Die Test-PIN gehört nur zu dieser Wegwerfdatenbank, niemals zum echten Zugang.
4. Alle fünf Inhaltstabellen in Fremdschlüssel-Reihenfolge parametrisiert einlesen.
   Typisierte SQL-Vergleiche prüfen sämtliche exportierten Spalten, nicht nur Anzahlen.
5. Originaldateien lokal wieder einlesen und erneut bytegenau mit Größen und SHA-256
   vergleichen. Ihre Objektmetadaten in das lokale Storage-Testmodell eintragen.
6. Rollen prüfen: Admin sieht alles, Partner nur veröffentlichte freigeschaltete
   Inhalte und zugeordnete Erinnerungsmedien, Fremdkonto keine privaten Inhalte,
   anonyme Termine ohne Titel/Brief und ohne Entwürfe. Partner-Widerruf testen.
7. Prüfen, dass keine Push-Abos oder Versandaufträge existieren. Nur einen Bericht
   mit Anzahlen und Prüfergebnissen ausgeben; keine Titel, Briefe oder Dateipfade.
   Datenbank schließen und temporäre Originaldateien im `finally`-Block entfernen.

Der normale Ablauf räumt auf; bei gewaltsamem Prozessabbruch kann das private
Verzeichnis im temporären Speicher verbleiben. Für echte Archive einen geschützten
Rechner/temporären Speicher verwenden. Das Tool nicht mit echten ZIPs in CI ausführen.

Automatische Tests (`npm run test:restore`) verwenden ausschließlich synthetische
Daten mit freigeschaltetem Beitrag, Zukunftstermin, Entwurf, privaten Originalen,
Erinnerung, Kalenderbereich sowie YouTube-/Deezer-Verknüpfungen. Sie prüfen auch
beschädigte ZIPs, ungültige Datenbankwerte und einen ohne Netzwerkanfragen arbeitenden
Import. Fehlerdetails aus SQL werden nicht ausgegeben, da sie private Werte enthalten
können. `status: passed` gilt nur für die **lokale Inhaltsprobe**.

Offen bleiben: diese Probe mit Sophies echtem Archiv, tatsächlicher Import in eine
vollständige Supabase-Testumgebung, Upload/Signierung/Wiedergabe über echte Storage- und
Auth-APIs sowie getrennte Wiederherstellung von Konten, SMTP, PIN, Push und Konfiguration.
Ein produktiver Restore oder ein Import-Knopf im Studio ist damit nicht freigegeben.
