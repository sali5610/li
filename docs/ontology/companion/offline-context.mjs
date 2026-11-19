/**
 * ONT-04C1 · Lão Lý deterministic, source-bounded context resolver.
 *
 * SECURITY: Never receives raw learner attempts, answers, email, invitation
 * lists, auth tokens, notes, progress, cookies or session IDs. This offline
 * prototype is not an auth provider and cannot turn source existence into
 * publication, grade success, unlock a solution or navigate.
 *
 * A future trusted runtime must build a *different* owner-verified context
 * adapter; never pass its private state to this public/static module.
 */
export const STAGES=Object.freeze(['opening','concept','guided','independent','reflection','extension']);
export const ACTIVE=Object.freeze(['opening','concept','guided','independent']);
export const INTENTS=Object.freeze(['ASK_FOR_EVIDENCE','CHECK_ASSUMPTION','COMPARE_BOUNDARIES','VIEW_SOURCE_METADATA','EXPLORE_METHOD_DEFINITION']);
const inputFields=new Set(['lessonId','locale','stage','reviewProposals']);
const reviewed=new Set(['verified','approved']);
const pattern=/^L\d{2}-\d+-\d+$/;
const permittedLocale=new Set(['vi','en']);
function deny(state,locale='vi') {
 return Object.freeze({
  status:state,
  actor:'Lão Lý',
  locale:permittedLocale.has(locale)?locale:'vi',
  stage:null,
  lessonId:null,
  context:null,
  sources:[],
  method:null,
  actions:[],
  permission:{canNavigate:false,canReadPrivate:false,canRevealAnswer:false,canGrade:false,canSave:false,contentPublished:false,verifiedSubmission:false},
  reason:state==='unavailable_stage'?'Trusted submitted state does not exist in offline prototype':'Unknown/untrusted or unreviewed context; no route or knowledge claim is authorized.'
 });
}
const only=(value,allowed)=>Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&
 (Object.getPrototypeOf(value)===Object.prototype || Object.getPrototypeOf(value)===null)&&
 Object.keys(value).every(k=>allowed.has(k)));
