/* Focused parity guard: approved Wave1 Hi-Fi source > migrated React details.
 * Checks that migrating rendering did not silently drop the original seven
 * content areas, citations, images, bookmark, Lao Ly or read-only tools. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const legacyById={
 'L09-1-2':get('site/assets/lesson-l09-hifi-markup.js'),
 'L03-1-2':get('site/assets/lesson-l03-hifi-markup.js'),
 'L15-2-2':get('site/assets/lesson-l15-hifi-markup.js')
};
const react09=get('tools/step16-real-l09-react-island/src/learning/LearningJourney.tsx');
const reactWave=get('tools/step16-real-l09-react-island/src/learning/Wave1Journey.tsx');
const component=get('tools/step16-real-l09-react-island/src/learning/LessonDetailParity.tsx');
const companion=get('site/assets/lesson-companion-native.js');
const related=get('tools/step16-real-l09-react-island/src/learning/RelatedLessons.tsx');
const nativeRelated=get('site/assets/lesson-related-wave1.js');
for(const [id,legacy] of Object.entries(legacyById)){
 const c=JSON.parse(get('content/lessons/'+id+'.json'));
 assert.equal(c.publishState,'review_only');
 assert.equal(c.reviewState,'approved');
 assert.equal(c.rights.text,'first_party');
 assert.equal(c.sources.length,4,'Four approved source references: '+id);
 for(const locale of ['vi','en']){
  const t=c.content.localized[locale];
  assert.equal((t.sidebarLinks||t.navLabels).length,7,'Seven original sections: '+id+' '+locale);
  for(const field of [
   'goals','sourcesTitle','sourcesLead','sourceNote','queriesTitle','openSource','allPrompt',
   'openChat','guidedLabel','challengeTitle','rubricTitle','scoreLabel','clear','reset'
  ]){
   const value=t[field]??(field==='reset'?t.resetConfirm:null);
   assert.ok(value!==undefined&&value!==null,'Approved lesson missing '+id+' '+locale+' '+field);
  }
 }
 const react=id==='L09-1-2'?react09:reactWave;
 for(const name of ['LessonBookmark','LessonMentor','LessonSectionIndex','LessonSources','RelatedLessons']){
  assert.ok(react.includes('<'+name),'React '+id+' dropped '+name);
 }
 assert.ok(react.includes('content.clear'),'Draft clear button lost: '+id);
 assert.ok(react.includes('submission'),'Submitted work must remain accessible: '+id);
 for(const panel of ['goals','concept','guided','challenge','rubric','sources']){
  assert.ok(legacy.includes(panel),'Old UI section missing, revisit parity checklist: '+id+' '+panel);
 }
}
assert.ok(react09.includes('<L09Figures'),'L09 had TWO illustrations; React must display them.');
assert.ok(react09.includes("['1.000','82%','?']"),'L09 example stats missing');
assert.ok(react09.includes('content.answerCaution'),'L09 academic caution must be retained.');
assert.ok(react09.includes('content.rubricLead'),'L09 self-scoring limitations missing.');
assert.ok(react09.includes('content.guidedSaveNote'),'L09 guided draft persistence disclosure missing.');
assert.ok(react09.includes('li-learning-language'),'L09 VI/EN switch missing.');
assert.ok(reactWave.includes('<LessonFigure'),'L03/L15 source image and fallback missing.');
assert.ok(component.includes('Simple_random_sampling.PNG'));
assert.ok(component.includes('Statistical_bias_and_statistical_noise_illustration_No_text_in_image.png'));
assert.ok(component.includes('Dan Kernler · CC BY-SA 4.0'));
assert.ok(component.includes('Tim Isaksson · CC BY-SA 4.0'));
assert.ok(component.includes('app.liBookmarks.toggle'),'Must reuse canonical private bookmark owner');
assert.ok(component.includes('onClick={event=>app.openLaoLy?.(event.currentTarget)}'),
 'Lao Ly must open directly from the current React lesson button.');
assert.ok(!component.includes('data-buddy="1"'),'No delegated Lao Ly button in React lessons.');
assert.ok(component.includes('li:lesson-phase-changed'),'Lao Ly must follow actual React phase.');
assert.ok(component.includes('index===5&&!submitted'),'Index must not reveal rubric before submission.');
assert.ok(companion.includes('reactLesson(item.data.lesson_id)'),'Native Lao Ly must observe all 3 current React lessons.');
assert.ok(companion.includes('window.liLessonCompanion='),'Existing Lão Lý context owner must remain.');
assert.ok(component.includes('onSearch(query)'),'Deep search entry points must remain.');
assert.ok(component.includes('copyText(buildPrompt('),'Per-source prompt must be copyable.');
assert.match(related,/getRelatedLessons\(id\)/);
assert.match(related,/client\.graph\(\)/);
assert.match(related,/x\.predicate==='RELATED_TO'/);
assert.match(related,/x\.reviewState==='verified'/);
assert.match(related,/allowedUrl\(x\.provenance\?\.sourceUrl\)/);
assert.match(related,/const routes=new Map\(releasedLessonRoutes\.map/);
assert.match(related,/li-related-source/);
assert.match(nativeRelated,/location\.hostname==="sali5610\.github\.io"/);
assert.match(nativeRelated,/location\.pathname\.startsWith\("\/li\/"\)\)return;/);
console.log('LI_LESSON_PARITY_PASS L03/L09/L15: all 7 authored sections, source/figure credits, mentor, bookmark, reset, locale and feedback gates');
