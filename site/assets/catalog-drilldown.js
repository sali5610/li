/* Tàng Thư 5-tier IA: Group > Field > Course > Lesson > Chapter.
   Source: S36 Notion roadmap. No unpublished lesson content is shipped.
   Progress reads only existing Wave1 local review state. No new storage or services. */
(function(){
"use strict";
const host=document.querySelector("#page-catalog .section-shell");
const groups=window.LI_CATALOG_DATA;
if(!host||!Array.isArray(groups)||groups.length!==8)return;
const levels=[["Foundation","Nền tảng"],["Intermediate","Trung cấp"],["Advanced-topic","Chuyên sâu"]];
let path=[];
let nativeOpen=null;
function el(tag,cls,value,parent){
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(value!==undefined&&value!==null)node.textContent=String(value);
 if(parent)parent.append(node);return node;
}
function action(parent,text,kind,value,cls="catalog-link"){
 const btn=el("button",cls,text,parent);btn.type="button";
 btn.dataset.catalogKind=kind;btn.dataset.catalogValue=value||"";return btn;
}
function findParts(){
 const group=groups.find(x=>x.id===path[0])||null;
 const field=group?.fields.find(x=>x.id===path[1])||null;
 const course=field?.courses.find(x=>x.id===path[2])||null;
 const lesson=course?.lessons.find(x=>x.id===path[3])||null;
 return {group,field,course,lesson};
}
function setPath(next,save=true){
 path=Array.isArray(next)?next.filter(Boolean):[];
 const parts=findParts();
 if(!parts.group)path=[];
 else if(!parts.field)path=path.slice(0,1);
 else if(!parts.course)path=path.slice(0,2);
 else if(!parts.lesson)path=path.slice(0,3);
 if(save&&window.history?.pushState){
  const u=new URL(location.href);if(path.length)u.searchParams.set("catalog",path.join("/"));else u.searchParams.delete("catalog");
  u.searchParams.delete("lesson");u.searchParams.delete("chapter");
  history.pushState(history.state,"",u.pathname+u.search);
 }
 render();
}
function header(title,desc,eyebrow){
 el("div","kicker",eyebrow,host);el("h1","display-title",title,host);
 if(desc)el("p","intro",desc,host);
}
function breadcrumbs(){
 const nav=el("nav","catalog-breadcrumbs",null,host);nav.setAttribute("aria-label","Vị trí trong Tàng Thư");
 action(nav,"Tàng Thư","crumb","", "catalog-crumb");
 const p=findParts();
 const names=[p.group?.title,p.field?.name,p.course?.title,p.lesson?.title];
 names.forEach((name,i)=>{if(!name)return;el("span","catalog-crumb-divider","›",nav);
  const isLast=i===path.length-1;
  if(isLast){const t=el("span","catalog-crumb-current",name,nav);t.setAttribute("aria-current","page");}
  else action(nav,name,"crumb",String(i+1),"catalog-crumb");
 });
}
function shelfCard(root,title,meta,desc,target,value,index){
 const card=el("article","catalog-card surface tinted",null,root);
 const mark=el("div","catalog-card-mark",String(index).padStart(2,"0"),card);mark.setAttribute("aria-hidden","true");
 el("div","kicker",meta,card);el("h2","",title,card);
 if(desc)el("p","small",desc,card);
 action(card,"Khám phá","open-"+target,value,"catalog-card-action action alt");
 return card;
}
function renderRoot(){
 header("Tàng Thư","Tám nhóm ngành, những lối đi khác nhau vào cùng một thư viện tri thức.","KHÁM PHÁ TRI THỨC");
 const grid=el("div","catalog-group-grid",null,host);
 groups.forEach((g,i)=>shelfCard(grid,g.title,"NHÓM NGÀNH",g.fields.length+" chuyên ngành", "group",g.id,i+1));
 el("p","catalog-quiet-note","Danh mục gồm chương trình đang biên soạn. Chỉ bài đã phát hành mới có nội dung học.",host);
}
function renderGroup(g){
 header(g.title,"Chọn chuyên ngành để xem lộ trình các môn học.","NHÓM NGÀNH");
 const grid=el("div","catalog-field-grid",null,host);
 g.fields.forEach((f,i)=>shelfCard(grid,f.name,"CHUYÊN NGÀNH",f.courses.length+" môn học theo lộ trình", "field",f.id,i+1));
}
function renderField(f){
 header(f.name,"Các môn được sắp theo nền tảng → trung cấp → chuyên sâu. Thứ tự này là lộ trình đề xuất, không tự động khóa bài.","CHUYÊN NGÀNH");
 const stack=el("div","catalog-roadmap",null,host);
 for(const [lev,local] of levels){
  const stage=el("section","catalog-level-band",null,stack);
  const heading=el("div","catalog-level-heading",null,stage);
  el("span","catalog-level-dot",String(levels.findIndex(x=>x[0]===lev)+1).padStart(2,"0"),heading);
  el("h2","",local,heading);
  el("p","small",lev,heading);
  const collection=el("div","catalog-course-list",null,stage);
  f.courses.filter(c=>c.level===lev).forEach(c=>{
   const row=el("article","surface catalog-course-card",null,collection);
   el("div","kicker",c.id+" · "+local,row);el("h3","",c.title,row);
   const lessonList=el("ol","catalog-preview-lessons",null,row);
   c.lessons.forEach(l=>{const it=el("li","",l.title,lessonList);if(l.published)it.classList.add("catalog-preview-published");});
   action(row,"Xem môn học","open-course",c.id,"action alt catalog-card-action");
  });
 }
}
function progress(lesson){
 if(!lesson.published)return false;
 const raw=localStorage.getItem("li.review."+lesson.id+".v1");
 if(!raw)return false;
 const state=JSON.parse(raw);
 return state?.reviewed===true;
}
function renderCourse(c){
 header(c.title,"Theo dõi các bài trong môn và tiếp tục từ nội dung đã phát hành.","MÔN HỌC · "+c.id);
 const panel=el("section","surface catalog-progress",null,host);
 const available=c.lessons.filter(l=>l.published);
 if(!available.length){
  el("h2","","Lộ trình đang biên soạn",panel);
  el("p","small","Chưa có bài phát hành để tính tiến độ. Các bài bên dưới hiện chỉ là đề cương.",panel);
 }else{
  try{
   const done=available.filter(progress).length;
   el("h2","",done+"/"+available.length+" bài đã hoàn thành",panel);
   el("p","small","Chỉ tính các bài đã phát hành và đã hoàn tất bước tự đánh giá trên thiết bị này.",panel);
   const bar=el("div","catalog-progress-track",null,panel);bar.setAttribute("role","progressbar");bar.setAttribute("aria-label","Tiến độ bài đã hoàn thành");
   bar.setAttribute("aria-valuemin","0");bar.setAttribute("aria-valuemax",String(available.length));bar.setAttribute("aria-valuenow",String(done));
   const fill=el("span","catalog-progress-fill",null,bar);fill.style.width=(done/available.length*100)+"%";
  }catch(e){
   el("p","small","Không đọc được tiến độ trên thiết bị. Không hiển thị phần trăm để tránh sai.",panel);
  }
 }
 const list=el("ol","catalog-lesson-list",null,host);
 c.lessons.forEach((l,i)=>{
  const row=el("li","surface catalog-lesson-card",null,list);
  const order=el("span","catalog-lesson-order",String(i+1).padStart(2,"0"),row);order.setAttribute("aria-hidden","true");
  const body=el("div","catalog-lesson-desc",null,row);
  el("h2","",l.title,body);
  el("p","small",l.id+" · "+(l.published?"Đã phát hành":"Đề cương · chưa phát hành"),body);
  action(row,l.published?"Vào bài học":"Xem đề cương","open-lesson",l.id,"action alt");
 });
}
function renderUnpublishedLesson(l){
 header(l.title,"Bài này mới có tên và vị trí trong lộ trình. Nội dung chương chưa được xuất bản.","BÀI HỌC · "+l.id);
 const frame=el("div","catalog-draft-frame",null,host);
 const left=el("aside","surface catalog-draft-chapters",null,frame);
 const toggle=action(left,"Ẩn danh sách chương","draft-toggle","","catalog-chapter-toggle");
 toggle.setAttribute("aria-expanded","true");
 const nav=el("nav","catalog-empty-chapters",null,left);nav.setAttribute("aria-label","Chương của bài");
 el("h2","","Chương",nav);el("p","small","Chưa có chương được phát hành.",nav);
 const main=el("article","surface",null,frame);
 el("div","kicker","CHƯA PHÁT HÀNH",main);
 el("h2","","Nội dung đang được biên soạn",main);
 el("p","","Đây chỉ là đề cương trong roadmap. Không có bài học, bài tập hoặc tiến độ giả.",main);
}
function render(){
 host.replaceChildren();breadcrumbs();
 const {group,field,course,lesson}=findParts();
 if(!group)return renderRoot();
 if(!field)return renderGroup(group);
 if(!course)return renderField(field);
 if(!lesson)return renderCourse(course);
 if(lesson.published){
  setPath(path.slice(0,3),false);
  if(typeof window.navigate==="function")window.navigate(lesson.route);
  return;
 }
 renderUnpublishedLesson(lesson);
 if(typeof window.lucide?.createIcons==="function")window.lucide.createIcons({attrs:{"stroke-width":1.8}});
}
function chapterParam(id,replace=false){
 if(!history?.pushState)return;
 const url=new URL(location.href);
 if(id)url.searchParams.set("chapter",id);else url.searchParams.delete("chapter");
 url.hash="";
 history[replace?"replaceState":"pushState"](history.state,"",url.pathname+url.search);
}
function mountNative(route){
 const page=document.getElementById("page-"+route);
 const layout=page?.querySelector(".editorial-grid");
 const section=layout?.querySelector(".l09-stack");
 if(!layout||!section||layout.parentElement.classList.contains("catalog-native-frame"))return;
 const chapterNav=page.querySelector(".l09-index");
 if(!chapterNav)return;
 const wrap=el("div","catalog-native-frame",null,layout.parentElement);
 layout.before(wrap);wrap.append(layout);
 const aside=el("aside","catalog-native-chapters surface tinted",null,wrap);
 wrap.prepend(aside);aside.id="catalog-chapters-"+route;
 const toolbar=el("div","catalog-native-toolbar",null,wrap.parentElement);
 wrap.before(toolbar);
 const toggle=el("button","action alt catalog-chapter-toggle","Ẩn chương",toolbar);
 toggle.type="button";toggle.setAttribute("aria-controls",aside.id);toggle.setAttribute("aria-expanded","true");
 el("div","kicker","MỤC LỤC BÀI HỌC",aside);
 el("h2","","Chương",aside);
 const all=el("button","catalog-chapter-all","Toàn bộ bài",aside);all.type="button";
 chapterNav.classList.add("catalog-left-index");aside.append(chapterNav);
 const sections=Array.from(section.children).filter(e=>e.tagName==="ARTICLE"&&e.id);
 const links=Array.from(chapterNav.querySelectorAll('a[href^="#"]'));
 const footer=el("div","catalog-chapter-footer",null,aside);
 const prev=el("button","catalog-chapter-step","← Trước",footer);prev.type="button";
 const next=el("button","catalog-chapter-step","Tiếp →",footer);next.type="button";
 let active=null;
 function choose(id,push=true){
  if(id&&!sections.some(e=>e.id===id))id=null;
  active=id;
  sections.forEach(s=>{s.hidden=Boolean(id)&&s.id!==id;});
  links.forEach(a=>{const selected=a.getAttribute("href")==="#"+id;
   a.classList.toggle("catalog-active-chapter",selected);
   if(selected)a.setAttribute("aria-current","step");else a.removeAttribute("aria-current");
  });
  all.classList.toggle("catalog-active-chapter",!id);
  const index=sections.findIndex(s=>s.id===id);
  prev.disabled=index<=0;next.disabled=index<0||index===sections.length-1;
  footer.hidden=!id;
  layout.classList.toggle("catalog-focused-chapter",Boolean(id));
  if(push)chapterParam(id);
  if(id){const selected=sections[index];selected?.scrollIntoView?.({block:"start"});}
  else page.querySelector(".library-lesson-heading")?.scrollIntoView?.({block:"start"});
 }
 chapterNav.addEventListener("click",e=>{
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  e.preventDefault();e.stopPropagation();
  choose(a.getAttribute("href").slice(1));});
 all.addEventListener("click",()=>choose(null));
 prev.addEventListener("click",()=>{const i=sections.findIndex(s=>s.id===active);if(i>0)choose(sections[i-1].id);});
 next.addEventListener("click",()=>{const i=sections.findIndex(s=>s.id===active);if(i>=0&&i<sections.length-1)choose(sections[i+1].id);});
 toggle.addEventListener("click",()=>{
  const hide=!aside.hidden;aside.hidden=hide;
  toggle.setAttribute("aria-expanded",String(!hide));toggle.textContent=hide?"Hiện chương":"Ẩn chương";
  wrap.classList.toggle("catalog-native-collapsed",hide);
 });
 if(window.matchMedia&&window.matchMedia("(max-width:700px)").matches){aside.hidden=true;toggle.setAttribute("aria-expanded","false");toggle.textContent="Hiện chương";wrap.classList.add("catalog-native-collapsed");}
 page.dataset.catalogChapterNav="ready";
 const initial=new URL(location.href).searchParams.get("chapter");
 choose(initial,false);
 const observer=new MutationObserver(()=>{links.forEach(a=>{const id=a.getAttribute("href")?.slice(1);const head=document.getElementById(id)?.querySelector("h2");if(head&&a.dataset.catalogDynamic==="1")a.textContent=head.textContent;});});
 sections.forEach(s=>{const h=s.querySelector("h2");if(h)observer.observe(h,{subtree:true,characterData:true,childList:true});});
 links.forEach(a=>{a.dataset.catalogDynamic="1";const h=document.getElementById(a.getAttribute("href").slice(1))?.querySelector("h2");if(h)a.textContent=h.textContent;});
 page._catalogChooseChapter=choose;
}
host.addEventListener("click",event=>{
 const t=event.target.closest("button[data-catalog-kind]");if(!t)return;
 event.preventDefault();event.stopPropagation();
 const v=t.dataset.catalogValue,kind=t.dataset.catalogKind;
 if(kind==="crumb"){setPath(v?path.slice(0,Number(v)):[]);return;}
 if(kind==="draft-toggle"){
  const nav=host.querySelector(".catalog-empty-chapters");if(!nav)return;
  const hide=!nav.hidden;nav.hidden=hide;t.setAttribute("aria-expanded",String(!hide));t.textContent=hide?"Hiện danh sách chương":"Ẩn danh sách chương";return;
 }
 if(kind==="open-group"){setPath([v]);return;}
 if(kind==="open-field"){setPath([path[0],v]);return;}
 if(kind==="open-course"){setPath([path[0],path[1],v]);return;}
 if(kind==="open-lesson"){
  const parts=findParts();const lesson=parts.course?.lessons.find(x=>x.id===v);if(!lesson)return;
  if(lesson.published){
   if(history?.replaceState){
    const u=new URL(location.href);u.searchParams.set("catalog",path.join("/"));history.replaceState(history.state,"",u.pathname+u.search);
   }
   const destination=new URL(location.href);destination.searchParams.set("lesson",lesson.id);destination.searchParams.delete("chapter");
   if(history?.pushState)history.pushState(history.state,"",destination.pathname+destination.search);
   window.navigate?.(lesson.route);return;
  }
  setPath([...path,v]);return;
 }
});
document.addEventListener("click",e=>{
 const t=e.target.closest('button[data-page="catalog"]');if(!t)return;
 if(t.classList.contains("nav-btn")){
  setPath([],false);
  const u=new URL(location.href);u.searchParams.delete("catalog");u.searchParams.delete("chapter");
  history.replaceState(history.state,"",u.pathname+u.search);
 }else if(t.closest('section[id^="page-lesson"]')){
  setPath(path.slice(0,3),false);
 }
},true);
window.addEventListener("popstate",()=>{
 const u=new URL(location.href),route=u.searchParams.get("lesson");
 const found=[["L03-1-2","lessonL03"],["L09-1-2","lessonL09"],["L15-2-2","lessonL15"]].find(p=>p[0]===route);
 if(found){window.navigate?.(found[1],{remember:false,syncUrl:false});document.getElementById("page-"+found[1])?._catalogChooseChapter?.(u.searchParams.get("chapter"),false);}
 else if(u.searchParams.has("catalog")){
  path=(u.searchParams.get("catalog")||"").split("/").filter(Boolean).slice(0,4);
  window.navigate?.("catalog",{remember:false,syncUrl:false});render();
 }else{path=[];render();window.navigate?.("home",{remember:false,syncUrl:false});}
});
path=(new URL(location.href).searchParams.get("catalog")||"").split("/").filter(Boolean).slice(0,4);
if(path.length&&!new URL(location.href).searchParams.has("lesson")){window.navigate?.("catalog",{remember:false,syncUrl:false});}
render();
["lessonL03","lessonL09","lessonL15"].forEach(mountNative);
window.liCatalog={render,openCourse:(group,field,course)=>{window.navigate?.("catalog");setPath([group,field,course]);}};
})();