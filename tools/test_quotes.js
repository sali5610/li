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
  getAttribute(){return null}
 });
 return nodes.get(id);
}
const storage=new Map();
const document={
 getElementById:id=>id==="buddy-quote-context"&&!nodes.has(id)?null:node(id),
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
 for(const field of ["id","original","gloss","meta","url","comment"]) assert.ok(typeof q[field]==="string"&&q[field].length>3,q.id+" "+field);
 assert.ok(["en","zh-Hant"].includes(q.lang),q.id+" language tag");
 assert.ok(Array.isArray(q.tags)&&q.tags.length>=2,q.id+" topics");
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
assert.equal(node("buddy-quote").hidden,false,"quote shown");
assert.ok(node("buddy-quote-original").textContent,"original script visible");
assert.ok(node("buddy-quote-gloss").textContent.startsWith("Diễn nghĩa: "), "translation is explicitly a gloss");
assert.ok(node("buddy-quote-meta").textContent,"provenance visible");
assert.ok(node("buddy-quote-link").href.startsWith("https://"),"real source link");
assert.ok(node("buddy-quote-context").textContent.startsWith("Lão Lý liên hệ: "),"commentary distinguished from source");
const countBefore=JSON.parse(storage.get("li.quotes.session.s121")).routes["research:2"].length;
node("calm-toggle").checked=true;
engine.render();
assert.equal(node("buddy-quote").hidden,true,"calm mode hides cultural panel");
assert.equal(JSON.parse(storage.get("li.quotes.session.s121")).routes["research:2"].length,countBefore,"hidden quote does not consume a rotation slot");
node("calm-toggle").checked=false;
ctx.buddyDebateActive=true;
engine.render();
assert.equal(node("buddy-quote").hidden,true,"debate hides quotation");
ctx.buddyDebateActive=false;
engine.render();
assert.equal(node("buddy-quote").hidden,false,"normal quote returns");
assert.equal(node("buddy-quote").children.length,1,"no repeated quote-note node");
console.log("PASS "+engine.quotes.length+" sourced quotes, 3 scenario rotations, 12 routes, 5 method contexts, 4 modes, accessibility and source/comment distinction");
