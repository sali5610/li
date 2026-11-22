import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import pushWorker from '../src/index.mjs';

const handler=readFileSync(new URL('../../../site/assets/li-push-handler.js',import.meta.url),'utf8');
const client=readFileSync(new URL('../../step16-real-l09-react-island/src/shell/web-push-client.ts',import.meta.url),'utf8');

function harness(scope,existing=[]){
 const callbacks={},opened=[],shown=[];
 const self={
  registration:{scope,showNotification:async(title,options)=>shown.push({title,options})},
  addEventListener:(name,callback)=>{callbacks[name]=callback;},
  clients:{matchAll:async()=>existing,openWindow:async url=>{opened.push(url);}}
 };
 runInNewContext(handler,{self,URL});
 return {callbacks,opened,shown};
}

test('notification icon and click use the actual installed PWA scope',async()=>{
 for(const scope of ['https://li5610.pages.dev/','https://sali5610.github.io/li/']){
  const h=harness(scope);
  let pending;
  h.callbacks.push({data:{json:()=>({v:1,kind:'study'})},waitUntil:p=>{pending=p;}});
  await pending;
  assert.equal(h.shown.length,1);
  assert.equal(h.shown[0].options.icon,new URL('assets/apple-touch-icon.png',scope).pathname);
  assert.equal(h.shown[0].options.data.url,new URL(scope).pathname);
  h.callbacks.notificationclick({notification:{close(){}},waitUntil:p=>{pending=p;}});
  await pending;
  assert.deepEqual(h.opened,[scope]);
 }
});

test('notification click focuses only an existing same-origin PWA window',async()=>{
 const focused=[];
 const h=harness('https://li5610.pages.dev/',[
  {url:'https://sali5610.github.io/li/',focus:async()=>focused.push('wrong')},
  {url:'https://li5610.pages.dev/lesson',focus:async()=>focused.push('correct')}
 ]);
 let pending;
 h.callbacks.notificationclick({notification:{close(){}},waitUntil:p=>{pending=p;}});
 await pending;
 assert.deepEqual(focused,['correct']);
 assert.deepEqual(h.opened,[]);
});

test('Cloudflare Push Worker config requires bindings and restricts CORS',async()=>{
 const env={PUSH_DB:{},VAPID_PUBLIC_KEY:'public',VAPID_PRIVATE_KEY:'private',
  VAPID_SUBJECT:'mailto:owner@example.test',NEON_DATA_API_URL:'https://neon.example.test',
  ALLOWED_ORIGIN:'https://li5610.pages.dev'};
 const request=(origin)=>new Request('https://li-push-staging.example.workers.dev/v1/config',
  {headers:{Origin:origin}});
 const response=await pushWorker.fetch(request(env.ALLOWED_ORIGIN),env);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),env.ALLOWED_ORIGIN);
 assert.equal((await response.json()).available,true);
 assert.equal((await pushWorker.fetch(request('https://evil.test'),env)).status,403);
 assert.equal((await pushWorker.fetch(request(env.ALLOWED_ORIGIN),
  {...env,VAPID_PRIVATE_KEY:undefined})).status,503);
 assert.equal((await pushWorker.fetch(request('https://evil.test'),
  {...env,ALLOWED_ORIGIN:'https://evil.test'})).status,503);
});

test('client gates Cloudflare and GitHub staging to first-party origins',()=>{
 assert.ok(client.includes("location.origin==='https://li5610.pages.dev'"));
 assert.ok(client.includes("location.origin==='https://sali5610.github.io'"));
 assert.ok(client.includes('if(!cloudflare&&!github)return null'));
 assert.ok(client.includes('VITE_LI_PUSH_WORKER_URL'));
});
