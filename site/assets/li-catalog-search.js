/* li. native Tra Cứu: real source-versioned catalog + reviewed graph (no learner data).
   Search UI remains owned by the app. No separate search app or backend provider.
   If a static search pack fails, fall back to the existing native catalog search. */
(function(){
"use strict";
const input=document.getElementById("global-search");
const output=document.getElementById("global-results");
const groups=window.LI_CATALOG_DATA;
if(!input||!output||!Array.isArray(groups))return;
const clean=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("vi").replace(/\s+/g," ").trim();
const items=[];
for(const group of groups)for(const field of group.fields||[])for(const course of field.courses||[]){
 const context=[group.title,field.name,course.title].filter(Boolean).join(" · ");
 items.push({type:"course",title:course.title,id:course.id,context,group:group.id,field:field.id,course:course.id,published:false});
 for(const lesson of course.lessons||[]){
  items.push({type:"lesson",title:lesson.title,id:lesson.id,context,group:group.id,field:field.id,course:course.id,route:lesson.route||null,published:lesson.published===true});
 }
}
let sourceIndex=null,sourceAPI=null;
const canOpenLesson=()=>document.documentElement.classList.contains("li-auth-verified")
 && !document.documentElement.classList.contains("li-account-open");
function score(item,query,terms){
 const title=clean(item.title),id=clean(item.id),extra=clean(item.context);
 if(title===query||id===query)return 100;
 if(title.startsWith(query)||id.startsWith(query))return 80;
 if(title.includes(query)||id.includes(query))return 65;
 if(extra.includes(query))return 22;
 const blob=[title,id,extra].join(" ");
 if(!terms.every(part=>blob.includes(part)))return -1;
 return terms.filter(t=>title.includes(t)||id.includes(t)).length*7+5;
}
function legacyOpen(item){
 if(item.type==="lesson"&&item.published&&item.route&&canOpenLesson()
   &&document.getElementById("page-"+item.route)){
  if(typeof window.navigate==="function")window.navigate(item.route);
  return;
 }
 if(canOpenLesson()&&typeof window.liCatalog?.openCourse==="function")
  window.liCatalog.openCourse(item.group,item.field,item.course);
}
function legacyRow(item){
 const b=document.createElement("button");b.type="button";b.className="branch";b.dataset.searchResult=item.id;
 const title=document.createElement("strong");title.textContent=item.title;
 const meta=document.createElement("span");meta.className="small";
 meta.textContent=(item.type==="course"?"Môn học":item.published?"Bài có thể học":"Bài đang biên soạn")+" · "+item.id+" · "+item.context;
 b.append(title,meta);b.addEventListener("click",()=>legacyOpen(item));return b;
}
function legacyRender(value){
 const q=clean(value);
 output.replaceChildren();
 if(!q){output.textContent="Nhập tên bài, môn học hoặc chủ đề để tra cứu.";return;}
 const terms=q.split(" ").filter(Boolean);
 const ranked=items.map(item=>({item,rank:score(item,q,terms)}))
  .filter(x=>x.rank>=0&&x.item.published)
  .sort((a,b)=>b.rank-a.rank||a.item.title.localeCompare(b.item.title,"vi"))
  .slice(0,14);
 if(!ranked.length){
  const empty=document.createElement("p");empty.textContent="Chưa tìm thấy bài đã phát hành. Thử tên hoặc mã bài khác.";
  output.append(empty);return;
 }
 const count=document.createElement("p");count.className="small";count.setAttribute("role","status");
 count.textContent=ranked.length+" bài đã phát hành";
 output.append(count);ranked.forEach(x=>output.append(legacyRow(x.item)));
}
function openRealLesson(record){
 const route=sourceAPI.resolveLessonRoute(record,{
  hasInvitedSession:canOpenLesson(),
  routeExists:key=>Boolean(document.getElementById("page-"+key))
 });
 if(route&&typeof window.navigate==="function")window.navigate(route);
}
function graphRelations(record){
 const rows=sourceAPI.relatedReviewed(sourceIndex,record.id)
  .filter(r=>r.kind==="Field"||r.publishState==="catalog_published");
 if(!rows.length)return null;
 const details=document.createElement("details");
 const summary=document.createElement("summary");
 summary.textContent="Kiến thức liên quan · "+rows.length+" quan hệ có nguồn";
 details.append(summary);
 for(const relation of rows){
  const block=document.createElement("div");
  const label=document.createElement("span");label.className="small";
  label.textContent=(relation.relationship==="SCOPED_TO_FIELD"?
   (relation.direction==="outgoing"?"Thuộc lĩnh vực: ":"Bài trong lĩnh vực: "):
   "Liên hệ đã kiểm chứng: ")+relation.title+" · "+relation.id;
  block.append(label,document.createTextNode(" "));
  if(relation.route){
   const go=document.createElement("button");go.type="button";go.className="action alt";
   go.textContent="Mở bài";go.addEventListener("click",()=>{
    const target=sourceIndex.records.get(relation.id);if(target)openRealLesson(target);
   });
   block.append(go,document.createTextNode(" "));
  }
  if(relation.provenance?.sourceUrl?.startsWith("https://")){
   const a=document.createElement("a");a.href=relation.provenance.sourceUrl;
   a.target="_blank";a.rel="noopener noreferrer";a.textContent="Nguồn liên kết";
   block.append(a);
  }
  details.append(block);
 }
 return details;
}
function renderReal(value){
 output.replaceChildren();
 if(!value.trim()){output.textContent="Nhập tên bài, mã bài hoặc lĩnh vực để tra cứu.";return;}
 const matches=sourceAPI.searchRealContent(sourceIndex,value,{limit:14});
 if(matches.status==="invalid_query"){
  output.textContent="Từ khóa không hợp lệ hoặc quá dài.";return;
 }
 if(!matches.results.length){
  output.textContent="Chưa tìm thấy kiến thức đã được phép tra cứu trong dữ liệu hiện có.";return;
 }
 const count=document.createElement("p");count.className="small";
 count.setAttribute("role","status");
 count.textContent=matches.results.length+" kết quả · dữ liệu có nguồn";
 output.append(count);
 for(const record of matches.results){
  const row=document.createElement("div");
  const button=document.createElement("button");
  button.type="button";button.className="branch";button.dataset.searchResult=record.lessonId||record.id;
  const title=document.createElement("strong");title.textContent=record.title;
  const meta=document.createElement("span");meta.className="small";
  meta.textContent=(record.kind==="Lesson"?"Bài đã phát hành":record.kind==="Field"?"Lĩnh vực đã đối chiếu":"Kiến thức tham khảo")+
   " · "+(record.lessonId||record.id)+" · "+record.context;
  button.append(title,meta);
  if(record.kind==="Lesson")button.addEventListener("click",()=>openRealLesson(record));
  else button.addEventListener("click",()=>{const details=row.querySelector("details");if(details)details.open=!details.open;});
  row.append(button);
  const related=graphRelations(record);
  if(related)row.append(related);
  output.append(row);
 }
}
function render(value){
 if(sourceAPI&&sourceIndex)renderReal(value);else legacyRender(value);
}
input.addEventListener("input",e=>render(e.target.value));
render(input.value);
window.liSearch={render};
Promise.all([
 import(new URL("./assets/li-search-adapter.mjs",document.baseURI).href),
 fetch(new URL("./assets/li-search-graph.json",document.baseURI),{credentials:"same-origin"}).then(response=>{
  if(!response.ok)throw Error("Search graph pack unavailable");
  return response.json();
 })
]).then(([api,graph])=>{
 if(graph.status!=="reviewed_public_subset_of_editorial_pilot"||graph.demoOnly!==true)throw Error("Unexpected search graph version");
 sourceIndex=api.buildRealContentIndex({catalog:groups,academicGraph:graph});
 sourceAPI=api;
 render(input.value);
}).catch(()=>{ /* Native published-lesson search remains available offline. */ });
})();
