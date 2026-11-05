# 10 / 100

Private Jubiläums-PWA in Bordeauxrot und Creme. Zehn gemeinsame Jahre am **18. Januar 2027**, auf dem Weg zu 100.

## Funktionen dieses Entwicklungsstands

- Partnerzugang mit vierstelliger PIN: serverseitiges bcrypt, Versuchssperren, eigene Auth-Identität und widerrufbare 90-Tage-Sitzung.
- Separates Admin-Studio mit bestehender Passwort-/Magic-Link-Anmeldung. Partner-Tokens erhalten keine Studio-Rechte.
- Neutrale Kalendertermine und mehrtägige Bereiche. Private Briefe und Medien werden ausschließlich nach Veröffentlichung und Freischaltung ausgeliefert.
- Studio: Entwürfe, Bearbeiten, Löschen, Medienreihenfolge, Vorschau, explizite Veröffentlichung und Kalenderverwaltung. Fehlgeschlagene Uploads veröffentlichen keinen unvollständigen Beitrag.
- „Unser Jahr“: private Erinnerungen mit Datum, Text und Fotos; Erstellen, Wiederladen, Textänderung und Löschen. Autor und Admin verwalten Erinnerungen gemäß Datenbankregeln.
- PWA-App-Hülle offline; private API-Antworten und Medien werden nicht im Service Worker gespeichert.

**Dieser Stand ist keine finale Produktionsfreigabe.** Bereitstellung und echte iPhone-Abnahme werden im [Projektplan](PROJECT_PLAN.md) getrennt von lokalen Tests geführt. Push und vorzeitige Teaserbilder sind nicht aktiviert.

## Entwickeln und prüfen

```sh
npm ci
npm test
npm run test:db
npx playwright install --with-deps chromium
npm run test:browser
python3 -m http.server 4173
```

`npm test` prüft Edge-Handler, Session-Erneuerung, DOM-Bedienabläufe und Cache-Abgrenzung. `test:db` wendet die echte Migration auf ein schemaidentisches lokales PostgreSQL-WASM-Testmodell an und prüft RLS, PIN und Sitzungswiderruf. Auth und Storage sind dort reduzierte Modelle; das ersetzt keinen Test der echten Supabase-Auth-/Storage-Dienste. Die Playwright-Suite verwendet künstliche API-Antworten und ein iPhone-Viewport in Chromium. Das ersetzt kein installiertes Safari-PWA auf einem echten iPhone.

Die Frontend-Konfiguration enthält nur die öffentliche Supabase-Projektadresse und einen Publishable-Key. Service-Keys, PINs, Passwörter und private Medien gehören niemals in dieses öffentliche Repository.

## Bereitstellung und iPhone

Die Upgrade-Reihenfolge, Rollen und Sperren stehen in [SECURITY.md](docs/SECURITY.md). Die Migration benötigt das vorhandene Supabase-Schema. Nach Backend-Bereitstellung im Studio eine eigene PIN setzen und nur privat weitergeben. Der [iPhone-Abnahmeplan](docs/IPHONE_ACCEPTANCE.md) enthält die noch zu prüfenden Geräteabläufe.

Für Safari: veröffentlichte App öffnen → Teilen → „Zum Home-Bildschirm“. Die PNG-App-Icons und der Manifest-Scope unterstützen die Installation unter `/10von100/`.

Die Anzeige „10 %“ bedeutet zehn von 100 gemeinsamen Jahren, keinen berechneten Jahresfortschritt. Termine gelten unabhängig von der Gerätezeitzone für `Europe/Berlin`.
