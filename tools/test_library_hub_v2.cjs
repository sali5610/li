/* Deterministic, headless contract test for Tủ Riêng IA v2.
   No browser, cloud service, analytics or paid dependency. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
class Element{
 constructor(tag="div"){this.tagName=tag;this.children=[];this.textContent="";this.dataset={};this.attributes={};this.handlers={};this.value="";this.hidden=false;this.disabled=false;this.className="";this.focused=false;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];}
 addEventListener(name,fn){this.handlers[name]=fn;}
 setAttribute(key,value){this.attributes[key]=value;}
 focus(){this.focused=true;}
}
const ids=["page-library","page-resume","page-collection","case-archive-preview","li-library-latest-idea","li-library-latest-lesson","li-lesson-history","li-bookmarks-empty-lessons","li-bookmarks-empty-questions","li-saved-lessons","li-saved-questions","li-bookmark-tab-lessons","li-bookmark-tab-questions","li-bookmark-panel-lessons","li-bookmark-panel-questions","li-collection-list","save-capture-note","capture-note"];
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
const filters=["all","case","idea"].map(name=>{const x=new Element("button");x.dataset.collectionFilter=name;return x;});
const local=new Map(),events=[],routes=[],messages=[],deleteCalls=[],listeners={};
let invited=true,accountOpen=false,storageAvailable=true,nextIdeaId=2;
const localStorage={getItem:key=>local.has(key)?local.get(key):null,setItem:(key,value)=>local.set(key,value),removeItem:key=>local.delete(key)};
const cases=[
{id:"c1",title:"Cũ",revision:"Kết luận thứ nhất",correct:true,savedAt:"2026-10-01T08:00:00.000Z"},
{id:"c2",title:"Mới",revision:"Kết luận thứ hai",correct:false,savedAt:"2026-11-16T08:00:00.000Z"}
],ideas=[{id:"i1",text:"Một giả thuyết chưa được kiểm chứng",savedAt:"2026-11-17T08:00:00.000Z"}];
const savedQuestions=[{question:"Vì sao?",savedAt:"2026-11-17T08:00:00.000Z"}];
const savedContent=[{type:"lesson",id:"L09-1-2",savedAt:"2026-11-18T08:00:00.000Z"},{type:"case",id:"sampling-bias-90",savedAt:"2026-11-18T07:00:00.000Z"}];
const ctx={
 window:{localStorage,dispatchEvent:e=>events.push(e),
 addEventListener:(name,fn)=>(listeners[name]||=[]).push(fn)},
 document:{getElementById:id=>elements[id]||null,createElement:tag=>new Element(tag),querySelectorAll:()=>filters,
 documentElement:{classList:{contains:key=>key==='li-auth-verified'?invited:key==='li-account-open'?accountOpen:false}}},
 localStorage,processedCases:cases,collectedIdeas:ideas,savedQuestions,savedContent,
 scenarios:[{question:"Vì sao?",type:"problem"}],
 liWriteState:()=>storageAvailable,liStorageError:false,liNewId:()=>"i"+nextIdeaId++,
 qIndex:0,renderMirrorItem:()=>{},navigate:route=>routes.push(route),toast:msg=>messages.push(msg),
 CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},
 console,Intl,Date
};
const code=fs.readFileSync(path.join(__dirname,"../site/assets/library-hub.js"),"utf8");
vm.createContext(ctx);vm.runInContext(code,ctx);
const shelf=ctx.window.liLibraryShelf;
assert(shelf,"library controller registers");
ctx.window.liNotes={deleteNote:(type,id)=>{deleteCalls.push({type,id});return true;}};
shelf.renderHome();
assert.equal(elements["case-archive-preview"].children.length,1,"only one latest Bút Ký preview");
assert.equal(elements["li-library-latest-idea"].children.length,1,"only one latest Ý đã nhặt preview");
assert.equal(elements["case-archive-preview"].children[0].children[0].textContent,"Mới","preview chooses latest saved case");
assert.equal(elements["li-library-latest-idea"].children[0].children[1].textContent,ideas[0].text);
assert.equal(elements["li-library-latest-lesson"].children.length,2,"honest empty lesson state and catalog CTA");
assert.equal(elements["li-saved-questions"].children.length,0,"question tab not rendered on library overview");
assert.equal(elements["li-saved-lessons"].children.length,0,"lesson tab not rendered on library overview");
shelf.trackLesson("lessonL09");
shelf.trackLesson("lessonL03");
shelf.trackLesson("lessonL09");
shelf.trackLesson("unsupportedRoute");
shelf.renderHome();
assert.equal(elements["li-library-latest-lesson"].children.length,1,"one last visited lesson only");
assert.equal(elements["li-library-latest-lesson"].children[0].children[1].textContent,"Tiếp tục","the latest lesson CTA remains Tiếp tục");
assert.match(elements["li-library-latest-lesson"].children[0].children[0].children[0].textContent,/Sampling Bias/);
shelf.renderResume();
assert.equal(elements["li-lesson-history"].children.length,2,"two distinct recent lessons in full list");
assert.equal(elements["li-saved-lessons"].children.length,1,"only published saved lessons in Bài học");
assert.equal(elements["li-saved-questions"].children.length,2,"mirror question and case in Câu hỏi, not lessons");
assert.match(elements["li-saved-lessons"].children[0].children[0].children[0].textContent,/Sampling Bias/);
assert.match(elements["li-saved-questions"].children[0].children[0].children[0].textContent,/90%/);
assert.equal(elements["li-bookmarks-empty-lessons"].hidden,true);
assert.equal(elements["li-bookmarks-empty-questions"].hidden,true);
assert.equal(elements["li-bookmark-panel-lessons"].hidden,false,"Bài học visible by default");
assert.equal(elements["li-bookmark-panel-questions"].hidden,true,"Câu hỏi hidden by default");
assert.equal(elements["li-bookmark-tab-lessons"].attributes["aria-selected"],"true");
elements["li-bookmark-tab-questions"].handlers.click();
assert.equal(elements["li-bookmark-panel-lessons"].hidden,true);
assert.equal(elements["li-bookmark-panel-questions"].hidden,false);
assert.equal(elements["li-bookmark-tab-questions"].attributes["aria-selected"],"true");
shelf.renderResume();
assert.equal(elements["li-bookmark-panel-questions"].hidden,false,"selected tab survives re-render");
let prevented=false;
elements["li-bookmark-tab-questions"].handlers.keydown({key:"ArrowLeft",preventDefault(){prevented=true}});
assert.equal(prevented,true);
assert.equal(elements["li-bookmark-panel-lessons"].hidden,false);
assert.equal(elements["li-bookmark-tab-lessons"].focused,true,"keyboard tab switch moves focus");
shelf.renderCollection();
assert.equal(elements["li-collection-list"].children.length,3,"full combined Bút Ký / Ý list");
const noteCard=elements["li-collection-list"].children[0];
const rowActions=noteCard.children.at(-1).children;
assert.equal(rowActions.length,2,"collection has both view-details and visible delete");
assert.equal(rowActions[1].textContent,"Xóa");
assert.match(rowActions[1].attributes["aria-label"],/Xóa ghi chép/);
rowActions[1].handlers.click();
assert.deepEqual(deleteCalls,[{type:"idea",id:"i1"}],"delete forwards the exact note to shared delete handler");
filters[1].handlers.click();
assert.equal(elements["li-collection-list"].children.length,2,"Bút Ký filter");
filters[2].handlers.click();
assert.equal(elements["li-collection-list"].children.length,1,"Ý đã nhặt filter");
elements["capture-note"].value="Ý mới lưu từ bài báo";
elements["save-capture-note"].handlers.click();
assert.equal(ideas.length,2,"Nhặt ý now actually persists");
assert.equal(elements["capture-note"].value,"","save clears field");
assert.equal(events.length,1,"actual successful input emits a single activity event");
assert.equal(events[0].detail.type,"input");
assert.equal(routes.at(-1),"collection");
assert.equal(elements["li-collection-list"].children.length,2,"filtered collection updates after new item");
assert.equal(JSON.parse(local.get("li.private.lesson.visits.v1")).items.length,2,"visits persisted and deduped");
// React Nhặt Ý uses this exact saved-items transaction, not a hidden click.
const capture=ctx.window.liCaptureIdea;
assert(capture&&Object.isFrozen(capture),"Private save action is shared and immutable");
const startCount=ideas.length,priorActivity=events.length;
assert.equal(capture.save("  ").ok,false,"Validation before any personal write");
assert.equal(capture.save("x".repeat(5001)).reason,"too-long");
assert.equal(ideas.length,startCount,"Invalid notes must not be inserted");
storageAvailable=false;
const failed=capture.save("Ghi chú cần kiểm chứng");
assert.equal(failed.reason,"write-failed","A failed disk write must be reported");
assert.equal(ideas.length,startCount,"Failed write rolls back original in-memory array");
assert.equal(events.length,priorActivity,"Failed write never emits a saved activity");
storageAvailable=true;
invited=false;
assert.equal(capture.save("Không có invite").reason,"invite-required");
assert.equal(ideas.length,startCount,"Guest cannot write private notes through React");
invited=true;accountOpen=true;
assert.equal(capture.save("Account panel mở").reason,"invite-required");
assert.equal(ideas.length,startCount,"Account overlay blocks writes");
accountOpen=false;
const saved=capture.save("  Ý từ React cần kiểm chứng  ");
assert.equal(saved.ok,true,"React writes with the original owner");
assert.equal(ideas.length,startCount+1,"Only one new record for one React action");
assert.equal(ideas[0].id,saved.id);
assert.equal(ideas[0].text,"Ý từ React cần kiểm chứng","Whitespace trimmed before private write");
assert.equal(events.length,priorActivity+1,"Only one li:activity event for confirmed write");
assert.equal(events.at(-1).detail.id,"idea:"+saved.id);
assert.equal(routes.at(-1),"collection","React save opens the real Collection route");
const captureUi=fs.readFileSync(path.join(__dirname,"../tools/step16-real-l09-react-island/src/shell/capture-idea.tsx"),"utf8");
assert.match(captureUi,/app\.liCaptureIdea\?\.save\(text\)/,"React action is direct");
assert.doesNotMatch(captureUi,/getElementById\(['"]capture-note['"]\)|getElementById\(['"]save-capture-note['"]\)|submit\.click\(\)/,
 "No hidden HTML textarea or submit button bridge");
assert.match(captureUi,/li-auth-verified/,"Logout must clear unsaved React text");
assert.match(captureUi,/onClick=\{goBack\}/,"React Back must use real history action");
// The canonical React Catalog now offers 17 invited personal lessons. The
// original private Library must keep real recent visits and saved bookmarks for
// those routes without making any unregistered/guest route visible.
const personalId="L03-1-1",personalRoute="draftLessonL0311",personalName="User need versus proposed interface";
elements["li-staging-auth-root"]=new Element();
elements["page-"+personalRoute]=new Element("section");
elements["page-"+personalRoute].classList={contains:key=>key==="active"};
ctx.window.liPersonalStudyRoutes={[personalId]:personalRoute};
assert.equal(shelf.registerPersonalLessons([{id:personalId,route:personalRoute,title:personalName}]),1,
 "Canonical gated metadata can be registered with the same Library owner");
assert.equal(shelf.registerPersonalLessons([{id:"FAKE",route:"draftLessonFake",title:"Forged"}]),0,
 "Unlisted personal routes are never registered");
const eventsForRoute=listeners["li:route-changed"]||[];
assert.equal(eventsForRoute.length,1,"One route listener, no second router");
const personalVisit={detail:{route:personalRoute}};
const previousVisits=JSON.parse(local.get("li.private.lesson.visits.v1")).items.length;
invited=false;
eventsForRoute[0](personalVisit);
assert.equal(JSON.parse(local.get("li.private.lesson.visits.v1")).items.length,previousVisits,
 "Unverified visit cannot write a personal-lesson history row");
invited=true;
eventsForRoute[0](personalVisit);
eventsForRoute[0](personalVisit);
const personalHistory=JSON.parse(local.get("li.private.lesson.visits.v1")).items;
assert.equal(personalHistory.length,previousVisits+1,"Repeat route visits deduplicate into one saved row");
assert.equal(personalHistory[0].route,personalRoute,"Personal visit persisted under existing key");
const personalRows=shelf.getView().lessons;
assert.equal(personalRows[0].id,personalId,"Quay lại resumes the actual invited lesson");
assert.equal(personalRows[0].title,personalName,"Canonical Catalog title used, not an ID placeholder");
shelf.renderResume();
assert.equal(elements["li-lesson-history"].children.length,previousVisits+1,
 "React/native Library share the complete recent-lesson model");
const bookmarks=fs.readFileSync(path.join(__dirname,"../site/assets/library-bookmarks.js"),"utf8");
ctx.document.addEventListener=()=>{};
vm.runInContext(bookmarks,ctx);
const mark=ctx.window.liBookmarks;
assert.equal(mark.valid("lesson",personalId),true,"The real bookmark action allows a registered invited lesson");
assert.equal(mark.valid("lesson","FAKE"),false,"Unknown personal lessons cannot be bookmarked");
assert.equal(mark.toggle("lesson",personalId),true,"Personal bookmark persisted through the original private writer");
assert.equal(shelf.getView().lessonBookmarks.some(item=>item.id===personalId),true,
 "Saved personal lesson appears in Quay lại · Dấu Trang");
invited=false;
assert.equal(mark.valid("lesson",personalId),false,"Unverified users cannot add personal bookmarks");
assert.equal(mark.valid("lesson","L09-1-2"),true,"Three released lesson bookmarks remain available");
invited=true;
// React Quay Lại should advertise a real due T02 review, not a fabricated
// reminder or a blanket "due" badge for unscheduled lessons.
const reactLibrary=fs.readFileSync(path.join(__dirname,
 "../tools/step16-real-l09-react-island/src/shell/guide-library.tsx"),"utf8");
assert.match(reactLibrary,/LiSpellPractice\\?\\.getT02Status\\?\\.\\(item\\.id\\)/,
 "Recent and Resume lesson rows must read the real T02 lesson schedule");
assert(reactLibrary.includes("status?.awaitingRating===true")&&
 reactLibrary.includes("typeof status?.dueAt==='number'&&status.dueAt<=now"),
 "Only an awaiting self-rating or genuinely due review may surface T02");
assert(reactLibrary.includes("'li:private-personal-change'")&&
 reactLibrary.includes("'visibilitychange'")&&reactLibrary.includes("60_000"),
 "Returning to Continue and crossing a due minute updates visible review status");
assert(reactLibrary.includes("onClick={()=>openRoute(item.route)}"),
 "Continue still opens the exact lesson and its existing Progress/T02 entry");
console.log("PASS Tủ Riêng: 20 eligible lessons and truthful T02 due/rating visibility, existing private history and notes");
