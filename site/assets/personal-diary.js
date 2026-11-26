/* Daily diary/check-ins: local-first; signed Neon replication only after explicit per-account consent. No health scoring. */
(function(){
"use strict";
const KEY="li.personal.daily.v1",CONSENT="li.personal.daily.enabled.v1";
const $=id=>document.getElementById(id);
if(!$("li-diary-calendar"))return;
const MODE={start:"Vào nhịp",focus:"Đào sâu",overload:"Quá tải",recover:"Hồi trí"};
const ANSWER={yes:"Có",no:"Chưa",unsure:"Không rõ"},TYPES=["lesson","branch","input"];
function localDay(when){const d=when?new Date(when):new Date();if(Number.isNaN(d.getTime()))return null;return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
let selected=localDay(),month=selected.slice(0,7),enabled=false,diary={schema:1,days:{}},storageError=false;
try{
 const choice=localStorage.getItem(CONSENT),raw=localStorage.getItem(KEY);
 // Fresh installs default ON per PO. Existing paused journals have a ledger but
 // no consent key under v1: keep them OFF rather than overriding the prior pause.
 enabled=choice==="true"||(choice===null&&raw===null);
 if(choice===null){
  localStorage.setItem(CONSENT,enabled?"true":"false");
  if(localStorage.getItem(CONSENT)!==(enabled?"true":"false"))throw Error("consent readback");
 }
 if(raw){const x=JSON.parse(raw);if(!x||x.schema!==1||!x.days||typeof x.days!=="object"||Array.isArray(x.days))throw Error("invalid");diary=x;}
}catch(e){storageError=true;enabled=false;}
function safeDay(date){const x=diary.days[date];return x&&typeof x==="object"&&x.activities&&typeof x.activities==="object"?x:null;}
function counts(date){const x=safeDay(date);return TYPES.map(t=>Array.isArray(x?.activities[t])?x.activities[t].length:0);}
function journalCloudEnabled(){
 const uid=localStorage.getItem("li.sync.local-owner.v1");
 return Boolean(uid)&&localStorage.getItem("li.sync.journal-cloud-consent.v1:"+uid)==="true";
}
function personalChanged(){window.dispatchEvent(new Event("li:private-personal-change"));}
function put(update,date=localDay()){
 if(!enabled||storageError||!date)return false;
 const next=JSON.parse(JSON.stringify(diary));
 if(!next.days[date])next.days[date]={physical:null,mode:null,checkins:0,activities:{lesson:[],branch:[],input:[]}};
 const d=next.days[date];if(!d.activities||typeof d.activities!=="object")d.activities={lesson:[],branch:[],input:[]};
 for(const t of TYPES)if(!Array.isArray(d.activities[t]))d.activities[t]=[];
 if(!update(d))return false;
 try{const value=JSON.stringify(next);localStorage.setItem(KEY,value);if(localStorage.getItem(KEY)!==value)throw Error("readback");diary=next;render();personalChanged();return true;}catch(e){storageError=true;render();return false;}
}
// Render and React snapshots derive from ledger state, never hidden DOM text.
function recordingStatus(){
 return storageError?"Không thể đọc/ghi lịch. Đã dừng ghi để tránh mất dữ liệu.":enabled?
  (journalCloudEnabled()?"Đang ghi Check-in và hoạt động, đồng bộ riêng tư với Neon theo tài khoản.":"Đang ghi trên thiết bị. Bật đồng bộ Nhật Ký trong Cài đặt → Dữ liệu của bạn để dùng trên các máy khác."):
  "Đã dừng ghi mới; các ngày cũ vẫn có thể xem và xóa.";
}
function recordedDayStatus(record){
 return record?(record.physical?"Thể trạng tự khai, không phải đo lường sức khỏe.":"Ngày có hoạt động/nhịp học nhưng chưa lưu Check-in thể trạng."):
  "Ngày này chưa có dữ liệu. Dấu — không đồng nghĩa với không học.";
}
function calendarLocale(){return window.liLanguage?.get?.()==="en"?"en-US":"vi-VN";}
function monthLabel(){
 return new Intl.DateTimeFormat(calendarLocale(),{month:"long",year:"numeric"}).format(new Date(month+"-01T12:00:00"));
}
function selectedLabel(){
 return new Intl.DateTimeFormat(calendarLocale(),{weekday:"long",day:"numeric",month:"long",year:"numeric"})
  .format(new Date(selected+"T12:00:00"));
}
function append(parent,tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);parent.append(e);return e;}
function render(){
 // Invited React Journal reads the ledger model directly. Never redraw the
 // hidden native calendar/chart or mutate the React Check-in disclosure.
 if(window.liReactDiaryMounted){notifyReactDiary();return;}
 $("li-diary-consent").textContent=enabled?"Dừng ghi mới":"Bật lưu lịch";
 $("li-diary-consent").disabled=storageError;
 $("li-diary-consent-status").textContent=recordingStatus();
 const disclosure=$("li-checkin-recording-disclosure");
 if(disclosure)disclosure.textContent=storageError?"Không thể lưu nhật ký trên thiết bị này. Check-in chỉ giữ trong phiên; hãy tự ghi lại nếu cần.":enabled?(journalCloudEnabled()?"Đang lưu Check-in và đồng bộ với Neon. Có thể dừng ghi trong Nhật Ký.":"Đang lưu Check-in trên máy; chưa gửi lên cloud. Bật đồng bộ Nhật Ký trong Cài đặt → Dữ liệu của bạn."):"Bạn đã dừng lưu Nhật Ký. Check-in này chỉ giữ trong phiên, không ghi thêm vào lịch.";
 $("li-diary-delete").disabled=storageError||!Object.keys(diary.days).length;
 $("li-diary-month").textContent=monthLabel();
 const parts=month.split("-").map(Number),yr=parts[0],mo=parts[1];
 const days=new Date(yr,mo,0).getDate(),offset=(new Date(yr,mo-1,1).getDay()+6)%7;
 const calendar=$("li-diary-calendar");calendar.replaceChildren();
 for(let i=0;i<offset;i++)append(calendar,"span","li-diary-blank","");
 let sums=[0,0,0],recorded=0,max=1;
 for(let d=1;d<=days;d++){const key=month+"-"+String(d).padStart(2,"0");if(!safeDay(key))continue;recorded++;const arr=counts(key);sums=sums.map((n,i)=>n+arr[i]);max=Math.max(max,arr.reduce((a,b)=>a+b,0));}
 for(let d=1;d<=days;d++){
  const key=month+"-"+String(d).padStart(2,"0"),record=safeDay(key);
  const b=append(calendar,"button","li-diary-date"+(key===selected?" selected":"")+(record?" recorded":""),String(d));
  b.type="button";b.dataset.date=key;b.setAttribute("aria-pressed",String(key===selected));
  b.setAttribute("aria-label",d+"/"+mo+"/"+yr+": "+(record?counts(key).reduce((a,b)=>a+b,0)+" hoạt động được ghi nhận":"chưa có nhật ký"));
  if(record)append(b,"span","li-diary-dot",String(counts(key).reduce((a,n)=>a+n,0)));
 }
 $("li-diary-month-total").textContent=recorded?"Trong "+recorded+" ngày có ghi nhận: "+sums[0]+" bài · "+sums[1]+" vấn đề · "+sums[2]+" input.":"Tháng này chưa có dữ liệu được ghi nhận.";
 const bars=$("li-diary-bars");bars.replaceChildren();
 for(let d=1;d<=days;d++){
  const key=month+"-"+String(d).padStart(2,"0"),record=safeDay(key),total=counts(key).reduce((a,b)=>a+b,0);
  const b=append(bars,"button","li-diary-bar-day"+(key===selected?" selected":""),"");
  b.type="button";b.dataset.date=key;b.setAttribute("aria-pressed",String(key===selected));
  b.setAttribute("aria-label",d+"/"+mo+"/"+yr+": "+(record?total+" hoạt động":"chưa ghi nhận"));
  const track=append(b,"span","li-diary-bar-track","");
  const bar=append(track,"span","li-diary-bar-value"+(record?" recorded":""),"");
  bar.style.height=record?(total===0?"4px":Math.max(12,Math.round(total/max*100))+"%"):"0";
  append(b,"span","li-diary-bar-label",String(d));
  append(b,"span","li-diary-bar-total",record?String(total):"—");
 }
 const rec=safeDay(selected),phy=rec?.physical;
 $("li-diary-selected").textContent=selectedLabel();
 for(const t of ["sleep","move","rest"])$("li-diary-"+t).textContent=phy&&ANSWER[phy[t]]?ANSWER[phy[t]]:"—";
 $("li-diary-mode").textContent=rec&&MODE[rec.mode]?MODE[rec.mode]:"—";
 $("li-diary-checkins").textContent=rec?String(rec.checkins||0):"—";
 const arr=counts(selected);TYPES.forEach((t,i)=>$("li-diary-count-"+t).textContent=rec?String(arr[i]):"—");
 $("li-diary-day-status").textContent=recordedDayStatus(rec);
 notifyReactDiary();
}

/* Read-only model and native actions for one React Journal view.
 * The existing ledger owns dates, deletion/Undo, consent and Neon replication. */
function getView(){
 const [yr,mo]=month.split("-").map(Number),numDays=new Date(yr,mo,0).getDate();
 const offset=(new Date(yr,mo-1,1).getDay()+6)%7;
 const days=Array.from({length:numDays},(_,i)=>{
  const key=month+"-"+String(i+1).padStart(2,"0");
  const record=safeDay(key),arr=counts(key);
  return {day:i+1,key,recorded:!!record,total:arr.reduce((a,b)=>a+b,0),counts:arr};
 });
 const totals=days.filter(day=>day.recorded).reduce((acc,day)=>({
  recorded:acc.recorded+1,
  counts:acc.counts.map((value,i)=>value+day.counts[i])
 }),{recorded:0,counts:[0,0,0]});
 const record=safeDay(selected),physical=record?.physical||null;
 return {
  month,selected,offset,days,totals,
  monthLabel:monthLabel(),
  selectedLabel:selectedLabel(),
  physical:{
   sleep:physical&&ANSWER[physical.sleep]||"—",
   move:physical&&ANSWER[physical.move]||"—",
   rest:physical&&ANSWER[physical.rest]||"—"
  },
  mode:record&&MODE[record.mode]||"—",
  checkins:record?String(record.checkins||0):"—",
  counts:record?counts(selected).map(String):["—","—","—"],
  dayStatus:recordedDayStatus(record),
  consentStatus:recordingStatus(),
  enabled,storageError,hasRecords:Object.keys(diary.days).length>0
 };
}
// Today is independent of the selected calendar date. No guest access, no
// separate storage: restore only the signed-in owner's existing Journal.
function getTodayCheckin(uid){
 try{
  if(!uid||!document.documentElement.classList.contains("li-auth-verified")||
   localStorage.getItem("li.sync.local-owner.v1")!==uid||storageError)return null;
  const record=safeDay(localDay()),physical=record?.physical;
  if(!physical)return null;
  return {...physical,selectedMode:physical.selectedMode||record.mode};
 }catch{return null;}
}
function actReact(kind,value){
 if(kind==="select"&&typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&
  value.slice(0,7)===month&&Number(value.slice(8))>=1&&
  Number(value.slice(8))<=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate()){
  selected=value;render();return;
 }
 if(kind==="prev"){moveMonth(-1);return;}
 if(kind==="next"){moveMonth(1);return;}
 if(kind==="checkin"){openCheckin(value||"li-diary-checkin-now");return;}
 if(kind==="consent"){toggleRecording();return;}
 if(kind==="delete"){return deleteDiary();}
  if(kind==="deleteConfirmed"){return deleteDiary(true);}
}
function notifyReactDiary(){
 if(typeof window.dispatchEvent==="function"&&typeof Event==="function")
  window.dispatchEvent(new Event("li:diary-view-changed"));
}
function selectDate(e){const key=e.target.closest("button[data-date]")?.dataset.date;if(key){selected=key;render();}}
$("li-diary-calendar").addEventListener("click",selectDate);
$("li-diary-bars").addEventListener("click",selectDate);
function moveMonth(n){const d=new Date(month+"-01T12:00:00");d.setMonth(d.getMonth()+n);month=localDay(d).slice(0,7);selected=month+"-"+String(Math.min(Number(selected.slice(8)),new Date(d.getFullYear(),d.getMonth()+1,0).getDate())).padStart(2,"0");render();}
$("li-diary-prev").addEventListener("click",()=>moveMonth(-1));
$("li-diary-next").addEventListener("click",()=>moveMonth(1));
function openCheckin(triggerId="li-diary-checkin-now"){
 window.dispatchEvent(new CustomEvent("li:open-checkin",{detail:{triggerId}}));
}
function toggleRecording(){
 if(storageError)return false;
 try{
  const next=enabled?"false":"true";
  localStorage.setItem(CONSENT,next);
  if(localStorage.getItem(CONSENT)!==next)throw Error("readback");
  enabled=next==="true";
 }catch(e){storageError=true;}
 render();personalChanged();
 return !storageError;
}
function deleteDiary(confirmed=false){
 if(storageError||!Object.keys(diary.days).length)return false;
 if(!confirmed&&!window.confirm("Xóa toàn bộ lịch thể trạng và hoạt động trên thiết bị này? Bạn có 7 giây để hoàn tác."))return false;
 const prior=JSON.parse(JSON.stringify(diary));
 try{
  const empty=JSON.stringify({schema:1,days:{}});
  localStorage.setItem(KEY,empty);if(localStorage.getItem(KEY)!==empty)throw Error("readback");
  diary={schema:1,days:{}};window.dispatchEvent(new Event("li:checkin-history-deleted"));render();personalChanged();
  if(typeof window.liShowUndo==="function")window.liShowUndo("Đã xóa lịch hoạt động.",()=>{
   if(storageError)return false;
   const restored=JSON.parse(JSON.stringify(prior));
   for(const [date,current] of Object.entries(diary.days)){
    if(!restored.days[date]){restored.days[date]=current;continue;}
    const existing=restored.days[date];
    existing.physical=current.physical||existing.physical;
    existing.mode=current.mode||existing.mode;
    existing.checkins=(existing.checkins||0)+(current.checkins||0);
    for(const type of TYPES){
     const previous=Array.isArray(existing.activities?.[type])?existing.activities[type]:[];
     const added=Array.isArray(current.activities?.[type])?current.activities[type]:[];
     if(!existing.activities)existing.activities={};
     existing.activities[type]=[...new Set([...previous,...added])];
    }
   }
   try{
    const data=JSON.stringify(restored);localStorage.setItem(KEY,data);
    if(localStorage.getItem(KEY)!==data)throw Error("readback");
    diary=restored;render();personalChanged();return true;
   }catch(error){storageError=true;render();return false;}
  });
 }catch(e){storageError=true;render();if(typeof toast==="function")toast("Không xóa được nhật ký. Hãy kiểm tra bộ nhớ trình duyệt.");return false;}
 return true;
}
$("li-diary-checkin-now").addEventListener("click",()=>openCheckin());
$("li-diary-consent").addEventListener("click",toggleRecording);
$("li-diary-delete").addEventListener("click",deleteDiary);
window.addEventListener("li:l1-physical-checkin",e=>{
 const x=e.detail;
 if(!x||!["yes","no","unsure"].includes(x.sleep)||!["yes","no","unsure"].includes(x.move)||!["yes","no","unsure"].includes(x.rest))return;
 put(d=>{
  d.physical={sleep:x.sleep,move:x.move,rest:x.rest,recordedAt:x.recordedAt};
  // Only explicitly applied inputs, under the same existing Journal
  // recording and optional cloud consent. Older records remain readable.
  if(["high","medium","low"].includes(x.energy))d.physical.energy=x.energy;
  if(["steady","warming","hard"].includes(x.attention))d.physical.attention=x.attention;
  if(MODE[x.override]||x.override==="")d.physical.override=x.override;
  if(MODE[x.selectedMode]){d.physical.selectedMode=x.selectedMode;d.mode=x.selectedMode;}
  d.checkins=(d.checkins||0)+1;return true;
 },localDay(x.recordedAt));
});
window.addEventListener("li:study-mode-applied",e=>{const mode=e.detail?.mode;if(MODE[mode])put(d=>{if(d.mode===mode)return false;d.mode=mode;return true;});});
window.addEventListener("li:lesson-submitted",e=>{const id=e.detail?.lessonId;if(typeof id==="string"&&["L09-1-2","L03-1-2","L15-2-2"].includes(id))put(d=>{if(d.activities.lesson.includes(id))return false;d.activities.lesson.push(id);return true;});});
// The invited React learner writes a saved attempt before publishing this event.
// Count all learnable submissions (3 releases + 17 personal lessons), not drafts.
function trackReactLessonSubmission(event){
 const id=event.detail?.lessonId;
 if(!enabled||storageError||typeof id!=="string"||
  !document.documentElement.classList.contains("li-auth-verified"))return;
 // Reuse the actual permitted React routes. No second hard-coded 3/17 registry.
 if(!Object.prototype.hasOwnProperty.call(window.liReleasedLessonRoutes||{},id)&&
  !Object.prototype.hasOwnProperty.call(window.liPersonalStudyRoutes||{},id))return;
 try{
  if(!localStorage.getItem("li.sync.local-owner.v1"))return;
  const raw=localStorage.getItem("li.review."+id+".v1");
  if(!raw||raw.length>60000)return;
  const attempt=JSON.parse(raw);
  if(attempt?.submitted!==true||typeof attempt.submittedAt!=="string")return;
  const date=localDay(attempt.submittedAt);
  if(!date)return;
  put(day=>{if(day.activities.lesson.includes(id))return false;
   day.activities.lesson.push(id);return true;},date);
 }catch{/* Invalid or inaccessible attempt: never fabricate diary activity. */}
}
window.addEventListener("li:lesson-attempt-changed",trackReactLessonSubmission);
window.addEventListener("li:activity",e=>{
 const detail=e.detail||{},type=detail.type,id=detail.id;
 if(!TYPES.includes(type)||typeof id!=="string"||!id.trim()||id.length>256)return;
 put(d=>{if(d.activities[type].includes(id))return false;d.activities[type].push(id);return true;});
});
window.addEventListener?.("li:localechange",render);
window.addEventListener?.("li:private-sync-consent",render);
window.addEventListener?.("li:personal-sync-applied",event=>{
 const detail=event.detail||{},owner=localStorage.getItem("li.sync.local-owner.v1");
 if(!owner||owner!==detail.accountId||!Array.isArray(detail.keys))return;
 if(!detail.keys.some(key=>[KEY,CONSENT,"li.sync.journal-cloud-consent.v1:"+owner].includes(key)))return;
 try{
  const raw=localStorage.getItem(KEY),choice=localStorage.getItem(CONSENT);
  const next=raw?JSON.parse(raw):{schema:1,days:{}};
  if(!next||next.schema!==1||!next.days||Array.isArray(next.days))throw Error("INVALID_JOURNAL");
  diary=next;enabled=choice==="true";storageError=false;
 }catch{
  storageError=true;enabled=false; // fail closed; never display stale/private data
 }
 render(); // Live calendar + check-ins, not a whole-page refresh
});
render();
window.liPersonalDiary=Object.freeze({getView,getTodayCheckin,act:actReact,refreshNative:render});
})();