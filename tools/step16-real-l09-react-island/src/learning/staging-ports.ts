import {initial} from '../native-bridge';
import type {Attempt} from '../native-bridge';
import {neonSessionPort} from '../auth/neon-client';
import {AUTH_ORIGIN,IS_GITHUB_STAGING,NEON_DATA_API_URL} from '../auth/config';
import {checkInviteAccess} from '../sync/invite-access';
import {bindNeonAccount} from '../sync/neon-session';
import {L09_LESSON_ID} from './ports';
import type {LearningPorts,SyncState} from './ports';

/**
 * Frontend adapter to the CURRENT real li. staging owners:
 * AuthPanel's signed invitation, native L09 local attempt and Chat 3's
 * existing learner-sync observer (input/change/click -> Dexie/Neon).
 * No separate learner table/API/client, fake account, or route.
 */
const KEY='li.review.L09-1-2.v1';
const OWNER='li.sync.local-owner.v1';
const ABSENT='__LI_L09_NOT_SAVED__';
let verifiedSubject:string|null=null;
const valid=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&
 typeof value==='object'&&!Array.isArray(value);
function parse(raw:string|null):Attempt{
 if(raw===null)return initial();
 if(raw.length>60000)throw Error('ATTEMPT_TOO_LARGE');
 const data:unknown=JSON.parse(raw);
 if(!valid(data))throw Error('INVALID_ATTEMPT');
 const defaults=initial();
 const state={...defaults,...data} as Attempt;
 if(!Array.isArray(state.draft)||state.draft.length!==4||
    !state.draft.every(x=>typeof x==='string'&&x.length<=4000)||
    !Array.isArray(state.ratings)||state.ratings.length!==4||
    !state.ratings.every(x=>x===null||x===0||x===1||x===2)||
    !['vi','en'].includes(state.locale)||typeof state.guidedDraft!=='string'||
    typeof state.submitted!=='boolean'||typeof state.reviewed!=='boolean')
  throw Error('INVALID_ATTEMPT');
 return state;
}
function assertOwner(subjectId:string){
 if(!IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN||
    !document.documentElement.classList.contains('li-auth-verified')||
    !subjectId||verifiedSubject!==subjectId||
    localStorage.getItem(OWNER)!==subjectId)throw Error('LEARNER_NOT_VERIFIED');
}
const canonical=(input:unknown):string=>{
 if(input===null||typeof input!=='object')return JSON.stringify(input)??'null';
 if(Array.isArray(input))return '['+input.map(canonical).join(',')+']';
 const object=input as Record<string,unknown>;
 return '{'+Object.keys(object).sort().map(k=>JSON.stringify(k)+':'+canonical(object[k])).join(',')+'}';
};
function navigate(page:'catalog'|'search'){
 const shell=window as Window&{navigate?:(id:string)=>void};
 if(typeof shell.navigate!=='function')throw Error('NATIVE_NAVIGATION_MISSING');
 shell.navigate(page);
}
/** It is intentionally scoped to one already-published L09 route. */
export function createStagingLearningPorts():LearningPorts{
 return {
  auth:{
   async requireInvitedLearner(){
    if(!IS_GITHUB_STAGING||location.origin!==AUTH_ORIGIN||
       !document.documentElement.classList.contains('li-auth-verified'))
      throw Error('AUTH_REQUIRED');
    const session=await neonSessionPort.getSession();
    const subjectId=session.data?.user?.id;
    if(!subjectId||localStorage.getItem(OWNER)!==subjectId)
      throw Error('ACCOUNT_NOT_PREPARED');
    if(!await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort))
      throw Error('INVITE_NOT_GRANTED');
    verifiedSubject=subjectId;
    return {subjectId};
   }
  },
  attempts:{
   async load({lessonId,subjectId}){
    if(lessonId!==L09_LESSON_ID)throw Error('UNSUPPORTED_LESSON');
    assertOwner(subjectId);
    const raw=localStorage.getItem(KEY);
    return {attempt:parse(raw),revision:raw??ABSENT};
   },
   async save({lessonId,subjectId,attempt,expectedRevision}){
    if(lessonId!==L09_LESSON_ID)throw Error('UNSUPPORTED_LESSON');
    assertOwner(subjectId);
    parse(JSON.stringify(attempt));
    const old=localStorage.getItem(KEY);
    if((old??ABSENT)!==expectedRevision)throw Error('ATTEMPT_CHANGED_IN_ANOTHER_TAB');
    // Merge unknown native metadata; do not erase legacy progress fields.
    const existing=old===null?{}:JSON.parse(old);
    if(!valid(existing))throw Error('INVALID_EXISTING_ATTEMPT');
    const raw=JSON.stringify({...existing,...attempt});
    localStorage.setItem(KEY,raw);
    if(localStorage.getItem(KEY)!==raw)throw Error('ATTEMPT_READBACK_FAILED');
    // Native input/change/click event from this same route triggers Chat 3's
    // real background Dexie outbox + signed Neon sync. No fake cloud status.
    return {revision:raw};
   }
  },
  sync:{
   async getStatus({lessonId,subjectId}):Promise<SyncState>{
    if(lessonId!==L09_LESSON_ID)throw Error('UNSUPPORTED_LESSON');
    assertOwner(subjectId);
    if(!navigator.onLine)return 'on-device';
    // Only report "synced" if signed Neon readback really equals THIS attempt.
    try{
     const api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
     if(!api||api.accountId!==subjectId)return 'unavailable';
     const remote=await api.one('lesson_attempt',L09_LESSON_ID);
     if(!remote||remote.deleted_at)return 'on-device';
     if(!valid(remote.payload))return 'unavailable';
     const payload=remote.payload;
     const data=payload.schema==='li.native.lesson.v1'?payload.data:
       payload.schema==='li.step16.l09.native.v1'?payload.attempt:null;
     if(!valid(data))return 'unavailable';
     const localRaw=localStorage.getItem(KEY);
     if(localRaw===null)return 'on-device';
     parse(localRaw); // validate before comparing persisted source data
     return canonical(data)===canonical(JSON.parse(localRaw))?'synced':'on-device';
    }catch{return 'unavailable';}
   }
  },
  navigation:{openCatalog(){navigate('catalog');}},
  search:{openSearch(query){
   navigate('search');
   const input=document.getElementById('global-search');
   if(!(input instanceof HTMLInputElement))throw Error('REAL_SEARCH_INPUT_MISSING');
   input.value=query;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.focus();
  }}
 };
}
