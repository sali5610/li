// li. L1 physical-first Check-in: complete evidence, radio UI, no forced global gate.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../site/assets/checkin-adaptation.css",import.meta.url),"utf8");
const between=(a,b)=>{let i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,"Missing "+a);return html.slice(i,j)};
const modalHtml=between('<div id="checkin-modal"','<div id="toast"');
assert.equal((modalHtml.match(/<select\b/g)||[]).length,0,"No selects allowed in check-in modal");
assert.ok(!modalHtml.includes("Không rõ")&&!modalHtml.includes('value="unsure"'),"No unsure choice or helper copy");
for(const key of ["sleep","move","rest"]){
 assert.ok(modalHtml.includes(`<fieldset class="checkin-physical-field" data-checkin-field="${key}"`));
 for(const value of ["yes","no"])assert.ok(modalHtml.includes(`name="checkin-${key}" value="${value}"`));
 assert.equal((modalHtml.match(new RegExp(`name="checkin-${key}"`,"g"))||[]).length,2);
}
for(const v of ["","start","focus","overload","recover"])assert.ok(modalHtml.includes(`name="checkin-override" value="${v}"`));
assert.ok(modalHtml.includes('class="checkin-scroll"'));
assert.ok(modalHtml.indexOf('class="action-row checkin-actions"')>modalHtml.indexOf('class="checkin-scroll"'));
assert.ok(html.includes("checkin-adaptation.css?v=20261118-binary3"),"Update cache key whenever changing CSS");
assert.ok(css.includes("#checkin-modal .checkin-radio-row{display:grid"));
assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"),"Physical choices must be two columns");
assert.ok(css.includes("#checkin-modal .checkin-actions{")&&css.includes("position:relative"));
assert.ok(css.includes("body:has(#checkin-modal.open) .laoly-support"));
assert.ok(css.includes("#checkin-modal .checkin-scroll"));
assert.ok(!css.includes("position:sticky"));
const state={sleep:"",move:"",rest:"",energy:"",attention:"",override:""};
const listeners={},fields={
 "checkin-recommendation":{textContent:""},
 "apply-checkin":{disabled:true,addEventListener(t,cb){listeners["apply:"+t]=cb}},
 "close-checkin":{addEventListener(t,cb){listeners["skip:"+t]=cb}},
 "checkin":{addEventListener(t,cb){listeners["open:"+t]=cb},focus(){context.focused++}},
 "checkin-override":{open:false}
};
const radioInputs=[];
for(const n of ["sleep","move","rest","energy","attention","override"]){
 for(const v of (n==="override"?["","start","focus","overload","recover"]:n==="sleep"||n==="move"||n==="rest"?["yes","no"]:["high","medium","low","steady","warming","hard"])){
  radioInputs.push({name:"checkin-"+n,value:v,get checked(){return state[n]===v},set checked(on){if(on)state[n]=v;else if(state[n]===v)state[n]=""},focus(){}});
 }
}
const modal={
 querySelector(q){const m=q.match(/name="checkin-([^"]+)"/);assert.ok(m,"Unexpected "+q);return state[m[1]]?{value:state[m[1]]}:null},
 addEventListener(t,cb){listeners["modal:"+t]=cb}
};
fields["checkin-modal"]=modal;
const scroll={scrollTop:10},contextObj={open:false};
const context=vm.createContext({
 Date,CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}},
 window:{dispatchEvent(){}},focused:0,
 document:{
  getElementById(id){if(!fields[id])throw Error("Unexpected ID "+id);return fields[id]},
  querySelector(q){
   if(q.includes('input[name="checkin-override"][value=""]'))return {set checked(v){state.override=""}};
   if(q.includes('input[name="checkin-override"]:checked'))return state.override?{value:state.override}:null;
   if(q==='input[name="checkin-sleep"]')return {focus(){context.focused++}};
   if(q.includes(".checkin-context"))return contextObj;
   if(q.includes(".checkin-scroll"))return scroll;
   throw Error("Unknown selector: "+q);
  },
  querySelectorAll(q){assert.ok(q.includes("checkin-modal input"));return radioInputs}
 },
 STUDY_MODES:{start:{label:"Vào nhịp"},focus:{label:"Đào sâu"},recover:{label:"Hồi trí"},overload:{label:"Quá tải"}},
 openModal(){},closeModal(){},setStudyMode(key){context.applied=key;return true},toast(){}
});
const logic=between("/* L1 physical-first self-report + learning rhythm heuristic.","document.getElementById(\"save-question\").addEventListener");
vm.runInContext(logic,context,{timeout:1000});
vm.runInContext(between('document.getElementById("close-checkin").addEventListener("click",closeCheckinModal);','document.getElementById("buddy-challenge").addEventListener'),context,{timeout:1000});
const physical=(sleep,move,rest)=>({sleep,move,rest});
const cases=[
 [physical("","",""),"","",null],
 [physical("yes","",""),"","",null],
 [physical("yes","yes",""),"high","steady",null],
 [physical("yes","yes","yes"),"","", "focus"],
 [physical("yes","no","yes"),"high","steady","recover"],
 [physical("no","no","no"),"","", "recover"],
 [physical("yes","unsure","yes"),"","",null],
 [physical("unsure","unsure","unsure"),"","",null],
 [physical("yes","yes","yes"),"medium","", "start"],
 [physical("yes","yes","yes"),"","warming", "start"],
 [physical("yes","yes","yes"),"low","", "recover"],
 [physical("yes","yes","yes"),"","hard", "recover"],
 [physical("no","yes","yes"),"low","hard","overload"],
 [physical("yes","yes","yes"),"low","hard","overload"],
 [physical("no","yes","yes"),"high","steady","recover"],
 [physical("yes","yes","yes"),"high","steady","focus"],
 [physical("invalid","yes","yes"),"","",null]
];
for(const [p,e,a,want] of cases){
 assert.equal(context.recommendStudyMode(p,e,a)?.mode??null,want,JSON.stringify({p,e,a,want}));
}
Object.assign(state,{sleep:"yes",move:"yes",rest:"",override:"focus"});
listeners["modal:change"]();
assert.equal(fields["apply-checkin"].disabled,true,"Override cannot bypass physical answer");
listeners["apply:click"]();assert.equal(context.applied,undefined);
state.rest="yes";listeners["modal:change"]();
assert.equal(fields["apply-checkin"].disabled,false);
assert.match(fields["checkin-recommendation"].textContent,/chọn Đào sâu thủ công/);
listeners["apply:click"]();assert.equal(context.applied,"focus");
assert.equal(context.window.LiL1.getPhysicalState().sleep,"yes");
state.sleep="no";state.energy="low";state.attention="hard";state.override="overload";
radioInputs[0].checked=true;contextObj.open=true;fields["checkin-override"].open=true;
listeners["open:click"]({currentTarget:fields["checkin"]});
for(const key of ["sleep","move","rest"])assert.equal(state[key],"","New check-in must clear "+key);
assert.equal(state.override,"");
assert.equal(fields["checkin-override"].open,false);
assert.equal(contextObj.open,false);
assert.equal(scroll.scrollTop,0);
assert.equal(radioInputs[0].checked,false);
assert.equal(fields["apply-checkin"].disabled,true);
listeners["skip:click"]();assert.equal(context.window.LiL1.getPhysicalState().sleep,"yes");
assert.ok(!logic.includes("localStorage"),"Self-report is in-memory only");
console.log(`LI_CHECKIN_PASS ${cases.length} mappings + required radio form / override / restart / skip / privacy assertions`);
