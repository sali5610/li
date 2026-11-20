import {openRoute} from './app-router.js';
import React,{useEffect,useState,useSyncExternalStore} from 'react';
import {Button,Card,Checkbox,Field,Heading,InlineFeedback,Radio,Text,LiIcon} from '../../../../design-system/react/index';
import {createFadedT03Flow,fadedT03Phase} from './spell-t03-flow.js';
import {createLociT13Flow,lociT13Phase} from './spell-t13-flow.js';
import {createResumeT12Flow,resumeT12Phase} from './spell-t12-flow.js';
import './detail-practice.css';

/** The existing authored exercise checker and private-note transaction owners
 * are shared through read/action ports. No duplicate scoring or personal writes. */
type Method={id:string;title:string;original:string;purpose:string;category:string};
type SpellField={id:string;label:string;options:string[]|null;choiceKind:'multi'|'radio'};
type SpellView={
 active:string;title:string;mode:string;phase:number;tab:'guide'|'practice';
 lesson:string;prompt:string;fields:SpellField[];feedback:string;
 resumeNote:string;places:string[];dueAt:number|null;
 lessonId:string|null;reviewedInSession:boolean;viewSession:number;
 t12Draft?:{context:string;next:string;answer:string};
 t12SavedOnDevice?:boolean;t12StorageError?:string
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
  restoreFromReact:(version:number)=>boolean;
  deleteNote:(type:'case'|'idea',id:string)=>boolean
 };
 liBookmarks?:{toggle:(kind:string,id:string)=>boolean}
};
const app=window as AppWindow;
const en=()=>app.liLanguage?.get?.()==='en';
const copy=(vi:string,english:string)=>en()?english:vi;
const tr=(text:string)=>en()?(app.liLanguage?.translate?.(text)||text):text;
function useSpell(){
 const [view,setView]=useState<SpellView|null>(()=>app.LiSpellPractice?.getView()||null);
 useEffect(()=>{
  const update=()=>setView(app.LiSpellPractice?.getView()||null);
  window.addEventListener('li:spell-view-changed',update);
  window.addEventListener('li:localechange',update);
  return ()=>{
   window.removeEventListener('li:spell-view-changed',update);
   window.removeEventListener('li:localechange',update);
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
 // XState owns T03 React transitions; the existing exercise engine
 // still owns answers, grading, feedback, and the local session receipt.
 const [t03Flow]=useState(createFadedT03Flow);
 const t03Stage=useSyncExternalStore(t03Flow.subscribe,t03Flow.getSnapshot);
 const [t13Flow]=useState(createLociT13Flow);
 const t13Stage=useSyncExternalStore(t13Flow.subscribe,t13Flow.getSnapshot);
 const [t12Flow]=useState(createResumeT12Flow);
 const t12Stage=useSyncExternalStore(t12Flow.subscribe,t12Flow.getSnapshot);
 useEffect(()=>{
  t03Flow.sync(view);
  t13Flow.sync(view);
  t12Flow.sync(view);
 },[t03Flow,t13Flow,t12Flow,view?.active,view?.phase,view?.viewSession,view?.reviewedInSession,view?.resumeNote]);
 useEffect(()=>()=>{t03Flow.stop();t13Flow.stop();t12Flow.stop();},[t03Flow,t13Flow,t12Flow]);
 const phase=view?.active==='T03'&&t03Flow.isCurrent(view)
  ?fadedT03Phase(t03Stage):
  view?.active==='T13'&&t13Flow.isCurrent(view)
   ?lociT13Phase(t13Stage):
  view?.active==='T12'&&t12Flow.isCurrent(view)
   ?resumeT12Phase(t12Stage):(view?.phase??0);
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
     :app.LiSpellPractice?.perform(kind,answers);
  if(ok&&['reset','clear','schedule','next'].includes(kind))setAnswers({});
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
  <div className="action-row">
   {lessonRoute&&<Button variant="secondary" onClick={()=>openRoute(lessonRoute)}
    className="library-back-link">
    <LiIcon name="chevron-left" size={18}/> {copy('Về bài học','Back to lesson')}
   </Button>}
   <Button variant="ghost" onClick={()=>openRoute('guide')} className="library-back-link">
    <LiIcon name="chevron-left" size={18}/> {copy('Sổ Tay Thần Chú','Learning Spells')}
   </Button>
  </div>
  <div className="kicker">{view.active} · {tr(method.category)}</div>
  <Heading level={1} role="headline" className="display-title">{method.title}</Heading>
  <Text role="body" className="intro">{method.original}</Text>
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
    <Card variant="tinted" className="li-react-spell-explainer">
     <div className="kicker">I · {copy('KHI DÙNG','WHEN TO USE')}</div>
     <Heading level={2} role="titleLarge">{method.purpose}</Heading>
     <div className="section-rule"/>
     <div className="kicker">II · {copy('KHỞI THỨC','STEPS')}</div>
     <div className="path-list">{[
      copy('Tự xác định điều muốn học hoặc giải quyết.','Define what you want to learn or solve.'),
      copy('Thử làm một ví dụ ngắn với ít trợ giúp.','Try a small example with limited help.'),
      copy('Kiểm tra hiểu lầm và điều kiện áp dụng.','Check misconceptions and when the method applies.')
     ].map((text,index)=><div className="path-item" key={text}>
      <span className="path-num">{String(index+1).padStart(2,'0')}</span>
      <Text role="body">{text}</Text>
     </div>)}</div>
    </Card>
    <Card variant="raised" className="li-react-spell-explainer">
     <div className="kicker">III · {copy('GIẢI CHÚ','APPLICATION')}</div>
     <Heading level={2} role="titleMedium">{copy('Dùng thế nào cho đúng?','How to apply it?')}</Heading>
     <Text role="body">{copy('Hãy thử với một ví dụ nhỏ rồi kiểm tra điều bạn hiểu.',
      'Start with a small example, then verify your understanding.')}</Text>
     <div className="kicker">IV · {copy('DẪN CHỨNG','SOURCES')}</div>
     <InlineFeedback tone="info" message={copy('Nguồn tham khảo đang được bổ sung.','References are being added.')}/>
     <Button variant="secondary" onClick={()=>setTab('practice')}>
      {copy('Thử thi triển','Try the practice')}</Button>
    </Card>
   </div>:
   <section role="tabpanel" aria-labelledby="li-react-spell-tab-practice"
    data-li-react-t03-stage={view.active==='T03'?t03Stage:undefined}
    data-li-react-t13-stage={view.active==='T13'?t13Stage:undefined}
    data-li-react-t12-stage={view.active==='T12'?t12Stage:undefined}
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
     {isDuePreparing?<>
      {dueFuture&&<Text role="support" className="spell-honest">{copy(
       'Đã đặt mốc ôn: ','Scheduled review: ')}
       {new Date(view.dueAt!).toLocaleString(en()?'en-US':'vi-VN')}
       {copy(' · Chưa đến hẹn nên không tính là lượt ôn.',' · Not yet due; this is not a completed review.')}
      </Text>}
      <Button variant="secondary" onClick={()=>action(dueFuture?'clear':'schedule')}>
       {dueFuture?copy('Xóa mốc ôn','Clear review date'):copy('Đặt mốc ôn sau 24 giờ','Schedule review after 24 hours')}</Button>
     </>:
      <Button variant="primary" onClick={()=>action(ctaKind)}>
       {actionLabel}</Button>}
     {view.reviewedInSession&&<Text role="support" aria-live="polite">{copy(
      'Đã thực hành và đối chiếu trong phiên này · Chưa lưu/đồng bộ · Không phải điểm thông thạo.',
      'Practiced and self-checked in this session · Not saved/synced · Not a mastery grade.')}</Text>}
     {view.feedback&&<div className="spell-feedback" role="status" aria-live="polite">
      <strong>{copy('Phản hồi để tự kiểm chứng','Feedback for self-check')}</strong>
      <Text role="body">{tr(view.feedback)}</Text>
      <Text role="support">{copy(
       'Bài mẫu minh họa, không chứng nhận thành thạo hay kết quả học thuật ngoài nhiệm vụ.',
       'Illustrative exercise only; not a certification of mastery.')}</Text>
     </div>}
    </div>
    <div className="spell-activity-footer">
     <Text role="support">{view.active==='T12'?
      copy('T12 lưu bản nháp trên máy và đồng bộ qua tài khoản khi online.',
       'T12 stores the draft locally and syncs it through your account when online.'):
      copy('Tự chọn, có thể bỏ qua. Trừ mốc ôn T02, câu trả lời không tự lưu hoặc gửi lên máy chủ.',
       'Optional. Except the T02 schedule, exercise answers are neither saved nor sent to a server.')}</Text>
     {view.active==='T12'&&<p className="small" role={view.t12StorageError?'alert':'status'}
       aria-live="polite">{view.t12StorageError||
        (view.t12SavedOnDevice?
         copy('Đã lưu dấu vết trên thiết bị.','Cue saved on this device.'):
         copy('Chưa có dấu vết đã lưu.','No saved cue yet.'))}</p>}
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
  if(app.liNotes?.restoreFromReact(version)){setEditing(false);setMessage('');refresh();}
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
     <Button variant="ghost" className="library-danger-link"
      aria-label={copy('Xóa ghi chép và lịch sử phiên bản','Delete note and version history')}
      onClick={()=>app.liNotes?.deleteNote(note.type!,note.id!)}>
      <LiIcon name="trash" size={20}/></Button>
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
      {index>0&&<Button variant="ghost" className="library-text-link"
       onClick={()=>restore(version.version)}>{copy('Khôi phục phiên bản này','Restore this version')}</Button>}
     </article>)}
    </div>
   </Card>
  </>}
 </div>;
}
