#!/usr/bin/env node
/* UX-DS-31: deterministic regression of the browser-facing reconciliation.
   These synthetic WebKit measurements are not physical Safari acceptance. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../site/assets/ipad-safari-rotation.js"),"utf8");
const defaultMeta="width=device-width,initial-scale=1,viewport-fit=cover";

function createEnvironment(initial){
 const data=Object.assign({
  innerWidth:970,innerHeight:1260,outerWidth:970,outerHeight:1408,
  screenWidth:970,screenHeight:1408,orientation:0,screenAngle:0,
  screenType:"portrait-primary",visualWidth:970,visualHeight:1260,
  visualScale:1,rootWidth:970,rootHeight:1260,heroWidth:970,
  token:"portrait",mediaLandscape:false,meta:defaultMeta,
  userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit Safari"
 },initial);
 const applied=new Map(),classes=new Set(),events=new Map(),queue=[];
 const root={
  clientWidth:data.rootWidth,get clientHeight(){return data.rootHeight;},
  dataset:{},style:{
   setProperty(key,value){applied.set(key,value);},
   removeProperty(key){applied.delete(key);}
  },classList:{
   add(...args){args.forEach(x=>classes.add(x));},
   remove(...args){args.forEach(x=>classes.delete(x));},
   toggle(name,force){const value=force===undefined?!classes.has(name):Boolean(force);if(value)classes.add(name);else classes.delete(name);return value;},
   contains(name){return classes.has(name);}
  }
 };
 const meta={get content(){return data.meta;},set content(v){data.meta=v;}};
 const hero={getBoundingClientRect(){return {width:data.heroWidth,height:data.visualHeight};}};
 const document={readyState:"complete",documentElement:root,
  querySelector(sel){if(sel==='meta[name="viewport"]')return meta;if(sel==="#page-home .hero")return hero;return null;},
  addEventListener(){}};
 const visualViewport={
  get width(){return data.visualWidth;},get height(){return data.visualHeight;},get scale(){return data.visualScale;},
  addEventListener(){}
 };
 const orientation={
  get angle(){return data.screenAngle;},get type(){return data.screenType;},
  addEventListener(){}
 };
 const screen={
  get width(){return data.screenWidth;},get height(){return data.screenHeight;},
  orientation
 };
 const win={screen,visualViewport,orientation:data.orientation,
  get outerWidth(){return data.outerWidth;},get outerHeight(){return data.outerHeight;},
  get innerWidth(){return data.innerWidth;},get innerHeight(){return data.innerHeight;},
  addEventListener(name,fn){events.set(name,fn);},
  dispatchEvent(){},
  matchMedia(){return {matches:data.mediaLandscape}}
 };
 const navigator={userAgent:data.userAgent,maxTouchPoints:5};
 const sandbox={window:win,navigator,document,
  CustomEvent:class{constructor(name){this.type=name;}},
  getComputedStyle(){return {getPropertyValue(){
   return classes.has("li-safari-landscape-recovery")?"landscape":
    classes.has("li-safari-portrait-recovery")?"portrait":data.token;
  }};},
  setTimeout(fn){queue.push(fn);return queue.length;}
 };
 vm.runInNewContext(source,sandbox,{filename:"ipad-safari-rotation.js"});
 function settle(){
  let attempts=0;
  while(queue.length&&attempts++<60)queue.shift()();
  assert.ok(attempts<60,"unexpected re-entrant rotation loop");
 }
 settle();
 return {data,classes,applied,meta,window:win,root,events,settle,
  rotate(patch){
   Object.assign(data,patch);
   win.orientation=data.orientation;
   events.get("orientationchange")?.();
   settle();
  }
 };
}
const healthyPortrait=createEnvironment({});
assert.equal(healthyPortrait.classes.size,0);
assert.equal(healthyPortrait.meta.content,defaultMeta);
assert.equal(healthyPortrait.root.dataset.liSafariRotation,"native");

const healthyLandscape=createEnvironment({
 innerWidth:1408,innerHeight:918,outerWidth:1408,outerHeight:970,
 orientation:90,screenAngle:90,screenType:"landscape-primary",
 visualWidth:1408,visualHeight:918,rootWidth:1408,rootHeight:918,
 heroWidth:1408,token:"landscape",mediaLandscape:true
});
assert.ok(!healthyLandscape.classes.has("li-safari-landscape-recovery"));
assert.equal(healthyLandscape.root.dataset.liSafariRotation,"native");

const staleLandscape=createEnvironment({
 innerWidth:970,innerHeight:918,outerWidth:1408,outerHeight:970,
 orientation:90,screenAngle:90,screenType:"landscape-primary",
 visualWidth:970,visualHeight:918,rootWidth:970,rootHeight:918,
 heroWidth:970,token:"portrait",mediaLandscape:false
});
assert.ok(staleLandscape.classes.has("li-safari-landscape-recovery"));
assert.equal(staleLandscape.applied.get("--li-safari-physical-width"),"1408px");
assert.equal(staleLandscape.meta.content,defaultMeta);

const strangeLandscape=createEnvironment({
 innerWidth:1408,innerHeight:918,outerWidth:1408,outerHeight:970,
 orientation:0,screenAngle:90,screenType:"landscape-primary",
 visualWidth:1408,visualHeight:918,rootWidth:1408,rootHeight:1843,
 heroWidth:970,token:"",mediaLandscape:false
});
assert.ok(strangeLandscape.classes.has("li-safari-landscape-recovery"));
assert.equal(strangeLandscape.applied.get("--li-safari-physical-height"),"918px");

const oldPortrait=createEnvironment({
 innerWidth:1408,innerHeight:1843,outerWidth:970,outerHeight:1408,
 orientation:0,screenAngle:0,screenType:"portrait-primary",
 visualWidth:1408,visualHeight:1843,visualScale:0.69,
 rootWidth:1408,rootHeight:1843,heroWidth:970,
 token:"",mediaLandscape:false,
 meta:"width=1408,initial-scale=1,viewport-fit=cover"
});
assert.equal(oldPortrait.meta.content,defaultMeta,"numeric viewport must be immediately restored");
assert.ok(oldPortrait.classes.has("li-safari-portrait-recovery"));
assert.ok(!oldPortrait.classes.has("li-safari-landscape-recovery"));
assert.ok(Math.abs(Number(oldPortrait.applied.get("--li-safari-portrait-scale"))-1408/970)<0.001);
oldPortrait.rotate({
 innerWidth:970,innerHeight:1260,visualWidth:970,visualHeight:1260,
 visualScale:1,rootWidth:970,rootHeight:1260,heroWidth:970,token:"portrait"
});
assert.ok(!oldPortrait.classes.has("li-safari-portrait-recovery"),"remove compensation after Safari corrects the viewport");
assert.equal(oldPortrait.meta.content,defaultMeta);

staleLandscape.rotate({
 innerWidth:970,innerHeight:1260,outerWidth:970,outerHeight:1408,
 orientation:0,screenAngle:0,screenType:"portrait-primary",
 visualWidth:970,visualHeight:1260,rootWidth:970,rootHeight:1260,
 heroWidth:970,token:"portrait",mediaLandscape:false
});
assert.ok(!staleLandscape.classes.has("li-safari-landscape-recovery"),"landscape class removed after return to portrait");

const split=createEnvironment({
 innerWidth:700,innerHeight:1000,outerWidth:700,outerHeight:1000,
 visualWidth:700,visualHeight:1000,rootWidth:700,rootHeight:1000,
 heroWidth:700,orientation:90,screenAngle:90,screenType:"landscape-primary",
 mediaLandscape:false
});
assert.equal(split.classes.size,0,"do not stretch Stage Manager or Split View");
assert.ok(!/meta\.content\s*=\s*"width=[0-9]/.test(source),"hardcoded numeric viewport must never recur");
console.log("PASS iPad physical Safari regression: 7 scenarios, portrait↔landscape, numeric meta rollback, split window");
