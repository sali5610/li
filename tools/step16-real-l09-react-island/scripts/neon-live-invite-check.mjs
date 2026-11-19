#!/usr/bin/env node
/**
 * READ-ONLY proof of actual invite-only access through Neon Data API.
 * Never accepts fake/mock JWT as evidence: server must validate real signatures.
 * No learner row writes, admin access, passwords, email addresses or JWT logging.
 * Does not sign users in: A/B must authenticate through official Google OAuth.
 *
 * Run only in a trusted ephemeral environment:
 *   LI_TEST_JWT_A=... LI_TEST_JWT_B=... node scripts/neon-live-invite-check.mjs --check-invites
 * Optional LI_TEST_JWT_C is a separately authorized, genuinely UNINVITED test user.
 */
const API='https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1';
const A=process.env.LI_TEST_JWT_A||'';
const B=process.env.LI_TEST_JWT_B||'';
const C=process.env.LI_TEST_JWT_C||'';
if(process.argv.length!==3||process.argv[2]!=='--check-invites'||!A||!B){
 console.error('DENIED: requires --check-invites with distinct genuine LI_TEST_JWT_A / LI_TEST_JWT_B. No requests made.');
 process.exit(2);
}
function assert(ok,why){if(!ok)throw Error('INVITE_PROOF_FAILED: '+why);}
function claim(jwt){
 if(jwt.split('.').length!==3)throw Error('TEST_JWT_INVALID');
 let obj;
 try{obj=JSON.parse(Buffer.from(jwt.split('.')[1],'base64url').toString('utf8'));}
 catch{throw Error('TEST_JWT_INVALID');}
 if(!obj||typeof obj.sub!=='string'||!obj.sub.trim()||
    obj.role!=='authenticated'||!Number.isFinite(obj.exp)||obj.exp<Date.now()/1000+60)
  throw Error('TEST_JWT_AUTH_OR_EXP_INVALID');
 return obj.sub;
}
const subA=claim(A),subB=claim(B);
assert(subA!==subB,'A/B must be distinct verified users');
if(C){const subC=claim(C);assert(subC!==subA&&subC!==subB,'C must not be A or B');}
function changeSignature(jwt){
 const p=jwt.split('.');
 assert(p[2].length>0,'empty JWT signature');
 p[2]=(p[2][0]==='A'?'B':'A')+p[2].slice(1);
 return p.join('.');
}
async function call(jwt,table,method='POST',body='{}'){
 const response=await fetch(API+'/'+table,{
  method,redirect:'error',credentials:'omit',cache:'no-store',
  headers:{...(jwt?{Authorization:'Bearer '+jwt}:{}),
   Accept:'application/json',...(method==='POST'?{'Content-Type':'application/json'}:{})},
  ...(method==='POST'?{body}:{})
 });
 let data=null;
 try{data=await response.json();}catch{/* return invalid payload as null */}
 return{status:response.status,data};
}
function unauthorized(res){return [401,403,404].includes(res.status);}
function isPositive(res){return res.status>=200&&res.status<300&&res.data===true;}
function isNegative(res){return res.status>=200&&res.status<300&&res.data===false;}
const checks=[];
const anonymous=await call('','rpc/li_is_invited');
assert(unauthorized(anonymous),'anonymous may execute invitation RPC');
checks.push('Anonymous cannot invoke invite RPC');
const forged=await call(changeSignature(A),'rpc/li_is_invited');
assert([401,403].includes(forged.status),'tampered signed JWT accepted by invite RPC');
checks.push('Modified JWT signature denied by Neon');
const allowedA=await call(A,'rpc/li_is_invited');
const allowedB=await call(B,'rpc/li_is_invited');
assert(isPositive(allowedA)&&isPositive(allowedB),'one or both invited Google users are NOT verified/allowed');
checks.push('Real JWT A and B independently authorized by server');
if(C){
 const uninvited=await call(C,'rpc/li_is_invited');
 assert(isNegative(uninvited),'C invitation unexpectedly granted or API failed');
 checks.push('Real signed uninvited C is denied by server');
 const read=await call(C,'li_user_state?select=owner_id&limit=1','GET');
 assert(unauthorized(read)||(read.status===200&&Array.isArray(read.data)&&read.data.length===0),
  'uninvited C read private user state');
 checks.push('Uninvited C cannot read private user state');
}
// Deliberately do NOT claim revoked-session proof: owner must authorize a
// reversible revoke-and-restore drill before checking with an old signed JWT.
console.log('LI_STEP16_LIVE_INVITE_PASS '+JSON.stringify({
 count:checks.length,checks,optionalUninvitedCTested:Boolean(C),
 revokedSessionTested:false,writeOperations:0,
 note:'Real Neon-signed JWT checked through data API. No data was modified.'
}));
