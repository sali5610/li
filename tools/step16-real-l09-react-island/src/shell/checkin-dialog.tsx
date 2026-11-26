import React,{useEffect,useRef,useState} from 'react';
import {authoredCopy} from './discovery-locale.js';
import {createRoot} from 'react-dom/client';
import {Button,Progress} from '../../../../design-system/react/index';
import {
 CHECKIN_PHYSICAL,STUDY_RHYTHMS,completePhysical,recommendStudyRhythm,checkinDay,savedCheckin
} from './checkin-domain.js';
import type {
 PhysicalAnswers,PhysicalAnswer,PhysicalKey,EnergyAnswer,
 AttentionAnswer,StudyRhythm,SavedCheckin
} from './checkin-domain.js';

/** The L1 dialog has one React owner, one pure decision engine and one
 * in-memory result. No hidden native dialog/form/event forwarding. */
type PhysicalRecord=SavedCheckin;
type Draft={physical:PhysicalAnswers;energy:EnergyAnswer;attention:AttentionAnswer;override:StudyRhythm|''};
type ReadyForCheckin=(uid:string)=>Promise<void>;
type AppWindow=Window&{
 LiL1?:Readonly<{getPhysicalState:()=>PhysicalRecord|null}>;
 liSettingsPort?:{setMode?:(mode:StudyRhythm)=>boolean};
 liPersonalDiary?:{getView:()=>{consentStatus:string};getTodayCheckin?:(uid:string)=>unknown};
 liLanguage?:{get:()=>string};
 toast?:(message:string)=>void
};
const app=window as AppWindow;
let latest:PhysicalRecord|null=null;
let latestOwner='';
function verifiedOwner(){
 try{return document.documentElement.classList.contains('li-auth-verified')?
  localStorage.getItem('li.sync.local-owner.v1')||'':'';}catch{return '';}
}
const emptyDraft=():Draft=>({physical:{},energy:'',attention:'',override:''});
function fromSaved(record:PhysicalRecord|null):Draft{
 return record?{physical:{sleep:record.sleep,move:record.move,rest:record.rest},energy:record.energy,attention:record.attention,override:record.override}:emptyDraft();
}
const copy=(vi:string,en:string)=>app.liLanguage?.get?.()==='en'?en:vi;
const labels:Record<PhysicalKey,[string,string]>={
 sleep:['Đã ngủ tương đối đủ?','Did you sleep relatively well?'],
 move:['Đã vận động nhẹ hôm nay?','Have you moved gently today?'],
 rest:['Đã nghỉ ngơi hôm nay?','Have you had some rest today?']
};
const energyItems:readonly [EnergyAnswer,string,string][]=[
 ['high','Dồi dào','Plenty'],['medium','Vừa đủ','Enough'],['low','Đang cạn','Low']
];
const attentionItems:readonly [AttentionAnswer,string,string][]=[
 ['steady','Rõ ràng','Clear'],['warming','Chập chờn','Wavering'],['hard','Rất khó','Difficult']
];
const rhythmNames:Record<StudyRhythm,string>={...STUDY_RHYTHMS};
const defaultConsent='Đang lưu Check-in trong Nhật Ký trên thiết bị; chỉ đồng bộ lên Neon khi bạn đã bật quyền Nhật Ký.';
function CheckinDialog({waitForReady}:{waitForReady?:ReadyForCheckin}){
 const [open,setOpen]=useState(false);
 const [physical,setPhysical]=useState<PhysicalAnswers>({});
 const [energy,setEnergy]=useState<EnergyAnswer>('');
 const [attention,setAttention]=useState<AttentionAnswer>('');
 const [override,setOverride]=useState<StudyRhythm|''>('');
 const [saved,setSaved]=useState(false);
 const owner=useRef(''),day=useRef(''),prompted=useRef(''),dirty=useRef(false);
 const isOpen=useRef(false),wasStored=useRef(false);
 const draft=useRef<Draft>(emptyDraft());
 const [trigger,setTrigger]=useState('');
 const [locale,setLocale]=useState(0);
 const [consent,setConsent]=useState(defaultConsent);
 const focusRef=useRef<HTMLInputElement>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 const suggestion=recommendStudyRhythm(physical,energy,attention);
 const complete=completePhysical(physical);
 const answered=CHECKIN_PHYSICAL.filter(key=>Boolean(physical[key])).length;
 const chosen=complete?(override||suggestion?.mode||''):'';
 const updateConsent=()=>setConsent(app.liPersonalDiary?.getView()?.consentStatus||defaultConsent);
 function fill(value:Draft){
  draft.current=value;
  setPhysical(value.physical);setEnergy(value.energy);setAttention(value.attention);setOverride(value.override);
 }
 function reset(uid='',today=''){
  latest=null;latestOwner='';owner.current=uid;day.current=today;
  prompted.current='';dirty.current=false;wasStored.current=false;isOpen.current=false;
  fill(emptyDraft());setSaved(false);setOpen(false);
 }
 function todayRecord(uid:string){
  const now=new Date();
  const stored=savedCheckin(app.liPersonalDiary?.getTodayCheckin?.(uid),now);
  const inSession=latestOwner===uid?savedCheckin(latest,now):null;
  if(wasStored.current&&!stored){
   // A deleted or cleared Journal must not be resurrected by an old form.
   latest=null;latestOwner='';dirty.current=false;fill(emptyDraft());
  }
  wasStored.current=!!stored;
  const record=inSession&&(!stored||Date.parse(inSession.recordedAt)>=Date.parse(stored.recordedAt))&&latestOwner===uid?inSession:stored;
  if(record){latest=record;latestOwner=uid;}
  return record;
 }
 function align(uid:string){
  const today=checkinDay(new Date())||'';
  if(!uid||!today)return false;
  if(owner.current!==uid||day.current!==today)reset(uid,today);
  return true;
 }
 function show(uid:string,triggerId:string,record:PhysicalRecord|null){
  if(verifiedOwner()!==uid||!align(uid)||isOpen.current)return;
  if(!dirty.current)fill(fromSaved(record));
  setSaved(!!record);setTrigger(triggerId);updateConsent();
  prompted.current=day.current;isOpen.current=true;setOpen(true);
 }
 // Keep an unsubmitted draft only in memory, not in the Journal.
 const edit=(next:Partial<Draft>)=>{
  if(!verifiedOwner()||verifiedOwner()!==owner.current)return;
  dirty.current=true;fill({...draft.current,...next});
 };
 useEffect(()=>{
  let disposed=false,checking='';
  const onOpen=(event:Event)=>{
   const uid=verifiedOwner();if(!uid||!align(uid))return;
   const detail=(event as CustomEvent<{triggerId?:string}>).detail;
   show(uid,detail?.triggerId||((document.activeElement as HTMLElement|null)?.id||'checkin'),todayRecord(uid));
  };
  const onAuto=()=>{
   const uid=verifiedOwner();
   if(!uid||!align(uid)||isOpen.current||prompted.current===day.current||
    !document.getElementById('page-home')?.classList.contains('active'))return;
   const key=uid+'|'+day.current;if(checking===key)return;
   checking=key;
   // Wait until the existing owner sync has hydrated; never block learning
   // or overwrite a user who opened and edited the form in the meantime.
   requestAnimationFrame(()=>{void (async()=>{
    try{
     if(waitForReady)await waitForReady(uid);
     if(disposed||verifiedOwner()!==uid||owner.current!==uid||day.current!==checkinDay(new Date())||
      isOpen.current||prompted.current===day.current||
      !document.getElementById('page-home')?.classList.contains('active'))return;
     const record=todayRecord(uid);
     if(record){if(!dirty.current)fill(fromSaved(record));setSaved(true);return;}
     show(uid,'checkin',null);
    }catch{/* Manual Check-in stays available; retry on next route/sync event. */}
    finally{if(checking===key)checking='';}
   })();});
  };
  const refresh=()=>{
   updateConsent();
   const uid=verifiedOwner();
   if(uid&&owner.current===uid){
    const record=todayRecord(uid);
    setSaved(!!record);
    if(!isOpen.current&&!dirty.current&&record)fill(fromSaved(record));
   }
  };
  const language=()=>setLocale(x=>x+1);
  const deleted=()=>{const uid=verifiedOwner();if(uid)reset(uid,checkinDay(new Date())||'');};
  const auth=(event:Event)=>{
   const detail=(event as CustomEvent<{verified?:boolean;transient?:boolean;accountId?:string|null}>).detail;
   if(detail?.verified===false){
    if(detail.transient===true&&detail.accountId===owner.current){isOpen.current=false;setOpen(false);}
    else reset();
    return;
   }
   onAuto();
  };
  // Fail closed even if a class changes without a normal auth event.
  const watch=new MutationObserver(()=>{
   if(!verifiedOwner()){isOpen.current=false;setOpen(false);}
   else onAuto();
  });
  watch.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  window.addEventListener('li:open-checkin',onOpen);
  window.addEventListener('li:auth-verified-changed',auth);
  window.addEventListener('li:route-changed',onAuto);
  window.addEventListener('li:learning-sync-report',onAuto);
  window.addEventListener('pageshow',onAuto);
  window.addEventListener('focus',onAuto);
  window.addEventListener('li:checkin-history-deleted',deleted);
  window.addEventListener('li:diary-view-changed',refresh);
  window.addEventListener('li:personal-sync-applied',refresh);
  window.addEventListener('li:localechange',language);
  onAuto();
  return()=>{
   disposed=true;watch.disconnect();window.removeEventListener('li:open-checkin',onOpen);
   window.removeEventListener('li:auth-verified-changed',auth);
   window.removeEventListener('li:route-changed',onAuto);
   window.removeEventListener('li:learning-sync-report',onAuto);
   window.removeEventListener('pageshow',onAuto);
   window.removeEventListener('focus',onAuto);
   window.removeEventListener('li:checkin-history-deleted',deleted);
   window.removeEventListener('li:diary-view-changed',refresh);
   window.removeEventListener('li:personal-sync-applied',refresh);
   window.removeEventListener('li:localechange',language);
  };
 },[waitForReady]);
 useEffect(()=>{if(open)focusRef.current?.focus();},[open]);
 // Escape, focus trap and focus restoration: one real modal, not the native DOM.
 const close=()=>{
  isOpen.current=false;setOpen(false);
  requestAnimationFrame(()=>{
   (document.getElementById(trigger)||document.getElementById('checkin'))?.focus();
  });
 };
 const onKeyDown=(event:React.KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key!=='Tab')return;
  const focusables=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
   'button:not([disabled]),input:not([disabled]),summary,[tabindex="0"]'
  )||[]).filter(node=>node.offsetParent!==null);
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 };
 const apply=()=>{
  if(!chosen||!complete)return;
  const uid=verifiedOwner();
  if(!uid||uid!==owner.current||day.current!==checkinDay(new Date()))return;
  if(!app.liSettingsPort?.setMode?.(chosen as StudyRhythm))return;
  const recorded:PhysicalRecord={
   sleep:physical.sleep!,move:physical.move!,rest:physical.rest!,energy,attention,override,
   selectedMode:chosen as StudyRhythm,recordedAt:new Date().toISOString()
  };
  latest=recorded;latestOwner=uid;dirty.current=false;setSaved(true);
  window.dispatchEvent(new CustomEvent('li:l1-physical-checkin',{detail:{...recorded}}));
  close();
  app.toast?.('Đã chọn nhịp '+rhythmNames[recorded.selectedMode]+'. Đổi lúc nào cũng được!');
 };
 if(!open||verifiedOwner()!==owner.current)return null;
 const missing=CHECKIN_PHYSICAL.filter(k=>!physical[k]).map(k=>k==='sleep'?'Ngủ':k==='move'?'Vận động':'Nghỉ ngơi');
 const recommendation=!complete?
  copy('Chưa thể áp dụng. Hãy trả lời: '+missing.join(', ')+'. Hoặc chọn Bỏ qua để học mà không ghi check-in.',
   'Answer all three physical questions before applying a rhythm, or skip to study without a check-in.'):
  override?
   copy('L1 đã đủ ba câu. Bạn chọn '+rhythmNames[override]+' thủ công; quyền quyết định vẫn thuộc về bạn.',
    'All three questions answered. You manually chose '+authoredCopy(rhythmNames[override])+'. The choice is yours.'):
   copy('Gợi ý: '+rhythmNames[suggestion!.mode]+'. '+suggestion!.reason+
    (suggestion!.positives.length?' Điểm cộng gợi ý: '+suggestion!.positives.join(' · ')+'.':'')+
    ' Đây không phải đánh giá sức khỏe.',
    'Suggested rhythm: '+authoredCopy(rhythmNames[suggestion!.mode])+'. '+authoredCopy(suggestion!.reason)+
     (suggestion!.positives.length?' Suggestion bonuses: '+suggestion!.positives.map(authoredCopy).join(' · ')+'.':'')+
     ' This is not a health assessment.');
 return <div id="checkin-modal" className="modal open" role="dialog" aria-modal="true"
  aria-labelledby="checkin-title" aria-describedby="checkin-description"
  ref={dialogRef} onKeyDown={onKeyDown} data-react-owner="checkin">
  <div className="dialog">
   <div className="checkin-scroll" tabIndex={0}
    aria-label={copy('Nội dung check-in có thể cuộn','Scrollable check-in content')}>
    <div className="kicker">{copy('L1 · THỂ TRẠNG → NHỊP HỌC','PHYSICAL REPORT → STUDY RHYTHM')}</div>
    <h2 id="checkin-title">{saved?copy('Cập nhật Check-in hôm nay','Update today’s check-in'):copy('Hôm nay cơ thể ra sao?','How does your body feel today?')}</h2>
    <p id="checkin-description">{copy(
     'Chọn Có hoặc Chưa cho cả ba mục để nhận gợi ý nhịp học.',
     'Answer all three questions to get a study-rhythm suggestion.')}</p>
    <div className="li-checkin-progress" role="status" aria-live="polite">
     <span>{copy('Đã trả lời','Answered')} <strong>{answered}/3</strong></span>
     <Progress label={copy('Đã trả lời câu hỏi','Answered questions')}
      value={answered} max={3} className="li-checkin-progress-bar"/>
    </div>
    <div className="checkin-physical" role="group"
     aria-label={copy('Ba câu hỏi thể trạng','Three physical check-in questions')}>
     {CHECKIN_PHYSICAL.map((key,index)=><fieldset className="checkin-physical-field"
      data-checkin-field={key} key={key}>
      <legend><span className="checkin-index">{String(index+1).padStart(2,'0')}</span>{' '}
       {copy(...labels[key])}</legend>
      <div className="checkin-radio-row">
       {(['yes','no'] as PhysicalAnswer[]).map((value,i)=><label key={value}
        className="checkin-radio">
        <input type="radio" name={'checkin-'+key} value={value}
         checked={physical[key]===value}
         ref={key==='sleep'&&value==='yes'?focusRef:undefined}
         onChange={()=>edit({physical:{...draft.current.physical,[key]:value}})}/>
        <span>{i===0?copy('Có','Yes'):copy('Chưa','Not yet')}</span>
       </label>)}
      </div>
     </fieldset>)}
    </div>
    <p id="checkin-recommendation" className={"state-note checkin-result"+(complete?" is-ready":"") }
     role="status" aria-live="polite">{recommendation}</p>
    <details className="checkin-context" open={energy!==''||attention!==''?true:undefined}>
     <summary>{copy('Cảm nhận hiện tại · Bổ sung','Current feelings · Optional')}</summary>
     <p>{copy(
      'Không bắt buộc. Cảm nhận hiện tại điều chỉnh gợi ý, nhưng ba mục thể trạng vẫn được ưu tiên.',
      'Optional feelings adjust the suggestion; the three primary questions take priority.')}</p>
     <fieldset className="checkin-question"><legend>{copy('Năng lượng lúc này','Energy right now')}</legend>
      <div className="checkin-choices">
       {energyItems.map(([value,vi,en])=><label key={value} className="checkin-choice">
        <input type="radio" name="checkin-energy" value={value} checked={energy===value}
         onChange={()=>edit({energy:value})}/><span>{copy(vi,en)}</span></label>)}
      </div>
     </fieldset>
     <fieldset className="checkin-question"><legend>{copy('Khả năng tập trung','Ability to focus')}</legend>
      <div className="checkin-choices">
       {attentionItems.map(([value,vi,en])=><label key={value} className="checkin-choice">
        <input type="radio" name="checkin-attention" value={value} checked={attention===value}
         onChange={()=>edit({attention:value})}/><span>{copy(vi,en)}</span></label>)}
      </div>
     </fieldset>
    </details>
    <details className="checkin-manual" id="checkin-override" open={override!==''?true:undefined}>
     <summary>{copy('Tự chọn nhịp khác','Choose another rhythm')}</summary>
     <fieldset className="checkin-question"><legend>{copy('Nhịp muốn áp dụng','Desired study rhythm')}</legend>
      <div className="checkin-override-options">
       {([['',copy('Theo gợi ý','Use suggestion')],...Object.entries(rhythmNames)] as [string,string][])
        .map(([key,label])=><label key={key} className="checkin-radio">
         <input type="radio" name="checkin-override" value={key}
          checked={override===key} onChange={()=>edit({override:key as StudyRhythm|''})}/>
         <span>{authoredCopy(label)}</span></label>)}
      </div>
     </fieldset>
    </details>
    <p id="li-checkin-recording-disclosure" className="checkin-privacy">{authoredCopy(consent)}</p>
   </div>
   <div className="action-row checkin-actions">
    <Button variant="secondary" className="action alt" id="close-checkin" onClick={close}>
     {saved?copy('Đóng','Close'):copy('Bỏ qua','Skip')}</Button>
    <Button variant="primary" className="action" id="apply-checkin"
     disabled={!chosen} onClick={apply}>{saved?copy('Cập nhật','Update'):copy('Áp dụng nhịp','Apply rhythm')}</Button>
   </div>
  </div>
 </div>;
}
export function mountCheckinDialog(waitForReady?:ReadyForCheckin){
 const root=document.getElementById('li-react-checkin-root');
 if(!root)throw Error('REACT_CHECKIN_ROOT_MISSING');
 app.LiL1=Object.freeze({getPhysicalState:()=>verifiedOwner()===latestOwner?savedCheckin(latest,new Date()):null});
 const reactRoot=createRoot(root);
 reactRoot.render(<CheckinDialog waitForReady={waitForReady}/>);
 return()=>reactRoot.unmount();
}
