# 10von100 – Umsetzungsplan

Stand: 05.11.2026 · Jubiläum: **18.01.2027**

## Regeln

- Keine privaten Titel, Briefe oder Medien vor Freischaltung; Entwürfe bleiben privat.
- Partner und Admin bleiben getrennt. Keine Secrets im öffentlichen Repository.
- Implementierung und bestandene Tests getrennt von Bereitstellung und Geräteabnahme führen.
- Änderungen über Branch und Pull Request; kein ungeprüftes Produktionsrelease.

## 1. Bestand und Backend prüfen

- [x] Supabase `estgcmkrlcrwwcrphvsy`: `ACTIVE_HEALTHY` bestätigt, Health-Advisor ohne Befund.
- [x] Tabellen, Policies, RPCs, drei private Storage-Buckets und Edge Functions inventarisiert.
- [x] Bestehende Adminidentität und Paarzuordnung vorhanden; keine Identitäten geändert.
- [x] Vereinbarungen aus PR #1, PIN-Konzept aus PR #2 und Roadmap aus PR #3 gelesen.
- [x] Zu breite RLS-Regeln und fehlende reguläre Tabellenrechte inventarisiert; gehärtete Paar-/Admin-Policies und explizite DML-Grants bereitgestellt. Unnötige TRUNCATE-Rechte entfernt.

## 2. Implementiert und lokal geprüft

- [x] PIN-Backend als Quellcode: bcrypt-Kostenfaktor 12, global fünf Fehlversuche/15 Minuten Pause, kumulativ 20 Fehlversuche bis Admin-Reset, IP-Fingerabdruck-Limit, eigene Partneridentität ohne Adminrechte.
- [x] Serverseitig registrierte, nach 90 Tagen ablaufende Partner-Sitzungen; sofortiger Widerruf bei PIN-Wechsel/Sperre; Schutz gegen Rotation während einer Anmeldung.
- [x] Partner-PIN-Oberfläche, persistente Standardsitzung, zusammengeführter Token-Refresh, Logout und Entfernen privater DOM-Inhalte.
- [x] RLS-/Storage-Härtung lokal auf Schema-Abbild geprüft: Fremdkonto, Paar, zukünftige Beiträge, Entwürfe, Medien, Sperren, Ablauf und Widerruf.
- [x] Studio: private Entwürfe, Bearbeiten/Löschen, Medienreihenfolge/-verwaltung, Vorschau, explizite Veröffentlichung erst nach erfolgreichen Uploads; Fehlerszenario lokal geprüft.
- [x] „Unser Jahr“: Erstellen, Laden, Text bearbeiten, Entfernen; Partner und Admin haben passende Verwaltungsabläufe. Beide dürfen Erinnerungen erstellen, nur Autor/Admin verändern bestehende Einträge.
- [x] Berliner Termininterpretation auch bei anderer Gerätezeitzone, einschließlich Sommerzeit und ungültiger Uhrzeit bei Zeitumstellung geprüft.
- [x] „10 %“ als zehn von 100 gemeinsamen Jahren erklärt; unbestätigte App-Jahresspanne entfernt.
- [x] PNG-PWA-Icons, expliziter Manifest-Scope, statische Offline-Hülle und Test der Cache-Abgrenzung ergänzt.
- [x] README, Sicherheits-/Betriebsanleitung und iPhone-Abnahmeliste aktualisiert.

## 3. Backend bereitgestellt und live geprüft

