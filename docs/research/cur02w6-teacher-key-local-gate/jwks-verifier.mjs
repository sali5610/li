// CUR-02W.7 — isolated, server-only JWT/JWKS verifier pilot. Never ship to the client.
// Caller must pin Neon issuer, audience and JWKS URL from reviewed real configuration.
import {createPublicKey, verify as verifySignature} from 'node:crypto';

const B64=/^[A-Za-z0-9_-]+$/;
const KID=/^[A-Za-z0-9._:-]{1,128}$/;
const SUPPORTED=new Set(['RS256','ES256']);
const fail=()=>{throw new Error('UNAUTHORIZED');};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function decode(part){
  if(!part||!B64.test(part)||part.length>8192)fail();
  let value;
  try{value=JSON.parse(Buffer.from(part,'base64url').toString('utf8'));}catch{fail();}
  if(!object(value))fail();
  return value;
}
function validConfig({issuer,audience,jwksUrl,algorithms,cacheSeconds}){
  if(typeof issuer!=='string'||!issuer.startsWith('https://')||
    typeof audience!=='string'||!audience||!Array.isArray(algorithms)||
    !algorithms.length||algorithms.some(a=>!SUPPORTED.has(a))||
    !Number.isSafeInteger(cacheSeconds)||cacheSeconds<1||cacheSeconds>3600)fail();
  let url;
  try{url=new URL(jwksUrl);}catch{fail();}
  if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search||
    !url.hostname||url.hostname==='localhost'||url.hostname.endsWith('.localhost'))fail();
  return url.toString();
}
function selectKey(jwks,head){
  if(!object(jwks)||!Array.isArray(jwks.keys)||jwks.keys.length>32)fail();
  const matches=jwks.keys.filter(k=>object(k)&&k.kid===head.kid);
  if(matches.length!==1)fail();
  const key=matches[0];
  if('d' in key||'p' in key||'q' in key||'dp' in key||'dq' in key)fail();
  if(key.use!==undefined&&key.use!=='sig')fail();
  if(key.key_ops!==undefined&&(!Array.isArray(key.key_ops)||!key.key_ops.includes('verify')))fail();
  if(key.alg!==undefined&&key.alg!==head.alg)fail();
  if(head.alg==='RS256'&&(key.kty!=='RSA'||typeof key.n!=='string'||typeof key.e!=='string'))fail();
  if(head.alg==='ES256'&&(key.kty!=='EC'||key.crv!=='P-256'||typeof key.x!=='string'||typeof key.y!=='string'))fail();
  try{return createPublicKey({key,format:'jwk'});}catch{fail();}
}
/** Injectable fetch makes local tests deterministic. This is NOT connected to Neon. */
export function makePinnedJwksVerifier({issuer,audience,jwksUrl,algorithms=['RS256','ES256'],cacheSeconds=300,
  fetcher=fetch,now=()=>Math.floor(Date.now()/1000)}={}){
  const pinned=validConfig({issuer,audience,jwksUrl,algorithms,cacheSeconds});
  if(typeof fetcher!=='function'||typeof now!=='function')fail();
  let jwks=null,expires=0;
  async function load(){
    const response=await fetcher(pinned,{method:'GET',redirect:'error',cache:'no-store',headers:{Accept:'application/json'}});
    if(!response||response.ok!==true)fail();
    const raw=await response.text();
    if(raw.length>65536)fail();
    let parsed;try{parsed=JSON.parse(raw);}catch{fail();}
    if(!object(parsed)||!Array.isArray(parsed.keys)||parsed.keys.length<1||parsed.keys.length>32)fail();
    jwks=parsed;expires=now()+cacheSeconds;
  }
  return async function verifyJwt(token){
    try{
      if(typeof token!=='string'||token.length>12000)fail();
      const pieces=token.split('.');
      if(pieces.length!==3||pieces.some(p=>!p||!B64.test(p)))fail();
      const header=decode(pieces[0]);
      if(!SUPPORTED.has(header.alg)||!algorithms.includes(header.alg)||!KID.test(header.kid)||
        (header.typ!==undefined&&header.typ!=='JWT')||'crit' in header||'jku' in header||'jwk' in header||'x5u' in header)fail();
      if(!jwks||expires<=now())await load();
      const publicKey=selectKey(jwks,header);
      const data=Buffer.from(pieces[0]+'.'+pieces[1]);
      const sig=Buffer.from(pieces[2],'base64url');
      const options=header.alg==='ES256'?{key:publicKey,dsaEncoding:'ieee-p1363'}:publicKey;
      if(!verifySignature('sha256',data,options,sig))fail();
      const claims=decode(pieces[1]);
      const t=now();
      if(claims.iss!==issuer||claims.aud!==audience||typeof claims.sub!=='string'||
        !claims.sub||claims.sub.length>200||!Number.isSafeInteger(claims.exp)||claims.exp<=t||
        !Number.isSafeInteger(claims.iat)||claims.iat>t+30||
        (claims.nbf!==undefined&&(!Number.isSafeInteger(claims.nbf)||claims.nbf>t+30)))fail();
      return {sub:claims.sub,iss:claims.iss,aud:claims.aud,exp:claims.exp};
    }catch{fail();} // Do not disclose JWT/key/internal provider error to clients.
  };
}
