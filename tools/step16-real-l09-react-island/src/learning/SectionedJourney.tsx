import React,{useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {initial} from '../native-bridge';
import type {Attempt,EditorialMethodId,EditorialReviewSnapshot,PastEditorialAttempt} from '../native-bridge';
import type {LearningPorts,SyncState} from './ports';
import {isReleasedLessonId} from './released-lessons';
import {freshLessonAttempt,confirmLessonRestart} from './restart-lesson.js';
import {Button,Card} from '../../../../design-system/react/Components';
import {Field} from '../../../../design-system/react/Controls';
import {Heading,Text,Progress} from '../../../../design-system/react/Atoms';
import {SelfReviewNextStep} from './SelfReviewNextStep';
import {T02ReviewEntry} from './T02ReviewEntry.js';
import {Markdown,inline as formatLessonInline} from './EditorialJourney';
import {LessonBookmark,LessonMentor} from './LessonDetailParity.js';
import './journey.css';
import {StudyBookFolio} from './StudyBookFolio';
import {useDiscoveryLocale,localized,type BilingualCopy} from '../shell/discovery-locale.js';
import {useStepScreen} from './step-screen.js';

type Locale='vi'|'en';
/** Keeps authored emphasis in the actual accessible question label without raw
 * HTML or a separate design-system field variant. */
function FormattedLessonQuestion({index,question,value,disabled,onChange}:{
 index:number;question:string;value:string;disabled:boolean;onChange:(value:string)=>void
}){
 const inputId=React.useId();
 return <div className="li-atom-field li-sectioned-question-field" data-li-atom="field" data-kind="textarea">
  <label htmlFor={inputId}>{index+1}. {formatLessonInline(question)}</label>
  <textarea id={inputId} rows={4} value={value} disabled={disabled}
   onChange={e=>onChange(e.currentTarget.value)}/>
 </div>;
}

type Phase='read'|'guided'|'practice'|'feedback'|'progress';
type Role='goals'|'concept'|'guided'|'methods'|'independent'|'reflection'|'extension';
type Section={
 id:string;role:Role;heading:string;body_md:string;
 model_answer_md?:string|null;model_answer_gate?:string;
 feedback_md?:string|null;feedback_gate?:string;gate?:string;
};
type RubricRow=[string,string,string,string];
type Localized={
 intro_md:string;sections:Section[];
 assessment:{questions:[string,string,string,string];rubricCriteria:RubricRow[];
  modelAnswerGate:string;rubricGate:string};
};
type MentorMoment={
 stage:'opening'|'concept'|'guided'|'independent'|'reflection'|'extension';
 quote_ids:string[];missing_quote_ids:string[];
 vi:{prompt:string;actions:{label:string;reply:string}[]};
 en:{prompt:string;actions:{label:string;reply:string}[]};
};
export type SectionedLesson={
 id:string;version:string;title:Record<Locale,string>;
 hierarchy:{field:{title:string}};
 reviewState:'verified'|'approved';publishState:'review_only';
 rights:{text:'first_party';illustration:string;
  quotations:{policy:'public_domain_original_short_excerpt_with_first_party_gloss'}};
 content:{format:'editorial-sectioned-v1';localized:Record<Locale,Localized>;
  technique:{primary:string;status:string};
  companion:{structuredMoments:MentorMoment[]}};
};
const MIN=12,MAX=4000;
const STAGES=['opening','concept','guided','independent','reflection','extension'] as const;
const METHODS:readonly EditorialMethodId[]=['T03','T04','T06','T07','T09','T10'];
/** Match the five-page reader used by L03-1-2, L09-1-2 and L15-2-2.
 * Optional method practice lives inside Guided instead of becoming a sixth page. */
const PAGES:Phase[]=['read','guided','practice','feedback','progress'];
function isMethod(s:string):s is EditorialMethodId{
 return METHODS.includes(s as EditorialMethodId);
}
function section(c:Localized,role:Role):Section[]{
 return c.sections.filter(x=>x.role===role);
}
function independent(c:Localized):Section{
 const x=section(c,'independent')[0];
 if(!x)throw Error('SECTIONED_INDEPENDENT_MISSING');
 return x;
}
function criteria(c:Localized):RubricRow[]{
 return c.assessment.rubricCriteria;
}
/** Fail closed: a migrated draft never becomes a lesson just by carrying a JSON file.
 * Release registry, invited-user session, academic rights and full two-locale
 * interaction shape must all agree. No direct URL or Notion fallback.
 */
export function validateSectionedLesson(input:unknown,id:string):SectionedLesson{
 if(!input||typeof input!=='object'||Array.isArray(input))
  throw Error('SECTIONED_LESSON_MISSING');
 const l=input as Partial<SectionedLesson>;
 if(l.id!==id||l.publishState!=='review_only'||
  !['verified','approved'].includes(l.reviewState??'')||
  l.rights?.text!=='first_party'||
  l.rights.quotations?.policy!=='public_domain_original_short_excerpt_with_first_party_gloss'||
  !l.version||l.version.length>50||!l.title?.vi||!l.title?.en||
  l.content?.format!=='editorial-sectioned-v1')
  throw Error('SECTIONED_LESSON_NOT_RELEASED');
 const body=l.content.localized;
 const method=l.content.technique?.primary?.replace(/^L2-/,'')??'';
 if(!isMethod(method)||!l.content.technique?.status||
  l.content.technique.status!=='approved')throw Error('SECTIONED_METHOD_NOT_APPROVED');
 for(const loc of ['vi','en'] as const){
  const c=body?.[loc];
  if(!c||!Array.isArray(c.sections)||!c.intro_md?.trim()||
   c.sections.some(s=>!s.id||!s.heading||!s.body_md||
    !['goals','concept','guided','methods','independent','reflection','extension'].includes(s.role))||
   section(c,'independent').length!==1||section(c,'methods').length<1||
   section(c,'methods').some(s=>!s.feedback_md?.trim()||s.feedback_gate!=='AFTER_MEANINGFUL_METHOD_ATTEMPT')||
   section(c,'reflection').length!==1||section(c,'guided').length<1||
   !independent(c).model_answer_md?.trim()||
   independent(c).model_answer_gate!=='AFTER_VALID_INDEPENDENT_SUBMISSION'||
   c.assessment?.modelAnswerGate!=='AFTER_VALID_INDEPENDENT_SUBMISSION'||
   c.assessment.rubricGate!=='AFTER_VALID_INDEPENDENT_SUBMISSION'||
   !Array.isArray(c.assessment.questions)||c.assessment.questions.length!==4||
   c.assessment.questions.some(q=>typeof q!=='string'||!q.trim())||
   !Array.isArray(criteria(c))||criteria(c).length!==4||
   criteria(c).some(row=>!Array.isArray(row)||row.length!==4||
    row.some(x=>typeof x!=='string'||!x.trim()||x.length>1200)))
   throw Error('SECTIONED_LEARNER_ELEMENTS_MISSING');
  if(c.sections.some(s=>s.role==='methods'&&/<b>(?:Phản hồi|Đối chiếu sau|Feedback|After-attempt feedback|EDITORIAL GUIDED FEEDBACK|Chỉ hiện phản hồi)/i.test(s.body_md))||
     c.sections.some(s=>s.role==='guided'&&/<b>(?:ĐÁP ÁN SAU LƯỢT LUYỆN|FEEDBACK AFTER GUIDED ATTEMPT)/i.test(s.body_md)))
   throw Error('SECTIONED_PRE_SUBMIT_PRACTICE_SPOILER');
  // An author-facing solution marker in pre-submit body is a release blocker.
  if(c.sections.filter(s=>s.role!=='reflection').some(s=>
   /<b>\s*(?:ĐÁP ÁN MẪU|MODEL ANSWER|MODEL RESPONSE|REFERENCE SOLUTION|EDITORIAL ANSWER KEY)/i.test(s.body_md)))
   throw Error('SECTIONED_PRE_SUBMIT_ANSWER_LEAK');
 }
 const moments=l.content.companion?.structuredMoments;
 if(!Array.isArray(moments)||moments.length!==6||
  moments.some((m,i)=>m.stage!==STAGES[i]||
   !Array.isArray(m.quote_ids)||m.quote_ids.length<3||m.quote_ids.includes('box-models')||
   (m.missing_quote_ids?.length??0)>0||
   (['vi','en'] as const).some(loc=>!m[loc]?.prompt?.trim()||
    m[loc].actions?.length!==2||
    m[loc].actions.some(a=>!a.label.trim()||!a.reply.trim()||a.reply==='undefined'))))
   throw Error('SECTIONED_MENTOR_NOT_SOURCE_VERIFIED');
 return l as SectionedLesson;
}
function phaseFor(a:Attempt,method:EditorialMethodId):Phase{
 if(a.reviewed)return 'progress';
 if(a.submitted)return 'feedback';
 if(a.draft.some(x=>x.trim()))return 'practice';
 if(a.methodChoice==='skip'||a.methodAttempts?.[method]?.submittedAt)return 'practice';
 if(a.methodChoice||a.methodAttempts?.[method]?.draft)return 'guided';
 if(a.guidedDraft.trim())return 'guided';
 return 'read';
}
export function SectionedJourney({lesson,ports,preview=false}:{lesson:SectionedLesson;ports:LearningPorts;preview?:boolean}){
 const id=lesson.id,method=lesson.content.technique.primary.slice(3) as EditorialMethodId;
 const reduced=useReducedMotion();
 const appLocale=useDiscoveryLocale();
 const [attempt,setAttempt]=useState<Attempt|null>(null);
 const [persisted,setPersisted]=useState<Attempt|null>(null);
 const [phase,setPhase]=useState<Phase>('read');
 useStepScreen(phase,id);
 const [busy,setBusy]=useState(true),[pending,setPending]=useState(0);
 const [reload,setReload]=useState(0);
 const [locked,setLocked]=useState(false),[errorCopy,setError]=useState<BilingualCopy|null>(null);
 const error=errorCopy?localized(appLocale,...errorCopy):'';
 const [sync,setSync]=useState<SyncState>('unavailable');
 const current=useRef<Attempt|null>(null),revision=useRef('');
 const owner=useRef(''),chain=useRef<Promise<void>>(Promise.resolve());
 const failed=useRef(false),mounted=useRef(true),count=useRef(0);
 /** Register the authored six moments with the SAME companion context engine
  * used by the three sample lessons. No duplicate chat state or content. */
 useEffect(()=>{
  const api=(window as Window&{liLessonCompanion?:{
   registerEditorial?:(manifest:{
    schema:number;lesson_id:string;topics:string[];
    moments:Array<MentorMoment&{anchor:string}>
   })=>(()=>void)
  }}).liLessonCompanion;
  if(!api?.registerEditorial)return;
  const vi=lesson.content.localized.vi;
  const anchor=(role:Role)=>'li-sectioned-'+id+'-'+(section(vi,role)[0]?.id||role);
  const anchors:Record<MentorMoment['stage'],string>={
   opening:'li-sectioned-'+id+'-opening',
   concept:anchor('concept'),
   guided:anchor('guided'),
   independent:'li-sectioned-'+id+'-practice',
   reflection:'li-sectioned-'+id+'-feedback',
   extension:'li-sectioned-'+id+'-progress'
  };
  const unregister=api.registerEditorial({
   schema:1,lesson_id:id,topics:[],
   moments:lesson.content.companion.structuredMoments.map(m=>({...m,anchor:anchors[m.stage]}))
  });
  window.dispatchEvent(new Event('li:lesson-phase-changed'));
  return()=>unregister();
 },[id,lesson]);
 useEffect(()=>{
  const onJump=(event:Event)=>{
   const detail=(event as CustomEvent<{lessonId?:string;phase?:string}>).detail;
   if(detail?.lessonId===id&&PAGES.includes(detail.phase as Phase))
    setPhase(detail.phase as Phase);
  };
  window.addEventListener('li:mentor-phase-jump',onJump);
  return()=>window.removeEventListener('li:mentor-phase-jump',onJump);
 },[id]);
 useEffect(()=>{
  if(!busy&&attempt)window.dispatchEvent(new Event('li:lesson-phase-changed'));
 },[phase,busy,attempt?.locale,persisted?.submitted,persisted?.reviewed,appLocale]);
 useEffect(()=>{
  let alive=true;mounted.current=true;
  (async()=>{
   try{
    if(!preview&&!isReleasedLessonId(id))throw Error('LESSON_NOT_RELEASED');
    const auth=await ports.auth.requireInvitedLearner();
    if(!auth?.subjectId)throw Error('INVITED_LEARNER_REQUIRED');
    const saved=await ports.attempts.load({lessonId:id,subjectId:auth.subjectId});
    if(!saved?.revision||!saved.attempt||
     saved.attempt.draft?.length!==4||saved.attempt.ratings?.length!==4)
     throw Error('SECTIONED_ATTEMPT_INVALID');
    if(!alive)return;
    owner.current=auth.subjectId;revision.current=saved.revision;
    current.current=saved.attempt;
    setAttempt(saved.attempt);setPersisted(saved.attempt);
    setPhase(phaseFor(saved.attempt,method));
    setSync(await ports.sync.getStatus({lessonId:id,subjectId:auth.subjectId}).catch(()=>'unavailable' as SyncState));
    setBusy(false);
    try{
     const key='li.sectioned.guide-return.v1';
     const token=JSON.parse(sessionStorage.getItem(key)||'null') as
      {id?:string;at?:number;scrollY?:number;method?:string}|null;
     if(token?.id===id&&(token.method===method||token.method==='T02')&&token.at&&
      Date.now()-token.at<3600000&&Number.isFinite(token.scrollY)){
      setPhase(token.method==='T02'&&saved.attempt.reviewed?'progress':'guided');
      sessionStorage.removeItem(key);
      requestAnimationFrame(()=>window.scrollTo({top:token.scrollY??0}));
     }
    }catch{/* still display the saved lesson */}
   }catch{
    if(alive){setBusy(false);setError(['Không tải được bài học hoặc chưa xác minh được quyền truy cập.','Could not load the lesson or verify access.']);}
   }
  })();
  return()=>{alive=false;mounted.current=false;};
 },[id,method,ports,reload]);
 // The existing account-scoped Dexie/Neon adapter owns background hydration.
 // Never replace a locally pending attempt with an older cloud snapshot.
 useEffect(()=>{
  const hydrate=(event:Event)=>{
   const detail=(event as CustomEvent<{accountId?:string;lessonIds?:string[]}>).detail;
   if(detail?.accountId!==owner.current||!detail.lessonIds?.includes(id)||
    count.current>0||failed.current)return;
   setReload(n=>n+1);
  };
  window.addEventListener('li:lesson-sync-applied',hydrate);
  return()=>window.removeEventListener('li:lesson-sync-applied',hydrate);
 },[id]);
 function persist(next:Attempt):Promise<boolean>{
  if(failed.current||!owner.current)return Promise.resolve(false);
  current.current=next;setAttempt(next);
  count.current++;setPending(count.current);
  const job=chain.current.then(async()=>{
   const result=await ports.attempts.save({lessonId:id,subjectId:owner.current,
    attempt:next,expectedRevision:revision.current});
   revision.current=result.revision;
   if(mounted.current){setPersisted(next);
    setSync(await ports.sync.getStatus({lessonId:id,subjectId:owner.current}).catch(()=>'unavailable' as SyncState));}
  });
  chain.current=job.catch(()=>undefined);
  return job.then(()=>true,()=>{
   failed.current=true;if(mounted.current){setLocked(true);
    setError(['Không lưu được bài. Bản nháp hiện tại chưa xác nhận đã lưu; không ghi đè tiến độ cũ.','Could not save the draft. Previously saved progress was not overwritten.']);}
   return false;
  }).finally(()=>{count.current--;if(mounted.current)setPending(count.current);});
 }
 /** Use the same recoverable save-error affordance as the three exemplar lessons. */
 async function retryFailedSave(){
  if(!failed.current||!owner.current||!current.current)return;
  failed.current=false;setLocked(false);setError(null);
  await persist(current.current);
 }
 function edit(change:(a:Attempt)=>Attempt){
  // Independent fields/buttons disable themselves after submit, but the
  // four rubric ratings MUST remain editable during feedback after submit.
  if(locked||!current.current)return;
  void persist(change(current.current));
 }
 async function submit(){
  const a=current.current;if(!a||locked||pending||a.submitted)return;
  if(a.draft.some(x=>x.trim().length<MIN)){setError(['Cần đủ bốn câu trả lời, mỗi câu ít nhất 12 ký tự.','Answer all four questions with at least 12 characters each.']);return;}
  const local=lesson.content.localized,version=lesson.version;
  const frozen:EditorialReviewSnapshot={
   contentVersion:version,rubricVersion:version+':rubric:0-8',
   modelAnswer:{vi:independent(local.vi).model_answer_md||'',en:independent(local.en).model_answer_md||''},
   questions:{vi:[...local.vi.assessment.questions] as [string,string,string,string],
    en:[...local.en.assessment.questions] as [string,string,string,string]},
   criteria:{vi:local.vi.assessment.rubricCriteria,en:local.en.assessment.rubricCriteria}
  };
  setError(null);
  if(await persist({...a,submission:[...a.draft],submitted:true,
   submittedAt:new Date().toISOString(),submissionLocale:a.locale,
   contentVersion:version,rubricVersion:frozen.rubricVersion,
   reviewSnapshot:frozen,answerRevealed:false,reviewed:false}))
   setPhase('feedback');
 }
 async function methodSubmit(){
  const a=current.current;if(!a||locked||pending||a.submitted)return;
  const prior=a.methodAttempts?.[method];
  if(prior?.submittedAt||!prior||prior.draft.trim().length<MIN){
   setError(['Viết ít nhất 12 ký tự để nộp lượt luyện Thần Chú.','Write at least 12 characters to submit your spell practice.']);return;
  }
  setError(null);
  await persist({...a,methodAttempts:{...a.methodAttempts,
   [method]:{...prior,submission:prior.draft,submittedAt:new Date().toISOString()}}});
 }
 async function finish(){
  const a=current.current;if(!a||locked||pending||!persisted?.answerRevealed||
   a.ratings.some(x=>x===null))return;
  setError(null);
  if(await persist({...a,reviewed:true,reviewedAt:new Date().toISOString()}))setPhase('progress');
 }
 async function restartLesson(){
  const a=current.current;
  if(!a||locked||pending>0||!confirmLessonRestart(id,a.locale))return;
  if(await persist(freshLessonAttempt(a)))setPhase('read');
 }
 async function newRound(){
  const a=persisted;if(!a?.reviewed||!a.submission||!a.submittedAt||!a.submissionLocale||
   a.ratings.some(x=>x===null)||locked||pending)return;
  const previous:PastEditorialAttempt={
   submission:[...a.submission] as [string,string,string,string],submissionLocale:a.submissionLocale,
   submittedAt:a.submittedAt,ratings:[...a.ratings] as PastEditorialAttempt['ratings'],
   reviewedAt:a.reviewedAt??null,answerRevealed:true,
   contentVersion:a.contentVersion||lesson.version,
   rubricVersion:a.rubricVersion||lesson.version+':rubric:0-8',
   attemptNumber:a.attemptNumber||1,guidedDraft:a.guidedDraft,hint:a.hint,
   methodChoice:a.methodChoice??null,methodAttempts:a.methodAttempts,
   questionPrompts:a.reviewSnapshot?.questions
  };
  const next:Attempt={...initial(),locale:a.locale,
   attemptNumber:previous.attemptNumber+1,attemptHistory:[...(a.attemptHistory||[]),previous],
   answerRevealed:false,contentVersion:lesson.version};
  if(JSON.stringify(next).length>55000){setError(['Lịch sử bài học vượt giới hạn lưu.','Lesson history exceeds the storage limit.']);return;}
  if(await persist(next))setPhase('read');
 }
 function openGuide(requestMethod:string=method,practice=false){
  if(locked||pending)return;
  const app=window as Window&{
   liMethods?:{open?:(methodId:string,practice?:boolean,lessonId?:string)=>boolean};
   LiSpellPractice?:{setLessonContext?:(lessonId:string)=>boolean}
  };
  if(!app.liMethods?.open){setError(['Sổ Tay Thần Chú chưa khả dụng.','The Spellbook is unavailable.']);return;}
  try{
   const returnScrollY=window.scrollY; // navigation resets page scroll synchronously
   // Published routes have a canonical context-aware opener. Personal staging
   // manuscripts use the existing invited-only setLessonContext bridge.
   const opened=isReleasedLessonId(id)
    ?app.liMethods.open(requestMethod,practice,id)
    :app.liMethods.open(requestMethod,practice)===true&&
     app.LiSpellPractice?.setLessonContext?.(id)===true;
   if(!opened){
    setError(['Chưa gắn được Thần Chú với bài học; bản nháp vẫn được giữ.','Could not link the spell to the lesson. Your draft was kept.']);
    return;
   }
   // Only successful navigation gets a return token; unavailable sessionStorage
   // must not stop a legitimate exercise.
   try{
    sessionStorage.setItem('li.sectioned.guide-return.v1',
     JSON.stringify({id,method:requestMethod,at:Date.now(),scrollY:returnScrollY}));
   }catch{/* Lesson return still works without scroll restoration. */}
  }catch{setError(['Chưa mở được Thần Chú; bản nháp vẫn được giữ.','Could not open the spell. Your draft was kept.']);}
 }
 // App language comes only from Settings. Preserve the lesson's saved
 // attempt locale through its existing account-scoped write path.
 useEffect(()=>{
  if(busy||!attempt||attempt.locale===appLocale||locked||pending>0)return;
  void persist({...attempt,locale:appLocale});
 },[appLocale,attempt?.locale,busy,locked,pending]);
 if(busy)return <section role="status" className="li-learning-journey" aria-busy="true">{localized(appLocale,'Đang xác minh quyền học…','Verifying lesson access…')}</section>;
 if(!attempt||!persisted)return <section role="alert" className="li-learning-journey">
  <Text>{error||localized(appLocale,'Không tải được bài.','Could not load the lesson.')}</Text>
 </section>;
 const locale=appLocale,vi=locale==='vi',c=lesson.content.localized[locale];
 const names:Record<Phase,string>=vi?
  {read:'Đọc bài',guided:'Thử áp dụng',practice:'Làm bài',feedback:'Đối chiếu',progress:'Tiến độ'}:
  {read:'Learn',guided:'Guided',practice:'Practice',feedback:'Feedback',progress:'Progress'};
 const review=persisted.reviewSnapshot;
 const rubric=review?.criteria[locale]??criteria(c);
 const modelAnswer=review?.modelAnswer[locale]??independent(c).model_answer_md??'';
 const questions=review?.questions[locale]??c.assessment.questions;
 const showAnswer=!!persisted.submitted&&!!persisted.answerRevealed;
 const conflict=!!persisted.submitted&&!!persisted.contentVersion&&
  persisted.contentVersion!==lesson.version&&!review;
 const methodData=attempt.methodAttempts?.[method];
 const savedMethod=persisted.methodAttempts?.[method];
 const answersSaved=persisted.draft.filter(x=>x.trim().length>=MIN).length;
 const percent=persisted.reviewed?100:persisted.submitted?75:
  Math.round(answersSaved/4*50);
 const history=persisted.attemptHistory||[];
 const pageIndex=PAGES.indexOf(phase);
 const setAnswer=(i:number,v:string)=>{
  if(v.length>MAX)return;
  edit(a=>{const draft=[...a.draft] as Attempt['draft'];draft[i]=v;return {...a,draft};});
 };
 const block=(role:Role)=><>
  {section(c,role).map(x=><section key={x.id} id={'li-sectioned-'+id+'-'+x.id}>
   <Heading level={['goals','concept','guided'].includes(role)?2:3}
    role={['goals','concept','guided'].includes(role)?'titleLarge':'titleMedium'}>{x.heading}</Heading>
   <Markdown md={x.body_md}/>
  </section>)}
 </>;
 return <section className="li-learning-journey" lang={locale}
  data-li-react-journey={id} data-li-sectioned-journey={id}
  data-li-editorial-journey={id} data-li-lesson-phase={phase}
  data-li-lesson-submitted={persisted.submitted?'true':'false'}
  data-li-lesson-reviewed={persisted.reviewed?'true':'false'}>
  <header className="li-learning-header">
   <div>
    <Heading level={1} role="headline">{lesson.title[locale]}</Heading>
    <Text role="caption">{lesson.hierarchy.field.title} · {id}</Text>
    {preview&&<Text role="support">{vi?
     'Học cá nhân · tiến độ theo tài khoản · nội dung đang hoàn thiện':
     'Personal study · account-synced progress · content in progress'}</Text>}
   </div>
   <div className="li-learning-header-actions">
    <LessonBookmark id={id} locale={locale}/>
    <details className="li-lesson-header-more">
     <summary>{vi?'Tùy chọn':'Options'}</summary>
     <Button variant="secondary" disabled={pending>0||locked} onClick={()=>void restartLesson()}>
      {vi?'Học lại từ đầu':'Restart lesson'}
     </Button>
    </details>
   </div>
  </header>
  <StudyBookFolio phase={phase} steps={PAGES} locale={locale}
   onPrevious={pageIndex>0?()=>setPhase(PAGES[pageIndex-1]):undefined}
   onNext={pageIndex<PAGES.length-1?()=>setPhase(PAGES[pageIndex+1]):undefined}/>
  <aside className="li-learning-rail" aria-label={vi?'Điều hướng và tiến độ học':'Learning navigation and status'}>
   <div className="li-learning-save">
    <Progress label={vi?'Tiến độ lượt học':'Lesson attempt progress'} value={percent}/>
    {(history.length>0||attempt.assisted)&&<details className="li-learning-attempt-meta">
     <summary>{vi?'Chi tiết lượt học':'Attempt details'}</summary>
     {attempt.assisted&&<Text role="support">{vi?'Đã dùng gợi ý':'Hint used'}</Text>}
     {history.length>0&&<details className="li-learning-attempt-history">
      <summary>{vi?'Lịch sử lượt học':'Saved attempt history'} · {history.length}</summary>
      <ol>{history.map((entry,index)=><li key={index}>
       <Text role="support">{vi?'Lượt':'Attempt'} {entry.attemptNumber} ·
        {' '}{entry.submittedAt} · {entry.ratings.reduce<number>((total,score)=>total+(score??0),0)}/8</Text>
      </li>)}</ol>
     </details>}
    </details>}
   </div>
  </aside>
  {sync==='conflict'&&<p className="li-learning-error" role="alert">{vi?
   'Tiến độ bài này đang có xung đột đồng bộ. Kiểm tra bản lưu trước khi học tiếp.':
   'This lesson has a sync conflict. Review the saved version before continuing.'}</p>}
  {error&&!locked&&<p className="li-learning-error" role="alert">{error}</p>}
  {locked&&<div className="li-learning-recovery" role="alert">
   <Text role="support">{error|| (vi?'Chưa lưu được thay đổi.':'Could not save changes.')}</Text>
   <Button disabled={pending>0} onClick={()=>void retryFailedSave()}>
    {vi?'Thử lưu lại':'Retry saving'}
   </Button>
  </div>}
  <motion.div key={phase} initial={reduced?false:{opacity:0,x:12,rotateY:-1}}
   animate={{opacity:1,x:0,rotateY:0}} transition={reduced?{duration:0}:{duration:0.2}}
   className="li-learning-current">
  
  <Card variant="flat-study" className="li-study-book-page" aria-label={names[phase]}>
   {phase==='read'&&<>
    <div id={'li-sectioned-'+id+'-opening'}><Markdown md={c.intro_md}/></div>
    {block('goals')}{block('concept')}
    <Button onClick={()=>setPhase('guided')}>{vi?'Tiếp: Thử áp dụng':'Next: Guided example'} →</Button>
   </>}
   {phase==='guided'&&<>
    {block('guided')}
    <Field kind="textarea" rows={4} label={vi?'Tự giải thích':'Explain in your words'}
     disabled={locked||attempt.submitted} value={attempt.guidedDraft}
     onChange={e=>{if(e.currentTarget.value.length<=MAX)edit(a=>({...a,guidedDraft:e.currentTarget.value}));}}/>
    {section(c,'guided').filter(x=>!!x.feedback_md).map(x=><div key={x.id} className="li-learning-hint">
     {persisted.guidedDraft.trim().length>=MIN
      ? <Markdown md={x.feedback_md||''}/>
      : <Text role="support">{vi?'Viết và lưu ít nhất 12 ký tự giải thích để xem phản hồi.':'Write and save at least 12 characters to unlock guided feedback.'}</Text>}
    </div>)}
    <details className="li-learning-extras li-sectioned-method-details"
     key={'method-'+id}>
     <summary>{vi?'Thử Thần Chú':'Try a study method'} · {method} {vi?'(tùy chọn)':'(optional)'}</summary>
     <div className="li-sectioned-method-content">
      <Text role="support">{vi?'Phương pháp luyện thêm, không bắt buộc trước bài độc lập.':
       'Optional method practice, not required for the independent exercise.'}</Text>
      {block('methods')}
      <Button variant="secondary" onClick={()=>openGuide()}>
       {vi?'Xem Sổ Tay Thần Chú':'Open Spellbook'} · {method}
      </Button>
      <Field kind="textarea" rows={4} label={vi?'Giải thích lượt luyện':'Explain method practice'}
       value={methodData?.draft||''} disabled={locked||attempt.submitted||!!savedMethod?.submittedAt}
       onChange={e=>{const value=e.currentTarget.value;if(value.length<=MAX)edit(a=>({
        ...a,methodChoice:method,methodAttempts:{...a.methodAttempts,
         [method]:{draft:value,submission:null,submittedAt:null}}
       }));}}/>
      {!savedMethod?.submittedAt?<Button disabled={locked||pending>0} onClick={()=>void methodSubmit()}>
       {vi?'Nộp lượt luyện':'Submit method practice'}</Button>:<>
       <Text role="support">{vi?'Đã lưu lượt luyện':'Method attempt saved'}</Text>
       {section(c,'methods').filter(x=>!!x.feedback_md).map(x=><div key={x.id} className="li-learning-hint">
        <Markdown md={x.feedback_md||''}/></div>)}
      </>}
     </div>
    </details>
    <Button onClick={()=>setPhase('practice')}>
     {vi?'Tiếp: Làm bài':'Next: Practice'} →
    </Button>
   </>}
   {phase==='practice'&&<>
    <Heading level={2} role="titleLarge">{names.practice}</Heading>
    <Markdown md={independent(c).body_md.split(/^[1-4]\.\s*/m)[0]}/>
    {c.assessment.questions.map((question,i)=><FormattedLessonQuestion
     key={i} index={i} question={question}
     value={attempt.draft[i]} disabled={locked||attempt.submitted}
     onChange={v=>setAnswer(i,v)}/>)}
    {!persisted.submitted?<Button disabled={locked||pending>0} onClick={()=>void submit()}>
     {vi?'Nộp bốn câu':'Submit four answers'}</Button>:
     <Button onClick={()=>setPhase('feedback')}>{vi?'Tiếp: Đối chiếu':'Next: Feedback'} →</Button>}
   </>}
   {phase==='feedback'&&!persisted.submitted&&<>
    <Heading level={2} role="titleLarge">{names.feedback}</Heading>
    <Text role="support">{vi?
     'Ngươi chưa nộp bài. Vẫn có thể xem các phần khác; đáp án và tự đánh giá chỉ mở sau khi nộp.':
     'Not submitted yet. You can browse all pages; model answers and self-review unlock after submission.'}</Text>
    <Button variant="secondary" onClick={()=>setPhase('practice')}>
     {vi?'Quay lại tự luyện tập':'Return to practice'}
    </Button>
   </>}
   {phase==='feedback'&&persisted.submitted&&<>
    <Heading level={2} role="titleLarge">{names.feedback}</Heading>
    <ol>{questions.map((q,i)=><li key={i}><Markdown md={q}/>
     <p>{(persisted.submission??persisted.draft)[i]}</p></li>)}</ol>
    {!showAnswer||conflict?<div>
     <Text role="support">{vi?'Đã lưu bài. Đáp án mẫu đóng đến khi tự mở.':'Saved. Reveal the model answer explicitly.'}</Text>
     {conflict&&<Text role="support">{vi?'Bài đã dùng phiên bản cũ không có rubric đóng băng.':'Old attempt lacks a frozen rubric.'}</Text>}
     <Button disabled={locked||pending>0||conflict} onClick={()=>void persist({...attempt,answerRevealed:true})}>
      {vi?'Mở đáp án và rubric':'Reveal answer and rubric'}</Button>
    </div>:<>
     <Markdown md={modelAnswer}/>
     {block('reflection')}
     {rubric.map((row,i)=><div key={i} className="li-learning-rating">
      <label htmlFor={'li-sectioned-rating-'+id+'-'+i}>{row[0]}</label>
      <select id={'li-sectioned-rating-'+id+'-'+i}
       value={attempt.ratings[i]??''} disabled={locked||attempt.reviewed}
       onChange={e=>{const n=e.currentTarget.value;edit(a=>{
        const ratings=[...a.ratings] as Attempt['ratings'];
        ratings[i]=n===''?null:Number(n) as 0|1|2;return {...a,ratings};
       });}}>
       <option value="">{vi?'Chưa chấm':'Not rated'}</option>
       {[0,1,2].map(v=><option key={v} value={v}>{v} · {row[v+1]}</option>)}
      </select>
     </div>)}
     <SelfReviewNextStep rubricItems={rubric} ratings={attempt.ratings}
      locale={locale} onReviewTheory={()=>setPhase('read')}/>
     <Button disabled={pending>0||locked||attempt.ratings.some(x=>x===null)}
      onClick={()=>void finish()}>{vi?'Lưu tự đánh giá':'Save review'}</Button>
    </>}
   </>}
   {phase==='progress'&&!persisted.reviewed&&<>
    <Heading level={2} role="titleLarge">{names.progress}</Heading>
    <Text role="support">{vi?
     'Chưa hoàn thành lượt tự đánh giá. Ngươi vẫn xem được trang này; tiến độ hoàn thành chỉ ghi nhận sau khi nộp bài và lưu tự đánh giá.':
     'Self-review is not complete. This page is still accessible; completion is recorded after submission and saved self-review.'}</Text>
    <Button variant="secondary" onClick={()=>setPhase('practice')}>
     {vi?'Quay lại tự luyện tập':'Return to practice'}
    </Button>
   </>}
   {phase==='progress'&&persisted.reviewed&&<>
    <Heading level={2} role="titleLarge">{names.progress}</Heading>
    <Text>{vi?'Điểm tự chấm':'Self-rating'}: {persisted.ratings.reduce<number>((n,x)=>n+(x??0),0)} / 8</Text>
    <Text role="support">{vi?'K5 chưa đo: bài này chưa chứng minh ghi nhớ dài hạn.':'K5 not measured: long-term retention is not established.'}</Text>
    {block('extension')}
    <SelfReviewNextStep rubricItems={rubric} ratings={persisted.ratings}
     locale={locale} onReviewTheory={()=>setPhase('read')}/>
    <T02ReviewEntry lessonId={id} vi={vi} disabled={pending>0||locked}
     onOpen={()=>openGuide('T02',true)}/>
    <Button disabled={pending>0||locked} onClick={()=>void newRound()}>
     {vi?'Lượt mới · giữ lịch sử':'New round · preserve history'}</Button>
   </>}
  </Card>
  </motion.div>
  <LessonMentor id={id} locale={locale}/>
 </section>;
}
