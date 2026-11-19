#!/usr/bin/env node
/**
 * ONT-04C1b: actual S121 quote-bank metadata + 3 Wave1 bilingual manifest audit.
 * Extracts JSON literals, NEVER executes the legacy browser JS or recopies quotes.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {STAGES,indexQuoteSafety,inspectQuote} from '../docs/ontology/companion/quote-safety.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const policy=json('docs/ontology/companion/quote-safety-policy.v0.1.json');
const schema=json('docs/ontology/companion/quote-safety.schema.json');
const source=read(policy.baseline.quoteBankFile);
const fail=msg=>{throw Error('QUOTE_SOURCE_AUDIT_FAIL: '+msg);};
const ensure=(ok,msg)=>{if(!ok)fail(msg);};
function extractJsonVariable(text,name,ending){
 const key='const '+name+'=';
 const start=text.indexOf(key);
 ensure(start>=0,'Missing source array '+name);
 const first=start+key.length;
 const stop=text.indexOf(ending,first);
 ensure(stop>first,'Missing literal end for '+name);
 return JSON.parse(text.slice(first,stop+1)); // no evaluation, no runtime side effects
}
const quotes=extractJsonVariable(source,'QUOTES','];');
const en=extractJsonVariable(source,'QUOTES_EN','};');
const manifests=policy.baseline.companionFiles.map(json);
const unique=a=>new Set(a).size===a.length;
function sourceValidate(q=quotes,english=en,ms=manifests,p=policy){
 ensure(p.profile==='li-ONT04C1b-quote-source-audit'&&p.demoOnly===true,'Wrong policy profile');
 const g=p.hardGates;
 const consts={
  defaultQuoteState:'WITHHELD',attributionState:'UNVERIFIED_FOR_NEW_USE',
  originalEditionState:'UNVERIFIED_FOR_NEW_USE',translationRightsState:'UNVERIFIED_FOR_NEW_USE',
  territoryRightsState:'UNVERIFIED_FOR_NEW_USE',contextRelevanceState:'EDITORIAL_ONLY',
  academicEvidenceState:'NEVER_TREAT_AS_SCIENTIFIC_SOURCE',
  quoteRenderAuthorization:'NOT_GRANTED',reviewedQuoteEntries:0,reviewedPublicQuoteEntries:0,
  clientCanApprove:false,independentStage:'SUPPRESS',reflectionStage:'SUPPRESS',
  extensionStage:'SUPPRESS',wrongRightFeedback:'SUPPRESS',calmMode:'SUPPRESS',
  debateMode:'SUPPRESS',preSubmitLessonState:'NO_SOLUTION_OR_HINT_ESCALATION',
  neverCopyOriginalOrTranslatedTextIntoAudit:true
 };
 ensure(Object.keys(g).sort().join('|')===Object.keys(consts).sort().join('|'),'Unknown or missing hard gate');
 for(const [key,value]of Object.entries(consts))ensure(g[key]===value,'Hard gate '+key+' mutated');
 ensure(p.baseline.quoteBankFile==='site/assets/laoly-quotes-s121.js','Drifted source quote bank');
 ensure(q.length===24&&p.baseline.expectedBankEntries===24,'24 source entries expected, must re-audit on change');
 ensure(unique(q.map(x=>x.id)),'Duplicate quote ID');
 ensure(Object.keys(english).length===24&&p.baseline.expectedEnglishMetadata===24,'VI/EN quote metadata parity changed');
 const ids=new Set(q.map(x=>x.id));
 for(const item of q){
  ensure(/^[a-z][a-z0-9-]+$/.test(item.id),'Invalid quote ID');
  ensure(typeof item.original==='string'&&item.original.trim()&&item.original.length<=600,'Missing/outlier original '+item.id);
  ensure(typeof item.translation==='string'&&item.translation.trim()&&typeof item.interpretation==='string'&&item.interpretation.trim(),'Missing base gloss '+item.id);
  ensure(typeof item.meta==='string'&&item.meta.trim(),'Missing attribution field '+item.id);
  ensure(typeof item.url==='string'&&item.url.startsWith('https://'),'Missing https reference '+item.id);
  ensure(['zh-Hant','en'].includes(item.lang),'Unknown source text language');
  ensure(Array.isArray(item.tags)&&item.tags.length>=2&&item.tags.every(t=>typeof t==='string'&&t),'Missing selection tags '+item.id);
  const localized=english[item.id];
  ensure(localized&&['meta','translation','interpretation','comment','gloss'].every(k=>typeof localized[k]==='string'&&localized[k].trim()),'EN metadata missing '+item.id);
 }
 ensure(ms.length===3&&p.baseline.companionFiles.length===3,'3 native lesson companion manifests needed');
 const entries=[];
 let refs=0,stageCount=0;
 for(const doc of ms){
  ensure(/^L\d{2}-\d+-\d+$/.test(doc.lesson_id),'Companion lesson ID bad');
  ensure(doc.editorial?.status==='review','No independent scholarly review');
  ensure(doc.moments?.length===6,'Missing six-stage mentor source');
  for(const [i,m]of doc.moments.entries()){
   ensure(m.stage===STAGES[i],'Wrong S125 stage order');
   ensure(m.vi?.prompt&&m.en?.prompt&&m.vi?.actions?.length===2&&m.en?.actions?.length===2,'VI/EN mentor parity');
   ensure(ids.has(m.quote_id),'Unknown primary quote ID');
   ensure(m.quote_ids?.length===4&&unique(m.quote_ids),'Four unique source quote alternatives');
   ensure(m.quote_ids.includes(m.quote_id),'Primary quote absent from source alternatives');
   ensure(m.quote_ids.every(id=>ids.has(id)),'Unknown alternative quote ID');
   entries.push(...m.quote_ids,m.quote_id);refs+=m.quote_ids.length+1;stageCount++;
  }
 }
 ensure(refs===90&&p.baseline.expectedTotalCompanionReferences===90,'Original reference count drift');
 ensure(stageCount===18&&p.baseline.expectedCompanionStageCount===18,'Stage count drift');
 ensure(new Set(entries).size===17&&p.baseline.expectedUniqueCompanionRefs===17,'Source quote reference coverage drift');
 ensure(p.referenceChecks.length===4,'Historical/reuse risk review cards drift');
 for(const x of p.referenceChecks)ensure(/^https:\/\//.test(x.sourceUrl)&&x.reviewStatus.includes('PENDING')||x.reviewStatus==='OUTSIDE_CURRENT_BANK_BLOCKED','Unreviewed reference promoted');
 ensure(p.referenceChecks.some(x=>x.id==='box-models'&&x.reviewStatus==='PENDING_PRIMARY_TEXT_AND_REUSE'),'Box book/source quote rights gap untracked');
 ensure(p.referenceChecks.some(x=>x.id==='woolf-room'&&x.reviewStatus==='PENDING_GLOBAL_RIGHTS_AND_EXCERPT'),'Woolf territory rights gap untracked');
 ensure(!ids.has('galileo-eppur')&&!ids.has('seneca-motto'),'Historical disputed quote smuggled into current bank');
 ensure(p.legacyRuntimeSafetyFinding?.severity==='GATE_OPEN_DO_NOT_CLAIM_FIXED','Existing legacy quote runtime erroneously declared fixed');
 const index=indexQuoteSafety({policy:p,quoteIds:q.map(x=>x.id),companionManifests:ms});
 return {index,bankEntries:q.length,sourceReferencedQuoteIDs:new Set(entries).size,companions:ms.length,stages:stageCount,sourceReferences:refs};
}
const result=sourceValidate();
let inspected=0,suppressed=0,held=0;
for(const doc of manifests)for(const stage of STAGES)for(const locale of ['vi','en']){
 const d=inspectQuote(result.index,{lessonId:doc.lesson_id,stage,locale});
 inspected++;
 ensure(Object.values(d.permission).every(v=>v===false)&&d.original===null&&d.translation===null&&d.gloss===null&&d.author===null&&d.handler===null&&d.appRoute===null,'Metadata gate accidentally reveals a quote or executable action');
 if(['independent','reflection','extension'].includes(stage)){
  ensure(d.status==='SUPPRESSED_ASSESSMENT_STAGE'&&d.candidateId===null,'Quote shown at assessment/post-submit stage');suppressed++;
 } else {
  ensure(d.status==='WITHHELD_SOURCE_RIGHTS_UNREVIEWED'&&
   result.index.quotes.has(d.candidateId),'Allowed public quote before rights clearance');held++;
 }
}
let negatives=0;
function rejectInput(label,input,status='REJECTED_PRIVATE_OR_UNKNOWN_INPUT'){
 const r=inspectQuote(result.index,input);
 assert.equal(r.status,status,label);
 assert.equal(r.permission.renderAllowed,false,label+' render');
 assert.equal(r.original,null,label+' quote');
 negatives++;
}
const safe={lessonId:'L09-1-2',stage:'opening',locale:'vi'};
for(const field of ['attempt','answer','answerKey','submitted','hintCount','session','email','ownerId','userId','jwt','token','privateNotes','progress','feedbackText','isAdmin','role','rightsApproved','canRevealAnswer','url','quoteOriginal','quoteTranslation','authenticated','accountId']){
 rejectInput('reject private/authority field '+field,{...safe,[field]:true});
}
rejectInput('null input',null);
rejectInput('array input',[safe]);
rejectInput('bad locale',{...safe,locale:'fr'},'INVALID_CONTEXT');
rejectInput('unknown stage',{...safe,stage:'solution'},'INVALID_CONTEXT');
rejectInput('unknown quote candidate',{...safe,candidateId:'galileo-eppur'},'UNSUPPORTED_QUOTE_ID');
rejectInput('wrong stage quote',{...safe,candidateId:'seneca-time'},'UNSUPPORTED_QUOTE_ID');
rejectInput('unknown canonical lesson',{...safe,lessonId:'L15-9-8'},'UNKNOWN_SOURCE_LESSON');
for(const k of ['calmMode','debateMode','feedbackVisible']){
 const d=inspectQuote(result.index,{...safe,[k]:true});
 assert.equal(d.status,'SUPPRESSED_UI_CONTEXT');
 assert.equal(d.permission.renderAllowed,false);negatives++;
}
for(const k of ['independent','reflection','extension']){
 const d=inspectQuote(result.index,{...safe,stage:k,candidateId:'hume-evidence'});
 assert.equal(d.status,'SUPPRESSED_ASSESSMENT_STAGE');
 assert.equal(d.candidateId,null);negatives++;
}
function mutatePolicy(label,change){
 const p=structuredClone(policy);
 change(p);
 assert.throws(()=>sourceValidate(quotes,en,manifests,p),undefined,label);
 negatives++;
}
mutatePolicy('fake quote publication',p=>p.hardGates.quoteRenderAuthorization='GRANTED');
mutatePolicy('fake rights clearance',p=>p.hardGates.territoryRightsState='CLEARED');
mutatePolicy('fake author verification',p=>p.hardGates.attributionState='VERIFIED');
mutatePolicy('fake reviewer signoff',p=>p.hardGates.reviewedQuoteEntries=24);
mutatePolicy('fake permission boolean',p=>p.hardGates.clientCanApprove=true);
mutatePolicy('pretend S121 runtime fixed',p=>p.legacyRuntimeSafetyFinding.severity='FIXED_IN_PRODUCTION');
const tampered=structuredClone(manifests);tampered[0].moments[0].quote_id='unregistered';
assert.throws(()=>sourceValidate(quotes,en,tampered,policy));negatives++;
const tamperedEn=structuredClone(en);delete tamperedEn['hume-evidence'];assert.throws(()=>sourceValidate(quotes,tamperedEn,manifests,policy));negatives++;
const tamperedLink=structuredClone(quotes);tamperedLink[0].url='http://untrusted.example';assert.throws(()=>sourceValidate(tamperedLink,en,manifests,policy));negatives++;
assert.equal(schema.properties.hardGates.properties.quoteRenderAuthorization.const,'NOT_GRANTED');
assert.equal(schema.properties.hardGates.properties.reviewedQuoteEntries.const,0);
assert.equal(schema.properties.hardGates.properties.clientCanApprove.const,false);
const stringReport=JSON.stringify({status:'PASS',bankEntries:result.bankEntries,sourceReferencedQuoteIDs:result.sourceReferencedQuoteIDs,companions:result.companions,sourceStages:result.stages,sourceReferences:result.sourceReferences,localeStageCases:inspected,assessmentOrPostSubmitSuppressed:suppressed,activeStageRightsHeld:held,negativeCases:negatives,reviewApprovedQuotes:0,renderedQuotes:0,legacyRuntime:'GATE_OPEN_UNCHANGED',sourceVerification:'METADATA_AUDIT_ONLY',release:'NONE'});
if(process.argv.length>3||(process.argv.length===3&&process.argv[2]!=='--check'))throw Error('Usage: node tools/check_companion_quote_safety.mjs --check');
console.log(stringReport);