- [x] Migrationen `private_app_security` und `explicit_app_grants` angewendet.
- [x] Edge Function `partner-pin` Version 1 aktiv; eigene PIN inzwischen privat gesetzt und Anmeldung bestätigt.
- [x] Live-Negativtests: private REST-Daten und interne PIN-RPCs verweigern anonymen Zugriff; öffentliche neutrale Termine erreichbar; fremder Origin abgewiesen. PIN-Login/Verwaltung ohne gültige Anmeldung liefern keinen Token.
- [x] Rechteprüfung: kein anonymes SELECT/TRUNCATE auf Inhalten, kein TRUNCATE auf Adminregister für authenticated; browserseitige PIN-Konfiguration verboten; bestehende Authidentität unverändert. Health-Advisor ohne Befund.
- [x] Signierte Medien-URLs behalten den erforderlichen `/storage/v1`-Präfix; Regressionstest ergänzt.

- [x] GitHub Actions auf Ubuntu 24.04: 20 Handler-/Sitzungs-/DOM-/Cache-Tests, Datenbankprüfung und alle sechs Playwright-Tests mit iPhone-15-Pro-Viewport bestanden. Lauf: https://github.com/sophiekohl/10von100/actions/runs/42102283255 . Die lokale Work-Laufzeit startet Chromium nicht; der Browsernachweis stammt aus CI.

- [x] Manueller Live-Test durch Sophie: Adminanmeldung und Speichern einer Überraschung erfolgreich. Testdatensatz anschließend gezielt entfernt; Abfrage bestätigt null verbleibende Datensätze für die Test-ID. Dieser Nachweis betrifft das bestehende veröffentlichte Studio, nicht die neue PIN-Oberfläche.

- [x] Weitere Prüfung: 21 Node-Tests, Datenbanksuite und 16 Browserprüfungen (je acht in Chromium und WebKit) erfolgreich: https://github.com/sophiekohl/10von100/actions/runs/42105136306 . Studio-Bearbeiten/Löschen, 320-/393-Pixel-Layouts und verspätete Ladeantwort nach Logout zusätzlich geprüft.
- [x] iPhone-Studio: Datum/Uhrzeit auf kleinen Displays untereinander, Eingaben ohne horizontalen Überlauf. Verspätetes Laden nach Abmeldung füllt keine privaten Formularfelder mehr.
- [x] Browser-Abnahmeversion aus PR #5 nach bestandenen 21 Node- und 16 Chromium-/WebKit-Prüfungen zusammengeführt. Öffentliche Studio-Vorschau erfolgreich per HTTPS abgerufen: Testversionshinweis, PIN-Bedienung und Core-Script vorhanden. PR: https://github.com/sophiekohl/10von100/pull/5 . Keine finale Freigabe; nutzt die echte Datenbank. Zugang aus dem bestehenden Studio im selben Tab.

## 4. Noch offen – finale Freigabe

- [ ] Erfolgreiche PIN-Anmeldung und Session-Erneuerung mit echtem Partnerkonto sowie reale Storage-Uploads/-Wiedergabe Ende-zu-Ende prüfen. Backend-Bereitstellung und negative Live-Zugriffstests sind bereits erfolgt.
- [x] Eigene Partner-PIN privat gesetzt; echte Anmeldung und Wiederöffnen durch Sophie bestätigt.
- [ ] Reale Freischaltung, signierte Medien-URLs, Uploads und Auth-Refresh mit getrenntem Partner- und Admin-Konto Ende-zu-Ende prüfen.
- [ ] Installierte Safari-PWA auf iPhone 15 Pro mit iOS 27.2 prüfen: Neustart, Hintergrund/Refresh, Tastatur, Offline, HEIC, Audio-/Video-Wiedergabe, Medienwechsel und externe Player.
- [ ] Finale Freigabe nach bestandener Sicherheits- und Geräteabnahme.

## Nachweise und Grenzen

`npm test`: automatisierte Handler-, Session-, DOM- und Service-Worker-Tests. `npm run test:db`: echte Upgrade-Migration und RLS-/PIN-Assertions im lokalen PostgreSQL-WASM. Schema-Abbild enthält keine Nutzerdaten; Auth/Storage sind reduzierte Testmodelle. Tests mit echten Diensten und physischem iPhone bleiben erforderlich. Prüfdetails: `docs/TEST_REPORT.md`.

