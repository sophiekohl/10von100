# Prüfstand 05.11.2026

## Bestanden

GitHub Actions: https://github.com/sophiekohl/10von100/actions/runs/42102283255 — kompletter Lauf erfolgreich, mit 20 Node-Tests, Datenbank-Suite und sechs Chromium-Browsertests im iPhone-15-Pro-Viewport.

- Supabase-Projekt ACTIVE_HEALTHY; Health-Advisor ohne Befund. RLS, Funktionen, Storage und Rollenbeziehungen read-only inventarisiert.
- 20 lokale Node-Tests: Handler-Origin-/Body-Limits, keine Sitzung bei falscher PIN, keine PIN-Verwaltung durch Partner, Ausgabe registrierter Auth-Sitzungen, Rotation/Widerruf, Berliner Zeit/Sommerzeit, paralleler Refresh und Logout-Rennen.
- DOM-Tests mit den tatsächlichen Frontend-Skripten: neutrale öffentliche Ansicht, PIN-Anmeldung und Wiederaufnahme ohne PIN, medien-only-Brief, Logout-Bereinigung, Erinnerungs-CRUD, Studio-Ablehnung für Partner, Entwurf bis vollständiger Speicherung, fehlgeschlagener Upload ohne Veröffentlichung und Admin-Erinnerungsverwaltung.
- Service-Worker-Test: ausschließlich statische Allowlist; keine API-, Studio-, privaten Bild- oder Query-Token-Anfragen im Cache-Handler.
- Lokale PostgreSQL-WASM-Prüfung mit pgcrypto: Upgrade-Migration ausführbar; Fremdkonto ohne Zugriff; Paar nur auf veröffentlichte/freigeschaltete Inhalte; Entwürfe und künftige Medien unsichtbar; Erinnerungen erstellbar; PIN-Hash bcrypt/12; globaler Cooldown trotz IP-Wechsel; harte Sperre; registrierte Sitzung; keine Adminrechte; Ablauf und sofortiger Widerruf.

Alle Fixtures sind künstlich. Es wurden keine privaten Medien oder Produktionsinhalte veröffentlicht.

## Backend-Bereitstellung und Live-Negativtests

Migrationen `private_app_security` und `explicit_app_grants` sind angewendet. `partner-pin` Version 1 ist ACTIVE; keine PIN konfiguriert. Die Rechteinventur ergab zusätzlich fehlende DML-Grants und unnötige TRUNCATE-/TRIGGER-/REFERENCES-Rechte. Explizite App-Grants sind unter gehärteter RLS aktiv; anon hat keine App-Tabellenrechte. Signierte Medien-URLs wurden anhand des offiziellen storage-js-Quellcodes korrigiert: `/object/sign/...` muss den Präfix `/storage/v1` behalten.

Live-HTTP: anonymer REST-Inhaltszugriff 401, interner PIN-Prüf-RPC 401, öffentliche neutrale Termin-RPC 200, fremder Origin am PIN-Endpunkt 403. Ungültiger PIN sowie nicht authentifizierte Konfiguration/Sperre liefern 401, `Cache-Control: no-store` und keinen Token. Rechteabfrage bestätigt keine öffentlichen PIN-RPC-Rechte, kein anonymes Lesen/Truncate und unveränderte bestehende Authidentität. Health-Advisor nach Migration ohne Befund. Security-Advisor enthält die dokumentierten bewussten Definer-Funktionen, absichtlich geschlossene Mitgliedschafts-/Private-Tabellen und deaktivierten Schutz gegen geleakte Passwörter.

## Lokale Grenzen und verbleibende Echtgerätetests

Chromium lässt sich in der lokalen Work-Laufzeit nicht starten (SIGTRAP vor dem App-Aufruf). Die vollständige Suite wurde anschließend in GitHub Actions auf Ubuntu 24.04 erfolgreich ausgeführt. Sie prüft neutrale Ansicht, PIN-Sitzung und Wiederaufnahme, medien-only-Brief/Logout, Erinnerungsverwaltung, Studio-Ablehnung für Partner, Uploadfehler ohne Veröffentlichung, mobilen Viewport und mehrtägigen Kalender. Browserdaten sind künstliche API-Fixtures. Reale Auth-/Storage-Dienste und das physische iPhone sind dadurch nicht vollständig getestet.

Ein geplanter transaktionaler Test über Supabase `execute_sql` wurde nicht ausgeführt, weil die Bestätigungsanfrage ablief. Es wurden dabei keine Änderungen angewendet. Lokale PostgreSQL-Tests ersetzen den noch offenen echten Auth-/Storage-/Edge-Ende-zu-Ende-Test nicht.

## Erforderlich vor Freigabe

Erfolgreichen PIN-/Refresh-Ablauf und private Medien mit echten getrennten Konten prüfen. Der Versuch einer vollständigen transaktionalen Fixture-Suite gegen Produktion blieb wegen abgelaufener Bestätigung ohne Ausführung; die zusätzliche Live-Grants-Prüfung wurde separat erfolgreich ausgeführt. Negative Live-HTTP-Tests und Backend-Bereitstellung sind abgeschlossen. Danach die Liste in `IPHONE_ACCEPTANCE.md` auf dem Zielgerät abarbeiten. Keine Aufgabe zur Produktionsabnahme allein wegen bestandener lokaler Tests abhaken.

## Vorbereitung installierbare Hauptversion

Hauptbranch mit dem getesteten Releasekandidaten abgeglichen; Studio-Konflikt zugunsten des aktuellen Passwort-/Recovery-Ablaufs mit Root-Core-Script aufgelöst. Service Worker v6 cached ausschließlich öffentliche Allowlist-Dateien inklusive Hochzeitsbild. Neue echte Browserprüfung kontrolliert Manifest, Controller-Aktivierung, Cache-Inhalt sowie Offline-Neuladen mit Foto und geschlossenem Privatbereich. Die bereits live angewendete Cleanup-Migration ist mit ihrer echten Historienversion 20261106084835 im Repository ergänzt. Keine erneute Datenbankänderung vorgesehen. Lokale Unit- und Datenbankprüfungen bestanden; Browsernachweis und physische PWA-Abnahme folgen separat.

Die erste vollständige Releaseprüfung bestand mit 29 Browserfällen; einzig WebKit-Offline-Neuladen scheiterte intern in der Playwright-Navigation. Dies entspricht den dokumentierten Playwright-Issues https://github.com/microsoft/playwright/issues/42775 und https://github.com/microsoft/playwright/issues/34402 . Der PWA-Test prüft in beiden Engines Manifest, aktiven Controller, öffentliche Cache-Allowlist und sichtbaren Offlinezustand. Echtes Offline-Neuladen wird automatisiert in Chromium geprüft; in WebKit wird dieser bekannte Emulationsschritt nicht als bestanden behauptet. Physischer iPhone-Offlineneustart bleibt zwingend offen.
