import React,{useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {initial} from '../native-bridge';
import type {Attempt,MethodAttempt,MethodCategory,MethodChoice,PastEditorialAttempt,EditorialReviewSnapshot} from '../native-bridge';
import type {LearningPorts,SyncState} from './ports';
import {isReleasedLessonId} from './released-lessons';
import {freshLessonAttempt,confirmLessonRestart} from './restart-lesson.js';
import {Button,Card} from '../../../../design-system/react/Components';
import {Field} from '../../../../design-system/react/Controls';
import {Heading,Text,Progress} from '../../../../design-system/react/Atoms';
import {SaveStatus} from '../../../../design-system/react/Molecules';
import type {SaveState} from '../../../../design-system/react/Molecules';
import './journey.css';
import {StudyBookFolio} from './StudyBookFolio';
import {CopyAnalysisPrompt,CopyPromptAction} from './CopyAnalysisPrompt.js';
import {useDiscoveryLocale,localized,type BilingualCopy} from '../shell/discovery-locale.js';
import {useStepScreen} from './step-screen.js';

/** Generic editorial-structured-v1 learner surface. It is intentionally gated
 * by the SAME released-lesson registry and invited owner scoped saving ports.
 * No editorial draft JSON is statically imported into the shipped app.
 */
type Locale='vi'|'en';
type Method='T06'|'T07';
type Phase='read'|'guided'|'methods'|'practice'|'feedback'|'progress';
type Section={md:string;gate?:string;hint_md?:string};
type Illustration={id:string;src:string;alt:string;caption:string;provenance:string};
type CompanionMoment={
 stage:'opening'|'concept'|'guided'|'independent'|'reflection'|'extension';
 anchor:string;gate:string;quote_id:string;quote_ids:string[];
 quote_relevance_md:string;prompt_md:string;actions:{label:string;reply_md:string}[];
};
type Extension={
 id:string;intro_md:string;searchQueries:string[];sourcePrompt:string;
 sources:{title:string;url:string;tier:string}[];recallQuestions:string[];
};
type MethodCopy={
 prompt_md:string;feedback_md:string;feedback_gate:string;
 answer_key?:Record<'A'|'B'|'C'|'D',MethodCategory>;
};
type Localized={
 hook:Section;goals:Section;concept:Section;variable_types:Section;guided:Section;
 technique_applications:Record<Method,MethodCopy>;
 independent:{prompt_md:string;model_answer_md:string;model_answer_gate:string};
 reflection:Section;illustration:Illustration;
 companion:{moments:CompanionMoment[]};extension:Extension;
};
type EditorialLesson={
 id:string;version:string;title:Record<Locale,string>;hierarchy:{field:{title:string}};
 content:{format:'editorial-structured-v1';localized:Record<Locale,Localized>};
 publishState:'review_only';reviewState:'verified'|'approved';
 rights:{
  text:'first_party';illustration:'first_party_original_svg';
  quotations:{policy:'public_domain_original_short_excerpt_with_first_party_gloss';
   quoteIds:string[];externalAcademicSources:'reference_only_no_reproduced_licensed_figures'};
 };
 sources:{title:string;url:string;usage?:string}[];
};
type EditorialAttempt=Attempt;
const MIN=12,MAX=4000;
const RETURN_KEY='li.editorial.guide-return.v1';
const categories:MethodCategory[]=['nominal','ordinal','discrete','continuous'];
const categoryLabels:Record<Locale,Record<MethodCategory,string>>={
 vi:{nominal:'Danh nghĩa',ordinal:'Thứ bậc',discrete:'Định lượng rời rạc',continuous:'Định lượng liên tục'},
 en:{nominal:'Nominal',ordinal:'Ordinal',discrete:'Discrete',continuous:'Continuous'}
};
const T06_CASES=['A','B','C','D'] as const;
type GuideReturn={id:string;phase:'methods';sectionId:'l0911-method';
 scrollY:number;locale:Locale;method:Method;at:number};
function returnToken(id:string):GuideReturn|null{
 try{
  const raw=sessionStorage.getItem(RETURN_KEY);if(!raw)return null;
  const t=JSON.parse(raw) as Partial<GuideReturn>;
  if(t.id!==id||t.phase!=='methods'||t.sectionId!=='l0911-method'||
   (t.method!=='T06'&&t.method!=='T07')||!Number.isFinite(t.scrollY)||
   (t.scrollY??-1)<0||!Number.isFinite(t.at)||
   Date.now()-(t.at??0)>3600000||Date.now()<(t.at??0)||
   !['vi','en'].includes(t.locale??''))return null;
  return t as GuideReturn;
 }catch{return null;}
}
const phases:Phase[]=['read','guided','methods','practice','feedback','progress'];
const defaultMethod=():MethodAttempt=>({draft:'',submission:null,submittedAt:null});
function fromAttempt(a:EditorialAttempt,method:Method):MethodAttempt{
 return a.methodAttempts?.[method]??defaultMethod();
}
function resume(a:Attempt):Phase{
 if(a.reviewed)return 'progress';
 if(a.submitted)return 'feedback';
 if(a.draft.some(s=>s.trim()))return 'practice';
 if(a.methodChoice!==undefined&&a.methodChoice!==null||
    a.methodAttempts?.T06?.draft||a.methodAttempts?.T07?.draft)return 'methods';
 if(a.guidedDraft.trim()||a.hint)return 'guided';
 return 'read';
}
function quiz(md:string):{intro:string;questions:string[]}{
 const lines=md.split('\n'),questions:string[]=[];
 const intro=lines.filter(line=>{
  const match=line.match(/^[1-4]\.\s+(.+)$/);
  if(!match)return true;
  questions.push(match[1]);return false;
 }).join('\n').trim();
 if(questions.length!==4)throw Error('EDITORIAL_FOUR_QUESTIONS_REQUIRED');
 return {intro,questions};
}
/** Rubric descriptors stay attached to each 0/1/2 input, not only a distant table. */
function rubricRows(md:string):[string,string,string,string][]{
 const lines=md.split(/\r?\n/).map(line=>line.trim()).filter(line=>line.startsWith('|'));
 return lines.slice(2).filter(line=>!/^\|?\s*-/.test(line))
  .map(line=>line.replace(/^\||\|$/g,'').split('|').map(cell=>cell.trim()))
  .filter((cells):cells is [string,string,string,string]=>
   cells.length===4&&cells.every(cell=>cell.length>0));
}
function parseLesson(source:unknown,id:string):EditorialLesson{
 if(!source||typeof source!=='object')throw Error('MISSING_EDITORIAL_CONTENT');
 const l=source as Partial<EditorialLesson>;
 if(l.id!==id||l.publishState!=='review_only'||
  !['verified','approved'].includes(l.reviewState??'')||
  l.rights?.text!=='first_party'||l.rights.illustration!=='first_party_original_svg'||
  l.rights.quotations?.policy!=='public_domain_original_short_excerpt_with_first_party_gloss'||
  l.rights.quotations.externalAcademicSources!=='reference_only_no_reproduced_licensed_figures'||
  !Array.isArray(l.rights.quotations.quoteIds)||l.rights.quotations.quoteIds.length<6||
  l.content?.format!=='editorial-structured-v1'||
  !l.version||!l.title?.vi||!l.title?.en||!l.content.localized?.vi||!l.content.localized?.en)
   throw Error('EDITORIAL_NOT_REVIEWED_OR_NOT_PUBLISHED');
 for(const locale of ['vi','en'] as const){
  const c=l.content.localized[locale];
  if(!c||!c.hook?.md||!c.goals?.md||!c.concept?.md||
   !c.variable_types?.md||!c.guided?.md||!c.reflection?.md||
   !c.independent?.prompt_md||!c.independent?.model_answer_md||
   c.independent.model_answer_gate!=='AFTER_VALID_INDEPENDENT_SUBMISSION'||
   c.reflection.gate!=='AFTER_VALID_INDEPENDENT_SUBMISSION'||
   !c.technique_applications?.T06?.prompt_md||
   !c.technique_applications?.T07?.prompt_md||
   c.technique_applications.T06.feedback_gate!=='AFTER_T06_MEANINGFUL_ATTEMPT'||
   c.technique_applications.T07.feedback_gate!=='AFTER_T07_MEANINGFUL_ATTEMPT'||
   T06_CASES.some(letter=>!categories.includes(
    c.technique_applications.T06.answer_key?.[letter] as MethodCategory)))
    throw Error('EDITORIAL_LEARNING_CONTRACT_INVALID');
  quiz(c.independent.prompt_md);
  if(rubricRows(c.reflection.md).length!==4)
   throw Error('EDITORIAL_FOUR_RUBRIC_ROWS_REQUIRED');
  if(!c.illustration?.alt||!c.illustration?.caption||!c.guided.hint_md||
    c.extension?.recallQuestions?.length!==3||c.extension?.sources?.length<2||
    !c.extension.sourcePrompt||!Array.isArray(c.extension.searchQueries)||
    c.companion?.moments?.length!==6||
    c.companion.moments.some((m,index)=>
     m.stage!==['opening','concept','guided','independent','reflection','extension'][index]||
     !m.prompt_md||m.actions?.length!==2||m.actions.some(a=>!a.label||!a.reply_md)||
     !m.quote_id||!Array.isArray(m.quote_ids)||m.quote_ids.length<3||
     m.quote_ids[0]!==m.quote_id||
     m.quote_ids.some(id=>!l.rights?.quotations?.quoteIds.includes(id))))
    throw Error('EDITORIAL_REQUIRED_EXPERIENCE_ELEMENTS_MISSING');
 }
 return l as EditorialLesson;
}
async function loadLesson(id:string):Promise<EditorialLesson>{
 // Import at runtime from this deployed app's one canonical pack adapter.
 // No fallback to content/editorial, Notion, draft JSON or anonymous access.
 const url=new URL('./assets/li-content-adapter.mjs',document.baseURI).href;
 const m=await import(/* @vite-ignore */ url) as {
  contentClient?:{getLesson:(lessonId:string)=>Promise<unknown>}
 };
 if(!m.contentClient?.getLesson)throw Error('CONTENT_PACK_CLIENT_UNAVAILABLE');
 return parseLesson(await m.contentClient.getLesson(id),id);
}
export function inline(value:string):React.ReactNode[]{
 const normalized=value.replace(/<\/?b>/gi,'**').replace(/<\/?i>/gi,'*')
  .replace(/\\_/g,'_').replace(/<[^>]+>/g,'');
 return normalized.split(/(\[[^\]]+\]\(https:\/\/[^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  .filter(Boolean).map((part,i)=>{
   if(part.startsWith('[')){
    const m=part.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);
    if(m)return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer">{m[1]}</a>;
   }
   if(part.startsWith('**')&&part.endsWith('**'))
    return <strong key={i}>{part.slice(2,-2)}</strong>;
   if(part.startsWith('*')&&part.endsWith('*'))
    return <em key={i}>{part.slice(1,-1)}</em>;
   return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
/** Narrow Markdown renderer: text only, source links, tables, ordered/unordered
 * lists. Never inject external HTML or modify the author's canonical source.
 */
function Markdown({md}:{md:string}){
 const lines=md.split(/\r?\n/),nodes:React.ReactNode[]=[];
 let i=0;
 while(i<lines.length){
  const row=lines[i].trim();
  if(!row){i++;continue;}
  if(/^#{1,4}\s/.test(row)){
   nodes.push(<Heading key={i} level={3} role="titleSmall">{inline(row.replace(/^#+\s*/,''))}</Heading>);
   i++;continue;
  }
  if(row.startsWith('|')){
   const first=i,table:string[][]=[];
   while(i<lines.length&&lines[i].trim().startsWith('|')){
    table.push(lines[i].trim().replace(/^\||\|$/g,'').split('|').map(v=>v.trim()));i++;
   }
   const data=table.slice(1).filter(cells=>!cells.every(cell=>/^:?-+:?$/.test(cell)));
   nodes.push(<div className="li-learning-table-scroll" key={first}><table>
    <thead><tr>{table[0].map((v,j)=><th key={j} scope="col">{inline(v)}</th>)}</tr></thead>
    <tbody>{data.map((cells,j)=><tr key={j}>{cells.map((v,k)=><td key={k}>{inline(v)}</td>)}</tr>)}</tbody>
   </table></div>);continue;
  }
  if(/^[-*]\s+/.test(row)||/^\d+\.\s+/.test(row)){
   const isOrdered=/^\d+\.\s+/.test(row),first=i,entries:string[]=[];
   while(i<lines.length&&
    (isOrdered?/^\d+\.\s+/.test(lines[i].trim()):/^[-*]\s+/.test(lines[i].trim()))){
    entries.push(lines[i].trim().replace(isOrdered?/^\d+\.\s+/:/^[-*]\s+/,''));i++;
   }
   nodes.push(isOrdered?
    <ol key={first}>{entries.map((v,k)=><li key={k}>{inline(v)}</li>)}</ol>:
    <ul key={first}>{entries.map((v,k)=><li key={k}>{inline(v)}</li>)}</ul>);
   continue;
  }
  const first=i,paragraph:string[]=[];
  while(i<lines.length&&lines[i].trim()&&!/^(?:#{1,4}\s|\||[-*]\s+|\d+\.\s+)/.test(lines[i].trim())){
   paragraph.push(lines[i].trim());i++;
  }
  if(paragraph.length)nodes.push(<p className="li-learning-copy" key={first}>
   {inline(paragraph.join(' '))}</p>);
  else i++;
 }
 return <div className="li-editorial-markdown">{nodes}</div>;
}

/** An original SVG diagram stays vector-sharp at narrow mobile widths.
 * It depicts a subset, never a randomized/representative sampling claim.
 * Illustration metadata is part of the reviewed content pack, not a draft import.
 */
function PopulationDiagram({illustration}:{illustration:Illustration}){
 const sampled=new Set([1,5,10,14,18,26,29,35,41,46]);
 return <figure className="li-editorial-visual" id={illustration.id}>
  <svg viewBox="0 0 720 320" role="img" aria-label={illustration.alt} xmlns="http://www.w3.org/2000/svg">
   <rect width="720" height="320" fill="#f1f0e9"/>
   <rect x="24" y="24" width="426" height="272" fill="#e1e6df" stroke="#536b63" strokeWidth="2"/>
   <rect x="490" y="24" width="206" height="272" fill="#e8e5d6" stroke="#536b63" strokeWidth="2"/>
   <path d="M450 156h40m-10-9 10 9-10 9" stroke="#536b63" fill="none"
    strokeWidth="2" strokeDasharray="5 7"/>
   {Array.from({length:48},(_,i)=><circle key={i} cx={52+(i%8)*53}
    cy={53+Math.floor(i/8)*41} r="12"
    fill={sampled.has(i)?'#b38052':'#9dae9f'} stroke="#526a61" strokeWidth="1.5"/>)}
   {Array.from({length:10},(_,i)=><circle key={'s'+i} cx={527+(i%4)*45}
    cy={93+Math.floor(i/4)*63} r="14" fill="#b38052" stroke="#72553c" strokeWidth="1.5"/>)}
  </svg>
  <figcaption><Text role="support">{illustration.caption}</Text></figcaption>
 </figure>;
}
function plain(md:string):string{return md.replace(/<[^>]*>/g,'').replace(/\*\*/g,'').trim();}
type QuoteRecord={id:string;original:string;translation:string;meta:string;url:string;lang:string;interpretation:string;comment:string};

export function EditorialJourney({id,ports}:{id:string;ports:LearningPorts}){
 const reduced=useReducedMotion();
 const appLocale=useDiscoveryLocale();
 const [lesson,setLesson]=useState<EditorialLesson|null>(null);
 const [attempt,setAttempt]=useState<EditorialAttempt|null>(null);
 // Latest optimistic edit must be synchronous so rapid fields never overwrite each other.
 const attemptRef=useRef<EditorialAttempt|null>(null);
 // Optimistic text edits must not unlock model answers or spell feedback.
 const [persistedAttempt,setPersistedAttempt]=useState<EditorialAttempt|null>(null);
 const [phase,setPhase]=useState<Phase>('read');
 useStepScreen(phase,id);
 const [busy,setBusy]=useState(true);
 const [reload,setReload]=useState(0);
 const [saving,setSaving]=useState(false);
 const [sync,setSync]=useState<SyncState>('unavailable');
 const [locked,setLocked]=useState(false);
 const [errorCopy,setError]=useState<BilingualCopy|null>(null);
 const error=errorCopy?localized(appLocale,...errorCopy):'';
 const subject=useRef<string|null>(null);
 const revision=useRef<string|null>(null);
 const chain=useRef<Promise<void>>(Promise.resolve());
 const pending=useRef(0),failed=useRef(false),mounted=useRef(true);
 const focusFrame=useRef(0);
 useEffect(()=>()=>{cancelAnimationFrame(focusFrame.current);},[]);
 function moveTo(next:Phase){
  setPhase(next);
  cancelAnimationFrame(focusFrame.current);
  focusFrame.current=requestAnimationFrame(()=>{
   const heading=document.getElementById('li-editorial-'+next);
   if(!heading||!heading.closest('[data-li-editorial-journey="'+id+'"]'))return;
   heading.setAttribute('tabindex','-1');
   heading.focus({preventScroll:true});
   heading.scrollIntoView({behavior:'auto',block:'start'});
  });
 }

 /** Reuse the app's existing Lão Lý modal, avatar and audited quote bank.
  * Scoped buttons are cleaned up when the native modal closes. */
 /** React Lão Lý owns its one live modal. Do not mutate React-owned DOM or
  * inject a second popup: send two localized actions and a curated quote view. */
 function openMentor(moment:CompanionMoment){
  const app=window as Window&{
   liBuddyReactMounted?:boolean;
   liQuoteEngine?:{lookup?:(id:string,locale:Locale)=>QuoteRecord|null};
  };
  const locale=appLocale;
  const candidates=moment.quote_ids.map(q=>app.liQuoteEngine?.lookup?.(q,locale)??null);
  if(!app.liBuddyReactMounted||candidates.length<3||
    candidates.some(q=>!q?.translation||!q.original||!q.url.startsWith('https://'))||
    candidates[0]?.id!==moment.quote_id){
   setError(['Chưa mở được Lão Lý hoặc chưa có đủ trích dẫn có nguồn cho mục này.','Elder Ly or the curated sources are unavailable for this section.']);
   return;
  }
  const quotes=candidates.map(q=>{
   const quote=q!;
   return {
    ...quote,
    translation:(locale==='en'?'Meaning: ':'Dịch nghĩa: ')+quote.translation,
    interpretation:(locale==='en'?'Interpretation: ':'Diễn nghĩa: ')+
     quote.interpretation+' · '+plain(moment.quote_relevance_md)
   };
  });
  const triggerId='li-editorial-mentor-'+id+'-'+moment.stage;
  setError(null);
  window.dispatchEvent(new CustomEvent('li:buddy-open',{detail:{
   text:plain(moment.prompt_md),labels:moment.actions.map(action=>action.label),
   avatar:'./assets/laoly-neutral.png',quote:quotes[0],triggerId,
   editorial:{
    actions:moment.actions.map(action=>({label:action.label,reply:plain(action.reply_md)})),
    quotes
   }
  }}));
 }
 function mentor(stage:CompanionMoment['stage']){
  const moment=lesson?.content.localized[appLocale].companion?.moments.find(m=>m.stage===stage);
  if(!moment||(moment.gate==='AFTER_VALID_INDEPENDENT_SUBMISSION'&&!persistedAttempt?.submitted))return null;
  return <aside className="li-editorial-mentor" aria-label={localized(appLocale,'Lão Lý','Elder Ly')}>
   <img src="./assets/laoly-neutral.png" width="56" height="56" alt="" loading="lazy"/>
   <div><Text role="support">{localized(appLocale,'Lão Lý','Elder Ly')}</Text>
    <Button id={'li-editorial-mentor-'+id+'-'+stage}
     variant="secondary" onClick={()=>openMentor(moment)}>
     {appLocale==='en'?'Ask Elder Ly about this section':'Hỏi Lão Lý theo mục này'}
    </Button>
   </div>
  </aside>;
 }

 async function refreshStatus(){
  if(!subject.current)return;
  try{
   const state=await ports.sync.getStatus({lessonId:id,subjectId:subject.current});
   if(mounted.current)setSync(state);
  }catch{if(mounted.current)setSync('unavailable');}
 }
 useEffect(()=>{
  const update=(e:Event)=>{
   const detail=(e as CustomEvent<{accountId?:string;lessonIds?:string[]}>).detail;
   if(detail?.accountId!==subject.current)return;
   void refreshStatus();
   if(detail.lessonIds?.includes(id)&&!failed.current&&pending.current===0)setReload(n=>n+1);
  };
  window.addEventListener('li:lesson-sync-applied',update);
  window.addEventListener('li:learning-sync-report',update);
  return()=>{
   window.removeEventListener('li:lesson-sync-applied',update);
   window.removeEventListener('li:learning-sync-report',update);
  };
 },[id,ports]);
 useEffect(()=>{
  mounted.current=true;let cancelled=false;
  setBusy(true);setError(null);
  (async()=>{
   try{
    if(!isReleasedLessonId(id))throw Error('LESSON_NOT_RELEASED');
    const learner=await ports.auth.requireInvitedLearner();
    if(!learner?.subjectId)throw Error('INVITE_REQUIRED');
    const source=await loadLesson(id);
    const saved=await ports.attempts.load({lessonId:id,subjectId:learner.subjectId});
    const a=saved?.attempt;
    if(!saved?.revision||!a||!Array.isArray(a.draft)||a.draft.length!==4||
     !a.draft.every(x=>typeof x==='string')||!Array.isArray(a.ratings)||a.ratings.length!==4||
     !['vi','en'].includes(a.locale)||typeof a.guidedDraft!=='string'||
     typeof a.submitted!=='boolean'||typeof a.reviewed!=='boolean')
     throw Error('INVALID_ATTEMPT');
    const state=await ports.sync.getStatus({lessonId:id,subjectId:learner.subjectId})
     .catch(()=>'unavailable' as SyncState);
    if(cancelled)return;
    subject.current=learner.subjectId;revision.current=saved.revision;
    attemptRef.current=a;
    setLesson(source);setAttempt(a);setPersistedAttempt(a);
    setPhase(returnToken(id)?.phase??resume(a));setSync(state);setBusy(false);
   }catch(cause){
    if(cancelled)return;
    const reason=cause instanceof Error?cause.message:'';
    const storageDenied=reason==='STORAGE_UNAVAILABLE';
    const recordError=reason==='INVALID_ATTEMPT'||reason==='LEARNING_RECORD_TOO_LARGE'||
     reason==='EDITORIAL_ATTEMPT_LOAD_FAILED';
    setBusy(false);
    setError(storageDenied?
     ['Trình duyệt đang chặn bộ nhớ lưu bài. Hãy bật quyền lưu dữ liệu cho trang rồi thử lại; app chưa tạo hoặc ghi đè bài làm.','Your browser is blocking storage. Allow site storage and retry. No work was created or overwritten.']:
     recordError?
     ['Không đọc được bản lưu của bài học. App chưa đặt lại hoặc ghi đè dữ liệu cũ. Hãy kiểm tra Tủ Riêng / đồng bộ trước khi thử lại.','Could not read your saved work. Check My Shelf or sync before retrying. Existing data was kept.']:
     ['Bài chưa phát hành, thiếu nội dung hợp lệ hoặc chưa xác minh được quyền học.','The lesson is unavailable, its content could not be loaded, or access could not be verified.']);
   }
  })();
  return()=>{cancelled=true;mounted.current=false;};
 },[id,ports,reload]);
 // Restore only when the lesson page is ACTIVE. A hidden page may be
 // mounted while the learner is still reading the Spellbook.
 useEffect(()=>{
  if(busy||!lesson)return;
  const page=document.querySelector('[data-li-editorial-journey="'+id+'"]')?.closest('section.page');
  if(!page)return;
  let outer=0,inner=0;
  const restore=()=>{
   if(!page.classList.contains('active'))return;
   const token=returnToken(id);
   if(!token){
    // Report a stale/malformed lesson-specific token once, never discard drafts.
    try{
     const stale=JSON.parse(sessionStorage.getItem(RETURN_KEY)||'null');
     if(stale?.id===id){
      sessionStorage.removeItem(RETURN_KEY);
      setError(['Vị trí quay lại đã hết hạn. Bài làm đã lưu không bị xoá.','The saved return position expired. Your saved work is still available.']);
     }
    }catch{/* Private session storage might be unavailable. */}
    return;
   }
   setPhase('methods');
   cancelAnimationFrame(outer);cancelAnimationFrame(inner);
   outer=requestAnimationFrame(()=>{
    inner=requestAnimationFrame(()=>{
     if(!page.classList.contains('active'))return;
     const anchor=document.getElementById(token.sectionId);
     if(!anchor||!page.contains(anchor))return;
     const heading=document.getElementById('li-editorial-methods');
     heading?.setAttribute('tabindex','-1');
     heading?.focus({preventScroll:true});
     window.scrollTo({top:Math.max(0,token.scrollY),behavior:'auto'});
     try{sessionStorage.removeItem(RETURN_KEY);}catch{/* no draft changed */}
    });
   });
  };
  const observer=new MutationObserver(restore);
  observer.observe(page,{attributes:true,attributeFilter:['class']});
  restore();
  return()=>{observer.disconnect();cancelAnimationFrame(outer);cancelAnimationFrame(inner);};
 },[id,busy,lesson]);

 function save(next:EditorialAttempt):Promise<boolean>{
  if(locked||failed.current||!subject.current||!revision.current)return Promise.resolve(false);
  attemptRef.current=next;
  setAttempt(next);pending.current++;setSaving(true);
  const target=subject.current;
  const operation=chain.current.then(async()=>{
   if(failed.current||!revision.current)throw Error('SAVE_LOCKED');
   const result=await ports.attempts.save({
    lessonId:id,subjectId:target,attempt:next,expectedRevision:revision.current
   });
   if(!result?.revision)throw Error('SAVE_WITHOUT_REVISION');
   revision.current=result.revision;
    if(mounted.current)setPersistedAttempt(next);
    return true;
  }).catch(cause=>{
   failed.current=true;
   if(mounted.current){
    const denied=cause instanceof Error&&cause.message==='STORAGE_UNAVAILABLE';
    setLocked(true);setError(denied?
     ['Trình duyệt chặn lưu dữ liệu. Giữ trang mở, cấp quyền lưu rồi thử lại; chưa xác nhận bản nháp đã lưu.','Your browser is blocking storage. Keep the page open, allow storage, and retry saving.']:
     ['Lưu thất bại. Giữ trang mở để thử lại, không ghi đè thiết bị khác.','Could not save. Keep this page open to retry. Other devices were not overwritten.']);
   }
   return false;
  });
  chain.current=operation.then(async ok=>{if(ok)await refreshStatus();}).catch(()=>{});
  void chain.current.finally(()=>{pending.current--;if(mounted.current)setSaving(pending.current>0);});
  return operation;
 }
 async function retry(){
  if(!attempt||!subject.current||!failed.current||pending.current>0)return;
  setSaving(true);
  try{
   const learner=await ports.auth.requireInvitedLearner();
   if(learner.subjectId!==subject.current)throw Error('ACCOUNT_CHANGED');
   const latest=await ports.attempts.load({lessonId:id,subjectId:learner.subjectId});
   // Do not clobber cross-device edits on CAS failure.
   if(latest.revision!==revision.current&&JSON.stringify(latest.attempt)!==JSON.stringify(attempt)){
    setError(['Có thay đổi từ thiết bị khác. Bản chưa lưu vẫn ở màn hình; không tự ghi đè.','Data changed on another device. Your unsaved work is still here and nothing was overwritten.']);
    return;
   }
   const result=await ports.attempts.save({lessonId:id,subjectId:learner.subjectId,
    attempt,expectedRevision:latest.revision});
   revision.current=result.revision;setPersistedAttempt(attempt);
    failed.current=false;setLocked(false);setError(null);
   await refreshStatus();
  }catch{
   setError(['Chưa lưu lại được. Giữ trang mở và kiểm tra kết nối.','Could not save. Keep this page open and check your connection.']);
  }finally{if(mounted.current)setSaving(false);}
 }
 /** Compose edits from the current in-flight draft, not the last React render.
  * A rapid T06 classification followed by a text edit must preserve BOTH. */
 function edit(update:(current:EditorialAttempt)=>EditorialAttempt){
  const current=attemptRef.current;
  if(!current||locked||failed.current||current.submitted)return;
  void save(update(current));
 }
 function editGuided(value:string){
  if(value.length>MAX)return;
  edit(current=>({...current,guidedDraft:value}));
 }
 function chooseMethod(choice:MethodChoice){
  if(!attempt||locked||saving||attempt.submitted||attempt.methodChoice===choice)return;
  void save({...attempt,methodChoice:choice});
 }
 async function openGuide(method:Method){
  if(!attempt||locked||failed.current)return;
  await chain.current;
  if(failed.current||pending.current>0){
   setError(['Chờ lưu xong bản nháp trước khi mở Sổ Tay Thần Chú.','Wait for your draft to finish saving before opening the Spellbook.']);return;
  }
  const host=window as Window&{liMethods?:{open:(id:string,practice?:boolean)=>void}};
  if(!host.liMethods?.open){setError(['Sổ Tay Thần Chú chưa khả dụng.','The Spellbook is unavailable.']);return;}
  try{
   sessionStorage.setItem(RETURN_KEY,JSON.stringify({
    id,phase:'methods',sectionId:'l0911-method',
    locale:attempt.locale,scrollY:window.scrollY,
    method,at:Date.now()
   } satisfies GuideReturn));
  }catch{setError(['Không giữ được vị trí quay lại; bài học vẫn được lưu.','Could not keep your return position. Your lesson is still saved.']);return;}
  try{
   host.liMethods.open(method,false);
   if(!document.getElementById('page-guideDetail')?.classList.contains('active'))
    throw Error('GUIDE_ROUTE_UNAVAILABLE');
  }catch{
   try{sessionStorage.removeItem(RETURN_KEY);}catch{/* keep draft */}
   setError(['Chưa mở được Sổ Tay Thần Chú. Bản nháp vẫn được giữ.','Could not open the Spellbook. Your draft was kept.']);
  }
 }
 function methodClassify(letter:typeof T06_CASES[number],value:string){
  if(!categories.includes(value as MethodCategory)&&value!=='')return;
  edit(current=>{
   const previous=fromAttempt(current,'T06');
   if(previous.submittedAt)return current;
   const classifications={...previous.classifications};
   if(value)classifications[letter]=value as MethodCategory;
   else delete classifications[letter];
   return {...current,methodAttempts:{...current.methodAttempts,
    T06:{...previous,classifications}}};
  });
 }
 function methodEdit(method:Method,value:string){
  if(value.length>MAX)return;
  edit(current=>{
   const previous=fromAttempt(current,method);
   if(previous.submittedAt)return current;
   return {...current,methodAttempts:{...current.methodAttempts,
    [method]:{...previous,draft:value}}};
  });
 }
 async function methodSubmit(method:Method){
  if(!attempt||locked||saving||attempt.submitted)return;
  const previous=fromAttempt(attempt,method);
  if(previous.submittedAt||previous.draft.trim().length<MIN){
   setError(['Viết ít nhất 12 ký tự trước khi xem phản hồi Thần Chú.','Write at least 12 characters before viewing spell feedback.']);return;
  }
  if(method==='T06'&&T06_CASES.some(k=>!previous.classifications?.[k])){
   setError(['T06 cần phân loại đủ A–D và giải thích lý do.','For T06, classify all items A–D and explain why.']);return;
  }
  setError(null);
  // K3 enacted spell != K7 assisted independent answer. The latter tracks
  // explicit hint usage, not merely completing optional method practice.
  const next={...attempt,methodAttempts:{...attempt.methodAttempts,
   [method]:{...previous,submission:previous.draft,submittedAt:new Date().toISOString()}}};
  await save(next);
 }
 function editAnswer(index:number,value:string){
  if(index<0||index>3||value.length>MAX)return;
  edit(current=>{
   const draft=[...current.draft] as Attempt['draft'];draft[index]=value;
   return {...current,draft};
  });
 }
 async function submit(){
  if(!attempt||!lesson||locked||saving||attempt.submitted)return;
  if(attempt.draft.some(s=>s.trim().length<MIN)){
   setError(['Cần trả lời đủ 4 câu, mỗi câu ít nhất 12 ký tự.','Answer all four questions with at least 12 characters each.']);return;
  }
  // Freeze the same VI/EN rubric and solution used for this submission.
  // A later content release must never silently change an already submitted review.
  const rubricVersion=lesson.version+':rubric:0-8';
  const reviewSnapshot:EditorialReviewSnapshot={
   contentVersion:lesson.version,rubricVersion,
   modelAnswer:{
    vi:lesson.content.localized.vi.independent.model_answer_md,
    en:lesson.content.localized.en.independent.model_answer_md
   },
   questions:{
    vi:quiz(lesson.content.localized.vi.independent.prompt_md).questions as [string,string,string,string],
    en:quiz(lesson.content.localized.en.independent.prompt_md).questions as [string,string,string,string]
   },
   criteria:{
    vi:rubricRows(lesson.content.localized.vi.reflection.md),
    en:rubricRows(lesson.content.localized.en.reflection.md)
   }
  };
  setError(null);
  const next:Attempt={...attempt,submitted:true,submittedAt:new Date().toISOString(),
   submission:[...attempt.draft] as Attempt['submission'],submissionLocale:attempt.locale,
   contentVersion:lesson.version,rubricVersion,reviewSnapshot,
   attemptNumber:attempt.attemptNumber??1,answerRevealed:false};
  if(await save(next))moveTo('feedback');
 }
 async function revealAnswer(){
  if(!attempt||!lesson||!persistedAttempt?.submitted||locked||saving||
     persistedAttempt.answerRevealed||
     (attempt.contentVersion!==lesson.version&&!attempt.reviewSnapshot))return;
  setError(null);
  if(await save({...attempt,answerRevealed:true})){
   cancelAnimationFrame(focusFrame.current);
   focusFrame.current=requestAnimationFrame(()=>{
    const heading=document.getElementById('li-editorial-answer');
    if(!heading)return;
    heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
    heading.scrollIntoView({behavior:'auto',block:'start'});
   });
  }
 }
 function rate(index:number,value:string){
  if(!persistedAttempt?.answerRevealed||locked||index<0||index>3||
     !['','0','1','2'].includes(value))return;
  const current=attemptRef.current;
  if(!current||current.reviewed||failed.current)return;
  const ratings=[...current.ratings] as Attempt['ratings'];
  ratings[index]=value===''?null:Number(value) as 0|1|2;
  void save({...current,ratings});
 }
 async function finish(){
  if(!attempt||!lesson||!persistedAttempt?.answerRevealed||locked||saving||
     !attempt.submitted||attempt.reviewed||
     (attempt.contentVersion!==lesson.version&&!attempt.reviewSnapshot))return;
  if(attempt.ratings.some(v=>v===null)){
   setError(['Chọn đủ bốn tiêu chí tự đánh giá.','Rate all four self-review criteria.']);return;
  }
  setError(null);
  if(await save({...attempt,reviewed:true,reviewedAt:new Date().toISOString()}))
   moveTo('progress');
 }
 async function restartLesson(){
  if(!attempt||locked||saving||pending.current>0)return;
  if(!confirmLessonRestart(id,attempt.locale))return;
  setError(null);
  if(await save(freshLessonAttempt(attempt)))moveTo('read');
 }
 async function newAttempt(){
  if(!attempt||!lesson||!persistedAttempt?.reviewed||locked||saving)return;
  const frozen=persistedAttempt;
  if(!frozen.submission||!frozen.submissionLocale||!frozen.submittedAt||
     frozen.ratings.some(r=>r===null)){
   setError(['Chưa có lượt nộp đầy đủ để lưu vào lịch sử.','Complete a submission before saving it to history.']);return;
  }
  const prior:PastEditorialAttempt={
   submission:[...frozen.submission] as PastEditorialAttempt['submission'],
   submissionLocale:frozen.submissionLocale,submittedAt:frozen.submittedAt,
   ratings:[...frozen.ratings] as PastEditorialAttempt['ratings'],
   reviewedAt:frozen.reviewedAt??null,answerRevealed:!!frozen.answerRevealed,
   contentVersion:frozen.contentVersion??lesson.version,
   rubricVersion:frozen.rubricVersion??lesson.version+':rubric:0-8',
   attemptNumber:frozen.attemptNumber??1,
   guidedDraft:frozen.guidedDraft,hint:frozen.hint,
   methodChoice:frozen.methodChoice??null,methodAttempts:frozen.methodAttempts,
   questionPrompts:frozen.reviewSnapshot?.questions
  };
  const history=[...(frozen.attemptHistory??[]),prior];
  const next:Attempt={...initial(),locale:frozen.locale,attemptHistory:history,
   attemptNumber:prior.attemptNumber+1,contentVersion:lesson.version,
   rubricVersion:lesson.version+':rubric:0-8',methodChoice:null,answerRevealed:false};
  if(JSON.stringify(next).length>=55000){
   setError(['Lịch sử sắp vượt giới hạn lưu trữ. Chưa tạo lượt mới để tránh mất bài cũ.','History is nearly full. A new attempt was not created, so previous work remains saved.']);return;
  }
  setError(null);
  if(await save(next))moveTo('read');
 }
 // Settings is the single language source for all lesson screens.
 useEffect(()=>{
  if(busy||!attempt||attempt.locale===appLocale||locked||saving||pending.current>0)return;
  void save({...attempt,locale:appLocale});
 },[appLocale,attempt?.locale,busy,locked,saving]);
 if(busy)return <section role="status" className="li-learning-journey" aria-busy="true">
  {localized(appLocale,'Đang xác minh quyền học và tải nội dung…','Verifying access and loading the lesson…')}
 </section>;
 if(!lesson||!attempt)return <section role="alert" className="li-learning-journey">
  <Text>{error||localized(appLocale,'Không tải được bài.','Could not load the lesson.')}</Text>
  <Button onClick={()=>setReload(n=>n+1)}>{localized(appLocale,'Thử lại','Try again')}</Button>
 </section>;
 const locale=appLocale,vi=locale==='vi',content=lesson.content.localized[locale];
 const independent=quiz(content.independent.prompt_md);
 const submittedQuestions=attempt.reviewSnapshot?.questions[locale]??independent.questions;
 const rubrics=attempt.reviewSnapshot?.criteria[locale]??rubricRows(content.reflection.md);
 const modelAnswer=attempt.reviewSnapshot?.modelAnswer[locale]??
  content.independent.model_answer_md;
 const reviewVersionMismatch=attempt.submitted&&!!attempt.contentVersion&&
  attempt.contentVersion!==lesson.version&&!attempt.reviewSnapshot;
 const labels:Record<Phase,string>=vi?
  {read:'Đọc bài',guided:'Thử áp dụng',methods:'Thần Chú',practice:'Làm bài',feedback:'Đối chiếu',progress:'Tiến độ'}:
  {read:'Learn',guided:'Guided example',methods:'Spells',practice:'Practice',feedback:'Feedback',progress:'Progress'};
 const answered=attempt.draft.filter(v=>v.trim().length>=MIN).length;
 const rated=attempt.ratings.filter(v=>v!==null).length;
 const state:SaveState=locked?'error':saving?'saving':sync==='synced'?'synced':
  (sync==='queued'||sync==='conflict')?'queued':sync==='on-device'?'saved-device':'unavailable';
 const message=locked?(vi?'Lưu thất bại':'Save failed'):
  saving?(vi?'Đang lưu…':'Saving…'):sync==='synced'?(vi?'Đã đồng bộ':'Synced'):
  sync==='queued'?(vi?'Đã lưu · chờ đồng bộ':'Saved · awaiting sync'):
  sync==='conflict'?(vi?'Bài này có xung đột · mở Tài khoản để chọn bản':'Lesson conflict · choose a version in Account'):
  sync==='on-device'?(vi?'Đã lưu trên thiết bị':'Saved on device'):
  (vi?'Chưa xác nhận đồng bộ':'Sync unconfirmed');
 const progress=persistedAttempt?.reviewed?100:
  persistedAttempt?.submitted?75:Math.round(answered/4*50);
 return <section className="li-learning-journey" data-li-editorial-journey={id}
  data-li-react-journey={id} data-li-lesson-phase={phase} lang={locale}>
  <header className="li-learning-header">
   <div>
    <Heading level={1} id={'li-react-'+id+'-title'} role="headline">{lesson.title[locale]}</Heading>
    <Text role="caption">{lesson.hierarchy.field.title} · {id}</Text>
   </div>
   <div className="li-learning-header-actions">
    <details className="li-lesson-header-more">
     <summary>{vi?'Tùy chọn':'Options'}</summary>
     <Button variant="secondary" disabled={locked||saving||pending.current>0}
      onClick={()=>void restartLesson()}>{vi?'Học lại từ đầu':'Restart lesson'}</Button>
    </details>
   </div>
  </header>
    <StudyBookFolio phase={phase} steps={phases} locale={locale}/>
  <aside className="li-learning-rail" aria-label="Learning navigation and status">
  <div className="li-learning-save">
   <Progress label={vi?'Tiến độ lượt học':'Lesson attempt progress'} value={progress}/>
   <SaveStatus state={state} message={message} detail={locked?error:undefined}/>
   <Text role="support">{persistedAttempt?.reviewed?(vi?'Đã tự đánh giá · chưa phải thông thạo':'Self-reviewed, not mastery'):
    persistedAttempt?.submitted?(vi?'Đã nộp · tự chấm '+rated+'/4':'Submitted · '+rated+'/4 ratings'):
    (vi?'Đủ điều kiện nộp '+answered+'/4':'Ready '+answered+'/4')}</Text>
   {attempt.assisted&&<Text role="support">
    {vi?'Đã mở gợi ý có hỗ trợ (K7)':'A guided hint was used (K7)'}</Text>}
   <Text role="support">{'K1: '}{persistedAttempt?.submitted?
    (vi?'Đã nộp 4 câu độc lập (chưa chấm đúng/sai)':'Four independent answers submitted (not automatically graded)'):'—'}
    {' · K2: '+(persistedAttempt?.methodChoice??'—')}
    {' · K3: '}{(['T06','T07'] as const).filter(k=>
     !!persistedAttempt?.methodAttempts?.[k]?.submittedAt).join(', ')||'—'}
    {' · K4: '}{(persistedAttempt?.guidedDraft.trim().length??0)>=MIN?
      (vi?'Đã giải thích (chưa chấm)':'Explanation written (ungraded)'):'—'}
    {' · K7: '}{persistedAttempt?.hint?(vi?'Đã mở gợi ý':'Hint used'):'—'}
   </Text>
   {!!attempt.attemptHistory?.length&&<details className="li-editorial-attempt-history">
    <summary>{vi?'Lịch sử các lượt đã lưu':'Saved attempt history'} · {attempt.attemptHistory.length}</summary>
    <ol>{attempt.attemptHistory.map((previous,i)=><li key={i}>
     <strong>{vi?'Lượt':'Attempt'} {previous.attemptNumber}</strong>
     {' · '}{previous.submittedAt.slice(0,10)}
     {' · '}{previous.ratings.reduce<number>((n,x)=>n+(x??0),0)}/8
     {' · '}{previous.contentVersion}
     <details><summary>{vi?'Xem bản đã nộp':'Read frozen submission'}</summary>
      <ol>{previous.submission.map((answer,k)=><li key={k} className="li-learning-submitted-answer">
       {previous.questionPrompts?.[locale]?.[k]&&
        <Text role="support">{previous.questionPrompts[locale][k]}</Text>}
       <p>{answer}</p>
      </li>)}</ol>
     </details>
    </li>)}</ol>
   </details>}
  </div>
  </aside>
  {error&&!locked&&<p role="alert" className="li-learning-error">{error}</p>}
  {locked&&<div className="li-learning-recovery">
   <Button onClick={()=>void retry()} disabled={saving}>{vi?'Thử lưu lại':'Retry saving'}</Button>
   <Text role="support">{vi?'Đừng tải lại khi còn bản chưa lưu.':'Keep this page open with unsaved work.'}</Text>
  </div>}
  <motion.div key={phase} initial={reduced?false:{opacity:0,x:12,rotateY:-1}}
   animate={{opacity:1,x:0,rotateY:0}} transition={reduced?{duration:0}:{duration:0.18}}
   className="li-learning-current">
   
   {phase==='read'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-editorial-read">
    <section id="l0911-hook"><Markdown md={content.hook.md}/>{mentor('opening')}</section>
    <Heading level={2} id="li-editorial-read" role="titleLarge">{vi?'Hiểu bản chất':'Understand the concepts'}</Heading>
    <section id="l0911-goals"><Markdown md={content.goals.md}/></section>
    <section id="l0911-concept"><Markdown md={content.concept.md}/>
     <PopulationDiagram illustration={content.illustration}/>
     <section id="l0911-variables"><Markdown md={content.variable_types.md}/></section>{mentor('concept')}</section>
    <Heading level={3} role="titleMedium">{vi?'Nguồn để đọc thêm':'Read the sources'}</Heading>
    <ul>{lesson.sources.filter(s=>s.url.startsWith('https://')).map(s=><li key={s.url}>
     <a href={s.url} target="_blank" rel="noopener noreferrer"
      aria-label={s.title+(vi?' (mở tab mới)':' (opens in a new tab)')}>{s.title}</a>
    </li>)}</ul>
    <Button onClick={()=>moveTo('guided')}>{vi?'Tiếp: Thử áp dụng':'Next: Guided example'} →</Button>
   </Card>}
   {phase==='guided'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-editorial-guided">
    <Heading level={2} id="li-editorial-guided" role="titleLarge">{labels.guided}</Heading>
    <section id="l0911-guided"><Markdown md={content.guided.md}/>{mentor('guided')}</section>
    {persistedAttempt?.hint?<div className="li-learning-hint"><Markdown md={content.guided.hint_md??''}/></div>:
     <Button variant="secondary" disabled={saving||locked} onClick={()=>{if(attempt&&!attempt.hint)void save({...attempt,hint:true,assisted:true});}}>
      {vi?'Mở gợi ý':'Show hint'}
     </Button>}
    <Field kind="textarea" rows={5} label={vi?'Tự giải thích bằng lời của mình':'Explain in your own words'}
     value={attempt.guidedDraft} disabled={locked||attempt.submitted} onChange={e=>editGuided(e.currentTarget.value)}/>
    <CopyAnalysisPrompt locale={locale} step="guided" data={{
     title:lesson.title[locale],lessonId:id,activity:content.guided.md,
     questions:[vi?'Giải thích ví dụ bằng lời của ngươi.':'Explain the example in your own words.'],
     answers:[attempt.guidedDraft],
     reference:persistedAttempt?.hint?content.guided.hint_md:undefined
    }}/>
    <Button onClick={()=>moveTo('methods')}>{vi?'Tiếp: Thần Chú':'Next: Study methods'} →</Button>
   </Card>}
   {phase==='methods'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-editorial-methods">
    <Heading level={2} id="li-editorial-methods" role="titleLarge">{labels.methods}</Heading>
    <Text role="support">{vi?'T06 là gợi ý chính, T07 bổ trợ. Cả hai đều không bắt buộc.':
     'T06 is primary and T07 supplementary; both are optional.'}</Text>
    <div id="l0911-method" className="li-editorial-method-choice" role="group" aria-label={vi?'Chọn Thần Chú (K2)':'Choose a method (K2)'}>
     {(['T06','T07','skip'] as const).map(choice=><Button key={choice}
      variant={attempt.methodChoice===choice?'primary':'secondary'}
      aria-pressed={persistedAttempt?.methodChoice===choice}
      disabled={locked||saving||attempt.submitted} onClick={()=>chooseMethod(choice)}>
      {choice==='skip'?(vi?'Không dùng Thần Chú':'Skip method'):choice}
     </Button>)}
    </div>
    <Text role="support">{vi?'K2: chọn phương pháp. K3: chỉ ghi nhận khi đã nộp lượt luyện; mở hướng dẫn không tính hoàn thành.':
     'K2 records a choice. K3 requires a submitted exercise; opening the guide is not completion.'}</Text>
    {(['T06','T07'] as const).map(method=>{
     const item=fromAttempt(attempt,method),copy=content.technique_applications[method];
      const persisted=fromAttempt(persistedAttempt??attempt,method);
      const feedbackUnlocked=!!persistedAttempt&&!!persisted.submittedAt;
     return <section className="li-learning-method" key={method}
      aria-label={(vi?'Luyện Thần Chú ':'Spell practice ')+method}>
      <Heading level={3} role="titleMedium">{method}</Heading>
      <Markdown md={copy.prompt_md}/>
      <Button variant="ghost" disabled={saving||locked} onClick={()=>void openGuide(method)}>
       {vi?'Mở Sổ Tay Thần Chú · '+method:'Open five-step Spellbook · '+method}
      </Button>
      {method==='T06'&&<div className="li-editorial-t06-cases" role="group"
       aria-label={vi?'Phân loại bốn trường A–D':'Classify four fields A–D'}>
       {T06_CASES.map(letter=>{
      const sourceLine=copy.prompt_md.split('\n').find(line=>
       line.trim().startsWith('- '+letter+'. '));
      const caseLabel=sourceLine?.trim().slice(5).replace(/<[^>]+>/g,'')??letter;
      return <label key={letter} className="li-editorial-t06-case">
       <strong>{letter} · {caseLabel}</strong>
       <select value={item.classifications?.[letter]??''}
        disabled={locked||attempt.submitted||!!item.submittedAt}
        onChange={e=>methodClassify(letter,e.currentTarget.value)}>
        <option value="">{vi?'Chọn loại biến':'Select type'}</option>
        {categories.map(cat=><option key={cat} value={cat}>{categoryLabels[locale][cat]}</option>)}
       </select>
      </label>;
     })}
      </div>}
      <Field kind="textarea" rows={4} label={vi?'Giải thích lập luận':'Your reasoning'}
       value={item.draft} disabled={locked||attempt.submitted||!!item.submittedAt}
       onChange={e=>methodEdit(method,e.currentTarget.value)}/>
      {!feedbackUnlocked?<Button variant="secondary"
       disabled={saving||locked||attempt.submitted||!!item.submittedAt}
       onClick={()=>void methodSubmit(method)}>{vi?'Nộp lượt luyện':'Submit spell attempt'}</Button>:
       <div role="note" className="li-learning-hint">
        <Text role="support">{vi?'Đã lưu câu trả lời, giờ mới mở phản hồi.':'Attempt saved; feedback unlocked.'}</Text>
        {method==='T06'&&persisted.classifications&&<p className="li-learning-submitted-answer">
         {T06_CASES.map(k=>k+': '+(persisted.classifications?.[k]??'—')).join(' · ')}
        </p>}
        <p className="li-learning-submitted-answer">{persisted.submission}</p>
        {method==='T06'&&persisted.classifications&&copy.answer_key&&
         <div className="li-learning-table-scroll">
          <table>
           <caption>{vi?'Đối chiếu từng trường A–D':'Compare each field A–D'}</caption>
           <thead><tr>
            <th scope="col">{vi?'Trường':'Field'}</th>
            <th scope="col">{vi?'Đã chọn':'Your choice'}</th>
            <th scope="col">{vi?'Đáp án':'Expected'}</th>
            <th scope="col">{vi?'Đối chiếu':'Comparison'}</th>
           </tr></thead>
           <tbody>{T06_CASES.map(letter=>{
            const selected=persisted.classifications?.[letter];
            const expected=copy.answer_key?.[letter];
            const same=selected===expected;
            return <tr key={letter}>
             <th scope="row">{letter}</th>
             <td>{selected?categoryLabels[locale][selected]:'—'}</td>
             <td>{expected?categoryLabels[locale][expected]:'—'}</td>
             <td>{same?(vi?'Khớp loại biến':'Type matches'):
              (vi?'Xem lại loại biến':'Revisit type')}</td>
            </tr>;
           })}</tbody>
          </table>
          <Text role="support">{vi?
           'Chỉ đối chiếu nhãn loại biến; phần giải thích chưa được chấm. Nộp T06 không chứng minh thông thạo.':
           'Only variable-type labels are compared. Reasoning is not automatically graded; submitting T06 is not mastery.'}</Text>
         </div>}
        <Markdown md={copy.feedback_md}/>
       </div>}
     </section>;
    })}
    <Button onClick={()=>moveTo('practice')}>{vi?'Tiếp: Làm bài':'Next: Practice'} →</Button>
   </Card>}
   {phase==='practice'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-editorial-practice">
    <Heading level={2} id="li-editorial-practice" role="titleLarge">{labels.practice}</Heading>
    <section id="l0911-challenge"><Markdown md={independent.intro}/>{mentor('independent')}</section>
    <div className="li-learning-fields">
     {independent.questions.map((q,i)=><Field key={i} kind="textarea" rows={4}
      label={String(i+1)+'. '+q} value={attempt.draft[i]} disabled={locked||attempt.submitted}
      onChange={e=>editAnswer(i,e.currentTarget.value)}/>)}
    </div>
    {!persistedAttempt?.submitted?<Button disabled={saving||locked||attempt.submitted} onClick={()=>void submit()}>
     {vi?'Nộp bài độc lập':'Submit independent answers'}</Button>:
     <Button onClick={()=>moveTo('feedback')}>{vi?'Tiếp: Đối chiếu':'Next: Feedback'} →</Button>}
    <CopyAnalysisPrompt locale={locale} step="practice" data={{
     title:lesson.title[locale],lessonId:id,activity:independent.intro,
     questions:independent.questions,answers:attempt.draft
    }}/>
   </Card>}
   {phase==='feedback'&&persistedAttempt?.submitted&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-editorial-feedback">
    <Heading level={2} id="li-editorial-feedback" role="titleLarge">{labels.feedback}</Heading>
    <Heading level={3} role="titleMedium">{vi?'Bài đã nộp':'Your submission'}</Heading>
    <ol className="li-learning-submission-list">
     {submittedQuestions.map((q,i)=><li key={i}>
      <Text role="support">{q}</Text>
      <p className="li-learning-submitted-answer">{(persistedAttempt.submission??persistedAttempt.draft)[i]}</p>
     </li>)}
    </ol>
    {(!persistedAttempt.answerRevealed||reviewVersionMismatch)?
     <div className="li-learning-hint">
      <Text role="support">{vi?
       'Bài làm đã lưu. Đáp án mẫu vẫn đóng đến khi được mở.':
       'Your answers are saved. The model answer stays hidden until you choose to reveal it.'}</Text>
      {reviewVersionMismatch&&<Text role="support">{vi?
       'Bài đã nộp theo phiên bản cũ nhưng thiếu bản chụp rubric. Bài làm vẫn được giữ nguyên; không dùng đáp án mới để chấm sai phiên bản.':
       'This submitted attempt predates a rubric revision and has no frozen review. Your answers remain saved; the new rubric cannot be applied to the old attempt.'}</Text>}
      <Button disabled={saving||locked||reviewVersionMismatch} onClick={()=>void revealAnswer()}>
       {vi?'Mở đáp án và rubric':'Reveal model answer and rubric'}
      </Button>
     </div>:
     <>
      <Heading id="li-editorial-answer" level={3} role="titleMedium">{vi?'Đáp án mẫu · đã mở sau khi lưu':'Model answer · revealed after saving'}</Heading>
      <Markdown md={modelAnswer}/>
      <section id="l0911-reflection"><Markdown md={content.reflection.md}/>{mentor('reflection')}</section>
      <Heading level={3} role="titleMedium">{vi?'Tự đánh giá 4 tiêu chí':'Self-rate four criteria'}</Heading>
     </>}
    {persistedAttempt.answerRevealed&&!reviewVersionMismatch&&[0,1,2,3].map(i=><div className="li-learning-rating" key={i}>
     <label htmlFor={'li-editorial-rating-'+id+'-'+i}>
      <strong>{rubrics[i]?.[0]??((vi?'Tiêu chí ':'Criterion ')+(i+1))}</strong>
     </label>
     <select id={'li-editorial-rating-'+id+'-'+i} value={attempt.ratings[i]??''}
      disabled={locked||attempt.reviewed} onChange={e=>rate(i,e.currentTarget.value)}>
      <option value="">{vi?'Chưa chấm':'Unrated'}</option>
      {([0,1,2] as const).map(score=><option key={score} value={score}>
       {score+' · '+(rubrics[i]?.[score+1]??'')}
      </option>)}
     </select>
    </div>)}
    {persistedAttempt.answerRevealed&&!reviewVersionMismatch&&(persistedAttempt.reviewed?
     <Button onClick={()=>moveTo('progress')}>{vi?'Tiếp: Tiến độ':'Next: Progress'} →</Button>:
     <Button disabled={saving||locked||attempt.reviewed||reviewVersionMismatch} onClick={()=>void finish()}>
      {vi?'Lưu tự đánh giá':'Save self-review'}
     </Button>)}
    <CopyAnalysisPrompt locale={locale} step="feedback" data={{
     title:lesson.title[locale],lessonId:id,activity:independent.intro,
     questions:submittedQuestions,answers:persistedAttempt.submission??persistedAttempt.draft,
     reference:persistedAttempt.answerRevealed&&!reviewVersionMismatch?modelAnswer:undefined,
     extra:persistedAttempt.answerRevealed&&!reviewVersionMismatch?rubrics.map(r=>r.join(' · ')).join('\n'):undefined
    }}/>
   </Card>}
   {phase==='progress'&&persistedAttempt?.reviewed&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-editorial-progress">
    <Heading level={2} id="li-editorial-progress" role="titleLarge">{vi?'Hoàn thành lượt học':'Attempt complete'}</Heading>
    <Text>{vi?'Đây là một lượt tự đánh giá đã lưu, không phải chứng nhận thông thạo.':
     'A saved self-assessment, not a mastery certificate.'}</Text>
    <Text>{vi?'Điểm tự chấm':'Self-rating'}: {persistedAttempt.ratings.reduce<number>((n,v)=>n+(v??0),0)} / 8</Text>
    <Text role="support">{vi?'K5 chưa đo: luyện lại ngay không chứng minh nhớ lâu.':'K5 not measured: an immediate retry does not prove retention.'}</Text>
    <Button variant="secondary" disabled={saving||locked} onClick={()=>void newAttempt()}>
     {vi?'Luyện lượt mới · giữ lịch sử':'New practice round · keep history'}
    </Button>
    <section id="l0911-extension" className="li-editorial-extension">
     <Markdown md={content.extension.intro_md}/>
     <Heading level={3} role="titleMedium">{vi?'Nguồn theo cấp':'Source tiers'}</Heading>
     <ul>{content.extension.sources.map(src=><li key={src.url}>
      <Text role="support">{src.tier==='intro'?(vi?'Nhập môn':'Intro'):(vi?'Đọc sâu':'Core')}</Text>
      {' · '}<a href={src.url} target="_blank" rel="noopener noreferrer"
       aria-label={src.title+(vi?' (mở tab mới)':' (opens in a new tab)')}>{src.title}</a>
     </li>)}</ul>
     <Heading level={3} role="titleMedium">{vi?'Truy vấn gợi ý':'Suggested queries'}</Heading>
     <ul>{content.extension.searchQueries.map(q=><li key={q}><Button variant="ghost"
      onClick={()=>ports.search.openSearch(q)}>{q}</Button></li>)}</ul>
     <Heading level={3} role="titleMedium">{vi?'Đối chiếu với nguồn':'Source-aware research prompt'}</Heading>
     <p className="li-learning-copy">{content.extension.sourcePrompt}</p>
     <CopyPromptAction locale={locale} prompt={content.extension.sourcePrompt}/>
     <Heading level={3} role="titleMedium">{vi?'Tự nhớ lại · chưa có đáp án':'Active recall · no answers shown'}</Heading>
     <ol>{content.extension.recallQuestions.map(q=><li key={q}>{q}</li>)}</ol>
     <Text role="support">{vi?'K5 · Chưa đo khả năng nhớ lại sau nhiều ngày.':'K5 · Delayed recall has not been measured.'}</Text>
     {mentor('extension')}
    </section>
    <Button variant="secondary" onClick={()=>ports.search.openSearch(lesson.title[locale])}>
     {vi?'Tra cứu kiến thức liên quan':'Explore related knowledge'}</Button>
   </Card>}
  </motion.div>
 </section>;
}

/** Reuse the existing safe Markdown renderer in the sectioned lesson surface. */
export {Markdown};
