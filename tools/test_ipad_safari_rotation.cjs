#!/usr/bin/env node
/* UX-DS-33: physical Safari Home must cover the screen through repeated rotations.
   Deterministic JS simulation, not a real WebKit compositor/gesture test. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../site/assets/ipad-safari-rotation.js"),"utf8");
const normalMeta="width=device-width,initial-scale=1,minimum-scale=1,viewport-fit=cover";
function env(initial={}){
 const data=Object.assign({
  outerWidth:970,outerHeight:1408,innerWidth:970,innerHeight:1270,
  visualWidth:970,visualHeight:1270,rootWidth:970,rootHeight:1270,
  screenWidth:970,screenHeight:1408,screenAngle:0,
  screenType:"portrait-primary",orientation:0,
  userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari",touchPoints:5,
  home:true,meta:normalMeta
 },initial);
 const classes=new Set(),styles=new Map(),listeners=new Map(),tasks=[];
 let scrollCalls=0;
 const classList=()=>({
  add(...xs){xs.forEach(x=>classes.add(x));},
  remove(...xs){xs.forEach(x=>classes.delete(x));},
  toggle(x,state){if(state)classes.add(x);else classes.delete(x);return !!state;},
  contains(x){return classes.has(x);}
 });
 const html={classList:classList(),dataset:{},style:{
  setProperty(k,v){styles.set(k,v);},removeProperty(k){styles.delete(k);}
 },get clientWidth(){return data.rootWidth;},
 get clientHeight(){return data.rootHeight;},scrollTop:0};
 const app={classList:{contains(k){return k==="home-focus"&&data.home;}}};
 const meta={get content(){return data.meta;},set content(v){data.meta=v;}};
 const doc={documentElement:html,body:{scrollTop:0},readyState:"complete",
  querySelector(s){return s===".app"?app:s==='meta[name="viewport"]'?meta:null;},
  addEventListener(name,handler){listeners.set("document:"+name,handler);}};
 const vv={get width(){return data.visualWidth;},get height(){return data.visualHeight;},
  addEventListener(name,handler){listeners.set("vv:"+name,handler);}};
 const scrori={get angle(){return data.screenAngle;},
  get type(){return data.screenType;},addEventListener(){}};
 const scr={get width(){return data.screenWidth;},get height(){return data.screenHeight;},
  orientation:scrori};
 const win={screen:scr,visualViewport:vv,
  get outerWidth(){return data.outerWidth;},get outerHeight(){return data.outerHeight;},
  get innerWidth(){return data.innerWidth;},get innerHeight(){return data.innerHeight;},
  get orientation(){return data.orientation;},addEventListener(name,fn){listeners.set(name,fn);},
  dispatchEvent(){},scrollTo(){scrollCalls++;}
 };
 const sandbox={window:win,document:doc,
  navigator:{get userAgent(){return data.userAgent;},get maxTouchPoints(){return data.touchPoints;}},
  CustomEvent:class{constructor(t){this.type=t;}},setTimeout(fn){tasks.push(fn);},
 };
 vm.runInNewContext(source,sandbox,{filename:"ipad-safari-rotation.js"});
 function settle(){let n=0;while(tasks.length&&n++<80)tasks.shift()();assert.ok(n<80,"reconcile loop");}
 settle();
 return {data,html,classes,styles,meta,settle,
  get scrollCalls(){return scrollCalls;},
  next(patch){Object.assign(data,patch);listeners.get("orientationchange")?.();settle();},
  resize(patch){Object.assign(data,patch);listeners.get("resize")?.();settle();}
 };
}
function shell(e,orientation,width,height){
 assert.equal(e.classes.has("li-ipad-home-canvas"),true);
 assert.equal(e.classes.has("li-ipad-home-"+orientation),true);
 assert.equal(e.classes.has("li-ipad-home-"+(orientation==="portrait"?"landscape":"portrait")),false);
 assert.equal(e.styles.get("--li-ipad-shell-width"),width+"px");
 assert.equal(e.styles.get("--li-ipad-shell-height"),height+"px");
 assert.equal(e.meta.content,normalMeta);
 assert.equal(e.html.dataset.liSafariRotation,orientation+"-fixed-home");
 assert.equal(e.classes.has("li-safari-landscape-recovery"),false);
 assert.equal(e.classes.has("li-safari-portrait-recovery"),false);
}
const healthyPortrait=env();
shell(healthyPortrait,"portrait",970,1270);
const healthyLandscape=env({
 outerWidth:1408,outerHeight:970,innerWidth:1408,innerHeight:918,
 visualWidth:1408,visualHeight:918,screenAngle:90,
 screenType:"landscape-primary",orientation:90,rootWidth:1408,rootHeight:918
});
shell(healthyLandscape,"landscape",1408,918);
// Physical 05:08 Safari returns to portrait. Compositor retains 832px viewport.
const stalePortrait=env({
 outerWidth:970,outerHeight:1408,innerWidth:970,innerHeight:832,
 visualWidth:970,visualHeight:832,rootWidth:1408,rootHeight:832,
 screenAngle:90,screenType:"portrait-primary",orientation:0
});
shell(stalePortrait,"portrait",970,1270);
// Physical 05:24 reverse rotation: root 970×1270, visual 1408×918.
stalePortrait.next({
 outerWidth:1408,outerHeight:970,innerWidth:1408,innerHeight:918,
 visualWidth:1408,visualHeight:918,rootWidth:970,rootHeight:1270,
 screenAngle:0,screenType:"landscape-primary",orientation:90
});
shell(stalePortrait,"landscape",1408,918);
stalePortrait.next({
 outerWidth:970,outerHeight:1408,innerWidth:970,innerHeight:832,
 visualWidth:970,visualHeight:832,rootWidth:1408,rootHeight:832,
 screenAngle:90,screenType:"portrait-primary",orientation:0
});
shell(stalePortrait,"portrait",970,1270);
stalePortrait.next({
 outerWidth:1408,outerHeight:970,innerWidth:970,innerHeight:1270,
 visualWidth:970,visualHeight:1270,rootWidth:970,rootHeight:1270,
 screenAngle:0,screenType:"landscape-primary",orientation:90
});
shell(stalePortrait,"landscape",1408,918);
assert.ok(stalePortrait.scrollCalls>=4,"re-anchor each physical orientation change");
const missingPortraitVisual=env({visualWidth:1408,visualHeight:1843,
 innerWidth:1408,innerHeight:1843,rootWidth:1408,rootHeight:1843,meta:"width=1408"});
shell(missingPortraitVisual,"portrait",970,1270);
const splitView=env({outerWidth:700,outerHeight:1000,innerWidth:700,innerHeight:1000,
 visualWidth:700,visualHeight:1000,screenWidth:970,screenHeight:1408});
assert.equal(splitView.classes.has("li-ipad-home-canvas"),false,"Split View stays native");
const notHome=env({home:false});
assert.equal(notHome.classes.has("li-ipad-home-canvas"),false,"other pages stay scrollable");
const desktop=env({touchPoints:0,userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X)"});
assert.equal(desktop.classes.has("li-ipad-home-canvas"),false,"no desktop fixed canvas");
assert.ok(!source.includes("window.location.reload("));
assert.ok(!source.includes("localStorage.setItem("));
assert.ok(!/meta\.content\s*=\s*["']width=\d/.test(source));

// Root document must never pan horizontally when a decorative element
// overflows. Keep normal pinch zoom accessible and horizontal scroll inside
// dedicated components (filter rails, image galleries) unaffected.
const page=fs.readFileSync(path.join(__dirname,"../site/index.html"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"../site/assets/ui-foundations.css"),"utf8");
assert.ok(page.includes('<meta name="viewport" content="'+normalMeta+'">'),
 "Safari and initial HTML share the same 1x viewport contract");
assert.doesNotMatch(normalMeta,/user-scalable=no|maximum-scale=1/i,
 "Do not disable native user zoom or accessibility magnification");
assert.match(css,/html, body\s*\{\s*max-width:\s*100%;\s*overflow-x:\s*clip;\s*overscroll-behavior-x:\s*none;/,
 "Clip only the root document's horizontal overflow");
assert.match(css,/html\s*\{\s*touch-action:\s*pan-x pan-y pinch-zoom;/,
 "Keep native pinching and intentional child horizontal gestures");
assert.doesNotMatch(css,/html\s*\{\s*touch-action:\s*none;/,
 "Do not disable document gestures to solve root overflow");
console.log("PASS DS33 + root viewport: rotation, 1x baseline, no sideways document pan, native pinch zoom");
