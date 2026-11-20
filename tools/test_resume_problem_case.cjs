/* UX-IA-08 · Quay lại must render 1 lesson + 1 actual problem/case.
   Headless local DOM harness; no fake visits, no live network. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
class Element {
 constructor(tag="div"){this.tagName=tag;this.children=[];this.textContent="";this.dataset={};this.attributes={};this.handlers={};this.hidden=false;this.disabled=false;this.value="";this.innerHTML="";}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=[...items];}
 addEventListener(name,fn){this.handlers[name]=fn;}
 setAttribute(key,value){this.attributes[key]=value;}
 focus(){}
}
const ids=["page-library","page-resume","page-collection","li-library-latest-lesson","li-library-latest-problem","li-lesson-history","li-problem-history","case-archive-preview","li-library-latest-idea","li-saved-lessons","li-saved-questions","li-bookmarks-empty-lessons","li-bookmarks-empty-questions","li-bookmark-tab-lessons","li-bookmark-tab-questions","li-bookmark-panel-lessons","li-bookmark-panel-questions","li-collection-list","save-capture-note","capture-note"];
const cases=[],ideas=[],savedQuestions=[],savedContent=[],events=[],routes=[],openedNotes=[],listeners={};
const map=new Map();
const localStorage={
 getItem:k=>map.has(k)?map.get(k):null,
 setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)
};
const scenarios=[
 {question:"Ai không nằm trong mẫu?",scene:"Khảo sát một nhóm",type:"problem"},
 {question:"Hàng nằm ở kho nào?",scene:"Kho vẫn có hàng"},
 {question:"Hook bài học",type:"hook",lessonRoute:"lessonL09"}
];
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
const filters=["all","case","idea"].map(v=>{const e=new Element("button");e.dataset.collectionFilter=v;return e;});
const mockDate=Date;
const ctx={
 window:{localStorage,dispatchEvent:e=>events.push(e),
  addEventListener:(kind,handler)=>{listeners[kind]=handler;},
  liBookmarks:{refresh(){},isSaved(){return false;}},
  liNotes:{openDetail(kind,id){openedNotes.push({kind,id});return true;}}},
 document:{getElementById:id=>elements[id]||null,createElement:tag=>new Element(tag),querySelectorAll:()=>filters,
 documentElement:{classList:{contains:()=>true}},
 querySelector:selector=>selector==="#page-case .editorial-grid .surface.tinted h2"?{textContent:"90% trả lời hài lòng. Chúng ta nên kết luận thế nào?"}:null},
 processedCases:cases,collectedIdeas:ideas,savedQuestions,savedContent,scenarios,
 localStorage,liStorageError:false,liWriteState:()=>true,liNewId:()=>"newidea",
 qIndex:0,renderMirrorItem:()=>{},navigate:route=>routes.push(route),toast:()=>{},
 CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},
 console,Date:mockDate,Intl
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,"../site/assets/library-hub.js"),"utf8"),ctx);
const shelf=ctx.window.liLibraryShelf;assert(shelf);
shelf.renderHome();
assert.equal(elements["li-library-latest-lesson"].children.length,2,"lesson empty state is truthful");
assert.equal(elements["li-library-latest-problem"].children.length,2,"problem empty state is truthful");
assert.equal(elements["li-problem-history"].children.length,0,"no fabricated case in detail before render");
assert.equal(shelf.trackProblem("research",scenarios[2]),false,"hook cannot be a problem");
assert.equal(shelf.trackProblem("case","unknown"),false,"unpublished case cannot be tracked");
shelf.trackLesson("lessonL03");
shelf.trackLesson("lessonL15");
shelf.trackProblem("research",scenarios[0]);
shelf.renderHome();
assert.equal(elements["li-library-latest-lesson"].children.length,1,"only 1 lesson preview");
assert.equal(elements["li-library-latest-lesson"].children[0].children[1].textContent,"Tiếp tục","latest lesson uses the unified CTA");
assert.equal(elements["li-library-latest-problem"].children.length,1,"only 1 problem preview");
let row=elements["li-library-latest-problem"].children[0];
assert.match(row.children[0].children[0].textContent,/Ai không nằm trong mẫu/);
assert.equal(row.children[1].textContent,"Tiếp tục");
row.children[1].handlers.click();
assert.equal(ctx.qIndex,0,"problem detail selects original Gương scenario");
assert.equal(routes.at(-1),"research");
shelf.trackProblem("research",scenarios[1]);
shelf.renderHome();
row=elements["li-library-latest-problem"].children[0];
assert.match(row.children[0].children[0].textContent,/Hàng nằm ở kho nào/,"latest problem is last actual entry");
shelf.trackProblem("case","sampling-bias-90");
shelf.renderHome();
row=elements["li-library-latest-problem"].children[0];
assert.equal(row.children[1].textContent,"Tiếp tục","no Bút Ký means return to canonical exercise");
assert.equal(row.children.length,3,"case Save icon has a separate utility column");
assert.equal(row.children[2].children[0].dataset.liBookmarkKind,"case");
row.children[1].handlers.click();
assert.equal(routes.at(-1),"case");
shelf.renderResume();
assert.equal(elements["li-lesson-history"].children.length,2);
assert(elements["li-lesson-history"].children.every(x=>x.children[1].textContent==="Tiếp tục"),"full lesson history uses the unified CTA");
assert(elements["li-problem-history"].children.every(x=>x.children[1].textContent==="Tiếp tục"),"full problem and case history uses the unified CTA");
assert.equal(elements["li-problem-history"].children.length,3,"full problem history is under Quay lại");
assert.equal(elements["li-library-latest-problem"].children.length,1,"overview stays limited to one");
assert.equal(elements["li-saved-questions"].children.length,0,"recent cases are not inserted as question bookmarks");
assert.equal(elements["li-saved-lessons"].children.length,0,"recent lessons are not auto-bookmarked");
assert.equal(elements["li-bookmark-panel-lessons"].hidden,false);
assert.equal(elements["li-bookmark-panel-questions"].hidden,true);
// A new case solution changes its available detail, without changing the actual view ordering.
cases.push({id:"case-result-1",caseKey:"sampling-bias-90",title:"Sampling Bias",correct:true,revision:"Mẫu chưa đại diện toàn thể",savedAt:"2026-11-18T03:00:00.000Z"});
shelf.renderHome();
row=elements["li-library-latest-problem"].children[0];
assert.equal(row.children[1].textContent,"Tiếp tục","saved case opens full exercise + authored conclusion");
row.children[1].handlers.click();
assert.deepEqual(openedNotes.at(-1),{kind:"case",id:"case-result-1"});
shelf.trackProblem("research",scenarios[0]);
shelf.renderHome();
assert.match(elements["li-library-latest-problem"].children[0].children[0].children[0].textContent,/Ai không nằm trong mẫu/);
const stored=JSON.parse(map.get("li.private.problem.visits.v1"));
assert.equal(stored.schema,1);
assert.equal(stored.items.length,3,"same problem opening deduplicates record");
assert.equal(stored.items[0].key,scenarios[0].question,"latest actual problem first");
assert.equal(map.has("li.private.lesson.visits.v1"),true,"separate lesson history remains intact");
// The user-visible shelf must reflect an actual confirmed cross-device
// lesson readback without requiring the learner to open each lesson.
localStorage.setItem('li.sync.local-owner.v1','signed-A');
localStorage.setItem('li.review.L15-2-2.v1',JSON.stringify({
 locale:'vi',draft:['Đã lưu câu trả lời','','',''],submitted:false,reviewed:false
}));
listeners['li:lesson-cloud-state']?.({detail:{
 accountId:'signed-A',lessons:[{id:'L15-2-2',changedAt:'2030-11-20T06:25:10Z'}]
}});
const latestCloud=elements['li-library-latest-lesson'].children[0];
assert.match(latestCloud.children[0].children[0].textContent,/Điểm đặt hàng/);
assert.match(latestCloud.children[0].children[1].textContent,/Đã đồng bộ Neon/);
console.log("PASS UX-IA-08: one latest lesson and problem/case, real recency, separate detail routes, solved case detail and honest empty states");
