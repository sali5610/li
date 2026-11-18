/* UX-NAV-12 · Local-only Nhật Ký deletion must allow real Undo.
   Deterministic VM model; no paid services, user data or browser/network access. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
class Element{
 constructor(tag="div"){this.tagName=tag;this.children=[];this.handlers={};this.dataset={};this.textContent="";this.className="";this.disabled=false;this.attributes={};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
 addEventListener(event,callback){this.handlers[event]=callback;}
 setAttribute(name,value){this.attributes[name]=value;}
}
const nodes=new Map(),getNode=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
const stored=new Map(),KEY="li.personal.daily.v1",CONSENT="li.personal.daily.enabled.v1";
const before={
 schema:1,
 days:{"2026-11-18":{physical:{sleep:"yes",move:"no",rest:"unsure",recordedAt:"2026-11-18T08:00:00"},mode:"start",checkins:1,activities:{lesson:["L09-1-2"],branch:[],input:["initial-note"]}}}
};
stored.set(KEY,JSON.stringify(before));stored.set(CONSENT,"true");
const storage={getItem:key=>stored.has(key)?stored.get(key):null,
 setItem:(key,value)=>stored.set(key,value),
 removeItem:key=>stored.delete(key)};
const events={},snackbars=[];
const ctx={
 document:{getElementById:getNode,createElement:tag=>new Element(tag)},
 localStorage:storage,
 window:{confirm:()=>true,addEventListener:(type,callback)=>{events[type]=callback;}},
 toast:(message,options)=>snackbars.push({message,undo:options?.undo}),
 Date,Intl,JSON,Set,Array,Object,Math,String,console
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,"../site/assets/personal-diary.js"),"utf8"),ctx,{timeout:2000});
assert.equal(getNode("li-diary-delete").disabled,false,"existing diary can be deleted");
getNode("li-diary-delete").handlers.click();
assert.equal(stored.get(KEY),undefined,"delete removes the stored diary");
assert.equal(getNode("li-diary-delete").disabled,true,"delete updates empty state");
assert.equal(snackbars.length,1,"successful delete must show one snackbar");
assert.equal(snackbars[0].message,"Đã xóa Nhật Ký.");
assert.equal(typeof snackbars[0].undo,"function","Undo must be actionable");
events["li:activity"]({detail:{type:"input",id:"after-delete"}});
assert.equal(snackbars[0].undo(),true,"Undo writes diary back to storage");
const restored=JSON.parse(stored.get(KEY));
assert.equal(restored.days["2026-11-18"].checkins,1,"original check-in restored");
assert.deepEqual(restored.days["2026-11-18"].activities.lesson,["L09-1-2"],"original lesson survives");
assert(restored.days["2026-11-18"].activities.input.includes("initial-note"),"original input survives");
assert(Object.values(restored.days).some(day=>day.activities.input.includes("after-delete")),"new activity after delete survives Undo");
assert.equal(getNode("li-diary-delete").disabled,false,"restored diary can be deleted again");
console.log("PASS UX-NAV-12 diary delete + Undo, persistence readback, preserved old and new activities");
