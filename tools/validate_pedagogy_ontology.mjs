#!/usr/bin/env node
/**
 * ONT-03B: read-only, zero-dependency static contract + synthetic metric-gate checks.
 * No real user events, Neon, app storage, LLM, network or production release.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=(p)=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const shared=load('docs/ontology/registry.v0.1.json');
const academic=load('docs/ontology/academic/registry.v0.1.json');
const academicGraph=load('docs/ontology/academic/demo.graph.v0.1.json');
const ext=load('docs/ontology/pedagogy/registry.v0.1.json');
const catalog=load('docs/ontology/pedagogy/techniques.v0.2.json');
const fits=load('docs/ontology/pedagogy/method-fit.v0.1.json');
const graph=load('docs/ontology/pedagogy/demo.graph.v0.1.json');
const schema=load('docs/ontology/pedagogy/graph.schema.json');
const privateSchema=load('docs/ontology/pedagogy/private-learning-event.schema.json');

const allKinds=[...shared.nodeKinds,...academic.additionalKinds];
const kinds=new Map(allKinds.map(k=>[k.name,k]));
const allPredicates=[...shared.predicates,...academic.relations,...ext.additionalPredicates];
const predicates=new Map(allPredicates.map(p=>[p.name,p]));
const idPattern=new RegExp(shared.idPolicy.pattern);
const fail=(message)=>{throw new Error(message);};
const require=(condition,message)=>{if(!condition)fail(message);};
const unique=(arr,scope)=>require(new Set(arr).size===arr.length,'Duplicate '+scope);
const cleaned=(text)=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim().replace(/\s+/g,' ');
function validSource(p,context) {
 require(p && /^https:\/\//.test(p.sourceUrl||''),context+': source URL');
 require(typeof p.sourceSection==='string' && p.sourceSection.trim(),context+': source section');
 require(shared.enums.evidenceType.includes(p.evidenceType),context+': evidence type');
 require(/^\d{4}-\d\d-\d\d$/.test(p.checkedOn||''),context+': check date');
}
function validMethodCatalog(c) {
 require(c.version==='0.2.0' && c.profile==='li-L2-canonical-technique-pointer-catalog','Catalog metadata drift');
 require(c.entries.length===13,'Expected 13 existing L2 TechniqueDefinitions');
 unique(c.entries.map(x=>x.id),'TechniqueDefinition IDs');
 unique(c.entries.map(x=>x.uiShortId),'TechniqueDefinition short IDs');
 const expected=Array.from({length:13},(_,i)=>'L2-T'+String(i+1).padStart(2,'0'));
 for(const t of c.entries){
   require(expected.includes(t.id) && t.uiShortId===t.id.slice(3),'Not a canonical L2 ID: '+t.id);
   require(t.defaultOptional===true && t.reviewState==='verified','Unapproved mandatory technique '+t.id);
   require(t.scientificName && t.useWhen && t.avoidWhen,'Missing method-fit bounds '+t.id);
   require(t.sourceEdition && t.provenance.sourceUrl.includes('notion'),'Missing canonical L2 source '+t.id);
   validSource(t.provenance,t.id);
 }
 require(c.entries.find(x=>x.id==='L2-T13').sourceEdition==='L2-T13-v0.2','T13 approved version lost');
 return c.entries.length;
}
function graphValidate(g,f) {
 require(g.profile==='li-ONT03B-pedagogy-graph-pilot' && g.demoOnly===true,'Not public demo');
 require(schema.properties.demoOnly.const===true,'JSON schema should prohibit non-demo instance');
 require(g.version===ext.extensionVersion && ext.baseContractVersion===shared.schemaVersion && ext.academicContractVersion===academic.schemaVersion && g.academicContractVersion===academic.schemaVersion,'Shared/academic contract version mismatch');
 require(catalog.version===f.catalogVersion && f.version==='0.1.0' && f.demoOnly===true,'Method-fit registry version drift');
 require(f.coverage.sourceStatus==='editorial-only' && f.coverage.userRuntime==='NOT_IMPLEMENTED' && f.coverage.contentPublish==='NOT_AUTHORIZED','False deployment/learning claim');
 require(f.defaultPolicy.methodChoice==='skippable' && f.defaultPolicy.independentScoredFromGuided===false,'Wrong method optionality or knowledge gate');
 require(kinds.size===allKinds.length && predicates.size===allPredicates.length,'Overriding inherited type names not allowed');
 unique(g.nodes.map(n=>n.id),'pedagogy node ID');unique(g.edges.map(e=>e.id),'pedagogy edge ID');
 unique(f.lessons.map(x=>x.canonicalLessonId),'method-fit per lesson');
 const inherited=new Map(academicGraph.nodes.map(n=>[n.id,n]));
 const own=new Map(g.nodes.map(n=>[n.id,n]));
 for(const id of own.keys())require(!inherited.has(id),'Overwrites academic node '+id);
 const nodes=new Map([...inherited,...own]);
 const aliases=new Map(),touched=new Set(),triples=new Set(),symmetric=new Set();
 for(const n of g.nodes) {
   require(idPattern.test(n.id),'Invalid node ID '+n.id);
   require(kinds.has(n.kind),'Unregistered kind '+n.kind);
   require(n.visibility==='public_curated' && kinds.get(n.kind).defaultVisibility==='public_curated','Private node in public pedagogy graph '+n.id);
   require(shared.enums.reviewState.includes(n.reviewState),'Bad review state '+n.id);
   require(n.publishState==='draft','Premature pedagogy publishing '+n.id);
   require(shared.enums.rightsState.includes(n.rightsState),'Bad rights state '+n.id);
   require(/^\d+\.\d+\.\d+$/.test(n.version),'Bad node version '+n.id);
   validSource(n.provenance,n.id);
   require(n.attributes && typeof n.attributes==='object' && !Array.isArray(n.attributes),'Missing method attributes '+n.id);
   if(n.reviewState==='verified')require(n.kind==='TechniqueDefinition' && n.provenance.evidenceType!=='synthetic_fixture','Unreviewed pedagogy instance promoted '+n.id);
   if(n.kind==='TechniqueDefinition') {
     require(catalog.entries.some(t=>'technique:'+t.id===n.id),'Noncanonical method node '+n.id);
     require(n.attributes.canonicalTechniqueId===n.id.slice(10),'Technique ID mismatch '+n.id);
   }
   if(n.kind==='TechniqueApplication') {
     require(n.attributes.fitRole==='primary' && n.attributes.runtime==='unimplemented','Bogus primary/runtime '+n.id);
     require(n.id==='application:'+n.attributes.applicationId,'Unstable application ID '+n.id);
   }
   if(n.kind==='Micropractice') {
     require(n.attributes.assessmentRole==='K3_execution_not_mastery' && Array.isArray(n.attributes.procedureActions)&&n.attributes.procedureActions.length>0,'No enacted method actions '+n.id);
     require(n.attributes.feedbackGate==='after_micropractice_submission','Practice feedback exposed '+n.id);
   }
   if(n.kind==='IndependentChallenge') {
     require(n.attributes.assessmentRole==='K1_lesson_knowledge' && n.attributes.answerGate==='after_independent_submission','Independent answer revealed too early '+n.id);
     require(n.attributes.assistanceEligibility==='unassisted_only_for_independent_evidence','Assisted submission mislabeled independent '+n.id);
   }
   if(n.kind==='Rubric')require(n.attributes.notMasteryProof===true && n.attributes.state==='uncalibrated_editorial','Uncalibrated rubric promoted '+n.id);
   if(n.kind==='HintPolicy')require(n.attributes.noSolutionBeforeSubmission===true && n.attributes.marksAssisted===true,'Hint leaks answer or ignores assistance '+n.id);
   if(n.kind==='RevealGate')require(n.attributes.micropracticeFeedback==='after_micropractice_submission' && n.attributes.independentSolution==='after_independent_submission' && n.attributes.noMethodGuideViewTrigger===true,'Bad reveal gate '+n.id);
   for(const alias of [{locale:'en',text:n.title},...(n.aliases||[])]){
     require(['vi','en'].includes(alias.locale)&&typeof alias.text==='string'&&alias.text.trim(),'Bad alias '+n.id);
     const key=n.kind+'|'+alias.locale+'|'+cleaned(alias.text);
     require(!aliases.has(key)||aliases.get(key)===n.id,'Alias collision '+key);
     aliases.set(key,n.id);
   }
 }
 for(const p of allPredicates)for(const kind of [...p.from,...p.to])require(kinds.has(kind),'Undefined kind '+p.name+': '+kind);
 for(const e of g.edges){
   require(idPattern.test(e.id),'Invalid edge ID '+e.id);
   const from=nodes.get(e.from),to=nodes.get(e.to),p=predicates.get(e.predicate);
   require(from && to,'Dangling pedagogic reference '+e.id);
   require(e.from!==e.to,'Self edge '+e.id);
   require(e.visibility==='public_curated' && e.reviewState==='proposed','Unapproved pedagogy link promoted/leaked '+e.id);
   validSource(e.provenance,e.id);
   require(p && p.from.includes(from.kind) && p.to.includes(to.kind),'Invalid endpoints '+e.id);
   const triple=e.predicate+'|'+e.from+'|'+e.to;
   require(!triples.has(triple),'Duplicate edge triple '+triple);triples.add(triple);
   if(p.symmetric){
     const a=e.predicate+'|'+[e.from,e.to].sort().join('|');
     require(!symmetric.has(a),'Symmetric duplicate '+a);symmetric.add(a);
   }
   touched.add(e.from);touched.add(e.to);
 }
 for(const n of g.nodes)require(touched.has(n.id),'Orphan pedagogic node '+n.id);
 require(f.lessons.length===3 && f.coverage.methodDefinitions===13 && f.coverage.caseLessons.join('|')==='L09-1-1|L03-2-1|L15-2-1','Pilot scope inflated');
 for(const fLesson of f.lessons){
   const lessonId='lesson:'+fLesson.canonicalLessonId;
   require(inherited.get(lessonId)?.kind==='Lesson','Unconfirmed lesson '+lessonId);
   require(inherited.get(fLesson.outcomeRef)?.kind==='LearningOutcome','Unknown learning outcome '+fLesson.outcomeRef);
   require(catalog.entries.some(t=>t.id===fLesson.primaryTechniqueId),'Noncanonical primary method '+lessonId);
   require(Array.isArray(fLesson.optionalTechniqueIds) && fLesson.optionalTechniqueIds.length<=1,'Multiple forced technique choices '+lessonId);
   require(fLesson.optionalTechniqueIds.every(t=>catalog.entries.some(x=>x.id===t)&&t!==fLesson.primaryTechniqueId),'Duplicate/unknown optional method '+lessonId);
   require(fLesson.status==='editorial_draft' && fLesson.evidenceStatus.includes('NOT MEASURED'),'Method claimed implemented '+lessonId);
   require(fLesson.practiceCaseKey!==fLesson.independentCaseKey,'Same case reused for independent evaluation '+lessonId);
   require(fLesson.revealPolicy==='practice_feedback_after_practice_submit__answer_after_independent_submit','Unsafe answer gating '+lessonId);
   require(fLesson.methodProcedureActions?.length>0 && fLesson.fitRationale?.trim() && fLesson.avoidCondition?.trim(),'Missing grounded method fit '+lessonId);
   validSource(fLesson.source,lessonId);
   const app=own.get(fLesson.applicationRef),mic=own.get(fLesson.practiceRef),ind=own.get(fLesson.independentChallengeRef);
   require(app?.kind==='TechniqueApplication' && mic?.kind==='Micropractice' && ind?.kind==='IndependentChallenge','Missing primary pedagogic object '+lessonId);
   require(app.attributes.canonicalLessonId===fLesson.canonicalLessonId && app.attributes.canonicalTechniqueId===fLesson.primaryTechniqueId,'Application mapping mismatch '+lessonId);
   require(mic.attributes.caseKey===fLesson.practiceCaseKey && ind.attributes.caseKey===fLesson.independentCaseKey,'Case-identity collision '+lessonId);
   require(JSON.stringify(mic.attributes.procedureActions)===JSON.stringify(fLesson.methodProcedureActions),'Method enactment actions mismatch '+lessonId);
   const where=(predicate,from,to)=>g.edges.filter(e=>e.predicate===predicate && e.from===from && e.to===to).length===1;
   require(where('USES_METHOD',lessonId,app.id) && where('INSTANTIATES_METHOD',app.id,'technique:'+fLesson.primaryTechniqueId),'Primary method graph is broken '+lessonId);
   require(where('ASSESSES_METHOD',mic.id,app.id) && where('ASSESSES_OUTCOME',ind.id,fLesson.outcomeRef),'Method/knowledge conflated '+lessonId);
   for(const optional of fLesson.optionalTechniqueIds)require(where('OPTIONAL_METHOD',lessonId,'technique:'+optional),'Optional technique absent '+lessonId);
   require(g.edges.filter(e=>e.predicate==='USES_METHOD'&&e.from===lessonId).length===1,'More than one primary technique '+lessonId);
   const rubric='rubric:'+fLesson.canonicalLessonId+':v1',hint='hint-policy:'+fLesson.canonicalLessonId+':v1',gate='reveal-gate:'+fLesson.canonicalLessonId+':v1';
   require(where('HAS_RUBRIC',ind.id,rubric),'Missing independent rubric '+lessonId);
   require(where('GOVERNED_BY_HINT',ind.id,hint) && where('GOVERNED_BY_HINT',mic.id,hint),'Hint linkage incomplete '+lessonId);
   require(where('CONTROLLED_BY_GATE',mic.id,gate) && where('CONTROLLED_BY_GATE',ind.id,gate),'Answer/practice reveal gates not separated '+lessonId);
 }
 return {definitions:catalog.entries.length,lessons:f.lessons.length,nodes:g.nodes.length,edges:g.edges.length,addedRelations:ext.additionalPredicates.length};
}
/**
 * Synthetic, single-attempt assessment classification only.
 * Caller must already enforce user/session ownership and source/permission validity.
 * This function NEVER decides mastery, proficiency or learner improvement.
 */
