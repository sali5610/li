import React,{useEffect,useRef,useState} from 'react';
import './home-catalog.css';
import {goBack} from './app-router.js';
import {useDiscoveryLocale,localized} from './discovery-locale.js';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {Badge,Button,Field,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';
import {FieldPicker} from './library-taxonomy.js';
import {blankCaptureDraft,readCaptureDraft,writeCaptureDraft,type CaptureDraft} from './capture-draft.js';

/** React owns Nhặt Ý input and button; one original private library owner
 * handles validation, persistence, rollback, activity and Collection navigation.
 * Its legacy HTML button remains a fallback, never a click-through target. */
type CaptureResult=
 |{ok:true;id:string}
 |{ok:false;reason:string;message:string};
type CaptureUiPort={getDraft:()=>string;isReloadSafe:()=>boolean};
declare global{interface Window{liCaptureUi?:CaptureUiPort;}}
type CaptureWindow=Window&{
 liCaptureIdea?:{save:(text:string,fieldId?:string|null)=>CaptureResult};
};
const app=window as CaptureWindow;
function CaptureIdea(){
 const locale=useDiscoveryLocale();
 const L=(vi:string,en:string)=>localized(locale,vi,en);
 const reduced=useReducedMotion();
 const [draft,setDraft]=useState<CaptureDraft>(blankCaptureDraft);
 const [message,setMessage]=useState('');
 const [draftError,setDraftError]=useState(false);
 const owner=useRef<string|null>(null);
 const latest=useRef<CaptureDraft>(blankCaptureDraft());
 const verified=()=>document.documentElement.classList.contains('li-auth-verified');
 const apply=(next:CaptureDraft)=>{latest.current=next;setDraft(next);};
 useEffect(()=>{
  // The app is hidden during Auth rechecks; keep the current owner's in-memory
  // draft, especially if local storage failed. Only hydrate after verification.
  const syncOwner=(event?:Event)=>{
   const detail=(event as CustomEvent<{verified?:boolean;transient?:boolean;accountId?:string|null}>|undefined)?.detail;
   if(!verified()){
    if(!detail?.transient){owner.current=null;apply(blankCaptureDraft());setMessage('');setDraftError(false);}
    return;
   }
   try{
    const uid=localStorage.getItem('li.sync.local-owner.v1');
    if(!uid||(detail?.accountId&&detail.accountId!==uid)){
     owner.current=null;apply(blankCaptureDraft());return;
    }
    if(owner.current===uid)return;
    owner.current=uid;
    apply(blankCaptureDraft());setMessage('');setDraftError(false);
    apply(readCaptureDraft(localStorage,uid,true));
   }catch{setDraftError(true);}
  };
  syncOwner();
  window.addEventListener('li:auth-verified-changed',syncOwner);
  const port:CaptureUiPort={getDraft:()=>verified()&&owner.current?latest.current.text:'',
   isReloadSafe:()=>{
    try{
     if(!owner.current||!verified())return false;
     const saved=readCaptureDraft(localStorage,owner.current,true);
     return saved.text===latest.current.text&&saved.fieldId===latest.current.fieldId;
    }catch{return false;}
   }};
  
  window.liCaptureUi=port;
  return()=>{window.removeEventListener('li:auth-verified-changed',syncOwner);
   if(window.liCaptureUi===port)delete window.liCaptureUi;};
 },[]);
 function persist(next:CaptureDraft){
  apply(next);
  try{
   if(!owner.current)throw Error('CAPTURE_DRAFT_OWNER_REQUIRED');
   writeCaptureDraft(localStorage,owner.current,verified(),next);
   setDraftError(false);
  }catch{setDraftError(true);}
 }
 function save(){
  const result=app.liCaptureIdea?.save(draft.text,draft.fieldId);
  if(!result){
   setMessage(L('Chưa thể lưu ghi chú. Hãy sao chép nội dung trước khi rời trang.','Unable to save this note. Copy your text before leaving.'));
   return;
  }
  if(result.ok){persist(blankCaptureDraft());setMessage('');return;}
  // Truthful inline failure; the original storage owner also handles snackbar.
  setMessage(result.message);
 }
 return <div data-li-react-screen="capture-idea" className="li-react-capture">
  <Button variant="ghost" className="utility-back" onClick={goBack}>
   <span aria-hidden="true">←</span> {L('Quay lại','Back')}
  </Button>
  <header className="capture-lead">
   <Heading level={1} role="headline">{L("Nhặt ý","Capture")}</Heading>
  </header>
  <div className="capture-writing">
   <section className="capture-editor">
    <Heading level={2} role="titleMedium">{L("Nhặt một ý cần kiểm chứng","Capture an idea worth checking")}</Heading>
    <Field id="li-react-capture-note" label={L("Ý nghĩ, câu sách hoặc nhận định chưa được kiểm chứng","A thought, quotation or unverified claim")}
     kind="textarea" rows={9} value={draft.text} className="li-react-capture-field"
     placeholder={L("Mình vừa đọc thấy…","I just came across…")}
     onChange={event=>{persist({...latest.current,text:event.target.value});if(message)setMessage('');}}/>
    <FieldPicker id="li-capture-field-id" value={draft.fieldId} onChange={fieldId=>persist({...latest.current,fieldId})}/>
    {draftError&&<InlineFeedback tone="error" message={L('Không thể tự lưu bản nháp trên máy. Hãy sao chép hoặc lưu ý trước khi thoát.','Could not keep the draft on this device. Copy or save your idea before leaving.')}/>}
    {message&&<motion.div key={message} initial={reduced?false:{opacity:0,y:4}}
     animate={{opacity:1,y:0}} transition={reduced?{duration:0}:{duration:0.16}}>
     <InlineFeedback tone="error" message={message}/>
    </motion.div>}
    <div className="capture-editor-footer">
     <Badge tone="neutral">{L("Nguồn cá nhân · Chưa xác minh","Personal note · Unverified")}</Badge>
     <Button onClick={save}>{L("Lưu ý đã nhặt","Save idea")}</Button>
    </div>
   </section>
   <aside className="capture-guidance">
    <Heading level={2} role="titleMedium">{L("Đừng nhầm chuyện được kể với bằng chứng.","A compelling story is not evidence.")}</Heading>
    <Text role="body">{L("Giữ lại câu hỏi và nguồn bạn gặp để tiện kiểm chứng sau.","Keep the question and source so you can verify them later.")}</Text>
   </aside>
  </div>
 </div>;
}
export function mountCaptureIdea(){
 const page=document.getElementById('page-capture');
 const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!page||!app.liCaptureIdea)throw Error('REACT_CAPTURE_PORT_REQUIRED');
 const host=document.createElement('div');
 host.id='li-react-capture-host';host.className='section-shell';
 page.append(host);
 const root=createRoot(host);
 root.render(<CaptureIdea/>);
 if(legacy){legacy.hidden=true;legacy.style.display='none';}
 return ()=>{root.unmount();host.remove();if(legacy){legacy.hidden=false;legacy.style.removeProperty('display');}};
}

export {CaptureIdea as CaptureIdeaScreen};
