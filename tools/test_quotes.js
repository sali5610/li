#!/usr/bin/env node
/* S121: context, provenance, rotation and visual-content semantics for Lão Lý quotations. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const src=fs.readFileSync("site/assets/laoly-quotes-s121.js","utf8");
const nodes=new Map();
function node(id){
 if(!nodes.has(id)) nodes.set(id,{
  id,textContent:"",value:"",lang:"",href:"",target:"",rel:"",hidden:false,checked:false,children:[],
  append(child){this.children.push(child);if(child.id)nodes.set(child.id,child);},
  attrs:{},
  setAttribute(key,value){this.attrs[key]=String(value)},
  getAttribute(key){return this.attrs[key]??null}
 });
 return nodes.get(id);
}
const storage=new Map();
const document={
 getElementById:id=>node(id),
 createElement:tag=>({tagName:tag,textContent:"",id:"",className:""})
};
const window={sessionStorage:{
 getItem:key=>storage.has(key)?storage.get(key):null,
 setItem:(key,value)=>storage.set(key,value)
}};
const ctx={document,window,currentPage:"home",qIndex:0,studyMode:"start",buddyDebateActive:false};
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:"laoly-quotes-s121.js"});
const engine=window.liQuoteEngine;
assert.ok(engine,"engine present");
assert.ok(engine.quotes.length>=24,"quote bank ≥24 distinct verified entries");
assert.equal(new Set(engine.quotes.map(q=>q.id)).size,engine.quotes.length,"IDs unique");
for(const q of engine.quotes){
 for(const field of ["id","original","gloss","translation","interpretation","meta","url","comment"]) assert.ok(typeof q[field]==="string"&&q[field].length>3,q.id+" "+field);
 assert.ok(["en","zh-Hant"].includes(q.lang),q.id+" language tag");
 assert.ok(Array.isArray(q.tags)&&q.tags.length>=2,q.id+" topics");
 assert.notEqual(q.translation,q.interpretation,q.id+" literal translation must differ from interpretation");
 assert.ok(q.url.startsWith("https://")&&!q.url.includes("example.com"),q.id+" verified public source");
}
const scenarios=[
 {i:0,expected:["sampling","evidence","critique"]},
 {i:1,expected:["norms","social","critique"]},
 {i:2,expected:["supply","systems","economy"]}
];
for(const scenario of scenarios){
 ctx.currentPage="home";ctx.qIndex=scenario.i;
 assert.equal(JSON.stringify(engine.environment().keys),JSON.stringify(scenario.expected),"context maps to relevant topic");
 const picked=[];
 const pool=engine.matchList(engine.environment());
 assert.ok(pool.length>=4,"pool too small "+scenario.i);
 for(let k=0;k<4;k++){
  const q=engine.pick();
  assert.ok(q.tags.some(t=>scenario.expected.includes(t)),"wrong topic "+scenario.i+":"+q.id);
  picked.push(q.id);
 }
 assert.equal(new Set(picked).size,4,"repeated quote before 4 distinct picks, scenario "+scenario.i);
}
const routes=["home","catalog","research","lesson","case","guide","guideDetail","library","dashboard","settings","search","capture"];
for(const route of routes){
 ctx.currentPage=route;
 assert.ok(engine.matchList(engine.environment()).length>=4,"no quote variety for "+route);
}
ctx.currentPage="guide";ctx.studyMode="overload";
assert.equal(engine.environment().keys[0],"pace","gentle mode selects a recovery theme");
ctx.studyMode="focus";
assert.equal(engine.environment().keys[0],"methods","focus mode selects relevant techniques");
ctx.currentPage="guideDetail";
for(const [id,expected] of [["T01","memory"],["T04","methods"],["T09","evidence"],["T10","systems"],["T12","reflection"]]){
 node("detail-id").textContent=id+" · CHÚ GIẢI";
 assert.equal(engine.environment().keys[0],expected,"method detail topic "+id);
}
ctx.currentPage="research";ctx.qIndex=2;
engine.render();
assert.equal(node("buddy-quote").hidden,true,"source detail hidden until info tap");
assert.equal(node("buddy-quote-info").hidden,false,"info button available");
assert.equal(node("buddy-quote-info").getAttribute("aria-expanded"),"false","source details initially collapsed");
assert.equal(node("buddy-quote-original").hidden,false,"original quote visible");
assert.ok(node("buddy-quote-original").textContent,"original script present in header");
assert.equal(node("buddy-quote-translation").hidden,false,"faithful Vietnamese translation visible below original");
assert.ok(node("buddy-quote-translation").textContent.startsWith("Dịch nghĩa: "),"translation has a distinct label");
assert.ok(node("buddy-quote-gloss").textContent.startsWith("Diễn nghĩa: "),"interpretation exists in collapsed source detail");
assert.notEqual(node("buddy-quote-translation").textContent.replace(/^Dịch nghĩa: /,""),node("buddy-quote-gloss").textContent.replace(/^Diễn nghĩa: /,""),"translation and interpretation are not identical");
assert.ok(node("buddy-quote-meta").textContent,"provenance preserved in collapsed source detail");
assert.ok(node("buddy-quote-link").href.startsWith("https://"),"source link preserved");
assert.equal(node("buddy-quote-context").hidden,false,"Lão Lý's contextual comment shown");
assert.ok(node("buddy-quote-context").textContent.length>3,"commentary nonempty");
assert.ok(!node("buddy-quote-context").textContent.startsWith("Lão Lý liên hệ:"),"redundant commentary prefix removed");
const countBefore=JSON.parse(storage.get("li.quotes.session.s121")).routes["research:2"].length;
node("calm-toggle").checked=true;
engine.render();
assert.equal(node("buddy-quote").hidden,true,"calm mode hides cultural panel");
assert.equal(node("buddy-quote-translation").hidden,true,"calm mode also hides quote translation");
assert.equal(JSON.parse(storage.get("li.quotes.session.s121")).routes["research:2"].length,countBefore,"hidden quote does not consume a rotation slot");
node("calm-toggle").checked=false;
ctx.buddyDebateActive=true;
engine.render();
assert.equal(node("buddy-quote").hidden,true,"debate hides quotation");
ctx.buddyDebateActive=false;
engine.render();
assert.equal(node("buddy-quote").hidden,true,"normal quote returns with details collapsed");
assert.equal(node("buddy-quote-translation").hidden,false,"normal quote translation restored");
assert.equal(node("buddy-quote-info").hidden,false,"info action restored on normal render");
assert.equal(node("buddy-quote-context").hidden,false,"contextual commentary restored");
assert.equal(node("buddy-quote").children.length,0,"quote details do not receive duplicate commentary nodes");
const vietnameseOriginal=node("buddy-quote-original").textContent;
window.liLanguage={get:()=> "en"};
engine.render();
assert.ok(node("buddy-quote-translation").textContent.startsWith("Meaning: "),"English quote meaning is localized");
assert.ok(node("buddy-quote-gloss").textContent.startsWith("Interpretation: "),"English quote interpretation is localized");
assert.ok(/[A-Za-z]/.test(node("buddy-quote-context").textContent),"English Lão Lý quote commentary is present");
assert.ok(node("buddy-quote-link").href.startsWith("https://"),"English edition preserves source link");
assert.ok(node("buddy-quote-original").textContent.length>0,"Original-language source remains shown in English mode");
window.liLanguage={get:()=> "vi"};
engine.render();
assert.ok(node("buddy-quote-translation").textContent.startsWith("Dịch nghĩa: "),"Vietnamese quote meaning restored");
assert.notEqual(vietnameseOriginal.length,0,"A source quote existed before switching languages");

console.log("PASS "+engine.quotes.length+" sourced quotes, 3 scenario rotations, 12 routes, 5 method contexts, 4 modes, accessibility and source/comment distinction");
