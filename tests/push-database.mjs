import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs/promises';
const db=new PGlite({extensions:{pgcrypto}});
try{
await db.exec(await fs.readFile(new URL('./baseline.sql',import.meta.url),'utf8'));
for(const n of (await fs.readdir(new URL('../supabase/migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort())await db.exec(await fs.readFile(new URL('../supabase/migrations/'+n,import.meta.url),'utf8'));
try{await db.exec(await fs.readFile(new URL('../supabase/push.pending.sql',import.meta.url),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
await db.exec(await fs.readFile(new URL('./push-security.sql',import.meta.url),'utf8'));
console.log('Push authorization, queue, retry, revocation and no-early-send assertions passed.');
}catch(e){console.error(e.message);process.exitCode=1}finally{await db.close()}
