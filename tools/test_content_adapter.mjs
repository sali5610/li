import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createContentClient} from "../site/assets/li-content-adapter.mjs";
const root=new URL("../site/content-packs/",import.meta.url);
const requested=[];
const fetcher=async url=>{const name=url.slice("https://li.test/packs/".length);requested.push(name);try{const body=JSON.parse(readFileSync(new URL(name,root),"utf8"));return {ok:true,json:async()=>body};}catch{return {ok:false,status:404};}};
const c=createContentClient({baseUrl:"https://li.test/packs/",fetcher});
const levels=await c.getCourseLevels();
assert.deepEqual(levels.map(x=>x.id),["foundation","intermediate","advanced","capstone"]);
assert.deepEqual(levels.map(x=>x.order),[1,2,3,4]);
const groups=await c.listGroups();
assert.equal(groups.length,8);
assert.equal((await c.listFields()).length,15);
assert.equal((await c.listFields({groupId:"technology"})).length,3);
assert.equal((await c.getGroup("technology")).title,"Công nghệ");
assert.equal((await c.getField("F09")).groupId,"mathematics");
const allCourses=await c.listCourses();
assert.equal(allCourses.length,45,"legacy course metadata must be preserved");
assert.equal((await c.listCourses({level:"foundation"})).length,15);
assert.equal((await c.listCourses({fieldId:"F09"})).length,3);
assert.equal((await c.getCourse("C15-2")).level,"intermediate");
assert.equal((await c.listCourses({groupId:"business"})).length,3);
assert.equal((await c.listLessonOutlines()).length,135);
assert.equal((await c.listLessonOutlines({courseId:"C09-1"})).length,3);
assert.equal((await c.getLessonOutline("L09-1-2")).contentState,"review_only");
assert.equal((await c.getLessonOutline("L09-1-1")).publishState,"draft");
assert.deepEqual((await c.getBreadcrumbs("L09-1-2")).map(x=>[x.kind,x.id]),[["group","mathematics"],["field","F09"],["course","C09-1"],["lesson","L09-1-2"]]);
assert.deepEqual((await c.getBreadcrumbs("C03-1")).map(x=>x.kind),["group","field","course"]);
assert.deepEqual((await c.getBreadcrumbs("F03")).map(x=>x.kind),["group","field"]);
assert.deepEqual((await c.getBreadcrumbs("technology")).map(x=>x.kind),["group"]);
assert.deepEqual((await c.getBreadcrumbs("unknown")),[]);
const navGraph=await c.graph();
assert.equal(navGraph.nodes.filter(n=>n.kind==="DomainGroup").length,8);
assert.equal(navGraph.nodes.filter(n=>n.kind==="Field").length,15);
assert.equal(navGraph.nodes.filter(n=>n.kind==="Course").length,45);
assert.equal(navGraph.nodes.filter(n=>n.kind==="Lesson").length,135);
assert.ok(navGraph.edges.some(e=>e.predicate==="PART_OF"&&e.from==="lesson:L09-1-1"&&e.to==="course:C09-1"));
assert.ok(allCourses.every(x=>!x.id.startsWith("PROP-")),"proposed research candidates must never leak into learner catalog");
requested.length=0; // isolate lazy course-pack fetch assertion from course catalog requests
const l09=await c.getLesson("L09-1-2");
assert.equal(l09.id,"L09-1-2");assert.equal(l09.content.localized.vi.questions.length,4);
assert.deepEqual(requested,["manifest.json","C09-1.json"],"lazy course load: no other course fetched");
assert.equal((await c.getLesson("L03-1-2")).id,"L03-1-2");
assert.equal((await c.getLesson("L15-2-2")).id,"L15-2-2");
assert.equal(await c.getLesson("L00-0-0"),null);
const lessons=await c.getConceptLessons("concept:ont01:selection-bias");
assert.ok(lessons.some(x=>x.lessonId==="L09-1-2"));
const connections=await c.getRelatedLessons("L03-1-2",{includeProposed:true});
assert.ok(connections.some(x=>x.lessonId==="L09-1-2"&&x.explanations.some(e=>e.predicate==="RELATED_TO"&&e.reviewState==="verified")));
const checked=await c.getRelatedLessons("L03-1-2");
assert.deepEqual(checked.map(x=>x.lessonId),["L09-1-2"]);
const why=checked[0].explanations.find(x=>x.predicate==="RELATED_TO");
assert.equal(why.reviewState,"verified");
assert.equal(why.provenance.sourceUrl,"https://www.pewresearch.org/u-s-survey-methodology/");
assert.match(why.reasonLocalized.vi,/Câu hỏi dẫn dắt/);
assert.deepEqual((await c.getRelatedLessons("L09-1-2")).map(x=>x.lessonId),["L03-1-2"]);
assert.ok((await c.getRelatedLessons("L09-1-2",{includeProposed:true})).some(x=>x.lessonId==="L15-2-2"));
assert.deepEqual(await c.getRelatedLessons("L15-2-2"),[],"unreviewed L15 bridge hidden by default");
const back=await c.getBacklinks("concept:ont01:selection-bias");
assert.ok(back.some(x=>x.from==="lesson:L09-1-2"));
const indexed=await c.search();
assert.ok(indexed.documents.some(d=>d.id==="lesson:L15-2-2"));
assert.ok(indexed.documents.some(d=>d.id==="group:technology"));
assert.ok(!indexed.documents.some(d=>d.id==="lesson:L09-1-1"),"outlines are not released searchable learning lessons");
const relatedUi=readFileSync(new URL("../site/assets/lesson-related-wave1.js",import.meta.url),"utf8");
assert.ok(relatedUi.includes('import("./li-content-adapter.mjs")')&&relatedUi.includes("api.getRelatedLessons(id)"));
assert.ok(relatedUi.includes("li-related-source")&&relatedUi.includes("noopener noreferrer"));
assert.ok(!relatedUi.includes("const RELATED="),"no parallel hardcoded graph");
// Real canonical Search route: reviewed concept -> authored lesson -> sourced comparison.
const selection=await c.searchKnowledge("Selection bias");
assert.equal(selection.status,"ok");
assert.equal(selection.results[0].id,"concept:ont01:selection-bias");
assert.deepEqual(selection.results[0].links.filter(x=>x.kind==="Lesson").map(x=>x.lessonId),
 ["L09-1-2","L03-1-2"]);
