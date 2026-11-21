import {openRoute} from './app-router.js';
import curriculum from '../../../../content/curriculum/legacy-catalog.v1.json';
import {personalStudyRoute} from '../learning/released-lessons.js';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,Card,FilterGroup,Heading,IconButton,InlineFeedback,SearchField,Text,LiIcon} from '../../../../design-system/react/index';
// Retain the canonical legacy stylesheet for the existing staging bundle contract;
// the visible field-guide rows below no longer render legacy MethodTile cards.
import '../../../../design-system/react/legacy.css';
import './guide-library.css';
import {GuideDetail,NoteDetail,ConfirmNoteAction} from './detail-practice.js';

/* Single invited app. The canonical legacy authoring and account-backed
 * business logic are accessed through explicit ports; React owns all visible
 * markup for Guide, Library, Continue and Collection. */
type Method={id:string;title:string;original:string;purpose:string;category:string;categoryKey:string};
type MethodsView={
 methods:Method[];categories:{key:string;label:string}[];suggestions:string[]|null;
 modeLabel:string;guide:string
};
type Lesson={id:string;route:string;title:string;status:string;detail:string;saved:boolean};
type T02Status={dueAt:number|null;awaitingRating:boolean;reviewCount:number};
type Problem={kind:string;key:string;title:string;detail:string;saved:boolean};
type Note={id:string;type:'case'|'idea';title:string;body:string;date:string;sortDate:string;correct?:boolean};
type Bookmark={kind:string;id:string;title:string;route:string|null;date:string};
type LibraryView={
 lessons:Lesson[];problems:Problem[];cases:Note[];ideas:Note[];
 lessonBookmarks:Bookmark[];questionBookmarks:Bookmark[];
 collectionFilter:'all'|'case'|'idea';bookmarkTab:'lesson'|'question';storageAvailable:boolean
};
type MethodsPort={getView:()=>MethodsView;open:(id:string,practice?:boolean)=>void};
type GuideUiPort={getState:()=>{query:string;category:string}|null};
declare global{interface Window{liGuideUi?:GuideUiPort;}}
type LibraryPort={
 getView:()=>LibraryView;renderHome:()=>void;renderResume:()=>void;renderCollection:()=>void;
 openProblemEntry:(kind:string,key:string)=>void;openSavedQuestion:(id:string)=>void;
 removeSavedQuestion:(id:string)=>void;selectBookmarkTab:(type:string)=>void;
 setCollectionFilter:(next:string)=>void;
 registerPersonalLessons?:(items:{id:string;route:string;title:string}[])=>number
};
type AppWindow=Window&{
 liMethods?:MethodsPort;liLibraryShelf?:LibraryPort;
 liBookmarks?:{toggle:(kind:string,id:string)=>boolean};
 liNotes?:{openDetail:(kind:string,id:string)=>boolean;deleteNote:(kind:string,id:string)=>boolean;
  deleteFromReact:(kind:string,id:string)=>boolean};
 liLanguage?:{get:()=>string};
 LiSpellPractice?:{getT02Status?:(id:string)=>T02Status|null};
};
const app=window as AppWindow;
// The canonical Catalog and staging allowlist are the only source of
// personal-lesson titles/routes. The private history stays in library-hub.
const personalLessonEntries=curriculum.groups.flatMap(group=>group.fields.flatMap(field=>
 field.courses.flatMap(course=>course.lessons.flatMap(lesson=>{
  const route=personalStudyRoute(lesson.id);
  return route?[{id:lesson.id,route,title:lesson.title}]:[];
 }))));
