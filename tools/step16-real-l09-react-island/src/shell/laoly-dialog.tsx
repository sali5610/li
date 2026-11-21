import React,{useEffect,useRef,useState} from 'react';
import {openRoute} from './app-router.js';
import {createRoot} from 'react-dom/client';
import {Button,ChatBubble,LiIcon} from '../../../../design-system/react/index';
import '../../../../design-system/react/legacy.css';
import './laoly-dialog.css';
import spellGuides from '../../../../content/editorial/l2-spell-guides.v1.json';

/** Full React visual owner for the existing Lão Lý bubble.
 * Keeps the first-party contextual plan engine, all its real actions,
 * quotation provenance + rotation and draggable avatar unchanged.
 * No LLM, no duplicate language/persona/quote database or private writer. */
type QuoteView={
 id:string;original:string;lang:string;translation:string;
 interpretation:string;meta:string;url:string;comment:string
};
type EditorialBuddy={actions:{label:string;reply:string}[];quotes?:QuoteView[]};
type BuddyView={
 text:string;labels:string[];avatar:string;quote:QuoteView|null;triggerId:string;
 relatedLesson?:{id:string;route:string}|null;
 /** Structured lesson extension; real native mentor actions remain unchanged. */
 editorial?:EditorialBuddy;
};
type SpellComparison={from:string;to:string};
type BuddyReply={text:string;showChallenge:boolean;comparison?:SpellComparison|null};
type BuddyPort={open:(trigger?:HTMLElement|null)=>BuddyView|null;choose:(index:number)=>BuddyReply|null};
type AppWindow=Window&{
 liBuddyEngine?:BuddyPort;
 liBuddyReactMounted?:boolean;
 liCompanionDrag?:{getAvatar?:()=>string};
 liLanguage?:{get?:()=>string;translateComposed?:(value:string)=>string};
 liAddressLine?:(text:string)=>string;
 liMethods?:{getView:()=>{methods:{id:string;title:string;purpose:string;original:string}[]};
  open:(id:string)=>boolean};
 liReleasedLessonRoutes?:Readonly<Record<string,string>>;
 liPersonalStudyRoutes?:Readonly<Record<string,string>>;
 liAppRouter?:{hasRoute:(route:string)=>boolean}
};
const app=window as AppWindow;
const chooseLanguage=(vi:string,en:string)=>app.liLanguage?.get?.()==='en'?en:vi;
const debateCorrect='Cuối cùng cũng chịu dùng đến bộ não rồi đấy. Nhà thông thái, ngươi đã bắt đúng lỗi suy rộng từ người dùng sang toàn thị trường. Lão xin rút kết luận.';
const debateWrong='Ồ, một cách suy luận rất sáng tạo. Tiếc là sai. Nhóc, lão chỉ hỏi người đang dùng; người chưa dùng có thể nghĩ khác. Đừng bắt mẫu khảo sát gánh cả thị trường.';
const withNickname=(text:string)=>app.liAddressLine?app.liAddressLine(text):text;

