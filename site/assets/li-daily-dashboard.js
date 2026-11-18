/* li. Tủ Riêng daily journal: opt-in local records, not a medical or proficiency score. */
(function(){
"use strict";
const KEY="li.personal.daily.v1", CONSENT="li.personal.daily-consent.v1";
const TYPES=["lesson","problem","input"];
const MODES={start:"Vào nhịp",focus:"Đào sâu",overload:"Quá tải",recover:"Hồi trí"};
let error=false,enabled=false,days={};
try{
 enabled=localStorage.getItem(CONSENT)==="yes";
 const raw=localStorage.getItem(KEY);
 if(raw!==null){
  const value=JSON.parse(raw);
  if(!value||value.schema!==1||!value.days||typeof value.days!=="object"||Array.isArray(value.days))throw Error("Invalid diary");
  days=value.days;
 }
}catch(e){enabled=false;error=true;}
const today=new Date();
let year=today.getFullYear(),month=today.getMonth(),selected=dateKey(today);
function el(id){return document.getElementById(id)}
function dateKey(d){
 return String(d.getFullYear())+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function dateLabel(k){
 const a=k.split("-").map(Number);
 return new Intl.DateTimeFormat("vi-VN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(a[0],a[1]-1,a[2]));
}
function blank(){
 return {physical:{sleep:null,move:null,rest:null},checkins:0,mode:null,activities:{lesson:[],problem:[],input:[]}};
}
function count(d,type){return Array.isArray(d&&d.activities&&d.activities[type])?d.activities[type].length:0}
function total(d){return TYPES.reduce((n,t)=>n+count(d,t),0)}
function notify(s){if(typeof window.toast==="function")window.toast(s)}
function write(mutator){
 if(!enabled||error)return false;
 const k=dateKey(new Date()),before=days[k],entry=JSON.parse(JSON.stringify(before||blank()));
 if(!entry.activities||!entry.physical)return false;
 mutator(entry);
 days[k]=entry;
 try{
  const raw=JSON.stringify({schema:1,days:days});
  localStorage.setItem(KEY,raw);
  if(localStorage.getItem(KEY)!==raw)throw Error("No readback");
 }catch(e){
  if(before===undefined)delete days[k];else days[k]=before;
  notify("Nhật Ký chưa lưu được trên thiết bị.");return false;
 }
 refresh();return true;
}
function recordActivity(type,id,mode){
 if(!TYPES.includes(type)||typeof id!=="string"||!id.trim())return false;
 return write(d=>{
  if(!Array.isArray(d.activities[type]))d.activities[type]=[];
  if(!d.activities[type].includes(id))d.activities[type].push(id);
  if(Object.prototype.hasOwnProperty.call(MODES,mode))d.mode=mode;
 });
}
function setConsent(value){
 if(error){notify("Lịch hiện không đọc được. Chưa ghi đè dữ liệu cũ.");refresh();return}
 try{
  localStorage.setItem(CONSENT,value?"yes":"no");
  if(localStorage.getItem(CONSENT)!==(value?"yes":"no"))throw Error("No readback");
  enabled=value;
 }catch(e){notify("Không lưu được lựa chọn ghi lịch.");}
 refresh();
}
function removeAll(){
 if(!window.confirm("Xóa vĩnh viễn toàn bộ lịch thể trạng và hoạt động đã ghi trên trình duyệt này? Không thể hoàn tác."))return;
 try{
  localStorage.removeItem(KEY);
  if(localStorage.getItem(KEY)!==null)throw Error("No readback");
  days={};error=false;refresh();notify("Đã xóa Nhật Ký trên thiết bị này.");
 }catch(e){notify("Chưa xóa được Nhật Ký.");}
}
function physicalValue(v){
 return v==="yes"?"Có":v==="no"?"Chưa":v==="unsure"?"Không rõ":"Không trả lời";
}
function checkinAnswers(){
 return {sleep:el("checkin-sleep").value||null,move:el("checkin-move").value||null,rest:el("checkin-rest").value||null};
}
function suggestion(a){
 const v=Object.values(a).filter(Boolean);
 if(!v.length)return null;
 if(v.includes("no"))return "recover";
 if(v.length===3&&v.every(x=>x==="yes"))return "focus";
 return "start";
}
function checkinGuidance(){
 const mode=suggestion(checkinAnswers()),target=el("checkin-guidance");
 if(target)target.textContent=mode
  ?"Nhịp gợi ý tạm thời: "+MODES[mode]+". Không phải đánh giá sức khỏe hay kết quả học."
  :"Chưa trả lời câu nào. Bạn có thể bỏ qua mà không ghi dữ liệu trống.";
}
function submitCheckin(useSuggestion){
 const answers=checkinAnswers(),mode=suggestion(answers);
 if(!mode){closeModal("checkin-modal");notify("Không ghi check-in trống.");return}
 if(useSuggestion&&typeof window.setStudyMode==="function")window.setStudyMode(mode);
 const current=document.querySelector("[data-ly-mode][aria-pressed='true']");
 const applied=current?current.dataset.lyMode:mode;
 const ok=write(d=>{
  d.physical=answers;d.checkins=(Number(d.checkins)||0)+1;
  d.mode=applied;
 });
 closeModal("checkin-modal");
 notify(ok?"Đã ghi check-in vào Nhật Ký.":enabled?"Chưa xác nhận lưu check-in.":"Check-in chỉ dùng trong phiên này. Bật lưu lịch nếu muốn theo dõi.");
}
function appendText(parent,tag,value,klass){
 const n=document.createElement(tag);if(klass)n.className=klass;n.textContent=value;parent.append(n);return n;
}
function renderMonth(){
 const root=el("daily-calendar-grid");if(!root)return;
 el("daily-month-title").textContent=new Intl.DateTimeFormat("vi-VN",{month:"long",year:"numeric"}).format(new Date(year,month,1));
 root.replaceChildren();
 ["T2","T3","T4","T5","T6","T7","CN"].forEach(x=>appendText(root,"span",x,"daily-weekday"));
 const offset=(new Date(year,month,1).getDay()+6)%7;
 for(let i=0;i<offset;i++)appendText(root,"span","","daily-blank");
 const countDays=new Date(year,month+1,0).getDate();
 for(let n=1;n<=countDays;n++){
  const key=dateKey(new Date(year,month,n)),d=days[key];
  const b=document.createElement("button");b.type="button";
  b.className="daily-day"+(key===selected?" selected":"")+(key===dateKey(new Date())?" today":"");
  b.setAttribute("aria-pressed",String(key===selected));
  b.setAttribute("aria-label",dateLabel(key)+(d?" · "+total(d)+" hoạt động"+(d.checkins?" · có check-in":""):" · chưa có dữ liệu"));
  appendText(b,"b",String(n));
  appendText(b,"span",d?total(d)+" hoạt động":"—","daily-count");
  appendText(b,"span",d&&d.checkins?"●":"·","daily-checkin"+(d&&d.checkins?" recorded":""));
  b.addEventListener("click",()=>{selected=key;renderMonth()});
  root.append(b);
 }
 const prefix=year+"-"+String(month+1).padStart(2,"0")+"-";
 const rows=Object.entries(days).filter(x=>x[0].startsWith(prefix)&&x[1]&&x[1].activities);
 const sums={lesson:0,problem:0,input:0,checkins:0};
 rows.forEach(x=>{TYPES.forEach(t=>sums[t]+=count(x[1],t));sums.checkins+=Number(x[1].checkins)||0});
 el("daily-month-summary").textContent=rows.length
  ?"Tháng này đã ghi: "+sums.lesson+" Bài · "+sums.problem+" Vấn đề · "+sums.input+" Input · "+sums.checkins+" check-in."
  :"Tháng này chưa có dữ liệu. Không đồng nghĩa không học.";
 const record=days[selected];
 el("daily-selected-date-physical").textContent=dateLabel(selected);
 el("daily-selected-date-learning").textContent=dateLabel(selected);
 const physical=el("daily-physical-detail");physical.replaceChildren();
 if(!record||!record.checkins)appendText(physical,"div","Chưa có check-in trong ngày được chọn.","state-note");
 else{
  [["sleep","Ngủ đủ"],["move","Vận động nhẹ"],["rest","Nghỉ ngơi"]].forEach(pair=>{
   const row=document.createElement("div");row.className="path-item";
   appendText(row,"span",pair[1]);appendText(row,"b",physicalValue(record.physical&&record.physical[pair[0]]));physical.append(row);
  });
  appendText(physical,"p",record.checkins+" lượt check-in; hiển thị câu trả lời gần nhất.","small");
 }
 el("daily-study-mode").textContent=record&&MODES[record.mode]?"Nhịp: "+MODES[record.mode]:"Chưa ghi nhận nhịp học";
 const counts=el("daily-activity-counts");counts.replaceChildren();
 [["lesson","Bài"],["problem","Vấn đề"],["input","Input"]].forEach(pair=>{
  const box=document.createElement("div");appendText(box,"b",record?String(count(record,pair[0])):"—");
  appendText(box,"span",pair[1]);counts.append(box);
 });
}
function refresh(){
 document.querySelectorAll("#daily-tracking-toggle, #settings-daily-tracking").forEach(input=>{
  input.checked=enabled;input.disabled=error;
 });
 const status=el("daily-tracking-status");
 if(status)status.textContent=error?"Lịch có lỗi đọc. Đã dừng ghi mới.":enabled
  ?"Đang ghi Nhật Ký trên thiết bị này."
  :"Đang tắt ghi mới. Dữ liệu cũ (nếu có) vẫn xem và xóa được.";
 const preview=el("library-daily-preview"),d=days[dateKey(new Date())];
 if(preview)preview.textContent=d?"Hôm nay: "+total(d)+" hoạt động · Nhịp "+(MODES[d.mode]||"chưa ghi nhận")+". Xem chi tiết trong Nhật Ký.":"Đối chiếu check-in, nhịp học và Bài / Vấn đề / Input theo từng ngày.";
 if(el("page-dashboard")&&el("page-dashboard").classList.contains("active"))renderMonth();
}
function init(){
 document.querySelectorAll("#daily-tracking-toggle, #settings-daily-tracking").forEach(input=>input.addEventListener("change",()=>setConsent(input.checked)));
 const prev=el("daily-month-prev"),next=el("daily-month-next");
 if(prev)prev.addEventListener("click",()=>{month--;if(month<0){month=11;year--}selected=dateKey(new Date(year,month,1));renderMonth()});
 if(next)next.addEventListener("click",()=>{month++;if(month>11){month=0;year++}selected=dateKey(new Date(year,month,1));renderMonth()});
 el("daily-month-today").addEventListener("click",()=>{const now=new Date();year=now.getFullYear();month=now.getMonth();selected=dateKey(now);renderMonth()});
 el("clear-daily-history").addEventListener("click",removeAll);
 el("open-dashboard-checkin").addEventListener("click",()=>openModal("checkin-modal"));
 ["sleep","move","rest"].forEach(t=>el("checkin-"+t).addEventListener("change",checkinGuidance));
 el("record-checkin").addEventListener("click",()=>submitCheckin(false));
 el("suggest-light").addEventListener("click",()=>submitCheckin(true));
 window.addEventListener("li:lesson-submitted",e=>{const id=e.detail&&e.detail.lessonId;if(typeof id==="string"){const active=document.querySelector("[data-ly-mode][aria-pressed='true']");recordActivity("lesson",id,active?active.dataset.lyMode:null)}});
 refresh();
}
function validBackup(backup){
 if(!backup||backup.schema!==1||!backup.days||typeof backup.days!=="object"||Array.isArray(backup.days))return false;
 const records=Object.entries(backup.days);if(records.length>10000)return false;
 for(const [date,row] of records){
  if(!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date)||
    !row||typeof row!=="object"||!row.physical||!row.activities||
    !Number.isInteger(row.checkins)||row.checkins<0||row.checkins>10000)return false;
  if(!["sleep","move","rest"].every(k=>[null,"yes","no","unsure"].includes(row.physical[k])))return false;
  if(![null,"start","focus","overload","recover"].includes(row.mode))return false;
  if(!TYPES.every(k=>Array.isArray(row.activities[k])&&row.activities[k].length<=10000&&
    row.activities[k].every(x=>typeof x==="string"&&x.length>0&&x.length<=1000)))return false;
 }
 return true;
}
function backup(){
 if(error)throw Error("Journal storage unreadable");
 return {schema:1,days:JSON.parse(JSON.stringify(days))};
}
function reload(){
 try{
  const raw=localStorage.getItem(KEY),value=raw?JSON.parse(raw):{schema:1,days:{}};
  if(!validBackup(value))throw Error("Invalid journal");
  days=value.days;error=false;
 }catch(e){error=true;notify("Lịch nhập vào không đọc được. Đã dừng ghi mới.");}
 refresh();
}
window.LiDaily={recordActivity:recordActivity,refresh:refresh,render:renderMonth,backup:backup,validBackup:validBackup,reload:reload};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();