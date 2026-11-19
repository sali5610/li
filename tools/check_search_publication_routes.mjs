#!/usr/bin/env node
/**
 * ONT-04B2b1 route authority audit — source-code presence != publication/permission.
 * Zero dependencies. Reads checked-in native code; no browser, DB or credentials.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectSearchRoute,annotateSearchResult} from '../docs/ontology/search/routes/route-readiness.mjs';
import {buildPilotIndex,searchPilot} from '../docs/ontology/search/offline-search.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const read=p=>readFileSync(resolve(root,p),'utf8');
const manifest=load('docs/ontology/search/routes/native-route-candidates.v0.1.json');
const schema=load('docs/ontology/search/routes/route-audit.schema.json');
const academic=load('docs/ontology/academic/demo.graph.v0.1.json');
const pedagogy=load('docs/ontology/pedagogy/demo.graph.v0.1.json');
const methods=load('docs/ontology/pedagogy/techniques.v0.2.json');
const candidates=load('docs/ontology/search/candidate-outlines.v0.1.json');
const nativeHtml=read('site/index.html');
const search=buildPilotIndex({academicGraph:academic,pedagogyGraph:pedagogy,methodCatalog:methods,candidateOutlines:candidates.nodes});

const require=(x,label)=>{if(!x)throw Error('ROUTE_AUDIT_FAIL: '+label)};
const unique=(arr,label)=>require(new Set(arr).size===arr.length,'Duplicate '+label);
const sameKeys=(obj,expected,label)=>require(obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).sort().join('|')===expected.slice().sort().join('|'),'Unsupported '+label+' fields');
const NODE_KEYS=['canonicalLessonId','nativeRouteKey','pageElementId','markupPath','editorialStatus','ontologyRecordRef','researchNote','visibility','nativeCode','publicationDecision','rightsDecision','permissionDecision','routeAvailability','appUrl','openAction','humanReleaseApproved','publishProof'];
const METADATA_KEYS=['nativeMapSource','sourceHead','provenance','globalRuntime'];
const runtimeKeys=['appAccessPolicy','googleAuthPilot','serverAuthorization','privateLearnerData','approvedReleaseManifest','clientRoutingAuthority'];
const coverageKeys=['nativeRouteCandidates','reviewedSearchPublicationRoutes','verifiedAuthUserCount','fullCatalogCoverage','liveAppIntegration','ont03c'];
function extractNativeMap(source) {
 const match=source.match(/\bconst\s+LI_LESSON_ROUTES=\{([^}]+)\};/);
 require(match,'Native lesson route authority not found');
 const entries=new Map();
 for(const found of match[1].matchAll(/([a-zA-Z][a-zA-Z0-9]*):"([^"]+)"/g)){
  require(!entries.has(found[1]),'Duplicate actual native route');
  entries.set(found[1],found[2]);
 }
 require(entries.size>0,'Empty native route mapping');
 return entries;
}
function validate(m,site=nativeHtml) {
 sameKeys(m,['profile','version','scope','source','coverage','candidates'],'manifest');
 require(m.profile==='li-ONT04B2b1-native-route-audit-only'&&m.version==='0.1.0','Unknown route manifest version');
 require(m.scope==='DRAFT_NON_NAVIGABLE_CANDIDATES','Source-only manifest falsely becomes release authority');
 sameKeys(m.source,METADATA_KEYS,'source');
 require(m.source.nativeMapSource==='site/index.html','Native map source must be actual app entrypoint');
 require(/^[a-f0-9]{40}$/.test(m.source.sourceHead),'Missing base commit provenance');
 require(m.source.provenance.sourceUrl.startsWith('https://github.com/sali5610/li/'),'Route source provenance mismatch');
 require(m.source.provenance.sourceSection.includes('LI_LESSON_ROUTES'),'Missing original source section');
 require(/^\d{4}-\d{2}-\d{2}$/.test(m.source.provenance.checkedOn),'Missing provenance date');
 sameKeys(m.source.globalRuntime,runtimeKeys,'runtime');
 const gates=m.source.globalRuntime;
 require(gates.appAccessPolicy==='invite_only_intended'&&
  gates.serverAuthorization==='NOT_VERIFIED'&&gates.approvedReleaseManifest==='ABSENT'&&
  gates.clientRoutingAuthority==='NONE'&&gates.privateLearnerData==='UNAVAILABLE_TO_SEARCH',
  'Route audit falsely authorizes authentication or publication');
 sameKeys(m.coverage,coverageKeys,'coverage');
 require(m.coverage.nativeRouteCandidates===3 && m.coverage.reviewedSearchPublicationRoutes===0 &&
  m.coverage.verifiedAuthUserCount===0 && m.coverage.fullCatalogCoverage==='NOT_ASSESSED' &&
  m.coverage.liveAppIntegration==='BLOCKED' && m.coverage.ont03c==='PENDING',
  'Audit misstates real app, curriculum or auth coverage');
 require(m.candidates.length===3,'Route census is exactly the three source-present Wave1 routes');
 const map=extractNativeMap(site);
 require(map.size===3,'Native code route count drift: rerun research before promotion');
 unique(m.candidates.map(c=>c.canonicalLessonId),'canonical lesson');
 unique(m.candidates.map(c=>c.nativeRouteKey),'native route');
 unique(m.candidates.map(c=>c.pageElementId),'DOM page');
 let observed=0,matchedInAcademic=0;
 for(const entry of m.candidates){
  sameKeys(entry,NODE_KEYS,'candidate');
  require(/^L\d{2}-\d+-\d+$/.test(entry.canonicalLessonId),'Malformed canonical ID');
  require(/^lessonL\d{2}$/.test(entry.nativeRouteKey),'Malformed native route key');
  require(entry.pageElementId==='page-'+entry.nativeRouteKey,'Page ID mismatch');
  require(map.get(entry.nativeRouteKey)===entry.canonicalLessonId,'Native route misidentified '+entry.nativeRouteKey);
  require(/^site\/assets\/lesson-l\d{2}-hifi-markup\.js$/.test(entry.markupPath) &&
   !entry.markupPath.includes('..'),'Markup path not controlled');
  const markup=read(entry.markupPath);
  require(markup.includes('id="'+entry.pageElementId+'"'),'Missing dynamic page HTML '+entry.pageElementId);
  require(markup.includes('data-lesson-id="'+entry.canonicalLessonId+'"'),'Missing matching DOM lesson ID');
  require(markup.includes('id="'+entry.nativeRouteKey.slice(-3).toLowerCase()+'-status"') ||
    markup.includes('id="'+entry.nativeRouteKey.slice(-3).toLowerCase().replace('l','l')+'-status"'),
    'Missing editorial status marker');
  require(entry.editorialStatus==='po_content_locked_ui_in_review' && 
   entry.visibility==='public_curated' &&
   entry.nativeCode==='ROUTE_AND_MARKUP_PRESENT' &&
   entry.publicationDecision==='NOT_APPROVED_FOR_SEARCH_NAVIGATION' &&
   entry.rightsDecision==='UNVERIFIED_FOR_SEARCH_RELEASE' &&
   entry.permissionDecision==='REAL_AUTH_AND_RLS_TEST_PENDING' &&
   entry.routeAvailability==='CODE_PRESENT_NOT_USER_AVAILABLE',
   'Premature approval of route');
  require(entry.appUrl===null && entry.openAction===null && entry.publishProof===null &&
   entry.humanReleaseApproved===false,'Fake publication proof or actionable deep link');
  require(typeof entry.researchNote==='string'&&entry.researchNote.length>=10,'Missing source limitation note');
  const sourceNode=academic.nodes.find(n=>n.id==='lesson:'+entry.canonicalLessonId);
  if(sourceNode){
   matchedInAcademic++;
   require(entry.ontologyRecordRef===sourceNode.id,'Canonical graph ID mismatch');
   require(sourceNode.publishState!=='published','Academic fixture unexpectedly marked published; audit must be redone');
  } else require(entry.ontologyRecordRef===null,'Invented graph record '+entry.canonicalLessonId);
  const result=inspectSearchRoute(m,entry.canonicalLessonId);
  require(result.nativeCodeKnown && !result.navigationPermitted &&
   result.deepLink===null && result.action===null && result.blockers?.length===5,
   'Route inspection unlocked navigation');
  observed++;
 }
 require(matchedInAcademic===1,'Graph crosswalk coverage drift; pilot requires re-review');
 const viaSearch=searchPilot(search,'L09-1-2').results[0];
 require(viaSearch?.id==='lesson:L09-1-2','Source-linked search result absent');
 const combined=annotateSearchResult(m,viaSearch);
 require(combined.readiness.playable===false &&
   combined.publicationAudit.nativeCodeKnown===true &&
   combined.publicationAudit.navigationPermitted===false &&
   combined.publicationAudit.deepLink===null,
  'A source-present Wave1 search result falsely became an app navigation permission');
 for(const missing of ['L03-1-2','L15-2-2']){
  const text=searchPilot(search,missing);
  require(text.results.every(x=>x.id!=='lesson:'+missing),
   'Unindexed locked Wave1 lesson promoted into search corpus without graph review: '+missing);
 }
 return {manifestCandidates:observed,sourceRoutePairs:map.size,academicGraphLinked:matchedInAcademic,reviewedSearchNavigation:0,actualAuthTests:0};
}
function negativeTests(){
 let count=0;
 const clone=x=>structuredClone(x);
 const reject=(name,change)=>{
  const m=clone(manifest);
  change(m);
  let caught=false;try{validate(m);}catch{caught=true}
  assert.equal(caught,true,'Failed to reject '+name);
  count++;
 };
 reject('duplicate canonical lesson',m=>{m.candidates[1].canonicalLessonId=m.candidates[0].canonicalLessonId});
 reject('invented route mapping',m=>{m.candidates[1].nativeRouteKey='lessonL99';m.candidates[1].pageElementId='page-lessonL99'});
 reject('review-only becomes published',m=>{m.candidates[0].publicationDecision='PUBLISHED'});
 reject('rights falsely cleared',m=>{m.candidates[0].rightsDecision='CLEARED'});
 reject('fake approved app URL',m=>{m.candidates[0].appUrl='/site/index.html?lesson=L09-1-2'});
 reject('arbitrary JS click action',m=>{m.candidates[0].openAction='navigate("lessonL09")'});
 reject('human release approval spoofed',m=>{m.candidates[0].humanReleaseApproved=true});
 reject('fake publish proof',m=>{m.candidates[0].publishProof='https://example.invalid/release'});
 reject('pretend RLS tested',m=>{m.source.globalRuntime.serverAuthorization='PASSED'});
 reject('pretend Google invited user exists',m=>{m.coverage.verifiedAuthUserCount=1});
 reject('pretend complete course coverage',m=>{m.coverage.fullCatalogCoverage='15_FIELDS_COMPLETE'});
 reject('pretend 03C is done',m=>{m.coverage.ont03c='DONE'});
 reject('invent academic record not in reviewed graph',m=>{m.candidates[1].ontologyRecordRef='lesson:L03-1-2'});
 reject('remove academic ID linkage',m=>{m.candidates[0].ontologyRecordRef=null});
 reject('source path traversal',m=>{m.candidates[0].markupPath='site/../auth.js'});
 reject('missing status evidence',m=>{m.candidates[0].researchNote=''});
 reject('unknown extra dangerous browser action',m=>{m.candidates[0].onClick='window.location="..."'});
 reject('security bypass by changing scope',m=>{m.scope='PRODUCTION_AUTHORIZED'});
 reject('marked released count positive',m=>{m.coverage.reviewedSearchPublicationRoutes=3});
 reject('unaudited new source route',m=>{m.candidates.push({...m.candidates[0],canonicalLessonId:'L09-1-3'})});
 reject('fake browser trust',m=>{m.source.globalRuntime.clientRoutingAuthority='ALLOW'});
 let sourceThrown=false;try{validate(manifest,nativeHtml.replace('lessonL09:"L09-1-2"','lessonL09:"L09-1-3"'));}catch{sourceThrown=true;}
 assert.equal(sourceThrown,true,'Native source drift not detected');count++;
 return count;
}
const evaluation=validate(manifest);
const failures=negativeTests();
assert.equal(schema.properties.scope.const,'DRAFT_NON_NAVIGABLE_CANDIDATES');
assert.equal(schema.properties.candidates.items.$ref,'#/$defs/candidate');
assert.equal(schema.$defs.candidate.properties.openAction.const,null);
assert.equal(schema.$defs.candidate.properties.appUrl.const,null);
assert.equal(schema.$defs.candidate.properties.humanReleaseApproved.const,false);
assert.equal(schema.$defs.candidate.properties.publishProof.const,null);
const notFound=inspectSearchRoute(manifest,'L09-1-1');
assert.equal(notFound.navigationPermitted,false);
assert.equal(notFound.state,'no_curated_route_candidate');
const forged=structuredClone(manifest);
forged.candidates[0].humanReleaseApproved=true;
forged.candidates[0].appUrl='/site/index.html?lesson=L09-1-2';
const stillDenied=inspectSearchRoute(forged,'L09-1-2');
assert.equal(stillDenied.navigationPermitted,false);
assert.equal(stillDenied.deepLink,null);
if(process.argv.length>3 || process.argv.length===3&&process.argv[2]!=='--check')throw Error('Usage: node tools/check_search_publication_routes.mjs --check');
console.log(JSON.stringify({status:'PASS',...evaluation,negativeCases:failures,noLiveDeepLinks:true,gate:"NO_PUBLICATION_GRANT",deployment:"NONE"}));
