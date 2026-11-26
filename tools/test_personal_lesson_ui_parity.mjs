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
// Ontology and analogy are part of the reading phase for all active readers.
const understanding=JSON.parse(read('content/editorial/lesson-ontology-analogy.v1.json'));
const canonicalConcepts=JSON.parse(read('content/graph/concepts.json'));
const known=new Map(canonicalConcepts.map(c=>[c.id,c]));
const currentIds=[...ids,'L03-1-2','L09-1-2','L15-2-2'];
assert.deepEqual(Object.keys(understanding.lessons).sort(),currentIds.sort());
assert.equal(understanding.status,'editorial_lesson_projection_not_graph_promotion');
const proposed=new Map();
for(const [id,item] of Object.entries(understanding.lessons)){
 assert.equal(item.sourceRef,id);
 assert.equal(item.reviewState,'proposed');
 assert.equal(item.relation.reviewState,'proposed');
 const conceptIds=new Set(item.concepts.map(c=>c.id));
 assert.equal(conceptIds.size,item.concepts.length);
 assert.ok(conceptIds.has(item.relation.from)&&conceptIds.has(item.relation.to)&&item.relation.from!==item.relation.to);
 assert.ok(['RELATED_TO','CONTRASTS_WITH'].includes(item.relation.predicate));
 for(const c of item.concepts){
  assert.ok(c.vi.trim()&&c.en.trim());
  if(known.has(c.id)){
   const canon=known.get(c.id);
   assert.equal(c.en,canon.title);
   assert.equal(c.vi,canon.aliases.find(x=>x.locale==='vi').text);
  }else{
   assert.match(c.id,/^concept:lesson:[a-z0-9-]+$/);
   if(proposed.has(c.id))assert.deepEqual(c,proposed.get(c.id));
   proposed.set(c.id,c);
  }
 }
 for(const loc of ['vi','en']){
  assert.ok(item.relation.reason[loc].trim(),id+' relation reason');
  assert.ok(item.analogy[loc].example.trim()&&item.analogy[loc].limit.trim(),id+' analogy and limits');
 }
}
for(const src of [sample03,sample09,reader]){
 assert.match(src,/<LessonUnderstanding id=/,'Shared reading element on all reader types');
 const readPhase=src.slice(src.indexOf("{phase==='read'&&"),src.indexOf("{phase==='guided'&&"));
 assert.match(readPhase,/<LessonUnderstanding /,'Ontology and analogy must be inside reading phase');
}
const understandingUi=read(root+'LessonUnderstanding.tsx');
assert.match(understandingUi,/data-li-ontology-relation/);
assert.match(understandingUi,/analogy\.limit/);
assert.match(understandingUi,/not a prerequisite/);
assert.match(understandingUi,/<Disclosure/);
assert.ok(!understandingUi.includes('dangerouslySetInnerHTML'));
const guidedHints=JSON.parse(read('content/editorial/wave1-guided-hints.v1.json'));
assert.deepEqual(Object.keys(guidedHints.lessons).sort(),['L03-1-2','L09-1-2','L15-2-2']);
assert.equal(guidedHints.reviewState,'proposed');
for(const [id,localized] of Object.entries(guidedHints.lessons)){
 const original=JSON.parse(read('content/lessons/'+id+'.json'));
 for(const loc of ['vi','en']){
  const feedback=original.content.localized[loc].guidedHint??original.content.localized[loc].exHelp;
  assert.ok(localized[loc].trim()&&feedback.trim());
  assert.notEqual(localized[loc],feedback,'Separate hint and worked feedback '+id+' '+loc);
 }
}
for(const [src,feedback] of [[sample03,'guidedHint'],[sample09,'exHelp']]){
 const guided=src.slice(src.indexOf("{phase==='guided'&&"),src.indexOf("{phase==='practice'&&"));
 assert.match(guided,/guidedHints\.lessons/);
 assert.ok(guided.includes('!saving&&!locked&&attempt.guidedDraft.trim().length>=12?'));
 assert.ok(guided.includes('reference:!saving&&!locked&&attempt.guidedDraft.trim().length>=12?content.'+feedback+':undefined'));
 assert.ok(!guided.includes('reference:attempt.hint?'));
 assert.ok(guided.indexOf('guidedHints.lessons')<guided.indexOf('content.'+feedback));
}
// First-party reading examples are deliberately separate from independent assessment.
const visualEvidence=JSON.parse(read('content/editorial/lesson-visual-evidence.v1.json'));
assert.equal(visualEvidence.rights,'first_party_illustrations');
assert.equal(visualEvidence.reviewState,'proposed');
assert.deepEqual(Object.keys(visualEvidence.lessons).sort(),[...ids].sort());
const visualUi=read(root+'LessonVisualEvidence.tsx');
assert.match(reader,/<LessonVisualEvidence id=\{id\} locale=\{locale\}/);
assert.match(visualUi,/data-li-lesson-figure/);
assert.match(visualUi,/role="img" aria-label/);
assert.match(visualUi,/View illustrative data/);
assert.match(visualUi,/scope="col"/);
assert.match(visualUi,/not academic approval/);
assert.doesNotMatch(visualUi,/model_answer|dangerouslySetInnerHTML|persist\(/);
const bilingual=x=>assert.ok(x.vi.trim()&&x.en.trim());
for(const [id,f] of Object.entries(visualEvidence.lessons)){
 bilingual(f.title);bilingual(f.caption);
 assert.ok(f.sources.length>0);
 for(const source of f.sources){
  assert.ok(source.title&&/^https:\/\//.test(source.url));
  bilingual(source.scope);bilingual(source.limit);
  assert.ok(['readable','not_checked'].includes(source.access));
  if(source.access==='readable')assert.equal(source.checkedOn,'2026-11-26');
 }
 if(f.kind==='table'){
  f.headers.forEach(bilingual);
  assert.ok(f.rows.length>0&&f.rows.every(row=>row.length===f.headers.length));
 }else if(f.kind==='flow'){
  assert.ok(f.items.length>=2);f.items.forEach(bilingual);
 }else if(f.kind==='bars'){
  assert.equal(f.labels.length,f.values.length);
  f.labels.forEach(bilingual);bilingual(f.unit);
  assert.ok(f.values.every(v=>Number.isFinite(v)&&v>=0&&v<=(f.max??Infinity)));
 }else if(f.kind==='plot'){
  assert.ok(f.x.length>=2&&f.x.every((v,i)=>Number.isFinite(v)&&(i===0||v>f.x[i-1])));
  f.series.forEach(series=>{
   bilingual(series.label);assert.equal(series.values.length,f.x.length);
   assert.ok(series.values.every(v=>v===null||Number.isFinite(v)));
  });
  bilingual(f.unit);bilingual(f.xLabel);
 }else assert.fail('Unknown figure '+id);
}
const fig=visualEvidence.lessons;
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
const spread=a=>Math.max(...a)-Math.min(...a);
assert.deepEqual(fig['L09-1-3'].series.map(s=>avg(s.values)),[5,5]);
assert.deepEqual(fig['L09-1-3'].series.map(s=>spread(s.values)),[4,8]);
const regression=fig['L09-2-3'],x=regression.x,y=regression.series[0].values;
const b=x.reduce((s,v,i)=>s+(v-avg(x))*(y[i]-avg(y)),0)/x.reduce((s,v)=>s+(v-avg(x))**2,0);
assert.ok(Math.abs(b-1.4)<1e-9);
assert.ok(regression.series[1].values.every((v,i)=>Math.abs(v-(avg(y)-b*avg(x)+b*x[i]))<1e-9));
assert.deepEqual(fig['L15-3-1'].series.map(s=>avg(s.values)),[50,50,50]);
assert.deepEqual(fig['L15-3-1'].series.map(s=>spread(s.values)),[4,20,50]);
assert.equal(fig['L15-3-2'].values[1],Math.round(2*Math.sqrt(72)*100)/100);
assert.equal(fig['L03-2-3'].values.reduce((a,b)=>a+b,0),10);
// Each formerly solved guided example now has a distinct application prompt.
const freshGuided=Object.entries(supplements.lessons).filter(([id,x])=>x.vi.guidedPrompt||x.en.guidedPrompt);
assert.deepEqual(freshGuided.map(([id])=>id).sort(),ids.filter(id=>id!=='L09-3-2').sort());
for(const [id,supp] of freshGuided){
 const manuscript=JSON.parse(read('content/editorial/normalized/'+id+'.draft.v1.json'));
 for(const loc of ['vi','en']){
  assert.ok(supp[loc].guidedPrompt.trim()&&supp[loc].guidedFeedback.trim());
  const original=manuscript.content.localized[loc].sections.filter(s=>s.role==='guided').map(s=>s.body_md).join('\n');
  assert.ok(!original.includes(supp[loc].guidedPrompt),'New application must not simply copy the worked example '+id);
  assert.ok(!original.includes(supp[loc].guidedFeedback),'Do not repeat new application solution inside the old example '+id);
 }
}
assert.match(reader,/extra\?\.guidedPrompt&&/);
assert.match(reader,/questions:\[extra\?\.guidedPrompt\|\|/);
assert.match(reader,/keep or revise it for the new question/);
assert.ok(reader.indexOf('<Text>{extra.guidedPrompt}</Text>')<reader.indexOf('value={attempt.guidedDraft}'));
assert.match(reader,/persisted\.guidedDraft\.trim\(\)\.length>=MIN\?<Text>\{extra\.guidedFeedback\}/);
// Editorial clarification must remain behind existing independent reveal.
assert.ok(supplements.lessons['L03-2-1'].vi.answerAddendum.trim());
assert.ok(supplements.lessons['L03-2-1'].en.answerAddendum.trim());
assert.match(reader,/<Markdown md=\{modelAnswer\}\/>\s*\{extra\?\.answerAddendum&&/);
assert.match(reader,/reference:showAnswer&&!conflict\?\[modelAnswer,extra\?\.answerAddendum\]/);
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
