# iPhone-Abnahme vor Veröffentlichung

Automatisierte mobile Chromium-Tests ersetzen kein echtes iPhone. Diese Liste bleibt offen, bis die installierte Safari-PWA geprüft wurde.

- [ ] Safari: App öffnen, PIN mit Zahlentastatur eingeben, zum Home-Bildschirm hinzufügen (Teilen → Zum Home-Bildschirm).
- [ ] App schließen, iPhone neu starten, PWA wieder öffnen: Sitzung bleibt erhalten.
- [ ] Nach längerem Hintergrundbetrieb wird die Sitzung erneuert; nach Ablauf/Server-Widerruf erscheint wieder der PIN-Zugang.
- [ ] Fünf falsche PINs sperren auch bei geänderter IP; nach 15 Minuten wieder nutzbar. Nach 20 Fehlversuchen bleibt der Zugang bis zum Admin-Reset gesperrt. Nur mit einer eigens dafür gesetzten Test-PIN prüfen.
- [ ] Abgemeldet, vor Freischaltung und als fremdes Konto: keine privaten Titel, Texte, Medienkennungen oder signierten Links in DOM, API-Antworten oder Cache.
- [ ] Ein zukünftiger Testbeitrag und ein vergangener Entwurf bleiben verschlossen. Freischaltung erfolgt exakt nach Berliner Zeit.
- [ ] Foto, Video und Audio aus privaten Buckets abspielen. Video im Vollbild/inline, Pause, Fortsetzen, Seitenwechsel und gesperrten Bildschirm prüfen. Externe YouTube-/Deezer-Player nach Freischaltung prüfen.
- [ ] „Unser Jahr“: Text und iPhone-Fotos speichern, schließen, wieder öffnen, Text ändern, Erinnerung entfernen. HEIC/HEIF-Anzeige auf dem Zielgerät prüfen.
- [ ] Studio: bestehende Admin-Anmeldung, Entwurf, Bearbeitung, Medienreihenfolge/-entfernung, Vorschau, Freischaltung, Kalenderbereich und Löschung testen. Partner darf nicht ins Studio.
- [ ] Offline: öffentliche App-Hülle öffnet sich; private Daten erscheinen nicht aus Cache. Verständliche Meldung statt Erfolg bei fehlgeschlagenem Speichern.
- [ ] Bei Logout während offenem Brief stoppen Medien; Titel, Text und Fotos verschwinden. PIN-Wechsel sperrt das alte Gerät bei der nächsten Anfrage.
- [ ] Kleine Schrift, Vergrößerung, Hoch-/Querformat, Safe Areas und Bildschirmtastatur prüfen.

Der Ring „10 %“ bedeutet zehn von 100 gemeinsamen Jahren. Er zeigt keinen Jahresfortschritt. Jubiläum: 18.01.2027. Es wird keine unbestätigte App-Jahresspanne behauptet.
