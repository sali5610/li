import test from 'node:test';
import assert from 'node:assert/strict';
import {makeQaRun,validateQaRun,stepQa,cleanupOwnedQa,safeQaError} from '../.sync-test/auth/rls-qa-contract.js';
const jwt=uid=>['e30',Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+600})).toString('base64url'),'signature'].join('.');
const actor=(uid,invited)=>({uid,invited,getToken:async()=>jwt(uid)});
function backend(){
 const db={li_user_state:[],li_learning_events:[]};
 const requests=[];
 const get=table=>db[table];
 async function fetchMock(src,options={}){
  const u=new URL(src), table=u.pathname.split('/').at(-1);
  assert.match(u.origin,/^https:\/\/ep-misty-snow-azfrrm3o\.apirest\./);
  assert.ok(['li_user_state','li_learning_events'].includes(table));
  assert.equal(options.credentials,'omit');
  assert.equal(options.redirect,'error');
  const bearer=String(options.headers?.Authorization??'');
  const token=bearer.startsWith('Bearer ')?bearer.slice(7):'';
  let uid='';
  try{
   const parts=token.split('.');
   if(parts.length===3&&parts[2]==='signature')
    uid=JSON.parse(Buffer.from(parts[1],'base64url').toString()).sub;
  }catch{}
  requests.push({table,method:options.method,uid});
  if(!uid)return new Response('{}',{status:401});
  const body=options.body?JSON.parse(options.body):{};
  if(!['A','B'].includes(uid))return new Response('{}',{status:403});
  const rows=get(table);
  const visible=rows.filter(x=>x.owner_id===uid);
  const matched=visible.filter(x=>[...u.searchParams.entries()].every(([k,val])=>{
   if(!['item_type','item_id','event_id'].includes(k))return true;
   return x[k]===val.slice(3);
  }));
  if(options.method==='GET')return Response.json(matched,{status:200});
  if(options.method==='POST'){
   if(body.owner_id&&body.owner_id!==uid)return Response.json({error:'blocked'}, {status:403});
   const record={...body,owner_id:uid};
   if(table==='li_learning_events'&&!/^[0-9a-f-]{36}$/i.test(body.event_id))
    return Response.json({}, {status:400});
   if(table==='li_user_state'&&!body.item_id?.startsWith('__li_rls_qa_'))
    return Response.json({}, {status:403});
   rows.push(record);
   return Response.json([record],{status:201});
  }
  if(options.method==='PATCH'){
   if(table==='li_learning_events')return Response.json({}, {status:403});
   for(const x of matched)Object.assign(x,body);
   return Response.json(matched,{status:200});
  }
  if(options.method==='DELETE'){
   const removed=[...matched];
   for(const x of removed)rows.splice(rows.indexOf(x),1);
   return Response.json(removed,{status:200});
  }
  return Response.json({}, {status:405});
 }
 return{db,requests,fetchMock};
}
test('signed A/B/C sequential QA touches only synthetic rows and cleans up both owners',async()=>{
 const mock=backend();
 let run=makeQaRun();
 const emit=x=>{run=x;};
 await stepQa(run,actor('A',true),emit,mock.fetchMock);
 assert.equal(run.phase,'b');
 assert.equal(mock.db.li_user_state.length,1);
 assert.equal(mock.db.li_learning_events.length,1);
 assert.match(run.a.eventId,/^[0-9a-f-]{36}$/i);
 await assert.rejects(
  ()=>stepQa(run,actor('A',true),emit,mock.fetchMock),
  /QA-B-WRONG-ACCOUNT/
 );
 await stepQa(run,actor('B',true),emit,mock.fetchMock);
 assert.equal(run.phase,'c');
 assert.equal(mock.db.li_user_state.length,2);
 assert.equal(mock.db.li_learning_events.length,2);
 await stepQa(run,actor('C',false),emit,mock.fetchMock);
 assert.equal(run.phase,'a-finish');
 assert.equal(mock.db.li_user_state.length,2);
 assert.equal(mock.db.li_learning_events.length,2);
 await stepQa(run,actor('A',true),emit,mock.fetchMock);
 assert.equal(run.phase,'b-finish');
 assert.equal(run.a.cleaned,true);
 assert.equal(mock.db.li_user_state.length,1);
 assert.equal(mock.db.li_learning_events.length,1);
 await stepQa(run,actor('B',true),emit,mock.fetchMock);
 assert.equal(run.phase,'done');
 assert.equal(run.b.cleaned,true);
 assert.equal(mock.db.li_user_state.length,0);
 assert.equal(mock.db.li_learning_events.length,0);
 assert.ok(run.checks.length>=12);
 assert.ok(mock.requests.some(x=>x.uid==='C'&&x.method==='POST'));
 assert.ok(mock.requests.some(x=>x.uid===''&&x.method==='GET'));
 assert.ok(mock.requests.some(x=>x.uid==='A'&&x.method==='DELETE'));
 assert.ok(mock.requests.some(x=>x.uid==='B'&&x.method==='DELETE'));
});
test('invalid local persistence and leaks fail closed without exposing backend values',()=>{
 const run=makeQaRun();
 assert.ok(validateQaRun(run));
 assert.equal(validateQaRun({...run,phase:'unknown'}),null);
 assert.equal(validateQaRun({...run,a:{uid:'A',stateId:'private-item',eventId:crypto.randomUUID()}}),null);
 assert.equal(safeQaError(new Error('JWT secret abc.xyz')),'QA-NETWORK-OR-RUNTIME');
});
test('cleanup of synthetic A state/event is available if the workflow was interrupted',async()=>{
 const {fetchMock,db}=backend();
 let run=makeQaRun();
 const emit=x=>{run=x;};
 await stepQa(run,actor('A',true),emit,fetchMock);
 assert.equal(run.phase,'b');
 await cleanupOwnedQa(run,actor('A',true),emit,fetchMock);
 assert.equal(run.a.cleaned,true);
 assert.equal(db.li_user_state.length,0);
 assert.equal(db.li_learning_events.length,0);
});
