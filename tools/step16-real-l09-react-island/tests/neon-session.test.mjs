import test from 'node:test';
import assert from 'node:assert/strict';
import {bindNeonAccount} from '../.sync-test/sync/neon-session.js';

const endpoint='https://example.apirest.neon.tech/li/rest/v1';
const tokenFor=sub=>['e30',Buffer.from(JSON.stringify({sub,role:'authenticated'})).toString('base64url'),'signature'].join('.');
function authFor(id){
 return{async getSession(){return{data:{user:id?{id}:null}};},
  async getJWTToken(){return tokenFor(id);}};
}
test('anonymous/no session has no bound Data API and cannot upload',async()=>{
 let calls=0;
 const api=await bindNeonAccount(endpoint,authFor(null),async()=>{calls++;return new Response('[]');});
 assert.equal(api,null);
 assert.equal(calls,0);
});
test('active official Auth session binds Neon requests to account subject',async()=>{
 const observed=[];
 const api=await bindNeonAccount(endpoint,authFor('A'),async(url,init)=>{
  observed.push({url,init});
  return new Response('[]',{status:200,headers:{'Content-Type':'application/json'}});
 });
 assert.equal(api.accountId,'A');
 assert.deepEqual(await api.all(),[]);
 assert.equal(observed.length,1);
 assert.equal(observed[0].init.headers.Authorization,'Bearer '+tokenFor('A'));
});
test('account switched between session mount and request: fail before network',async()=>{
 let current='A',calls=0;
 const auth={async getSession(){return{data:{user:{id:current}}};},
 async getJWTToken(){return tokenFor(current);}};
 const api=await bindNeonAccount(endpoint,auth,async()=>{calls++;return new Response('[]');});
 current='B';
 await assert.rejects(api.all(),/NEON_AUTH_ACCOUNT_CHANGED/);
 assert.equal(calls,0);
});
test('auth token for another subject cannot query data even if session says A',async()=>{
 let calls=0;
 const auth={async getSession(){return{data:{user:{id:'A'}}};},
 async getJWTToken(){return tokenFor('B');}};
 const api=await bindNeonAccount(endpoint,auth,async()=>{calls++;return new Response('[]');});
 await assert.rejects(api.all(),/NEON_AUTH_ACCOUNT_MISMATCH/);
 assert.equal(calls,0);
});
