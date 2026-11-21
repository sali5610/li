import React,{useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import lesson03 from '../../../../content/lessons/L03-1-2.json';
import lesson15 from '../../../../content/lessons/L15-2-2.json';
import spells from '../../../../site/assets/lesson-spell-suggestions.v0.1.json';
import {Button,Card} from '../../../../design-system/react/Components';
import {Field} from '../../../../design-system/react/Controls';
import {Heading,Text,Progress} from '../../../../design-system/react/Atoms';
import {SaveStatus} from '../../../../design-system/react/Molecules';
import type {SaveState} from '../../../../design-system/react/Molecules';
import type {Attempt} from '../native-bridge';
import type {LearningPorts,SyncState} from './ports';
import './journey.css';
import {StudyBookFolio} from './StudyBookFolio';
import {useDiscoveryLocale} from '../shell/discovery-locale.js';
import {useStepScreen} from './step-screen.js';
import {LessonBookmark,LessonMentor,LessonSources,LessonFigure,openLessonSpell} from './LessonDetailParity.js';
import {RelatedLessons} from './RelatedLessons.js';
import {SelfReviewNextStep} from './SelfReviewNextStep.js';
import {T02ReviewEntry} from './T02ReviewEntry.js';
import {AiFeedbackPanel} from './AiFeedbackPanel.js';
import feedbackPolicy from '../../../../content/feedback/ai-question-modes.v1.json';
import {freshLessonAttempt,confirmLessonRestart} from './restart-lesson.js';

type LessonId='L03-1-2'|'L15-2-2';
type Phase='read'|'guided'|'practice'|'feedback'|'progress';
const steps:Phase[]=['read','guided','practice','feedback','progress'];
const images:Record<LessonId,{src:string;link:string;credit:string}>={
 'L03-1-2':{
  src:'https://upload.wikimedia.org/wikipedia/commons/c/c4/Interview.svg',
  link:'https://commons.wikimedia.org/wiki/File:Interview.svg',
  credit:'Alexander Koenig MA · CC BY-SA 3.0 Germany'
 },
 'L15-2-2':{
  src:'https://upload.wikimedia.org/wikipedia/commons/f/f1/Inventory_control_-_reorder_point_and_service_level.png',
  link:'https://commons.wikimedia.org/wiki/File:Inventory_control_-_reorder_point_and_service_level.png',
  credit:'Poul G · Public domain'
 }
};
const MAX_CHARS=4000;
const safeText=(s:string)=>s.replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|li)>/gi,'\n')
 .replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
 .replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').trim();
const comparable:(keyof Attempt)[]=['locale','draft','guidedDraft','hint','assisted',
 'submitted','submittedAt','submission','submissionLocale','ratings','reviewed'];
const equalAttempt=(a:Attempt,b:Attempt)=>comparable.every(k=>JSON.stringify(a[k])===JSON.stringify(b[k]));
const resume=(a:Attempt):Phase=>a.reviewed?'progress':a.submitted?'feedback':
 a.draft.some(x=>x.trim())?'practice':a.guidedDraft.trim()?'guided':'read';

