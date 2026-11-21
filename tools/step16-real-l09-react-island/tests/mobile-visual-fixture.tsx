import React from 'react';
/* Match the real signed-in React bundle, not a partial CSS fixture. */
import '../../../design-system/react/atoms.css';
import '../../../design-system/react/controls.css';
import '../../../design-system/react/components.css';
import '../../../design-system/react/molecules.css';
import {createRoot} from 'react-dom/client';
import {Journal,Settings} from '../src/shell/journal-settings.js';
import {Guide,Library,Resume,Bookmarks} from '../src/shell/guide-library.js';
import {CatalogScreen} from '../src/shell/home-catalog.js';
import {installReactCatalogPort} from '../src/shell/catalog-route-adapter.js';
import {BuddyDialog} from '../src/shell/laoly-dialog.js';
import {mountKnowledgeSearch} from '../src/shell/knowledge-search.js';
import {mountSharedNavigation,RouteTrail} from '../src/shell/mount-navigation.js';
import {appUiStore} from '../src/shell/app-store.js';
// Uses the real React screen components and their production CSS. No login,
// user data, network auth, or public route bypass: this HTML is deleted
// BEFORE upload-pages-artifact in staging.
const app=window as unknown as Record<string,any>;
const viewName=new URLSearchParams(location.search).get('view')||'journal';
const date='2026-11-21';
const days=Array.from({length:30},(_,i)=>{
 const key='2026-11-'+String(i+1).padStart(2,'0');
 const totals:Record<string,number[]>={'18':[1,2,2],'19':[0,0,0],'20':[1,4,5],'21':[0,0,1]};
 const counts=totals[String(i+1)]||[0,0,0];
 return {day:i+1,key,recorded:Boolean(totals[String(i+1)]),counts,total:counts.reduce((a,b)=>a+b,0)};
});
const journalView={
 month:'2026-11',selected:date,offset:6,days,
 monthLabel:'tháng 11 năm 2026',selectedLabel:'Thứ Bảy, ngày 21 tháng 11, 2026',
 totals:{recorded:4,counts:[2,6,8]},physical:{sleep:'Có',move:'Có',rest:'Có'},
 mode:'Đào sâu',checkins:'1',counts:['0','0','1'],dayStatus:'Đã ghi nhận.',
 consentStatus:'Dữ liệu mẫu chỉ để kiểm tra layout',enabled:true,storageError:false,hasRecords:false
};
const methodCategories=[
 {key:'Tất cả',label:'Tất cả'},
 {key:'Ký Ức Thuật',label:'Ký Ức Thuật'},
 {key:'Minh Giải Thuật',label:'Minh Giải Thuật'},
 {key:'Luận Chứng Thuật',label:'Luận Chứng Thuật'},
 {key:'Phá Giải Thuật',label:'Phá Giải Thuật'},
 {key:'Tự Chủ Thuật',label:'Tự Chủ Thuật'}
];
const methods=Array.from({length:13},(_,i)=>({
 id:'T'+String(i+1).padStart(2,'0'),
 title:['Triệu Ức Chân Ngôn','Lộ Trình Ký Ức','Khảo Luận','Minh Giải','Phản Chứng'][i%5]+' '+(i+1),
 original:['Retrieval Practice','Method of Loci','Interleaving','Self Explanation'][i%4],
 purpose:'Chọn một kỹ thuật để tự học, ghi nhớ và kiểm tra suy luận.',
 category:methodCategories[1+(i%5)].label,categoryKey:methodCategories[1+(i%5)].key
}));
const libraryData={
 lessons:[{id:'L0912',route:'lesson',title:'Thiên lệch chọn mẫu',
          status:'Đang học',detail:'Bài học gần đây',saved:false}],
 problems:[{kind:'case',key:'sample',title:'90% người tham gia nói họ hài lòng',
            detail:'Tình huống đã mở',saved:true}],
 cases:[{id:'n1',type:'case',title:'Mẫu khảo sát chưa đại diện',body:'Một kết luận cần được kiểm tra lại bằng dữ kiện phù hợp.',
         date:'20/11/2026',sortDate:'2026-11-20'}],
 ideas:[{id:'n2',type:'idea',title:'Câu hỏi mới',body:'Câu hỏi mở có thể dẫn dắt câu trả lời như thế nào?',
         date:'19/11/2026',sortDate:'2026-11-19'}],
 lessonBookmarks:[{kind:'lesson',id:'L0912',title:'Thiên lệch chọn mẫu có ảnh hưởng gì đến nghiên cứu?',
                   route:'lesson',date:'20/11/2026'}],
 questionBookmarks:[{kind:'question',id:'q1',title:'90% người tham gia nói họ hài lòng. Vậy có đủ kết luận chưa?',
                     route:'research',date:'20/11/2026'}],
 collectionFilter:'all',bookmarkTab:'question',storageAvailable:true
};
if(viewName!=='searchEnglish')app.liLanguage={get:()=> 'vi'};
app.liPersonalDiary={
 getView:()=>({...journalView}),
 act:(kind:string,value?:string)=>{
  if(kind==='select'&&value){
   journalView.selected=value;
   journalView.selectedLabel='Ngày '+value;
   const item=days.find(d=>d.key===value);
   journalView.counts=(item?.counts||[0,0,0]).map(String);
   window.dispatchEvent(new Event('li:diary-view-changed'));
  }
 }
};
app.liMethods={
 getView:()=>({methods,categories:methodCategories,suggestions:['T01'],
               modeLabel:'Đào sâu',guide:'Đã muốn đào sâu thì lão mở cả mười ba phép. Chọn thứ Cô Hồ muốn hiểu kỹ.'}),
 open:()=>{}
};
app.liLibraryShelf={
 getView:()=>({...libraryData}),setCollectionFilter:()=>{},
 registerPersonalLessons:()=>0,openProblemEntry:()=>{},
 openSavedQuestion:()=>{},removeSavedQuestion:()=>{},
 selectBookmarkTab:(next:string)=>{libraryData.bookmarkTab=next;window.dispatchEvent(new Event('li:library-view-changed'));}
};
app.liBookmarks={toggle:()=>true};
app.liNotes={openDetail:()=>true,deleteFromReact:()=>true};
app.LiSpellPractice={getT02Status:()=>null};
app.liBuddyEngine={choose:(i:number)=>({text:i===0?'Chọn cách học phù hợp với câu hỏi.':'Thử một bài luyện ngắn.',showChallenge:false})};
const root=document.getElementById('visual-root')!;
const buddyRoot=document.getElementById('buddy-modal')!;
if(viewName==='searchEnglish'){
 const header=document.querySelector('.header')!;
 header.insertAdjacentHTML('beforeend','<button id="li-global-back"></button><div class="topnav"></div><div class="tools"></div>');
 header.insertAdjacentHTML('afterend','<nav class="mobile-nav"></nav>');
 root.closest('section')!.id='page-home';
 root.closest('main')!.insertAdjacentHTML('beforeend','<section id="page-search" class="page" tabindex="-1"></section>');
 app.liLanguage.set('vi');
 mountKnowledgeSearch();
 mountSharedNavigation();
} else if(viewName==='breadcrumb'||viewName==='breadcrumbPrivate'){
 appUiStore.getState().setRoute(viewName==='breadcrumbPrivate'?'bookmarks':'lessonL09');
 root.id='li-react-route-trail';
 createRoot(root).render(<RouteTrail/>);
} else if(viewName==='lesson'){
 root.parentElement!.classList.remove('active');
 const load=(name:string)=>new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='./assets/'+name;
  script.onload=()=>resolve();
  script.onerror=()=>reject(new Error('Missing native fixture script '+name));
  document.body.append(script);
 });
 (async()=>{
  try{
   for(const name of [
    'lesson-l09-hifi-markup.js',
    'lesson-l09-hifi.js',
    'catalog-curriculum-data.js',
    'catalog-drilldown.js',
    'lesson-contents-fab.js'
   ])await load(name);
   const page=document.getElementById('page-lessonL09');
   if(!page)throw Error('Real native L09 page was not mounted');
   page.classList.add('active');
   const trail=document.createElement('div');
   trail.id='li-react-route-trail';
   document.getElementById('main')?.before(trail);
   appUiStore.getState().setRoute('lessonL09');
   createRoot(trail).render(<RouteTrail/>);
   window.dispatchEvent(new Event('li:route-changed'));
  }catch(error){
   (window as any).__liLessonFixtureError=String(error);
  }
 })();
} else if(viewName==='buddy') {
 root.parentElement!.id='page-guide';
 buddyRoot.classList.add('open');
 createRoot(buddyRoot).render(<BuddyDialog root={buddyRoot}/>);
 setTimeout(()=>window.dispatchEvent(new CustomEvent('li:buddy-open',{detail:{
  text:'Cô Hồ đang chọn nhịp Đào sâu. Lão sẽ gợi ý theo nhịp này.',
  labels:['Chọn pháp cho đúng','Xem Retrieval Practice','Tìm đủ 13 phép'],
  avatar:'./assets/laoly-neutral.png',triggerId:'laoly-fab',
  quote:{id:'q',original:'Knowledge and human power are synonymous, since the ignorance of the cause frustrates the effect.',
   lang:'en',translation:'Tri thức và sức mạnh của con người là một; không biết nguyên nhân thì không đạt được kết quả.',
   interpretation:'Ý nghĩa về tư duy nguyên nhân.',meta:'Francis Bacon',url:'https://example.org',comment:''}
 }})),150);
} else if(viewName==='catalogRoot'||viewName==='catalogGroup'){
 // Exercise the REAL Catalog path adapter in this isolated browser fixture.
 // The synthetic auth class is never bundled in the user-facing app.
 document.documentElement.classList.add('li-auth-verified');
 installReactCatalogPort();
 root.parentElement!.classList.remove('active');
 const page=document.getElementById('page-catalog')!;
 page.classList.add('active');
 createRoot(page.querySelector('.section-shell')!).render(<CatalogScreen/>);
} else if(viewName==='settings'){
 root.parentElement!.id='page-settings';
 app.liSettingsPort={getView:()=>({mode:'start',modes:[],calm:false,mute:false,
  nicknames:{},previews:{},cloudVisible:false,exportReady:false,importLoading:false})};
 createRoot(root).render(<Settings/>);
} else {
 root.parentElement!.id=['guide','library','resume','bookmarks'].includes(viewName)?'page-'+viewName:'page-dashboard';
 if(['guide','library','resume','bookmarks'].includes(viewName)){
  const trail=document.createElement('div');
  trail.id='li-react-route-trail';
  document.getElementById('main')!.before(trail);
  appUiStore.getState().setRoute(viewName);
  createRoot(trail).render(<RouteTrail/>);
 }
 createRoot(root).render(viewName==='guide'?<Guide/>:viewName==='library'?<Library/>:
  viewName==='resume'?<Resume/>:viewName==='bookmarks'?<Bookmarks/>:<Journal/>);
}
const bounds=(node:Element|null)=>{
 if(!node)return null;
 const r=node.getBoundingClientRect();
 return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};
};
setTimeout(()=>{
 const checks:{name:string;pass:boolean;detail?:unknown}[]=[];
 const assert=(name:string,condition:boolean,detail?:unknown)=>checks.push({name,pass:condition,detail});
 const select=(q:string)=>document.querySelector(q);
 const windowWidth=document.documentElement.clientWidth||innerWidth;
 assert('true-390-css-mobile-viewport',windowWidth===390,{innerWidth,clientWidth:windowWidth});
 assert('no-horizontal-overflow',document.documentElement.scrollWidth<=windowWidth+4,
  {scrollWidth:document.documentElement.scrollWidth,windowWidth});
 if(['settings','catalogRoot','catalogGroup','guide','library','resume','bookmarks'].includes(viewName)){
  const header=select('.app > .header');
  const heading=select('#main > .page.active h1');
  const trail=select('#li-react-route-trail .li-ds-breadcrumb, .catalog-breadcrumbs .li-ds-breadcrumb');
  const expectsTrail=['catalogGroup','resume','bookmarks'].includes(viewName);
  const gap=Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--li-space-3'));
  const headerBottom=header?.getBoundingClientRect().bottom??NaN;
  const trailBox=trail?.getBoundingClientRect();
  const headingTop=heading?.getBoundingClientRect().top??NaN;
  const leadingGap=(trailBox?.top??headingTop)-headerBottom;
  const trailingGap=trailBox?headingTop-trailBox.bottom:null;
  assert('page-title-uses-shared-navigation-spacing',Boolean(trail)===expectsTrail&&
   Math.abs(leadingGap-gap)<1&&(trailingGap===null||Math.abs(trailingGap-gap)<1),
   {gap,leadingGap,trailingGap});
 }
 const textCenter=(node:Element)=>{
  const text=[...node.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&Boolean(n.textContent?.trim()));
  if(!text)return NaN;
  const range=document.createRange();range.selectNodeContents(text);
  const rect=range.getBoundingClientRect();
  return rect.top+rect.height/2;
 };
 const baseline=(crumb:Element|null)=>{
  const nodes=[...(crumb?.querySelectorAll(':scope > ol > li > button,:scope > ol > li > [aria-current="page"],:scope > ol > li > .li-ds-action-menu > summary')||[])];
  const measured=nodes.map(el=>({label:el.textContent?.trim(),textMid:textCenter(el),boxMid:el.getBoundingClientRect().top+el.getBoundingClientRect().height/2}));
  return {measured,maxTextDiff:Math.max(...measured.map(m=>m.textMid))-Math.min(...measured.map(m=>m.textMid))};
 };
 if(viewName==='searchEnglish'){
  assert('real-search-navigation-mounted',Boolean(select('.header .tools [aria-label="Tìm kiếm"]')));
 } else if(viewName==='breadcrumbPrivate'){
  const trail=select('.li-app-route-trail .li-ds-breadcrumb');
  const result=baseline(trail);
  const labels=[...(trail?.querySelectorAll(':scope > ol > li')||[])].map(n=>n.textContent?.trim());
  assert('actual-bookmarks-child-two-item-crumb',Boolean(trail&&labels.length===2&&labels[0]==='Tủ Riêng'&&labels[1]==='Dấu trang'),labels);
  assert('private-crumb-text-baseline-matches',result.measured.length===2&&result.maxTextDiff<=2,result);
 } else if(viewName==='breadcrumb'){
  const trail=select('.li-app-route-trail .li-ds-breadcrumb');
  const result=baseline(trail);
  assert('lesson-all-text-ink-lines-aligned',result.measured.length===4&&result.maxTextDiff<=2,result);
  const ancestors=[...document.querySelectorAll<HTMLButtonElement>(
   '.li-app-route-trail .li-ds-breadcrumb>ol>li>button')];
  const overflow=select('.li-ds-breadcrumb-overflow .li-ds-action-menu') as HTMLDetailsElement|null;
  const summary=overflow?.querySelector('summary') as HTMLElement|null;
  const hidden=overflow?.querySelectorAll('ul>li');
  const crumbs=[...document.querySelectorAll('.li-ds-breadcrumb>ol>li')];
  assert('real-lesson-breadcrumb-hierarchy',Boolean(trail&&
   trail.querySelector('[aria-current="page"]')&&overflow&&hidden?.length===2),bounds(trail));
  assert('two-closest-parent-links',ancestors.length===2,
   ancestors.map(n=>n.textContent));
  assert('visible-ancestors-are-course-and-field',Boolean(
   ancestors[0]?.textContent?.trim()&&ancestors[1]?.textContent?.trim()&&
   !ancestors.some(n=>n.textContent?.includes('Đại Sảnh'))),
   ancestors.map(n=>n.textContent));
  assert('one-row-aligned-crumbs',crumbs.length===4&&
   crumbs.every(n=>Math.abs(n.getBoundingClientRect().top-crumbs[0].getBoundingClientRect().top)<4),
   crumbs.map(bounds));
  assert('breadcrumb-ancestors-are-text-links',ancestors.length===2&&ancestors.every(node=>{
   const cs=getComputedStyle(node);
   return cs.borderTopWidth==='0px'&&cs.boxShadow==='none'&&
    cs.textDecorationLine.includes('underline');
  }),ancestors.map(node=>({text:node.textContent,border:getComputedStyle(node).borderTopWidth})));
  if(summary&&overflow){
   summary.click();
   assert('ellipsis-dropdown-opens',overflow.open&&
    (hidden?.length||0)>=2&&getComputedStyle(summary).borderTopWidth==='0px');
   summary.click();
   assert('ellipsis-dropdown-closes',!overflow.open);
  }
 } else if(viewName==='lesson'){
  const page=select('#page-lessonL09');
  const trigger=select('body > .catalog-chapter-fab[data-lesson-owner="page-lessonL09"]') as HTMLButtonElement|null;
  const layer=select('body > .catalog-sheet-layer[data-lesson-owner="page-lessonL09"]') as HTMLElement|null;
  const style=trigger?getComputedStyle(trigger):null;
  assert('real-native-L09-hifi-markup-loaded',Boolean(page&&
   page.classList.contains('active')&&page.querySelector('.l09-stack')&&
   layer?.querySelector('.l09-index')));
  const trail=select('#li-react-route-trail .li-ds-breadcrumb');
  assert('breadcrumb-on-actual-lesson-page',Boolean(trail&&
   trail.querySelector('[aria-current="page"]')?.getAttribute('title')?.includes('Sampling Bias')&&
   trail.querySelectorAll(':scope > ol > li > button').length===2&&
   trail.querySelector('.li-ds-breadcrumb-overflow .li-ds-action-menu')),
   bounds(trail));
  assert('floating-button-uses-square-library-grammar',Boolean(trigger&&
   trigger.dataset.liComponent==='button'&&trigger.dataset.variant==='primary'&&
   style?.borderTopLeftRadius==='0px'&&style?.borderTopRightRadius==='0px'),
   {radius:style?.borderTopLeftRadius,ds:trigger?.dataset.liComponent});
  assert('visible-viewport-fixed-lesson-menu',Boolean(trigger&&!trigger.hidden&&style?.position==='fixed'&&
   style.display!=='none'&&trigger.getBoundingClientRect().width>=44&&
   trigger.getBoundingClientRect().bottom<=844&&trigger.getBoundingClientRect().left>=0),
   {trigger:bounds(trigger),display:style?.display,position:style?.position,error:(window as any).__liLessonFixtureError});
  assert('sheet-portaled-to-body',Boolean(layer&&layer.hidden&&
   layer.querySelector('.catalog-chapter-sheet')));
  if(trigger&&layer&&!trigger.hidden){
   const oldTop=trigger.getBoundingClientRect().top;
   window.scrollTo(0,350);
   assert('floating-menu-stays-fixed-through-scroll',
    Math.abs(trigger.getBoundingClientRect().top-oldTop)<3,
    {before:oldTop,after:trigger.getBoundingClientRect().top});
   trigger.click();
   const sheet=layer.querySelector('.catalog-chapter-sheet');
   assert('left-sheet-opens-on-real-click',Boolean(!layer.hidden&&
    trigger.getAttribute('aria-expanded')==='true'&&
    sheet&&sheet.getBoundingClientRect().left<=1&&
    sheet.getBoundingClientRect().width>300),
    {sheet:bounds(sheet),open:!layer.hidden});
   assert('real-chapter-links-in-sheet',Boolean(layer.querySelectorAll('.catalog-left-index a[href^="#"]').length>=3),
    layer.querySelectorAll('.catalog-left-index a[href^="#"]').length);
   (layer.querySelector('.catalog-sheet-close') as HTMLButtonElement|null)?.click();
   assert('sheet-closes-and-focus-restores',Boolean(layer.hidden&&
    trigger.getAttribute('aria-expanded')==='false'));
   window.scrollTo(0,0);
  }
 } else if(viewName==='journal'){
  const chart=select('.li-diary-month .li-legacy-chart'),cal=select('.li-diary-month .li-legacy-calendar');
  assert('real-DS-chart-visible',Boolean(chart&&bounds(chart)!.w>200),bounds(chart));
  assert('calendar-before-secondary-chart',Boolean(chart&&cal&&cal.getBoundingClientRect().bottom<chart.getBoundingClientRect().top),
    {chart:bounds(chart),calendar:bounds(cal)});
  assert('calendar-visible-in-first-fold',Boolean(cal&&cal.getBoundingClientRect().top<480&&cal.getBoundingClientRect().bottom<844),bounds(cal));
  assert('seven-day-chart',document.querySelectorAll('.li-legacy-chart-bars button').length===7);
  assert('thirty-month-dates',document.querySelectorAll('.li-legacy-calendar-grid button').length===30);
  assert('calendar-from-DS',Boolean(select('[data-li-legacy="month-calendar"]')));
  const tile=(day:string)=>select('.li-legacy-calendar-grid button[aria-label*="2026-11-'+day+'"]');
  const paint=(day:string)=>{const n=tile(day);return n?getComputedStyle(n).backgroundColor:''};
  const month=select('.li-diary-month>.li-legacy-calendar');
  const monthCss=month?getComputedStyle(month):null;
  assert('library-calendar-frame-restored',Boolean(month&&
   monthCss?.borderTopWidth==='1px'&&Number.parseFloat(monthCss.paddingLeft)>=12),
   {frame:bounds(month),border:monthCss?.borderTopWidth,padding:monthCss?.paddingLeft});
  const today=select('.li-legacy-today-action') as HTMLButtonElement|null;
  assert('library-today-action-visible',Boolean(today&&
   getComputedStyle(today).display!=='none'&&today.getBoundingClientRect().width>=76));
  assert('real-activity-heatmap-intensities',Boolean(
   month?.getAttribute('data-calendar-scale')==='activity'&&
   tile('19')?.getAttribute('data-activity-level')==='zero'&&
   tile('21')?.getAttribute('data-activity-level')==='low'&&
   tile('18')?.getAttribute('data-activity-level')==='medium'&&
   tile('20')?.getAttribute('data-activity-level')==='high'&&
   tile('22')?.getAttribute('data-activity-level')==='none'&&
   new Set(['18','19','20','21','22'].map(paint)).size===5),
   ['18','19','20','21','22'].map(day=>({day,level:tile(day)?.getAttribute('data-activity-level'),color:paint(day)})));
  assert('zero-recorded-separate-from-missing',Boolean(tile('19')?.getAttribute('data-recorded')==='true'&&
   tile('19')?.getAttribute('aria-label')?.includes('0 hoạt động')&&
   tile('22')?.getAttribute('data-recorded')==='false'));
  assert('no-bespoke-count-badges-in-activity-tiles',
   !document.querySelector('.li-diary-month .li-legacy-calendar-count'));
 } else if(viewName==='guide'){
  const filter=select('[data-li-molecule="filter-group"]'),mentor=select('.guide-margin-note');
  assert('canonical-filter-present',Boolean(filter),bounds(filter));
  assert('canonical-search-field-present',Boolean(select('.guide-find [data-li-molecule="search-field"]')));
  assert('search-before-filter',Boolean(filter&&select('#li-react-method-search')&&
   select('#li-react-method-search')!.getBoundingClientRect().top<filter.getBoundingClientRect().top));
  assert('filter-before-mentor',Boolean(filter&&mentor&&filter.getBoundingClientRect().top<mentor.getBoundingClientRect().top),
   {filter:bounds(filter),mentor:bounds(mentor)});
  const field=select('.guide-find .li-atom-field');
  const index=select('.guide-index');
  assert('mobile-search-full-width',Boolean(field&&index&&field.getBoundingClientRect().width>=index.getBoundingClientRect().width*0.94),
   {field:bounds(field),index:bounds(index)});
  const chips=[...document.querySelectorAll('.guide-find .li-ds-filter-chip')];
  assert('all-categories-visible-not-clipped',chips.length===6&&chips.every(chip=>{
   const c=chip.getBoundingClientRect();return c.left>=0&&c.right<=windowWidth+2;
  }),chips.map(bounds));
  assert('filters-actually-pill-shaped',chips.length===6&&chips.every(chip=>
   Number.parseFloat(getComputedStyle(chip).borderTopLeftRadius)>=20));
  assert('thirteen-methods',document.querySelectorAll('.guide-method-entry').length===13);
 } else if(viewName==='library'){
  const titles=[...document.querySelectorAll('.library-saved-shortlist .library-list-copy strong')];
  assert('saved-bookmarks-have-rows',titles.length>0);
  assert('canonical-feature-card',Boolean(select('.library-resume-feature[data-li-component="card"][data-variant="flat-study"]')));
  const shelves=[...document.querySelectorAll('.library-workspace h2')];
  assert('four-shelves-in-reading-order',shelves.map(heading=>heading.id).join(',')===
   'library-resume-heading,library-notes-heading,library-saved-heading,library-journal-heading'&&
   shelves.every((heading,index)=>index===0||
    heading.getBoundingClientRect().top>shelves[index-1].getBoundingClientRect().bottom));
  const shelfBlocks=[...document.querySelectorAll('.library-resume-feature,.library-workspace-main,.library-saved-shortlist,.library-rhythm')];
  assert('shelves-separated-by-whitespace',shelfBlocks.length===4&&shelfBlocks.every((block,index)=>
   index===0||block.getBoundingClientRect().top-shelfBlocks[index-1].getBoundingClientRect().bottom>=24));
  assert('shelf-actions-beside-headings',shelves.length===4&&shelves.every(heading=>{
   const action=heading.parentElement?.querySelector('button');
   return action&&action.getBoundingClientRect().left>=heading.getBoundingClientRect().right+8;
  }));
  const notePreviews=[...document.querySelectorAll('.library-note-preview')];
  assert('notes-share-an-unframed-section',notePreviews.length===2&&notePreviews.every(preview=>
   preview.closest('.library-workspace-main')&&getComputedStyle(preview).borderTopWidth==='0px'));
  const links=[...document.querySelectorAll('.li-react-library .library-text-link.li-ds-button')];
  assert('text-actions-are-unboxed',links.length>=3&&links.every(n=>{
   const c=getComputedStyle(n);return c.borderTopWidth==='0px'&&c.boxShadow==='none';
  }),links.map(n=>({label:n.textContent,border:getComputedStyle(n).borderTopWidth,shadow:getComputedStyle(n).boxShadow})));
  assert('canonical-icon-only-bookmarks',
   document.querySelectorAll('.li-react-library .library-icon-action[data-li-atom="icon-button"]').length>0);
  const nestedRow=select('.library-resume-feature .library-list-item');
  assert('resume-rows-are-not-nested-faux-cards',Boolean(nestedRow&&
   getComputedStyle(nestedRow).borderTopWidth==='0px'&&
   getComputedStyle(nestedRow).borderLeftWidth==='0px'),
   nestedRow?{top:getComputedStyle(nestedRow).borderTopWidth,left:getComputedStyle(nestedRow).borderLeftWidth}:null);
  const resumeTitle=select('.library-resume-feature .library-list-item .library-list-copy');
  assert('resume-title-full-width',Boolean(resumeTitle&&resumeTitle.getBoundingClientRect().width>=250),bounds(resumeTitle));
  assert('bookmark-title-usable-width',titles.every(n=>n.getBoundingClientRect().width>=170),
    titles.map(bounds));
 } else if(viewName==='resume'){
  assert('continue-only-recency',document.querySelectorAll('[data-li-react-screen="resume"] .library-resume-section').length===2);
  assert('continue-has-no-bookmarks',!select('[data-li-react-screen="resume"] .library-bookmark-tabs'));
 } else if(viewName==='bookmarks'){
  const tabs=[...document.querySelectorAll('[data-li-react-screen="bookmarks"] [role="tab"]')];
  assert('bookmarks-own-page',Boolean(select('[data-li-react-screen="bookmarks"] h1')));
  assert('bookmark-tabs-present',tabs.length===2);
  assert('question-tab-visible',tabs[1]?.getAttribute('aria-selected')==='true'&&
   document.querySelectorAll('[data-li-react-screen="bookmarks"] .library-list-item').length===1);
  const rows=[...document.querySelectorAll('[data-li-react-screen="bookmarks"] .library-list-item')];
  assert('bookmark-rows-fit-mobile',rows.every(row=>row.getBoundingClientRect().right<=windowWidth+2));
 } else if(viewName==='buddy'){
  const btns=[...document.querySelectorAll('#buddy-modal .buddy-actions .li-ds-button')];
  assert('conversation-and-actions-rendered',Boolean(select('#buddy-text'))&&btns.length===4);
  assert('actions-fit-viewport',btns.length>0&&btns.every(n=>{
    const r=n.getBoundingClientRect();return r.left>=0&&r.right<=windowWidth+2;
   }),btns.map(bounds));
  const thought=select('#buddy-modal .li-buddy-quote-thought[data-li-legacy="chat-bubble"]');
  const hook=thought?getComputedStyle(thought,'::before'):null;
  assert('shared-chat-bubble-has-real-left-hook',Boolean(thought&&
   thought.getAttribute('data-tail')==='left'&&
   hook?.content!=='none'&&hook?.clipPath.includes('polygon')&&
   Number.parseFloat(hook?.left||'0')<0),{
    bubble:bounds(thought),tail:hook?.clipPath,left:hook?.left
   });
  assert('only-name-in-companion-header',!select('#buddy-modal .li-buddy-subtitle'));
 }
 const ok=checks.length>0&&checks.every(c=>c.pass);
 const report={status:ok?'LI_VISUAL_QA_PASS':'LI_VISUAL_QA_FAIL',
               view:viewName,viewport:windowWidth,checks};
 document.getElementById('qa-report')!.textContent=JSON.stringify(report);
},viewName==='lesson'?2600:1400);
