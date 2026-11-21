import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,Progress} from '../../../../design-system/react/index';
import {
 CHECKIN_PHYSICAL,STUDY_RHYTHMS,completePhysical,recommendStudyRhythm
} from './checkin-domain.js';
import type {
 PhysicalAnswers,PhysicalAnswer,PhysicalKey,EnergyAnswer,
 AttentionAnswer,StudyRhythm
} from './checkin-domain.js';

/** The L1 dialog has one React owner, one pure decision engine and one
 * in-memory result. No hidden native dialog/form/event forwarding. */
type PhysicalRecord=Required<PhysicalAnswers>&{
 selectedMode:StudyRhythm;recordedAt:string
};
type AppWindow=Window&{
 LiL1?:Readonly<{getPhysicalState:()=>PhysicalRecord|null}>;
 liSettingsPort?:{setMode?:(mode:StudyRhythm)=>boolean};
 liPersonalDiary?:{getView:()=>{consentStatus:string}};
 liLanguage?:{get:()=>string};
 toast?:(message:string)=>void
};
const app=window as AppWindow;
let latest:PhysicalRecord|null=null;
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
 ['steady','Rõ ràng','Clear'],['warming','Chập chờn','Unsteady'],['hard','Rất khó','Difficult']
];
const rhythmNames:Record<StudyRhythm,string>={...STUDY_RHYTHMS};
const defaultConsent='Đang lưu Check-in trong Nhật Ký trên thiết bị; chỉ đồng bộ lên Neon khi bạn đã bật quyền Nhật Ký.';
function CheckinDialog(){
 const [open,setOpen]=useState(false);
 const [physical,setPhysical]=useState<PhysicalAnswers>({});
 const [energy,setEnergy]=useState<EnergyAnswer>('');
 const [attention,setAttention]=useState<AttentionAnswer>('');
 const [override,setOverride]=useState<StudyRhythm|''>('');
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
 useEffect(()=>{
  const onOpen=(event:Event)=>{
   if(!document.documentElement.classList.contains('li-auth-verified'))return;
   const detail=(event as CustomEvent<{triggerId?:string}>).detail;
   setTrigger(detail?.triggerId||((document.activeElement as HTMLElement|null)?.id||'checkin'));
   setPhysical({});setEnergy('');setAttention('');setOverride('');
   updateConsent();setOpen(true);
  };
  const refresh=()=>updateConsent();
  const language=()=>setLocale(x=>x+1);
  const watch=new MutationObserver(()=>{
   if(!document.documentElement.classList.contains('li-auth-verified')){
    latest=null;setOpen(false);
   }
  });
  watch.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  window.addEventListener('li:open-checkin',onOpen);
  window.addEventListener('li:diary-view-changed',refresh);
  window.addEventListener('li:personal-sync-applied',refresh);
  window.addEventListener('li:localechange',language);
  return()=>{
   watch.disconnect();window.removeEventListener('li:open-checkin',onOpen);
   window.removeEventListener('li:diary-view-changed',refresh);
   window.removeEventListener('li:personal-sync-applied',refresh);
   window.removeEventListener('li:localechange',language);
  };
 },[]);
 useEffect(()=>{if(open)focusRef.current?.focus();},[open]);
 // Escape, focus trap and focus restoration: one real modal, not the native DOM.
 const close=()=>{
  setOpen(false);
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
  if(!app.liSettingsPort?.setMode?.(chosen as StudyRhythm))return;
  const recorded:PhysicalRecord={
   sleep:physical.sleep!,move:physical.move!,rest:physical.rest!,
   selectedMode:chosen as StudyRhythm,recordedAt:new Date().toISOString()
  };
  latest=recorded;
  window.dispatchEvent(new CustomEvent('li:l1-physical-checkin',{detail:{...recorded}}));
  close();
  app.toast?.('Đã chọn nhịp '+rhythmNames[recorded.selectedMode]+'. Đổi lúc nào cũng được!');
 };
 if(!open)return null;
 const missing=CHECKIN_PHYSICAL.filter(k=>!physical[k]).map(k=>k==='sleep'?'Ngủ':k==='move'?'Vận động':'Nghỉ ngơi');
 const recommendation=!complete?
  copy('Chưa thể áp dụng. Hãy trả lời: '+missing.join(', ')+'. Hoặc chọn Bỏ qua để học mà không ghi check-in.',
   'Answer all three physical questions before applying a rhythm, or skip to study without a check-in.'):
  override?
   copy('L1 đã đủ ba câu. Bạn chọn '+rhythmNames[override]+' thủ công; quyền quyết định vẫn thuộc về bạn.',
    'All three questions answered. You manually chose '+override+'. The choice is yours.'):
   copy('Gợi ý: '+rhythmNames[suggestion!.mode]+'. '+suggestion!.reason+
    (suggestion!.positives.length?' Điểm cộng gợi ý: '+suggestion!.positives.join(' · ')+'.':'')+
    ' Đây không phải đánh giá sức khỏe.',
    'Suggested rhythm: '+suggestion!.mode+'. '+suggestion!.reason+' Not a health assessment.');
 return <div id="checkin-modal" className="modal open" role="dialog" aria-modal="true"
  aria-labelledby="checkin-title" aria-describedby="checkin-description"
  ref={dialogRef} onKeyDown={onKeyDown} data-react-owner="checkin">
  <div className="dialog">
   <div className="checkin-scroll" tabIndex={0}
    aria-label={copy('Nội dung check-in có thể cuộn','Scrollable check-in content')}>
    <div className="kicker">{copy('L1 · THỂ TRẠNG → NHỊP HỌC','PHYSICAL REPORT → STUDY RHYTHM')}</div>
    <h2 id="checkin-title">{copy('Hôm nay cơ thể ra sao?','How does your body feel today?')}</h2>
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
         onChange={()=>setPhysical(prev=>({...prev,[key]:value}))}/>
        <span>{i===0?copy('Có','Yes'):copy('Chưa','Not yet')}</span>
       </label>)}
      </div>
     </fieldset>)}
    </div>
    <p id="checkin-recommendation" className={"state-note checkin-result"+(complete?" is-ready":"") }
     role="status" aria-live="polite">{recommendation}</p>
    <details className="checkin-context">
     <summary>{copy('Cảm nhận hiện tại · Bổ sung','Current feelings · Optional')}</summary>
     <p>{copy(
      'Không bắt buộc. Cảm nhận hiện tại điều chỉnh gợi ý, nhưng ba mục thể trạng vẫn được ưu tiên.',
      'Optional feelings adjust the suggestion; the three primary questions take priority.')}</p>
     <fieldset className="checkin-question"><legend>{copy('Năng lượng lúc này','Energy right now')}</legend>
      <div className="checkin-choices">
       {energyItems.map(([value,vi,en])=><label key={value} className="checkin-choice">
        <input type="radio" name="checkin-energy" value={value} checked={energy===value}
         onChange={()=>setEnergy(value)}/><span>{copy(vi,en)}</span></label>)}
      </div>
     </fieldset>
     <fieldset className="checkin-question"><legend>{copy('Khả năng tập trung','Ability to focus')}</legend>
      <div className="checkin-choices">
       {attentionItems.map(([value,vi,en])=><label key={value} className="checkin-choice">
        <input type="radio" name="checkin-attention" value={value} checked={attention===value}
         onChange={()=>setAttention(value)}/><span>{copy(vi,en)}</span></label>)}
      </div>
     </fieldset>
    </details>
    <details className="checkin-manual" id="checkin-override">
     <summary>{copy('Tự chọn nhịp khác','Choose another rhythm')}</summary>
     <fieldset className="checkin-question"><legend>{copy('Nhịp muốn áp dụng','Desired study rhythm')}</legend>
      <div className="checkin-override-options">
       {([['',copy('Theo gợi ý','Use suggestion')],...Object.entries(rhythmNames)] as [string,string][])
        .map(([key,label])=><label key={key} className="checkin-radio">
         <input type="radio" name="checkin-override" value={key}
          checked={override===key} onChange={()=>setOverride(key as StudyRhythm|'')}/>
         <span>{label}</span></label>)}
      </div>
     </fieldset>
    </details>
    <p id="li-checkin-recording-disclosure" className="checkin-privacy">{consent}</p>
   </div>
   <div className="action-row checkin-actions">
    <Button variant="secondary" className="action alt" id="close-checkin" onClick={close}>
     {copy('Bỏ qua','Skip')}</Button>
    <Button variant="primary" className="action" id="apply-checkin"
     disabled={!chosen} onClick={apply}>{copy('Áp dụng nhịp','Apply rhythm')}</Button>
   </div>
  </div>
 </div>;
}
export function mountCheckinDialog(){
 const root=document.getElementById('li-react-checkin-root');
 if(!root)throw Error('REACT_CHECKIN_ROOT_MISSING');
 app.LiL1=Object.freeze({getPhysicalState:()=>latest?{...latest}:null});
 const reactRoot=createRoot(root);
 reactRoot.render(<CheckinDialog/>);
 return()=>reactRoot.unmount();
}
