import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare} from 'miniflare';
import {duePushSlots} from '../src/core.mjs';
import {sendDue} from '../src/index.mjs';

const bundlePath=process.env.LI_QA_WORKER_BUNDLE;
if(!bundlePath)throw Error('LOCAL_WORKER_BUNDLE_MISSING');
const bundle=readFileSync(bundlePath,'utf8');
if(!bundle.includes('li_is_invited'))throw Error('WRONG_WORKER_BUNDLE');
const origin='https://li5610.pages.dev';
const neon='https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1';
const headers={Origin:origin,'Content-Type':'application/json'};
const payload=subject=>Buffer.from(JSON.stringify({sub:subject,exp:4102444800})).toString('base64url');
const token=subject=>'eyJhbGciOiJub25lIn0.'+payload(subject)+'.synthetic-invalid-signature';
const schedules=['study','sleep','movement','rest'].map(kind=>({
 kind,enabled:kind==='study',time:kind==='study'?'23:36':'',
 frequency:'daily',days:[],snoozedUntil:0
}));
const requestBody={subscription:{endpoint:'https://web.push.apple.com/qa-synthetic-never-sent',
 keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}},
 enabled:true,kind:'study',time:'23:36',zone:'Asia/Ho_Chi_Minh',schedules};
const dispatch=(mf,subject='qa-owner-a',body=requestBody)=>
 mf.dispatchFetch('https://li-push-qa.example.test/v1/subscriptions',
  {method:'PUT',headers:{...headers,Authorization:'Bearer '+token(subject)},
   body:JSON.stringify(body)});
