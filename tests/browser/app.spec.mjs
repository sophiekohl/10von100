import {test,expect} from '@playwright/test';
const id='11111111-1111-4111-8111-111111111111',user='22222222-2222-4222-8222-222222222222';
const session={access_token:'partner-token',refresh_token:'refresh-token',expires_in:3600,user:{id:user}};
async function mock(page,{admin=false,uploadFailure=false}={}){await page.clock.install({time:new Date('2026-11-05T12:00:00Z')});
  const calls=[],moments=[],items=[];
 await page.addInitScript(()=>localStorage.setItem('introSeen','1'));
 await page.route('https://estgcmkrlcrwwcrphvsy.supabase.co/**',async route=>{const r=route.request(),url=new URL(r.url()),p=url.pathname,b=r.postDataJSON?.bind(r);let body;try{body=b()}catch{}if (r.method()==='GET' && p.includes('/object/sign/')) return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1kAAAAASUVORK5CYII=','base64')});
      calls.push({p,method:r.method(),body,auth:r.headers().authorization});let result=[];
 if(p.endsWith('/partner-pin'))result=session;
 else if(p.endsWith('public_surprise_schedule'))result=[{id,unlock_at:'2020-01-01T09:00:00Z',is_unlocked:true},{id:'future',unlock_at:'2099-01-18T23:00:00Z',is_unlocked:false}];
 else if(p.endsWith('public_calendar_ranges'))result=[{start_date:'2026-11-10',end_date:'2026-11-13'}];
 else if(p.endsWith('is_couple_member'))result=true;
 else if(p.endsWith('public_unlocked_surprises'))result=[{id,title:'Freigeschaltet ♡',body:'',unlock_at:'2020-01-01T09:00:00Z',kind:'erinnerung'}];
 else if(p.endsWith('unlocked_couple_media'))result=[{id:'media',content_item_id:id,media_type:'image',storage_path:'only-open/photo.png',sort_order:0}];
 else if(p.includes('/object/sign/'))result={signedURL:'/object/sign/content/test.png?token=private'};
 else if(p.includes('/object/')&&r.method()==='POST'){if(uploadFailure)return route.fulfill({status:500,json:{error:'TEST upload failure'}});result={Key:'test'};}
 else if(p==='/auth/v1/user')result={id:user};
 else if(p==='/rest/v1/admin_users')result=admin?[{user_id:user}]:[];
 else if(p==='/rest/v1/year_moments'){
  if(r.method()==='POST'){moments.push({...body,id:'memory',moment_photos:[]});result=[moments.at(-1)];}
  else if(r.method()==='PATCH'){Object.assign(moments[0],body);result=null;}
  else if(r.method()==='DELETE'){moments.length=0;result=null;}
  else result=moments;
 }
 else if(p==='/rest/v1/content_items'){
  if(r.method()==='POST'){items.push({...body,id});result=[items.at(-1)];}
  else if(r.method()==='PATCH'){Object.assign(items[0],body);result=null;}
  else if(r.method()==='DELETE'){items.length=0;result=null;}
  else result=items;
 }
 else if(p==='/auth/v1/logout')return route.fulfill({status:204});
 return route.fulfill({status:result===null?204:200,...(result===null?{}:{json:result})});
 });return {calls,moments,items};}

