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

## Manuelle private Fotoprüfung

- [x] Sophie hat dem Testbeitrag ein unverfängliches Foto hinzugefügt und die Veröffentlichung auf einen zukünftigen Termin gesetzt: Karte verschlossen, Foto sowie Titel/Text nicht sichtbar.
- [x] Nach expliziter Freischaltung durch vergangenen Termin zeigt die Partner-App Foto, Titel und Text korrekt an (Sophie bestätigt).
- [ ] Video/Audio-Wiedergabe sowie final installierte PWA weiter prüfen. Foto-Nachweis ist kein Nachweis für diese Medientypen.

## Manuelle iPhone-Videoprüfung

- [x] Kurzes iPhone-Video zum Testbeitrag hinzugefügt, gespeichert, freigeschaltet und in der Partner-App angezeigt.
- [x] Wiedergabe mit Ton sowie Pause/Fortsetzen durch Sophie ausdrücklich bestätigt.
- [ ] Eigenständige Audiodatei, Video-Vollbild/Hintergrund, Medienwechsel und installierte PWA weiterhin separat prüfen; keine weitergehende Freigabe allein aus diesem Nachweis.

## Manuelle iPhone-Audioprüfung

- [x] Eigenständige Audiodatei im Testbeitrag gespeichert, freigeschaltet und in der Partner-App abgespielt. Ton, Pause und Fortsetzen durch Sophie bestätigt.
- [ ] Medienwechsel sowie Stoppen beim Schließen/Abmelden, Hintergrund-/Vollbildverhalten und installierte PWA separat prüfen.

## Medienwechsel und Deezer

- [x] Sophie bestätigt: Start des Videos pausiert die Audioaufnahme; Schließen der Karte beendet die Wiedergabe.
- [ ] Deezer von Sophie als nicht funktionierend gemeldet. Inventur: bisher keine gespeicherte Deezer-Medienzeile. Studio akzeptiert derzeit nur direkte numerische Track-/Album-/Playlist-Adressen und verwirft Kurzlinks. Exakten verwendeten Link/Fehler prüfen, bevor Ursache und Korrektur als bestätigt gelten.

## Manuelle Deezer-Prüfung

- [x] Ursache des Hinzufügefehlers eingegrenzt: Deezer-App-Kurzlink wird vom Studio nicht unterstützt. Vollständige numerische Track-Adresse zum Test verwendet; kein privater Songtitel/Link im Repository hinterlegt.
- [x] Sophie bestätigt Hinzufügen, Playeranzeige und hörbare Deezer-Wiedergabe in der Partner-App auf dem iPhone.
- [ ] Automatische Kurzlinkauflösung weiterhin nicht implementiert. Bis dahin vollständige Track-/Album-/Playlist-Adressen verwenden; keine allgemeine Kurzlink-Unterstützung als fertig markieren.

## Korrektur Moment hinzufügen

- [x] Formular blieb nach Verschieben der Schaltfläche hinter der Erinnerungsliste. Formular und Status sind jetzt unmittelbar unter der Schaltfläche; Öffnen scrollt/fokussiert den Formularbereich mit Abstand zur Bildschirmkante.
- [x] Eingaben bleiben beim Zu-/Aufklappen erhalten; Speichern schließt das Formular und stellt den Schaltflächenzustand zurück. Logout bereinigt den Zustand.
- [x] 26 mobile Browserprüfungen in Chromium/WebKit bestanden, einschließlich 20 bestehender Erinnerungen, sichtbarer Formularposition und erfolgreichem Speichern: https://github.com/sophiekohl/10von100/actions/runs/42267759839 . PR #13 nach Prüfung zusammengeführt.
- [ ] Korrigiertes Hinzufügen und anschließender JPG-Collagenexport auf Sophies iPhone erneut bestätigen.

## Collagenrückmeldung und Mediengestaltung

