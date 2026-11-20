#!/usr/bin/env node
// One PREPUBLICATION ingestion test; never writes to site/ or the live repository.
// It compiles the actual next bilingual authored lesson in a disposable worktree,
// and reads it through the app's existing read-only content client.
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createContentClient} from '../site/assets/li-content-adapter.mjs';

const sourceRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
// Verify all 17 migrated manuscripts in the existing focused content check.
const draftIndex=JSON.parse(readFileSync(join(sourceRoot,'content/editorial/normalized/index.v1.json'),'utf8'));
assert.equal(draftIndex.entries.length,17);
let methodGated=0;
for(const entry of draftIndex.entries){
 const draft=JSON.parse(readFileSync(join(sourceRoot,entry.normalizedPath),'utf8'));
 assert.equal(draft.publishState,'draft');
 assert.equal(draft.rights.releaseAuthorized,false);
 const source=JSON.parse(readFileSync(join(sourceRoot,entry.sourcePath),'utf8'));
 const mentorMoments=draft.content.companion.structuredMoments;
 assert.equal(mentorMoments.length,6,'Every lesson needs 6 mentor contexts '+entry.id);
 for(const moment of mentorMoments){
  assert.equal(moment.quote_ids.length,3,'Three candidate quotes per moment '+entry.id+' '+moment.stage);
  assert.equal(new Set(moment.quote_ids).size,3,'No duplicate stage quote '+entry.id+' '+moment.stage);
  assert.ok(!moment.quote_ids.includes('box-models'),
   '1987 George Box source cannot be marked public-domain without a separate rights policy: '+entry.id);
 }
 const editorial=source.content.github_editorial_extensions||{};
 for(const [stage,rep] of Object.entries(editorial.mentorQuoteReplacements?.stageReplacements||{})){
  const moment=mentorMoments.find(m=>m.stage===stage);
  assert.ok(moment&&moment.quote_ids.includes(rep.withId)&&!moment.quote_ids.includes(rep.replaceId),
   'GitHub mentor rights override not reflected in derived draft '+entry.id+' '+stage);
 }
 if(entry.id==='L15-2-3'){
  const fix=editorial.academicReferenceCorrections?.replacements?.[0];
  assert.ok(fix?.to.includes('/shipment_stop_dtail.htm')&&fix?.from.includes('/agent_variables.htm'),
   'Academic source correction not recorded in GitHub source');
  for(const loc of ['vi','en']){
   assert.ok(draft.content.localized[loc].intro_md.includes(fix.to));
   assert.ok(!draft.content.localized[loc].intro_md.includes(fix.from));
  }
 }

 for(const loc of ['vi','en']){
  const c=draft.content.localized[loc],m=c.sections.find(s=>s.role==='methods');
  assert.ok(m&&c.sections.some(s=>s.role==='guided'),'Missing method/guided sections '+entry.id+' '+loc);
  assert.doesNotMatch(m.body_md,/<b>(?:Phản hồi|Đối chiếu sau|Feedback|After-attempt feedback|EDITORIAL GUIDED FEEDBACK|Chỉ hiện phản hồi)/i,'Early method feedback '+entry.id+' '+loc);
  for(const g of c.sections.filter(s=>s.role==='guided'))
   assert.doesNotMatch(g.body_md,/<b>(?:ĐÁP ÁN SAU LƯỢT LUYỆN|FEEDBACK AFTER GUIDED ATTEMPT)/i,'Early guided answer '+entry.id+' '+loc);
  assert.ok(m.feedback_md?.trim()&&m.feedback_gate==='AFTER_MEANINGFUL_METHOD_ATTEMPT','Missing gated method feedback '+entry.id+' '+loc);
  methodGated++;
  if(entry.id==='L09-3-2'){
   const source=JSON.parse(readFileSync(join(sourceRoot,entry.sourcePath),'utf8'));
   const addition=source.content.github_editorial_extensions?.methodMicropractice?.localized?.[loc];
   assert.ok(addition?.prompt_md?.trim()&&addition?.feedback_md?.trim(),'Missing canonical GitHub authored T06 micropractice');
   assert.ok(m.body_md.endsWith(addition.prompt_md),'Source-to-draft prompt mismatch '+loc);
   assert.equal(m.feedback_md,addition.feedback_md,'Source-to-draft feedback mismatch '+loc);
   assert.match(addition.prompt_md,/300/);
   assert.doesNotMatch(m.body_md,/precision=24\/(24\+6)|recall=24\/(24\+36)/i,'T06 method answer leaked before saved attempt');
  }
 }
}
assert.equal(methodGated,34);
console.log('LI_BATCH_17_METHOD_GATE_PASS: 17 bilingual pairs gated; all remain draft');
const temp=mkdtempSync(join(tmpdir(),'li-content-onboarding-'));
const load=path=>JSON.parse(readFileSync(join(temp,path),'utf8'));
const save=(path,data)=>writeFileSync(join(temp,path),JSON.stringify(data,null,2)+'\n');
const copy=path=>{
 const destination=join(temp,path);
 mkdirSync(dirname(destination),{recursive:true});
 cpSync(join(sourceRoot,path),destination,{recursive:true});
};
try{
 for(const path of ['content','docs/ontology/registry.v0.1.json',
  'docs/ontology/academic/registry.v0.1.json',
  'site/assets/lesson-wave1-core.js','site/assets/lesson-l09-hifi.js',
  'site/assets/laoly-quotes-s121.js','site/lessons/companion/L09-1-1.json',
  'tools/build_content_packs.mjs'])copy(path);
 const original=load('content/editorial/L09-1-1.lesson.v1.json');
 assert.equal(original.id,'L09-1-1');
 assert.equal(original.publishState,'draft');
 assert.equal(original.reviewState,'verified');
 assert.equal(original.editorialStatus,'reviewed');
 // S148 publication-rights gate: authored figures and bilingual glosses are
 // first-party, only short original excerpts are quoted from verified works.
 const rights=original.rights;
 assert.equal(rights.text,'first_party');
 assert.equal(rights.illustration,'first_party_original_svg');
 assert.equal(rights.quotations.policy,'public_domain_original_short_excerpt_with_first_party_gloss');
 assert.equal(rights.quotations.externalAcademicSources,
  'reference_only_no_reproduced_licensed_figures');
 assert.equal(rights.quotations.professionalLegalSignoff,'not_claimed');
 const artwork=readFileSync(join(sourceRoot,'content/editorial/assets/L09-1-1-population-sample.svg'),'utf8');
 assert.match(artwork,/<svg[\s>]/);
 assert.doesNotMatch(artwork,/<image\b|<foreignObject\b|(?:href|src)=[\"']https?:\/\//i,
  'First-party diagram must contain no external visual content');
 const bankSource=readFileSync(join(sourceRoot,'site/assets/laoly-quotes-s121.js'),'utf8');
 const bankLine=bankSource.split('\n').find(line=>line.startsWith('const QUOTES='));
 assert.ok(bankLine,'Canonical S121 quote list missing');
 const quotes=JSON.parse(bankLine.slice('const QUOTES='.length).replace(/;\s*$/,''));
 const byId=new Map(quotes.map(quote=>[quote.id,quote]));
 const used=new Set();
 for(const loc of ['vi','en']){
  const c=original.content.localized[loc];
  assert.match(c.hook.md,/90%/);
  assert.equal(c.companion.moments.length,6);
  assert.equal(c.extension.recallQuestions.length,3);
  const independent=c.independent;
  assert.equal(independent.model_answer_gate,'AFTER_VALID_INDEPENDENT_SUBMISSION');
  assert.equal(c.reflection.gate,'AFTER_VALID_INDEPENDENT_SUBMISSION');
  const before=[
   c.hook.md,c.goals.md,c.concept.md,c.variable_types.md,
   c.guided.md,c.guided.hint_md,c.technique_applications.T06.prompt_md,
   c.technique_applications.T07.prompt_md,independent.prompt_md,
   ...c.companion.moments.filter(m=>!['reflection','extension'].includes(m.stage))
     .flatMap(m=>[m.prompt_md,m.quote_relevance_md,...m.actions.map(a=>a.reply_md)])
  ].join('\n');
  assert.doesNotMatch(before,/256\s*\/\s*320|80\s*%/i,'Independent model solution leaked before submission');
  for(const moment of c.companion.moments){
   assert.equal(moment.quote_ids[0],moment.quote_id);
   assert.equal(moment.quote_ids.length,3);
   assert.equal(moment.actions.length,2);
   for(const id of moment.quote_ids){
    used.add(id);
    const q=byId.get(id);
    assert.ok(q&&q.original&&q.meta&&q.url?.startsWith('https://'),
     'Missing original/source provenance for '+id);
   }
  }
  assert.deepEqual(c.technique_applications.T06.answer_key,
   {A:'nominal',B:'discrete',C:'ordinal',D:'continuous'});
 }
 assert.deepEqual([...used].sort(),[...rights.quotations.quoteIds].sort(),
  'Rights review scope must exactly cover every primary/alternate stage quote');
 assert.equal(original.practice.minimumCharactersPerAnswer,12);
 assert.equal(original.sources.some(s=>s.url==='https://rcompanion.org/handbook/E_01.html'),true);
 for(const loc of ['vi','en']){
  const md=original.content.localized[loc].reflection.md;
  const table=md.split(/\r?\n/).filter(line=>line.trim().startsWith('|')).slice(2);
  assert.equal(table.length,4,'VI/EN rubric must have 4 scored criteria: '+loc);
 }
 assert.equal(original.content.format,'editorial-structured-v1');
 const fixture=structuredClone(original);
 // This is a test-only promotion in /tmp, NOT content/lessons in the real repo.
 fixture.publishState='review_only';
 fixture.reviewState='verified';
 fixture.editorialStatus='reviewed';
 save('content/lessons/L09-1-1.json',fixture);
 const concepts=load('content/graph/concepts.json');
 const edges=load('content/graph/edges.json');
 const labels=[
  ['concept:wave2:population-and-sample','Population and sample','Tổng thể và mẫu'],
  ['concept:wave2:variable-types','Statistical variable types','Các loại biến thống kê']
 ];
 for(const [id,title,vi] of labels){
  const provenance={sourceUrl:original.provenance.sourceUrl,
   sourceSection:'L09-1-1 authored concept taxonomy (test-only, proposed)',
   evidenceType:'editorial',checkedOn:'2026-11-20'};
  concepts.push({id,kind:'Concept',title,version:'0.1.0',reviewState:'proposed',
   publishState:'draft',visibility:'public_curated',rightsState:'first_party',
   aliases:[{locale:'vi',text:vi}],provenance,note:'Test-only concept, never a release decision'});
  edges.push({id:'edge:probe:'+id.replaceAll(':','-'),predicate:'TEACHES',
   from:'lesson:L09-1-1',to:id,reviewState:'proposed',
   visibility:'public_curated',provenance});
 }
 save('content/graph/concepts.json',concepts);
 save('content/graph/edges.json',edges);
 const run=spawnSync(process.execPath,['tools/build_content_packs.mjs'],{
  cwd:temp,encoding:'utf8',timeout:20000
 });
 assert.equal(run.status,0,'isolated canonical pack build failed: '+run.stdout+' '+run.stderr);
 const manifest=load('site/content-packs/manifest.json');
 assert.ok(manifest.courses.find(c=>c.id==='C09-1')?.lessonIds.includes('L09-1-1'));
 const catalog=load('site/content-packs/course-catalog.json');
 const outline=catalog.lessons.find(l=>l.id==='L09-1-1');
 assert.equal(outline.contentState,'review_only');
 assert.equal(outline.navigationPublished,false,'test must not flip native route availability');
 const search=load('site/content-packs/search.json');
 assert.ok(search.documents.some(d=>d.id==='lesson:L09-1-1'));
 const client=createContentClient({
  baseUrl:'https://li.test/isolated/',
  fetcher:async url=>{
   const rel=url.replace('https://li.test/isolated/','');
   try{return {ok:true,json:async()=>load('site/content-packs/'+rel)};}
   catch{return {ok:false,status:404};}
  }
 });
 const loaded=await client.getLesson('L09-1-1');
 assert.equal(loaded.id,'L09-1-1');
 assert.equal(loaded.hierarchy.course.id,'course:C09-1');
 for(const locale of ['vi','en']){
  const c=loaded.content.localized[locale],same=original.content.localized[locale];
  assert.deepEqual(c,same,'VI/EN teaching sections changed in pack');
  assert.match(c.independent.prompt_md,/256/);
  assert.equal(c.independent.model_answer_gate,'AFTER_VALID_INDEPENDENT_SUBMISSION');
  assert.equal(c.technique_applications.T06.feedback_gate,'AFTER_T06_MEANINGFUL_ATTEMPT');
  assert.equal(c.technique_applications.T07.feedback_gate,'AFTER_T07_MEANINGFUL_ATTEMPT');
 }
 const live=JSON.parse(readFileSync(join(sourceRoot,'site/content-packs/manifest.json'),'utf8'));
 assert.ok(!live.courses.some(c=>c.lessonIds.includes('L09-1-1')),
  'Never write draft to deployed manifest');
 console.log('LI_NEW_LESSON_INGESTION_PASS: existing compiler → manifest/catalog/index → getLesson VI/EN (isolated); React route NOT YET INTEGRATED');
}finally{
 rmSync(temp,{recursive:true,force:true});
}
