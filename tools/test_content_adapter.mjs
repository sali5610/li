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
assert.equal(groups.length,5);
assert.equal((await c.listFields()).length,15);
assert.equal((await c.listFields({groupId:"ict"})).length,3);
assert.equal((await c.getGroup("ict")).title,"Công nghệ thông tin & Truyền thông");
assert.equal((await c.getField("F09")).groupId,"natural-sciences-math");
const allCourses=await c.listCourses();
assert.equal(allCourses.length,45,"legacy course metadata must be preserved");
assert.equal((await c.listCourses({level:"foundation"})).length,15);
assert.equal((await c.listCourses({fieldId:"F09"})).length,3);
assert.equal((await c.getCourse("C15-2")).level,"intermediate");
assert.equal((await c.listCourses({groupId:"business-administration-law"})).length,3);
assert.equal((await c.listLessonOutlines()).length,135);
assert.equal((await c.listLessonOutlines({courseId:"C09-1"})).length,3);
assert.equal((await c.getLessonOutline("L09-1-2")).contentState,"review_only");
assert.equal((await c.getLessonOutline("L09-1-1")).publishState,"draft");
assert.deepEqual((await c.getBreadcrumbs("L09-1-2")).map(x=>[x.kind,x.id]),[["group","natural-sciences-math"],["field","F09"],["course","C09-1"],["lesson","L09-1-2"]]);
assert.deepEqual((await c.getBreadcrumbs("C03-1")).map(x=>x.kind),["group","field","course"]);
assert.deepEqual((await c.getBreadcrumbs("F03")).map(x=>x.kind),["group","field"]);
assert.deepEqual((await c.getBreadcrumbs("ict")).map(x=>x.kind),["group"]);
assert.deepEqual((await c.getBreadcrumbs("unknown")),[]);
const navGraph=await c.graph();
assert.equal(navGraph.nodes.filter(n=>n.kind==="DomainGroup").length,5);
assert.equal(navGraph.nodes.filter(n=>n.kind==="Field").length,15);
assert.equal(navGraph.nodes.filter(n=>n.kind==="Course").length,45);
assert.equal(navGraph.nodes.filter(n=>n.kind==="Lesson").length,135);
assert.ok(navGraph.edges.some(e=>e.predicate==="PART_OF"&&e.from==="lesson:L09-1-1"&&e.to==="course:C09-1"));
assert.ok(allCourses.every(x=>!x.id.startsWith("PROP-")),"proposed research candidates must never leak into learner catalog");
requested.length=0; // isolate lazy course-pack fetch assertion from course catalog requests
const l09=await c.getLesson("L09-1-2");
assert.equal(l09.id,"L09-1-2");assert.equal(l09.content.localized.vi.questions.length,4);
assert.deepEqual(requested,["manifest.json","C09-1.json"],"lazy course load: no other course fetched");
// Step18: the same read-only adapter exposes real reader phase references.
const chapterIds=["read","guided","practice","feedback","progress"];
const expectedMethodRefs={
 "L03-1-2":["L2-T06","L2-T04"],"L09-1-2":["L2-T06","L2-T07"],
 "L15-2-2":["L2-T03","L2-T10"]
};
const suggestionSource=JSON.parse(readFileSync(new URL("../site/assets/lesson-spell-suggestions.v0.1.json",import.meta.url),"utf8"));
for(const [id,refs] of Object.entries(expectedMethodRefs)){
 const lesson=await c.getLesson(id),snapshot=JSON.stringify(lesson);
 const structure=await c.getLessonStructure(id);
 assert.equal(structure.lessonId,id);
 assert.equal(structure.contentVersion,lesson.version);
 assert.deepEqual(structure.chapters.map(x=>x.id),chapterIds.map(x=>id+":"+x));
 assert.deepEqual(structure.chapters.map(x=>x.order),[1,2,3,4,5]);
 assert.ok(structure.chapters.every(x=>x.lessonId===id&&x.title.vi&&x.title.en));
 assert.deepEqual(structure.chapters.map(x=>x.anchorAvailableAfter),["none","none","none","submitted","reviewed"]);
 const readerPath=id==="L09-1-2"?"LearningJourney.tsx":"Wave1Journey.tsx";
 const reader=readFileSync(new URL("./step16-real-l09-react-island/src/learning/"+readerPath,import.meta.url),"utf8");
 for(const chapter of structure.chapters){
  assert.ok(reader.includes('id="'+chapter.readerAnchor+'"'),"chapter anchor matches existing reader "+chapter.id);
 }
 assert.deepEqual(structure.methodFit,lesson.methodFit,"do not promote editorial candidates");
 assert.equal(structure.methodFit.status,"not_reviewed");
 assert.deepEqual(structure.methodSuggestions.items.map(x=>x.techniqueId),refs);
 assert.deepEqual(structure.methodSuggestions.items,suggestionSource.lessons[id]);
 assert.equal(structure.methodSuggestions.evidenceStatus,suggestionSource.evidenceStatus);
 assert.equal(JSON.stringify(await c.getLesson(id)),snapshot,"no content/ID mutation");
 assert.deepEqual(await c.getLessonStructure(id),structure,"stable on repeat");
}
assert.equal(await c.getLessonStructure("L00-0-0"),null);
assert.equal(await c.getLessonStructure("L09-1-1"),null,"no invented outline chapters");
// Reject a malformed method reference rather than silently treating it as a reviewed method.
const badClient=createContentClient({baseUrl:"https://li.test/packs/",fetcher:async url=>{
 if(url.endsWith("/lesson-spell-suggestions.v0.1.json")){
  const bad=structuredClone(suggestionSource);
  bad.lessons["L09-1-2"][0].techniqueId="L2-T14";
  return {ok:true,json:async()=>bad};
 }
 return fetcher(url);
}});
await assert.rejects(()=>badClient.getLessonStructure("L09-1-2"),/LI_METHOD_SUGGESTION_REFERENCE_INVALID/);
// Public reader packs must expose current UNESCO navigation, but must not
// mutate the three original PO-locked manuscripts or their lesson body.
const currentGroups=new Map(groups.map(g=>[g.id,g]));
for(const [id,currentGroupId] of [
 ["L03-1-2","ict"],["L09-1-2","natural-sciences-math"],
 ["L15-2-2","business-administration-law"]
]){
 const publicLesson=await c.getLesson(id);
 const original=JSON.parse(readFileSync(new URL("../content/lessons/"+id+".json",import.meta.url),"utf8"));
 assert.equal(publicLesson.id,original.id,"stable lesson ID "+id);
 assert.equal(publicLesson.hierarchy.group.id,"group:"+currentGroupId,"public group "+id);
 assert.equal(publicLesson.hierarchy.group.title,currentGroups.get(currentGroupId).title,"public group title "+id);
 assert.notEqual(original.hierarchy.group.id,publicLesson.hierarchy.group.id,"archival hierarchy retained "+id);
 assert.deepEqual(publicLesson.content,original.content,"PO-locked content must remain byte-equivalent "+id);
 assert.deepEqual(publicLesson.hierarchy.field,original.hierarchy.field,"stable Field ID "+id);
 assert.deepEqual(publicLesson.hierarchy.course,original.hierarchy.course,"stable Course ID "+id);
}
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
assert.ok(indexed.documents.some(d=>d.id==="group:ict"));
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

