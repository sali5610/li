import type {Attempt} from '../native-bridge.js';
import {initial} from '../native-bridge.js';
import type {LearningPorts,SyncState} from './ports.js';
import {checkInviteAccess} from '../sync/invite-access.js';
import {neonSessionPort} from '../auth/neon-client.js';
import {AUTH_ORIGIN,IS_GITHUB_STAGING,NEON_DATA_API_URL} from '../auth/config.js';
import {waitForLearnerHydration,saveNativeLearnerAttempt,learnerAttemptSyncState} from '../auth/learner-sync.js';

/** React uses existing owner-scoped native attempt + Chat 3 Neon sync.
 * No guest, fake account, second local key or independent cloud writer.
 */
const LESSON='L09-1-2' as const;
const KEY='li.review.L09-1-2.v1',OWNER='li.sync.local-owner.v1';
const CHECKPOINT=(uid:string)=>'li.sync.checkpoint.v1:'+uid+':'+LESSON;
const MISSING='li:missing';
function canonical(v:unknown):string{
 if(v===null||typeof v!=='object')return JSON.stringify(v)??'null';
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 const o=v as Record<string,unknown>;
 return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';
}
function tuple(v:unknown){return Array.isArray(v)&&v.length===4&&v.every(x=>typeof x==='string'&&x.length<=4000);}
function valid(a:Attempt){
 return(a.locale==='vi'||a.locale==='en')&&tuple(a.draft)&&
 typeof a.guidedDraft==='string'&&a.guidedDraft.length<=4000&&
 typeof a.hint==='boolean'&&typeof a.assisted==='boolean'&&
 typeof a.submitted==='boolean'&&typeof a.reviewed==='boolean'&&
 (a.submittedAt===null||typeof a.submittedAt==='string')&&
 (a.submission===null||tuple(a.submission))&&
 (a.submissionLocale===null||a.submissionLocale==='vi'||a.submissionLocale==='en')&&
 Array.isArray(a.ratings)&&a.ratings.length===4&&
 a.ratings.every(x=>x===null||x===0||x===1||x===2);
}
function owner(uid:string){
 if(!IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN||
 !document.documentElement.classList.contains('li-auth-verified')||
 !uid||localStorage.getItem(OWNER)!==uid)throw Error('LEARNING_INVITE_REQUIRED');
}
function snapshot():{raw:string|null;attempt:Attempt}{
 const raw=localStorage.getItem(KEY);
 if(raw===null){
  const state=initial(),locale=localStorage.getItem('li.app.locale.v1');
  if(locale==='vi'||locale==='en')state.locale=locale;
  return {raw,attempt:state};
 }
 if(raw.length>60000)throw Error('LEARNING_RECORD_TOO_LARGE');
 const data:unknown=JSON.parse(raw);
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('INVALID_ATTEMPT');
 const attempt={...initial(),...data} as Attempt;
 if(!valid(attempt))throw Error('INVALID_ATTEMPT');
 return {raw,attempt};
}
const revision=(raw:string|null)=>raw===null?MISSING:raw;
function navigate(route:'catalog'|'search'){
 if(!document.documentElement.classList.contains('li-auth-verified'))return;
 const app=window as Window&{navigate?:(route:string)=>void};
 if(typeof app.navigate==='function')app.navigate(route);
 else document.querySelector<HTMLButtonElement>('button[data-page="'+route+'"]')?.click();
}
export function createStagingLearningPorts():LearningPorts{
 return {
 auth:{async requireInvitedLearner(){
  if(!document.documentElement.classList.contains('li-auth-verified'))throw Error('INVITE_REQUIRED');
  const session=await neonSessionPort.getSession();
  const uid=session.data?.user?.id;
  if(session.error||!uid)throw Error('SESSION_REQUIRED');
  owner(uid);
  if(!await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort))throw Error('INVITE_REQUIRED');
  owner(uid);
  return {subjectId:uid};
 }},
 attempts:{
  async load({lessonId,subjectId}){
   if(lessonId!==LESSON)throw Error('WRONG_LESSON');
   owner(subjectId);
   await waitForLearnerHydration(subjectId);
   owner(subjectId);
   const state=snapshot();
   return {attempt:state.attempt,revision:revision(state.raw)};
  },
  async save({lessonId,subjectId,attempt,expectedRevision}){
   if(lessonId!==LESSON)throw Error('WRONG_LESSON');
   owner(subjectId);
   if(!valid(attempt))throw Error('INVALID_ATTEMPT');
   const current=localStorage.getItem(KEY);
   if(revision(current)!==expectedRevision)throw Error('LEARNING_REVISION_CONFLICT');
   const raw=await saveNativeLearnerAttempt(subjectId,lessonId,attempt,current);
   return {revision:raw};
  }
 },
 sync:{async getStatus({lessonId,subjectId}):Promise<SyncState>{
  if(lessonId!==LESSON)throw Error('WRONG_LESSON');
  owner(subjectId);
  return learnerAttemptSyncState(subjectId,lessonId);
 }},
 navigation:{openCatalog(){navigate('catalog');}},
 search:{openSearch(query){
  navigate('search');
  const input=document.getElementById('global-search') as HTMLInputElement|null;
  if(!input)return;
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  if(setter)setter.call(input,query);else input.value=query;
  input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
 }}
 };
}
