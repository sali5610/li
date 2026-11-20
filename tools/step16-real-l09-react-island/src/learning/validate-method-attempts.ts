/** One validator for lesson UI and Dexie/Neon sync: a valid offline draft
 * must NEVER be rejected by the cloud capture layer because of method type. */
export function validMethodAttempts(value:{methodAttempts?:unknown}):boolean{
 const methods=value.methodAttempts;
 if(methods===undefined)return true; // Wave1 attempts have no method practice.
 if(!methods||typeof methods!=='object'||Array.isArray(methods))return false;
 for(const [id,raw] of Object.entries(methods)){
  if(!['T03','T04','T06','T07','T09','T10'].includes(id))return false;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const m=raw as {draft?:unknown;submission?:unknown;submittedAt?:unknown;classifications?:unknown};
  if(typeof m.draft!=='string'||m.draft.length>4000||
   !(m.submission===null||(typeof m.submission==='string'&&m.submission.length<=4000))||
   !(m.submittedAt===null||(typeof m.submittedAt==='string'&&
     m.submittedAt.length<=50&&Number.isFinite(Date.parse(m.submittedAt)))))
   return false;
  if((m.submission===null)!==(m.submittedAt===null))return false;
  if(typeof m.submission==='string'&&m.submission.trim().length<12)return false;
  if(m.classifications!==undefined){
   if(id!=='T06'||!m.classifications||typeof m.classifications!=='object'||
     Array.isArray(m.classifications))return false;
   const c=m.classifications as Record<string,unknown>;
   if(Object.keys(c).some(k=>!['A','B','C','D'].includes(k)||
     !['nominal','ordinal','discrete','continuous'].includes(String(c[k]))))return false;
   if(m.submittedAt&&['A','B','C','D'].some(k=>!c[k]))return false;
  }
 }
 return true;
}