- [x] Sophie bestätigt erfolgreichen Collagenablauf nach Wiederfinden des Moment-Formulars. Gesonderte breite Prüfung vieler Bilder/Formatmischungen bleibt sinnvoll.
- [x] Überraschungsmedien erhalten feinen cremefarbenen Rahmen und dezenten Schatten. Scrollhinweis erscheint nur bei verbleibendem Inhalt unterhalb der aktuellen Position; bei kurzem Inhalt und am Ende verborgen.
- [x] 28 mobile Chromium-/WebKit-Prüfungen erfolgreich: https://github.com/sophiekohl/10von100/actions/runs/42278276300 . PR #14 nach Prüfung zusammengeführt; Auslieferung durch GitHub Pages gesondert kontrollieren.

## Manuelle Mediengestaltung-Abnahme

- [x] GitHub-Pages-Veröffentlichung für PR #14 erfolgreich, ausgelieferter Rahmen und Scrollhinweis per HTTPS verifiziert.
- [x] Sophie bestätigt anschließend die funktionierende Mediengestaltung auf ihrem iPhone.
- [ ] Harmlosen Testbeitrag einschließlich Medien nach Tests entfernen; finale installierte PWA und Betrieb bleiben offen.

## Studio-Testbereinigung

- [x] Fehlende Bearbeiten-/Löschen-Schaltflächen lagen in einer älteren Studio-Ansicht. Aktuelle Root- und Vorschau-Dateien enthalten beide Funktionen; neue URL bereitgestellt.
- [x] Sophie bestätigt danach, dass keine Testeinträge mehr im Studio vorhanden sind und die Löschung funktioniert hat.
- [x] Sophie bestätigt nach erneutem Öffnen: gelöschte Testkarten sind auch in der Partner-App verschwunden. Testbereinigung manuell bestätigt; keine zusätzliche Löschung privater Inhalte durch den Assistenten vorgenommen.

## Installierbare Hauptversion – Abnahmekandidat

- [x] Hauptbranch und freigegebenen Kandidaten zusammengeführt; aktuelle Vorschau, Studio-Passwort-/Recovery-Flow, Mediengestaltung und Formular-Korrektur übernommen.
- [x] Service Worker v6: öffentliche Hülle und ausdrücklich freigegebenes Hochzeitsbild; kein Cache für API, Studio, private Dateien oder Token-URLs. Offlinehinweis und geschlossener Privatbereich; Sitzung zur Online-Wiederaufnahme erhalten.
- [x] Platzhalter-PNGs durch aus bestehender icon-v3.svg gerenderte Bordeaux-/Creme-App-Icons (192/512) ersetzt.
- [x] Cleanup-Migration mit tatsächlicher bereits angewendeter Historienversion 20261106084835 nachgetragen; keine erneute Datenbankänderung.
- [x] Codeprüfung: 11 Unit-Tests, Datenbankprüfung und 30 Browserfälle erfolgreich: https://github.com/sophiekohl/10von100/actions/runs/42282871003 . Vorschauprüfung ebenfalls erfolgreich. WebKit prüft Controller/Cache/Offline-UI; Offline-Neuladen ist wegen Playwright#42775/#34402 nur in Chromium automatisiert bestanden. Physisches iPhone-Neuladen bleibt offen.
- [x] Installierbare Hauptversion nach finalem Icon-/Release-Prüflauf über PR #4 bereitgestellt. Finaler Head 6dce5483995632704aae9e933af923cb07ebafd2: beide Prüfläufe erfolgreich, 30 Browserfälle plus Unit-/Datenbanksuite. Deployment 42283632007 erfolgreich. Hauptadresse liefert PIN-Gate, Manifest, PNG-Icons und Service Worker v6 inklusive öffentlichem Hochzeitsbild per HTTPS aus.
- [ ] Auf Sophies iPhone installieren: Home-Bildschirm, einmalige PIN, Schließen/Wiederöffnen, Neustart, Offline-/Online-Wiederaufnahme prüfen. Zielgerät des Mannes bleibt separat zu berücksichtigen; keine Prüfung auf seinem Gerät vorgeben oder vorzeitige Überraschung veranlassen.
- [ ] Endgültige Betriebs-/Backup-/Mailkonfiguration, Push-Entscheidung und verbleibende Sicherheits-/Langzeitabnahme abschließen.

