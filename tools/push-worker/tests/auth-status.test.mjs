import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';

// Real Worker fetch handler + synthetic JWT/Neon RPC. No production calls,
// tokens, user IDs, private subscriptions or D1 rows are accessed.
const origin='https://li5610.pages.dev';
const url='https://li-push-staging.example.workers.dev/v1/subscriptions';
const jwt=(claims)=>'eyJhbGciOiJub25lIn0.'+
 Buffer.from(JSON.stringify(claims)).toString('base64url')+'.synthetic';
const signedShape=jwt({sub:'synthetic-user',exp:4102444800});
const env={
 PUSH_DB:{},VAPID_PUBLIC_KEY:'synthetic',VAPID_PRIVATE_KEY:'synthetic',
 VAPID_SUBJECT:'mailto:synthetic@example.test',
 NEON_DATA_API_URL:'https://neon.example.test/li/rest/v1',
 ALLOWED_ORIGIN:origin
};
const request=token=>new Request(url,{method:'PUT',
 headers:{Origin:origin,Authorization:'Bearer '+token,
  'Content-Type':'application/json'},
 body:'{}'});
const expectedBody=async response=>{
 assert.deepEqual(await response.json(),{ok:false},
  'No raw Neon response, identity or sensitive auth data in response');
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
 assert.equal(response.headers.get('Cache-Control'),'no-store');
};
const cases=[
 {title:'invalid or expired JWT is a 401 without upstream request',
  token:jwt({sub:'synthetic-user',exp:100}),status:401,upstream:null},
 {title:'Neon rejects the signed-shaped JWT with 401',status:401,
  upstream:()=>new Response('',{status:401})},
 {title:'Neon rejects the signed-shaped JWT with 403',status:401,
  upstream:()=>new Response('',{status:403})},
 {title:'Neon explicitly confirms NOT invited',status:403,
  upstream:()=>new Response('false',{status:200})},
 {title:'Neon 500 is fail-closed but not mislabelled as uninvited',status:503,
  upstream:()=>new Response('',{status:500})},
 {title:'Neon 302 redirect is fail-closed, never forwards Bearer',status:503,
  upstream:()=>new Response(null,{status:302,headers:{Location:'https://example.invalid/'}})},
 {title:'Neon 404 RPC failure is fail-closed and retryable',status:503,
  upstream:()=>new Response('',{status:404})},
 {title:'Neon returns nonboolean JSON',status:503,
  upstream:()=>new Response('{}',{status:200})},
 {title:'Neon response is malformed JSON',status:503,
  upstream:()=>new Response('invalid-json',{status:200})},
 {title:'Neon network throws',status:503,
  upstream:()=>{throw Error('synthetic network outage');}},
 {title:'Neon allows user and Worker proceeds to body validation',status:400,
  upstream:()=>new Response('true',{status:200})}
];
for(const item of cases){
 test(item.title,async()=>{
  let called=0;
  const old=globalThis.fetch;
  globalThis.fetch=async (...args)=>{
   called++;
   assert.equal(String(args[0]),env.NEON_DATA_API_URL+'/rpc/li_is_invited');
   assert.equal(args[1].method,'POST');
   assert.equal(args[1].redirect,'manual','Cloudflare Workers only supports manual/follow; never use redirect:error');
   assert.match(args[1].headers.Authorization,/^Bearer /);
   return item.upstream();
  };
  try{
   const response=await worker.fetch(request(item.token??signedShape),env);
   assert.equal(response.status,item.status);
   await expectedBody(response);
   assert.equal(called,item.upstream?1:0);
  }finally{globalThis.fetch=old;}
 });
}
test('wrong origin still fails before auth without CORS allow-header',async()=>{
 const response=await worker.fetch(new Request(url,{method:'PUT',
  headers:{Origin:'https://bad.example.test',Authorization:'Bearer '+signedShape},
  body:'{}'}),env);
 assert.equal(response.status,403);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
});