// Natural-language answerability runs against THIS SAME canonical content client.
// It is an editorial learning-outcome mapping, NOT ONNX runtime inference.
const nlCases=[
 ["Tại sao khảo sát 1.000 người vẫn có thể sai?","L09-1-2"],
 ["khảo sát chỉ hỏi người đang dùng app","L09-1-2"],
 ["mẫu có một nghìn người mà vẫn không đại diện","L09-1-2"],
 ["người bỏ app không có cơ hội tham gia khảo sát","L09-1-2"],
 ["why bigger samples cannot fix biased recruitment","L09-1-2"],
 ["80% người trả lời không đại diện cho mọi khách hàng","L09-1-2"],
 ["biến thiên ngẫu nhiên và thiên lệch mẫu khác nhau thế nào","L09-1-2"],
 ["Làm sao hỏi user mà không dẫn dắt câu trả lời?","L03-1-2"],
 ["hỏi khách hàng nút này tiện hơn đúng không","L03-1-2"],
 ["viết câu hỏi phỏng vấn trung lập để người dùng kể chuyện thật","L03-1-2"],
 ["a leading question can bias interview answers","L03-1-2"],
 ["câu phỏng vấn có sẵn lời khen và muốn người ta đồng ý","L03-1-2"],
 ["why can an open ended question still be leading","L03-1-2"],
 ["How do I ask a user a neutral question?","L03-1-2"],
 ["kho chưa hết hàng thì khi nào phải đặt thêm","L15-2-2"],
 ["tính ngưỡng đặt hàng từ nhu cầu mỗi ngày và thời gian giao","L15-2-2"],
 ["calculate inventory reorder threshold from lead time and daily demand","L15-2-2"],
 ["tồn kho đang trên đường có ảnh hưởng thời điểm mua","L15-2-2"],
 ["why is a reorder point different from order quantity","L15-2-2"],
 ["safety stock buffer and stockout risk","L15-2-2"],
 ["mức dự phòng tồn kho khi lead time thay đổi","L15-2-2"],
 ["thời điểm cần đặt hàng lại","L15-2-2"]
];
for(const [query,lessonId] of nlCases){
 const result=await c.searchKnowledge(query);
 assert.equal(result.status,"answerable","should recognize question intent: "+query);
 assert.equal(result.results[0]?.lessonId,lessonId,"wrong directly answerable lesson: "+query);
 assert.equal(result.results[0]?.answerability?.level,"direct");
 assert.match(result.results[0]?.answerability?.reason||"",/./);
 assert.ok(result.results[0]?.answerability?.sourceUrl?.startsWith("https://"));
 assert.deepEqual(result.results[0]?.links,[],"do not invent reviewed graph edges");
}
const relatedEOQ=await c.searchKnowledge("Làm sao tính lượng đặt hàng tối ưu EOQ?");
assert.equal(relatedEOQ.status,"related_only");
assert.equal(relatedEOQ.results[0].lessonId,"L15-2-2");
assert.equal(relatedEOQ.results[0].answerability.level,"related");
assert.match(relatedEOQ.results[0].answerability.reason,/không dạy/);
const otherRelated=await c.searchKnowledge("phân tích transcript phỏng vấn bằng thematic coding");
assert.equal(otherRelated.status,"related_only");
assert.equal(otherRelated.results[0].answerability.level,"related");
const unsupported=[
 "thuyết tương đối của einstein",
 "how to compose music in C minor",
 "lịch sử đế chế La Mã",
 "công thức lãi suất kép ngân hàng",
 "how to build a React authentication system",
 "cách trồng lan hồ điệp trong nhà",
 "thiết kế A/B test kiểm tra phiên bản giao diện mới",
 "công thức hồi quy tuyến tính và hệ số tương quan",
 "kiểm định giả thuyết và khoảng tin cậy 95 phần trăm",
 "dự báo nhu cầu bằng mô hình ARIMA theo tháng",
 "viết SQL truy vấn bảng tồn kho trong database",
 "thiết lập SAP EWM warehouse tasks và storage bins",
 "how to implement a survey with Google Forms API",
 "how to recruit candidates for job interviews"
];
for(const query of unsupported){
 const result=await c.searchKnowledge(query);
 assert.notEqual(result.status,"answerable","unsupported natural query must not claim direct answer: "+query);
 assert.ok(result.results.every(x=>x.answerability?.level!=="direct"),
  "no direct answer for unsupported query: "+query);
}
assert.equal((await c.searchKnowledge("L09-1-2")).results[0].lessonId,"L09-1-2",
 "exact IDs outrank any editorial paraphrase");
