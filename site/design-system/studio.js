/* li. Design System Studio: one static frontend; canonical values stay in generated token CSS.
 * Stories use current native runtime CSS or explicitly labeled draft specimens.
 * No product routing, persistence, auth or network writes. */
const u='https://github.com/sali5610/li/blob/main/';
const draftSource='https://github.com/sali5610/li/blob/design-system/uxds35-single-studio-20261120/';
const catalog=[
 {id:'colors',group:'Foundations',title:'Colors & roles',short:'Canonical paint roles',status:'RUNTIME',variants:['Palette'],states:['default'],source:'design-system/tokens.json',do:'Use semantic color roles and generated token CSS.',dont:'Hardcode new hex colors or use Olive for a primary CTA.',code:'color: var(--moss);\nbackground: var(--paper);'},
 {id:'type',group:'Foundations',title:'Typography',short:'Editorial / UI scale',status:'RUNTIME',variants:['Type scale'],states:['default'],source:'design-system/typography-spacing.md',do:'Use Crimson Text for editorial hierarchy and UI sans for controls.',dont:'Treat 12px metadata as an essential body-label size.',code:'font: var(--li-type-title-md)/var(--li-leading-title-md) var(--li-font-editorial);'},
 {id:'spacing',group:'Foundations',title:'Spacing',short:'4px spatial rhythm',status:'RUNTIME',variants:['Space scale'],states:['default'],source:'design-system/tokens.json',do:'Use spacing tokens from the 4px grid.',dont:'Add unsupported one-off gaps to adjust a single screenshot.',code:'gap: var(--li-space-3);\npadding: var(--li-space-4);'},
 {id:'layout',group:'Layout',title:'Layout primitives',short:'Container / Stack / Grid',status:'DRAFT',variants:['Container','Stack','Inline','Cluster','Grid','SafeArea','ScrollRegion'],states:['default'],source:'design-system/react/Layout.tsx',do:'Use container-aware reflow and a bounded reading measure.',dont:'Infer iPad from user agent or copy Home art geometry into generic layouts.',code:'<Container><Grid cell="compact"><Card>…</Card></Grid></Container>'},
 {id:'text',group:'Atoms',title:'Text',short:'Body / supporting / caption',status:'DRAFT',variants:['body','bodyLarge','support','caption'],states:['default'],source:'design-system/react/Atoms.tsx',do:'Use 16/24 body copy and clear supporting text; match semantic HTML to actual meaning.',dont:'Use caption-size text for essential instructions or force single-line truncation.',code:'<Text as="p" role="body">Readable copy</Text>'},
 {id:'heading',group:'Atoms',title:'Heading',short:'Editorial hierarchy',status:'DRAFT',variants:['display','headline','titleLarge','titleMedium','titleSmall'],states:['default'],source:'design-system/react/Atoms.tsx',do:'Use a logical heading level and reuse the editorial type roles.',dont:'Choose h1–h4 only for visual size or skip semantic levels.',code:'<Heading level={2} role="headline">Section</Heading>'},
 {id:'link',group:'Atoms',title:'Link',short:'Native navigation semantics',status:'DRAFT',variants:['Inline'],states:['default'],source:'design-system/react/Atoms.tsx',do:'Provide a real href and visible focus for navigation.',dont:'Use a button for plain navigation or a link with no destination.',code:'<Link href="#target">Read details</Link>'},
 {id:'divider',group:'Atoms',title:'Divider',short:'Semantic or decorative separator',status:'DRAFT',variants:['Semantic','Decorative'],states:['default'],source:'design-system/react/Atoms.tsx',do:'Use semantic hr for real section breaks; mark ornamental lines hidden.',dont:'Use separators instead of spacing hierarchy everywhere.',code:'<Divider decorative />'},
 {id:'badge',group:'Atoms',title:'Badge',short:'Neutral metadata emphasis',status:'DRAFT',variants:['Neutral','Emphasis'],states:['default'],source:'design-system/react/Atoms.tsx',do:'Use badges for static metadata, with square geometry and text labels.',dont:'Use a badge as status proof or a filter pill.',code:'<Badge tone="neutral">Draft</Badge>'},
 {id:'progress',group:'Atoms',title:'Progress',short:'Determinate / unknown progress',status:'DRAFT',variants:['Determinate','Indeterminate'],states:['default'],source:'design-system/react/Atoms.tsx',do:'Use native progress with an accessible label and grounded values.',dont:'Invent percentages or label in-progress work complete.',code:'<Progress label="Processing" value={60} />'},
 {id:'checkbox',group:'Atoms',title:'Checkbox',short:'Native independent selection',status:'DRAFT',variants:['Default'],states:['default','checked','disabled'],source:'design-system/react/Controls.tsx',do:'Use native checked/disabled semantics and a full clickable label for independent toggles.',dont:'Replace single-choice Radio or claim a checked selection was saved.',code:'<Checkbox checked={checked} onChange={...} label="Allow reminders" />'},
 {id:'radio',group:'Atoms',title:'Radio',short:'One selection per named set',status:'DRAFT',variants:['Group'],states:['default','selected','disabled'],source:'design-system/react/Controls.tsx',do:'Give each option the same name; group in fieldset and legend.',dont:'Use radio for unrelated independent choices.',code:'<Radio name="density" value="compact" checked={...} label="Compact" />'},
 {id:'icon',group:'Atoms',title:'Icon',short:'Utility symbols / a11y',status:'DRAFT',variants:['Search','Check','Info','Close','Back','Book'],states:['default'],source:'design-system/react/Controls.tsx',do:'Decorative SVG by default. Use label only when icon conveys meaning.',dont:'Replace approved Lão Lý art or force icon-only instructions.',code:'<Icon name="search" />'},
 {id:'iconButton',group:'Atoms',title:'IconButton',short:'Native 48px named action',status:'DRAFT',variants:['Search','Close','Back'],states:['default','disabled'],source:'design-system/react/Controls.tsx',do:'Use a real button, 48px target, accessible name and focus-visible.',dont:'Use unlabeled icons or conflate route links with action buttons.',code:'<IconButton icon="search" label="Search" onClick={...} />'},
 {id:'button',group:'Components',title:'Button',short:'Native React actions',status:'DRAFT',variants:['Primary','Secondary','Ghost'],states:['default','disabled','loading'],source:'design-system/react/Components.tsx',do:'Use a dominant action and native disabled/loading semantics with accessible focus.',dont:'Show success before a real save readback.',code:'<Button variant="primary" onClick={onContinue}>Continue</Button>'},
 {id:'field',group:'Components',title:'Text field',short:'Native React Field',status:'DRAFT',variants:['Text','Textarea'],states:['default','error','disabled','readonly'],source:'design-system/react/Controls.tsx',do:'Provide a visible label, true input state, and actionable error text.',dont:'Use placeholder text as the only label or paint readonly as disabled.',code:'<Field label="Search" hint="Type query" error={error} />'},
 {id:'card',group:'Components',title:'Card / Surface',short:'React editorial / flat roles',status:'DRAFT',variants:['Raised','Tinted','Inverse','Flat study'],states:['default'],source:'design-system/react/Components.tsx',do:'Reserve hard shadow for editorial emphasis; keep secondary study cards flat.',dont:'Give every secondary exercise Card a hard shadow.',code:'<Card variant="flat-study"><h2>Title</h2></Card>'},
 {id:'chip',group:'Components',title:'Filter chip',short:'Independent selection',status:'DRAFT',variants:['Filter'],states:['default','selected','disabled'],source:'design-system/components.md',do:'Use a full pill only for actual filter chips.',dont:'Use chip pills as general primary buttons.',code:'<button aria-pressed="true" class="filter">Tất cả</button>'},
 {id:'nav',group:'Patterns',title:'Navigation',short:'Exactly one current route',status:'DRAFT',variants:['Global'],states:['default'],source:'design-system/ux-patterns-and-behavior.md',do:'Expose one active destination with aria-current="page".',dont:'Conflate selected navigation state with focus or hover.',code:'<a href="#guide" aria-current="page">Thần Chú</a>'},
 {id:'feedback',group:'Patterns',title:'Feedback',short:'Info / error / success / loading',status:'DRAFT',variants:['Info','Error','Success','Loading'],states:['default'],source:'design-system/ux-patterns-and-behavior.md',do:'Announce real outcomes as status/alert with accurate copy.',dont:'Show false saved or cloud-synced status.',code:'<p role="alert">Không thể lưu. Thử lại.</p>'},
 {id:'dialog',group:'Patterns',title:'Dialog',short:'Focus, close, confirmation',status:'DRAFT',variants:['Modal'],states:['default'],source:'design-system/ux-patterns-and-behavior.md',do:'Use a native dialog with a working close action and focus restore.',dont:'Build a clickable div that traps or loses keyboard focus.',code:'const d=document.querySelector("dialog");\nd.showModal();'},
];
const byId=id=>catalog.find(x=>x.id===id)||catalog[0];
const query=new URLSearchParams(location.search);
const safe=(value,values)=>values.includes(value)?value:values[0];
const tr=(vi,en,lang)=>lang==='en'?en:vi;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function canvasStory(record,variant,state,lang){
 const en=lang==='en',title=record.title;
 const heading='<h1 class="studio-canvas-heading">'+esc(title)+' <small style="font:12px var(--li-font-ui);color:var(--muted)">/ '+esc(variant)+'</small></h1>';
 const note=txt=>'<p class="studio-canvas-note">'+esc(txt)+'</p>';
 if(record.id==='colors'){
  const cs=['paper','cream','porcelain','ink','moss','olive','wood','rule','sage'];
  return heading+'<div class="studio-color-list">'+cs.map(k=>'<div class="studio-color-swatch"><div style="--swatch:var(--'+k+')"></div><strong>'+k+'</strong><small>'+getComputedStyle(document.documentElement).getPropertyValue('--'+k).trim()+'</small></div>').join('')+'</div>'+note('Values come from generated design-tokens.css');
 }
 if(record.id==='type')return heading+'<div class="studio-layout-stack"><div style="font:600 38px/1.2 var(--li-font-editorial);color:var(--moss)">'+tr('Một thư viện sống','A living library',lang)+'</div><div style="font:600 25px/1.3 var(--li-font-editorial)">'+tr('Tiêu đề chương','Chapter heading',lang)+'</div><div style="font:var(--li-type-body)/var(--li-leading-body) var(--li-font-ui)">'+tr('Nội dung chính: rõ ràng, có nhịp thở.','Body text with measured, readable rhythm.',lang)+'</div><div style="font:var(--li-type-support)/var(--li-leading-support) var(--li-font-ui);color:var(--muted)">'+tr('Thông tin hỗ trợ / 14px','Supporting information / 14px',lang)+'</div></div>';
 if(record.id==='spacing')return heading+[1,2,3,4,5,6,8,10].map(n=>'<div class="studio-space-row"><code>space-'+n+'</code><span style="--space:var(--li-space-'+n+')"></span><small>'+n*4+'px</small></div>').join('');
// Layout is intentionally mounted by React-only iframe route.
 if(record.id==='chip')return heading+'<div class="studio-canvas-row"><button class="studio-chip" type="button" aria-pressed="'+(state==='selected')+'" '+(state==='disabled'?'disabled':'')+'>'+tr('Tất cả','All',lang)+'</button><button class="studio-chip" type="button" aria-pressed="false">'+tr('Ký ức','Memory',lang)+'</button></div>'+note('Chip specimen. Pill shape belongs to filters only.');
 if(record.id==='nav')return heading+'<nav class="studio-canvas-nav" aria-label="'+tr('Điều hướng chính','Global navigation',lang)+'"><a href="#home">'+tr('Đại Sảnh','Home',lang)+'</a><a href="#guide" aria-current="page">'+tr('Thần Chú','Methods',lang)+'</a><a href="#library">'+tr('Tàng Thư','Library',lang)+'</a></nav>';
 if(record.id==='feedback'){
  const tone=variant.toLowerCase(),role=tone==='error'?'alert':'status',copy={info:tr('Thông tin đang được kiểm tra.','Information is being checked.',lang),error:tr('Không thể hoàn thành. Vui lòng thử lại.','Unable to complete. Please retry.',lang),success:tr('Thao tác giả lập hoàn tất.','Demo action completed.',lang),loading:tr('Đang xử lý giả lập…','Demo in progress…',lang)};
  return heading+'<div class="studio-feedback" data-tone="'+tone+'" role="'+role+'"><strong>'+esc(variant)+'</strong><p>'+copy[tone]+'</p></div>'+note('Fixture state only; never a real saved/cloud confirmation.');
 }
 if(record.id==='dialog')return heading+'<button class="action" type="button" id="story-dialog-open">'+tr('Mở hộp thoại','Open dialog',lang)+'</button><dialog class="studio-dialog" id="story-dialog"><h2 style="font:600 28px var(--li-font-editorial)">'+tr('Xác nhận','Confirm',lang)+'</h2><p>'+tr('Chỉ là nội dung minh họa.','This is demonstration content.',lang)+'</p><button class="action alt" id="story-dialog-close" type="button">'+tr('Đóng','Close',lang)+'</button></dialog>';
 return heading;
}
function bindCanvasInteractions(root){
 root.querySelector('#story-action')?.addEventListener('click',()=>{const r=root.querySelector('#story-result');if(r)r.textContent='✓ '+(query.get('lang')==='en'?'Demo click':'Đã bấm thử');});
 root.querySelectorAll('.studio-chip:not(:disabled)').forEach(b=>b.addEventListener('click',()=>{root.querySelectorAll('.studio-chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
 const dlg=root.querySelector('#story-dialog');
 root.querySelector('#story-dialog-open')?.addEventListener('click',()=>dlg?.showModal());
 root.querySelector('#story-dialog-close')?.addEventListener('click',()=>dlg?.close());
 root.querySelectorAll('.studio-canvas-nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();root.querySelectorAll('.studio-canvas-nav a').forEach(x=>x.removeAttribute('aria-current'));a.setAttribute('aria-current','page');}));
}
if(query.has('embed')){
 document.body.classList.add('is-canvas');
 const root=document.querySelector('#studio-canvas');root.hidden=false;
 const item=byId(query.get('story')),variant=safe(query.get('variant'),item.variants),state=safe(query.get('state'),item.states),lang=query.get('lang')==='en'?'en':'vi';
 root.innerHTML=canvasStory(item,variant,state,lang);
 bindCanvasInteractions(root);
}else{
 const $=selector=>document.querySelector(selector),nav=$('#studio-nav'),search=$('#studio-search'),v=$('#studio-variant'),s=$('#studio-state'),language=$('#studio-language'),width=$('#studio-width'),frame=$('#studio-frame');
 let active=byId(location.hash.slice(1)),tab='usage';
 function updateNav(){
  const needle=search.value.trim().toLowerCase();
  const groups=[...new Set(catalog.map(x=>x.group))];
  nav.innerHTML=groups.map(group=>{
   const matches=catalog.filter(x=>x.group===group&&(x.title.toLowerCase().includes(needle)||x.short.toLowerCase().includes(needle)||group.toLowerCase().includes(needle)));
   if(!matches.length)return '';
   return '<div class="studio-nav-group"><h2>'+group.toUpperCase()+'</h2>'+matches.map(x=>'<button type="button" class="studio-story-link" data-story="'+x.id+'" aria-current="'+(x===active?'page':'false')+'"><span>'+x.title+'</span><span>'+(x.status==='RUNTIME'?'LIVE':'DRAFT')+'</span></button>').join('')+'</div>';
  }).join('');
  nav.querySelectorAll('[data-story]').forEach(button=>button.addEventListener('click',()=>select(byId(button.dataset.story))));
 }
 function fillOptions(select,items){select.innerHTML=items.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');select.disabled=items.length===1;}
 function refresh(){
  const options=new URLSearchParams({embed:'1',story:active.id,variant:v.value,state:s.value,lang:language.value});
  frame.src=active.id==='layout'?'./react-layout.html?'+options.toString():['text','heading','link','divider','badge','progress'].includes(active.id)?'./react-atoms.html?'+options.toString():['checkbox','radio','field','icon','iconButton'].includes(active.id)?'./react-controls.html?'+options.toString():['button','card'].includes(active.id)?'./react-components.html?'+options.toString():'./index.html?'+options.toString();
  frame.style.width=width.value==='auto'?'100%':width.value+'px';
  $('#studio-frame-label').textContent=width.value==='auto'?'FLUID':width.value+' CSS PX';
 }
 function renderDetails(){
  const content=$('#studio-details-content');
  if(tab==='code')content.innerHTML='<div class="studio-code"></div>',content.querySelector('.studio-code').textContent=active.code;
  else if(tab==='source')content.innerHTML='<div class="studio-sources"><strong>Canonical reference</strong><a target="_blank" rel="noopener noreferrer" href="'+(active.source.startsWith('design-system/react/')?draftSource:u)+active.source+'">'+active.source+'</a><a target="_blank" rel="noopener noreferrer" href="'+u+'design-system/tokens.json">design-system/tokens.json — token values</a><p>Global G2 is open. A Draft specimen does not claim production component parity.</p><a href="../component-library-review.html">Historical component review archive →</a></div>';
  else content.innerHTML='<div class="studio-do-grid"><div class="studio-guideline"><strong>DO</strong><p>'+esc(active.do)+'</p></div><div class="studio-guideline no"><strong>DON’T</strong><p>'+esc(active.dont)+'</p></div></div>';
 }
 function select(item){
  active=item;history.replaceState(null,'','#'+item.id);
  $('#studio-title').textContent=item.title;$('#studio-category').textContent=item.group.toUpperCase();$('#studio-summary').textContent=item.short;
  $('#studio-section-name').textContent=item.group;$('#studio-crumb-name').textContent=item.title;$('#studio-readiness').textContent=item.status;
  fillOptions(v,item.variants);fillOptions(s,item.states);updateNav();renderDetails();refresh();
 }
 search.addEventListener('input',updateNav);
 [v,s,language,width].forEach(x=>x.addEventListener('change',refresh));
 $('#studio-refresh').addEventListener('click',refresh);
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));$('#studio-details-content').setAttribute('aria-labelledby',b.id);renderDetails();}));
 window.addEventListener('hashchange',()=>select(byId(location.hash.slice(1))));
 select(active);
}
