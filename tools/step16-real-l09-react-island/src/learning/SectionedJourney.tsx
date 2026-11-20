import React,{useEffect,useRef,useState} from 'react';
import {initial} from '../native-bridge';
import type {Attempt,EditorialMethodId,EditorialReviewSnapshot,PastEditorialAttempt} from '../native-bridge';
import type {LearningPorts,SyncState} from './ports';
import {isReleasedLessonId} from './released-lessons';
import {freshLessonAttempt,confirmLessonRestart} from './restart-lesson.js';
import {Button,Card} from '../../../../design-system/react/Components';
import {Field} from '../../../../design-system/react/Controls';
import {Heading,Text} from '../../../../design-system/react/Atoms';
import {Markdown} from './EditorialJourney';
import './journey.css';

type Locale='vi'|'en';
type Phase='read'|'guided'|'methods'|'practice'|'feedback'|'progress';
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
const PAGES:Phase[]=['read','guided','methods','practice','feedback','progress'];
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
 if(a.methodChoice||a.methodAttempts?.[method]?.draft)return 'methods';
 if(a.guidedDraft.trim())return 'guided';
 return 'read';
}
type Quote={id:string;original:string;translation:string;interpretation:string;comment:string;lang:string;meta:string;url:string};
export function SectionedJourney({lesson,ports,preview=false}:{lesson:SectionedLesson;ports:LearningPorts;preview?:boolean}){
 const id=lesson.id,method=lesson.content.technique.primary.slice(3) as EditorialMethodId;
 const [attempt,setAttempt]=useState<Attempt|null>(null);
 const [persisted,setPersisted]=useState<Attempt|null>(null);
 const [phase,setPhase]=useState<Phase>('read');
 const [busy,setBusy]=useState(true),[pending,setPending]=useState(0);
 const [locked,setLocked]=useState(false),[error,setError]=useState('');
 const [sync,setSync]=useState<SyncState>('unavailable');
 const current=useRef<Attempt|null>(null),revision=useRef('');
 const owner=useRef(''),chain=useRef<Promise<void>>(Promise.resolve());
 const failed=useRef(false),mounted=useRef(true),count=useRef(0);
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
     if(token?.id===id&&token.method===method&&token.at&&
      Date.now()-token.at<3600000&&Number.isFinite(token.scrollY)){
      setPhase('methods');sessionStorage.removeItem(key);
      requestAnimationFrame(()=>window.scrollTo({top:token.scrollY??0}));
     }
    }catch{/* still display the saved lesson */}
   }catch(e){
    if(alive){setBusy(false);setError(e instanceof Error?e.message:'LEARNING_LOAD_FAILED');}
   }
  })();
  return()=>{alive=false;mounted.current=false;};
 },[id,method,ports]);
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
    setError('Không lưu được bài. Bản nháp hiện tại chưa xác nhận đã lưu; không ghi đè tiến độ cũ.');}
   return false;
  }).finally(()=>{count.current--;if(mounted.current)setPending(count.current);});
 }
 function edit(change:(a:Attempt)=>Attempt){
  // Independent fields/buttons disable themselves after submit, but the
  // four rubric ratings MUST remain editable during feedback after submit.
  if(locked||!current.current)return;
  void persist(change(current.current));
 }
 async function submit(){
  const a=current.current;if(!a||locked||pending||a.submitted)return;
  if(a.draft.some(x=>x.trim().length<MIN)){setError('Cần đủ bốn câu trả lời, mỗi câu ít nhất 12 ký tự.');return;}
  const local=lesson.content.localized,version=lesson.version;
  const frozen:EditorialReviewSnapshot={
   contentVersion:version,rubricVersion:version+':rubric:0-8',
   modelAnswer:{vi:independent(local.vi).model_answer_md||'',en:independent(local.en).model_answer_md||''},
   questions:{vi:[...local.vi.assessment.questions] as [string,string,string,string],
    en:[...local.en.assessment.questions] as [string,string,string,string]},
   criteria:{vi:local.vi.assessment.rubricCriteria,en:local.en.assessment.rubricCriteria}
  };
  setError('');
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
   setError('Viết ít nhất 12 ký tự để nộp lượt luyện Thần Chú.');return;
  }
  setError('');
  await persist({...a,methodAttempts:{...a.methodAttempts,
   [method]:{...prior,submission:prior.draft,submittedAt:new Date().toISOString()}}});
 }
 async function finish(){
  const a=current.current;if(!a||locked||pending||!persisted?.answerRevealed||
   a.ratings.some(x=>x===null))return;
  setError('');
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
  if(JSON.stringify(next).length>55000){setError('Lịch sử bài học vượt giới hạn lưu.');return;}
  if(await persist(next))setPhase('read');
 }
 function mentor(stage:MentorMoment['stage']){
  if((stage==='reflection'&&!persisted?.submitted)||
   (stage==='extension'&&!persisted?.reviewed))return null;
  const moment=lesson.content.companion.structuredMoments.find(m=>m.stage===stage);
  if(!moment)return null;
  return <aside className="li-editorial-mentor">
   <Button id={'li-sectioned-mentor-'+id+'-'+stage} variant="secondary"
    onClick={()=>{
     const locale=attempt?.locale||'vi';
     const app=window as Window&{liBuddyReactMounted?:boolean;
      liQuoteEngine?:{lookup?:(id:string,locale:Locale)=>Quote|null}};
     const quotes=moment.quote_ids.map(key=>app.liQuoteEngine?.lookup?.(key,locale)||null);
     if(!app.liBuddyReactMounted||quotes.length<3||
      quotes.some(q=>!q?.url?.startsWith('https://'))){
      setError('Lão Lý hoặc nguồn trích dẫn chưa khả dụng.');return;
     }
     window.dispatchEvent(new CustomEvent('li:buddy-open',{detail:{
      text:moment[locale].prompt,avatar:'./assets/laoly-neutral.png',
      quote:quotes[0],triggerId:'li-sectioned-mentor-'+id+'-'+stage,
      labels:moment[locale].actions.map(a=>a.label),
      editorial:{actions:moment[locale].actions.map(a=>({label:a.label,reply:a.reply})),quotes}
     }}));
    }}>{attempt?.locale==='en'?'Ask Lão Lý':'Hỏi Lão Lý'}</Button>
  </aside>;
 }
 function openGuide(){
  if(locked||pending)return;
  const app=window as Window&{liMethods?:{open?:(id:string,practice?:boolean)=>void}};
  if(!app.liMethods?.open){setError('Sổ Tay Thần Chú chưa khả dụng.');return;}
  try{
   sessionStorage.setItem('li.sectioned.guide-return.v1',
    JSON.stringify({id,method,at:Date.now(),scrollY:window.scrollY}));
   app.liMethods.open(method,false);
  }catch{setError('Chưa mở được Thần Chú; bản nháp vẫn được giữ.');}
 }
 if(busy)return <section role="status" className="li-learning-journey" aria-busy="true">Đang xác minh quyền học…</section>;
 if(!attempt||!persisted)return <section role="alert" className="li-learning-journey">
  <Text>{error||'Không tải được bài.'}</Text>
  <Button onClick={ports.navigation.openCatalog}>Về Tàng Thư</Button>
 </section>;
 const locale=attempt.locale,vi=locale==='vi',c=lesson.content.localized[locale];
 const names:Record<Phase,string>=vi?
  {read:'Đọc bài',guided:'Thử áp dụng',methods:'Thần Chú',practice:'Làm bài',feedback:'Đối chiếu',progress:'Tiến độ'}:
  {read:'Learn',guided:'Guided',methods:'Spells',practice:'Practice',feedback:'Feedback',progress:'Progress'};
 const review=persisted.reviewSnapshot;
 const rubric=review?.criteria[locale]??criteria(c);
 const modelAnswer=review?.modelAnswer[locale]??independent(c).model_answer_md??'';
 const questions=review?.questions[locale]??c.assessment.questions;
 const showAnswer=!!persisted.submitted&&!!persisted.answerRevealed;
 const conflict=!!persisted.submitted&&!!persisted.contentVersion&&
  persisted.contentVersion!==lesson.version&&!review;
 const methodData=attempt.methodAttempts?.[method];
 const savedMethod=persisted.methodAttempts?.[method];
 const setAnswer=(i:number,v:string)=>{
  if(v.length>MAX)return;
  edit(a=>{const draft=[...a.draft] as Attempt['draft'];draft[i]=v;return {...a,draft};});
 };
 const block=(role:Role)=><>
  {section(c,role).map(x=><section key={x.id} id={'li-sectioned-'+id+'-'+x.id}>
   <Heading level={3} role="titleMedium">{x.heading}</Heading>
   <Markdown md={x.body_md}/>
  </section>)}
 </>;
 return <section className="li-learning-journey" lang={locale}
  data-li-react-journey={id} data-li-sectioned-journey={id}>
  <header className="li-learning-header">
   <div><Text role="caption">{lesson.hierarchy.field.title} · {id}</Text>
    <Heading level={1} role="headline">{lesson.title[locale]}</Heading>
     {preview&&<Text role="support">Bản học thử cá nhân · lưu riêng trên thiết bị · chưa qua rà nội dung toàn bộ</Text>}</div>
   <div className="li-learning-header-actions">
    <Button variant="secondary" disabled={pending>0||locked} onClick={()=>void restartLesson()}>
     {attempt.locale==='vi'?'Học lại từ đầu':'Restart lesson'}
    </Button>
    <Button variant="secondary" onClick={ports.navigation.openCatalog}>Tàng Thư</Button>
   </div>
  </header>
  <div className="li-learning-toolbar" role="group" aria-label="Language">
   {(['vi','en'] as const).map(l=><Button key={l} disabled={pending>0||locked}
    variant={locale===l?'primary':'secondary'} aria-pressed={locale===l}
    onClick={()=>{if(locale!==l)void persist({...attempt,locale:l});}}>{l.toUpperCase()}</Button>)}
   <Text role="support">{locked?'Lưu lỗi':pending?'Đang lưu…':
    sync==='synced'?'Đã đồng bộ':sync==='queued'?'Chờ đồng bộ':
     preview&&sync==='on-device'?'Đã lưu trên máy này':'Đã lưu / đang kiểm tra'}</Text>
  </div>
  {error&&<p role="alert">{error}</p>}
  <nav className="li-learning-stepper" aria-label={vi?'Các bước học':'Learning steps'}>
   {PAGES.map((p,i)=><Button key={p} variant={p===phase?'primary':'secondary'}
    disabled={(i>=4&&!persisted.submitted)||(i===5&&!persisted.reviewed)}
    onClick={()=>setPhase(p)}>{names[p]}</Button>)}
  </nav>
  <Card variant="flat-study">
   {phase==='read'&&<>
    <Markdown md={c.intro_md}/>{mentor('opening')}
    {block('goals')}{block('concept')}{mentor('concept')}
    <Button onClick={()=>setPhase('guided')}>{names.guided}</Button>
   </>}
   {phase==='guided'&&<>
    <Heading level={2} role="titleLarge">{names.guided}</Heading>
    {block('guided')}{mentor('guided')}
    {section(c,'guided').filter(x=>!!x.feedback_md).map(x=><div key={x.id} className="li-learning-hint">
     {persisted.guidedDraft.trim().length>=MIN
      ? <Markdown md={x.feedback_md||''}/>
      : <Text role="support">{vi?'Viết và lưu ít nhất 12 ký tự giải thích để xem phản hồi.':'Write and save at least 12 characters to unlock guided feedback.'}</Text>}
    </div>)}
    <Field kind="textarea" rows={4} label={vi?'Tự giải thích':'Explain in your words'}
     disabled={locked||attempt.submitted} value={attempt.guidedDraft}
     onChange={e=>{if(e.currentTarget.value.length<=MAX)edit(a=>({...a,guidedDraft:e.currentTarget.value}));}}/>
    <Button onClick={()=>setPhase('methods')}>{names.methods}</Button>
   </>}
   {phase==='methods'&&<>
    <Heading level={2} role="titleLarge">{names.methods} · {method}</Heading>
    <Text role="support">{vi?'Phương pháp này tự chọn, không phải điểm bài độc lập.':'Optional method practice, separate from the independent task.'}</Text>
    {block('methods')}
    <Button variant="secondary" onClick={openGuide}>{vi?'Xem Sổ Tay Thần Chú':'Open Spellbook'} · {method}</Button>
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
    <Button variant="secondary" disabled={locked||pending>0}
     onClick={()=>{if(!attempt.methodChoice)void persist({...attempt,methodChoice:'skip'});setPhase('practice');}}>
     {vi?'Tiếp tục bài độc lập':'Continue to independent task'}
    </Button>
   </>}
   {phase==='practice'&&<>
    <Heading level={2} role="titleLarge">{names.practice}</Heading>
    <Markdown md={independent(c).body_md.split(/^[1-4]\.\s*/m)[0]}/>
    {mentor('independent')}
    {c.assessment.questions.map((question,i)=><Field key={i} kind="textarea" rows={4}
     label={String(i+1)+'. '+question} disabled={locked||attempt.submitted}
     value={attempt.draft[i]} onChange={e=>setAnswer(i,e.currentTarget.value)}/>)}
    {!persisted.submitted?<Button disabled={locked||pending>0} onClick={()=>void submit()}>
     {vi?'Nộp bốn câu':'Submit four answers'}</Button>:
     <Button onClick={()=>setPhase('feedback')}>{names.feedback}</Button>}
   </>}
   {phase==='feedback'&&persisted.submitted&&<>
    <Heading level={2} role="titleLarge">{names.feedback}</Heading>
    <ol>{questions.map((q,i)=><li key={i}><Text role="support">{q}</Text>
     <p>{(persisted.submission??persisted.draft)[i]}</p></li>)}</ol>
    {!showAnswer||conflict?<div>
     <Text role="support">{vi?'Đã lưu bài. Đáp án mẫu đóng đến khi tự mở.':'Saved. Reveal the model answer explicitly.'}</Text>
     {conflict&&<Text role="support">{vi?'Bài đã dùng phiên bản cũ không có rubric đóng băng.':'Old attempt lacks a frozen rubric.'}</Text>}
     <Button disabled={locked||pending>0||conflict} onClick={()=>void persist({...attempt,answerRevealed:true})}>
      {vi?'Mở đáp án và rubric':'Reveal answer and rubric'}</Button>
    </div>:<>
     <Markdown md={modelAnswer}/>
     {block('reflection')}{mentor('reflection')}
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
     <Button disabled={pending>0||locked||attempt.ratings.some(x=>x===null)}
      onClick={()=>void finish()}>{vi?'Lưu tự đánh giá':'Save review'}</Button>
    </>}
   </>}
   {phase==='progress'&&persisted.reviewed&&<>
    <Heading level={2} role="titleLarge">{names.progress}</Heading>
    <Text>{vi?'Điểm tự chấm':'Self-rating'}: {persisted.ratings.reduce<number>((n,x)=>n+(x??0),0)} / 8</Text>
    <Text role="support">{vi?'K5 chưa đo: bài này chưa chứng minh ghi nhớ dài hạn.':'K5 not measured: long-term retention is not established.'}</Text>
    {block('extension')}{mentor('extension')}
    <Button disabled={pending>0||locked} onClick={()=>void newRound()}>
     {vi?'Lượt mới · giữ lịch sử':'New round · preserve history'}</Button>
   </>}
  </Card>
 </section>;
}
