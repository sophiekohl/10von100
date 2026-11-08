/* Offline rehearsal ONLY: creates a new in-memory PostgreSQL, never a hosted connection. */
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const schema={
 content_items:'id,title,kind,body,unlock_at,teaser_mode,teaser_image_path,calendar_visible,push_enabled,created_at,updated_at,published',
 content_media:'id,content_item_id,media_type,storage_path,caption,sort_order,created_at,youtube_video_id,deezer_kind,deezer_id',
 year_moments:'id,caption,moment_date,include_in_recap,created_by,created_at',
 moment_photos:'id,moment_id,storage_path,sort_order,created_at,caption',
 calendar_ranges:'id,start_date,end_date,created_at'
};
const order=['content_items','year_moments','calendar_ranges','content_media','moment_photos'];
const unpack=`import importlib.util,json,pathlib,sys,zipfile
spec=importlib.util.spec_from_file_location('backup_verify',sys.argv[1]);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
try:
 mod.verify(sys.argv[2])
 target=pathlib.Path(sys.argv[3])
 with zipfile.ZipFile(sys.argv[2]) as archive:
  for name in archive.namelist():
   destination=target.joinpath(*name.split('/'));destination.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
   with destination.open('xb') as handle: handle.write(archive.read(name))
except Exception:
 sys.exit(1)
`;
export async function rehearseContentRestore(archivePath){
 const started=Date.now();let folder,db;
 try{
  folder=await fs.mkdtemp(path.join(os.tmpdir(),'10von100-restore-'));await fs.chmod(folder,0o700);
  // Independent Python verifier rejects ZIP traversal, missing files and checksum errors before reading content.
  execFileSync('python3',['-B','-c',unpack,path.join(root,'tools/verify-content-backup.py'),path.resolve(archivePath),folder],{stdio:'pipe',timeout:60000,maxBuffer:1024});
  const data=JSON.parse(await fs.readFile(path.join(folder,'data.json'),'utf8'));
  const manifest=JSON.parse(await fs.readFile(path.join(folder,'manifest.json'),'utf8'));
  assert.deepEqual(Object.keys(data).sort(),Object.keys(schema).sort());
  for(const [table,rows] of Object.entries(data)){
   assert.ok(rows.length<=50000);const allowed=new Set(schema[table].split(','));
   for(const row of rows)for(const key of Object.keys(row))assert.ok(allowed.has(key));
  }
  // No URL, credentials or destination argument exists. PGlite is a fresh, in-memory WASM instance.
  db=new PGlite({extensions:{pgcrypto}});
  await db.exec(await fs.readFile(path.join(root,'tests/baseline.sql'),'utf8'));
  for(const name of (await fs.readdir(path.join(root,'supabase/migrations'))).filter(n=>n.endsWith('.sql')).sort())await db.exec(await fs.readFile(path.join(root,'supabase/migrations',name),'utf8'));
  // Auth and Storage here are reduced local models, not running Supabase services.
  // Refuse a future migration that adds active network or cron extensions to this local harness.
  const extensions=await db.query("select extname from pg_extension where extname in ('pg_net','pg_cron','http')");assert.equal(extensions.rows.length,0);
  await db.exec('begin');
  const admin=randomUUID(),partner=randomUUID(),outsider=randomUUID(),sid=randomUUID();
  const authors=new Set(data.year_moments.map(r=>r.created_by).filter(Boolean));
  for(const id of new Set([...authors,admin,partner,outsider]))await db.query('insert into auth.users(id,email) values($1,$2)',[id,id===partner?'partner-restore@10von100.invalid':null]);
  await db.query('insert into public.admin_users(user_id) values($1)',[admin]);
  await db.query('select public.partner_pin_configure($1,$2,false)',[partner,'4826']); // synthetic local PIN only
  await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,partner]);
  await db.query('select public.partner_pin_register($1,(select revision from private.partner_access),$2)',[partner,sid]);
  for(const table of order){
   const cols=schema[table];
   await db.query(`insert into public.${table} (${cols}) select ${cols} from jsonb_populate_recordset(null::public.${table},$1::jsonb)`,[JSON.stringify(data[table])]);
   const result=await db.query(`with expected as (select * from jsonb_populate_recordset(null::public.${table},$1::jsonb)), differences as ((select ${cols} from public.${table} except select ${cols} from expected) union all (select ${cols} from expected except select ${cols} from public.${table})) select not exists(select 1 from differences) as equal`,[JSON.stringify(data[table])]);
   assert.equal(result.rows[0].equal,true);
  }
  const media=[];
  for(const file of manifest.files.filter(f=>f.name.startsWith('media/'))){
   const bytes=await fs.readFile(path.join(folder,...file.name.split('/')));
   assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
   const parts=file.name.split('/');const bucket=parts[1],name=parts.slice(2).join('/');
   await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',[bucket,name]);media.push({bucket,name});
  }
  const now=Date.parse((await db.query('select now()::text as current_time')).rows[0].current_time);
  const open=new Set(data.content_items.filter(r=>r.published&&Date.parse(r.unlock_at)<=now).map(r=>r.id));
  const mediaRows=data.content_media.filter(r=>open.has(r.content_item_id));
  const allowedContent=new Set(mediaRows.filter(r=>r.storage_path).map(r=>r.storage_path));
  const allowedMoments=new Set(data.moment_photos.map(r=>r.storage_path));
  async function asUser(id,session,fn){
   await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:id,role:'authenticated',session_id:session})]);await db.exec('set local role authenticated');
   try{return await fn();}finally{await db.exec('reset role');}
  }
  const ids=rows=>rows.map(r=>r.id).sort();
  const storageKeys=rows=>rows.map(r=>r.bucket_id+'/'+r.name).sort();
  const checks=[];
  await asUser(admin,null,async()=>{
   for(const table of order)assert.deepEqual(ids((await db.query(`select id from public.${table}`)).rows),ids(data[table]));
   assert.deepEqual(storageKeys((await db.query('select bucket_id,name from storage.objects')).rows),media.map(m=>m.bucket+'/'+m.name).sort());
  });checks.push('admin_all_content_and_media');
  await asUser(partner,sid,async()=>{
   assert.deepEqual(ids((await db.query('select id from public.content_items')).rows),[...open].sort());
   assert.deepEqual(ids((await db.query('select id from public.content_media')).rows),ids(mediaRows));
   assert.deepEqual(ids((await db.query('select id from public.public_unlocked_surprises()')).rows),[...open].sort());
   assert.deepEqual(ids((await db.query('select id from public.unlocked_couple_media()')).rows),ids(mediaRows));
   for(const table of ['year_moments','moment_photos'])assert.deepEqual(ids((await db.query(`select id from public.${table}`)).rows),ids(data[table]));
   const expected=media.filter(m=>(m.bucket==='content'&&allowedContent.has(m.name))||(m.bucket==='moments'&&allowedMoments.has(m.name)));
   assert.deepEqual(storageKeys((await db.query('select bucket_id,name from storage.objects')).rows),expected.map(m=>m.bucket+'/'+m.name).sort());
  });checks.push('partner_only_published_unlocked_content_and_linked_moments');
  await asUser(outsider,null,async()=>{
   for(const table of ['content_items','content_media','year_moments','moment_photos'])assert.equal((await db.query(`select id from public.${table}`)).rows.length,0);
   assert.equal((await db.query('select id from storage.objects')).rows.length,0);
   assert.equal((await db.query('select * from public.public_unlocked_surprises()')).rows.length,0);
  });checks.push('outsider_no_private_content');
  await db.exec('set local role anon');
  const schedule=(await db.query('select * from public.public_surprise_schedule()')).rows;
  assert.ok(schedule.every(row=>Object.keys(row).every(k=>['id','unlock_at','is_unlocked'].includes(k))));
  const drafts=new Set(data.content_items.filter(r=>!r.published).map(r=>r.id));assert.ok(schedule.every(r=>!drafts.has(r.id)));await db.exec('reset role');checks.push('anonymous_schedule_neutral_no_drafts');
  assert.equal((await db.query('select count(*)::int as n from private.push_subscriptions')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int as n from private.push_deliveries')).rows[0].n,0);checks.push('no_push_subscriptions_or_outbound_services');
  await db.query('delete from auth.sessions where id=$1',[sid]);
  await asUser(partner,sid,async()=>{
   assert.equal((await db.query('select id from public.content_items')).rows.length,0);
   assert.equal((await db.query('select id from storage.objects')).rows.length,0);
  });checks.push('revoked_partner_session_cannot_read');
  await db.exec('rollback');
  return {status:'passed',scope:'local-content-rehearsal',counts:manifest.counts,media_count:media.length,checks,duration_ms:Date.now()-started,limits:['Reduced local Auth/Storage models; no real API playback or hosted restore.','No account passwords, original sessions, SMTP, PIN or Push settings restored.']};
 }catch{
  // Database errors can contain private values. Never propagate SQL detail or archive filenames.
  throw Error('Die lokale Wiederherstellungsprobe ist fehlgeschlagen. Archiv, Schema und Zuordnungen müssen geprüft werden.');
 }finally{try{if(db)await db.close();}finally{if(folder)await fs.rm(folder,{recursive:true,force:true});}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 if(process.argv.length!==3){console.error('Usage: node tools/rehearse-content-restore.mjs /private/path/archive.zip');process.exitCode=1;}
 else try{const report=await rehearseContentRestore(process.argv[2]);console.log(JSON.stringify(report,null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
