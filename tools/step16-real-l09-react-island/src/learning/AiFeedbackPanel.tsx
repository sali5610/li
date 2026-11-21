import React,{useEffect,useState} from 'react';
import {Button} from '../../../../design-system/react/Components';
import {Heading,Text} from '../../../../design-system/react/Atoms';
import {IS_GITHUB_STAGING} from '../auth/config.js';

type Availability={enabledForMe?:boolean;ready?:boolean;quota?:string};
type Result={feedback?:string;basis?:string;error?:string};
export function AiFeedbackPanel({id,locale,answers,openQuestionIndices}:{
 id:string;locale:'vi'|'en';answers:readonly string[];
 openQuestionIndices:readonly number[];
}){
 const vi=locale==='vi';
 const [availability,setAvailability]=useState<Availability|null>(null);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [message,setMessage]=useState('');
 const exactCount=answers.length-openQuestionIndices.length;
 const openAnswers=openQuestionIndices.map(index=>({index,answer:answers[index]}));
 // The shared GitHub Pages app is static. Never send private answers to
 // a cross-origin URL or pretend production's authenticated Worker exists.
 useEffect(()=>{
  setFeedback('');setMessage('');
  if(IS_GITHUB_STAGING||!navigator.onLine||openQuestionIndices.length===0)return;
  let live=true;
  void fetch('/api/ai/access',{credentials:'same-origin',cache:'no-store'})
   .then(async r=>r.ok?await r.json() as Availability:null)
   .then(value=>{if(live)setAvailability(value);})
   .catch(()=>{if(live)setAvailability(null);});
  return()=>{live=false;};
 },[id,openQuestionIndices.length]);
 async function review(){
  if(busy||IS_GITHUB_STAGING||!availability?.enabledForMe||!availability.ready||
   !navigator.onLine||openAnswers.length===0)return;
  setBusy(true);setMessage('');setFeedback('');
  try{
   const response=await fetch('/api/ai/feedback',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    // Exact-answer questions are excluded even from the network payload.
    body:JSON.stringify({lessonId:id,locale,openAnswers})
   });
   const data=await response.json() as Result;
   if(!response.ok||data.basis!=='unverified-ai-coaching'||
      typeof data.feedback!=='string')throw Error(data.error||'AI_UNAVAILABLE');
   setFeedback(data.feedback);
  }catch{
   setMessage(vi?
    'AI chưa phản hồi được hoặc Cloudflare đã hết quota miễn phí. Đáp án chuẩn và rubric vẫn dùng được.':
    'AI is unavailable or the free Cloudflare quota is exhausted. The reference answer and rubric still work.');
  }finally{setBusy(false);}
 }
 return <section className="li-learning-next-action" aria-label={vi?'Lão Lý AI':'Lao Ly AI'}>
  <Heading level={3} role="titleMedium">{vi?'Lão Lý AI · câu hỏi mở':'Lao Ly AI · open questions'}</Heading>
  {exactCount>0&&<Text role="support">{vi?
   exactCount+' câu có đáp án xác định được đối chiếu trực tiếp với đáp án/rubric, không gửi AI.':
   exactCount+' exact-answer question(s) use the reference answer/rubric, not AI.'}</Text>}
  {openQuestionIndices.length===0?
   <Text role="support">{vi?
    'Bài này chỉ có câu hỏi đáp án xác định: không cần gọi AI.':
    'This task contains only exact-answer questions, so no AI call is needed.'}</Text>:
   IS_GITHUB_STAGING?
    <Text role="support">{vi?
     'Bản GitHub Pages staging không gọi AI. Cần Cloudflare backend được cấu hình và duyệt phát hành.':
     'GitHub Pages staging does not call AI until the Cloudflare backend is configured and released.'}</Text>:
    availability?.enabledForMe&&availability.ready?
     <>
      <Text role="support">{vi?
       'Chỉ gửi câu trả lời mở đã nộp cùng đáp án/rubric đã duyệt khi nhấn nút. Không tự chấm điểm.':
       'Only submitted open-ended answers and their reviewed rubric are sent on click. No automatic grade.'}</Text>
      <Button disabled={busy||!navigator.onLine} onClick={()=>void review()}>
       {busy?(vi?'Đang nhận xét…':'Reviewing…'):
        vi?'Nhận feedback AI':'Get AI feedback'}</Button>
      <Text role="support">{vi?
       'Không giới hạn 12 lượt trong app; Cloudflare Workers Free sẽ tự dừng khi hết quota Neurons.':
       'No 12-request app cap; Workers Free stops calls when its Neuron quota is exhausted.'}</Text>
     </>:
     <Text role="support">{vi?
      'Tài khoản này chưa được cấp AI hoặc backend chưa cấu hình. Vẫn tự đối chiếu bình thường.':
      'AI is not assigned or configured; deterministic self-review remains available.'}</Text>}
  {message&&<Text role="support">{message}</Text>}
  {feedback&&<div aria-live="polite" role="status">
   <Text role="body">{feedback}</Text>
   <Text role="support">{vi?
    'Gợi ý AI có thể sai; so với đáp án/rubric gốc. Không phải điểm hay chứng nhận thành thạo.':
    'AI can be wrong; verify against the reviewed key and rubric. Not a grade or mastery claim.'}</Text>
  </div>}
 </section>;
}
