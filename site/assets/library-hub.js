/* Tủ Riêng IA v2 — actual latest records, full collections, per-device lesson visits.
   Only published Wave1 lessons are eligible. No fabricated records, no external network. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const isEnglish=()=>window.liLanguage?.get?.()==="en";
const ui=(vi,en)=>isEnglish()?en:vi;
const lessonTitlesEN={"L03-1-2":"Open Questions & Interview Bias","L09-1-2":"Sampling Bias","L15-2-2":"Reorder Points & Safety Stock"};
const lessonTitle=info=>isEnglish()?(lessonTitlesEN[info.id]||info.title):info.title;
const lessonStatusText=info=>{
 const vi=lessonStatus(info);
 return isEnglish()?({"Đã tự đánh giá":"Self-reviewed","Đã nộp bài":"Submitted","Đã mở gần đây":"Recently opened"}[vi]||vi):vi;
};
if(!$("page-library")||!$("page-resume")||!$("page-collection"))return;
const VISITS_KEY="li.private.lesson.visits.v1";
const PROBLEM_VISITS_KEY="li.private.problem.visits.v1";
const NATIVE_CASE_KEY="sampling-bias-90";
const LESSONS={
 lessonL03:{id:"L03-1-2",title:"Câu hỏi mở & thiên lệch phỏng vấn"},
 lessonL09:{id:"L09-1-2",title:"Sampling Bias · Sai lệch chọn mẫu"},
 lessonL15:{id:"L15-2-2",title:"Điểm đặt hàng lại & tồn kho an toàn"}
};
let collectionFilter="all";
let bookmarkTab="lesson";
let visitStore={schema:1,items:[]},visitError=false;
try{
 const raw=window.localStorage.getItem(VISITS_KEY);
 if(raw){
  const v=JSON.parse(raw);
  if(!v||v.schema!==1||!Array.isArray(v.items))throw Error("invalid visits");
  visitStore.items=v.items.filter(x=>x&&Object.prototype.hasOwnProperty.call(LESSONS,x.route)&&typeof x.visitedAt==="string"&&!Number.isNaN(Date.parse(x.visitedAt))).slice(0,40);
 }
}catch(err){visitError=true;}
/* Activity visits are separate from bookmarks and authored case notes.
   The research question text is the stable identity for this published problem set. */
