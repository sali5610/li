// CUR-02W.8: signed synthetic RS256 token through real local HTTP + teacher-key gate.
// No Neon session, private key, Notion answer key or app production endpoint.
import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign} from 'node:crypto';
import {makePinnedJwksVerifier} from './jwks-verifier.mjs';
import {makePilot} from './gate.mjs';

const now=()=>1900000000;
const issuer='https://synthetic.auth.example.test/li';
const audience='li-local-teacher-feedback';
const jwksUrl='https://synthetic.auth.example.test/jwks';
const key1=generateKeyPairSync('rsa',{modulusLength:2048});
const key2=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=(key,kid)=>({...key.publicKey.export({format:'jwk'}),kid,alg:'RS256',use:'sig'});
function jwt(subject='A',patch={},pair=key1,kid='v1'){
 const header={alg:'RS256',typ:'JWT',kid};
 const claims={iss:issuer,aud:audience,sub:subject,iat:now()-10,exp:now()+600,...patch};
 const data=[header,claims].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');
 return data+'.'+sign('sha256',Buffer.from(data),pair.privateKey).toString('base64url');
}
function setup({initialKeys=[jwk(key1,'v1')],fetchError=false}={}){
 let keys=initialKeys,called=0;
 const verifier=makePinnedJwksVerifier({issuer,audience,jwksUrl,now,cacheSeconds:3,
  fetcher:async()=>{called++;return fetchError?{ok:false,text:async()=>''}:{ok:true,text:async()=>JSON.stringify({keys})};}});
 const invited=new Set(['A','B']);
 const lesson={lessonId:'F04Q_RD01',version:'v0.1',sourceUrls:['https://www.rabbitmq.com/docs/confirms'],locales:{}};
 for(const loc of ['vi','en'])lesson.locales[loc]={title:'Synthetic '+loc,goal:'Trace an event',concept:'ACK != confirm',guided:'Demonstrate a retry with another id',independent:'Analyze invented event alpha-17',rubric:'Explain two criteria',recall:'Recall one failure mode'};
 const teacherKey={lessonId:'F04Q_RD01',version:'v0.1',keyVersion:'test-key01',expected:'SYNTHETIC_EXPECTED_011'};
 const pilot=makePilot({verifyPrincipal:verifier,invited,learner:lesson,teacherKey,now});
 return {pilot,invited,teacherKey,setKeys:k=>{keys=k;},calls:()=>called};
}
async function withServer(f,fn){
 await new Promise(resolve=>f.pilot.server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+f.pilot.server.address().port;
 async function ask(path,{token=jwt(),method='GET',json}={}){
  const response=await fetch(base+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(json?{'Content-Type':'application/json'}:{})},...(json?{body:JSON.stringify(json)}:{})});
  const raw=await response.text();
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.ok(!raw.includes(f.teacherKey.expected),'no teacher answer leaks across HTTP responses');
  const body=JSON.parse(raw);
  return {status:response.status,body};
 }
 try{return await fn(ask,f);}finally{await new Promise((resolve,reject)=>f.pilot.server.close(err=>err?reject(err):resolve()));}
}

