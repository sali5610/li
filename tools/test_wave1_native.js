"use strict";
/** Wave1 lessons: real localization script against an isolated eventful DOM.
 * Tests free-text persistence, hint gates, answer-reveal, review and locale continuity.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assert=require("node:assert/strict");
const core=fs.readFileSync(path.join(__dirname,"../site/assets/lesson-wave1-core.js"),"utf8");
const cache=new Map();
const storage={getItem:k=>cache.has(k)?cache.get(k):null,setItem:(k,v)=>cache.set(k,String(v)),removeItem:k=>cache.delete(k)};
function session(id){
const nodes=new Map();
class El{
 constructor(tag="div"){this.tagName=tag;this.children=[];this.listeners={};this.attributes={};this.dataset={};this.style={};this.hidden=false;this.textContent="";this.innerHTML="";this.value="";this.className="";}
 set id(v){this._id=v;nodes.set(v,this);}
 get id(){return this._id;}
 setAttribute(k,v){this.attributes[k]=String(v);}
 addEventListener(e,fn){this.listeners[e]=fn;}
 replaceChildren(...args){this.children=args;}
 append(...args){this.children.push(...args);}
 appendChild(x){this.children.push(x);return x;}
 fire(e){if(this.listeners[e])return this.listeners[e]();if(e==="change"&&this.onchange)return this.onchange();}
 scrollIntoView(){}
}
const document={
 getElementById(k){if(!nodes.has(k)){const e=new El();e.id=k;}return nodes.get(k);},
 createElement:t=>new El(t),
 createTextNode:v=>({textContent:v}),
 execCommand:()=>true,
 body:{appendChild:()=>{}}
};
const window={confirm:()=>true,toast:()=>{}};
const context={document,localStorage:storage,window,navigator:{clipboard:{writeText:async()=>{}}},setTimeout:()=>0,clearTimeout:()=>{},console,URLSearchParams};
vm.createContext(context);
vm.runInContext(core,context,{timeout:5000});
assert.equal(typeof window.liWave1Init,"function");
window.liWave1Init(id);
const p=id==="L03-1-2"?"l03":"l15";
return {el:key=>document.getElementById(p+"-"+key),context};
}
for(const id of ["L03-1-2","L15-2-2"]){
 let {el}=session(id);
 assert.equal(el("answerBox").hidden,true,id+" key leaked");
 assert.equal(el("rubricArea").hidden,true,id+" rubric leaked");
 assert.equal(el("guidedHint").hidden,true);
 assert.ok(el("guidedHint").innerHTML.length>50);
 assert.equal(el("questions").children.length,4);
 const draft="Tự giải thích dựa vào các giả định và bằng chứng của ví dụ, không suy rộng quá dữ liệu.";
 el("guidedDraft").value=draft;el("guidedDraft").fire("input");
 assert.equal(JSON.parse(cache.get("li.review."+id+".v1")).guidedDraft,draft);
 el("guidedToggle").fire("click");
 assert.equal(el("guidedHint").hidden,false);
 assert.equal(el("guidedToggle").attributes["aria-expanded"],"true");
 el("en").fire("click");
 assert.equal(el("guidedDraft").value,draft);
 assert.equal(el("guidedHint").hidden,false);
 assert.ok(el("guidedHint").innerHTML.length>40);
 el("vi").fire("click");
 assert.equal(el("guidedDraft").value,draft);
 el("submit").fire("click");
 assert.equal(el("answerBox").hidden,true,"Empty independent attempt must not reveal answers");
 el("hintButton").fire("click");
 assert.equal(JSON.parse(cache.get("li.review."+id+".v1")).assisted,true);
 for(let i=0;i<4;i++){
   const a=el("question-"+i);assert.ok(a,"Missing question "+i);
   a.value="Câu trả lời có giải thích dựa trên dữ kiện trong tình huống số "+(i+1);
   a.fire("input");
 }
 el("submit").fire("click");
 assert.equal(el("answerBox").hidden,false,"Model key must reveal after valid attempt");
 assert.equal(el("rubricArea").hidden,false);
 assert.equal(el("hintButton").hidden,true);
 assert.equal(el("questions").children.length,4);
 const submitted=JSON.parse(cache.get("li.review."+id+".v1"));
 assert.equal(submitted.submitted,true);assert.equal(submitted.submission.length,4);
 el("en").fire("click");
 assert.equal(el("answerBox").hidden,false);
 assert.equal(el("questions").children.length,4);
 for(let i=0;i<4;i++)assert.equal(el("question-"+i).disabled,true);
 el("saveReview").fire("click");
 assert.equal(JSON.parse(cache.get("li.review."+id+".v1")).reviewed,false,"Must rate all criteria");
 for(let i=0;i<4;i++){
   const sel=el("rating-"+i);sel.value="2";sel.fire("change");
 }
 assert.equal(el("score").textContent,"8 / 8");
 el("saveReview").fire("click");
 assert.equal(JSON.parse(cache.get("li.review."+id+".v1")).reviewed,true);
 assert.equal(el("progressBar").attributes["aria-valuenow"],"1");
 const reloaded=session(id).el;
 assert.equal(reloaded("guidedDraft").value,draft);
 assert.equal(reloaded("answerBox").hidden,false);
 assert.equal(reloaded("score").textContent,"8 / 8");
 assert.equal(reloaded("progressBar").attributes["aria-valuenow"],"1");
 console.log("PASS "+id+" native Wave1: 4 questions, guided input, VI/EN hint, no spoiler, assistance, submit, rubric, persistence");
}