assert.equal((await c.searchKnowledge("Selection bias")).results[0].kind,"Concept",
 "verified concept lookup unchanged");
assert.equal((await c.searchKnowledge("L09-1-1")).status,"no_match",
 "outline-only lessons never become published matches");


// Automatic outcome retrieval: no per-lesson rule when new reviewed content arrives.
const autoPack=JSON.parse(readFileSync(new URL("answerability.json",root),"utf8"));
assert.equal(autoPack.autoOutcomes.length,12,"every reviewed Wave1 outcome is auto-indexed");
for(const item of autoPack.autoOutcomes){
 const real=await c.getLesson(item.lessonId);
 assert.equal(item.localized.vi,real.learningOutcomes.vi[item.outcomeIndex]);
 assert.equal(item.localized.en,real.learningOutcomes.en[item.outcomeIndex]);
 assert.ok(real.sources.some(src=>src.url===item.sourceUrl));
 assert.equal(item.evidenceStatus,"reviewed_lesson_outcome_text_not_independent_claim");
}
const unmatchedByCurated=await c.searchKnowledge("Identify praise or unverified assumptions built into a prompt");
assert.equal(unmatchedByCurated.status,"outcome_match");
assert.equal(unmatchedByCurated.results[0].lessonId,"L03-1-2");
assert.equal(unmatchedByCurated.results[0].answerability.level,"outcome_match");
assert.match(unmatchedByCurated.results[0].answerability.reason,/Nhận ra lời khen/);
assert.equal((await c.searchKnowledge("Rewrite a claim to stay within the observed evidence"))
 .results[0].lessonId,"L09-1-2");
