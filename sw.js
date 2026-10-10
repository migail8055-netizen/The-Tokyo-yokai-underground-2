const CACHE='tokyo-yokai-awakening-v1';
const SHELL=['./','./index.html','./style.css','./app.js','./manifest.json'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(SHELL);self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET')return;
  if(u.origin===location.origin){event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response;}).catch(()=>caches.match('./index.html'))));}
  else if(u.hostname==='unpkg.com'){event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(c=>c.put(event.request,response.clone()));return response;})));}
});