export function classifyEvidence(input) {
 const submitted=input.independent?.submittedAt;
 const independentlyAssessed=Boolean(submitted && input.independent.rubricEvaluated && input.independent.caseKey &&
    input.independent.assessmentRole==='independent');
 const independentEligible=independentlyAssessed && !input.independent.hintUsed &&
   !input.independent.answerRevealedBeforeSubmit && !input.independent.modelCopied;
 const method=input.micropractice;
 const required=input.expectedMethodSteps||[];
 const enacted=Boolean(method?.submittedAt && method?.applicationId===input.applicationId &&
   method.proceduralEvidence?.trim() && required.length>0 &&
   required.every(step=>(method.performedSteps||[]).includes(step)) && !method.modelCopied);
 const review=input.review;
 const chronologyValid=Boolean(review?.submittedAt && review?.dueAt && submitted &&
   Number.isFinite(Date.parse(review.submittedAt)) &&
   Number.isFinite(Date.parse(review.dueAt)) && Number.isFinite(Date.parse(submitted)) &&
   Date.parse(review.dueAt)>Date.parse(submitted) &&
   Date.parse(review.submittedAt)>=Date.parse(review.dueAt));
 const delayedMeasured=Boolean(chronologyValid && review?.rubricEvaluated && review.caseKey &&
   review.caseKey!==input.independent.caseKey && review.independent===true &&
   !review.hintUsed && !review.answerRevealedBeforeSubmit);
 return {
  K1:{assessmentSubmitted:independentlyAssessed,independentEligible,masteryClaim:false},
  K2:{choiceRecorded:input.methodChoice==='selected'||input.methodChoice==='declined',skippable:true},
  K3:{procedureEnacted:enacted,assisted:Boolean(enacted && method.assisted),masteryClaim:false},
  K5:{actualDelayedIndependentReview:delayedMeasured,notScheduledOnly:true,masteryClaim:false}
 };
}
export function canReveal(state,target) {
 if(target==='micropractice-feedback')return Boolean(state?.micropractice?.submittedAt);
 if(target==='independent-solution')return Boolean(state?.independent?.submittedAt);
 return false;
}
function rejectCases(){
 let count=0;
 const no=(name,mutate)=>{const g=JSON.parse(JSON.stringify(graph));const f=JSON.parse(JSON.stringify(fits));mutate(g,f);let failed=false;try{graphValidate(g,f);}catch{failed=true;}assert.ok(failed,'Negative fixture passed: '+name);count++;};
 no('spoiler before independent submission',(g)=>{g.nodes.find(x=>x.kind==='IndependentChallenge').attributes.answerGate='on_guide_open';});
 no('practice feedback visible on view',g=>{g.nodes.find(x=>x.kind==='Micropractice').attributes.feedbackGate='immediate';});
 no('same practice and assessment case',(g,f)=>{f.lessons[0].independentCaseKey=f.lessons[0].practiceCaseKey;});
 no('noncanonical technique',(g,f)=>{f.lessons[0].primaryTechniqueId='L2-T99';});
 no('mandatory method selection',(g,f)=>{f.defaultPolicy.methodChoice='required';});
 no('two extra optional methods',(g,f)=>{f.lessons[0].optionalTechniqueIds=['L2-T07','L2-T08'];});
 no('two primary method edges',g=>{const e=g.edges.find(e=>e.predicate==='USES_METHOD');g.edges.push({...e,id:'edge:negative:duplicate',to:'application:L15-2-1:l2-t03:p01'});});
 no('private user record in public graph',g=>{g.nodes[0].visibility='private_user';});
 no('missing executed steps',g=>{g.nodes.find(x=>x.kind==='Micropractice').attributes.procedureActions=[];});
 no('method scored against outcome',g=>{g.edges.find(x=>x.predicate==='ASSESSES_METHOD').predicate='ASSESSES_OUTCOME';});
 no('independent graded against technique',g=>{g.edges.find(x=>x.predicate==='ASSESSES_OUTCOME').predicate='ASSESSES_METHOD';});
 no('candidate method edge promoted',g=>{g.edges[0].reviewState='approved';});
 no('stale source reference',g=>{g.edges[0].to='concept:missing';});
 no('duplicate technique identity',g=>{g.nodes.push({...g.nodes[0]});});
 no('rubric claims mastery',g=>{g.nodes.find(x=>x.kind==='Rubric').attributes.notMasteryProof=false;});
 no('hint does not mark assistance',g=>{g.nodes.find(x=>x.kind==='HintPolicy').attributes.marksAssisted=false;});
 no('method application ID changed',g=>{g.nodes.find(x=>x.kind==='TechniqueApplication').attributes.applicationId='T99';});
 no('method fit recorded as live',(g,f)=>{f.coverage.userRuntime='LIVE';});
 no('missing outcome linkage',(g,f)=>{f.lessons[0].outcomeRef='outcome:absent';});
 no('source document missing',g=>{g.nodes[0].provenance.sourceUrl='notion:unverified';});
 return count;
}
function assessSynthetic(){
 const template={
  applicationId:'L09-1-1:l2-t06:p01',methodChoice:'declined',expectedMethodSteps:['contrast_categories','explain_decisive_attribute'],
  micropractice:{applicationId:'L09-1-1:l2-t06:p01',submittedAt:'2026-11-01T10:00:00Z',performedSteps:['contrast_categories','explain_decisive_attribute'],proceduralEvidence:'Compared the target population with the sampled members and justified the difference',assisted:true,modelCopied:false},
  independent:{assessmentRole:'independent',caseKey:'L09-1-1:ind:v1',submittedAt:'2026-11-01T11:00:00Z',rubricEvaluated:true,hintUsed:false,answerRevealedBeforeSubmit:false,modelCopied:false},
  review:{dueAt:'2026-11-08T11:00:00Z',submittedAt:'2026-11-08T11:01:00Z',caseKey:'L09-1-1:review:variant-B',rubricEvaluated:true,independent:true,hintUsed:false,answerRevealedBeforeSubmit:false}
 };
 const clone=x=>JSON.parse(JSON.stringify(x));
 const good=classifyEvidence(template);
 assert.equal(good.K1.independentEligible,true);
 assert.equal(good.K3.procedureEnacted,true);
 assert.equal(good.K3.assisted,true);
 assert.equal(good.K5.actualDelayedIndependentReview,true);
 assert.equal(good.K1.masteryClaim,false);
 let count=1;
 const falseWhere=(name,change,field)=>{
  const x=clone(template);change(x);const result=classifyEvidence(x);
  assert.equal(field(result),false,'Evidence false positive: '+name);count++;
 };
 falseWhere('Guide alone is not K3',x=>{x.micropractice=null;},r=>r.K3.procedureEnacted);
 falseWhere('Method chosen only is not K3',x=>{x.micropractice=null;x.methodChoice='selected';},r=>r.K3.procedureEnacted);
 falseWhere('Partial steps are not enacted method',x=>{x.micropractice.performedSteps=['contrast_categories'];},r=>r.K3.procedureEnacted);
 falseWhere('Copied model is not procedural proof',x=>{x.micropractice.modelCopied=true;},r=>r.K3.procedureEnacted);
 falseWhere('Guided case is not K1',x=>{x.independent=null;},r=>r.K1.independentEligible);
 falseWhere('Hinted independent case not independently eligible',x=>{x.independent.hintUsed=true;},r=>r.K1.independentEligible);
 falseWhere('Answer revealed before attempt not independent',x=>{x.independent.answerRevealedBeforeSubmit=true;},r=>r.K1.independentEligible);
 falseWhere('Unreviewed rubric not K1',x=>{x.independent.rubricEvaluated=false;},r=>r.K1.assessmentSubmitted);
 falseWhere('Scheduled only not K5',x=>{x.review.submittedAt=undefined;},r=>r.K5.actualDelayedIndependentReview);
 falseWhere('Review before due not K5',x=>{x.review.submittedAt='2026-11-07T11:00:00Z';},r=>r.K5.actualDelayedIndependentReview);
 falseWhere('Due before original attempt not K5',x=>{x.review.dueAt='2026-10-31T11:00:00Z';},r=>r.K5.actualDelayedIndependentReview);
 falseWhere('Same review case not K5',x=>{x.review.caseKey=x.independent.caseKey;},r=>r.K5.actualDelayedIndependentReview);
 falseWhere('Hinted review not independent K5',x=>{x.review.hintUsed=true;},r=>r.K5.actualDelayedIndependentReview);
 falseWhere('No independent review score not K5',x=>{x.review.rubricEvaluated=false;},r=>r.K5.actualDelayedIndependentReview);
 assert.equal(canReveal({},'micropractice-feedback'),false);count++;
 assert.equal(canReveal({micropractice:{submittedAt:template.micropractice.submittedAt}},'micropractice-feedback'),true);count++;
 assert.equal(canReveal({micropractice:{submittedAt:template.micropractice.submittedAt}},'independent-solution'),false);count++;
 assert.equal(canReveal({independent:{submittedAt:template.independent.submittedAt}},'independent-solution'),true);count++;
 require(privateSchema.additionalProperties===false && !Object.hasOwn(privateSchema.properties,'ownerId'),'Client must not submit owner ID');
 require(privateSchema.properties.kind.enum.includes('REVIEW_ATTEMPTED'),'Private event kind missing delayed-review record');
 return count;
}
const args=process.argv.slice(2);
if(args.length===0||args.length===1 && args[0]==='--check'){
 const total=validMethodCatalog(catalog), result=graphValidate(graph,fits), negativeCases=rejectCases(),syntheticScenarios=assessSynthetic();
 console.log(JSON.stringify({status:'PASS',...result,canonicalMethodCount:total,negativeCases,syntheticScenarios,learnerRuntime:'NOT IMPLEMENTED',production:'NO DB/DEPLOY'}));
}else{fail('Usage: node tools/validate_pedagogy_ontology.mjs --check');}