const mockLessonId="L07-1-9";
const existingTree=await c.hierarchy();
const futureTree={...existingTree,lessons:[...existingTree.lessons,
 {id:mockLessonId,title:"Shipment Visibility and Events",fieldId:"F07",courseId:"C07-1",
  groupId:"ict",navigationPublished:true,contentState:"review_only"}]};
const futureIndex={...indexed,documents:[...indexed.documents,
 {id:"lesson:"+mockLessonId,kind:"Lesson",title:"Shipment Visibility and Events",
  aliases:[],reviewState:"approved",publishState:"review_only"}]};
const futurePack={...autoPack,autoOutcomes:[...autoPack.autoOutcomes,
 {id:"outcome:"+mockLessonId+":1",lessonId:mockLessonId,outcomeIndex:0,
  localized:{vi:"Đánh giá sự kiện vận chuyển và thay đổi ETA theo các mốc hành trình.",
   en:"Evaluate shipment transit events and ETA changes across milestones."},
  sourceUrl:"https://example.org/fixture",evidenceStatus:"reviewed_lesson_outcome_text_not_independent_claim"}]};
const fixtureFiles={"course-catalog.json":futureTree,"search.json":futureIndex,
 "answerability.json":futurePack};
const futureFetcher=async url=>{
 const name=new URL(url).pathname.split("/").at(-1);
 return {ok:true,json:async()=>fixtureFiles[name]??
  JSON.parse(readFileSync(new URL(name,root),"utf8"))};
};
const futureClient=createContentClient({baseUrl:"https://future.example.invalid/packs/",fetcher:futureFetcher});
const newLessonResult=await futureClient.searchKnowledge(
 "How can I evaluate shipment transit events and ETA changes?");
assert.equal(newLessonResult.status,"outcome_match",
 "new content must enter natural-language Search without any new intent rules");
assert.equal(newLessonResult.results[0].lessonId,mockLessonId);
assert.match(newLessonResult.results[0].answerability.reason,/Đánh giá sự kiện/);
assert.equal((await futureClient.searchKnowledge("How do I prepare an invoice?")).status,"no_answer",
 "unrelated question must not forcibly match an authored lesson");
assert.equal((await futureClient.searchKnowledge("L07-1-8")).status,"no_match",
 "not-yet-authored lesson IDs remain unavailable");

console.log("LI_CONTENT_ADAPTER_PASS 8 groups / 15 fields / 45 courses / 135 lesson outlines, 3 full lessons, ontology graph and lazy packs");

