/* li. S125 — mandatory lesson-aware Lão Lý companion for native Hi-Fi lesson routes.
   Zero-cost first-party JSON, read-only learning progress. Never grades work or reveals an answer. */
(function(){
"use strict";
const registry=new Map();
const stages=["opening","concept","guided","independent","reflection","extension"];
const reactStages={read:"opening",guided:"guided",practice:"independent",feedback:"reflection",progress:"extension"};
let candidateMethods=null;
const reactLesson=id=>document.querySelector('[data-li-react-journey="'+id+'"][data-li-lesson-phase]');
const stageLocale=()=>{
 const item=displayedLesson(),live=item?reactLesson(item.data.lesson_id):null;
 return (live?.getAttribute("lang")||item?.root.getAttribute("lang")||
   document.documentElement.lang)==="en"?"en":"vi";
};
function hasSubmitted(lessonId){
 try{const v=JSON.parse(localStorage.getItem("li.review."+lessonId+".v1")||"null");return Boolean(v&&v.submitted);}
 catch(e){return false;}
}
function displayedLesson(){
 for(const item of registry.values())if(item.root.classList.contains("active"))return item;
 return null;
}
function activeMoment(item){
 const max=Math.min(320,(window.innerHeight||720)*.36);
 let position=0;
 for(let i=0;i<item.data.moments.length;i++){
  const anchor=document.getElementById(item.data.moments[i].anchor);
  if(anchor&&anchor.getBoundingClientRect().top<=max)position=i;
 }
 if(item.data.moments[position].stage==="reflection"&&!hasSubmitted(item.data.lesson_id))position=3;
 return item.data.moments[position];
}
function context(){
 const item=displayedLesson();
 if(!item)return null;
 const live=reactLesson(item.data.lesson_id);
 const submitted=live?live.getAttribute("data-li-lesson-submitted")==="true":hasSubmitted(item.data.lesson_id);
 const mappedStage=live?reactStages[live.getAttribute("data-li-lesson-phase")]:null;
 const safeStage=mappedStage==="reflection"&&!submitted?"independent":mappedStage;
 const moment=(safeStage&&item.data.moments.find(m=>m.stage===safeStage))||activeMoment(item);
 return {page:item.root.id.slice(5),lesson_id:item.data.lesson_id,stage:moment.stage,submitted,
  topics:item.data.topics,quote_ids:moment.quote_ids,anchor:moment.anchor,wording:moment[stageLocale()]};
}
function plan(page){
 const c=context();
 if(!c||c.page!==page)return null;
 const a=c.wording.actions;
 const actions=a.map(x=>({label:x.label,reply:x.reply,perform:null}));
 const suggested=c.submitted&&["reflection","extension"].includes(c.stage)?
   candidateMethods?.lessons?.[c.lesson_id]?.[0]:null;
 const supported=suggested&&/^L2-T\d{2}$/.test(suggested.techniqueId)&&
  suggested.shortId===suggested.techniqueId.slice(3);
 if(supported){
  const english=stageLocale()==="en",exercise=true;
  actions.push({
   label:(english?"Try optional ":"Thử thần chú gợi ý ")+suggested.shortId,
   reply:(english?"Editorial suggestion, not reviewed method fit or mastery: ":
     "Gợi ý theo dạng bài, chưa duyệt ghép phương pháp hay chứng nhận thông thạo: ")+
     suggested.why[english?"en":"vi"],
   perform:()=>{
    closeModal("buddy-modal");
    if(typeof showMethod==="function")showMethod(suggested.shortId,{practice:exercise,lessonId:c.lesson_id});
   }
  });
 }else actions.push({
  label:stageLocale()==="en"?"Read this section":"Đọc lại mục này",
  reply:stageLocale()==="en"?"Return to the section connected to this question.":"Lão đưa ngươi về đúng mục đang học để kiểm tra lại dữ liệu.",
  perform:()=>{
   closeModal("buddy-modal");
   // React owns the visible lesson step. The old anchor remains in hidden
   // native markup for parity only; scrolling to it would look like a dead link.
   if(reactLesson(c.lesson_id)){
    const phase={opening:"read",concept:"read",guided:"guided",
      independent:"practice",reflection:"feedback",extension:"progress"}[c.stage];
    if(phase){
     window.dispatchEvent(new CustomEvent("li:mentor-phase-jump",{
      detail:{lessonId:c.lesson_id,phase}
     }));
     return;
    }
   }
   document.getElementById(c.anchor)?.scrollIntoView?.({behavior:"smooth",block:"start"});
  }
 });
 return {intro:c.wording.label+" · "+c.wording.prompt,actions};
}
function updateLabel(){
 const c=context();if(!c)return;
 const node=displayedLesson()?.root.querySelector("[data-lesson-mentor-stage]")||displayedLesson()?.root.querySelector("#li-lesson-mentor-stage");
 if(node)node.textContent=c.wording.label+" · "+c.wording.prompt;
}
function valid(data,id,root){
 if(!data||data.schema!==1||data.lesson_id!==id||!Array.isArray(data.moments))return false;
 if(data.moments.length!==stages.length||data.moments.some((m,i)=>m.stage!==stages[i]))return false;
 return data.moments.every(m=>document.getElementById(m.anchor)
  &&Array.isArray(m.quote_ids)&&m.quote_ids.length>=3
  &&m.vi?.actions?.length===2&&m.en?.actions?.length===2);
}
async function load(root){
 const id=root.getAttribute("data-lesson-id");
 const url=root.getAttribute("data-companion-manifest");
 if(!id||!url)return;
 try{
  const response=await fetch(url,{credentials:"same-origin"});
  if(!response.ok)throw Error("Missing companion manifest: "+id);
  const data=await response.json();
  if(!valid(data,id,root))throw Error("Invalid companion contract: "+id);
  registry.set(root.id,{root,data});
  updateLabel();
 }catch(error){
  const note=root.querySelector("[data-lesson-mentor-stage]")||root.querySelector("#li-lesson-mentor-stage");
  if(note)note.textContent="Nội dung Lão Lý chưa khả dụng; bài học không bị thay đổi.";
  console.warn("li. lesson companion:",error.message);
 }
}
window.liLessonCompanion={getContext:context,getPlan:plan,registered:()=>Array.from(registry.keys())};
document.querySelectorAll("[data-lesson-id][data-companion-manifest]").forEach(root=>{load(root);});
// Only editorial candidate method suggestions. Do not promote fit to verified or assign K3 mastery.
fetch(new URL("./assets/lesson-spell-suggestions.v0.1.json",document.baseURI),{credentials:"same-origin"})
 .then(r=>{if(!r.ok)throw Error("METHOD_SUGGESTION_UNAVAILABLE");return r.json();})
 .then(data=>{
  if(data?.evidenceStatus==="task_matched_editorial_candidates_not_reviewed_method_fit")
   candidateMethods=data;
 }).catch(()=>{/* Companion's existing two contextual actions remain usable. */});
let pending=false;
function refresh(){
 if(pending)return;pending=true;
 requestAnimationFrame(()=>{pending=false;updateLabel();});
}
window.addEventListener("scroll",refresh,{passive:true});
window.addEventListener("resize",refresh,{passive:true});
window.addEventListener("li:lesson-phase-changed",refresh);
document.addEventListener("click",event=>{
 const element=event.target.closest?.("[data-page], [data-buddy], #l09-submit, #l09-vi, #l09-en, #l03-submit, #l03-vi, #l03-en, #l15-submit, #l15-vi, #l15-en, .l09-index a");
 if(element)Promise.resolve().then(refresh);
});
})();