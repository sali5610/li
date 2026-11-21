/* Personal note review, local revisions and deletion.
   Case verdict is immutable; only authored title/conclusion text can change. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const t=value=>window.liLanguage?.translate?.(value)||value;
const ui=(vi,en)=>window.liLanguage?.get?.()==="en"?en:vi;
if(!$("page-noteDetail"))return;
let active=null;
let backRoute="collection";
const listFor=type=>type==="case"?processedCases:type==="idea"?collectedIdeas:null;
const current=()=>active&&listFor(active.type)?.find(item=>item.id===active.id)||null;
const titleOf=(item,type)=>type==="case"?item.title:(item.title||"Ý đã nhặt");
const bodyOf=(item,type)=>type==="case"?item.revision:item.text;
const stamp=raw=>{
 const ms=Date.parse(raw);
 return Number.isFinite(ms)?new Intl.DateTimeFormat(window.liLanguage?.get?.()==="en"?"en-US":"vi-VN",{day:"numeric",month:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(ms)):"Không rõ thời gian";
};
function element(parent,tag,cls,value){
 const x=document.createElement(tag);if(cls)x.className=cls;
 if(value!==undefined)x.textContent=String(value);
 parent.append(x);return x;
}
function canonicalCaseField(note){
 if(!note)return null;
 const key=note.caseKey||note.caseSnapshot?.id||"";
 if(key==="sampling-bias-90"||/Sampling Bias/i.test(note.title||""))return "data-science";
 const match=/^draft-case-(L(?:03|09|15)-[1-3]-[1-3])$/.exec(key);
 const item=match&&(window.LI_MIRROR_DRAFT_HOOKS||[]).find(x=>
  x.id===match[1]&&x.case?.publishState==="draft");
 return item?.fieldId||null;
}
function historyFor(item,type){
 const raw=item.versions;
 if(Array.isArray(raw)&&raw.length){
  const records=raw.filter(x=>x&&typeof x.title==="string"&&typeof x.body==="string"&&typeof x.at==="string");
  if(records.length)return records.slice();
 }
 return [{version:1,title:titleOf(item,type),body:bodyOf(item,type),at:item.savedAt||new Date().toISOString(),change:"Bản gốc"}];
}
function openDetail(type,id){
 const arr=listFor(type);
 if(!arr||!arr.some(x=>x.id===id))return false;
 active={type,id};
 const origin=document.querySelector?.("section.page.active")?.id;
 const dest=origin==="page-library"?"library":origin==="page-resume"?"resume":"collection";
 backRoute=dest;
 if(!window.liReactLibraryMounted){
  const back=$("li-note-back");
  if(back)back.dataset.page=dest;
  const label=$("li-note-back-label");
  if(label)label.textContent=dest==="resume"?"Quay lại":dest==="library"?"Tủ Riêng":"Bộ sưu tập";
  $("li-note-editor").hidden=true;
 }
 navigate("noteDetail");
 renderDetail();
 return true;
}
function saveVersion(type,id,title,body,change,fieldId){
 const arr=listFor(type),index=arr?.findIndex(x=>x.id===id);
 if(!arr||index<0||liStorageError)return false;
 const prior=arr[index],versions=historyFor(prior,type);
 const now=new Date().toISOString();
 const next={...prior,title,updatedAt:now,versions:[...versions,{version:versions.length+1,title,body,at:now,change}]};
 if(type==="case")next.revision=body;else next.text=body;
 if(fieldId!==undefined)next.fieldId=fieldId;
 arr[index]=next;
 if(!liWriteState()){arr[index]=prior;return false;}
 return true;
}
function refreshAfterChange(){
 window.liLibraryShelf?.renderHome();
 window.liLibraryShelf?.renderCollection();
 renderDetail();
}
/* Case review is NOT just a note: show the original exercise and user's answer.
   New records contain a snapshot. For older records show the known canonical case
   explicitly labelled as a reconstruction, never as a stored historic snapshot. */
