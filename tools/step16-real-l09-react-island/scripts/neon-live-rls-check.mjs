#!/usr/bin/env node
/**
 * LIVE RLS evidence runner for TEST accounts only.
 * Execution requires THREE deliberate inputs: --run-synthetic-rls and two
 * real, distinct, short-lived Neon Auth JWTs supplied via environment.
 * Uses ONLY synthetic rows and cleans them in finally. NEVER log credentials.
 * Do NOT run with real personal lesson/diary data or on a public web page.
 */
import {randomUUID} from 'node:crypto';

const API='https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1';
const jwtA=process.env.LI_TEST_JWT_A||'';
const jwtB=process.env.LI_TEST_JWT_B||'';
if(process.argv[2]!=='--run-synthetic-rls'||!jwtA||!jwtB){
 console.error('DENIED: requires --run-synthetic-rls and LI_TEST_JWT_A / LI_TEST_JWT_B environment variables (real short-lived test-user tokens). No requests made.');
 process.exit(2);
}
function claim(token){
 if(token.split('.').length!==3)throw Error('TEST_JWT_INVALID');
 let payload;
 try{payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));}
 catch{throw Error('TEST_JWT_INVALID');}
 if(typeof payload.sub!=='string'||!payload.sub||payload.role!=='authenticated'||
   !Number.isFinite(payload.exp)||payload.exp<=Date.now()/1000+60)
  throw Error('SIGNED_AUTHENTICATED_TEST_JWT_REQUIRED');
 return payload.sub;
}
const userA=claim(jwtA),userB=claim(jwtB);
if(userA===userB)throw Error('TWO_DISTINCT_TEST_USERS_REQUIRED');
if(process.env.LI_NEON_DATA_API_URL&&process.env.LI_NEON_DATA_API_URL!==API)
 throw Error('UNEXPECTED_NEON_API_ENDPOINT');
