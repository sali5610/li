import type {Attempt} from '../native-bridge.js';
import {initial} from '../native-bridge.js';
import type {LearningPorts,SyncState} from './ports.js';
import {isReleasedLessonId} from './released-lessons.js';
import {checkInviteAccess} from '../sync/invite-access.js';
import {neonSessionPort} from '../auth/neon-client.js';
import {AUTH_ORIGIN,IS_GITHUB_STAGING,NEON_DATA_API_URL} from '../auth/config.js';
import {recentOfflineOwner} from '../auth/offline-local.js';
import {waitForLearnerHydration,saveNativeLearnerAttempt,learnerAttemptSyncState} from '../auth/learner-sync.js';

/** React uses existing owner-scoped native attempt + Chat 3 Neon sync.
 * No guest, fake account, second local key or independent cloud writer.
 */
const OWNER='li.sync.local-owner.v1';
const MISSING='li:missing';
function canonical(v:unknown):string{
 if(v===null||typeof v!=='object')return JSON.stringify(v)??'null';
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 const o=v as Record<string,unknown>;
 return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';
}
function tuple(v:unknown){return Array.isArray(v)&&v.length===4&&v.every(x=>typeof x==='string'&&x.length<=4000);}

function validMethodAttempts(a:Attempt):boolean{
 const methods=a.methodAttempts;
 if(methods===undefined)return true; // preserve native Wave1 attempt records
 if(methods===null||Array.isArray(methods)||typeof methods!=='object')return false;
 for(const [id,raw] of Object.entries(methods)){
  if(id!=='T06'&&id!=='T07')return false;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const m=raw as {draft?:unknown;submission?:unknown;submittedAt?:unknown};
  if(typeof m.draft!=='string'||m.draft.length>4000||
   !(m.submission===null||(typeof m.submission==='string'&&m.submission.length<=4000))||
   !(m.submittedAt===null||(typeof m.submittedAt==='string'&&
     m.submittedAt.length<=50&&Number.isFinite(Date.parse(m.submittedAt)))))
   return false;
  if((m.submission===null)!==(m.submittedAt===null))return false;
  if(typeof m.submission==='string'&&m.submission.trim().length<12)return false;
 }
 return true;
}
function valid(a:Attempt){
 return(a.locale==='vi'||a.locale==='en')&&tuple(a.draft)&&
 typeof a.guidedDraft==='string'&&a.guidedDraft.length<=4000&&
 typeof a.hint==='boolean'&&typeof a.assisted==='boolean'&&
 typeof a.submitted==='boolean'&&typeof a.reviewed==='boolean'&&
 (a.submittedAt===null||typeof a.submittedAt==='string')&&
 (a.submission===null||tuple(a.submission))&&
 (a.submissionLocale===null||a.submissionLocale==='vi'||a.submissionLocale==='en')&&
 Array.isArray(a.ratings)&&a.ratings.length===4&&
 a.ratings.every(x=>x===null||x===0||x===1||x===2)&&validMethodAttempts(a);
}
function owner(uid:string){
 if(!IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN||
 !document.documentElement.classList.contains('li-auth-verified')||
 !uid||localStorage.getItem(OWNER)!==uid)throw Error('LEARNING_INVITE_REQUIRED');
}
function snapshot(key:string):{raw:string|null;attempt:Attempt}{
 const raw=localStorage.getItem(key);
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
function navigate(route:'catalog'|'search'):boolean{
 return window.liAppRouter?.navigate(route)===true;
}
export function createStagingLearningPorts(lesson:string):LearningPorts{
 if(!isReleasedLessonId(lesson))throw Error('LESSON_NOT_RELEASED');
 const LESSON=lesson, KEY='li.review.'+lesson+'.v1';
 return {
 auth:{async requireInvitedLearner(){
  if(!document.documentElement.classList.contains('li-auth-verified'))throw Error('INVITE_REQUIRED');
  // Offline continuation: local-only recent invite, SAME owner, never a remote grant.
  if(!navigator.onLine){
   const localUid=recentOfflineOwner(true);
   if(!localUid)throw Error('RECENT_INVITE_REQUIRED');
   owner(localUid);
   return {subjectId:localUid};
  }
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
   const state=snapshot(KEY);
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
  if(!navigate('search'))return;
  const search=window as Window&{liSearch?:{render:(value:string)=>void}};
  // The REAL React Tra Cứu controller owns its text/query state. Never type
  // into the old hidden #global-search input or dispatch a synthetic event.
  search.liSearch?.render(query);
  document.querySelector<HTMLInputElement>('#li-react-search-host input')?.focus();
 }}
 };
}