export function Wave1Journey({id,ports}:{id:LessonId;ports:LearningPorts}){
 const reduced=useReducedMotion();
 const appLocale=useDiscoveryLocale();
 const source=id==='L03-1-2'?lesson03:lesson15;
 const [attempt,setAttempt]=useState<Attempt|null>(null);
 const [phase,setPhase]=useState<Phase>('read');
 useStepScreen(phase,id);
 useEffect(()=>{window.dispatchEvent(new Event('li:lesson-phase-changed'));},[phase]);
 // Lão Lý's Read this section must navigate the visible React workflow, not
 // hidden legacy lesson anchors. The existing submission/review gates apply.
 useEffect(()=>{
  const onMentorJump=(event:Event)=>{
   const detail=(event as CustomEvent<{lessonId?:string;phase?:string}>).detail;
   if(!detail||detail.lessonId!==id||
    !['read','guided','practice','feedback','progress'].includes(detail.phase||''))return;
   const next=detail.phase as Phase;
   if((next==='feedback'||next==='progress')&&!attempt?.submitted)return;
   if(next==='progress'&&!attempt?.reviewed)return;
   const root=document.querySelector('[data-li-react-journey="'+id+'"]');
   if(!root||root.closest('.page')?.classList.contains('active')===false)return;
   setPhase(next);
   window.requestAnimationFrame(()=>{
    root.querySelector('.li-learning-current')
     ?.scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'});
   });
  };
  window.addEventListener('li:mentor-phase-jump',onMentorJump);
  return()=>window.removeEventListener('li:mentor-phase-jump',onMentorJump);
 },[id,attempt?.submitted,attempt?.reviewed,reduced]);

 const [loading,setLoading]=useState(true);
 const [reload,setReload]=useState(0);
 const [saving,setSaving]=useState(false);
 const [status,setStatus]=useState<SyncState>('unavailable');
 const [locked,setLocked]=useState(false);
 const [error,setError]=useState('');
 const subject=useRef<string|null>(null);
 const revision=useRef<string|null>(null);
 const chain=useRef<Promise<void>>(Promise.resolve());
 const pending=useRef(0);
 const failed=useRef(false);
 const mounted=useRef(true);

 async function refreshStatus(){
  if(!subject.current)return;
  try{
   const next=await ports.sync.getStatus({lessonId:id,subjectId:subject.current});
   if(mounted.current)setStatus(next);
  }catch{if(mounted.current)setStatus('unavailable');}
 }
 useEffect(()=>{
  const onSync=(e:Event)=>{
   const detail=(e as CustomEvent<{accountId?:string;lessonIds?:string[]}>).detail;
   if(detail?.accountId!==subject.current)return;
   void refreshStatus();
   if(detail.lessonIds?.includes(id)&&!failed.current&&pending.current===0)
    setReload(x=>x+1);
  };
  window.addEventListener('li:learning-sync-report',onSync);
  window.addEventListener('li:lesson-sync-applied',onSync);
  return()=>{
   window.removeEventListener('li:learning-sync-report',onSync);
   window.removeEventListener('li:lesson-sync-applied',onSync);
  };
 },[id,ports]);
 useEffect(()=>{
  mounted.current=true;
  let cancelled=false;
  setLoading(true);setError('');
  (async()=>{
   try{
    const learner=await ports.auth.requireInvitedLearner();
    if(!learner?.subjectId)throw Error('INVITE_REQUIRED');
    const saved=await ports.attempts.load({lessonId:id,subjectId:learner.subjectId});
    const a=saved.attempt;
    if(!saved.revision||!a||!Array.isArray(a.draft)||a.draft.length!==4||
       !a.draft.every(x=>typeof x==='string')||
       !Array.isArray(a.ratings)||a.ratings.length!==4||
       typeof a.guidedDraft!=='string'||typeof a.submitted!=='boolean'||
       typeof a.reviewed!=='boolean'||!['vi','en'].includes(a.locale))
     throw Error('INVALID_ATTEMPT');
    const cloud=await ports.sync.getStatus({lessonId:id,subjectId:learner.subjectId})
     .catch(()=>'unavailable' as SyncState);
    if(cancelled)return;
    subject.current=learner.subjectId;revision.current=saved.revision;
    setAttempt(a);setPhase(resume(a));setStatus(cloud);setLoading(false);
   }catch{
    if(!cancelled){
     setError('Không thể xác minh quyền học hoặc tải bài. Không mở chế độ khách.');
     setLoading(false);
    }
   }
  })();
  return()=>{cancelled=true;mounted.current=false;};
 },[id,ports,reload]);

 function save(next:Attempt):Promise<boolean>{
  if(locked||failed.current||!subject.current||!revision.current)return Promise.resolve(false);
  setAttempt(next);
  pending.current+=1;setSaving(true);
  const uid=subject.current;
  const result=chain.current.then(async()=>{
   if(failed.current||!revision.current)throw Error('SAVE_LOCKED');
   const written=await ports.attempts.save({
    lessonId:id,subjectId:uid,attempt:next,expectedRevision:revision.current
   });
   if(!written?.revision)throw Error('SAVE_WITHOUT_REVISION');
   revision.current=written.revision;return true;
  }).catch(()=>{
   failed.current=true;
   if(mounted.current){
    setLocked(true);
    setError('Không lưu được bản đang sửa. Đừng tải lại trước khi thử lưu lại.');
   }
   return false;
  });
  chain.current=result.then(async ok=>{if(ok)await refreshStatus();}).catch(()=>{});
  void chain.current.finally(()=>{
   pending.current-=1;
   if(mounted.current)setSaving(pending.current>0);
  });
  return result;
 }
 async function retry(){
  if(!attempt||!subject.current||!failed.current||pending.current>0)return;
  const uid=subject.current,unsaved=attempt;
  setSaving(true);
  try{
   const learner=await ports.auth.requireInvitedLearner();
   if(learner.subjectId!==uid)throw Error('ACCOUNT_CHANGED');
   const latest=await ports.attempts.load({lessonId:id,subjectId:uid});
   if(latest.revision!==revision.current&&!equalAttempt(latest.attempt,unsaved)){
    setError('Dữ liệu đã thay đổi ở thiết bị khác. Bản chưa lưu vẫn ở đây; không tự ghi đè.');
    return;
   }
   const written=await ports.attempts.save({
    lessonId:id,subjectId:uid,attempt:unsaved,expectedRevision:latest.revision
   });
   revision.current=written.revision;
   failed.current=false;setLocked(false);setError('');await refreshStatus();
  }catch{
   setError('Chưa lưu lại được. Giữ trang này mở và kiểm tra bộ nhớ hoặc kết nối.');
  }finally{if(mounted.current)setSaving(false);}
 }
 function editGuided(value:string){
  if(!attempt||locked||value.length>MAX_CHARS)return;
  void save({...attempt,guidedDraft:value});
 }
 function editAnswer(i:number,value:string){
  if(!attempt||locked||attempt.submitted||value.length>MAX_CHARS)return;
  const draft=[...attempt.draft] as Attempt['draft'];draft[i]=value;
  void save({...attempt,draft});
 }
 function clearDraft(){
  if(!attempt||locked||saving||attempt.submitted)return;
  const current=id==='L03-1-2'?lesson03:lesson15;
  if(!window.confirm(current.content.localized[attempt.locale].reset))return;
  void save({...attempt,draft:['','','',''] as Attempt['draft']});
 }
 async function restartLesson(){
  if(!attempt||locked||saving||pending.current>0)return;
  if(!confirmLessonRestart(id,attempt.locale))return;
  setError('');
  if(await save(freshLessonAttempt(attempt)))setPhase('read');
 }
 function revealHint(){
  if(!attempt||locked||attempt.submitted||attempt.hint)return;
  void save({...attempt,hint:true,assisted:true});
 }
 async function submit(){
  if(!attempt||locked||saving||attempt.submitted)return;
  if(attempt.draft.some(x=>x.trim().length<12)){
   setError('Cần trả lời đủ 4 câu, mỗi câu ít nhất 12 ký tự.');return;
  }
  setError('');
  const next={...attempt,submitted:true,submittedAt:new Date().toISOString(),
   submission:[...attempt.draft] as Attempt['submission'],submissionLocale:attempt.locale};
  if(await save(next))setPhase('feedback');
 }
 function rate(i:number,value:string){
  if(!attempt||locked||attempt.reviewed)return;
  const ratings=[...attempt.ratings] as Attempt['ratings'];
  ratings[i]=value===''?null:Number(value) as 0|1|2;
  void save({...attempt,ratings});
 }
 async function finish(){
  if(!attempt||locked||saving||!attempt.submitted||attempt.reviewed)return;
  if(attempt.ratings.some(x=>x===null)){
   setError('Chọn đủ bốn tiêu chí tự đánh giá trước khi hoàn tất.');return;
  }
  setError('');if(await save({...attempt,reviewed:true}))setPhase('progress');
 }
 // Settings owns the application language; update the stored attempt without
 // putting a language selector or a second navigation menu inside the lesson.
 useEffect(()=>{
  if(loading||!attempt||attempt.locale===appLocale||locked||saving||
     pending.current>0)return;
  void save({...attempt,locale:appLocale});
 },[appLocale,attempt?.locale,loading,locked,saving]);
 if(loading)return <div className="li-learning-journey" role="status">Đang tải bài học đã lưu…</div>;
 if(!attempt)return <section className="li-learning-journey" role="alert">
  <p>{error||'Không tải được bài học.'}</p>
  <Button onClick={()=>setReload(n=>n+1)}>Thử lại</Button>
 </section>;
 const vi=appLocale==='vi';
 const content=source.content.localized[appLocale];
 const labels:Record<Phase,string>=vi?
  {read:'Đọc bài',guided:'Thử áp dụng',practice:'Làm bài',feedback:'Đối chiếu',progress:'Tiến độ'}:
  {read:'Learn',guided:'Guided example',practice:'Practice',feedback:'Feedback',progress:'Progress'};
 const answered=attempt.draft.filter(x=>x.trim().length>=12).length;
 const rated=attempt.ratings.filter(x=>x!==null).length;
 const saveState:SaveState=locked?'error':saving?'saving':
  status==='synced'?'synced':(status==='queued'||status==='conflict')?'queued':
  status==='on-device'?'saved-device':'unavailable';
 const saveMessage=locked?(vi?'Lưu thất bại':'Save failed'):
  saving?(vi?'Đang lưu…':'Saving…'):
  status==='synced'?(vi?'Đã đồng bộ':'Synced'):
  status==='queued'?(vi?'Đã lưu · đang chờ đồng bộ':'Saved · waiting to sync'):
  status==='conflict'?(vi?'Bài này có xung đột · mở Tài khoản để chọn bản':'Lesson conflict · choose a version in Account'):
  status==='on-device'?(vi?'Đã lưu trên thiết bị':'Saved on device'):
  (vi?'Chưa xác nhận đồng bộ':'Sync status unavailable');
 const sourceImg=images[id];
 const showSpells=spells.lessons[id];
 const pct=attempt.reviewed?100:attempt.submitted?75:Math.round(answered/4*50);
 const displayed=attempt.submission??attempt.draft;
 return <section className="li-learning-journey" lang={appLocale}
   data-li-react-journey={id}
   data-li-lesson-phase={phase} data-li-lesson-submitted={attempt.submitted?'true':'false'}>
  <header className="li-learning-header">
   <div><Text role="caption">{source.hierarchy.field.title} · {id}</Text>
    <Heading level={1} id={'li-react-'+id+'-title'} role="headline">{content.title}</Heading>
    <Text>{content.intro}</Text>
   </div>
   <div className="li-learning-header-actions">
    <LessonBookmark id={id} locale={appLocale}/>
    <details className="li-lesson-header-more">
     <summary>{vi?'Tùy chọn':'Options'}</summary>
     <Button variant="ghost" disabled={saving||locked}
      onClick={()=>void restartLesson()}>{vi?'Học lại từ đầu':'Restart lesson'}</Button>
    </details>
   </div>
  </header>
    <StudyBookFolio phase={phase} steps={steps} locale={appLocale}/>
  <aside className="li-learning-rail" aria-label="Learning navigation and status">

  <div className="li-learning-save">
   {(saveState==='error'||status==='conflict')&&
    <SaveStatus state={saveState} message={saveMessage} detail={locked?error:undefined}/>}
   {(attempt.reviewed||attempt.submitted)&&
    <Text role="support" className="li-learning-ready-count">{attempt.reviewed?
     (vi?'Đã tự đánh giá':'Self-reviewed'):
     (vi?'Đã nộp · '+rated+'/4 tự chấm':'Submitted · '+rated+'/4 rated')}</Text>}
   <Progress label={vi?'Tiến độ lượt học':'Lesson progress'} value={pct}/>
   {attempt.assisted&&<Text role="support" className="li-learning-status-note">{content.assistStatus}</Text>}
  </div>
  </aside>
  {error&&!locked&&<p role="alert" className="li-learning-error">{error}</p>}
  {locked&&<div className="li-learning-recovery">
   <Button disabled={saving} onClick={()=>void retry()}>{vi?'Thử lưu lại':'Retry saving'}</Button>
   <Text role="support">{vi?'Giữ trang mở để bảo toàn bản chưa lưu.':'Keep the page open while saving.'}</Text>
  </div>}
  <motion.div key={phase} initial={reduced?false:{opacity:0,x:12,rotateY:-1}}
   animate={{opacity:1,x:0,rotateY:0}}
   transition={reduced?{duration:0}:{duration:0.18}} className="li-learning-current">
   
   {phase==='read'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-wave1-read">
    <Heading level={2} id="li-wave1-read" role="titleLarge">{content.goalsTitle}</Heading>
    <ul>{content.goals.map((goal,i)=><li key={i}>{goal}</li>)}</ul>
    <Heading level={2} role="titleMedium">{content.conceptTitle}</Heading>
    <p className="li-learning-copy">{safeText(content.conceptText)}</p>
    <ul>{content.conceptList.map((line,i)=><li key={i}>{safeText(line)}</li>)}</ul>
    <div className="li-learning-comparison">
     <div><Heading level={3} role="titleSmall">{content.compareTitle1}</Heading>
      <p className="li-learning-copy">{safeText(content.compareText1)}</p></div>
     <div><Heading level={3} role="titleSmall">{content.compareTitle2}</Heading>
      <p className="li-learning-copy">{safeText(content.compareText2)}</p></div>
    </div>
    <Text>{safeText(content.conceptNote)}</Text>
    <div id={'li-react-'+id+'-visuals'} className="li-lesson-single-figure">
     <Heading level={3} role="titleMedium">{content.visualTitle}</Heading>
     <LessonFigure src={sourceImg.src} link={sourceImg.link} credit={sourceImg.credit}
      title={content.visualCaption} note={content.visualNote}
      fallback={vi?'Ảnh chưa tải. Mở ảnh gốc để xem giấy phép.':'Image unavailable. Open the original to check the license.'}
      openLabel={vi?'Mở ảnh gốc':'Open original image'}/>
    </div>
    <Button onClick={()=>setPhase('guided')}>{vi?'Tiếp: Thử áp dụng':'Next: Guided example'} →</Button>
   </Card>}
   {phase==='guided'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-wave1-guided">
    <Heading level={2} id="li-wave1-guided" role="titleLarge">{content.guidedTitle}</Heading>
    <p className="li-learning-copy">{safeText(content.guidedText)}</p>
    <p className="li-learning-copy">{safeText(content.guidedQuestion)}</p>
    <Field kind="textarea" rows={5} label={content.guidedLabel}
     value={attempt.guidedDraft} disabled={locked}
     placeholder={content.guidedPlaceholder}
     onChange={e=>editGuided(e.currentTarget.value)}/>
    <Text role="support">{content.guidedSave}</Text>
    <details className="li-learning-hint">
     <summary>{content.guidedShow}</summary>
     <p className="li-learning-copy">{safeText(content.guidedHint)}</p>
    </details>
    <details className="li-learning-extras">
       <summary>{vi?'Thần Chú gợi ý':'Optional study methods'}</summary>
      <aside className="li-lesson-spells" aria-label={vi?'Thần Chú gợi ý':'Suggested spells'}>
       <Heading level={2} role="titleSmall">{vi?'Thần Chú có thể thử':'Spells to try'}</Heading>
       <Text role="support">{vi?
        'Gợi ý theo dạng bài · Không bắt buộc · Chưa duyệt ghép phương pháp.':
        'Optional task-based suggestions · Method fit not yet reviewed.'}</Text>
       <div className="li-lesson-spell-list">
        {showSpells.map((spell,index)=><div className="li-lesson-spell-item" key={spell.techniqueId}>
         <strong>{spell.shortId} · {vi?spell.name.vi:spell.name.en}</strong>
         <Text role="support">{vi?spell.why.vi:spell.why.en}</Text>
         <Button variant="secondary" className="li-lesson-spell-action"
          onClick={()=>openLessonSpell(id,spell.shortId,index===0)}
          disabled={locked||saving} aria-label={(vi?'Thử Thần Chú ':'Try spell ')+spell.shortId}>
          {vi?(index===0?'Thử thi triển':'Xem chú bổ trợ'):
           (index===0?'Try this spell':'See optional spell')}
         </Button>
        </div>)}
       </div>
      </aside>
      </details>
    <Button onClick={()=>setPhase('practice')}>{vi?'Tiếp: Làm bài':'Next: Practice'} →</Button>
   </Card>}
   {phase==='practice'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-wave1-practice">
    <Heading level={2} id="li-wave1-practice" role="titleLarge">{content.challengeTitle}</Heading>
    <p className="li-learning-copy">{safeText(content.challengeText)}</p>
    <Text>{safeText(content.challengeClaim)}</Text>
    {!attempt.submitted&&!attempt.hint&&<Button variant="secondary"
     disabled={saving||locked} onClick={revealHint}>{content.hintButton}</Button>}
    {attempt.hint&&<p className="li-learning-hint li-learning-copy" role="note">
     {safeText(content.hint)}</p>}
    <div className="li-learning-fields">
     {content.questions.map((question,i)=><Field key={i} kind="textarea" rows={4}
      label={(i+1)+'. '+question} placeholder={content.placeholder}
      value={attempt.draft[i]} disabled={locked||attempt.submitted}
      onChange={e=>editAnswer(i,e.currentTarget.value)}/>)}
    </div>
    <Text role="support">{content.saveHint}</Text>
    {!attempt.submitted?<div className="li-learning-recovery">
     <Button disabled={saving||locked} onClick={()=>void submit()}>{content.submit}</Button>
     <Button variant="secondary" disabled={saving||locked} onClick={clearDraft}>{content.clear}</Button>
    </div>:<Button onClick={()=>setPhase('feedback')}>
     {labels.feedback}</Button>}
   </Card>}
   {phase==='feedback'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-wave1-feedback">
    <Heading level={2} id="li-wave1-feedback" role="titleLarge">{content.answerTitle}</Heading>
    <p className="li-learning-copy">{safeText(content.answer)}</p>
    <Text>{safeText(content.answerNote)}</Text>
    <section className="li-learning-submission" aria-label={vi?'Bài làm của bạn':'Your submission'}>
     <Heading level={3} role="titleMedium">
      {vi?'Bài làm của bạn — đối chiếu trước khi tự chấm':'Your submitted answers'}</Heading>
     <ol className="li-learning-submission-list">
      {content.questions.map((question,i)=><li key={i}>
       <Text role="support">{question}</Text>
       <p className="li-learning-submitted-answer">{displayed[i]}</p>
      </li>)}
     </ol>
    </section>
    <Heading level={3} role="titleMedium">{content.rubricTitle}</Heading>
    <Text>{content.rubricLead}</Text>
    <div className="li-learning-fields">
     {content.rubricItems.map((item,i)=><div className="li-learning-rating" key={i}>
      <label htmlFor={'li-wave1-rating-'+id+'-'+i}>
       <strong>{item[0]}</strong><Text role="support">{item[1]}</Text>
      </label>
      <select id={'li-wave1-rating-'+id+'-'+i}
       value={attempt.ratings[i]??''} disabled={attempt.reviewed||locked}
       onChange={e=>rate(i,e.currentTarget.value)}>
       {content.scoreOptions.map((option,j)=><option key={j} value={j===0?'':String(j-1)}>
        {option}</option>)}
      </select>
     </div>)}
    </div>
    <Text role="support">{content.scoreLabel}: {attempt.ratings.every(x=>x!==null)?
     attempt.ratings.reduce<number>((sum,v)=>sum+(v??0),0)+' / 8':'— / 8'}</Text>
    <AiFeedbackPanel id={id} locale={appLocale}
     answers={attempt.submission??attempt.draft}
     openQuestionIndices={feedbackPolicy.lessons[id].modes.flatMap((mode,index)=>mode==='open'?[index]:[])}/>
    <SelfReviewNextStep rubricItems={content.rubricItems} ratings={attempt.ratings}
     locale={appLocale} onReviewTheory={()=>setPhase('read')}/>
    {attempt.reviewed?<Button onClick={()=>setPhase('progress')}>{vi?'Tiếp: Tiến độ':'Next: Progress'} →</Button>:
     <Button disabled={locked||saving} onClick={()=>void finish()}>{content.saveReview}</Button>}
   </Card>}
   {phase==='progress'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-wave1-progress">
    <Heading level={2} id="li-wave1-progress" role="titleLarge">{content.reviewDone}</Heading>
    <Text>{content.progressDone}</Text>
    <Text>{content.scoreLabel}: {attempt.ratings.reduce<number>((n,v)=>n+(v??0),0)} / 8</Text>
    <SelfReviewNextStep rubricItems={content.rubricItems} ratings={attempt.ratings}
     locale={appLocale} onReviewTheory={()=>setPhase('read')}/>
    <T02ReviewEntry lessonId={id} vi={vi} disabled={locked||saving}
     onOpen={()=>{if(!openLessonSpell(id,'T02',true))
      setError(vi?'Không mở được lịch ôn cho bài này.':'Could not open this lesson review.');}}/>
   </Card>}
  </motion.div>
  {phase==='read'&&<details className="li-learning-extra-sources">
   <summary>{vi?'Nguồn & đọc thêm':'Sources & further reading'}</summary>
   <LessonSources id={id} locale={appLocale} copy={content}
    sources={source.sources} subject={source.hierarchy.field.title}
    conceptTitle={content.conceptTitle} onSearch={ports.search.openSearch}/>
  </details>}
  {phase==='progress'&&<RelatedLessons id={id} locale={appLocale}/>} 
  <LessonMentor id={id} locale={appLocale}/>
 </section>;
}
