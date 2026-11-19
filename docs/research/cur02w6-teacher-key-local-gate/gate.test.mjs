// ISOLATED TESTS: synthetic identities and synthetic teacher key. No Neon/Notion/Google calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {compileLearner,makePilot} from './gate.mjs';

const SECRET='DEV_ONLY_FAKE_SECRET_42_CHARS_NOT_A_REAL_KEY';
const ANSWER='INTERNAL_EXPECTED_73929';
const now=()=>1_900_000_000;
function token(sub='A',changes={},header={alg:'HS256',typ:'JWT'}){
 const payload={iss:'li-test-auth',aud:'li-test-content',sub,iat:now()-100,exp:now()+1000,...changes};
 const encoded=[header,payload].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url'));
 const sig=createHmac('sha256',SECRET).update(encoded.join('.')).digest('base64url');
 return [...encoded,sig].join('.');
}
const vi={title:'Tin học giả lập',goal:'Recognize events and success limits',concept:'Receipt != order.',guided:'Example demo - 12 items.',independent:'Independently find failure in event evt-73.',rubric:'Two criteria, 0/1 each.',recall:'Describe the failure window.'};
const en={title:'Synthetic computer science',goal:'Trace delivery assumptions',concept:'Publication and ACK differ.',guided:'Example demo - 13 items.',independent:'Independently analyze event evt-73.',rubric:'Two criteria, 0/1 each.',recall:'Explain retries.'};
const learner={lessonId:'F04Q_RD01',version:'v0.1',sourceUrls:['https://www.rabbitmq.com/docs/confirms'],locales:{vi,en}};
const teacherKey={lessonId:'F04Q_RD01',version:'v0.1',keyVersion:'key01',expected:ANSWER};

function invalidCopy(edit){const obj=structuredClone(learner);edit(obj);return obj;}
test('compile allows only whitelisted bilingual learner blocks',()=>{
 const p=compileLearner(learner);
 assert.equal(p.schema,'li-learner-v1');assert.deepEqual(Object.keys(p.locales).sort(),['en','vi']);
 assert.equal(p.locales.en.independent,en.independent);
 assert.ok(!JSON.stringify(p).includes(ANSWER));
});
for(const [name,mutate] of [
 ['teacher key at top level',x=>x.teacherKey={answer:ANSWER}],
 ['private answer key in VI',x=>x.locales.vi.answerKey=ANSWER],
 ['unknown locale',x=>x.locales.fr={...en}],
 ['missing EN',x=>delete x.locales.en],
 ['VI independent missing',x=>x.locales.vi.independent=''],
 ['HTML script in guided',x=>x.locales.vi.guided='<script>window.data=1</script>'],
 ['iframe in EN',x=>x.locales.en.concept='<iframe src=foo />'],
 ['answer marker in EN',x=>x.locales.en.recall='REFERENCE SOLUTION'],
 ['teacher marker in metadata',x=>x.locales.en.title='TEACHER KEY'],
 ['untrusted source URL',x=>x.sourceUrls=['https://example.test/private']],
 ['extra arbitrary source property',x=>x.sourceUrls.push(22)],
 ['non-versioned content',x=>x.version='draft'],
 ['wrong title type',x=>x.locales.vi.title={text:'hello'}]
])test('compiler FAIL CLOSED: '+name,()=>assert.throws(()=>compileLearner(invalidCopy(mutate))));