const exactSource=(s)=>Boolean(s&&/^https:\/\//.test(s.sourceUrl||'')&&typeof s.sourceSection==='string'&&s.sourceSection.trim()&&/^\d{4}-\d\d-\d\d$/.test(s.checkedOn||''));
function createAction(a,sourceRef=null){
 return Object.freeze({
  intent:a.intent,
  label:a.label,
  response:a.response,
  target:null,
  handler:null,
  executable:false,
  claimsMastery:false,
  revealsSolution:false,
  writesLearnerData:false,
  sourceRef
 });
}
export function buildOfflineCompanionIndex({contextRegistry,templates,academicGraph,pedagogyFits,methodCatalog,routeAudit}) {
 if(!contextRegistry?.demoOnly || contextRegistry?.version!=='0.1.0' ||
  contextRegistry?.profile!=='li-ONT04C1-static-companion-bounded-context' ||
  templates?.profile!=='li-ONT04C1-non-spoiler-localized-templates' ||
  routeAudit?.scope!=='DRAFT_NON_NAVIGABLE_CANDIDATES' ||
  pedagogyFits?.coverage?.userRuntime!=='NOT_IMPLEMENTED' ||
  academicGraph?.coverage?.lessonRelease!=='NOT_AUTHORIZED' ||
  methodCatalog?.entries?.length!==13)
  throw Error('Offline contract dependency/drift — refuse to initialize');
 const lessons=new Map(),techniques=new Map(methodCatalog.entries.map(t=>[t.id,t]));
 const methodFits=new Map(pedagogyFits.lessons.map(m=>[m.canonicalLessonId,m]));
 for(const lesson of contextRegistry.catalog) {
  if(!pattern.test(lesson.lessonId)||lessons.has(lesson.lessonId))throw Error('Invalid/duplicate context lesson');
  if(!['F03','F09','F15'].includes(lesson.fieldId))throw Error('Only source-attested pilot Fields permitted');
  if(lesson.readiness!=='NOT_VERIFIED_RELEASED'||lesson.verifiedAcademicClaims!==false)
   throw Error('No live lesson or scholarly answer may be claimed');
  if(typeof lesson.sourceUrl!=='string'||!lesson.sourceUrl.startsWith('https://app.notion.com/p/'))
   throw Error('Unsafe editorial source');
  if(lesson.sourceKind==='wave1_companion_editorial') {
   if(!routeAudit.candidates.some(x=>x.canonicalLessonId===lesson.lessonId &&
     x.publicationDecision==='NOT_APPROVED_FOR_SEARCH_NAVIGATION' &&
     x.appUrl===null && x.openAction===null))
    throw Error('Wave1 companion has no deny-by-default native route evidence');
  } else if(lesson.sourceKind==='ont03b_editorial_method_fit'){
   const g=academicGraph.nodes.find(n=>n.id==='lesson:'+lesson.lessonId);
   if(!g||g.publishState!=='draft'||!methodFits.has(lesson.lessonId))
    throw Error('Unverified editorial method fit source');
  } else throw Error('Unknown lesson provenance kind');
  lessons.set(lesson.lessonId,Object.freeze(lesson));
 }
 return Object.freeze({lessons,templates,methodFits,techniques,
  coverage:'4 editorial sample lessons only; no verified complete syllabus',
  sourceContract:'S145 six-stage, S183 companion boundaries',
  noUserState:true});
}
export function resolveOfflineCompanion(index,input) {
 // Reject instead of logging dangerous private keys or accessing their value.
 if(!only(input,inputFields))return deny('rejected_private_or_unknown_context');
 if(typeof input.lessonId!=='string'||!pattern.test(input.lessonId)||
  !permittedLocale.has(input.locale)||!STAGES.includes(input.stage)||
  (Object.hasOwn(input,'reviewProposals')&&typeof input.reviewProposals!=='boolean'))
  return deny('invalid_context',input.locale);
 const lesson=index?.lessons?.get(input.lessonId);
 if(!lesson)return deny('unknown_lesson',input.locale);
 const section=index.templates?.stages?.[input.stage]?.[input.locale];
 if(!section)return deny('invalid_stage_template',input.locale);
 const stage=input.stage;
 const gated=!ACTIVE.includes(stage);
 const base={
  status:gated?'unavailable_stage':'read_only_editorial_context',
  actor:'Lão Lý',
  locale:input.locale,
  stage,
  lessonId:lesson.lessonId,
  context:{
   title:lesson.title[input.locale],
   fieldId:lesson.fieldId,
   publicationState:lesson.readiness,
   academicClaimState:'EDITORIAL_NOT_INDEPENDENTLY_VERIFIED',
   quoteStatus:'WITHHELD_PENDING_RIGHTS_AND_RELEVANCE',
   rawAttemptState:'NEVER_READ',
   editorialStage:stage,
   intro:section.intro
  },
  sources:[{
   kind:'editorial_reference_only',
   url:lesson.sourceUrl,
   section:lesson.sourceSection,
   checkedOn:'2026-11-19',
   independentScientificVerification:false
  }],
  method:null,
  actions:[],
  permission:{
   canNavigate:false,canReadPrivate:false,canRevealAnswer:false,canGrade:false,
   canSave:false,contentPublished:false,verifiedSubmission:false
  },
  reason:gated?'Post-submission state and answer reveal need trusted completed attempt; unavailable in offline prototype':
   'Read-only contextual prompts from an editorial source. This is not a factual answer, a released lesson, or a live companion action.'
 };
 if(!gated){
  const candidates=Array.isArray(section.actions)?section.actions:[];
  if(!candidates.length||candidates.length>3) return deny('invalid_stage_actions',input.locale);
  for(const a of candidates) {
   if(!INTENTS.includes(a.intent)||typeof a.label!=='string'||
    typeof a.response!=='string'||!a.label.trim()||!a.response.trim())
    return deny('invalid_stage_actions',input.locale);
   base.actions.push(createAction(a));
  }
  // Optional method-fit is an EDITORIAL REVIEW suggestion, never a runtime
  // learning event, technique enactment or navigation command.
  if(input.reviewProposals===true && lesson.sourceKind==='ont03b_editorial_method_fit' &&
   stage==='guided' && base.actions.length<3) {
   const fit=index.methodFits.get(lesson.lessonId);
   const tech=index.techniques.get(fit?.primaryTechniqueId);
   if(fit?.status==='editorial_draft' && tech && reviewed.has(tech.reviewState)&&
    fit.editorialApplicationId===lesson.methodFit &&
    tech.provenance?.sourceUrl?.startsWith('https://app.notion.com/')){
    const loc=index.templates.methodSuggestion[input.locale];
    base.method={
     techniqueId:tech.id,
     sourceEdition:tech.sourceEdition,
     proposalStatus:'EDITORIAL_DRAFT_NOT_LEARNER_EVIDENCE',
     sourceUrl:tech.provenance.sourceUrl,
     safeToOpenDefinition:false
    };
    base.actions.push(createAction({intent:'EXPLORE_METHOD_DEFINITION',label:loc.label,response:loc.response},tech.provenance.sourceUrl));
   }
  }
 }
 // Returning a plain serializable object is intentional; there is no handler
 // capable of executing a supposedly safe action behind a hidden callback.
 return structuredClone(base);
}
