"use strict";
/* UX-IA-06 · Case review: exact saved snapshot for new case and honest legacy state. */
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
class Element{
 constructor(name="div",text=""){this.tagName=name;this.textContent=text;this.children=[];this.hidden=false;this.dataset={};this.attributes={};this.handlers={};this.value="";this.disabled=false;}
 append(child){this.children.push(child);}
 replaceChildren(...children){this.children=[...children];}
 addEventListener(name,cb){this.handlers[name]=cb;}
 setAttribute(key,value){this.attributes[key]=value;}
 focus(){}
 scrollIntoView(){}
}
const ids=["page-noteDetail","li-note-detail-title","li-note-detail-kind","li-note-detail-body","li-note-detail-status","li-note-body-heading","li-note-detail-date","li-note-history-list","li-note-editor","li-note-edit","li-note-delete","li-note-editor-title","li-note-editor-body","li-note-edit-status","li-note-save","li-note-cancel","li-note-case-context","li-note-case-bookmark-tools","li-note-case-question","li-note-case-scene","li-note-case-choices","li-note-case-choice","li-note-case-feedback","li-note-case-provenance"];
const el=Object.fromEntries(ids.map(id=>[id,new Element()]));
const choices=[Object.assign(new Element("button","Chỉ áp dụng cho nhóm được khảo sát"),{dataset:{answer:"right"}}),Object.assign(new Element("button","Áp dụng cho tất cả"),{dataset:{answer:"wrong"}})];
const canonical={querySelector:q=>q==="h2"?new Element("h2","90% hài lòng. Kết luận nào hợp lý?"):new Element("p","Chỉ có người dùng hiện tại được hỏi"),querySelectorAll:q=>q==="[data-answer]"?choices:[]};
const now="2026-11-18T04:00:00.000Z";
const cases=[
 {id:"new",title:"90% người dùng hài lòng — Sampling Bias",revision:"Luận kết của mình",correct:true,savedAt:now,caseKey:"sampling-bias-90",caseSnapshot:{id:"sampling-bias-90",question:"Đề bài tại lúc giải",scene:"Mẫu chỉ từ người đang dùng",options:[{key:"right",text:"Chỉ trong mẫu"},{key:"wrong",text:"Mọi người đều thích"}],selectedKey:"right",selectedText:"Chỉ trong mẫu",feedback:"Chính xác cho mẫu"}},
 {id:"old",title:"90% người dùng hài lòng — Sampling Bias",revision:"Bản giải cũ",correct:false,savedAt:"2026-10-01T00:00:00.000Z"}
],ideas=[{id:"idea",text:"Một nhận định",savedAt:now}];
const ctx={
 document:{getElementById:id=>el[id]||null,createElement:t=>new Element(t),querySelector:q=>q==="#page-case .editorial-grid .surface.tinted"?canonical:null},
 window:{confirm:()=>true,liLibraryShelf:{renderHome(){},renderCollection(){}},liBookmarks:{refresh(){},isSaved(){return false;}}},
 processedCases:cases,collectedIdeas:ideas,liStorageError:false,liWriteState:()=>true,
 navigate(){},toast(){},Date,Intl,console
};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,"../site/assets/library-note-editor.js"),"utf8"),ctx);
assert(ctx.window.liNotes.openDetail("case","new"));
assert.equal(el["li-note-case-context"].hidden,false);
assert.equal(el["li-note-case-bookmark-tools"].hidden,false);
assert.equal(el["li-note-case-question"].textContent,"Đề bài tại lúc giải");
assert.equal(el["li-note-case-scene"].textContent,"Mẫu chỉ từ người đang dùng");
assert.equal(el["li-note-case-choices"].children.length,2);
assert.equal(el["li-note-case-choices"].children[0].attributes["data-chosen"],"true");
assert.match(el["li-note-case-choice"].textContent,/Chỉ trong mẫu/);
assert.equal(el["li-note-case-feedback"].textContent,"Chính xác cho mẫu");
assert.match(el["li-note-case-provenance"].textContent,/ghi cùng luận kết/);
assert.equal(el["li-note-detail-body"].textContent,"Luận kết của mình");
ctx.window.liNotes.openDetail("case","old");
assert.match(el["li-note-case-question"].textContent,/90% hài lòng/);
assert.match(el["li-note-case-choice"].textContent,/suy ra từ trạng thái/);
assert.match(el["li-note-case-feedback"].textContent,/không chứa phản hồi/);
assert.match(el["li-note-case-provenance"].textContent,/không phải bản ghi lịch sử nguyên gốc/);
assert.equal(el["li-note-detail-body"].textContent,"Bản giải cũ");
ctx.window.liNotes.openDetail("idea","idea");
assert.equal(el["li-note-case-context"].hidden,true,"ideas do not inherit case prompt");
assert.equal(el["li-note-case-bookmark-tools"].hidden,true,"ideas do not have case bookmarks");
// React note detail must get its source from the stored record, not the now-hidden
// native renderer. Poison native text to catch accidental DOM read-through.
ctx.window.liReactLibraryMounted=true;
el["li-note-case-question"].textContent="STALE HIDDEN HTML";
el["li-note-detail-status"].textContent="STALE HIDDEN STATUS";
assert(ctx.window.liNotes.openDetail("case","new"));
const reactNew=ctx.window.liNotes.getView();
assert.equal(reactNew.context.question,"Đề bài tại lúc giải");
assert.match(reactNew.status,/Phản Chứng/);
assert.equal(reactNew.history.length,1);
assert.notEqual(reactNew.status,"STALE HIDDEN STATUS");
assert(ctx.window.liNotes.openDetail("case","old"));
const reactOld=ctx.window.liNotes.getView();
assert.match(reactOld.context.question,/90% trả lời hài lòng/);
assert.match(reactOld.context.provenance,/dựng lại/);
assert(ctx.window.liNotes.openDetail("idea","idea"));
assert.equal(ctx.window.liNotes.getView().context,null);
console.log("PASS UX-IA-06: exact new case snapshot, honest legacy reconstruction and separate idea note");
