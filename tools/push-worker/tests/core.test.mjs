import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validClock,validZone,validSubscription,allowedPushEndpoint,
 dueForPush,duePushSlots,claimDays,validSchedules,localMinute,safeAccountJwt,endpointId} from '../src/core.mjs';
test('five-minute clock window respects owner timezone and avoids repeat within day',()=>{
 const row={enabled:1,kind:'sleep',local_time:'21:00',zone:'Asia/Ho_Chi_Minh',last_day:null};
 const due=new Date('2026-11-21T14:02:00Z');
 assert.deepEqual(localMinute(due,'Asia/Ho_Chi_Minh'),{day:'2026-11-21',time:'21:02'});
 assert.equal(dueForPush(row,new Date('2026-11-21T13:59:00Z')),null);
 assert.equal(dueForPush(row,due),'2026-11-21');
 assert.equal(dueForPush({...row,last_day:'2026-11-21'},due),null);
 assert.equal(dueForPush(row,new Date('2026-11-21T14:06:00Z')),null);
 assert.equal(dueForPush({...row,enabled:0},due),null);
 assert.equal(dueForPush({...row,zone:'Invalid/Location'},due),null);
 assert.equal(dueForPush({...row,kind:'bad'},due),null);
 assert.equal(dueForPush({...row,local_time:'03:00'},due),null);
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
 const saturday=new Date('2026-11-21T14:02:00Z');
 assert.deepEqual(duePushSlots(row,saturday).map(s=>s.kind),['study','movement']);
 const claimed={...row,last_day:claimDays(row,duePushSlots(row,saturday))};
 assert.deepEqual(duePushSlots(claimed,saturday),[]);
 const monday=new Date('2026-11-23T14:02:00Z');
 assert.deepEqual(duePushSlots(claimed,monday).map(s=>s.kind),['study','sleep','rest']);
 assert.deepEqual(duePushSlots({...row,local_time:'{"version":2,"schedules":[]}'},monday),[]);
});
test('legacy push receipts remain valid when migrating existing subscriptions',()=>{
 const old={enabled:1,kind:'sleep',local_time:'21:00',
  zone:'Asia/Ho_Chi_Minh',last_day:'2026-11-21'};
 const now=new Date('2026-11-21T14:02:00Z');
 assert.deepEqual(duePushSlots(old,now),[]);
 assert.deepEqual(duePushSlots({...old,last_day:null},now),[{kind:'sleep',day:'2026-11-21'}]);
});
