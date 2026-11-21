import {openRoute} from './app-router.js';
import React,{useEffect,useId,useRef,useState,useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {Button,Card,Checkbox,Field,Heading,InlineFeedback,Radio,Text,LiIcon} from '../../../../design-system/react/index';
import {createFadedT03Flow,fadedT03Phase} from './spell-t03-flow.js';
import {createLociT13Flow,lociT13Phase} from './spell-t13-flow.js';
import {createResumeT12Flow,resumeT12Phase} from './spell-t12-flow.js';
import {createStandardSpellFlow,standardSpellPhase} from './spell-standard-flow.js';
import './detail-practice.css';

/** The existing authored exercise checker and private-note transaction owners
 * are shared through read/action ports. No duplicate scoring or personal writes. */
type Method={id:string;title:string;original:string;purpose:string;category:string};
type SpellField={id:string;label:string;options:string[]|null;choiceKind:'multi'|'radio'};
type SpellView={
 active:string;title:string;mode:string;phase:number;tab:'guide'|'practice';
 lesson:string;prompt:string;fields:SpellField[];feedback:string;
 resumeNote:string;places:string[];dueAt:number|null;
 t02ReviewCount:number;t02Streak:number;t02AwaitingRating:boolean;
 lessonId:string|null;reviewedInSession:boolean;viewSession:number;
 t12Draft?:{context:string;next:string;answer:string};
 t12SavedOnDevice?:boolean;t12Synced?:boolean;t12StorageError?:string;
 practiceCount?:number;practiceLastAt?:number|null;practiceError?:string;practiceSynced?:boolean
};
type Version={version:number;title:string;body:string;at:string;change?:string};
type CaseContext={
 question:string;scene:string;options:{text:string;selected:boolean}[];
 choice:string;feedback:string;provenance:string
};
type NoteView={
 id:string|null;type:'case'|'idea'|null;title:string;body:string;status?:string;
 kind?:string;bodyTitle?:string;date?:string;backRoute:string;
 history:Version[];context:CaseContext|null;bookmarked?:boolean;storageAvailable:boolean
};
type NoteOutcome={ok:boolean;changed?:boolean;message:string};
type AppWindow=Window&{
 liReleasedLessonRoutes?:Readonly<Record<string,string>>;
 liPersonalStudyRoutes?:Readonly<Record<string,string>>;
 LiSpellPractice?:{
  getView:()=>SpellView|null;setTab:(value:'guide'|'practice')=>void;
  perform:(action:string,answers?:Record<string,string|string[]>)=>boolean;
  setT12Draft?:(field:string,value:string)=>boolean
 };
 liMethods?:{getView:()=>{methods:Method[]}};
 liLanguage?:{get:()=>string;translate?:(value:string)=>string};
 liNotes?:{
  getView:()=>NoteView;
  saveFromReact:(title:string,body:string,baseVersion:number)=>NoteOutcome;
  restoreFromReact:(version:number,confirmed?:boolean)=>boolean;
  deleteNote:(type:'case'|'idea',id:string)=>boolean;
  deleteFromReact:(type:'case'|'idea',id:string)=>boolean
 };
 liBookmarks?:{toggle:(kind:string,id:string)=>boolean}
};
const app=window as AppWindow;
const en=()=>app.liLanguage?.get?.()==='en';
const copy=(vi:string,english:string)=>en()?english:vi;
const tr=(text:string)=>en()?(app.liLanguage?.translate?.(text)||text):text;
// Technique-specific instructions follow the canonical 13 L2 method definitions.
// The direct React practice engine below remains the sole owner of gates and progress.
const SPELL_GUIDANCE:Record<string,{vi:[string,string,string];en:[string,string,string];noteVi:string;noteEn:string}>={
  "T01": {
    "vi": [
      "Chọn một khái niệm đã học, đọc nguồn một lần rồi che đi.",
      "Tự viết hoặc nói lại bằng trí nhớ, không mở lời giải khi đang nhớ.",
      "Mở nguồn để đối chiếu, ghi điều nhớ thiếu hoặc hiểu sai."
    ],
    "en": [
      "Choose a concept you have already studied, then hide the source.",
      "Recall it aloud or in writing without peeking at the answer.",
      "Reveal the source, compare, and identify what you missed."
    ],
    "noteVi": "Chỉ xem đáp án hoặc nhận ra câu đúng khi nhìn lại chưa phải là tự gọi nhớ.",
    "noteEn": "Recognising an answer after seeing it is not the same as retrieving it from memory."
  },
  "T02": {
    "vi": [
      "Chọn kiến thức đã học và đặt lịch ôn đầu tiên sau 24 giờ.",
      "Khi thật sự đến hạn, giấu nguồn, tự gọi nhớ rồi đối chiếu phản hồi.",
      "Tự đánh giá nhớ được hay chưa vững để hẹn lượt kế tiếp; lặp lại qua nhiều ngày."
    ],
    "en": [
      "Choose previously learned material and schedule the first review after 24 hours.",
      "When it is truly due, recall without the source, then check the feedback.",
      "Rate recall as secure or needing retry to schedule the next review across days."
    ],
    "noteVi": "Mốc 1–3–7–14–30 ngày là mặc định của app, không phải lịch tối ưu cho mọi người. Mở Thần Chú trước hạn không tính là đã ôn.",
    "noteEn": "The 1–3–7–14–30-day intervals are app defaults, not a universal optimum. Opening the spell before its due time does not count as a review."
  },
  "T03": {
    "vi": [
      "Quan sát ví dụ đã giải và hiểu vì sao mỗi bước đúng.",
      "Giải bài tương tự với một phần gợi ý được giữ lại.",
      "Giải bài mới không gợi ý, nộp rồi mới xem phản hồi."
    ],
    "en": [
      "Study a worked example and understand why each step works.",
      "Solve a similar case with some guidance removed.",
      "Solve a new case independently before checking feedback."
    ],
    "noteVi": "Xem ví dụ mẫu không được tính là tự giải bài độc lập.",
    "noteEn": "Viewing the worked example does not count as independent practice."
  },
  "T04": {
    "vi": [
      "Chọn một bước hoặc kết luận trong tình huống đã đọc.",
      "Tự giải thích cơ chế: vì sao nó xảy ra, theo điều kiện nào.",
      "Đối chiếu giải thích với dữ kiện, chỉnh chỗ thiếu hoặc suy diễn quá mức."
    ],
    "en": [
      "Choose one step or conclusion from the example.",
      "Explain why it works and under which conditions.",
      "Check your explanation against the evidence and correct unsupported leaps."
    ],
    "noteVi": "Đừng chỉ chép lại nội dung; giải thích phải thể hiện mối quan hệ hoặc cơ chế.",
    "noteEn": "Copying the source is not self-explanation; articulate the relationship or mechanism."
  },
  "T05": {
    "vi": [
      "Đặt câu hỏi 'Vì sao?' cho nhận định hoặc mối quan hệ trong bài.",
      "Tìm bằng chứng, điều kiện và yếu tố khác có thể giải thích kết quả.",
      "Viết lý do có giới hạn, phân biệt giả thuyết với điều đã kiểm chứng."
    ],
    "en": [
      "Ask why a claim or relationship might hold.",
      "Check the evidence, conditions, and alternative explanations.",
      "State a bounded explanation and distinguish hypotheses from verified facts."
    ],
    "noteVi": "Có hai việc xảy ra cùng lúc không đủ chứng minh quan hệ nhân quả.",
    "noteEn": "Two changes happening together do not establish causation."
  },
  "T06": {
    "vi": [
      "Đặt hai khái niệm dễ nhầm cạnh nhau, nêu điểm giống và khác.",
      "Phân loại từng trường hợp bằng dấu hiệu quyết định, không nhìn từ khóa.",
      "Đối chiếu đáp án rồi thử giải thích vì sao trường hợp kia không phù hợp."
    ],
    "en": [
      "Compare two confusable concepts, including similarities and differences.",
      "Classify each case by the decisive feature, not a superficial keyword.",
      "Check feedback and explain why the alternative classification fails."
    ],
    "noteVi": "Gắn nhãn đúng mà không nêu được tiêu chí phân biệt vẫn chưa chứng minh hiểu.",
    "noteEn": "A correct label without a discriminating reason does not demonstrate understanding."
  },
  "T07": {
    "vi": [
      "Viết rõ tiền đề và kết luận trong lập luận.",
      "Kiểm tra kết luận có theo logic từ tiền đề hay không.",
      "Kiểm tra riêng tiền đề có chứng cứ thật không rồi mới đánh giá kết luận ngoài đời."
    ],
    "en": [
      "Separate the argument into premises and conclusion.",
      "Test whether the conclusion logically follows from the premises.",
      "Separately check whether the premises are true before claiming real-world truth."
    ],
    "noteVi": "Lập luận hợp lệ về hình thức không có nghĩa các tiền đề đúng.",
    "noteEn": "A valid argument form does not prove its premises are true."
  },
  "T08": {
    "vi": [
      "Tách luận điểm và bằng chứng đang được đưa ra.",
      "Viết giả định nối bằng chứng với luận điểm (cầu nối).",
      "Thêm phản biện hoặc bằng chứng ngược mạnh nhất rồi đánh giá lại luận điểm."
    ],
    "en": [
      "Separate the claim from the evidence offered for it.",
      "Identify the warrant that links the evidence to the claim.",
      "Add a relevant objection or counterevidence and reassess the claim."
    ],
    "noteVi": "Sơ đồ đủ ô chưa có nghĩa lập luận có chứng cứ tốt.",
    "noteEn": "A complete-looking argument map does not make the argument sound."
  },
  "T09": {
    "vi": [
      "Xác định tác giả, ngày, nguồn gốc và cách tạo ra dữ liệu.",
      "Đọc phạm vi mẫu, phương pháp và bằng chứng trái chiều nếu có.",
      "Chỉ kết luận trong phạm vi nguồn thực sự hỗ trợ; ghi điều chưa xác minh."
    ],
    "en": [
      "Identify the author, date, provenance, and data-collection method.",
      "Check the sampled population, methods, and conflicting evidence.",
      "Limit conclusions to what the source supports and mark unverified gaps."
    ],
    "noteVi": "Không khẳng định đã kiểm tra nguồn gốc nếu chỉ đọc bản tóm tắt hoặc slide.",
    "noteEn": "Do not claim an original source was inspected if you only read a summary or slide."
  },
  "T10": {
    "vi": [
      "Nêu mục tiêu và các ràng buộc thực tế của vấn đề.",
      "Chia thành các bước nhỏ có thể kiểm tra hoặc tính toán.",
      "Thử một trường hợp biên có khả năng làm kế hoạch thất bại."
    ],
    "en": [
      "Define the goal and practical constraints.",
      "Break the problem into testable or computable steps.",
      "Test an edge condition that could cause the plan to fail."
    ],
    "noteVi": "Đánh dấu đủ bước kiểm tra không tự chứng minh lời giải chạy đúng.",
    "noteEn": "Checking off a list is not proof that the solution works."
  },
  "T11": {
    "vi": [
      "Xác định mình đã hiểu gì và đang cần học điều gì.",
      "So điều kiện của từng phương pháp với nhiệm vụ hiện tại.",
      "Chọn một cách phù hợp hoặc chủ động bỏ qua; giải thích lý do."
    ],
    "en": [
      "Identify what you already know and what you need to learn.",
      "Match the task and prerequisites to the available techniques.",
      "Choose a suitable technique or deliberately skip one, with a reason."
    ],
    "noteVi": "Không bắt buộc dùng Thần Chú cho mọi bài. Ôn giãn cách không thay thế lần học đầu.",
    "noteEn": "A technique is optional for each lesson. Spaced review does not replace initial learning."
  },
  "T12": {
    "vi": [
      "Trước khi tạm ngắt, ghi lại mình đang làm dở việc gì.",
      "Ghi một hành động nhỏ, cụ thể để bắt đầu khi quay lại.",
      "Khi trở lại, đọc dấu vết rồi thực hiện bước đó và tự đối chiếu."
    ],
    "en": [
      "Before pausing, capture where you stopped.",
      "Write one specific, small action to take when returning.",
      "On return, read the cue, perform that step, and review what changed."
    ],
    "noteVi": "Đây là công cụ quay lại nhiệm vụ, không phải bài đo sự tập trung hay trí thông minh.",
    "noteEn": "This supports re-entry to a task; it does not measure attention or intelligence."
  },
  "T13": {
    "vi": [
      "Chọn ba địa điểm quen thuộc, khác nhau, theo một lộ trình cố định.",
      "Gắn từng ý đã học với một hình ảnh liên tưởng riêng tại mỗi nơi.",
      "Giấu nguồn, đi lại lộ trình trong trí óc, gọi nhớ theo thứ tự rồi đối chiếu nghĩa."
    ],
    "en": [
      "Choose three distinct familiar places in a fixed route.",
      "Attach each learned idea to a memorable image at a different place.",
      "Hide the source, mentally walk the route, retrieve in order, and check meaning."
    ],
    "noteVi": "Chỉ tạo cung điện trí nhớ chưa phải đã nhớ được; phải thử gọi nhớ không nhìn nguồn.",
    "noteEn": "Building a memory palace is not retrieval; test recall without the source."
  }
};

function personalLessonReturn(method:string):string|null{
 try{
  const token=JSON.parse(sessionStorage.getItem('li.sectioned.guide-return.v1')||'null') as
   {id?:string;method?:string;at?:number}|null;
  if(!token?.id||token.method!==method||!token.at||
   Date.now()-token.at>3600000)return null;
  return app.liPersonalStudyRoutes?.[token.id]||null;
 }catch{return null;}
}
function useSpell(){
 const [view,setView]=useState<SpellView|null>(()=>app.LiSpellPractice?.getView()||null);
 useEffect(()=>{
  const update=()=>setView(app.LiSpellPractice?.getView()||null);
  window.addEventListener('li:spell-view-changed',update);
  window.addEventListener('li:localechange',update);
  // T02 becomes due with wall-clock time; re-evaluate resumed PWA/Safari tabs.
  const onVisible=()=>{if(document.visibilityState==='visible')update();};
  window.addEventListener('focus',update);
  window.addEventListener('pageshow',update);
  document.addEventListener('visibilitychange',onVisible);
  return ()=>{
   window.removeEventListener('li:spell-view-changed',update);
   window.removeEventListener('li:localechange',update);
   window.removeEventListener('focus',update);
   window.removeEventListener('pageshow',update);
   document.removeEventListener('visibilitychange',onVisible);
  };
 },[]);
 return view;
}
function PracticeField({field,value,onChange}:{
 field:SpellField;value:string|string[]|undefined;
 onChange:(value:string|string[])=>void
}){
 if(field.options){
  const choices=field.choiceKind==='multi'?
   (Array.isArray(value)?value:[]):[typeof value==='string'?value:''];
  return <fieldset className="spell-field li-react-spell-field">
   <legend>{tr(field.label)}</legend>
   {field.options.map((option,index)=>{
    const key=String(index),checked=choices.includes(key);
    return <div className="spell-option" key={key}>
     {field.choiceKind==='multi'?
      <Checkbox label={tr(option)} checked={checked}
       onChange={event=>onChange(event.target.checked?
        [...choices,key]:choices.filter(item=>item!==key))}/>:
      <Radio label={tr(option)} name={'react-sp-'+field.id}
       value={key} checked={checked} onChange={()=>onChange(key)}/>}
    </div>;
   })}
  </fieldset>;
 }
 return <Field className="spell-field li-react-spell-field" label={tr(field.label)}
  kind="textarea" rows={3} value={typeof value==='string'?value:''}
  onChange={event=>onChange(event.target.value.slice(0,1200))}/>;
}
export function GuideDetail(){
 const view=useSpell();
 // All 13 techniques use XState for verified progression. One generic actor
 // handles T01/T02/T04–T11; specialised T03/T12/T13 actors are reused.
 // The authored checker remains the sole owner of answers and feedback.
 const [t03Flow]=useState(createFadedT03Flow);
 const t03Stage=useSyncExternalStore(t03Flow.subscribe,t03Flow.getSnapshot);
 const [t13Flow]=useState(createLociT13Flow);
 const t13Stage=useSyncExternalStore(t13Flow.subscribe,t13Flow.getSnapshot);
 const [t12Flow]=useState(createResumeT12Flow);
 const t12Stage=useSyncExternalStore(t12Flow.subscribe,t12Flow.getSnapshot);
 const [standardFlow]=useState(createStandardSpellFlow);
 const standardStage=useSyncExternalStore(standardFlow.subscribe,standardFlow.getSnapshot);
 useEffect(()=>{
  t03Flow.sync(view);
  t13Flow.sync(view);
  t12Flow.sync(view);
  standardFlow.sync(view);
 },[t03Flow,t13Flow,t12Flow,standardFlow,view?.active,view?.mode,view?.phase,view?.dueAt,view?.viewSession,view?.reviewedInSession,view?.resumeNote]);
 useEffect(()=>()=>{t03Flow.stop();t13Flow.stop();t12Flow.stop();standardFlow.stop();},[t03Flow,t13Flow,t12Flow,standardFlow]);
 const phase=view?.active==='T03'&&t03Flow.isCurrent(view)
  ?fadedT03Phase(t03Stage):
  view?.active==='T13'&&t13Flow.isCurrent(view)
   ?lociT13Phase(t13Stage):
  view?.active==='T12'&&t12Flow.isCurrent(view)
   ?resumeT12Phase(t12Stage):
    standardFlow.isCurrent(view)
     ?standardSpellPhase(standardStage,view?.mode??'direct'):(view?.phase??0);
 const [methodTick,setMethodTick]=useState(0);
 const [answers,setAnswers]=useState<Record<string,string|string[]>>({});
 useEffect(()=>{
  const update=()=>setMethodTick(value=>value+1);
  window.addEventListener('li:localechange',update);
  window.addEventListener('li:study-mode-applied',update);
  return ()=>{
   window.removeEventListener('li:localechange',update);
   window.removeEventListener('li:study-mode-applied',update);
  };
 },[]);
 useEffect(()=>{
  setAnswers(view?.active==='T12'&&view.t12Draft?{...view.t12Draft}:{});
 },[view?.active,view?.phase,view?.lessonId,view?.viewSession]);
 const method=(app.liMethods?.getView().methods||[]).find(x=>x.id===view?.active);
 const setTab=(tab:'guide'|'practice')=>app.LiSpellPractice?.setTab(tab);
 const action=(kind:string)=>{
  const ok=view?.active==='T03'
   ?t03Flow.execute(kind,answers,app.LiSpellPractice)
   :view?.active==='T13'
    ?t13Flow.execute(kind,answers,app.LiSpellPractice)
    :view?.active==='T12'
     ?t12Flow.execute(kind,answers,app.LiSpellPractice)
     :standardFlow.execute(kind,answers,app.LiSpellPractice);
  if(ok&&['reset','clear','schedule','next','rate-remembered','rate-retry'].includes(kind))setAnswers({});
 };
 const prompt=()=>{
  if(!view)return '';
  if(view.mode==='faded'&&phase===1)
   return copy('Bước có gợi ý: 5 đơn vị/ngày × 2 ngày chờ + 4 tồn an toàn = ?', 'Guided step: 5 units/day × 2 days + 4 safety stock = ?');
  if(view.mode==='faded'&&phase===2)
   return copy('Bài độc lập: 7 đơn vị/ngày, 3 ngày chờ, 5 đơn vị an toàn. Điểm đặt hàng lại?', 'Independent step: 7 units/day, 3-day lead time, 5 safety stock. Reorder point?');
  if(view.mode==='resume'&&phase===1)
   return copy('Hãy viết một câu kết luận chỉ về 20 người được khảo sát.', 'Write one claim limited to the 20 surveyed people.');
  if(view.mode==='loci'&&phase===1)
   return copy('Hình dung đi qua ba nơi đã chọn. Không xem lại nguồn hoặc liên tưởng.', 'Walk through your three places mentally. Do not reread the source or cues.');
  return tr(view.prompt);
 };
 if(!view||!method)return <div className="section-shell" data-li-react-screen="guide-detail">
  <Button variant="ghost" onClick={()=>openRoute('guide')}><LiIcon name="chevron-left" size={18}/> {copy('Sổ Tay Thần Chú','Learning Spells')}</Button>
  <InlineFeedback tone="info" message={copy('Chọn một Thần Chú để đọc và thực hành.','Select a learning spell to begin.')}/>
 </div>;
 const lessonRoute=view.lessonId?app.liReleasedLessonRoutes?.[view.lessonId]:undefined;
 const personalRoute=(view.lessonId?app.liPersonalStudyRoutes?.[view.lessonId]:undefined)
  ||personalLessonReturn(view.active);
 const preparing=phase===0;
 const hasSource=preparing;
 let actionLabel=copy('Đối chiếu bài làm','Check your response');
 if(preparing&&view.mode==='resume')actionLabel=copy('Tạm ngắt · Lưu dấu vết','Pause · Save re-entry cue');
 else if(preparing&&view.mode==='loci')actionLabel=copy('Giấu nguồn · Đi qua lộ trình','Hide source · Walk the route');
 else if(preparing&&['faded','hide'].includes(view.mode))actionLabel=copy('Giấu nguồn · Tiếp tục','Hide source · Continue');
 else if(view.mode==='faded'&&phase===1)actionLabel=copy('Kiểm tra để sang bài mới','Check to continue');
 else if(view.mode==='faded'&&phase===2)actionLabel=copy('Đối chiếu độc lập','Check independently');
 const isDuePreparing=preparing&&view.mode==='due';
 const dueFuture=isDuePreparing&&view.dueAt!==null&&view.dueAt>Date.now();
 const ctaKind=preparing&&['faded','hide','resume','loci'].includes(view.mode)?'next':'check';
 return <div className="section-shell li-react-spell-detail" data-li-react-screen="guide-detail">
  <nav className="spell-detail-navigation" aria-label={copy('Điều hướng Thần Chú','Spell navigation')}>
   <Button variant="ghost" onClick={()=>openRoute('guide')} className="library-back-link">
    <LiIcon name="chevron-left" size={18}/> {copy('Sổ Tay Thần Chú','Learning Spells')}
   </Button>
   {(lessonRoute||personalRoute)&&<Button variant="ghost"
    onClick={()=>openRoute((lessonRoute||personalRoute)!)} className="spell-linked-lesson">
    {copy('Mở bài học liên quan','Open related lesson')} <LiIcon name="arrow-right" size={18}/>
   </Button>}
  </nav>
  <header className="spell-detail-heading">
   <div className="kicker">{view.active} · {tr(method.category)}</div>
   <Heading level={1} role="headline" className="display-title">{method.title}</Heading>
   <Text role="body" className="intro">{method.original}</Text>
  </header>
  <div className="spell-tabs" role="tablist" aria-label={copy('Chế độ Thần Chú','Spell mode')}
   onKeyDown={event=>{
    const next=['ArrowLeft','Home'].includes(event.key)?'guide':
     ['ArrowRight','End'].includes(event.key)?'practice':null;
    if(!next)return;event.preventDefault();setTab(next);
    requestAnimationFrame(()=>document.getElementById('li-react-spell-tab-'+next)?.focus());
   }}>
   {(['guide','practice'] as const).map(tab=><Button key={tab} variant="ghost"
    id={'li-react-spell-tab-'+tab} role="tab" tabIndex={view.tab===tab?0:-1}
    aria-selected={view.tab===tab} onClick={()=>setTab(tab)}>
    {tab==='guide'?copy('Chú giải','Explanation'):copy('Thử thi triển','Practice')}</Button>)}
  </div>
  {view.tab==='guide'?
   <div role="tabpanel" aria-labelledby="li-react-spell-tab-guide" className="editorial-grid">
    <section className="li-react-spell-explainer li-react-spell-manual">
     <div className="kicker">I · {copy('KHI DÙNG','WHEN TO USE')}</div>
     <Heading level={2} role="titleLarge">{method.purpose}</Heading>
     <div className="section-rule"/>
     <div className="kicker">II · {copy('KHỞI THỨC','STEPS')}</div>
     <div className="path-list">{(SPELL_GUIDANCE[view.active]?.[en()?'en':'vi']||[]).map((text,index)=><div className="path-item" key={text}>
      <span className="path-num">{String(index+1).padStart(2,'0')}</span>
      <Text role="body">{text}</Text>
     </div>)}</div>
    </section>
    <aside className="li-react-spell-explainer li-react-spell-aside">
     <div className="kicker">III · {copy('GIẢI CHÚ','APPLICATION')}</div>
     <Heading level={2} role="titleMedium">{copy('Dùng thế nào cho đúng?','How to apply it?')}</Heading>
     <Text role="body">{SPELL_GUIDANCE[view.active]?.[en()?'noteEn':'noteVi']}</Text>
     <div className="kicker">IV · {copy('LƯU Ý','WATCH OUT')}</div>
     <Text role="support">{copy('Hoàn thành tương tác không có nghĩa đã thông thạo. Hãy đối chiếu kết quả trước khi tự đánh giá.',
      'Completing an interaction is not proof of mastery. Check the feedback before self-rating.')}</Text>
     <Button variant="primary" onClick={()=>setTab('practice')}>
      {copy('Thử thi triển','Try the practice')} <LiIcon name="arrow-right" size={17}/></Button>
    </aside>
   </div>:
   <section role="tabpanel" aria-labelledby="li-react-spell-tab-practice"
    data-li-react-t03-stage={view.active==='T03'?t03Stage:undefined}
    data-li-react-t13-stage={view.active==='T13'?t13Stage:undefined}
    data-li-react-t12-stage={view.active==='T12'?t12Stage:undefined}
    data-li-react-standard-spell-stage={standardFlow.isCurrent(view)?standardStage:undefined}
    data-li-react-xstate-stage={view.active==='T03'?t03Stage:
     view.active==='T12'?t12Stage:view.active==='T13'?t13Stage:standardStage}
    className="spell-practice-root li-react-spell-practice">
    <div className="spell-activity-head"><div>
     <div className="kicker">{view.active} · {copy('THỬ THI TRIỂN','PRACTICE')}</div>
     <Heading level={2} role="titleMedium">{tr(view.title)}</Heading>
    </div>
    <span className="spell-state">{view.reviewedInSession?copy('Đã tự đối chiếu','Self-checked'):
     preparing?copy('Đang chuẩn bị','Preparing'):copy('Đang thực hành','Practicing')}</span></div>
    <div className="spell-activity-body">
     {hasSource&&<div className="spell-demo"><div className="kicker">{copy('BỐI CẢNH MẪU · ĐÃ GIỚI THIỆU','EXAMPLE CONTEXT')}</div>
      <Text role="body">{tr(view.lesson)}</Text></div>}
     {view.mode==='resume'&&phase===1&&<Text role="body">
      {copy('Hành động nhỏ đã tự đặt: ','Your next small action: ')}<strong>{view.resumeNote}</strong>
     </Text>}
     {view.mode==='loci'&&phase===1&&<Text role="body">
      {view.places.join(' → ')}</Text>}
     <Text role="body">{prompt()}</Text>
     {view.fields.map(field=><PracticeField key={view.active+view.phase+field.id}
      field={field} value={answers[field.id]}
      onChange={value=>{
       setAnswers(before=>({...before,[field.id]:value}));
       if(view.active==='T12'&&typeof value==='string')
        app.LiSpellPractice?.setT12Draft?.(field.id,value);
      }}/>)}
     {view.active==='T02'&&<Text role="support" className="spell-honest">
      {view.lessonId?
       copy('Đang ôn kiến thức bài ','Reviewing lesson ')+view.lessonId:
       copy('Bài ôn mẫu · Không gắn với bài cụ thể','Standalone demo · Not linked to a lesson')}
     </Text>}
     {view.active==='T02'&&<Text role="support" className="spell-honest">
      {copy('Đã hoàn thành ','Completed ')}{view.t02ReviewCount}
      {copy(' lượt ôn. Nhớ lại khi đến hạn → đối chiếu → tự đánh giá → hẹn lượt tiếp.',
       ' reviews. Recall when due → check feedback → self-rate → schedule another review.')}
     </Text>}
     {isDuePreparing?<>
      {dueFuture&&<Text role="support" className="spell-honest">{copy(
       'Lần ôn tiếp: ','Next review: ')}
       {new Date(view.dueAt!).toLocaleString(en()?'en-US':'vi-VN')}
       {copy(' · Chưa đến hạn nên chưa tính lượt ôn.',' · Not due yet; this does not count as a review.')}
      </Text>}
      <Button variant="secondary" onClick={()=>action(dueFuture?'clear':'schedule')}>
       {dueFuture?copy('Hủy lịch lượt tới','Cancel next review'):
        copy('Bắt đầu · ôn lần đầu sau 24 giờ','Start · first review after 24 hours')}</Button>
     </>:
      !(view.active==='T02'&&view.t02AwaitingRating)&&
       <Button variant="primary" onClick={()=>action(ctaKind)}>{actionLabel}</Button>}
     {view.reviewedInSession&&<Text role="support" aria-live="polite">{view.active==='T02'?
      copy('Lượt gọi nhớ đã ghi nhận. Tự đánh giá để đặt lịch tiếp; đây không phải điểm thông thạo.',
       'Recall recorded. Self-rate for next review; this is not a mastery score.'):
      copy('Đã tự đối chiếu · Xem trạng thái lưu lượt luyện bên dưới · Không phải điểm thông thạo.',
       'Self-checked · Check practice save status below · Not a mastery grade.')}</Text>}
     {view.feedback&&<div className="spell-feedback" role="status" aria-live="polite">
      <strong>{copy('Phản hồi để tự kiểm chứng','Feedback for self-check')}</strong>
      <Text role="body">{tr(view.feedback)}</Text>
      <Text role="support">{copy(
       'Bài mẫu minh họa, không chứng nhận thành thạo hay kết quả học thuật ngoài nhiệm vụ.',
       'Illustrative exercise only; not a certification of mastery.')}</Text>
     </div>}
     {view.active==='T02'&&view.t02AwaitingRating&&<div className="action-row">
      <Text role="body">{copy(
       'So câu vừa nhớ với feedback ở trên, rồi tự đánh giá:',
       'Compare your recall with the feedback above, then self-rate:')}</Text>
      <Button variant="primary" onClick={()=>action('rate-remembered')}>
       {copy('Nhớ được · giãn lịch','Recalled · space it out')}</Button>
      <Button variant="secondary" onClick={()=>action('rate-retry')}>
       {copy('Chưa nhớ vững · ôn lại sớm','Not secure · review sooner')}</Button>
     </div>}
    </div>
    <div className="spell-activity-footer">
     <Text role="support">{view.active==='T12'?
      copy('T12 lưu bản nháp trên máy và đồng bộ qua tài khoản khi online.',
       'T12 stores the draft locally and syncs it through your account when online.'):
      view.active==='T02'?
       copy('Lịch và số lượt ôn lưu theo tài khoản, đồng bộ khi online. Không lưu câu trả lời. Mốc 1–3–7–14–30 ngày là mặc định của app.',
        'Review schedule and count sync when online; answers are not saved. 1–3–7–14–30 days are app defaults.'):
       copy('Tự chọn, có thể bỏ qua. Câu trả lời không tự lưu hay gửi lên máy chủ.',
        'Optional. Answers are not saved or sent to a server.')}</Text>
     {view.active!=='T02'&&view.active!=='T12'&&<>
       <Text role="support">{copy('Đã ghi nhận trên máy: ','Recorded on device: ')}
        {view.practiceCount??0} {view.practiceSynced?
         copy('lượt luyện · đã đồng bộ','practice rounds · synced'):
         copy('lượt luyện · đã lưu trên máy, chờ đồng bộ',
          'practice rounds · saved on device, awaiting sync')}</Text>
       {view.practiceLastAt&&<Text role="support">{copy('Lần gần nhất: ','Last practice: ')}
        {new Date(view.practiceLastAt).toLocaleString(en()?'en-US':'vi-VN')}</Text>}
       {view.practiceError&&<p role="alert">{view.practiceError}</p>}
      </>}
      {view.active==='T12'&&<p className="small" role={view.t12StorageError?'alert':'status'}
       aria-live="polite">{view.t12StorageError||
        (view.t12Synced?
         copy('T12 đã đồng bộ với tài khoản.','T12 synced to your account.'):
         view.t12SavedOnDevice?
          copy('Đã lưu trên máy · đang chờ đồng bộ.','Saved on device · awaiting sync.'):
          copy('Chưa có dấu vết đang lưu.','No unfinished cue saved.'))}</p>}
     <Button variant="secondary" onClick={()=>action('reset')}>
      {copy('Làm lại','Start over')}</Button>
    </div>
   </section>}
 </div>;
}
function useNote(){
 const [view,setView]=useState<NoteView>(()=>app.liNotes?.getView()||{
  id:null,type:null,title:'',body:'',backRoute:'collection',history:[],context:null,storageAvailable:true
 });
 useEffect(()=>{
  const update=()=>setView(app.liNotes?.getView()||view);
  for(const name of ['li:note-view-changed','li:localechange','li:personal-sync-applied'])
   window.addEventListener(name,update);
  return ()=>{for(const name of ['li:note-view-changed','li:localechange','li:personal-sync-applied'])
   window.removeEventListener(name,update);};
 },[]);
 return [view,()=>setView(app.liNotes?.getView()||view)] as const;
}
function time(iso:string){
 const n=Date.parse(iso);
 if(!Number.isFinite(n))return copy('Không rõ ngày','Unknown date');
 return new Intl.DateTimeFormat(en()?'en-US':'vi-VN',{day:'numeric',month:'numeric',
  year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(n));
}
/** React owns the confirmation; the existing note service owns atomic writes,
 * version history, sync and the 7-second Undo transaction. */
export function ConfirmNoteAction({label,description,onConfirm,iconOnly=false,danger=false,confirmLabel}:{
 label:string;description:string;onConfirm:()=>boolean;iconOnly?:boolean;danger?:boolean;confirmLabel?:string
}){
 const [asking,setAsking]=useState(false);
 const titleId=useId();
 const trigger=useRef<HTMLButtonElement>(null);
 const cancel=useRef<HTMLButtonElement>(null);
 const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(asking)cancel.current?.focus();},[asking]);
 const dismiss=()=>{
  setAsking(false);
  requestAnimationFrame(()=>trigger.current?.focus());
 };
 const onKey=(event:React.KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();dismiss();return;}
  if(event.key!=='Tab')return;
  const controls=Array.from(dialog.current?.querySelectorAll<HTMLElement>(
   'button:not([disabled]),a[href],[tabindex="0"]'
  )||[]).filter(node=>node.getClientRects().length>0);
  if(!controls.length)return;
  if(event.shiftKey&&document.activeElement===controls[0]){
   event.preventDefault();controls[controls.length-1].focus();
  }else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){
   event.preventDefault();controls[0].focus();
  }
 };
 return <>
  <button ref={trigger} type="button"
   className={danger?(iconOnly?'library-danger-link library-icon-action':'library-danger-link library-text-link'):'library-text-link'}
   aria-label={label} onClick={()=>setAsking(true)}>
   {iconOnly?<LiIcon name="trash" size={20}/>:label}
  </button>
  {asking&&createPortal(<div className="modal open li-react-note-confirm" role="dialog"
   aria-modal="true" aria-labelledby={titleId} onKeyDown={onKey}
   onMouseDown={event=>{if(event.target===event.currentTarget)dismiss();}}>
   <div className="dialog" ref={dialog}>
    <h2 id={titleId}>{label}</h2>
    <p>{description}</p>
    <div className="action-row">
     <button ref={cancel} className="action alt" type="button" onClick={dismiss}>
      {copy('Hủy','Cancel')}</button>
     <Button variant={danger?'secondary':'primary'}
       className={danger?'library-confirm-danger':undefined}
       onClick={()=>{if(onConfirm())setAsking(false);}}>
      {confirmLabel|| (danger?copy('Xóa ghi chép','Delete note'):copy('Khôi phục','Restore'))}</Button>
    </div>
   </div>
  </div>,document.body)}
 </>;
}
export function NoteDetail(){
 const [note,refresh]=useNote();
 const [editing,setEditing]=useState(false);
 const [title,setTitle]=useState('');
 const [body,setBody]=useState('');
 const [baseVersion,setBaseVersion]=useState(0);
 const [message,setMessage]=useState('');
 useEffect(()=>{setEditing(false);setMessage('');},[note.id,note.type]);
 const startEdit=()=>{
  setTitle(note.title);setBody(note.body);setBaseVersion(note.history.length);
  setMessage('');setEditing(true);
 };
 const save=()=>{
  const result=app.liNotes?.saveFromReact(title,body,baseVersion);
  if(!result){setMessage(copy('Không kết nối được bộ lưu.','Save service unavailable.'));return;}
  setMessage(result.message);
  if(result.ok){setEditing(false);refresh();}
 };
 const restore=(version:number)=>{
  if(app.liNotes?.restoreFromReact(version,true)){
   setEditing(false);setMessage('');refresh();return true;
  }
  return false;
 };
 const back=note.backRoute||'collection';
 return <div className="section-shell li-react-note-detail" data-li-react-screen="note-detail">
  <Button variant="ghost" onClick={()=>openRoute(back)} className="library-back-link">
   <LiIcon name="chevron-left" size={18}/> {back==='resume'?copy('Quay lại','Continue'):
    back==='library'?copy('Tủ Riêng','Private Library'):copy('Bộ sưu tập','Collection')}</Button>
  <div className="kicker">{note.kind||copy('CHI TIẾT GHI CHÉP','NOTE DETAIL')}</div>
  <div className="library-heading-with-utility">
   <Heading level={1} role="headline" className="display-title">{note.title}</Heading>
   {note.context&&<Button variant="ghost"
    aria-label={note.bookmarked?copy('Bỏ lưu case','Unsave case'):copy('Lưu case','Bookmark case')}
    aria-pressed={note.bookmarked}
    onClick={()=>{app.liBookmarks?.toggle('case','sampling-bias-90');refresh();}}>
    <LiIcon name="bookmark" size={20}/></Button>}
  </div>
  {note.status&&<Text role="body" className="intro">{note.status}</Text>}
  {!note.id||!note.type?<InlineFeedback tone="info" message={copy(
   'Ghi chép này không còn trong Tủ Riêng.','This note is no longer in your private library.')}/>:
  <>
   {note.context&&<Card variant="raised" className="library-note-context">
    <div className="kicker">{copy('PHẢN CHỨNG · TÌNH HUỐNG GỐC','ORIGINAL CASE CONTEXT')}</div>
    <Heading level={2} role="titleMedium">{note.context.question}</Heading>
    <Text role="body">{note.context.scene}</Text>
    <div className="stack-sm">{note.context.options.map((option,index)=>
     <div className="library-case-choice" data-chosen={option.selected?'true':undefined}
      key={index}>{option.text}</div>)}</div>
    <Text role="body">{note.context.choice}</Text>
    <InlineFeedback tone="info" message={note.context.feedback}/>
    <Text role="support">{note.context.provenance}</Text>
    <Button variant="secondary" onClick={()=>openRoute('case')}>{copy('Làm lại Phản Chứng','Retry the Case')}</Button>
   </Card>}
   <Card variant="raised" className="library-note-review">
    <div className="library-note-head">
     <div className="kicker">{copy('NỘI DUNG HIỆN TẠI','CURRENT CONTENT')}</div>
     <ConfirmNoteAction
      label={copy('Xóa ghi chép và lịch sử phiên bản','Delete note and all versions')}
      description={copy('Xóa ghi chép này? Bạn có 7 giây để hoàn tác sau khi xóa.',
       'Delete this note? You have 7 seconds to undo after deletion.')}
      danger iconOnly onConfirm={()=>Boolean(app.liNotes?.deleteFromReact(note.type!,note.id!))}/>
    </div>
    <Heading level={2} role="titleMedium">{note.bodyTitle||copy('Luận kết hiện tại','Current text')}</Heading>
    <Text role="body" className="library-entry-body">{note.body}</Text>
    <Text role="support">{note.date}</Text>
    {!editing&&<Button variant="secondary" onClick={startEdit}>{copy('Chỉnh sửa','Edit')}</Button>}
   </Card>
   {editing&&<Card variant="tinted" className="library-note-edit">
    <Heading level={2} role="titleMedium">{copy('Chỉnh sửa ghi chép','Edit note')}</Heading>
    <Text role="support">{copy('Lưu tạo phiên bản mới, không xóa bản cũ.','Saving creates a new version, preserving history.')}</Text>
    <Field label={copy('Tiêu đề','Title')} value={title}
     onChange={event=>setTitle(event.target.value.slice(0,180))}/>
    <Field label={copy('Nội dung / Luận kết','Content / Conclusion')} kind="textarea" rows={7}
     value={body} onChange={event=>setBody(event.target.value.slice(0,5000))}/>
    {message&&<InlineFeedback tone="error" message={message}/>}
    <div className="action-row">
     <Button variant="primary" onClick={save}>{copy('Lưu phiên bản mới','Save a new version')}</Button>
     <Button variant="secondary" onClick={()=>{setEditing(false);setMessage('');}}>
      {copy('Hủy','Cancel')}</Button>
    </div>
   </Card>}
   <Card variant="raised" className="library-note-history">
    <Heading level={2} role="titleMedium">{copy('Lịch sử phiên bản','Version history')}</Heading>
    <Text role="support">{copy('Khôi phục cũng tạo một phiên bản mới, không xóa lịch sử.',
     'Restoring creates a new version and preserves all previous versions.')}</Text>
    <div className="stack-sm" aria-live="polite">
     {[...note.history].reverse().map((version,index)=><article className="library-version-entry" key={version.version}>
      <div className="library-version-heading">
       <strong>{copy('Phiên bản ','Version ')}{version.version}
        {index===0?copy(' · Hiện tại',' · Current'):''}</strong>
       <Text role="support">{time(version.at)} · {version.change||copy('Chỉnh sửa','Edited')}</Text>
      </div>
      {version.title!==note.title&&<Text role="support">{copy('Tiêu đề lúc đó: ','Title then: ')}
       {version.title}</Text>}
      <Text role="body" className="library-entry-body">{version.body}</Text>
      {index>0&&<ConfirmNoteAction
       label={copy('Khôi phục phiên bản '+version.version,'Restore version '+version.version)}
       description={copy('Tạo một phiên bản mới, mọi bản cũ đều giữ nguyên.',
        'Creates a new version, preserving all previous versions.')}
       onConfirm={()=>restore(version.version)}/>} 
     </article>)}
    </div>
   </Card>
  </>}
 </div>;
}
