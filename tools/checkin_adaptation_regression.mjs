// Node 22, zero external packages. Execute against the exact HTML deployed only after approval.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../site/assets/checkin-adaptation.css",import.meta.url),"utf8");
function between(first,last){
 const start=html.indexOf(first), end=html.indexOf(last,start+first.length);
 assert.ok(start>=0&&end>start,`Missing source boundary: ${first} to ${last}`);
 return html.slice(start,end);
}
const logic=between("/* L1-A: an optional, transparent readiness heuristic;","document.getElementById(\"checkin-modal\").addEventListener");
const modalListeners={};const elementListeners={};
let energy="",attention="",confirmed=0, applied=null, closed=null, toastText="",focused=0, opened=false;
const modal={
 querySelector(selector){
  if(selector.includes("checkin-energy"))return energy?{value:energy}:null;
  if(selector.includes("checkin-attention"))return attention?{value:attention}:null;
  throw Error("Unexpected query "+selector);
 },
 querySelectorAll(selector){assert.equal(selector,"input[data-checkin-context]:checked");return Array.from({length:confirmed},()=>({checked:true}));},
 addEventListener(event,cb){modalListeners[event]=cb;}
};
const field={
 "checkin-modal":modal,
 "checkin-override":{value:""},
 "checkin-recommendation":{textContent:""},
 "apply-checkin":{disabled:true,addEventListener(event,cb){elementListeners["apply-checkin:"+event]=cb;}},
 "checkin":{focus(){focused++},addEventListener(event,cb){elementListeners["checkin:"+event]=cb;}},
 "close-checkin":{addEventListener(event,cb){elementListeners["close-checkin:"+event]=cb;}}
};
const context=vm.createContext({
 document:{
  getElementById(id){assert.ok(field[id],"Unknown ID: "+id);return field[id];},
  querySelector(selector){assert.match(selector,/checkin-energy/);return {focus(){focused++}};}
 },
 STUDY_MODES:{
  start:{label:"Vào nhịp"},focus:{label:"Đào sâu"},
  overload:{label:"Quá tải"},recover:{label:"Hồi trí"}
 },
 openModal(id){assert.equal(id,"checkin-modal");opened=true;},
 closeModal(id){closed=id;},
 setStudyMode(mode){applied=mode;return true;},
 toast(message){toastText=message;}
});
vm.runInContext(logic,context,{timeout:1000});
const fixtures=[
 [undefined,undefined,null],["high",undefined,null],["high","steady","focus"],
 ["high","warming","start"],["medium","steady","start"],["medium","warming","start"],
 ["low","steady","recover"],["high","hard","recover"],["medium","hard","recover"],
 ["low","hard","overload"],["invalid","steady",null]
];
let tested=0;
for(const [e,a,expected] of fixtures){
 assert.equal(context.recommendStudyMode(e,a)?.mode??null,expected,`Mapping ${e}/${a}`);tested++;
}
assert.equal((html.match(/name="checkin-energy"/g)||[]).length,3);
assert.equal((html.match(/name="checkin-attention"/g)||[]).length,3);
for(const mode of ["start","focus","overload","recover"])assert.ok(html.includes(`<option value="${mode}">`));
assert.ok(html.includes('id="apply-checkin" disabled'));
assert.ok(html.includes('id="close-checkin">Bỏ qua'));
assert.ok(html.includes('id="checkin-recommendation"')&&html.includes('aria-live="polite"'));
assert.ok(html.includes('href="./assets/checkin-adaptation.css?v=1"'));
assert.ok(css.includes("#checkin-modal .dialog")&&css.includes("overflow-y:auto"));
assert.ok(!html.includes('setStudyMode("recover");closeModal("checkin-modal")'));

vm.runInContext(between('document.getElementById("checkin-modal").addEventListener("change"','document.getElementById("save-question").addEventListener'),context,{timeout:1000});
vm.runInContext(between('document.getElementById("close-checkin").addEventListener("click",closeCheckinModal);','document.getElementById("buddy-challenge").addEventListener'),context,{timeout:1000});
assert.equal(typeof modalListeners.change,"function");
assert.equal(typeof elementListeners["apply-checkin:click"],"function");
assert.equal(typeof elementListeners["close-checkin:click"],"function");

energy="high";attention="steady";confirmed=2;
modalListeners.change();
assert.equal(field["apply-checkin"].disabled,false);
assert.match(field["checkin-recommendation"].textContent,/Gợi ý: Đào sâu/);
assert.match(field["checkin-recommendation"].textContent,/2 ghi nhận/);
elementListeners["apply-checkin:click"]();
assert.equal(applied,"focus");assert.equal(closed,"checkin-modal");assert.match(toastText,/Đào sâu/);
assert.ok(focused>0);tested++;

field["checkin-override"].value="recover";
modalListeners.change();
assert.match(field["checkin-recommendation"].textContent,/chọn Hồi trí thủ công/);
elementListeners["apply-checkin:click"]();
assert.equal(applied,"recover");tested++;

field["checkin-override"].value="";
energy="";attention="";confirmed=0;applied=null;
modalListeners.change();
assert.equal(field["apply-checkin"].disabled,true);
elementListeners["apply-checkin:click"]();
assert.equal(applied,null);tested++;

field["checkin-override"].value="start";
modalListeners.change();
assert.equal(field["apply-checkin"].disabled,false);
elementListeners["apply-checkin:click"]();
assert.equal(applied,"start");tested++;

elementListeners["close-checkin:click"]();
assert.equal(closed,"checkin-modal");tested++;
elementListeners["checkin:click"]({currentTarget:field["checkin"]});
assert.equal(opened,true);tested++;
assert.ok(!logic.includes("localStorage"),"Check-in self-report must not persist independently");
console.log(`LI_CHECKIN_PASS ${tested} mapping and mock-interaction cases; source/dialog contract PASS`);
