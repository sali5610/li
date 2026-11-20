import React,{useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import type {Attempt,MethodAttempt} from '../native-bridge';
import type {LearningPorts,SyncState} from './ports';
import {isReleasedLessonId} from './released-lessons';
import {freshLessonAttempt,confirmLessonRestart} from './restart-lesson.js';
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
type Section={md:string;gate?:string};
type MethodCopy={prompt_md:string;feedback_md:string;feedback_gate:string};
type Localized={
 hook:Section;goals:Section;concept:Section;variable_types:Section;guided:Section;
 technique_applications:Record<Method,MethodCopy>;
 independent:{prompt_md:string;model_answer_md:string;model_answer_gate:string};
 reflection:Section;
};
type EditorialLesson={
 id:string;title:Record<Locale,string>;hierarchy:{field:{title:string}};
 content:{format:'editorial-structured-v1';localized:Record<Locale,Localized>};
 publishState:'review_only';reviewState:'verified'|'approved';
 rights:{text:'first_party'};
 sources:{title:string;url:string;usage?:string}[];
};
type CompanionLink={
 targetId:string;targetKind:'Lesson'|'Course';reviewState:'editorial_candidate'|'documented';
 reason:{vi:string;en:string};provenance:{sourceUrl:string}
};
type Companion={
 schema:1;lesson_id:string;topics:string[];moments:{
  stage:string;anchor:string;quote_ids:string[];
  vi:{label:string;prompt:string;actions:{label:string;reply:string}[]};
  en:{label:string;prompt:string;actions:{label:string;reply:string}[]}
 }[];
 connections:{status:string;links:CompanionLink[]}
};
function validCompanion(v:unknown,id:string):Companion{
 if(!v||typeof v!=='object'||Array.isArray(v))throw Error('EDITORIAL_COMPANION_REQUIRED');
 const c=v as Companion;
 const stages=['opening','concept','guided','independent','reflection','extension'];
 if(c.schema!==1||c.lesson_id!==id||!Array.isArray(c.moments)||
  c.moments.length!==6||c.moments.some((m,i)=>m.stage!==stages[i]||
   !Array.isArray(m.quote_ids)||m.quote_ids.length<3||
   m.vi?.actions?.length!==2||m.en?.actions?.length!==2||
   !m.vi?.prompt||!m.en?.prompt)||
  !Array.isArray(c.connections?.links)||!c.connections.links.some(l=>
   l.targetKind==='Lesson'&&l.reviewState==='editorial_candidate'&&
   l.reason?.vi&&l.reason?.en))
  throw Error('EDITORIAL_COMPANION_OR_LINKS_INCOMPLETE');
 return c;
}
type EditorialAttempt=Attempt;
const MIN=12,MAX=4000;
const phases:Phase[]=['read','guided','methods','practice','feedback','progress'];
const defaultMethod=():MethodAttempt=>({draft:'',submission:null,submittedAt:null});
function fromAttempt(a:EditorialAttempt,method:Method):MethodAttempt{
 return a.methodAttempts?.[method]??defaultMethod();
}
function resume(a:Attempt):Phase{
 if(a.reviewed)return 'progress';
 if(a.submitted)return 'feedback';
 if(a.draft.some(s=>s.trim()))return 'practice';
 if(a.methodAttempts?.T06?.draft||a.methodAttempts?.T07?.draft)return 'methods';
 if(a.guidedDraft.trim())return 'guided';
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
  !l.title?.vi||!l.title?.en||!l.content.localized?.vi||!l.content.localized?.en)
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
 }
 return l as EditorialLesson;
}
async function loadLesson(id:string):Promise<{lesson:EditorialLesson;companion:Companion}>{
 // Import at runtime from this deployed app's one canonical pack adapter.
 // No fallback to content/editorial, Notion, draft JSON or anonymous access.
 const url=new URL('./assets/li-content-adapter.mjs',document.baseURI).href;
 const m=await import(/* @vite-ignore */ url) as {
  contentClient?:{getLesson:(lessonId:string)=>Promise<unknown>}
 };
 if(!m.contentClient?.getLesson)throw Error('CONTENT_PACK_CLIENT_UNAVAILABLE');
 const [lessonData,mentorResponse]=await Promise.all([
  m.contentClient.getLesson(id),
  fetch(new URL('./lessons/companion/'+encodeURIComponent(id)+'.json',document.baseURI),{
   credentials:'same-origin'
  })
 ]);
 if(!mentorResponse.ok)throw Error('EDITORIAL_MENTOR_NOT_AVAILABLE');
 const companion=validCompanion(await mentorResponse.json(),id);
 return {lesson:parseLesson(lessonData,id),companion};
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

export function EditorialJourney({id,ports}:{id:string;ports:LearningPorts}){
 const reduced=useReducedMotion();
 const [lesson,setLesson]=useState<EditorialLesson|null>(null);
 const [companion,setCompanion]=useState<Companion|null>(null);
 const [mentorReady,setMentorReady]=useState(false);
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
    const bundle=await loadLesson(id);
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
    setLesson(bundle.lesson);setCompanion(bundle.companion);
    setAttempt(a);setPersistedAttempt(a);
    setPhase(resume(a));setSync(state);setBusy(false);
   }catch{
    if(!cancelled){setBusy(false);setError('Bài chưa được phát hành hoặc chưa thể xác minh quyền học.');}
   }
  })();
  return()=>{cancelled=true;mounted.current=false;};
 },[id,ports,reload]);

 // Same Lão Lý avatar, dialog, sourced quote bank, and lesson-phase actions.
 // No duplicate tutor, no anonymous preview and no independent answer leakage.
 useEffect(()=>{
  if(!lesson||!companion)return;
  const api=(window as Window&{liLessonCompanion?:{
   registerEditorial?:(data:Companion)=>()=>void
  }}).liLessonCompanion;
  if(!api?.registerEditorial){setError('Lão Lý chưa sẵn sàng cho bài này.');return;}
  try{
   const cleanup=api.registerEditorial(companion);
   setMentorReady(true);
   return()=>{cleanup();};
  }catch{setError('Manifest Lão Lý không hợp lệ.');}
 },[lesson,companion]);
 useEffect(()=>{
  if(!mentorReady)return;
  window.dispatchEvent(new Event('li:lesson-phase-changed'));
 },[mentorReady,phase,persistedAttempt?.submitted,persistedAttempt?.reviewed]);
 useEffect(()=>{
  const onJump=(event:Event)=>{
   const detail=(event as CustomEvent<{lessonId?:string;phase?:string}>).detail;
   if(detail?.lessonId!==id||
    !['read','guided','methods','practice','feedback','progress'].includes(detail.phase||''))
    return;
   const next=detail.phase as Phase;
   if((next==='feedback'&&!persistedAttempt?.submitted)||
    (next==='progress'&&!persistedAttempt?.reviewed))return;
   const host=document.querySelector('[data-li-editorial-journey="'+id+'"]');
   if(!host?.closest('[id^="page-"]')?.classList.contains('active'))return;
   setPhase(next);
   window.requestAnimationFrame(()=>{
    host.querySelector('.li-learning-current')?.scrollIntoView({
     block:'start',behavior:reduced?'auto':'smooth'
    });
   });
  };
  window.addEventListener('li:mentor-phase-jump',onJump);
  return()=>window.removeEventListener('li:mentor-phase-jump',onJump);
 },[id,persistedAttempt?.submitted,persistedAttempt?.reviewed,reduced]);

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
   submission:[...attempt.draft] as Attempt['submission'],submissionLocale:attempt.locale};
  if(await save(next))setPhase('feedback');
 }
 function rate(index:number,value:string){
  if(!attempt||locked||attempt.reviewed)return;
  const ratings=[...attempt.ratings] as Attempt['ratings'];
  ratings[index]=value===''?null:Number(value) as 0|1|2;
  void save({...attempt,ratings});
 }
 async function finish(){
  if(!attempt||locked||saving||!attempt.submitted||attempt.reviewed)return;
  if(attempt.ratings.some(v=>v===null)){
   setError('Chọn đủ bốn tiêu chí tự đánh giá.');return;
  }
  setError('');
  if(await save({...attempt,reviewed:true}))setPhase('progress');
 }
 async function restartLesson(){
  if(!attempt||locked||saving||pending.current>0)return;
  if(!confirmLessonRestart(id,attempt.locale))return;
  setError('');
  if(await save(freshLessonAttempt(attempt)))setPhase('read');
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
 if(!mentorReady||!companion)return <section role="status" className="li-learning-journey">
  {error||'Đang kiểm tra Lão Lý và liên kết bài học…'}
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
  data-li-react-journey={id} data-li-lesson-phase={phase}
  data-li-lesson-submitted={persistedAttempt?.submitted?'true':'false'}
  data-li-lesson-reviewed={persistedAttempt?.reviewed?'true':'false'} lang={locale}>
  <header className="li-learning-header">
   <div>
    <Text role="caption">{lesson.hierarchy.field.title} · {id}</Text>
    <Heading level={1} id={'li-react-'+id+'-title'} role="headline">{lesson.title[locale]}</Heading>
   </div>
   <div className="li-learning-header-actions">
    <Button variant="secondary" data-buddy="1">
     {vi?'Hỏi Lão Lý theo mục đang học':'Ask Lão Lý about this step'}
    </Button>
    <Button variant="secondary" onClick={ports.navigation.openCatalog}>{vi?'Về Tàng Thư':'Back to library'}</Button>
   </div>
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
    onClick={()=>setPhase(p)}>{labels[p]}</Button>)}
  </nav>
  <div className="li-learning-save">
   <Progress label={vi?'Tiến độ lượt học':'Lesson attempt progress'} value={progress}/>
   <SaveStatus state={state} message={message} detail={locked?error:undefined}/>
   <Text role="support">{persistedAttempt?.reviewed?(vi?'Đã tự đánh giá · chưa phải thông thạo':'Self-reviewed, not mastery'):
    persistedAttempt?.submitted?(vi?'Đã nộp · tự chấm '+rated+'/4':'Submitted · '+rated+'/4 ratings'):
    (vi?'Đủ điều kiện nộp '+answered+'/4':'Ready '+answered+'/4')}</Text>
   {attempt.assisted&&<Text role="support">
    {vi?'Đã sử dụng Thần Chú hỗ trợ':'Used an optional learning spell'}</Text>}
   <div className="li-learning-recovery">
    <Button variant="secondary" disabled={saving||locked}
     onClick={()=>void restartLesson()}>{vi?'Học lại từ đầu':'Restart this lesson'}</Button>
   </div>
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
    <Heading level={2} id="li-editorial-read" role="titleLarge">{vi?'Hiểu bản chất':'Understand the concepts'}</Heading>
    <div id={companion.moments[0].anchor}><Markdown md={content.hook.md}/>
     <Markdown md={content.goals.md}/></div>
    <div id={companion.moments[1].anchor}><Markdown md={content.concept.md}/>
     <Markdown md={content.variable_types.md}/></div>
    <Heading level={3} role="titleMedium">{vi?'Nguồn để đọc thêm':'Read the sources'}</Heading>
    <ul>{lesson.sources.filter(s=>s.url.startsWith('https://')).map(s=><li key={s.url}>
     <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
    </li>)}</ul>
    <Button onClick={()=>setPhase('guided')}>{labels.guided}</Button>
   </Card>}
   {phase==='guided'&&<Card variant="flat-study" aria-labelledby="li-editorial-guided">
    <Heading level={2} id="li-editorial-guided" role="titleLarge">{labels.guided}</Heading>
    <div id={companion.moments[2].anchor}><Markdown md={content.guided.md}/></div>
    <Field kind="textarea" rows={5} label={vi?'Tự giải thích bằng lời của mày':'Explain in your own words'}
     value={attempt.guidedDraft} disabled={locked||attempt.submitted} onChange={e=>editGuided(e.currentTarget.value)}/>
    <Button onClick={()=>setPhase('methods')}>{labels.methods}</Button>
   </Card>}
   {phase==='methods'&&<Card variant="flat-study" aria-labelledby="li-editorial-methods">
    <Heading level={2} id="li-editorial-methods" role="titleLarge">{labels.methods}</Heading>
    <Text role="support">{vi?'T06 là gợi ý chính, T07 bổ trợ. Cả hai đều không bắt buộc.':
     'T06 is primary and T07 supplementary; both are optional.'}</Text>
    {(['T06','T07'] as const).map(method=>{
     const item=fromAttempt(attempt,method),copy=content.technique_applications[method];
      const persisted=fromAttempt(persistedAttempt??attempt,method);
      const feedbackUnlocked=!!persistedAttempt&&!!persisted.submittedAt;
     return <section className="li-learning-method" key={method}
      aria-label={(vi?'Luyện Thần Chú ':'Spell practice ')+method}>
      <Heading level={3} role="titleMedium">{method}</Heading>
      <Markdown md={copy.prompt_md}/>
      <Field kind="textarea" rows={4} label={vi?'Lập luận của mày':'Your reasoning'}
       value={item.draft} disabled={locked||attempt.submitted||!!item.submittedAt}
       onChange={e=>methodEdit(method,e.currentTarget.value)}/>
      {!feedbackUnlocked?<Button variant="secondary"
       disabled={saving||locked||attempt.submitted||!!item.submittedAt}
       onClick={()=>void methodSubmit(method)}>{vi?'Nộp lượt luyện':'Submit spell attempt'}</Button>:
       <div role="note" className="li-learning-hint">
        <Text role="support">{vi?'Đã lưu câu trả lời, giờ mới mở phản hồi.':'Attempt saved; feedback unlocked.'}</Text>
        <p className="li-learning-submitted-answer">{persisted.submission}</p>
        <Markdown md={copy.feedback_md}/>
       </div>}
     </section>;
    })}
    <Button onClick={()=>setPhase('practice')}>{vi?'Làm bài độc lập':'Continue to independent practice'}</Button>
   </Card>}
   {phase==='practice'&&<Card variant="flat-study" aria-labelledby="li-editorial-practice">
    <Heading level={2} id="li-editorial-practice" role="titleLarge">{labels.practice}</Heading>
    <div id={companion.moments[3].anchor}><Markdown md={independent.intro}/></div>
    <div className="li-learning-fields">
     {independent.questions.map((q,i)=><Field key={i} kind="textarea" rows={4}
      label={String(i+1)+'. '+q} value={attempt.draft[i]} disabled={locked||attempt.submitted}
      onChange={e=>editAnswer(i,e.currentTarget.value)}/>)}
    </div>
    {!persistedAttempt?.submitted?<Button disabled={saving||locked||attempt.submitted} onClick={()=>void submit()}>
     {vi?'Nộp bài độc lập':'Submit independent answers'}</Button>:
     <Button onClick={()=>setPhase('feedback')}>{labels.feedback}</Button>}
   </Card>}
   {phase==='feedback'&&persistedAttempt?.submitted&&<Card variant="flat-study" aria-labelledby="li-editorial-feedback">
    <Heading level={2} id="li-editorial-feedback" role="titleLarge">{labels.feedback}</Heading>
    <div id={companion.moments[4].anchor}/>
    <Heading level={3} role="titleMedium">{vi?'Bài làm của mày':'Your submission'}</Heading>
    <ol className="li-learning-submission-list">
     {independent.questions.map((q,i)=><li key={i}>
      <Text role="support">{q}</Text>
      <p className="li-learning-submitted-answer">{(attempt.submission??attempt.draft)[i]}</p>
     </li>)}
    </ol>
    <Heading level={3} role="titleMedium">{vi?'Đáp án mẫu · chỉ sau khi nộp':'Model answer · after submission'}</Heading>
    <Markdown md={content.independent.model_answer_md}/>
    <Markdown md={content.reflection.md}/>
    <Heading level={3} role="titleMedium">{vi?'Tự đánh giá 4 tiêu chí':'Self-rate four criteria'}</Heading>
    {[0,1,2,3].map(i=><div className="li-learning-rating" key={i}>
     <label htmlFor={'li-editorial-rating-'+id+'-'+i}>
      <strong>{rubrics[i]??((vi?'Tiêu chí ':'Criterion ')+(i+1))}</strong>
     </label>
     <select id={'li-editorial-rating-'+id+'-'+i} value={attempt.ratings[i]??''}
      disabled={locked||attempt.reviewed} onChange={e=>rate(i,e.currentTarget.value)}>
      <option value="">{vi?'Chưa chấm':'Unrated'}</option>
      <option value="0">0</option><option value="1">1</option><option value="2">2</option>
     </select>
    </div>)}
    {persistedAttempt?.reviewed?<Button onClick={()=>setPhase('progress')}>{labels.progress}</Button>:
     <Button disabled={saving||locked||attempt.reviewed} onClick={()=>void finish()}>{vi?'Lưu tự đánh giá':'Save self-review'}</Button>}
   </Card>}
   {phase==='progress'&&persistedAttempt?.reviewed&&<Card variant="flat-study" aria-labelledby="li-editorial-progress">
    <Heading level={2} id="li-editorial-progress" role="titleLarge">{vi?'Hoàn thành lượt học':'Attempt complete'}</Heading>
    <div id={companion.moments[5].anchor}/>
    <Text>{vi?'Đây là một lượt tự đánh giá đã lưu, không phải chứng nhận thông thạo.':
     'A saved self-assessment, not a mastery certificate.'}</Text>
    <Text>{vi?'Điểm tự chấm':'Self-rating'}: {attempt.ratings.reduce<number>((n,v)=>n+(v??0),0)} / 8</Text>
    <Button variant="secondary" onClick={()=>ports.search.openSearch(lesson.title[locale])}>
     {vi?'Tra cứu kiến thức liên quan':'Explore related knowledge'}</Button>
    <Button variant="ghost" onClick={ports.navigation.openCatalog}>{vi?'Về Tàng Thư':'Back to library'}</Button>
   </Card>}
  </motion.div>
  <section className="li-learning-connections" aria-label={vi?'Kết nối kiến thức':'Learning connections'}>
   <Heading level={2} role="titleMedium">{vi?'Kết nối kiến thức':'Learning connections'}</Heading>
   <Text role="support">{vi?
    'Liên kết biên tập có ghi nguồn; không tự coi là tiên quyết chính thức hay khái niệm graph đã duyệt.':
    'Source-traced editorial links, not official prerequisites or approved graph concepts.'}</Text>
   <ul>{companion.connections.links.map(link=>{
    const label=link.targetKind==='Lesson'?link.targetId:
     'Data & Statistical Foundations · '+link.targetId;
    const url=link.targetKind==='Lesson'?'./?lesson='+encodeURIComponent(link.targetId):
     './?catalog=mathematics/F09/C09-1';
    return <li key={link.targetKind+link.targetId}>
     <a href={url}>{label}</a>
     <Text role="support">{link.reason[locale]}</Text>
     <Text role="caption">{link.reviewState==='documented'?
      (vi?'Quan hệ danh mục đã ghi nhận':'Documented catalog membership'):
      (vi?'Gợi ý liên quan · chờ duyệt quan hệ học thuật':'Editorial connection · academic graph review pending')}</Text>
    </li>;
   })}</ul>
  </section>
 </section>;
}