function renderCaseContext(note,type){
 const surface=$("li-note-case-context"),bookmarks=$("li-note-case-bookmark-tools");
 if(!surface)return;
 const isCase=type==="case"&&Boolean(note);
 const sourceKey=isCase?(note.caseKey||note.caseSnapshot?.id||""):"";
 const known=isCase&&(sourceKey==="sampling-bias-90"||
  /Sampling Bias/i.test(note.title||"")||
  (Array.isArray(note.versions)&&note.versions.some(v=>/Sampling Bias/i.test(v.title||""))));
 const hasSnapshot=isCase&&note.caseSnapshot&&typeof note.caseSnapshot.question==="string"&&
  note.caseSnapshot.question&&Array.isArray(note.caseSnapshot.options);
 const allowed=isCase&&(hasSnapshot||known);
 surface.hidden=!allowed;
 if(bookmarks)bookmarks.hidden=!allowed;
 if(bookmarks&&allowed){
  const action=bookmarks.querySelector?.("[data-li-bookmark-kind='case']");
  if(action)action.dataset.liBookmarkId=sourceKey||"sampling-bias-90";
 }
 if(!allowed)return;
 const source=hasSnapshot?note.caseSnapshot:null;
 const root=document.querySelector("#page-case .editorial-grid .surface.tinted");
 const question=source?.question||root?.querySelector("h2")?.textContent?.trim()||ui("Đề bài gốc không còn trong bản lưu","Original question missing from this record");
 const scene=source?.scene||root?.querySelector("p")?.textContent?.trim()||"";
 const options=source?.options||Array.from(root?.querySelectorAll("[data-answer]")||[]).map(node=>({key:node.dataset.answer,text:node.textContent.trim()}));
 const selection=source?.selectedKey||(note.correct?"right":"wrong");
 const selectedText=source?.selectedText||options.find(x=>x.key===selection)?.text||ui("Không có dữ liệu lựa chọn","No selected answer recorded");
 const choices=$("li-note-case-choices");choices?.replaceChildren();
 $("li-note-case-question").textContent=question;
 $("li-note-case-scene").textContent=scene;
 for(const option of options){
  const item=element(choices,"div","library-case-choice",option.text);
  if(option.key===selection)item.setAttribute("data-chosen","true");
 }
 $("li-note-case-choice").textContent=ui(hasSnapshot?"Lựa chọn của bạn: ":"Lựa chọn suy ra từ trạng thái đúng/sai: ",hasSnapshot?"Your selected answer: ":"Answer inferred from the correct/incorrect status: ")+selectedText;
 $("li-note-case-feedback").textContent=hasSnapshot?
  (source.feedback||ui("Bản lưu không có nội dung phản hồi.","No feedback was stored.")) :
  ui("Bản lưu cũ không chứa phản hồi khi bạn chọn đáp án.","This older record did not save the feedback shown when you answered.");
 $("li-note-case-provenance").textContent=hasSnapshot?
  ui("Đề bài, lựa chọn và phản hồi được ghi cùng luận kết. Chỉnh sửa luận kết không thay đổi bản chụp case.","The original question, answer and feedback were saved with your conclusion. Editing the conclusion does not alter that snapshot.") :
  ui("Dữ liệu cũ chỉ lưu luận kết và trạng thái đúng/sai. Đề bài hiện lấy từ case đang xuất bản; lựa chọn được suy ra, không phải bản ghi lịch sử nguyên gốc.","This older entry only saved your conclusion and correct/incorrect status. The question is shown from the current published case; the answer is inferred, not a historic snapshot.");
 window.liBookmarks?.refresh();
}
function renderDetail(){
 // Keep the note history in its canonical model; the React editor renders it.
 if(window.liReactLibraryMounted){notifyReactNote();return;}
 if(!$("page-noteDetail"))return;
 const note=current(),historyRoot=$("li-note-history-list");historyRoot.replaceChildren();
 $("li-note-editor").hidden=true;
 if(!note){
  delete $("li-note-detail-title").dataset.liNoTranslate;
  delete $("li-note-detail-body").dataset.liNoTranslate;
  $("li-note-detail-title").textContent="Không tìm thấy ghi chép";
  $("li-note-detail-body").textContent="Ghi chép này không còn trên thiết bị.";
  $("li-note-detail-status").textContent="Không có dữ liệu";
  $("li-note-edit").disabled=true;$("li-note-delete").disabled=true;
  renderCaseContext(null,null);
  notifyReactNote();
  return;
 }
 const type=active.type,history=historyFor(note,type);
 renderCaseContext(note,type);
 $("li-note-edit").disabled=false;$("li-note-delete").disabled=false;
 $("li-note-detail-title").dataset.liNoTranslate="";
 $("li-note-detail-body").dataset.liNoTranslate="";
 $("li-note-detail-kind").textContent=type==="case"?"BÚT KÝ · CASE ĐÃ GIẢI":"Ý ĐÃ NHẶT · CHƯA XÁC MINH";
 $("li-note-detail-title").textContent=titleOf(note,type);
 $("li-note-detail-status").textContent=type==="case"?t("Phản Chứng ·")+" "+t(note.correct?"Đã chọn nhận định phù hợp":"Đã chọn nhận định cần xem lại"):t("Ý tưởng cá nhân · Chưa xác minh");
 $("li-note-body-heading").textContent=type==="case"?"Luận kết hiện tại":"Ý tưởng hiện tại";
 $("li-note-detail-body").textContent=bodyOf(note,type);
 const en=window.liLanguage?.get?.()==="en";
 $("li-note-detail-date").textContent=(en?"Created: ":"Tạo: ")+stamp(note.savedAt)+(note.updatedAt?(en?" · Edited: ":" · Sửa: ")+stamp(note.updatedAt):"")+" · "+history.length+(en?(history.length===1?" version":" versions"):" phiên bản");
 [...history].reverse().forEach((v,index)=>{
  const block=element(historyRoot,"article","library-version-entry");
  const heading=element(block,"div","library-version-heading");
  element(heading,"strong","", (en?"Version ":"Phiên bản ")+v.version+(index===0?(en?" · Current":" · Hiện tại"):""));
  const change=v.change||"Chỉnh sửa";
  const enChange=change==="Bản gốc"?"Original":change==="Chỉnh sửa"?"Edited":change.replace(/^Khôi phục phiên bản (\d+)$/,"Restored version $1");
  element(heading,"span","small",stamp(v.at)+" · "+(en?enChange:change));
  if(v.title!==titleOf(note,type)){
   const label=element(block,"p","small",en?"Title at the time: ":"Tiêu đề lúc đó: ");
   const userTitle=element(label,"span","",v.title);
   userTitle.dataset.liNoTranslate="";
  }
  element(block,"p","library-entry-body",v.body);
  if(index>0){
   const restore=element(block,"button","library-text-link","Khôi phục phiên bản này");
   restore.type="button";
   restore.addEventListener("click",()=>{
    if(!window.confirm((en?"Restore version ":"Khôi phục phiên bản ")+v.version+(en?"? This creates a new version and preserves the history.":"? Một phiên bản mới sẽ được tạo, lịch sử cũ được giữ nguyên.")))return;
    const previous=current();if(!previous)return;
    if(!saveVersion(active.type,active.id,v.title,v.body,"Khôi phục phiên bản "+v.version)){
     toast("Không lưu được phiên bản khôi phục. Lịch sử vẫn giữ nguyên.");return;
    }
    refreshAfterChange();toast("Đã khôi phục thành phiên bản mới.");
   });
  }
 });
 notifyReactNote();
}
$("li-note-edit").addEventListener("click",()=>{
 const note=current();if(!note)return;
 $("li-note-editor-title").value=titleOf(note,active.type);
 $("li-note-editor-body").value=bodyOf(note,active.type);
 $("li-note-edit-status").textContent="";
 $("li-note-editor").hidden=false;
 $("li-note-editor-title").focus();
 $("li-note-editor").scrollIntoView?.({block:"nearest",behavior:"smooth"});
});
$("li-note-cancel").addEventListener("click",()=>{
 $("li-note-editor").hidden=true;$("li-note-edit").focus();
});
$("li-note-save").addEventListener("click",()=>{
 const note=current();if(!note)return;
 const title=$("li-note-editor-title").value.trim(),body=$("li-note-editor-body").value.trim();
 const minimum=active.type==="case"?12:3;
 if(!title||title.length>180||body.length<minimum||body.length>5000){
  $("li-note-edit-status").textContent="Tiêu đề cần 1–180 ký tự; nội dung cần "+minimum+"–5.000 ký tự.";return;
 }
 if(title===titleOf(note,active.type)&&body===bodyOf(note,active.type)){
  $("li-note-editor").hidden=true;toast("Chưa có thay đổi; không tạo thêm phiên bản.");return;
 }
 if(!saveVersion(active.type,active.id,title,body,"Chỉnh sửa")){
  $("li-note-edit-status").textContent="Lưu thất bại. Nội dung vẫn trong ô sửa, hãy sao chép để tránh mất.";return;
 }
 refreshAfterChange();toast("Đã lưu phiên bản mới; bản cũ vẫn nằm trong lịch sử.");
});
/* One delete path for the collection row and detail icon: same confirmation,
   persisted removal, 7-second Undo and rollback on storage failure. */