Die bestehende Adminidentität wurde nach Bereitstellung per Rollenprüfung bestätigt. bcrypt/12 wurde zusätzlich live mit künstlichem Eingabewert geprüft. Die lokalen Migrationsdateien wurden mit den tatsächlich angewendeten Supabase-Versionen abgeglichen.

Supabase meldete deaktivierten Schutz gegen geleakte Passwörter; Admin-Auth-Einstellung vor Freigabe im Dashboard prüfen. SECURITY-DEFINER-Funktionen werden nach ihren tatsächlichen Zugriffskontrollen bewertet, nicht pauschal freigegeben.

## Später

- [ ] Push auf iPhone nach gesonderter Machbarkeits-/Einwilligungsentscheidung.
- [ ] Weitere Barrierefreiheits- und Wiederherstellungstests.

## Manuelle Abnahme am 06.11.2026

- [x] Eigene PIN im Studio gesetzt; echte Partneranmeldung erfolgreich. Sitzung nach Schließen/Wiederöffnen erhalten.
- [x] Unser Jahr auf Sophies iPhone: Text und Foto speichern, nach Wiederöffnen anzeigen, Text ändern und erneut laden sowie Eintrag löschen und Abwesenheit nach Wiederöffnen bestätigt.
- [x] Gewünschte Bedienung implementiert: Stift direkt am Text, Papierkorb unten rechts, 44-Pixel-Tippflächen und Löschrückfrage. Veröffentlichung der Vorschau über PR #6 nach bestandenen Prüfungen.
- [ ] Überraschungsfreischaltung und private Medien vollständig Ende-zu-Ende prüfen; installierte PWA auf dem Zielgerät weiterhin offen.

## Erweiterung: gemeinsames App-Jahr

Vom Nutzer bestätigt: Geschenk am 09.12.2026, Überraschungen bis einschließlich 31.12.2027 (388 Tage). Countdown vor Beginn, Tageszähler im Zeitraum und Abschlussanzeige danach implementiert. Unser Jahr erhält eine abrufbare Collagenansicht aller zugänglichen Erinnerungsfotos. Keine Überraschungsmedien; keine Bildkopien im Repository. Bereitstellung und Browserprüfung über PR #7; manuelle Collagenabnahme bleibt offen.

## Home und Anmeldung – UX-Korrektur

Auf Wunsch vom 06.11.2026: Hochzeitsbild deutlich kleiner, kein Text direkt unter dem Bild, Home mit Zähler/Kalender möglichst ohne Scrollen auf iPhone. Bei vergrößerter Schrift bleibt natürliches Scrollen möglich. PIN-Einstieg auch direkt in Unser Jahr, gemeinsame Sitzung mit Für dich. Umsetzung und mobile Layout-/Anmeldetests in PR #9; manuelle iPhone-Abnahme nach Bereitstellung offen.

## Freigegebener Gesamtentwurf – umgesetzt

- [x] Vollständiger Willkommensbrief mit Hochzeitsfoto → eine PIN vor der App → alle Bereiche gemeinsam erreichbar. Brief später unter Info; dort auch Abmelden.
- [x] Kompakte Home-Seite mit Hochkantfoto neben Gruß/Zähler; verfügbare Überraschung direkt öffnen.
- [x] Neue mobile Browserprüfungen: 8 Abläufe jeweils Chromium/WebKit bestanden; Handler-/Sitzungs-/Cache-Tests erfolgreich. Nachweis: https://github.com/sophiekohl/10von100/actions/runs/42238067504 . Alte DOM-/Browserannahmen zur Anmeldung pro Bereich durch neue Browserprüfung ersetzt.
- [x] PR #10 nach bestandener Prüfung für die Testversion zusammengeführt; PR #9 dadurch ersetzt und geschlossen.
- [ ] Neue Willkommens-/PIN-Ansicht auf dem echten iPhone sowie installierte PWA und private Freischalt-/Medienabläufe final abnehmen.

