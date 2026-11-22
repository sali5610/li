import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import worker from '../../push-worker/src/index.mjs';

const src=readFileSync(new URL('../src/shell/web-push-client.ts',import.meta.url),'utf8');
let clientJs=ts.transpileModule(src,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
clientJs=clientJs.replace(/^import [^\n]*;\n/gm,'');
clientJs=clientJs.replaceAll('import.meta.env','globalThis.__qaEnv');
clientJs=[
 'const neonSessionPort=globalThis.__qaNeonSession;',
 'const readReminderPreference=globalThis.__qaPreference;',
 'const readReminderDelivery=globalThis.__qaDelivery;',
 clientJs].join('\n');
let client;

const origin='https://li5610.pages.dev';
const endpoint='https://li-push-staging.dungho-product.workers.dev';
const realAppOwner='synthetic-account';
const payload=Buffer.from(JSON.stringify({sub:realAppOwner,exp:4102444800})).toString('base64url');
const token='eyJhbGciOiJub25lIn0.'+payload+'.simulation';
const fakeSub={
 endpoint:'https://web.push.apple.com/synthetic-qa-subscription',
 keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}
};
const pref={
 version:2,schedules:['study','sleep','movement','rest'].map(kind=>({
  kind,enabled:kind==='study',time:kind==='study'?'20:53':'',
  frequency:'daily',days:[]}))
};
const rows=[];
const env={
 ALLOWED_ORIGIN:origin,NEON_DATA_API_URL:'https://neon.example.test/rest/v1',
 VAPID_PUBLIC_KEY:'public',VAPID_PRIVATE_KEY:'private',
 VAPID_SUBJECT:'mailto:example@example.test',
 PUSH_DB:{prepare(sql){
  if(sql.includes('SELECT owner_id,kind,local_time')){
   return {bind:()=>({first:async()=>null})};
  }
  if(sql.includes('SELECT COUNT(*) AS n')){
   return {bind:()=>({first:async()=>({n:rows.length})})};
  }
  if(sql.includes('INSERT INTO push_subscriptions')){
   return {bind:(...args)=>({run:async()=>{
    rows.push({id:args[0],owner_id:args[1],endpoint:args[2],
      p256dh:args[3],auth:args[4],kind:args[5],
      local_time:args[6],zone:args[7],enabled:args[8]});
    return {success:true};
   }})};
  }
  throw Error('Unexpected SQL in synthetic test: '+sql.slice(0,65));
 }}
};
let allowed=true;
const calls={config:0,rpc:0,put:0};
const originalFetch=globalThis.fetch;
const backup=new Map();
function override(name,value){
 backup.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
 Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
}
override('location',{origin,pathname:'/'});
override('document',{documentElement:{classList:{contains:k=>k==='li-auth-verified'}}});
override('localStorage',{getItem:k=>k==='li.sync.local-owner.v1'?realAppOwner:null});
override('navigator',{serviceWorker:{}});
override('window',{matchMedia:()=>({matches:true})});
override('Notification',function Notification(){});
override('PushManager',function PushManager(){});
override('__qaEnv',{VITE_LI_PUSH_WORKER_URL:endpoint});
override('__qaPreference',()=>pref);
override('__qaDelivery',()=>({lastDay:'',snoozedUntil:0}));
override('__qaNeonSession',{getJWTToken:async()=>token});
override('fetch',async(url,init={})=>{
 const full=String(url);
 if(full.startsWith('https://neon.example.test/rest/v1/rpc/li_is_invited')){
  calls.rpc++;
  assert.match(String(init.headers?.Authorization),/^Bearer /);
  return new Response(JSON.stringify(allowed),{status:200,headers:{'Content-Type':'application/json'}});
 }
 if(full===endpoint+'/v1/config'){
  calls.config++;
  return worker.fetch(new Request(full,{headers:{Origin:origin}}),env);
 }
 if(full===endpoint+'/v1/subscriptions'){
  calls.put++;
  const req=new Request(full,{method:init.method,headers:{Origin:origin,...init.headers},body:init.body});
  return worker.fetch(req,env);
 }
 throw Error('Synthetic test reached unexpected network URL: '+full);
});
try{
 client=await import('data:text/javascript;base64,'+Buffer.from(clientJs).toString('base64'));
 await test('same app client to Worker contract stores one valid invited synthetic subscription',async()=>{
  assert.equal(client.webPushApi(),endpoint);
  assert.equal(client.installedPushSupported(),false,'test does not impersonate iOS PWA');
  assert.equal(client.userAllowed(),true);
  await client.registerPush(endpoint,{toJSON:()=>fakeSub});
  assert.equal(calls.put,1);
  assert.equal(calls.rpc,1);
  assert.equal(rows.length,1);
  assert.equal(rows[0].owner_id,realAppOwner);
  assert.equal(rows[0].enabled,1);
  assert.equal(JSON.parse(rows[0].local_time).schedules[0].time,'20:53');
  console.log('LI_PUSH_CLIENT_WORKER_POSITIVE_CONTRACT_PASS (synthetic JWT + D1 only)');
 });
 await test('Worker rejects user not invited even when same fake JWT shape is valid',async()=>{
  const previous=rows.length;
  allowed=false;
  await assert.rejects(client.registerPush(endpoint,{toJSON:()=>fakeSub}),
   /PUSH_BACKEND_403/);
  assert.equal(rows.length,previous,'Denied invite cannot mutate synthetic D1');
  console.log('LI_PUSH_CLIENT_WORKER_DENIED_INVITE_PASS (no production RPC)');
 });
}finally{
 globalThis.fetch=originalFetch;
 for(const [key,desc] of backup){if(desc)Object.defineProperty(globalThis,key,desc);
  else delete globalThis[key];}
}
