import {buildPushPayload} from '@block65/webcrypto-web-push';
import {validKind,validClock,validZone,validSubscription,validSchedules,
 duePushSlots,claimDays,withoutDays,newlySnoozedKinds,endpointId,safeAccountJwt} from './core.mjs';

const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{
 status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}
});
const permittedOrigins=new Set(['https://sali5610.github.io','https://li5610.pages.dev']);
function configured(env){return !!(env.PUSH_DB&&env.VAPID_PUBLIC_KEY&&
 env.VAPID_PRIVATE_KEY&&env.VAPID_SUBJECT&&
 env.NEON_DATA_API_URL?.startsWith('https://')&&
 permittedOrigins.has(env.ALLOWED_ORIGIN));}
function cors(env){return {'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN,
 'Access-Control-Allow-Headers':'Authorization, Content-Type',
 'Access-Control-Allow-Methods':'GET,PUT,DELETE,OPTIONS',
 'Vary':'Origin'};}
function failure(status){return json({ok:false},status);}
function isAllowedOrigin(request,env){
 return request.headers.get('Origin')===env.ALLOWED_ORIGIN;
}
// The previous implementation returned the SAME HTTP 403 for invalid JWT,
// explicit invite denial, and broken upstream RPC. Preserve authorization,
// but distinguish client re-auth (401), real denial (403), and upstream failure
// (503). Do not echo JWT, identity, endpoint, provider body or exception text.
async function invitedAccount(request,env){
 const value=request.headers.get('Authorization')||'';
 const token=value.startsWith('Bearer ')?value.slice(7):'';
 const account=safeAccountJwt(token);
 if(!account)return {status:401};
 let answer;
 try{
  const base=env.NEON_DATA_API_URL.replace(/\/$/,'');
  answer=await fetch(base+'/rpc/li_is_invited',{
   method:'POST',redirect:'manual',cache:'no-store',credentials:'omit',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},
   body:'{}'
  });
 }catch{return {status:503};}
 // A rejected JWT is not equivalent to a valid user being uninvited.
 // Never turn upstream failures into an allow decision or a fake "denied".
 if(answer.status===401||answer.status===403)return {status:401};
 if(!answer.ok)return {status:503};
 try{
  const allowed=await answer.json();
  if(allowed===true)return {account};
  if(allowed===false)return {status:403};
  return {status:503};
 }catch{return {status:503};}
}
async function readBody(req){
 try{
  if(Number(req.headers.get('content-length')||0)>7000)return null;
  const text=await req.text();
  if(text.length>7000)return null;
  const body=JSON.parse(text);
  return body&&typeof body==='object'&&!Array.isArray(body)?body:null;
 }catch{return null;}
}
async function fetchRequest(request,env){
 const url=new URL(request.url);
 if(url.pathname!=='/v1/config'&&url.pathname!=='/v1/subscriptions')
  return failure(404);
 if(!isAllowedOrigin(request,env))return failure(403);
 if(!configured(env))return failure(503);
 const headers=cors(env);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(url.pathname==='/v1/config'&&request.method==='GET')
  return json({available:true,vapidPublicKey:env.VAPID_PUBLIC_KEY},200,headers);
 if(url.pathname!=='/v1/subscriptions'||!['PUT','DELETE'].includes(request.method))
  return json({ok:false},405,headers);
 const authorized=await invitedAccount(request,env);
 if(!authorized.account)return json({ok:false},authorized.status,headers);
 const account=authorized.account;
 const body=await readBody(request);
 if(!body)return json({ok:false},400,headers);
 if(request.method==='DELETE'){
  if(typeof body.endpoint!=='string'||body.endpoint.length>2048)
   return json({ok:false},400,headers);
  const id=await endpointId(body.endpoint);
  await env.PUSH_DB.prepare('DELETE FROM push_subscriptions WHERE id=? AND owner_id=?')
   .bind(id,account).run();
  return json({ok:true},200,headers);
 }
 const s=body.subscription,zone=body.zone,multi=Object.hasOwn(body,'schedules');
 if(!validSubscription(s)||!validZone(zone)||
  (multi?!validSchedules(body.schedules):
   !validKind(body.kind)||!validClock(body.time)||typeof body.enabled!=='boolean'))
  return json({ok:false},400,headers);
 // Existing D1 columns support versioned JSON; no schema/data migration needed.
 const schedules=multi?body.schedules:null;
 const kind=multi?(schedules.find(item=>item.enabled)?.kind||'study'):body.kind;
 const localTime=multi?JSON.stringify({version:2,schedules}):body.time;
 const enabled=multi?schedules.some(item=>item.enabled):body.enabled;
 const id=await endpointId(s.endpoint);
 const existing=await env.PUSH_DB.prepare('SELECT owner_id,kind,local_time FROM push_subscriptions WHERE id=?')
  .bind(id).first();
 if(existing&&existing.owner_id!==account)return json({ok:false},403,headers);
 if(!existing){
  const num=await env.PUSH_DB.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE owner_id=?')
   .bind(account).first();
  if(Number(num?.n||0)>=5)return json({ok:false},429,headers);
 }
 const resnoozed=multi&&existing?newlySnoozedKinds(
  existing.local_time,schedules,Date.now()):[];
 const result=await env.PUSH_DB.prepare(`INSERT INTO push_subscriptions
 (id,owner_id,endpoint,p256dh,auth,kind,local_time,zone,enabled)
 VALUES(?,?,?,?,?,?,?,?,?)
 ON CONFLICT(id) DO UPDATE SET
 p256dh=excluded.p256dh,auth=excluded.auth,kind=excluded.kind,
 local_time=excluded.local_time,zone=excluded.zone,
 enabled=excluded.enabled,updated_at=CURRENT_TIMESTAMP
 WHERE push_subscriptions.owner_id=excluded.owner_id`)
  .bind(id,account,s.endpoint,s.keys.p256dh,s.keys.auth,
   kind,localTime,zone,enabled?1:0).run();
 if(!result?.success)return json({ok:false},503,headers);
 if(resnoozed.length){
  // The original reminder may have gone out before an in-app snooze.
  // Re-arm ONLY that kind so the requested later time can fire. Idempotent:
  // a foreground repeat with the same snooze timestamp resets nothing.
  const current=await env.PUSH_DB.prepare('SELECT last_day FROM push_subscriptions WHERE id=?')
   .bind(id).first();
  if(current){
   const previous=current.last_day??null;
   const cleared=withoutDays({kind:existing.kind,last_day:previous},resnoozed);
   const reset=await env.PUSH_DB.prepare(
    'UPDATE push_subscriptions SET last_day=? WHERE id=? AND last_day IS ?'
   ).bind(cleared,id,previous).run();
   if(!reset?.meta?.changes)return json({ok:false},503,headers);
  }
 }
 return json({ok:true},200,headers);
}
async function deliverSlot(row,slot,vapid){
 const subscription={endpoint:row.endpoint,expirationTime:null,
  keys:{p256dh:row.p256dh,auth:row.auth}};
 const message={data:JSON.stringify({v:1,kind:slot.kind}),options:{ttl:300}};
 let payload;
 try{payload=await buildPushPayload(message,subscription,vapid);}
 catch{return {ok:false,status:503};} // Definitely not submitted to the provider.
 return fetch(row.endpoint,payload);
}
export async function sendDue(env,now=new Date(),deliver=deliverSlot){
 if(!configured(env))return;
 // Per owner: <=5 subscriptions; invited-only pilot: <=30 accounts. Never
 // silently discard devices beyond the old LIMIT 60.
 const rows=await env.PUSH_DB.prepare(
  'SELECT id,endpoint,p256dh,auth,kind,local_time,zone,enabled,last_day FROM push_subscriptions WHERE enabled=1'
 ).all();
 const vapid={subject:env.VAPID_SUBJECT,publicKey:env.VAPID_PUBLIC_KEY,
  privateKey:env.VAPID_PRIVATE_KEY};
 for(const row of rows.results||[]){
  const slots=duePushSlots(row,now);
  if(!slots.length)continue;
  // Claim first to prevent overlapping Cron dispatch from double-sending.
  const nextDay=claimDays(row,slots);
  const changed=await env.PUSH_DB.prepare(
   'UPDATE push_subscriptions SET last_day=? WHERE id=? AND last_day IS ?'
  ).bind(nextDay,row.id,row.last_day).run();
  if(!changed?.meta?.changes)continue;
  const rejected=[];
  let removed=false;
  for(const slot of slots){
   try{
    const response=await deliver(row,slot,vapid);
    if(response.status===404||response.status===410){
     await env.PUSH_DB.prepare('DELETE FROM push_subscriptions WHERE id=?')
      .bind(row.id).run();
     removed=true;
     break;
    }
    // An explicit provider rejection was NOT delivered: retry inside the
    // narrow due window. A successful 2xx is never re-armed.
    if(!response.ok)rejected.push(slot);
   }catch{
    // No response means an ambiguous outcome (e.g. ACK lost after send).
    // Keep claim to avoid a second possibly duplicate notification.
   }
  }
  if(!removed&&rejected.length){
   const accepted=slots.filter(slot=>!rejected.includes(slot));
   const receipt=claimDays(row,accepted);
   await env.PUSH_DB.prepare(
    'UPDATE push_subscriptions SET last_day=? WHERE id=? AND last_day=?'
   ).bind(receipt,row.id,nextDay).run();
  }
 }
}
export default {
 fetch:fetchRequest,
 async scheduled(_controller,env,ctx){ctx.waitUntil(sendDue(env));}
};
