/* li. Tra Cứu — one canonical GitHub content client, no parallel pilot graph.
 * Public Search documents, reviewed graph links and native lesson routes only.
 * Offline pack failure falls back to published catalog metadata with an honest label.
 * Never indexes learner/private data or queries Neon/Notion at runtime. */
(function(){
"use strict";
const input=document.getElementById("global-search");
const output=document.getElementById("global-results");
const groups=window.LI_CATALOG_DATA;
if(!input||!output||!Array.isArray(groups))return;

const clean=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .replace(/đ/gi,"d").toLocaleLowerCase("vi").replace(/\s+/g," ").trim();
const items=[],routes=new Map();
for(const group of groups)for(const field of group.fields||[])for(const course of field.courses||[]){
 const context=[group.title,field.name,course.title].filter(Boolean).join(" · ");
 for(const lesson of course.lessons||[]){
  const item={title:lesson.title,id:lesson.id,context,route:lesson.route||null,
   published:lesson.published===true,sourceUrl:field.source||null};
  items.push(item);
  if(item.published&&/^lessonL\d{2}$/.test(item.route||""))routes.set(item.id,item.route);
 }
}
let client=null,status="loading",generation=0;
const canOpenLesson=()=>document.documentElement.classList.contains("li-auth-verified") &&
 !document.documentElement.classList.contains("li-account-open");
function openLesson(id){
 const route=routes.get(id);
 if(canOpenLesson()&&route&&document.getElementById("page-"+route)&&
    typeof window.navigate==="function")window.navigate(route);
}
function sourceLink(url,label){
 if(typeof url!=="string"||!url.startsWith("https://"))return null;
 const a=document.createElement("a");
 a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=label;
 return a;
}
function small(text){
 const el=document.createElement("span");el.className="small";el.textContent=text;
 return el;
}
function legacyRender(value){
 output.replaceChildren();
 const q=clean(value);
 if(!q){output.textContent="Nhập tên bài, mã bài hoặc khái niệm để tra cứu.";return;}
 const ranked=items.filter(x=>x.published).map(item=>{
  const title=clean(item.title),id=clean(item.id),context=clean(item.context);
  const score=id===q?120:title.includes(q)?75:id.includes(q)?65:
   q.split(" ").every(t=>(title+" "+id+" "+context).includes(t))?15:-1;
  return {item,score};
 }).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score).slice(0,14);
 if(!ranked.length){output.textContent="Chưa tìm thấy bài có nội dung trong dữ liệu thiết bị.";return;}
 const msg=document.createElement("p");msg.className="small";msg.setAttribute("role","status");
 msg.textContent=status==="error"
  ?"Dữ liệu quan hệ đang không khả dụng. Chỉ hiển thị danh mục đã lưu."
  :"Đang tải nội dung và quan hệ kiến thức…";
 output.append(msg);
 for(const {item} of ranked){
  const row=document.createElement("div");
  const btn=document.createElement("button");btn.type="button";btn.className="branch";
  btn.dataset.searchResult=item.id;
  const label=document.createElement("strong");label.textContent=item.title;
  btn.append(label,small("Bài có nội dung · "+item.id+" · "+item.context));
  btn.addEventListener("click",()=>openLesson(item.id));row.append(btn);
  const src=sourceLink(item.sourceUrl,"Nguồn danh mục (Notion)");
  if(src)row.append(src);
  output.append(row);
 }
}
function renderCanonical(data){
 output.replaceChildren();
 if(data.status==="invalid_query"){
  output.textContent="Nhập tên bài, môn hoặc khái niệm để tra cứu.";return;
 }
 if(!data.results.length){
  output.textContent="Chưa có nội dung/khái niệm đã xác minh phù hợp. Đề cương chưa có bài học không được hiển thị như bài đã phát hành.";
  return;
 }
 const header=document.createElement("p");header.className="small";
 header.setAttribute("role","status");
 header.textContent=data.results.length+" kết quả · Knowledge Base canonical";
 output.append(header);
 for(const record of data.results){
  const row=document.createElement("div");row.className="li-search-result";
  const isLesson=record.kind==="Lesson";
  const surface=document.createElement(isLesson?"button":"div");
  if(isLesson)surface.type="button";
  surface.className="branch";surface.dataset.searchResult=record.lessonId||record.id;
  const label=document.createElement("strong");label.textContent=record.title;
  const prefix={Lesson:"Bài có nội dung",Concept:"Khái niệm đã đối chiếu",
   Course:"Đề cương môn",Field:"Lĩnh vực",DomainGroup:"Nhóm ngành"}[record.kind]||"Mục kiến thức";
  const summary=small(prefix+" · "+(record.lessonId||record.id)+
   (record.contentState==="review_only"?" · bản nội dung đang duyệt":""));
  surface.append(label,summary);
  if(isLesson)surface.addEventListener("click",()=>openLesson(record.lessonId));
  row.append(surface);

  const sources=new Set();
  if(record.links.length){
   const section=document.createElement("div");section.className="li-search-related";
   const desc=document.createElement("p");desc.className="small";
   desc.textContent="Kết nối kiến thức có nguồn · không mặc định là bài tiên quyết";
   section.append(desc);
   for(const rel of record.links){
    const link=document.createElement("div");link.className="li-search-relation";
    const relation=document.createElement("p");relation.className="small";
    relation.textContent=rel.label+": "+rel.title+" · "+(rel.lessonId||rel.id);
    link.append(relation);
    if(rel.reason){
     const reason=document.createElement("p");reason.className="small";
     reason.textContent=rel.reason;link.append(reason);
    }
    if(rel.kind==="Lesson"&&routes.has(rel.lessonId)){
     const btn=document.createElement("button");btn.type="button";btn.className="action alt";
     btn.textContent="Mở bài "+rel.lessonId;
     btn.addEventListener("click",()=>openLesson(rel.lessonId));link.append(btn);
    }
    // Deduplicate identical source URLs across several reviewed relationships.
    if(rel.sourceUrl&&!sources.has(rel.sourceUrl)){
     const src=sourceLink(rel.sourceUrl,rel.sourceType==="academic"?
      "Nguồn phương pháp":"Nguồn phân loại");
     if(src){link.append(document.createTextNode(" "),src);sources.add(rel.sourceUrl);}
    }
    section.append(link);
   }
   row.append(section);
  }
  if(record.sourceUrl&&!sources.size){
   const src=sourceLink(record.sourceUrl,"Nguồn danh mục (Notion)");
   if(src)row.append(src);
  }
  output.append(row);
 }
}
async function render(value){
 const ticket=++generation;
 if(!value.trim()){
  output.textContent="Nhập tên bài, môn học hoặc khái niệm để tra cứu.";return;
 }
 if(!client){legacyRender(value);return;}
 try{
  const result=await client.searchKnowledge(value);
  if(ticket!==generation)return;
  renderCanonical(result);
 }catch{
  if(ticket!==generation)return;
  status="error";client=null;legacyRender(value);
 }
}
input.addEventListener("input",e=>render(e.target.value));
window.liSearch={render,getStatus:()=>status};
render(input.value);
import(new URL("./assets/li-content-adapter.mjs",document.baseURI).href)
 .then(async mod=>{
  // Same static generated indexes used by the native/React lesson content client.
  await Promise.all([mod.contentClient.search(),mod.contentClient.graph(),
   mod.contentClient.hierarchy()]);
  client=mod.contentClient;status="ready";render(input.value);
 }).catch(()=>{
  status="error";client=null;render(input.value);
 });
})();
