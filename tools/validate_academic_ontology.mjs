#!/usr/bin/env node
/** ONT-03A: academic registry overlay on ONT-01; no DB or app side effects. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=(p)=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const base=load('docs/ontology/registry.v0.1.json');
const extension=load('docs/ontology/academic/registry.v0.1.json');
const fixture=load('docs/ontology/academic/demo.graph.v0.1.json');
const schema=load('docs/ontology/academic/academic.schema.json');
const kindList=[...base.nodeKinds,...extension.additionalKinds],relList=[...base.predicates,...extension.relations];
const kinds=new Map(kindList.map(k=>[k.name,k]));
const rels=new Map(relList.map(r=>[r.name,r]));
const idPattern=new RegExp(base.idPolicy.pattern);
const STATES=base.enums.reviewState;
const SOURCE_TYPES=base.enums.evidenceType;
const normalized=s=>s.normalize('NFD').replace(/\p{M}/gu,'').trim().toLowerCase().replace(/\s+/g,' ');
function ok(cond,msg){if(!cond)throw new Error(msg);}
function unique(arr,msg){ok(new Set(arr).size===arr.length,'Duplicate '+msg);}
function source(p,ctx){
  ok(p && /^https:\/\//.test(p.sourceUrl||''),ctx+' source URL');
  ok(typeof p.sourceSection==='string' && p.sourceSection.trim(),ctx+' source section');
  ok(SOURCE_TYPES.includes(p.evidenceType),ctx+' evidence type');
  ok(/^\d{4}-\d\d-\d\d$/.test(p.checkedOn||''),ctx+' check date');
}
function cycle(edges,predicate) {
 const adj=new Map();
 for(const e of edges.filter(e=>e.predicate===predicate))adj.set(e.from,[...(adj.get(e.from)||[]),e.to]);
 const done=new Set(),open=new Set();
 const walk=id=>{
  if(open.has(id))return true;
  if(done.has(id))return false;
  open.add(id);
  for(const child of adj.get(id)||[])if(walk(child))return true;
  open.delete(id);done.add(id);return false;
 };
 return [...adj.keys()].some(walk);
}
export function validate(g) {
 ok(extension.baseContractVersion===base.schemaVersion && g.baseContractVersion===base.schemaVersion,'ONT-01 base version drift');
 ok(g.schemaVersion===extension.schemaVersion,'ONT-03A version mismatch');
 ok(g.demoOnly===true && schema.properties.demoOnly.const===true,'Demo-only scope contract');
 ok(g.coverage.fieldCountInProduct===15 && g.coverage.sampleFields.join('|')==='F03|F09|F15','Pilot field coverage mismatch');
 ok(g.coverage.programmeCoverage==='NOT_ASSESSED' && g.coverage.courseRegistryCoverage==='NOT_ASSESSED' && g.coverage.independentAcademicReview==='OPEN' && g.coverage.lessonRelease==='NOT_AUTHORIZED','False curriculum completion claim');
 ok(kinds.size===kindList.length && rels.size===relList.length,'Extension silently overrides base vocabulary');
 unique(g.nodes.map(n=>n.id),'node ID');unique(g.edges.map(e=>e.id),'edge ID');
 const nodes=new Map(g.nodes.map(n=>[n.id,n]));
 const aliases=new Map(),used=new Set(),triples=new Set(),symmetric=new Set();
 for(const n of g.nodes){
  ok(idPattern.test(n.id),'Bad node ID '+n.id);
  ok(kinds.has(n.kind),'Bad node kind '+n.id);
  ok(n.visibility==='public_curated','Learner-private node leaked: '+n.id);
  ok(n.version.match(/^\d+\.\d+\.\d+$/),'Bad version '+n.id);
  ok(STATES.includes(n.reviewState),'Bad review state '+n.id);
  ok(base.enums.publishState.includes(n.publishState),'Bad publish state '+n.id);
  ok(base.enums.rightsState.includes(n.rightsState),'Bad rights state '+n.id);
  if(n.publishState==='published')ok(n.reviewState==='approved','Draft published without approval '+n.id);
  if(['approved','verified'].includes(n.reviewState))ok(n.provenance.evidenceType!=='synthetic_fixture','Unreviewed evidence promoted '+n.id);
  source(n.provenance,n.id);
  ok(typeof n.title==='string' && n.title.trim(),'Missing title '+n.id);
  ok(n.attributes && typeof n.attributes==='object' && !Array.isArray(n.attributes),'Attributes missing '+n.id);
  for(const required of kinds.get(n.kind).requiredAttributes||[])ok(Object.hasOwn(n.attributes,required) && n.attributes[required]!==undefined,'Required academic metadata '+required+' in '+n.id);
  if(n.kind==='Concept')ok(typeof n.attributes.senseDefinition==='string' && n.attributes.senseDefinition.trim() && typeof n.attributes.senseBoundary==='string' && n.attributes.senseBoundary.trim(),'Concept sense or boundary missing '+n.id);
  if(n.kind==='SourceProgramme')ok(n.attributes.scopeStatus!=='confirmed_programme','A one-record pilot cannot claim verified full programme '+n.id);
  if(n.kind==='ProgrammeRequirement')ok(n.attributes.coverageStatus!=='verified_complete','Single sample requirement cannot close CUR-02 '+n.id);
  if(n.kind==='Lesson')ok(n.attributes.canonicalLessonKey && n.id==='lesson:'+n.attributes.canonicalLessonKey,'Canonical lesson identity drift '+n.id);
  if(n.kind==='SourceCourse')ok(!n.id.startsWith('course:'),'Source course masquerades as li. Course '+n.id);
  if(n.kind==='SourceClaim')ok(n.attributes.claimScope==='manuscript_contains','SourceClaim must not pretend academic peer review '+n.id);
  for(const alias of [{locale:'en',text:n.title},...(n.aliases||[])]){
   ok(['vi','en'].includes(alias.locale) && typeof alias.text==='string' && alias.text.trim(),'Invalid alias '+n.id);
   const key=n.kind+'|'+alias.locale+'|'+normalized(alias.text);
   ok(!aliases.has(key) || aliases.get(key)===n.id,'Same-kind VI/EN alias collision '+key);
   aliases.set(key,n.id);
  }
 }
 for(const r of relList){
  for(const k of [...r.from,...r.to])ok(kinds.has(k),'Undefined endpoint kind '+r.name+': '+k);
 }
 for(const e of g.edges){
  ok(idPattern.test(e.id),'Bad edge ID '+e.id);
  const a=nodes.get(e.from),b=nodes.get(e.to);
  ok(a && b,'Dangling relation '+e.id);
  ok(e.from!==e.to,'Self link '+e.id);
  ok(e.visibility==='public_curated','Private edge in public fixture '+e.id);
  ok(STATES.includes(e.reviewState),'Bad relation review state '+e.id);
  source(e.provenance,e.id);
  const p=rels.get(e.predicate);
  ok(p && p.from.includes(a.kind) && p.to.includes(b.kind),'Invalid typed endpoints '+e.id+' '+a.kind+' -> '+b.kind);
  if(e.predicate==='PART_OF')ok(base.specificEndpointRules.PART_OF.some(([x,y])=>x===a.kind && y===b.kind),'PART_OF invalid taxonomy '+e.id);
  if(['REQUIRES','FORMAL_PREREQUISITE','SAME_CROSSLIST'].includes(e.predicate))ok(['verified','approved'].includes(e.reviewState) && a.reviewState!=='proposed' && b.reviewState!=='proposed','Unverified prerequisite or crosslist '+e.id);
  if(['approved','verified'].includes(e.reviewState))ok(a.reviewState!=='proposed' && b.reviewState!=='proposed','Promoted relation to unapproved node '+e.id);
  if(['approved','verified'].includes(e.reviewState))ok(e.provenance.evidenceType!=='synthetic_fixture','Synthetic edge promoted '+e.id);
  const t=e.predicate+'|'+e.from+'|'+e.to;
  ok(!triples.has(t),'Duplicate triple '+t);triples.add(t);
  if(p.symmetric){const s=e.predicate+'|'+[e.from,e.to].sort().join('|');ok(!symmetric.has(s),'Symmetric duplicate '+s);symmetric.add(s);}
  if(e.predicate==='INFORMS_COURSE')ok(e.reviewState!=='approved','Source course cannot grant automatic li. Course equivalence '+e.id);
  used.add(e.from);used.add(e.to);
 }
 for(const type of extension.guard.detectCycles)ok(!cycle(g.edges,type),'Graph cycle '+type);
 for(const n of g.nodes)ok(used.has(n.id),'Orphan graph node '+n.id);
 const sourceCourses=g.nodes.filter(n=>n.kind==='SourceCourse'),liCourses=g.nodes.filter(n=>n.kind==='Course');
 ok(sourceCourses.every(n=>n.id.startsWith('source-course:')),'Institutional source-course ID namespace incorrect');
 ok(liCourses.every(n=>n.id.startsWith('course:')),'li. Course ID namespace incorrect');
 return {nodes:g.nodes.length,edges:g.edges.length,addedKinds:extension.additionalKinds.length,addedRelations:extension.relations.length,fields:g.coverage.sampleFields.length};
}
function clone(x){return JSON.parse(JSON.stringify(x));}
function negatives(original){
 let n=0;
 const reject=(name,fn)=>{let x=clone(original),failed=false;fn(x);try{validate(x)}catch{failed=true}assert.ok(failed,'Negative fixture did not reject: '+name);n++;};
 reject('dangling source reference',x=>x.edges[0].to='field:F99');
 reject('duplicate concept identity',x=>x.nodes.push({...x.nodes[7]}));
 reject('VI alias collision',x=>{x.nodes.find(n=>n.id==='concept:ont01:sample').aliases.push({locale:'en',text:'Population'});});
 reject('concept missing sense boundary',x=>{delete x.nodes.find(n=>n.kind==='Concept').attributes.senseBoundary;});
 reject('invalid source-course/lesson endpoint',x=>{x.edges[0].predicate='CATALOGUED_IN';});
 reject('source course fake li. namespace',x=>{x.nodes.find(n=>n.kind==='SourceCourse').id='course:DATA-8';});
 reject('programme falsely complete',x=>{x.nodes.find(n=>n.kind==='SourceProgramme').attributes.scopeStatus='confirmed_programme';});
 reject('curated draft falsely published',x=>{x.nodes.find(n=>n.id==='lesson:L03-2-1').publishState='published';});
 reject('private learner data leaked',x=>{x.nodes[0].visibility='private_user';});
 reject('unreviewed formal prerequisite',x=>{const a=x.nodes.find(n=>n.kind==='SourceCourse');x.nodes.push({...a,id:'source-course:uc-berkeley:ba-ds:2026-27:DATA-99',title:'Synthetic DATA 99',reviewState:'proposed'});x.edges.push({...x.edges[0],id:'edge:test:formal',predicate:'FORMAL_PREREQUISITE',from:a.id,to:'source-course:uc-berkeley:ba-ds:2026-27:DATA-99',reviewState:'proposed'});});
 reject('candidate relation promoted to verified',x=>{x.edges.find(e=>e.id==='edge:ont03a:teaches:population').reviewState='verified';});
 reject('cycle in recommendation',x=>{const a=x.edges[0],from='lesson:L09-1-1',to='lesson:L03-2-1';x.edges.push({...a,id:'edge:test:rec-1',predicate:'RECOMMENDED_BEFORE',from,to,reviewState:'proposed'});x.edges.push({...a,id:'edge:test:rec-2',predicate:'RECOMMENDED_BEFORE',from:to,to:from,reviewState:'proposed'});});
 reject('symmetric reverse collision',x=>{const a=x.edges.find(e=>e.predicate==='CONTRASTS_WITH');x.edges.push({...a,id:'edge:test:reverse',from:a.to,to:a.from});});
 reject('orphan evidence node',x=>{x.edges=x.edges.filter(e=>e.from!=='source:editorial:L09-1-1:notion'&&e.to!=='source:editorial:L09-1-1:notion');});
 reject('CUR full-coverage false claim',x=>{x.coverage.programmeCoverage='VERIFIED_ALL_15';});
 reject('SourceClaim peer review inflation',x=>{x.nodes.find(n=>n.kind==='SourceClaim').attributes.claimScope='peer_reviewed_study';});
 return n;
}
if(process.argv.includes('--check')||process.argv.length===2){
 const good=validate(fixture),bad=negatives(fixture);
 console.log(JSON.stringify({status:'PASS',...good,negativeCases:bad,coverage:'3 of 15 sample fields only',release:'NONE',database:'NOT TOUCHED'}));
}else{throw Error('Usage: node tools/validate_academic_ontology.mjs --check')}