assert.ok(selection.results[0].links.some(x=>x.lessonId==="L09-1-2" &&
 x.relation==="TEACHES"&&x.sourceUrl.startsWith("https://www.pewresearch.org/")));
assert.ok(selection.results[0].links.some(x=>x.lessonId==="L03-1-2" &&
 /khác nhau|tiên quyết/.test(x.reason)&&x.sourceUrl.startsWith("https://www.pewresearch.org/")));
assert.equal((await c.searchKnowledge("sai lech chon mau")).results[0].id,
 "concept:ont01:selection-bias");
const lessonSearch=await c.searchKnowledge("L09-1-2");
assert.equal(lessonSearch.results[0].lessonId,"L09-1-2");
assert.ok(lessonSearch.results[0].links.some(x=>x.kind==="Field"&&x.id==="field:F09"&&
 x.sourceUrl.startsWith("https://app.notion.com/")));
assert.ok(lessonSearch.results[0].links.some(x=>x.lessonId==="L03-1-2"&&
 x.relation==="RELATED_TO"));
assert.equal((await c.searchKnowledge("Data Science")).results[0].id,"field:F09");
assert.equal((await c.searchKnowledge("C09-1")).results[0].kind,"Course");
assert.ok(!(await c.searchKnowledge("Reorder point")).results.some(x=>
 x.id==="concept:wave1:reorder-point"),"proposed concepts must remain hidden");
assert.ok(!(await c.searchKnowledge("L09-1-1")).results.some(x=>
 x.id==="lesson:L09-1-1"),"outline-only lesson must not become a search result");
assert.deepEqual((await c.searchKnowledge("L15-2-2")).results[0].links
 .filter(x=>x.kind==="Lesson"),[],"unreviewed L09-L15 bridge hidden");
assert.equal((await c.searchKnowledge("x".repeat(200))).status,"invalid_query");

console.log("LI_CONTENT_ADAPTER_PASS 8 groups / 15 fields / 45 courses / 135 lesson outlines, 3 full lessons, ontology graph and lazy packs");
