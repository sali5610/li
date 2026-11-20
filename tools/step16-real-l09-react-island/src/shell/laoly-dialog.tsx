import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,LiIcon} from '../../../../design-system/react/index';
import './laoly-dialog.css';

/** Full React visual owner for the existing Lão Lý bubble.
 * Keeps the first-party contextual plan engine, all its real actions,
 * quotation provenance + rotation and draggable avatar unchanged.
 * No LLM, no duplicate language/persona/quote database or private writer. */
type QuoteView={
 id:string;original:string;lang:string;translation:string;
 interpretation:string;meta:string;url:string;comment:string
};
type EditorialBuddy={actions:{label:string;reply:string}[];quotes:QuoteView[]};
type BuddyView={
 text:string;labels:string[];avatar:string;quote:QuoteView|null;triggerId:string;
 /** Structured lesson extension; real native mentor actions remain unchanged. */
 editorial?:EditorialBuddy;
};
type BuddyReply={text:string;showChallenge:boolean};
type BuddyPort={open:(trigger?:HTMLElement|null)=>BuddyView|null;choose:(index:number)=>BuddyReply|null};
type AppWindow=Window&{
 liBuddyEngine?:BuddyPort;
 liBuddyReactMounted?:boolean;
 liLanguage?:{get?:()=>string;translateComposed?:(value:string)=>string};
 liAddressLine?:(text:string)=>string
};
const app=window as AppWindow;
const chooseLanguage=(vi:string,en:string)=>app.liLanguage?.get?.()==='en'?en:vi;
const debateCorrect='Cuối cùng cũng chịu dùng đến bộ não rồi đấy. Nhà thông thái, ngươi đã bắt đúng lỗi suy rộng từ người dùng sang toàn thị trường. Lão xin rút kết luận.';
const debateWrong='Ồ, một cách suy luận rất sáng tạo. Tiếc là sai. Nhóc, lão chỉ hỏi người đang dùng; người chưa dùng có thể nghĩ khác. Đừng bắt mẫu khảo sát gánh cả thị trường.';
const withNickname=(text:string)=>app.liAddressLine?app.liAddressLine(text):text;

