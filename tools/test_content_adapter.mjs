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
  groupId:"technology",navigationPublished:true,contentState:"review_only"}]};
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