const invited=new Set(['A','B']);
const pilot=makePilot({secret:SECRET,invited,learner,teacherKey,now});
let base;
async function ask(path,{method='GET',identity=token(),data,rawBody,header}={}){
 const h={...(identity?{Authorization:'Bearer '+identity}:{}),...(data||rawBody?{'Content-Type':'application/json'}:{}),...(header||{})};
 const res=await fetch(base+path,{method,headers:h,...(data?{body:JSON.stringify(data)}:rawBody!==undefined?{body:rawBody}:{})});
 const text=await res.text();let body;try{body=JSON.parse(text);}catch{body=text;}
 assert.equal(res.headers.get('cache-control'),'private, no-store');
 assert.equal(res.headers.get('x-content-type-options'),'nosniff');
 assert.ok(!text.includes(ANSWER),'teacher key must not appear in any network response');
 return{status:res.status,body};
}
test('local HTTP server: signed JWT, invited-user isolation, post-submit feedback',async()=>{
 await new Promise(resolve=>pilot.server.listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+pilot.server.address().port;
 try{
  const publicVi=await ask('/api/lessons/F04Q_RD01/vi');
  assert.equal(publicVi.status,200);assert.equal(publicVi.body.content.independent,vi.independent);
  assert.ok(!JSON.stringify(publicVi.body).includes('teacherKey'));
  const publicEn=await ask('/api/lessons/F04Q_RD01/en');
  assert.equal(publicEn.status,200);assert.equal(publicEn.body.content.independent,en.independent);
  const notFound=await ask('/api/lessons/F04Q_RD02/vi');assert.equal(notFound.status,404);
  const checks=[
   ['anonymous',null,401],
   ['expired',token('A',{exp:now()-1}),401],
   ['future nbf',token('A',{nbf:now()+100}),401],
   ['wrong audience',token('A',{aud:'other-app'}),401],
   ['wrong issuer',token('A',{iss:'other-auth'}),401],
   ['not invited',token('C'),403],
   ['alg none',token('A',{}, {alg:'none',typ:'JWT'}),401],
   ['JWT with future iat',token('A',{iat:now()+3600}),401],
   ['missing sub',token('A',{sub:''}),401],
   ['bad signature',token('A').slice(0,-1)+'x',401],
  ];
  for(const [name,identity,status] of checks){const r=await ask('/api/lessons/F04Q_RD01/vi',{identity});assert.equal(r.status,status,name);}
  const a=await ask('/api/attempts/draft',{method:'POST',data:{lessonId:'F04Q_RD01',version:'v0.1'}});
  assert.equal(a.status,201);assert.equal(a.body.status,'draft');const id=a.body.attemptId;
  assert.match(id,/^[0-9a-f-]{36}$/i);
  assert.equal((await ask('/api/attempts/'+id+'/feedback')).status,409,'no pre-submit feedback');
  assert.equal((await ask('/api/attempts/'+id+'/feedback',{identity:token('B')})).status,404,'deny other owner');
  assert.equal((await ask('/api/attempts/'+id+'/submit',{method:'POST',identity:token('B'),data:{answer:ANSWER}})).status,404,'deny another member submission');
  assert.equal((await ask('/api/attempts/'+id+'/submit',{method:'POST',data:{answer:ANSWER,ownerSub:'B'}})).status,422,'reject client-claimed owner');
  assert.equal((await ask('/api/attempts/'+id+'/submit',{method:'POST',data:{answer:ANSWER}})).status,200);
  assert.equal((await ask('/api/attempts/'+id+'/submit',{method:'POST',data:{answer:ANSWER}})).status,409,'deny duplicate submit');
  const feedback=await ask('/api/attempts/'+id+'/feedback');
  assert.equal(feedback.status,200);assert.equal(feedback.body.score,1);
  assert.ok(!JSON.stringify(feedback.body).includes('expected'));
  assert.equal((await ask('/api/attempts/'+id+'/feedback',{identity:token('B')})).status,404);
  assert.equal((await ask('/api/attempts/'+id+'/feedback',{identity:token('C')})).status,403);
  assert.equal((await ask('/api/teacher-key/'+id)).status,404,'no public raw key route');
  invited.delete('A');
  assert.equal((await ask('/api/attempts/'+id+'/feedback')).status,403,'revoked invitation denies even evaluated result');
  invited.add('A');
  teacherKey.keyVersion='key02';
  assert.equal((await ask('/api/attempts/'+id+'/feedback')).status,409,'key rotation invalidates stale attempt');
  teacherKey.keyVersion='key01';
  assert.equal((await ask('/api/attempts/'+id+'/feedback')).status,200,'original matching version restored');
  assert.equal((await ask('/api/attempts/draft',{method:'POST',data:{lessonId:'F04Q_RD01',version:'v1.0'}})).status,422);
  assert.equal((await ask('/api/attempts/draft',{method:'POST',data:{lessonId:'F04Q_RD01',version:'v0.1',score:1}})).status,422);
  const a2=await ask('/api/attempts/draft',{method:'POST',data:{lessonId:'F04Q_RD01',version:'v0.1'}});
  assert.equal((await ask('/api/attempts/'+a2.body.attemptId+'/submit',{method:'POST',rawBody:'{broken'})).status,400);
  assert.equal((await ask('/api/attempts/'+a2.body.attemptId+'/feedback')).status,409);
  assert.equal(pilot.attemptCount(),2);
 }finally{await new Promise((resolve,reject)=>pilot.server.close(e=>e?reject(e):resolve()));}
});