function BuddyDialog({root}:{root:HTMLElement}){
 const [open,setOpen]=useState(false);
 const [view,setView]=useState<BuddyView|null>(null);
 const [message,setMessage]=useState('');
 const [expanded,setExpanded]=useState(false);
 const [quoteIndex,setQuoteIndex]=useState(0);
 const [challenge,setChallenge]=useState(false);
 const [,setLocale]=useState(0);
 const [avatar,setAvatar]=useState('');
 const heading=useRef<HTMLHeadingElement|null>(null);
 const content=useRef<HTMLDivElement|null>(null);
 const restore=useRef<string>('laoly-fab');
 const current=useRef<BuddyView|null>(null);
 const close=()=>{
  setOpen(false);setChallenge(false);setExpanded(false);
  root.classList.remove('open');
  const focusId=restore.current;
  requestAnimationFrame(()=>{
   (document.getElementById(focusId)||document.getElementById('laoly-fab'))?.focus();
  });
 };
 useEffect(()=>{
  const onOpen=(event:Event)=>{
   if(!document.documentElement.classList.contains('li-auth-verified'))return;
   const next=(event as CustomEvent<BuddyView>).detail;
   if(!next||!Array.isArray(next.labels))return;
   const editorial=next.editorial;
   if(editorial){
    if(editorial.actions?.length!==2||editorial.quotes?.length<3||
      editorial.actions.some(action=>!action.label||!action.reply)||
      editorial.quotes.some(quote=>!quote.original||!quote.meta||!quote.url?.startsWith('https://')))
     return;
   }else if(next.labels.length!==3)return;
   current.current=next;
   restore.current=next.triggerId||'laoly-fab';
   setView(next);setMessage(next.text);setAvatar(next.avatar);
   setExpanded(false);setChallenge(false);setQuoteIndex(0);setOpen(true);
   root.dataset.trigger=restore.current;
  };
  const onClose=()=>close();
  const language=()=>setLocale(v=>v+1);
  const mode=()=>setAvatar(document.getElementById('laoly-current-icon')?.getAttribute('src')||'');
  const guard=new MutationObserver(()=>{
   if(!document.documentElement.classList.contains('li-auth-verified')){
    setOpen(false);setView(null);setMessage('');setChallenge(false);
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
   setMessage(reply.reply);setChallenge(false);
  }else{
   const reply=app.liBuddyEngine?.choose(index);
   if(!reply)return;
   setMessage(reply.text);setChallenge(reply.showChallenge);
  }
  setExpanded(false);
  content.current?.scrollTo({top:0,behavior:'auto'});
 };
 const submitDebate=(correct:boolean)=>{
  const words=withNickname(correct?debateCorrect:debateWrong);
  setMessage(app.liLanguage?.translateComposed?.(words)||words);
  setChallenge(false);
 };
 if(!view)return null;
 const quote=view.editorial?.quotes[quoteIndex]??view.quote;
 const quoteVisible=!challenge&&!!quote&&(!!view.editorial||message===view.text);
 return <div className="buddy-shell li-react-buddy-shell" onKeyDown={onKeyDown}>
  <div className="dialog">
   <header className="buddy-heading">
    <img id="buddy-title-avatar" src={avatar||view.avatar} alt=""
     width={48} height={48} decoding="async"/>
    <div className="buddy-heading-copy">
     <h2 id="buddy-title" ref={heading} tabIndex={-1}>Lão Lý</h2>
     {quoteVisible&&<>
      <p id="buddy-quote-original" className="ly-original" lang={quote.lang}>{quote.original}</p>
      <p id="buddy-quote-translation" className="ly-translation" lang={chooseLanguage('vi','en')}>
       {quote.translation}</p>
     </>}
    </div>
    {quoteVisible&&<Button variant="ghost"
     id="buddy-quote-info" className="buddy-quote-info"
     title={chooseLanguage('Diễn nghĩa và xuất xứ','Interpretation and source')}
     aria-label={chooseLanguage('Xem diễn nghĩa và xuất xứ câu trích dẫn','Show interpretation and quotation source')}
     aria-controls="buddy-quote" aria-expanded={expanded}
     onClick={()=>setExpanded(v=>!v)}><LiIcon name="info" size={18}/></Button>}
   </header>
   <div id="buddy-scroll" className="buddy-scroll" tabIndex={0}
    ref={content} role="region" aria-label={chooseLanguage('Nội dung hội thoại với Lão Lý','Conversation with Lao Ly')}>
    {quoteVisible&&
     <aside id="buddy-quote" className="ly-cultural" hidden={!expanded}
      aria-label={chooseLanguage('Diễn nghĩa và xuất xứ câu trích dẫn','Quote interpretation and source')}>
      <p id="buddy-quote-gloss" className="small">{quote.interpretation}</p>
      <p className="small"><span id="buddy-quote-meta">{quote.meta}</span>{' · '}
       <a id="buddy-quote-link" href={quote.url} target="_blank" rel="noopener noreferrer">
        {chooseLanguage('Xem xuất xứ','View source')}</a></p>
     </aside>}
    <p id="buddy-text" role="status" aria-live="polite">{message}</p>
    {view.editorial&&<div className="li-editorial-buddy-quotes" role="group"
     aria-label={chooseLanguage('Nguồn trích dẫn được chọn theo nội dung','Curated lesson quotations')}>
     {view.editorial.quotes.map((candidate,index)=><Button key={candidate.id}
      variant={quoteIndex===index?'primary':'secondary'}
      aria-pressed={quoteIndex===index}
      onClick={()=>{setQuoteIndex(index);setExpanded(false);}}>
      {chooseLanguage('Nguồn ','Source ')+(index+1)+' · '+candidate.meta}
     </Button>)}
    </div>}
    {quoteVisible&&
     <p id="buddy-quote-context" className="li-quote-context">{quote.comment}</p>}
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
    {(view.editorial?view.editorial.actions.map(action=>action.label):view.labels)
     .map((label,index)=><Button key={index} variant="secondary"
     className="action alt" onClick={()=>choose(index)}>
     <LiIcon name={index===0?'search':index===1?'chat':'book-open'} size={18}/>
     {label}</Button>)}
    <Button variant="primary" className="action"
     id="li-react-close-buddy" onClick={close}>
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
