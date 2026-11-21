import React,{useEffect,useState} from 'react';
import {Button} from '../../../../design-system/react/Components';
import {Text} from '../../../../design-system/react/Atoms';

export type AnalysisStep='guided'|'practice'|'feedback'|'progress'|'case';
type Locale='vi'|'en';
export type AnalysisContext={
 title:string;
 lessonId?:string;
 activity:string;
 questions?:readonly string[];
 answers?:readonly string[];
 reference?:string;
 extra?:string;
};
function clean(value:string|undefined):string{
 return (value||'').trim().slice(0,12000);
}
export function buildAnalysisPrompt(locale:Locale,step:AnalysisStep,data:AnalysisContext):string{
 const vi=locale==='vi';
 const stepName:Record<AnalysisStep,[string,string]>={
  guided:['Step 2 · Thử áp dụng','Step 2 · Guided practice'],
  practice:['Step 4 · Làm bài','Step 4 · Independent practice'],
  feedback:['Đối chiếu bài làm','Feedback and review'],
  progress:['Step 5 · Tiến độ','Step 5 · Progress'],
  case:['Phản Chứng · Luận kết đã lưu','Challenge · Saved conclusion']
 };
 const parts=[
  vi?'Tôi đang học trong app li. (理). Hãy đóng vai người hướng dẫn phản biện bài làm của tôi, không tự nhận đã truy cập app hay dữ liệu ngoài prompt.':
   'I am learning in li. (理). Act as a critical learning coach. Do not claim to have accessed the app or data beyond this prompt.',
  (vi?'Bài / tình huống: ':'Lesson / case: ')+clean(data.title)+(data.lessonId?' ('+data.lessonId+')':''),
  (vi?'Giai đoạn: ':'Stage: ')+stepName[step][vi?0:1],
  (vi?'Nội dung / nhiệm vụ: ':'Activity / task: ')+clean(data.activity)
 ];
 if(data.questions?.length)parts.push((vi?'Câu hỏi:':'Questions:')+'\n'+data.questions.map((q,i)=>`${i+1}. ${clean(q)}`).join('\n'));
 if(data.answers?.length)parts.push((vi?'Bài làm của tôi:':'My responses:')+'\n'+data.answers.map((a,i)=>`${i+1}. ${clean(a)||(vi?'[Chưa trả lời]':'[Not answered]')}`).join('\n'));
 if(clean(data.reference))parts.push((vi?'Phản hồi / đáp án đã được phép xem: ':'Feedback / already revealed reference: ')+clean(data.reference));
 if(clean(data.extra))parts.push((vi?'Bối cảnh bổ sung: ':'Additional context: ')+clean(data.extra));
 const directions=vi?[
  'Chỉ phân tích dựa trên thông tin tôi đã cung cấp. Phân biệt dữ kiện, suy luận và điều chưa xác minh; không bịa nguồn, trích dẫn hay điểm số.',
  step==='guided'||step==='practice'?
   'Chưa tiết lộ lời giải hoặc đáp án cuối. Hãy nhận xét lập luận, nêu điểm mạnh, chỗ thiếu và gợi ý từng bước để tôi tự sửa.':
   'Đối chiếu lập luận với dữ kiện/phản hồi có sẵn; chỉ ra chỗ đúng, chỗ sai hoặc thiếu cơ sở và cách cải thiện cụ thể.',
  step==='progress'?
   'Đề xuất một việc cần ôn ưu tiên và hai câu active recall dựa trên bài làm này, không tự đánh dấu đã thông thạo.':
   'Đặt hai câu hỏi gợi mở để tôi tự kiểm tra mức hiểu; không tự nộp bài hoặc thay đổi tiến độ.',
  'Nếu thiếu ngữ cảnh để kết luận, hãy nói rõ cần thêm gì. Trả lời bằng tiếng Việt, ngắn gọn, có ví dụ sát bài.'
 ]:[
  'Analyze only the information provided. Distinguish evidence, inference, and unverified claims. Do not fabricate sources, citations, or scores.',
  step==='guided'||step==='practice'?
   'Do not reveal the final solution yet. Critique my reasoning, identify gaps, and offer scaffolded hints so I can improve it myself.':
   'Compare my reasoning with the available evidence and already revealed feedback; identify strengths, errors, missing support, and specific improvements.',
  step==='progress'?
   'Suggest one priority for review and two active-recall questions. Do not claim mastery.':
   'Ask two probing recall questions. Do not submit anything or change my progress.',
  'If essential context is missing, explicitly ask for it. Respond concisely in English with a relevant example.'
 ];
 return parts.join('\n\n')+'\n\n'+directions.map((x,i)=>`${i+1}. ${x}`).join('\n');
}
async function copyPrompt(value:string):Promise<void>{
 if(navigator.clipboard?.writeText&&window.isSecureContext){
  await navigator.clipboard.writeText(value);return;
 }
 const textarea=document.createElement('textarea');
 textarea.value=value;textarea.readOnly=true;
 textarea.style.cssText='position:fixed;left:-9999px;opacity:0';
 document.body.appendChild(textarea);textarea.focus();textarea.select();
 try{if(!document.execCommand('copy'))throw Error('COPY_FAILED');}
 finally{textarea.remove();}
}
export function CopyAnalysisPrompt({locale,step,data}:{
 locale:Locale;step:AnalysisStep;data:AnalysisContext;
}){
 const [status,setStatus]=useState<'idle'|'copied'|'error'>('idle');
 const prompt=buildAnalysisPrompt(locale,step,data);
 useEffect(()=>setStatus('idle'),[prompt]);
 const vi=locale==='vi';
 return <div className="li-learning-copy-prompt" data-li-copy-analysis={step}>
  <Text role="support">{vi?
   'Muốn ChatGPT phân tích bài của ngươi? Copy prompt rồi dán vào cuộc trò chuyện. Không tự gửi dữ liệu.':
   'Want ChatGPT to review your work? Copy and paste the prompt into a chat. Nothing is sent automatically.'}</Text>
  <Button variant="secondary" onClick={()=>void copyPrompt(prompt)
   .then(()=>setStatus('copied')).catch(()=>setStatus('error'))}>
   {status==='copied'?(vi?'Đã copy prompt':'Prompt copied'):(vi?'Copy prompt phân tích':'Copy analysis prompt')}
  </Button>
  {status==='error'&&<Text role="support" aria-live="polite">{vi?
   'Không thể sao chép. Hãy thử lại trên kết nối HTTPS.':
   'Copy failed. Please try again on HTTPS.'}</Text>}
  {status==='copied'&&<Text role="support" aria-live="polite">{vi?
   'Đã sao chép · Dán vào ChatGPT để xem phân tích.':
   'Copied · Paste into ChatGPT to get feedback.'}</Text>}
 </div>;
}
