import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Badge,Button,Field,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';

/** React-owned Capture screen; data writes deliberately reuse the existing
 * private-library save transaction until that store moves behind a typed port.
 * No second localStorage key, cloud writer or lossy conversion.
 */
function CaptureIdea(){
 const [text,setText]=useState('');
 const [message,setMessage]=useState('');
 function save(){
  const value=text.trim();
  if(value.length<3){setMessage('Ý này còn quá ngắn. Viết ít nhất 3 ký tự đã.');return;}
  if(value.length>5000){setMessage('Ý dài quá 5.000 ký tự, hãy tách thành vài ghi chú.');return;}
  const input=document.getElementById('capture-note') as HTMLTextAreaElement|null;
  const submit=document.getElementById('save-capture-note') as HTMLButtonElement|null;
  if(!input||!submit){setMessage('Chưa thể lưu ghi chú. Hãy sao chép nội dung trước khi rời trang.');return;}
  input.value=value;
  let saved=false;
  const onSaved=(event:Event)=>{
   const detail=(event as CustomEvent<{type?:string;id?:string}>).detail;
   if(detail?.type==='input'&&detail.id?.startsWith('idea:'))saved=true;
  };
  window.addEventListener('li:activity',onSaved);
  try{submit.click();}finally{window.removeEventListener('li:activity',onSaved);}
  if(saved){setText('');setMessage('');}
  // Failure feedback and rollback are emitted by the existing storage owner.
 }
 return <div data-li-react-screen="capture-idea">
  <button type="button" className="utility-back" data-nav-back>
   <span aria-hidden="true">←</span> Quay lại
  </button>
  <div className="kicker">NHẶT Ý</div>
  <Heading level={1} role="headline">Nhặt ý</Heading>
  <div className="editorial-grid">
   <article className="surface tinted">
    <Heading level={2} role="titleMedium">Nhặt một ý cần kiểm chứng</Heading>
    <Field label="Ý nghĩ, câu sách hoặc nhận định chưa được kiểm chứng"
     kind="textarea" rows={6} value={text} className="li-react-capture-field"
     placeholder="Mình vừa đọc thấy…"
     onChange={event=>{setText(event.target.value);if(message)setMessage('');}}/>
    {message&&<InlineFeedback tone="error" message={message}/>}
    <div className="action-row"><Button onClick={save}>Lưu ý đã nhặt</Button></div>
   </article>
   <article className="surface">
    <Heading level={2} role="titleMedium">Đừng nhầm chuyện được kể với bằng chứng.</Heading>
    <Text role="body">Giữ lại câu hỏi và nguồn bạn gặp để tiện kiểm chứng sau.</Text>
    <Badge tone="neutral">Nguồn cá nhân · Chưa xác minh</Badge>
   </article>
  </div>
 </div>;
}
export function mountCaptureIdea(){
 const page=document.getElementById('page-capture');
 const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!page||!legacy)throw Error('REACT_CAPTURE_HOST_MISSING');
 const host=document.createElement('div');
 host.id='li-react-capture-host';host.className='section-shell';
 page.append(host);
 const root=createRoot(host);
 root.render(<CaptureIdea/>);
 legacy.hidden=true;legacy.style.display='none';
 return ()=>{root.unmount();host.remove();legacy.hidden=false;legacy.style.removeProperty('display');};
}
