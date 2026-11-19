// li. CUR-02W.6 — ISOLATED LOCAL PILOT. Never deploy as an auth service.
// Real Neon/Google sessions require separate JWKS validation and owner/RLS proof.
import {createServer} from 'node:http';
import {createHmac, timingSafeEqual, randomUUID} from 'node:crypto';

const SEGMENTS=['goal','concept','guided','independent','rubric','recall'];
const localeIds=['vi','en'];
const hidden=/(?:teacher[\s_-]*key|answer[\s_-]*key|reference\s+solution|đáp\s+án\s+mẫu|<\s*(?:script|iframe|embed)|https?:\/\/app\.notion\.com\/p\/41d6cf6db72a81(?:3f8f6cc094eb9ecc16|7a8b9dd8cd6db3246f|50b472d558b6a4ca1a))/i;
function plainObject(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;}
function exactKeys(x,keys){return plainObject(x)&&Object.keys(x).sort().join('|')===keys.slice().sort().join('|');}
function fail(code){const e=new Error(code);e.code=code;throw e;}
function safeString(x,max=15000){return typeof x==='string'&&x.length>0&&x.length<=max&&!hidden.test(x);}
/** Compiles ONLY an already separated editorial learner model. Does not sanitize raw Notion HTML. */
export function compileLearner(input){
 if(!exactKeys(input,['lessonId','version','sourceUrls','locales']))fail('UNKNOWN_LESSON_FIELDS');
 if(!/^[A-Z0-9][A-Z0-9_-]{2,55}$/.test(input.lessonId)||!/^v\d+\.\d+$/.test(input.version))fail('BAD_LESSON_ID_VERSION');
 if(!Array.isArray(input.sourceUrls)||input.sourceUrls.length<1||input.sourceUrls.length>12||
  !input.sourceUrls.every(x=>typeof x==='string'&&/^https:\/\/(?:www\.rabbitmq\.com|kafka\.apache\.org|www2\.eecs\.berkeley\.edu|pubsonline\.informs\.org|catalog\.gatech\.edu)\//.test(x)))fail('UNTRUSTED_SOURCE_URL');
 if(!exactKeys(input.locales,localeIds))fail('LOCALES_REQUIRED');
 const locales={};
 for(const lang of localeIds){
  const o=input.locales[lang];
  if(!exactKeys(o,['title',...SEGMENTS]))fail('UNKNOWN_LEARNER_SEGMENT');
  if(!safeString(o.title,120)||!SEGMENTS.every(k=>safeString(o[k])))fail('UNSAFE_LEARNER_CONTENT');
  locales[lang]={title:o.title,...Object.fromEntries(SEGMENTS.map(k=>[k,o[k]]))};
 }
 return {schema:'li-learner-v1',lessonId:input.lessonId,version:input.version,sourceUrls:[...input.sourceUrls],locales};
}
function parseJSON(txt){try{return JSON.parse(txt);}catch{return null;}}
function jwtCheck(value,{secret,issuer,audience,now}){
 if(typeof value!=='string'||value.length>6000)return null;
 const parts=value.split('.');if(parts.length!==3||parts.some(s=>!/^[A-Za-z0-9_-]+$/.test(s)))return null;
 let h,p;try{h=parseJSON(Buffer.from(parts[0],'base64url').toString('utf8'));p=parseJSON(Buffer.from(parts[1],'base64url').toString('utf8'));}catch{return null;}
 if(!exactKeys(h,['alg','typ'])||h.alg!=='HS256'||h.typ!=='JWT'||!plainObject(p))return null;
 const validSig=createHmac('sha256',secret).update(parts[0]+'.'+parts[1]).digest();
 let supplied;try{supplied=Buffer.from(parts[2],'base64url');}catch{return null;}
 if(supplied.length!==validSig.length||!timingSafeEqual(supplied,validSig))return null;
 const t=now();
 if(p.iss!==issuer||p.aud!==audience||typeof p.sub!=='string'||!p.sub||
  !Number.isSafeInteger(p.exp)||p.exp<=t||!Number.isSafeInteger(p.iat)||p.iat>t+30||
  (p.nbf!==undefined&&(!Number.isSafeInteger(p.nbf)||p.nbf>t)))return null;
 return p;
}
function responder(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(data));}
async function jsonBody(req){
 let size=0,parts=[];for await(const c of req){size+=c.length;if(size>16_384)fail('BODY_TOO_LARGE');parts.push(c);}
 const raw=Buffer.concat(parts).toString('utf8');const x=parseJSON(raw);
 if(!plainObject(x))fail('INVALID_JSON');return x;
}
/** Local-only HTTP endpoint fixture. jwtCheck uses a TEST HMAC key, NOT Neon JWKS. */
export function makePilot({secret,issuer='li-test-auth',audience='li-test-content',invited,learner,teacherKey,now=()=>Math.floor(Date.now()/1000),verifyPrincipal=null}){
 // This opt-in accepts ONLY a server-owned verifier returning a signed principal.
 // It never downgrades to HS256 after an external verification failure.
 const external=typeof verifyPrincipal==='function';
 if((!external && (typeof secret!=='string'||secret.length<32))||
   (external && secret!==undefined)||
   (verifyPrincipal!==null && !external)||
   !(invited instanceof Set)||!plainObject(teacherKey))fail('BAD_LOCAL_SETUP');
 const publicLesson=compileLearner(learner);
 if(!exactKeys(teacherKey,['lessonId','version','keyVersion','expected'])||teacherKey.lessonId!==publicLesson.lessonId||teacherKey.version!==publicLesson.version||!safeString(teacherKey.expected,200))fail('BAD_TEACHER_KEY');
 const attempts=new Map();
 const server=createServer(async(req,res)=>{
  try{
   const path=new URL(req.url||'/', 'http://localhost').pathname;
   const authorization=req.headers.authorization||'';
   let principal=null;
   if(authorization.startsWith('Bearer ')){
    const bearer=authorization.slice(7);
    if(external){
     try{
      const checked=await verifyPrincipal(bearer);
      if(checked && typeof checked.sub==='string'&&checked.sub.length>0&&checked.sub.length<=200)
       principal={sub:checked.sub};
     }catch{principal=null;} // fail closed, never fall back to a test secret.
    }else principal=jwtCheck(bearer,{secret,issuer,audience,now});
   }
   if(!principal)return responder(res,401,{code:'AUTH_REQUIRED'});
   if(!invited.has(principal.sub))return responder(res,403,{code:'INVITE_REQUIRED'});
   if(req.method==='GET'&&/^\/api\/lessons\/[^/]+\/(vi|en)$/.test(path)){
    const [,,,lessonId,locale]=path.split('/');
    if(lessonId!==publicLesson.lessonId)return responder(res,404,{code:'NOT_FOUND'});
    return responder(res,200,{schema:publicLesson.schema,lessonId,version:publicLesson.version,sourceUrls:publicLesson.sourceUrls,locale,content:publicLesson.locales[locale]});
   }
   if(req.method==='POST'&&path==='/api/attempts/draft'){
    const input=await jsonBody(req);
    if(!exactKeys(input,['lessonId','version'])||input.lessonId!==publicLesson.lessonId||input.version!==publicLesson.version)return responder(res,422,{code:'BAD_ASSESSMENT'});
    const id=randomUUID();attempts.set(id,{id,sub:principal.sub,lessonId:input.lessonId,version:input.version,keyVersion:teacherKey.keyVersion,status:'draft'});
    return responder(res,201,{attemptId:id,status:'draft'});
   }
   const match=path.match(/^\/api\/attempts\/([0-9a-f-]{36})\/(submit|feedback)$/i);
   if(match){
    const a=attempts.get(match[1]);
    if(!a||a.sub!==principal.sub)return responder(res,404,{code:'NOT_FOUND'});
    if(a.version!==publicLesson.version||a.keyVersion!==teacherKey.keyVersion)return responder(res,409,{code:'VERSION_STALE'});
    if(req.method==='POST'&&match[2]==='submit'){
     const input=await jsonBody(req);
     if(!exactKeys(input,['answer'])||!safeString(input.answer,1000))return responder(res,422,{code:'BAD_ANSWER'});
     if(a.status!=='draft')return responder(res,409,{code:'ALREADY_SUBMITTED'});
     a.status='evaluated';a.submittedAt=now();a.evaluatedAt=now();
     a.score=input.answer.trim()===teacherKey.expected?1:0;
     return responder(res,200,{status:'evaluated',attemptId:a.id});
    }
    if(req.method==='GET'&&match[2]==='feedback'){
     if(a.status!=='evaluated'||!a.submittedAt||!a.evaluatedAt)return responder(res,409,{code:'NOT_EVALUATED'});
     return responder(res,200,{attemptId:a.id,lessonId:a.lessonId,version:a.version,score:a.score,maxScore:1,feedback:a.score?'Criterion met':'Review required'});
    }
   }
   return responder(res,404,{code:'NOT_FOUND'});
  }catch(e){return responder(res,e?.code==='BODY_TOO_LARGE'?413:400,{code:['BODY_TOO_LARGE','INVALID_JSON'].includes(e?.code)?e.code:'BAD_REQUEST'});}
 });
 return{server,attemptCount:()=>attempts.size,privateTeacherKeyNeverSerialized:true};
}