## Physische PWA-Erstprüfung

- [x] Sophie bestätigt Hinzufügen zum Home-Bildschirm, Öffnen der installierten Hauptversion und erfolgreiche PIN-Anmeldung auf ihrem iPhone.
- [ ] Neustart, Offline-/Online-Wiederaufnahme und längerer Hintergrundbetrieb weiter prüfen; Erstinstallation bestätigt nicht automatisch diese Fälle.
- [x] Zehn Logoentwürfe erstellt; Sophie hat die Kombination aus 07 und 03 freigegeben.
- [x] App-Icons und Browser-Icon vorbereitet, kleine Darstellung visuell geprüft; PR #15.
- [x] PR #15 nach beiden erfolgreichen CI-Läufen zusammengeführt; Pages-Veröffentlichung 42294885045 erfolgreich.
- [x] Neues Symbol auf Sophies iPhone in den realen Mitteilungen sichtbar bestätigt.
- [x] Neutrale Push-Mitteilungen umgesetzt; echter Empfang, geplanter Versand und Antippen bestätigt.

## Push-Mitteilungen · PR #16
- [x] Freiwillige Mitteilungen aktivieren/ausschalten, Testversand und Studio-Auswahl implementiert.
- [x] Private Subscription-/Zustellverwaltung, geschützter Cron und Vault-Schlüssel eingerichtet; authentifizierter Live-Dispatcher mit null Empfängern erfolgreich.
- [x] 17 Node-Tests und lokale bestehende sowie neue Datenbank-/PIN-/Queue-Sicherheitstests bestanden; Verschlüsselung mit synthetischen Schlüsseln geprüft.
- [x] 34 Browserfälle (Chromium/WebKit) sowie 17 Node-Tests und Datenbank-Sicherheitstests bestanden; geprüfte App-/Serverdateien identisch zum freigegebenen Stand.
- [x] PR #16 zusammengeführt (8ee3d81), Pages-Lauf 42300201761 erfolgreich. Zusätzliche Wiederholungsläufe nach Anpassung der Ubuntu-Paketquellen noch beobachten.
- [ ] iPhone-Abnahme durchführen; Push bleibt bis zu echtem Empfang und geplantem Versand offen.
- [ ] Echte iPhone-Einwilligung, Empfang bei geschlossener App, Antippen und geplante Freischaltung testen. Push ist bis zu dieser Abnahme nicht fertig.

## Push-Einwilligung auf der PIN-Seite · PR #17
- [x] Freiwillige Einwilligung ganz unten auf der PIN-Seite ergänzt; Geräteregistrierung bleibt an erfolgreiche Anmeldung gebunden.
- [x] 20 lokale Node-/DOM-Tests bestanden; zusätzliche Browserprüfung für falsche und richtige PIN ergänzt.
- [x] 21 Node-/DOM-Tests, Datenbankprüfungen und Chromium/WebKit-Browserfälle bestanden (42355707280); Vorschau ebenfalls erfolgreich.
- [x] PR #17 zusammengeführt; Pages-Lauf 42355854417 erfolgreich.
- [ ] Physischer iPhone-Empfang und geplanter Versand weiterhin offen.

## PIN und Push ohne Scrollen · PR #18
- [x] Ziffern auf 20 px verkleinert, Abstände und Hinweistext gestrafft; 44-px-Tastenziele erhalten.
- [x] 21 lokale Tests bestanden.
- [x] Chromium/WebKit bestätigen sichtbaren Push-Button ohne Scrollen bei 393×740 und 393×852 sowie mindestens 44 px hohe PIN-Tasten (42356277755).
- [x] PR #18 zusammengeführt; Pages-Lauf 42356399458 erfolgreich. Physische iPhone-Push-Abnahme bleibt offen.

