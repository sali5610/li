/* li. PWA Web Push display only: generic copy and no private data/API cache.
 * Workbox imports this handler on both /li/ staging and / Cloudflare PWA.
 * Resolve notification targets from the actual service-worker scope.
 */
function liPushScope(){return new URL(self.registration.scope);}
self.addEventListener('push',event=>{
 let kind='rest';
 try{
  const value=event.data?event.data.json():null;
  if(value?.v===1&&['study','sleep','movement','rest'].includes(value.kind))
   kind=value.kind;
 }catch{/* Always show a neutral visible notification. */}
 const messages={
  study:'Bài học vẫn ở đây. Khi muốn, quay lại học tiếp nhé.',
  sleep:'Đến giờ nghỉ ngơi rồi. Thư giãn và chuẩn bị ngủ thôi.',
  movement:'Đổi tư thế, đứng dậy vận động nhẹ nếu tiện nhé.',
  rest:'Nghỉ một nhịp cũng được. Lão Lý giữ chỗ cho bạn.'
 };
 const scope=liPushScope();
 const icon=new URL('assets/apple-touch-icon.png',scope).pathname;
 event.waitUntil(self.registration.showNotification('li. · Lão Lý nhắc khẽ',{
  body:messages[kind],icon,badge:icon,
  tag:'li-reminder',renotify:false,
  data:{url:scope.pathname}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const scope=liPushScope();
 event.waitUntil((async()=>{
  const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const current=all.find(client=>{
   try{
    const page=new URL(client.url);
    return page.origin===scope.origin&&page.pathname.startsWith(scope.pathname);
   }catch{return false;}
  });
  if(current){await current.focus();return;}
  await self.clients.openWindow(scope.href);
 })());
});
