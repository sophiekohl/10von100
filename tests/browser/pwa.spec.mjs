import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'allow'});
test('installable manifest and real offline shell cache only public assets',async({page,context,browserName},testInfo)=>{
 await page.route('https://estgcmkrlcrwwcrphvsy.supabase.co/**',r=>r.fulfill({json:[]}));
 await page.goto('/');
 const manifest=await page.evaluate(async()=>{const link=document.querySelector('link[rel=manifest]');return fetch(link.href).then(r=>r.json())});
 expect(manifest.display).toBe('standalone');expect(manifest.scope).toBe('./');expect(manifest.start_url).toBe('./');expect(manifest.icons.map(i=>i.sizes)).toEqual(['192x192','512x512']);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await page.evaluate(()=>fetch('https://estgcmkrlcrwwcrphvsy.supabase.co/rest/v1/content_items',{headers:{Authorization:'Bearer TEST'}}));
 const cached=await page.evaluate(async()=>{const out=[];for(const key of await caches.keys()){const c=await caches.open(key);for(const r of await c.keys())out.push(new URL(r.url).pathname+new URL(r.url).search)}return out});
 expect(cached).toContain('/wedding.jpg');expect(cached.some(x=>x.includes('content_items')||x.includes('storage/v1')||x.includes('studio')||x.includes('?'))).toBe(false);
 await context.setOffline(true);
 if(browserName==='chromium')await page.reload({waitUntil:'domcontentloaded'});
 else testInfo.annotations.push({type:'known-test-environment-limitation',description:'WebKit offline-emulated navigation fails before the Service Worker, microsoft/playwright#42775 and #34402. Cache/controller/offline UI are checked here; offline reload still requires the physical iPhone.'});
 await expect(page.locator('#intro')).toBeVisible();await expect(page.locator('#connectionMsg')).toBeVisible();await expect(page.locator('#connectionMsg')).toContainText('offline');await expect(page.locator('#privateApp')).toBeHidden();
 await expect.poll(()=>page.locator('#intro .welcomePhoto img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await context.setOffline(false);
});