## Zuerst Push, darunter PIN · PR #19
- [x] Push-Auswahl über der PIN; passende Erlauben-/Überspringen-/Ladezustände und Fokuswechsel ergänzt.
- [x] 22 lokale Tests bestanden; Browserfälle für Reihenfolge, Höhe und beide Auswahlwege ergänzt.
- [x] Chromium/WebKit bestätigen beide Auswahlwege, Fokuswechsel, Reihenfolge und Sichtbarkeit bei 393×740/852; beide CI-Läufe erfolgreich (42357011465/42357011471).
- [x] PR #19 zusammengeführt, Pages-Lauf 42357155781 erfolgreich. Empfang auf dem echten iPhone bleibt offene Abnahme.

## Physischer Push-Test · 07.11.2026
- [x] Sophie bestätigt tatsächlichen Empfang der Testnachricht auf ihrem iPhone; Screenshot zeigt den neutralen Hinweis und das neue App-Symbol bei geöffneter App.
- [x] Automatische Mitteilung bei geschlossener App von Sophie bestätigt.
- [x] Sophie bestätigt korrektes Öffnen des freigegebenen Beitrags beim Antippen der Mitteilung.
- [ ] Ausschalten/Abmeldung sowie erneute Aktivierung am Gerät prüfen. Push noch nicht vollständig abgenommen.

## Push-Abnahme und Kopfzeile · 07.11.2026
- [x] Sophie bestätigt automatische Nachricht bei geschlossener App und korrektes Öffnen des freigegebenen Beitrags beim Antippen.
- [x] PR #20: eigenen Benachrichtigungstitel entfernt; Nachricht mit Herz bleibt. Beide automatischen Prüfläufe bestanden.
- [ ] Echte iOS-Darstellung ohne eigenen Titel prüfen; OS-Kopfzeile kann weiterhin erscheinen.

## Push-Kopfzeile · zweiter iPhone-Test
- [x] Sophie bestätigt: leerer Titel reduziert die Doppelung auf ihrem iPhone nicht; Umbenennung zu 💛 betrifft beide Kopfzeilen.
- [x] PR #21 verwendet den neutralen Nachrichtentext mit Herz als Titel, ohne separate Body-Zeile. Beide CI-Läufe erfolgreich (42359688588/42359688600).
- [x] Sophie bestätigt erfolgreiche kompakte Darstellung auf ihrem iPhone: neutraler Nachrichtentext mit Herz als Titel, keine zusätzliche Body-Zeile; iOS-Attribution bleibt.

## Aktueller Abschlussbedarf · 07.11.2026
Verbindlicher aktueller Stand; ältere Abschnitte dokumentieren die damaligen Zwischenstände.
- [x] Installation, PIN-Anmeldung, Medien-/Erinnerungs-Grundabläufe und Collagen-Grundablauf von Sophie bestätigt.
- [x] Push: tatsächlicher Empfang, automatische Freischaltung bei geschlossener App, korrektes Antippen und kompakte Darstellung bestätigt.
- [ ] Physische Stabilitätsabnahme: iPhone-Neustart, Flugmodus/Online-Rückkehr, Hintergrundbetrieb und Push-Ausschalten/erneut Aktivieren.
- [ ] Collagen mit vielen Fotos und gemischten Formaten auf dem iPhone prüfen; sinnvolle Exportgrenzen dokumentieren.
- [ ] Dauerbetrieb von Supabase, Backup samt Wiederherstellung und verlässliche Admin-Mail-/Recovery-Konfiguration abschließen.
- [ ] Abschließende Rechte-/Freischaltungs-/Medienprüfung, aktuelle Testinhalte bereinigen, Betriebs- und Übergabedokumentation finalisieren.
- [ ] Optionaler Komfort: automatische Deezer-Kurzlinkauflösung; direkte Links funktionieren bereits.

