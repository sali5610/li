/* li. Tra Cứu — real canonical curriculum metadata, not hard-coded demo links.
   No unpublished lesson body is shipped. Published lessons open their native routes.
   No separate search host, account, query logging or extra data storage. */
(function(){
"use strict";
const input=document.getElementById("global-search");
const output=document.getElementById("global-results");
const groups=window.LI_CATALOG_DATA;
if(!input||!output||!Array.isArray(groups))return;
const clean=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("vi").replace(/\s+/g," ").trim();
const items=[];
for(const group of groups){
 for(const field of group.fields||[]){
  for(const course of field.courses||[]){
   const context=[group.title,field.name,course.title].filter(Boolean).join(" · ");
   items.push({type:"course",title:course.title,id:course.id,context,group:group.id,field:field.id,course:course.id,published:false});
   for(const lesson of course.lessons||[]){
    items.push({type:"lesson",title:lesson.title,id:lesson.id,context,group:group.id,field:field.id,course:course.id,route:lesson.route||null,published:lesson.published===true});
   }
  }
 }
}
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
function open(item){
 if(item.type==="lesson"&&item.published&&item.route&&document.getElementById("page-"+item.route)){
  if(typeof window.navigate==="function")window.navigate(item.route);
  return;
 }
 if(typeof window.liCatalog?.openCourse==="function")
  window.liCatalog.openCourse(item.group,item.field,item.course);
}
function row(item){
 const b=document.createElement("button");
 b.type="button";b.className="branch";b.dataset.searchResult=item.id;
 const title=document.createElement("strong");title.textContent=item.title;
 const meta=document.createElement("span");meta.className="small";
 meta.textContent=(item.type==="course"?"Môn học":item.published?"Bài có thể học":"Bài đang biên soạn")+" · "+item.id+" · "+item.context;
 b.append(title,meta);
 b.addEventListener("click",()=>open(item));
 return b;
}
function render(value){
 const q=clean(value);
 output.replaceChildren();
 if(!q){output.textContent="Nhập tên bài, môn học hoặc chủ đề để tra cứu.";return;}
 const terms=q.split(" ").filter(Boolean);
 const ranked=items.map(item=>({item,rank:score(item,q,terms)}))
  .filter(x=>x.rank>=0)
  .sort((a,b)=>b.rank-a.rank||Number(b.item.published)-Number(a.item.published)||a.item.title.localeCompare(b.item.title,"vi"))
  .slice(0,14);
 if(!ranked.length){
  const empty=document.createElement("p");empty.textContent="Chưa tìm thấy trong danh mục hiện có. Thử tên môn hoặc từ khóa khác.";
  output.append(empty);return;
 }
 const count=document.createElement("p");
 count.className="small";count.setAttribute("role","status");
 count.textContent=ranked.length+" kết quả phù hợp trong danh mục";
 output.append(count);
 ranked.forEach(x=>output.append(row(x.item)));
}
input.addEventListener("input",e=>render(e.target.value));
render(input.value);
window.liSearch={render};
})();
