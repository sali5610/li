/** Bounded read-only recovery for a waking managed session. Never retry an
 * explicit denial, account mismatch, invalid payload or forbidden response.
 * The caller still requires successful signed invitation RPC and local owner. */
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
 timeoutMs=6000
):Promise<boolean>{
 const delays=[0,500,1000];
 for(let i=0;i<delays.length;i++){
  if(delays[i])await pause(delays[i]);
  if(!active())throw new Error('INVITE_CHECK_CANCELLED');
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const result=await Promise.race([verify(),new Promise<never>((_,reject)=>{
    timer=setTimeout(()=>reject(new Error('INVITE_CHECK_TIMEOUT')),timeoutMs);
   })]);
   if(!active())throw new Error('INVITE_CHECK_CANCELLED');
   return result;
  }catch(problem){
   if(!active()||i===delays.length-1||!isRecoverableInviteFailure(problem))throw problem;
  }finally{if(timer!==undefined)clearTimeout(timer);}
 }
 throw new Error('INVITE_CHECK_TIMEOUT');
}
