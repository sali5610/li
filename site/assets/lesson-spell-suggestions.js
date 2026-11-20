/* Optional Wave1 spell suggestions, rendered in existing native lesson pages.
   One reviewable editorial candidate map shared with React; never upgrades
   method-fit approval, awards mastery or writes private learner data. */
(()=>{
"use strict";
const lessonIds=["L03-1-2","L15-2-2"];
const pages=lessonIds.map(id=>document.querySelector('[data-lesson-id="'+id+'"]'))
 .filter(Boolean);
if(!pages.length)return;
const url=new URL("./assets/lesson-spell-suggestions.v0.1.json",document.baseURI);
const localeFor=page=>{
 const short=page.dataset.lessonId.match(/^L(\d{2})-/)?.[1];
 const en=short&&page.querySelector("#l"+short+"-en[aria-pressed='true']");
 return en?"en":window.liLanguage?.get?.()==="en"?"en":"vi";
};
function paint(page,map){
 const entries=map.lessons?.[page.dataset.lessonId];
 if(!Array.isArray(entries)||entries.length!==2||
    !entries.every(x=>/^L2-T\d{2}$/.test(x.techniqueId)&&
     x.shortId===x.techniqueId.slice(3)))return;
 const hero=page.querySelector(".l09-hero-tools");
 if(!hero)return;
 let root=page.querySelector(".li-lesson-spells");
 if(!root){
  root=document.createElement("section");
  root.className="li-lesson-spells";
  root.setAttribute("aria-label","Thần Chú gợi ý cho bài học");
  hero.after(root);
 }
 const en=localeFor(page)==="en";
 root.replaceChildren();
 const top=document.createElement("div");top.className="li-lesson-spell-header";
 const title=document.createElement("h2");
 title.textContent=en?"Spells to try":"Thần Chú có thể thử";
 const note=document.createElement("p");note.className="small";
 note.textContent=en?
  "Optional task-based suggestions · Lesson method fit not yet reviewed.":
  "Gợi ý theo dạng bài · Không bắt buộc · Chưa duyệt ghép phương pháp.";
 top.append(title,note);root.append(top);
 const list=document.createElement("div");list.className="li-lesson-spell-list";
 for(const [index,entry] of entries.entries()){
  const block=document.createElement("div");block.className="li-lesson-spell-item";
  const heading=document.createElement("strong");
  heading.textContent=entry.shortId+" · "+entry.name[en?"en":"vi"];
  const why=document.createElement("p");why.className="small";
  why.textContent=entry.why[en?"en":"vi"];
  const button=document.createElement("button");
  button.type="button";button.className="action alt li-lesson-spell-action";
  button.dataset.method=entry.shortId;
  button.dataset.spellPractice=index===0?"true":"false";
  button.dataset.spellLesson=page.dataset.lessonId;
  button.textContent=en?(index?"See optional spell":"Try this spell"):
   (index?"Xem chú bổ trợ":"Thử thi triển");
  button.setAttribute("aria-label",button.textContent+": "+heading.textContent);
  block.append(heading,why,button);list.append(block);
 }
 root.append(list);
}
fetch(url,{credentials:"same-origin"}).then(r=>{
 if(!r.ok)throw Error("SPELL_SUGGESTIONS_HTTP_"+r.status);return r.json();
}).then(map=>{
 if(map.evidenceStatus!=="task_matched_editorial_candidates_not_reviewed_method_fit")return;
 const render=()=>pages.forEach(page=>paint(page,map));
 render();
 window.addEventListener("li:localechange",render);
 document.addEventListener("click",event=>{
  const target=event.target instanceof Element?event.target.closest("button"):null;
  if(!target||!/^(l03|l15)-(vi|en)$/.test(target.id))return;
  queueMicrotask(render); // native page-local VI/EN choice just changed
 });
}).catch(()=>{/* No speculative fallback if curated mapping fails to load. */});
})();
