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
  items.push({type:"lesson",title:lesson.title,id:lesson.id,context,group:group.id,field:field.id,course:course.id,route:lesson.route||null,published:lesson.published===true,sourceUrl:field.source||null});
 }
}
let sourceIndex=null,sourceAPI=null,sourceStatus='loading';
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
function sourceLink(url,text){
 if(typeof url!=="string"||!url.startsWith("https://"))return null;
 const a=document.createElement("a");
 a.href=url;a.target="_blank";a.rel="noopener noreferrer";
 a.textContent=text;
 return a;
}
function legacyRow(item){
 const row=document.createElement("div");
 const b=document.createElement("button");b.type="button";b.className="branch";b.dataset.searchResult=item.id;
 const title=document.createElement("strong");title.textContent=item.title;
 const meta=document.createElement("span");meta.className="small";
 meta.textContent=(item.type==="course"?"Môn học":item.published?"Bài có thể học":"Bài đang biên soạn")+" · "+item.id+" · "+item.context;
 b.append(title,meta);b.addEventListener("click",()=>legacyOpen(item));row.append(b);
 // The graph pack may be unavailable offline. Always show the catalog provenance.
 const source=sourceLink(item.sourceUrl,"Nguồn danh mục (Notion)");
 if(source)row.append(source);
 return row;
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
 output.append(count);
 const status=document.createElement("p");status.className="small";
 status.setAttribute("role","status");
 status.textContent=sourceStatus==="error"
  ?"Liên kết quan hệ chưa tải được; đây là kết quả và nguồn danh mục."
  :"Đang tải các liên kết quan hệ có nguồn…";
 output.append(status);
 ranked.forEach(x=>output.append(legacyRow(x.item)));
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
 // Source belongs alongside the relationship itself, not in collapsed <details>.
 const related=document.createElement("div");
 related.className="li-search-related";
 const intro=document.createElement("p");
 intro.className="small";
 intro.textContent="Quan hệ phân loại đã đối chiếu · "+rows.length+" · không phải điều kiện tiên quyết";
 related.append(intro);
 for(const relation of rows){
  const block=document.createElement("div");
  block.className="li-search-relation";
  const label=document.createElement("span");label.className="small";
  label.textContent=(relation.relationship==="SCOPED_TO_FIELD"?
   (relation.direction==="outgoing"?"Thuộc lĩnh vực: ":"Bài trong lĩnh vực: "):
   "Liên hệ đã kiểm chứng: ")+relation.title+" · "+relation.id;
  block.append(label,document.createTextNode(" "));
  // This is the editorial SOURCE FOR THE RELATION, not an academic citation of lesson content.
  const evidence=sourceLink(relation.provenance?.sourceUrl,"Nguồn quan hệ (Notion)");
  if(evidence)block.append(evidence);
  if(relation.route){
   const go=document.createElement("button");go.type="button";go.className="action alt";
   go.textContent="Mở bài";go.addEventListener("click",()=>{
    const target=sourceIndex.records.get(relation.id);if(target)openRealLesson(target);
   });
   block.append(document.createTextNode(" "),go);
  }
  related.append(block);
 }
 return related;
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
  const button=document.createElement(record.kind==="Lesson"?"button":"div");
  if(record.kind==="Lesson")button.type="button";
  button.className="branch";button.dataset.searchResult=record.lessonId||record.id;
  const title=document.createElement("strong");title.textContent=record.title;
  const meta=document.createElement("span");meta.className="small";
  meta.textContent=(record.kind==="Lesson"?"Bài đã phát hành":record.kind==="Field"?"Lĩnh vực đã đối chiếu":"Kiến thức tham khảo")+
   " · "+(record.lessonId||record.id)+" · "+record.context;
  button.append(title,meta);
  if(record.kind==="Lesson")button.addEventListener("click",()=>openRealLesson(record));
  row.append(button);
  const related=graphRelations(record);
  if(related)row.append(related);
  const catalogSource=sourceLink(record.sourceUrl,"Nguồn danh mục (Notion)");
  if(catalogSource)row.append(catalogSource);
  output.append(row);
 }
}
function render(value){
 if(sourceAPI&&sourceIndex)renderReal(value);else legacyRender(value);
}
input.addEventListener("input",e=>render(e.target.value));
render(input.value);
window.liSearch={render,getStatus:()=>sourceStatus};
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
 sourceStatus="ready";
 render(input.value);
}).catch(()=>{
 // Don't silently claim graph evidence is available when only catalog lookup works.
 sourceStatus="error";
 render(input.value);
});
})();
