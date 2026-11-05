# Zugriffsmodell und Betrieb

## Rollen

Der bestehende Admin bleibt in `admin_users` und meldet sich nur im Studio mit Supabase Auth an. Eine Partner-PIN erzeugt niemals Adminrechte. Beide Paarmitglieder können Erinnerungen erstellen; der Autor kann die eigenen Texte bearbeiten und eigene Erinnerungen löschen. Der Admin kann alle Erinnerungen verwalten. Unbekannte angemeldete Konten dürfen keine privaten Inhalte lesen oder schreiben.

Öffentlich sind ausschließlich die App-Oberfläche, neutrale Freischaltdaten und Kalenderbereiche. Titel, Briefe, Dateipfade, externe Medienkennungen und private Fotos sind geschützt. `published=false` bedeutet privater Entwurf, auch bei einem vergangenen Termin. Die Datenbankzeit entscheidet über die Freischaltung. Das Studio interpretiert Termine in `Europe/Berlin`.

## PIN und Sitzung

- Vier Ziffern werden ausschließlich im Backend gegen einen gesalzenen bcrypt-Hash (Kostenfaktor 12) geprüft. Die PIN wird weder gespeichert noch protokolliert oder an Auth als Passwort verwendet.
- Fünf falsche Versuche sperren den gesamten Partnerzugang für 15 Minuten. Nach insgesamt 20 falschen Versuchen ist ein Zurücksetzen im Studio nötig. Auch ein richtiger PIN umgeht eine Sperre nicht. Zusätzlich gelten zehn Anfragen pro IP-Fingerabdruck in 15 Minuten. IP-Adressen werden mit einem serverseitigen HMAC pseudonymisiert; alte Einträge werden beim nächsten Versuch bereinigt. Der globale Schutz funktioniert unabhängig von der Vertrauenswürdigkeit der Proxy-IP.
- Die Edge Function prüft Admin-JWTs durch Supabase Auth und `is_admin()`. Browserrollen können die privilegierten PIN-RPCs nicht ausführen. Der öffentliche Login-Endpunkt hat seine eigene PIN-Authentifizierung (`verify_jwt=false`); das ist keine ungeschützte Admin-API.
- Nach erfolgreicher PIN-Prüfung erstellt Supabase Auth eine normale Sitzung für eine eigene zufällige interne Partneridentität. Die erzeugte Einmalanmeldung wird nur serverseitig eingelöst. Weder Service-Key noch OTP-Hash gelangen in den Browser.
- Die Sitzung wird serverseitig mit der aktuellen PIN-Version registriert. RLS prüft außerdem die Existenz in `auth.sessions` und einen absoluten Ablauf nach 90 Tagen. PIN-Wechsel und „Partnerzugang sperren“ widerrufen registrierte Sitzungen sofort, auch noch gültige JWTs. Ein nicht registriertes Token der Partneridentität erhält keine Paarrechte.
- Im Browser liegen nur normale Auth-/Refresh-Tokens. Sie sind auf dem vertrauten iPhone dauerhaft gespeichert; das Studio verwendet einen separaten Sitzungsspeicher. XSS bleibt daher ein Risiko: keine ungeprüften Skripte einfügen. Nutzertexte werden mit `textContent` dargestellt. Parallele Refresh-Anfragen werden zusammengeführt.
- Logout entfernt lokale Sitzungsdaten und private DOM-Inhalte sofort und beendet online die aktuelle Auth-Sitzung. Ein bereits ausgegebener signierter Medienlink kann noch bis zu 120 Sekunden gelten. Bereits auf einem Gerät empfangene oder heruntergeladene Daten lassen sich nicht nachträglich zurückrufen.

## Bereitstellung

1. `npm ci`, `npm test`, `npm run test:db`, `npx playwright install --with-deps chromium webkit`, `npm run test:browser`.
2. Migrationen in `supabase/migrations/` in Dateireihenfolge gegen das vorher inventarisierte Supabase-Projekt prüfen und atomar anwenden. Sie sind Upgrades des vorhandenen Schemas, kein vollständiges Bootstrap für eine leere Datenbank. `tests/baseline.sql` ist ausschließlich ein lokales Testmodell, keine Produktionsmigration.
3. Edge Function `partner-pin` aus `supabase/functions/partner-pin/` mit `verify_jwt=false` bereitstellen. `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` stellt die Supabase-Laufzeit bereit. Keine Schlüssel im Repo oder in Frontend-Variablen ergänzen.
4. Smoke-Tests gegen das echte Projekt: Fremdkonto, Partner, Admin, künftiger Beitrag, Entwurf, private Medien, Sperre und Widerruf. Keine privaten Produktionsdaten als Testfixtures veröffentlichen.
5. Frontend über den geprüften PR veröffentlichen. Im Studio eine selbst gewählte PIN setzen und nur privat weitergeben. Erst ein explizit gesetzter PIN aktiviert den Partnerzugang.
6. Installierte iPhone-PWA gemäß Abnahmeliste prüfen. Erst danach die finale Freigabe setzen.

Die Migration lässt die bestehende Adminidentität und bestehende Paarmitgliedschaften bestehen. Sie verschärft direkte Daten- und Storage-Zugriffe. Bei Problemen den Partnerzugang sperren und die Ursache prüfen; Berechtigungen nicht pauschal öffnen. Datenbank-Backups vor Migrationen und Wiederherstellung über das Supabase-Dashboard prüfen. Auth-/Storage-Schemaabhängigkeiten der Sitzungsprüfung bei Supabase-Upgrades erneut testen.

## Bekannte Betriebsgrenzen

Vier Ziffern haben nur 10.000 Möglichkeiten. Die serverseitigen Sperren sind deshalb zwingend und können von Angreifern auch zum absichtlichen Sperren des Zugangs missbraucht werden. Der Admin kann mit einer neuen PIN entsperren. Push ist nicht implementiert und wird nicht angeboten. Teaserbilder werden vor Freischaltung nicht ausgeliefert. Bestehende signierte Medienlinks laufen nach kurzer Zeit ab; bei Wiedergabefehlern den Brief erneut öffnen.

Der Supabase-Advisor meldete am 05.11.2026 deaktivierten Schutz gegen geleakte Passwörter. Diese Auth-Einstellung ist für den Admin im Dashboard zu prüfen: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Die bewusst öffentlichen SECURITY-DEFINER-Kalenderfunktionen enthalten ausschließlich neutrale Projektionen; die übrigen Funktionen prüfen Rolle/Mitgliedschaft oder sind ausschließlich für `service_role` freigegeben.
