/* Tàng Thư IA regression: manifest source counts, no draft leaks, truthful
   course completion, breadcrumb drill-down and browser route. No dependencies. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,"site/assets",f),"utf8");
const manifestContext={window:{}};
vm.runInNewContext(read("catalog-curriculum-data.js"),manifestContext);
const groups=manifestContext.window.LI_CATALOG_DATA;
assert(Array.isArray(groups));
const fields=groups.flatMap(x=>x.fields);
const courses=fields.flatMap(x=>x.courses);
const lessons=courses.flatMap(x=>x.lessons);
assert.equal(groups.length,8);
assert.equal(fields.length,15);
assert.equal(fields.find(x=>x.id==="hci")?.name,"Human–Computer Interaction (HCI)");
assert(!fields.some(x=>x.id==="ux-design"));
assert.equal(courses.length,45);
assert.equal(lessons.length,135);
assert.equal(new Set(groups.map(x=>x.id)).size,8);
assert.equal(new Set(fields.map(x=>x.id)).size,15);
assert.equal(new Set(courses.map(x=>x.id)).size,45);
assert.equal(new Set(lessons.map(x=>x.id)).size,135);
assert(courses.every(x=>x.lessons.length===3));
assert(fields.every(x=>x.courses.length===3));
const published=lessons.filter(x=>x.published);
assert.deepEqual(Array.from(published,x=>x.id).sort(),["L03-1-2","L09-1-2","L15-2-2"]);
assert(published.every(x=>["lessonL03","lessonL09","lessonL15"].includes(x.route)));
assert(lessons.filter(x=>!x.published).every(x=>!x.route));
class Element{
 constructor(tag){
  this.tagName=tag.toUpperCase();this.className="";this.textContent="";
  this.children=[];this.parentElement=null;this.attributes={};this.dataset={};
  this.listeners={};this.style={};this.hidden=false;this.disabled=false;
  this.classList={
   add:key=>{this.className=this.className.split(/\s+/).filter(Boolean).concat(key).join(" ");},
   contains:key=>this.className.split(/\s+/).includes(key),
   toggle:(key,on)=>{const names=new Set(this.className.split(/\s+/).filter(Boolean));
    const next=on===undefined?!names.has(key):Boolean(on);
    if(next)names.add(key);else names.delete(key);this.className=[...names].join(" ");return next;}
  };
 }
 append(...items){for(const item of items){item.parentElement=this;this.children.push(item);}}
 prepend(item){item.parentElement=this;this.children.unshift(item);}
 replaceChildren(...items){this.children=[];this.append(...items);}
 setAttribute(key,value){this.attributes[key]=String(value);}
 addEventListener(type,cb){this.listeners[type]=cb;}
 closest(sel){return sel==="button[data-catalog-kind]"&&this.tagName==="BUTTON"&&this.dataset.catalogKind?this:null;}
 querySelector(sel){
  const nodes=descendants(this);
  if(sel===".catalog-empty-chapters")return nodes.find(x=>x.className.split(" ").includes("catalog-empty-chapters"))||null;
  return null;
 }
}
function descendants(node){return node.children.flatMap(x=>[x,...descendants(x)]);}
const host=new Element("div");
const docHandlers={},winHandlers={},navigation=[];
let loc=new URL("https://sali5610.github.io/li/");
const location={
 get href(){return loc.href},
 get search(){return loc.search},
 get pathname(){return loc.pathname}
};
const writes=[];
const history={
 state:null,
 pushState(s,title,url){loc=new URL(url,loc);writes.push("push:"+loc.search);},
 replaceState(s,title,url){loc=new URL(url,loc);writes.push("replace:"+loc.search);}
};
const state=new Map();
const localStorage={getItem:k=>state.has(k)?state.get(k):null};
const document={
 querySelector:sel=>sel==="#page-catalog .section-shell"?host:null,
 getElementById:()=>null,
 createElement:tag=>new Element(tag),
 addEventListener:(name,handler)=>{docHandlers[name]=handler}
};
const window={
 LI_CATALOG_DATA:groups,
 history,location,localStorage,
 navigate:route=>navigation.push(route),
 addEventListener:(name,handler)=>{winHandlers[name]=handler},
 matchMedia:()=>({matches:false}),
 lucide:{createIcons(){}}
};
const context={document,window,location,history,localStorage,URL,MutationObserver:class{},console};
vm.runInNewContext(read("catalog-drilldown.js"),context);
const findButton=(kind,value)=>descendants(host).find(x=>x.tagName==="BUTTON"&&x.dataset.catalogKind===kind&&(value===undefined||x.dataset.catalogValue===value));
function click(kind,value){
 const target=findButton(kind,value);
 assert(target,"Missing "+kind+" "+value);
 host.listeners.click({target,preventDefault(){},stopPropagation(){}});
}
function displayed(s){return descendants(host).some(e=>e.textContent.includes(s));}
assert.equal(descendants(host).filter(x=>x.className.split(/\s+/).includes("catalog-card")).length,8,"root eight groups");
click("open-group","technology");
assert(displayed("Công nghệ"));
assert(findButton("open-field","hci"));
click("open-field","hci");
assert(displayed("Nền tảng"));
assert(displayed("Trung cấp"));
assert(displayed("Chuyên sâu"));
assert(findButton("open-course","C03-1"));
click("open-course","C03-1");
assert(displayed("0/3 bài đã hoàn thành"));
assert(displayed("1/3 bài đã phát hành"));
let bar=descendants(host).find(x=>x.attributes.role==="progressbar");
assert(bar);assert.equal(bar.attributes["aria-valuemax"],"3");
assert.equal(bar.attributes["aria-valuenow"],"0");
state.set("li.review.L03-1-2.v1",JSON.stringify({reviewed:true}));
window.liCatalog.render();
assert(displayed("1/3 bài đã hoàn thành"));
bar=descendants(host).find(x=>x.attributes.role==="progressbar");
assert.equal(bar.attributes["aria-valuenow"],"1");
assert.equal(descendants(bar)[0].style.width,"33.33333333333333%");
click("open-lesson","L03-1-1");
assert(displayed("Chưa có chương được phát hành."));
assert(displayed("CHƯA PHÁT HÀNH"));
assert(!navigation.includes("lessonL03"));
click("crumb","3");
click("open-lesson","L03-1-2");
assert.equal(navigation.at(-1),"lessonL03");
assert.equal(new URL(location.href).searchParams.get("lesson"),"L03-1-2");
assert.equal(new URL(location.href).searchParams.get("catalog"),"technology/hci/C03-1");
// Draft-only courses still display an explicit 0/3 bar, without fabricated completion.
window.liCatalog.openCourse("language","chinese","C01-1");
assert(displayed("0/3 bài đã hoàn thành"));
assert(displayed("0/3 bài đã phát hành"));
bar=descendants(host).find(x=>x.attributes.role==="progressbar");
assert.equal(bar.attributes["aria-valuenow"],"0");
assert.equal(bar.attributes["aria-valuemax"],"3");
assert.equal(descendants(bar)[0].style.width,"0%");
assert.equal(typeof winHandlers.popstate,"function");
// Historical deep links are accepted and their URL is canonicalized.
history.pushState(null,"","/?catalog=technology/ux-design/C03-1");
winHandlers.popstate();
assert.equal(new URL(location.href).searchParams.get("catalog"),"technology/hci/C03-1");
assert.equal(window.liCatalog.getPath().join("/"),"technology/hci/C03-1");
assert(displayed("Human–Computer Interaction (HCI)"));
window.liCatalog.openCourse("technology","ux-design","C03-1");
assert.equal(window.liCatalog.getPath().join("/"),"technology/hci/C03-1");
// No Wave 2/3 published from these outline navigation changes.
assert.equal(lessons.filter(l=>l.published).length,3);
console.log("PASS Tàng Thư IA: 8/15/45/135, 3 published routes, drill-down, 1/3 true progress, draft visibility, browser URLs");