// JWT subject is only a structural precheck; Neon MUST verify the signature.
// Never treat this local decode as security evidence.
const runId=randomUUID(), itemA='__li_rls_a_'+runId,itemB='__li_rls_b_'+runId;
const forged='__li_rls_forge_'+runId, eventA=randomUUID(), eventB=randomUUID(),forgedEvent=randomUUID();
const evidence=[];
function assert(condition,reason){if(!condition)throw Error('RLS_CHECK_FAILED: '+reason);}
async function send(token,method,table,where={},body){
 const endpoint=new URL(API+'/'+table);
 for(const [key,value] of Object.entries(where))endpoint.searchParams.set(key,value);
 const response=await fetch(endpoint.toString(),{
  method,redirect:'error',credentials:'omit',cache:'no-store',
  headers:{Authorization:'Bearer '+token,Accept:'application/json',
    ...(body?{'Content-Type':'application/json'}:{}),
    ...(['POST','PATCH','DELETE'].includes(method)?{Prefer:'return=representation'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const raw=await response.text();
 let rows=null;
 if(raw){try{rows=JSON.parse(raw);}catch{rows=null;}}
 return{status:response.status,rows};
}
function succeeded(response){return response.status>=200&&response.status<300;}
function noForeignRows(response){
 return [401,403,404].includes(response.status)||
  (succeeded(response)&&Array.isArray(response.rows)&&response.rows.length===0);
}
async function verifyOwned(token,table,where,expectedOwner){
 const r=await send(token,'GET',table,{...where,select:'owner_id,payload'});
 assert(succeeded(r)&&Array.isArray(r.rows)&&r.rows.length===1&&r.rows[0].owner_id===expectedOwner,
   'owner read or row provenance incorrect on '+table);
 return r.rows[0];
}
async function clear(token,table,where){
 try{await send(token,'DELETE',table,where);}catch{/* best effort; report cleanup failure separately via positive follow-up */}
}
let failed=null;
try{
 const a={item_type:'preference',item_id:itemA,revision:1,payload:{synthetic:true,owner:'A'}};
 const b={item_type:'preference',item_id:itemB,revision:1,payload:{synthetic:true,owner:'B'}};
 const wA=await send(jwtA,'POST','li_user_state',{},a);
 const wB=await send(jwtB,'POST','li_user_state',{},b);
 assert(succeeded(wA)&&succeeded(wB),'test users cannot create own state rows');
 await verifyOwned(jwtA,'li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemA},userA);
 await verifyOwned(jwtB,'li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemB},userB);
 evidence.push('Both real JWTs may create/read own RLS state');

 const crossA=await send(jwtA,'GET','li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemB});
 const crossB=await send(jwtB,'GET','li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemA});
 assert(noForeignRows(crossA)&&noForeignRows(crossB),'cross-user SELECT leaked state');
 evidence.push('Cross-user SELECT A↔B denied');

 const forgedWrite=await send(jwtA,'POST','li_user_state',{},
  {...a,item_id:forged,owner_id:userB});
 assert(forgedWrite.status>=400,'A forged owner_id of B');
 evidence.push('A cannot INSERT claiming B owner_id');

 const edited=await send(jwtA,'PATCH','li_user_state',
  {item_type:'eq.preference',item_id:'eq.'+itemB},{payload:{synthetic:true,attack:true}});
 assert(noForeignRows(edited),'A PATCH unexpectedly touched B');
 let bRow=await verifyOwned(jwtB,'li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemB},userB);
 assert(bRow.payload?.owner==='B'&&!bRow.payload?.attack,'B state changed after A PATCH');
 evidence.push('A cannot UPDATE B state');

 const deleted=await send(jwtA,'DELETE','li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemB});
 assert(noForeignRows(deleted),'A DELETE unexpectedly touched B');
 bRow=await verifyOwned(jwtB,'li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemB},userB);
 assert(bRow.payload?.owner==='B','B state removed after A DELETE');
 evidence.push('A cannot DELETE B state');

 const eA={event_id:eventA,kind:'synthetic_rls_test',lesson_id:'L09-1-2',payload:{synthetic:true,owner:'A'}};
 const eB={event_id:eventB,kind:'synthetic_rls_test',lesson_id:'L09-1-2',payload:{synthetic:true,owner:'B'}};
 assert(succeeded(await send(jwtA,'POST','li_learning_events',{},eA))&&
  succeeded(await send(jwtB,'POST','li_learning_events',{},eB)), 'test users cannot INSERT own learning events');
 await verifyOwned(jwtA,'li_learning_events',{event_id:'eq.'+eventA},userA);
 await verifyOwned(jwtB,'li_learning_events',{event_id:'eq.'+eventB},userB);
 evidence.push('Both real JWTs may create/read own synthetic learning events');

 const eventReadA=await send(jwtA,'GET','li_learning_events',{event_id:'eq.'+eventB});
 const eventReadB=await send(jwtB,'GET','li_learning_events',{event_id:'eq.'+eventA});
 assert(noForeignRows(eventReadA)&&noForeignRows(eventReadB),'cross-user SELECT leaked event');
 evidence.push('Cross-user SELECT A↔B denied for events');

 const eventForged=await send(jwtA,'POST','li_learning_events',{},
  {...eA,event_id:forgedEvent,owner_id:userB});
 assert(eventForged.status>=400,'A forged B owner for event');
 evidence.push('A cannot INSERT B event');

 const eventDelete=await send(jwtA,'DELETE','li_learning_events',{event_id:'eq.'+eventB});
 assert(noForeignRows(eventDelete),'A deleted B event');
 await verifyOwned(jwtB,'li_learning_events',{event_id:'eq.'+eventB},userB);
 evidence.push('A cannot DELETE B event');
}catch(error){failed=error;}
finally{
 await clear(jwtA,'li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemA});
 await clear(jwtB,'li_user_state',{item_type:'eq.preference',item_id:'eq.'+itemB});
 await clear(jwtB,'li_user_state',{item_type:'eq.preference',item_id:'eq.'+forged});
 await clear(jwtA,'li_learning_events',{event_id:'eq.'+eventA});
 await clear(jwtB,'li_learning_events',{event_id:'eq.'+eventB});
 await clear(jwtB,'li_learning_events',{event_id:'eq.'+forgedEvent});
}
if(failed)throw failed;
console.log('LI_STEP16_LIVE_RLS_PASS '+JSON.stringify({count:evidence.length,checks:evidence,
 note:'Genuine JWT signed by Neon required; only synthetic rows. Check live cleanup/count separately.'}));
