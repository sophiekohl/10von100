# Freigegebener Geschenk-Ablauf

Persönlicher vollständiger Brief mit Hochzeitsfoto → Unser Jahr beginnen → eine PIN vor der gesamten App → kompakte Home-Seite mit kleinem Hochkantfoto neben dem Gruß. Alle Appbereiche verwenden dieselbe registrierte Sitzung. Bei Wiederaufnahme wird die Mitgliedschaft serverseitig geprüft. Ein Widerruf/Logout schließt die Appoberfläche und entfernt private Inhalte. Kalender/Freischaltung bleiben serverseitig geschützt; künftige private Inhalte werden nicht durch die Anmeldung freigeschaltet. Admin-Studio bleibt separat.

Die Darstellung entspricht dem vom Nutzer bestätigten Mock-up. Der Brief darf scrollen; Home wird bei normalen Schriftgrößen für iPhone-Ansichten ohne Scrollen geprüft. Die öffentliche Ansicht zeigt nur Willkommensbrief und ausdrücklich öffentlich freigegebenes Hochzeitsfoto. „Info“ öffnet später den Brief erneut und enthält Abmelden. Keine weitere PIN pro Tab.

Prüfungen: tests/unified-gate.spec.mjs mit Chromium und WebKit; bestehende Handler-, Sitzungs- und Cache-Prüfungen. Alte Tests mit Anmeldung pro Bereich sind für diesen Ablauf veraltet. Die installierte PWA und echte private Medienfreischaltung bleiben eigenständige Abnahmepunkte.
