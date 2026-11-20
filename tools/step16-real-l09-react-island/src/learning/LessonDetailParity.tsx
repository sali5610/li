import React,{useEffect,useState} from 'react';
import {Button,Card,Heading,Text} from '../../../../design-system/react/index';
import './lesson-detail-parity.css';

/** Strictly additive components missing from the old 7-part published Hi-Fi lessons.
 * Source metadata and figures come from existing published materials. The current
 * answer/save gates stay in each canonical React journey; no hidden native lesson
 * markup or new private writer is introduced here. */
export type LessonId='L03-1-2'|'L09-1-2'|'L15-2-2';
export type Locale='vi'|'en';
export type LessonSource={title:string;url:string;tier:string;usage?:string};
export type ReferenceLabels={
 sourcesTitle:string;sourcesLead:string;sourceNote:string;queriesTitle:string;
 openSource:string;copySource?:string;copyPrompt?:string;allPrompt:string;
 openChat:string;tiers:Record<string,string>;copied?:string;copyFailed?:string
};
type BookmarkOwner={
 isSaved:(kind:string,id:string)=>boolean;
 toggle:(kind:string,id:string)=>boolean
};
type LessonWindow=Window&{
 liBookmarks?:BookmarkOwner;liLessonCompanion?:{getContext:()=>{
  lesson_id:string;wording?:{label:string;prompt:string}
 }|null};
 liMethods?:{open:(method:string,practice?:boolean,lessonId?:LessonId|null)=>boolean};
 openLaoLy?:(trigger?:HTMLElement|null)=>void;
 toast?:(text:string)=>void
};
const app=window as LessonWindow;
/** The published lesson's optional spell keeps its lesson ID and returns via
 * the real React app route. The native exercise engine remains one checker. */
