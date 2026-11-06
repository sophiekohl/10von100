# PIN-Konfiguration: Datenbank-Schutzregel

Die echte Adminanfrage wurde authentifiziert (Auth und is_admin jeweils HTTP 200), scheiterte aber in partner_pin_configure mit `DELETE requires a WHERE clause`. Die Migration fix_partner_session_cleanup ergänzt in partner_pin_configure und partner_pin_revoke beim Löschen registrierter Partner-Sitzungen `where session_id is not null`. Diese Spalte ist der nicht-nullbare Primärschlüssel; die beabsichtigte Widerrufssemantik bleibt erhalten. Rollen, Grants und PIN-Prüfung bleiben unverändert.

Live-Prüfung in einer zurückgerollten Transaktion: Konfiguration mit einem ausschließlich serverseitig erzeugten Zufallswert und anschließendem Widerruf erfolgreich. Nach ROLLBACK bestätigt: keine PIN-Konfiguration vorhanden. Sophie kann ihre eigene PIN erneut privat setzen. Erfolgreicher Edge-Ende-zu-Ende-Ablauf bleibt bis zu dieser Bestätigung offen.

Angewendetes SQL:

```sql
DO $migration$
DECLARE fn regprocedure; definition text;
BEGIN
 FOREACH fn IN ARRAY ARRAY['public.partner_pin_configure(uuid,text,boolean)'::regprocedure,'public.partner_pin_revoke()'::regprocedure] LOOP
  definition := pg_get_functiondef(fn);
  definition := replace(definition,'delete from private.partner_sessions;','delete from private.partner_sessions where session_id is not null;');
  EXECUTE definition;
 END LOOP;
END $migration$;
```
