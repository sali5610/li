import {openRoute} from './app-router.js';
import './home-catalog.css';
import {inquiryFlow} from './inquiry-port.js';
import {authoredCopy,useDiscoveryLocale,localized} from './discovery-locale.js';
import type {ResearchView,CaseChoice} from './inquiry-port.js';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {Badge,Button,Field,Heading,InlineFeedback,NumberedCard,Text} from '../../../../design-system/react/index';
import {LiIcon} from '../../../../design-system/react/LucideIcons';
import {CopyAnalysisPrompt} from '../learning/CopyAnalysisPrompt.js';

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
 // Open the actual Case Notes drawer, not the top of an unrelated Library
 // overview. The existing owner controls the filter and live note collection.
 const openNotebook=()=>{
  const library=(window as Window&{
   liLibraryShelf?:{setCollectionFilter:(next:'case')=>void}
  }).liLibraryShelf;
  if(!library)return openRoute('library'); // Native fallback before port startup.
  library.setCollectionFilter('case');
  return openRoute('collection');
 };
 return <div data-li-react-screen="research" className="li-react-research">
  <Heading level={1} role="headline">{L("Khảo Chứng","Investigate")}</Heading>
  <Text role="body">{L("Mỗi kết luận bắt đầu từ một câu hỏi: ta đã biết gì, và còn thiếu gì?","Every conclusion begins with a question: what do we know, and what is missing?")}</Text>
  <div className="research-layout"><section className="research-primary">
   <section className="research-hypothesis">
    <div className="kicker">{L("I · GIẢ THUYẾT","I · HYPOTHESIS")}</div>
    <Heading level={2} role="titleMedium">{authoredCopy(state.question)||L('Một kết luận cần kiểm chứng','A claim to investigate')}</Heading>
    <Badge tone="neutral">{L("Ví dụ giả định","Hypothetical example")}</Badge>
    <div className="section-rule"/>
    <div className="path-list">
     {state.branches.map((branch,index)=><Button key={index} variant="secondary"
      className="branch" onClick={()=>choose(index)}>
      {String(index+1).padStart(2,'0')} · {authoredCopy(branch)}
     </Button>)}
    </div>
    <motion.p key={authoredCopy(state.feedback)} className="state-note" role="status"
     initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}}
     transition={reduced?{duration:0}:{duration:0.16}}>{authoredCopy(state.feedback)}</motion.p>
    <div className="action-row"><Button onClick={()=>openRoute('case')}>{L("Phản Chứng","Challenge the claim")}</Button></div>
   </section>
   <section className="research-evidence">
    <div className="kicker">{L("II · NGUỒN / CHỨNG CỨ","II · SOURCES / EVIDENCE")}</div>
    <Heading level={2} role="titleMedium">{L("Chưa đủ dữ kiện","Insufficient evidence")}</Heading>
    <Text role="body">{L("Một tỷ lệ chưa cho biết cách chọn mẫu, nên chưa đủ để kết luận về toàn bộ tổng thể.","A percentage alone says nothing about sampling, so it cannot establish a population-wide conclusion.")}</Text>
    <NumberedCard number="01">
     <div><strong>{L("Điều quan sát","Observed")}</strong><Text role="support">{authoredCopy(state.observed)}</Text></div>
    </NumberedCard>
    <NumberedCard number="02">
     <div><strong>{L("Điều chưa biết","Unknown")}</strong><Text role="support">{authoredCopy(state.unknown)}</Text></div>
    </NumberedCard>
   </section>
  </section>
  <aside className="research-secondary">
   <section className="research-notebook">
    <div className="kicker">{L("III · BÚT KÝ","III · NOTEBOOK")}</div>
    <Heading level={2} role="titleMedium">{L("Bút Ký ở Tủ Riêng","Notebook in My Shelf")}</Heading>
    <Text role="body">{L("Tìm lại những kết luận bạn tự viết sau mỗi lượt Phản Chứng.","Return to the conclusions you wrote after challenging each claim.")}</Text>
    <div className="action-row"><Button variant="secondary" onClick={openNotebook}>
     {L("Mở Bút Ký","Open notebook")}</Button></div>
   </section>
  </aside></div>
 </div>;
}
/** The React Case UI owns the selected answer; Lão Lý may inspect and submit
 * that SAME visible draft, never a stale hidden native radio/textarea. */
type CaseSnapshot={
 id:string;question:string;scene:string;
 options:{key:CaseChoice;text:string}[];selectedKey:CaseChoice;
 selectedText:string;feedback:string
};
/** The React Case screen owns the canonical text for its saved snapshot:
 * no reading #page-case markup after the global shell retires that fallback. */
