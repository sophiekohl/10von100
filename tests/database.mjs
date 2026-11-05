import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs/promises';
const db=new PGlite({extensions:{pgcrypto}});
try {
  await db.exec(await fs.readFile(new URL('./baseline.sql',import.meta.url),'utf8'));
  const migration=await fs.readFile(new URL('../supabase/migrations/20261105194808_private_app_security.sql',import.meta.url),'utf8');
  await db.exec(migration);
  await db.exec('begin;');
  await db.exec(await fs.readFile(new URL('./security.sql',import.meta.url),'utf8'));
  await db.exec('rollback;');
  console.log('Database migration and all RLS / PIN / session assertions passed (local PostgreSQL WASM).');
}catch(e){console.error(e.message);process.exitCode=1;}finally{await db.close();}
