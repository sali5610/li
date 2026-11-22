import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validClock,validZone,validSubscription,allowedPushEndpoint,
 dueForPush,duePushSlots,claimDays,withoutDays,newlySnoozedKinds,validSchedules,localMinute,safeAccountJwt,endpointId} from '../src/core.mjs';
import {sendDue} from '../src/index.mjs';
test('minute Cron sends one minute early, catches late ticks, never repeats',()=>{
 const row={enabled:1,kind:'sleep',local_time:'21:00',zone:'Asia/Ho_Chi_Minh',last_day:null};
 const date=minute=>new Date('2026-11-21T'+minute+':00Z');
 assert.deepEqual(localMinute(date('13:59'),'Asia/Ho_Chi_Minh'),{day:'2026-11-21',time:'20:59'});
 assert.equal(dueForPush(row,date('13:58')),null);
 assert.equal(dueForPush(row,date('13:59')),'2026-11-21');
 assert.equal(dueForPush(row,date('14:00')),'2026-11-21');
 assert.equal(dueForPush(row,date('14:01')),'2026-11-21');
 assert.equal(dueForPush(row,date('14:02')),null);
 assert.equal(dueForPush({...row,last_day:'2026-11-21'},date('14:00')),null);
 assert.equal(dueForPush({...row,enabled:0},date('13:59')),null);
 assert.equal(dueForPush({...row,zone:'Invalid/Location'},date('13:59')),null);
 assert.equal(dueForPush({...row,kind:'bad'},date('13:59')),null);
 assert.equal(dueForPush({...row,local_time:'03:00'},date('13:59')),null);
});
test('one-minute lead crosses local midnight and respects tomorrow weekday',()=>{
 const monday={enabled:1,kind:'study',local_time:'00:00',
  zone:'Asia/Ho_Chi_Minh',last_day:null};
 const sunday2359=new Date('2026-11-22T16:59:00Z');
 assert.equal(dueForPush(monday,new Date('2026-11-22T16:58:00Z')),null);
 assert.equal(dueForPush(monday,sunday2359),'2026-11-23');
 assert.equal(dueForPush({...monday,last_day:'2026-11-23'},sunday2359),null);
 const lastMinute={...monday,local_time:'23:59'};
 assert.equal(dueForPush(lastMinute,new Date('2026-11-22T16:58:00Z')),'2026-11-22');
 assert.equal(dueForPush(lastMinute,new Date('2026-11-22T17:00:00Z')),'2026-11-22');
});
test('strict time, timezone, HTTPS push-service allowlist and keys',()=>{
 assert.equal(validClock('00:00'),true);
 assert.equal(validClock('23:59'),true);
 assert.equal(validClock('24:00'),false);
 assert.equal(validZone('Asia/Ho_Chi_Minh'),true);
 assert.equal(validZone('unknown/zone'),false);
 assert.equal(allowedPushEndpoint('https://web.push.apple.com/abc'),true);
 assert.equal(allowedPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'),true);
 assert.equal(allowedPushEndpoint('http://127.0.0.1/push'),false);
 assert.equal(allowedPushEndpoint('https://example.com/'),false);
 assert.equal(allowedPushEndpoint('https://web.push.apple.com.evil.test/'),false);
 const s={endpoint:'https://web.push.apple.com/abc',
  keys:{p256dh:'A'.repeat(87),auth:'A'.repeat(22)}};
 assert.equal(validSubscription(s),true);
 assert.equal(validSubscription({...s,endpoint:'http://localhost:5000'}),false);
 assert.equal(validSubscription({...s,keys:{p256dh:'',auth:''}}),false);
});
test('identity extraction not a signature check; remote invite RPC remains mandatory',async()=>{
 const payload=Buffer.from(JSON.stringify({sub:'invited-owner',exp:4102444800})).toString('base64url');
 const token='eyJhbGciOiJub25lIn0.'+payload+'.signature';
 assert.equal(safeAccountJwt(token),'invited-owner');
 assert.equal(safeAccountJwt('bad.token'),null);
 const id=await endpointId('https://web.push.apple.com/abc');
 assert.equal(id.length,64);
 assert.doesNotMatch(id,/apple\.com|\/abc/);
});
test('PWA reuses existing Workbox and only shows generic notification content',()=>{
 const root=new URL('../../../',import.meta.url);
 const sw=readFileSync(new URL('tools/platform/workbox-config.cjs',root),'utf8');
 const handler=readFileSync(new URL('site/assets/li-push-handler.js',root),'utf8');
 const worker=readFileSync(new URL('tools/push-worker/src/index.mjs',root),'utf8');
 assert.match(sw,/importScripts:\["assets\/li-push-handler\.js"\]/);
 assert.match(handler,/addEventListener\('push'/);
 assert.match(handler,/registration\.showNotification/);
 assert.match(handler,/addEventListener\('notificationclick'/);
 assert.match(worker,/rpc\/li_is_invited/);
 assert.match(worker,/existing\.owner_id!==account/);
 assert.match(worker,/UPDATE push_subscriptions SET last_day=/);
 assert.doesNotMatch(handler,/localStorage|indexedDB|Neon|JWT|noteDetail|healthScore/);
});

test('four independent push schedules repeat on chosen local weekdays',()=>{
 const kinds=['study','sleep','movement','rest'];
 const schedules=kinds.map(kind=>({kind,enabled:true,time:'21:00',frequency:'daily',days:[]}));
 schedules[1].frequency='weekdays';
 schedules[2].frequency='weekends';
 schedules[3].frequency='custom';schedules[3].days=[1,3,5];
 assert.equal(validSchedules(schedules),true);
 assert.equal(validSchedules([...schedules.slice(0,3),schedules[0]]),false);
 assert.equal(validSchedules(schedules.map(s=>s.kind==='rest'?{...s,days:[7]}:s)),false);
 const row={enabled:1,kind:'study',local_time:JSON.stringify({version:2,schedules}),
  zone:'Asia/Ho_Chi_Minh',last_day:null};
 const saturday=new Date('2026-11-21T13:59:00Z');
 assert.deepEqual(duePushSlots(row,saturday).map(s=>s.kind),['study','movement']);
 const claimed={...row,last_day:claimDays(row,duePushSlots(row,saturday))};
 assert.deepEqual(duePushSlots(claimed,saturday),[]);
 const monday=new Date('2026-11-23T13:59:00Z');
 assert.deepEqual(duePushSlots(claimed,monday).map(s=>s.kind),['study','sleep','rest']);
 assert.deepEqual(duePushSlots({...row,local_time:'{"version":2,"schedules":[]}'},monday),[]);
});
test('legacy push receipts remain valid when migrating existing subscriptions',()=>{
 const old={enabled:1,kind:'sleep',local_time:'21:00',
  zone:'Asia/Ho_Chi_Minh',last_day:'2026-11-21'};
 const now=new Date('2026-11-21T13:59:00Z');
 assert.deepEqual(duePushSlots(old,now),[]);
 assert.deepEqual(duePushSlots({...old,last_day:null},now),[{kind:'sleep',day:'2026-11-21'}]);
});

test('snooze delays Push across midnight and preserves other kind receipts',()=>{
 const deadline=new Date('2026-11-22T17:40:00Z').getTime(); // Mon 00:40 ICT
 const schedules=['study','sleep','movement','rest'].map(kind=>({
  kind,enabled:kind==='study',time:'23:40',frequency:'weekends',days:[],
  snoozedUntil:kind==='study'?deadline:0
 }));
 assert.equal(validSchedules(schedules),true);
 assert.equal(validSchedules(schedules.map(s=>({...s,snoozedUntil:-1}))),false);
 const previous={...schedules[0],snoozedUntil:0};
 const oldTime=JSON.stringify({version:2,schedules:[previous,...schedules.slice(1)]});
 assert.deepEqual(newlySnoozedKinds(oldTime,schedules,deadline-60*60_000),['study']);
 assert.deepEqual(newlySnoozedKinds(JSON.stringify({version:2,schedules}),schedules,deadline-60*60_000),[]);
 const record={enabled:1,kind:'study',local_time:JSON.stringify({version:2,schedules}),
  zone:'Asia/Ho_Chi_Minh',last_day:JSON.stringify({study:'2026-11-22',sleep:'2026-11-22'})};
 const unclaimed={...record,last_day:withoutDays(record,['study'])};
 assert.deepEqual(JSON.parse(unclaimed.last_day),{sleep:'2026-11-22'});
 assert.deepEqual(duePushSlots(unclaimed,new Date('2026-11-22T16:39:00Z')),[]);
 assert.deepEqual(duePushSlots(unclaimed,new Date('2026-11-22T17:39:00Z')),
  [{kind:'study',day:'2026-11-23'}]);
 assert.deepEqual(duePushSlots({...unclaimed,last_day:claimDays(unclaimed,
  duePushSlots(unclaimed,new Date('2026-11-22T17:39:00Z')))},
  new Date('2026-11-22T17:40:00Z')),[]);
});

function fakeDeliveryDb(rows){
 return {prepare(sql){
  if(sql.includes('FROM push_subscriptions WHERE enabled=1'))
   return {all:async()=>({results:rows.filter(r=>r.enabled).map(r=>({...r}))})};
  if(sql.startsWith('UPDATE push_subscriptions SET last_day='))
   return {bind:(next,id,old)=>({run:async()=>{
    const row=rows.find(r=>r.id===id);
    if(!row||row.last_day!==old)return {meta:{changes:0}};
    row.last_day=next;
    return {meta:{changes:1}};
   }})};
  if(sql.startsWith('DELETE FROM push_subscriptions'))
   return {bind:id=>({run:async()=>{
    const row=rows.find(r=>r.id===id);
    if(row)row.enabled=0;
    return {success:true};
   }})};
  throw Error('Unexpected SQL in mock: '+sql);
 }};
}
const fakeEnv=rows=>({PUSH_DB:fakeDeliveryDb(rows),VAPID_PUBLIC_KEY:'public',
 VAPID_PRIVATE_KEY:'private',VAPID_SUBJECT:'mailto:qa@example.test',
 NEON_DATA_API_URL:'https://example.test',ALLOWED_ORIGIN:'https://li5610.pages.dev'});
const makeRow=id=>({id:'qa-'+id,endpoint:'https://web.push.apple.com/test',
 p256dh:'a',auth:'a',kind:'study',local_time:'21:00',
 zone:'Asia/Ho_Chi_Minh',enabled:1,last_day:null});

test('every subscribed device is considered (more than the former LIMIT 60)',async()=>{
 const rows=Array.from({length:65},(_,i)=>makeRow(i));
 const sent=[];
 const when=new Date('2026-11-21T13:59:00Z');
 await sendDue(fakeEnv(rows),when,async row=>{sent.push(row.id);return {ok:true,status:201};});
 assert.equal(sent.length,65);
 assert.equal(new Set(sent).size,65);
 assert.equal(rows.every(r=>JSON.parse(r.last_day).study==='2026-11-21'),true);
 await sendDue(fakeEnv(rows),when,async row=>{sent.push(row.id);return {ok:true,status:201};});
 assert.equal(sent.length,65,'successfully claimed notifications must not repeat');
});

test('explicit rejected Push retries only failed kind; accepted kind never duplicates',async()=>{
 const kinds=['study','sleep','movement','rest'];
 const schedules=kinds.map(kind=>({kind,enabled:['study','sleep'].includes(kind),
  time:'21:00',frequency:'daily',days:[]}));
 const row=makeRow(0);
 row.local_time=JSON.stringify({version:2,schedules});
 const rows=[row];
 const accepted=[];
 const at='2026-11-21T';
 await sendDue(fakeEnv(rows),new Date(at+'13:59:00Z'),async(_row,slot)=>{
  if(slot.kind==='sleep')return {ok:false,status:503};
  accepted.push(slot.kind);
  return {ok:true,status:201};
 });
 assert.deepEqual(accepted,['study']);
 assert.deepEqual(JSON.parse(row.last_day),{study:'2026-11-21'});
 await sendDue(fakeEnv(rows),new Date(at+'14:00:00Z'),async(_row,slot)=>{
  accepted.push(slot.kind);
  return {ok:true,status:201};
 });
 assert.deepEqual(accepted,['study','sleep']);
 assert.deepEqual(JSON.parse(row.last_day),{study:'2026-11-21',sleep:'2026-11-21'});
 await sendDue(fakeEnv(rows),new Date(at+'14:01:00Z'),async(_row,slot)=>{
  accepted.push(slot.kind);return {ok:true,status:201};
 });
 assert.equal(accepted.length,2);
});

test('ambiguous provider timeout keeps claim rather than risk duplicate Push',async()=>{
 const rows=[makeRow('unknown')];
 const when=new Date('2026-11-21T13:59:00Z');
 let attempts=0;
 await sendDue(fakeEnv(rows),when,async()=>{attempts++;throw Error('ack lost');});
 await sendDue(fakeEnv(rows),new Date('2026-11-21T14:00:00Z'),async()=>{
  attempts++;return {ok:true,status:201};
 });
 assert.equal(attempts,1);
});
