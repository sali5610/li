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
  'tools/build_content_packs.mjs'])copy(path);
 const original=load('content/editorial/L09-1-1.lesson.v1.json');
 assert.equal(original.id,'L09-1-1');
 assert.equal(original.publishState,'draft');
 assert.equal(original.reviewState,'proposed');
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