## Deezer-Kurzlinks und YouTube · PR #22
- [x] Admin-geschützte Kurzlinkauflösung implementiert, Redirect-/Host-/HTTPS-/Zeit-/Größenlimits getestet; Live-Endpunkt weist nicht angemeldete Aufrufe zurück.
- [x] Vier neue Unitfälle sowie mobile Studio-Auflösung/Fehlererhalt und übrige Regression erfolgreich (42360932416, Vorschau 42360932398). PR #22 zusammengeführt.
- [ ] Tatsächlichen Deezer-App-Kurzlink auf Sophies iPhone auflösen und abspielen; lokale Live-Probe erreichte ihr Zeitlimit, daher noch keine allgemeine Funktionsabnahme behaupten.
- [x] Sophie bestätigt YouTube-Hinzufügen, Speichern, Freischalten und Wiedergabe mit Bild und Ton in der iPhone-App.
- [ ] Danach Flugmodus/Online-Rückkehr, Neustart und übrige Betriebs-/Backup-Abnahme fortsetzen.

## Deezer-Kurzlink – iPhone-Rückmeldung
- [x] Sophie bestätigt: Kurzlink erscheint als Deezer-Eintrag, wurde gespeichert und anschließend in der Partner-App angezeigt.
- [ ] Hörbare Wiedergabe genau dieses Kurzlink-Eintrags noch nicht ausdrücklich bestätigt; frühere direkte Deezer-Wiedergabe bereits bestätigt.
- [x] Geführter YouTube-Test vollständig von Sophie bestätigt: hinzugefügt, gespeichert, freigeschaltet, Bild und Ton funktionieren.

## Nächste physische Stabilitätsprüfung
- [ ] Flugmodus mit ausgeschaltetem WLAN: geschlossene App neu öffnen, verständlichen Offlinehinweis und gesperrten Privatbereich prüfen; anschließend Online-Rückkehr und Sitzung wiederherstellen.

## Physischer Offline-/Online-Test
- [x] Sophie bestätigt: öffentliche Startseite offline vorhanden; private Inhalte werden nicht freigeschaltet. Nach Rückkehr ins Internet ist der Zugang wieder möglich.
- [x] PR #23 verbessert sichtbare PIN-Rückmeldung, Netzwerk-Zeitlimit und Offline-Push-Hinweis. Beide CI-Läufe (42362184867/42362184811) mit Offline-/Online- und Netzfehlerfällen bestanden; zusammengeführt.
- [ ] Verbesserte Offline-Meldung auf echtem iPhone bei Gelegenheit bestätigen.
- [ ] iPhone-Neustart und Push-Ausschalten/erneut Aktivieren weiterhin offen.

## iPhone-Neustart bestätigt
- [x] Sophie bestätigt nach dem angeleiteten vollständigen iPhone-Neustart weiterhin funktionierenden App-Zugang.
- [ ] Push-Ausschalten und erneutes Aktivieren samt Testempfang prüfen.
- [ ] Verbesserte Offline-Rückmeldung auf dem Gerät, große Collagen sowie Betrieb/Backup/Recovery und finale Bereinigung bleiben offen.

## Push-Schalter am iPhone bestätigt
- [x] Sophie bestätigt Ausschalten mit angezeigter Bestätigung, erneutes Aktivieren und erfolgreichen Empfang der folgenden Testnachricht.
- [x] Damit sind Einwilligung, Empfang, geplanter Versand bei geschlossener App, Antippen, Darstellung und Ein-/Ausschalten auf Sophies iPhone praktisch bestätigt.
- [ ] Großformatiger Collagenexport mit vielen unterschiedlichen Fotos, Betriebs-/Backup-/Recovery-Abnahme und finale Testbereinigung bleiben offen; keine Gesamtfertigmeldung.

## JPG-Collage auf dem iPhone bestätigt
- [x] Sophie bestätigt den geführten JPG-Export und das Öffnen des gespeicherten Bildes; auf die Prüfung von Schärfe und Anordnung positive Rückmeldung.
- [ ] Anzahl/Formatmischung der hierbei verwendeten Fotos nicht bekannt; daraus keine Belastungsabnahme für sehr viele Bilder ableiten.
- [ ] Technischer Abschluss: Dauerbetrieb, Backup und Wiederherstellung, verlässliche Admin-Recovery, abschließende Rechte-/Medienprüfung, Dokumentation und gezielte Testbereinigung.

