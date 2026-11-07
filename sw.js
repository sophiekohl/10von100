const CACHE='10von100-v11';
const ASSETS=['./','./index.html','./core.js','./partner.js','./push.js','./manifest.webmanifest','./icon-infinity-192.png','./icon-infinity-512.png','./wedding.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('10von100-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
if(e.request.method!=='GET'||u.origin!==self.location.origin||u.search||!ASSETS.some(a=>new URL(a,self.registration.scope).pathname===u.pathname))return;
// Cache only the public shell; never Auth, APIs, Studio, private media or signed URLs.
e.respondWith(fetch(e.request,{cache:'no-cache'}).catch(async()=>await caches.match(e.request)||Response.error()));
});

// Payloads are encrypted in transit; never display caller-supplied titles, images or URLs.
const PUSH_ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
self.addEventListener('push',event=>{let data={};try{data=event.data?.json()||{}}catch{}
const id=PUSH_ID.test(data.itemId||'')?data.itemId:null;
event.waitUntil(self.registration.showNotification('10 / 100',{body:data.test?'Deine Testnachricht ist da. ♡':'Etwas wartet auf dich. ♡',icon:new URL('icon-infinity-192.png',self.registration.scope).href,tag:id?'surprise-'+id:'10von100-test',data:{itemId:id},...(id?{renotify:false}:{})}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();const id=event.notification.data?.itemId;
event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const target=new URL(self.registration.scope);if(PUSH_ID.test(id||''))target.searchParams.set('surprise',id);
for(const client of windows){const url=new URL(client.url);if(url.origin===target.origin&&url.pathname===target.pathname){await client.focus();if(PUSH_ID.test(id||''))client.postMessage({type:'OPEN_SURPRISE',id});return;}}
await self.clients.openWindow(target.href);})());
});