const placeholderView:LibraryView={
 lessons:[],problems:[],cases:[],ideas:[],lessonBookmarks:[],questionBookmarks:[],
 collectionFilter:'all',bookmarkTab:'lesson',storageAvailable:true
};
const isEnglish=()=>app.liLanguage?.get?.()==='en';
const copy=(vi:string,en:string)=>isEnglish()?en:vi;
function useMethods(){
 const [view,setView]=useState<MethodsView>(()=>app.liMethods!.getView());
 useEffect(()=>{
  const refresh=()=>setView(app.liMethods!.getView());
  window.addEventListener('li:study-mode-applied',refresh);
  window.addEventListener('li:localechange',refresh);
  window.addEventListener('li:personal-sync-applied',refresh);
  return ()=>{
   window.removeEventListener('li:study-mode-applied',refresh);
   window.removeEventListener('li:localechange',refresh);
   window.removeEventListener('li:personal-sync-applied',refresh);
  };
 },[]);
 return view;
}
export function Guide(){
 const view=useMethods();
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('Tất cả');
 useEffect(()=>{
  const port:GuideUiPort={getState:()=>document.documentElement.classList.contains('li-auth-verified')
   ?{query,category}:null};
  window.liGuideUi=port;
  return()=>{if(window.liGuideUi===port)delete window.liGuideUi;};
 },[query,category]);
 const q=query.trim().toLocaleLowerCase('vi');
 const visible=view.methods.filter(method=>{
  if(category!=='Tất cả'&&method.categoryKey!==category)return false;
  return !q||[method.id,method.title,method.original,method.purpose,method.category,method.categoryKey]
   .join(' ').toLocaleLowerCase('vi').includes(q);
 });
 const grouped=view.categories.filter(item=>item.key!=='Tất cả').map(group=>({
  ...group,items:visible.filter(method=>method.categoryKey===group.key)
 })).filter(group=>group.items.length);
 const icon=(categoryKey:string)=>{
  if(categoryKey==='Luận Chứng Thuật')return <LiIcon name="layers" size={21}/>;
  if(categoryKey==='Phá Giải Thuật')return <LiIcon name="sparkles" size={21}/>;
  if(categoryKey==='Minh Giải Thuật')return <LiIcon name="info" size={21}/>;
  if(categoryKey==='Tự Chủ Thuật')return <LiIcon name="star" size={21}/>;
  return <LiIcon name="book-open" size={21}/>;
 };
 return <div className="section-shell li-react-guide" data-li-react-screen="guide">
  <header className="guide-opening">
   <div className="guide-opening-copy">
    <Heading level={1} role="headline" className="display-title">{copy('Sổ Tay Thần Chú','Learning Spells')}</Heading>
    <Text role="body" className="intro">{copy(
     '13 phương pháp để học, ghi nhớ và suy nghĩ. Mỗi pháp danh đều có tên học thuật gốc đi kèm.',
     '13 evidence-informed techniques for learning, memory and reasoning, with their academic names.'
    )}</Text>
   </div>
   <div className="guide-opening-mark" aria-hidden="true">
    <LiIcon name="book-open" size={40}/><span>01—13</span>
   </div>
  </header>
  <div className="guide-catalog-layout">
   <div className="guide-index">
    <div className="guide-find">
     <SearchField inputId="li-react-method-search"
      label={copy('Tìm trong 13 phương pháp','Search all 13 methods')}
      value={query} onQueryChange={setQuery} showSubmit={false}
      submitLabel={copy('Tìm','Search')} clearLabel={copy('Xóa tìm kiếm','Clear search')}
      placeholder={copy('Method of Loci, T01, Triệu Ức…','Method of Loci, T01…')}/>
     <FilterGroup label={copy('Bộ lọc nhóm kỹ thuật','Method category filters')}
      options={view.categories.map(item=>({value:item.key,label:item.label}))}
      selected={[category]} onChange={next=>setCategory(next[0]||'Tất cả')}
      multiple={false} allowEmpty={false}/>
     <Text role="support" className="guide-result-count" aria-live="polite">
      {copy('Hiển thị ','Showing ')}{visible.length}/{view.methods.length}
      {q?copy(' · kết quả tìm kiếm',' · search results'):category!=='Tất cả'?
       copy(' · theo nhóm',' · filtered'):(' · '+view.modeLabel)}
     </Text>
    </div>
    <div className="guide-index-contents">
     {grouped.map(group=><section key={group.key} className="guide-chapter"
      aria-label={group.label}>
      <div className="guide-chapter-heading">
       <div className="guide-chapter-icon" aria-hidden="true">{icon(group.key)}</div>
       <Heading level={2} role="titleMedium">{group.label}</Heading>
       <Text role="support">{group.items.length}</Text>
      </div>
      <div className="guide-method-list">
       {group.items.map(method=><button key={method.id} type="button"
        className="guide-method-entry" onClick={()=>app.liMethods?.open(method.id)}
        aria-label={method.id+' · '+method.title+' · '+method.original}>
        <span className="guide-method-number">{method.id}</span>
        <span className="guide-method-description">
         <strong>{method.title}</strong>
         <span className="guide-method-original">{method.original}</span>
         <span className="guide-method-purpose">{method.purpose}</span>
         {view.suggestions?.includes(method.id)&&<span className="guide-method-recommendation">
          <LiIcon name="star" size={13}/> {copy('Hợp nhịp học hiện tại','Suggested for your learning rhythm')}
         </span>}
        </span>
        <LiIcon name="arrow-right" size={20}/>
       </button>)}
      </div>
     </section>)}
     {!visible.length&&<div className="guide-no-results">
      <InlineFeedback tone="info" message={copy(
       'Không tìm thấy. Thử đổi bộ lọc hoặc tìm bằng tên học thuật.',
       'Nothing found. Try a different filter or an academic method name.'
      )}/>
      <Button variant="secondary" onClick={()=>{setQuery('');setCategory('Tất cả');}}>
       {copy('Xóa bộ lọc','Clear filters')}</Button>
     </div>}
    </div>
   </div>
   <aside className="guide-margin-note" aria-label={copy('Gợi ý từ Lão Lý','Elder Ly guidance')}>
    <img className="guide-mentor-illustration" src="./assets/laoly-guide-rest.png"
     width="1024" height="1024" loading="lazy"
     alt={copy('Lão Lý ngái ngủ','Sleepy mentor Elder Ly')}/>
    <div className="kicker">{copy('LÃO LÝ NHẮC KHẼ','MENTOR NOTE')}</div>
    <Text role="body">{view.guide}</Text>
    <Text role="support">{copy('Chọn một phương pháp để xem hướng dẫn và thử thực hành.',
     'Choose a method to read its guide and try a practice.')}</Text>
   </aside>
  </div>
 </div>;
}
function useLibrary(){
 const [view,setView]=useState<LibraryView>(()=>app.liLibraryShelf?.getView()||placeholderView);
 useEffect(()=>{
  const update=()=>setView(app.liLibraryShelf?.getView()||placeholderView);
  for(const name of ['li:library-view-changed','li:localechange','li:personal-sync-applied',
   'li:lesson-cloud-state','li:lesson-attempt-changed','li:activity'])window.addEventListener(name,update);
  return ()=>{for(const name of ['li:library-view-changed','li:localechange',
   'li:personal-sync-applied','li:lesson-cloud-state','li:lesson-attempt-changed','li:activity'])
   window.removeEventListener(name,update);};
 },[]);
 return view;
}
function ShelfHeader({id,title,target,action}:{
 id:string;title:string;target:string;action:string
}){
 return <header className="library-group-header">
  <Heading id={id} level={2} role="titleMedium">{title}</Heading>
  <Button variant="ghost" className="library-text-link"
   onClick={()=>openRoute(target)}>{action} <LiIcon name="arrow-right" size={17}/></Button>
 </header>;
}
function Empty({message,route,action}:{
 message:string;route?:string;action?:string
}){
 return <div className="li-library-empty"><Text role="support">{message}</Text>
  {route&&<Button variant="secondary" onClick={()=>openRoute(route)}>{action||copy('Khám phá','Explore')}</Button>}
 </div>;
}
function LessonRows({lessons,limit}:{
 lessons:Lesson[];limit?:number
}){
 // Read only the existing per-lesson T02 schedule; refresh when returning
 // to Quay Lại and as the clock crosses a due minute.
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{
  const refresh=()=>setNow(Date.now());
  const events=['li:route-changed','li:private-personal-change','li:personal-sync-applied',
   'li:lesson-sync-applied','focus','pageshow'];
  for(const name of events)window.addEventListener(name,refresh);
  document.addEventListener('visibilitychange',refresh);
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')refresh();},60_000);
  return()=>{
   window.clearInterval(timer);
   for(const name of events)window.removeEventListener(name,refresh);
   document.removeEventListener('visibilitychange',refresh);
  };
 },[]);
 const subset=limit?lessons.slice(0,limit):lessons;
 if(!subset.length)return <Empty message={copy('Chưa có bài học gần đây.','No recently opened lessons.')}
  route="catalog" action={copy('Mở Tàng Thư','Browse courses')}/>;
 return <div className="path-list li-react-shelf-list">
  {subset.map(item=>{
   const status=app.LiSpellPractice?.getT02Status?.(item.id);
   const needsRating=status?.awaitingRating===true;
   const due=!needsRating&&typeof status?.dueAt==='number'&&status.dueAt<=now;
   return <div className="path-item library-list-item" key={item.id}>
    <div className="library-list-copy">
     <strong>{item.title}</strong>
     <Text role="support">{item.id} · {item.status} · {item.detail}</Text>
     {(needsRating||due)&&<Text role="support" className="library-review-due">
      {needsRating?copy('T02 · Chờ tự đánh giá','T02 · Finish self-rating'):
       copy('T02 · Đến hạn ôn','T02 · Review due')}
     </Text>}
    </div>
    <Button variant="ghost" className="library-text-link" onClick={()=>openRoute(item.route)}>
     {copy('Tiếp tục','Continue')}
    </Button>
    <IconButton className="library-icon-action" icon="bookmark" aria-pressed={item.saved}
     label={(item.saved?copy('Bỏ lưu bài ','Unsave lesson '):copy('Lưu bài ','Save lesson '))+item.id}
     onClick={()=>app.liBookmarks?.toggle('lesson',item.id)}/>
   </div>;
  })}
 </div>;
}
function ProblemRows({problems,limit}:{
 problems:Problem[];limit?:number
}){
 const subset=limit?problems.slice(0,limit):problems;
 if(!subset.length)return <Empty message={copy('Chưa có tình huống nào đã xem.','No viewed scenarios yet.')}
  route="home" action={copy('Mở Gương Vạn Vấn','Visit the Mirror')}/>;
 return <div className="path-list li-react-shelf-list">
  {subset.map(item=><div className="path-item library-list-item" key={item.kind+item.key}>
   <div className="library-list-copy">
    <strong>{item.title}</strong>
    <Text role="support">{item.kind==='case'?'CASE · PHẢN CHỨNG':'PROBLEM · KHẢO CHỨNG'} · {item.detail}</Text>
   </div>
   <Button variant="ghost" className="library-text-link"
    onClick={()=>app.liLibraryShelf?.openProblemEntry(item.kind,item.key)}>
    {copy('Tiếp tục','Continue')}
   </Button>
   {item.kind==='case'&&<IconButton className="library-icon-action" icon="bookmark"
    label={item.saved?copy('Bỏ lưu case','Unsave case'):copy('Lưu case','Save case')}
    aria-pressed={item.saved}
    onClick={()=>app.liBookmarks?.toggle('case','sampling-bias-90')}/>}
  </div>)}
 </div>;
}
function NotePreview({note,kind}:{
 note?:Note;kind:'case'|'idea'
}){
 if(!note)return <Empty message={kind==='case'?
  copy('Chưa có Bút Ký. Thử Phản Chứng rồi lưu kết luận.','No case notes yet.'):
  copy('Chưa nhặt ý nào.','No captured ideas yet.')}/>;
 return <div className="library-preview">
  {kind==='case'&&<strong>{note.title}</strong>}
  <Text role="support">{note.date}{kind==='idea'?copy(' · Chưa xác minh',' · Unverified'):''}</Text>
  <Text role="body" className="library-clamp">{note.body}</Text>
  <Button variant="ghost" className="library-text-link"
   onClick={()=>app.liNotes?.openDetail(kind,note.id)}>{copy('Xem chi tiết','View details')}</Button>
 </div>;
}
export function Library(){
 const view=useLibrary();
 return <div className="section-shell li-react-library" data-li-react-screen="library">
  <Heading level={1} role="headline" className="display-title">{copy('Tủ Riêng','Private Library')}</Heading>
  <div className="library-workspace">
   <Card variant="flat-study" className="library-resume-feature" aria-labelledby="library-resume-heading">
    <ShelfHeader id="library-resume-heading" title={copy('Quay lại','Continue')}
     target="resume" action={copy('Hoạt động','Activity')}/>
    <div className="library-feature-grid">
     <div>
      <Heading level={3} role="titleSmall">{copy('Bài học gần nhất','Latest lesson')}</Heading>
      <LessonRows lessons={view.lessons} limit={1}/>
     </div>
     <div>
      <Heading level={3} role="titleSmall">{copy('Tình huống gần nhất','Latest scenario')}</Heading>
      <ProblemRows problems={view.problems} limit={1}/>
     </div>
    </div>
   </Card>
   <div className="library-workspace-columns">
    <section className="library-workspace-main" aria-labelledby="library-notes-heading">
     <ShelfHeader id="library-notes-heading" title={copy('Ghi chép','Notes')}
      target="collection" action={copy('Bộ sưu tập','Collection')}/>
     <div className="library-note-previews">
      <div className="library-note-preview">
       <Heading level={3} role="titleSmall">{copy('Bút Ký','Case Notes')}</Heading>
       <NotePreview note={view.cases[0]} kind="case"/>
      </div>
      <div className="library-note-preview">
       <Heading level={3} role="titleSmall">{copy('Ý đã nhặt','Captured Ideas')}</Heading>
       <NotePreview note={view.ideas[0]} kind="idea"/>
      </div>
     </div>
     <div className="library-create-actions">
      <Button variant="secondary" onClick={()=>openRoute('case')}>{copy('Viết Bút Ký','Write a Case Note')}</Button>
      <Button variant="secondary" onClick={()=>openRoute('capture')}>{copy('Nhặt ý','Capture an Idea')}</Button>
     </div>
    </section>
    <section className="library-saved-shortlist" aria-labelledby="library-saved-heading">
     <ShelfHeader id="library-saved-heading" title={copy('Dấu trang','Bookmarks')}
      target="bookmarks" action={copy('Xem tất cả','See all')}/>
     <BookmarkRows items={[...view.lessonBookmarks,...view.questionBookmarks].slice(0,3)}/>
    </section>
   </div>
   <section className="library-rhythm" aria-labelledby="library-journal-heading">
    <ShelfHeader id="library-journal-heading" title={copy('Nhật Ký','Journal')}
     target="dashboard" action={copy('Mở Nhật Ký','Open Journal')}/>
    <Text role="support">{copy('Nhịp học, nghỉ ngơi, vận động và hoạt động mỗi ngày.',
     'Daily learning, rest and activity.')}</Text>
   </section>
  </div>
 </div>;
}
function BookmarkRows({items}:{
 items:Bookmark[]
}){
 if(!items.length)return <Empty message={copy('Chưa lưu mục nào trong ngăn này.','No saved items in this drawer.')}/>;
 return <div className="path-list li-react-shelf-list">
  {items.map(item=><div className="path-item library-list-item" key={item.kind+item.id}>
   <div className="library-list-copy"><strong>{item.title}</strong>
    <Text role="support">{item.kind==='lesson'?copy('BÀI HỌC','LESSON'):
     item.kind==='case'?copy('CASE · PHẢN CHỨNG','CASE'):copy('CÂU HỎI','QUESTION')} · {item.date}</Text>
   </div>
   {item.kind==='question'?
    <Button variant="ghost" className="library-text-link" disabled={!item.route}
     onClick={()=>app.liLibraryShelf?.openSavedQuestion(item.id)}>
     {item.route?copy('Mở lại','Open'):copy('Chưa có điểm đến','Unavailable')}</Button>:
    <Button variant="ghost" className="library-text-link" onClick={()=>item.route&&openRoute(item.route)}
     disabled={!item.route}>{copy('Mở lại','Open')}</Button>}
   <IconButton className="library-icon-action" icon="bookmark"
    label={copy('Bỏ lưu','Remove bookmark')}
    onClick={()=>item.kind==='question'?app.liLibraryShelf?.removeSavedQuestion(item.id):
     app.liBookmarks?.toggle(item.kind,item.id)}/>
  </div>)}
 </div>;
}
export function Resume(){
 const view=useLibrary();
 return <div className="section-shell li-react-library" data-li-react-screen="resume">
  <Heading level={1} role="headline" className="display-title">{copy('Quay lại','Continue')}</Heading>
  <Text role="body" className="intro">{copy(
   'Tiếp tục bài học hoặc tình huống đã xem gần đây.',
   'Continue recently viewed lessons or scenarios.')}</Text>
  <div className="library-resume-layout">
   <div className="library-resume-stream">
    <section className="library-resume-section">
     <Heading level={2} role="titleMedium">{copy('Bài học gần đây','Recent lessons')}</Heading>
     <LessonRows lessons={view.lessons}/>
    </section>
    <section className="library-resume-section">
     <Heading level={2} role="titleMedium">{copy('Tình huống đã xem','Recently viewed scenarios')}</Heading>
     <ProblemRows problems={view.problems}/>
    </section>
   </div>
  </div>
 </div>;
}
export function Bookmarks(){
 const view=useLibrary();
 const tab=view.bookmarkTab;
 const tabClick=(next:'lesson'|'question')=>app.liLibraryShelf?.selectBookmarkTab(next);
 return <div className="section-shell li-react-library" data-li-react-screen="bookmarks">
  <Heading level={1} role="headline" className="display-title">{copy('Dấu trang','Bookmarks')}</Heading>
  <Text role="body" className="intro">{copy(
   'Những bài học và câu hỏi đã lưu để xem lại.',
   'Lessons and questions you saved for later.')}</Text>
  <section className="library-bookmarks-layout" aria-label={copy('Danh sách Dấu trang','Saved bookmarks')}>
   <div className="library-bookmark-tabs" role="tablist" aria-label={copy('Loại Dấu Trang','Bookmark type')}
    onKeyDown={event=>{
     const next=(event.key==='ArrowLeft'||event.key==='ArrowRight')?
      (tab==='lesson'?'question':'lesson'):
      event.key==='Home'?'lesson':event.key==='End'?'question':null;
     if(!next)return;
     event.preventDefault();tabClick(next);
     requestAnimationFrame(()=>document.getElementById('li-react-tab-'+next)?.focus());
    }}>
    {(['lesson','question'] as const).map(kind=><Button key={kind} variant="ghost"
     id={'li-react-tab-'+kind} role="tab" aria-selected={tab===kind}
     tabIndex={tab===kind?0:-1} onClick={()=>tabClick(kind)}
     className="library-bookmark-tab">{kind==='lesson'?copy('Bài học','Lessons'):copy('Câu hỏi','Questions')}</Button>)}
   </div>
   <div role="tabpanel" aria-labelledby={'li-react-tab-'+tab} tabIndex={0}>
    <BookmarkRows items={tab==='lesson'?view.lessonBookmarks:view.questionBookmarks}/>
   </div>
  </section>
 </div>;
}
function Collection(){
 const view=useLibrary();
 const [search,setSearch]=useState('');
 const filter=view.collectionFilter;
 const q=search.trim().toLocaleLowerCase('vi');
 const items=[...view.cases,...view.ideas]
  .sort((a,b)=>(Date.parse(b.sortDate)||0)-(Date.parse(a.sortDate)||0))
  .filter(item=>(filter==='all'||item.type===filter)&&
   (!q||[item.title,item.body,item.date].join(' ').toLocaleLowerCase('vi').includes(q)));
 return <div className="section-shell li-react-library" data-li-react-screen="collection">
  <Heading level={1} role="headline" className="display-title">{copy('Bộ sưu tập','Collection')}</Heading>
  <Text role="body" className="intro">{copy(
   'Bút Ký là kết luận sau Phản Chứng; Ý đã nhặt là điều bạn ghi lại nhưng chưa xác minh.',
   'Case Notes are revised conclusions; Captured Ideas are not yet verified.')}</Text>
  <div className="library-collection-layout">
   <div className="library-collection-main">
    <div className="library-collection-tools">
     <SearchField inputId="li-react-note-search"
      label={copy('Tìm ghi chép','Search notes')}
      value={search} onQueryChange={setSearch} showSubmit={false}
      submitLabel={copy('Tìm','Search')} clearLabel={copy('Xóa tìm kiếm','Clear search')}
      placeholder={copy('Tìm theo tiêu đề hoặc nội dung','Search title or content')}/>
     <FilterGroup label={copy('Lọc ghi chép','Filter notes')}
      options={[
       {value:'all',label:copy('Tất cả','All')},
       {value:'case',label:copy('Bút Ký','Case Notes')},
       {value:'idea',label:copy('Ý đã nhặt','Ideas')}
      ]} selected={[filter]} multiple={false} allowEmpty={false}
      onChange={next=>app.liLibraryShelf?.setCollectionFilter(next[0]||'all')}/>
     <Text role="support" className="library-result-count" aria-live="polite">
      {copy('Hiển thị ','Showing ')}{items.length}/{view.cases.length+view.ideas.length}
     </Text>
    </div>
    <div className="library-collection-list" aria-live="polite">
     {!items.length&&<div className="library-collection-empty">
      <Empty message={q||filter!=='all'?copy('Không có ghi chép phù hợp.','No matching notes.'):
       copy('Chưa có ghi chép được lưu.','No saved notes yet.')}/>
      {(q||filter!=='all')&&<Button variant="secondary" onClick={()=>{
       setSearch('');app.liLibraryShelf?.setCollectionFilter('all');
      }}>{copy('Xóa bộ lọc','Clear filters')}</Button>}
     </div>}
     {items.map(item=><article key={item.type+item.id} className="library-collection-entry">
      <div className="library-collection-entry-main">
       <div className="kicker">{item.type==='case'?
        copy('BÚT KÝ · KẾT LUẬN SAU PHẢN CHỨNG','CASE NOTE · REVISED CONCLUSION'):
        copy('Ý ĐÃ NHẶT · CHƯA XÁC MINH','CAPTURED IDEA · UNVERIFIED')}</div>
       {item.type==='case'&&<Heading level={3} role="titleSmall">{item.title}</Heading>}
       <Text role="body" className="library-entry-body">{item.body}</Text>
       <Text role="support">{copy('Lưu ngày ','Saved ')}{item.date}</Text>
      </div>
      <div className="library-note-actions">
       <Button variant="ghost" className="library-text-link" onClick={()=>app.liNotes?.openDetail(item.type,item.id)}>
        {copy('Mở ghi chép','Open note')} <LiIcon name="arrow-right" size={17}/></Button>
       <ConfirmNoteAction danger iconOnly
        label={copy('Xóa ghi chép: ','Delete note: ')+(item.type==='case'?item.title:item.body.slice(0,60))}
        description={copy('Xóa cả lịch sử phiên bản? Bạn có 7 giây để hoàn tác.',
         'Delete note and its history? Undo is available for 7 seconds.')}
        onConfirm={()=>Boolean(app.liNotes?.deleteFromReact(item.type,item.id))}/>
      </div>
     </article>)}
    </div>
   </div>
   <aside className="library-collection-side">
    <div className="kicker">{copy('GHI NHANH','QUICK CAPTURE')}</div>
    <Heading level={2} role="titleMedium">{copy('Thêm ghi chép','Add a Note')}</Heading>
    <Text role="support">{copy('Ghi lại kết luận từ Phản Chứng hoặc một ý tưởng mới.',
     'Save a conclusion from a case or capture a new idea.')}</Text>
    <div className="library-collection-actions">
     <Button variant="secondary" onClick={()=>openRoute('case')}>{copy('Viết Bút Ký','Write a Case Note')}</Button>
     <Button variant="secondary" onClick={()=>openRoute('capture')}>{copy('Nhặt ý mới','Capture an Idea')}</Button>
    </div>
   </aside>
  </div>
 </div>;
}
export function mountGuideAndLibrary(){
 const spellOwner=window as Window&{
  liReactGuideDetailMounted?:boolean;liReactLibraryMounted?:boolean;
  LiSpellPractice?:{refreshNative?:()=>void};
  liLibraryShelf?:{renderHome?:()=>void;renderResume?:()=>void;
   renderCollection?:()=>void;renderBookmarks?:()=>void};
  liNotes?:{renderDetail?:()=>void}
 };
 const definitions=[
  {route:'guide',component:<Guide/>},
  {route:'library',component:<Library/>},
  {route:'resume',component:<Resume/>},
  {route:'bookmarks',component:<Bookmarks/>},
  {route:'collection',component:<Collection/>},
  {route:'guideDetail',component:<GuideDetail/>},
  {route:'noteDetail',component:<NoteDetail/>}
 ];
 const slots=definitions.map(({route,component})=>{
  const page=document.getElementById('page-'+route);
  const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
  if(!page||!legacy)throw Error('REACT_'+route.toUpperCase()+'_HOST_MISSING');
  return {route,page,legacy,component};
 });
 if(!app.liMethods||!app.liLibraryShelf||!app.liBookmarks||!app.liNotes||
  !(window as Window&{LiSpellPractice?:unknown}).LiSpellPractice)
  throw Error('REACT_GUIDE_LIBRARY_OWNER_PORTS_MISSING');
 // Register invited-only routes with the existing private visit/bookmark owner
 // before any React Library screen reads its first snapshot.
 app.liLibraryShelf.registerPersonalLessons?.(personalLessonEntries);
 let mounted=false;
 let dispose:(()=>void)|null=null;
 const update=()=>{
  const allowed=document.documentElement.classList.contains('li-auth-verified');
  if(allowed&&!mounted){
   const roots=slots.map(({route,page,legacy,component})=>{
    const host=document.createElement('div');
    host.id='li-react-'+route+'-host';page.append(host);
    const root=createRoot(host);
    root.render(component);
    legacy.hidden=true;legacy.style.display='none';
    return {root,host,legacy};
   });
   // One visible exercise owner: pause native spell DOM rendering while
   // authenticated React Detail is mounted, without replacing its checker.
   spellOwner.liReactGuideDetailMounted=true;
   spellOwner.liReactLibraryMounted=true;
   mounted=true;
   dispose=()=>{
    spellOwner.liReactGuideDetailMounted=false;
    spellOwner.liReactLibraryMounted=false;
    roots.forEach(({root,host,legacy})=>{
     root.unmount();host.remove();legacy.hidden=false;legacy.style.removeProperty('display');
    });
    spellOwner.LiSpellPractice?.refreshNative?.();
    // Native HTML remains a safe fallback but is rebuilt only when React
    // really unmounts, rather than on every synced learner update.
    spellOwner.liLibraryShelf?.renderHome?.();
    spellOwner.liLibraryShelf?.renderResume?.();
    spellOwner.liLibraryShelf?.renderCollection?.();
    spellOwner.liLibraryShelf?.renderBookmarks?.();
    spellOwner.liNotes?.renderDetail?.();
   };
  }else if(!allowed&&mounted){
   dispose?.();dispose=null;mounted=false;
  }
 };
 const observer=new MutationObserver(update);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 update();
 return ()=>{observer.disconnect();dispose?.();};
}
