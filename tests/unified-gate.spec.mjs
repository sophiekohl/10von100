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
