import React,{useState,useRef,useEffect} from 'react';
import type {ButtonHTMLAttributes,HTMLAttributes,ReactNode} from 'react';
import exact from './l09-exact.generated.json';
import {L09StorageBridge,BridgeError,LOCALE_KEY,NATIVE_KEY,SITE_FIXTURE_KEY,initial} from './native-bridge';
import type {Locale,Attempt,Rating} from './native-bridge';
import {ActionButton,Surface,StatusMessage} from './ui/Primitives';
import {ActionGroup,Button,Card,TextAreaField} from './ui/Shared';

/** VC-G2-01 D1/D2/D3: research-only opt-in. Default L09 and bridge are untouched. */
type StudyActionProps=ButtonHTMLAttributes<HTMLButtonElement>&{kind?:'primary'|'secondary';vcG2:boolean};
function StudyAction({vcG2,kind='primary',...rest}:StudyActionProps){
 return vcG2?<Button variant={kind} {...rest}/>:<ActionButton kind={kind} {...rest}/>;
}
/** L09 exercise and rubric are secondary study panels, NOT raised editorial cards.
 * Preserve the earlier no-shadow role as an explicit D2 flat variant. */
type StudySurfaceProps=HTMLAttributes<HTMLElement>&{vcG2:boolean;elevation?:'raised'|'flat';children:ReactNode};
function StudySurface({vcG2,elevation='flat',...rest}:StudySurfaceProps){
 return vcG2?<Card elevation={elevation} {...rest}/>:<Surface {...rest}/>;
}
const bridge=new L09StorageBridge(window.localStorage,window.location);
export function Pilot({visualContractPilot=false}:{visualContractPilot?:boolean}={}){
 const [loaded]=useState(()=>{
   try{return bridge.read();}
   catch{return {state:initial(),raw:null,invalid:true};}
 });
 const [state,setState]=useState<Attempt>(loaded.state);
 const baseline=useRef<string|null>(loaded.raw);
 const [conflict,setConflict]=useState(loaded.invalid);
 const [message,setMessage]=useState('');
 const [storageError,setStorageError]=useState(false);
 const conflictText=state.locale==='vi'
  ?'Dữ liệu bài học đã thay đổi hoặc không hợp lệ. Nạp lại bản mới trước khi ghi tiếp.'
  :'Lesson data changed in another tab or is invalid. Reload the latest state before saving.';
 useEffect(()=>{
   const onStorage=(event:StorageEvent)=>{
     if(event.key===bridge.key&&event.newValue!==baseline.current){
       setConflict(true);
       setMessage('');
     }
     if(bridge.nativeFixture&&event.key===LOCALE_KEY&&(event.newValue==='vi'||event.newValue==='en')){
       setState(prev=>({...prev,locale:event.newValue as Locale}));
     }
   };
   const onLocale=(event:Event)=>{
     const value=(event as CustomEvent<{locale?:string}>).detail?.locale;
     if(value==='vi'||value==='en')setState(prev=>({...prev,locale:value}));
   };
   const onFixtureRollback=()=>{
     if(bridge.key===SITE_FIXTURE_KEY){
       setConflict(true);
       setMessage('');
     }
   };
   window.addEventListener('storage',onStorage);
   window.addEventListener('li:localechange',onLocale);
   window.addEventListener('li:l09-fixture-rolled-back',onFixtureRollback);
   return()=>{
     window.removeEventListener('storage',onStorage);
     window.removeEventListener('li:localechange',onLocale);
     window.removeEventListener('li:l09-fixture-rolled-back',onFixtureRollback);
   };
 },[]);
 function refreshFromStorage(){
   try{
     const current=bridge.read();
     if(current.invalid){setConflict(true);setMessage(conflictText);return;}
     baseline.current=current.raw;
     setState(current.state);setConflict(false);setMessage('');setStorageError(false);
   }catch{
     setConflict(true);setStorageError(true);setMessage('');
   }
 }
 const text=exact.langs[state.locale];
 const scored=state.ratings.every(r=>r!==null);
 const total=scored?state.ratings.reduce<number>((n,x)=>n+(x??0),0):null;
 function persist(next:Attempt){
   if(conflict){setMessage(conflictText);return false;}
   try{
     const priorSubmitted=state.submitted;
     const json=bridge.write(next,baseline.current);
     baseline.current=json;
     setState(next);setMessage('');setStorageError(false);
     // Native L09 emits this in its own window after a stored submission.
     // In this isolated pilot the event stays inside the research iframe.
     if(!priorSubmitted&&next.submitted&&bridge.key===NATIVE_KEY){
       // The legacy bridge harness expects this, but a synthetic in-site
       // fixture MUST NOT enter real activity, visits or mastery feeds.
       window.dispatchEvent(new CustomEvent('li:lesson-submitted',{detail:{lessonId:'L09-1-2'}}));
     }
     if(bridge.key===SITE_FIXTURE_KEY){
       window.dispatchEvent(new CustomEvent('li:l09-fixture-updated',{detail:{lessonId:'L09-1-2'}}));
     }
     return true;
   }catch(error){
     if(error instanceof BridgeError&&(error.reason==='changed'||error.reason==='invalid')){
       setConflict(true);setMessage(conflictText);
     }else{
       setStorageError(true);setMessage(text.storageOff);
     }
     return false;
   }
 }
 function updateDraft(i:number,value:string){
   if(state.submitted)return;
   const draft=[...state.draft] as Attempt['draft'];draft[i]=value;
   persist({...state,draft});
 }
 function hint(){if(!state.submitted)persist({...state,hint:true,assisted:true});}
 function submit(){
   if(state.submitted)return;
   if(state.draft.some(x=>x.trim().length<12)){setMessage(text.submitNeed);return;}
   const next:Attempt={...state,submitted:true,submittedAt:new Date().toISOString(),
     submission:[...state.draft] as Attempt['submission'],submissionLocale:state.locale};
   if(persist(next))setMessage(text.submitSuccess);
 }
 function clear(){
   if(state.submitted||!window.confirm(text.resetConfirm))return;
   persist({...state,draft:['','','',''],hint:false,assisted:false});
 }
 function setRating(i:number,value:string){
   if(!state.submitted||state.reviewed)return;
   const ratings=[...state.ratings] as Attempt['ratings'];
   ratings[i]=value===''?null:Number(value) as Rating;
   persist({...state,ratings});
 }
 function finish(){
   if(!state.submitted||state.reviewed)return;
   if(state.ratings.some(x=>x===null)){setMessage(text.reviewNeed);return;}
   if(persist({...state,reviewed:true}))setMessage(text.reviewDone);
 }
 function changeLocale(locale:Locale){
   if(state.locale===locale)return;
   if(!persist({...state,locale}))return;
   if(bridge.nativeFixture){
     try{
       const owner=(window as Window&{liLanguage?:{set?:(next:Locale)=>void}}).liLanguage;
       if(typeof owner?.set==='function')owner.set(locale);
       else bridge.setGlobalLocale(locale);
       window.dispatchEvent(new CustomEvent('li:localechange',{detail:{locale}}));
     }catch{setStorageError(true);setMessage(text.storageOff);}
   }
 }
 const cleanText=(html:string)=>html.replace(/<[^>]+>/g,'');
 return <div className="pilot" data-vc-g2={visualContractPilot?'approved-research':undefined} lang={state.locale} data-lesson-id="L09-1-2" data-storage-key={bridge.key} data-bridge-mode={bridge.nativeFixture?"localhost-fixture":"isolated"}>
   <div className="pilot-head">
     <div><span className="pilot-kicker">DATA SCIENCE · L09-1-2 · RESEARCH ISLAND</span>
       <h1>{text.title}</h1></div>
     <div className="pilot-lang" role="group" aria-label="Language">
       {(['vi','en'] as const).map(l=><button key={l} type="button" aria-pressed={state.locale===l}
          data-locale={l} onClick={()=>changeLocale(l)}>{l.toUpperCase()}</button>)}
     </div>
   </div>
   <p className="pilot-caution">Step16 · {bridge.nativeFixture?'LOCALHOST NATIVE-KEY COMPATIBILITY TEST ONLY':'local isolated research'}. Not the public lesson or a new approved design.</p>
   {conflict&&<div className="pilot-statement" role="alert" data-conflict>
     <p>{conflictText}</p>
     <button type="button" className="secondary" data-action="reload-state" onClick={refreshFromStorage}>
       {state.locale==='vi'?'Nạp dữ liệu mới':'Reload current data'}
     </button>
   </div>}
   <StudySurface vcG2={visualContractPilot} aria-labelledby="challenge-title">
     <span className="pilot-kicker">L09-1-2 · V</span>
     <h2 id="challenge-title">{text.challengeTitle}</h2>
     <p data-case-text>{cleanText(text.caseText)}</p>
     <p className="pilot-statement" data-case-claim>{text.caseClaim}</p>
     {text.questions.map((q,i)=><div className="pilot-question" key={i}>
       {visualContractPilot?<TextAreaField id={'answer-'+i} purpose="answer"
         label={i+1+'. '+q} rows={4} data-answer={i} className="pilot-input"
         disabled={state.submitted} placeholder={text.placeholder} value={state.draft[i]}
         onChange={e=>updateDraft(i,e.target.value)}/>:<>
       <label htmlFor={'answer-'+i}>{i+1}. {q}</label>
       <textarea id={'answer-'+i} rows={4} data-answer={i} className="pilot-input"
         disabled={state.submitted} placeholder={text.placeholder} value={state.draft[i]}
         onChange={e=>updateDraft(i,e.target.value)}/></>}
     </div>)}
     {!state.submitted&&<ActionGroup className="pilot-actions">
       <StudyAction vcG2={visualContractPilot} type="button" data-action="hint" kind="secondary" onClick={hint}>{text.hintButton}</StudyAction>
       {state.assisted&&<span role="status" data-assisted>{text.assisted}</span>}
     </ActionGroup>}
     {state.hint&&<p className="pilot-statement" data-hint>{cleanText(text.hint)}</p>}
     <p className="pilot-note">{text.saveHint}</p>
     {!state.submitted&&<ActionGroup className="pilot-actions">
       <StudyAction vcG2={visualContractPilot} type="button" data-action="submit" onClick={submit}>{text.submit}</StudyAction>
       <StudyAction vcG2={visualContractPilot} type="button" data-action="clear" kind="secondary" onClick={clear}>{text.clear}</StudyAction>
     </ActionGroup>}
     {state.submitted&&<div className="pilot-statement" data-submission>
       <strong>{text.answerTitle}</strong><p>{cleanText(text.answer)}</p>
     </div>}
     <StatusMessage className="pilot-status" data-status>
       {storageError?text.storageOff:message||(state.reviewed?text.reviewDone:state.submitted?text.submitLocked:'')}
     </StatusMessage>
   </StudySurface>
   <StudySurface vcG2={visualContractPilot} aria-labelledby="rubric-title">
     <span className="pilot-kicker">L09-1-2 · VI</span>
     <h2 id="rubric-title">{text.rubricTitle}</h2>
     {!state.submitted?<p data-rubric-locked>{text.rubricBefore}</p>:<>
       <div className="pilot-rubric" data-rubric>
         {text.rubricItems.map(([title,description],i)=><div key={i} className="pilot-rubric-row">
           <label htmlFor={'rating-'+i}><strong>{title}</strong><span>{description}</span></label>
           <select id={'rating-'+i} data-rating={i} value={state.ratings[i]??''}
              disabled={state.reviewed} onChange={e=>setRating(i,e.target.value)}>
             {text.scoreOptions.map((opt,j)=><option key={j} value={j===0?'':String(j-1)}>{opt}</option>)}
           </select>
         </div>)}
       </div>
       <p className="pilot-score" data-score aria-live="polite">{text.scoreLabel}: {total===null?'—':total} / 8</p>
       {!state.reviewed&&<StudyAction vcG2={visualContractPilot} type="button" data-action="finish" onClick={finish}>{text.saveReview}</StudyAction>}
       {state.reviewed&&<p data-reviewed>{text.reviewDone}</p>}
     </>}
   </StudySurface>
   <p className="pilot-foot">Source file: site/assets/lesson-l09-hifi.js · React/TypeScript candidate only · no cloud/account.</p>
 </div>;
}
