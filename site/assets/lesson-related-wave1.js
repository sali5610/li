/* Wave1 related learning: existing UI powered by generated source-checked graph. */
(()=>{
"use strict";
// Published GitHub Pages staging renders verified graph relations inside
// the actual React lesson. Do not append a second vanilla section beside it.
// Other environments retain their previous native fallback unchanged.
if(typeof location!=="undefined"&&location.hostname==="sali5610.github.io"&&
 location.pathname.startsWith("/li/"))return;
const LESSONS={
 "L03-1-2":{route:"lessonL03",title:"Open Questions & Interview Bias",field:"Human–Computer Interaction (HCI)"},
 "L09-1-2":{route:"lessonL09",title:"Sampling Bias",field:"Data Science"},
 "L15-2-2":{route:"lessonL15",title:"Reorder Points & Safety Stock",field:"Supply Chain"}
};
const client=import("./li-content-adapter.mjs").then(m=>m.contentClient);
const lang=id=>{
 const react=document.querySelector('[data-li-react-journey="'+id+'"]');
 if(react?.getAttribute("lang")==="en"||react?.getAttribute("lang")==="vi")return react.getAttribute("lang");
 const active=document.querySelector('[data-lesson-id="'+id+'"] #'+id.slice(0,3).toLowerCase()+'-en');
 if(active)return active.getAttribute("aria-pressed")==="true"?"en":"vi";
 const global=window.liLanguage?.get?.();
 return global==="en"?"en":"vi";
};
function add(tag,cl,content,to){
 const el=document.createElement(tag);if(cl)el.className=cl;
 if(content!==undefined)el.textContent=content;
 if(to)to.append(el);
 return el;
}
function build(item,locale,nodes,list){
 const lesson=LESSONS[item.lessonId];
 if(!lesson||!document.getElementById("page-"+lesson.route))return;
 const e=item.explanations.find(x=>x.predicate==="RELATED_TO"&&x.reviewState==="verified"&&/^https:\/\//.test(x.provenance?.sourceUrl||""));
 if(!e)return;
 const li=add("li","li-related-item",undefined,list);
 const a=add("a","li-related-link",undefined,li);
 a.href="./?lesson="+encodeURIComponent(item.lessonId);a.dataset.relatedLessonId=item.lessonId;
 a.setAttribute("aria-label",(locale==="vi"?"Mở bài ":"Open lesson ")+item.lessonId+": "+lesson.title);
 add("span","li-related-type",lesson.field+" · "+item.lessonId,a);
 add("strong","li-related-name",lesson.title,a);
 add("span","li-related-go",locale==="vi"?"Mở bài học →":"Open lesson →",a);
 a.addEventListener("click",event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(typeof window.navigate==="function"){event.preventDefault();window.navigate(lesson.route);}
 });
 add("p","li-related-reason",e.reasonLocalized?.[locale]||e.reason,li);
 const source=nodes.get(e.fromConcept),target=nodes.get(e.concept);
 const conceptTitle=node=>node?.aliases?.find(x=>x.locale===locale)?.text||node?.title||"";
 add("p","li-related-concepts",
   (locale==="vi"?"Khái niệm: ":"Concepts: ")+
   (source?conceptTitle(source):e.fromConcept)+" ↔ "+(target?conceptTitle(target):e.concept),li);
 const origin=add("a","li-related-source",locale==="vi"?"Nguồn phương pháp · Pew Research Center":"Method source · Pew Research Center",li);
 origin.href=e.provenance.sourceUrl;origin.target="_blank";origin.rel="noopener noreferrer";
}
async function render(id,section){
 const list=section.querySelector(".li-related-list");
 list.replaceChildren();
 try{
  const api=await client;
  const [links,graph]=await Promise.all([api.getRelatedLessons(id),api.graph()]);
  if(!section.isConnected)return;
  const concepts=new Map(graph.nodes.filter(n=>n.kind==="Concept").map(n=>[n.id,n]));
  links.forEach(link=>build(link,lang(id),concepts,list));
  section.hidden=list.children.length===0;
 }catch{
  // If a pack is unavailable, never fall back to unreviewed hardcoded links.
  section.hidden=true;
 }
}
function mount(id){
 const page=document.querySelector('[data-lesson-id="'+id+'"]'),stack=page?.querySelector(".l09-stack");
 if(!page||!stack)return;
 const reactRoute=id==="L09-1-2"||(typeof location!=="undefined"&&
  location.hostname==="sali5610.github.io"&&location.pathname.startsWith("/li/"));
 const wrapper=reactRoute?add("div","section-shell",undefined,page):stack;
 const section=add("section","surface li-related-lessons",undefined,wrapper);
 section.hidden=true;section.setAttribute("aria-labelledby","li-related-"+id);
 const kicker=add("div","kicker","",section);
 const title=add("h2","li-related-title","",section);title.id="li-related-"+id;
 const intro=add("p","li-related-intro small","",section);
 add("ul","li-related-list",undefined,section);
 const refresh=()=>{
  const vi=lang(id)==="vi";
  kicker.textContent=vi?"KẾT NỐI KIẾN THỨC":"CONNECTED LEARNING";
  title.textContent=vi?"Nối tiếp mạch kiến thức":"Follow the learning thread";
  intro.textContent=vi?"Chỉ các liên kết đã đối chiếu nguồn; không phải bài bắt buộc.":"Source-checked connections only; not mandatory prerequisites.";
  void render(id,section);
 };
 for(const locale of ["vi","en"])
  page.querySelector("#"+id.slice(0,3).toLowerCase()+"-"+locale)?.addEventListener("click",refresh);
 window.addEventListener?.("li:localechange",refresh);
 if(reactRoute){
  const place=()=>{
   const slug=id==="L09-1-2"?"l09":id==="L03-1-2"?"l03":"l15";
   const host=page.querySelector("#li-react-"+slug+"-host");
   if(host&&host.nextElementSibling!==wrapper)host.after(wrapper);
  };
  new MutationObserver(place).observe(page,{childList:true});
  place();
 }
 refresh();
}
Object.keys(LESSONS).forEach(mount);
})();
