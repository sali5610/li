#!/usr/bin/env node
/** ONT-04A offline-only deterministic search/evaluation. No writes to app or private data. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPilotIndex,searchPilot,expandReviewed} from '../docs/ontology/search/offline-search.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const academic=load('docs/ontology/academic/demo.graph.v0.1.json');
const pedagogy=load('docs/ontology/pedagogy/demo.graph.v0.1.json');
const methods=load('docs/ontology/pedagogy/techniques.v0.2.json');
const outlines=load('docs/ontology/search/candidate-outlines.v0.1.json');
const gold=load('docs/ontology/search/eval-corpus.v0.1.json');
const input=()=>({academicGraph:structuredClone(academic),pedagogyGraph:structuredClone(pedagogy),methodCatalog:structuredClone(methods),candidateOutlines:structuredClone(outlines.nodes)});
const idx=buildPilotIndex(input());
assert.equal(gold.cases.length,21,'Gold corpus version drift');
assert.equal(outlines.nodes.length,2,'Candidate-only scope drift');

let positive=0, top1=0, at5=0, reciprocal=0, negatives=0;
const mismatch=[];
for(const [i,g] of gold.cases.entries()){
 const result=searchPilot(idx,g.q,{locale:g.locale||'vi',kind:g.kind||null,includeCandidates:Boolean(g.includeCandidates),limit:10});
 if(g.id===null){
  negatives++;
  if(result.status!=='no_match'||result.results.length) mismatch.push({index:i,q:g.q,expected:null,got:result.results.slice(0,3).map(r=>r.id)});
  continue;
 }
 positive++;
 const rank=result.results.findIndex(r=>r.id===g.id)+1;
 if(rank===1)top1++;
 if(rank>0&&rank<=5)at5++;
 if(rank>0)reciprocal+=1/rank;
 if(rank!==1)mismatch.push({index:i,q:g.q,expected:g.id,rank,got:result.results.slice(0,4).map(r=>r.id)});
}
assert.deepEqual(mismatch,[],'Gold query exact top-1 / missing safety negative regression');

function resultOne(q,opts={}){return searchPilot(idx,q,{limit:10,...opts})}
function mustReject(f,label){
 let did=false;
 try{f();}catch{did=true}
 assert.equal(did,true,'Safety gate accepted '+label);
}
const tests=[];
function check(name,fn){fn();tests.push(name)}
check('Scope: only source-linked curated public types',()=>{
 assert.ok(idx.fixtureOnly&&idx.index.size>=20);
 assert.ok([...idx.index.values()].every(r=>r.provenance.sourceUrl.startsWith('https://')));
 assert.ok(![...idx.index.values()].some(r=>['Attempt','Learner','Feedback','ReviewDue','AssistanceEvent'].includes(r.kind)));
});
check('No production route or false released lesson',()=>{
 assert.ok([...idx.index.values()].filter(r=>r.kind==='Lesson').length>=5);
 for(const r of resultOne('L09-1-2').results)assert.equal(r.readiness.playable,false);
 assert.match(resultOne('L09-1-2').results[0].readiness.state,/po_content_locked/);
});
check('S37 candidates hidden until explicitly included',()=>{
 assert.equal(resultOne('Pinyin').status,'no_match');
 const result=resultOne('Pinyin',{includeCandidates:true});
 assert.equal(result.results[0].id,'lesson:L01-1-1');
 assert.equal(result.results[0].readiness.state,'proposed_candidate');
 assert.equal(result.results[0].readiness.playable,false);
 assert.equal(result.results[0].rightsState,'unknown');
});
check('VI/EN aliases share IDs rather than copy lessons',()=>{
 const vi=resultOne('khoa hoc du lieu',{locale:'vi'}),en=resultOne('Data Science',{locale:'en'});
 assert.equal(vi.results[0].id,en.results[0].id);
 assert.equal(vi.results[0].id,'field:F09');
 assert.equal([...idx.index.keys()].filter(x=>x==='field:F09').length,1);
});
check('T06 short alias and L2-T06 canonical alias deduplicated',()=>{
 assert.equal(resultOne('T06').results[0].id,'technique:L2-T06');
 assert.equal(resultOne('L2-T06').results[0].id,'technique:L2-T06');
 assert.equal(resultOne('T13').results[0].id,'technique:L2-T13');
 assert.equal([...idx.index.values()].filter(x=>x.id==='technique:L2-T06').length,1);
});
check('Type filter preserves separation of same surface term',()=>{
 const subset=resultOne('taxonomy',{kind:'Concept',includeCandidates:true});
 assert.equal(subset.results[0].kind,'Concept');
 const other=resultOne('taxonomy',{kind:'Lesson'});
 assert.equal(other.results[0].kind,'Lesson');
 assert.notEqual(subset.results[0].id,other.results[0].id);
});
check('Accents/typos do not merge different identities',()=>{
 assert.equal(resultOne('taxonmy',{kind:'Concept',includeCandidates:true}).results[0].id,'concept:ont03a:taxonomic-classification');
 assert.equal(resultOne('sai lech chon mau',{kind:'Concept',includeCandidates:true}).results[0].id,'concept:ont01:selection-bias');
});
check('Two synthetic same-label different-type meanings stay distinct',()=>{
 const synthetic={...idx,index:new Map(idx.index)};
 const provenance={sourceUrl:'https://example.invalid/synthetic-only',sourceSection:'artificial negative regression',checkedOn:'2026-11-19'};
 synthetic.index.set('concept:fixture:logic',{id:'concept:fixture:logic',kind:'Concept',title:'Logic',aliases:[],reviewState:'proposed',publishState:'draft',rightsState:'unknown',version:'test',provenance});
 synthetic.index.set('lesson:fixture:logic',{id:'lesson:fixture:logic',kind:'Lesson',title:'Logic',aliases:[],reviewState:'proposed',publishState:'draft',rightsState:'unknown',version:'test',provenance});
 const out=searchPilot(synthetic,'logic',{includeCandidates:true});
 assert.equal(out.results.filter(r=>r.title==='Logic').length,2);
 assert.deepEqual(new Set(out.results.filter(r=>r.title==='Logic').map(r=>r.kind)),new Set(['Concept','Lesson']));
});
check('Reviewed only 1-hop graph is traceable; not a prerequisite',()=>{
 const related=expandReviewed(idx,'lesson:L09-1-1',{hops:1});
 assert.ok(related.some(x=>x.id==='field:F09'&&x.path[0].predicate==='SCOPED_TO_FIELD'));
 assert.ok(related.every(x=>x.path.every(p=>p.sourceUrl.startsWith('https://'))));
 assert.ok(related.every(x=>x.whyShown.includes('NOT prerequisite')));
});
check('Reviewed 2-hop graph follows known sources but not speculative TEACHES edges',()=>{
 const related=expandReviewed(idx,'lesson:L09-1-1',{hops:2});
 assert.ok(related.some(x=>x.id==='lesson:L09-1-2'&&x.hops===2));
 assert.ok(related.some(x=>x.kind==='SourceEdition'&&x.hops===2));
 assert.ok(!related.some(x=>x.id==='concept:ont01:population'));
});
check('No speculative relation promotion through altered edge',()=>{
 const changed=input();
 changed.academicGraph.edges.push({id:'edge:synthetic:prerequisite',predicate:'REQUIRES',from:'concept:ont01:population',to:'concept:ont01:sample',reviewState:'verified',visibility:'public_curated',provenance:changed.academicGraph.edges[0].provenance});
 const x=buildPilotIndex(changed);
 assert.ok(!x.links.some(l=>l.predicate==='REQUIRES'));
});
check('All new (even verified) authored method links are unreviewed and excluded',()=>{
 assert.ok(!idx.links.some(l=>['USES_METHOD','OPTIONAL_METHOD','ASSESSES_METHOD','ASSESSES_OUTCOME'].includes(l.predicate)));
});
check('Cannot expand 3 or more graph hops',()=>mustReject(()=>expandReviewed(idx,'lesson:L09-1-1',{hops:3}),'three-hop traversal'));
check('Search is no-write; input is not app route',()=>{
 const r=resultOne('L09-1-2',{expandHops:1});
 assert.ok(r.results[0].provenance.sourceUrl.includes('notion'));
 assert.ok(r.results[0].whyShown);
 assert.ok(!Object.hasOwn(r.results[0],'navigateTo'));
 assert.equal(r.results[0].readiness.playable,false);
});
check('Reject private nodes before indexing',()=>{
 const changed=input();
 changed.academicGraph.nodes.push({id:'attempt:private:fake',kind:'Attempt',visibility:'private_user'});
 mustReject(()=>buildPilotIndex(changed),'private records');
});
check('Reject duplicate canonical identity conflicting names',()=>{
 const changed=input();
 changed.candidateOutlines.push({...changed.candidateOutlines[0],id:'lesson:L09-1-1',title:'Wrong duplicate identity'});
 mustReject(()=>buildPilotIndex(changed),'duplicate identity');
});
check('Revoked and unsupported sources excluded, never treated as verified',()=>{
 const changed=input();
 changed.candidateOutlines[0].rightsState='revoked';
 const x=buildPilotIndex(changed);
 assert.equal(searchPilot(x,'Pinyin',{includeCandidates:true}).status,'no_match');
 changed.candidateOutlines[1].provenance.sourceUrl='http://invalid.example';
 const y=buildPilotIndex(changed);
 assert.equal(searchPilot(y,'Paraphrase',{includeCandidates:true}).status,'no_match');
});
check('Unsupported locale and type fail closed',()=>{
 mustReject(()=>resultOne('Population',{locale:'zz'}),'invalid locale');
 mustReject(()=>resultOne('Population',{kind:'Attempt'}),'private entity type');
});
check('Overlong user input never returns partial facts',()=>{
 assert.equal(resultOne('x'.repeat(300)).status,'invalid_query');
 assert.equal(resultOne('').status,'invalid_query');
});
check('No-match explains limited pilot rather than asserting global absence',()=>{
 const r=resultOne('not existing intentionally 8877');
 assert.equal(r.status,'no_match');
 assert.match(r.message,/limited pilot/);
});
check('Unknown retrieved corpus has no answer key, email or hidden personal data',()=>{
 const searchData=JSON.stringify([...idx.index.values()]);
 assert.ok(!searchData.includes('answerKey')&&!searchData.includes('privateDiary')&&!searchData.includes('@gmail.com'));
 assert.ok(!searchData.includes('ownerId')&&!searchData.includes('independentSolution'));
});
const mrr=Number((reciprocal/positive).toFixed(4)),recallAt5=Number((at5/positive).toFixed(4)),precisionAt1=Number((top1/positive).toFixed(4));
assert.equal(top1,positive,'All known gold queries must rank 1st in scoped fixture');
assert.equal(at5,positive,'All known gold queries must be in first 5');
const payload={status:'PASS',sourceEntities:idx.index.size,sourceEvidence:idx.evidence.size,verifiedGraphEdges:idx.links.length,
 cases:gold.cases.length,knownQueries:positive,negativeQueries:negatives,precisionAt1,recallAt5,mrr,contractChecks:tests.length,privacy:'NO_USER_DATA',coverage:'DEMO_ONLY',production:'NO_DEPLOY'};
console.log(JSON.stringify(payload,null,2));
