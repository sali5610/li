import React,{useCallback,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import exact from '../l09-exact.generated.json';
import lesson09 from '../../../../content/lessons/L09-1-2.json';
import spellSuggestions from '../../../../site/assets/lesson-spell-suggestions.v0.1.json';
import type {Attempt,Rating} from '../native-bridge';
import {Button,Card} from '../../../../design-system/react/Components';
import {Field} from '../../../../design-system/react/Controls';
import {Heading,Text,Progress} from '../../../../design-system/react/Atoms';
import {SaveStatus} from '../../../../design-system/react/Molecules';
import type {SaveState} from '../../../../design-system/react/Molecules';
import {L09_LESSON_ID} from './ports';
import type {LearningPorts,SyncState} from './ports';
import {appUiStore} from '../shell/app-store.js';
import type {LessonPhase} from '../shell/app-store.js';
import {createLessonPhaseActor} from './phase-machine.js';
import './journey.css';
import {StudyBookFolio} from './StudyBookFolio';
import {useDiscoveryLocale,localized,type BilingualCopy} from '../shell/discovery-locale.js';
import {useStepScreen} from './step-screen.js';
import {LessonBookmark,LessonMentor,L09Figures,LessonSources,openLessonSpell} from './LessonDetailParity.js';
import {CopyAnalysisPrompt} from './CopyAnalysisPrompt.js';
import {RelatedLessons} from './RelatedLessons.js';
import {SelfReviewNextStep} from './SelfReviewNextStep.js';
import {T02ReviewEntry} from './T02ReviewEntry.js';
import {AiFeedbackPanel} from './AiFeedbackPanel.js';
import feedbackPolicy from '../../../../content/feedback/ai-question-modes.v1.json';
import {freshLessonAttempt,confirmLessonRestart} from './restart-lesson.js';

/** A real invited-only React learner screen, not a second app.
 * Editorial VI/EN copy is compiled from canonical GitHub
 * content/lessons/L09-1-2.json; signed Dexie/Neon attempts use the stable ID.
 */
type Phase=LessonPhase;
const sequence:Phase[]=['read','guided','practice','feedback','progress'];
const MAX_ANSWER_CHARS=4000;
const comparableFields:(keyof Attempt)[]=['locale','draft','guidedDraft','hint','assisted',
 'submitted','submittedAt','submission','submissionLocale','ratings','reviewed'];
function sameAttempt(a:Attempt,b:Attempt):boolean{
 return comparableFields.every(field=>JSON.stringify(a[field])===JSON.stringify(b[field]));
}
const strip=(html:string)=>html.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&')
 .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');

function resumedPhase(a:Attempt):Phase{
 if(a.reviewed)return 'progress';
 if(a.submitted)return 'feedback';
 if(a.draft.some(x=>x.trim()))return 'practice';
 if(a.guidedDraft.trim())return 'guided';
 return 'read';
}
function statusText(status:SyncState,vi:boolean){
 if(vi)return {synced:'Đã đồng bộ',queued:'Đã lưu trên thiết bị · đang chờ đồng bộ',
   conflict:'Bài này có xung đột · mở Tài khoản để chọn bản',
   'on-device':'Đã lưu trên thiết bị','unavailable':'Chưa thể xác nhận đồng bộ'}[status];
 return {synced:'Synced',queued:'Saved on device · waiting to sync',
   conflict:'Lesson conflict · choose a version in Account',
   'on-device':'Saved on this device',unavailable:'Sync status unavailable'}[status];
}

export function LearningJourney({ports}:{ports:LearningPorts}){
 const reduced=useReducedMotion();
 const appLocale=useDiscoveryLocale();
 const [attempt,setAttempt]=useState<Attempt|null>(null);
 const [phaseActor]=useState(createLessonPhaseActor);
 const subscribePhase=useCallback((notify:()=>void)=>{
  const subscription=phaseActor.subscribe(notify);
  return ()=>subscription.unsubscribe();
 },[phaseActor]);
 const phase=useSyncExternalStore(subscribePhase,
  ()=>phaseActor.getSnapshot().value as Phase);
 useStepScreen(phase,'L09-1-2');
 useEffect(()=>()=>{phaseActor.stop();},[phaseActor]);
 useEffect(()=>{
  appUiStore.getState().setLessonPhase(phase);
  window.dispatchEvent(new Event('li:lesson-phase-changed'));
  return ()=>appUiStore.getState().setLessonPhase(null);
 },[phase]);
 // Lão Lý's Read this section must navigate the visible React workflow, not
 // hidden legacy lesson anchors. Navigating does not submit or review work.
 useEffect(()=>{
  const onMentorJump=(event:Event)=>{
   const detail=(event as CustomEvent<{lessonId?:string;phase?:string}>).detail;
   if(!detail||detail.lessonId!=='L09-1-2'||
    !['read','guided','practice','feedback','progress'].includes(detail.phase||''))return;
   const next=detail.phase as Phase;
   const root=document.querySelector('[data-li-react-journey="L09-1-2"]');
   if(!root||root.closest('.page')?.classList.contains('active')===false)return;
   phaseActor.send({type:'OPEN',phase:next});
   if(phaseActor.getSnapshot().value!==next)return;
   window.requestAnimationFrame(()=>{
    root.querySelector('.li-learning-current')
     ?.scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'});
   });
  };
  window.addEventListener('li:mentor-phase-jump',onMentorJump);
  return()=>window.removeEventListener('li:mentor-phase-jump',onMentorJump);
 },[phaseActor,reduced]);

 const [busy,setBusy]=useState(true);
 const [loadAttempt,setLoadAttempt]=useState(0);
 const [saving,setSaving]=useState(false);
 const [sync,setSync]=useState<SyncState>('unavailable');
 const [errorCopy,setError]=useState<BilingualCopy|null>(null);
 const error=errorCopy?localized(appLocale,...errorCopy):'';
 const [locked,setLocked]=useState(false);
 const subject=useRef<string|null>(null), revision=useRef<string|null>(null);
 const writes=useRef<Promise<void>>(Promise.resolve());
 const failedWrite=useRef(false),pendingWrites=useRef(0);
 const mounted=useRef(true);
 useEffect(()=>{
  const refresh=(event:Event)=>{
   const detail=(event as CustomEvent<{accountId?:string}>).detail;
   if(detail?.accountId===subject.current)void refreshStatus();
  };
  window.addEventListener('li:learning-sync-report',refresh);
  return()=>window.removeEventListener('li:learning-sync-report',refresh);
 },[]);
 useEffect(()=>{
  const onCloudLesson=(event:Event)=>{
   const detail=(event as CustomEvent<{accountId?:string;lessonIds?:string[]}>).detail;
   if(detail?.accountId===subject.current&&detail.lessonIds?.includes(L09_LESSON_ID)&&
      !failedWrite.current&&pendingWrites.current===0)
    setLoadAttempt(value=>value+1);
  };
  window.addEventListener('li:lesson-sync-applied',onCloudLesson);
  return()=>window.removeEventListener('li:lesson-sync-applied',onCloudLesson);
 },[]);

 useEffect(()=>{
  mounted.current=true;
  subject.current=null;
  revision.current=null;
  setBusy(true);
  setError(null);
  let cancelled=false;
  (async()=>{
   try{
    const learner=await ports.auth.requireInvitedLearner();
    if(!learner?.subjectId)throw Error('INVITE_REQUIRED');
    const saved=await ports.attempts.load({lessonId:L09_LESSON_ID,subjectId:learner.subjectId});
    if(!saved||!saved.revision||!saved.attempt)throw Error('ATTEMPT_UNAVAILABLE');
    const data=saved.attempt;
    if(!Array.isArray(data.draft)||data.draft.length!==4||
       !data.draft.every(x=>typeof x==='string')||
       !Array.isArray(data.ratings)||data.ratings.length!==4||
       !data.ratings.every(x=>x===null||x===0||x===1||x===2)||
       typeof data.guidedDraft!=='string'||typeof data.submitted!=='boolean'||
       typeof data.reviewed!=='boolean'||!['vi','en'].includes(data.locale))
     throw Error('INVALID_ATTEMPT');
    const status=await ports.sync.getStatus({lessonId:L09_LESSON_ID,subjectId:learner.subjectId})
     .catch(()=>'unavailable' as SyncState);
    if(cancelled)return;
    subject.current=learner.subjectId;
    revision.current=saved.revision;
    setAttempt(saved.attempt);
    phaseActor.send({type:'COMMIT',submitted:data.submitted,reviewed:data.reviewed});
    phaseActor.send({type:'OPEN',phase:resumedPhase(data)});
    setSync(status);
    setBusy(false);
   }catch{
    if(!cancelled){setError(['Không thể xác minh quyền truy cập hoặc tải bài học. Không mở chế độ khách.','Could not verify access or load the lesson. Guest access is unavailable.']);setBusy(false);}
   }
  })();
  return()=>{cancelled=true;mounted.current=false;};
 },[ports,loadAttempt,phaseActor]);

 async function refreshStatus(){
  if(!subject.current)return;
  try{
   const value=await ports.sync.getStatus({lessonId:L09_LESSON_ID,subjectId:subject.current});
   if(mounted.current)setSync(value);
  }catch{if(mounted.current)setSync('unavailable');}
 }
 function save(next:Attempt):Promise<boolean>{
  if(locked||failedWrite.current||!subject.current||!revision.current)return Promise.resolve(false);
  setAttempt(next);
  pendingWrites.current+=1;
  setSaving(true);
  const target=subject.current;
  const previous=writes.current;
  const operation=previous.then(async()=>{
   if(!revision.current||failedWrite.current)throw Error('SAVE_LOCKED');
   const saved=await ports.attempts.save({
    lessonId:L09_LESSON_ID,subjectId:target,
    attempt:next,expectedRevision:revision.current
   });
   if(!saved?.revision)throw Error('SAVE_WITHOUT_REVISION');
   revision.current=saved.revision;
   return true;
  }).catch(()=>{
   failedWrite.current=true;
   if(mounted.current){
    setLocked(true);
    setError(['Không lưu được dữ liệu. Bản đang sửa vẫn hiển thị; đừng tải lại trước khi xử lý lỗi.','Could not save. Your edits are still here. Resolve the issue before reloading.']);
   }
   return false;
  });
  writes.current=operation.then(async(ok)=>{
   if(ok)await refreshStatus();
  }).catch(()=>{});
  void writes.current.finally(()=>{
   pendingWrites.current-=1;
   if(mounted.current)setSaving(pendingWrites.current>0);
  });
  return operation;
 }
 async function retryFailedSave(){
  if(!attempt||!subject.current||!failedWrite.current||pendingWrites.current>0)return;
  const uid=subject.current,unsaved=attempt;
  setSaving(true);
  try{
   const learner=await ports.auth.requireInvitedLearner();
   if(learner.subjectId!==uid)throw Error('LEARNER_CHANGED');
   const latest=await ports.attempts.load({lessonId:L09_LESSON_ID,subjectId:uid});
   // LocalStorage might have accepted our draft before Dexie failed. Retry that
   // exact draft at its latest revision; never clobber another device/tab.
   if(latest.revision!==revision.current&&!sameAttempt(latest.attempt,unsaved)){
    setError(['Tiến độ đã thay đổi ở nơi khác. Bản chưa lưu vẫn nằm trên màn hình; không tự ghi đè.','Progress changed elsewhere. Your unsaved work is still here and nothing was overwritten.']);
    return;
   }
   const saved=await ports.attempts.save({
    lessonId:L09_LESSON_ID,subjectId:uid,attempt:unsaved,
    expectedRevision:latest.revision
   });
   if(!saved?.revision)throw Error('SAVE_WITHOUT_REVISION');
   revision.current=saved.revision;
   failedWrite.current=false;
   setLocked(false);
   setError(null);
   await refreshStatus();
  }catch{
   setError(['Chưa lưu lại được. Bản đang sửa vẫn trên màn hình; hãy kiểm tra bộ nhớ thiết bị và thử lại.','Could not save. Your edits are still here. Check device storage and retry.']);
  }finally{if(mounted.current)setSaving(false);}
 }
 function editDraft(index:number,value:string){
  if(!attempt||attempt.submitted||locked)return;
  if(value.length>MAX_ANSWER_CHARS){
   setError(['Mỗi câu trả lời tối đa 4.000 ký tự để lưu an toàn.','Use at most 4,000 characters per answer.']);return;
  }
  if(error)setError(null);
  const draft=[...attempt.draft] as Attempt['draft'];
  draft[index]=value;
  void save({...attempt,draft});
 }
 function editGuided(value:string){
  if(!attempt||attempt.submitted||locked)return;
  if(value.length>MAX_ANSWER_CHARS){
   setError(['Phần thử áp dụng tối đa 4.000 ký tự để lưu an toàn.','Use at most 4,000 characters for the guided response.']);return;
  }
  if(error)setError(null);
  void save({...attempt,guidedDraft:value});
 }
 function changeRating(index:number,value:string){
  if(!attempt||!attempt.submitted||attempt.reviewed||locked)return;
  const ratings=[...attempt.ratings] as Attempt['ratings'];
  ratings[index]=value===''?null:Number(value) as Rating;
  void save({...attempt,ratings});
 }
 async function submit(){
  if(!attempt||attempt.submitted||locked)return;
  if(attempt.draft.some(x=>x.trim().length<12)){
   setError(['Trả lời cả 4 câu (mỗi câu ít nhất 12 ký tự) trước khi nộp.','Answer all four questions with at least 12 characters each before submitting.']);return;
  }
  setError(null);
  const next:Attempt={...attempt,submitted:true,submittedAt:new Date().toISOString(),
   submission:[...attempt.draft] as Attempt['submission'],submissionLocale:attempt.locale};
  if(await save(next)){
   phaseActor.send({type:'COMMIT',submitted:true,reviewed:false});
   phaseActor.send({type:'OPEN',phase:'feedback'});
  }
 }
 async function finish(){
  if(!attempt||!attempt.submitted||attempt.reviewed||locked)return;
  if(attempt.ratings.some(x=>x===null)){
   setError(['Chọn đủ 4 tiêu chí tự đánh giá trước khi hoàn tất.','Rate all four self-review criteria before finishing.']);return;
  }
  setError(null);
  if(await save({...attempt,reviewed:true})){
   phaseActor.send({type:'COMMIT',submitted:true,reviewed:true});
   phaseActor.send({type:'OPEN',phase:'progress'});
  }
 }
 function clearDraft(){
  if(!attempt||locked||saving||attempt.submitted)return;
  if(!window.confirm(exact.langs[attempt.locale].resetConfirm))return;
  void save({...attempt,draft:['','','',''] as Attempt['draft']});
 }
 async function restartLesson(){
  if(!attempt||locked||saving||pendingWrites.current>0)return;
  if(!confirmLessonRestart(L09_LESSON_ID,attempt.locale))return;
  setError(null);
  if(await save(freshLessonAttempt(attempt))){
   phaseActor.send({type:'COMMIT',submitted:false,reviewed:false});
   phaseActor.send({type:'OPEN',phase:'read'});
  }
 }
 function go(next:Phase){
  if(!attempt)return;
  phaseActor.send({type:'OPEN',phase:next});
  if(phaseActor.getSnapshot().value===next)setError(null);
 }
 // Settings is the only app language control. Saved lesson locale follows it.
 useEffect(()=>{
  if(busy||!attempt||attempt.locale===appLocale||locked||saving||
     pendingWrites.current>0)return;
  void save({...attempt,locale:appLocale});
 },[appLocale,attempt?.locale,busy,locked,saving]);
 if(busy)return <section className="li-learning-journey" aria-busy="true" role="status">
  {localized(appLocale,'Đang xác minh quyền học và tải tiến độ…','Verifying access and loading progress…')}
 </section>;
 if(!attempt)return <section className="li-learning-journey" role="alert">
  <Heading level={2} role="titleMedium">{localized(appLocale,'Chưa mở được bài L09','Could not open lesson L09')}</Heading>
  <Text>{error||localized(appLocale,'Không tải được dữ liệu học. Quyền truy cập vẫn được bảo vệ.','Could not load your learning data. Access is still protected.')}</Text>
  <div className="li-learning-recovery">
   <Button onClick={()=>setLoadAttempt(value=>value+1)}>{localized(appLocale,'Thử lại','Try again')}</Button>
  </div>
 </section>;

 const vi=appLocale==='vi',content=exact.langs[appLocale];
 const labels:Record<Phase,string>=vi?
  {read:'Đọc bài',guided:'Thử áp dụng',practice:'Làm bài',feedback:'Đối chiếu',progress:'Tiến độ'}:
  {read:'Learn',guided:'Try it',practice:'Practice',feedback:'Feedback',progress:'Progress'};
 const answered=attempt.draft.filter(x=>x.trim().length>=12).length;
 const rated=attempt.ratings.filter(x=>x!==null).length;
 const percent=attempt.reviewed?100:attempt.submitted?75:Math.round(answered/4*50);
 const accessibleProgress=vi?'Tiến trình hoàn thành lượt bài học':'Lesson attempt progress';
 const saveViewState:SaveState=locked?'error':saving?'saving':
  sync==='synced'?'synced':(sync==='queued'||sync==='conflict')?'queued':
  sync==='on-device'?'saved-device':'unavailable';
 const saveMessage=locked?(vi?'Lưu thất bại':'Save failed'):
  saving?(vi?'Đang lưu…':'Saving…'):statusText(sync,vi);
 const transition=reduced?{duration:0}:{duration:0.18,ease:'easeOut' as const};
 const pageIndex=sequence.indexOf(phase);
 return <section className="li-learning-journey" data-li-react-journey="L09-1-2" lang={appLocale}
  data-li-lesson-phase={phase} data-li-lesson-submitted={attempt.submitted?'true':'false'}
  data-li-lesson-reviewed={attempt.reviewed?'true':'false'}>
  <header className="li-learning-header">
   <div>
    <Heading level={1} id="li-react-l09-title" role="headline">{content.title}</Heading>
    <Text role="caption">DATA SCIENCE · L09-1-2</Text>
    <Text role="body">{content.intro}</Text>
   </div>
   <div className="li-learning-header-actions">
    <LessonBookmark id="L09-1-2" locale={appLocale}/>
    <details className="li-lesson-header-more">
     <summary>{vi?'Tùy chọn':'Options'}</summary>
     <Button variant="ghost" disabled={saving||locked}
      onClick={()=>void restartLesson()}>{vi?'Học lại từ đầu':'Restart lesson'}</Button>
    </details>
   </div>
  </header>
    <StudyBookFolio phase={phase} steps={sequence} locale={appLocale}
   onPrevious={pageIndex>0?()=>go(sequence[pageIndex-1]):undefined}
   onNext={pageIndex<sequence.length-1?()=>go(sequence[pageIndex+1]):undefined}/>
  <aside className="li-learning-rail" aria-label="Learning navigation and status">

  <div className="li-learning-save">
   {(saveViewState==='error'||sync==='conflict')&&
    <SaveStatus state={saveViewState} message={saveMessage} detail={locked?error:undefined}/>}
   {(attempt.reviewed||attempt.submitted)&&
    <Text role="support" className="li-learning-ready-count">{attempt.reviewed?
     (vi?'Đã tự đánh giá':'Self-reviewed'):
     (vi?'Đã nộp · '+rated+'/4 tự chấm':'Submitted · '+rated+'/4 rated')}</Text>}
   <Progress label={accessibleProgress} value={percent}/>
   <details className="li-learning-attempt-meta">
    <summary>{vi?'Chi tiết lượt học':'Attempt details'}</summary>
    <Text role="support">{attempt.reviewed?
     (vi?'Đã tự đánh giá 1 lượt, chưa phải điểm thông thạo':'Self-review completed, not a mastery grade'):
     attempt.submitted?(vi?'Đã nộp · tự đánh giá '+rated+'/4':'Submitted · self-review '+rated+'/4'):
     (vi?'Đủ điều kiện nộp '+answered+'/4 câu':'Submission-ready '+answered+'/4 answers')}</Text>
    {attempt.assisted&&<Text role="support">{content.assisted}</Text>}
   </details>
  </div>
  </aside>
  {error&&!locked&&<p className="li-learning-error" role="alert">{error}</p>}
  {locked&&<div className="li-learning-recovery">
   <Button disabled={saving} onClick={()=>void retryFailedSave()}>
    {vi?'Thử lưu lại':'Retry saving'}
   </Button>
   <Text role="support">{vi?'Không tải lại trang khi bản nháp chưa lưu.':'Keep this page open while changes are unsaved.'}</Text>
  </div>}
  <motion.div key={phase} initial={reduced?false:{opacity:0,x:12,rotateY:-1}}
   animate={{opacity:1,x:0,rotateY:0}} transition={transition} className="li-learning-current">
   
   {phase==='read'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-learn-read">
    <Heading level={2} id="li-learn-read" role="titleLarge">{content.theoryTitle}</Heading>
    <Text>{strip(content.theoryLead)}</Text>
    <div className="li-lesson-stats" aria-label={vi?'Số liệu ví dụ':'Example figures'}>
     {['1.000','82%','?'].map((value,i)=><div className="li-lesson-stat" key={value}>
      <strong>{value}</strong><Text role="support">{content.stats[i]}</Text>
     </div>)}
    </div>
    <ul>{content.defs.map((definition:string,i:number)=><li key={i}>{strip(definition)}</li>)}</ul>
    <div className="li-learning-comparison">
     <div><Heading level={3} role="titleSmall">{content.biasTitle}</Heading><Text>{strip(content.biasText)}</Text></div>
     <div><Heading level={3} role="titleSmall">{content.variationTitle}</Heading><Text>{strip(content.variationText)}</Text></div>
    </div>
    <Text role="support">{strip(content.limit)}</Text>
    <Heading level={3} role="titleMedium">{content.goalsTitle}</Heading>
    <ul>{content.goals.map((goal:string,i:number)=><li key={i}>{goal}</li>)}</ul>
   </Card>}
   {phase==='guided'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-learn-guided">
    <Heading level={2} id="li-learn-guided" role="titleLarge">{content.exTitle}</Heading>
    <Text>{strip(content.exBody)}</Text>
    <Text>{strip(content.exQuestion)}</Text>
    <Field kind="textarea" label={content.guidedLabel} rows={5}
     value={attempt.guidedDraft} disabled={locked}
     onChange={event=>editGuided(event.currentTarget.value)}/>
    <Text role="support">{content.guidedSaveNote}</Text>
    <details className="li-learning-hint"><summary>{vi?'Xem gợi ý phân tích':'See analysis hint'}</summary>
     <Text>{strip(content.exHelp)}</Text></details>
    <details className="li-learning-extras">
       <summary>{vi?'Thần Chú gợi ý':'Optional study methods'}</summary>
      <aside className="li-lesson-spells" aria-label={vi?'Thần Chú gợi ý cho bài học':'Suggested study spells'}>
       <div className="li-lesson-spell-header">
        <Heading level={2} role="titleSmall">{vi?'Thần Chú có thể thử':'Spells to try'}</Heading>
        <Text role="support">{vi?
         'Gợi ý theo dạng bài · Không bắt buộc · Chưa duyệt ghép phương pháp.':
         'Optional task-based suggestions · Lesson method fit not yet reviewed.'}</Text>
       </div>
       <div className="li-lesson-spell-list">
        {spellSuggestions.lessons['L09-1-2'].map((spell,index)=>
         <div className="li-lesson-spell-item" key={spell.techniqueId}>
          <strong>{spell.shortId} · {vi?spell.name.vi:spell.name.en}</strong>
          <Text role="support">{vi?spell.why.vi:spell.why.en}</Text>
          <Button variant="secondary" className="li-lesson-spell-action"
           onClick={()=>openLessonSpell('L09-1-2',spell.shortId,index===0)}
           disabled={saving||locked}
           aria-label={(vi?'Thử Thần Chú ':'Try spell ')+spell.shortId}>
           {vi?(index?'Xem chú bổ trợ':'Thử thi triển'):
            (index?'See optional spell':'Try this spell')}
          </Button>
         </div>)}
       </div>
      </aside>
      </details>
    <CopyAnalysisPrompt locale={appLocale} step="guided" data={{
     title:content.title,lessonId:'L09-1-2',activity:content.exBody+'\n'+content.exQuestion,
     questions:[content.exQuestion],answers:[attempt.guidedDraft],
     reference:attempt.hint?content.exHelp:undefined
    }}/>
    <Button onClick={()=>go('practice')}>{vi?'Tiếp: Làm bài':'Next: Practice'} →</Button>
   </Card>}
   {phase==='practice'&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-learn-practice">
    <Heading level={2} id="li-learn-practice" role="titleLarge">{content.challengeTitle}</Heading>
    <Text>{strip(content.caseText)}</Text>
    <Text>{content.caseClaim}</Text>
    {!attempt.submitted&&!attempt.hint&&
     <Button variant="secondary" disabled={saving||locked}
      onClick={()=>void save({...attempt,hint:true,assisted:true})}>
      {content.hintButton}
     </Button>}
    {attempt.hint&&<div className="li-learning-hint" role="note">
     <Text>{strip(content.hint)}</Text>
    </div>}
    <div className="li-learning-fields">{content.questions.map((question:string,i:number)=>
     <Field key={i} kind="textarea" rows={4} label={(i+1)+'. '+question}
      value={attempt.draft[i]} disabled={attempt.submitted||locked}
      placeholder={content.placeholder}
      onChange={event=>editDraft(i,event.currentTarget.value)}/>)}</div>
    <Text role="support">{content.saveHint}</Text>
    {!attempt.submitted?<div className="li-learning-recovery">
     <Button disabled={locked||saving} onClick={()=>void submit()}>{content.submit}</Button>
     <Button variant="secondary" disabled={locked||saving} onClick={clearDraft}>{content.clear}</Button>
    </div>:
     <Button onClick={()=>go('feedback')}>{vi?'Tiếp: Đối chiếu':'Next: Feedback'} →</Button>}
   </Card>}
   {phase==='feedback'&&!attempt.submitted&&<Card variant="flat-study" className="li-study-book-page">
    <Heading level={2} role="titleLarge">{labels.feedback}</Heading>
    <Text>{vi?'Chưa nộp bài. Vẫn có thể qua phần khác; đáp án và tự đánh giá chỉ mở sau khi nộp.':
     'Not submitted yet. You can keep browsing; answers and self-review unlock after submission.'}</Text>
    <Button variant="secondary" onClick={()=>go('practice')}>
     {vi?'Quay lại làm bài':'Return to practice'}</Button>
   </Card>}
   {phase==='feedback'&&attempt.submitted&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-learn-feedback">
    <Heading level={2} id="li-learn-feedback" role="titleLarge">{content.answerTitle}</Heading>
    <Text>{strip(content.answer)}</Text>
    <Text role="support">{strip(content.answerCaution)}</Text>
    <section className="li-learning-submission" aria-label={vi?'Bài làm của bạn':'Your submitted answers'}>
     <Heading level={3} role="titleMedium">
      {vi?'Bài làm của bạn — đối chiếu trước khi tự chấm':'Your answers — compare before rating'}
     </Heading>
     <ol className="li-learning-submission-list">
      {content.questions.map((question:string,i:number)=><li key={i}>
       <Text role="support">{question}</Text>
       <p className="li-learning-submitted-answer">
        {(attempt.submission??attempt.draft)[i]}
       </p>
      </li>)}
     </ol>
    </section>
    <Heading level={3} role="titleMedium">{content.rubricTitle}</Heading>
    <Text role="support">{content.rubricLead}</Text>
    <div className="li-learning-fields">
     {content.rubricItems.map((item:string[],i:number)=><div className="li-learning-rating" key={i}>
      <label htmlFor={'li-rating-'+i}><strong>{item[0]}</strong><Text role="support">{item[1]}</Text></label>
      <select id={'li-rating-'+i} value={attempt.ratings[i]??''}
       disabled={attempt.reviewed||locked}
       onChange={event=>changeRating(i,event.currentTarget.value)}>
       {content.scoreOptions.map((option:string,j:number)=>
        <option key={j} value={j===0?'':String(j-1)}>{option}</option>)}
      </select>
     </div>)}
    </div>
    <AiFeedbackPanel id="L09-1-2" locale={appLocale}
     answers={attempt.submission??attempt.draft}
     openQuestionIndices={feedbackPolicy.lessons['L09-1-2'].modes.flatMap((mode,index)=>mode==='open'?[index]:[])}/>
    <SelfReviewNextStep rubricItems={content.rubricItems} ratings={attempt.ratings}
     locale={appLocale} onReviewTheory={()=>go('read')}/>
    <Text role="support">{vi?'Tự chấm theo rubric, không phải điểm tự động.':'Self-review, not automatic grading.'}</Text>
    {attempt.reviewed?<Button onClick={()=>go('progress')}>{vi?'Tiếp: Tiến độ':'Next: Progress'} →</Button>:
     <Button disabled={locked||saving} onClick={()=>void finish()}>{content.saveReview}</Button>}
    <CopyAnalysisPrompt locale={appLocale} step="feedback" data={{
     title:content.title,lessonId:'L09-1-2',activity:content.caseText+'\n'+content.caseClaim,
     questions:content.questions,answers:attempt.submission??attempt.draft,
     reference:content.answer+'\n'+content.answerCaution,
     extra:content.rubricItems.map(item=>item.join(' · ')).join('\n')
    }}/>
   </Card>}
   {phase==='progress'&&!attempt.reviewed&&<Card variant="flat-study" className="li-study-book-page">
    <Heading level={2} role="titleLarge">{labels.progress}</Heading>
    <Text>{vi?'Chưa hoàn thành lượt học. Chuyển phần không tự nộp bài, tự chấm hay cộng tiến độ.':
     'This attempt is not complete. Skipping sections does not submit, score or mark progress.'}</Text>
    <Button variant="secondary" onClick={()=>go('practice')}>
     {vi?'Quay lại làm bài':'Return to practice'}</Button>
   </Card>}
   {phase==='progress'&&attempt.reviewed&&<Card variant="flat-study" className="li-study-book-page" aria-labelledby="li-learn-progress">
    <Heading level={2} id="li-learn-progress" role="titleLarge">
     {vi?'Hoàn thành lượt tự đánh giá':'Self-review completed'}
    </Heading>
    <Text>{vi?'Đây là một lượt học đã lưu, không phải chứng nhận thông thạo.':
     'This is one saved learning attempt, not a mastery certificate.'}</Text>
    <SelfReviewNextStep rubricItems={content.rubricItems} ratings={attempt.ratings}
     locale={appLocale} onReviewTheory={()=>go('read')}/>
    <Text role="support">{content.scoreLabel}: {attempt.ratings.reduce<number>((n,x)=>n+(x??0),0)} / 8</Text>
    <T02ReviewEntry lessonId="L09-1-2" vi={vi} disabled={locked||saving}
     onOpen={()=>{if(!openLessonSpell('L09-1-2','T02',true))
      setError(['Không mở được lịch ôn cho bài này.','Could not open this lesson review.']);}}/>
    <Button variant="secondary" onClick={()=>ports.search.openSearch('sampling bias random sampling variation')}>
     {vi?'Tìm bài liên quan':'Find related lessons'}
    </Button>
    <CopyAnalysisPrompt locale={appLocale} step="progress" data={{
     title:content.title,lessonId:'L09-1-2',activity:content.caseText,
     questions:content.questions,answers:attempt.submission??attempt.draft,
     reference:content.answer,
     extra:(vi?'Tự đánh giá: ':'Self-ratings: ')+attempt.ratings.join(', ')+' / 2'
    }}/>
   </Card>}
  </motion.div>
  {phase==='read'&&<section className="li-lesson-step-resources" aria-label={vi?'Minh họa và nguồn':'Illustrations and sources'}>
   <L09Figures locale={appLocale} copy={content}/>
   <details className="li-learning-extra-sources">
    <summary>{vi?'Nguồn & đọc thêm':'Sources & further reading'}</summary>
    <LessonSources id="L09-1-2" locale={appLocale} copy={content}
     sources={lesson09.sources} subject={lesson09.hierarchy.field.title}
     conceptTitle={content.theoryTitle} onSearch={ports.search.openSearch}/>
   </details>
  </section>}
  {phase==='progress'&&<RelatedLessons id="L09-1-2" locale={appLocale}/>} 
  <LessonMentor id="L09-1-2" locale={appLocale}/>
  {phase==='read'&&<Button onClick={()=>go('guided')}>
   {vi?'Tiếp: Thử áp dụng':'Next: Guided example'} →
  </Button>}
 </section>;
}
