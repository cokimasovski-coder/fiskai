const CACHE="fiskai-v10";
const ASSETS=["./","./index.html","./style.css","./style.css?v=8","./app.js","./app.js?v=8","./sync.js","./gemini.js","./manifest.json","./icon.svg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const req=e.request;if(req.method!=="GET")return;const url=new URL(req.url);if(url.origin!==location.origin)return;e.respondWith(caches.match(req).then(cached=>{if(cached){fetch(req).then(res=>{if(res&&res.ok)caches.open(CACHE).then(c=>c.put(req,res.clone()))}).catch(function(){});return cached}return fetch(req).then(res=>{if(res&&res.ok)caches.open(CACHE).then(c=>c.put(req,res.clone()));return res}).catch(()=>caches.match("./index.html"))}))});
