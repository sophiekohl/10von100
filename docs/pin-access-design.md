# Vierstelliger PIN-Zugang – Umsetzung

## Produktentscheidung
- Der Partner erhält einen vierstelligen Zahlencode statt E-Mail/Passwort.
- Der private Studio-/Admin-Zugang bleibt separat und stärker geschützt.
- Nach erfolgreicher Prüfung soll eine sichere Sitzung entstehen, damit nicht bei jedem Öffnen erneut eine PIN nötig ist.
- Das bestehende Design in Bordeauxrot und Creme bleibt bestehen.

## Sicherheitsanforderungen (Release-Blocker)
1. PIN **niemals** in `index.html`, `config.js`, öffentlichen GitHub-Dateien oder Browser-Storage hinterlegen.
2. PIN ausschließlich serverseitig gegen einen gesalzenen, langsam berechneten Hash prüfen; kein einfacher SHA-256-Hash für nur 10.000 Möglichkeiten.
3. Versuche serverseitig begrenzen (pro Nutzer/Zugang und IP), nach Fehlversuchen zeitweise sperren; Fehlermeldungen ohne Informationsleck.
4. Nach erfolgreicher Prüfung eine serverseitig validierbare Sitzung ausgeben, die die bestehenden Supabase-RLS-/RPC-Regeln respektiert. **Keine** service-role-Schlüssel oder generischen privilegierten Tokens an Browser ausgeben.
5. Vor Freischaltung keine privaten Inhalte oder Medien-URLs ausliefern. Der Kalender darf nur spoilerfreie Daten enthalten.
6. Codewechsel, Sitzungswiderruf, Logout und Ablaufzeit vorsehen.
7. Admin-Funktionen dürfen nicht mit der Partner-PIN zugänglich sein.
8. Auf iPhone/PWA testen: Eingabe, Neustart, Offline-Modus, abgelaufene Sitzung und Fehlversuche.

## Aktueller Implementierungsstand
Die bestehende App nutzt Supabase Auth mit Passwort/Magic Link. Der PIN-Ersatz ist **noch nicht produktiv aktiviert**. Vor dem Umschalten müssen die Datenbank erreichbar, das aktuelle Auth-/RLS-Schema geprüft und die Ende-zu-Ende-Tests bestanden sein. Bis dahin bleibt die bisherige Authentifizierung unverändert; kein unsicherer PIN-Scheinlogin.

## Nächste technische Schritte
- Bestehende Tabellen, Policies, RPCs und Edge Functions lesen.
- Sichere serverseitige PIN-Verifikation und Session-Ausgabe implementieren.
- PIN-Eingabemaske in der PWA anbinden, ohne die bestehenden privaten Daten zu öffnen.
- Sperrlogik, Session-Erneuerung und Regressionstests durchführen.
