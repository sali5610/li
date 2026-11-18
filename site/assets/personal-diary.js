/* Opt-in local daily diary: check-in and real activity events; no server or health scoring. */
(function(){
"use strict";
const KEY="li.personal.daily.v1",CONSENT="li.personal.daily.enabled.v1";
const $=id=>document.getElementById(id);
if(!$("li-diary-calendar"))return;
const MODE={start:"Vào nhịp",focus:"Đào sâu",overload:"Quá tải",recover:"Hồi trí"};
const ANSWER={yes:"Có",no:"Chưa",unsure:"Không rõ"},TYPES=["lesson","branch","input"];
function localDay(when){const d=when?new Date(when):new Date();if(Number.isNaN(d.getTime()))return null;return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
let selected=localDay(),month=selected.slice(0,7),enabled=false,diary={schema:1,days:{}},storageError=false;
try{enabled=localStorage.getItem(CONSENT)==="true";const raw=localStorage.getItem(KEY);if(raw){const x=JSON.parse(raw);if(!x||x.schema!==1||!x.days||typeof x.days!=="object"||Array.isArray(x.days))throw Error("invalid");diary=x;}}catch(e){storageError=true;enabled=false;}
function safeDay(date){const x=diary.days[date];return x&&typeof x==="object"&&x.activities&&typeof x.activities==="object"?x:null;}
function counts(date){const x=safeDay(date);return TYPES.map(t=>Array.isArray(x?.activities[t])?x.activities[t].length:0);}
function put(update,date=localDay()){
 if(!enabled||storageError||!date)return false;
 const next=JSON.parse(JSON.stringify(diary));
 if(!next.days[date])next.days[date]={physical:null,mode:null,checkins:0,activities:{lesson:[],branch:[],input:[]}};
 const d=next.days[date];if(!d.activities||typeof d.activities!=="object")d.activities={lesson:[],branch:[],input:[]};
 for(const t of TYPES)if(!Array.isArray(d.activities[t]))d.activities[t]=[];
 if(!update(d))return false;
 try{const value=JSON.stringify(next);localStorage.setItem(KEY,value);if(localStorage.getItem(KEY)!==value)throw Error("readback");diary=next;render();return true;}catch(e){storageError=true;render();return false;}
}
function append(parent,tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);parent.append(e);return e;}
function render(){
 $("li-diary-consent").textContent=enabled?"Dừng ghi mới":"Bật lưu lịch";
 $("li-diary-consent").disabled=storageError;
 $("li-diary-consent-status").textContent=storageError?"Không thể đọc/ghi lịch. Đã dừng ghi để tránh mất dữ liệu.":enabled?"Đang ghi sự kiện mới trên trình duyệt này, không đồng bộ máy chủ.":"Chưa bật lưu lịch. Có thể xem dữ liệu cũ, nhưng không ghi thêm sự kiện mới.";
 $("li-diary-delete").disabled=storageError||!Object.keys(diary.days).length;
 $("li-diary-month").textContent=new Intl.DateTimeFormat("vi-VN",{month:"long",year:"numeric"}).format(new Date(month+"-01T12:00:00"));
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
  if(record)append(b,"span","li-diary-dot","•");
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
 }
 const rec=safeDay(selected),phy=rec?.physical;
 $("li-diary-selected").textContent=new Intl.DateTimeFormat("vi-VN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(selected+"T12:00:00"));
 for(const t of ["sleep","move","rest"])$("li-diary-"+t).textContent=phy&&ANSWER[phy[t]]?ANSWER[phy[t]]:"—";
 $("li-diary-mode").textContent=rec&&MODE[rec.mode]?MODE[rec.mode]:"—";
 $("li-diary-checkins").textContent=rec?String(rec.checkins||0):"—";
 const arr=counts(selected);TYPES.forEach((t,i)=>$("li-diary-count-"+t).textContent=rec?String(arr[i]):"—");
 $("li-diary-day-status").textContent=rec?(phy?"Thể trạng tự khai, không phải đo lường sức khỏe.":"Ngày có hoạt động/nhịp học nhưng chưa lưu Check-in thể trạng."):"Ngày này chưa có dữ liệu. Dấu — không đồng nghĩa với không học.";
}
function selectDate(e){const key=e.target.closest("button[data-date]")?.dataset.date;if(key){selected=key;render();}}
$("li-diary-calendar").addEventListener("click",selectDate);
$("li-diary-bars").addEventListener("click",selectDate);
function moveMonth(n){const d=new Date(month+"-01T12:00:00");d.setMonth(d.getMonth()+n);month=localDay(d).slice(0,7);selected=month+"-"+String(Math.min(Number(selected.slice(8)),new Date(d.getFullYear(),d.getMonth()+1,0).getDate())).padStart(2,"0");render();}
$("li-diary-prev").addEventListener("click",()=>moveMonth(-1));
$("li-diary-next").addEventListener("click",()=>moveMonth(1));
$("li-diary-checkin-now").addEventListener("click",()=>{const source=$("li-diary-checkin-now");const homeCheckin=$("checkin");if(homeCheckin){homeCheckin.click();$("checkin-modal").dataset.trigger=source.id;}});
$("li-diary-consent").addEventListener("click",()=>{
 try{if(enabled){localStorage.removeItem(CONSENT);if(localStorage.getItem(CONSENT)!==null)throw Error("readback");enabled=false;}else{localStorage.setItem(CONSENT,"true");if(localStorage.getItem(CONSENT)!=="true")throw Error("readback");enabled=true;}}catch(e){storageError=true;}render();
});
$("li-diary-delete").addEventListener("click",()=>{
 if(!window.confirm("Xóa toàn bộ lịch thể trạng và hoạt động đã lưu trên trình duyệt này? Không thể hoàn tác."))return;
 try{localStorage.removeItem(KEY);if(localStorage.getItem(KEY)!==null)throw Error("readback");diary={schema:1,days:{}};}catch(e){storageError=true;}render();
});
window.addEventListener("li:l1-physical-checkin",e=>{
 const x=e.detail;
 if(!x||!["yes","no","unsure"].includes(x.sleep)||!["yes","no","unsure"].includes(x.move)||!["yes","no","unsure"].includes(x.rest))return;
 put(d=>{d.physical={sleep:x.sleep,move:x.move,rest:x.rest,recordedAt:x.recordedAt};d.mode=MODE[x.selectedMode]?x.selectedMode:d.mode;d.checkins=(d.checkins||0)+1;return true;},localDay(x.recordedAt));
});
window.addEventListener("li:study-mode-applied",e=>{const mode=e.detail?.mode;if(MODE[mode])put(d=>{if(d.mode===mode)return false;d.mode=mode;return true;});});
window.addEventListener("li:lesson-submitted",e=>{const id=e.detail?.lessonId;if(typeof id==="string"&&["L09-1-2","L03-1-2","L15-2-2"].includes(id))put(d=>{if(d.activities.lesson.includes(id))return false;d.activities.lesson.push(id);return true;});});
window.addEventListener("li:activity",e=>{
 const detail=e.detail||{},type=detail.type,id=detail.id;
 if(!TYPES.includes(type)||typeof id!=="string"||!id.trim()||id.length>256)return;
 put(d=>{if(d.activities[type].includes(id))return false;d.activities[type].push(id);return true;});
});
render();
})();