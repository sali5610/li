import React from 'react';
import {createRoot} from 'react-dom/client';
import {Journal} from '../src/shell/journal-settings.js';
import {Guide,Library} from '../src/shell/guide-library.js';
import {BuddyDialog} from '../src/shell/laoly-dialog.js';
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
app.liLanguage={get:()=> 'vi'};
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
 selectBookmarkTab:()=>{}
};
app.liBookmarks={toggle:()=>true};
app.liNotes={openDetail:()=>true,deleteFromReact:()=>true};
app.LiSpellPractice={getT02Status:()=>null};
app.liBuddyEngine={choose:(i:number)=>({text:i===0?'Chọn cách học phù hợp với câu hỏi.':'Thử một bài luyện ngắn.',showChallenge:false})};
const root=document.getElementById('visual-root')!;
const buddyRoot=document.getElementById('buddy-modal')!;
if(viewName==='buddy') {
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
} else {
 root.parentElement!.id=viewName==='guide'?'page-guide':viewName==='library'?'page-library':'page-dashboard';
 createRoot(root).render(viewName==='guide'?<Guide/>:viewName==='library'?<Library/>:<Journal/>);
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
 if(viewName==='journal'){
  const chart=select('.li-diary-month .li-legacy-chart'),cal=select('.li-diary-calendar');
  assert('real-DS-chart-visible',Boolean(chart&&bounds(chart)!.w>200),bounds(chart));
  assert('chart-under-calendar',Boolean(chart&&cal&&chart.getBoundingClientRect().top>cal.getBoundingClientRect().bottom),
    {chart:bounds(chart),calendar:bounds(cal)});
  assert('chart-actually-above-first-fold',Boolean(chart&&chart.getBoundingClientRect().top<690),bounds(chart));
  assert('seven-day-chart',document.querySelectorAll('.li-legacy-chart-bars button').length===7);
  assert('thirty-month-dates',document.querySelectorAll('.li-diary-calendar button').length===30);
 } else if(viewName==='guide'){
  const filter=select('[data-li-molecule="filter-group"]'),mentor=select('.guide-margin-note');
  assert('canonical-filter-present',Boolean(filter),bounds(filter));
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
  assert('thirteen-methods',document.querySelectorAll('.guide-method-entry').length===13);
 } else if(viewName==='library'){
  const titles=[...document.querySelectorAll('.library-saved-shortlist .library-list-copy strong')];
  assert('saved-bookmarks-have-rows',titles.length>0);
  const resumeTitle=select('.library-resume-feature .library-list-item .library-list-copy');
  assert('resume-title-full-width',Boolean(resumeTitle&&resumeTitle.getBoundingClientRect().width>=250),bounds(resumeTitle));
  assert('bookmark-title-usable-width',titles.every(n=>n.getBoundingClientRect().width>=170),
    titles.map(bounds));
 } else if(viewName==='buddy'){
  const btns=[...document.querySelectorAll('#buddy-modal .buddy-actions .li-ds-button')];
  assert('conversation-and-actions-rendered',Boolean(select('#buddy-text'))&&btns.length===4);
  assert('actions-fit-viewport',btns.length>0&&btns.every(n=>{
    const r=n.getBoundingClientRect();return r.left>=0&&r.right<=windowWidth+2;
   }),btns.map(bounds));
 }
 const ok=checks.length>0&&checks.every(c=>c.pass);
 const report={status:ok?'LI_VISUAL_QA_PASS':'LI_VISUAL_QA_FAIL',
               view:viewName,viewport:windowWidth,checks};
 document.getElementById('qa-report')!.textContent=JSON.stringify(report);
},1400);
