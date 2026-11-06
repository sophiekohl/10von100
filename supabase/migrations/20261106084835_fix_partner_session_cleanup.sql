-- Mirrors the migration already deployed on 2026-11-06; do not reapply remotely.
DO $migration$
DECLARE fn regprocedure; definition text;
BEGIN
 FOREACH fn IN ARRAY ARRAY['public.partner_pin_configure(uuid,text,boolean)'::regprocedure,'public.partner_pin_revoke()'::regprocedure] LOOP
  definition := pg_get_functiondef(fn);
  definition := replace(definition,'delete from private.partner_sessions;','delete from private.partner_sessions where session_id is not null;');
  EXECUTE definition;
 END LOOP;
END $migration$;