export function openLessonSpell(lessonId:LessonId,methodId:string,practice:boolean):boolean{
 if(!document.documentElement.classList.contains('li-auth-verified')||
  document.documentElement.classList.contains('li-account-open'))return false;
 return app.liMethods?.open(methodId,practice,lessonId)===true;
}
const queryByLesson:Record<LessonId,readonly string[]>={
 'L09-1-2':[
  'sampling bias vs random sampling variation','selection bias survey example',
  'nonresponse bias statistics','site:cdc.gov CASPER sampling methodology',
  'site:openstax.org sampling variation'
 ],
 'L03-1-2':[
  'leading questions in user interviews','open ended vs neutral UX questions',
  'site:gov.uk/service-manual/user-research in depth interviews',
  'site:digital.gov interview checklist'
 ],
 'L15-2-2':[
  'reorder point versus order quantity','inventory position on hand on order backorders',
  'safety stock lead time variability',
  'continuous review inventory reorder point formula'
 ]
};
function external(url:string):boolean{
 try{const u=new URL(url);return u.protocol==='https:';}catch{return false;}
}
function buildPrompt(id:LessonId,locale:Locale,sources:LessonSource[],subject:string,conceptTitle:string){
 const list=sources.map(x=>'- '+x.title+': '+x.url).join('\n');
 if(id==='L09-1-2'){
  const start=locale==='vi'?
   'Tôi đang học bài L09-1-2 của li. (理): Sampling Bias vs Random Sampling Variation. Mục tiêu: phân biệt sai lệch chọn mẫu với biến động ngẫu nhiên; không suy rộng hơn dữ liệu.\nNguồn:\n':
   'I am studying li. (理) lesson L09-1-2: Sampling Bias versus Random Sampling Variation. Focus on sampling mechanisms, chance variation and evidence-based inference.\nSources:\n';
  const end=locale==='vi'?
   '\n\nHãy chỉ tóm tắt những gì bạn thực sự truy cập được. Nếu link bị chặn, không có toàn văn hoặc không đọc được, hãy nói rõ và nhờ tôi dán phần liên quan; không bịa nội dung/trích dẫn. Trả lời bằng tiếng Việt: 1) 5 ý chính, 2) target population, sample, selection bias, nonresponse và random sampling variation, 3) điều nguồn nói và phần suy luận riêng, 4) ví dụ khảo sát qua banner và giới hạn kết luận, 5) giả định/điểm cần kiểm chứng, 6) 3 câu active recall không hiện đáp án. Kèm đúng URL cho từng nhận định được nguồn hỗ trợ.':
   '\n\nSummarize only what you actually access. If a page is blocked or you lack the full text, say so and ask me to paste relevant material; do not fabricate citations. In English give: (1) five main points, (2) target population, sample, selection bias, nonresponse and random sampling variation, (3) what each source establishes versus your inference, (4) a banner-survey case and inference limits, (5) assumptions and cautions, (6) three active recall questions without showing answers. Cite actual accessed source URLs.';
  return start+list+end;
 }
 // Equivalent to the old L03/L15 authored source-aware copy workflow.
 const start=locale==='vi'?
  'Tôi đang học bài '+id+' thuộc '+subject+' trong app li. (理), nội dung đã chốt: '+conceptTitle+'.\nNguồn đọc:\n':
  'I am studying li. (理) lesson '+id+' in '+subject+': '+conceptTitle+'.\nSources:\n';
 const end=locale==='vi'?
  '\n\nChỉ tóm tắt phần bạn thực sự truy cập. Nếu URL bị chặn hoặc không có toàn văn, hãy nói rõ và đề nghị tôi dán nội dung, tuyệt đối không bịa trích dẫn. Trả lời bằng tiếng Việt: 1) tóm tắt 5 ý có link nguồn; 2) định nghĩa các khái niệm của bài; 3) tách điều nguồn nói và suy luận; 4) phân tích một tình huống thực tế cùng giới hạn suy rộng; 5) giả định/cảnh báo; 6) ba câu active recall không hiện đáp án. Nếu nguồn có mô hình khác bài học, hãy giải thích sự khác biệt thay vì ép đồng nhất.':
  '\n\nSummarize only materials you can actually access. If URLs are blocked or full text is missing, say so and request excerpts rather than inventing citations. In English: (1) five source-linked insights; (2) main concepts; (3) verified source claims versus your inferences; (4) a practical case with limits; (5) assumptions and cautions; and (6) three active recall questions without immediate answers. Explain differences if a source uses a different model.';
 return start+list+end;
}
async function copyText(text:string){
 if(navigator.clipboard&&window.isSecureContext){
  await navigator.clipboard.writeText(text);return;
 }
 const area=document.createElement('textarea');area.value=text;area.readOnly=true;
 area.style.cssText='position:fixed;left:-9999px;opacity:0';
 document.body.appendChild(area);area.select();
 try{if(!document.execCommand('copy'))throw Error('COPY_FAILED');}finally{area.remove();}
}
/** Existing lesson/case bookmark store, including undo and remote sync, is the
 * only write owner. A real React icon button replaces the missing native one.
 */
type LessonPhase='read'|'guided'|'practice'|'feedback'|'progress';
/** The original seven-section lesson index, retained alongside the gated study
 * workflow. The index cannot reveal feedback/model answers before submission. */
