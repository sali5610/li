/* UX-DS-11: interactive design review specimens. All activity counts are FIXED
   DEMO data. Nothing here touches the actual Tủ Riêng private journal. */
(function(){
"use strict";
const q=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const status=q("#ds11-status");
function say(message){if(status)status.textContent="Specimen · "+message;}
all("[data-ds11-icon]").forEach(button=>button.addEventListener("click",()=>{
 const act=button.dataset.ds11Icon;
 if(act==="bookmark"){
  const now=button.getAttribute("aria-pressed")!=="true";
  button.setAttribute("aria-pressed",String(now));
  button.setAttribute("aria-label",now?"Bỏ lưu demo":"Lưu demo");
  say(now?"Đã chọn lưu trong bản mẫu, không ghi vào Tủ Riêng.":"Đã bỏ chọn lưu trong bản mẫu.");
 }else if(act==="search"){
  q("#ds11-icon-input")?.focus();say("Đã đưa focus vào ô tìm kiếm mẫu.");
 }else if(act==="close"){
  const inp=q("#ds11-icon-input");if(inp){inp.value="";inp.focus();}
  say("Đã xóa từ khóa mẫu.");
 }else if(act==="trash"){
  say("Thùng rác chỉ minh họa nút xóa; không có dữ liệu bị xóa.");
 }
}));
all("[data-ds11-small]").forEach(b=>b.addEventListener("click",()=>say("Button nhỏ: "+b.textContent.trim()+" · không lưu dữ liệu.")));
const input=q("#ds11-icon-input");
input?.addEventListener("input",()=>q("#ds11-search-caption").textContent=input.value?"Đang nhập: "+input.value:"Nhập gì đó để thử icon input.");
const lang=q("#ds11-lang-switch");
lang?.addEventListener("click",()=>{
 const english=lang.getAttribute("aria-checked")!=="true";
 lang.setAttribute("aria-checked",String(english));
 lang.setAttribute("aria-label",english?"Đổi ngôn ngữ từ English sang Tiếng Việt":"Đổi ngôn ngữ từ Tiếng Việt sang English");
 q("#ds11-lang-caption").textContent=english?"English selected · demo only":"Tiếng Việt được chọn · chỉ là demo";
});
const trigger=q("#ds11-dropdown-trigger"),menu=q("#ds11-dropdown-menu"),menuItems=()=>all("[data-ds11-option]");
function closeMenu(focus=false){menu.hidden=true;trigger.setAttribute("aria-expanded","false");if(focus)trigger.focus();}
function openMenu(){menu.hidden=false;trigger.setAttribute("aria-expanded","true");const item=menuItems().find(x=>x.getAttribute("aria-checked")==="true")||menuItems()[0];item?.focus();}
trigger?.addEventListener("click",()=>menu.hidden?openMenu():closeMenu());
trigger?.addEventListener("keydown",e=>{if(e.key==="ArrowDown"||e.key==="Enter"||e.key===" "){e.preventDefault();openMenu();}});
menuItems().forEach((b,i)=>{
 b.addEventListener("click",()=>{
  menuItems().forEach(item=>item.setAttribute("aria-checked",String(item===b)));
  q("#ds11-dropdown-label").textContent=b.textContent.trim();closeMenu(true);
  q("#ds11-dropdown-caption").textContent="Chọn: "+b.textContent.trim()+" · chỉ là demo";
 });
 b.addEventListener("keydown",e=>{
  const items=menuItems();
  if(e.key==="Escape"){e.preventDefault();closeMenu(true);}
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();items[(i+(e.key==="ArrowDown"?1:-1)+items.length)%items.length].focus();}
  if(e.key==="Home"){e.preventDefault();items[0].focus();}
  if(e.key==="End"){e.preventDefault();items[items.length-1].focus();}
 });
});
document.addEventListener("pointerdown",e=>{if(trigger&&!e.target.closest("#ds11-dropdown"))closeMenu();});
all("[data-ds11-sidebar]").forEach(button=>button.addEventListener("click",()=>{
 all("[data-ds11-sidebar]").forEach(x=>x.removeAttribute("aria-current"));
 button.setAttribute("aria-current","page");
 q("#ds11-sidebar-preview").textContent=button.textContent.trim();
}));
all("[data-ds11-list]").forEach(button=>button.addEventListener("click",()=>{
 all("[data-ds11-list]").forEach(x=>x.removeAttribute("aria-current"));
 button.setAttribute("aria-current","true");
 q("#ds11-list-caption").textContent="Đã chọn hàng: "+button.querySelector("strong").textContent+" · demo";
}));
function updateChecks(){
 const checked=all("[data-ds11-check]:checked").map(i=>i.value);
 q("#ds11-check-caption").textContent=checked.length?"Đã chọn: "+checked.join(", "):"Chưa chọn mục nào.";
}
all("[data-ds11-check]").forEach(x=>x.addEventListener("change",updateChecks));
all('[name="ds11-radio"]').forEach(x=>x.addEventListener("change",()=>{
 const selected=q('[name="ds11-radio"]:checked');
 q("#ds11-radio-caption").textContent=selected?"Chọn: "+selected.value:"Chưa chọn.";
}));


let doneSteps=3;
function drawProgress(){
 const progress=q("#ds11-progress-demo"),fill=q("#ds11-progress-fill");
 if(!progress||!fill)return;
 const percent=Math.round(doneSteps/6*100);
 progress.setAttribute("aria-valuenow",String(doneSteps));
 progress.setAttribute("aria-valuetext",doneSteps+" trong 6 bước hoàn thành");
 fill.style.setProperty("--ds11-progress",percent+"%");
 q("#ds11-progress-label").textContent=doneSteps+" / 6 · "+percent+"%";
 q("#ds11-progress-add").disabled=doneSteps===6;
}
q("#ds11-progress-add")?.addEventListener("click",()=>{doneSteps=Math.min(6,doneSteps+1);drawProgress();});
q("#ds11-progress-reset")?.addEventListener("click",()=>{doneSteps=0;drawProgress();});
drawProgress();

const labels={overload:"Quá tải",recover:"Hồi trí",start:"Vào nhịp",focus:"Đào sâu"};
const names=["Bài học","Vấn đề","Input"];
const order=["overload","recover","start","focus"];
const shortDays=["T2","T3","T4","T5","T6","T7","CN"];
let year=2026,month=11,selected=18,windowStart=15;
const pad=n=>String(n).padStart(2,"0");
const daysInMonth=()=>new Date(year,month,0).getDate();
const dayKey=d=>year+"-"+pad(month)+"-"+pad(d);
function demoData(d){
 // Deterministic illustrative distribution; NO localStorage, diary or check-in.
 if((d+month)%11===0||d%13===0)return null;
 const mode=order[(d+month+year)%4];
 const a=(d*3+month)%5,b=(d*2+year)%4,c=(d+month)%3;
 return {mode,parts:[a,b,c]};
}
function windowStarts(){
 const n=daysInMonth(),last=Math.max(1,n-6),result=[];
 for(let start=1;start<=last;start+=7)result.push(start);
 if(result[result.length-1]!==last)result.push(last);
 return result;
}
function alignWindow(day){
 const starts=windowStarts();
 const enclosing=starts.find(start=>day>=start&&day<=start+6);
 if(enclosing!==undefined){windowStart=enclosing;return;}
 windowStart=starts.reduce((best,s)=>Math.abs(s-day)<Math.abs(best-day)?s:best,starts[0]);
}
function draw(){
 const n=daysInMonth();
 q("#ds11-month").textContent=new Intl.DateTimeFormat("vi-VN",{month:"long",year:"numeric"}).format(new Date(year,month-1,1));
 q("#ds11-calendar").replaceChildren();
 shortDays.forEach(label=>{
  const e=document.createElement("span");e.className="ds11-weekday";e.textContent=label;
  q("#ds11-calendar").append(e);
 });
 const offset=(new Date(year,month-1,1).getDay()+6)%7;
 for(let i=0;i<offset;i++){
  const e=document.createElement("span");e.className="ds11-calendar-blank";e.setAttribute("aria-hidden","true");
  q("#ds11-calendar").append(e);
 }
 const records=[];
 for(let d=1;d<=n;d++){
  const record=demoData(d);records.push(record);
  const b=document.createElement("button");b.type="button";b.className="ds11-date";b.textContent=String(d);
  b.dataset.day=String(d);
  if(record)b.dataset.mode=record.mode;
  b.dataset.window=String(d>=windowStart&&d<windowStart+7);
  b.dataset.selected=String(d===selected);
  b.setAttribute("aria-pressed",String(d===selected));
  b.setAttribute("aria-label",dayKey(d)+": "+(record?labels[record.mode]+", "+record.parts.reduce((a,x)=>a+x,0)+" hoạt động mẫu":"không có dữ liệu mẫu"));
  b.addEventListener("click",()=>{selected=d;alignWindow(d);draw();});
  q("#ds11-calendar").append(b);
 }
 const ends=Math.min(n,windowStart+6);
 q("#ds11-week-range").textContent=windowStart+"–"+ends+" / "+month+"/"+year;
 q("#ds11-chart").replaceChildren();
 const totals=records.map(r=>r?r.parts.reduce((a,b)=>a+b,0):0),max=Math.max(1,...totals);
 for(let d=windowStart;d<=ends;d++){
  const r=records[d-1],total=r?r.parts.reduce((a,b)=>a+b,0):null;
  const button=document.createElement("button");button.type="button";button.className="ds11-bar-cell";
  button.dataset.day=String(d);button.setAttribute("aria-pressed",String(d===selected));
  button.setAttribute("aria-label",d+"/"+month+": "+(r?names.map((name,i)=>name+" "+r.parts[i]).join(", "):"chưa có dữ liệu mẫu"));
  const count=document.createElement("span");count.className="ds11-bar-sum";count.textContent=total===null?"—":String(total);button.append(count);
  const track=document.createElement("span");track.className="ds11-bar-track";track.setAttribute("aria-hidden","true");
  if(r)r.parts.forEach((value,i)=>{
   const part=document.createElement("span");
   part.className="ds11-bar-segment "+["lesson","branch","input"][i];
   part.style.height=(value/max*100)+"%";
   track.append(part);
  });
  button.append(track);
  const dayLabel=document.createElement("span");dayLabel.className="ds11-bar-label";dayLabel.textContent=String(d);button.append(dayLabel);
  button.addEventListener("click",()=>{selected=d;draw();});
  q("#ds11-chart").append(button);
 }
 const rec=records[selected-1],total=rec?rec.parts.reduce((a,b)=>a+b,0):null;
 q("#ds11-day-detail").textContent=dayKey(selected)+" · "+(rec?labels[rec.mode]+" · "+names.map((name,i)=>name+" "+rec.parts[i]).join(" · ")+" · Tổng "+total:"Chưa có dữ liệu mẫu (khác với 0 hoạt động).");
 const starts=windowStarts(),idx=starts.indexOf(windowStart);
 q("#ds11-week-prev").disabled=idx<=0;
 q("#ds11-week-next").disabled=idx<0||idx===starts.length-1;
}
function moveMonth(delta){
 const date=new Date(year,month-1+delta,1);year=date.getFullYear();month=date.getMonth()+1;
 selected=1;windowStart=1;draw();
}
q("#ds11-month-prev")?.addEventListener("click",()=>moveMonth(-1));
q("#ds11-month-next")?.addEventListener("click",()=>moveMonth(1));
function moveWeek(delta){
 const starts=windowStarts(),idx=starts.indexOf(windowStart),next=starts[idx+delta];
 if(next===undefined)return;
 windowStart=next;selected=next;draw();
}
q("#ds11-week-prev")?.addEventListener("click",()=>moveWeek(-1));
q("#ds11-week-next")?.addEventListener("click",()=>moveWeek(1));
draw();
})();