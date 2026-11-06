# Browser-Abnahmeversion

Quelle: feature/complete-private-app, 8c79ff958f61ada0ccedfd05f941418da906254f.
Vorbereitung für echte PIN-/Auth-/Storage-Tests, keine finale Produktfreigabe.
Die normalen App- und Studio-Adressen bleiben erhalten. Vom bestehenden angemeldeten Studio führt ein Link im selben Tab in die Abnahmeversion; dadurch bleibt die bestehende Admin-Sitzung verfügbar. Magic-Link-Anmeldungen kehren zur ursprünglichen Studio-Adresse zurück; von dort erneut den Testlink öffnen.

Die Vorschau nutzt dieselbe geschützte Supabase-Datenbank. Änderungen werden gespeichert. Keine privaten Fotos für die Erstabnahme verwenden. Die PIN ausschließlich im Studio eingeben. Es werden weder Service Worker noch PWA-Manifest für die Vorschau registriert. Die installierte PWA wird erst mit dem geprüften Hauptrelease auf einem echten iPhone abgenommen.

Quellprüfung: 21 Node-Tests, Datenbankprüfung und 16 Browserprüfungen (Chromium und WebKit) erfolgreich: https://github.com/sophiekohl/10von100/actions/runs/42105136306 . Der eigene Vorschau-Workflow prüft zusätzlich genau diese ausgelieferten HTML-/JS-Dateien mit der Testsuite des unveränderlichen Quellcommits.

Nach erfolgreicher Abnahme und Hauptrelease kann dieser temporäre Ordner entfernt werden. Keine PIN-/Auth-/Storage-Ende-zu-Ende-Abnahme allein durch Browser-Fixtures behaupten.
