"use strict";
/* Focused contract: reviewed L2 definitions, existing real practice routes,
   optional candidate mapping and canonical Wave1 IDs; no invented approvals. */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const mapping=JSON.parse(read("site/assets/lesson-spell-suggestions.v0.1.json"));
const catalog=JSON.parse(read("docs/ontology/pedagogy/techniques.v0.2.json"));
const spell=read("site/assets/spell-practice.js");
const html=read("site/index.html");
const react=read("tools/step16-real-l09-react-island/src/learning/LearningJourney.tsx");
const native=read("site/assets/lesson-spell-suggestions.js");
assert.equal(mapping.evidenceStatus,"task_matched_editorial_candidates_not_reviewed_method_fit");
assert.deepEqual(Object.keys(mapping.lessons).sort(),["L03-1-2","L09-1-2","L15-2-2"]);
const methodsMatch=html.match(/const methods=(\[\[[\s\S]*?\]\]);\s*const categories=/);
assert(methodsMatch,"Existing spell display catalog must be readable");
const displayed=JSON.parse(methodsMatch[1]);
for(const [lessonId,items] of Object.entries(mapping.lessons)){
 const lesson=JSON.parse(read("content/lessons/"+lessonId+".json"));
 assert.equal(lesson.id,lessonId);
 assert.equal(lesson.methodFit.status,"not_reviewed","No made-up approved method fit");
 assert.equal(items.length,2,"One featured, one optional: no noisy catalog");
 for(const x of items){
  const definition=catalog.entries.find(t=>t.id===x.techniqueId);
  const live=displayed.find(t=>t[0]===x.shortId);
  assert(definition&&live,"No invented spell "+x.techniqueId);
  assert.equal(definition.reviewState,"verified");
  assert.equal(x.techniqueId,"L2-"+x.shortId);
  assert.equal(x.name.vi,live[1],"Spell name must match the app");
  assert.match(spell,new RegExp(x.shortId+"\\s*:\\s*\\{"),
   "The suggested technique must have a working practice");
  for(const locale of ["vi","en"]){
   assert(x.name[locale]&&x.why[locale],"No empty rationale");
  }
 }
}
assert(html.includes('lesson-spell-suggestions.js'),"Native pages must mount recommendations");
assert(native.includes("button.dataset.method=entry.shortId"),"Native suggestions must open real spell routes");
assert(native.includes('button.dataset.spellPractice=index===0?"true":"false"'));
assert(react.includes("spellSuggestions.lessons['L09-1-2']"),"React route shares the map");
assert(react.includes("data-spell-practice={index===0?'true':'false'}"));
assert(html.includes('practice:t.dataset.spellPractice==="true"'),
 "Existing delegated action must open the practice directly");
assert(spell.includes('switchTab(tab==="practice"?"practice":"guide")'));
console.log("PASS Wave1 suggested spells: 3 real lessons, 6 verified techniques, live practice actions, explicit editorial-only status");
