/* Personal note review, local revisions and deletion.
   Case verdict is immutable; only authored title/conclusion text can change. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
if(!$("page-noteDetail"))return;
let active=null;
const listFor=type=>type==="case"?processedCases:type==="idea"?collectedIdeas:null;
const current=()=>active&&listFor(active.type)?.find(item=>item.id===active.id)||null;
const titleOf=(item,type)=>type==="case"?item.title:(item.title||"Ý đã nhặt");
const bodyOf=(item,type)=>type==="case"?item.revision:item.text;
const stamp=raw=>{
 const ms=Date.parse(raw);
 return Number.isFinite(ms)?new Intl.DateTimeFormat("vi-VN",{day:"numeric",month:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(ms)):"Không rõ thời gian";
};
function element(parent,tag,cls,value){
 const x=document.createElement(tag);if(cls)x.className=cls;
 if(value!==undefined)x.textContent=String(value);
 parent.append(x);return x;
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
 const back=$("li-note-back");
 if(back)back.dataset.page=dest;
 const label=$("li-note-back-label");
 if(label)label.textContent=dest==="resume"?"Quay lại":dest==="library"?"Tủ Riêng":"Bộ sưu tập";
 $("li-note-editor").hidden=true;
 navigate("noteDetail");
 renderDetail();
 return true;
}
function saveVersion(type,id,title,body,change){
 const arr=listFor(type),index=arr?.findIndex(x=>x.id===id);
 if(!arr||index<0||liStorageError)return false;
 const prior=arr[index],versions=historyFor(prior,type);
 const now=new Date().toISOString();
 const next={...prior,title,updatedAt:now,versions:[...versions,{version:versions.length+1,title,body,at:now,change}]};
 if(type==="case")next.revision=body;else next.text=body;
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
 if(!allowed)return;
 const source=hasSnapshot?note.caseSnapshot:null;
 const root=document.querySelector("#page-case .editorial-grid .surface.tinted");
 const question=source?.question||root?.querySelector("h2")?.textContent?.trim()||"Đề bài gốc không còn trong bản lưu";
 const scene=source?.scene||root?.querySelector("p")?.textContent?.trim()||"";
 const options=source?.options||Array.from(root?.querySelectorAll("[data-answer]")||[]).map(node=>({key:node.dataset.answer,text:node.textContent.trim()}));
 const selection=source?.selectedKey||(note.correct?"right":"wrong");
 const selectedText=source?.selectedText||options.find(x=>x.key===selection)?.text||"Không có dữ liệu lựa chọn";
 const choices=$("li-note-case-choices");choices?.replaceChildren();
 $("li-note-case-question").textContent=question;
 $("li-note-case-scene").textContent=scene;
 for(const option of options){
  const item=element(choices,"div","library-case-choice",option.text);
  if(option.key===selection)item.setAttribute("data-chosen","true");
 }
 $("li-note-case-choice").textContent=(hasSnapshot?"Lựa chọn của bạn: ":"Lựa chọn suy ra từ trạng thái đúng/sai: ")+selectedText;
 $("li-note-case-feedback").textContent=hasSnapshot?
  (source.feedback||"Bản lưu không có nội dung phản hồi.") :
  "Bản lưu cũ không chứa phản hồi khi bạn chọn đáp án.";
 $("li-note-case-provenance").textContent=hasSnapshot?
  "Đề bài, lựa chọn và phản hồi được ghi cùng luận kết. Chỉnh sửa luận kết không thay đổi bản chụp case." :
  "Dữ liệu cũ chỉ lưu luận kết và trạng thái đúng/sai. Đề bài hiện lấy từ case đang xuất bản; lựa chọn được suy ra, không phải bản ghi lịch sử nguyên gốc.";
 window.liBookmarks?.refresh();
}
function renderDetail(){
 if(!$("page-noteDetail"))return;
 const note=current(),historyRoot=$("li-note-history-list");historyRoot.replaceChildren();
 $("li-note-editor").hidden=true;
 if(!note){
  $("li-note-detail-title").textContent="Không tìm thấy ghi chép";
  $("li-note-detail-body").textContent="Ghi chép này không còn trên thiết bị.";
  $("li-note-detail-status").textContent="Không có dữ liệu";
  $("li-note-edit").disabled=true;$("li-note-delete").disabled=true;
  renderCaseContext(null,null);
  return;
 }
 const type=active.type,history=historyFor(note,type);
 renderCaseContext(note,type);
 $("li-note-edit").disabled=false;$("li-note-delete").disabled=false;
 $("li-note-detail-kind").textContent=type==="case"?"BÚT KÝ · CASE ĐÃ GIẢI":"Ý ĐÃ NHẶT · CHƯA XÁC MINH";
 $("li-note-detail-title").textContent=titleOf(note,type);
 $("li-note-detail-status").textContent=type==="case"?"Phản Chứng · "+(note.correct?"Đã chọn nhận định phù hợp":"Đã chọn nhận định cần xem lại"):"Ý tưởng cá nhân · Chưa xác minh";
 $("li-note-body-heading").textContent=type==="case"?"Luận kết hiện tại":"Ý tưởng hiện tại";
 $("li-note-detail-body").textContent=bodyOf(note,type);
 $("li-note-detail-date").textContent="Tạo: "+stamp(note.savedAt)+(note.updatedAt?" · Sửa: "+stamp(note.updatedAt):"")+" · "+history.length+" phiên bản";
 [...history].reverse().forEach((v,index)=>{
  const block=element(historyRoot,"article","library-version-entry");
  const heading=element(block,"div","library-version-heading");
  element(heading,"strong","", "Phiên bản "+v.version+(index===0?" · Hiện tại":""));
  element(heading,"span","small",stamp(v.at)+" · "+(v.change||"Chỉnh sửa"));
  if(v.title!==titleOf(note,type))element(block,"p","small","Tiêu đề lúc đó: "+v.title);
  element(block,"p","library-entry-body",v.body);
  if(index>0){
   const restore=element(block,"button","library-text-link","Khôi phục phiên bản này");
   restore.type="button";
   restore.addEventListener("click",()=>{
    if(!window.confirm("Khôi phục phiên bản "+v.version+"? Một phiên bản mới sẽ được tạo, lịch sử cũ được giữ nguyên."))return;
    const previous=current();if(!previous)return;
    if(!saveVersion(active.type,active.id,v.title,v.body,"Khôi phục phiên bản "+v.version)){
     toast("Không lưu được phiên bản khôi phục. Lịch sử vẫn giữ nguyên.");return;
    }
    refreshAfterChange();toast("Đã khôi phục thành phiên bản mới.");
   });
  }
 });
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
$("li-note-delete").addEventListener("click",()=>{
 const note=current();if(!note)return;
 if(!window.confirm("Xóa vĩnh viễn ghi chép này và toàn bộ lịch sử phiên bản trên thiết bị? Không thể hoàn tác."))return;
 const arr=listFor(active.type),index=arr.findIndex(x=>x.id===note.id);
 if(index<0)return;
 arr.splice(index,1);
 if(!liWriteState()){arr.splice(index,0,note);toast("Không thể xóa ghi chép; dữ liệu được giữ nguyên.");return;}
 active=null;
 window.liLibraryShelf?.renderHome();
 window.liLibraryShelf?.renderCollection();
 navigate("collection");
 toast("Đã xóa ghi chép và lịch sử phiên bản.");
});
window.liNotes=Object.freeze({openDetail,renderDetail});
})();
