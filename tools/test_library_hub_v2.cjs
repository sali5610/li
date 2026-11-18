/* Deterministic, headless contract test for Tủ Riêng IA v2.
   No browser, cloud service, analytics or paid dependency. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
class Element{
 constructor(tag="div"){this.tagName=tag;this.children=[];this.textContent="";this.dataset={};this.attributes={};this.handlers={};this.value="";this.hidden=false;this.disabled=false;this.className="";}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];}
 addEventListener(name,fn){this.handlers[name]=fn;}
 setAttribute(key,value){this.attributes[key]=value;}
 focus(){}
}
const ids=["page-library","page-resume","page-collection","case-archive-preview","li-library-latest-idea","li-library-latest-lesson","li-lesson-history","li-bookmarks-empty","li-saved-questions","li-collection-list","save-capture-note","capture-note"];
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
const filters=["all","case","idea"].map(name=>{const x=new Element("button");x.dataset.collectionFilter=name;return x;});
const local=new Map(),events=[],routes=[],messages=[];
const localStorage={getItem:key=>local.has(key)?local.get(key):null,setItem:(key,value)=>local.set(key,value),removeItem:key=>local.delete(key)};
const cases=[
{id:"c1",title:"Cũ",revision:"Kết luận thứ nhất",correct:true,savedAt:"2026-10-01T08:00:00.000Z"},
{id:"c2",title:"Mới",revision:"Kết luận thứ hai",correct:false,savedAt:"2026-11-16T08:00:00.000Z"}
],ideas=[{id:"i1",text:"Một giả thuyết chưa được kiểm chứng",savedAt:"2026-11-17T08:00:00.000Z"}];
const savedQuestions=[{question:"Vì sao?",savedAt:"2026-11-17T08:00:00.000Z"}];
const ctx={
 window:{localStorage,dispatchEvent:e=>events.push(e)},
 document:{getElementById:id=>elements[id]||null,createElement:tag=>new Element(tag),querySelectorAll:()=>filters},
 localStorage,processedCases:cases,collectedIdeas:ideas,savedQuestions,
 scenarios:[{question:"Vì sao?",type:"problem"}],
 liWriteState:()=>true,liStorageError:false,liNewId:()=>"i2",
 qIndex:0,renderMirrorItem:()=>{},navigate:route=>routes.push(route),toast:msg=>messages.push(msg),
 CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},
 console,Intl,Date
};
const code=fs.readFileSync(path.join(__dirname,"../site/assets/library-hub.js"),"utf8");
vm.createContext(ctx);vm.runInContext(code,ctx);
const shelf=ctx.window.liLibraryShelf;
assert(shelf,"library controller registers");
shelf.renderHome();
assert.equal(elements["case-archive-preview"].children.length,1,"only one latest Bút Ký preview");
assert.equal(elements["li-library-latest-idea"].children.length,1,"only one latest Ý đã nhặt preview");
assert.equal(elements["case-archive-preview"].children[0].children[0].textContent,"Mới","preview chooses latest saved case");
assert.equal(elements["li-library-latest-idea"].children[0].children[1].textContent,ideas[0].text);
assert.equal(elements["li-library-latest-lesson"].children.length,2,"honest empty lesson state and catalog CTA");
assert.equal(elements["li-saved-questions"].children.length,0,"no bookmarks rendered outside Quay lại");
shelf.trackLesson("lessonL09");
shelf.trackLesson("lessonL03");
shelf.trackLesson("lessonL09");
shelf.trackLesson("unsupportedRoute");
shelf.renderHome();
assert.equal(elements["li-library-latest-lesson"].children.length,1,"one last visited lesson only");
assert.match(elements["li-library-latest-lesson"].children[0].children[0].children[0].textContent,/Sampling Bias/);
shelf.renderResume();
assert.equal(elements["li-lesson-history"].children.length,2,"two distinct recent lessons in full list");
assert.equal(elements["li-saved-questions"].children.length,1,"bookmarks in Quay lại details");
assert.equal(elements["li-bookmarks-empty"].hidden,true);
shelf.renderCollection();
assert.equal(elements["li-collection-list"].children.length,3,"full combined Bút Ký / Ý list");
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
console.log("PASS Tủ Riêng v2: single-item previews, true visit order, full lists, bookmarks, filters, saved ideas and activity event");
