// Focused renderer parity guard for the 17 invited-staging manuscripts.
// Content remains first-party draft; this checks presentation, never publication.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root='tools/step16-real-l09-react-island/src/learning/';
const sample03=read(root+'Wave1Journey.tsx');
const sample09=read(root+'LearningJourney.tsx');
const reader=read(root+'SectionedJourney.tsx');
const editorial=read(root+'EditorialJourney.tsx');
const companion=read(root+'LessonDetailParity.tsx');
const nativeMentor=read('site/assets/lesson-companion-native.js');
const nativeBuddy=read('site/assets/laoly-context-s112.js');
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
assert.doesNotMatch(reader,/function goToPractice\(/,
 'Browsing to Practice must not save a skipped method or block on persistence');
assert.match(reader,/function retryFailedSave\(/,'Unsaved drafts must have an explicit recovery action');
assert.match(reader,/<LessonBookmark id={id} locale={locale}\/>/,'Use the same private bookmark action');
assert.match(reader,/onPrevious={pageIndex>0/,'Previous page works as in samples');
assert.match(reader,/onNext=\{pageIndex<PAGES\.length-1\?\(\)=>setPhase\(PAGES\[pageIndex\+1\]\)/,
 'Next navigates any page whether submitted or reviewed, matching all 3 samples');
assert.match(reader,/phase==='feedback'&&!persisted\.submitted&&/,
 'Unsubmitted feedback is readable as a spoiler-free placeholder');
assert.match(reader,/phase==='progress'&&!persisted\.reviewed&&/,
 'Unreviewed progress is readable as a not-yet-completed placeholder');
assert.match(reader,/function FormattedLessonQuestion\(/,
 'All personal questions use one safely formatted text-field component');
assert.match(reader,/<label htmlFor=\{inputId\}>\{index\+1\}\. \{formatLessonInline\(question\)\}<\/label>/,
 'Actual accessible question label includes bold emphasis instead of raw HTML');
assert.match(reader,/className="li-atom-field li-sectioned-question-field" data-li-atom="field"/,
 'Question textareas reuse the existing design-system field styling');
assert.match(editorial,/export function inline\(/,
 'Reuse the existing safe inline source-markup parser, never HTML injection');
assert.match(reader,/<Markdown md=\{q\}\/>/,
 'Previously submitted questions must keep emphasis in the feedback phase');
assert.doesNotMatch(reader,/className="li-lesson-status"/,'Remove the large redundant sync strip');
assert.match(reader,/<LessonMentor id={id} locale={locale}\/>/,
 'Personal lessons must use the same Lão Lý panel as three samples');
assert.match(companion,/export function LessonMentor\(\{id,locale\}:\{id:string;locale:Locale\}\)/,
 'Shared mentor must support all personal lesson IDs');
assert.match(reader,/registerEditorial\(/,
 'Every personal lesson registers its authored mentor moments into the existing engine');
assert.match(reader,/data-li-editorial-journey=\{id\}/,
 'Expose the current personal lesson to the same contextual engine');
assert.match(reader,/data-li-lesson-submitted=\{persisted\.submitted\?/,
 'Native safety gate must use persisted submission');
assert.match(reader,/data-li-lesson-reviewed=\{persisted\.reviewed\?/,
 'Native safety gate must use persisted review');
assert.match(reader,/li:lesson-phase-changed/,
 'Companion refreshes when visible lesson stage changes');
assert.match(reader,/li:mentor-phase-jump/,
 'Companion navigation returns to a visible React stage');
assert.match(nativeMentor,/editorialRegistry\.get\(id\)/,
 'No second chat context resolver');
assert.match(nativeMentor,/function pendingEditorialWording\(data,stage,locale,submitted\)/,
 'Steps 4/5 have spoiler-free contextual copy even before completion');
assert.match(nativeMentor,/stage:requested,submitted,reviewed/,
 'Active chat stage must stay on Feedback/Progress, not roll back to Practice');
assert.match(nativeMentor,/pending=requested==="reflection"&&!submitted\?"submission"/,
 'Feedback has a distinct pre-submit chat');
assert.match(nativeMentor,/requested==="extension"&&!reviewed\?\(submitted\?"review":"submission"\)/,
 'Progress has distinct unsubmitted and unreviewed chat states');
assert.match(nativeBuddy,/lessonContext\?\.editorial\?null/,
 'No unrelated global quote during authored lesson chat');
assert.match(entry,/root.render\(<SectionedJourney lesson={lesson} ports={ports} preview\/>\)/,
 'Real personal routes must use the shared fixed renderer, not another static preview');
// Step18: stable phase identity and mentor target across locale changes.
assert.ok(reader.includes("data-li-chapter-id={id+':'+phase}"));
assert.ok(reader.includes("const anchor=(role:Role)=>'li-sectioned-'+id+'-chapter-'+role"));
assert.ok(reader.includes("id={index===0?'li-sectioned-'+id+'-chapter-'+role:undefined}"));
assert.ok(reader.includes("id={'li-sectioned-'+id+'-'+x.id}"),'Retain original localized source anchors');
assert.ok(!reader.includes("section(vi,role)[0]"),'Never target VI source IDs while reading EN');
for(const phase of ['practice','feedback','progress']){
 const target="id={'li-sectioned-'+id+'-"+phase+"'}";
 assert.equal(reader.split(target).length-1,phase==='practice'?1:2,
  'Stable anchor in each applicable gated and placeholder branch '+phase);
}
const supplements=JSON.parse(read('content/editorial/lesson-completeness-supplements.v1.json'));
assert.equal(supplements.status,'draft_editorial_supplement_not_release_approval');
assert.deepEqual(Object.keys(supplements.lessons).sort(),[...ids].sort());
assert.match(reader,/preview\?\(supplements\.lessons/,'Personal drafts only');
assert.match(reader,/hint:true,assisted:true/,'A revealed hint must record assistance');
assert.match(reader,/extra&&attempt\.hint&&/,'Hints require reveal');
assert.match(reader,/persisted\.guidedDraft\.trim\(\)\.length>=MIN\?<Text>\{extra\.guidedFeedback\}/,'Supplement feedback requires saved attempt');
assert.match(reader,/<CopyAnalysisPrompt locale=\{locale\} step="practice"/,'Independent practice prompt available');
assert.match(reader,/reference:persisted\.guidedDraft\.trim\(\)\.length>=MIN/,'Guided prompt reference remains gated');
const chapterIds=new Set();
for(const item of drafts){
 const d=JSON.parse(read(item.normalizedPath));
 const supplement=supplements.lessons[d.id];
 for(const loc of ['vi','en']) {
  for(const key of ['hint','guidedFeedback','diagram','relatedReason'])
   assert.ok(supplement[loc][key].trim(),d.id+' '+loc+' '+key);
  assert.ok(JSON.stringify(d.content.localized[loc]).includes(supplement.sourceUrl),
   'Reading reference must be present in manuscript '+d.id+' '+loc);
 }
 assert.ok(/^https:\/\//.test(supplement.sourceUrl),'HTTPS reference');
 assert.ok(supplement.relatedLessonId!==d.id&&
  [...ids,'L03-1-2','L09-1-2','L15-2-2'].includes(supplement.relatedLessonId),'Related accessible lesson '+d.id);
 assert.equal(d.publishState,'draft','Do not publish '+item.id);
 assert.equal(d.rights.releaseAuthorized,false,'Do not bypass rights gate '+item.id);
 // Every authored manuscript has one identity per actual reader phase,
 // not one completion per language or per source subsection.
 for(const phase of pages){
  const chapterId=d.id+':'+phase;
  assert.ok(!chapterIds.has(chapterId),'Duplicate chapter '+chapterId);
  chapterIds.add(chapterId);
 }
 for(const loc of ['vi','en']){
  const sections=d.content.localized[loc].sections;
  assert.ok(sections.every(x=>typeof x.id==='string'&&/^[a-z0-9-]+$/.test(x.id)));
  assert.equal(new Set(sections.map(x=>x.id)).size,sections.length,'Unique source anchors '+d.id+' '+loc);
  for(const role of ['concept','guided'])assert.ok(sections.some(x=>x.role===role),
   'Mentor anchor exists in both locales '+d.id+' '+loc+' '+role);
 }
 const moments=d.content.companion?.structuredMoments||[];
 assert.deepEqual(moments.map(m=>m.stage),
  ['opening','concept','guided','independent','reflection','extension'],
  'All six authored Lão Lý moments present: '+item.id);
 for(const loc of ['vi','en']){
  assert.ok(new Set(moments.map(m=>m[loc]?.prompt)).size>=5,
   'At least five distinct contextual '+loc+' prompts: '+item.id);
  assert.ok(moments.every(m=>m[loc]?.actions?.length===2),
   'Two authored actions in each stage: '+item.id);
 }

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
assert.equal(chapterIds.size,17*5);
console.log('PERSONAL_17_UI_PARITY_PASS: 5 pages, 17 contextual six-stage mentors, spoiler-safe and draft rights intact');
