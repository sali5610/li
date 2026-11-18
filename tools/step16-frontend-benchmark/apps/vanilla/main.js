import '../../../../site/assets/design-tokens.css';
import '../../shared/shared.css';
import {createStore,TASKS,TEXT} from '../../shared/core.js';

const root=document.getElementById('root');
const store=createStore();
root.innerHTML=`
<main class="bench-card">
  <header class="bench-top"><strong data-role="brand"></strong><button type="button" data-action="locale" data-role="locale"></button></header>
  <div data-role="progress" aria-live="polite"></div>
  <h1 data-role="title"></h1>
  <p data-role="question"></p>
  <div class="bench-options" role="group" aria-label="Multiple-choice answers">
    <button type="button" data-option="0" aria-pressed="false"></button>
    <button type="button" data-option="1" aria-pressed="false"></button>
    <button type="button" data-option="2" aria-pressed="false"></button>
  </div>
  <p data-role="hint" class="bench-hint" hidden></p>
  <p class="bench-feedback" data-role="feedback" aria-live="polite"></p>
  <div class="bench-actions">
    <button type="button" data-action="hint"></button>
    <button type="button" data-action="submit"></button>
    <button type="button" data-action="next"></button>
    <button type="button" data-action="reset"></button>
  </div>
</main>`;
const get=(role)=>root.querySelector('[data-role="'+role+'"]');
const action=(a)=>root.querySelector('[data-action="'+a+'"]');
const options=[...root.querySelectorAll('[data-option]')];
function render(s){
 const t=TEXT[s.locale],q=TASKS[s.index];
 get('brand').textContent=t.brand;
 get('locale').textContent=t.locale;
 get('progress').textContent=t.progress+' '+(s.index+1)+' / '+TASKS.length+' · '+s.attempts.length;
 get('title').textContent=q.title[s.locale];
 get('question').textContent=q.question[s.locale];
 for(let i=0;i<3;i++){
  const b=options[i];b.textContent=q.options[s.locale][i];
  b.setAttribute('aria-pressed',String(s.selected===i));
  b.disabled=s.submitted;
 }
 get('hint').textContent=q.hint[s.locale];
 get('hint').hidden=!s.assisted;
 get('feedback').textContent=s.feedback||(s.submitted?t.done:'');
 action('hint').textContent=t.hint;
 action('hint').disabled=s.submitted;
 action('submit').textContent=t.submit;
 action('submit').disabled=s.submitted;
 action('next').textContent=t.next;
 action('next').disabled=!s.submitted;
 action('reset').textContent=t.reset;
}
root.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(!button||button.disabled)return;
 const option=button.getAttribute('data-option');
 if(option!==null)store.dispatch({type:'option',value:Number(option)});
 else if(button.dataset.action)store.dispatch({type:button.dataset.action});
});
store.subscribe(render);render(store.getState());
window.Step16Bench={ready:true,variant:'vanilla',getState:store.getState,dispatch:store.dispatch};
