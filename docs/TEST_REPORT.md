# Prüfstand 05.11.2026

## Bestanden

- Supabase-Projekt ACTIVE_HEALTHY; Health-Advisor ohne Befund. RLS, Funktionen, Storage und Rollenbeziehungen read-only inventarisiert.
- Lokale Node-Tests: Handler-Origin-/Body-Limits, keine Sitzung bei falscher PIN, keine PIN-Verwaltung durch Partner, Ausgabe registrierter Auth-Sitzungen, Rotation/Widerruf, Berliner Zeit/Sommerzeit, paralleler Refresh und Logout-Rennen.
- DOM-Tests mit den tatsächlichen Frontend-Skripten: neutrale öffentliche Ansicht, PIN-Anmeldung und Wiederaufnahme ohne PIN, medien-only-Brief, Logout-Bereinigung, Erinnerungs-CRUD, Studio-Ablehnung für Partner, Entwurf bis vollständiger Speicherung, fehlgeschlagener Upload ohne Veröffentlichung und Admin-Erinnerungsverwaltung.
- Service-Worker-Test: ausschließlich statische Allowlist; keine API-, Studio-, privaten Bild- oder Query-Token-Anfragen im Cache-Handler.
- Lokale PostgreSQL-WASM-Prüfung mit pgcrypto: Upgrade-Migration ausführbar; Fremdkonto ohne Zugriff; Paar nur auf veröffentlichte/freigeschaltete Inhalte; Entwürfe und künftige Medien unsichtbar; Erinnerungen erstellbar; PIN-Hash bcrypt/12; globaler Cooldown trotz IP-Wechsel; harte Sperre; registrierte Sitzung; keine Adminrechte; Ablauf und sofortiger Widerruf.

Alle Fixtures sind künstlich. Es wurden keine privaten Medien oder Produktionsinhalte veröffentlicht.

## Nicht bestanden / nicht ausführbar

Die Playwright-Suite wurde gestartet, konnte aber keine App-Prüfung durchführen: Der Chromium-Prozess beendet sich in der Work-Laufzeit mit SIGTRAP. Die Tests bleiben im Repository für CI/Entwicklungsumgebung. Ein Viewport-Mock und DOM-Tests können Layout, native Medienwiedergabe, Safari und PWA-Installation nicht bestätigen.

Ein geplanter transaktionaler Test über Supabase `execute_sql` wurde nicht ausgeführt, weil die Bestätigungsanfrage ablief. Es wurden dabei keine Änderungen angewendet. Lokale PostgreSQL-Tests ersetzen den noch offenen echten Auth-/Storage-/Edge-Ende-zu-Ende-Test nicht.

## Erforderlich vor Freigabe

Backend bereitstellen, Advisor erneut prüfen, negative Zugriffs- und PIN-Tests mit echten getrennten Konten durchführen. Danach die Liste in `IPHONE_ACCEPTANCE.md` auf dem Zielgerät abarbeiten. Keine Aufgabe zur Produktionsabnahme allein wegen bestandener lokaler Tests abhaken.
