/* li. Design System Studio: one static frontend; canonical values stay in generated token CSS.
 * Stories use current native runtime CSS or explicitly labeled draft specimens.
 * No product routing, persistence, auth or network writes. */
const u='https://github.com/sali5610/li/blob/main/';
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
 {id:'chip',group:'Components',title:'Filter chip',short:'Native React pressed state',status:'DRAFT',variants:['Filter'],states:['default','selected','disabled'],source:'design-system/react/Components.tsx',do:'Use a full pill only for filters; expose controlled aria-pressed, focus and disabled.',dont:'Use filter pills as general primary buttons or imply a filter was saved.',code:'<FilterChip pressed={selected} onClick={onToggle}>All</FilterChip>'},
 {id:'searchField',group:'Molecules',title:'Search field',short:'Controlled query + clear + submit',status:'DRAFT',variants:['Search'],states:['default','query','disabled'],source:'design-system/react/Molecules.tsx',do:'Use a labeled native search input, caller-owned query and real clear/submit actions.',dont:'Make typed text look like a server search result.',code:'<SearchField label="Tra cứu" value={query} onQueryChange={setQuery} onSearch={search} clearLabel="Xóa" submitLabel="Tìm" />'},
 {id:'actionGroup',group:'Molecules',title:'Action group',short:'Named, wrapping related actions',status:'DRAFT',variants:['Actions'],states:['default','disabled'],source:'design-system/react/Molecules.tsx',do:'Keep logical order and wrap actions at narrow widths.',dont:'Reverse primary/secondary order just to fit a viewport.',code:'<ActionGroup label="Actions"><Button>Next</Button></ActionGroup>'},
{id:'saveStatus',group:'Molecules',title:'Save status',short:'Device / sync / error are distinct',status:'DRAFT',variants:["Status"],states:["unsaved","saving","saved-device","synced","offline","error"],source:'design-system/react/Molecules.tsx',do:'Distinguish local save from verified cloud sync using caller-owned evidence and actionable retry.',dont:'Label saved locally as cloud-synced, or create a success from an animation.',code:'<SaveStatus state={state} message={label} onRetry={retry} retryLabel="Thử lại" />'},
 {id:'languageSwitch',group:'Molecules',title:'Language switch',short:'Controlled VI / EN choice',status:'DRAFT',variants:["VI / EN"],states:["default","english","disabled"],source:'design-system/react/Molecules.tsx',do:'Use one shared selected language and announce pressed selection.',dont:'Change app language from a DS fixture or persist locale without consumer ownership.',code:'<LanguageSwitch label="Language" value={lang} onChange={setLang} viLabel="Tiếng Việt" enLabel="English" />'},
 {id:'filterGroup',group:'Molecules',title:'Filter group',short:'Single / multiple controlled filters',status:'DRAFT',variants:["Multiple","Single"],states:["default","selected","disabled"],source:'design-system/react/Molecules.tsx',do:'Use true pressed state; allow multi-select only when the filtering logic supports it.',dont:'Represent multi-select filters as mutually-exclusive radio without semantics.',code:'<FilterGroup label="Subjects" options={items} selected={selected} onChange={setSelected} />'},
 {id:'listRow',group:'Molecules',title:'List row',short:'Action / navigation / read-only row',status:'DRAFT',variants:["Action","Link","Static"],states:["default","selected","disabled"],source:'design-system/react/Molecules.tsx',do:'Choose a semantic link for navigation, a button for actions, and text for read-only rows.',dont:'Attach navigation to a div, or create both href and click action on the same row.',code:'<ListRow href="/lesson" title="Lesson" description="Summary" />'},
 {id:'breadcrumb',group:'Molecules',title:'Breadcrumb',short:'Hierarchical path / current page',status:'DRAFT',variants:["Hierarchy"],states:["default","long"],source:'design-system/react/Molecules.tsx',do:'Use real ancestor links and aria-current on the final item; allow wrapping.',dont:'Use breadcrumb for unrelated tabs or fake a clickable current page.',code:'<Breadcrumb label="Path" items={[{label:"Library",href:"/library"},{label:"Lesson"}]} />'},
  {id:'sourceStatus',group:'Molecules',title:'Source status',short:'Traceable academic provenance',status:'DRAFT',variants:['Reference'],states:['unreviewed','linked','reviewed','unavailable'],source:'design-system/react/Molecules.tsx',do:'Show source links and status supplied by verified course data; keep reviewed distinct from linked.',dont:'Claim academic verification just because a URL exists.',code:'<SourceStatus title="Source" sourceLabel="NIST" href={url} statusLabel="Not reviewed" state="unreviewed" />'},
 {id:'disclosure',group:'Molecules',title:'Disclosure',short:'Native details / summary',status:'DRAFT',variants:['Details'],states:['default','open'],source:'design-system/react/Molecules.tsx',do:'Use native details/summary for optional secondary explanation with keyboard support.',dont:'Hide mandatory learning instructions in collapsed details.',code:'<Disclosure summary="Explanation">More detail</Disclosure>'},
 {id:'actionMenu',group:'Molecules',title:'Action menu',short:'Native disclosure of actions / links',status:'DRAFT',variants:['Actions'],states:['default'],source:'design-system/react/Molecules.tsx',do:'Use named links for navigation and buttons for actions; Escape closes to trigger.',dont:'Use role=menu without implementing the full arrow-key menu pattern.',code:'<ActionMenu label="Actions" items={[{id:"open",label:"Open",onSelect:open}]} />'},
 {id:'appHeader',group:'Patterns',title:'App header / navigation',short:'One active route; semantic header',status:'DRAFT',variants:["Global"],states:["default","library"],source:'design-system/react/Templates.tsx',do:'Wire brand and navigation to true app hrefs; current item comes from router.',dont:'Mark multiple destinations current or put auth state into the DS.',code:'<AppHeader brand="li." homeHref="/" navLabel="Main" items={routes} activeId={routeId} />'},
 {id:'homeMirror',group:'Patterns',title:'Home / mirror shell',short:'Approved artwork slot + question and actions',status:'DRAFT',variants:["Mirror"],states:["default"],source:'design-system/react/Templates.tsx',do:'Pass existing approved art and consumer-owned home/question actions as slots.',dont:'Rebuild the live Home positioning or claim G2 artwork approval.',code:'<HomeMirrorShell artwork={<img src={art}/>} artworkLabel="Home art" title="Begin" question={prompt} actions={actions} />'},
 {id:'catalogShell',group:'Patterns',title:'Catalog / library shell',short:'Search, filters, hierarchy and results',status:'DRAFT',variants:["Catalog"],states:["default"],source:'design-system/react/Templates.tsx',do:'Use actual catalog course data, controlled SearchField and filter handlers.',dont:'Treat fixture courses or local filters as search backend results.',code:'<CatalogShell title="Library" search={searchUI} filters={filterUI}>{results}</CatalogShell>'},
 {id:'learningShell',group:'Patterns',title:'Learning flow shell',short:'Prompt → response → feedback → actions',status:'DRAFT',variants:["Lesson"],states:["default","feedback","completed"],source:'design-system/react/Templates.tsx',do:'Pass real lesson state, feedback and persisted save evidence; keep reading order accessible.',dont:'Put answer validation, mastery or Neon sync into DS.',code:'<LearningFlowShell title={lesson.title} prompt={prompt} response={response} progressLabel="Step" actions={actions} />'},
 {id:'accountShell',group:'Patterns',title:'Account / access shell',short:'Invite gate or settings panel layout',status:'DRAFT',variants:["Access","Settings"],states:["default"],source:'design-system/react/Templates.tsx',do:'Use for layout only; own signed auth and account data outside DS.',dont:'Make an example Google button a live login action.',code:'<AccountShell mode="access" title="Sign in">{authForm}</AccountShell>'},
 {id:'feedbackScene',group:'Patterns',title:'Feedback / error scene',short:'Loading, empty, error, complete',status:'DRAFT',variants:["Empty","Loading","Error","Complete"],states:["default"],source:'design-system/react/Templates.tsx',do:'Present caller-owned real status with action; use alert only for errors.',dont:'Show complete based on a fake timer or fixture loading state.',code:'<FeedbackScene kind="error" title="Could not load" message={error} action={retryButton} />'},
 {id:'feedback',group:'Molecules',title:'Inline feedback',short:'Accurate status / alert + retry',status:'DRAFT',variants:['Info','Error','Success','Loading'],states:['default'],source:'design-system/react/Molecules.tsx',do:'Render only a caller-provided true status and use a real retry callback.',dont:'Imply a server write or successful sync from UI fixture state.',code:'<InlineFeedback tone="error" message="Không thể hoàn tất" onAction={retry} actionLabel="Thử lại" />'},
 {id:'dialog',group:'Components',title:'Dialog',short:'Controlled native modal & focus return',status:'DRAFT',variants:['Modal'],states:['default','long'],source:'design-system/react/Dialog.tsx',do:'Open with showModal, close with Escape/Close, and restore triggering focus.',dont:'Use a clickable div or call save on close.',code:'<Dialog open={open} title="Xác nhận" closeLabel="Đóng" onRequestClose={close}>Nội dung</Dialog>'},
];
/* Deterministic focus visual state for UI review; real keyboard uses :focus-visible. */
const focusIds=new Set(["link","checkbox","radio","iconButton","button","field","chip","searchField","actionGroup","languageSwitch","filterGroup","listRow","breadcrumb","disclosure","actionMenu","dialog","appHeader","homeMirror","catalogShell","learningShell","accountShell","feedbackScene"]);
for(const entry of catalog){
 if(focusIds.has(entry.id)&&!entry.states.includes('focus'))entry.states.push('focus');
}
const byId=id=>catalog.find(x=>x.id===(id==='nav'||id==='navigation'?'appHeader':id))||catalog[0];
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
 return heading;
}
if(query.has('embed')){
 document.body.classList.add('is-canvas');
 const root=document.querySelector('#studio-canvas');root.hidden=false;
 const item=byId(query.get('story')),variant=safe(query.get('variant'),item.variants),state=safe(query.get('state'),item.states),lang=query.get('lang')==='en'?'en':'vi';
 root.innerHTML=canvasStory(item,variant,state,lang);
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

 const initial={variant:query.get('variant'),state:query.get('state'),lang:query.get('lang'),width:query.get('width')};
 let resizeObserver;
 function previewURL(){
  const options=new URLSearchParams({embed:'1',story:active.id,variant:v.value,state:s.value,lang:language.value});
  const entry=active.id==='layout'?'./react-layout.html':
   ['text','heading','link','divider','badge','progress'].includes(active.id)?'./react-atoms.html':
   ['checkbox','radio','field','icon','iconButton'].includes(active.id)?'./react-controls.html':
   ['button','card','chip'].includes(active.id)?'./react-components.html':
   ['appHeader','homeMirror','catalogShell','learningShell','accountShell','feedbackScene'].includes(active.id)?'./react-templates.html':
   active.id==='dialog'?'./react-dialog.html':
   ['feedback','searchField','actionGroup','saveStatus','languageSwitch','filterGroup','listRow','breadcrumb','sourceStatus','disclosure','actionMenu'].includes(active.id)?'./react-molecules.html':
   './index.html';
  return entry+'?'+options.toString();
 }
 function fitPreviewHeight(){
  if(width.value.includes('x'))return;
  try{
   const body=frame.contentDocument?.body;
   if(!body)return;
   const height=Math.min(5000,Math.max(480,Math.ceil(body.scrollHeight+8)));
   if(Math.abs(frame.getBoundingClientRect().height-height)>2)frame.style.height=height+'px';
  }catch{ /* Cross-origin or stale iframe: keep an internally scrollable preview. */ }
 }
 frame.addEventListener('load',()=>{
  resizeObserver?.disconnect();
  if(width.value.includes('x'))return;
  try{
   const body=frame.contentDocument?.body;
   if(!body)return;
   fitPreviewHeight();
   if(typeof ResizeObserver!=='undefined'){
    resizeObserver=new ResizeObserver(fitPreviewHeight);
    resizeObserver.observe(body);
   }
  }catch{ /* A non-readable iframe keeps its explicit fallback height. */ }
 });
 function refresh(){
  resizeObserver?.disconnect();
  const url=previewURL();
  frame.src=url;
  $('#studio-full-preview').href=url;
  const [viewportWidth,viewportHeight]=width.value.split('x');
  frame.style.width=width.value==='auto'?'100%':viewportWidth+'px';
  frame.style.height=viewportHeight?viewportHeight+'px':'520px';
  $('#studio-frame-label').textContent=width.value==='auto'?'FLUID · AUTO HEIGHT':
    (viewportWidth+' × '+(viewportHeight||'AUTO')+' CSS PX');
  const link=new URL(location.href);
  link.searchParams.delete('embed');
  link.searchParams.set('variant',v.value);
  link.searchParams.set('state',s.value);
  link.searchParams.set('lang',language.value);
  link.searchParams.set('width',width.value);
  link.hash=active.id;
  history.replaceState(null,'',link.pathname+link.search+link.hash);
  $('#studio-link-status').textContent='';
 }
 function renderDetails(){
  const content=$('#studio-details-content');
  if(tab==='code')content.innerHTML='<div class="studio-code"></div>',content.querySelector('.studio-code').textContent=active.code;
  else if(tab==='source')content.innerHTML='<div class="studio-sources"><strong>Canonical reference</strong><a target="_blank" rel="noopener noreferrer" href="'+u+active.source+'">'+active.source+'</a><a target="_blank" rel="noopener noreferrer" href="'+u+'design-system/tokens.json">design-system/tokens.json — token values</a><p>Global G2 is open. A Draft specimen does not claim production component parity.</p><a href="../component-library-archive.html">Component Library phiên bản cũ (archive) ↗</a></div>';
  else content.innerHTML='<div class="studio-do-grid"><div class="studio-guideline"><strong>DO</strong><p>'+esc(active.do)+'</p></div><div class="studio-guideline no"><strong>DON’T</strong><p>'+esc(active.dont)+'</p></div></div>';
 }
 function select(item,restore=false){
  active=item;
  $('#studio-title').textContent=item.title;$('#studio-category').textContent=item.group.toUpperCase();$('#studio-summary').textContent=item.short;
  $('#studio-section-name').textContent=item.group;$('#studio-crumb-name').textContent=item.title;$('#studio-readiness').textContent=item.status;
  fillOptions(v,item.variants);fillOptions(s,item.states);
  if(restore){
   v.value=safe(initial.variant,item.variants);
   s.value=safe(initial.state,item.states);
   language.value=initial.lang==='en'?'en':'vi';
   if([...width.options].some(option=>option.value===initial.width))width.value=initial.width;
  }
  updateNav();renderDetails();refresh();
 }
 search.addEventListener('input',updateNav);
 [v,s,language,width].forEach(x=>x.addEventListener('change',refresh));
 $('#studio-refresh').addEventListener('click',refresh);
 $('#studio-copy-link').addEventListener('click',async()=>{
  try{
   await navigator.clipboard.writeText(location.href);
   $('#studio-link-status').textContent='Review link copied';
  }catch{
   $('#studio-link-status').textContent='Copy this page URL from the address bar';
  }
 });
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));$('#studio-details-content').setAttribute('aria-labelledby',b.id);renderDetails();}));
 window.addEventListener('hashchange',()=>select(byId(location.hash.slice(1))));
 select(active,true);
}
