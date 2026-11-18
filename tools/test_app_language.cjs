/* S163 global locale regression without third-party dependencies.
   Checks one app preference, Settings control, restored preference, shared events
   and authored Wave1 locale wiring. Does not claim full translation QA. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.resolve(__dirname,"..");
const source=name=>fs.readFileSync(path.join(base,name),"utf8");
const code=source("site/assets/app-language.js");
const index=source("site/index.html"),css=source("site/assets/catalog-drilldown.css");
const langCss=source("site/assets/app-language.css");
assert(index.includes("assets/app-language.js?v="));
assert(index.includes("assets/app-language.css?v="));
assert(index.indexOf("assets/app-language.js?v=")<index.indexOf("const methods="),"Global locale must initialize before app and lesson scripts");
assert(css.includes(".catalog-chapter-fab{"));
assert(css.includes("position:fixed"));
assert(!css.includes(".catalog-chapter-trigger{"),"FAB should replace the in-flow trigger");
assert(langCss.includes(".l09-lang-switch{display:none!important}"),"Duplicate local language controls remain hidden");
for(const path of ["site/assets/lesson-l09-hifi.js","site/assets/lesson-wave1-core.js"]){
 const script=source(path);
 assert(script.includes('window.liLanguage.get()'),"Global preference must override legacy lesson-local locale: "+path);
 assert(script.includes('window.addEventListener?.("li:localechange"'),"Wave1 must rerender from global changes: "+path);
 assert(script.includes("window.liLanguage.set("),"Lesson toggle must delegate to global setter: "+path);
}
assert(source("site/assets/catalog-drilldown.js").includes('li:localechange'),"Catalog must respond to app locale");
class El{
 constructor(tag){this.tagName=tag.toUpperCase();this.nodeType=1;this.children=[];this.dataset={};this.attrs={};this.listeners={};this.parentElement=null;this.textContent="";}
 append(...items){for(const c of items){c.parentElement=this;this.children.push(c)}}
 prepend(item){item.parentElement=this;this.children.unshift(item)}
 setAttribute(k,v){this.attrs[k]=String(v)}
 hasAttribute(k){return Object.hasOwn(this.attrs,k)}
 getAttribute(k){return this.attrs[k]??null}
 addEventListener(name,callback){this.listeners[name]=callback}
 closest(){return null}
 descendants(){return this.children.flatMap(c=>[c,...(c.descendants?.()||[])])}
}
const body=new El("body"),settings=new El("div");
body.append(settings);
const labelNode={nodeType:3,nodeValue:"Tàng Thư",parentElement:body};
body.append(labelNode);
const document={
 body,documentElement:{lang:"vi"},title:"",
 querySelector:sel=>sel==="#page-settings .settings-group-grid"?settings:null,
 querySelectorAll:sel=>sel==="[data-li-app-locale]"?body.descendants().filter(x=>x.dataset?.liAppLocale):[],
 createElement:tag=>new El(tag),
 createTreeWalker(root){const nodes=root.descendants();let index=0;return {nextNode:()=>nodes[index++]||null}}
};
const state=new Map([["li.app.locale.v1","en"]]);
const localStorage={getItem:key=>state.get(key)||null,setItem:(key,val)=>{state.set(key,String(val))}};
const events=[];
const window={dispatchEvent:event=>events.push(event),liLanguage:null};
class CustomEvent{constructor(type,options){this.type=type;this.detail=options.detail}}
vm.runInNewContext(code,{window,document,localStorage,CustomEvent,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},console});
assert.equal(window.liLanguage.get(),"en","Previously chosen locale restored");
assert.equal(document.documentElement.lang,"en","Root document language reflects global setting");
assert.equal(document.title,"理 · li. — Library of Knowledge");
assert.equal(labelNode.nodeValue,"Library","Primary navigation UI follows app locale");
const controls=body.descendants().filter(x=>x.dataset?.liAppLocale);
assert.equal(controls.length,2,"Exactly two locale choices in global Settings");
assert.equal(controls.find(x=>x.dataset.liAppLocale==="en").attrs["aria-pressed"],"true");
controls.find(x=>x.dataset.liAppLocale==="vi").listeners.click();
assert.equal(localStorage.getItem("li.app.locale.v1"),"vi");
assert.equal(document.documentElement.lang,"vi");
assert.equal(labelNode.nodeValue,"Tàng Thư");
assert.equal(events.at(-1).detail.locale,"vi");
controls.find(x=>x.dataset.liAppLocale==="en").listeners.click();
assert.equal(window.liLanguage.get(),"en");
assert.equal(events.at(-1).detail.locale,"en");
assert.equal(window.liLanguage.translate("Đại Sảnh"),"Great Hall");
assert.equal(window.liLanguage.translate("Untranslated scholarly source"),"Untranslated scholarly source");
assert.equal(window.liLanguage.set("de"),false,"Unsupported app locale rejected");
assert.equal(events.length,2,"Exactly one app-wide event per actual change");
console.log("PASS S163: shared global VI/EN, persisted Settings control, primary UI translation and all Wave1 listeners");
