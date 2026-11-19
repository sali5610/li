import {useId,useMemo,useState} from 'react';
import type {FormEvent} from 'react';
import {searchPilot} from '../../../docs/ontology/search/offline-search.mjs';
import type {SearchKind,SearchLocale,SearchResult} from '../../../docs/ontology/search/offline-search.mjs';
import {pilotIndex} from './pilot-index';
import {inspectSearchRoute} from '../../../docs/ontology/search/routes/route-readiness.mjs';
import auditedNativeRoutes from '../../../docs/ontology/search/routes/native-route-candidates.v0.1.json';
import {buildOfflineCompanionIndex,resolveOfflineCompanion} from '../../../docs/ontology/companion/offline-context.mjs';
import companionRegistry from '../../../docs/ontology/companion/pilot-context.v0.1.json';
import companionTemplates from '../../../docs/ontology/companion/response-templates.v0.1.json';
import methodFit from '../../../docs/ontology/pedagogy/method-fit.v0.1.json';
import methodCatalog from '../../../docs/ontology/pedagogy/techniques.v0.2.json';
import academicGraph from '../../../docs/ontology/academic/demo.graph.v0.1.json';

const companionIndex=buildOfflineCompanionIndex({
 contextRegistry:companionRegistry,templates:companionTemplates,academicGraph,
 pedagogyFits:methodFit,methodCatalog,routeAudit:auditedNativeRoutes
});
type SearchSnapshot={draft:string;submitted:string;kind:SearchKind|null};

