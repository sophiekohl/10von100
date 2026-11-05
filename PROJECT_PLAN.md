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
- [x] Edge Function `partner-pin` Version 1 aktiv; noch keine PIN konfiguriert.
- [x] Live-Negativtests: private REST-Daten und interne PIN-RPCs verweigern anonymen Zugriff; öffentliche neutrale Termine erreichbar; fremder Origin abgewiesen. PIN-Login/Verwaltung ohne gültige Anmeldung liefern keinen Token.
- [x] Rechteprüfung: kein anonymes SELECT/TRUNCATE auf Inhalten, kein TRUNCATE auf Adminregister für authenticated; browserseitige PIN-Konfiguration verboten; bestehende Authidentität unverändert. Health-Advisor ohne Befund.
- [x] Signierte Medien-URLs behalten den erforderlichen `/storage/v1`-Präfix; Regressionstest ergänzt.

## 4. Noch offen – Release-Blocker

- [ ] Erfolgreiche PIN-Anmeldung und Session-Erneuerung mit echtem Partnerkonto sowie reale Storage-Uploads/-Wiedergabe Ende-zu-Ende prüfen. Backend-Bereitstellung und negative Live-Zugriffstests sind bereits erfolgt.
- [ ] Eigene Partner-PIN privat im Studio setzen; keine Test-PIN produktiv übernehmen.
- [ ] Reale Freischaltung, signierte Medien-URLs, Uploads und Auth-Refresh mit getrenntem Partner- und Admin-Konto Ende-zu-Ende prüfen.
- [ ] Vollständige Playwright-Browser-Suite erfolgreich ausführen; GitHub-Actions-Workflow ergänzt. In der Work-Umgebung startet Chromium nicht (SIGTRAP vor dem ersten App-Aufruf); DOM-Tests sind kein Browsernachweis.
- [ ] Installierte Safari-PWA auf iPhone 15 Pro mit iOS 27.2 prüfen: Neustart, Hintergrund/Refresh, Tastatur, Offline, HEIC, Audio-/Video-Wiedergabe, Medienwechsel und externe Player.
- [ ] Finale Freigabe nach bestandener Sicherheits- und Geräteabnahme.

## Nachweise und Grenzen

`npm test`: automatisierte Handler-, Session-, DOM- und Service-Worker-Tests. `npm run test:db`: echte Upgrade-Migration und RLS-/PIN-Assertions im lokalen PostgreSQL-WASM. Schema-Abbild enthält keine Nutzerdaten; Auth/Storage sind reduzierte Testmodelle. Tests mit echten Diensten und physischem iPhone bleiben erforderlich. Prüfdetails: `docs/TEST_REPORT.md`.

Supabase meldete deaktivierten Schutz gegen geleakte Passwörter; Admin-Auth-Einstellung vor Freigabe im Dashboard prüfen. SECURITY-DEFINER-Funktionen werden nach ihren tatsächlichen Zugriffskontrollen bewertet, nicht pauschal freigegeben.

## Später

- [ ] Push auf iPhone nach gesonderter Machbarkeits-/Einwilligungsentscheidung.
- [ ] Weitere Barrierefreiheits- und Wiederherstellungstests.
