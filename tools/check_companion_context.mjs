#!/usr/bin/env node
/** ONT-04C1: 4 × 2 × 6 bounded editorial stages; no login or learner attempt inputs. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {STAGES,INTENTS,ACTIVE,buildOfflineCompanionIndex,resolveOfflineCompanion} from '../docs/ontology/companion/offline-context.mjs';
import {inspectSearchRoute} from '../docs/ontology/search/routes/route-readiness.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const files={
 registry:load('docs/ontology/companion/pilot-context.v0.1.json'),
 templates:load('docs/ontology/companion/response-templates.v0.1.json'),
 academicGraph:load('docs/ontology/academic/demo.graph.v0.1.json'),
 pedagogyFits:load('docs/ontology/pedagogy/method-fit.v0.1.json'),
 methodCatalog:load('docs/ontology/pedagogy/techniques.v0.2.json'),
 routeAudit:load('docs/ontology/search/routes/native-route-candidates.v0.1.json')
};
const fail=(label)=>{throw Error('ONT04C1_FAIL: '+label);};
const require=(test,label)=>{if(!test)fail(label);};
const unique=(a,label)=>require(new Set(a).size===a.length,'Duplicate '+label);
const inc=(test,label)=>{require(test,label);return 1};
function validateFixtures(data){
 const {registry,templates,academicGraph,pedagogyFits,methodCatalog,routeAudit}=data;
 require(registry.profile==='li-ONT04C1-static-companion-bounded-context'&&registry.demoOnly===true,'Unreviewed imported context registry');
 require(registry.generator==='DETERMINISTIC_TEMPLATES_NO_LLM','Live model/AI fabricated');
 require(registry.scope.lessonProfiles===4&&registry.scope.externalWave1CompanionManifests===3&&registry.scope.editorialMethodFitProfiles===1,'Fixture claimed full syllabus');
 require(registry.scope.studentAttempts==='NOT_READ'&&registry.scope.preSubmitSolutions==='NEVER_ACCESS'&&registry.scope.realPermissions==='NOT_IMPLEMENTED'&&registry.scope.productionBuddy==='NOT_INTEGRATED','Pretended to read private context or permission');
 require(registry.scope.stages.join('|')===STAGES.join('|'),'S125 six-stage contract mismatch');
 require(registry.policy.maxSafeActions===3&&registry.policy.neverExecutable===true&&registry.policy.rawLearnerDataNeverPassed===true,'Action safety changed');
 require(registry.policy.gatedStages.join('|')==='reflection|extension','Post-submit gating changed');
 require(registry.policy.reflectionRequirement==='TRUSTED_SERVER_VERIFIED_SUBMISSION_UNAVAILABLE','Reflection trust boundary invalid');
 require(registry.policy.enabledIntents.length===INTENTS.length&&registry.policy.enabledIntents.every(a=>INTENTS.includes(a)),'Unreviewed action type');
 require(templates.version==='0.1.0'&&templates.source.url.startsWith('https://app.notion.com'),'Template source missing');
 unique(registry.catalog.map(l=>l.lessonId),'canonical lesson ID');
 const expected=new Map([['L09-1-2','F09'],['L03-1-2','F03'],['L15-2-2','F15'],['L09-1-1','F09']]);
 require(registry.catalog.length===expected.size,'Lesson scope drift');
 for(const l of registry.catalog){
  require(expected.get(l.lessonId)===l.fieldId,'Invented field or course '+l.lessonId);
  require(l.title.vi&&l.title.en,'Missing locale source title '+l.lessonId);
  require(l.verifiedAcademicClaims===false&&l.readiness==='NOT_VERIFIED_RELEASED','Editorial claim or release falsely approved');
  require(typeof l.sourceUrl==='string'&&l.sourceUrl.startsWith('https://app.notion.com'),'Source URL not anchored '+l.lessonId);
  if(l.companionFile){
   require(l.sourceKind==='wave1_companion_editorial','Unknown companion source kind');
   require(/^site\/lessons\/companion\/L\d{2}-\d+-\d+\.json$/.test(l.companionFile),'Companion directory escape');
   const json=load(l.companionFile);
   require(json.schema===1&&json.lesson_id===l.lessonId&&json.editorial.status==='review','Source companion mismatch '+l.lessonId);
   require(Array.isArray(json.moments)&&json.moments.length===6,'Missing source six stages '+l.lessonId);
   require(json.moments.map(x=>x.stage).join('|')===STAGES.join('|'),'Source stage order drift '+l.lessonId);
   for(const m of json.moments)require(m.vi?.prompt&&m.en?.prompt && m.vi?.actions?.length>=1 && m.en?.actions?.length>=1,'Missing bilingual source companion '+l.lessonId+':'+m.stage);
   require(l.methodFit==='NONE_PROVEN','Invented Wave1 pedagogical method-fit');
  }else{
   require(l.sourceKind==='ont03b_editorial_method_fit'&&l.lessonId==='L09-1-1','Unknown unsourced draft companion');
   const actual=pedagogyFits.lessons.find(f=>f.canonicalLessonId===l.lessonId);
   require(actual?.editorialApplicationId===l.methodFit&&actual?.status==='editorial_draft','Method-fit pointer not source-attested');
   require(academicGraph.nodes.some(x=>x.id==='lesson:'+l.lessonId&&x.publishState==='draft'),'Missing editorial academic graph');
  }
 }
 for(const stage of STAGES){
  const b=templates.stages[stage];
  require(b?.vi?.intro && b?.en?.intro,'Missing stage locale '+stage);
  for(const lang of ['vi','en']){
   const ar=b[lang].actions;
   require(Array.isArray(ar),'Missing action array '+stage+' '+lang);
   if(ACTIVE.includes(stage))require(ar.length>=1&&ar.length<=3,'No 1–3 safe actions '+stage);
   else require(ar.length===0,'Post-submit spoiler action included '+stage);
   for(const a of ar)require(INTENTS.includes(a.intent)&&a.label?.trim()&&a.response?.trim(),'Unreviewed action in '+stage);
  }
 }
 require(methodCatalog.entries.length===13,'L2 method count drift');
 require(routeAudit.coverage.reviewedSearchPublicationRoutes===0,'Publish route grant from unreviewed graph');
 return true;
}
validateFixtures(files);
const index=buildOfflineCompanionIndex({
 contextRegistry:files.registry,templates:files.templates,academicGraph:files.academicGraph,
 pedagogyFits:files.pedagogyFits,methodCatalog:files.methodCatalog,routeAudit:files.routeAudit
});
let stageCases=0,allowed=0,blocked=0,reviewSuggestions=0,parityPairs=0,negativeCases=0;
for(const l of files.registry.catalog){
 for(const stage of STAGES){
  const outputs=[];
  for(const locale of ['vi','en']){
   const x=resolveOfflineCompanion(index,{lessonId:l.lessonId,locale,stage});
   require(x.lessonId===l.lessonId&&x.locale===locale&&x.stage===stage,'Wrong canonical lesson/locale/stage');
   require(x.actor==='Lão Lý','Wrong companion identity/voice');
   require(x.sources.length===1&&x.sources[0].independentScientificVerification===false&&x.sources[0].url===l.sourceUrl,'Notion editorial source falsely cited as research');
   require(x.context.publicationState==='NOT_VERIFIED_RELEASED'&&x.context.academicClaimState==='EDITORIAL_NOT_INDEPENDENTLY_VERIFIED','Fabricated published lesson');
   require(x.context.quoteStatus==='WITHHELD_PENDING_RIGHTS_AND_RELEVANCE','Quote released without rights/relevance review');
   require(Object.values(x.permission).every(v=>v===false),'Client-side permission illegally granted');
   require(x.method===null,'Method suggestion illegally shown by default');
   require(x.actions.length<=3,'Too many Lão Lý actions');
   for(const a of x.actions){
    require(INTENTS.includes(a.intent),'Unsupported intent');
    require(a.handler===null&&a.target===null&&a.executable===false&&a.revealsSolution===false&&a.writesLearnerData===false&&a.claimsMastery===false,'Action leaked execution/solution/learner write');
    require(!/\b(?:1200|78%|18\s*[×x]\s*7|158|11\/15)\b/.test(a.response),'Independent-case answer numbers leaked');
    require(!a.response.includes('<script'),'Template injection');
   }
   if(ACTIVE.includes(stage)) {
    require(x.status==='read_only_editorial_context'&&x.actions.length>=1,'Active stage missing bounded context');
    allowed++;
   }else{
    require(x.status==='unavailable_stage'&&x.actions.length===0,'Gated stage revealed prompt/action');
    blocked++;
   }
   outputs.push(x);stageCases++;
  }
  require(outputs[0].actions.map(x=>x.intent).join('|')===outputs[1].actions.map(x=>x.intent).join('|'),'VI/EN action parity missing '+l.lessonId+':'+stage);
  parityPairs++;
 }
}
function safeReject(name,input,expected='rejected_private_or_unknown_context'){
 const r=resolveOfflineCompanion(index,input);
 require(r.status===expected&&r.actions.length===0&&r.sources.length===0&&r.permission.canRevealAnswer===false&&r.permission.canReadPrivate===false,'Failed input validation '+name);
 negativeCases++;
}
const good={lessonId:'L09-1-2',locale:'vi',stage:'independent'};
for(const field of ['answer','answerText','attempt','unsentAttempt','submission','submitted','session','token','jwt','email','userId','ownerId','notes','cookies','progress','savedQuestions','hintCount','reviewDue','url','action','rawPrompt','role','isAdmin','authorization','canOpenSolution','verifiedSubmission','sourceClaims']){
 safeReject('reject supplied private/security field '+field,{...good,[field]:'ignore me'});
}
safeReject('unknown lesson',{...good,lessonId:'L09-8-8'},'unknown_lesson');
safeReject('invalid ID format',{...good,lessonId:'../../../private'},'invalid_context');
safeReject('locale injection',{...good,locale:'fr'},'invalid_context');
safeReject('unknown stage',{...good,stage:'solution'},'invalid_context');
safeReject('method review proposal type invalid',{...good,reviewProposals:'true'},'invalid_context');
safeReject('null payload',null);
safeReject('array payload',[good]);
safeReject('explicit URL object',{...good,origin:'localhost'});
const sourceReflected=resolveOfflineCompanion(index,{lessonId:'L09-1-1',stage:'guided',locale:'vi',reviewProposals:true});
require(sourceReflected.method?.techniqueId==='L2-T06'&&sourceReflected.method?.proposalStatus==='EDITORIAL_DRAFT_NOT_LEARNER_EVIDENCE'&&sourceReflected.actions.some(x=>x.intent==='EXPLORE_METHOD_DEFINITION'&&x.executable===false),'Candidate method source pointer missing or executable');
reviewSuggestions++;
const english=resolveOfflineCompanion(index,{lessonId:'L09-1-1',stage:'guided',locale:'en',reviewProposals:true});
require(english.method.techniqueId==='L2-T06'&&english.actions.length===sourceReflected.actions.length,'Method-fit VI/EN parity mismatch');
reviewSuggestions++;
const unauthorised=resolveOfflineCompanion(index,{lessonId:'L09-1-2',stage:'guided',locale:'vi',reviewProposals:true});
require(unauthorised.method===null,'Unsupported method-fit invented');
negativeCases++;
const forged=structuredClone(files.routeAudit);
forged.candidates[0].appUrl='/site/index.html?lesson=L09-1-2';
const route=inspectSearchRoute(forged,'L09-1-2');
require(route.navigationPermitted===false&&route.deepLink===null,'Spoofed URL accidentally granted permission');
negativeCases++;
const injection=JSON.stringify([sourceReflected,english,...STAGES.map(stage=>resolveOfflineCompanion(index,{lessonId:'L09-1-2',stage,locale:'en'}))]);
require(!injection.includes('@gmail.com')&&!injection.includes('ownerId')&&!injection.includes('"correctAnswer"')&&!injection.includes('privateDiary'),'User/answer data reached static response');
negativeCases++;
const forbidden=files.registry.policy.rejectedIntents;
require(forbidden.includes('REVEAL_SOLUTION')&&forbidden.includes('SAVE_ATTEMPT')&&forbidden.includes('INVOKE_LLM')&&forbidden.includes('GRADE_ANSWER'),'Unsafe intent not explicitly rejected');
negativeCases++;
const summary={status:'PASS',sampleLessons:files.registry.catalog.length,stages:STAGES.length,localeCount:2,stageCases,activeReadOnlyCases:allowed,postSubmitBlockedCases:blocked,viEnStagePairs:parityPairs,methodPointers:reviewSuggestions,rejectedCases:negativeCases,learnerAttempts:'NOT_READ',sourceClaims:'EDITORIAL_ONLY',realAuth:'NOT_VERIFIED',liveActions:0,lessonRoutesUnlocked:0,production:'NONE'};
if(process.argv.length>3||(process.argv.length===3&&process.argv[2]!=='--check'))throw Error('Usage: node tools/check_companion_context.mjs --check');
console.log(JSON.stringify(summary));
