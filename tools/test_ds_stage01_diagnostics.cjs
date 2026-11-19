#!/usr/bin/env node
/* UX-DS-35 Stage 01: read-only debug overlay contract. This is a VM fixture,
   NOT a real mobile Safari/VoiceOver/device test or proof of CTA tapability. */
"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const src=fs.readFileSync(path.join(__dirname,"../site/assets/ipad-viewport-debug.js"),"utf8");
assert.ok(src.includes('get("debug")!=="ipad"'),"probe must be opt-in");
for(const forbidden of ["localStorage","sessionStorage","sendBeacon","XMLHttpRequest","fetch("]){
  assert.ok(!src.includes(forbidden),"probe must stay local, no "+forbidden);
}
const box=(l,t,r,b)=>({left:l,top:t,right:r,bottom:b,width:r-l,height:b-t});
function fixture(search,visualHeight){
  let mounted=null;
  const handlers=new Map();
  const style={overflowY:"hidden",getPropertyValue:(n)=>n==="--li-ipad-active-mode"?"portrait":""};
  const metrics={
    ".app":box(0,0,970,1270),
    "#page-home .hero":box(0,0,970,1270),
    "#page-home .hero-actions":box(340,1120,630,1200),
    "#page-home .hero-dialogue":box(340,990,630,1100),
    ".mobile-bottom-nav":box(0,1200,970,1270)
  };
  const document={
    readyState:"complete",styleSheets:[],
    documentElement:{clientWidth:970,clientHeight:1270,scrollWidth:970},
    body:{appendChild:(v)=>{mounted=v;}},
    getElementById:()=>mounted,
    createElement:()=>({id:"",style:{cssText:""},setAttribute(){},textContent:""}),
    querySelector:(selector)=>metrics[selector]?{getBoundingClientRect:()=>metrics[selector]}:null,
    addEventListener:(type,fn)=>handlers.set("document:"+type,fn)
  };
  const vv={width:970,height:visualHeight,scale:1,offsetTop:0,offsetLeft:0,
    addEventListener:(type,fn)=>handlers.set("vv:"+type,fn)};
  const window={location:{search,host:"localhost",pathname:"/site/index.html"},
    innerWidth:970,innerHeight:1270,outerWidth:970,outerHeight:1408,
    screen:{width:970,height:1408,orientation:{angle:0,type:"portrait-primary"}},
    navigator:{standalone:false},visualViewport:vv,
    getComputedStyle:()=>style,liSafariRotationQA:{mode:"portrait-fixed-home"},
    addEventListener:(type,fn)=>handlers.set("window:"+type,fn)};
  const sandbox={window,document,location:window.location,screen:window.screen,URLSearchParams,
    navigator:window.navigator,matchMedia:()=>({matches:false})};
  vm.runInNewContext(src,sandbox,{timeout:1500});
  return {get mounted(){return mounted;},vv,handlers};
}
const off=fixture("",1270);
assert.equal(off.mounted,null,"normal app must not show diagnostic");
const ok=fixture("?debug=ipad",1270);
assert.ok(ok.mounted,"explicit flag should show diagnostic");
assert.match(ok.mounted.textContent,/CTA geometry in visual viewport: YES/);
assert.match(ok.mounted.textContent,/Visual offsets:/);
assert.match(ok.mounted.textContent,/Recent outer\/root\/visual signatures:/);
ok.vv.height=880;
ok.handlers.get("vv:resize")();
assert.match(ok.mounted.textContent,/CTA geometry in visual viewport: NO \/ CLIPPED/);
assert.match(ok.mounted.textContent,/visual signatures:/);
assert.ok(ok.mounted.textContent.includes("UNVERIFIED")===false,
  "measurement labels are geometry-only; signoff belongs to QA ledger");
console.log("PASS Stage01: opt-in, no storage/network, viewport/CTA geometry, reduced-height clipping classified (synthetic VM)");
console.log("UNVERIFIED: real iPad Safari rotation, virtual keyboard, actual CTA tapability, VoiceOver and Human G2");