export function BuddyDialog({root}:{root:HTMLElement}){
 const [open,setOpen]=useState(false);
 const [view,setView]=useState<BuddyView|null>(null);
 const [message,setMessage]=useState('');
 const [quoteIndex,setQuoteIndex]=useState(0);
 const [challenge,setChallenge]=useState(false);
 const [comparison,setComparison]=useState<SpellComparison|null>(null);
 const [,setLocale]=useState(0);
 const [avatar,setAvatar]=useState('');
 const heading=useRef<HTMLHeadingElement|null>(null);
 const content=useRef<HTMLDivElement|null>(null);
 const restore=useRef<string>('laoly-fab');
 const current=useRef<BuddyView|null>(null);
 const close=(restoreFocus=true)=>{
  setOpen(false);setChallenge(false);setComparison(null);
  root.classList.remove('open');
  if(restoreFocus){
   const focusId=restore.current;
   requestAnimationFrame(()=>{
    (document.getElementById(focusId)||document.getElementById('laoly-fab'))
     ?.focus({preventScroll:true});
   });
  }
 };
 useEffect(()=>{
  const onOpen=(event:Event)=>{
   if(!document.documentElement.classList.contains('li-auth-verified'))return;
   const next=(event as CustomEvent<BuddyView>).detail;
   if(!next||!Array.isArray(next.labels))return;
   const editorial=next.editorial;
   if(editorial){
    if(editorial.actions?.length!==2||
      editorial.actions.some(action=>!action.label||!action.reply)||
      (editorial.quotes!==undefined&&(editorial.quotes.length<3||
       editorial.quotes.some(quote=>!quote.original||!quote.meta||!quote.url?.startsWith('https://')))))
     return;
   }
   current.current=next;
   restore.current=next.triggerId||'laoly-fab';
   setView(next);setMessage(next.text);setAvatar(next.avatar);
   setChallenge(false);setComparison(null);setQuoteIndex(0);setOpen(true);
   // Reopening the dialog must start at the conversation, not the last quote scroll.
   requestAnimationFrame(()=>content.current?.scrollTo({top:0,behavior:'auto'}));
   root.dataset.trigger=restore.current;
  };
  const onClose=()=>close();
  const language=()=>setLocale(v=>v+1);
  const mode=()=>setAvatar(app.liCompanionDrag?.getAvatar?.()||current.current?.avatar||'');
  const guard=new MutationObserver(()=>{
   if(!document.documentElement.classList.contains('li-auth-verified')){
    setOpen(false);setView(null);setMessage('');setChallenge(false);setComparison(null);
    current.current=null;root.classList.remove('open');
   }
  });
  guard.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  window.addEventListener('li:buddy-open',onOpen);
  window.addEventListener('li:buddy-close',onClose);
  window.addEventListener('li:localechange',language);
  window.addEventListener('li:study-mode-applied',mode);
  app.liBuddyReactMounted=true;
  return()=>{
   guard.disconnect();app.liBuddyReactMounted=false;
   window.removeEventListener('li:buddy-open',onOpen);
   window.removeEventListener('li:buddy-close',onClose);
   window.removeEventListener('li:localechange',language);
   window.removeEventListener('li:study-mode-applied',mode);
  };
 },[root]);
 useEffect(()=>{
  root.classList.toggle('open',open);
  if(open)requestAnimationFrame(()=>heading.current?.focus());
 },[open,root]);
 // iOS Safari may restore a previous overflow offset after React commits.
 // Start every opened/changed citation at its heading, not mid-dialog text.
 useEffect(()=>{
  if(!open)return;
  const frame=requestAnimationFrame(()=>content.current?.scrollTo({top:0,behavior:'instant'}));
  return()=>cancelAnimationFrame(frame);
 },[open,view,quoteIndex]);
 const onKeyDown=(event:React.KeyboardEvent)=>{
  if(event.key==='Escape'){
   event.preventDefault();event.stopPropagation();close();return;
  }
  if(event.key!=='Tab')return;
  const nodes=Array.from(root.querySelectorAll<HTMLElement>(
   'button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]'
  )).filter(el=>el.getClientRects().length>0);
  if(!nodes.length)return;
  const first=nodes[0],last=nodes[nodes.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 };
 const choose=(index:number)=>{
  if(view?.editorial){
   const reply=view.editorial.actions[index];
   if(!reply)return;
   setMessage(reply.reply);setChallenge(false);setComparison(null);
  }else{
   const reply=app.liBuddyEngine?.choose(index);
   if(!reply)return;
   setMessage(reply.text);setChallenge(reply.showChallenge);
   const next=reply.comparison;
   setComparison(next&&/^T(?:0[1-9]|1[0-3])$/.test(next.from)&&
    /^T(?:0[1-9]|1[0-3])$/.test(next.to)&&next.from!==next.to?next:null);
  }
  content.current?.scrollTo({top:0,behavior:'auto'});
 };
 const submitDebate=(correct:boolean)=>{
  const words=withNickname(correct?debateCorrect:debateWrong);
  setMessage(app.liLanguage?.translateComposed?.(words)||words);
  setChallenge(false);
 };
 if(!view)return null;
 const quote=view.editorial?.quotes?.[quoteIndex]??view.quote;
 const spellMethods=app.liMethods?.getView?.().methods||[];
 const compareTarget=comparison?spellMethods.find(x=>x.id===comparison.to):null;
 const sourceFor=(id:string)=>{
  const guide=spellGuides.methods[id as keyof typeof spellGuides.methods];
  return guide?.[chooseLanguage('vi','en') as 'vi'|'en']||null;
 };
 const openCompared=()=>{
  if(!compareTarget)return;
  const id=compareTarget.id;
  close(false);
  app.liMethods?.open(id);
 };
 const openRelatedLesson=()=>{
  const related=view.relatedLesson;
  if(!related)return;
  const released=app.liReleasedLessonRoutes?.[related.id]===related.route;
  const personal=app.liPersonalStudyRoutes?.[related.id]===related.route;
  // Only mounted, registry-backed lessons are clickable. The canonical
  // router preserves Back history; a Case draft stays on its mounted screen.
  if(!(released||personal)||!app.liAppRouter?.hasRoute(related.route))return;
  if(openRoute(related.route))close(false);
 };
 const quoteVisible=!challenge&&!!quote&&(!!view.editorial||message===view.text);
 return <div className="buddy-shell li-react-buddy-shell" onKeyDown={onKeyDown}>
  <div className="dialog">
   <header className="buddy-heading">
    <img id="buddy-title-avatar" src={avatar||view.avatar} alt=""
     width={48} height={48} decoding="async"/>
    {/* Keep an accessible dialog name for VoiceOver without a visible title. */}
    <h2 id="buddy-title" className="li-buddy-sr-title"
     ref={heading} tabIndex={-1}>{chooseLanguage('Lão Lý','Elder Ly')}</h2>
    {quoteVisible&&<ChatBubble surface="paper" tail="left" className="li-buddy-quote-thought">
     <details key={quote.id}>
     <summary aria-label={chooseLanguage('Câu Lão Lý đang nghĩ. Chạm để xem diễn nghĩa và nguồn','What Elder Ly is thinking. Expand for translation and source')}>
      <span id="buddy-quote-original" className="ly-original" lang={quote.lang}>{quote.original}</span>
      <LiIcon name="chevron-right" size={16}/>
     </summary>
     <div id="buddy-quote" className="li-buddy-quote-expanded">
      <p id="buddy-quote-translation" className="ly-translation" lang={chooseLanguage('vi','en')}>{quote.translation}</p>
      <p id="buddy-quote-gloss">{quote.interpretation}</p>
      <p id="buddy-quote-context">{quote.comment}</p>
      <p className="li-buddy-quote-credit"><span id="buddy-quote-meta">{quote.meta}</span>{' · '}
       <a id="buddy-quote-link" href={quote.url} target="_blank" rel="noopener noreferrer">
        {chooseLanguage('Xem xuất xứ','View source')}</a>
      </p>
     </div>
     </details>
    </ChatBubble>}
   </header>
   <div id="buddy-scroll" className="buddy-scroll" tabIndex={0}
    ref={content} role="region" aria-label={chooseLanguage('Nội dung hội thoại với Lão Lý','Conversation with Elder Ly')}>
    <div className="li-buddy-conversation">
     {message!==view.text&&<p className="li-buddy-context">{view.text}</p>}
     <p id="buddy-text" role="status" aria-live="polite">{message}</p>
    </div>
    {comparison&&<section className="li-buddy-spell-comparison"
     aria-label={chooseLanguage('Đối chiếu hai Thần Chú','Compare learning techniques')}>
     <h3>{chooseLanguage('Khác nhau ở đâu?','How are they different?')}</h3>
     <div className="li-buddy-spell-pair">
      {[comparison.from,comparison.to].map((id,index)=>{
       const method=spellMethods.find(item=>item.id===id);
       const guide=sourceFor(id);
       if(!method)return null;
       return <article key={id}>
        <strong>{id} · {method.title}{index===0?
         <span> · {chooseLanguage('Đang đọc','Current')}</span>:null}</strong>
        <p>{method.purpose}</p>
        {guide?.steps?.[0]&&<p className="li-buddy-spell-example">
         <b>{chooseLanguage('Cách bắt đầu:','First step:')}</b> {guide.steps[0]}</p>}
        {guide?.example&&<p className="li-buddy-spell-example">
         <b>{chooseLanguage('Ví dụ:','Example:')}</b> {guide.example.scenario}</p>}
       </article>;
      })}
     </div>
     {compareTarget&&<Button variant="ghost" className="li-buddy-spell-link"
      onClick={openCompared}>
      {chooseLanguage('Mở Thần Chú','Open spell')} {compareTarget.id} · {compareTarget.title}
      <LiIcon name="arrow-right" size={17}/>
     </Button>}
    </section>}
    {view.editorial?.quotes&&<div className="li-editorial-buddy-quotes" role="group"
     aria-label={chooseLanguage('Nguồn trích dẫn được chọn theo nội dung','Curated lesson quotations')}>
     {view.editorial.quotes.map((candidate,index)=><Button key={candidate.id}
      variant={quoteIndex===index?'primary':'secondary'}
      aria-pressed={quoteIndex===index}
      onClick={()=>setQuoteIndex(index)}>
      {chooseLanguage('Nguồn ','Source ')+(index+1)+' · '+candidate.meta}
     </Button>)}
    </div>}

    {challenge&&<div id="buddy-debate" className="ly-debate">
     <p className="small">{chooseLanguage(
      'Lão hỏi toàn người dùng đang hoạt động, rồi kết luận 90% toàn thị trường hài lòng. Ngươi bắt được chỗ suy rộng không?',
      'I only asked current active users, yet claimed 90% of the whole market was satisfied. Can you spot the overgeneralization?'
     )}</p>
     <div className="action-row">
      <Button variant="secondary" className="action alt" onClick={()=>submitDebate(false)}>
       {chooseLanguage('Đúng, có thể suy ra thị trường','Yes, it represents the whole market')}</Button>
      <Button variant="primary" className="action" onClick={()=>submitDebate(true)}>
       {chooseLanguage('Chưa, chỉ biết nhóm được hỏi','No, only the respondents')}</Button>
     </div>
    </div>}
   </div>
   <div className="action-row buddy-actions" aria-label={chooseLanguage('Lão Lý gợi ý','Companion actions')}>
    {view.relatedLesson&&
     <Button variant="secondary" className="action alt" id="li-buddy-related-lesson"
      onClick={openRelatedLesson}>
      <LiIcon name="book-open" size={18}/>
      {chooseLanguage('Mở bài liên quan','Related lesson')}
      <LiIcon name="arrow-right" size={16}/>
     </Button>}
    {(view.editorial?view.editorial.actions.map(action=>action.label):view.labels)
     .map((label,index)=><Button key={index} variant="secondary"
     className="action alt" onClick={()=>choose(index)}>
     <LiIcon name={index===0?'search':index===1?'chat':'book-open'} size={18}/>
     {label}</Button>)}
    <Button variant="ghost" className="action"
     id="li-react-close-buddy" onClick={()=>close()}>
     <LiIcon name="close" size={18}/> {chooseLanguage('Đóng','Close')}</Button>
   </div>
  </div>
 </div>;
}
export function mountLaoLyDialog(){
 const root=document.getElementById('buddy-modal');
 if(!root)throw Error('LAOLY_DIALOG_ROOT_MISSING');
 // The original modal's outer focus/overlay shell and CSS are reused; its
 // COMPLETE inner UI is replaced by React, not copied into a hidden island.
 const reactRoot=createRoot(root);
 reactRoot.render(<BuddyDialog root={root}/>);
 return()=>{reactRoot.unmount();root.classList.remove('open');};
}