const fallbackCaseCopy={
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
type BiText={vi:string;en:string};
type ActiveCase={
 id:string;lessonId:string;draft:boolean;
 question:BiText;scene:BiText;
 options:{right:BiText;wrong:BiText};
 feedback:{right:BiText;wrong:BiText};
 technique:{title:BiText;body:BiText}
};
function readCaseCopy():ActiveCase{
 const item=inquiryFlow().getCase();
 const vi=item.localized?.vi,en=item.localized?.en;
 if(!item.draft||!vi||!en)return {
  id:'sampling-bias-90',lessonId:'L09-1-2',draft:false,
  ...fallbackCaseCopy,technique:{
   title:{vi:'Hỏi về đối tượng bị thiếu.',en:'Ask who is missing.'},
   body:{vi:'Ai không nằm trong mẫu? Đây là một nhánh kiểm chứng quan trọng.',
    en:'Who is not represented? That is an important line of inquiry.'}
  }
 };
 return {id:item.id,lessonId:item.lessonId,draft:true,
  question:{vi:vi.question,en:en.question},scene:{vi:vi.scene,en:en.scene},
  options:{right:{vi:vi.options.right,en:en.options.right},
   wrong:{vi:vi.options.wrong,en:en.options.wrong}},
  feedback:{right:{vi:vi.feedback.right,en:en.feedback.right},
   wrong:{vi:vi.feedback.wrong,en:en.feedback.wrong}},
  technique:{title:{vi:vi.technique.title,en:en.technique.title},
   body:{vi:vi.technique.body,en:en.technique.body}}};
}
function caseSnapshot(answer:CaseChoice):CaseSnapshot{
 const caseCopy=readCaseCopy();
 const options:CaseSnapshot['options']=[
  {key:'right',text:caseCopy.options.right.vi},
  {key:'wrong',text:caseCopy.options.wrong.vi}
 ];
 return {id:caseCopy.id,question:caseCopy.question.vi,scene:caseCopy.scene.vi,
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
 const [caseCopy,setCaseCopy]=useState(readCaseCopy);
 const [choice,setChoice]=useState<CaseChoice|null>(null);
 const [completed,setCompleted]=useState<{choice:CaseChoice;conclusion:string}|null>(null);
 const [revision,setRevision]=useState(()=>inquiryFlow().getCaseDraft());
 const [message,setMessage]=useState('');
 const [bookmarked,setBookmarked]=useState(readBookmark);
 useEffect(()=>{
  const sync=()=>{
   const permitted=document.documentElement.classList.contains('li-auth-verified');
   if(!permitted){setChoice(null);setMessage('');}
   if(!permitted)setCompleted(null);
   setBookmarked(readBookmark());
   const latest=readCaseCopy();
   setCaseCopy(previous=>previous.id===latest.id?previous:latest);
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
 useEffect(()=>{
  setChoice(null);setCompleted(null);setMessage('');
  setRevision(inquiryFlow().getCaseDraft());
  setBookmarked(readBookmark());
 },[caseCopy.id]);
 const updateRevision=(next:string)=>{
  setRevision(next);
  setCompleted(null);
  if(!inquiryFlow().setCaseDraft(next))
   setMessage(L('Không thể tự lưu bản nháp trên thiết bị này. Hãy sao chép nội dung trước khi thoát.','Unable to save this draft on your device. Copy it before leaving.'));
  else setMessage('');
 };
 const save=():boolean=>{
  if(!choice){setMessage(L('Hãy chọn một nhận định trước khi lưu.','Choose an answer before saving.'));return false;}
  if(revision.trim().length<12){setMessage(L('Viết lại kết luận ít nhất 12 ký tự.','Revise your conclusion using at least 12 characters.'));return false;}
  const saved=inquiryFlow().submitCase(choice,revision);
  if(saved){setCompleted({choice,conclusion:revision});setMessage('');setRevision('');setChoice(null);}
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
 },[choice,revision,caseCopy.id]);
 const toggleBookmark=()=>{
  inquiryFlow().toggleCaseBookmark();
  setBookmarked(readBookmark());
 };
 // A completed Phản Chứng is ready for analysis before it is saved.
 // Keep the last successful snapshot available after the save clears the form.
 const analysis=completed??(choice&&revision.trim().length>=12
  ?{choice,conclusion:revision.trim()}:null);
 return <div data-li-react-screen="case" className="li-react-case">
  <div className="library-heading-with-utility">
   <Heading level={1} role="headline">{L("Phản Chứng","Challenge")}</Heading>
   <Button variant="ghost" aria-label={bookmarked?L('Bỏ lưu case','Remove case bookmark'):L('Lưu case','Bookmark case')}
    aria-pressed={bookmarked}
    onClick={toggleBookmark}>
    <LiIcon name="bookmark" size={20}/>{bookmarked?L('Đã lưu','Saved'):L('Lưu case','Bookmark case')}
   </Button>
  </div>
  <Text role="caption">{caseCopy.draft?
    L("CASE GIẢ ĐỊNH · BẢN THẢO CHƯA DUYỆT","FICTIONAL CASE · DRAFT NOT APPROVED"):
    L("Thiên lệch chọn mẫu","Sampling bias")}</Text>
  <div className="case-layout">
   <section className="case-workspace">
    <div className="case-question"><Heading level={2} role="titleMedium">{L(caseCopy.question.vi,caseCopy.question.en)}</Heading>
    <Text role="body">{L(caseCopy.scene.vi,caseCopy.scene.en)}</Text>
    </div>
    <div className="path-list case-options">
     <Button className="branch" variant="secondary" aria-pressed={choice==='right'}
      onClick={()=>{setChoice('right');setCompleted(null);setMessage('');}}>
      {L(caseCopy.options.right.vi,caseCopy.options.right.en)}</Button>
     <Button className="branch" variant="secondary" aria-pressed={choice==='wrong'}
      onClick={()=>{setChoice('wrong');setCompleted(null);setMessage('');}}>
      {L(caseCopy.options.wrong.vi,caseCopy.options.wrong.en)}</Button>
    </div>
    <motion.p key={choice||'none'} className="state-note" role="status"
     initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}}
     transition={reduced?{duration:0}:{duration:0.16}}>{choice===null?L('Chọn một nhận định để bắt đầu.','Choose a statement to begin.'):
     choice==='right'?L(caseCopy.feedback.right.vi,caseCopy.feedback.right.en):
     L(caseCopy.feedback.wrong.vi,caseCopy.feedback.wrong.en)}</motion.p>
    <div className="case-revision"><Field id="li-react-case-revision" kind="textarea" label={L("Luận Kết · Viết lại nhận định không vượt quá dữ kiện","Conclusion · Revise your claim without exceeding the evidence")}
     rows={5} value={revision} onChange={e=>updateRevision(e.target.value)}
     placeholder={caseCopy.draft?L("Từ dữ kiện hiện có, có thể kết luận rằng…","Based on the available evidence, we can conclude that…"):
      L("Trong nhóm người đang sử dụng được hỏi, 90% phản hồi tích cực…","Among the current users surveyed, 90% reported satisfaction…")}/>
    {message&&<InlineFeedback tone="error" message={message}/>}
    <div className="action-row"><Button onClick={save}><LiIcon name="check" size={20}/> {L("Lưu vào Bút Ký","Save to Notebook")}</Button></div>
    <Text role="support">{L("Sau khi xem phản hồi, hãy viết lại kết luận bằng lời của bạn.","After the feedback, rewrite the conclusion in your own words.")}</Text>
    <div className="li-case-analysis-action"
     data-li-case-analysis-state={completed?'saved':analysis?'ready':'incomplete'}>
     {completed&&<Text role="support">{L('Đã lưu Luận Kết vào Bút Ký. Ngươi có thể copy prompt để phân tích.',
      'Conclusion saved to Notebook. You can now copy the analysis prompt.')}</Text>}
     {!analysis&&<Text role="support">{L('Chọn một nhận định và viết Luận Kết ít nhất 12 ký tự để mở nút phân tích.',
      'Choose a claim and write a conclusion of at least 12 characters to enable analysis.')}</Text>}
     <CopyAnalysisPrompt locale={locale} step="case" disabled={!analysis} data={{
      title:L(caseCopy.question.vi,caseCopy.question.en),lessonId:caseCopy.id,
      activity:L(caseCopy.scene.vi,caseCopy.scene.en),
      questions:[L('Bạn chọn nhận định nào?','Which claim did you select?'),
       L('Bạn sửa lại luận kết ra sao?','How did you revise the conclusion?')],
      answers:analysis?[L(caseCopy.options[analysis.choice].vi,caseCopy.options[analysis.choice].en),analysis.conclusion]:[],
      reference:analysis?L(caseCopy.feedback[analysis.choice].vi,caseCopy.feedback[analysis.choice].en):undefined
     }}/>
    </div></div>
   </section>
   <aside className="case-coach">
    <div className="kicker">{L("THỦ THUẬT TƯ DUY","THINKING TECHNIQUE")}</div>
    <Heading level={2} role="titleMedium">{L(caseCopy.technique.title.vi,caseCopy.technique.title.en)}</Heading>
    <Text role="body">{L(caseCopy.technique.body.vi,caseCopy.technique.body.en)}</Text>
    <Button onClick={()=>openRoute('research')} variant="secondary">{L("Về Khảo Chứng","Back to Investigate")}</Button>
   </aside>
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
