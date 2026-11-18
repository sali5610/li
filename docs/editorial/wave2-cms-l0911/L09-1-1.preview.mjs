/* li. L09-1-1 isolated UI experiment; intentionally outside site/, not for deployment. */
import Pilot from './L09-1-1.state.offline.mjs';
const el=(id)=>document.getElementById(id);
const root=el('page-lessonL0911'),main=el('lesson-main'),nav=el('lesson-nav');
const status=el('save-status'),error=el('error-status'),mentor=el('mentor-content');
const dialog=el('spellbook-dialog');
const SECTIONS=[['l0911-hook','opening'],['l0911-goals','goals'],['l0911-concept','concept'],['l0911-variables','variables'],['l0911-guided','guided'],['l0911-method','method'],['l0911-challenge','independent'],['l0911-reflection','reflection'],['l0911-extension','extension']];
const LABEL={vi:{opening:'Khởi đầu',goals:'Mục tiêu',concept:'Tổng thể & mẫu',variables:'Loại biến',guided:'Ví dụ',method:'Thần Chú · Luyện',independent:'Bài độc lập',reflection:'Đối chiếu',extension:'Đọc sâu',submit:'Nộp bài độc lập',reveal:'Xem đáp án',retry:'Làm bài mới',incomplete:'Tôi muốn nộp bản chưa hoàn chỉnh',answer:'Đáp án tham khảo',rubric:'Tự đánh giá 0–8',mentor:'Lão Lý',practice:'Nộp lượt luyện',hint:'Xem gợi ý',guide:'Mở Thần Chú',save:'Lưu nội bộ',locale:'EN'},en:{opening:'Opening',goals:'Goals',concept:'Population & sample',variables:'Variable types',guided:'Worked example',method:'Spellbook · Practice',independent:'Independent challenge',reflection:'Review',extension:'Read further',submit:'Submit independent work',reveal:'Reveal model answer',retry:'Start a new attempt',incomplete:'Submit as incomplete (not graded)',answer:'Reference answer',rubric:'Self-review 0–8',mentor:'Lão Lý',practice:'Submit practice',hint:'Show a hint',guide:'Open Spellbook',save:'Local save',locale:'VI'}};
const TYPE_CHOICES=[['','—'],['nominal','Nominal'],['ordinal','Ordinal'],['discrete','Discrete'],['continuous','Continuous']];
let bundle=null,state=Pilot.createState('vi'),methodDrafts={T06:{A:'',B:'',C:'',D:'',reasoning:''},T07:{premise:'',claim:'',missingAssumption:''}};
let previousFocus=null,storageOk=true;
function announce(message){status.textContent=message;}
function showError(message){error.hidden=false;error.textContent=message;}
function clearError(){error.hidden=true;error.textContent='';}
function save(){try{localStorage.setItem(Pilot.KEY,JSON.stringify(state));storageOk=true;}catch(e){storageOk=false;state.storageAvailable=false;announce(state.locale==='vi'?'Không lưu được: tiến độ chỉ ở bộ nhớ trang hiện tại.':'Storage unavailable: progress survives only in this page.');}}
function mutate(fn,{rerender=true,focus=null}={}){try{clearError();state=fn(state);save();if(rerender)render(focus);}catch(e){showError(e.message||String(e));}}
function node(tag,attrs={},text){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='className')e.className=v;else if(k==='textContent')e.textContent=v;else if(k==='hidden')e.hidden=!!v;else e.setAttribute(k,String(v));}if(text!==undefined)e.textContent=text;return e;}
function escaped(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function htmlInline(s){let z=escaped(s);
  // Original author inline markup: exactly these non-interactive tags, not arbitrary HTML.
  for(const t of ['b','i','em','strong','code','u']){z=z.replaceAll('&lt;'+t+'&gt;','<'+t+'>').replaceAll('&lt;/'+t+'&gt;','</'+t+'>');}
  z=z.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  z=z.replace(/\*([^*]+)\*/g,'<em>$1</em>');
  // URL and link label are escaped above; only allow exact https:// destinations.
  z=z.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,(_,label,url)=>{
    const safe=url.replaceAll('&quot;','').replaceAll('&#39;','');
    return '<a href="'+safe+'" target="_blank" rel="noopener noreferrer">'+label+'</a>';
  });
  z=z.replaceAll('&lt;br&gt;','<br>').replaceAll('&lt;br/&gt;','<br>');
  return z;
}
function fillRich(target,source){target.replaceChildren();const lines=String(source||'').split('\n');let i=0;
  while(i<lines.length){const l=lines[i].trim();if(!l){i++;continue;}
    if(l.startsWith('|')&&i+1<lines.length&&/^\|?[\s|:\-]+\|?$/.test(lines[i+1].trim())){
      const table=node('table');const head=node('thead'),tr=node('tr');
      lines[i].split('|').slice(1,-1).forEach(cell=>{let th=node('th');th.innerHTML=htmlInline(cell.trim());tr.append(th)});head.append(tr);table.append(head);i+=2;
      const tbody=node('tbody');while(i<lines.length&&lines[i].trim().startsWith('|')){const r=node('tr');lines[i].split('|').slice(1,-1).forEach(cell=>{let td=node('td');td.innerHTML=htmlInline(cell.trim());r.append(td)});tbody.append(r);i++;}table.append(tbody);const wrap=node('div',{className:'table-scroll'});wrap.append(table);target.append(wrap);continue;
    }
    const h=l.match(/^(#{2,5})\s+(.*)$/);if(h){const lvl=Math.min(5,h[1].length+1),e=node('h'+lvl);e.innerHTML=htmlInline(h[2]);target.append(e);i++;continue;}
    if(/^(-|\*|\d+\.)\s+/.test(l)){
      const ordered=/^\d+\./.test(l),list=node(ordered?'ol':'ul');while(i<lines.length&&(/^(-|\*)\s+/.test(lines[i].trim())||/^\d+\.\s+/.test(lines[i].trim()))){const li=node('li');li.innerHTML=htmlInline(lines[i].trim().replace(/^(-|\*|\d+\.)\s+/,''));list.append(li);i++;}target.append(list);continue;
    }
    const p=node('p');p.innerHTML=htmlInline(l);target.append(p);i++;
  }
}
function stripTopHeading(md){return String(md||'').replace(/^###\s+[^\n]+\n+/, '');}
function richSection(id,title,markdown,{hook=false}={}){const s=node('section',{id,className:'lesson-section'+(hook?' hook-section':''),tabindex:'-1'});if(hook){const label=node('p',{className:'section-label'},state.locale==='vi'?'Bài học · Suy luận thống kê':'Lesson · Statistical reasoning');s.append(label);}else{s.append(node('h2',{},title));}
  const content=node('div');fillRich(content,hook?markdown:stripTopHeading(markdown));if(hook){const first=content.querySelector('p');if(first){const h=node('h1');h.innerHTML=first.innerHTML;first.replaceWith(h);}}s.append(content);return s;}
function goTo(id){if(id==='l0911-reflection'&&!state.independent.submitted){showError(state.locale==='vi'?'Hãy nộp bài độc lập trước khi vào đối chiếu.':'Submit independent work before review.');return;}mutate(s=>Pilot.setSection(s,id),{focus:id});}
function navBuild(){const txt=LABEL[state.locale];nav.replaceChildren(node('h2',{},state.locale==='vi'?'Hành trình':'Learning path'));
  SECTIONS.forEach(([id,key])=>{if(id==='l0911-reflection'&&!state.independent.submitted)return;const b=node('button',{type:'button','data-go':id,'aria-current':state.section===id?'location':'false'},txt[key]);b.addEventListener('click',()=>goTo(id));nav.append(b);});nav.setAttribute('aria-label',state.locale==='vi'?'Mục lục bài học':'Lesson contents');}
function button(label,callback,{primary=false,id,disabled=false}={}){const b=node('button',{type:'button',className:primary?'primary':'',...(id?{id}:{})});b.textContent=label;b.disabled=disabled;b.addEventListener('click',callback);return b;}
function paragraph(parent,text,cls){const p=node('p',cls?{className:cls}:{},text);parent.append(p);return p;}
function openSpellbook(){previousFocus=document.activeElement;mutate(s=>Pilot.goToSpellbook(s),{rerender:false});const l=state.locale;el('spellbook-title').textContent=l==='vi'?'Thần Chú · T06':'Spellbook · T06';el('spellbook-description').textContent=l==='vi'?'So sánh từng cột theo ý nghĩa đo, không chỉ theo ký tự hiển thị.':'Classify each variable by what it measures, not its visible digits.';dialog.showModal();el('spellbook-close').focus();}
function closeSpellbook(){if(dialog.open)dialog.close();}
function methodArea(localeKey,view){const l=state.locale,txt=LABEL[l],block=node('section',{id:'l0911-method',className:'lesson-section',tabindex:'-1'});block.append(node('h2',{},txt.method));
  for(const kind of ['T06','T07']){
    const manifest=bundle.locales[l].technique_applications[kind],existing=state.methods[kind];block.append(node('h3',{},kind+(kind==='T06'?' · Compare–Contrast':' · Premise Checking')));
    const c=node('div');fillRich(c,stripTopHeading(manifest.prompt_md));block.append(c);
    if(kind==='T06')block.append(button(txt.guide,openSpellbook,{id:'open-spellbook'}));
    if(existing.attempted){const feedback=node('div',{className:'feedback',id:'feedback-'+kind,tabindex:'-1'});fillRich(feedback,view.practice[kind].feedback);block.append(feedback);continue;}
    const form=node('div',{className:'method-form','data-kind':kind});
    if(kind==='T06'){
      const grid=node('div',{className:'method-grid'});for(const key of ['A','B','C','D']){const label=node('label',{for:'method-'+kind+'-'+key},key);const sel=node('select',{id:'method-'+kind+'-'+key,'data-method-input':key,'data-method-kind':kind});for(const [value,name] of TYPE_CHOICES){const opt=node('option',{value},name);if(value===methodDrafts.T06[key])opt.selected=true;sel.append(opt);}const group=node('div');group.append(label,sel);grid.append(group);}form.append(grid);
      form.append(node('label',{for:'method-reasoning'},l==='vi'?'Giải thích dấu hiệu phân biệt':'Explain the discriminating clues'));const ta=node('textarea',{id:'method-reasoning',rows:'4','data-method-input':'reasoning','data-method-kind':kind});ta.value=methodDrafts.T06.reasoning;form.append(ta);
    }else{for(const [key,labelText] of [['premise',l==='vi'?'Tiền đề quan sát':'Observed premise'],['claim',l==='vi'?'Kết luận bị suy rộng':'Overgeneralized claim'],['missingAssumption',l==='vi'?'Giả định còn thiếu':'Missing assumption']]){form.append(node('label',{for:'method-'+key},labelText));const ta=node('textarea',{id:'method-'+key,rows:'3','data-method-input':key,'data-method-kind':kind});ta.value=methodDrafts.T07[key];form.append(ta);}}
    const actions=node('div',{className:'button-row'});
    actions.append(button(txt.practice+' '+kind,()=>submitMethod(kind),{primary:true,id:'submit-'+kind}));
    actions.append(button(txt.hint,()=>{mutate(s=>Pilot.useMethodHint(s,kind),{rerender:false});paragraph(form,l==='vi'?'Hãy nêu dấu hiệu phân biệt và điều chưa được quan sát, đừng đoán đáp án.':'Explain the discriminating evidence and what has not been observed.','help-text');},{id:'hint-'+kind}));
    // Guide button is intentionally outside the conditional form: usable even after method submission.
    form.append(actions);block.append(form);
  }
  block.addEventListener('input',event=>{const inp=event.target;if(inp.dataset.methodInput){methodDrafts[inp.dataset.methodKind][inp.dataset.methodInput]=inp.value;}});
  return block;
}
function submitMethod(kind){const d=methodDrafts[kind];const e=kind==='T06'?{choices:{A:d.A,B:d.B,C:d.C,D:d.D},reasoning:d.reasoning}:{...d};mutate(s=>Pilot.submitMethod(s,kind,e),{focus:'feedback-'+kind});if(state.methods[kind].attempted)announce(state.locale==='vi'?'Đã lưu lượt luyện '+kind+'.':'Saved '+kind+' practice.');}
function challengeArea(view){const l=state.locale,txt=LABEL[l],section=richSection('l0911-challenge',txt.independent,bundle.locales[l].independent.prompt_md);
  const form=node('div',{className:'question-list'});for(let i=0;i<4;i++){const id='answer-'+i;form.append(node('label',{for:id},(l==='vi'?'Câu ':'Question ')+(i+1)));const ta=node('textarea',{id,'data-answer-index':i,rows:'4',placeholder:l==='vi'?'Viết lập luận của mày ở đây…':'Write your reasoning here…'});ta.value=state.independent.draft[i];ta.disabled=state.independent.submitted;form.append(ta);}
  form.addEventListener('input',event=>{const t=event.target;if(t.dataset.answerIndex!==undefined&&t.dataset.answerIndex!==null){const i=Number(t.dataset.answerIndex);mutate(s=>Pilot.setDraft(s,i,t.value),{rerender:false});}});
  const actions=node('div',{className:'button-row'});
  if(!state.independent.submitted){const incompleteLabel=node('label',{for:'allow-incomplete'});const box=node('input',{id:'allow-incomplete',type:'checkbox'});incompleteLabel.append(box,document.createTextNode(' '+txt.incomplete));form.append(incompleteLabel);actions.append(button(txt.submit,()=>{
     const allowIncomplete=!!el('allow-incomplete')?.checked;
     mutate(s=>Pilot.setSection(Pilot.submitIndependent(s,{allowIncomplete,submittedAt:new Date().toISOString()}),'l0911-reflection'),{focus:'l0911-reflection'});
     if(state.independent.submitted)announce(l==='vi'?'Đã nộp bài. Có thể xem đáp án và tự chấm.':'Submission saved. Model answer and rubric are now available.');
   },{id:'submit-independent',primary:true}));
  }else{paragraph(form,l==='vi'?(state.independent.incomplete?'Đã nộp chưa hoàn chỉnh — không chấm tự động.':'Bài đã nộp — câu trả lời đã khóa.'):(state.independent.incomplete?'Submitted as incomplete; no automatic grade.':'Submitted; answers are frozen.'),'help-text');}
  form.append(actions);section.append(form);return section;
}
function reflectionArea(view){const l=state.locale,txt=LABEL[l],s=node('section',{id:'l0911-reflection',className:'lesson-section',tabindex:'-1'});
  if(!state.independent.submitted){s.hidden=true;return s;}
  s.append(node('h2',{},txt.reflection));s.append(node('p',{id:'review-announcement',tabindex:'-1'},l==='vi'?'Bài đã nộp. Đáp án chỉ hiện khi mày chủ động mở.':'Submission received. The answer appears only when requested.'));
  if(!state.independent.answerRevealed)s.append(button(txt.reveal,()=>mutate(x=>Pilot.revealAnswer(x),{focus:'model-answer'}),{id:'reveal-answer',primary:true}));
  if(view.independent.answer){const a=node('div',{className:'feedback',id:'model-answer',tabindex:'-1'});a.append(node('h3',{},txt.answer));fillRich(a,view.independent.answer);s.append(a);}
  s.append(node('h3',{},txt.rubric));const rubric=node('div');fillRich(rubric,stripTopHeading(view.independent.rubric));s.append(rubric);
  const grid=node('div',{className:'rubric-grid'});for(let i=0;i<4;i++){const name=(l==='vi'?'Tiêu chí ':'Criterion ')+(i+1);const wrap=node('div');wrap.append(node('label',{for:'rating-'+i},name));const sel=node('select',{id:'rating-'+i,'data-rating':i});const options=[['',l==='vi'?'Chưa chọn':'Not rated'],[0,'0'],[1,'1'],[2,'2']];for(const [val,labelText] of options){const opt=node('option',{value:val},labelText);if(state.selfReview.ratings[i]===val)opt.selected=true;sel.append(opt);}wrap.append(sel);grid.append(wrap);}s.append(grid);
  grid.addEventListener('change',event=>{const x=event.target;if(x.dataset.rating!==undefined){const score=x.value;if(score==='')return;mutate(a=>Pilot.scoreSelf(a,Number(x.dataset.rating),Number(score)),{rerender:false});announce(l==='vi'?'Đã lưu đánh giá cá nhân.':'Self-rating saved.');}});
  s.append(button(txt.retry,()=>mutate(x=>Pilot.startNewAttempt(x),{focus:'l0911-hook'}),{id:'retry-independent'}));return s;
}
function mentorBuild(){const l=state.locale;mentor.replaceChildren();const map={"l0911-hook":"opening","l0911-goals":"opening","l0911-concept":"concept","l0911-variables":"concept","l0911-guided":"guided","l0911-method":"guided","l0911-challenge":"independent","l0911-reflection":"reflection","l0911-extension":"extension"};const stage=map[state.section]||'opening';const moments=Pilot.getView(bundle,state).mentor;const m=moments.find(x=>x.stage===stage)||moments.find(x=>x.stage==='independent');if(!m)return;
  const paragraphEl=node('div',{className:'mentor-prompt'});fillRich(paragraphEl,m.prompt);mentor.append(paragraphEl);
  for(const [i,action] of m.actions.entries()){const btn=button(action.action_label,()=>{for(const p of mentor.querySelectorAll('.mentor-reply'))p.remove();const reply=node('div',{className:'mentor-reply',role:'status'});fillRich(reply,action.response_md);btn.insertAdjacentElement('afterend',reply);},{id:'mentor-action-'+i});btn.classList.add('mentor-choice');mentor.append(btn);}
}
function extensionArea(){const l=state.locale,section=node('section',{id:'l0911-extension',className:'lesson-section',tabindex:'-1'});section.append(node('h2',{},LABEL[l].extension));const lines=[['OpenStax §1.1 — Key terms','https://openstax.org/books/introductory-statistics-2e/pages/1-1-definitions-of-statistics-probability-and-key-terms'],['OpenStax §1.2 — Sampling and variables','https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling'],['NIST — Populations and Sampling','https://www.itl.nist.gov/div898/handbook/ppc/section1/ppc134.htm']];const list=node('ul');for(const [name,url] of lines){const li=node('li');const a=node('a',{href:url,target:'_blank',rel:'noopener noreferrer'},name);li.append(a);list.append(li);}section.append(list);paragraph(section,l==='vi'?'Câu tự nhớ (không có đáp án): phân biệt population với sample; vì sao ID không phải đo lường; mẫu tự nguyện thiếu điều kiện nào để suy rộng?':'Recall without answers: population vs sample; why numeric IDs are labels; what volunteer samples lack for population inference?');return section;}
function render(focus){if(!bundle)return;const l=state.locale,txt=LABEL[l];root.setAttribute('lang',l);document.documentElement.lang=l;el('language-switch').textContent=txt.locale;el('language-switch').setAttribute('aria-label',l==='vi'?'Switch to English':'Chuyển sang tiếng Việt');
  navBuild();const a=bundle.locales[l];const frag=document.createDocumentFragment();frag.append(richSection('l0911-hook',txt.opening,a.hook.md,{hook:true}));frag.append(richSection('l0911-goals',txt.goals,a.goals.md));frag.append(richSection('l0911-concept',txt.concept,a.concept.md));frag.append(richSection('l0911-variables',txt.variables,a.variable_types.md));frag.append(richSection('l0911-guided',txt.guided,a.guided.md));frag.append(methodArea(l,Pilot.getView(bundle,state)));frag.append(challengeArea(Pilot.getView(bundle,state)));frag.append(reflectionArea(Pilot.getView(bundle,state)));frag.append(extensionArea());main.replaceChildren(frag);mentorBuild();
  if(focus){const nodeToFocus=el(focus)||el('review-announcement');if(nodeToFocus&&!nodeToFocus.hidden){nodeToFocus.focus({preventScroll:true});nodeToFocus.scrollIntoView({block:'start',behavior:'instant'});}}
}
el('language-switch').addEventListener('click',()=>mutate(s=>Pilot.changeLocale(s,s.locale==='vi'?'en':'vi'),{focus:state.section}));el('spellbook-close').addEventListener('click',closeSpellbook);
dialog.addEventListener('close',()=>{if(state.guideReturn)mutate(s=>Pilot.returnFromSpellbook(s),{focus:state.section});if(previousFocus&&document.contains(previousFocus))previousFocus.focus();previousFocus=null;});
async function bootstrap(){try{const response=await fetch('./L09-1-1.cms.v1.staging.json',{cache:'no-store'});if(!response.ok)throw Error('CMS fetch HTTP '+response.status);bundle=await response.json();if(bundle.schema!=='li.lesson.cms.v1.staging'||bundle.lesson_id!=='L09-1-1')throw Error('Invalid lesson CMS bundle');
  try{const saved=localStorage.getItem(Pilot.KEY);if(saved){const recovered=Pilot.restore(saved);state=recovered.state;if(!recovered.recovered)announce(state.warning);}else state=Pilot.createState('vi');}catch(e){storageOk=false;state=Pilot.createState('vi');state.storageAvailable=false;announce('Storage unavailable · memory-only preview');}
  render();}catch(e){main.replaceChildren(node('h1',{},'Preview cannot load'));paragraph(main,'Open this folder with a local HTTP server (not file://). '+(e.message||e));showError('CMS unavailable; nothing was submitted or deployed.');}}
bootstrap();