function deleteNote(type,id,confirmed=false){
 const arr=listFor(type),index=arr?.findIndex(item=>item.id===id);
 if(!arr||index<0||liStorageError)return false;
 const note=arr[index];
 if(!confirmed&&!window.confirm("Xóa ghi chép này và toàn bộ lịch sử phiên bản? Bạn có 7 giây để hoàn tác."))return false;
 arr.splice(index,1);
 if(!liWriteState()){
  arr.splice(index,0,note);
  toast("Không thể xóa ghi chép; dữ liệu được giữ nguyên.");
  return false;
 }
 const showingDetail=active?.type===type&&active?.id===id;
 if(showingDetail)active=null;
 window.liLibraryShelf?.renderHome();
 window.liLibraryShelf?.renderCollection();
 if(showingDetail)navigate("collection");
 toast("Đã xóa ghi chép và lịch sử phiên bản.",{undo:()=>{
  if(arr.some(item=>item.id===note.id))return true;
  const at=Math.min(index,arr.length);arr.splice(at,0,note);
  if(!liWriteState()){arr.splice(at,1);return false;}
  window.liLibraryShelf?.renderHome();window.liLibraryShelf?.renderCollection();return true;
 }});
 return true;
}
$("li-note-delete").addEventListener("click",()=>{
 if(active)deleteNote(active.type,active.id);
});
window.addEventListener?.("li:localechange",()=>{if(active&&$("li-note-editor").hidden)renderDetail();});

