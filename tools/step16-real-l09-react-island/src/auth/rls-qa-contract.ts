/**
 * STAGING-ONLY, user-triggered live RLS probe. Nothing here is a sync adapter.
 * No JWT, email or raw server response may be stored, displayed or logged.
 * The only writes are unique __li_rls_qa_* identifiers; cleanup is verified.
 */
export type QaPhase='start'|'b'|'c'|'a-finish'|'b-finish'|'done';
type Slot={uid:string;stateId:string;eventId:string;cleaned?:boolean};
export type QaRun={v:1;id:string;phase:QaPhase;a?:Slot;b?:Slot;c?:Slot;forgedStateId?:string;checks:string[];lastError?:string};
export type QaActor={uid:string;invited:boolean;getToken:()=>Promise<string|null>};
export type QaRequest=typeof fetch;
type Table='li_user_state'|'li_learning_events';
const ID_PREFIX='__li_rls_qa_';
const BASE='https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1';
const SAFE_PHASES:QaPhase[]=['start','b','c','a-finish','b-finish','done'];
function fail(code:string):never{throw new Error(code);}
function mark(){return ID_PREFIX+crypto.randomUUID();}
export function makeQaRun():QaRun{return{v:1,id:crypto.randomUUID(),phase:'start',checks:[]};}
export function validateQaRun(value:unknown):QaRun|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const r=value as Record<string,unknown>;
 if(r.v!==1||typeof r.id!=='string'||!/^[0-9a-f-]{36}$/i.test(r.id)||
  !SAFE_PHASES.includes(r.phase as QaPhase)||!Array.isArray(r.checks)||
  r.checks.length>50||!r.checks.every(x=>typeof x==='string'&&x.length<100))return null;
 for(const k of ['a','b','c'] as const){
  const slot=r[k] as Record<string,unknown>|undefined;
  if(slot&&(
   !slot||typeof slot.uid!=='string'||slot.uid.length<1||slot.uid.length>200||
   typeof slot.stateId!=='string'||!slot.stateId.startsWith(ID_PREFIX)||
   typeof slot.eventId!=='string'||!/^[0-9a-f-]{36}$/i.test(slot.eventId)||
   slot.stateId.length>150||slot.eventId.length>150
  ))return null;
 }
 return r as unknown as QaRun;
}
function ensureId(value:string){if(!value.startsWith(ID_PREFIX)||value.length>150)fail('QA-INVALID-MARKER');}
function slotFor(uid:string):Slot{
 if(!uid||uid.length>200)fail('QA-INVALID-ACTOR');
 return{uid,stateId:mark(),eventId:crypto.randomUUID()};
}
function signedSubject(jwt:string){
 const p=jwt.split('.');
 if(p.length!==3||p.some(v=>!v))fail('QA-JWT-MISSING');
 try{
  const raw=p[1].replace(/-/g,'+').replace(/_/g,'/');
  const body=JSON.parse(atob(raw)) as {sub?:unknown;exp?:unknown};
  if(typeof body.sub!=='string'||body.sub.length===0||typeof body.exp!=='number'||
   body.exp<Date.now()/1000+15)fail('QA-JWT-INVALID');
  return body.sub;
 }catch{fail('QA-JWT-INVALID');}
}
function tamper(jwt:string){
 const p=jwt.split('.');
 if(p.length!==3)return '';
 p[2]=(p[2][0]==='A'?'B':'A')+p[2].slice(1);
 return p.join('.');
}
async function request(jwt:string,method:'GET'|'POST'|'PATCH'|'DELETE',
 table:Table,params:Record<string,string>,body?:Record<string,unknown>,
 requester:QaRequest=fetch){
 const uri=new URL(BASE+'/'+table);
 for(const [k,v] of Object.entries(params))uri.searchParams.set(k,v);
 const response=await requester(uri.toString(),{
  method,cache:'no-store',redirect:'error',credentials:'omit',
  headers:{...(jwt?{Authorization:'Bearer '+jwt}:{}),Accept:'application/json',
   ...(body?{'Content-Type':'application/json'}:{}),
   ...(['POST','PATCH','DELETE'].includes(method)?{Prefer:'return=representation'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 let rows:unknown=null;
 if(response.status>=200&&response.status<300){
  try{rows=await response.json();}catch{rows=null;}
 }
 return{status:response.status,rows};
}
const success=(s:number)=>s>=200&&s<300;
const rejected=(r:{status:number;rows:unknown})=>
 [401,403,404].includes(r.status)||(success(r.status)&&Array.isArray(r.rows)&&r.rows.length===0);
const denied=(r:{status:number})=>[401,403].includes(r.status);
function exactRows(r:{status:number;rows:unknown},count:number){
 if(!success(r.status)||!Array.isArray(r.rows)||r.rows.length!==count)fail('QA-UNEXPECTED-ROWS');
 return r.rows as Record<string,unknown>[];
}
function filterState(id:string){ensureId(id);return{item_type:'eq.preference',item_id:'eq.'+id};}
function filterEvent(id:string){if(!/^[0-9a-f-]{36}$/i.test(id))fail('QA-INVALID-EVENT');return{event_id:'eq.'+id};}
async function owned(jwt:string,slot:Slot,table:Table,run:QaRun,requester:QaRequest){
 const id=table==='li_user_state'?slot.stateId:slot.eventId;
 const where=table==='li_user_state'?filterState(id):filterEvent(id);
 const select=table==='li_user_state'?'owner_id,payload,revision':'owner_id,payload';
 const r=await request(jwt,'GET',table,{...where,select},undefined,requester);
 const rows=exactRows(r,1);
 if(rows[0].owner_id!==slot.uid||rows[0].payload===null||
  typeof rows[0].payload!=='object'||
  (rows[0].payload as Record<string,unknown>).qa_run!==true||
  (rows[0].payload as Record<string,unknown>).run!==run.id||
  (rows[0].payload as Record<string,unknown>).forbidden===true)
  fail('QA-OWNER-OR-MARKER-MISMATCH');
 return rows[0];
}
async function foreignDenied(jwt:string,other:Slot,table:Table,requester:QaRequest){
 const id=table==='li_user_state'?other.stateId:other.eventId;
 const where=table==='li_user_state'?filterState(id):filterEvent(id);
 const read=await request(jwt,'GET',table,{...where,select:'owner_id'},undefined,requester);
 if(!rejected(read))fail('QA-CROSS-SELECT-LEAK');
 // DELETE/PATCH are attempted ONLY on synthetic markers, never personal data.
 const mutation=await request(jwt,table==='li_user_state'?'PATCH':'DELETE',
  table,where,table==='li_user_state'?{payload:{qa_run:true,forbidden:true}}:undefined,requester);
 if(!rejected(mutation))fail('QA-CROSS-MUTATION-ALLOWED');
}
async function seed(jwt:string,run:QaRun,s:Slot,label:'A'|'B',requester:QaRequest){
 const state=await request(jwt,'POST','li_user_state',{},{
  item_type:'preference',item_id:s.stateId,revision:1,
  payload:{qa_run:true,run:run.id,label}
 },requester);
 exactRows(state,1);
 await owned(jwt,s,'li_user_state',run,requester);
 const event=await request(jwt,'POST','li_learning_events',{},{
  event_id:s.eventId,lesson_id:'__li_rls_qa__',kind:'synthetic_rls_test',
  payload:{qa_run:true,run:run.id,label}
 },requester);
 exactRows(event,1);
 await owned(jwt,s,'li_learning_events',run,requester);
}
async function clearOwn(jwt:string,s:Slot,run:QaRun,requester:QaRequest){
 for(const [table,where] of [
  ['li_user_state',filterState(s.stateId)],
  ['li_learning_events',filterEvent(s.eventId)]
 ] as const){
  // Verify actual synthetic owner + run marker BEFORE deleting any row.
  const before=await request(jwt,'GET',table,{...where,select:'owner_id,payload'},undefined,requester);
  if(!success(before.status)||!Array.isArray(before.rows)||before.rows.length>1)
   fail('QA-CLEANUP-PRECHECK-FAILED');
  if(before.rows.length){
   const row=before.rows[0] as Record<string,unknown>;
   const p=row.payload as Record<string,unknown>|null;
   if(row.owner_id!==s.uid||!p||p.qa_run!==true||p.run!==run.id)
    fail('QA-CLEANUP-NOT-SYNTHETIC');
   const d=await request(jwt,'DELETE',table,where,undefined,requester);
   if(!success(d.status))fail('QA-CLEANUP-FAILED');
  }
  const rd=await request(jwt,'GET',table,{...where,select:'owner_id'},undefined,requester);
  if(!success(rd.status)||!Array.isArray(rd.rows)||rd.rows.length!==0)fail('QA-CLEANUP-UNVERIFIED');
 }
 s.cleaned=true;
}
async function updateOwn(jwt:string,s:Slot,run:QaRun,requester:QaRequest){
 const r=await request(jwt,'PATCH','li_user_state',filterState(s.stateId),{
  revision:2,payload:{qa_run:true,run:run.id,updated:true}
 },requester);
 const updated=exactRows(r,1);
 if(updated[0].owner_id!==s.uid||updated[0].revision!==2)fail('QA-OWN-UPDATE-FAILED');
}
async function forgeDenied(jwt:string,victim:Slot,requester:QaRequest,run:QaRun){
 // UUID marker is reserved in the run record BEFORE attempting a forged insert.
 if(!run.forgedStateId){run.forgedStateId=mark();}
 const id=run.forgedStateId;ensureId(id);
 const r=await request(jwt,'POST','li_user_state',{},{
  owner_id:victim.uid,item_type:'preference',item_id:id,
  payload:{qa_run:true,forged:true,run:run.id}
 },requester);
 if(!denied(r))fail('QA-FORGED-OWNER-ALLOWED');
}
/** Recovery path when a malicious forged-owner INSERT ever succeeds.
 * Only B can clean a B-owned synthetic marker; never delete without payload provenance. */
async function clearForgedIfOwned(jwt:string,run:QaRun,requester:QaRequest){
 if(!run.b||!run.forgedStateId)return false;
 const where=filterState(run.forgedStateId);
 const before=await request(jwt,'GET','li_user_state',
  {...where,select:'owner_id,payload'},undefined,requester);
 if(!success(before.status)||!Array.isArray(before.rows)||before.rows.length>1)
  fail('QA-FORGED-CLEANUP-PRECHECK');
 if(before.rows.length===0)return false;
 const row=before.rows[0] as Record<string,unknown>;
 const p=row.payload as Record<string,unknown>|null;
 if(row.owner_id!==run.b.uid||!p||p.qa_run!==true||p.forged!==true||p.run!==run.id)
  fail('QA-FORGED-CLEANUP-NOT-SYNTHETIC');
 const d=await request(jwt,'DELETE','li_user_state',where,undefined,requester);
 if(!success(d.status))fail('QA-FORGED-CLEANUP-FAILED');
 const verify=await request(jwt,'GET','li_user_state',
  {...where,select:'owner_id'},undefined,requester);
 if(!success(verify.status)||!Array.isArray(verify.rows)||verify.rows.length!==0)
  fail('QA-FORGED-CLEANUP-UNVERIFIED');
 return true;
}
async function cInsertDenied(jwt:string,run:QaRun,actor:QaActor,requester:QaRequest){
 if(!run.c)run.c=slotFor(actor.uid);
 if(run.c.uid!==actor.uid)fail('QA-C-ACCOUNT-CHANGED');
 const r=await request(jwt,'POST','li_user_state',{},{
  item_type:'preference',item_id:run.c.stateId,payload:{qa_run:true,run:run.id,label:'C'}
 },requester);
 if(!denied(r))fail('QA-C-INSERT-ALLOWED');
}
export async function cleanupOwnedQa(run:QaRun,actor:QaActor,
 emit:(run:QaRun)=>void,requester:QaRequest=fetch){
 const target=([run.a,run.b,run.c].find(x=>x&&x.uid===actor.uid&&!x.cleaned));
 if(!target)fail('QA-NO-OWN-MARKERS');
 const jwt=await actor.getToken();
 if(!jwt||signedSubject(jwt)!==actor.uid)fail('QA-SESSION-BIND');
 if(run.b&&target.uid===run.b.uid)await clearForgedIfOwned(jwt,run,requester);
 await clearOwn(jwt,target,run,requester);
 emit({...run});
 return {...run};
}
export async function stepQa(run:QaRun,actor:QaActor,
 emit:(run:QaRun)=>void,requester:QaRequest=fetch){
 if(run.v!==1||run.phase==='done')fail('QA-PHASE-INVALID');
 const jwt=await actor.getToken();
 if(!jwt||signedSubject(jwt)!==actor.uid)fail('QA-SESSION-BIND');
 const phase=run.phase;
 const ok=(code:string)=>{run.checks.push(code);emit({...run});};
 if(phase==='start'){
  if(!actor.invited||run.a)fail('QA-A-REQUIRES-INVITE');
  run.a=slotFor(actor.uid);emit({...run}); // persist markers BEFORE network writes
  await seed(jwt,run,run.a,'A',requester);ok('A-OWN-STATE-EVENT');
  for(const table of ['li_user_state','li_learning_events'] as const){
   const noJwt=await request('','GET',table,{select:'owner_id',limit:'1'},undefined,requester);
   if(!denied(noJwt))fail('QA-ANON-ALLOWED');
   const altered=await request(tamper(jwt),'GET',table,{select:'owner_id',limit:'1'},undefined,requester);
   if(!denied(altered))fail('QA-SIGNATURE-ALLOWED');
  }
  ok('ANON-AND-TAMPER-DENIED');
  run.phase='b';
 }else if(phase==='b'){
  if(!actor.invited||!run.a||actor.uid===run.a.uid||run.b)fail('QA-B-WRONG-ACCOUNT');
  await foreignDenied(jwt,run.a,'li_user_state',requester);
  await foreignDenied(jwt,run.a,'li_learning_events',requester);
  ok('B-CANNOT-READ-UPDATE-DELETE-A');
  run.b=slotFor(actor.uid);emit({...run});
  await seed(jwt,run,run.b,'B',requester);ok('B-OWN-STATE-EVENT');
  run.phase='c';
 }else if(phase==='c'){
  if(actor.invited||!run.a||!run.b||actor.uid===run.a.uid||actor.uid===run.b.uid)
   fail('QA-C-MUST-BE-UNINVITED');
  for(const slot of [run.a,run.b]){
   for(const table of ['li_user_state','li_learning_events'] as const){
    const key=table==='li_user_state'?filterState(slot.stateId):filterEvent(slot.eventId);
    const res=await request(jwt,'GET',table,{...key,select:'owner_id'},undefined,requester);
    if(!rejected(res))fail('QA-C-READ-LEAK');
   }
  }
  ok('C-CANNOT-READ-A-OR-B');
  await cInsertDenied(jwt,run,actor,requester);ok('C-CANNOT-INSERT-STATE');
  run.c!.cleaned=true; // denial guarantees no C synthetic row was created
  run.phase='a-finish';
 }else if(phase==='a-finish'){
  if(!actor.invited||!run.a||!run.b||actor.uid!==run.a.uid)fail('QA-A-RETURN-REQUIRED');
  await foreignDenied(jwt,run.b,'li_user_state',requester);
  await foreignDenied(jwt,run.b,'li_learning_events',requester);
  ok('A-CANNOT-READ-UPDATE-DELETE-B');
  await owned(jwt,run.a,'li_user_state',run,requester);
  await owned(jwt,run.a,'li_learning_events',run,requester);
  await forgeDenied(jwt,run.b,requester,run);ok('A-CANNOT-FORGE-B-OWNER');
  await updateOwn(jwt,run.a,run,requester);ok('A-OWN-UPDATE');
  await clearOwn(jwt,run.a,run,requester);ok('A-OWN-CLEANUP');
  run.phase='b-finish';
 }else if(phase==='b-finish'){
  if(!actor.invited||!run.b||actor.uid!==run.b.uid||!run.a?.cleaned)
   fail('QA-B-RETURN-REQUIRED');
  await owned(jwt,run.b,'li_user_state',run,requester);
  await owned(jwt,run.b,'li_learning_events',run,requester);
  const eventUpdate=await request(jwt,'PATCH','li_learning_events',filterEvent(run.b.eventId),
   {payload:{qa_run:true,forbidden_update:true}},requester);
  if(!denied(eventUpdate))fail('QA-EVENT-UPDATE-ALLOWED');
  ok('EVENT-UPDATE-DENIED');
  await updateOwn(jwt,run.b,run,requester);ok('B-OWN-UPDATE');
  const forgedWasCreated=await clearForgedIfOwned(jwt,run,requester);
  if(forgedWasCreated)fail('QA-FORGED-OWNER-ALLOWED');
  await clearOwn(jwt,run.b,run,requester);ok('B-OWN-CLEANUP');
  run.phase='done';
 }
 emit({...run});
 return run;
}
export function safeQaError(e:unknown){
 const m=e instanceof Error?e.message:'';
 if(/^QA-[A-Z-]+$/.test(m))return m;
 return 'QA-NETWORK-OR-RUNTIME';
}
