import React,{useEffect,useState} from 'react';
import {goBack} from './app-router.js';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {Badge,Button,Card,Field,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';

/** React owns Nhặt Ý input and button; one original private library owner
 * handles validation, persistence, rollback, activity and Collection navigation.
 * Its legacy HTML button remains a fallback, never a click-through target. */
type CaptureResult=
 |{ok:true;id:string}
 |{ok:false;reason:string;message:string};
type CaptureWindow=Window&{
 liCaptureIdea?:{save:(text:string)=>CaptureResult};
};
const app=window as CaptureWindow;
function CaptureIdea(){
 const reduced=useReducedMotion();
 const [text,setText]=useState('');
 const [message,setMessage]=useState('');
 useEffect(()=>{
  // An unsaved idea must never leak into the next invited learner session.
  const watch=new MutationObserver(()=>{
   if(!document.documentElement.classList.contains('li-auth-verified')){
    setText('');setMessage('');
   }
  });
  watch.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  return ()=>watch.disconnect();
 },[]);
 function save(){
  const result=app.liCaptureIdea?.save(text);
  if(!result){
   setMessage('Chưa thể lưu ghi chú. Hãy sao chép nội dung trước khi rời trang.');
   return;
  }
  if(result.ok){setText('');setMessage('');return;}
  // Truthful inline failure; the original storage owner also handles snackbar.
  setMessage(result.message);
 }
 return <div data-li-react-screen="capture-idea">
  <Button variant="ghost" className="utility-back" onClick={goBack}>
   <span aria-hidden="true">←</span> Quay lại
  </Button>
  <div className="kicker">NHẶT Ý</div>
  <Heading level={1} role="headline">Nhặt ý</Heading>
  <div className="editorial-grid">
   <Card variant="tinted">
    <Heading level={2} role="titleMedium">Nhặt một ý cần kiểm chứng</Heading>
    <Field label="Ý nghĩ, câu sách hoặc nhận định chưa được kiểm chứng"
     kind="textarea" rows={6} value={text} className="li-react-capture-field"
     placeholder="Mình vừa đọc thấy…"
     onChange={event=>{setText(event.target.value);if(message)setMessage('');}}/>
    {message&&<motion.div key={message} initial={reduced?false:{opacity:0,y:4}}
     animate={{opacity:1,y:0}} transition={reduced?{duration:0}:{duration:0.16}}>
     <InlineFeedback tone="error" message={message}/>
    </motion.div>}
    <div className="action-row"><Button onClick={save}>Lưu ý đã nhặt</Button></div>
   </Card>
   <Card variant="raised">
    <Heading level={2} role="titleMedium">Đừng nhầm chuyện được kể với bằng chứng.</Heading>
    <Text role="body">Giữ lại câu hỏi và nguồn bạn gặp để tiện kiểm chứng sau.</Text>
    <Badge tone="neutral">Nguồn cá nhân · Chưa xác minh</Badge>
   </Card>
  </div>
 </div>;
}
export function mountCaptureIdea(){
 const page=document.getElementById('page-capture');
 const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!page||!legacy||!app.liCaptureIdea)throw Error('REACT_CAPTURE_PORT_REQUIRED');
 const host=document.createElement('div');
 host.id='li-react-capture-host';host.className='section-shell';
 page.append(host);
 const root=createRoot(host);
 root.render(<CaptureIdea/>);
 legacy.hidden=true;legacy.style.display='none';
 return ()=>{root.unmount();host.remove();legacy.hidden=false;legacy.style.removeProperty('display');};
}