## Offener Bildfehler beim Mehrfoto-Test
- [ ] Sophie meldet ein Moment-Foto, das fast vollständig leer und nur rechts als schmaler Streifen erscheint. Screenshot allein klärt Bilddatei gegenüber iPhone-Darstellung nicht; Originaldatei für gezielte Reproduktion erforderlich. Mehrfoto-Abnahme bleibt offen.

## Mehrfoto-Darstellung · PR #24
- [x] Bereitgestelltes privates Original lokal geprüft: JPEG 3840×2160, EXIF-Rotation 6, fehlerfrei dekodierbar. Kein Originalbild ins öffentliche Repository übernommen.
- [x] Begrenzte Bildflächen ohne Beschneiden und transformationsfreie fixierte Navigation umgesetzt; beide CI-Läufe einschließlich 30-Foto-/Scroll-Regression erfolgreich (42363304816/42363304938). PR #24 zusammengeführt.
- [ ] Physisch prüfen, ob der konkrete iPhone-Zeichenfehler und das Hochrutschen der Navigation behoben sind.
- [ ] Konkreten iPhone-Zeichenfehler nach Veröffentlichung erneut abnehmen; Ursache noch nicht abschließend bewiesen.

## Collagen-Gestaltung · PR #25
- [x] Cremeweiße Fotoränder und warme weiche Schatten in Übersicht und tatsächlichem JPG-Export implementiert; keine Beschneidung der Fotos.
- [x] Chromium/WebKit prüfen Pixel des tatsächlichen JPEG-Exports: heller Rand, dunklerer Schatten, Fotofarbe und 3200×4000-Auflösung. Beide CI-Läufe erfolgreich (42460399944/42460399940); PR #25 zusammengeführt und Pages veröffentlicht.
- [x] Sophie bestätigt die neue Collagen-Gestaltung als besser; Fotoränder, Schatten und Abstände visuell abgenommen.

## Betriebsprüfung · 08.11.2026
- [x] Sophie bestätigt Fotoanzeige und Navigation beim Scrollen; acht reale unterschiedliche Bilder genügen für die manuelle Sichtprüfung. Größere Belastung separat technisch prüfen.
- [x] Projekt ACTIVE_HEALTHY, Health Advisor leer; Organisation im Free-Tarif. Storage-Buckets privat, RLS aktiv, sensible Worker-/PIN-RPCs für anonyme Nutzer gesperrt.
- [x] Konkreter Betriebs-/Backup-/Recovery-Plan als separater Dokumentations-PR vorbereitet.
- [ ] Kostenentscheidung für Dauerbetrieb; kein Upgrade vorgenommen.
- [ ] Datenbanksicherungen und getrennte Medien-Sicherung einrichten und isoliert wiederherstellen. Noch keine Sicherung/Wiederherstellung erfolgt.
- [ ] SMTP und Admin-Recovery im Dashboard prüfen; Konfiguration über vorhandene Werkzeuge nicht einsehbar. Schutz gegen bekannte kompromittierte Passwörter weiterhin deaktiviert.

## Budgetentscheidung – kostenlos
- [x] Sophie möchte vollständig kostenlosen Betrieb. Free beibehalten; kein kostenpflichtiger Tarif, Add-on oder externer Dienst ohne neue ausdrückliche Entscheidung.
- [x] Betriebsplan PR #26 entsprechend überarbeitet; mögliche Inaktivitätspause bleibt ein offenes Verfügbarkeitsrisiko, kein Keep-alive als Garantie.
- [ ] Kostenlosen privaten Inhaltsexport und Wiederherstellung vorbereiten, von vollständiger Auth-/Schema-/Vault-/Medien-Projektsicherung abgrenzen.
- [ ] Kostenlose Admin-Mail-/Recovery-Möglichkeiten und tatsächliche Konfiguration prüfen.