async function enter(page){await page.locator('#begin').click();for(const n of ['4','8','2','6'])await page.locator('#pinGate').getByRole('button',{name:n,exact:true}).click();await page.locator('#authLogin').click();await expect(page.locator('#privateApp')).toBeVisible();}
test('welcome preserves full letter and gates all navigation',async({page})=>{const {calls}=await mock(page);await page.goto('/');await expect(page.locator('#intro')).toBeVisible();await expect(page.locator('#intro')).toContainText('100 Jahre.');await expect(page.locator('#intro')).toContainText('Noch 90 vor uns.');await expect(page.locator('#privateApp')).toBeHidden();await expect(page.locator('#privateNav')).toBeHidden();expect(calls.some(c=>c.p.endsWith('public_unlocked_surprises'))).toBe(false);await page.locator('#begin').click();await expect(page.locator('#pinGate')).toBeVisible();await page.locator('#backWelcome').click();await expect(page.locator('#intro')).toBeVisible();});
test('one PIN opens every section, reload resumes without new login',async({page})=>{const {calls}=await mock(page);await page.goto('/');await enter(page);await page.getByRole('button',{name:'Für dich',exact:true}).click();await expect(page.locator('#giftcards')).toContainText('Freigeschaltet');await page.getByRole('button',{name:'Unser Jahr',exact:true}).click();await expect(page.locator('#addMoment')).toBeEnabled();await page.reload();await expect(page.locator('#privateApp')).toBeVisible();await expect(page.locator('#intro')).toBeHidden();expect(calls.filter(c=>c.p.endsWith('/partner-pin'))).toHaveLength(1);expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('4826');});
test('incorrect PIN leaves the entire app closed',async({page})=>{await mock(page);await page.route('**/functions/v1/partner-pin',route=>route.fulfill({status:401,json:{error:'Anmeldung nicht möglich.'}}));await page.goto('/');await page.locator('#begin').click();for(let i=0;i<4;i++)await page.locator('#pinGate').getByRole('button',{name:'1',exact:true}).click();await page.locator('#authLogin').click();await expect(page.locator('#authMsg')).toContainText('Anmeldung nicht möglich');await expect(page.locator('#privateApp')).toBeHidden();await expect(page.locator('#authPin')).toHaveValue('');});
test('logout closes app and scrubs private media and collage',async({page})=>{await mock(page);await page.goto('/');await enter(page);await page.getByRole('button',{name:'Für dich',exact:true}).click();await page.getByRole('button',{name:/GEÖFFNET/}).click();await expect(page.locator('#detailMedia img')).toBeVisible();await page.locator('#closeDetail').click();await page.locator('#info').click();await expect(page.locator('#intro')).toContainText('Himmelhochzeit');await page.getByRole('button',{name:'Auf diesem Gerät abmelden'}).click();await expect(page.locator('#privateApp')).toBeHidden();await expect(page.locator('#privateNav')).toBeHidden();await expect(page.locator('#intro')).toBeVisible();await expect(page.locator('#detailMedia')).toBeEmpty();expect(await page.evaluate(()=>localStorage.getItem('10von100_partner_session'))).toBeNull();});
test('Home fits iPhone with portrait photo, surprise and calendar visible',async({page})=>{await mock(page);await page.goto('/');await enter(page);for(const height of [650,740,852]){await page.setViewportSize({width:393,height});const d=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight,height:innerHeight,button:document.querySelector('#openCal').getBoundingClientRect().bottom,nav:document.querySelector('.nav').getBoundingClientRect().top}));expect(d.scroll).toBeLessThanOrEqual(d.height);expect(d.button).toBeLessThanOrEqual(d.nav);}const photo=await page.locator('.homePortrait img').boundingBox();expect(photo.height).toBeGreaterThan(photo.width);});
test('memory create edit delete survives unified gate',async({page})=>{await mock(page);await page.goto('/');await enter(page);await page.getByRole('button',{name:'Unser Jahr',exact:true}).click();await page.locator('#addMoment').click();await page.locator('#momentCaption').fill('Unser Testmoment');await page.locator('#saveMoment').click();await expect(page.locator('#momentList')).toContainText('Unser Testmoment');page.once('dialog',d=>d.accept('Bearbeitet'));await page.getByRole('button',{name:'Text bearbeiten'}).click();await expect(page.locator('#momentList')).toContainText('Bearbeitet');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Entfernen',exact:true}).click();await expect(page.locator('#momentList')).not.toContainText('Bearbeitet');});
test('expired or revoked session closes the complete app',async({page})=>{await mock(page);await page.goto('/');await enter(page);await page.route('**/rpc/is_couple_member',route=>route.fulfill({json:false}));await page.reload();await expect(page.locator('#intro')).toBeVisible();await expect(page.locator('#privateApp')).toBeHidden();await expect(page.locator('#privateNav')).toBeHidden();});
test('partner account still cannot enter Studio',async({page})=>{await mock(page);await page.addInitScript(s=>sessionStorage.setItem('studioSession',JSON.stringify({...s,expires_at:Math.floor(Date.now()/1000)+3600})),session);await page.goto('/studio/');await expect(page.locator('#studio')).toBeHidden();await expect(page.locator('#loginMsg')).toContainText('Kein Studio-Zugriff');});

test('welcome letter contrast and full screen visual evidence',async({page},testInfo)=>{
 await mock(page);await page.goto('/');
 const values=await page.locator('#intro').evaluate(root=>{const luminance=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};const bg=luminance(getComputedStyle(root).backgroundColor);return [...root.querySelectorAll('p,strong')].filter(n=>n.getClientRects().length).map(n=>{const l=luminance(getComputedStyle(n).color);return(Math.max(l,bg)+.05)/(Math.min(l,bg)+.05)})});
 for(const ratio of values)expect(ratio).toBeGreaterThanOrEqual(4.5);
 expect((await page.locator('#intro .mark').boundingBox()).y).toBeLessThan(90);
 await page.screenshot({path:testInfo.outputPath('01-welcome.png')});
 await page.locator('#begin').click();await page.screenshot({path:testInfo.outputPath('02-pin.png')});
 for(const n of ['4','8','2','6'])await page.locator('#pinGate').getByRole('button',{name:n,exact:true}).click();await page.locator('#authLogin').click();await expect(page.locator('#privateApp')).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('03-home.png')});
 await page.getByRole('button',{name:'Für dich',exact:true}).click();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('04-surprises.png')});
 await page.getByRole('button',{name:'Unser Jahr',exact:true}).click();await page.screenshot({path:testInfo.outputPath('05-year.png')});
});

