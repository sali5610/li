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
const local=new Map(),events=[],routes=[],messages=[],undoActions=[];
const localStorage={getItem:key=>local.has(key)?local.get(key):null,setItem:(key,value)=>local.set(key,value),removeItem:key=>local.delete(key)};
const cases=[
{id:"c1",title:"Cũ",revision:"Kết luận thứ nhất",correct:true,savedAt:"2026-10-01T08:00:00.000Z"},
{id:"c2",title:"Mới",revision:"Kết luận thứ hai",correct:false,savedAt:"2026-11-16T08:00:00.000Z"}
],ideas=[{id:"i1",text:"Một giả thuyết chưa được kiểm chứng",savedAt:"2026-11-17T08:00:00.000Z"}];
const savedQuestions=[{question:"Vì sao?",savedAt:"2026-11-17T08:00:00.000Z"}];
const savedContent=[{type:"lesson",id:"L09-1-2",savedAt:"2026-11-18T08:00:00.000Z"},{type:"case",id:"sampling-bias-90",savedAt:"2026-11-18T07:00:00.000Z"}];
const ctx={
 window:{localStorage,dispatchEvent:e=>events.push(e)},
 document:{getElementById:id=>elements[id]||null,createElement:tag=>new Element(tag),querySelectorAll:()=>filters},
 localStorage,processedCases:cases,collectedIdeas:ideas,savedQuestions,savedContent,
 scenarios:[{question:"Vì sao?",type:"problem"}],
 liWriteState:()=>true,liStorageError:false,liNewId:()=>"i2",
 qIndex:0,renderMirrorItem:()=>{},navigate:route=>routes.push(route),toast:(msg,options)=>{messages.push(msg);if(options?.undo)undoActions.push(options.undo);},
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
function findNode(node,predicate){
 if(predicate(node))return node;
 for(const child of node.children||[]){const found=findNode(child,predicate);if(found)return found;}
 return null;
}
const questionRemove=findNode(elements["li-saved-questions"],node=>node.attributes?.["aria-label"]==="Bỏ lưu câu hỏi");
assert(questionRemove,"question has an independent unsave icon");
questionRemove.handlers.click();
assert.equal(savedQuestions.length,0,"question removed from persisted collection model");
assert.equal(undoActions.length,1,"unsave supplies an Undo callback");
assert.equal(undoActions[0](),true,"Undo succeeds");
assert.equal(savedQuestions.length,1,"Undo restores original question");
assert.equal(elements["li-saved-questions"].children.length,2,"question and case displayed again after Undo");
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
console.log("PASS Tủ Riêng v2 + two separated bookmark tabs: lessons only / questions + cases, filters, keyboard focus, saved state");