## Kostenlose private Inhaltssicherung · PR #27
- [x] Haupt-Studio: bewusst vorbereitbarer ZIP-Download mit Texten, Terminen, Entwürfen, zukünftigen Beiträgen und referenzierten Originaldateien; YouTube/Deezer als Verknüpfungen.
- [x] Keine Änderung von Datenbank-/Storage-Rechten, keine Secrets oder echten Inhalte in Repository oder Testartefakten. Adminprüfung, vollständige Paginierung, Vorher-/Nachher-Vergleich, SHA-256-Manifest, Abbruch bei Logout und mobiles Größenlimit.
- [x] 30 Node-Prüfungen, beide lokalen PostgreSQL-Sicherheitssuiten und 54 mobile Chromium-/WebKit-Prüfungen bestanden; darunter acht neue Browser-Exportprüfungen. CI 42464699368 und Vorschau-CI 42464699358 erfolgreich; PR #27 zusammengeführt.
- [x] Pages-Veröffentlichung 42464844757 erfolgreich. Studio-HTML und backup.js live per HTTPS abgerufen; SHA-256 beider Dateien stimmt mit dem geprüften Quellcode überein.
- [x] Erster echter Inhaltsexport von Sophie heruntergeladen und zur Prüfung bereitgestellt. ZIP-CRC, sämtliche SHA-256-Prüfsummen, Dateigrößen, Zeilenzahlen und Medienzuordnungen erfolgreich unabhängig geprüft. Keine privaten Inhalte oder Archivdateien ins Repository übernommen.
- [x] Sophie bestätigt lokale Aufbewahrung und erfolgreiches Öffnen eines entpackten Originalfotos auf ihrem iPhone. Vollständiger Projekt-Restore bleibt separat offen.
- [ ] Separate vollständige DB-/Auth-/Konfigurationssicherung sowie isolierter Wiederherstellungstest bleiben offen. Inhaltsexport ist kein vollständiges Projektbackup. Anleitung: docs/CONTENT_BACKUP.md.


## Lokale Wiederherstellungsprobe · PR #28
- [x] Inhaltssicherung in stets neue lokale PostgreSQL-WASM-Datenbank einlesen: alle exportierten Spalten und Fremdschlüssel, Originalbytes und Prüfsummen, private Storage-Zuordnungen und Rollen nach dem Import geprüft.
- [x] Lokale Probe mit synthetischen Daten bestanden: freigeschalteter Beitrag, Zukunftstermin, Entwurf, Originalmedien, Erinnerung, Kalender, YouTube/Deezer; beschädigtes Archiv und ungültige SQL-Werte werden abgewiesen. 30 bestehende Node-Tests und beide Datenbanksicherheitssuiten ebenfalls bestanden.
- [x] Keine Ziel-URL, kein produktiver Datenbankzugang, keine echten Auth-/SMTP-/Storage-Dienste. Reduzierte Auth-/Storage-Testmodelle ausdrücklich dokumentiert. Keine kostenpflichtige Ressource angelegt.
- [x] CI 42468145655 (einschließlich der drei neuen Wiederherstellungstests) und Vorschau-CI 42468145803 erfolgreich am Commit 4f89f8c762daaceb60c2f018ac48b25a996a7f6e. PR #28 nach Prüfung zusammengeführt; keine produktiven Datenänderungen.
- [x] Dieselbe lokale Probe mit Sophies erneut bereitgestelltem echtem Archiv am 08.11.2026 erfolgreich: sämtliche exportierten Spalten und Fremdschlüssel eingelesen, Originaldateien erneut bytegenau geprüft, Admin-/Partner-/Fremdkonto-/Anonym-/Widerruf-Prüfungen bestanden. Dauer ca. 3,4 Sekunden in der lokalen Testumgebung; kein Nachweis für produktive Wiederherstellungsdauer. Temporäre entpackte Daten im Abschluss entfernt; keine privaten Inhalte ins Repository übernommen.
- [ ] Vollständiger Supabase-Restore mit echten Auth-/Storage-APIs und separater Konten-/Konfigurations-/SMTP-/Push-Wiederherstellung bleibt offen.


