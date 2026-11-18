"use strict";
/* UX-IA-06 · Save/Unsave changes bookmark membership, never the authored case. */
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
class Button{
 constructor(kind,id){this.dataset={liBookmarkKind:kind,liBookmarkId:id};this.attributes={};this.disabled=false;this.textContent="";this.handlers={};}
 setAttribute(key,value){this.attributes[key]=value;}
 closest(selector){return selector.includes("data-li-bookmark-kind")?this:null;}
}
const buttons=[new Button("lesson","L03-1-2"),new Button("lesson","L09-1-2"),new Button("case","sampling-bias-90"),new Button("lesson","L15-2-2")];
const handlers={},savedContent=[],messages=[],calls=[],undoActions=[];
const processedCases=[{id:"existing",title:"90% người dùng hài lòng — Sampling Bias",revision:"Luận kết cũ",correct:true,versions:[{version:1,title:"Case",body:"Luận kết cũ",at:"2026-11-18"}]}];
let writable=true;
const context={
 document:{querySelectorAll:selector=>selector==="[data-li-bookmark-kind][data-li-bookmark-id]"?buttons:[],addEventListener:(type,cb)=>handlers[type]=cb},
 window:{liLibraryShelf:{renderResume:()=>calls.push("render")}},
 savedContent,processedCases,liStorageError:false,liWriteState:()=>writable,
 toast:(msg,opts)=>{messages.push(msg);if(opts?.undo)undoActions.push(opts.undo);},Date,console
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,"../site/assets/library-bookmarks.js"),"utf8"),context);
const api=context.window.liBookmarks;
assert(api,"controller attached");
assert.equal(buttons[0].attributes["aria-label"],"Lưu bài L03-1-2");
assert.match(buttons[0].innerHTML,/<svg/,"button shows icon");
assert.equal(buttons[0].textContent,"","no visible text label");
assert.equal(buttons[2].attributes["aria-label"],"Lưu case");
assert.equal(api.toggle("lesson","L09-1-2"),true);
assert.equal(buttons[1].attributes["aria-label"],"Bỏ lưu bài L09-1-2");
assert.equal(buttons[1].attributes["aria-pressed"],"true");
assert.equal(savedContent[0].id,"L09-1-2");
assert.equal(api.toggle("case","sampling-bias-90"),true);
assert.equal(savedContent.length,2);
assert.equal(buttons[2].attributes["aria-label"],"Bỏ lưu case");
assert.equal(api.toggle("lesson","L99-unpublished"),false,"no unpublished material can be bookmarked");
assert.equal(savedContent.length,2);
assert.equal(api.toggle("lesson","L09-1-2"),true,"saved lesson can be unsaved");
assert.equal(savedContent.length,1);
assert.equal(buttons[1].attributes["aria-pressed"],"false");
assert.equal(api.toggle("case","sampling-bias-90"),true,"case can be unsaved independently");
assert.equal(savedContent.length,0);
assert.equal(undoActions.length,2,"both lesson and case unsave offer Undo");
assert.equal(undoActions[1](),true,"Undo succeeds for case");
assert.equal(savedContent.length,1,"Undo restores case bookmark");
assert.equal(savedContent[0].type,"case");
assert.equal(api.toggle("case","sampling-bias-90"),true,"second unsave for rollback test");
assert.equal(savedContent.length,0);
assert.equal(processedCases[0].revision,"Luận kết cũ","unsaving case does not erase Bút Ký");
assert.equal(processedCases[0].versions.length,1,"unsaving case does not erase history");
writable=false;
assert.equal(api.toggle("lesson","L03-1-2"),false);
assert.equal(savedContent.length,0,"failed local save rolls back");
assert.equal(buttons[0].attributes["aria-label"],"Lưu bài L03-1-2");
assert.match(buttons[0].innerHTML,/<svg/,"button shows icon");
assert.equal(buttons[0].textContent,"","no visible text label");
writable=true;
let prevented=false;
handlers.click({target:buttons[3],preventDefault:()=>prevented=true});
assert(prevented,"native button click handled");
assert.equal(savedContent.length,1);
assert.equal(savedContent[0].id,"L15-2-2");
assert.equal(api.toggle("lesson","L15-2-2"),true,"lesson can be removed");
assert.equal(savedContent.length,0);
assert.equal(undoActions.at(-1)(),true,"lesson Undo restores exact bookmark");
assert.equal(savedContent[0].id,"L15-2-2");
assert.equal(buttons[3].attributes["aria-pressed"],"true");
assert(calls.length>=5);
console.log("PASS UX-IA-06: save/unsave lesson/case, button states, safe rejection, rollback, preserved case/version history");
