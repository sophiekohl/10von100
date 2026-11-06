import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM,VirtualConsole} from 'jsdom';import fs from 'node:fs';import {webcrypto} from 'node:crypto';
const root=new URL('../',import.meta.url), uid='22222222-2222-4222-8222-222222222222';
const saved={access_token:'partner-token',refresh_token:'refresh-token',expires_in:3600,user:{id:uid}};
async function open({studio=false,admin=false,uploadFailure=false,restore=false,hiddenCalendar=false}={}){
 const errors=[],calls=[],moments=[],items=[];
 const html=fs.readFileSync(new URL(studio?'studio/index.html':'index.html',root),'utf8');
 const dom=new JSDOM(html,{url:'https://sophiekohl.github.io/10von100/'+(studio?'studio/':''),runScripts:'outside-only',virtualConsole:new VirtualConsole().on('jsdomError',e=>errors.push(e.message))});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.prompt=()=>null;Object.defineProperty(w,'crypto',{value:webcrypto});
 w.localStorage.setItem('introSeen','1');if(restore)(studio?w.sessionStorage:w.localStorage).setItem(studio?'studioSession':'10von100_partner_session',JSON.stringify({...saved,expires_at:Date.now()/1000+3600}));
 w.fetch=async(url,opts={})=>{const p=new URL(url).pathname;let body;try{body=JSON.parse(opts.body)}catch{}const method=opts.method||'GET';calls.push({p,method,body,headers:opts.headers});let data=[];
 if(p.endsWith('/partner-pin'))data=saved;
 else if(p.endsWith('public_surprise_schedule'))data=[...(hiddenCalendar?[]:[{id:'open',unlock_at:'2020-01-01T09:00:00Z'}]),{id:'future',unlock_at:'2099-01-18T23:00:00Z'}];
 else if(p.endsWith('public_calendar_ranges'))data=[{start_date:'2026-11-10',end_date:'2026-11-13'}];
 else if(p.endsWith('is_couple_member'))data=true;
 else if(p.endsWith('public_unlocked_surprises'))data=[{id:'open',title:'TEST OPEN',body:'',unlock_at:hiddenCalendar?'2026-11-15T09:00:00Z':'2020-01-01T09:00:00Z'}];
 else if(p.endsWith('unlocked_couple_media'))data=[{id:'media',content_item_id:'open',media_type:'image',storage_path:'only-open/photo.png',sort_order:0}];
 else if(p.includes('/object/sign/'))data={signedURL:'/object/sign/content/test.png?token=test'};
 else if(p.includes('/object/')&&method==='POST'){if(uploadFailure)return new Response('{}',{status:500});data={Key:'test'};}
 else if(p==='/auth/v1/user')data={id:uid};
 else if(p.endsWith('/admin_users'))data=admin?[{user_id:uid}]:[];
 else if(p.endsWith('/year_moments')){if(method==='POST'){moments.push({...body,id:'memory',moment_photos:[]});data=[moments.at(-1)]}else if(method==='PATCH'){Object.assign(moments[0],body);data=null}else if(method==='DELETE'){moments.length=0;data=null}else data=moments;}
 else if(p.endsWith('/content_items')){if(method==='POST'){items.push({...body,id:'item'});data=[items.at(-1)]}else if(method==='PATCH'){Object.assign(items[0],body);data=null}else data=items;}
 else if(p.endsWith('/logout'))data=null;
 return data===null?new Response(null,{status:204}):new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
 };
 w.eval(fs.readFileSync(new URL('core.js',root),'utf8'));
 w.eval(studio?html.split('<script>').at(-1).split('</script>')[0]:fs.readFileSync(new URL('partner.js',root),'utf8'));
 const tick=()=>new Promise(r=>setTimeout(r,15));await tick();return {dom,w,doc:w.document,calls,moments,items,errors,tick};
}
async function login(ctx){ctx.doc.getElementById('authPin').value='4826';await ctx.doc.getElementById('authLogin').onclick();}
test('public DOM is neutral, private endpoints are not requested, Berlin date is used',async()=>{const x=await open();try{assert.equal(x.doc.querySelectorAll('#giftcards .card').length,2);assert.ok(!x.doc.getElementById('giftcards').textContent.includes('TEST OPEN'));assert.ok(x.doc.getElementById('giftcards').textContent.includes('19. Januar 2099'));assert.ok(!x.calls.some(c=>c.p.endsWith('public_unlocked_surprises')));assert.deepEqual(x.errors,[]);}finally{x.dom.window.close()}});
test('PIN login, media-only brief, persistent session and logout scrub',async()=>{const x=await open();try{await login(x);assert.equal(x.doc.getElementById('authSignedIn').hidden,false);assert.equal(x.doc.getElementById('authPin').value,'');assert.ok(!JSON.stringify(x.w.localStorage).includes('4826'));const card=x.doc.querySelector('#giftcards .opened');await card.onclick();assert.equal(x.doc.getElementById('detailTitle').textContent,'TEST OPEN');assert.equal(x.doc.querySelectorAll('#detailMedia img').length,1);assert.ok(x.w.localStorage.getItem('10von100_partner_session').includes('refresh-token'));await x.doc.getElementById('authLogout').onclick();assert.equal(x.doc.getElementById('detailMedia').children.length,0);assert.ok(!x.doc.getElementById('giftcards').textContent.includes('TEST OPEN'));assert.equal(x.doc.getElementById('authBox').hidden,false);}finally{x.dom.window.close()}});
test('restored partner session opens without another PIN',async()=>{const x=await open({restore:true});try{assert.equal(x.doc.getElementById('authSignedIn').hidden,false);assert.ok(x.doc.querySelector('#giftcards .opened'));assert.ok(!x.calls.some(c=>c.p.endsWith('/partner-pin')));}finally{x.dom.window.close()}});
test('memory create, load, edit and delete',async()=>{const x=await open();try{await login(x);x.doc.getElementById('addMoment').onclick();x.doc.getElementById('momentCaption').value='TEST memory';await x.doc.getElementById('saveMoment').onclick();assert.ok(x.doc.getElementById('momentList').textContent.includes('TEST memory'));x.w.prompt=()=>'<img onerror=alert(1)> edited';await [...x.doc.querySelectorAll('#momentList button')].find(b=>b.textContent==='Text bearbeiten').onclick();assert.ok(x.doc.getElementById('momentList').textContent.includes('<img onerror=alert(1)> edited'));assert.equal(x.doc.querySelectorAll('#momentList img').length,0);await [...x.doc.querySelectorAll('#momentList button')].find(b=>b.textContent==='Entfernen').onclick();assert.equal(x.moments.length,0);}finally{x.dom.window.close()}});
test('Studio denies a valid partner session',async()=>{const x=await open({studio:true,restore:true});try{assert.ok(x.doc.getElementById('studio').classList.contains('hidden'));assert.ok(x.doc.getElementById('loginMsg').textContent.includes('Kein Studio-Zugriff'));assert.equal(x.w.sessionStorage.getItem('studioSession'),null);}finally{x.dom.window.close()}});
test('Studio default draft, explicit publication only after all media succeed',async()=>{const x=await open({studio:true,admin:true,restore:true});try{assert.ok(!x.doc.getElementById('studio').classList.contains('hidden'));assert.equal(x.doc.getElementById('published').checked,false);for(const [id,value] of Object.entries({title:'TEST title',body:'TEST body',date:'2099-01-18',time:'09:00'}))x.doc.getElementById(id).value=value;x.doc.getElementById('published').checked=true;x.doc.getElementById('save').click();await x.tick();const writes=x.calls.filter(c=>c.p.endsWith('/content_items')&&c.method!=='GET');assert.equal(writes[0].body.published,false);assert.equal(writes.at(-1).body.published,true);assert.equal(writes[0].body.unlock_at,'2099-01-18T08:00:00.000Z');assert.equal(x.doc.getElementById('published').checked,false);}finally{x.dom.window.close()}});
test('Studio upload error never publishes',async()=>{const x=await open({studio:true,admin:true,restore:true,uploadFailure:true});try{for(const [id,value] of Object.entries({title:'TEST title',body:'TEST body',date:'2099-01-18',time:'09:00'}))x.doc.getElementById(id).value=value;x.doc.getElementById('published').checked=true;Object.defineProperty(x.doc.getElementById('media'),'files',{value:[new x.w.File(['TEST'],'test.jpg',{type:'image/jpeg'})]});x.doc.getElementById('media').dispatchEvent(new x.w.Event('change'));x.doc.getElementById('save').click();await x.tick();assert.equal(x.items[0].published,false);assert.ok(!x.calls.some(c=>c.p.endsWith('/content_items')&&c.body?.published===true));assert.ok(x.doc.getElementById('saveMsg').textContent.includes('privater Entwurf'));}finally{x.dom.window.close()}});
test('Studio administers memories',async()=>{const x=await open({studio:true,admin:true,restore:true});try{x.doc.getElementById('adminMomentCaption').value='TEST admin memory';await x.doc.getElementById('adminMomentSave').onclick();assert.ok(x.doc.getElementById('adminMomentList').textContent.includes('TEST admin memory'));x.w.prompt=()=> 'TEST changed';await [...x.doc.querySelectorAll('#adminMomentList button')].find(b=>b.textContent==='Text bearbeiten').onclick();assert.ok(x.doc.getElementById('adminMomentList').textContent.includes('TEST changed'));await [...x.doc.querySelectorAll('#adminMomentList button')].find(b=>b.textContent==='Erinnerung löschen').onclick();assert.equal(x.moments.length,0);}finally{x.dom.window.close()}});

test('calendar excludes an unlocked item whose calendar flag is off',async()=>{const x=await open({restore:true,hiddenCalendar:true});try{x.doc.getElementById('openCal').onclick();assert.equal(x.doc.querySelectorAll('#grid .event').length,4);assert.ok(x.doc.querySelector('#giftcards .opened'));}finally{x.dom.window.close()}});

test('Studio ignores an edit response arriving after logout',async()=>{
 const x=await open({studio:true,admin:true,restore:true});try{
  const originalFetch=x.w.fetch;let release;
  const waiting=new Promise(resolve=>{release=resolve});
  x.w.fetch=async(url,options)=>url.includes('/content_items?id=eq.late')?waiting:originalFetch(url,options);
  const edit=x.w.editItem('late');await x.tick();
  x.doc.getElementById('logout').click();await x.tick();
  release(new Response(JSON.stringify([{id:'late',title:'PRIVATE late response',body:'PRIVATE body',unlock_at:'2099-01-18T08:00:00Z'}])));
  await edit;assert.equal(x.doc.getElementById('title').value,'');assert.equal(x.doc.getElementById('body').value,'');assert.ok(x.doc.getElementById('studio').classList.contains('hidden'));
 }finally{x.dom.window.close()}
});