let problemVisits={schema:1,items:[]},problemVisitError=false;
function isKnownProblem(entry){
 if(!entry||typeof entry.key!=="string")return false;
 if(entry.kind==="case")return entry.key===NATIVE_CASE_KEY;
 return entry.kind==="problem"&&scenarios.some(sc=>sc.type!=="hook"&&sc.question===entry.key);
}
try{
 const raw=window.localStorage.getItem(PROBLEM_VISITS_KEY);
 if(raw){
  const data=JSON.parse(raw);
  if(!data||data.schema!==1||!Array.isArray(data.items))throw Error("invalid problem history");
  problemVisits.items=data.items.filter(x=>isKnownProblem(x)&&typeof x.visitedAt==="string"&&!Number.isNaN(Date.parse(x.visitedAt))).slice(0,40);
 }
}catch(err){problemVisitError=true;}
function findCaseNote(){
 return sortedBySavedAt(processedCases.filter(note=>note&&(
  note.caseKey===NATIVE_CASE_KEY||note.caseSnapshot?.id===NATIVE_CASE_KEY||
  /Sampling Bias/i.test(note.title||"")||
  (Array.isArray(note.versions)&&note.versions.some(v=>/Sampling Bias/i.test(v?.title||"")))
 )))[0]||null;
}
function problemHistory(){
 const actual=problemVisits.items.filter(isKnownProblem).slice().sort((a,b)=>Date.parse(b.visitedAt)-Date.parse(a.visitedAt));
 if(!actual.some(x=>x.kind==="case")){
  const authored=findCaseNote();
  if(authored)actual.push({kind:"case",key:NATIVE_CASE_KEY,legacy:true,savedAt:authored.updatedAt||authored.savedAt});
 }
 return actual.sort((a,b)=>(Date.parse(b.visitedAt||b.savedAt)||0)-(Date.parse(a.visitedAt||a.savedAt)||0));
}
function trackProblem(kind,value){
 const entry=kind==="research"&&value&&value.type!=="hook"?{kind:"problem",key:value.question}:
  kind==="case"&&value===NATIVE_CASE_KEY?{kind:"case",key:NATIVE_CASE_KEY}:null;
 if(!isKnownProblem(entry))return false;
 const next={...entry,visitedAt:new Date().toISOString()};
 const items=[next,...problemVisits.items.filter(x=>!(x.kind===entry.kind&&x.key===entry.key))].slice(0,40);
 if(problemVisitError){problemVisits={schema:1,items};return false;}
 const serial=JSON.stringify({schema:1,items});
 try{
  window.localStorage.setItem(PROBLEM_VISITS_KEY,serial);
  if(window.localStorage.getItem(PROBLEM_VISITS_KEY)!==serial)throw Error("no readback");
  problemVisits={schema:1,items};
  return true;
 }catch(err){
  problemVisits={schema:1,items};problemVisitError=true;
  if(typeof toast==="function")toast("Lịch mở problem/case chưa lưu được trên thiết bị này.");
  return false;
 }
}
function sortedBySavedAt(items){return items.slice().sort((a,b)=>(Date.parse(b.updatedAt||b.savedAt)||0)-(Date.parse(a.updatedAt||a.savedAt)||0));}
function visits(){
 const tracked=visitStore.items.slice().sort((a,b)=>(Date.parse(b.visitedAt)||0)-(Date.parse(a.visitedAt)||0));
 const known=new Set(tracked.map(x=>x.route));
 // Show real saved Wave1 states predating visit tracking in Quay lại only.
 for(const [route,meta] of Object.entries(LESSONS)){
  if(known.has(route))continue;
  const state=getLessonState(meta.id);
  if(!state||!(state.submitted||state.reviewed||state.guidedDraft?.trim()||state.draft?.some(x=>typeof x==="string"&&x.trim())))continue;
  tracked.push({route,visitedAt:null,legacy:true});
 }
 return tracked;
}
function add(parent,tag,cls,text){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=String(text);
 parent.append(el);return el;
}
function empty(root,description){
 add(root,"div","state-note",description);
}
function btn(parent,label,route,cls="action alt"){
 const b=add(parent,"button",cls,label);
 b.type="button";b.dataset.page=route;return b;
}
function formatDate(date){
 const n=Date.parse(date);
 return Number.isFinite(n)?new Intl.DateTimeFormat(window.liLanguage?.get?.()==="en"?"en-US":"vi-VN",{day:"numeric",month:"numeric",year:"numeric"}).format(new Date(n)):ui("Không rõ ngày","Unknown date");
}
function getLessonState(id){
 try{
  const value=JSON.parse(window.localStorage.getItem("li.review."+id+".v1")||"null");
  return value&&typeof value==="object"?value:null;
 }catch(err){return null;}
}
function lessonStatus(info){
 const state=getLessonState(info.id);
 return state?.reviewed?"Đã tự đánh giá":state?.submitted?"Đã nộp bài":"Đã mở gần đây";
}
function trackLesson(route){
 if(!Object.prototype.hasOwnProperty.call(LESSONS,route))return;
 // An opt-in synthetic React L09 browser fixture must not create a genuine
 // activity/visit entry. Normal users and unflagged Vanilla routes are intact.
 const place=window.location;
 if(route==="lessonL09"&&place?.protocol==="http:"&&
   ["localhost","127.0.0.1"].includes(place.hostname)&&
   place.pathname==="/site/index.html"&&
   ["l09","l09-native-fixture"].includes(
     new URLSearchParams(place.search).get("li-react")))return;
 const entry={route,visitedAt:new Date().toISOString()};
 const items=[entry,...visitStore.items.filter(x=>x.route!==route)].slice(0,40);
 const value=JSON.stringify({schema:1,items});
 try{
  window.localStorage.setItem(VISITS_KEY,value);
  if(window.localStorage.getItem(VISITS_KEY)!==value)throw Error("readback");
  visitStore={schema:1,items};visitError=false;
 }catch(err){
  // Do not overwrite unreadable history; this session can still show the current visit.
  visitStore={schema:1,items};
  if(!visitError&&typeof toast==="function")toast("Không lưu được lịch mở bài trên thiết bị; bài vừa mở chỉ hiện trong phiên.");
  visitError=true;
 }
}
function renderLessonRows(root,limit){
 if(!root)return;root.replaceChildren();
 const items=visits().slice(0,limit||40);
 if(!items.length){empty(root,"Chưa ghi nhận bài đã mở gần đây. Vào Tàng Thư, mở một bài học để bắt đầu.");btn(root,"Mở Tàng Thư","catalog");return;}
 for(const item of items){
  const info=LESSONS[item.route];if(!info)continue;
  const row=add(root,"div","path-item library-list-item");
  const body=add(row,"div","library-list-copy");
  add(body,"strong","",lessonTitle(info));
  add(body,"p","small",info.id+" · "+lessonStatusText(info)+(item.legacy?ui(" · Bài có dữ liệu đã lưu"," · Saved progress available"):ui(" · Mở "," · Opened ")+formatDate(item.visitedAt)));
  btn(row,"Tiếp tục",item.route,"library-text-link library-open-lesson");
  const utility=add(row,"div","library-icon-utility library-row-utility");
  const save=add(utility,"button","library-icon-action library-lesson-save");
  save.type="button";save.dataset.liBookmarkKind="lesson";save.dataset.liBookmarkId=info.id;
  save.setAttribute("aria-label",ui("Lưu bài ","Bookmark lesson ")+info.id);
  save.setAttribute("title",ui("Lưu bài ","Bookmark lesson ")+info.id);
  save.setAttribute("aria-pressed",String(Boolean(window.liBookmarks?.isSaved("lesson",info.id))));
  save.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
 }
}
function renderProblemRows(root,limit){
 if(!root)return;
 root.replaceChildren();
 const items=problemHistory().slice(0,limit||40);
 if(!items.length){
  empty(root,"Chưa có problem / case nào đã xem. Mở Khảo Chứng hoặc Phản Chứng để bắt đầu.");
  btn(root,"Khám phá vấn đề","home","library-text-link library-open-lesson");
  return;
 }
 for(const entry of items){
  const scenario=entry.kind==="problem"?scenarios.find(sc=>sc.type!=="hook"&&sc.question===entry.key):null;
  if(entry.kind==="problem"&&!scenario)continue;
  const note=entry.kind==="case"?findCaseNote():null;
  const row=add(root,"div","path-item library-list-item library-problem-item");
  const body=add(row,"div","library-list-copy");
  const title=entry.kind==="problem"?scenario.question:
   (document.querySelector?.("#page-case .editorial-grid .surface.tinted h2")?.textContent?.trim()||"90% trả lời hài lòng. Chúng ta nên kết luận thế nào?");
  add(body,"strong","",window.liLanguage?.translate?.(title)||title);
  const activity=entry.legacy?
   ui("Có Bút Ký đã lưu · ","Saved case note · ")+formatDate(entry.savedAt):
   ui("Mở ","Opened ")+formatDate(entry.visitedAt);
  add(body,"p","small",(entry.kind==="case"?ui("CASE · PHẢN CHỨNG","CASE · TEST A CLAIM"):ui("PROBLEM · KHẢO CHỨNG","PROBLEM · INVESTIGATE"))+" · "+activity+(note&&entry.kind==="case"?ui(" · Có luận kết"," · Revised conclusion available"):""));
  const details=add(row,"button","library-text-link library-detail-link","Tiếp tục");
  details.type="button";
  details.addEventListener("click",()=>{
   if(entry.kind==="problem"){
    const index=scenarios.findIndex(sc=>sc.type!=="hook"&&sc.question===entry.key);
    if(index<0){toast("Vấn đề này không còn trong Gương Vạn Vấn.");return;}
    qIndex=index;renderMirrorItem();navigate("research");
   }else if(note){
    trackProblem("case",NATIVE_CASE_KEY);
    if(!window.liNotes?.openDetail("case",note.id))navigate("case");
   }else navigate("case");
  });
  if(entry.kind==="case"){
   const utility=add(row,"div","library-icon-utility library-row-utility");
   const save=add(utility,"button","library-icon-action library-case-save");
   save.type="button";save.dataset.liBookmarkKind="case";save.dataset.liBookmarkId=NATIVE_CASE_KEY;
   save.setAttribute("aria-label",ui("Lưu case","Bookmark case"));
   save.setAttribute("title",ui("Lưu case","Bookmark case"));
   save.setAttribute("aria-pressed",String(Boolean(window.liBookmarks?.isSaved("case",NATIVE_CASE_KEY))));
   save.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  }
 }
}
function renderCases(){
 const root=$("case-archive-preview");if(!root)return;root.replaceChildren();
 const item=sortedBySavedAt(processedCases)[0];
 if(!item){empty(root,"Chưa có Bút Ký. Thử Phản Chứng rồi lưu kết luận đầu tiên.");return;}
 const block=add(root,"div","library-preview");
 add(block,"strong","",item.title).dataset.liNoTranslate="";
 add(block,"p","small",formatDate(item.updatedAt||item.savedAt)+" · "+(item.correct?ui("Đã chọn nhận định phù hợp","Supported claim selected"):ui("Đã chọn nhận định cần xem lại","Claim needs review")));
 add(block,"p","library-clamp",item.revision);
 const detail=add(block,"button","library-text-link library-detail-link","Xem chi tiết");
 detail.type="button";detail.addEventListener("click",()=>window.liNotes?.openDetail("case",item.id));
}
function renderIdeas(){
 const root=$("li-library-latest-idea");if(!root)return;root.replaceChildren();
 const item=sortedBySavedAt(collectedIdeas)[0];
 if(!item){empty(root,"Chưa có ý nào được lưu. Những ý gặp ngoài đời sẽ nằm ở đây.");return;}
 const block=add(root,"div","library-preview");
 add(block,"p","small",formatDate(item.updatedAt||item.savedAt)+ui(" · Chưa xác minh"," · Unverified"));
 add(block,"p","library-clamp",item.text);
 const detail=add(block,"button","library-text-link library-detail-link","Xem chi tiết");
 detail.type="button";detail.addEventListener("click",()=>window.liNotes?.openDetail("idea",item.id));
}
/* Dấu Trang has exactly two independent tabs:
   Bài học = explicit published lesson saves;
   Câu hỏi = saved Gương questions and published Phản Chứng cases.
   Never mix these categories in one visual list. */
