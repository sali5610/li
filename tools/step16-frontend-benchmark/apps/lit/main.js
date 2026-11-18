import '../../../../site/assets/design-tokens.css';
import '../../shared/shared.css';
import {LitElement,html} from 'lit';
import {createStore,TASKS,TEXT} from '../../shared/core.js';

const store=createStore();
class BenchLesson extends LitElement{
 static properties={state:{state:true}};
 constructor(){super();this.state=store.getState();}
 createRenderRoot(){return this;}
 connectedCallback(){super.connectedCallback();this.unsub=store.subscribe(s=>{this.state=s;});}
 disconnectedCallback(){this.unsub?.();super.disconnectedCallback();}
 send(type,value){store.dispatch({type,value});}
 render(){
  const s=this.state,t=TEXT[s.locale],q=TASKS[s.index];
  return html`<main class="bench-card">
   <header class="bench-top"><strong data-role="brand">${t.brand}</strong>
    <button type="button" data-action="locale" data-role="locale" @click=${()=>this.send('locale')}>${t.locale}</button>
   </header>
   <div data-role="progress" aria-live="polite">${t.progress} ${s.index+1} / ${TASKS.length} · ${s.attempts.length}</div>
   <h1 data-role="title">${q.title[s.locale]}</h1>
   <p data-role="question">${q.question[s.locale]}</p>
   <div class="bench-options" role="group" aria-label="Multiple-choice answers">
    ${q.options[s.locale].map((label,i)=>html`<button type="button" data-option="${i}"
      aria-pressed="${s.selected===i}" ?disabled=${s.submitted}
      @click=${()=>this.send('option',i)}>${label}</button>`)}
   </div>
   <p data-role="hint" class="bench-hint" ?hidden=${!s.assisted}>${s.assisted?q.hint[s.locale]:''}</p>
   <p class="bench-feedback" data-role="feedback" aria-live="polite">${s.feedback||(s.submitted?t.done:'')}</p>
   <div class="bench-actions">
    <button type="button" data-action="hint" ?disabled=${s.submitted} @click=${()=>this.send('hint')}>${t.hint}</button>
    <button type="button" data-action="submit" ?disabled=${s.submitted} @click=${()=>this.send('submit')}>${t.submit}</button>
    <button type="button" data-action="next" ?disabled=${!s.submitted} @click=${()=>this.send('next')}>${t.next}</button>
    <button type="button" data-action="reset" @click=${()=>this.send('reset')}>${t.reset}</button>
   </div>
  </main>`;
 }
}
customElements.define('step16-bench-lesson',BenchLesson);
document.getElementById('root').append(document.createElement('step16-bench-lesson'));
window.Step16Bench={ready:true,variant:'lit',getState:store.getState,dispatch:store.dispatch};
