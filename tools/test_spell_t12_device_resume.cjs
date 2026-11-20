#!/usr/bin/env node
"use strict";
/* Focused device-storage integration against the REAL native T12 controller.
 * No browser, network, real account or private data; fake DOM only. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const native=fs.readFileSync(path.join(__dirname,"../site/assets/spell-practice.js"),"utf8");
const OWNER="li.sync.local-owner.v1";
const PREFIX="li.spell.t12.resume.v1:";
const values=new Map();
const storage={
 getItem:key=>values.has(key)?values.get(key):null,
 setItem:(key,val)=>{values.set(String(key),String(val));},
 removeItem:key=>{values.delete(String(key));}
};
function boot({verified=true,owner="user-a",storagePort=storage}={}){
 if(owner===null)storagePort.removeItem(OWNER);
 else storagePort.setItem(OWNER,owner);
 let ready,root;
 const fakeButton=()=>({setAttribute(){},addEventListener(){},focus(){},tabIndex:0});
 const guideButton=fakeButton(),practiceButton=fakeButton();
 const guide={hidden:false,setAttribute(){},before(){},after(el){root=el;}};
 const page={querySelector:selector=>selector===".editorial-grid"?guide:null};
 const tabs={
  setAttribute(){},addEventListener(){},
  querySelector:selector=>selector==="#spell-tab-guide"?guideButton:
   selector==="#spell-tab-practice"?practiceButton:null,
  set innerHTML(_) {},
  get innerHTML(){return "";}
 };
 class FakeElement{
  constructor(tag){this.tag=tag;this.hidden=false;this.fields=new Map();this.events={};}
  setAttribute(){}
  addEventListener(name,callback){this.events[name]=callback;}
  focus(){}
  contains(){return true;}
  set innerHTML(html){
   this.html=html;
   if(this.tag==="section"){
    this.fields.clear();
    for(const match of html.matchAll(/<textarea id="(sp-[^"]+)"[^>]*>/g))
     this.fields.set(match[1],{id:match[1],value:""});
   }
  }
  get innerHTML(){return this.html||"";}
  querySelector(selector){
   if(selector.startsWith("#sp-"))return this.fields.get(selector.slice(1))||null;
   if(selector===".spell-feedback")return this.feedback||null;
   if(selector===".spell-activity-body")return {append:node=>{this.feedback=node;}};
   const prefix='[data-spell-action="';
   const match=selector.startsWith(prefix)&&selector.endsWith('"]')?
    selector.slice(prefix.length,-2):null;
   if(match&&this.html.includes('data-spell-action="'+match+'"')){
    const action=match;
    return {click:()=>this.events.click({
     target:{dataset:{spellAction:action},closest:()=>({
      dataset:{spellAction:action}
     })}
    })};
   }
   return null;
  }
  querySelectorAll(selector){
   if(selector==="textarea,input")return [...this.fields.values()];
   return [];
  }
 }
 const document={
  readyState:"loading",
  documentElement:{classList:{contains:token=>verified&&token==="li-auth-verified"}},
  addEventListener(name,cb){if(name==="DOMContentLoaded")ready=cb;},
  getElementById:id=>id==="page-guideDetail"?page:null,
  createElement:tag=>tag==="div"&&!root?tabs:new FakeElement(tag)
 };
 // Tabs are the first generated div; feedback only uses a div after root exists.
 const handlers={};
 const window={liLanguage:{get:()=>"vi",apply(){}},dispatchEvent(){},
  addEventListener(name,fn){handlers[name]=fn;}};
 vm.runInNewContext(native,{document,window,localStorage:storagePort,Event:class Event{}},
  {filename:"spell-practice.js",timeout:2000});
 assert.equal(typeof ready,"function","Native spell controller must register setup");
 ready();
 assert(window.LiSpellPractice,"Native controller must mount");
 return {api:window.LiSpellPractice,root:()=>root,storage:storagePort,
  cloud:detail=>handlers['li:personal-sync-applied']?.({detail}),
  confirm:detail=>handlers['li:t12-sync-confirmed']?.({detail})};
}
function open(h,lesson="L09-1-2"){
 h.api.open("T12","practice",lesson);
 return h.api.getView();
}
function key(uid,lesson){return PREFIX+encodeURIComponent(uid)+":"+(lesson||"standalone");}
const context="Đang đọc 15 trong 20 phản hồi";
const next="Viết kết luận đúng phạm vi";
let h=boot();
open(h);
assert.equal(h.api.setT12Draft("context",context),true);
assert.equal(h.api.setT12Draft("next",next),true);
assert.equal(h.api.getView().t12SavedOnDevice,true);
assert.equal(JSON.parse(values.get(key("user-a","L09-1-2"))).phase,0,
 "Unfinished preparation draft is recoverable");
h=boot();
let v=open(h);
assert.equal(v.phase,0);
assert.equal(v.t12Draft.context,context);
assert.equal(v.t12Draft.next,next);
assert.equal(h.api.perform("next",{context,next}),true);
v=h.api.getView();
assert.equal(v.phase,1);
assert.equal(v.resumeNote,next);
assert.equal(JSON.parse(values.get(key("user-a","L09-1-2"))).phase,1);
assert.equal(h.api.setT12Draft("answer","Trong 20 người được hỏi, 15 hài lòng"),true);
h=boot();
v=open(h);
assert.equal(v.phase,1,"Pause must survive app reload");
assert.equal(v.t12Draft.answer,"Trong 20 người được hỏi, 15 hài lòng",
 "Partially typed return answer must survive reload");
assert.equal(v.reviewedInSession,false,"Reload must not invent a completion receipt");
// Another account and another lesson must never see the cue.
const another=boot({owner:"user-b"});
v=open(another);
assert.equal(v.phase,0);
assert.equal(v.t12SavedOnDevice,false);
assert.equal(v.resumeNote,"");
const sibling=boot({owner:"user-a"});
v=open(sibling,"L03-1-2");
assert.equal(v.phase,0,"T12 is scoped by lesson as well as account");
const unauth=boot({owner:"user-a",verified:false});
v=open(unauth);
assert.equal(v.phase,0,"No private restore while the auth gate is closed");
assert.equal(unauth.api.setT12Draft("next","should not persist"),false);
assert.match(unauth.api.getView().t12StorageError,/Chưa xác minh/);
// Returning to the original invited owner retains its own unfinished work.
h=boot({owner:"user-a"});
v=open(h);
assert.equal(v.phase,1);
assert.equal(v.resumeNote,next);
assert.equal(h.api.perform("reset"),true);
assert.equal(JSON.parse(values.get(key("user-a","L09-1-2"))).phase,2,
 "Reset publishes a redacted terminal checkpoint");
assert.equal(JSON.parse(values.get(key("user-a","L09-1-2"))).context,'');
h=boot({owner:"user-a"});
assert.equal(open(h).phase,0,"Reset must survive reload");
// Completed self-check clears the unfinished record, not creates a mastery grade.
h.api.perform("next",{context,next});
assert.equal(values.has(key("user-a","L09-1-2")),true);
h.api.perform("check",{answer:"Trong 20 người được hỏi, 15 hài lòng"});
assert.equal(h.api.getView().reviewedInSession,true);
assert.equal(JSON.parse(values.get(key("user-a","L09-1-2"))).phase,2,
 "Completed T12 publishes the terminal checkpoint");
assert.equal(JSON.parse(values.get(key("user-a","L09-1-2"))).next,'');
// Malformed stored data fails closed instead of unlocking a stage.
values.set(key("user-a","L09-1-2"),JSON.stringify({
 schema:"li.spell.t12.v1",phase:1,context:"",next:"unsafe",answer:""
}));
h=boot({owner:"user-a"});
assert.equal(open(h).phase,0);
values.delete(key("user-a","L09-1-2"));
// Storage failures must not falsely report "saved".
const broken={
 getItem:key=>storage.getItem(key),
 setItem:(key,value)=>{
  if(key===OWNER){storage.setItem(key,value);return;}
  throw Error("STORAGE_UNAVAILABLE");
 },
 removeItem:key=>storage.removeItem(key)
};
h=boot({owner:"user-a",storagePort:broken});
open(h);
assert.equal(h.api.setT12Draft("context",context),false);
assert.equal(h.api.getView().t12SavedOnDevice,false);
assert.match(h.api.getView().t12StorageError,/Không lưu được/);
console.log("PASS T12: draft/re-entry across reload, per-user and per-lesson privacy, reset, completion, bad data, storage failure");

// Signed Neon hydration while learner has a clean T12 page open must update
// the canonical port immediately; React reacts to the viewSession increment.
const cloudUid="cloud-user",cloudKey=key(cloudUid,"L09-1-2");
h=boot({owner:cloudUid});
assert.equal(open(h).phase,0);
values.set(cloudKey,JSON.stringify({schema:"li.spell.t12.v1",phase:1,
 context:"Remote context",next:"Remote next",answer:"Remote draft",
 updatedAt:"2026-11-21T02:00:00Z"}));
h.cloud({accountId:cloudUid,keys:[cloudKey]});
assert.equal(h.api.getView().phase,1);
assert.equal(h.api.getView().resumeNote,"Remote next");
assert.equal(h.api.getView().t12Draft.answer,"Remote draft");
// A local unsynced edit cannot be erased by an unrelated late hydration.
h.api.setT12Draft("answer","Local typing");
values.set(cloudKey,JSON.stringify({schema:"li.spell.t12.v1",phase:1,
 context:"Other remote",next:"Overwrite",answer:"Overwrite",
 updatedAt:"2026-11-21T03:00:00Z"}));
h.cloud({accountId:cloudUid,keys:[cloudKey]});
assert.equal(h.api.getView().t12Draft.answer,"Local typing");
assert.equal(h.api.getView().t12Synced,false);
h.confirm({accountId:"another-user",keys:[cloudKey]});
assert.equal(h.api.getView().t12Synced,false,
 "An unrelated account cannot clear the unsynced-local-edit guard");
// A signed exact-payload acknowledgement releases the guard for future
// changes from this account; later remote edits may then refresh in place.
values.set(cloudKey,JSON.stringify({schema:"li.spell.t12.v1",phase:1,
 context:"Remote context",next:"Remote next",answer:"Local typing",
 updatedAt:"2026-11-21T03:05:00Z"}));
h.confirm({accountId:cloudUid,keys:[cloudKey]});
assert.equal(h.api.getView().t12Synced,true);
values.set(cloudKey,JSON.stringify({schema:"li.spell.t12.v1",phase:1,
 context:"New confirmed source",next:"Another device",answer:"Another answer",
 updatedAt:"2026-11-21T03:06:00Z"}));
h.cloud({accountId:cloudUid,keys:[cloudKey]});
assert.equal(h.api.getView().resumeNote,"Another device");
assert.equal(h.api.getView().t12Draft.answer,"Another answer");
console.log("PASS T12: in-place signed hydration, local-edit safety and later confirmed sync");
