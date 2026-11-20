import React,{useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {initial} from '../native-bridge';
import type {Attempt,MethodAttempt,MethodCategory,MethodChoice,PastEditorialAttempt} from '../native-bridge';
import type {LearningPorts,SyncState} from './ports';
import {isReleasedLessonId} from './released-lessons';
import {Button,Card} from '../../../../design-system/react/Components';
import {Field} from '../../../../design-system/react/Controls';
import {Heading,Text,Progress} from '../../../../design-system/react/Atoms';
import {SaveStatus} from '../../../../design-system/react/Molecules';
import type {SaveState} from '../../../../design-system/react/Molecules';
import './journey.css';

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
type MethodCopy={prompt_md:string;feedback_md:string;feedback_gate:string};
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
 rights:{text:'first_party'};
 sources:{title:string;url:string;usage?:string}[];
};
type EditorialAttempt=Attempt;
const MIN=12,MAX=4000;
const RETURN_KEY='li.editorial.guide-return.v1';
const categories:MethodCategory[]=['nominal','ordinal','discrete','continuous'];
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
function rubricNames(md:string):string[]{
 const rows=md.split(/\r?\n/).map(line=>line.trim()).filter(line=>line.startsWith('|'));
 return rows.slice(2).map(line=>line.replace(/^\||\|$/g,'').split('|')[0].trim());
}
function parseLesson(source:unknown,id:string):EditorialLesson{
 if(!source||typeof source!=='object')throw Error('MISSING_EDITORIAL_CONTENT');
 const l=source as Partial<EditorialLesson>;
 if(l.id!==id||l.publishState!=='review_only'||
  !['verified','approved'].includes(l.reviewState??'')||
  l.rights?.text!=='first_party'||l.content?.format!=='editorial-structured-v1'||
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
   c.technique_applications.T07.feedback_gate!=='AFTER_T07_MEANINGFUL_ATTEMPT')
    throw Error('EDITORIAL_LEARNING_CONTRACT_INVALID');
  quiz(c.independent.prompt_md);
  if(rubricNames(c.reflection.md).length!==4)
   throw Error('EDITORIAL_FOUR_RUBRIC_ROWS_REQUIRED');
  if(!c.illustration?.alt||!c.illustration?.caption||!c.guided.hint_md||
    c.extension?.recallQuestions?.length!==3||c.extension?.sources?.length<2||
    !c.extension.sourcePrompt||!Array.isArray(c.extension.searchQueries)||
    c.companion?.moments?.length!==6||
    c.companion.moments.some((m,index)=>
     m.stage!==['opening','concept','guided','independent','reflection','extension'][index]||
     !m.prompt_md||m.actions?.length!==2||m.actions.some(a=>!a.label||!a.reply_md)||
     !m.quote_id||!Array.isArray(m.quote_ids)||m.quote_ids.length<3||
     m.quote_ids[0]!==m.quote_id))
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
function inline(value:string):React.ReactNode[]{
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
 const [lesson,setLesson]=useState<EditorialLesson|null>(null);
 const [attempt,setAttempt]=useState<EditorialAttempt|null>(null);
 // Optimistic text edits must not unlock model answers or spell feedback.
 const [persistedAttempt,setPersistedAttempt]=useState<EditorialAttempt|null>(null);
 const [phase,setPhase]=useState<Phase>('read');
 const [busy,setBusy]=useState(true);
 const [reload,setReload]=useState(0);
 const [saving,setSaving]=useState(false);
 const [sync,setSync]=useState<SyncState>('unavailable');
 const [locked,setLocked]=useState(false);
 const [error,setError]=useState('');
 const subject=useRef<string|null>(null);
 const revision=useRef<string|null>(null);
 const chain=useRef<Promise<void>>(Promise.resolve());
 const pending=useRef(0),failed=useRef(false),mounted=useRef(true);
 const mentorCleanup=useRef<(()=>void)|null>(null);
 const focusFrame=useRef(0);
 const [copiedPrompt,setCopiedPrompt]=useState(false);
 useEffect(()=>()=>{mentorCleanup.current?.();cancelAnimationFrame(focusFrame.current);},[]);
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
 function openMentor(moment:CompanionMoment){
  mentorCleanup.current?.();
  const app=window as Window&{
   openLaoLy?:(trigger?:HTMLElement)=>void;
   liQuoteEngine?:{lookup?:(id:string,locale:Locale)=>QuoteRecord|null};
  };
  const locale=attempt?.locale??'vi';
  const quotes=moment.quote_ids.map(q=>app.liQuoteEngine?.lookup?.(q,locale)??null);
  // Fail visibly rather than show a random source or VI-only gloss in English.
  if(quotes.length<3||quotes.some(q=>!q?.translation||!q.original||
     !q.url.startsWith('https://'))||quotes[0]?.id!==moment.quote_id){
   setError(locale==='en'?
    'The stage quotation sources are unavailable; Lão Lý was not opened.':
    'Chưa tải đủ trích dẫn có nguồn cho mục này; Lão Lý chưa mở.');
   return;
  }
  const trigger=document.activeElement instanceof HTMLElement?document.activeElement:undefined;
  if(app.openLaoLy)app.openLaoLy(trigger);
  else document.querySelector<HTMLButtonElement>('#laoly-fab')?.click();
  const modal=document.getElementById('buddy-modal');
  const spoken=modal?.querySelector<HTMLElement>('#buddy-text');
  const actions=modal?.querySelector<HTMLElement>('.buddy-actions');
  if(!modal?.classList.contains('open')||!spoken||!actions){
   setError(locale==='en'?
    'Lão Lý is unavailable while Silent mode is enabled.':
    'Chế độ Im Lặng đang tắt hội thoại Lão Lý.');return;
  }
  setError('');
  spoken.textContent=plain(moment.prompt_md);
  const native=Array.from(actions.querySelectorAll<HTMLButtonElement>(
   '#buddy-question,#buddy-challenge,#buddy-forget'));
  const previousHidden=native.map(b=>b.hidden);
  native.forEach(b=>{b.hidden=true;});
  const panel=document.createElement('div');
  panel.className='li-editorial-buddy-actions';
  panel.setAttribute('role','group');
  panel.setAttribute('aria-label',locale==='en'?
   'Section-specific questions and source quotations':
   'Câu hỏi theo mục học và trích dẫn có nguồn');

  function showQuote(quote:QuoteRecord,focus=false){
   const original=modal?.querySelector<HTMLElement>('#buddy-quote-original');
   const translation=modal?.querySelector<HTMLElement>('#buddy-quote-translation');
   const meta=modal?.querySelector<HTMLElement>('#buddy-quote-meta');
   const link=modal?.querySelector<HTMLAnchorElement>('#buddy-quote-link');
   const interpretation=modal?.querySelector<HTMLElement>('#buddy-quote-gloss');
   const context=modal?.querySelector<HTMLElement>('#buddy-quote-context');
   const info=modal?.querySelector<HTMLElement>('#buddy-quote-info');
   const detail=modal?.querySelector<HTMLElement>('#buddy-quote');
   if(!original||!translation||!meta||!link||!interpretation||!info||!detail)return;
   original.textContent=quote.original;original.lang=quote.lang;
   original.hidden=false;
   translation.textContent=(locale==='en'?'Meaning: ':'Dịch nghĩa: ')+quote.translation;
   translation.lang=locale;translation.hidden=false;
   meta.textContent=quote.meta;link.href=quote.url;
   interpretation.textContent=(locale==='en'?'Interpretation: ':'Diễn nghĩa: ')+
    quote.interpretation+' · '+plain(moment.quote_relevance_md);
   if(context){context.textContent=quote.comment;context.hidden=false;}
   detail.hidden=true;info.hidden=false;info.setAttribute('aria-expanded','false');
   if(focus){original.tabIndex=-1;original.focus({preventScroll:true});}
  }
  for(const action of moment.actions){
   const button=document.createElement('button');button.type='button';
   button.className='action alt';button.textContent=action.label;
   button.addEventListener('click',()=>{
    spoken.textContent=plain(action.reply_md);
    modal?.querySelector<HTMLElement>('#buddy-scroll')?.scrollTo({top:0});
    spoken.tabIndex=-1;spoken.focus({preventScroll:true});
   });
   panel.append(button);
  }
  const choices=document.createElement('div');choices.className='li-editorial-buddy-quotes';
  for(const [index,q] of quotes.entries()){
   if(!q)continue;
   const button=document.createElement('button');button.type='button';
   button.className='action alt';
   button.textContent=(locale==='en'?'Source ':'Nguồn ')+(index+1)+' · '+q.meta;
   button.addEventListener('click',()=>showQuote(q,true));choices.append(button);
  }
  panel.append(choices);
  actions.prepend(panel);
  showQuote(quotes[0]!,false);
  // Native modal initially focuses a now-hidden default button. Move focus to
  // the first contextual action, and restore the learner's trigger on close.
  panel.querySelector<HTMLButtonElement>('button')?.focus();
  const observer=new MutationObserver(()=>{
   if(!modal.classList.contains('open'))cleanup(true);
  });
  function cleanup(restoreFocus=false){
   observer.disconnect();panel.remove();
   native.forEach((b,i)=>{b.hidden=previousHidden[i];});
   mentorCleanup.current=null;
   if(restoreFocus&&trigger?.isConnected)trigger.focus({preventScroll:true});
  }
  observer.observe(modal,{attributes:true,attributeFilter:['class']});
  mentorCleanup.current=()=>cleanup();
 }
 function mentor(stage:CompanionMoment['stage']){
  const moment=lesson?.content.localized[attempt?.locale??'vi'].companion?.moments.find(m=>m.stage===stage);
  if(!moment||(moment.gate==='AFTER_VALID_INDEPENDENT_SUBMISSION'&&!persistedAttempt?.submitted))return null;
  return <aside className="li-editorial-mentor" aria-label="Lão Lý">
   <img src="./assets/laoly-neutral.png" width="56" height="56" alt="" loading="lazy"/>
   <div><Text role="support">Lão Lý · {stage}</Text>
    <Button variant="secondary" onClick={()=>openMentor(moment)}>
     {attempt?.locale==='en'?'Ask Lão Lý about this section':'Hỏi Lão Lý theo mục này'}
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
  setBusy(true);setError('');
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
    setLesson(source);setAttempt(a);setPersistedAttempt(a);
    setPhase(returnToken(id)?.phase??resume(a));setSync(state);setBusy(false);
   }catch{
    if(!cancelled){setBusy(false);setError('Bài chưa được phát hành hoặc chưa thể xác minh quyền học.');}
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
      setError('Vị trí quay lại đã hết hạn. Bài làm đã lưu không bị xoá.');
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
     const language=window as Window&{liLanguage?:{
      get?:()=>string;set?:(locale:Locale)=>void}};
     if(language.liLanguage?.get?.()!==token.locale)
      language.liLanguage?.set?.(token.locale);
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
  }).catch(()=>{
   failed.current=true;
   if(mounted.current){
    setLocked(true);setError('Lưu thất bại. Giữ trang mở để thử lại, không ghi đè thiết bị khác.');
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
    setError('Có thay đổi từ thiết bị khác. Bản chưa lưu vẫn ở màn hình; không tự ghi đè.');
    return;
   }
   const result=await ports.attempts.save({lessonId:id,subjectId:learner.subjectId,
    attempt,expectedRevision:latest.revision});
   revision.current=result.revision;setPersistedAttempt(attempt);
    failed.current=false;setLocked(false);setError('');
   await refreshStatus();
  }catch{
   setError('Chưa lưu lại được. Giữ trang mở và kiểm tra kết nối.');
  }finally{if(mounted.current)setSaving(false);}
 }
 function editGuided(value:string){
  if(!attempt||locked||attempt.submitted||value.length>MAX)return;
  void save({...attempt,guidedDraft:value});
 }
 function chooseMethod(choice:MethodChoice){
  if(!attempt||locked||saving||attempt.submitted||attempt.methodChoice===choice)return;
  void save({...attempt,methodChoice:choice});
 }
 async function openGuide(method:Method){
  if(!attempt||locked||failed.current)return;
  await chain.current;
  if(failed.current||pending.current>0){
   setError('Chờ lưu xong bản nháp trước khi mở Sổ Tay Thần Chú.');return;
  }
  const host=window as Window&{liMethods?:{open:(id:string,practice?:boolean)=>void}};
  if(!host.liMethods?.open){setError('Sổ Tay Thần Chú chưa khả dụng.');return;}
  try{
   sessionStorage.setItem(RETURN_KEY,JSON.stringify({
    id,phase:'methods',sectionId:'l0911-method',
    locale:attempt.locale,scrollY:window.scrollY,
    method,at:Date.now()
   } satisfies GuideReturn));
  }catch{setError('Không giữ được vị trí quay lại; bài học vẫn được lưu.');return;}
  try{
   host.liMethods.open(method,false);
   if(!document.getElementById('page-guideDetail')?.classList.contains('active'))
    throw Error('GUIDE_ROUTE_UNAVAILABLE');
  }catch{
   try{sessionStorage.removeItem(RETURN_KEY);}catch{/* keep draft */}
   setError('Chưa mở được Sổ Tay Thần Chú. Bản nháp vẫn được giữ.');
  }
 }
 function methodClassify(letter:typeof T06_CASES[number],value:string){
  if(!attempt||locked||attempt.submitted)return;
  const previous=fromAttempt(attempt,'T06');
  if(previous.submittedAt||(!categories.includes(value as MethodCategory)&&value!==''))return;
  const classifications={...previous.classifications};
  if(value)classifications[letter]=value as MethodCategory;
  else delete classifications[letter];
  void save({...attempt,methodAttempts:{...attempt.methodAttempts,
   T06:{...previous,classifications}}});
 }
 function methodEdit(method:Method,value:string){
  if(!attempt||locked||attempt.submitted||value.length>MAX)return;
  const previous=fromAttempt(attempt,method);
  if(previous.submittedAt)return;
  void save({...attempt,methodAttempts:{...attempt.methodAttempts,
   [method]:{...previous,draft:value}}});
 }
 async function methodSubmit(method:Method){
  if(!attempt||locked||saving||attempt.submitted)return;
  const previous=fromAttempt(attempt,method);
  if(previous.submittedAt||previous.draft.trim().length<MIN){
   setError('Viết ít nhất 12 ký tự trước khi xem phản hồi Thần Chú.');return;
  }
  if(method==='T06'&&T06_CASES.some(k=>!previous.classifications?.[k])){
   setError('T06 cần phân loại đủ A–D và giải thích lý do.');return;
  }
  setError('');
  const next={...attempt,assisted:true,methodAttempts:{...attempt.methodAttempts,
   [method]:{...previous,submission:previous.draft,submittedAt:new Date().toISOString()}}};
  await save(next);
 }
 function editAnswer(index:number,value:string){
  if(!attempt||locked||attempt.submitted||value.length>MAX)return;
  const draft=[...attempt.draft] as Attempt['draft'];draft[index]=value;
  void save({...attempt,draft});
 }
 async function submit(){
  if(!attempt||locked||saving||attempt.submitted)return;
  if(attempt.draft.some(s=>s.trim().length<MIN)){
   setError('Cần trả lời đủ 4 câu, mỗi câu ít nhất 12 ký tự.');return;
  }
  setError('');
  const next:Attempt={...attempt,submitted:true,submittedAt:new Date().toISOString(),
   submission:[...attempt.draft] as Attempt['submission'],submissionLocale:attempt.locale,
   contentVersion:lesson?.version,rubricVersion:(lesson?.version??'unknown')+':rubric:0-8',
   attemptNumber:attempt.attemptNumber??1,answerRevealed:false};
  if(await save(next))moveTo('feedback');
 }
 async function revealAnswer(){
  if(!attempt||!persistedAttempt?.submitted||locked||saving||
     persistedAttempt.answerRevealed)return;
  setError('');
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
  if(!attempt||!persistedAttempt?.answerRevealed||locked||attempt.reviewed)return;
  const ratings=[...attempt.ratings] as Attempt['ratings'];
  ratings[index]=value===''?null:Number(value) as 0|1|2;
  void save({...attempt,ratings});
 }
 async function finish(){
  if(!attempt||!persistedAttempt?.answerRevealed||locked||saving||
     !attempt.submitted||attempt.reviewed)return;
  if(attempt.ratings.some(v=>v===null)){
   setError('Chọn đủ bốn tiêu chí tự đánh giá.');return;
  }
  setError('');
  if(await save({...attempt,reviewed:true,reviewedAt:new Date().toISOString()}))
   moveTo('progress');
 }
 async function newAttempt(){
  if(!attempt||!lesson||!persistedAttempt?.reviewed||locked||saving)return;
  const frozen=persistedAttempt;
  if(!frozen.submission||!frozen.submissionLocale||!frozen.submittedAt||
     frozen.ratings.some(r=>r===null)){
   setError('Chưa có lượt nộp đầy đủ để lưu vào lịch sử.');return;
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
   methodChoice:frozen.methodChoice??null,methodAttempts:frozen.methodAttempts
  };
  const history=[...(frozen.attemptHistory??[]),prior];
  const next:Attempt={...initial(),locale:frozen.locale,attemptHistory:history,
   attemptNumber:prior.attemptNumber+1,contentVersion:lesson.version,
   rubricVersion:lesson.version+':rubric:0-8',methodChoice:null,answerRevealed:false};
  if(JSON.stringify(next).length>=55000){
   setError('Lịch sử sắp vượt giới hạn lưu trữ. Chưa tạo lượt mới để tránh mất bài cũ.');return;
  }
  setError('');
  if(await save(next))moveTo('read');
 }
 function switchLocale(value:Locale){
  if(!attempt||locked||saving||value===attempt.locale)return;
  const app=window as Window&{liLanguage?:{set?:(value:string)=>void}};
  if(app.liLanguage?.set)app.liLanguage.set(value);
  void save({...attempt,locale:value});
 }
 if(busy)return <section role="status" className="li-learning-journey" aria-busy="true">
  Đang xác minh quyền học và tải nội dung…
 </section>;
 if(!lesson||!attempt)return <section role="alert" className="li-learning-journey">
  <Text>{error||'Không tải được bài.'}</Text>
  <Button onClick={()=>setReload(n=>n+1)}>Thử lại</Button>
  <Button variant="secondary" onClick={ports.navigation.openCatalog}>Về Tàng Thư</Button>
 </section>;
 const locale=attempt.locale,vi=locale==='vi',content=lesson.content.localized[locale];
 const independent=quiz(content.independent.prompt_md);
 const rubrics=rubricNames(content.reflection.md);
 const labels:Record<Phase,string>=vi?
  {read:'Đọc bài',guided:'Thử áp dụng',methods:'Thần Chú',practice:'Làm bài',feedback:'Đối chiếu',progress:'Tiến độ'}:
  {read:'Learn',guided:'Guided example',methods:'Spells',practice:'Practice',feedback:'Feedback',progress:'Progress'};
 const answered=attempt.draft.filter(v=>v.trim().length>=MIN).length;
 const rated=attempt.ratings.filter(v=>v!==null).length;
 const state:SaveState=locked?'error':saving?'saving':sync==='synced'?'synced':
  sync==='queued'?'queued':sync==='on-device'?'saved-device':'unavailable';
 const message=locked?(vi?'Lưu thất bại':'Save failed'):
  saving?(vi?'Đang lưu…':'Saving…'):sync==='synced'?(vi?'Đã đồng bộ':'Synced'):
  sync==='queued'?(vi?'Đã lưu · chờ đồng bộ':'Saved · awaiting sync'):
  sync==='on-device'?(vi?'Đã lưu trên thiết bị':'Saved on device'):
  (vi?'Chưa xác nhận đồng bộ':'Sync unconfirmed');
 const progress=persistedAttempt?.reviewed?100:
  persistedAttempt?.submitted?75:Math.round(answered/4*50);
 return <section className="li-learning-journey" data-li-editorial-journey={id}
  data-li-react-journey={id} lang={locale}>
  <header className="li-learning-header">
   <div>
    <Text role="caption">{lesson.hierarchy.field.title} · {id}</Text>
    <Heading level={1} id={'li-react-'+id+'-title'} role="headline">{lesson.title[locale]}</Heading>
   </div>
   <Button variant="secondary" onClick={ports.navigation.openCatalog}>{vi?'Về Tàng Thư':'Back to library'}</Button>
  </header>
  <div className="li-learning-language" role="group" aria-label={vi?'Ngôn ngữ':'Language'}>
   {(['vi','en'] as const).map(lang=><Button key={lang}
    variant={locale===lang?'primary':'secondary'} aria-pressed={locale===lang}
    disabled={saving||locked} onClick={()=>switchLocale(lang)}>{lang.toUpperCase()}</Button>)}
  </div>
  <nav className="li-learning-steps" aria-label={vi?'Các bước học':'Learning steps'}>
   {phases.map(p=><Button key={p} variant={p===phase?'primary':'ghost'}
    aria-current={p===phase?'step':undefined}
    disabled={(p==='feedback'&&!persistedAttempt?.submitted)||
     (p==='progress'&&!persistedAttempt?.reviewed)}
    onClick={()=>moveTo(p)}>{labels[p]}</Button>)}
  </nav>
  <div className="li-learning-save">
   <Progress label={vi?'Tiến độ lượt học':'Lesson attempt progress'} value={progress}/>
   <SaveStatus state={state} message={message} detail={locked?error:undefined}/>
   <Text role="support">{persistedAttempt?.reviewed?(vi?'Đã tự đánh giá · chưa phải thông thạo':'Self-reviewed, not mastery'):
    persistedAttempt?.submitted?(vi?'Đã nộp · tự chấm '+rated+'/4':'Submitted · '+rated+'/4 ratings'):
    (vi?'Đủ điều kiện nộp '+answered+'/4':'Ready '+answered+'/4')}</Text>
   {attempt.assisted&&<Text role="support">
    {vi?'Đã sử dụng Thần Chú hỗ trợ':'Used an optional learning spell'}</Text>}
   <Text role="support">{'K2: '+(persistedAttempt?.methodChoice??'—')}
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
      <ol>{previous.submission.map((answer,k)=><li key={k} className="li-learning-submitted-answer">{answer}</li>)}</ol>
     </details>
    </li>)}</ol>
   </details>}
  </div>
  {error&&!locked&&<p role="alert" className="li-learning-error">{error}</p>}
  {locked&&<div className="li-learning-recovery">
   <Button onClick={()=>void retry()} disabled={saving}>{vi?'Thử lưu lại':'Retry saving'}</Button>
   <Text role="support">{vi?'Đừng tải lại khi còn bản chưa lưu.':'Keep this page open with unsaved work.'}</Text>
  </div>}
  <motion.div key={phase} initial={reduced?false:{opacity:0,y:8}}
   animate={{opacity:1,y:0}} transition={reduced?{duration:0}:{duration:0.18}}
   className="li-learning-current">
   {phase==='read'&&<Card variant="flat-study" aria-labelledby="li-editorial-read">
    <section id="l0911-hook"><Markdown md={content.hook.md}/>{mentor('opening')}</section>
    <Heading level={2} id="li-editorial-read" role="titleLarge">{vi?'Hiểu bản chất':'Understand the concepts'}</Heading>
    <section id="l0911-goals"><Markdown md={content.goals.md}/></section>
    <section id="l0911-concept"><Markdown md={content.concept.md}/>
     <PopulationDiagram illustration={content.illustration}/>
     <section id="l0911-variables"><Markdown md={content.variable_types.md}/></section>{mentor('concept')}</section>
    <Heading level={3} role="titleMedium">{vi?'Nguồn để đọc thêm':'Read the sources'}</Heading>
    <ul>{lesson.sources.filter(s=>s.url.startsWith('https://')).map(s=><li key={s.url}>
     <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
    </li>)}</ul>
    <Button onClick={()=>moveTo('guided')}>{labels.guided}</Button>
   </Card>}
   {phase==='guided'&&<Card variant="flat-study" aria-labelledby="li-editorial-guided">
    <Heading level={2} id="li-editorial-guided" role="titleLarge">{labels.guided}</Heading>
    <section id="l0911-guided"><Markdown md={content.guided.md}/>{mentor('guided')}</section>
    {persistedAttempt?.hint?<div className="li-learning-hint"><Markdown md={content.guided.hint_md??''}/></div>:
     <Button variant="secondary" disabled={saving||locked} onClick={()=>{if(attempt&&!attempt.hint)void save({...attempt,hint:true});}}>
      {vi?'Mở gợi ý':'Show hint'}
     </Button>}
    <Field kind="textarea" rows={5} label={vi?'Tự giải thích bằng lời của mày':'Explain in your own words'}
     value={attempt.guidedDraft} disabled={locked||attempt.submitted} onChange={e=>editGuided(e.currentTarget.value)}/>
    <Button onClick={()=>moveTo('methods')}>{labels.methods}</Button>
   </Card>}
   {phase==='methods'&&<Card variant="flat-study" aria-labelledby="li-editorial-methods">
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
       {T06_CASES.map(letter=><label key={letter} className="li-editorial-t06-case">
        <strong>{letter}</strong>
        <select value={item.classifications?.[letter]??''} disabled={locked||attempt.submitted||!!item.submittedAt}
         onChange={e=>methodClassify(letter,e.currentTarget.value)}>
         <option value="">{vi?'Chọn loại biến':'Select type'}</option>
         {categories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
        </select>
       </label>)}
      </div>}
      <Field kind="textarea" rows={4} label={vi?'Lập luận của mày':'Your reasoning'}
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
        <Markdown md={copy.feedback_md}/>
       </div>}
     </section>;
    })}
    <Button onClick={()=>moveTo('practice')}>{vi?'Làm bài độc lập':'Continue to independent practice'}</Button>
   </Card>}
   {phase==='practice'&&<Card variant="flat-study" aria-labelledby="li-editorial-practice">
    <Heading level={2} id="li-editorial-practice" role="titleLarge">{labels.practice}</Heading>
    <section id="l0911-challenge"><Markdown md={independent.intro}/>{mentor('independent')}</section>
    <div className="li-learning-fields">
     {independent.questions.map((q,i)=><Field key={i} kind="textarea" rows={4}
      label={String(i+1)+'. '+q} value={attempt.draft[i]} disabled={locked||attempt.submitted}
      onChange={e=>editAnswer(i,e.currentTarget.value)}/>)}
    </div>
    {!persistedAttempt?.submitted?<Button disabled={saving||locked||attempt.submitted} onClick={()=>void submit()}>
     {vi?'Nộp bài độc lập':'Submit independent answers'}</Button>:
     <Button onClick={()=>moveTo('feedback')}>{labels.feedback}</Button>}
   </Card>}
   {phase==='feedback'&&persistedAttempt?.submitted&&<Card variant="flat-study" aria-labelledby="li-editorial-feedback">
    <Heading level={2} id="li-editorial-feedback" role="titleLarge">{labels.feedback}</Heading>
    <Heading level={3} role="titleMedium">{vi?'Bài làm của mày':'Your submission'}</Heading>
    <ol className="li-learning-submission-list">
     {independent.questions.map((q,i)=><li key={i}>
      <Text role="support">{q}</Text>
      <p className="li-learning-submitted-answer">{(attempt.submission??attempt.draft)[i]}</p>
     </li>)}
    </ol>
    {!persistedAttempt.answerRevealed?
     <div className="li-learning-hint">
      <Text role="support">{vi?
       'Bài làm đã lưu. Đáp án mẫu vẫn đóng đến khi mày chủ động mở.':
       'Your answers are saved. The model answer stays hidden until you choose to reveal it.'}</Text>
      <Button disabled={saving||locked} onClick={()=>void revealAnswer()}>
       {vi?'Mở đáp án và rubric':'Reveal model answer and rubric'}
      </Button>
     </div>:
     <>
      <Heading id="li-editorial-answer" level={3} role="titleMedium">{vi?'Đáp án mẫu · đã mở sau khi lưu':'Model answer · revealed after saving'}</Heading>
      <Markdown md={content.independent.model_answer_md}/>
      <section id="l0911-reflection"><Markdown md={content.reflection.md}/>{mentor('reflection')}</section>
      <Heading level={3} role="titleMedium">{vi?'Tự đánh giá 4 tiêu chí':'Self-rate four criteria'}</Heading>
     </>}
    {persistedAttempt.answerRevealed&&[0,1,2,3].map(i=><div className="li-learning-rating" key={i}>
     <label htmlFor={'li-editorial-rating-'+id+'-'+i}>
      <strong>{rubrics[i]??((vi?'Tiêu chí ':'Criterion ')+(i+1))}</strong>
     </label>
     <select id={'li-editorial-rating-'+id+'-'+i} value={attempt.ratings[i]??''}
      disabled={locked||attempt.reviewed} onChange={e=>rate(i,e.currentTarget.value)}>
      <option value="">{vi?'Chưa chấm':'Unrated'}</option>
      <option value="0">0</option><option value="1">1</option><option value="2">2</option>
     </select>
    </div>)}
    {persistedAttempt.answerRevealed&&(persistedAttempt.reviewed?
     <Button onClick={()=>moveTo('progress')}>{labels.progress}</Button>:
     <Button disabled={saving||locked||attempt.reviewed} onClick={()=>void finish()}>
      {vi?'Lưu tự đánh giá':'Save self-review'}
     </Button>)}
   </Card>}
   {phase==='progress'&&persistedAttempt?.reviewed&&<Card variant="flat-study" aria-labelledby="li-editorial-progress">
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
      {' · '}<a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a>
     </li>)}</ul>
     <Heading level={3} role="titleMedium">{vi?'Truy vấn gợi ý':'Suggested queries'}</Heading>
     <ul>{content.extension.searchQueries.map(q=><li key={q}><Button variant="ghost"
      onClick={()=>ports.search.openSearch(q)}>{q}</Button></li>)}</ul>
     <Heading level={3} role="titleMedium">{vi?'Đối chiếu với nguồn':'Source-aware research prompt'}</Heading>
     <p className="li-learning-copy">{content.extension.sourcePrompt}</p>
     <Button variant="secondary" onClick={()=>void navigator.clipboard.writeText(content.extension.sourcePrompt)
      .then(()=>setCopiedPrompt(true)).catch(()=>setCopiedPrompt(false))}>
      {copiedPrompt?(vi?'Đã sao chép':'Copied'):(vi?'Sao chép prompt':'Copy prompt')}
     </Button>
     <Heading level={3} role="titleMedium">{vi?'Tự nhớ lại · chưa có đáp án':'Active recall · no answers shown'}</Heading>
     <ol>{content.extension.recallQuestions.map(q=><li key={q}>{q}</li>)}</ol>
     <Text role="support">{vi?'K5 · Chưa đo khả năng nhớ lại sau nhiều ngày.':'K5 · Delayed recall has not been measured.'}</Text>
     {mentor('extension')}
    </section>
    <Button variant="secondary" onClick={()=>ports.search.openSearch(lesson.title[locale])}>
     {vi?'Tra cứu kiến thức liên quan':'Explore related knowledge'}</Button>
    <Button variant="ghost" onClick={ports.navigation.openCatalog}>{vi?'Về Tàng Thư':'Back to library'}</Button>
   </Card>}
  </motion.div>
 </section>;
}
