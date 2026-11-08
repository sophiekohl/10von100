import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {rehearseContentRestore} from '../tools/rehearse-content-restore.mjs';
const context={window:{},TextEncoder,Uint8Array,Uint32Array,DataView,Blob,crypto};
vm.runInNewContext(await fs.readFile(new URL('../backup.js',import.meta.url),'utf8'),context);
async function archive({invalid=false}={}){
 const ids=Array.from({length:12},()=>randomUUID());const created_at='2026-11-01T12:00:00.000Z';
 const item=(id,published,unlock_at)=>({id,title:'SYNTHETIC SECRET',body:'Not a real letter; SQL characters: \'; drop table public.content_items; --',kind:'ueberraschung',unlock_at,teaser_mode:'none',teaser_image_path:null,calendar_visible:true,push_enabled:true,created_at,updated_at:created_at,published});
 const rows={content_items:[item(ids[0],true,'2020-01-01T09:00:00.000Z'),item(ids[1],true,'2099-01-01T09:00:00.000Z'),item(ids[2],false,'2020-01-01T09:00:00.000Z')],content_media:[],year_moments:[{id:ids[3],caption:'Synthetic memory',moment_date:'2026-11-01',include_in_recap:true,created_by:ids[4],created_at}],moment_photos:[{id:ids[5],moment_id:ids[3],storage_path:ids[4]+'/'+ids[3]+'/Ä.png',sort_order:0,created_at,caption:null}],calendar_ranges:[{id:ids[6],start_date:'2026-12-09',end_date:'2026-12-12',created_at}]};
 rows.content_items[1].teaser_mode='image';rows.content_items[1].teaser_image_path=ids[1]+'/teaser.png';
 for(let i=0;i<3;i++)rows.content_media.push({id:ids[7+i],content_item_id:ids[i],media_type:'image',storage_path:ids[i]+'/photo.png',caption:null,sort_order:0,created_at,youtube_video_id:null,deezer_kind:null,deezer_id:null});
 rows.content_media.push({id:ids[10],content_item_id:ids[0],media_type:'youtube',storage_path:null,caption:null,sort_order:1,created_at,youtube_video_id:'abcdefghijk',deezer_kind:null,deezer_id:null});
 rows.content_media.push({id:ids[11],content_item_id:ids[0],media_type:'deezer',storage_path:null,caption:null,sort_order:2,created_at,youtube_video_id:null,deezer_kind:'track',deezer_id:'123'});
 if(invalid)rows.content_items[0].kind='unknown-invalid-kind';
 for(const list of Object.values(rows))list.sort((a,b)=>a.id.localeCompare(b.id));
 const request=async url=>{if(url==='/auth/v1/user')return {id:'test-admin'};if(url.includes('/admin_users'))return [{user_id:'test-admin'}];const u=new URL(url,'https://test.invalid');let result=rows[u.pathname.split('/').at(-1)];if(u.searchParams.has('id'))result=result.filter(r=>r.id>u.searchParams.get('id').slice(3));return result.slice(0,2);};
 const result=await context.window.AppBackup.build({request,download:async()=>new Uint8Array([0,1,2,255])});return new Uint8Array(await result.blob.arrayBuffer());
}
test('a full exported ZIP restores into new local PostgreSQL and private media model with RLS checks',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'restore-test-'));
 const originalFetch=globalThis.fetch;let networkCalls=0;globalThis.fetch=()=>{networkCalls++;throw Error('Network forbidden during rehearsal');};
 try{const file=path.join(dir,'synthetic.zip');await fs.writeFile(file,await archive());const result=await rehearseContentRestore(file);
 assert.equal(result.status,'passed');assert.equal(result.counts.content_items,3);assert.equal(result.counts.content_media,5);assert.equal(result.media_count,5);assert.equal(result.checks.length,6);assert.equal(networkCalls,0);
 }finally{globalThis.fetch=originalFetch;await fs.rm(dir,{recursive:true,force:true});}
});
test('invalid database rows fail without logging private values or a success report',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'restore-test-'));
 try{const file=path.join(dir,'invalid.zip');await fs.writeFile(file,await archive({invalid:true}));await assert.rejects(rehearseContentRestore(file),error=>!error.message.includes('SYNTHETIC SECRET')&&error.message.includes('fehlgeschlagen'));}
 finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('damaged archive fails closed before content restoration',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'restore-test-'));
 try{const file=path.join(dir,'damaged.zip');await fs.writeFile(file,new Uint8Array([1,2,3]));await assert.rejects(rehearseContentRestore(file),/fehlgeschlagen/);}
 finally{await fs.rm(dir,{recursive:true,force:true});}
});
