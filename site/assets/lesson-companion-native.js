/* li. S125 — mandatory lesson-aware Lão Lý companion for native Hi-Fi lesson routes.
   Zero-cost first-party JSON, read-only learning progress. Never grades work or reveals an answer. */
(function(){
"use strict";
const registry=new Map();
const editorialRegistry=new Map(); // React editorial lessons share the SAME Lão Lý popup.
const stages=["opening","concept","guided","independent","reflection","extension"];
const reactStages={read:"opening",guided:"guided",practice:"independent",feedback:"reflection",progress:"extension"};
let candidateMethods=null;
const reactLesson=id=>document.querySelector('[data-li-react-journey="'+id+'"][data-li-lesson-phase]');
const stageLocale=()=>{
 const item=displayedLesson(),live=item?reactLesson(item.data.lesson_id):
  document.querySelector('[data-li-editorial-journey][data-li-lesson-phase]');
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
/** Only the editorial reader uses these pre-completion prompts. A reader may
 * freely browse step 4/5, but source-authored reflection and extension can
 * refer to answers or completed work. Use already-visible independent-study
 * questions to coach this precise lesson without leaking gated material. */
function pendingEditorialWording(data,stage,locale,submitted){
 const english=locale==="en";
 const practice=data.moments.find(m=>m.stage==="independent")?.[locale];
 const actions=practice?.actions||[];
 const label=text=>String(text||"").replace(/^(?:VI|EN) action [12]:\s*/i,"").trim();
 const first=label(actions[0]?.label)||data.lesson_id;
 const second=label(actions[1]?.label)||first;
 if(stage==="reflection"){
  return {
   label:english?"Feedback · before submission":"Đối chiếu · trước khi nộp",
   prompt:english?
    "You are viewing Feedback for "+data.lesson_id+", but your four answers have not been submitted. The solution stays hidden. Before submitting, question your own reasoning: “"+first+"”":
    "Ngươi đang ở Đối chiếu bài "+data.lesson_id+" nhưng chưa nộp đủ bốn câu. Lời giải vẫn được giữ kín. Trước khi nộp, hãy tự chất vấn: “"+first+"”",
   actions:[
    {label:english?"Challenge my assumption":"Soi giả định của ta",
     reply:actions[0]?.reply||""},
    {label:english?"What else should I test?":"Còn điều gì cần kiểm?",
     reply:actions[1]?.reply||""}
   ]
  };
 }
 const status=english?
  (submitted?"Your answers are saved, but self-review is still incomplete.":
   "You have not submitted your answers or completed self-review."):
  (submitted?"Ngươi đã nộp bài nhưng chưa lưu tự đánh giá.":
   "Ngươi chưa nộp bài và chưa tự đánh giá.");
 return {
  label:english?"Progress · not yet complete":"Tiến độ · chưa hoàn thành",
  prompt:english?
   "This is the Progress page for "+data.lesson_id+". "+status+
   " Completion cannot be claimed yet. One thing to retrieve from memory is: “"+second+"”":
   "Đây là trang Tiến độ của bài "+data.lesson_id+". "+status+
   " Lão chưa thể ghi hoàn thành. Thử tự nhớ lại mà không nhìn đáp án: “"+second+"”",
  actions:[
   {label:english?"What counts as completion?":"Khi nào được tính hoàn thành?",
    reply:english?
     "First submit all four answers, then compare your work and save a self-review. Browsing this page does not count as completion.":
     "Phải nộp bốn câu, đối chiếu bài làm rồi lưu tự đánh giá. Chỉ mở trang Tiến độ chưa được tính hoàn thành."},
   {label:english?"What should I revisit?":"Nên ôn lại điều gì?",
    reply:english?
     "Revisit your lesson's independent question: “"+second+"”. Try answering from memory first, then check your evidence in Practice.":
     "Hãy thử trả lời câu hỏi của bài: “"+second+"” bằng trí nhớ trước, rồi kiểm lại chứng cứ trong Tự luyện tập."}
  ]
 };
}
function context(){
 const item=displayedLesson();
 if(!item){
  const host=document.querySelector('[data-li-editorial-journey][data-li-lesson-phase]');
  const id=host?.getAttribute("data-li-editorial-journey");
  const data=editorialRegistry.get(id);
  const page=host?.closest('[id^="page-"]');
  if(!host||!page?.classList?.contains("active")||!data||
   !document.documentElement.classList.contains("li-auth-verified"))return null;
  const actualPhase=host.getAttribute("data-li-lesson-phase");
  const submitted=host.getAttribute("data-li-lesson-submitted")==="true";
  const reviewed=host.getAttribute("data-li-lesson-reviewed")==="true";
  let requested=actualPhase==="methods"?"guided":
   (reactStages[actualPhase]||"opening");
  if(actualPhase==="read"){
   const concept=document.getElementById(data.moments[1].anchor);
   const rect=concept?.getBoundingClientRect?.();
   if(rect&&rect.top<Math.min(300,(window.innerHeight||720)*0.42)&&rect.bottom>0)
    requested="concept";
  }
  const pending=requested==="reflection"&&!submitted?"submission":
   requested==="extension"&&!reviewed?(submitted?"review":"submission"):null;
  const moment=data.moments.find(m=>m.stage===requested);
  if(!moment)return null;
  const locale=host.getAttribute("lang")==="en"?"en":"vi";
  const wording=pending?pendingEditorialWording(data,requested,locale,submitted):
   moment[locale];
  return {page:page.id.slice(5),lesson_id:id,stage:requested,submitted,reviewed,
   editorial:true,actualPhase,pending,topics:data.topics,quote_ids:moment.quote_ids,
   anchor:moment.anchor,wording};
 }

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
 const suggested=!c.pending&&c.submitted&&["reflection","extension"].includes(c.stage)?
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
  label:c.pending?(stageLocale()==="en"?
   (c.pending==="review"?"Go to self-review":"Go to practice"):
   (c.pending==="review"?"Về phần tự đánh giá":"Về phần luyện tập")):
   (stageLocale()==="en"?"Read this section":"Đọc lại mục này"),
  reply:c.pending?(stageLocale()==="en"?
   (c.pending==="review"?"Return to Feedback to save your self-review.":
    "Return to Practice and submit your four answers when ready."):
   (c.pending==="review"?"Trở lại Đối chiếu để lưu tự đánh giá.":
    "Về Tự luyện tập, hoàn thành và nộp bốn câu khi sẵn sàng.")):
   (stageLocale()==="en"?"Return to the section connected to this question.":
    "Lão đưa ngươi về đúng mục đang học để kiểm tra lại dữ liệu."),
  perform:()=>{
   closeModal("buddy-modal");
   // React owns the visible lesson step. The old anchor remains in hidden
   // native markup for parity only; scrolling to it would look like a dead link.
   if(reactLesson(c.lesson_id)){
    const phase=c.pending?(c.pending==="review"?"feedback":"practice"):
     c.editorial&&c.actualPhase==="methods"?"methods":
     {opening:"read",concept:"read",guided:"guided",
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
// Future full editorial lessons participate in the existing authored mentor.
function registerEditorial(data){
 if(!data||data.schema!==1||!/^L[0-9]{2}-[0-9]+-[0-9]+$/.test(data.lesson_id)||
  !Array.isArray(data.moments)||data.moments.length!==stages.length||
  data.moments.some((m,i)=>m.stage!==stages[i]||
   !Array.isArray(m.quote_ids)||m.quote_ids.length<3||
   !m.vi?.prompt||!m.en?.prompt||m.vi?.actions?.length!==2||m.en?.actions?.length!==2))
   throw Error("EDITORIAL_MENTOR_CONTRACT_INVALID");
 editorialRegistry.set(data.lesson_id,data);updateLabel();
 return ()=>{if(editorialRegistry.get(data.lesson_id)===data)editorialRegistry.delete(data.lesson_id);};
}
window.liLessonCompanion={getContext:context,getPlan:plan,
 registered:()=>[...registry.keys(),...editorialRegistry.keys()],
 registerEditorial};
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