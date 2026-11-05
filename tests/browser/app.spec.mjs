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
async function login(page){await page.getByRole('button',{name:'Für dich',exact:true}).click();await page.locator('#authPin').fill('4826');await page.locator('#authLogin').click();await expect(page.locator('#authSignedIn')).toBeVisible();await expect(page.getByRole('button',{name:/GEÖFFNET/})).toBeVisible();}
test('signed out requests only neutral schedule; locks and Berlin dates',async({page})=>{const {calls}=await mock(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Für dich',exact:true}).click();await expect(page.locator('#giftcards .card')).toHaveCount(2);await expect(page.locator('#giftcards')).not.toContainText('Freigeschaltet');expect(calls.some(c=>c.p.endsWith('public_unlocked_surprises'))).toBe(false);await expect(page.locator('#giftcards')).toContainText('19. Januar 2099');expect(errors).toEqual([]);});
test('PIN persists standard session, reload keeps it, media-only letters open and logout scrubs content',async({page})=>{const {calls}=await mock(page);await page.goto('/');await login(page);await page.getByRole('button',{name:/GEÖFFNET/}).click();await expect(page.locator('#detailMedia img')).toBeVisible();await expect(page.locator('#detailTitle')).toHaveText('Freigeschaltet ♡');await page.locator('#closeDetail').click();await page.reload();await page.getByRole('button',{name:'Für dich',exact:true}).click();await expect(page.locator('#authSignedIn')).toBeVisible();expect(calls.filter(c=>c.p.endsWith('/partner-pin')).length).toBe(1);expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('4826');await page.locator('#authLogout').click();await expect(page.locator('#authBox')).toBeVisible();await expect(page.locator('#detailMedia')).toBeEmpty();await expect(page.locator('#giftcards')).not.toContainText('Freigeschaltet');});
test('memory creation reload edit delete',async({page})=>{await mock(page);await page.goto('/');await login(page);await page.getByRole('button',{name:'Unser Jahr',exact:true}).click();await page.locator('#addMoment').click();await page.locator('#momentCaption').fill('Ein schöner Moment');await page.locator('#saveMoment').click();await expect(page.locator('#momentList')).toContainText('Ein schöner Moment');page.once('dialog',d=>d.accept('Eine neue Erinnerung'));await page.getByRole('button',{name:'Text bearbeiten'}).click();await expect(page.locator('#momentList')).toContainText('Eine neue Erinnerung');await page.reload();await page.getByRole('button',{name:'Unser Jahr',exact:true}).click();await expect(page.locator('#momentList')).toContainText('Eine neue Erinnerung');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Entfernen',exact:true}).click();await expect(page.locator('#momentList')).not.toContainText('Eine neue Erinnerung');});
test('PIN account is refused Studio',async({page})=>{await mock(page);await page.addInitScript(s=>sessionStorage.setItem('studioSession',JSON.stringify({...s,expires_at:Math.floor(Date.now()/1000)+3600})),session);await page.goto('/studio/');await expect(page.locator('#studio')).toBeHidden();await expect(page.locator('#loginMsg')).toContainText('Kein Studio-Zugriff');});
test('Studio uploads remain draft until all work succeeds',async({page})=>{const {calls,items}=await mock(page,{admin:true,uploadFailure:true});await page.addInitScript(s=>sessionStorage.setItem('studioSession',JSON.stringify({...s,expires_at:Math.floor(Date.now()/1000)+3600})),session);await page.goto('/studio/');await expect(page.locator('#studio')).toBeVisible();await page.locator('#title').fill('TEST surprise');await page.locator('#body').fill('TEST private letter');await page.locator('#date').fill('2099-01-18');await page.locator('#published').check();await page.locator('#media').setInputFiles({name:'test.jpg',mimeType:'image/jpeg',buffer:Buffer.from('test')});await page.locator('#save').click();await expect(page.locator('#saveMsg')).toContainText('privater Entwurf');expect(items[0].published).toBe(false);expect(calls.some(c=>c.p==='/rest/v1/content_items'&&c.body?.published===true)).toBe(false);});
test('iPhone viewport has no horizontal overflow and calendar marks whole range',async({page})=>{await mock(page);await page.goto('/');await page.locator('#openCal').click();await expect(page.locator('#calendar')).toBeVisible();await expect(page.locator('#grid .event')).toHaveCount(4);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('#closeCal').click();await page.screenshot({path:'test-results/iphone-home.png',fullPage:true});});

test('Studio saved entries can be reopened, edited and deleted without publishing drafts',async({page})=>{
 const {items}=await mock(page,{admin:true});
 await page.addInitScript(s=>sessionStorage.setItem('studioSession',JSON.stringify({...s,expires_at:Math.floor(Date.now()/1000)+3600})),session);
 await page.goto('/studio/');await expect(page.locator('#studio')).toBeVisible();
 await page.locator('#title').fill('Privater Entwurf');await page.locator('#body').fill('Nur im Studio sichtbar');await page.locator('#date').fill('2099-01-18');await page.locator('#save').click();
 await expect(page.locator('#scheduleList')).toContainText('Privater Entwurf');
 await page.reload();await page.locator('#scheduleList').getByRole('button',{name:'Bearbeiten',exact:true}).click();
 await expect(page.locator('#body')).toHaveValue('Nur im Studio sichtbar');await expect(page.locator('#date')).toHaveValue('2099-01-18');await expect(page.locator('#time')).toHaveValue('09:00');
 await page.locator('#title').fill('Überarbeiteter Entwurf');await page.locator('#save').click();await expect(page.locator('#scheduleList')).toContainText('Überarbeiteter Entwurf');expect(items[0].published).toBe(false);
 page.once('dialog',d=>d.accept());await page.locator('#scheduleList').getByRole('button',{name:'Löschen',exact:true}).click();await expect(page.locator('#scheduleList')).toContainText('Noch keine Beiträge');expect(items).toHaveLength(0);
});
test('Studio date fields and header fit the iPhone screen',async({page},testInfo)=>{
 await mock(page,{admin:true});await page.addInitScript(s=>sessionStorage.setItem('studioSession',JSON.stringify({...s,expires_at:Math.floor(Date.now()/1000)+3600})),session);
 await page.goto('/studio/');await expect(page.locator('#studio')).toBeVisible();
 await page.locator('#date').fill('2027-01-18');await page.locator('#rangeStart').fill('2027-01-18');await page.locator('#rangeEnd').fill('2027-01-20');
 for(const width of [393,320]){await page.setViewportSize({width,height:852});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const id of ['date','time','rangeStart','rangeEnd']){const box=await page.locator('#'+id).boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);}}
 await page.setViewportSize({width:393,height:852});await page.screenshot({path:testInfo.outputPath('iphone-studio.png'),fullPage:true});
});
