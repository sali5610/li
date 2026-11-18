/* Tủ Riêng v3 note edit/history contract. Deterministic DOM model, not real-device QA. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
class Node{
 constructor(tag="div"){this.tagName=tag;this.children=[];this.handlers={};this.dataset={};this.value="";this.hidden=false;this.disabled=false;this.textContent="";}
 append(x){this.children.push(x);}
 replaceChildren(...x){this.children=[...x];}
 addEventListener(name,fn){this.handlers[name]=fn;}
 focus(){}
 scrollIntoView(){}
}
const ids=["page-noteDetail","li-note-detail-title","li-note-detail-kind","li-note-detail-body","li-note-detail-status","li-note-body-heading","li-note-detail-date","li-note-history-list","li-note-editor","li-note-edit","li-note-delete","li-note-editor-title","li-note-editor-body","li-note-edit-status","li-note-save","li-note-cancel"];
const fields=Object.fromEntries(ids.map(id=>[id,new Node()]));
const cases=[{id:"c1",title:"Luận kết gốc",revision:"Mẫu này chưa đại diện tổng thể.",correct:false,savedAt:"2026-11-01T00:00:00.000Z"}];
const ideas=[{id:"i1",text:"Ý chưa có dẫn chứng",savedAt:"2026-11-02T00:00:00.000Z"}];
let canPersist=true,confirmDelete=true,saves=0,refreshes=0;
const routes=[],messages=[],undoActions=[];
const ctx={document:{getElementById:id=>fields[id]||null,createElement:t=>new Node(t)},
 window:{confirm:()=>confirmDelete,liLibraryShelf:{renderHome:()=>refreshes++,renderCollection:()=>refreshes++}},
 processedCases:cases,collectedIdeas:ideas,liStorageError:false,
 liWriteState:()=>{saves++;return canPersist},
 navigate:r=>routes.push(r),toast:(m,options)=>{messages.push(m);if(typeof options?.undo==="function")undoActions.push(options.undo)},
 Date,Intl};
vm.createContext(ctx);
const js=fs.readFileSync(path.join(__dirname,"../site/assets/library-note-editor.js"),"utf8");
vm.runInContext(js,ctx,{timeout:2000});
const api=ctx.window.liNotes;
assert(api,"note editor is registered");
assert.equal(api.openDetail("case","c1"),true);
assert.equal(routes.at(-1),"noteDetail");
assert.equal(fields["li-note-detail-body"].textContent,"Mẫu này chưa đại diện tổng thể.");
assert.equal(fields["li-note-history-list"].children.length,1,"legacy case has v1 snapshot");
fields["li-note-edit"].handlers.click();
assert.equal(fields["li-note-editor-title"].value,"Luận kết gốc");
fields["li-note-editor-title"].value="Luận kết mới";
fields["li-note-editor-body"].value="Mẫu bị lệch vì người không dùng sản phẩm chưa được hỏi.";
fields["li-note-save"].handlers.click();
assert.equal(cases[0].revision,"Mẫu bị lệch vì người không dùng sản phẩm chưa được hỏi.");
assert.equal(cases[0].correct,false,"original case verdict is immutable");
assert.equal(cases[0].versions.length,2);
assert.equal(cases[0].versions[0].body,"Mẫu này chưa đại diện tổng thể.","original case text preserved");
assert.equal(fields["li-note-history-list"].children.length,2);
fields["li-note-edit"].handlers.click();
fields["li-note-editor-body"].value="Không được sửa vì lưu lỗi.";
canPersist=false;
fields["li-note-save"].handlers.click();
assert.equal(cases[0].versions.length,2,"failed write rolls back version");
assert.equal(cases[0].revision,"Mẫu bị lệch vì người không dùng sản phẩm chưa được hỏi.");
canPersist=true;
const original=fields["li-note-history-list"].children[1];
const restore=original.children.at(-1);
restore.handlers.click();
assert.equal(cases[0].versions.length,3,"restore creates new version");
assert.equal(cases[0].revision,"Mẫu này chưa đại diện tổng thể.","restored original text");
assert.equal(cases[0].versions[1].body,"Mẫu bị lệch vì người không dùng sản phẩm chưa được hỏi.","history kept after restore");
api.openDetail("idea","i1");
fields["li-note-edit"].handlers.click();
fields["li-note-editor-title"].value="Ý đã kiểm tra sơ bộ";
fields["li-note-editor-body"].value="Cần tra cứu nguồn gốc nhận định.";
fields["li-note-save"].handlers.click();
assert.equal(ideas[0].versions.length,2,"ideas also keep version history");
assert.equal(ideas[0].versions[0].body,"Ý chưa có dẫn chứng");
fields["li-note-delete"].handlers.click();
assert.equal(ideas.length,0,"delete idea removes record");
assert.equal(cases.length,1,"deleting idea does not touch case");
assert.equal(routes.at(-1),"collection");
api.openDetail("case","c1");
canPersist=false;
fields["li-note-delete"].handlers.click();
assert.equal(cases.length,1,"failed delete restores case");
canPersist=true;
fields["li-note-delete"].handlers.click();
assert.equal(cases.length,0,"confirmed deletion removes case and history");
assert.equal(api.openDetail("case","c1"),false,"deleted case cannot reopen before Undo");
assert.equal(undoActions.at(-1)(),true,"Undo restores deleted note");
assert.equal(cases.length,1,"case restored");
assert.equal(cases[0].versions.length,3,"version history restored");
assert.equal(api.openDetail("case","c1"),true,"case can reopen after Undo");
assert(saves>=7&&refreshes>=4);
console.log("PASS note versions + delete Undo: original case snapshot, v2/v3, full history restoration, rollback");