## Ergebnis der echten lokalen Inhaltsprobe · 08.11.2026
- [x] Echtes ZIP erfolgreich in isoliertem PostgreSQL-WASM und reduziertem Storage-Modell wiederhergestellt und geprüft; keine Änderung an laufender App, keine Versandaufträge und keine neuen Kosten.
- [ ] Vollständiger Wiederaufbau der gehosteten Supabase-Dienste einschließlich Auth, Storage-API, Konfiguration, SMTP und Push bleibt ausdrücklich offen. Eine funktionierende lokale Inhaltsprobe ersetzt diese Abnahme nicht.


## Echte lokale Supabase-Dienste · 12.11.2026 · PR #29
- [x] Workflow-Start korrigiert; native CLI-Statusstruktur und lokales Einspielen mehrteiliger SQL-Dateien angepasst. Ausschließlich Loopback-Ziele, keine produktiven Zugangsdaten oder privaten ZIPs in CI.
- [x] Diensteprüfung 43297272929 am Commit 140e210d86e5fea4028ab909318388ce458ee265 bestanden: echte Auth-Anmeldung/Abmeldung, private Storage-Uploads, signierte bytegenaue Downloads, ZIP-Export, Entfernen synthetischer Daten und Wiederherstellung über REST/Storage. Zukunft, Entwurf, Fremdkonto, öffentlicher Dateizugriff und Widerruf geprüft.
- [x] App-CI 43297273384 und Vorschau-CI 43297273683 ebenfalls bestanden. PR #29 danach mit geprüftem Head zusammengeführt. Keine produktiven Daten geändert.
- [ ] Vollständige gehostete Projektwiederherstellung mit echten Konten/SMTP/Push-Konfiguration bleibt offen; erfolgreiche Diensteprüfung verwendet ausschließlich synthetische Daten. Keine neue kostenpflichtige Ressource angelegt.


## Admin-Passwortwiederherstellung · Geräteabnahme 12.11.2026
- [x] Sophie zeigt SMTP-Einstellungen: Custom SMTP deaktiviert. Keine Konfiguration geändert, kein externer Dienst gebucht.
- [x] Einmalige Recovery-Anforderung im Studio, Eingang der neuesten Mail und Öffnen des Links bestätigt.
- [x] Neues Studio-Passwort privat gesetzt; Erfolgsbestätigung und anschließendes Abmelden/erneute Anmeldung mit E-Mail und neuem Passwort ohne Mail-Link durch Sophie bestätigt. Kein Passwort oder Recovery-Link im Repository gespeichert.
- [ ] Zuverlässigkeit/Versandlimits des bestehenden Standard-Maildienstes bleiben eine Betriebsgrenze; der erfolgreiche Einzeltest ist keine Zustellgarantie. Eigener SMTP-Dienst nicht eingerichtet. Schutz vor bekannten kompromittierten Passwörtern separat weiterhin prüfen.


## Collagen-Mehrfoto-Prüfung · 12.11.2026 · PR #30
- [x] Tatsächlicher Export von 97 unterschiedlichen synthetischen Hoch-/Quer-/Quadrat-/schmalen Hochformatbildern in Chromium und WebKit bestanden: drei JPG-Seiten mit 48/48/1 Bildern, jede 3200×4000 Pixel. Jede Bildmitte nach erneutem JPEG-Dekodieren gegen individuelle Quellfarbe geprüft; keine fehlenden oder wiederholten Fotos.
- [x] Fehlendes Foto und geschlossene Collage liefern kein scheinbar vollständiges JPG. Haupt-CI 43305710194 und Vorschau-CI 43305710539 erfolgreich; PR #30 nach Prüfung zusammengeführt.
- [x] Keine privaten Fotos oder Produktionsdaten verändert; Sophie muss keine weiteren Testbilder hochladen.
- [ ] Physischer RAM-/Laufzeittest mit sehr vielen hochauflösenden Kameraoriginalen auf dem Ziel-iPhone dadurch nicht ersetzt. Der automatisierte Test nutzt kleine synthetische Quellbilder; acht echte Bilder wurden zuvor manuell abgenommen.
