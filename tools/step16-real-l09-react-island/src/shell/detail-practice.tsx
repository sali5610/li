import {openRoute} from './app-router.js';
import React,{useEffect,useId,useRef,useState,useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {Button,Checkbox,Field,Heading,InlineFeedback,Radio,Text,LiIcon} from '../../../../design-system/react/index';
import {createFadedT03Flow,fadedT03Phase} from './spell-t03-flow.js';
import {createLociT13Flow,lociT13Phase} from './spell-t13-flow.js';
import {createResumeT12Flow,resumeT12Phase} from './spell-t12-flow.js';
import {createStandardSpellFlow,standardSpellPhase} from './spell-standard-flow.js';
import './detail-practice.css';
import spellGuides from '../../../../content/editorial/l2-spell-guides.v1.json';

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
// Explanatory diagrams are original SVG illustrations, not evidence of a technique's effect.
function SpellDiagram({id,labels,kind}:{id:string;labels:readonly string[];kind:string}){
 const figure=(()=>{
  switch(kind){
   case 'timeline':return <><path d="M13 47H73M17 20v12m52-12v12M18 32h52v30H18zM27 43h10m8 0h14M27 53h10m8 0h14" /><path d="M26 48l5 5 10-12"/></>;
   case 'stair':return <><path d="M12 66h21V52h19V38h21V22h14" /><path d="M22 45l9-9 8 7 15-17 9 4 15-17"/><circle cx="22" cy="45" r="4"/><circle cx="78" cy="13" r="4"/></>;
   case 'chain':return <><circle cx="30" cy="44" r="17"/><circle cx="65" cy="44" r="17"/><path d="M39 44h17M29 20V9m36 67v10"/><circle cx="29" cy="8" r="3"/><circle cx="65" cy="86" r="3"/></>;
   case 'branch':return <><path d="M10 43h29l20-22h23M39 43l20 22h23"/><circle cx="11" cy="43" r="7"/><circle cx="82" cy="21" r="7"/><circle cx="82" cy="65" r="7"/><path d="M35 43h4"/></>;
   case 'compare':return <><circle cx="28" cy="45" r="20"/><rect x="57" y="25" width="38" height="40" rx="5"/><path d="M45 36l-4 9 4 9M52 45h10M74 33v24M65 45h18"/></>;
   case 'logic':return <><rect x="8" y="13" width="25" height="24" rx="3"/><rect x="8" y="55" width="25" height="24" rx="3"/><path d="M34 25h19v18h14M34 67h19V49h14m-8-7 9 7-9 7"/><circle cx="78" cy="49" r="15"/></>;
   case 'argument':return <><path d="M26 24h26l14 22-14 22H26L12 46z"/><circle cx="12" cy="46" r="6"/><circle cx="68" cy="46" r="6"/><path d="M34 36h11m-16 11h21m-16 11h11M71 70l14 14m-4-13 5 13-13-4"/></>;
   case 'source':return <><path d="M23 9h40l14 14v57H23zM63 9v14h14M33 35h30M33 45h26M33 55h20"/><circle cx="66" cy="69" r="18"/><path d="M80 83l14 12"/></>;
   case 'split':return <><rect x="28" y="7" width="43" height="24" rx="4"/><path d="M49 31v17m-28 0h57M21 48v14m28-14v14m29-14v14"/><rect x="8" y="62" width="26" height="19" rx="3"/><rect x="36" y="62" width="26" height="19" rx="3"/><rect x="65" y="62" width="26" height="19" rx="3"/></>;
   case 'fit':return <><circle cx="42" cy="45" r="27"/><circle cx="65" cy="45" r="27"/><path d="M49 40l8 8 13-16M11 12l11 9m65 56 11 9"/><circle cx="53" cy="45" r="2"/></>;
   case 'resume':return <><path d="M26 11h49v72L50 68 26 83zM38 28h24M38 39h16"/><path d="M10 51h32l-10-10m10 10-10 10"/><circle cx="75" cy="13" r="6"/></>;
   case 'route':return <><path d="M15 67C22 12 63 85 81 19" strokeDasharray="4 8"/><circle cx="18" cy="65" r="10"/><circle cx="47" cy="45" r="10"/><circle cx="80" cy="20" r="10"/><path d="M76 9V1m-5 2 5-2 5 2"/></>;
   default:return <><path d="M20 14h29v64H20zM49 14h29v64H49zM28 24h14m-14 9h14m14-9h14m-14 9h14"/><path d="M33 55l10 9 21-23"/></>;
  }
 })();
 return <figure className="spell-concept-visual" aria-label={id+' · '+labels.join(' → ')}>
  <div className="spell-visual-mark" aria-hidden="true">
   <svg viewBox="0 0 104 104" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round" focusable="false">{figure}</svg>
  </div>
  <div className="spell-visual-process" aria-hidden="true">
   {labels.map((label,index)=><React.Fragment key={id+'-'+index}>
    {index>0&&<span className="spell-visual-arrow">→</span>}
    <span className="spell-visual-stage"><b>{String(index+1).padStart(2,'0')}</b><span>{label}</span></span>
   </React.Fragment>)}
  </div>
  <figcaption>{id} · {en()?'Illustrated learning process':'Sơ đồ quy trình thực hành'}</figcaption>
 </figure>;
}

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
 const guideRecord=spellGuides.methods[view.active as keyof typeof spellGuides.methods];
 const guide=guideRecord?.[en()?'en':'vi'];
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
  <header className="spell-detail-heading">
   <Heading level={1} role="headline" className="display-title">{method.title}</Heading>
   <Text role="caption">{view.active} · {tr(method.category)}</Text>
   <Text role="body" className="intro">{method.original}</Text>
  </header>
  <nav className="spell-detail-navigation" aria-label={copy('Điều hướng Thần Chú','Spell navigation')}>
   <Button variant="ghost" onClick={()=>openRoute('guide')} className="library-back-link">
    <LiIcon name="chevron-left" size={18}/> {copy('Sổ Tay Thần Chú','Learning Spells')}
   </Button>
   {lessonRoute?<Button variant="ghost" onClick={()=>openRoute(lessonRoute)}
    className="spell-linked-lesson">
    {copy('Mở bài học liên quan','Open related lesson')} <LiIcon name="arrow-right" size={18}/>
   </Button>:personalRoute?<Button variant="ghost" onClick={()=>openRoute(personalRoute)}
    className="spell-linked-lesson">
    {copy('Mở bài học liên quan','Open related lesson')} <LiIcon name="arrow-right" size={18}/>
   </Button>:null}
  </nav>
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
    <article className="li-react-spell-explainer li-react-spell-manual">
     <div className="kicker">I · {copy('KHI NÊN DÙNG','WHEN IT HELPS')}</div>
     <Heading level={2} role="titleLarge">{method.purpose}</Heading>
     {guide&&<SpellDiagram id={view.active} labels={guide.diagram} kind={guideRecord.diagramKind}/>}
     <section className="spell-guide-section">
      <div className="kicker">II · {copy('LÀM THEO TỪNG BƯỚC','STEP-BY-STEP')}</div>
      <div className="path-list">{(guide?.steps||[]).map((step,index)=><div className="path-item" key={step}>
       <span className="path-num">{String(index+1).padStart(2,'0')}</span>
       <Text role="body">{step}</Text>
      </div>)}</div>
     </section>
     {guide&&<section className="spell-guide-section spell-example">
      <div className="kicker">III · {copy('VÍ DỤ CÓ LỜI GIẢI','WORKED EXAMPLE')}</div>
      <Heading level={3} role="titleMedium">{guide.example.title}</Heading>
      <Text role="body">{guide.example.scenario}</Text>
      <ol>{guide.example.walkthrough.map((part,index)=><li key={index}>{part}</li>)}</ol>
      <p className="spell-example-takeaway"><strong>{copy('Điểm cần nhớ:','Takeaway:')}</strong> {guide.example.takeaway}</p>
     </section>}
     {guide&&<section className="spell-guide-section spell-do-dont">
      <div className="kicker">IV · {copy('NÊN LÀM & NÊN TRÁNH','DO & DON’T')}</div>
      <div className="spell-guidance-columns">
       <div className="spell-guidance-column">
        <h3><span aria-hidden="true">✓</span> {copy('Nên làm','Do')}</h3>
        <ul>{guide.do.map((item,index)=><li key={index}>{item}</li>)}</ul>
       </div>
       <div className="spell-guidance-column">
        <h3><span aria-hidden="true">×</span> {copy('Nên tránh','Don’t')}</h3>
        <ul>{guide.dont.map((item,index)=><li key={index}>{item}</li>)}</ul>
       </div>
      </div>
     </section>}
     {guide&&<section className="spell-guide-section spell-evidence">
      <div className="kicker">V · {copy('BẰNG CHỨNG & GIỚI HẠN','EVIDENCE & LIMITS')}</div>
      <Text role="body">{guide.evidence}</Text>
      <div className="spell-source-links">
       <strong>{copy('Nguồn tham khảo','References')}</strong>
       <ul>{guideRecord.sources.map(source=><li key={source.url}>
        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span aria-hidden="true"> ↗</span></a>
       </li>)}</ul>
      </div>
     </section>}
    </article>
    <aside className="li-react-spell-explainer li-react-spell-aside">
     <div className="kicker">{copy('GHI NHỚ','REMEMBER')}</div>
     <Heading level={2} role="titleMedium">{copy('Dùng sao cho đúng?','How to apply it?')}</Heading>
     <Text role="body">{guide?.existingNote||''}</Text>
     <Text role="support">{copy('Ví dụ ở đây để hiểu cách làm; bài luyện là phần tự thử riêng. Hoàn thành bài luyện không chứng nhận thành thạo.',
      'These examples explain the method; the practice tab is a separate attempt. Finishing a drill is not proof of mastery.')}</Text>
     <Button variant="primary" onClick={()=>setTab('practice')}>
      {copy('Thử thi triển','Try the practice')} <LiIcon name="arrow-right" size={17}/>
     </Button>
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
   className={iconOnly
    ?'li-atom-icon-button library-icon-action library-note-delete'+(danger?' library-danger-link':'')
    :danger?'library-danger-link library-text-link':'library-text-link'}
   aria-label={label} title={iconOnly?label:undefined} onClick={()=>setAsking(true)}>
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
  <div className="library-heading-with-utility">
   <Heading level={1} role="headline" className="display-title">{note.title}</Heading>
   {note.context&&<Button variant="ghost"
    aria-label={note.bookmarked?copy('Bỏ lưu case','Unsave case'):copy('Lưu case','Bookmark case')}
    aria-pressed={note.bookmarked}
    onClick={()=>{app.liBookmarks?.toggle('case','sampling-bias-90');refresh();}}>
    <LiIcon name="bookmark" size={20}/></Button>}
  </div>
  {note.kind&&<Text role="caption">{note.kind}</Text>}
  {note.status&&<Text role="body" className="intro">{note.status}</Text>}
  {!note.id||!note.type?<InlineFeedback tone="info" message={copy(
   'Ghi chép này không còn trong Tủ Riêng.','This note is no longer in your private library.')}/>:
  <div className="library-note-workspace">
   {note.context&&<aside className="library-note-context">
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
   </aside>}
   {!editing&&<article className="library-note-review">
    <div className="library-note-head">
     <div className="kicker">{copy('NỘI DUNG HIỆN TẠI','CURRENT CONTENT')}</div>
     <ConfirmNoteAction iconOnly
      label={copy('Xóa ghi chép','Delete note')}
      description={copy('Xóa ghi chép này? Bạn có 7 giây để hoàn tác sau khi xóa.',
       'Delete this note? You have 7 seconds to undo after deletion.')}
      danger onConfirm={()=>Boolean(app.liNotes?.deleteFromReact(note.type!,note.id!))}/>
    </div>
    <Heading level={2} role="titleMedium">{note.bodyTitle||copy('Luận kết hiện tại','Current text')}</Heading>
    <Text role="body" className="library-entry-body">{note.body}</Text>
    <Text role="support">{note.date}</Text>
    <Button variant="primary" onClick={startEdit}>{copy('Chỉnh sửa','Edit')}</Button>
   </article>}
   {editing&&<section className="library-note-edit">
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
   </section>}
   <section className="library-note-history">
    <Heading level={2} role="titleMedium">{copy('Lịch sử phiên bản','Version history')}</Heading>
    <Text role="support">{copy('Khôi phục cũng tạo một phiên bản mới, không xóa lịch sử.',
     'Restoring creates a new version and preserves all previous versions.')}</Text>
    <div className="stack-sm" aria-live="polite">
     {[...note.history].reverse().map((version,index)=><details className="library-version-entry"
      key={version.version} open={index===0}>
      <summary className="library-version-heading">
       <strong>{copy('Phiên bản ','Version ')}{version.version}
        {index===0?copy(' · Hiện tại',' · Current'):''}</strong>
       <Text as="span" role="support">{time(version.at)} · {version.change||copy('Chỉnh sửa','Edited')}</Text>
      </summary>
      {version.title!==note.title&&<Text role="support">{copy('Tiêu đề lúc đó: ','Title then: ')}
       {version.title}</Text>}
      <Text role="body" className="library-entry-body">{version.body}</Text>
      {index>0&&<ConfirmNoteAction
       label={copy('Khôi phục phiên bản '+version.version,'Restore version '+version.version)}
       description={copy('Tạo một phiên bản mới, mọi bản cũ đều giữ nguyên.',
        'Creates a new version, preserving all previous versions.')}
       onConfirm={()=>restore(version.version)}/>} 
     </details>)}
    </div>
   </section>
  </div>}
 </div>;
}
