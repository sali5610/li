import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare} from 'miniflare';

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
const request=(subject='qa-owner-a',body=requestBody)=>new Request(
 'https://li-push-qa.example.test/v1/subscriptions',
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
let mode='allow',calls=0,redirectMode='',fetchedUrl='',fetchedMethod='';
const fakeNeon={
 type:'fetcher',
 async handler(req){
  calls++;
  fetchedUrl=String(req.url);
  fetchedMethod=req.method;
  redirectMode=req.redirect;
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
  const response=await mf.dispatchFetch(request(sub));
  assert.equal(response.status,expected,name);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  if(response.status!==200)assert.deepEqual(await response.json(),{ok:false});
  console.log('WORKERD_BUNDLE_PASS '+name+' HTTP '+response.status);
 };
 const unauthorized=await mf.dispatchFetch(
  new Request('https://li-push-qa.example.test/v1/subscriptions',
   {method:'PUT',headers:{...headers,Authorization:'Bearer invalid'},body:'{}'}));
 assert.equal(unauthorized.status,401);
 assert.equal(calls,0,'invalid syntax must not even call Neon');
 console.log('WORKERD_BUNDLE_PASS early invalid-JWT 401 no RPC');
 await check('valid-invite-writes-isolated-D1',200);
 assert.equal(await count(),1,'first subscription stored in real local D1');
 assert.equal(redirectMode,'manual','real workerd forwarded a nonredirecting Neon RPC');
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
 assert.equal(redirectMode,'manual','manual redirect preserved for every Neon RPC');
 console.log('LI_WORKERD_FULL_BUNDLE_D1_NEON_CONTRACT_PASS');
}finally{await mf.dispose();}

// External endpoint check with *invalid*, non-usable JWT only.
// Does not exercise a real owner or create/update any subscription.
const live=mfBase();
try{
 const response=await live.dispatchFetch(request('never-a-real-neon-user-qa'));
 console.log('LI_WORKERD_LIVE_NEON_NEGATIVE_HTTP_'+response.status);
 assert.equal(response.status,401,
  'real Worker bundle in workerd must reach Neon and receive 401, NOT 503');
 assert.deepEqual(await response.json(),{ok:false});
 console.log('LI_WORKERD_LIVE_NEON_READONLY_401_PASS');
}finally{await live.dispose();}