/* A single authored-note owner. React renders the current item, source proof
 * and revisions from this exact closure; no second version ledger or write key. */
function notifyReactNote(){
 if(typeof window.dispatchEvent==="function"&&typeof Event==="function")
  window.dispatchEvent(new Event("li:note-view-changed"));
}
/* React's note adapter derives its snapshot directly from stored data.
 * The legacy case (without a snapshot) is explicitly a reconstruction. */
const legacyCase={
 question:"90% trả lời hài lòng. Chúng ta nên kết luận thế nào?",
 scene:"Câu hỏi then chốt: người nào được chọn để khảo sát, người nào không được đại diện?",
 options:[
  {key:"right",text:"Kết quả đúng với những người tham gia mẫu này, chưa suy rộng."},
  {key:"wrong",text:"90% của mọi người chắc chắn đều hài lòng."}
 ]
};
function caseContext(note,type){
 if(type!=="case")return null;
 const sourceKey=note.caseKey||note.caseSnapshot?.id||"";
 const known=sourceKey==="sampling-bias-90"||/Sampling Bias/i.test(note.title||"")||
  (Array.isArray(note.versions)&&note.versions.some(v=>/Sampling Bias/i.test(v?.title||"")));
 const snapshot=note.caseSnapshot;
 const recorded=Boolean(snapshot&&typeof snapshot.question==="string"&&snapshot.question&&
  Array.isArray(snapshot.options));
 if(!recorded&&!known)return null;
 const source=recorded?snapshot:legacyCase;
 const options=source.options.filter(item=>item&&typeof item.text==="string");
 const selected=recorded?(source.selectedKey||""):(note.correct?"right":"wrong");
 const selectedText=source.selectedText||options.find(x=>x.key===selected)?.text||
  ui("Không có dữ liệu lựa chọn","No selected answer recorded");
 return {
  question:t(source.question),scene:t(source.scene||""),
  options:options.map(x=>({text:t(x.text),selected:x.key===selected})),
  choice:ui(recorded?"Lựa chọn của bạn: ":"Lựa chọn suy ra từ trạng thái đúng/sai: ",
   recorded?"Your selected answer: ":"Answer inferred from the correct/incorrect status: ")+t(selectedText),
  feedback:recorded?(source.feedback||ui("Bản lưu không có nội dung phản hồi.","No feedback was stored.")):
   ui("Bản lưu cũ không chứa phản hồi khi bạn chọn đáp án.","This older record did not save the feedback shown when you answered."),
  provenance:recorded?
   ui("Đề bài, lựa chọn và phản hồi được ghi cùng luận kết. Chỉnh sửa luận kết không thay đổi bản chụp case.",
    "The question, answer and feedback were stored with this conclusion; editing does not alter the snapshot."):
   ui("Bản lưu cũ chỉ có luận kết và đúng/sai. Đề bài hiện hành được dựng lại; lựa chọn là suy ra, không phải dữ liệu lịch sử.",
    "This old entry only stored a conclusion and correctness. The current case is reconstructed, and the answer is inferred, not historic.")
 };
}
function getView(){
 const note=current();
 if(!active||!note)return {
  id:null,type:null,backRoute,title:ui("Không tìm thấy ghi chép","Note not found"),body:"",
  history:[],context:null,storageAvailable:!liStorageError
 };
 const type=active.type,history=historyFor(note,type),context=caseContext(note,type);
 return {
  id:active.id,type,title:titleOf(note,type),body:bodyOf(note,type),
  status:type==="case"?
   t("Phản Chứng ·")+" "+t(note.correct?"Đã chọn nhận định phù hợp":"Đã chọn nhận định cần xem lại"):
   t("Ý tưởng cá nhân · Chưa xác minh"),
  kind:type==="case"?ui("BÚT KÝ · CASE ĐÃ GIẢI","CASE NOTE · COMPLETED CASE"):
   ui("Ý ĐÃ NHẶT · CHƯA XÁC MINH","CAPTURED IDEA · UNVERIFIED"),
  bodyTitle:type==="case"?ui("Luận kết hiện tại","Current conclusion"):ui("Ý tưởng hiện tại","Current idea"),
  date:ui("Tạo: ","Created: ")+stamp(note.savedAt)+
   (note.updatedAt?ui(" · Sửa: "," · Edited: ")+stamp(note.updatedAt):"")+
   " · "+history.length+ui(" phiên bản",history.length===1?" version":" versions"),
  history:history.map(v=>({...v})),context,backRoute,
  fieldId:(type==="case"?canonicalCaseField(note):null)||note.fieldId||null,
  storageAvailable:!liStorageError,
  bookmarked:context?Boolean(window.liBookmarks?.isSaved("case",note.caseKey||note.caseSnapshot?.id||"sampling-bias-90")):false
 };
}
function saveFromReact(title,body,baseVersion,fieldId){
 const note=current();if(!note)return {ok:false,message:ui("Ghi chép không còn tồn tại.","Note no longer exists.")};
 if(liStorageError)return {ok:false,message:ui("Không đọc được dữ liệu cá nhân.","Personal data cannot be read.")};
 title=String(title||"").trim();body=String(body||"").trim();
 const minimum=active.type==="case"?12:3;
 const assigned=(active.type==="case"?canonicalCaseField(note):null)||
  (fieldId===undefined?(note.fieldId||null):(fieldId||null));
 const allowedFields=window.liTaxonomyFieldIds||
  (window.LI_CATALOG_DATA||[]).flatMap(group=>group.fields.map(field=>field.id));
 if(assigned&&!allowedFields.includes(assigned))
  return {ok:false,message:ui("Chuyên ngành không hợp lệ.","Invalid field.")};
 if(!title||title.length>180||body.length<minimum||body.length>5000)
  return {ok:false,message:"Tiêu đề cần 1–180 ký tự; nội dung cần "+minimum+"–5.000 ký tự."};
 if(Number.isInteger(baseVersion)&&historyFor(note,active.type).length!==baseVersion)
  return {ok:false,message:ui("Bản ghi đã thay đổi. Hãy sao chép nháp rồi mở lại để tránh ghi đè.","Record changed. Copy your draft before refreshing.")};
 if(title===titleOf(note,active.type)&&body===bodyOf(note,active.type)&&assigned===(note.fieldId||null))
  return {ok:true,changed:false,message:ui("Không có thay đổi; không tạo phiên bản.","No changes; no version added.")};
 if(!saveVersion(active.type,active.id,title,body,"Chỉnh sửa",assigned))
  return {ok:false,message:ui("Lưu thất bại. Nháp vẫn còn trong ô sửa.","Save failed; draft kept.")};
 refreshAfterChange();toast("Đã lưu phiên bản mới; bản cũ vẫn nằm trong lịch sử.");
 return {ok:true,changed:true,message:ui("Đã lưu phiên bản mới.","Saved a new version.")};
}
function restoreFromReact(version,confirmed=false){
 const note=current();if(!note||liStorageError)return false;
 const record=historyFor(note,active.type).find(item=>item.version===version);
 if(!record||record.version===historyFor(note,active.type).length)return false;
 if(!confirmed&&!window.confirm(ui("Khôi phục phiên bản ","Restore version ")+version+
  ui("? Một phiên bản mới sẽ được tạo; lịch sử cũ được giữ nguyên.","? A new version will be created; history stays intact.")))return false;
 if(!saveVersion(active.type,active.id,record.title,record.body,"Khôi phục phiên bản "+version)){
  toast("Không lưu được phiên bản khôi phục. Lịch sử vẫn giữ nguyên.");return false;
 }
 refreshAfterChange();toast("Đã khôi phục thành phiên bản mới.");return true;
}
window.liNotes=Object.freeze({openDetail,renderDetail,deleteNote,deleteFromReact:(type,id)=>deleteNote(type,id,true),getView,saveFromReact,restoreFromReact});
})();
