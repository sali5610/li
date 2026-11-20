import {openRoute} from './app-router.js';
import {inquiryFlow} from './inquiry-port.js';
import {useDiscoveryLocale,localized} from './discovery-locale.js';
import type {ResearchView,CaseChoice} from './inquiry-port.js';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {Badge,Button,Card,Field,Heading,InlineFeedback,Text} from '../../../../design-system/react/index';
import {LiIcon} from '../../../../design-system/react/LucideIcons';

const empty:ResearchView={question:'',branches:[],observed:'',unknown:'',feedback:''};
const readResearch=():ResearchView=>inquiryFlow().getResearch()||empty;
function ResearchScene(){
 const locale=useDiscoveryLocale();
 const L=(vi:string,en:string)=>localized(locale,vi,en);
 const reduced=useReducedMotion();
 const [state,setState]=useState(readResearch);
 useEffect(()=>{
  const sync=()=>setState(previous=>{
   const next=readResearch();
   return JSON.stringify(previous)===JSON.stringify(next)?previous:next;
  });
  window.addEventListener('li:auth-verified-changed',sync);
  window.addEventListener('li:inquiry-changed',sync);
  window.addEventListener('li:personal-sync-applied',sync);
  return ()=>{
   window.removeEventListener('li:auth-verified-changed',sync);
   window.removeEventListener('li:inquiry-changed',sync);
   window.removeEventListener('li:personal-sync-applied',sync);
  };
 },[]);
 const choose=(index:number)=>inquiryFlow().chooseBranch(index);
 return <div data-li-react-screen="research" className="li-react-research">
  <div className="kicker">{L("THEO DẤU MỘT NGHI VẤN","FOLLOW THE EVIDENCE")}</div>
  <Heading level={1} role="headline">{L("Khảo Chứng","Investigate")}</Heading>
  <Text role="body">{L("Mỗi kết luận bắt đầu từ một câu hỏi: ta đã biết gì, và còn thiếu gì?","Every conclusion begins with a question: what do we know, and what is missing?")}</Text>
  <div className="editorial-grid"><div className="stack-sm">
   <Card variant="tinted">
    <div className="kicker">{L("I · GIẢ THUYẾT","I · HYPOTHESIS")}</div>
    <Heading level={2} role="titleMedium">{state.question||L('Một kết luận cần kiểm chứng','A claim to investigate')}</Heading>
    <Badge tone="neutral">{L("Ví dụ giả định","Hypothetical example")}</Badge>
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
    <div className="action-row"><Button onClick={()=>openRoute('case')}>{L("Phản Chứng","Challenge the claim")}</Button></div>
   </Card>
   <Card variant="raised">
    <div className="kicker">{L("II · NGUỒN / CHỨNG CỨ","II · SOURCES / EVIDENCE")}</div>
    <Heading level={2} role="titleMedium">{L("Chưa đủ dữ kiện","Insufficient evidence")}</Heading>
    <Text role="body">{L("Một tỷ lệ chưa cho biết cách chọn mẫu, nên chưa đủ để kết luận về toàn bộ tổng thể.","A percentage alone says nothing about sampling, so it cannot establish a population-wide conclusion.")}</Text>
    <div className="path-item"><span className="path-num">01</span>
     <div><strong>{L("Điều quan sát","Observed")}</strong><Text role="support">{state.observed}</Text></div>
    </div>
    <div className="path-item"><span className="path-num">02</span>
     <div><strong>{L("Điều chưa biết","Unknown")}</strong><Text role="support">{state.unknown}</Text></div>
    </div>
   </Card>
  </div>
  <div className="stack-sm">
   <Card variant="raised">
    <div className="kicker">{L("III · BÚT KÝ","III · NOTEBOOK")}</div>
    <Heading level={2} role="titleMedium">{L("Bút Ký ở Tủ Riêng","Notebook in My Shelf")}</Heading>
    <Text role="body">{L("Tìm lại những kết luận bạn tự viết sau mỗi lượt Phản Chứng.","Return to the conclusions you wrote after challenging each claim.")}</Text>
    <div className="action-row"><Button variant="secondary" onClick={()=>openRoute('library')}
     data-focus="notebook-section">{L("Mở Bút Ký","Open notebook")}</Button></div>
   </Card>
   <article className="surface dark">
    <div className="laoly-side-avatar"><span className="laoly-face smallface" aria-hidden="true">
     <img src="./assets/laoly-neutral.png" alt="" width="128" height="128" loading="lazy"/></span>
     <span className="kicker">{L("LÃO LÝ NHẮN NHỦ","A NOTE FROM LAO LY")}</span>
    </div>
    <Heading level={2} role="titleMedium" className="li-react-mentor-white">
     {L("“Lập luận hay mà thiếu dữ kiện thì vẫn chỉ là một câu chuyện kể.”","“A compelling argument without evidence is still only a story.”")}
    </Heading>
    <Text role="body">{L("Muốn lão giúp soi tiền đề nào trước?","Which assumption should we examine first?")}</Text>
    <Button variant="secondary" onClick={()=>window.openLaoLy?.()}>{L("Đối thoại cùng Lão Lý","Talk with Lao Ly")}</Button>
   </article>
  </div></div>
 </div>;
}
/** The React Case UI owns the selected answer; Lão Lý may inspect and submit
 * that SAME visible draft, never a stale hidden native radio/textarea. */
