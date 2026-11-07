# Private Mitteilungen

## Bedienung
Die Haupt-App vom iPhone-Home-Bildschirm öffnen. Unten auf der PIN-Seite lassen sich Mitteilungen bereits bewusst erlauben. Das Gerät wird erst nach erfolgreicher PIN-Prüfung am Server registriert. Ohne Einwilligung erscheint kein Erlaubnisdialog. Eine noch nicht abgeschlossene ausdrückliche Einwilligung wird gerätebezogen als einzelnes lokales Ja/Nein-Merkmal bis zur Anmeldung gemerkt; keine Subscription, Schlüssel oder Inhalte werden dafür lokal gespeichert. Nach dem Anmelden bleiben die Einstellungen unter ⓘ verfügbar. Unter „Ein kleiner Hinweis für dich“ Mitteilungen bewusst aktivieren und den iPhone-Dialog erlauben. Die App fragt nie beim ersten Öffnen automatisch nach Erlaubnis. Hier lassen sich auch Testnachrichten senden (höchstens eine pro Minute) und Mitteilungen ausschalten.

Im Studio bei einem Beitrag „Bei Freischaltung eine Mitteilung senden“ aktivieren. Der Beitrag muss zusätzlich veröffentlicht sein. Versand erfolgt beim nächsten Minutenlauf nach der Freischaltung, nur an zuvor angemeldete Geräte. Kein Nachversand alter Freischaltungen beim Aktivieren eines Geräts; nach Ausfällen werden höchstens 24 Stunden alte Freischaltungen versucht. Der Hinweis enthält keine privaten Titel, Texte oder Bilder. `push_text` wird nicht verwendet.

Beim Antippen wird nur eine Beitrags-ID an die App übergeben. Die App prüft ihre Sitzung und lädt Inhalte erneut unter den vorhandenen Datenbankrechten. Ohne gültige Sitzung bleibt das PIN-Tor geschlossen. Verlegte, zurückgezogene oder gelöschte Beiträge werden nicht über den Link offengelegt.

## Server und Sicherheit
- Edge Function `partner-push`, JWT-Prüfung im Handler über `is_couple_member` sowie aktuelle Auth-/Partner-Sitzung in `push_manage`. Der Dispatcher verwendet ein eigenes zufälliges Servergeheimnis.
- VAPID-Schlüssel einmalig zur Laufzeit erzeugt. Privater Schlüssel und Cron-Geheimnis ausschließlich in Supabase Vault; keine Geheimnisse im Repository. `push_worker` nur für `service_role` ausführbar. Browser erhalten nur den öffentlichen VAPID-Schlüssel.
- Subscription-Endpunkte/Schlüssel liegen im nicht exponierten Schema `private`, ohne Browser-Leserechte. Versandziele sind auf Apple, Google FCM und Mozilla-Push beschränkt. Weiterleitungen werden abgelehnt.
- Ein Gerät ist an die registrierte Auth-Sitzung und PIN-Revision gebunden. Abmeldung entfernt die Subscription; Löschung der Auth-Sitzung ebenfalls. PIN-Sperre, Rotation und 90-Tage-Ablauf verhindern weitere Einplanungen. Bereits vom Push-Dienst angenommene neutrale Nachrichten können noch eintreffen.
- Cron `10von100-push`, jede Minute. Ohne gültige registrierte Geräte keine Edge-Anfrage. Kein Gerät wird ohne Einwilligung hinzugefügt.
- Zustellprotokoll pro Gerät/Beitrag, atomare Beanspruchung mit fünf Minuten Sperrfrist. Maximal fünf Versuche mit fünf Minuten Abstand, abgelaufene Endpunkte (404/410) entfernen. Gleiche Notification-Tags/Topics begrenzen doppelte Anzeigen; eine absolute Exactly-once-Zustellung bei Netzausfällen ist nicht garantiert.
- Annahme durch den Push-Dienst ist keine Empfangsgarantie. Internet, Betriebssystem, Fokus und deaktivierte Mitteilungen beeinflussen die Zustellung. Uhrzeit in der App/Datenbank bleibt Europe/Berlin bzw. timestamptz; Push ist ein Hinweis und keine Voraussetzung zur Freischaltung.

## Abnahme
Automatisiert: Endpunkt-Allowlist, fehlende/falsche Dispatcher- und Nutzerberechtigungen, neutrale verschlüsselte Payload, Service-Worker-Klickziel; lokale PostgreSQL-Tests für Rechte, keine Entwürfe/zukünftigen/alten Beiträge, Backoff, Beanspruchung, keine wiederholten erledigten Sendungen, PIN-Revision und Sitzungswiderruf. Browser prüfen Einwilligung/Ein-Aus/Test und das PIN-Tor bei Mitteilungslinks.

Physischer iPhone-Test noch erforderlich: Mitteilungen erlauben, Testnachricht bei geschlossener App empfangen, antippen; zusätzlich geplante synthetische Überraschung erst nach Freischaltung, Abmeldung, Ausschalten, Neustart und Fokus testen. Kein echter zukünftiger Überraschungsinhalt für Tests verwenden.

## Betrieb
Cron und Function-Logs nur auf Status/Fehler prüfen, keine Endpunkte, Schlüssel, JWTs oder private Inhalte protokollieren. Bei Störung kann Cron deaktiviert werden; Freischaltungen und App-Nutzung bleiben unabhängig verfügbar. Eine dauerhafte Supabase-Verfügbarkeit und Betriebs-/Backupkonfiguration bleiben Teil der Endabnahme.