test('Studio recovery requests one email and explains a provider rate limit',async({page})=>{
 await mock(page);let sends=0;await page.route('**/auth/v1/recover?*',route=>{sends++;return route.fulfill({status:429,json:{message:'email rate limit exceeded'}})});
 await page.goto('/studio/');await page.locator('#email').fill('admin-test@example.invalid');await page.locator('#recover').click();await expect(page.locator('#loginMsg')).toContainText('Versandlimit');expect(sends).toBe(1);await expect(page.locator('#recover')).toBeDisabled();await expect(page.locator('#magic')).toBeDisabled();
});
test('Admin configures password privately, validates confirmation and clears fields',async({page})=>{
 const {calls}=await mock(page,{admin:true});await page.addInitScript(s=>sessionStorage.setItem('studioSession',JSON.stringify({...s,expires_at:Math.floor(Date.now()/1000)+3600})),session);
 await page.goto('/studio/');await expect(page.locator('#studio')).toBeVisible();await page.locator('#studioAccount summary').click();
 await page.locator('#newStudioPassword').fill('Fictional-test-passphrase-12');await page.locator('#repeatStudioPassword').fill('Different-test-passphrase-12');await page.locator('#saveStudioPassword').click();await expect(page.locator('#studioPasswordMsg')).toContainText('stimmen');expect(calls.filter(c=>c.p==='/auth/v1/user'&&c.method==='PUT')).toHaveLength(0);
 await page.locator('#repeatStudioPassword').fill('Fictional-test-passphrase-12');await page.locator('#saveStudioPassword').click();await expect(page.locator('#studioPasswordMsg')).toContainText('ist gespeichert');expect(calls.filter(c=>c.p==='/auth/v1/user'&&c.method==='PUT')).toHaveLength(1);
 await expect(page.locator('#newStudioPassword')).toHaveValue('');await expect(page.locator('#repeatStudioPassword')).toHaveValue('');expect(await page.evaluate(()=>JSON.stringify(localStorage)+JSON.stringify(sessionStorage))).not.toContain('Fictional-test-passphrase-12');
});
test('Real callback page removes tokens from URL and opens password setup after recovery',async({page})=>{
 await mock(page,{admin:true});await page.goto('/studio/#access_token=admin-test-token&refresh_token=test-refresh&expires_in=3600&type=recovery');await expect(page.locator('#studio')).toBeVisible();await expect(page.locator('#studioAccount')).toHaveAttribute('open','');await expect(page.locator('#studioPasswordMsg')).toContainText('festlegen');expect(page.url()).not.toContain('access_token');await expect(page.locator('#newStudioPassword')).toBeVisible();
});

test('new moment form opens above a long feed, remains editable and closes after save',async({page})=>{
 const {moments}=await mock(page);
 for(let i=0;i<20;i++)moments.push({id:'old-'+i,caption:'Bestehender Moment '+i,moment_date:'2026-11-01',created_by:user,moment_photos:[]});
 await page.goto('/');await enter(page);await page.getByRole('button',{name:'Unser Jahr',exact:true}).click();await page.locator('#addMoment').click();
 await expect(page.locator('#addMoment')).toHaveAttribute('aria-expanded','true');await expect(page.locator('#upload')).toBeVisible();
 const position=await page.evaluate(()=>({direct:document.getElementById('addMoment').nextElementSibling.id,form:document.getElementById('upload').getBoundingClientRect().top,list:document.getElementById('momentList').getBoundingClientRect().top,height:innerHeight}));
 expect(position.direct).toBe('upload');expect(position.form).toBeGreaterThanOrEqual(0);expect(position.form).toBeLessThan(position.height);expect(position.form).toBeLessThan(position.list);
 await page.locator('#momentCaption').fill('Neuer Moment trotz langer Liste');await page.locator('#addMoment').click();await expect(page.locator('#upload')).toBeHidden();await page.locator('#addMoment').click();await expect(page.locator('#momentCaption')).toHaveValue('Neuer Moment trotz langer Liste');await page.locator('#saveMoment').click();
 await expect(page.locator('#momentMsg')).toContainText('Erinnerung gespeichert');await expect(page.locator('#upload')).toBeHidden();await expect(page.locator('#addMoment')).toHaveAttribute('aria-expanded','false');await expect(page.locator('#momentList')).toContainText('Neuer Moment trotz langer Liste');
});