export function LessonSectionIndex({id,locale,links,onPhase,submitted}:{
 id:LessonId;locale:Locale;links:readonly string[];
 onPhase:(next:LessonPhase)=>void;submitted:boolean
}){
 const go=(index:number)=>{
  if(index===6){
   document.getElementById('li-react-'+id+'-sources')
    ?.scrollIntoView({block:'start',behavior:'smooth'});return;
  }
  if(index===2&&id==='L09-1-2'){
   document.getElementById('li-react-l09-illustrations')
    ?.scrollIntoView({block:'start',behavior:'smooth'});return;
  }
  const next:LessonPhase=index<3?'read':index===3?'guided':index===4?'practice':'feedback';
  onPhase(next);
 };
 return <nav className="li-lesson-seven-index" aria-label={
  locale==='vi'?'Mục lục 7 phần bài học':'Seven-section lesson index'}>
  <strong>{locale==='vi'?'MỤC LỤC BÀI HỌC':'LESSON OUTLINE'}</strong>
  <div className="li-lesson-seven-list">{links.map((label,index)=>
   <Button key={index} variant="ghost" disabled={index===5&&!submitted}
    onClick={()=>go(index)}>
    <span aria-hidden="true">{String(index+1).padStart(2,'0')} · </span>{label}
   </Button>)}</div>
 </nav>;
}
export function LessonBookmark({id,locale}:{id:LessonId;locale:Locale}){
 const [saved,setSaved]=useState(()=>app.liBookmarks?.isSaved('lesson',id)??false);
 useEffect(()=>{
  const refresh=()=>setSaved(app.liBookmarks?.isSaved('lesson',id)??false);
  for(const ev of ['li:library-view-changed','li:personal-sync-applied','li:localechange'])
   window.addEventListener(ev,refresh);
  return()=>{for(const ev of ['li:library-view-changed','li:personal-sync-applied','li:localechange'])
   window.removeEventListener(ev,refresh);};
 },[id]);
 const label=locale==='vi'?(saved?'Bỏ lưu bài ':'Lưu bài ')+id:
  (saved?'Remove bookmark for ':'Bookmark lesson ')+id;
 return <Button variant="ghost" className="li-lesson-bookmark"
  aria-label={label} title={label} aria-pressed={saved} onClick={()=>{
   if(!app.liBookmarks)return;
   app.liBookmarks.toggle('lesson',id);
   setSaved(app.liBookmarks.isSaved('lesson',id));
  }}>
  <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"
   fill={saved?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8"
   strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
 </Button>;
}
export function LessonMentor({id,locale}:{id:LessonId;locale:Locale}){
 const [context,setContext]=useState('');
 useEffect(()=>{
  const refresh=()=>{
   const c=app.liLessonCompanion?.getContext?.();
   if(c?.lesson_id===id&&c.wording)
    setContext(c.wording.label+' · '+c.wording.prompt);
   else setContext('');
  };
  refresh();
  for(const evt of ['scroll','li:localechange','li:lesson-phase-changed'])window.addEventListener(evt,refresh,{passive:true});
  return()=>{for(const evt of ['scroll','li:localechange','li:lesson-phase-changed'])window.removeEventListener(evt,refresh);};
 },[id]);
 return <section className="li-lesson-companion" aria-label={locale==='vi'?'Lão Lý đồng hành':'Lao Ly companion'}>
  <div className="kicker">{locale==='vi'?'LÃO LÝ ĐỌC CÙNG NGƯƠI':'LEARN WITH LAO LY'}</div>
  <Text role="support" data-lesson-mentor-stage="true" id={'li-react-mentor-'+id}>
   {context||(locale==='vi'?
    'Lão đang theo dõi phần học hiện tại để hỏi đúng vấn đề.':
    'Lao Ly follows the active section to ask a relevant question.')}
  </Text>
  <Button variant="secondary" onClick={event=>app.openLaoLy?.(event.currentTarget)}>
   {locale==='vi'?'Hỏi Lão Lý theo bài học':'Ask Lao Ly about this lesson'}
  </Button>
 </section>;
}
export function L09Figures({locale,copy}:{
 locale:Locale;copy:{
  figKicker:string;figTitle:string;
  fig1:string;fig1Note:string;fig2:string;fig2Note:string;missingImg?:string
 }
}){
 const figures=[
  {src:'https://upload.wikimedia.org/wikipedia/commons/b/bf/Simple_random_sampling.PNG',
   link:'https://commons.wikimedia.org/wiki/File:Simple_random_sampling.PNG',
   credit:'Dan Kernler · CC BY-SA 4.0 · Wikimedia Commons',
   title:copy.fig1,note:copy.fig1Note},
  {src:'https://upload.wikimedia.org/wikipedia/commons/a/a7/Statistical_bias_and_statistical_noise_illustration_No_text_in_image.png',
   link:'https://commons.wikimedia.org/wiki/File:Statistical_bias_and_statistical_noise_illustration_No_text_in_image.png',
   credit:'Tim Isaksson · CC BY-SA 4.0 · Wikimedia Commons',
   title:copy.fig2,note:copy.fig2Note}
 ];
 return <section className="li-lesson-illustrations" aria-label={copy.figTitle}
  id="li-react-l09-illustrations">
  <div className="kicker">{copy.figKicker}</div>
  <Heading level={2} role="titleLarge">{copy.figTitle}</Heading>
  <div className="li-lesson-figure-grid">
   {figures.map(figure=><LessonFigure key={figure.src} {...figure}
    fallback={copy.missingImg||'Open the original illustration and license.'}
    openLabel={locale==='vi'?'Xem ảnh gốc':'View original image'}/>)}
  </div>
 </section>;
}
export function LessonFigure({src,link,credit,title,note,fallback,openLabel}:{
 src:string;link:string;credit:string;title:string;note:string;fallback:string;openLabel:string
}){
 const [failed,setFailed]=useState(false);
 return <figure className="li-learning-visual li-lesson-figure">
  <div className="li-lesson-figure-media">
   {!failed&&<img src={src} loading="lazy" alt={title+'. '+note}
    onError={()=>setFailed(true)}/>}
   {failed&&<Text role="support">{fallback}</Text>}
  </div>
  <figcaption>
   <strong>{title}</strong>
   <Text role="support">{note}</Text>
   <a href={link} target="_blank" rel="noopener noreferrer">
    {openLabel} · {credit}</a>
  </figcaption>
 </figure>;
}
export function LessonSources({id,locale,copy,sources,subject,conceptTitle,onSearch}:{
 id:LessonId;locale:Locale;copy:ReferenceLabels;sources:LessonSource[];
 subject:string;conceptTitle:string;onSearch:(query:string)=>void
}){
 const [feedback,setFeedback]=useState('');
 const safe=sources.filter(s=>external(s.url));
 const copyPrompt=async(source?:LessonSource)=>{
  try{
   await copyText(buildPrompt(id,locale,source?[source]:safe,subject,conceptTitle));
   setFeedback(copy.copied||(locale==='vi'?'Đã copy prompt.':'Prompt copied.'));
  }catch{
   setFeedback(copy.copyFailed||(locale==='vi'?'Không thể sao chép.':'Clipboard unavailable.'));
  }
 };
 const queries=queryByLesson[id];
 return <section className="li-learning-sources li-lesson-reference-extra"
  id={'li-react-'+id+'-sources'} aria-label={copy.sourcesTitle}>
  <div className="kicker">{locale==='vi'?'VII · ĐÀO SÂU':'VII · LEARN MORE'}</div>
  <Heading level={2} role="titleLarge">{copy.sourcesTitle}</Heading>
  <Text role="support">{copy.sourcesLead}</Text>
  <div className="li-learning-source-list">
   {safe.map(source=><Card variant="raised" key={source.url} className="li-learning-source-item">
    <div className="kicker">{copy.tiers[source.tier]||source.tier}</div>
    <strong>{source.title}</strong>
    <div className="li-learning-reference-actions">
     <a href={source.url} target="_blank" rel="noopener noreferrer">
      {copy.openSource}</a>
     <Button variant="secondary" onClick={()=>void copyPrompt(source)}>
      {copy.copySource||copy.copyPrompt||(locale==='vi'?'Copy prompt':'Copy prompt')}
     </Button>
    </div>
   </Card>)}
  </div>
  <div className="section-rule"/>
  <Heading level={3} role="titleMedium">{copy.queriesTitle}</Heading>
  <div className="li-learning-keywords">
   {queries.map(query=><Button key={query} variant="ghost" onClick={()=>onSearch(query)}>
    {query}</Button>)}
  </div>
  <div className="li-learning-reference-actions">
   <Button variant="primary" onClick={()=>void copyPrompt()}>{copy.allPrompt}</Button>
   <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">{copy.openChat}</a>
  </div>
  {feedback&&<Text role="support" aria-live="polite">{feedback}</Text>}
  <Text role="support">{copy.sourceNote}</Text>
 </section>;
}
