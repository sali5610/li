import type {Attempt} from '../native-bridge.js';
import {readingPositionKey} from './reading-position.js';
import {validMethodAttempts} from './validate-method-attempts.js';
import {initial,validReasoningReflection} from '../native-bridge.js';
import type {LearningPorts,SyncState} from './ports.js';
import {isLearnableLessonId} from './released-lessons.js';
import {checkInviteAccess} from '../sync/invite-access.js';
import {neonSessionPort} from '../auth/neon-client.js';
import {AUTH_ORIGIN,IS_INTEGRATED_LI_APP,NEON_DATA_API_URL} from '../auth/config.js';
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

/** Review snapshots are optional for old Wave1 records, but strictly validated
 * when an editorial submission freezes its own localized rubric and solution. */
function validReviewSnapshot(a:Attempt):boolean{
 const snapshot=a.reviewSnapshot;
 if(snapshot===undefined)return true;
 if(!snapshot||!a.submitted||!a.submission||!a.contentVersion||!a.rubricVersion||
  snapshot.contentVersion!==a.contentVersion||
  snapshot.rubricVersion!==a.rubricVersion||
  !snapshot.modelAnswer||!snapshot.criteria)return false;
 for(const locale of ['vi','en'] as const){
  const model=snapshot.modelAnswer[locale];
  const rows=snapshot.criteria[locale];
  const questions=snapshot.questions?.[locale];
  if(typeof model!=='string'||!model.trim()||model.length>10000||
   !tuple(questions)||questions.some(q=>!q.trim())||
   !Array.isArray(rows)||rows.length!==4||
   rows.some(row=>!Array.isArray(row)||row.length!==4||
    row.some(cell=>typeof cell!=='string'||cell.length===0||cell.length>1200)))
   return false;
 }
 return true;
}
function validHistory(a:Attempt):boolean{
 if(a.methodChoice!==undefined&&a.methodChoice!==null&&
  !['T03','T04','T06','T07','T09','T10','skip'].includes(a.methodChoice))return false;
 if(a.contentVersion!==undefined&&
  (typeof a.contentVersion!=='string'||a.contentVersion.length>50))return false;
 if(a.rubricVersion!==undefined&&
  (typeof a.rubricVersion!=='string'||a.rubricVersion.length>80))return false;
 if(a.reviewedAt!==undefined&&a.reviewedAt!==null&&
  (typeof a.reviewedAt!=='string'||!Number.isFinite(Date.parse(a.reviewedAt))))return false;
 if(a.answerRevealed!==undefined&&typeof a.answerRevealed!=='boolean')return false;
 if(a.answerRevealed===true&&!a.submitted)return false;
 if(a.reviewed&&a.answerRevealed===false)return false;
 if(a.attemptNumber!==undefined&&
  (!Number.isSafeInteger(a.attemptNumber)||a.attemptNumber<1))return false;
 if(a.attemptHistory===undefined)return true;
 if(!Array.isArray(a.attemptHistory)||a.attemptHistory.length>50)return false;
 let last=0;
 for(const p of a.attemptHistory){
  if(!p||!tuple(p.submission)||!['vi','en'].includes(p.submissionLocale)||
   typeof p.submittedAt!=='string'||!Number.isFinite(Date.parse(p.submittedAt))||
   !Array.isArray(p.ratings)||p.ratings.length!==4||
   p.ratings.some(x=>x!==0&&x!==1&&x!==2)||
   typeof p.answerRevealed!=='boolean'||!p.answerRevealed||
   typeof p.contentVersion!=='string'||!p.contentVersion||p.contentVersion.length>50||
   typeof p.rubricVersion!=='string'||!p.rubricVersion||p.rubricVersion.length>80||
   !Number.isSafeInteger(p.attemptNumber)||p.attemptNumber<=last||
   typeof p.guidedDraft!=='string'||p.guidedDraft.length>4000||
   typeof p.hint!=='boolean'||!['T03','T04','T06','T07','T09','T10','skip',null].includes(p.methodChoice)||
   (p.questionPrompts!==undefined&&
    !(['vi','en'] as const).every(locale=>{
     const questions=p.questionPrompts?.[locale];
     return Array.isArray(questions)&&questions.length===4&&
      questions.every(q=>typeof q==='string'&&q.trim().length>0&&q.length<=4000);
    }))||
   !validMethodAttempts(p)||!validReasoningReflection(p.reflection))return false;
  last=p.attemptNumber;
 }
 return a.attemptHistory.length===0||a.attemptNumber===undefined||a.attemptNumber>last;
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
 a.ratings.every(x=>x===null||x===0||x===1||x===2)&&
 validReasoningReflection(a.reflection)&&validMethodAttempts(a)&&validHistory(a)&&validReviewSnapshot(a);
}
function owner(uid:string){
 if(!IS_INTEGRATED_LI_APP||location.origin!==AUTH_ORIGIN||
 !document.documentElement.classList.contains('li-auth-verified')||
 !uid)throw Error('LEARNING_INVITE_REQUIRED');
 let currentOwner:string|null;
 try{currentOwner=localStorage.getItem(OWNER);}
 catch{throw Error('STORAGE_UNAVAILABLE');}
 if(currentOwner!==uid)throw Error('LEARNING_INVITE_REQUIRED');
}
function snapshot(key:string):{raw:string|null;attempt:Attempt}{
 let raw:string|null;
 try{raw=localStorage.getItem(key);}
 catch{throw Error('STORAGE_UNAVAILABLE');}
 if(raw===null){
  const state=initial();
  let locale:string|null;
  try{locale=localStorage.getItem('li.app.locale.v1');}
  catch{throw Error('STORAGE_UNAVAILABLE');}
  if(locale==='vi'||locale==='en')state.locale=locale;
  return {raw,attempt:state};
 }
 if(raw.length>60000)throw Error('LEARNING_RECORD_TOO_LARGE');
 let data:unknown;
 try{data=JSON.parse(raw);}catch{throw Error('INVALID_ATTEMPT');}
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
 if(!isLearnableLessonId(lesson))throw Error('LESSON_NOT_LEARNABLE');
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
   let current:string|null;
   try{current=localStorage.getItem(KEY);}
   catch{throw Error('STORAGE_UNAVAILABLE');}
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
 readingPosition:{
  load({lessonId,subjectId}){
   if(lessonId!==LESSON)throw Error('WRONG_LESSON');owner(subjectId);
   return JSON.parse(localStorage.getItem(readingPositionKey(LESSON,subjectId))||'null');
  },
  save({lessonId,subjectId,position}){
   if(lessonId!==LESSON)throw Error('WRONG_LESSON');owner(subjectId);
   localStorage.setItem(readingPositionKey(LESSON,subjectId),JSON.stringify(position));
  },
  clear({lessonId,subjectId}){
   if(lessonId!==LESSON)throw Error('WRONG_LESSON');owner(subjectId);
   localStorage.removeItem(readingPositionKey(LESSON,subjectId));
  }
 },
 navigation:{openCatalog(){
  const owner=window as Window&{liCatalog?:{openForLesson?:(id:string)=>boolean}};
  // Direct lesson links also return to their real 5-tier course, not Catalogue root.
  if(owner.liCatalog?.openForLesson?.(LESSON))return;
  navigate('catalog');
 }},
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