## Visuelle Korrektur nach iPhone-Rückmeldung

- [x] Helle Altfarben auf cremefarbenem Willkommensbildschirm entfernt: Brief dunkel, Hervorhebungen Bordeaux. Kontrastprüfung mindestens 4,5:1 für Absatz-/Fettschrift bestanden.
- [x] Alten 80-Pixel-Kopfabstand und übergroße Marke korrigiert. Home nutzt die Höhe ausgewogen mit größerer Hochkantaufnahme.
- [x] Einheitliche Editorial-Gestaltung für Für dich, Unser Jahr, PIN und Navigation. Collage nur bei vorhandenen Erinnerungsfotos; Bereichswechsel beginnt oben.
- [x] Automatisierte Regression und 18 mobile Chromium-/WebKit-Prüfungen erfolgreich: https://github.com/sophiekohl/10von100/actions/runs/42240108206 . Gerenderte Ansichten als CI-Artefakte, Willkommensbrief/Home/Überraschungen/Unser Jahr visuell kontrolliert.
- [x] PR #11 für Testversion nach Prüfungen zusammengeführt. Manuelle Abnahme auf Sophies iPhone weiterhin erforderlich; keine finale PWA-Freigabe daraus ableiten.

## Studio-Passwort und Wiederherstellung

- [x] Passwort-Einrichtung/Änderung nach überprüfter Adminanmeldung ergänzt: Bestätigung, mindestens zwölf Zeichen, New-Password-Autofill, keine Passwortablage im Storage, Felder nach Anfrage geleert.
- [x] Recovery-Link im erlaubten Root-Studio führt zur Passwort-Einrichtung. Root-Callback und Vorschau verwenden denselben Ablauf; URL-Tokens werden entfernt.
- [x] Mailanfragen gegen Doppelklick geschützt; Erfolg 60 Sekunden Sendepause, bei 429 lokale 15-Minuten-Pause mit verständlichem Hinweis. Keine behauptete Aufhebung des Anbieterlimits.
- [x] Unitprüfungen und 24 Chromium-/WebKit-Browserprüfungen erfolgreich: https://github.com/sophiekohl/10von100/actions/runs/42251843856 . PR #12 zusammengeführt.
- [x] Sophie hat über den neuen E-Mail-Ablauf privat ein eigenes Studio-Passwort gesetzt und nach Abmelden eine erfolgreiche echte Passwortanmeldung bestätigt.
- [ ] Speicherung im privaten Passwortmanager durch Sophie sicherstellen; Anbieterlimit für Login-/Recovery-Mails bleibt bestehen.
- [ ] Für dauerhafte verlässliche Login-/Recovery-Mails SMTP-/E-Mail-Anbieter einrichten, sofern die Mailfunktion produktiv benötigt wird. Zugangsdaten ausschließlich beim Anbieter/Supabase hinterlegen; keine Secrets im Repository.

## Manuelle Überraschungsprüfung am 06.11.2026

- [x] Privater Entwurf „TEST – Überraschung“ bleibt in Partner-App und Kalender unsichtbar.
- [x] Veröffentlichung mit Termin 18.01.2030 und Kalenderhäkchen: verschlossene Karte und neutrale Kalendermarkierung sichtbar, Titel und Text weiterhin verborgen (Sophie bestätigt).
- [x] Änderung auf vergangenen Termin mit expliziter Freigabe: Titel und Text in der Partner-App erfolgreich gelesen (Sophie bestätigt).
- [ ] Privaten Foto-/Video-/Audiozugriff und Wiedergabe vor/nach Freischaltung auf echtem iPhone prüfen. Der reine Textablauf ersetzt diesen Medientest nicht.
- [ ] Den eindeutig benannten Testbeitrag nach Abschluss der Medienprüfung entfernen.
