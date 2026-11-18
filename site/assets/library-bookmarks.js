/* UX-IA-06 · Typed private bookmarks for published Wave1 lessons and the
   single published Phản Chứng case. Save is distinct from answer submission. */
(function(){
"use strict";
const LESSONS={"L03-1-2":"lessonL03","L09-1-2":"lessonL09","L15-2-2":"lessonL15"};
const CASES={"sampling-bias-90":"case"};
function valid(type,id){return type==="lesson"?Object.prototype.hasOwnProperty.call(LESSONS,id):type==="case"&&Object.prototype.hasOwnProperty.call(CASES,id);}
function isSaved(type,id){return valid(type,id)&&savedContent.some(item=>item.type===type&&item.id===id);}
function refresh(){
 document.querySelectorAll("[data-li-bookmark-kind][data-li-bookmark-id]").forEach(button=>{
  const type=button.dataset.liBookmarkKind,id=button.dataset.liBookmarkId;
  if(!valid(type,id)){button.disabled=true;return;}
  const saved=isSaved(type,id);
  button.setAttribute("aria-pressed",String(saved));
  button.textContent=saved?(type==="lesson"?"Bỏ lưu bài":"Bỏ lưu case"):(type==="lesson"?"Lưu bài":"Lưu case");
  button.setAttribute("aria-label",button.textContent+(type==="lesson"?" "+id:""));
 });
}
function toggle(type,id){
 if(!valid(type,id))return false;
 if(liStorageError){toast("Không thể đọc dữ liệu lưu trước đây. Chưa thay đổi Dấu Trang.");return false;}
 const prior=savedContent.slice(),index=savedContent.findIndex(item=>item.type===type&&item.id===id);
 const removing=index>=0;
 if(removing)savedContent.splice(index,1);
 else savedContent.unshift({type,id,savedAt:new Date().toISOString()});
 if(!liWriteState()){
  savedContent.splice(0,savedContent.length,...prior);
  refresh();toast("Không lưu được thay đổi trên thiết bị. Dấu Trang vẫn giữ nguyên.");return false;
 }
 refresh();
 window.liLibraryShelf?.renderResume();
 toast(removing?"Đã bỏ lưu "+(type==="lesson"?"bài học.":"case."):("Đã lưu "+(type==="lesson"?"bài học":"case")+" vào Quay lại · Dấu Trang."));
 return true;
}
document.addEventListener("click",event=>{
 const trigger=event.target?.closest?.("[data-li-bookmark-kind][data-li-bookmark-id]");
 if(!trigger||trigger.disabled)return;
 event.preventDefault();
 toggle(trigger.dataset.liBookmarkKind,trigger.dataset.liBookmarkId);
});
window.liBookmarks=Object.freeze({valid,isSaved,toggle,refresh});
refresh();
})();