test('media frames and scroll hint respond to actual overflow and reading position',async({page})=>{
 await mock(page);await page.goto('/');await enter(page);await page.getByRole('button',{name:'Für dich',exact:true}).click();await page.getByRole('button',{name:/GEÖFFNET/}).click();await expect(page.locator('#detailMedia img')).toBeVisible();
 const frame=await page.locator('#detailMedia .mediaBlock').evaluate(n=>({border:getComputedStyle(n).borderTopWidth,shadow:getComputedStyle(n).boxShadow}));expect(frame.border).toBe('1px');expect(frame.shadow).not.toBe('none');
 await page.evaluate(()=>{document.getElementById('detailMedia').style.height='2000px';updateDetailCue()});await expect(page.locator('.detailScrollCue')).toBeVisible();
 await page.evaluate(()=>{const panel=document.querySelector('#detail .panel');panel.scrollTop=panel.scrollHeight;panel.dispatchEvent(new Event('scroll'))});await expect(page.locator('.detailScrollCue')).toBeHidden();
 await page.evaluate(()=>{document.getElementById('detailMedia').replaceChildren();document.getElementById('detailMedia').style.height='12px';const panel=document.querySelector('#detail .panel');panel.scrollTop=0;updateDetailCue()});await expect(page.locator('.detailScrollCue')).toBeHidden();
 await page.locator('#closeDetail').click();await expect(page.locator('.detailScrollCue')).toBeHidden();
});

test('push consent is explicit; enable, test and disable are available in info',async({page})=>{
 await mock(page);const actions=[];
 await page.addInitScript(()=>{
 window.pushPermissionCalls=0;let sub=null;
 Object.defineProperty(navigator,'standalone',{value:true,configurable:true});
 Object.defineProperty(window,'PushManager',{value:function(){},configurable:true});
 const notice={permission:'default',requestPermission:async()=>{window.pushPermissionCalls++;notice.permission='granted';return 'granted'}};
 Object.defineProperty(window,'Notification',{value:notice,configurable:true});
 const reg={pushManager:{getSubscription:async()=>sub,subscribe:async()=>{sub={endpoint:'https://web.push.apple.com/test',toJSON:()=>({endpoint:'https://web.push.apple.com/test',keys:{p256dh:'a'.repeat(87),auth:'b'.repeat(22)}}),unsubscribe:async()=>{sub=null;return true}};return sub}}};
 Object.defineProperty(navigator,'serviceWorker',{value:{ready:Promise.resolve(reg),getRegistration:async()=>reg,register:async()=>reg,addEventListener(){}},configurable:true});
 });
 await page.route('**/functions/v1/partner-push',route=>{const data=route.request().postDataJSON();actions.push(data.action);return route.fulfill({json:data.action==='config'?{publicKey:'BA'}:{ok:true}})});
 await page.goto('/');expect(await page.evaluate(()=>window.pushPermissionCalls)).toBe(0);await enter(page);await page.locator('#info').click();await expect(page.locator('#pushSettings')).toBeVisible();expect(await page.evaluate(()=>window.pushPermissionCalls)).toBe(0);
 await page.getByRole('button',{name:'Mitteilungen aktivieren',exact:true}).click();await expect(page.locator('#pushStatus')).toContainText('auf diesem Gerät aktiv');expect(await page.evaluate(()=>window.pushPermissionCalls)).toBe(1);expect(actions).toContain('subscribe');
 await page.getByRole('button',{name:'Testnachricht senden',exact:true}).click();await expect(page.locator('#pushStatus')).toContainText('Push-Dienst');expect(actions).toContain('test');
 await page.getByRole('button',{name:'Mitteilungen ausschalten',exact:true}).click();await expect(page.locator('#pushStatus')).toContainText('ausgeschaltet');expect(actions).toContain('remove');
});
test('notification deep link opens content only after successful PIN gate',async({page})=>{
 await mock(page);await page.goto('/?surprise='+id);await expect(page.locator('#detail')).not.toHaveClass(/show/);expect(page.url()).not.toContain('surprise=');await enter(page);await expect(page.locator('#detail')).toHaveClass(/show/);await expect(page.locator('#detailTitle')).toContainText('Freigeschaltet');
});

