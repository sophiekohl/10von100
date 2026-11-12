/* Synthetic fixtures ONLY. Runs exclusively against a disposable loopback Supabase. */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
const work=process.env.LOCAL_STACK_DIR,statusPath=process.env.LOCAL_STACK_STATUS;
assert.ok(work&&statusPath,'Local stack paths required');
const status=JSON.parse(await fs.readFile(statusPath,'utf8'));
const envelope=status.result||status; const config=envelope.env||envelope;
const api=config.API_URL||config.api_url||config.apiUrl;
const anon=config.ANON_KEY||config.anon_key,service=config.SERVICE_ROLE_KEY||config.service_role_key;
if(!api||!anon||!service){console.error('Unsupported local status keys:',Object.keys(config));process.exit(1);}
const origin=new URL(api);assert.ok(['127.0.0.1','localhost','[::1]'].includes(origin.hostname)&&origin.protocol==='http:');
const uuid=id=>{assert.match(id,/^[a-f0-9-]{36}$/);return "'"+id+"'";};
async function sql(text){const file=path.join(work,'local-fixture.sql');await fs.writeFile(file,text,{mode:0o600});execFileSync('supabase',['--workdir',work,'db','query','--file',file],{stdio:'pipe',timeout:60000});}
async function raw(url,options={}){const target=new URL(url,api);assert.equal(target.origin,origin.origin);return fetch(target,{...options,redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(20000)});}
async function request(p,token=service,options={}){const r=await raw(p,{...options,headers:{apikey:anon,Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});if(!r.ok)throw Error('Local request failed: '+p.split('?')[0]+' status '+r.status+' '+(await r.text()).slice(0,350));const text=await r.text();return text?JSON.parse(text):null;}
async function createUser(label){const password=randomUUID()+randomUUID(),email=label+'-'+randomUUID()+'@example.invalid';const x=await request('/auth/v1/admin/users',service,{method:'POST',body:JSON.stringify({email,password,email_confirm:true})});return {id:x.id||x.user.id,email,password};}
async function login(user){return request('/auth/v1/token?grant_type=password',anon,{method:'POST',body:JSON.stringify({email:user.email,password:user.password})});}
const root=path.resolve('.');
let baseline=await fs.readFile('tests/baseline.sql','utf8');
baseline=baseline.slice(baseline.indexOf('create table public.content_items'),baseline.indexOf('-- Test-only Vault model'));
baseline=baseline.replace(/grant usage on schema public,auth,storage[^\n]+/,'grant usage on schema public to anon,authenticated,service_role; grant select,insert,update,delete on all tables in schema public to authenticated,service_role;');
await sql('set check_function_bodies=off;\n'+baseline);
for(const file of (await fs.readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')&&!n.includes('partner_web_push')).sort())await sql(await fs.readFile('supabase/migrations/'+file,'utf8'));
// Push runtime/cron migration intentionally NOT installed. No production-bound workers or SMTP.
await sql("notify pgrst, 'reload schema';");
const admin=await createUser('admin'),partner=await createUser('partner'),outsider=await createUser('outsider');
// PIN configuration requires the dedicated partner address convention.
await request('/auth/v1/admin/users/'+partner.id,service,{method:'PUT',body:JSON.stringify({email:'partner-'+randomUUID()+'@10von100.invalid',email_confirm:true})}).then(x=>partner.email=x.email||x.user.email);
await sql('insert into public.admin_users(user_id) values('+uuid(admin.id)+'); select public.partner_pin_configure('+uuid(partner.id)+",'4826',false);");
const a=await login(admin),p=await login(partner),o=await login(outsider);
const claims=JSON.parse(Buffer.from(p.access_token.split('.')[1],'base64url').toString());
await sql('select public.partner_pin_register('+uuid(partner.id)+',(select revision from private.partner_access),'+uuid(claims.session_id)+');');
for(const id of ['content','moments','teasers'])await request('/storage/v1/bucket',service,{method:'POST',body:JSON.stringify({id,name:id,public:false})});
const ids=Array.from({length:10},()=>randomUUID());
const items=[{id:ids[0],title:'SYNTHETIC OPEN',body:'Synthetic letter',kind:'ueberraschung',published:true,unlock_at:'2020-01-01T09:00:00Z'},{id:ids[1],title:'SYNTHETIC FUTURE',body:'Hidden until 2099',kind:'hinweis',published:true,unlock_at:'2099-01-01T09:00:00Z'},{id:ids[2],title:'SYNTHETIC DRAFT',body:'Never published',kind:'erinnerung',published:false,unlock_at:'2020-01-01T09:00:00Z'}];
const token=a.access_token;
// Schema cache reload is asynchronous: retry only a harmless read, never a mutation.
for(let i=0;i<15;i++){const r=await raw('/rest/v1/content_items?select=id',{headers:{apikey:anon,Authorization:'Bearer '+token}});if(r.ok)break;if(i===14)throw Error('Local schema cache unavailable');await new Promise(resolve=>setTimeout(resolve,1000));}
const insert=(table,rows)=>request('/rest/v1/'+table,token,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(rows)});
await insert('content_items',items);
await insert('year_moments',[{id:ids[3],caption:'SYNTHETIC MEMORY',moment_date:'2026-11-08',created_by:admin.id}]);
await insert('calendar_ranges',[{id:ids[4],start_date:'2026-12-09',end_date:'2026-12-12'}]);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=','base64');
const media=items.map((item,i)=>({bucket:'content',path:item.id+'/test.png',record:{id:ids[5+i],content_item_id:item.id,media_type:'image',storage_path:item.id+'/test.png',sort_order:0}}));
media.push({bucket:'moments',path:admin.id+'/'+ids[3]+'/test.png',record:{id:ids[8],moment_id:ids[3],storage_path:admin.id+'/'+ids[3]+'/test.png',sort_order:0}});
async function upload(bucket,name,bytes=png){const r=await raw('/storage/v1/object/'+bucket+'/'+name,{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+token,'Content-Type':'image/png'},body:bytes});assert.ok(r.ok,'Local private upload failed');}
for(const m of media){await upload(m.bucket,m.path);await insert(m.bucket==='content'?'content_media':'moment_photos',[m.record]);}
const context={window:{},TextEncoder,Uint8Array,Uint32Array,DataView,Blob,crypto};vm.runInNewContext(await fs.readFile('backup.js','utf8'),context);
const archive=await context.window.AppBackup.build({request:path=>request(path,token),download:async(bucket,name)=>{const r=await raw('/storage/v1/object/authenticated/'+bucket+'/'+name,{headers:{apikey:anon,Authorization:'Bearer '+token}});assert.ok(r.ok);return new Uint8Array(await r.arrayBuffer());}});
const archivePath=path.join(work,'synthetic.zip');await fs.writeFile(archivePath,new Uint8Array(await archive.blob.arrayBuffer()))
execFileSync('python3',['tools/verify-content-backup.py',archivePath],{stdio:'pipe'});
// Remove ONLY the synthetic local fixtures, then restore from the generated ZIP.
for(const bucket of ['content','moments'])await request('/storage/v1/object/'+bucket,token,{method:'DELETE',body:JSON.stringify({prefixes:media.filter(m=>m.bucket===bucket).map(m=>m.path)})});
for(const table of ['content_media','moment_photos','content_items','year_moments','calendar_ranges'])await request('/rest/v1/'+table+'?id=not.is.null',token,{method:'DELETE'});
assert.equal((await request('/rest/v1/content_items?select=id',token)).length,0);
const unpack=path.join(work,'restored');await fs.mkdir(unpack);
execFileSync('python3',['-c',"import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])",archivePath,unpack],{stdio:'pipe'}); // own verified synthetic archive only
const restored=JSON.parse(await fs.readFile(path.join(unpack,'data.json'),'utf8'));
for(const table of ['content_items','year_moments','calendar_ranges','content_media','moment_photos'])if(restored[table].length)await insert(table,restored[table]);
for(const m of media){const bytes=await fs.readFile(path.join(unpack,'media',m.bucket,m.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(png).digest('hex'));await upload(m.bucket,m.path,bytes);}
async function signed(bucket,name,bearer){return raw('/storage/v1/object/sign/'+bucket+'/'+name,{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:120})});}
for(const m of media){const r=await signed(m.bucket,m.path,token);assert.ok(r.ok);const s=await r.json();const signedURL=new URL(s.signedURL.startsWith('/object/')?'/storage/v1'+s.signedURL:s.signedURL,api+'/storage/v1/');const downloaded=await raw(signedURL);assert.ok(downloaded.ok);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),png);}
assert.equal((await request('/rest/v1/content_items?select=id',p.access_token)).length,1);
assert.equal((await request('/rest/v1/year_moments?select=id',p.access_token)).length,1);
assert.equal((await request('/rest/v1/content_items?select=id',o.access_token)).length,0);
assert.equal((await signed('content',media[0].path,p.access_token)).ok,true);
for(const m of media.slice(1,3))assert.equal((await signed(m.bucket,m.path,p.access_token)).ok,false);
assert.equal((await signed('moments',media[3].path,p.access_token)).ok,true);
assert.equal((await signed('content',media[0].path,o.access_token)).ok,false);
const publicFile=await raw('/storage/v1/object/public/content/'+media[0].path);assert.equal(publicFile.ok,false);
const schedule=await request('/rest/v1/rpc/public_surprise_schedule',anon,{method:'POST',body:'{}'});assert.ok(schedule.every(r=>!('title' in r)&&!('body' in r)&&r.id!==ids[2]));
// Auth server logout really revokes its session; private access must fail immediately.
await request('/auth/v1/logout?scope=local',p.access_token,{method:'POST'});
const revoked=await raw('/rest/v1/content_items?select=id',{headers:{apikey:anon,Authorization:'Bearer '+p.access_token}});assert.ok(!revoked.ok||(await revoked.json()).length===0);
assert.equal((await signed('content',media[0].path,p.access_token)).ok,false);
console.log('PASS: real local Auth login/logout, private Storage upload/download/signing, ZIP export/restore, future/draft/outsider protection and immediate session revocation.');
console.log('Synthetic fixtures only. No production changes, hosted recovery, email or push delivery tested.');
