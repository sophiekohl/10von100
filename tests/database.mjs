import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs/promises';
const db=new PGlite({extensions:{pgcrypto}});
try {
  await db.exec(await fs.readFile(new URL('./baseline.sql',import.meta.url),'utf8'));
  for(const name of (await fs.readdir(new URL('../supabase/migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())
    await db.exec(await fs.readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
  await db.exec('begin;');
  await db.exec(await fs.readFile(new URL('./security.sql',import.meta.url),'utf8'));
  await db.exec('rollback;');
  console.log('Database migration and all RLS / PIN / session assertions passed (local PostgreSQL WASM).');
}catch(e){console.error(e.message);process.exitCode=1;}finally{await db.close();}
