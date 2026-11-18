import '../../../../site/assets/design-tokens.css';
import '../../shared/shared.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {createStore,TASKS,TEXT} from '../../shared/core.js';

const store=createStore();
function BenchApp(){
 const [s,setState]=React.useState(store.getState());
 React.useEffect(()=>store.subscribe(setState),[]);
 const t=TEXT[s.locale],q=TASKS[s.index];
 const send=(type,value)=>store.dispatch({type,value});
 return <main className="bench-card">
  <header className="bench-top"><strong data-role="brand">{t.brand}</strong>
    <button type="button" data-action="locale" data-role="locale" onClick={()=>send('locale')}>{t.locale}</button>
  </header>
  <div data-role="progress" aria-live="polite">{t.progress} {s.index+1} / {TASKS.length} · {s.attempts.length}</div>
  <h1 data-role="title">{q.title[s.locale]}</h1>
  <p data-role="question">{q.question[s.locale]}</p>
  <div className="bench-options" role="group" aria-label="Multiple-choice answers">
   {q.options[s.locale].map((label,i)=><button type="button" key={i} data-option={i}
      aria-pressed={s.selected===i} disabled={s.submitted}
      onClick={()=>send('option',i)}>{label}</button>)}
  </div>
  {s.assisted?<p data-role="hint" className="bench-hint">{q.hint[s.locale]}</p>
    :<p data-role="hint" className="bench-hint" hidden/>}
  <p className="bench-feedback" data-role="feedback" aria-live="polite">{s.feedback||(s.submitted?t.done:'')}</p>
  <div className="bench-actions">
   <button type="button" data-action="hint" disabled={s.submitted} onClick={()=>send('hint')}>{t.hint}</button>
   <button type="button" data-action="submit" disabled={s.submitted} onClick={()=>send('submit')}>{t.submit}</button>
   <button type="button" data-action="next" disabled={!s.submitted} onClick={()=>send('next')}>{t.next}</button>
   <button type="button" data-action="reset" onClick={()=>send('reset')}>{t.reset}</button>
  </div>
 </main>;
}
createRoot(document.getElementById('root')).render(<BenchApp/>);
window.Step16Bench={ready:true,variant:'react',getState:store.getState,dispatch:store.dispatch};
