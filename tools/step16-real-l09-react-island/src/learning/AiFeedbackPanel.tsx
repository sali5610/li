import React,{useEffect,useState} from 'react';
import {Button} from '../../../../design-system/react/Components';
import {Heading,Text} from '../../../../design-system/react/Atoms';
import {IS_GITHUB_STAGING} from '../auth/config.js';

type Availability={enabledForMe?:boolean;ready?:boolean;remaining?:number};
type Result={feedback?:string;basis?:string;error?:string};
export function AiFeedbackPanel({id,locale,answers}:{
 id:string;locale:'vi'|'en';answers:readonly string[]
}){
 const vi=locale==='vi';
 const [availability,setAvailability]=useState<Availability|null>(null);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [message,setMessage]=useState('');
 // The shared GitHub Pages app is static. Never send private answers to
 // a cross-origin URL or pretend that production's authenticated Worker exists.
 useEffect(()=>{
  setFeedback('');setMessage('');
  if(IS_GITHUB_STAGING||!navigator.onLine)return;
  let live=true;
  void fetch('/api/ai/access',{credentials:'same-origin',cache:'no-store'})
   .then(async r=>r.ok?await r.json() as Availability:null)
   .then(value=>{if(live)setAvailability(value);})
   .catch(()=>{if(live)setAvailability(null);});
  return()=>{live=false;};
 },[id]);
 async function review(){
  if(busy||IS_GITHUB_STAGING||!availability?.enabledForMe||!availability.ready)return;
  if(answers.length!==4)return;
  setBusy(true);setMessage('');setFeedback('');
  try{
   const response=await fetch('/api/ai/feedback',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({lessonId:id,locale,answers})
   });
   const data=await response.json() as Result;
   if(!response.ok||data.basis!=='unverified-ai-coaching'||
      typeof data.feedback!=='string')throw Error(data.error||'AI_UNAVAILABLE');
   setFeedback(data.feedback);
   setAvailability(previous=>previous?{...previous,remaining:
    Math.max(0,(previous.remaining??1)-1)}:previous);
  }catch{
   setMessage(vi?
    'AI chưa phản hồi được. Mày vẫn có đáp án mẫu và rubric bên trên để tự đối chiếu.':
    'AI is unavailable. Use the model answer and rubric above to self-review.');
  }finally{setBusy(false);}
 }
 return <section className="li-learning-next-action" aria-label={vi?'Lão Lý AI':'Lao Ly AI'}>
  <Heading level={3} role="titleMedium">{vi?'Nhờ Lão Lý AI nhận xét':'Ask Lao Ly AI for feedback'}</Heading>
  {IS_GITHUB_STAGING?
   <Text role="support">{vi?
    'Chưa gọi AI trên GitHub Pages staging. Tính năng cần Cloudflare backend và chủ tài khoản bật quyền sau khi phát hành.':
    'AI calls are disabled on static GitHub Pages staging until the approved Cloudflare backend is configured.'}</Text>:
   availability?.enabledForMe&&availability.ready?
    <>
     <Text role="support">{vi?
      'Chỉ gửi bốn câu đã nộp và rubric của bài này khi mày bấm nút. Không tự chấm điểm.':
      'Sends only your submitted answers and the reviewed lesson rubric when you click. No automatic grade.'}</Text>
     <Button disabled={busy||!navigator.onLine||availability.remaining===0}
      onClick={()=>void review()}>
      {busy?(vi?'Đang nhận xét…':'Reviewing…'):
       vi?'Nhận feedback AI':'Get AI feedback'}
     </Button>
     {typeof availability.remaining==='number'&&<Text role="support">
      {vi?'Lượt AI còn trong ngày: ':'AI requests remaining today: '}{availability.remaining}</Text>}
    </>:
    <Text role="support">{vi?
     'Tài khoản này chưa được cấp AI, hoặc dịch vụ chưa cấu hình. Vẫn học và tự chấm bình thường.':
     'AI is not assigned to this account or the service is not configured. Manual feedback still works.'}</Text>}
  {message&&<Text role="support">{message}</Text>}
  {feedback&&<div aria-live="polite" role="status">
   <Text role="body">{feedback}</Text>
   <Text role="support">{vi?
    'Gợi ý AI có thể sai; đối chiếu lại đáp án/rubric đã duyệt. Đây không phải điểm hay chứng nhận thành thạo.':
    'AI may be wrong; check the approved model answer and rubric. No automatic score or mastery claim.'}</Text>
  </div>}
 </section>;
}
