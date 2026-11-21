// Focused renderer parity guard for the 17 invited-staging manuscripts.
// Content remains first-party draft; this checks presentation, never publication.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root='tools/step16-real-l09-react-island/src/learning/';
const sample03=read(root+'Wave1Journey.tsx');
const sample09=read(root+'LearningJourney.tsx');
const reader=read(root+'SectionedJourney.tsx');
const entry=read(root+'staging-draft-preview.tsx');
const ids=read(root+'personal-study-ids.ts').match(/'L\d+-\d+-\d+'/g)?.map(x=>x.slice(1,-1))??[];
const drafts=JSON.parse(read('content/editorial/normalized/index.v1.json')).entries;
const pages=['read','guided','practice','feedback','progress'];
assert.equal(ids.length,17,'Exactly 17 invited personal lessons');
assert.deepEqual([...ids].sort(),drafts.map(x=>x.id).sort(),'Personal routes match all draft manuscripts');
const five=pages.map(x=>"'"+x+"'").join(',');
for(const src of [sample03,sample09,reader]){
 assert.ok(src.includes('['+five+']'),'Shared five-page progression must match the 3 approved samples');
 assert.match(src,/<StudyBookFolio/,'Use one canonical book folio');
 assert.match(src,/li-learning-save/,'Use the compact shared progress strip');
}
assert.doesNotMatch(reader,/phase==='methods'|setPhase\('methods'\)/,'Optional methods must not insert a sixth page');
assert.match(reader,/className="li-sectioned-method-content"/,'Preserve optional method exercise in Guided');
assert.match(reader,/savedMethod\?\.submittedAt/,'Method feedback must remain gated by a saved attempt');
assert.match(reader,/function goToPractice\(/,'Skipping methods must still reach independent practice');
assert.match(reader,/function retryFailedSave\(/,'Unsaved drafts must have an explicit recovery action');
assert.match(reader,/<LessonBookmark id={id} locale={locale}\/>/,'Use the same private bookmark action');
assert.match(reader,/onPrevious={pageIndex>0/,'Previous page works as in samples');
assert.match(reader,/phase==='guided'\?\(\)=>void goToPractice\(\)/,'Folio Next follows the guided flow');
assert.doesNotMatch(reader,/className="li-lesson-status"/,'Remove the large redundant sync strip');
assert.equal((reader.match(/\{mentor\(/g)||[]).length,1,
 'Personal reader must render one contextual Lao Ly companion, not six scattered buttons');
assert.match(reader,/className="li-lesson-companion"/,
 'Personal companion shares the exemplar panel style');
assert.match(reader,/LÃO LÝ ĐỌC CÙNG NGƯƠI/,
 'Keep the approved Lao Ly companion heading');
assert.match(reader,/phase==='feedback'\?'reflection':'extension'/,
 'Companion context follows the active page, never a different lesson stage');
assert.match(reader,/li:buddy-open/,
 'Retain the verified source-backed Lao Ly dialogue action');
assert.match(entry,/root.render\(<SectionedJourney lesson={lesson} ports={ports} preview\/>\)/,
 'Real personal routes must use the shared fixed renderer, not another static preview');
for(const item of drafts){
 const d=JSON.parse(read(item.normalizedPath));
 assert.equal(d.publishState,'draft','Do not publish '+item.id);
 assert.equal(d.rights.releaseAuthorized,false,'Do not bypass rights gate '+item.id);
 for(const loc of ['vi','en']){
  const roles=d.content.localized[loc].sections.map(x=>x.role);
  for(const role of ['guided','methods','independent','reflection']){
   assert.ok(roles.includes(role),'Preserve '+role+' content for '+item.id+' '+loc);
  }
  const independent=d.content.localized[loc].sections.find(x=>x.role==='independent');
  assert.equal(independent.model_answer_gate,'AFTER_VALID_INDEPENDENT_SUBMISSION');
  assert.equal(d.content.localized[loc].assessment.questions.length,4);
 }
}
console.log('PERSONAL_17_UI_PARITY_PASS: 5-page reader, gated optional method, save/bookmark controls, 17 draft rights intact');
