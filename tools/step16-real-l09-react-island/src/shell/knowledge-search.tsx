import React,{useEffect,useRef,useState} from 'react';
import {openRoute,goBack,hasRoute} from './app-router.js';
import {useDiscoveryLocale,localized} from './discovery-locale.js';
import {personalStudyRoute} from '../learning/released-lessons.js';
import {searchPersonalStudy} from '../learning/staging-draft-preview.js';
import {createRoot} from 'react-dom/client';
import {motion,useReducedMotion} from 'motion/react';
import {Button,Heading,InlineFeedback,ListRow,SearchField,Text} from '../../../../design-system/react/index';

type Relation={id:string;title:string;label:string;kind:string;lessonId?:string;
 reason?:string;reasonLocalized?:string;relation?:string;sourceUrl?:string;sourceType?:string};
type Answerability={level:'direct'|'related'|'outcome_match';reason:string;
 reasonLocalized?:{vi:string;en:string};sourceUrl?:string;
 evidenceStatus:'editorial_mapped_to_reviewed_learning_outcome'|
 'reviewed_lesson_outcome_text_not_independent_claim'};
type KnowledgeItem={id:string;title:string;kind:string;lessonId?:string;contentState?:string;
 sourceUrl?:string;links:Relation[];context?:string;answerability?:Answerability};
type KnowledgeResponse={status:string;results:KnowledgeItem[]};
type KnowledgeClient={searchKnowledge:(query:string)=>Promise<KnowledgeResponse>};
type CatalogLesson={id:string;title:string;route?:string;published?:boolean};
type CatalogGroup={title:string;fields?:{name:string;source?:string;courses?:{title:string;lessons?:CatalogLesson[]}[]}[]};
type MentorContext={id:string;kind:string;title:string;lessonId?:string;links:Relation[]};
type SearchWindow=Window&{LI_CATALOG_DATA?:CatalogGroup[];openLaoLy?:(trigger?:HTMLElement|null)=>void;
 liSearch?:{render:(query:string)=>void;getStatus:()=>string;getQuery:()=>string;openLesson:(id:string)=>boolean;
 getMentorContext:()=>MentorContext|null}};

const app=window as SearchWindow;
const routes=new Map<string,string>();
const published:KnowledgeItem[]=[];
for(const group of Array.isArray(app.LI_CATALOG_DATA)?app.LI_CATALOG_DATA:[]){
 for(const field of group.fields||[])for(const course of field.courses||[])for(const lesson of course.lessons||[]){
  if(lesson.published!==true||!/^lessonL\d{2}$/.test(lesson.route||''))continue;
  routes.set(lesson.id,lesson.route!);
  published.push({id:lesson.id,lessonId:lesson.id,title:lesson.title,kind:'Lesson',
   context:[group.title,field.name,course.title].filter(Boolean).join(' · '),
   sourceUrl:field.source,links:[]});
 }
}
const clean=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/đ/gi,'d').toLocaleLowerCase('vi').replace(/\s+/g,' ').trim();
const sourceIsSafe=(url?:string)=>typeof url==='string'&&url.startsWith('https://');

