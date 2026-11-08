# Betrieb und Wiederherstellung – 10von100

Stand: 08.11.2026. Ziel: Geschenkübergabe 09.12.2026, Betrieb bis mindestens 31.12.2027.

## Verifizierter Iststand
- Supabase-Projekt aktiv und gesund; Health Advisor ohne Befund.
- Organisation verwendet den Free-Tarif.
- Alle drei Storage-Buckets privat. Öffentliche Tabellen mit RLS; keine öffentlichen Views ohne security_invoker.
- Anonyme Rollen können weder PIN-Konfiguration noch Push-Worker ausführen; angemeldete Partner können den Worker ebenfalls nicht ausführen.
- Sicherheits-Advisor meldet weiter deaktivierten Schutz gegen bekannte kompromittierte Passwörter.
- Weitere Advisor-Hinweise betreffen die beabsichtigten, explizit berechtigten RPC-Brücken bzw. privat gesperrte Tabellen. Das ersetzt keine vollständige Prüfung jeder Funktion.
- Aktuelle SMTP-Einstellungen und vorhandene Wiederherstellungspunkte sind mit den verfügbaren verbundenen Werkzeugen nicht einsehbar. Ihr Vorhandensein wird nicht behauptet.
- Noch keine neue Sicherung angelegt und keine Wiederherstellung durchgeführt.

## Entscheidung zum Dauerbetrieb
Free kann bei geringer Aktivität pausiert werden. Für das zugesagte Nutzungsjahr wird Pro empfohlen, damit die Inaktivitätspause entfällt. Das ist keine Garantie gegen alle Ausfälle.
Die öffentliche Preisseite nennt Pro ab 25 USD/Monat. Tatsächlichen Betrag einschließlich Steuern, Zusatzprojekten und Verbrauch im Checkout prüfen; keine Buchung ohne ausdrückliche Kostenfreigabe.
Es wurden keine Tarif-, Abrechnungs- oder Ressourcenänderungen vorgenommen.

## Vorgeschlagenes Sicherungskonzept – noch umzusetzen
1. Datenbank: tägliche Provider-Sicherungen, sofern nach Tarifwechsel bestätigt; zusätzlich regelmäßiger verschlüsselter Export außerhalb des Projekts.
2. Medien: gesonderte Kopie der privaten Storage-Dateien. Die Datenbanksicherung enthält lediglich deren Metadaten und ersetzt diese Kopie nicht.
3. Anwendung: Code, Migrationen und Edge-Function-Quellen im GitHub-Repository. Zusätzlich die tatsächlich bereitgestellten Versionen dokumentieren.
4. Geheimnisse/Konfiguration: Auth- und SMTP-Konfiguration sowie benötigtes Vault-/VAPID-Wiederherstellungsverfahren gesondert erfassen und geschützt aufbewahren. Keine Schlüssel, PINs, Passwörter oder Klartext-Dumps im Repository.
5. Ziel für die externe Sicherung: täglicher Stand, sieben Tagesstände und vier Wochenstände, erst nach Wahl eines privaten Speicherziels und Prüfung der nötigen Zugriffe. Verschlüsselungsschlüssel getrennt aufbewahren.
6. Jedes Sicherungspaket benötigt Manifest mit Zeitstempel, Versionsbezug, Dateianzahl und Prüfsummen. Erst nach erfolgreicher Prüfung als vollständig bezeichnen.

## Wiederherstellungsabnahme – offen
- Aktives Projekt nicht für einen Wiederherstellungstest überschreiben.
- In einer getrennten Testumgebung Datenbank und zugehörige Medien zusammen wiederherstellen. Zusätzliche Ressourcen erst nach Kostenprüfung anlegen.
- Vor Freigabe Buckets privat halten, Rollen-/RLS-/RPC-Rechte prüfen, Auth-Zuordnungen verifizieren.
- Testumgebung darf keine produktiven geplanten Push-Nachrichten oder Auth-Mails versenden.
- Wiederhergestellte Fotos und Medien über den geschützten Zugriff laden und Prüfsummen vergleichen.
- Entwurf, zukünftige Freischaltung und bereits freigegebener Beitrag müssen jeweils korrekt geschützt sein.
- Produktive Sitzungstoken nicht als dauerhafte Sicherung behandeln. Nach Wiederherstellung gegebenenfalls Sitzungen widerrufen und Geräte neu anmelden; Push-Schlüssel/Registrierungen gesondert berücksichtigen.
- Dauer und Ergebnis des Tests dokumentieren. Bisher weder Wiederherstellungszeit noch maximalen Datenverlust als verifiziert angeben.

## Admin-Wiederherstellung – offen
- Eigenen SMTP-Versand und berechtigten Absender im Supabase-Dashboard prüfen/einrichten.
- SMTP-Zugangsdaten ausschließlich im dafür vorgesehenen geschützten Dashboard speichern.
- Produktions-Redirect zum bestehenden Studio-Recovery-Flow kontrollieren.
- Genau eine Wiederherstellungs-Mail anfordern und von Sophie empfangen/verwenden lassen. Keine wiederholten Testmails oder unaufgeforderten Passwortänderungen.
- Eigenes langes Studio-Passwort in ihrer Passwörter-App hinterlegen; GitHub-/Supabase-Kontozugang mit MFA prüfen.
- Schutz vor kompromittierten Passwörtern nach Tarif-/Konfigurationsprüfung aktivieren und verifizieren.
- Die vom Ehemann verwendete PIN bleibt davon unabhängig.

## Nächste Reihenfolge
1. Betriebsbudget festlegen.
2. Tarif und vorhandene Datenbanksicherungen im Dashboard bestätigen.
3. Privates Ziel für die zusätzliche Datenbank-/Medien-Sicherung festlegen und Sicherung einrichten.
4. Isolierten Wiederherstellungstest abschließen.
5. SMTP-/Admin-Recovery abnehmen.
6. Verbleibende technische Belastungsprüfung und Übergabeanleitung abschließen.

## Offizielle Referenzen
- https://supabase.com/pricing
- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/password-security
