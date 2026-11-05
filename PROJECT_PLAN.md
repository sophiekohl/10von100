# 10von100 – Umsetzungsplan

Stand: 05.11.2026 · Zieltermin Jubiläum: 18.01.2027

## Regeln
- Vorzeitige Offenlegung von Briefen, Titeln, privaten Medien oder Überraschungsdetails ist ein Release-Blocker.
- Admin-Studio und Partnerzugang bleiben getrennt.
- Änderungen auf Feature-Branches mit nachvollziehbaren Pull Requests; keine ungeprüfte Freigabe.
- Eine Aufgabe gilt erst als fertig, wenn sie implementiert **und getestet** wurde.

## P0 – Vor der Veröffentlichung
- [x] Repository und Frontend-Bestand prüfen (19.10.2026 Commits; index.html; Studio).
- [x] Bisherige Frontend-Vereinbarungen dokumentieren (PR #1).
- [x] Sicheres PIN-Zugangskonzept dokumentieren (PR #2).
- [x] Supabase-Wiederherstellung anstoßen (05.11.; Status danach COMING_UP).
- [ ] Supabase ACTIVE_HEALTHY bestätigen; Tabellen, RLS, RPCs, Storage und Edge Functions inventarisieren.
- [ ] Serverseitige 4-stellige Partner-PIN mit Hash, Rate-Limit, Sperre, Sitzungsablauf und Widerruf implementieren.
- [ ] Partner-PIN-Oberfläche und sichere Session-Verwaltung integrieren.
- [ ] Bestehende Freischaltregeln und private Medien gegen unbefugten Zugriff testen.
- [ ] Admin-Studio Ende-zu-Ende prüfen (Überraschungen, Pflichtfelder, Medien, Vorschau, Kalender).
- [ ] iPhone-PWA-Installation und mobile Darstellung testen.
- [ ] Finale Freigabe nach manueller Abnahme.

## P1 – Produkt vollständig machen
- [ ] „Unser Jahr“: Erinnerungen mit Bildern und Text speichern, laden und entfernen.
- [ ] Festlegen, wer Erinnerungen erstellen darf; passende RLS-Regeln.
- [ ] Kalender mit mehrtägigen Bereichen und klaren Freischaltzuständen prüfen.
- [ ] Fortschrittsanzeige und Jahreszeitraum fachlich prüfen; keine irreführende feste Prozentzahl.
- [ ] Leere Zustände, Netzfehler, Offline-Betrieb und abgelaufene Sitzungen verbessern.
- [ ] README und Installationsanleitung an den tatsächlichen Stand anpassen.

## P2 – Nach stabiler Kernversion
- [ ] Push-Benachrichtigungen: Machbarkeit, iPhone-PWA-Voraussetzungen und Einwilligung klären.
- [ ] Barrierefreiheit, Tastaturbedienung und kleinere Bildschirmgrößen testen.
- [ ] Wiederherstellungs- und Wartungsablauf dokumentieren.

## Aktuelle Blocker
- Supabase befand sich bei der letzten Statusabfrage noch im Startzustand COMING_UP.
- PIN-Backend ist nicht implementiert; die bisherige Supabase-Auth darf nicht voreilig entfernt werden.
- Für das Erinnerungsfeature ist die Schreibberechtigung noch nicht festgelegt.

## Nächste konkrete Arbeitsreihenfolge
1. Projektstatus erneut prüfen.
2. Bei aktiver Datenbank read-only Inventar und Sicherheitsprüfung.
3. PIN-Backend implementieren und testen.
4. PIN-Frontend integrieren und auf Spoilerfreiheit prüfen.
5. Studio und Erinnerungen fertigstellen.
