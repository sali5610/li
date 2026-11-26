/** Bounded read-only recovery for a waking managed session. A false RPC
 * result immediately invalidates the local receipt and stays locked; confirm
 * it once with a fresh session and token. Never grant without a true RPC.
 * Mismatch, invalid payload, forbidden and rate limit errors are terminal. */
export function isRecoverableInviteFailure(problem:unknown):boolean{
 const message=problem instanceof Error?problem.message:'';
 return problem instanceof TypeError||
  ['INVITE_AUTH_SESSION_FAILED','INVITE_JWT_REQUIRED','NEON_AUTH_JWT_FETCH_FAILED',
   'NEON_AUTH_JWT_HTTP_401','INVITE_CHECK_HTTP_401','INVITE_CHECK_TIMEOUT'].includes(message)||
  /^(?:NEON_AUTH_JWT_HTTP_|INVITE_CHECK_HTTP_)5[0-9]{2}$/.test(message);
}
export async function recoverInviteAccess(
 verify:()=>Promise<boolean>,active:()=>boolean,
 pause:(ms:number)=>Promise<void>=ms=>new Promise(resolve=>setTimeout(resolve,ms)),
 timeoutMs=6000,
 onDenial:()=>void=()=>{}
):Promise<boolean>{
 const delays=[0,500,1000];
 let denied=false;
 for(let i=0;i<delays.length;i++){
  if(delays[i])await pause(delays[i]);
  if(!active())throw new Error('INVITE_CHECK_CANCELLED');
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const result=await Promise.race([verify(),new Promise<never>((_,reject)=>{
    timer=setTimeout(()=>reject(new Error('INVITE_CHECK_TIMEOUT')),timeoutMs);
   })]);
   if(!active())throw new Error('INVITE_CHECK_CANCELLED');
   if(result)return true;
   // Revoke immediately, including if the next request fails or goes offline.
   onDenial();
   if(denied||i===delays.length-1)return false;
   denied=true;
  }catch(problem){
   if(!active()||i===delays.length-1||!isRecoverableInviteFailure(problem))throw problem;
  }finally{if(timer!==undefined)clearTimeout(timer);}
 }
 throw new Error('INVITE_CHECK_TIMEOUT');
}
