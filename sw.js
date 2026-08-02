// 小猫工作台 Service Worker v2
// 1) 负责系统通知展示/关闭
// 2) 对 index.html 采用 network-first，避免手机/PWA 缓存旧版页面导致更新不生效
const CACHE_NAME='cat-workbench-v2';

self.addEventListener('install',function(e){
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){return n!==CACHE_NAME;}).map(function(n){return caches.delete(n);})
      );
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  const url=new URL(e.request.url);
  const isNavigation=e.request.mode==='navigate';
  const isRoot=url.pathname==='/'||url.pathname==='/index.html';
  if(isNavigation||isRoot){
    e.respondWith(
      fetch(e.request,{cache:'no-cache'}).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }
});

self.addEventListener('message',function(e){
  var d=e.data;
  if(!d)return;
  if(d.type==='notify'){
    var opts={body:d.body||'',tag:d.tag||'cat-ntf',icon:d.icon||'',badge:d.icon||'',requireInteraction:!!d.requireInteraction};
    e.waitUntil(self.registration.showNotification(d.title||'小猫工作台',opts));
  }else if(d.type==='closeAll'){
    e.waitUntil(self.registration.getNotifications().then(function(ns){ns.forEach(function(n){n.close();});}));
  }else if(d.type==='close'&&d.tag){
    e.waitUntil(self.registration.getNotifications({tag:d.tag}).then(function(ns){ns.forEach(function(n){n.close();});}));
  }
});

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    if(cs&&cs.length){var c=cs[0];if(c.focus)c.focus();if(c.postMessage)c.postMessage({type:'notificationclick',tag:e.notification.tag});return;}
    if(self.clients.openWindow)self.clients.openWindow('/');
  }));
});
