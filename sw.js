const CACHE='10von100-v5';
const ASSETS=['./','./index.html','./core.js','./partner.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('10von100-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
if(e.request.method!=='GET'||u.origin!==self.location.origin||u.search||!ASSETS.some(a=>new URL(a,self.registration.scope).pathname===u.pathname))return;
// Cache only the public shell; never Auth, APIs, Studio, private media or signed URLs.
e.respondWith(fetch(e.request,{cache:'no-cache'}).catch(async()=>await caches.match(e.request)||Response.error()));
});
