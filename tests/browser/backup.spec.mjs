import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
const user='22222222-2222-4222-8222-222222222222';
async function studio(page,{missing=false,deny=false,slow=false}={}){
 const calls=[];let release;const blocked=new Promise(r=>release=r);
 await page.addInitScript(user=>sessionStorage.setItem('studioSession',JSON.stringify({access_token:'test-admin-token',refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:user}})),user);
 const data={content_items:[{id:'a',title:'Synthetic future surprise',body:'Private draft test',kind:'hinweis',published:false,unlock_at:'2099-01-01T09:00:00Z',calendar_visible:true}],content_media:[{id:'b',content_item_id:'a',media_type:'image',storage_path:'a/test.png'}],year_moments:[],moment_photos:[],calendar_ranges:[]};
 await page.route('https://estgcmkrlcrwwcrphvsy.supabase.co/**',async route=>{
 const req=route.request(),url=new URL(req.url());calls.push({path:url.pathname,method:req.method(),headers:req.headers()});
 if(url.pathname==='/auth/v1/user')return route.fulfill({json:{id:user}});
 if(url.pathname.endsWith('/admin_users'))return route.fulfill({json:deny?[]:[{user_id:user}]});
 if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204});
 if(url.pathname.startsWith('/storage/v1/object/authenticated/')){
  if(slow)await blocked;
  return route.fulfill(missing?{status:404,json:{error:'missing'}}:{status:200,contentType:'image/png',body:Buffer.from([0,1,2,255])}).catch(()=>{});
 }
 const table=url.pathname.split('/').at(-1);
 if(data[table])return route.fulfill({json:url.searchParams.has('id')?[]:data[table]});
 return route.fulfill({json:[]});
 });
 await page.goto('/studio/');return {calls,release};
}
test('admin downloads a complete private archive with authenticated originals',async({page},testInfo)=>{
 const {calls}=await studio(page);await expect(page.locator('#studio')).toBeVisible();await page.locator('#backupPanel summary').click();await page.locator('#backupStart').click();await expect(page.locator('#backupMsg')).toContainText('Bereit: 1 Beiträge');await expect(page.locator('#backupDownload')).toBeVisible();
 const event=page.waitForEvent('download');await page.locator('#backupDownload').click();const download=await event;expect(download.suggestedFilename()).toMatch(/^10von100-inhalte-.*\.zip$/);const file=testInfo.outputPath('synthetic-content.zip');await download.saveAs(file);
 expect(execFileSync('python3',['tools/verify-content-backup.py',file],{encoding:'utf8'})).toContain('OK:');
 const media=calls.filter(c=>c.path.startsWith('/storage/v1/object/authenticated/'));expect(media).toHaveLength(1);expect(media[0].headers.authorization).toBe('Bearer test-admin-token');expect(calls.every(c=>c.method==='GET')).toBe(true);
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('Private draft test');
 await page.screenshot({path:testInfo.outputPath('studio-backup.png'),fullPage:true});
 await page.locator('#logout').click();await expect(page.locator('#studio')).toBeHidden();await expect(page.locator('#backupDownload')).toBeHidden();await expect(page.locator('#backupMsg')).toBeEmpty();
});
test('missing original gives an actionable error with no partial download',async({page})=>{
 await studio(page,{missing:true});await page.locator('#backupPanel summary').click();await page.locator('#backupStart').click();await expect(page.locator('#backupMsg')).toContainText('Keine Sicherungsdatei');await expect(page.locator('#backupDownload')).toBeHidden();await expect(page.locator('#backupStart')).toBeEnabled();
});
test('logout aborts an in-flight export and cannot reveal a download later',async({page})=>{
 const {calls,release}=await studio(page,{slow:true});await page.locator('#backupPanel summary').click();await page.locator('#backupStart').click();await expect.poll(()=>calls.some(c=>c.path.includes('/object/authenticated/'))).toBe(true);await page.locator('#logout').click();release();await expect(page.locator('#studio')).toBeHidden();await expect(page.locator('#backupDownload')).toBeHidden();await expect(page.locator('#backupMsg')).toBeEmpty();
});
test('partner or unknown account never receives the export UI or originals',async({page})=>{
 const {calls}=await studio(page,{deny:true});await expect(page.locator('#studio')).toBeHidden();expect(calls.some(c=>c.path.includes('/object/authenticated/'))).toBe(false);await expect(page.locator('#loginMsg')).toContainText('Kein Studio-Zugriff');
});
