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
/** Copy locally before requesting external navigation; never put the prompt in a URL. */
export function CopyPromptAction({locale,prompt,disabled=false,variant='secondary'}:{
 locale:Locale;prompt:string;disabled?:boolean;variant?:'primary'|'secondary'|'ghost';
}){
 const [status,setStatus]=useState<'idle'|'copying'|'copied'|'error'>('idle');
 useEffect(()=>setStatus('idle'),[prompt]);
 const vi=locale==='vi';
 const open=()=>{
  setStatus('copied');
  // Best-effort iOS app switch. A PWA cannot determine app installation.
  if(/iPhone|iPad|iPod/.test(navigator.userAgent)||
     (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
   try{window.location.href='chatgpt://';return;}catch{/* HTTPS below */}
  }
  window.open('https://chatgpt.com/','_blank','noopener,noreferrer');
 };
 const activate=()=>{
  setStatus('copying');
  // Synchronous clipboard command preserves the user gesture on iOS.
  // Modern clipboard API is the fallback when the command is unavailable.
  const area=document.createElement('textarea');
  area.value=prompt;area.readOnly=true;
  area.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
  const previous=document.activeElement as HTMLElement|null;
  let copied=false;
  document.body.appendChild(area);
  try{area.focus({preventScroll:true});area.select();area.setSelectionRange(0,area.value.length);
   copied=document.execCommand('copy');}catch{/* modern clipboard fallback */}
  finally{area.remove();previous?.focus({preventScroll:true});}
  if(copied){open();return;}
  if(!navigator.clipboard?.writeText){setStatus('error');return;}
  void navigator.clipboard.writeText(prompt).then(open,()=>setStatus('error'));
 };
 return <>
  <Button variant={variant} disabled={disabled||status==='copying'} onClick={activate}>
   {status==='copying'?(vi?'Đang sao chép…':'Copying…'):
    (vi?'Sao chép & mở ChatGPT':'Copy & open ChatGPT')}
  </Button>
  {status==='error'&&<Text role="support" aria-live="polite">{vi?
   'Chưa sao chép được. Hãy thử lại.':'Copy failed. Please try again.'}</Text>}
  {status==='copied'&&<><Text role="support" aria-live="polite">{vi?
   'Đã sao chép. Dán prompt vào ChatGPT khi sẵn sàng.':'Copied. Paste into ChatGPT when ready.'}</Text>
   <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">{vi?
    'Không mở được app? Mở ChatGPT trên web':'App did not open? Open ChatGPT on web'}</a></>}
 </>;
}
export function CopyAnalysisPrompt({locale,step,data,disabled=false}:{
 locale:Locale;step:AnalysisStep;data:AnalysisContext;disabled?:boolean;
}){
 const prompt=buildAnalysisPrompt(locale,step,data);
 const vi=locale==='vi';
 return <div className="li-learning-copy-prompt" data-li-copy-analysis={step}>
  <Text role="support">{vi?
   'Prompt có thể chứa bài làm của ngươi. Chỉ sao chép vào bộ nhớ tạm; ngươi tự quyết định dán và gửi.':
   'The prompt may include your answers. It is copied locally; you decide whether to paste and send.'}</Text>
  <CopyPromptAction locale={locale} prompt={prompt} disabled={disabled}/>
 </div>;
}