const config={
 name:'li-push-runtime-qa',compatibilityDate:'2026-11-21',
 env:{
  ALLOWED_ORIGIN:{type:'text',value:origin},
  NEON_DATA_API_URL:{type:'text',value:neon},
  VAPID_PUBLIC_KEY:{type:'text',value:'synthetic-public-key'},
  VAPID_PRIVATE_KEY:{type:'text',value:'synthetic-private-key'},
  VAPID_SUBJECT:{type:'text',value:'mailto:qa@example.invalid'},
  PUSH_DB:{type:'d1'}
 },
 manifest:{mainModule:'index.mjs',
  modules:{'index.mjs':{type:'esm',contents:bundle}}}
};
const mfBase=dev=>new Miniflare({workers:[{config, ...(dev?{dev}:{})}]});
let mode='allow',calls=0,fetchedUrl='',fetchedMethod='';
const fakeNeon={
 type:'fetcher',
 async handler(req){
  calls++;
  fetchedUrl=String(req.url);
  fetchedMethod=req.method;
  assert.equal(fetchedUrl,neon+'/rpc/li_is_invited');
  assert.equal(fetchedMethod,'POST');
  assert.match(req.headers.get('Authorization')||'',/^Bearer /);
  switch(mode){
   case 'allow':return new Response('true',{status:200});
   case 'deny':return new Response('false',{status:200});
   case 'jwt401':return new Response(null,{status:401});
   case 'upstream503':return new Response(null,{status:503});
   case 'redirect302':return Response.redirect('https://example.invalid/no-follow',302);
   case 'malformed':return new Response('{"not":"boolean"}',{status:200});
   case 'throw':throw Error('Synthetic upstream offline');
   default:throw Error('Unknown test mode');
  }
 }
};
const mf=mfBase({outboundService:fakeNeon});
try{
 const db=await mf.getD1Database('PUSH_DB','li-push-runtime-qa');
 const schema=readFileSync(new URL('../db/0001_push_subscriptions.sql',import.meta.url),'utf8');
 for(const sql of schema.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean))
  await db.prepare(sql).run();
 const count=async()=>Number((await db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').first()).n);
 const check=async (name,expected,sub='qa-owner-a')=>{
  const response=await dispatch(mf,sub);
  assert.equal(response.status,expected,name);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  if(response.status!==200)assert.deepEqual(await response.json(),{ok:false});
  console.log('WORKERD_BUNDLE_PASS '+name+' HTTP '+response.status);
 };
 const unauthorized=await mf.dispatchFetch('https://li-push-qa.example.test/v1/subscriptions',
   {method:'PUT',headers:{...headers,Authorization:'Bearer invalid'},body:'{}'});
 assert.equal(unauthorized.status,401);
 assert.equal(calls,0,'invalid syntax must not even call Neon');
 console.log('WORKERD_BUNDLE_PASS early invalid-JWT 401 no RPC');
 await check('valid-invite-writes-isolated-D1',200);
 assert.equal(await count(),1,'first subscription stored in real local D1');
 await check('idempotent-retry-same-owner',200);
 assert.equal(await count(),1,'retry no duplicate');
 for(const [testMode,status] of [
  ['deny',403],['jwt401',401],['upstream503',503],
  ['redirect302',503],['malformed',503],['throw',503]
 ]){
  mode=testMode;
  await check('fail-closed-'+testMode,status,'qa-owner-b');
  assert.equal(await count(),1,'refused attempts never mutate D1');
 }
 mode='allow';
 await check('cross-owner-subscription-reuse-denied',403,'qa-owner-b');
 assert.equal(await count(),1);

// Full real workerd PUT -> isolated D1 receipt reset -> same scheduling function
// used by the Cron handler. No external Apple endpoint or live user data.
{
 const now=new Date();
 function clockParts(zone,date){
  const items=new Intl.DateTimeFormat('en-CA',{timeZone:zone,
   year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',
   minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const get=kind=>items.find(part=>part.type===kind)?.value;
  return {day:get('year')+'-'+get('month')+'-'+get('day'),
   minute:Number(get('hour'))*60+Number(get('minute'))};
 }
 // Try HCMC first; choose a deterministic fallback away from midnight so
 // the same test also works when a human reruns CI at 23:59 local time.
 const zones=['Asia/Ho_Chi_Minh','UTC','Pacific/Honolulu'];
 const zone=zones.find(z=>{const m=clockParts(z,now).minute;return m>=12&&m<1430});
 assert.ok(zone,'no zone suitable for deterministic same-day fixture');
 const {day,minute}=clockParts(zone,now);
 const fmt=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 const oldTime=fmt(minute-7),futureTime=fmt(minute+5),pastTime=fmt(minute-2);
 const before=schedules.map(s=>({...s,enabled:s.kind==='study'||s.kind==='sleep',
  time:s.kind==='study'||s.kind==='sleep'?oldTime:''}));
 const after=before.map(s=>s.kind==='study'?{...s,time:futureTime}:s);
 const body=items=>({...requestBody,zone,time:items.find(s=>s.kind==='study').time,
  schedules:items});
 const newRequest=body(before),laterRequest=body(after);
 const first=await dispatch(mf,'qa-owner-a',newRequest);
 assert.equal(first.status,200,'real workerd initial schedule PUT');
 const subscribed=await db.prepare(
  'SELECT id,kind,local_time,zone,last_day FROM push_subscriptions LIMIT 1'
 ).first();
 const already=JSON.stringify({study:day,sleep:day});
 await db.prepare('UPDATE push_subscriptions SET last_day=? WHERE id=?')
  .bind(already,subscribed.id).run();
 const edited=await dispatch(mf,'qa-owner-a',laterRequest);
 assert.equal(edited.status,200,'real workerd future reschedule PUT');
 const getRow=()=>db.prepare(
  'SELECT id,endpoint,p256dh,auth,kind,local_time,zone,enabled,last_day FROM push_subscriptions WHERE id=?'
 ).bind(subscribed.id).first();
 const rearmed=await getRow();
 assert.equal(rearmed.zone,zone);
 assert.deepEqual(JSON.parse(rearmed.last_day),{sleep:day},
  'only the manually rescheduled kind is rearmed; sleep stays delivered');
 assert.equal(JSON.parse(rearmed.local_time).schedules.find(s=>s.kind==='study').time,futureTime);
 const mockSent=[];
 const localEnv={PUSH_DB:db,VAPID_PUBLIC_KEY:'synthetic-public',
  VAPID_PRIVATE_KEY:'synthetic-private',VAPID_SUBJECT:'mailto:qa@example.invalid',
  NEON_DATA_API_URL:neon,ALLOWED_ORIGIN:origin};
 const scheduledAt=new Date(now.getTime()+4*60_000);
 assert.deepEqual(duePushSlots(rearmed,scheduledAt),[{kind:'study',day}],
  'rearmed slot becomes due in the normal 1m-early Cron window');
 await sendDue(localEnv,scheduledAt,async(_row,slot)=>{
  mockSent.push(slot.kind);return new Response(null,{status:201});
 });
 assert.deepEqual(mockSent,['study']);
 const once=await getRow();
 assert.deepEqual(JSON.parse(once.last_day),{sleep:day,study:day});
 // Foreground/refresh repeats exactly the same PUT but must not re-arm it.
 const refresh=await dispatch(mf,'qa-owner-a',laterRequest);
 assert.equal(refresh.status,200);
 assert.deepEqual(JSON.parse((await getRow()).last_day),{sleep:day,study:day});
 await sendDue(localEnv,scheduledAt,async(_row,slot)=>{
  mockSent.push(slot.kind);return new Response(null,{status:201});
 });
 assert.deepEqual(mockSent,['study'],'no duplicate after foreground PUT / Cron retry');
 const past=await dispatch(mf,'qa-owner-a',body(
  after.map(s=>s.kind==='study'?{...s,time:pastTime}:s)));
 assert.equal(past.status,200);
 assert.deepEqual(JSON.parse((await getRow()).last_day),{sleep:day,study:day},
  'editing to a past time cannot replay already handled reminders');
 console.log('LI_WORKERD_REAL_D1_RESCHEDULE_DEDUP_PASS');
}
 console.log('LI_WORKERD_FULL_BUNDLE_D1_NEON_CONTRACT_PASS');
}finally{await mf.dispose();}

// External endpoint check with *invalid*, non-usable JWT only.
// Does not exercise a real owner or create/update any subscription.
const live=mfBase();
try{
 const response=await dispatch(live,'never-a-real-neon-user-qa');
 console.log('LI_WORKERD_LIVE_NEON_NEGATIVE_HTTP_'+response.status);
 assert.equal(response.status,401,
  'real Worker bundle in workerd must reach Neon and receive 401, NOT 503');
 assert.deepEqual(await response.json(),{ok:false});
 console.log('LI_WORKERD_LIVE_NEON_READONLY_401_PASS');
}finally{await live.dispose();}