type Copy={
 title:string;eyebrow:string;subtitle:string;searchLabel:string;placeholder:string;search:string;clear:string;
 filterLabel:string;allKinds:string;draftLabel:string;previewOnly:string;empty:string;found:(n:number)=>string;
 source:string;why:string;relations:string;noRelations:string;notPlayable:string;locked:string;unreviewed:string;
 unknown:string;localeLabel:string;help:string;routeCodeOnly:string;
 explore:string;back:string;mentor:string;mentorBoundary:string;relationCaveat:string;
};
const copy:Record<SearchLocale,Copy>={
 vi:{
 title:'Tìm trong tri thức li.',eyebrow:'Thử nghiệm nội bộ · ONT-04B1',
 subtitle:'Chỉ tra cứu dữ liệu mẫu đã dẫn nguồn. Chưa phải tính năng tìm kiếm trong app.',
 searchLabel:'Từ khóa, ID hoặc tên khái niệm',placeholder:'Ví dụ: L09-1-2, T06, khoa học dữ liệu',
 search:'Tìm',clear:'Xóa',filterLabel:'Loại kết quả',allKinds:'Tất cả loại',
 draftLabel:'Hiện bản đề xuất để kiểm thử',previewOnly:'Bản đề xuất / chưa phát hành',
 empty:'Chưa tìm thấy trong dữ liệu mẫu. Không có nghĩa là chương trình học không có nội dung này.',
 found:n=>String(n)+' kết quả trong dữ liệu mẫu',source:'Xem nguồn gốc',why:'Vì sao có kết quả này',
 relations:'Quan hệ đã xác minh',noRelations:'Không có quan hệ đã xác minh cho thực thể này',
 notPlayable:'Chưa có đường dẫn bài học đã phát hành',locked:'Nội dung được khóa biên tập, không phải bài đã phát hành',
 unreviewed:'Bản nháp / đề xuất',unknown:'Tham chiếu nguồn, chưa xác minh route',
 localeLabel:'Ngôn ngữ',help:'Không dùng dữ liệu cá nhân. Kết quả không chấm điểm hay mở đáp án.',
 routeCodeOnly:'Có màn bài trong mã nguồn, nhưng CHƯA duyệt mở từ Tra Cứu. Không có nút mở bài.',
 explore:'Xem thực thể',back:'Quay lại kết quả trước',mentor:'Hỏi Lão Lý',
 mentorBoundary:'Gợi ý biên tập, không phải lời giải, điểm số hay xác nhận bài đã phát hành.',
 relationCaveat:'Quan hệ nguồn đã kiểm tra; không mặc định là điều kiện tiên quyết.'
 },
 en:{
 title:'Search li. knowledge',eyebrow:'Internal research · ONT-04B1',
 subtitle:'Source-linked sample data only. This is not the released app search.',
 searchLabel:'Keyword, ID or concept title',placeholder:'Try: L09-1-2, T06, Data Science',
 search:'Search',clear:'Clear',filterLabel:'Result type',allKinds:'All types',
 draftLabel:'Show proposed records for review',previewOnly:'Proposed / not released',
 empty:'No match in this limited sample. This does not mean the curriculum lacks the topic.',
 found:n=>String(n)+' results in the sample',source:'Inspect source',why:'Why this result',
 relations:'Reviewed relationships',noRelations:'No reviewed relationships for this record',
 notPlayable:'No verified released lesson route',locked:'Editorial content locked, not a published lesson',
 unreviewed:'Draft / proposed',unknown:'Source reference, route unverified',
 localeLabel:'Language',help:'No personal data. Results cannot grade work or reveal answer keys.',
 routeCodeOnly:'A native lesson screen exists in source, but Search access is NOT approved. No Open lesson action.',
 explore:'Explore entity',back:'Back to previous results',mentor:'Ask Lão Lý',
 mentorBoundary:'Editorial prompts only; not a solution, grade, or proof of lesson release.',
 relationCaveat:'Source-reviewed relation, not automatically a prerequisite.'
 }
};
const kinds:Array<{value:SearchKind;vi:string;en:string}>=[
 {value:'Field',vi:'Ngành',en:'Field'},{value:'Lesson',vi:'Bài',en:'Lesson'},
 {value:'Concept',vi:'Khái niệm',en:'Concept'},{value:'TechniqueDefinition',vi:'Thần chú L2',en:'L2 Technique'},
 {value:'SourceProgramme',vi:'Chương trình nguồn',en:'Source programme'},
 {value:'SourceCourse',vi:'Môn nguồn',en:'Source course'},{value:'Course',vi:'Môn li.',en:'li. Course'}
];
function labelKind(kind:SearchKind,locale:SearchLocale){
 const result=kinds.find(x=>x.value===kind);
 return result ? result[locale] : kind;
}
function safeExternalSource(url:string){
 try {const p=new URL(url);return p.protocol==='https:'?p.href:null;}catch{return null;}
}
function SearchResultItem({result,locale,t,onExplore}:{result:SearchResult;locale:SearchLocale;t:Copy;onExplore:(id:string)=>void}){
 const [mentorOpen,setMentorOpen]=useState(false);
 const [expanded,setExpanded]=useState(false);
 const related=result.related;
 const source=safeExternalSource(result.provenance.sourceUrl);
 const status=result.readiness.state==='po_content_locked_not_released_by_this_index'?t.locked:
  result.reviewState==='proposed'?t.unreviewed:result.kind==='Lesson'?t.notPlayable:t.unknown;
 const relId='rel-'+result.id.replace(/[^a-z0-9-]/gi,'-');
 const mentorId='mentor-'+result.id.replace(/[^a-z0-9-]/gi,'-');
 const lessonId=result.kind==='Lesson'?result.id.replace(/^lesson:/,''):null;
 // Only source-attested, non-proposed lesson IDs get editorial, no-spoiler prompts.
 const mentor=lessonId&&result.reviewState!=='proposed'&&companionIndex.lessons.has(lessonId)
  ?resolveOfflineCompanion(companionIndex,{lessonId,locale,stage:'concept'}):null;
 // Source-code presence can explain the audit, never authorize a released route.
 // These fields are versioned read-only research fixtures, NOT user permissions.
 const routeAudit=result.kind==='Lesson'
  ?inspectSearchRoute(auditedNativeRoutes,result.id.replace(/^lesson:/,''))
  :null;
 const nativeCodeOnly=routeAudit?.state==='native_code_present_release_unverified'&&
  routeAudit.nativeCodeKnown&&routeAudit.navigationPermitted===false;
 return <li className="search-result" data-result-id={result.id}>
  <article aria-label={result.localizedTitle}>
   <div className="result-head">
    <span className="entity-kind">{labelKind(result.kind,locale)}</span>
    <span className="result-state">{status}</span>
   </div>
   <h2>{result.localizedTitle}</h2>
   <p className="result-id"><code>{result.id}</code></p>
   <p className="result-meta">{t.why}: {result.whyShown}</p>
   <p className="result-meta">{result.provenance.sourceSection} · {result.provenance.checkedOn}</p>
   {nativeCodeOnly&&<p className="result-meta" data-route-audit="native-code-only" role="note">{t.routeCodeOnly}</p>}
   <div className="result-actions">
    {source?<a className="source-link" href={source} target="_blank" rel="noopener noreferrer">{t.source}<span aria-hidden="true"> ↗</span></a>:<span>{t.unknown}</span>}
    <button className="text-control" type="button" aria-expanded={expanded} aria-controls={relId} onClick={()=>setExpanded(x=>!x)}>
     {t.relations} ({related.length})
    </button>
    {mentor?.status==='read_only_editorial_context'&&<button className="text-control" type="button" aria-expanded={mentorOpen}
      aria-controls={mentorId} onClick={()=>setMentorOpen(x=>!x)}>{t.mentor}</button>}
   </div>
   {expanded&&<div className="related" id={relId}>
     {related.length?<ul>{related.map(item=><li key={item.id}>
       <strong>{item.title}</strong> <code>{item.id}</code>
       <span className="related-explainer">{item.whyShown}</span>
       {pilotIndex.index.has(item.id)&&<button className="text-control relation-link" type="button"
        aria-label={t.explore+': '+item.id} onClick={()=>onExplore(item.id)}>{t.explore}</button>}
     </li>)}</ul>:<p>{t.noRelations}</p>}
     {related.length>0&&<p className="result-meta">{t.relationCaveat}</p>}
   </div>}
   {mentorOpen&&mentor?.status==='read_only_editorial_context'&&<section className="mentor-context" id={mentorId}
     role="region" aria-label={t.mentor}>
      <p className="mentor-actor">{mentor.actor}</p>
      <p>{mentor.context?.intro}</p>
      <ul>{mentor.actions.map(action=><li key={action.intent}>
       <strong>{action.label}</strong> — {action.response}
      </li>)}</ul>
      <p className="result-meta">{t.mentorBoundary}</p>
   </section>}
  </article>
 </li>;
}
/**
 * Isolated React adapter for ONT-04A. Never offers an app route or user-private retrieval.
 * No data writes, no navigation actions beyond explicit trusted external source links.
 */
