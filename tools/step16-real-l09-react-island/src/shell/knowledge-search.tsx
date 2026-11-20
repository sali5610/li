import React,{useEffect,useRef,useState} from 'react';
import {openRoute,goBack,hasRoute} from './app-router.js';
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

function openLesson(id:string){
 const route=routes.get(id);
 return !!route&&hasRoute(route)&&openRoute(route);
}
const kindCopy:Record<string,string>={
 Lesson:'Bài có nội dung',Concept:'Khái niệm đã đối chiếu',Course:'Đề cương môn',
 Field:'Lĩnh vực',DomainGroup:'Nhóm ngành'
};
let mentorFocus:MentorContext|null=null;
let latestQuery='';
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
 const reduced=useReducedMotion();
 const [query,setQuery]=useState('');
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
  if(!client){setSearching(false);setResponse(fallback(query));return;}
  setSearching(true);
  void client.searchKnowledge(query).then(result=>{
   if(ticket===generation.current)setResponse({
    status:result.status,results:Array.isArray(result.results)?result.results:[]
   });
  }).catch(()=>{
   if(ticket===generation.current){
    latestStatus='error';setLoadState('error');setClient(null);setResponse(fallback(query));
   }
  }).finally(()=>{if(ticket===generation.current)setSearching(false);});
 },[client,query]);
 const askMentor=(record:KnowledgeItem)=>{
  mentorFocus={id:record.id,kind:record.kind,title:record.title,lessonId:record.lessonId,
   links:(record.links||[]).filter(link=>link.sourceType==='academic'&&
    sourceIsSafe(link.sourceUrl)&&link.kind==='Lesson').map(link=>({...link}))};
  app.openLaoLy?.();
 };
 const navigateTo=(id:string)=>{if(!openLesson(id))setNavError('Chưa thể mở bài học này.');};
 return <div data-li-react-screen="knowledge-search">
  <Button variant="ghost" className="utility-back" onClick={goBack}>
   <span aria-hidden="true">←</span> Quay lại
  </Button>
  <div className="kicker">TÌM TRONG THƯ VIỆN</div>
  <Heading level={1} role="headline">Tra Cứu</Heading>
  <Text role="body">Tìm bằng tên, mã bài hoặc hỏi bằng câu tự nhiên. Li. chỉ dẫn đến nội dung bài thực sự có, không tự bịa đáp án.</Text>
  <SearchField label="Bạn muốn tìm gì?" value={query} onQueryChange={changeQuery}
   placeholder="Ví dụ: Tại sao khảo sát 1.000 người vẫn có thể sai?"
   clearLabel="Xóa tìm kiếm" submitLabel="Tìm kiếm"/>
  <section className="surface" aria-label="Kết quả tra cứu">
   <Heading level={2} role="titleMedium">Kết quả tra cứu</Heading>
   {loadState==='error'&&query.trim()&&
    <InlineFeedback tone="info" message="Dữ liệu quan hệ chưa khả dụng. Đang dùng danh mục bài đã phát hành."/>}
   {navError&&<InlineFeedback tone="error" message={navError}/>}
   {response.status==='related_only'&&!searching&&
    <InlineFeedback tone="info" message="Chưa có bài trả lời trực tiếp câu hỏi này. Bài bên dưới chỉ có nội dung liên quan."/>}
   {searching&&<Text role="support" aria-live="polite">Đang tìm trong Knowledge Base…</Text>}
   {!query.trim()?<Text role="support">Nhập tên bài, môn học hoặc khái niệm để tra cứu.</Text>:
    response.results.length===0&&!searching?
     <InlineFeedback tone="info" message={response.status==='no_answer'?
      "Chưa có bài có mục tiêu học trả lời được câu hỏi này. Thử hỏi cách khác hoặc tìm theo tên/mã bài.":
      "Chưa tìm thấy bài hay khái niệm đã xác minh phù hợp."}/>:
     <div className="path-list" aria-live="polite">
      <Text role="caption">{response.results.length} kết quả · {response.status==='answerable'||response.status==='related_only'||response.status==='outcome_match'?
       'Câu hỏi tự nhiên · phạm vi 3 bài Wave1':loadState==='ready'?'Knowledge Base canonical':'Danh mục offline'}</Text>
      {response.results.map(record=><motion.article key={record.kind+':'+record.id}
        className="li-search-result" initial={reduced?false:{opacity:0,y:6}}
        animate={{opacity:1,y:0}} transition={reduced?{duration:0}:{duration:0.17}}> 
       <ListRow title={record.title}
        description={(kindCopy[record.kind]||'Mục kiến thức')+' · '+(record.lessonId||record.id)+
         (record.contentState==='review_only'?' · đang duyệt':'')+
         (record.context?' · '+record.context:'')}
        onActivate={record.kind==='Lesson'&&routes.has(record.lessonId||record.id)?
         ()=>navigateTo(record.lessonId||record.id):undefined}/>
       {record.answerability&&<div className="li-search-related">
        <Text role="support"><strong>{record.answerability.level==='direct'?'Mục tiêu bài học phù hợp':
         record.answerability.level==='outcome_match'?
          'Khớp mục tiêu học đã duyệt':'Chỉ liên quan — chưa trả lời câu hỏi'}</strong></Text>
        <Text role="support">{record.answerability.reason}</Text>
        <Text role="support">{record.answerability.level==='outcome_match'?
         'Khớp từ ngữ trong mục tiêu học đã duyệt; chưa khẳng định bài trả lời đầy đủ câu hỏi. Không phải câu trả lời AI.':
         'Đối chiếu theo mục tiêu bài đã biên soạn · chưa phải câu trả lời do AI tạo hoặc kiểm chứng học thuật độc lập.'}</Text>
        {sourceIsSafe(record.answerability.sourceUrl)&&
         <a href={record.answerability.sourceUrl} target="_blank" rel="noopener noreferrer">
          Nguồn tham khảo của bài</a>}
       </div>}
       {(record.links||[]).length>0&&<div className="li-search-related">
        <Text role="support">Kết nối kiến thức có nguồn · không mặc định là bài tiên quyết</Text>
        {record.links.map((link,i)=><div key={link.id+':'+i} className="li-search-relation">
         <Text role="support">{link.label}: {link.title} · {link.lessonId||link.id}</Text>
         {link.reason&&<Text role="support">{link.reason}</Text>}
         {link.kind==='Lesson'&&routes.has(link.lessonId||'')&&
          <Button variant="secondary" onClick={()=>navigateTo(link.lessonId!)}>Mở bài {link.lessonId}</Button>}
         {sourceIsSafe(link.sourceUrl)&&record.links.findIndex(item=>item.sourceUrl===link.sourceUrl)===i&&<a href={link.sourceUrl} target="_blank" rel="noopener noreferrer">
          {link.sourceType==='academic'?'Nguồn phương pháp':'Nguồn phân loại'}</a>}
        </div>)}
       </div>}
       {sourceIsSafe(record.sourceUrl)&&!(record.links||[]).some(link=>link.sourceUrl===record.sourceUrl)&&
        <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">Nguồn danh mục</a>}
       {(record.kind==='Concept'||record.kind==='Lesson')&&
        (record.links||[]).some(link=>link.sourceType==='academic'&&
         link.kind==='Lesson'&&sourceIsSafe(link.sourceUrl))&&
        <Button variant="secondary" onClick={()=>askMentor(record)}
         aria-haspopup="dialog" aria-controls="buddy-modal">Hỏi Lão Lý về kết nối này</Button>}
      </motion.article>)}
     </div>}
  </section>
 </div>;
}

export function mountKnowledgeSearch(){
 const page=document.getElementById('page-search');
 const legacy=page?.querySelector<HTMLElement>(':scope > .section-shell');
 if(!page||!legacy)throw Error('REACT_SEARCH_HOST_MISSING');
 const host=document.createElement('div');
 host.id='li-react-search-host';host.className='section-shell';
 page.append(host);
 const root=createRoot(host);
 root.render(<KnowledgeSearch/>);
 legacy.hidden=true;legacy.style.display='none';
 return ()=>{
  root.unmount();host.remove();legacy.hidden=false;legacy.style.removeProperty('display');
 };
}
