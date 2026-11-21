import React,{useEffect,useState} from 'react';
import {goBack} from './app-router.js';
import {useDiscoveryLocale,localized} from './discovery-locale.js';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {Badge,Button,Field,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';

/** React owns Nhặt Ý input and button; one original private library owner
 * handles validation, persistence, rollback, activity and Collection navigation.
 * Its legacy HTML button remains a fallback, never a click-through target. */
type CaptureResult=
 |{ok:true;id:string}
 |{ok:false;reason:string;message:string};
type CaptureUiPort={getDraft:()=>string};
declare global{interface Window{liCaptureUi?:CaptureUiPort;}}
type CaptureWindow=Window&{
 liCaptureIdea?:{save:(text:string)=>CaptureResult};
};
const app=window as CaptureWindow;
function CaptureIdea(){
 const locale=useDiscoveryLocale();
 const L=(vi:string,en:string)=>localized(locale,vi,en);
 const reduced=useReducedMotion();
 const [text,setText]=useState('');
 const [message,setMessage]=useState('');
 useEffect(()=>{
  const port:CaptureUiPort={getDraft:()=>document.documentElement.classList.contains('li-auth-verified')?text:''};
  window.liCaptureUi=port;
  return()=>{if(window.liCaptureUi===port)delete window.liCaptureUi;};
 },[text]);
 useEffect(()=>{
  // An unsaved idea must never leak into the next invited learner session.
  const clearOnSignOut=()=>{
   if(!document.documentElement.classList.contains('li-auth-verified')){
    setText('');setMessage('');
   }
  };
  window.addEventListener('li:auth-verified-changed',clearOnSignOut);
  return ()=>window.removeEventListener('li:auth-verified-changed',clearOnSignOut);
 },[]);
 function save(){
  const result=app.liCaptureIdea?.save(text);
  if(!result){
   setMessage(L('Chưa thể lưu ghi chú. Hãy sao chép nội dung trước khi rời trang.','Unable to save this note. Copy your text before leaving.'));
   return;
  }
  if(result.ok){setText('');setMessage('');return;}
  // Truthful inline failure; the original storage owner also handles snackbar.
  setMessage(result.message);
 }
 return <div data-li-react-screen="capture-idea" className="li-react-capture">
  <Button variant="ghost" className="utility-back" onClick={goBack}>
   <span aria-hidden="true">←</span> {L('Quay lại','Back')}
  </Button>
  <header className="capture-lead">
   <div className="kicker">{L("NHẶT Ý","CAPTURE AN IDEA")}</div>
   <Heading level={1} role="headline">{L("Nhặt ý","Capture")}</Heading>
  </header>
  <main className="capture-writing">
   <section className="capture-editor">
    <Heading level={2} role="titleMedium">{L("Nhặt một ý cần kiểm chứng","Capture an idea worth checking")}</Heading>
    <Field id="li-react-capture-note" label={L("Ý nghĩ, câu sách hoặc nhận định chưa được kiểm chứng","A thought, quotation or unverified claim")}
     kind="textarea" rows={9} value={text} className="li-react-capture-field"
     placeholder={L("Mình vừa đọc thấy…","I just came across…")}
     onChange={event=>{setText(event.target.value);if(message)setMessage('');}}/>
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
  </main>
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