export function SearchIsland({embedded=false}:{embedded?:boolean}){
 const [locale,setLocale]=useState<SearchLocale>('vi');
 const [draft,setDraft]=useState('');
 const [submitted,setSubmitted]=useState('');
 const [kind,setKind]=useState<SearchKind|null>(null);
 const [reviewMode,setReviewMode]=useState(false);
 const [trail,setTrail]=useState<SearchSnapshot[]>([]);
 const formId=useId();
 const t=copy[locale];
 const result=useMemo(()=>submitted?searchPilot(pilotIndex,submitted,{
   locale,kind,includeCandidates:reviewMode,limit:10,expandHops:2
 }):null,[submitted,kind,locale,reviewMode]);
 function onSubmit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setSubmitted(draft.trim());setTrail([]);
 }
 function clear(){setDraft('');setSubmitted('');setKind(null);setReviewMode(false);setTrail([]);}
 function explore(id:string){
  // A reviewed relation is inspectable, not a permission to open an unpublished lesson.
  if(!pilotIndex.index.has(id))return;
  const lookup=searchPilot(pilotIndex,id,{locale,includeCandidates:reviewMode,limit:10,expandHops:2});
  if(!lookup.results.some(item=>item.id===id))return;
  setTrail(previous=>[...previous.slice(-7),{draft,submitted,kind}]);
  setDraft(id);setSubmitted(id);setKind(null);
 }
 function goBack(){
  const previous=trail[trail.length-1];
  if(!previous)return;
  setTrail(trail.slice(0,-1));
  setDraft(previous.draft);setSubmitted(previous.submitted);setKind(previous.kind);
 }
 const Container=embedded?'div':'main';
 return <Container className="search-page" aria-labelledby={formId+'-title'} lang={locale} data-li-search-island="true">
  <header>
   <p className="eyebrow">{t.eyebrow}</p>
   <h1 id={formId+'-title'}>{t.title}</h1>
   <p className="intro">{t.subtitle}</p>
   <div className="locale-control">
    <label htmlFor={formId+'-locale'}>{t.localeLabel}</label>
    <select id={formId+'-locale'} value={locale} onChange={e=>setLocale(e.currentTarget.value as SearchLocale)}>
     <option value="vi">Tiếng Việt</option><option value="en">English</option>
    </select>
   </div>
  </header>
  <form role="search" className="search-form" onSubmit={onSubmit} noValidate>
   <label htmlFor={formId+'-query'}>{t.searchLabel}</label>
   <div className="search-action">
    <input id={formId+'-query'} type="search" value={draft} onChange={e=>setDraft(e.currentTarget.value)}
      maxLength={128} autoComplete="off" spellCheck={false} placeholder={t.placeholder}/>
    <button className="primary" type="submit" disabled={!draft.trim()}>{t.search}</button>
    <button type="button" onClick={clear}>{t.clear}</button>
   </div>
   <label htmlFor={formId+'-kind'}>{t.filterLabel}</label>
   <select id={formId+'-kind'} value={kind||''} onChange={e=>setKind(e.currentTarget.value?e.currentTarget.value as SearchKind:null)}>
    <option value="">{t.allKinds}</option>
    {kinds.map(item=><option key={item.value} value={item.value}>{item[locale]}</option>)}
   </select>
   <label className="checkbox-row">
    <input type="checkbox" checked={reviewMode} onChange={e=>setReviewMode(e.currentTarget.checked)}/>
    <span>{t.draftLabel}</span>
   </label>
   <p className="help">{t.help}</p>
  </form>
  {submitted&&<section className="search-outcome" aria-label={t.found(result?.results.length||0)}>
    {trail.length>0&&<button type="button" className="back-control" onClick={goBack}>{t.back}</button>}
    <p role="status" aria-live="polite" className="search-status">
     {result?.results.length?t.found(result.results.length):t.empty}
    </p>
    {reviewMode&&<p className="research-warning" role="note">{t.previewOnly}</p>}
    <ul className="search-list">
     {result?.results.map(item=><SearchResultItem key={item.id} result={item} locale={locale} t={t} onExplore={explore}/>)}
    </ul>
   </section>}
 </Container>;
}
