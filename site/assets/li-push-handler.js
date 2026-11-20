/* li. PWA Web Push display only: static, privacy-safe notification copy.
 * Imported by the existing Workbox sw.js. No private progress or API caching.
 * iOS requires a visible notification for each push event.
 */
self.addEventListener('push',event=>{
 let kind='rest';
 try{
  const value=event.data?event.data.json():null;
  if(value?.v===1&&['study','sleep','movement','rest'].includes(value.kind))
   kind=value.kind;
 }catch{/* Show a neutral notification rather than a silent push. */}
 const messages={
  study:'Bài học vẫn ở đây. Khi muốn, quay lại học tiếp nhé.',
  sleep:'Đến giờ nghỉ ngơi rồi. Thư giãn và chuẩn bị ngủ thôi.',
  movement:'Đổi tư thế, đứng dậy vận động nhẹ nếu tiện nhé.',
  rest:'Nghỉ một nhịp cũng được. Lão Lý giữ chỗ cho bạn.'
 };
 event.waitUntil(self.registration.showNotification('li. · Lão Lý nhắc khẽ',{
  body:messages[kind],icon:'/li/assets/apple-touch-icon.png',
  badge:'/li/assets/apple-touch-icon.png',
  tag:'li-reminder',renotify:false,
  data:{url:'/li/'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=new URL('/li/',self.location.origin).href;
 event.waitUntil((async()=>{
  const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const current=all.find(c=>new URL(c.url).origin===self.location.origin&&
   new URL(c.url).pathname.startsWith('/li/'));
  if(current){await current.focus();return;}
  await self.clients.openWindow(url);
 })());
});