function selectBookmarkTab(type,focus=false){
 if(type!=="lesson"&&type!=="question")return;
 bookmarkTab=type;
 for(const kind of ["lesson","question"]){
  const tab=$(kind==="lesson"?"li-bookmark-tab-lessons":"li-bookmark-tab-questions");
  const panel=$(kind==="lesson"?"li-bookmark-panel-lessons":"li-bookmark-panel-questions");
  if(tab){
   tab.setAttribute("aria-selected",String(kind===type));
   tab.setAttribute("tabindex",kind===type?"0":"-1");
   if(focus&&kind===type)tab.focus();
  }
  if(panel)panel.hidden=kind!==type;
 }
}
for(const type of ["lesson","question"]){
 const tab=$(type==="lesson"?"li-bookmark-tab-lessons":"li-bookmark-tab-questions");
 if(!tab)continue;
 tab.addEventListener("click",()=>selectBookmarkTab(type));
 tab.addEventListener("keydown",event=>{
  const next=(event.key==="ArrowLeft"||event.key==="ArrowRight")?
   (type==="lesson"?"question":"lesson"):
   event.key==="Home"?"lesson":event.key==="End"?"question":null;
  if(!next)return;
  event.preventDefault();
  selectBookmarkTab(next,true);
 });
}
function renderSavedBookmarkEntries(root,entries,knownCases,lessonById){
 if(!root)return;
 root.replaceChildren();
 for(const entry of entries){
  const row=add(root,"div","path-item library-list-item");
  const body=add(row,"div","library-list-copy");
  let route=null,questionIndex=-1;
  if(entry.kind==="question"){
   const item=entry.record;
   questionIndex=scenarios.findIndex(x=>x.question===item.question||x.previousQuestion===item.question||(x.key&&x.key===item.scenarioKey));
   add(body,"strong","",questionIndex>=0?scenarios[questionIndex].question:item.question);
   add(body,"p","small",ui("CÂU HỎI · ","QUESTION · ")+formatDate(entry.savedAt));
   if(questionIndex>=0)route=scenarios[questionIndex].type==="hook"?scenarios[questionIndex].lessonRoute:"research";
  }else{
   const found=entry.kind==="case"?knownCases[entry.record.id]:lessonById[entry.record.id];
   if(!found)continue;
   add(body,"strong","",entry.kind==="lesson"?lessonTitle(found):(window.liLanguage?.translate?.(found.title)||found.title));
   add(body,"p","small",(entry.kind==="lesson"?ui("BÀI HỌC","LESSON"):ui("CASE · PHẢN CHỨNG","CASE · TEST A CLAIM"))+" · "+formatDate(entry.savedAt));
   route=found.route;
  }
  const actions=add(row,"div","library-bookmark-actions");
  const open=add(actions,"button","library-text-link library-open-lesson",entry.kind==="question"&&questionIndex>=0&&scenarios[questionIndex].type==="hook"?"Mở bài học":"Mở lại");
  open.type="button";
  if(!route){open.disabled=true;open.textContent="Chưa có điểm đến";}
  else if(entry.kind==="question"){
   open.addEventListener("click",()=>{
    const idx=scenarios.findIndex(x=>x.question===entry.record.question||x.previousQuestion===entry.record.question||(x.key&&x.key===entry.record.scenarioKey));
    if(idx<0){toast("Câu hỏi không còn điểm đến.");return;}
    qIndex=idx;renderMirrorItem();
    const target=scenarios[idx].type==="hook"?scenarios[idx].lessonRoute:"research";
    if(!$("page-"+target)){toast("Chưa mở được bài học.");return;}
    navigate(target);
   });
  }else open.dataset.page=route;
  const utility=add(row,"div","library-icon-utility library-row-utility");
  const remove=add(utility,"button","library-icon-action library-unsave-icon");
  remove.type="button";
  remove.setAttribute("aria-label",isEnglish()?("Remove bookmark for "+(entry.kind==="lesson"?"lesson "+entry.record.id:entry.kind==="case"?"case":"question")):("Bỏ lưu "+(entry.kind==="lesson"?"bài "+entry.record.id:entry.kind==="case"?"case":"câu hỏi")));
  remove.setAttribute("title","Bỏ lưu");
  remove.setAttribute("aria-pressed","true");
  remove.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  remove.addEventListener("click",()=>{
   if(entry.kind!=="question"){window.liBookmarks?.toggle(entry.kind,entry.record.id);return;}
   if(liStorageError){toast("Không đọc được dữ liệu lưu, chưa thay đổi Dấu Trang.");return;}
   const index=savedQuestions.indexOf(entry.record);
   if(index<0)return;
   savedQuestions.splice(index,1);
   if(!liWriteState()){savedQuestions.splice(index,0,entry.record);toast("Không bỏ lưu được, Dấu Trang vẫn giữ nguyên.");return;}
   renderBookmarks();
   toast("Đã bỏ lưu câu hỏi.",{undo:()=>{
    if(savedQuestions.some(x=>x.id===entry.record.id))return true;
    const at=Math.min(index,savedQuestions.length);savedQuestions.splice(at,0,entry.record);
    if(!liWriteState()){savedQuestions.splice(at,1);return false;}
    renderBookmarks();if(typeof refreshQuestionBookmark==="function")refreshQuestionBookmark();return true;
   }});
  });
 }
}
function renderBookmarks(){
 const lessonRoot=$("li-saved-lessons"),questionRoot=$("li-saved-questions");
 if(!lessonRoot||!questionRoot)return;
 const currentSaved=typeof savedContent!=="undefined"?savedContent:[];
 const knownCases={"sampling-bias-90":{title:"90% trả lời hài lòng · Phản Chứng",route:"case"}};
 const lessonById=Object.fromEntries(Object.entries(LESSONS).map(([route,meta])=>[meta.id,{...meta,route}]));
 const ordered=items=>items.sort((a,b)=>(Date.parse(b.savedAt)||0)-(Date.parse(a.savedAt)||0));
 const lessons=ordered(currentSaved.filter(x=>x&&x.type==="lesson"&&lessonById[x.id]).map(x=>({kind:"lesson",savedAt:x.savedAt,record:x})));
 const questions=ordered([
  ...savedQuestions.map(x=>({kind:"question",savedAt:x.savedAt,record:x})),
  ...currentSaved.filter(x=>x&&x.type==="case"&&knownCases[x.id]).map(x=>({kind:"case",savedAt:x.savedAt,record:x}))
 ]);
 const lessonEmpty=$("li-bookmarks-empty-lessons"),questionEmpty=$("li-bookmarks-empty-questions");
 if(lessonEmpty)lessonEmpty.hidden=lessons.length>0;
 if(questionEmpty)questionEmpty.hidden=questions.length>0;
 renderSavedBookmarkEntries(lessonRoot,lessons,knownCases,lessonById);
 renderSavedBookmarkEntries(questionRoot,questions,knownCases,lessonById);
 selectBookmarkTab(bookmarkTab);
}
function renderHome(){
 renderLessonRows($("li-library-latest-lesson"),1);
 renderProblemRows($("li-library-latest-problem"),1);
 renderCases();
 renderIdeas();
 window.liBookmarks?.refresh();
}
function renderResume(){
 renderLessonRows($("li-lesson-history"),40);
 renderProblemRows($("li-problem-history"),40);
 renderBookmarks();
 window.liBookmarks?.refresh();
}
function renderCollection(){
 const root=$("li-collection-list");if(!root)return;root.replaceChildren();
 document.querySelectorAll("[data-collection-filter]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.collectionFilter===collectionFilter)));
 const cases=processedCases.map(x=>({...x,entryType:"case"}));
 const ideas=collectedIdeas.map(x=>({...x,entryType:"idea"}));
 const all=sortedBySavedAt([...cases,...ideas]).filter(x=>collectionFilter==="all"||x.entryType===collectionFilter);
 if(!all.length){
  empty(root,collectionFilter==="case"?"Chưa có Bút Ký nào.":collectionFilter==="idea"?"Chưa lưu Ý đã nhặt nào.":"Chưa có ghi chép được lưu. Viết Bút Ký hoặc nhặt một ý để bắt đầu.");
  return;
 }
 for(const item of all){
  const card=add(root,"article","surface library-collection-entry");
  add(card,"div","kicker",item.entryType==="case"?"BÚT KÝ · KẾT LUẬN SAU PHẢN CHỨNG":"Ý ĐÃ NHẶT · CHƯA XÁC MINH");
  if(item.entryType==="case")add(card,"h3","",item.title).dataset.liNoTranslate="";
  add(card,"p","small",ui("Lưu ngày ","Saved ")+formatDate(item.savedAt)+(item.updatedAt?ui(" · Sửa "," · Edited ")+formatDate(item.updatedAt):""));
  add(card,"p","library-entry-body",item.entryType==="case"?item.revision:item.text);
  const actions=add(card,"div","library-note-actions");
  const detail=add(actions,"button","library-text-link library-detail-link","Xem chi tiết");
  detail.type="button";detail.addEventListener("click",()=>window.liNotes?.openDetail(item.entryType,item.id));
 }
}
$("save-capture-note")?.addEventListener("click",()=>{
 const field=$("capture-note");
 const value=field?.value.trim()||"";
 if(value.length<3){toast("Ý này còn quá ngắn. Viết ít nhất 3 ký tự đã.");field?.focus();return;}
 if(value.length>5000){toast("Ý dài quá 5.000 ký tự, hãy tách thành vài ghi chú.");return;}
 if(liStorageError){toast("Dữ liệu cá nhân chưa đọc được. Hãy sao chép nội dung trước khi thoát.");return;}
 const idea={id:liNewId(),text:value,savedAt:new Date().toISOString()};
 collectedIdeas.unshift(idea);
 if(!liWriteState()){
  collectedIdeas.shift();toast("Không lưu được ý này. Nội dung vẫn ở ô viết, hãy sao chép để tránh mất.");return;
 }
 if(field)field.value="";
 window.dispatchEvent(new CustomEvent("li:activity",{detail:{type:"input",id:"idea:"+idea.id}}));
 navigate("collection");renderCollection();toast("Đã lưu Ý đã nhặt trên thiết bị này. Chưa xác minh.");
});
document.querySelectorAll("[data-collection-filter]").forEach(button=>button.addEventListener("click",()=>{
 collectionFilter=button.dataset.collectionFilter;
 renderCollection();
}));
window.addEventListener?.("li:localechange",()=>{renderHome();renderResume();renderCollection();});
window.liLibraryShelf=Object.freeze({renderHome,renderResume,renderCollection,renderCases,renderIdeas,renderBookmarks,selectBookmarkTab,trackLesson,trackProblem,renderProblemRows});
})();
