/** One accepted shape for all six editorial method exercises.
 * The UI writer and the account-scoped offline/Neon reader MUST agree:
 * otherwise valid offline practice can block the entire learner sync loop.
 */
const METHODS=new Set(['T03','T04','T06','T07','T09','T10']);
const CATEGORIES=new Set(['nominal','ordinal','discrete','continuous']);
export function validEditorialMethodAttempts(methods:unknown):boolean{
 if(methods===undefined)return true; // historical released lesson snapshots
 if(!methods||typeof methods!=='object'||Array.isArray(methods))return false;
 for(const [id,item] of Object.entries(methods)){
  if(!METHODS.has(id)||!item||typeof item!=='object'||Array.isArray(item))return false;
  const a=item as Record<string,unknown>;
  if(typeof a.draft!=='string'||a.draft.length>4000||
     !(a.submission===null||(typeof a.submission==='string'&&a.submission.length<=4000))||
     !(a.submittedAt===null||(typeof a.submittedAt==='string'&&a.submittedAt.length<=50&&
       Number.isFinite(Date.parse(a.submittedAt)))))return false;
  if((a.submission===null)!==(a.submittedAt===null))return false;
  if(typeof a.submission==='string'&&a.submission.trim().length<12)return false;
  if(a.classifications!==undefined){
   if(id!=='T06'||!a.classifications||typeof a.classifications!=='object'||
      Array.isArray(a.classifications))return false;
   const c=a.classifications as Record<string,unknown>;
   if(Object.keys(c).some(k=>!['A','B','C','D'].includes(k)||
     !CATEGORIES.has(String(c[k]))))return false;
   if(a.submittedAt&&['A','B','C','D'].some(k=>!c[k]))return false;
  }
 }
 return true;
}