function availableRoute(id:string):string|undefined{
 return routes.get(id)||personalStudyRoute(id)||undefined;
}
function openLesson(id:string){
 const route=availableRoute(id);
 return !!route&&hasRoute(route)&&openRoute(route);
}
const kindCopy:Record<string,string>={
 Lesson:'Bài có nội dung',Concept:'Khái niệm đã đối chiếu',Course:'Đề cương môn',
 Field:'Lĩnh vực',DomainGroup:'Nhóm ngành'
};
const englishKind:Record<string,string>={
 Lesson:'Lesson',Concept:'Concept',Course:'Course',Field:'Field',DomainGroup:'Domain group'
};
let mentorFocus:MentorContext|null=null;
let latestQuery='';
function withPersonalLessons(query:string,source:KnowledgeResponse):KnowledgeResponse{
 const personal=searchPersonalStudy(query).map(item=>({
  id:item.id,lessonId:item.id,title:item.title,kind:'Lesson',
  contentState:'personal_study',context:item.context,links:[] as Relation[]
 }));
 if(!personal.length)return source;
 const exists=new Set(personal.map(item=>item.id));
 return {status:'personal_match',results:[...personal,
  ...(Array.isArray(source.results)?source.results:[]).filter(item=>
   !exists.has(item.lessonId||item.id))]};
}
let latestStatus='loading';
let setExternalQuery:(value:string)=>void=()=>{};
function fallback(query:string):KnowledgeResponse{
 const q=clean(query);
 const results=published.map(item=>{
  const title=clean(item.title),id=clean(item.id),context=clean(item.context||'');
  const score=id===q?120:title.includes(q)?75:id.includes(q)?65:
   q.split(' ').every(token=>(title+' '+id+' '+context).includes(token))?15:-1;
  return {item,score};
 }).filter(entry=>entry.score>=0).sort((a,b)=>b.score-a.score).slice(0,14)
  .map(entry=>entry.item);
 return {status:'fallback',results};
}
function KnowledgeSearch(){
 const locale=useDiscoveryLocale();
 const L=(vi:string,en:string)=>localized(locale,vi,en);
 const reduced=useReducedMotion();
 const [query,setQuery]=useState('');
 const [submitCount,setSubmitCount]=useState(0);
 const [client,setClient]=useState<KnowledgeClient|null>(null);
 const [loadState,setLoadState]=useState<'loading'|'ready'|'error'>('loading');
 const [response,setResponse]=useState<KnowledgeResponse>({status:'invalid_query',results:[]});
 const [searching,setSearching]=useState(false);
 const [navError,setNavError]=useState('');
 const generation=useRef(0);
 const changeQuery=(value:string)=>{
  latestQuery=value;mentorFocus=null;setNavError('');setQuery(value);
 };
 useEffect(()=>{
  setExternalQuery=changeQuery;
  app.liSearch={render:value=>setExternalQuery(value),getStatus:()=>latestStatus,
   getQuery:()=>latestQuery,openLesson,getMentorContext:()=>latestQuery.trim()?mentorFocus:null};
  return()=>{setExternalQuery=()=>{};};
 },[]);
 useEffect(()=>{
  let disposed=false;
  const url=new URL('./assets/li-content-adapter.mjs',document.baseURI).href;
  void import(/* @vite-ignore */ url).then(async module=>{
   const data=module as {contentClient?:KnowledgeClient&{
    search?:()=>Promise<unknown>;graph?:()=>Promise<unknown>;hierarchy?:()=>Promise<unknown>}};
   if(!data.contentClient?.searchKnowledge)throw Error('CONTENT_CLIENT_UNAVAILABLE');
   await Promise.all([data.contentClient.search?.(),data.contentClient.graph?.(),
    data.contentClient.hierarchy?.()]);
   if(!disposed){setClient(data.contentClient);setLoadState('ready');latestStatus='ready';}
  }).catch(()=>{if(!disposed){setLoadState('error');latestStatus='error';}});
  return()=>{disposed=true;};
 },[]);
 useEffect(()=>{
  const ticket=++generation.current;
  mentorFocus=null;
  if(!query.trim()){setSearching(false);setResponse({status:'invalid_query',results:[]});return;}
  if(!client){setSearching(false);setResponse(withPersonalLessons(query,fallback(query)));return;}
  setSearching(true);
  void client.searchKnowledge(query).then(result=>{
   if(ticket===generation.current)setResponse(withPersonalLessons(query,{
    status:result.status,results:Array.isArray(result.results)?result.results:[]
   }));
  }).catch(()=>{
   if(ticket===generation.current){
    latestStatus='error';setLoadState('error');setClient(null);
    setResponse(withPersonalLessons(query,fallback(query)));
   }
  }).finally(()=>{if(ticket===generation.current)setSearching(false);});
 },[client,query,submitCount]);
 const askMentor=(record:KnowledgeItem)=>{
  mentorFocus={id:record.id,kind:record.kind,title:record.title,lessonId:record.lessonId,
   links:(record.links||[]).filter(link=>link.sourceType==='academic'&&
    sourceIsSafe(link.sourceUrl)&&link.kind==='Lesson').map(link=>({...link}))};
  app.openLaoLy?.();
 };
 const navigateTo=(id:string)=>{if(!openLesson(id))setNavError(L('Chưa thể mở bài học này.','This lesson could not be opened.'));};
 return <div data-li-react-screen="knowledge-search">
  <Button variant="ghost" className="utility-back" onClick={goBack}>
   <span aria-hidden="true">←</span> {L("Quay lại","Back")}
  </Button>
  <div className="kicker">{L("TÌM TRONG THƯ VIỆN","SEARCH THE LIBRARY")}</div>
  <Heading level={1} role="headline">{L("Tra Cứu","Search")}</Heading>
  <Text role="body">{L("Tìm bằng tên, mã bài hoặc hỏi bằng câu tự nhiên. Li. chỉ dẫn đến nội dung bài thực sự có, không tự bịa đáp án.","Search by title, lesson ID or a natural-language question. Li. links to real lesson content instead of inventing answers.")}</Text>
  <SearchField label={L("Bạn muốn tìm gì?","What would you like to explore?")} value={query} onQueryChange={changeQuery}
    onSearch={()=>setSubmitCount(n=>n+1)}
   placeholder={L("Ví dụ: Tại sao khảo sát 1.000 người vẫn có thể sai?","For example: Why can a survey of 1,000 people be misleading?")}
   clearLabel={L("Xóa tìm kiếm","Clear search")} submitLabel={L("Tìm kiếm","Search")}/>
  <section className="surface" aria-label={L("Kết quả tra cứu","Search results")}>
   <Heading level={2} role="titleMedium">{L("Kết quả tra cứu","Search results")}</Heading>
   {loadState==='error'&&query.trim()&&
    <InlineFeedback tone="info" message={L("Dữ liệu quan hệ chưa khả dụng. Đang dùng danh mục bài đã phát hành.","Relationships are temporarily unavailable. Showing released lessons.")}/>}
   {navError&&<InlineFeedback tone="error" message={navError}/>}
   {response.status==='related_only'&&!searching&&
    <InlineFeedback tone="info" message={L("Chưa có bài trả lời trực tiếp câu hỏi này. Bài bên dưới chỉ có nội dung liên quan.","No lesson directly answers this question. The results below are only related.")}/>}
   {searching&&<Text role="support" aria-live="polite">{L("Đang tìm trong Knowledge Base…","Searching the knowledge base…")}</Text>}
   {!query.trim()?<Text role="support">{L("Nhập tên bài, môn học hoặc khái niệm để tra cứu.","Enter a lesson, course or concept to search.")}</Text>:
    response.results.length===0&&!searching?
     <InlineFeedback tone="info" message={response.status==='no_answer'?
      L("Chưa có bài có mục tiêu học trả lời được câu hỏi này. Thử hỏi cách khác hoặc tìm theo tên/mã bài.","No lesson outcome directly answers this question. Try different wording or a lesson ID."):
      L("Chưa tìm thấy bài hay khái niệm đã xác minh phù hợp.","No matching reviewed lesson or concept found.")}/>:
     <div className="path-list" aria-live="polite">
      <Text role="caption">{response.results.length} {L("kết quả","results")} · {response.status==='answerable'||response.status==='related_only'||response.status==='outcome_match'?
       L('Câu hỏi tự nhiên · phạm vi 3 bài Wave1','Natural-language search · 3 Wave1 lessons'):response.status==='personal_match'?
        L('Bài học cá nhân trên staging + Knowledge Base','Personal staging lessons + knowledge base'):L('Knowledge Base canonical','Canonical knowledge base')}</Text>
      {response.results.map(record=><motion.article key={record.kind+':'+record.id}
        className="li-search-result" initial={reduced?false:{opacity:0,y:6}}
        animate={{opacity:1,y:0}} transition={reduced?{duration:0}:{duration:0.17}}> 
       <ListRow title={record.title}
        description={(locale==='en'?(englishKind[record.kind]||'Knowledge item'):(kindCopy[record.kind]||'Mục kiến thức'))+' · '+(record.lessonId||record.id)+
         (record.contentState==='review_only'?L(' · đang duyệt',' · under review'):'')+
         (record.context?' · '+record.context:'')}
        onActivate={record.kind==='Lesson'&&!!availableRoute(record.lessonId||record.id)?
         ()=>navigateTo(record.lessonId||record.id):undefined}/>
       {record.answerability&&<div className="li-search-related">
        <Text role="support"><strong>{record.answerability.level==='direct'?L('Mục tiêu bài học phù hợp','Relevant learning outcome'):
         record.answerability.level==='outcome_match'?
          L('Khớp mục tiêu học đã duyệt','Matches a reviewed outcome'):L('Chỉ liên quan — chưa trả lời câu hỏi','Related only — does not answer the question')}</strong></Text>
        <Text role="support">{locale==='en'?record.answerability.reasonLocalized?.en||record.answerability.reason:record.answerability.reasonLocalized?.vi||record.answerability.reason}</Text>
        <Text role="support">{record.answerability.level==='outcome_match'?
         L('Khớp từ ngữ trong mục tiêu học đã duyệt; chưa khẳng định bài trả lời đầy đủ câu hỏi. Không phải câu trả lời AI.','Matched wording in a reviewed learning outcome; not a verified full answer or AI response.'):
         L('Đối chiếu theo mục tiêu bài đã biên soạn · chưa phải câu trả lời do AI tạo hoặc kiểm chứng học thuật độc lập.','Mapped to an authored learning outcome; not an AI-generated or independently validated answer.')}</Text>
        {sourceIsSafe(record.answerability.sourceUrl)&&
         <a href={record.answerability.sourceUrl} target="_blank" rel="noopener noreferrer">
          {L("Nguồn tham khảo của bài","Lesson reference")}</a>}
       </div>}
       {(record.links||[]).length>0&&<div className="li-search-related">
        <Text role="support">{L("Kết nối kiến thức có nguồn · không mặc định là bài tiên quyết","Source-backed connections · not automatically prerequisites")}</Text>
        {record.links.map((link,i)=><div key={link.id+':'+i} className="li-search-relation">
         <Text role="support">{locale==='en'?link.relation||link.label:link.label}: {link.title} · {link.lessonId||link.id}</Text>
         {link.reason&&<Text role="support">{locale==='en'&&link.reasonLocalized?link.reasonLocalized:link.reason}</Text>}
         {link.kind==='Lesson'&&!!availableRoute(link.lessonId||'')&&
          <Button variant="secondary" onClick={()=>navigateTo(link.lessonId!)}>{L("Mở bài","Open lesson")} {link.lessonId}</Button>}
         {sourceIsSafe(link.sourceUrl)&&record.links.findIndex(item=>item.sourceUrl===link.sourceUrl)===i&&<a href={link.sourceUrl} target="_blank" rel="noopener noreferrer">
          {link.sourceType==='academic'?L('Nguồn phương pháp','Method source'):L('Nguồn phân loại','Taxonomy source')}</a>}
        </div>)}
       </div>}
       {sourceIsSafe(record.sourceUrl)&&!(record.links||[]).some(link=>link.sourceUrl===record.sourceUrl)&&
        <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">{L("Nguồn danh mục","Catalog source")}</a>}
       {(record.kind==='Concept'||record.kind==='Lesson')&&
        (record.links||[]).some(link=>link.sourceType==='academic'&&
         link.kind==='Lesson'&&sourceIsSafe(link.sourceUrl))&&
        <Button variant="secondary" onClick={()=>askMentor(record)}
         aria-haspopup="dialog" aria-controls="buddy-modal">{L("Hỏi Lão Lý về kết nối này","Ask Lao Ly about this connection")}</Button>}
      </motion.article>)}
     </div>}
  </section>
 </div>;
}

export function mountKnowledgeSearch(){
 const page=document.getElementById('page-search');
 const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!page)throw Error('REACT_SEARCH_HOST_MISSING');
 const host=document.createElement('div');
 host.id='li-react-search-host';host.className='section-shell';
 page.append(host);
 const root=createRoot(host);
 root.render(<KnowledgeSearch/>);
 if(legacy){legacy.hidden=true;legacy.style.display='none';}
 return ()=>{
  root.unmount();host.remove();if(legacy){legacy.hidden=false;legacy.style.removeProperty('display');}
 };
}

export {KnowledgeSearch as KnowledgeSearchScreen};