test('injecting verified principal rejects ambiguous HS256 + JWKS config',()=>{
 const f=setup();assert.ok(f.pilot.server);
 assert.throws(()=>makePilot({secret:'A'.repeat(40),verifyPrincipal:async()=>({sub:'A'}),invited:new Set(['A']),learner:{},teacherKey:{}}),/BAD_LOCAL_SETUP/);
});
test('RS256 signed A can read VI and EN; no key in payload',async()=>{
 await withServer(setup(),async ask=>{
  for(const loc of ['vi','en']){
   const r=await ask('/api/lessons/F04Q_RD01/'+loc);
   assert.equal(r.status,200);assert.equal(r.body.locale,loc);assert.ok(!JSON.stringify(r.body).includes('teacherKey'));
  }
 });
});
test('RS256 signed A owns attempt; B never reads or submits A; no early feedback',async()=>{
 await withServer(setup(),async ask=>{
  const draft=await ask('/api/attempts/draft',{method:'POST',json:{lessonId:'F04Q_RD01',version:'v0.1'}});
  assert.equal(draft.status,201);const id=draft.body.attemptId;
  assert.equal((await ask('/api/attempts/'+id+'/feedback')).status,409);
  assert.equal((await ask('/api/attempts/'+id+'/feedback',{token:jwt('B')})).status,404);
  assert.equal((await ask('/api/attempts/'+id+'/submit',{token:jwt('B'),method:'POST',json:{answer:'anything'}})).status,404);
  assert.equal((await ask('/api/attempts/'+id+'/submit',{method:'POST',json:{answer:'SYNTHETIC_EXPECTED_011'}})).status,200);
  const good=await ask('/api/attempts/'+id+'/feedback');assert.equal(good.status,200);assert.equal(good.body.score,1);
  assert.equal((await ask('/api/teacher-key/'+id)).status,404);
 });
});
test('signature tamper, wrong issuer/audience, expired and alg-confusion are denied on HTTP',async()=>{
 await withServer(setup(),async ask=>{
  const a=jwt();const three=a.split('.');three[1]=Buffer.from(JSON.stringify({iss:issuer,aud:audience,sub:'B',iat:now()-10,exp:now()+600})).toString('base64url');
  const tokens=[three.join('.'),jwt('A',{iss:'https://attacker.invalid'}),jwt('A',{aud:'another-service'}),jwt('A',{exp:now()-1}),jwt('A',{nbf:now()+500})];
  for(const token of tokens)assert.equal((await ask('/api/lessons/F04Q_RD01/en',{token})).status,401);
  const fake=jwt().split('.');fake[0]=Buffer.from(JSON.stringify({alg:'none',kid:'v1',typ:'JWT'})).toString('base64url');
  assert.equal((await ask('/api/lessons/F04Q_RD01/vi',{token:fake.join('.')})).status,401);
 });
});
test('uninvited C denied and invitation A revocation affects evaluated attempt',async()=>{
 const f=setup();await withServer(f,async ask=>{
  assert.equal((await ask('/api/lessons/F04Q_RD01/vi',{token:jwt('C')})).status,403);
  const draft=await ask('/api/attempts/draft',{method:'POST',json:{lessonId:'F04Q_RD01',version:'v0.1'}});
  const id=draft.body.attemptId;
  await ask('/api/attempts/'+id+'/submit',{method:'POST',json:{answer:'SYNTHETIC_EXPECTED_011'}});
  f.invited.delete('A');assert.equal((await ask('/api/attempts/'+id+'/feedback')).status,403);
 });
});
test('key version rotation invalidates previously evaluated attempt',async()=>{
 const f=setup();await withServer(f,async ask=>{
  const draft=await ask('/api/attempts/draft',{method:'POST',json:{lessonId:'F04Q_RD01',version:'v0.1'}});
  const id=draft.body.attemptId;await ask('/api/attempts/'+id+'/submit',{method:'POST',json:{answer:'Not equal'}});
  f.teacherKey.keyVersion='test-key02';assert.equal((await ask('/api/attempts/'+id+'/feedback')).status,409);
 });
});
test('malformed signature and JWKS network failure DENY, without test-HS256 fallback',async()=>{
 const f=setup({fetchError:true});await withServer(f,async ask=>{
  assert.equal((await ask('/api/lessons/F04Q_RD01/vi')).status,401);
  assert.equal((await ask('/api/lessons/F04Q_RD01/en',{token:'invalid.unsigned.token'})).status,401);
 });
});
test('unknown signing kid cannot bypass the currently pinned JWKS cache',async()=>{
 const f=setup();await withServer(f,async ask=>{
  assert.equal((await ask('/api/lessons/F04Q_RD01/vi')).status,200);
  f.setKeys([jwk(key2,'v2')]);
  assert.equal((await ask('/api/lessons/F04Q_RD01/vi',{token:jwt('A',{},key2,'v2')})).status,401);
 });
});
