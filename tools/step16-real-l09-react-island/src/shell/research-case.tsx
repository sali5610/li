import {openRoute} from './app-router.js';
import {inquiryFlow} from './inquiry-port.js';
import type {ResearchView,CaseChoice} from './inquiry-port.js';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {Badge,Button,Card,Field,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';
import {LiIcon} from '../../../../design-system/react/LucideIcons';

const empty:ResearchView={question:'',branches:[],observed:'',unknown:'',feedback:''};
const readResearch=():ResearchView=>inquiryFlow().getResearch()||empty;
function ResearchScene(){
 const reduced=useReducedMotion();
 const [state,setState]=useState(readResearch);
 useEffect(()=>{
  const sync=()=>setState(previous=>{
   const next=readResearch();
   return JSON.stringify(previous)===JSON.stringify(next)?previous:next;
  });
  window.addEventListener('li:inquiry-changed',sync);
  window.addEventListener('li:personal-sync-applied',sync);
  return ()=>{
   window.removeEventListener('li:inquiry-changed',sync);
   window.removeEventListener('li:personal-sync-applied',sync);
  };
 },[]);
 const choose=(index:number)=>inquiryFlow().chooseBranch(index);
 return <div data-li-react-screen="research" className="li-react-research">
  <div className="kicker">THEO DẤU MỘT NGHI VẤN</div>
  <Heading level={1} role="headline">Khảo Chứng</Heading>
  <Text role="body">Mỗi kết luận bắt đầu từ một câu hỏi: ta đã biết gì, và còn thiếu gì?</Text>
  <div className="editorial-grid"><div className="stack-sm">
   <Card variant="tinted">
    <div className="kicker">I · GIẢ THUYẾT</div>
    <Heading level={2} role="titleMedium">{state.question||'Một kết luận cần kiểm chứng'}</Heading>
    <Badge tone="neutral">Ví dụ giả định</Badge>
    <div className="section-rule"/>
    <div className="path-list">
     {state.branches.map((branch,index)=><Button key={index} variant="secondary"
      className="branch" onClick={()=>choose(index)}>
      {String(index+1).padStart(2,'0')} · {branch}
     </Button>)}
    </div>
    <motion.p key={state.feedback} className="state-note" role="status"
     initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}}
     transition={reduced?{duration:0}:{duration:0.16}}>{state.feedback}</motion.p>
    <div className="action-row"><Button onClick={()=>openRoute('case')}>Phản Chứng</Button></div>
   </Card>
   <Card variant="raised">
    <div className="kicker">II · NGUỒN / CHỨNG CỨ</div>
    <Heading level={2} role="titleMedium">Chưa đủ dữ kiện</Heading>
    <Text role="body">Một tỷ lệ chưa cho biết cách chọn mẫu, nên chưa đủ để kết luận về toàn bộ tổng thể.</Text>
    <div className="path-item"><span className="path-num">01</span>
     <div><strong>Điều quan sát</strong><Text role="support">{state.observed}</Text></div>
    </div>
    <div className="path-item"><span className="path-num">02</span>
     <div><strong>Điều chưa biết</strong><Text role="support">{state.unknown}</Text></div>
    </div>
   </Card>
  </div>
  <div className="stack-sm">
   <Card variant="raised">
    <div className="kicker">III · BÚT KÝ</div>
    <Heading level={2} role="titleMedium">Bút Ký ở Tủ Riêng</Heading>
    <Text role="body">Tìm lại những kết luận bạn tự viết sau mỗi lượt Phản Chứng.</Text>
    <div className="action-row"><Button variant="secondary" onClick={()=>openRoute('library')}
     data-focus="notebook-section">Mở Bút Ký</Button></div>
   </Card>
   <article className="surface dark">
    <div className="laoly-side-avatar"><span className="laoly-face smallface" aria-hidden="true">
     <img src="./assets/laoly-neutral.png" alt="" width="128" height="128" loading="lazy"/></span>
     <span className="kicker">LÃO LÝ NHẮN NHỦ</span>
    </div>
    <Heading level={2} role="titleMedium" className="li-react-mentor-white">
     “Lập luận hay mà thiếu dữ kiện thì vẫn chỉ là một câu chuyện kể.”
    </Heading>
    <Text role="body">Muốn lão giúp soi tiền đề nào trước?</Text>
    <Button variant="secondary" onClick={()=>window.openLaoLy?.()}>Đối thoại cùng Lão Lý</Button>
   </article>
  </div></div>
 </div>;
}
const readBookmark=()=>inquiryFlow().isCaseBookmarked();
function CaseScene(){
 const reduced=useReducedMotion();
 const [choice,setChoice]=useState<'right'|'wrong'|null>(null);
 const [revision,setRevision]=useState(()=>{
  const input=document.getElementById('case-revision') as HTMLTextAreaElement|null;
  return input?.value||'';
 });
 const [message,setMessage]=useState('');
 const [bookmarked,setBookmarked]=useState(readBookmark);
 useEffect(()=>{
  const original=originalCase()?.querySelector<HTMLButtonElement>('[data-li-bookmark-kind="case"]');
  if(!original)return;
  const observer=new MutationObserver(()=>setBookmarked(readBookmark()));
  observer.observe(original,{attributes:true,attributeFilter:['aria-pressed']});
  return ()=>observer.disconnect();
 },[]);
 const updateRevision=(next:string)=>{
  setRevision(next);
  const original=document.getElementById('case-revision') as HTMLTextAreaElement|null;
  if(original){original.value=next;original.dispatchEvent(new Event('input',{bubbles:true}));}
 };
 const save=()=>{
  if(!choice){setMessage('Hãy chọn một nhận định trước khi lưu.');return;}
  if(revision.trim().length<12){setMessage('Viết lại kết luận ít nhất 12 ký tự.');return;}
  let saved=false;
  const onSaved=(event:Event)=>{
   const detail=(event as CustomEvent<{type?:string;id?:string}>).detail;
   if(detail?.type==='input'&&detail.id?.startsWith('case:'))saved=true;
  };
  window.addEventListener('li:activity',onSaved);
  try{document.getElementById('finish-case')?.click();}
  finally{window.removeEventListener('li:activity',onSaved);}
  if(saved){setMessage('');setRevision('');setChoice(null);}
 };
 return <div data-li-react-screen="case" className="li-react-case">
  <div className="kicker">PHẢN CHỨNG · THIÊN LỆCH CHỌN MẪU</div>
  <div className="library-heading-with-utility">
   <Heading level={1} role="headline">Phản Chứng</Heading>
   <Button variant="ghost" aria-label={bookmarked?'Bỏ lưu case':'Lưu case'}
    aria-pressed={bookmarked}
    onClick={()=>originalCase()?.querySelector<HTMLButtonElement>('[data-li-bookmark-kind="case"]')?.click()}>
    <LiIcon name="bookmark" size={20}/>{bookmarked?'Đã lưu':'Lưu case'}
   </Button>
  </div>
  <div className="editorial-grid">
   <Card variant="tinted">
    <Heading level={2} role="titleMedium">90% trả lời hài lòng. Chúng ta nên kết luận thế nào?</Heading>
    <Text role="body">Câu hỏi then chốt: người nào được chọn để khảo sát, người nào không được đại diện?</Text>
    <div className="path-list">
     <Button className="branch" variant="secondary" data-answer="right" aria-pressed={choice==='right'}
      onClick={()=>{setChoice('right');setMessage('');}}>
      Kết quả đúng với những người tham gia mẫu này, chưa suy rộng.</Button>
     <Button className="branch" variant="secondary" data-answer="wrong" aria-pressed={choice==='wrong'}
      onClick={()=>{setChoice('wrong');setMessage('');}}>
      90% của mọi người chắc chắn đều hài lòng.</Button>
    </div>
    <motion.p key={choice||'none'} className="state-note" role="status"
     initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}}
     transition={reduced?{duration:0}:{duration:0.16}}>{choice===null?'Chọn một nhận định để bắt đầu.':
     choice==='right'?'Chính xác trong tình huống này: kết luận chỉ áp dụng cho nhóm được hỏi.':
     'Chưa đúng · Bạn đã suy từ mẫu khảo sát sang toàn bộ người dùng.'}</motion.p>
    <Field kind="textarea" label="Luận Kết · Viết lại nhận định không vượt quá dữ kiện"
     rows={5} value={revision} onChange={e=>updateRevision(e.target.value)}
     placeholder="Trong nhóm người đang sử dụng được hỏi, 90% phản hồi tích cực…"/>
    {message&&<InlineFeedback tone="error" message={message}/>}
    <div className="action-row"><Button onClick={save}><LiIcon name="check" size={20}/> Lưu vào Bút Ký</Button></div>
    <Text role="support">Sau khi xem phản hồi, hãy viết lại kết luận bằng lời của bạn.</Text>
   </Card>
   <Card variant="raised">
    <div className="kicker">THỦ THUẬT TƯ DUY</div>
    <Heading level={2} role="titleMedium">Hỏi về đối tượng bị thiếu.</Heading>
    <Text role="body">Chỉ một câu hỏi “Ai không nằm trong mẫu?” cũng có thể mở ra một nhánh kiểm chứng quan trọng.</Text>
    <Button onClick={()=>openRoute('research')} variant="secondary">Về Khảo Chứng</Button>
   </Card>
  </div>
 </div>;
}
function mountPage(id:string,Component:React.ComponentType){
 const page=document.getElementById('page-'+id);
 const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!page||!legacy)throw Error('REACT_'+id.toUpperCase()+'_HOST_MISSING');
 const host=document.createElement('div');host.className='section-shell';
 host.id='li-react-'+id+'-host';page.append(host);
 const root=createRoot(host);root.render(<Component/>);
 legacy.hidden=true;legacy.style.display='none';
 return ()=>{root.unmount();host.remove();legacy.hidden=false;legacy.style.removeProperty('display');};
}
export function mountResearchAndCase(){
 const cleanupResearch=mountPage('research',ResearchScene);
 const cleanupCase=mountPage('case',CaseScene);
 return ()=>{cleanupCase();cleanupResearch();};
}