test('Push before PIN waits for successful PIN before enrolling the device',async({page})=>{
 await mock(page);const actions=[];let logins=0;
 await page.addInitScript(()=>{
 window.pushPermissionCalls=0;window.pushCreated=0;let sub=null;
 Object.defineProperty(navigator,'standalone',{value:true,configurable:true});Object.defineProperty(window,'PushManager',{value:function(){},configurable:true});
 const notice={permission:'default',requestPermission:async()=>{window.pushPermissionCalls++;notice.permission='granted';return 'granted'}};Object.defineProperty(window,'Notification',{value:notice,configurable:true});
 const reg={pushManager:{getSubscription:async()=>sub,subscribe:async()=>{window.pushCreated++;sub={endpoint:'https://web.push.apple.com/test',toJSON:()=>({endpoint:'https://web.push.apple.com/test',keys:{p256dh:'a'.repeat(87),auth:'b'.repeat(22)}}),unsubscribe:async()=>{sub=null;return true}};return sub}}};
 Object.defineProperty(navigator,'serviceWorker',{value:{ready:Promise.resolve(reg),getRegistration:async()=>reg,register:async()=>reg,addEventListener(){}},configurable:true});
 });
 await page.route('**/functions/v1/partner-push',route=>{const data=route.request().postDataJSON();actions.push(data.action);return route.fulfill({json:data.action==='config'?{publicKey:'BA'}:{ok:true}})});
 await page.route('**/functions/v1/partner-pin',route=>{logins++;return route.fulfill(logins===1?{status:401,json:{error:'PIN nicht korrekt.'}}:{json:session})});
 await page.goto('/');await page.locator('#begin').click();await expect(page.locator('#pinGate #pushSettings')).toBeVisible();
 for(const height of [740,852]){await page.setViewportSize({width:393,height});
 const fit=await page.evaluate(()=>{const gate=document.getElementById('pinGate');gate.scrollTop=0;const button=document.querySelector('#pushSettings button');return {bottom:button.getBoundingClientRect().bottom,openBottom:document.getElementById('authLogin').getBoundingClientRect().bottom,pushBeforePIN:document.getElementById('pushSettings').getBoundingClientRect().top<document.getElementById('gateForm').getBoundingClientRect().top,height:innerHeight,overflow:gate.scrollHeight-gate.clientHeight,targets:[...document.querySelectorAll('.pinKeys button')].map(b=>b.getBoundingClientRect().height),digitSize:parseFloat(getComputedStyle(document.querySelector('.pinKeys button')).fontSize)}});
 expect(fit.bottom).toBeLessThanOrEqual(fit.height-10);expect(fit.openBottom).toBeLessThanOrEqual(fit.height-10);expect(fit.pushBeforePIN).toBe(true);expect(fit.overflow).toBeLessThanOrEqual(1);expect(fit.targets.every(h=>h>=44)).toBe(true);expect(fit.digitSize).toBe(20);
 }
 expect(await page.evaluate(()=>window.pushPermissionCalls)).toBe(0);
 await page.locator('#pushSettings').getByRole('button',{name:'Mitteilungen erlauben',exact:true}).click();await expect(page.locator('#pushStatus')).toContainText('Nach deiner PIN-Anmeldung');await expect(page.locator('#authPin')).toBeFocused();await expect(page.locator('#pushSettings').getByRole('button',{name:'Mitteilungen erlauben',exact:true})).toBeHidden();expect(actions).toEqual([]);expect(await page.evaluate(()=>window.pushCreated)).toBe(0);
 for(const n of ['4','8','2','6'])await page.locator('#pinGate').getByRole('button',{name:n,exact:true}).click();await page.locator('#authLogin').click();await expect(page.locator('#authMsg')).toContainText('PIN nicht korrekt');expect(actions).toEqual([]);await expect(page.locator('#privateApp')).toBeHidden();
 for(const n of ['4','8','2','6'])await page.locator('#pinGate').getByRole('button',{name:n,exact:true}).click();await page.locator('#authLogin').click();await expect(page.locator('#privateApp')).toBeVisible();await page.locator('#info').click();await expect(page.locator('#intro #pushStatus')).toContainText('auf diesem Gerät aktiv');expect(actions).toContain('subscribe');expect(await page.evaluate(()=>window.pushCreated)).toBe(1);expect(await page.evaluate(()=>window.pushPermissionCalls)).toBe(1);
});