// ONT-03C: exercise actual authored lesson sources, not the old demo graph.
// Personal-study projections remain editorial; never use them to promote search.
const ontProjection=JSON.parse(readFileSync(new URL("../content/editorial/lesson-ontology-analogy.v1.json",import.meta.url),"utf8"));
const ontRegistry=JSON.parse(readFileSync(new URL("../docs/ontology/registry.v0.1.json",import.meta.url),"utf8"));
const ontMethods=JSON.parse(readFileSync(new URL("../docs/ontology/pedagogy/techniques.v0.2.json",import.meta.url),"utf8"));
const ontTechniqueIds=new Set(ontMethods.entries.map(x=>x.id));
const ontGraphById=new Map(navGraph.nodes.map(x=>[x.id,x]));
const ontManifest=await c.manifest();
const ontPackIds=new Set(ontManifest.courses.flatMap(x=>x.lessonIds));
const ontKnownConcepts=new Map();
const ontCoverage={authored:0,canonicalPack:0,editorialDraft:0,conceptReferences:0,methodReferences:0,goalsNeedReconciliation:[],methodTextNeedsReconciliation:[]};
assert.equal(ontProjection.status,"editorial_lesson_projection_not_graph_promotion");
assert.equal(ontTechniqueIds.size,13);
assert.ok([...ontPackIds].every(id=>ontProjection.lessons[id]),"Every current canonical body must have a projection");
for(const [id,p] of Object.entries(ontProjection.lessons)){
 const packed=ontPackIds.has(id);
 const expectedPath=packed?"content/lessons/"+id+".json":"content/editorial/normalized/"+id+".draft.v1.json";
 assert.equal(p.sourceRef,id);assert.equal(p.sourcePath,expectedPath);
 const authored=JSON.parse(readFileSync(new URL("../"+p.sourcePath,import.meta.url),"utf8"));
 assert.equal(authored.id,id);assert.equal(authored.kind,"Lesson");
 assert.ok(authored.provenance?.sourceUrl?.startsWith("https://"),id+" missing source provenance");
 const crumbs=await c.getBreadcrumbs(id);
 const field=id.slice(1,3),course="C"+id.slice(1,id.lastIndexOf("-"));
 assert.deepEqual(crumbs.map(x=>x.kind),["group","field","course","lesson"],id+" broken hierarchy");
 assert.deepEqual(crumbs.slice(1).map(x=>x.id),["F"+field,course,id]);
 assert.equal(p.reviewState,"proposed");assert.equal(p.relation.reviewState,"proposed");
 const rel=ontRegistry.predicates.find(x=>x.name===p.relation.predicate);
 assert.ok(rel?.from.includes("Concept")&&rel?.to.includes("Concept"),id+" invalid concept relation");
 const localIds=new Set(p.concepts.map(x=>x.id));
 assert.equal(localIds.size,p.concepts.length,id+" duplicate concept");
 assert.ok(localIds.has(p.relation.from)&&localIds.has(p.relation.to)&&p.relation.from!==p.relation.to,id+" dangling or self relation");
 for(const locale of ["vi","en"])assert.ok(p.relation.reason[locale]?.trim());
 for(const concept of p.concepts){
  assert.ok(concept.vi?.trim()&&concept.en?.trim(),id+" missing bilingual concept");
  const prior=ontKnownConcepts.get(concept.id);
  if(prior)assert.deepEqual([concept.vi,concept.en],prior,concept.id+" inconsistent labels");
  ontKnownConcepts.set(concept.id,[concept.vi,concept.en]);
  if(concept.id.startsWith("concept:lesson:")){
   assert.ok(!ontGraphById.has(concept.id),"Unreviewed projection escaped into canonical graph: "+concept.id);
   for(const q of [concept.id,concept.vi,concept.en]){
    const hit=await c.searchKnowledge(q);
    assert.ok(hit.results.every(x=>x.id!==concept.id&&x.links.every(y=>y.id!==concept.id)));
   }
  }else assert.equal(ontGraphById.get(concept.id)?.kind,"Concept",id+" missing canonical concept reference");
  ontCoverage.conceptReferences++;
 }
 if(packed){
  const body=await c.getLesson(id);assert.equal(body.id,id);
  assert.ok(body.learningOutcomes.vi.length&&body.learningOutcomes.en.length&&body.sources.length);
  const structure=await c.getLessonStructure(id);
  for(const m of structure.methodSuggestions.items){
   assert.ok(ontTechniqueIds.has(m.techniqueId));ontCoverage.methodReferences++;
  }
  ontCoverage.canonicalPack++;
 }else{
  assert.equal(authored.reviewState,"proposed");assert.equal(authored.publishState,"draft");
  assert.equal(await c.getLesson(id),null,"Personal draft leaked into approved pack");
  assert.equal((await c.searchKnowledge(id)).status,"no_match","Personal draft leaked into reviewed Search");
  assert.deepEqual(await c.getRelatedLessons(id),[],"Personal draft leaked into reviewed graph expansion");
  const methodSets={};
  for(const locale of ["vi","en"]){
   const local=authored.content.localized[locale];
   assert.ok(local.sections.some(x=>x.role==="concept"&&x.body_md?.trim()),id+" missing concept section "+locale);
   if(!local.sections.some(x=>x.role==="goals"&&x.body_md?.trim()))ontCoverage.goalsNeedReconciliation.push(id+":"+locale);
   const refs=[...new Set(local.sections.filter(x=>x.role==="methods").flatMap(x=>[...(x.body_md||"").matchAll(/\bT(0[1-9]|1[0-3])\b/g)].map(m=>"L2-T"+m[1])))].sort();
   assert.ok(refs.every(x=>ontTechniqueIds.has(x)),id+" invalid technique identity");
   methodSets[locale]=refs;ontCoverage.methodReferences+=refs.length;
  }
  if(!methodSets.vi.length||!methodSets.en.length||JSON.stringify(methodSets.vi)!==JSON.stringify(methodSets.en))ontCoverage.methodTextNeedsReconciliation.push({id,...methodSets});
  ontCoverage.editorialDraft++;
 }
 ontCoverage.authored++;
}
assert.ok(navGraph.nodes.every(x=>x.visibility==="public_curated"));
assert.ok(navGraph.edges.every(x=>x.visibility==="public_curated"));
console.log("LI_ONT03C_SOURCE_BOUNDARY_PASS "+JSON.stringify(ontCoverage));
// This is structural/visibility evidence only. Goal/method text diagnostics
// require reconciliation with the current reader supplements before claiming
// full outcome or academic method-fit coverage; no manuscript is promoted.
