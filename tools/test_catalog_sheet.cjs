/* Regression for S160.3 Chapter side sheet, with a deterministic DOM fixture.
   No packages/browser needed; visual/device acceptance remains a separate gate. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=name=>fs.readFileSync(path.join(root,"site/assets",name),"utf8");
const manifest={window:{}};
vm.runInNewContext(source("catalog-curriculum-data.js"),manifest);
const css=source("catalog-drilldown.css"),script=source("catalog-drilldown.js");
assert(css.includes(".catalog-sheet-layer{position:fixed;inset:0"));
assert(css.includes(".catalog-sheet-layer[hidden]"));
assert(css.includes(".catalog-chapter-sheet{"));
assert(css.includes("inset-inline-start:calc(var(--li-space-4)"),"Lesson menu FAB must stay anchored to viewport left");
assert(css.includes("inset-block-end:calc(92px"),"Lesson menu FAB must sit above mobile bottom nav");
assert(css.includes("inset-inline-start:0!important"),"Chapter drawer must open from the left");
assert(css.includes(".catalog-chapter-fab[aria-expanded=\"true\"]"),"Floating trigger must not sit above open modal");
assert(css.includes("border-bottom:1px solid var(--rule)"),"Chapter navigation uses editorial rows, not button boxes");
assert(!css.includes(".catalog-native-frame"),"The original grid-wrapped first card must stay deleted");
assert(!script.includes("catalog-native-frame"),"No in-flow native chapter card");
assert(!script.includes("catalog-draft-chapters"),"No false chapter card in draft lesson");
class El{
 constructor(tag){
  this.tagName=tag.toUpperCase();this.id="";this.className="";this.dataset={};
  this.attributes={};this.children=[];this.parentElement=null;this.listeners={};
  this.hidden=false;this.disabled=false;this.style={};this.textContent="";
  this.classList={
   contains:key=>this.className.split(/\s+/).includes(key),
   add:key=>{if(!this.classList.contains(key))this.className=(this.className+" "+key).trim();},
   toggle:(key,on)=>{const arr=this.className.split(/\s+/).filter(Boolean),want=on===undefined?!arr.includes(key):Boolean(on);this.className=(want?[...new Set([...arr,key])]:arr.filter(x=>x!==key)).join(" ");return want;}
  };
 }
 append(...elements){
  for(const child of elements){
   if(child.parentElement)child.parentElement.children=child.parentElement.children.filter(x=>x!==child);
   child.parentElement=this;this.children.push(child);
  }
 }
 prepend(child){
  if(child.parentElement)child.parentElement.children=child.parentElement.children.filter(x=>x!==child);
  child.parentElement=this;this.children.unshift(child);
 }
 before(node){
  assert(this.parentElement);
  const p=this.parentElement,i=p.children.indexOf(this);
  if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(x=>x!==node);
  node.parentElement=p;p.children.splice(i,0,node);
 }
 replaceChildren(...children){for(const child of this.children)child.parentElement=null;this.children=[];this.append(...children);}
 setAttribute(k,v){this.attributes[k]=String(v);}
 removeAttribute(k){delete this.attributes[k];}
 getAttribute(k){return this.attributes[k]??null;}
 addEventListener(k,fn){this.listeners[k]=fn;}
 removeEventListener(k,fn){if(this.listeners[k]===fn)delete this.listeners[k];}
 focus(){document.activeElement=this;}
 scrollIntoView(){this.wasScrolled=true;}
 getClientRects(){return [{}];}
 contains(node){return this===node||this.children.some(c=>c.contains(node));}
 descendants(){return this.children.flatMap(c=>[c,...c.descendants()]);}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
 querySelectorAll(sel){
  const all=this.descendants();
  if(sel==="button:not([disabled]),a[href]")return all.filter(x=>(x.tagName==="BUTTON"&&!x.disabled)||(x.tagName==="A"&&x.getAttribute("href")));
  if(sel==='a[href^="#"]')return all.filter(x=>x.tagName==="A"&&x.getAttribute("href")?.startsWith("#"));
  if(sel==="h2")return all.filter(x=>x.tagName==="H2");
  if(sel.startsWith("."))return all.filter(x=>x.classList.contains(sel.slice(1)));
  return [];
 }
 closest(sel){
  if(sel==='a[href^="#"]'&&this.tagName==="A"&&this.getAttribute("href")?.startsWith("#"))return this;
  if(sel==="button[data-catalog-kind]"&&this.tagName==="BUTTON"&&this.dataset.catalogKind)return this;
  return null;
 }
}
const catalogHost=new El("div"),pages={},sectionsByPage={};
function makeLesson(route,prefix){
 const page=new El("section");page.id="page-"+route;page.className="page active";
 const shell=new El("div");shell.className="section-shell";page.append(shell);
 const heading=new El("h1");heading.className="library-lesson-heading";shell.append(heading);
 const layout=new El("div");layout.className="editorial-grid";shell.append(layout);
 const stack=new El("div");stack.className="l09-stack";layout.append(stack);
 const sidebar=new El("aside");sidebar.className="l09-sidebar";layout.append(sidebar);
 const nav=new El("nav");nav.className="l09-index";sidebar.append(nav);
 const sections=[];
 ["goals","theory","sources"].forEach((name,i)=>{
  const article=new El("article");article.id=prefix+"-"+name;
  const title=new El("h2");title.textContent="Section "+(i+1);article.append(title);
  stack.append(article);sections.push(article);
  const a=new El("a");a.textContent="Section "+(i+1);a.setAttribute("href","#"+article.id);nav.append(a);
 });
 pages[page.id]=page;sectionsByPage[route]={page,shell,layout,stack,sidebar,nav,sections};
}
makeLesson("lessonL03","l03");makeLesson("lessonL09","l09");makeLesson("lessonL15","l15");
let loc=new URL("https://sali5610.github.io/li/?lesson=L09-1-2");
const location={get href(){return loc.href},get pathname(){return loc.pathname},get search(){return loc.search}};
const history={state:null,pushState(_s,_t,path){loc=new URL(path,loc);},replaceState(_s,_t,path){loc=new URL(path,loc);}};
const listeners={};
const document={
 activeElement:null,
 createElement:tag=>new El(tag),
 querySelector:sel=>sel==="#page-catalog .section-shell"?catalogHost:null,
 getElementById:id=>pages[id]||Object.values(sectionsByPage).flatMap(v=>v.sections).find(x=>x.id===id)||null,
 addEventListener:(type,cb)=>{listeners[type]=cb;},
 removeEventListener:(type,cb)=>{if(listeners[type]===cb)delete listeners[type];}
};
const window={
 LI_CATALOG_DATA:manifest.window.LI_CATALOG_DATA,
 history,location,localStorage:{getItem:()=>null},
 navigate(){},matchMedia:()=>({matches:false}),lucide:{createIcons(){}},addEventListener(){}
};
const ctx={document,window,location,history,localStorage:window.localStorage,URL,MutationObserver:class{observe(){}},console};
vm.runInNewContext(script,ctx);
for(const route of ["lessonL03","lessonL09","lessonL15"]){
 const {page,shell,layout,stack,sidebar,nav,sections}=sectionsByPage[route];
 assert.equal(page.dataset.catalogChapterNav,"ready",route+" sheet mounted");
 assert.equal(layout.parentElement,shell,route+" original editorial grid retained");
 assert.deepEqual(layout.children,[stack,sidebar],route+" original two columns retained");
 assert.equal(shell.children.filter(x=>x.classList.contains("catalog-native-toolbar")).length,1);
 const toolbar=shell.querySelector(".catalog-native-toolbar");
 const layer=page.querySelector(".catalog-sheet-layer");
 const sheet=page.querySelector(".catalog-chapter-sheet");
 assert(layer&&sheet&&layer.hidden,route+" sheet starts closed");
 assert.equal(sheet.getAttribute("role"),"dialog");
 assert.equal(sheet.getAttribute("aria-modal"),"true");
 assert.equal(nav.parentElement,sheet,route+" chapter links moved into sheet");
 assert(!layout.contains(sheet),"Chapter sheet must never be first card in lesson grid");

 const trigger=page.querySelector(".catalog-chapter-fab");
 assert(trigger&&trigger.parentElement===page,route+" FAB is fixed to the lesson page, not an in-flow toolbar child");
 assert.equal(trigger.getAttribute("aria-label"),"Mục lục chương");
 assert(!layout.contains(trigger),"FAB must never enter lesson flow");
 const close=sheet.querySelector(".catalog-sheet-close");
 const prev=toolbar.querySelector(".catalog-chapter-step");
 const next=toolbar.querySelector(".catalog-inline-steps").children[1];
 trigger.focus();trigger.listeners.click();
 assert.equal(layer.hidden,false,route+" drawer opens");
 assert.equal(trigger.getAttribute("aria-expanded"),"true");
 assert.equal(document.activeElement,close,route+" focus enters sheet");
 close.listeners.click();
 assert(layer.hidden,route+" close returns to lesson");
 assert.equal(document.activeElement,trigger,route+" focus restored");
 trigger.listeners.click();
 assert.equal(typeof listeners.keydown,"function");
 listeners.keydown({key:"Escape",preventDefault(){}});
 assert(layer.hidden,route+" escape closes");
 trigger.listeners.click();
 nav.listeners.click({target:nav.children[1],preventDefault(){},stopPropagation(){}});
 assert(layer.hidden,route+" selecting chapter closes sheet");
 assert(sections[0].hidden&&!sections[1].hidden&&sections[2].hidden,route+" focus shows exact chapter");
 assert.equal(prev.disabled,false);
 assert.equal(next.disabled,false);
 if(route==="lessonL15")assert.equal(new URL(location.href).searchParams.get("chapter"),"l15-theory");
 next.listeners.click();
 assert(sections[2].hidden===false,route+" next chapter works from the lesson toolbar");
 assert(next.disabled,route+" last chapter disables next");
 trigger.listeners.click();
 sheet.querySelector(".catalog-chapter-all").listeners.click();
 assert(sections.every(x=>x.hidden===false),route+" all-sections restores the lesson");
 assert(layer.hidden);
}
console.log("PASS S160.3: 3 native lessons, off-canvas left sheet, original grid, open/close/focus/Escape, URL & chapter pager");
