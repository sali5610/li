/* One visible lesson-contents control on all real lesson routes.
 * Hoists existing native Wave1 chapters out of potentially clipped .page.
 * For React/personal lessons, provides a non-mutating section navigator.
 * Does not grant route, auth or content access.
 */
(()=>{"use strict";
const main=document.getElementById("main");
if(!main||!document.body)return;
const pages=()=>Array.from(main.querySelectorAll(
 '.page[id^="page-lesson"],.page[id^="page-draftLesson"]'));
const isActive=page=>page.isConnected&&page.classList.contains("active");
const labels=()=>window.liLanguage?.get?.()==="en"?
 {menu:"Lesson contents",close:"Close contents",title:"Contents",all:"Lesson overview",empty:"No sections available"}:
 {menu:"Mục lục bài học",close:"Đóng mục lục",title:"Mục lục",all:"Đầu bài học",empty:"Chưa có mục"};
const managed=new WeakSet();
const fallback=new WeakSet();
let frame=0;
function sync(){
 for(const page of pages()){
  if(page.dataset.catalogChapterNav==="ready"){
   const trigger=document.body.querySelector('.catalog-chapter-fab[data-lesson-owner="'+page.id+'"]')
    ||page.querySelector('.catalog-chapter-fab');
   const layer=document.body.querySelector('.catalog-sheet-layer[data-lesson-owner="'+page.id+'"]')
    ||page.querySelector('.catalog-sheet-layer');
   if(trigger&&layer&&!managed.has(page)){
    trigger.dataset.lessonOwner=page.id;
    layer.dataset.lessonOwner=page.id;
    document.body.append(trigger,layer);
    managed.add(page);
   }
   if(trigger){
    trigger.hidden=!isActive(page);
    trigger.setAttribute("aria-label",labels().menu);
    if(!isActive(page)&&layer&&!layer.hidden)layer.querySelector('.catalog-sheet-close')?.click();
   }
   continue;
  }
  if(!isActive(page)||fallback.has(page))continue;
  // React owns its text/content; this only offers in-document navigation.
  // Never hide, replace or mutate lesson sections or learning state.
  const trigger=document.createElement("button");
  trigger.type="button";trigger.className="catalog-chapter-fab";
  trigger.dataset.lessonOwner=page.id;
  trigger.textContent="☰";
  trigger.setAttribute("aria-label",labels().menu);
  trigger.setAttribute("title",labels().menu);
  trigger.setAttribute("aria-expanded","false");
  trigger.setAttribute("aria-haspopup","dialog");
  const layer=document.createElement("div");
  layer.className="catalog-sheet-layer";
  layer.dataset.lessonOwner=page.id;layer.hidden=true;
  const backdrop=document.createElement("div");backdrop.className="catalog-sheet-backdrop";
  backdrop.setAttribute("aria-hidden","true");
  const sheet=document.createElement("aside");sheet.className="catalog-chapter-sheet";
  sheet.id="li-contents-"+page.id;
  sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");
  sheet.setAttribute("aria-label",labels().menu);sheet.tabIndex=-1;
  const head=document.createElement("div");head.className="catalog-sheet-heading";
  const title=document.createElement("h2");title.textContent=labels().title;
  const close=document.createElement("button");close.type="button";
  close.className="catalog-sheet-close";close.textContent=labels().close;
  const list=document.createElement("nav");list.className="catalog-left-index";
  list.setAttribute("aria-label",labels().menu);
  head.append(title,close);sheet.append(head,list);layer.append(backdrop,sheet);
  trigger.setAttribute("aria-controls",sheet.id);
  document.body.append(trigger,layer);
  let returnFocus=trigger;
  const collect=()=>{
   const sectionSelector=[
    ".li-study-book-page > section[id]",
    ".li-learning-current section[id]",
    ".li-learning-current article[id]",
    ".li-editorial-markdown > section[id]"
   ].join(",");
   let entries=Array.from(page.querySelectorAll(sectionSelector));
   if(!entries.length){
    entries=Array.from(page.querySelectorAll(
     ".li-learning-current h2,.li-learning-current h3,"+
     ".li-study-book-page h2,.li-editorial-markdown h2,.li-editorial-markdown h3"));
   }
   // Don't treat the enclosing lesson title, modal contents or its controls as a chapter.
   const seen=new Set();
   return entries.filter(node=>{
    if(node.closest(".catalog-sheet-layer"))return false;
    const name=node.matches("h2,h3")?node.textContent:
      node.querySelector("h2,h3")?.textContent||node.getAttribute("aria-label");
    const value=(name||"").trim();
    if(!value||seen.has(value))return false;
    seen.add(value);return true;
   }).slice(0,40);
  };
  const refresh=()=>{
   const nodes=collect();
   list.replaceChildren();
   const top=document.createElement("button");top.type="button";
   top.className="catalog-chapter-all";top.textContent=labels().all;
   top.addEventListener("click",()=>{
    setOpen(false);page.querySelector("h1")?.scrollIntoView({block:"start"});
   });
   list.append(top);
   nodes.forEach(node=>{
    const button=document.createElement("button");
    button.type="button";button.className="catalog-chapter-all";
    button.textContent=node.matches("h2,h3")?node.textContent.trim():
     (node.querySelector("h2,h3")?.textContent||node.getAttribute("aria-label")||"").trim();
    button.addEventListener("click",()=>{
     setOpen(false);node.scrollIntoView({block:"start",behavior:"smooth"});
    });
    list.append(button);
   });
   if(!nodes.length){
    const note=document.createElement("p");note.textContent=labels().empty;list.append(note);
   }
  };
  const trap=event=>{
   if(layer.hidden)return;
   if(event.key==="Escape"){event.preventDefault();setOpen(false);return;}
   if(event.key!=="Tab")return;
   const nodes=Array.from(sheet.querySelectorAll('button:not([disabled]),a[href]'));
   const first=nodes[0],last=nodes[nodes.length-1];
   if(event.shiftKey&&document.activeElement===first){
    event.preventDefault();last.focus();
   }else if(!event.shiftKey&&document.activeElement===last){
    event.preventDefault();first.focus();
   }
  };
  function setOpen(open){
   if(open){refresh();returnFocus=document.activeElement||trigger;}
   layer.hidden=!open;trigger.setAttribute("aria-expanded",String(open));
   if(open){document.addEventListener("keydown",trap);close.focus();}
   else{document.removeEventListener("keydown",trap);
    if(returnFocus?.isConnected)returnFocus.focus();}
  }
  trigger.addEventListener("click",()=>setOpen(true));
  close.addEventListener("click",()=>setOpen(false));
  backdrop.addEventListener("click",()=>setOpen(false));
  new MutationObserver(()=>{
   const visible=isActive(page);trigger.hidden=!visible;
   if(!visible&&!layer.hidden)setOpen(false);
  }).observe(page,{attributes:true,attributeFilter:["class"]});
  fallback.add(page);
 }
 for(const trigger of document.body.querySelectorAll(".catalog-chapter-fab[data-lesson-owner]")){
  const page=document.getElementById(trigger.dataset.lessonOwner);
  trigger.hidden=!page||!isActive(page);
 }
}
function schedule(){
 if(frame)return;
 frame=window.requestAnimationFrame?window.requestAnimationFrame(()=>{
  frame=0;sync();
 }):0;
 if(!frame)sync();
}
sync();
new MutationObserver(schedule).observe(main,{subtree:true,childList:true});
window.addEventListener("li:route-changed",schedule);
window.addEventListener("popstate",schedule);
window.addEventListener("li:localechange",schedule);
})();
