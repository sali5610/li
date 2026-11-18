/* Tủ Riêng IA v2 — actual latest records, full collections, per-device lesson visits.
   Only published Wave1 lessons are eligible. No fabricated records, no external network. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
if(!$("page-library")||!$("page-resume")||!$("page-collection"))return;
const VISITS_KEY="li.private.lesson.visits.v1";
const LESSONS={
 lessonL03:{id:"L03-1-2",title:"Câu hỏi mở & thiên lệch phỏng vấn"},
 lessonL09:{id:"L09-1-2",title:"Sampling Bias · Sai lệch chọn mẫu"},
 lessonL15:{id:"L15-2-2",title:"Điểm đặt hàng lại & tồn kho an toàn"}
};
let collectionFilter="all";
let visitStore={schema:1,items:[]},visitError=false;
try{
 const raw=window.localStorage.getItem(VISITS_KEY);
 if(raw){
  const v=JSON.parse(raw);
  if(!v||v.schema!==1||!Array.isArray(v.items))throw Error("invalid visits");
  visitStore.items=v.items.filter(x=>x&&Object.prototype.hasOwnProperty.call(LESSONS,x.route)&&typeof x.visitedAt==="string"&&!Number.isNaN(Date.parse(x.visitedAt))).slice(0,40);
 }
}catch(err){visitError=true;}
function sortedBySavedAt(items){return items.slice().sort((a,b)=>(Date.parse(b.savedAt)||0)-(Date.parse(a.savedAt)||0));}
function visits(){return visitStore.items.slice().sort((a,b)=>(Date.parse(b.visitedAt)||0)-(Date.parse(a.visitedAt)||0));}
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
 return Number.isFinite(n)?new Intl.DateTimeFormat("vi-VN",{day:"numeric",month:"numeric",year:"numeric"}).format(new Date(n)):"Không rõ ngày";
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
  add(body,"strong","",info.title);
  add(body,"p","small",info.id+" · "+lessonStatus(info)+" · Mở "+formatDate(item.visitedAt));
  btn(row,getLessonState(info.id)?.submitted?"Mở lại":"Tiếp tục",item.route);
 }
}
function renderCases(){
 const root=$("case-archive-preview");if(!root)return;root.replaceChildren();
 const item=sortedBySavedAt(processedCases)[0];
 if(!item){empty(root,"Chưa có Bút Ký. Thử Phản Chứng rồi lưu kết luận đầu tiên.");return;}
 const block=add(root,"div","library-preview");
 add(block,"strong","",item.title);
 add(block,"p","small",formatDate(item.savedAt)+" · "+(item.correct?"Đã chọn nhận định phù hợp":"Đã chọn nhận định cần xem lại"));
 add(block,"p","library-clamp",item.revision);
 btn(block,"Xem trong Bộ sưu tập","collection");
}
function renderIdeas(){
 const root=$("li-library-latest-idea");if(!root)return;root.replaceChildren();
 const item=sortedBySavedAt(collectedIdeas)[0];
 if(!item){empty(root,"Chưa có ý nào được lưu. Những ý gặp ngoài đời sẽ nằm ở đây.");return;}
 const block=add(root,"div","library-preview");
 add(block,"p","small",formatDate(item.savedAt)+" · Chưa xác minh");
 add(block,"p","library-clamp",item.text);
 btn(block,"Xem trong Bộ sưu tập","collection");
}
function renderBookmarks(){
 const root=$("li-saved-questions"),placeholder=$("li-bookmarks-empty");
 if(!root)return;
 root.replaceChildren();
 const items=savedQuestions.slice().sort((a,b)=>(Date.parse(b.savedAt)||0)-(Date.parse(a.savedAt)||0));
 if(placeholder)placeholder.hidden=items.length>0;
 for(const item of items){
  const row=add(root,"div","path-item library-list-item");
  const body=add(row,"div","library-list-copy");
  add(body,"strong","",item.question);
  add(body,"p","small","Đã lưu · "+formatDate(item.savedAt));
  const found=scenarios.findIndex(x=>x.question===item.question);
  const button=add(row,"button","action alt","Mở lại");
  button.type="button";
  if(found<0){
   button.disabled=true;
   button.textContent="Chưa có điểm đến";continue;
  }
  button.textContent=scenarios[found].type==="hook"?"Mở bài học":"Mở Khảo Chứng";
  button.addEventListener("click",()=>{
   qIndex=found;renderMirrorItem();
   const scenario=scenarios[qIndex];
   if(scenario.type==="hook"&&!$("page-"+scenario.lessonRoute)){toast("Bài học chưa thể mở.");return;}
   navigate(scenario.type==="hook"?scenario.lessonRoute:"research");
  });
 }
}
function renderHome(){
 renderLessonRows($("li-library-latest-lesson"),1);
 renderCases();
 renderIdeas();
}
function renderResume(){
 renderLessonRows($("li-lesson-history"),40);
 renderBookmarks();
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
  if(item.entryType==="case")add(card,"h3","",item.title);
  add(card,"p","small","Lưu ngày "+formatDate(item.savedAt));
  add(card,"p","library-entry-body",item.entryType==="case"?item.revision:item.text);
  const actions=add(card,"div","action-row");
  btn(actions,item.entryType==="case"?"Mở Phản Chứng":"Nhặt ý khác",item.entryType==="case"?"case":"capture");
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
window.liLibraryShelf=Object.freeze({renderHome,renderResume,renderCollection,renderCases,renderIdeas,renderBookmarks,trackLesson});
})();
