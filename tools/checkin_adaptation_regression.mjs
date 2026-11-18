// L1 physical-first contract; zero external packages. Run with Node 22.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../site/assets/checkin-adaptation.css",import.meta.url),"utf8");
function between(startText,endText){
 const a=html.indexOf(startText),b=html.indexOf(endText,a+startText.length);
 assert.ok(a>=0&&b>a,`Missing source boundary: ${startText}`);
 return html.slice(a,b);
}
const elements={};
let focused=0,applied=null,closed=null,opened=false,toasted="",energy="",attention="",events=[];
const listeners={};
for(const key of ["sleep","move","rest"]){
 elements["checkin-"+key]={value:"",focus(){focused++}};
}
elements["checkin-override"]={value:""};
elements["checkin-recommendation"]={textContent:""};
elements["apply-checkin"]={disabled:true,addEventListener(type,cb){listeners["apply:"+type]=cb}};
elements["checkin"]={focus(){focused++},addEventListener(type,cb){listeners["open:"+type]=cb}};
elements["close-checkin"]={addEventListener(type,cb){listeners["close:"+type]=cb}};
const radioInputs=[{checked:false},{checked:false}];
const details={open:false};
const modal={
 querySelector(query){
  if(query.includes("checkin-energy"))return energy?{value:energy}:null;
  if(query.includes("checkin-attention"))return attention?{value:attention}:null;
  throw Error("Unknown checkin query "+query);
 },
 addEventListener(type,cb){listeners["modal:"+type]=cb}
};
elements["checkin-modal"]=modal;
const context=vm.createContext({
 window:{dispatchEvent(event){events.push(event)}},
 CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},
 document:{
  getElementById(id){assert.ok(elements[id],"Missing ID "+id);return elements[id]},
  querySelectorAll(query){assert.match(query,/checkin-modal input/);return radioInputs},
  querySelector(query){assert.match(query,/checkin-context/);return details}
 },
 STUDY_MODES:{start:{label:"Vào nhịp"},focus:{label:"Đào sâu"},recover:{label:"Hồi trí"},overload:{label:"Quá tải"}},
 openModal(id){assert.equal(id,"checkin-modal");opened=true},
 closeModal(id){closed=id},
 setStudyMode(mode){applied=mode;return true},
 toast(message){toasted=message}
});
const logic=between("/* L1 physical-first self-report + learning rhythm heuristic.","document.getElementById(\"save-question\").addEventListener");
vm.runInContext(logic,context,{timeout:1000});
vm.runInContext(between('document.getElementById("close-checkin").addEventListener("click",closeCheckinModal);','document.getElementById("buddy-challenge").addEventListener'),context,{timeout:1000});
const P=(sleep,move,rest)=>({sleep,move,rest});
const matrix=[
 [P("","",""),"","",null],
 [P("yes","",""),"","",null],
 [P("yes","yes",""),"high","steady",null],
 [P("invalid","yes","yes"),"","",null],
 [P("yes","yes","yes"),"","", "focus"],
 [P("yes","no","yes"),"high","steady","recover"],
 [P("no","no","no"),"","", "recover"],
 [P("yes","unsure","yes"),"","", "start"],
 [P("unsure","unsure","unsure"),"","", "start"],
 [P("yes","yes","yes"),"medium","", "start"],
 [P("yes","yes","yes"),"","warming", "start"],
 [P("yes","yes","yes"),"low","", "recover"],
 [P("yes","yes","yes"),"","hard", "recover"],
 [P("no","yes","yes"),"low","hard","overload"],
 [P("yes","yes","yes"),"low","hard","overload"]
];
for(const [physical,e,a,want] of matrix){
 const actual=context.recommendStudyMode(physical,e,a)?.mode??null;
 assert.equal(actual,want,`Wrong recommendation ${JSON.stringify(physical)} ${e} ${a}`);
}
assert.equal((html.match(/id="checkin-(?:sleep|move|rest)"/g)||[]).length,3);
for(const key of ["sleep","move","rest"]){assert.ok(html.includes(`<select id="checkin-${key}" class="checkin-physical-select" required`))}
assert.equal((html.match(/<option value="yes">Có<\/option>/g)||[]).length,3);
assert.equal((html.match(/<option value="no">Chưa<\/option>/g)||[]).length,3);
assert.equal((html.match(/<option value="unsure">Không rõ<\/option>/g)||[]).length,3);
assert.ok(html.includes('id="close-checkin">Bỏ qua'));
assert.ok(html.includes('id="apply-checkin" disabled'));
assert.ok(html.includes('function recordL1PhysicalCheckin('));
assert.ok(css.includes("#checkin-modal .checkin-physical-field"));
assert.ok(!html.includes('data-checkin-context="sleep"'));
assert.equal(typeof listeners["modal:change"],"function");
const fire=()=>listeners["modal:change"]();
const setP=(sleep,move,rest)=>{
 elements["checkin-sleep"].value=sleep;
 elements["checkin-move"].value=move;
 elements["checkin-rest"].value=rest;
 fire();
};
setP("yes","yes","");
elements["checkin-override"].value="overload";fire();
assert.equal(elements["apply-checkin"].disabled,true,"Override cannot bypass physical state");
listeners["apply:click"]();
assert.equal(applied,null,"No apply with incomplete physical state");
assert.equal(context.window.LiL1.getPhysicalState(),null,"No incomplete L1 session data");
setP("yes","yes","yes");
assert.equal(elements["apply-checkin"].disabled,false);
assert.match(elements["checkin-recommendation"].textContent,/chọn Quá tải thủ công/i);
listeners["apply:click"]();
assert.equal(applied,"overload");
assert.equal(events.length,1);
assert.equal(events[0].type,"li:l1-physical-checkin");
assert.equal(events[0].detail.sleep,"yes");
assert.equal(events[0].detail.move,"yes");
assert.equal(events[0].detail.rest,"yes");
assert.equal(events[0].detail.selectedMode,"overload");
assert.equal(context.window.LiL1.getPhysicalState().selectedMode,"overload");
assert.equal(closed,"checkin-modal");
assert.ok(focused>0);
assert.match(toasted,/Đã ghi L1/);
energy="low";attention="hard";radioInputs[0].checked=true;
details.open=true;elements["checkin-override"].value="recover";
elements["checkin-sleep"].value="no";
listeners["open:click"]({currentTarget:elements["checkin"]});
assert.ok(opened);assert.equal(elements["checkin-sleep"].value,"");
assert.equal(elements["checkin-move"].value,"");
assert.equal(elements["checkin-rest"].value,"");
assert.equal(elements["checkin-override"].value,"");
assert.equal(radioInputs[0].checked,false);
assert.equal(details.open,false);
assert.equal(elements["apply-checkin"].disabled,true);
const previous=context.window.LiL1.getPhysicalState();
listeners["close:click"]();
assert.equal(events.length,1,"Skipping must not record");
assert.equal(context.window.LiL1.getPhysicalState().recordedAt,previous.recordedAt);
assert.ok(!logic.includes("localStorage"),"Physical self-report must not use browser persistence");
assert.ok(!html.includes("data-checkin-context"),"Old optional context removed");
console.log(`LI_CHECKIN_PASS ${matrix.length} mapping cases + mandatory, override, apply, session state, reopen, skip and source checks`);
