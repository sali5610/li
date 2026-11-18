/* UX-IA-05: execute all published Wave1 lesson mounting scripts against a
   simulated li. app and prevent any card injection into the Tủ Riêng shelf.
   Catalog and native lesson routes must remain usable. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const FILES=["lesson-l09-hifi-markup.js","lesson-l03-hifi-markup.js","lesson-l15-hifi-markup.js"];
function fakeCard(title){
 const button={dataset:{page:"catalog"},textContent:""};
 const status={textContent:"Bản thảo"};
 return {title,button,status,querySelector(selector){
   if(selector==="h2")return {textContent:title};
   if(selector==="button[data-page]")return button;
   if(selector===".status-chip")return status;
   return null;
 }};
}
function run(name,lesson){
 const mounts=[],navigation=[],homeGroups=[{id:"library-resume"},{id:"library-collection"},{id:"library-reflection"}];
 const library={children:homeGroups,prepend(){throw new Error("Rogue static lesson card prepended to Tủ Riêng");}};
 const catalog={
  children:[fakeCard("Xã hội học"),fakeCard("UX Research"),fakeCard("Supply Chain")],
  querySelectorAll(selector){assert.equal(selector,"article");return this.children;},
  insertBefore(child,before){
   const index=this.children.indexOf(before);
   assert(index>=0);this.children.splice(index,0,child);
  },
  appendChild(child){this.children.push(child);}
 };
 const anchor={insertAdjacentHTML(position,html){
  assert.equal(position,"beforebegin");assert(html.includes('id="page-lesson'+lesson+'"'));
  mounts.push(html);
 }};
 const elements={main:{}, "page-case":anchor};
 const doc={
  getElementById(id){return elements[id]||null},
  querySelector(selector){
   if(selector==="#page-catalog .surface-grid")return catalog;
   if(selector==="#page-library .stack-sm")return library;
   return null;
  },
  createElement(tag){return {tag,id:"",className:"",innerHTML:"",dataset:{}}}
 };
 const win={location:{search:"?lesson=L"+lesson.slice(1).replace("L","")}};
 // Load with a clean URL for normal app navigation, then verify the deep-link
 // is still supported separately by running the script with query parameter.
 win.location.search="";
 const ctx={document:doc,window:win,URLSearchParams,console,navigate:(route)=>navigation.push(route)};
 const source=fs.readFileSync(path.join(__dirname,"../site/assets",name),"utf8");
 assert(!source.includes("library.prepend("),name+" must not mutate Tủ Riêng");
 assert(!source.includes("library.insertBefore("),name+" must not insert top-level cards");
 vm.createContext(ctx);vm.runInContext(source,ctx,{timeout:2000,filename:name});
 assert.equal(mounts.length,1,name+" still mounts its lesson page");
 assert.equal(library.children.length,3,name+" keeps exactly 3 Tủ Riêng category groups");
 assert.deepEqual(library.children.map(item=>item.id),["library-resume","library-collection","library-reflection"]);
 if(lesson==="L09"){
  assert(catalog.children.some(item=>item.id==="li-l09-catalog-entry"),"L09 still appears in Tàng Thư");
 }else{
  const target=lesson==="L03"?"UX Research":"Supply Chain";
  const category=catalog.children.find(x=>x.title===target);
  assert.equal(category.button.dataset.page,"lesson"+lesson,"catalog route remains active");
 }
 assert.equal(navigation.length,0,"normal page load cannot force lesson navigation");
 win.location.search="?lesson="+{"L09":"L09-1-2","L03":"L03-1-2","L15":"L15-2-2"}[lesson];
 vm.runInContext(source,ctx,{timeout:2000,filename:name});
 assert.equal(navigation.at(-1),"lesson"+lesson,"lesson deep link still routes correctly");
 assert.equal(library.children.length,3,"deep link cannot create new Tủ Riêng cards");
}
for(const [i,name] of FILES.entries())run(name,["L09","L03","L15"][i]);
const html=fs.readFileSync(path.join(__dirname,"../site/index.html"),"utf8");
for(const name of FILES)assert(html.includes('./assets/'+name+'?v=20261118-ia07'),name+" cache-busted in app");
const library=html.slice(html.indexOf('<section id="page-library"'),html.indexOf('<section id="page-resume"'));
assert.equal((library.match(/id="li-library-latest-lesson"/g)||[]).length,1,"exactly one latest-lesson preview slot");
assert(!library.includes('id="li-lesson-history"'),"full study list stays on Quay lại page");
console.log("PASS UX-IA-05: L03/L09/L15 mount without rogue library cards, maintain catalog/deep links, and one summary preview");
