import React,{useState} from 'react';
import exact from './l09-exact.generated.json';

export type Locale='vi'|'en';
type Rating=0|1|2|null;
type Attempt={
 locale:Locale;
 draft:[string,string,string,string];
 guidedDraft:string;
 hint:boolean;
 assisted:boolean;
 submitted:boolean;
 submittedAt:string|null;
 submission:[string,string,string,string]|null;
 submissionLocale:Locale|null;
 ratings:[Rating,Rating,Rating,Rating];
 reviewed:boolean;
};
const KEY='step16.l09.react-island.v1'; // Deliberately NOT li.review.L09-1-2.v1.
const first=():Attempt=>({
 locale:'vi',draft:['','','',''],guidedDraft:'',hint:false,assisted:false,
 submitted:false,submittedAt:null,submission:null,submissionLocale:null,
 ratings:[null,null,null,null],reviewed:false
});
function valid(raw:unknown):raw is Attempt {
 if(!raw||typeof raw!=='object')return false;
 const s=raw as Record<string,unknown>;
 return (s.locale==='vi'||s.locale==='en')&&Array.isArray(s.draft)&&
   s.draft.length===4&&s.draft.every(x=>typeof x==='string')&&
   Array.isArray(s.ratings)&&s.ratings.length===4&&
   s.ratings.every(x=>x===null||x===0||x===1||x===2)&&
   typeof s.submitted==='boolean'&&typeof s.reviewed==='boolean'&&
   typeof s.hint==='boolean'&&typeof s.assisted==='boolean';
}
function init():Attempt {
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');return valid(raw)?raw:first();}
 catch{return first();}
}
export function Pilot(){
 const [state,setState]=useState<Attempt>(init);
 const [message,setMessage]=useState('');
 const [storageError,setStorageError]=useState(false);
 const text=exact.langs[state.locale];
 const scored=state.ratings.every(r=>r!==null);
 const total=scored?state.ratings.reduce<number>((n,x)=>n+(x??0),0):null;
 function persist(next:Attempt){
   try{
     const json=JSON.stringify(next);
     localStorage.setItem(KEY,json);
     if(localStorage.getItem(KEY)!==json)throw Error('storage readback');
     setState(next);setMessage('');setStorageError(false);
     return true;
   }catch{
     setStorageError(true);setMessage(text.storageOff);
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
   if(state.locale!==locale)persist({...state,locale});
 }
 const cleanText=(html:string)=>html.replace(/<[^>]+>/g,'');
 return <main className="pilot" lang={state.locale} data-lesson-id="L09-1-2">
   <div className="pilot-head">
     <div><span className="pilot-kicker">DATA SCIENCE · L09-1-2 · RESEARCH ISLAND</span>
       <h1>{text.title}</h1></div>
     <div className="pilot-lang" role="group" aria-label="Language">
       {(['vi','en'] as const).map(l=><button key={l} type="button" aria-pressed={state.locale===l}
          data-locale={l} onClick={()=>changeLocale(l)}>{l.toUpperCase()}</button>)}
     </div>
   </div>
   <p className="pilot-caution">Step16 · local isolated research. Not the public lesson or a new approved design.</p>
   <section className="pilot-surface" aria-labelledby="challenge-title">
     <span className="pilot-kicker">L09-1-2 · V</span>
     <h2 id="challenge-title">{text.challengeTitle}</h2>
     <p data-case-text>{cleanText(text.caseText)}</p>
     <p className="pilot-statement" data-case-claim>{text.caseClaim}</p>
     {text.questions.map((q,i)=><div className="pilot-question" key={i}>
       <label htmlFor={'answer-'+i}>{i+1}. {q}</label>
       <textarea id={'answer-'+i} rows={4} data-answer={i} className="pilot-input"
         disabled={state.submitted} placeholder={text.placeholder} value={state.draft[i]}
         onChange={e=>updateDraft(i,e.target.value)}/>
     </div>)}
     {!state.submitted&&<div className="pilot-actions">
       <button type="button" data-action="hint" className="secondary" onClick={hint}>{text.hintButton}</button>
       {state.assisted&&<span role="status" data-assisted>{text.assisted}</span>}
     </div>}
     {state.hint&&<p className="pilot-statement" data-hint>{cleanText(text.hint)}</p>}
     <p className="pilot-note">{text.saveHint}</p>
     {!state.submitted&&<div className="pilot-actions">
       <button type="button" data-action="submit" onClick={submit}>{text.submit}</button>
       <button type="button" data-action="clear" className="secondary" onClick={clear}>{text.clear}</button>
     </div>}
     {state.submitted&&<div className="pilot-statement" data-submission>
       <strong>{text.answerTitle}</strong><p>{cleanText(text.answer)}</p>
     </div>}
     <p className="pilot-status" role="status" aria-live="polite" data-status>
       {storageError?text.storageOff:message||(state.reviewed?text.reviewDone:state.submitted?text.submitLocked:'')}
     </p>
   </section>
   <section className="pilot-surface" aria-labelledby="rubric-title">
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
       {!state.reviewed&&<button type="button" data-action="finish" onClick={finish}>{text.saveReview}</button>}
       {state.reviewed&&<p data-reviewed>{text.reviewDone}</p>}
     </>}
   </section>
   <p className="pilot-foot">Source file: site/assets/lesson-l09-hifi.js · React/TypeScript candidate only · no cloud/account.</p>
 </main>;
}
