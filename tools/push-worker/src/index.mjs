import {buildPushPayload} from '@block65/webcrypto-web-push';
import {validKind,validClock,validZone,validSubscription,dueForPush,
 endpointId,safeAccountJwt} from './core.mjs';

const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{
 status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}
});
function configured(env){return !!(env.PUSH_DB&&env.VAPID_PUBLIC_KEY&&
 env.VAPID_PRIVATE_KEY&&env.VAPID_SUBJECT&&
 env.NEON_DATA_API_URL?.startsWith('https://')&&
 env.ALLOWED_ORIGIN==='https://sali5610.github.io');}
function cors(env){return {'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN,
 'Access-Control-Allow-Headers':'Authorization, Content-Type',
 'Access-Control-Allow-Methods':'GET,PUT,DELETE,OPTIONS',
 'Vary':'Origin'};}
function failure(status){return json({ok:false},status);}
function isAllowedOrigin(request,env){
 return request.headers.get('Origin')===env.ALLOWED_ORIGIN;
}
async function invitedAccount(request,env){
 const value=request.headers.get('Authorization')||'';
 const token=value.startsWith('Bearer ')?value.slice(7):'';
 const account=safeAccountJwt(token);
 if(!account)return null;
 try{
  const base=env.NEON_DATA_API_URL.replace(/\/$/,'');
  const answer=await fetch(base+'/rpc/li_is_invited',{
   method:'POST',redirect:'error',cache:'no-store',credentials:'omit',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},
   body:'{}'
  });
  if(!answer.ok||await answer.json()!==true)return null;
  return account;
 }catch{return null;}
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
 const account=await invitedAccount(request,env);
 if(!account)return json({ok:false},403,headers);
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
 const s=body.subscription,kind=body.kind,localTime=body.time,zone=body.zone;
 if(!validSubscription(s)||!validKind(kind)||!validClock(localTime)||!validZone(zone)||
  typeof body.enabled!=='boolean')return json({ok:false},400,headers);
 const id=await endpointId(s.endpoint);
 const existing=await env.PUSH_DB.prepare('SELECT owner_id FROM push_subscriptions WHERE id=?')
  .bind(id).first();
 if(existing&&existing.owner_id!==account)return json({ok:false},403,headers);
 if(!existing){
  const num=await env.PUSH_DB.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE owner_id=?')
   .bind(account).first();
  if(Number(num?.n||0)>=5)return json({ok:false},429,headers);
 }
 const result=await env.PUSH_DB.prepare(`INSERT INTO push_subscriptions
 (id,owner_id,endpoint,p256dh,auth,kind,local_time,zone,enabled)
 VALUES(?,?,?,?,?,?,?,?,?)
 ON CONFLICT(id) DO UPDATE SET
 p256dh=excluded.p256dh,auth=excluded.auth,kind=excluded.kind,
 local_time=excluded.local_time,zone=excluded.zone,
 enabled=excluded.enabled,updated_at=CURRENT_TIMESTAMP
 WHERE push_subscriptions.owner_id=excluded.owner_id`)
  .bind(id,account,s.endpoint,s.keys.p256dh,s.keys.auth,
   kind,localTime,zone,body.enabled?1:0).run();
 if(!result?.success)return json({ok:false},503,headers);
 return json({ok:true},200,headers);
}
async function sendDue(env){
 if(!configured(env))return;
 const now=new Date();
 const rows=await env.PUSH_DB.prepare(
  'SELECT id,endpoint,p256dh,auth,kind,local_time,zone,enabled,last_day FROM push_subscriptions WHERE enabled=1 LIMIT 60'
 ).all();
 const vapid={subject:env.VAPID_SUBJECT,publicKey:env.VAPID_PUBLIC_KEY,
  privateKey:env.VAPID_PRIVATE_KEY};
 for(const row of rows.results||[]){
  const day=dueForPush(row,now);
  if(!day)continue;
  // Atomic claim before delivery: cron overlaps never double-ping the same device.
  const changed=await env.PUSH_DB.prepare(
   'UPDATE push_subscriptions SET last_day=? WHERE id=? AND (last_day IS NULL OR last_day<>?)'
  ).bind(day,row.id,day).run();
  if(!changed?.meta?.changes)continue;
  try{
   const subscription={endpoint:row.endpoint,expirationTime:null,
    keys:{p256dh:row.p256dh,auth:row.auth}};
   const message={data:JSON.stringify({v:1,kind:row.kind}),options:{ttl:300}};
   const payload=await buildPushPayload(message,subscription,vapid);
   const response=await fetch(row.endpoint,payload);
   if(response.status===404||response.status===410){
    await env.PUSH_DB.prepare('DELETE FROM push_subscriptions WHERE id=?')
     .bind(row.id).run();
   }
   // Other failures are not retried: at-most-once, never duplicate notifications.
   // No endpoint, JWT, user ID or push response body is logged.
  }catch{/* Preserve quiet at-most-once policy; no sensitive logs. */}
 }
}
export default {
 fetch:fetchRequest,
 async scheduled(_controller,env,ctx){ctx.waitUntil(sendDue(env));}
};
