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
- [ ] Hauptversion nach finalem Icon-/Release-Prüflauf bereitstellen und ausgelieferte Dateien kontrollieren.
- [ ] Auf Sophies iPhone installieren: Home-Bildschirm, einmalige PIN, Schließen/Wiederöffnen, Neustart, Offline-/Online-Wiederaufnahme prüfen. Zielgerät des Mannes bleibt separat zu berücksichtigen; keine Prüfung auf seinem Gerät vorgeben oder vorzeitige Überraschung veranlassen.
- [ ] Endgültige Betriebs-/Backup-/Mailkonfiguration, Push-Entscheidung und verbleibende Sicherheits-/Langzeitabnahme abschließen.

## Freigegebenes Logo
- [x] Kombination aus Entwurf 07 und 03 von Sophie freigegeben.
- [x] Versionierte PNG-App-Icons (192/512) und Browser-Icon (64) erstellt; Manifest, Apple-Touch-Icon und öffentlicher Cache aktualisiert.
- [ ] Darstellung des neuen Symbols bei bestehender iPhone-Installation prüfen.

## Push-Ausbau
- [x] Neutrale Push-Mitteilungen, freiwilliges Aktivieren/Ausschalten und Testversand implementiert.
- [x] Private Subscription-Verwaltung, Vault-Schlüssel, Minutenplan und Zustellprotokoll mit Wiederholungsbegrenzung umgesetzt.
- [x] Lokale Rechte-/Sperr-/Freischaltungs- und Verschlüsselungstests bestanden.
- [ ] Browser-Regression und Live-Veröffentlichung prüfen.
- [ ] Echten Empfang, Antippen und geplanten Versand auf Sophies installierter iPhone-App abnehmen; erst danach Push als fertig markieren.

## Push vor der PIN-Eingabe
- [x] Mitteilungen ganz unten auf der PIN-Seite erlauben; Serverregistrierung erst nach erfolgreicher Anmeldung.
- [x] Einstellungen nach Anmeldung weiterhin unter ⓘ, ohne zusätzliche Fläche auf Home.
- [ ] Empfang und geplanter Versand auf dem echten iPhone bleiben offene Abnahme.

## Kompakte PIN-Seite
- [x] Kleinere PIN-Ziffern (20 px), weniger Abstände und kompakter Push-Hinweis; Tasten mindestens 44 px hoch.
- [ ] Sichtbarkeit ohne Scrollen auf iPhone-Höhen und Browser-Regression prüfen.
