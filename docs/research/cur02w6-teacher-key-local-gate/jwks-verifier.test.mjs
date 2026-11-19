// Synthetic asymmetric keys ONLY. No external JWKS HTTP calls and no Neon credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {makePinnedJwksVerifier} from './jwks-verifier.mjs';

const ISS='https://auth.example.test/li';
const AUD='li-teacher-feedback-local';
const URL='https://auth.example.test/jwks';
let clock=1900000000;
const rsa=generateKeyPairSync('rsa',{modulusLength:2048});
const ec=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
function publicJwk(pair,kid,alg){return {...pair.publicKey.export({format:'jwk'}),kid,alg,use:'sig',key_ops:['verify']};}
const rsaKey=publicJwk(rsa,'rsa-v1','RS256'),ecKey=publicJwk(ec,'ec-v1','ES256');
function jwt({pair=rsa,alg='RS256',kid='rsa-v1',payload={},header={}}={}){
 const h={alg,kid,typ:'JWT',...header};
 const p={iss:ISS,aud:AUD,sub:'invited-A',iat:clock-5,exp:clock+1200,...payload};
 const two=[h,p].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 const signature=sign('sha256',Buffer.from(two),alg==='ES256'?{key:pair.privateKey,dsaEncoding:'ieee-p1363'}:pair.privateKey);
 return two+'.'+signature.toString('base64url');
}
function fixture({keys=[rsaKey,ecKey],cacheSeconds=300}={}){
 let active=keys;const requests=[];
 const verify=makePinnedJwksVerifier({issuer:ISS,audience:AUD,jwksUrl:URL,cacheSeconds,now:()=>clock,
  fetcher:async(url,options)=>{
   requests.push({url,options});
   return {ok:true,text:async()=>JSON.stringify({keys:active})};
  }});
 return{verify,requests,setKeys:x=>{active=x;}};
}
async function denied(verify,token){await assert.rejects(()=>verify(token),e=>e.message==='UNAUTHORIZED');}

test('RS256 signature, issuer/audience, real crypto public-key verification',async()=>{
 const f=fixture();const p=await f.verify(jwt());
 assert.equal(p.sub,'invited-A');assert.equal(p.iss,ISS);assert.equal(p.aud,AUD);
 assert.equal(f.requests.length,1);assert.equal(f.requests[0].url,URL);
 assert.equal(f.requests[0].options.redirect,'error');
});
test('ES256 via P-1363 signature and exact EC P-256 JWK',async()=>{
 const f=fixture();const p=await f.verify(jwt({pair:ec,alg:'ES256',kid:'ec-v1'}));assert.equal(p.sub,'invited-A');
});
test('unmodified signed token reuses bounded cached public JWKS',async()=>{
 const f=fixture();await f.verify(jwt());await f.verify(jwt());assert.equal(f.requests.length,1);
});
test('cache expiry rotates public signing key with new kid',async()=>{
 const t=clock;try{
  const f=fixture({keys:[rsaKey],cacheSeconds:1});await f.verify(jwt());
  const newer=generateKeyPairSync('rsa',{modulusLength:2048});
  f.setKeys([publicJwk(newer,'rsa-v2','RS256')]);
  await denied(f.verify,jwt({pair:newer,kid:'rsa-v2'})); // no forced remote fetch before TTL
  clock=t+2;
  const p=await f.verify(jwt({pair:newer,kid:'rsa-v2'}));assert.equal(p.sub,'invited-A');
  assert.equal(f.requests.length,2);
 }finally{clock=t;}
});
for(const [title,change] of [
 ['wrong issuer',x=>x.payload={iss:'https://fake.example.test'}],
 ['wrong audience',x=>x.payload={aud:'different-service'}],
 ['expired',x=>x.payload={exp:clock-1}],
 ['future issued-at',x=>x.payload={iat:clock+900}],
 ['future not-before',x=>x.payload={nbf:clock+900}],
 ['missing subject',x=>x.payload={sub:''}],
 ['array audience not silently accepted',x=>x.payload={aud:[AUD,'other']}],
 ['forged public-key kid',x=>x.kid='rsa-other'],
 ['none alg',x=>x.alg='none'],
 ['HS256 alg confusion',x=>x.alg='HS256'],
 ['untrusted jku override',x=>x.header={jku:'https://evil.example/jwks'}],
 ['JWK embedded override',x=>x.header={jwk:rsaKey}],
 ['critical header',x=>x.header={crit:['b64']}]
])test('DENY '+title,async()=>{const o={};change(o);await denied(fixture().verify,jwt(o));});
test('DENY tampered payload (signature invalid)',async()=>{
 const token=jwt();const parts=token.split('.');
 parts[1]=Buffer.from(JSON.stringify({iss:ISS,aud:AUD,sub:'invited-B',iat:clock-5,exp:clock+1200})).toString('base64url');
 await denied(fixture().verify,parts.join('.'));
});
test('DENY duplicated kid in JWKS (no ambiguous selection)',async()=>{
 await denied(fixture({keys:[rsaKey,rsaKey]}).verify,jwt());
});
test('DENY unusable or wrong JWK key types',async()=>{
 for(const altered of [{...rsaKey,use:'enc'},{...rsaKey,alg:'ES256'},{...rsaKey,key_ops:['sign']},{...rsaKey,kty:'EC'},{...rsaKey,d:'PRIVATE_KEY_FIELD'}]){
  await denied(fixture({keys:[altered]}).verify,jwt());
 }
});
test('DENY JWKS remote failure (never fallback to unchecked JWT)',async()=>{
 const verify=makePinnedJwksVerifier({issuer:ISS,audience:AUD,jwksUrl:URL,
  fetcher:async()=>({ok:false,text:async()=>''}),now:()=>clock});
 await denied(verify,jwt());
});
test('DENY JWKS oversized or malformed response',async()=>{
 for(const value of ['{broken','x'.repeat(70000),JSON.stringify({keys:[]})]){
  const verify=makePinnedJwksVerifier({issuer:ISS,audience:AUD,jwksUrl:URL,
   fetcher:async()=>({ok:true,text:async()=>value}),now:()=>clock});
  await denied(verify,jwt());
 }
});
test('DENY user-controlled localhost and non-HTTPS JWKS config',()=>{
 for(const url of ['http://auth.example.test/jwks','https://localhost/jwks','https://user:pass@auth.example.test/jwks','https://auth.example.test/jwks?foo=bar']){
  assert.throws(()=>makePinnedJwksVerifier({issuer:ISS,audience:AUD,jwksUrl:url}),/UNAUTHORIZED/);
 }
});
test('DENY JWT with no signature and malformed compact shape',async()=>{
 const f=fixture();for(const value of ['', 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJBIn0.', 'bad.token','../../secret', 'x'.repeat(12001)])await denied(f.verify,value);
});
