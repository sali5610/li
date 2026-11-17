"use strict";
/* Native li. Hi-Fi L09 guided practice test in a lightweight fake DOM.
   Covers field input, VI/EN content, disclosure state and persistence. */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const app=fs.readFileSync(path.join(__dirname,"../site/assets/lesson-l09-hifi.js"),"utf8");
const store=new Map();
const storage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)
};
class Element {
  constructor(tag="div"){
    this.tagName=tag;
    this.listeners={};
    this.dataset={};
    this.style={};
    this.hidden=false;
    this.attributes={};
    this.textContent="";
    this.innerHTML="";
    this.value="";
    this.children=[];
  }
  addEventListener(event,listener){this.listeners[event]=listener;}
  setAttribute(key,val){this.attributes[key]=String(val);}
  querySelector(tag){return new Element(tag);}
  querySelectorAll(selector){return selector===".l09-stat-desc"?[new Element(),new Element(),new Element()]:[];}
  append(...children){this.children.push(...children);}
  appendChild(child){this.children.push(child);return child;}
  replaceChildren(...children){this.children=children;}
  fire(event){if(this.listeners[event])this.listeners[event]();}
  scrollIntoView(){}
}
function session(){
  const nodes=new Map();
  const document={
    getElementById(id){if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);},
    createElement:tag=>new Element(tag),
    createTextNode:text=>({textContent:text}),
    documentElement:{lang:"vi"}
  };
  vm.runInNewContext(app,{
    document,localStorage:storage,window:{},navigator:{},
    setTimeout:()=>0,clearTimeout:()=>{},console
  },{filename:"lesson-l09-hifi.js",timeout:5000});
  return id=>document.getElementById("l09-"+id);
}
let el=session();
assert.equal(el("guidedHint").hidden,true);
assert.match(el("guidedHint").innerHTML,/Người trả lời/);
assert.match(el("guidedDraft").placeholder,/Mẫu này/);
const response="Nhóm người học tích cực chưa đại diện được cho toàn bộ người dùng tương lai.";
el("guidedDraft").value=response;
el("guidedDraft").fire("input");
assert.equal(JSON.parse(storage.getItem("li.review.L09-1-2.v1")).guidedDraft,response);
el("guidedToggle").fire("click");
assert.equal(el("guidedHint").hidden,false);
assert.equal(el("guidedToggle").attributes["aria-expanded"],"true");
el("en").fire("click");
assert.equal(el("guidedDraft").value,response);
assert.match(el("guidedHint").innerHTML,/Respondents from/);
assert.equal(el("guidedHint").hidden,false);
assert.equal(el("guidedLabel").textContent,"Explain it in your own words");
el("guidedToggle").fire("click");
assert.equal(el("guidedHint").hidden,true);
assert.equal(el("guidedToggle").attributes["aria-expanded"],"false");
el("vi").fire("click");
assert.equal(el("guidedDraft").value,response);
assert.match(el("guidedHint").innerHTML,/Người trả lời/);
el=session();
assert.equal(el("guidedDraft").value,response,"Reload must restore guided response");
assert.match(el("guidedHint").innerHTML,/Người trả lời/);
assert.equal(el("guidedHint").hidden,true,"Reload may keep hint collapsed");
console.log("PASS L09 guided real JS: native input, VI/EN hint, toggle, aria, locale, persistence, reload");
