# Frontend-Regressionsprüfung – 10 / 100

Diese Checkliste orientiert sich am Stand des Hauptbranches vom 19.10.2026. Sie ist **kein Nachweis bestandener Tests**.

## Zuletzt implementierte Vereinbarungen (aus Commits)
- Privater Paar-Login mit Passwort, Magic Link und Token-Aktualisierung.
- Spoilerfreie Terminübersicht und sofort sichtbare mehrtägige Kalenderbereiche.
- Briefe und Medien erst nach Freischaltung und authentifiziertem Zugriff.
- Kurzlebige signierte URLs für private Bilder, Audio und Videos.
- Medien nur bei Vorhandensein anzeigen; YouTube, Deezer, Videofortsetzung und Audiosteuerung.
- Studio mit Kalenderverwaltung und Vorschau.

## Manuelle Abnahme vor Veröffentlichung
- [ ] Abgemeldet: keine Brieftexte, Titel oder privaten Medien in UI, Netzwerkantworten oder Cache.
- [ ] Vor Freischaltung: nur neutraler Titel und Termin sichtbar, auch nach Neuladen.
- [ ] Nach Freischaltung: authentifizierter Brief und ausschließlich zugehörige Medien sichtbar.
- [ ] Abgelaufener Token: erneute Anmeldung oder sichere Aktualisierung, niemals offene private Inhalte.
- [ ] Mehrtägige Bereiche: alle Tage markiert, aber ohne Spoiler.
- [ ] Video und Audio: Pause, Wiederaufnahme und Medienwechsel auf iPhone testen.
- [ ] Service Worker: nur statische Assets offline, keine privaten API-Antworten oder Medien.
- [ ] Admin-Studio: Entwürfe, Pflichtfelder, optionale Medien und Kalenderbereiche prüfen.
- [ ] „Unser Jahr“: Speichern und Wiederladen testen – derzeit im Haupt-Frontend nicht implementiert.
- [ ] Fortschrittsanzeige: feste 10%-Anzeige und Datumsspanne fachlich bestätigen.
- [ ] Fehlerzustände: Offline, pausiertes Supabase, ungültige Anmeldung und leere Listen verständlich anzeigen.

## Offene Fragen
Die README ist veraltet und darf nicht als alleinige Quelle für den Funktionsstand gelten. Die Frontend-Umsetzung sollte gegen die aktuellsten expliziten Produktabsprachen abgenommen werden. In diesem Repository sind derzeit keine Issues oder Pull Requests als weitere Spezifikation hinterlegt.