type CaseSnapshot={
 id:'sampling-bias-90';question:string;scene:string;
 options:{key:CaseChoice;text:string}[];selectedKey:CaseChoice;
 selectedText:string;feedback:string
};
/** The React Case screen owns the canonical text for its saved snapshot:
 * no reading #page-case markup after the global shell retires that fallback. */
const caseCopy={
 question:{vi:'90% trả lời hài lòng. Chúng ta nên kết luận thế nào?',en:'90% of respondents were satisfied. What can we conclude?'},
 scene:{vi:'Câu hỏi then chốt: người nào được chọn để khảo sát, người nào không được đại diện?',en:'The key question: who was surveyed, and who was left out?'},
 options:{
  right:{vi:'Kết quả đúng với những người tham gia mẫu này, chưa suy rộng.',en:'This result describes only the sample, not the wider population.'},
  wrong:{vi:'90% của mọi người chắc chắn đều hài lòng.',en:'Exactly 90% of everyone is satisfied.'}
 },
 feedback:{
  right:{vi:'Chính xác trong tình huống này: kết luận chỉ áp dụng cho nhóm được hỏi.',en:'Correct for this scenario: the conclusion applies only to those surveyed.'},
  wrong:{vi:'Chưa Đúng · Bạn đã suy từ mẫu khảo sát sang toàn bộ người dùng. Hãy kiểm tra cách chọn mẫu và người bị bỏ sót.',en:'Not quite: this generalizes from a sample to all users. Check who was included and excluded.'}
 }
} as const;
function caseSnapshot(answer:CaseChoice):CaseSnapshot{
 const options:CaseSnapshot['options']=[
  {key:'right',text:caseCopy.options.right.vi},
  {key:'wrong',text:caseCopy.options.wrong.vi}
 ];
 return {id:'sampling-bias-90',question:caseCopy.question.vi,scene:caseCopy.scene.vi,
  options,selectedKey:answer,selectedText:caseCopy.options[answer].vi,
  feedback:caseCopy.feedback[answer].vi};
}
type CaseUiPort={
 getState:()=>{choice:CaseChoice|null;revision:string}|null;
 getSnapshot:()=>CaseSnapshot|null;
 submit:()=>boolean
};
declare global{interface Window{liCaseUi?:CaseUiPort;}}
const readBookmark=()=>inquiryFlow().isCaseBookmarked();
function CaseScene(){
 const locale=useDiscoveryLocale();
 const L=(vi:string,en:string)=>localized(locale,vi,en);
 const reduced=useReducedMotion();
 const [choice,setChoice]=useState<CaseChoice|null>(null);
 const [revision,setRevision]=useState(()=>inquiryFlow().getCaseDraft());
 const [message,setMessage]=useState('');
 const [bookmarked,setBookmarked]=useState(readBookmark);
 useEffect(()=>{
  const sync=()=>{
   const permitted=document.documentElement.classList.contains('li-auth-verified');
   if(!permitted){setChoice(null);setMessage('');}
   setBookmarked(readBookmark());
   const saved=inquiryFlow().getCaseDraft();
   setRevision(previous=>previous===saved?previous:saved);
  };
  window.addEventListener('li:auth-verified-changed',sync);
  window.addEventListener('li:inquiry-changed',sync);
  window.addEventListener('li:personal-sync-applied',sync);
  return ()=>{
   window.removeEventListener('li:auth-verified-changed',sync);
   window.removeEventListener('li:inquiry-changed',sync);
   window.removeEventListener('li:personal-sync-applied',sync);
  };
 },[]);
 const updateRevision=(next:string)=>{
  setRevision(next);
  if(!inquiryFlow().setCaseDraft(next))
   setMessage(L('Không thể tự lưu bản nháp trên thiết bị này. Hãy sao chép nội dung trước khi thoát.','Unable to save this draft on your device. Copy it before leaving.'));
  else setMessage('');
 };
 const save=():boolean=>{
  if(!choice){setMessage(L('Hãy chọn một nhận định trước khi lưu.','Choose an answer before saving.'));return false;}
  if(revision.trim().length<12){setMessage(L('Viết lại kết luận ít nhất 12 ký tự.','Revise your conclusion using at least 12 characters.'));return false;}
  const saved=inquiryFlow().submitCase(choice,revision);
  if(saved){setMessage('');setRevision('');setChoice(null);}
  else setMessage(L('Không thể lưu Bút Ký trên thiết bị này. Nội dung vẫn giữ trong ô viết.','Unable to save to Notebook on this device. Your text is preserved here.'));
  return saved;
 };
 useEffect(()=>{
  const port:CaseUiPort={
   getState:()=>document.documentElement.classList.contains('li-auth-verified')
    ?{choice,revision}:null,
   getSnapshot:()=>document.documentElement.classList.contains('li-auth-verified')&&choice
    ?caseSnapshot(choice):null,
   submit:()=>document.documentElement.classList.contains('li-auth-verified')&&save()
  };
  window.liCaseUi=port;
  return()=>{if(window.liCaseUi===port)delete window.liCaseUi;};
 },[choice,revision]);
 const toggleBookmark=()=>{
  inquiryFlow().toggleCaseBookmark();
  setBookmarked(readBookmark());
 };
 return <div data-li-react-screen="case" className="li-react-case">
  <div className="kicker">{L("PHẢN CHỨNG · THIÊN LỆCH CHỌN MẪU","CHALLENGE · SAMPLING BIAS")}</div>
  <div className="library-heading-with-utility">
   <Heading level={1} role="headline">{L("Phản Chứng","Challenge")}</Heading>
   <Button variant="ghost" aria-label={bookmarked?L('Bỏ lưu case','Remove case bookmark'):L('Lưu case','Bookmark case')}
    aria-pressed={bookmarked}
    onClick={toggleBookmark}>
    <LiIcon name="bookmark" size={20}/>{bookmarked?L('Đã lưu','Saved'):L('Lưu case','Bookmark case')}
   </Button>
  </div>
  <div className="editorial-grid">
   <Card variant="tinted">
    <Heading level={2} role="titleMedium">{L(caseCopy.question.vi,caseCopy.question.en)}</Heading>
    <Text role="body">{L(caseCopy.scene.vi,caseCopy.scene.en)}</Text>
    <div className="path-list">
     <Button className="branch" variant="secondary" aria-pressed={choice==='right'}
      onClick={()=>{setChoice('right');setMessage('');}}>
      {L(caseCopy.options.right.vi,caseCopy.options.right.en)}</Button>
     <Button className="branch" variant="secondary" aria-pressed={choice==='wrong'}
      onClick={()=>{setChoice('wrong');setMessage('');}}>
      {L(caseCopy.options.wrong.vi,caseCopy.options.wrong.en)}</Button>
    </div>
    <motion.p key={choice||'none'} className="state-note" role="status"
     initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}}
     transition={reduced?{duration:0}:{duration:0.16}}>{choice===null?L('Chọn một nhận định để bắt đầu.','Choose a statement to begin.'):
     choice==='right'?L(caseCopy.feedback.right.vi,caseCopy.feedback.right.en):
     L(caseCopy.feedback.wrong.vi,caseCopy.feedback.wrong.en)}</motion.p>
    <Field id="li-react-case-revision" kind="textarea" label={L("Luận Kết · Viết lại nhận định không vượt quá dữ kiện","Conclusion · Revise your claim without exceeding the evidence")}
     rows={5} value={revision} onChange={e=>updateRevision(e.target.value)}
     placeholder={L("Trong nhóm người đang sử dụng được hỏi, 90% phản hồi tích cực…","Among the current users surveyed, 90% reported satisfaction…")}/>
    {message&&<InlineFeedback tone="error" message={message}/>}
    <div className="action-row"><Button onClick={save}><LiIcon name="check" size={20}/> {L("Lưu vào Bút Ký","Save to Notebook")}</Button></div>
    <Text role="support">{L("Sau khi xem phản hồi, hãy viết lại kết luận bằng lời của bạn.","After the feedback, rewrite the conclusion in your own words.")}</Text>
   </Card>
   <Card variant="raised">
    <div className="kicker">{L("THỦ THUẬT TƯ DUY","THINKING TECHNIQUE")}</div>
    <Heading level={2} role="titleMedium">{L("Hỏi về đối tượng bị thiếu.","Ask who is missing.")}</Heading>
    <Text role="body">{L("Chỉ một câu hỏi “Ai không nằm trong mẫu?” cũng có thể mở ra một nhánh kiểm chứng quan trọng.","One question—“Who is not in this sample?”—can reveal a key line of inquiry.")}</Text>
    <Button onClick={()=>openRoute('research')} variant="secondary">{L("Về Khảo Chứng","Back to Investigate")}</Button>
   </Card>
  </div>
 </div>;
}
function mountPage(id:string,Component:React.ComponentType){
 const page=document.getElementById('page-'+id);
 const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!page)throw Error('REACT_'+id.toUpperCase()+'_HOST_MISSING');
 const host=document.createElement('div');host.className='section-shell';
 host.id='li-react-'+id+'-host';page.append(host);
 const root=createRoot(host);root.render(<Component/>);
 if(legacy){legacy.hidden=true;legacy.style.display='none';}
 return ()=>{root.unmount();host.remove();if(legacy){legacy.hidden=false;legacy.style.removeProperty('display');}};
}
export function mountResearchAndCase(){
 inquiryFlow(); // Fail into the untouched native page if the single data owner is unavailable.
 const cleanupResearch=mountPage('research',ResearchScene);
 const cleanupCase=mountPage('case',CaseScene);
 return ()=>{cleanupCase();cleanupResearch();};
}

// Chat 1 can render these directly after the old page shells are retired.
export {ResearchScene as ResearchScreen,CaseScene as CaseScreen};
