#!/usr/bin/env node
/* UX-HOME-02 · Draggable Lão Lý zero-dependency interaction contract.
   Synthetic pointer and keyboard events; physical Safari QA still required. */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const src=fs.readFileSync("site/assets/laoly-drag.js","utf8");
const handlers=new Map(),styles=new Map(),storage=new Map();
const classes=new Set();
let home=true,navTop=720,width=390,height=780;
const button={
 getBoundingClientRect(){return {width:56,height:56}},
 setAttribute(name,value){assert.equal(name,"aria-description");assert(value.includes("Kéo"))},
 addEventListener(type,handler,capture){handlers.set(type+(capture?"Capture":""),handler)},
 setPointerCapture(){},hasPointerCapture(){return false}
};
const host={
 classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
 style:{setProperty:(k,v)=>styles.set(k,v)}
};
const sandbox={
 window:{
  innerWidth:width,innerHeight:height,
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,val)=>storage.set(key,val),removeItem:key=>storage.delete(key)},
  getComputedStyle:()=>({position:"fixed"})
 },
 document:{
  documentElement:{clientWidth:width,clientHeight:height},
  getElementById:id=>id==="laoly-fab"?button:id==="page-home"?{classList:{contains:()=>home}}:null,
  querySelector:selector=>selector===".laoly-support"?host:selector===".mobile-nav"?{getBoundingClientRect:()=>({top:navTop})}:selector===".header"?{getBoundingClientRect:()=>({bottom:70})}:null
 }
};
vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:"laoly-drag.js"});
const pos=()=>({x:parseFloat(styles.get("--li-laoly-x")),y:parseFloat(styles.get("--li-laoly-y"))});
const fire=(type,props={})=>{const e={pointerId:1,button:0,clientX:0,clientY:0,key:"",shiftKey:false,
 preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...props};
 handlers.get(type)(e);return e;};
assert(classes.has("li-companion-draggable"));
assert.equal(pos().y,90,"Home default is high, directly under the header");
assert.equal(pos().x,318,"Home default avoids the left Check-in");
assert.equal(storage.size,0,"Unmoved default is not persisted");
const ordinaryClick=fire("clickCapture");
assert(!ordinaryClick.prevented,"Tap may open the modal");
fire("pointerdown",{clientX:330,clientY:105});
fire("pointermove",{clientX:334,clientY:108});
assert.equal(pos().x,318,"Movement below threshold is not a drag");
fire("pointermove",{clientX:350,clientY:150});
assert(classes.has("is-dragging"));
assert(pos().x>318 && pos().y>90,"Dragging moves both axes");
fire("pointerup",{clientX:350,clientY:150});
assert(!classes.has("is-dragging"));
assert(storage.has("li.companion.position.v1"),"Drag persists normalized coordinates");
const syntheticClick=fire("clickCapture");
assert(syntheticClick.prevented&&syntheticClick.stopped,"Drag does not open the chat");
home=false;
const prev=pos();
sandbox.window.liCompanionDrag.place();
assert.equal(pos().x,prev.x,"User-dragged position persists across routes");
width=500;height=840;navTop=780;
sandbox.window.innerWidth=width;sandbox.window.innerHeight=height;
sandbox.window.liCompanionDrag.place();
assert(pos().x<=436&&pos().y<=716,"Resize clamps inside visible viewport above nav");
const before=pos().x;
fire("keydown",{key:"ArrowLeft"});
assert(pos().x<before,"Keyboard can reposition companion");
fire("keydown",{key:"Escape"});
assert(!storage.has("li.companion.position.v1"),"Escape restores default, removes persisted placement");
const nonhome=pos();
assert(nonhome.y>600,"Non-Home default returns to lower right");
home=true;sandbox.window.liCompanionDrag.place();
assert.equal(pos().y,90,"Back Home restores high default");
fire("pointerdown",{clientX:pos().x,clientY:pos().y});
fire("pointermove",{clientX:-2000,clientY:2000});
fire("pointerup",{clientX:-2000,clientY:2000});
assert(pos().x>=8&&pos().y<=716,"Large drag remains inside screen and above mobile nav");
console.log("PASS UX-HOME-02: home/default placement, pointer threshold/drag, click suppression, local persistence, route, resize, keyboard, reset, safe viewport");
