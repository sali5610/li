/**
 * ONT-04C1b: Quote metadata audit gate, NO quote renderer.
 *
 * Never interprets a source URL or historical author's name as permission
 * to display text. For this draft ALL 24 bank IDs remain held for review.
 * Accepts no auth, attempt, answer, role, progress or private learner data.
 */
export const REVIEW_PROFILE='li-ONT04C1b-quote-source-audit';
export const STAGES=['opening','concept','guided','independent','reflection','extension'];
const allowedInput=new Set(['lessonId','locale','stage','candidateId','calmMode','debateMode','feedbackVisible']);
const blockedStages=new Set(['independent','reflection','extension']);
function validObject(x,allowed){
 return x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null)&&
  Object.keys(x).every(k=>allowed.has(k));
}
export function indexQuoteSafety({policy,quoteIds,companionManifests}){
 if(policy?.profile!==REVIEW_PROFILE||policy.demoOnly!==true||
  policy.hardGates?.defaultQuoteState!=='WITHHELD'||
  policy.hardGates?.quoteRenderAuthorization!=='NOT_GRANTED'||
  policy.hardGates?.reviewedPublicQuoteEntries!==0||
  policy.hardGates?.clientCanApprove!==false||
  policy.legacyRuntimeSafetyFinding?.severity!=='GATE_OPEN_DO_NOT_CLAIM_FIXED')
  throw Error('Quote safety policy is missing its fail-closed hold gate');
 if(!Array.isArray(quoteIds)||quoteIds.length!==24||new Set(quoteIds).size!==24||
  quoteIds.some(q=>typeof q!=='string'||!q.trim()))
  throw Error('Quote bank count/identity drift — re-review before use');
 if(!Array.isArray(companionManifests)||companionManifests.length!==3)throw Error('Source manifest count drift');
 const index=new Map();
 for(const manifest of companionManifests){
  if(!/^L\d{2}-\d+-\d+$/.test(manifest.lesson_id)||index.has(manifest.lesson_id)||
   manifest.moments?.length!==6)
   throw Error('Duplicate or incomplete companion route');
  const stages=new Map();
  for(let i=0;i<STAGES.length;i++){
   const moment=manifest.moments[i];
   if(moment?.stage!==STAGES[i]||!Array.isArray(moment.quote_ids)||moment.quote_ids.length<3||
    !quoteIds.includes(moment.quote_id)||!moment.quote_ids.includes(moment.quote_id)||
    moment.quote_ids.some(id=>!quoteIds.includes(id)))
     throw Error('Broken source quote reference: '+manifest.lesson_id);
   stages.set(moment.stage,Object.freeze({preferredId:moment.quote_id,candidateIds:Object.freeze([...moment.quote_ids])}));
  }
  index.set(manifest.lesson_id,stages);
 }
 return Object.freeze({policy,quotes:new Set(quoteIds),lessons:index,sourceOnly:true});
}
const permission=Object.freeze({
 renderAllowed:false,canCiteAsScientificEvidence:false,canRevealAnswer:false,
 canUseAsAssessmentHint:false,canRecordLearnerData:false,canNavigate:false,
 attributionVerified:false,translationRightsCleared:false,territoryRightsCleared:false
});
function withheld(status,explanation,{lessonId=null,stage=null,candidateId=null,sourceRef=null}={}){
 return {
  status,lessonId,stage,candidateId,sourceRef,
  permission:{...permission},
  original:null,translation:null,gloss:null,author:null,
  appRoute:null,handler:null,
  note:explanation
 };
}
export function inspectQuote(index,input){
 if(!validObject(input,allowedInput))return withheld('REJECTED_PRIVATE_OR_UNKNOWN_INPUT','Input may contain only public metadata context; no private attempt, email, token or role.');
 const {lessonId,locale,stage,candidateId,calmMode=false,debateMode=false,feedbackVisible=false}=input;
 if(typeof lessonId!=='string'||!['vi','en'].includes(locale)||!STAGES.includes(stage)||
  (candidateId!==undefined&&typeof candidateId!=='string')||
  typeof calmMode!=='boolean'||typeof debateMode!=='boolean'||typeof feedbackVisible!=='boolean')
  return withheld('INVALID_CONTEXT','Malformed public-context fields.');
 if(blockedStages.has(stage))
  return withheld('SUPPRESSED_ASSESSMENT_STAGE','Never show cultural quote cards during independent challenge or post-submission stages without a trusted review gate.',{lessonId,stage});
 if(calmMode||debateMode||feedbackVisible)
  return withheld('SUPPRESSED_UI_CONTEXT','Calm, debate and feedback contexts suppress optional quote cards.',{lessonId,stage});
 const stages=index?.lessons?.get(lessonId);
 if(!stages)return withheld('UNKNOWN_SOURCE_LESSON','No source-confirmed Wave1 companion for this lesson.',{lessonId,stage});
 const source=stages.get(stage);
 if(!source)return withheld('UNKNOWN_STAGE','No stage-canonical quote metadata.',{lessonId,stage});
 if(candidateId!==undefined&&!source.candidateIds.includes(candidateId))
  return withheld('UNSUPPORTED_QUOTE_ID','The requested quote is not a documented candidate for this exact lesson and stage.',{lessonId,stage});
 const id=candidateId??source.preferredId;
 if(!index.quotes.has(id))return withheld('SOURCE_BANK_DRIFT','Unregistered quote ID; refuse to use it.',{lessonId,stage});
 // Even a valid bank ID and URL has NOT passed source/edition/rights review.
 return withheld('WITHHELD_SOURCE_RIGHTS_UNREVIEWED',
  'Quote ID matches editorial source metadata only. Exact edition, attribution, translation and territory rights, stage relevance and no-spoiler release gate remain unverified.',
  {lessonId,stage,candidateId:id,sourceRef:'site/assets/laoly-quotes-s121.js'});
}
