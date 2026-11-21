import React,{useEffect,useState} from 'react';
import {Heading,Text} from '../../../../design-system/react/Atoms';
import {releasedLessonRoutes} from './released-lessons.js';

/** Source-verified graph relations from the same read-only public content
 * pack used by Tra Cứu. React renders the three approved Wave1 lesson links.
 * Staging no longer needs the extra vanilla section appended after the
 * React journey. This component writes no progress and no private data.
 */
type Locale='vi'|'en';
type LessonId='L03-1-2'|'L09-1-2'|'L15-2-2';
type Explanation={
 fromConcept:string;concept:string;predicate:string;reason:string;
 reasonLocalized?:Record<Locale,string>;
 reviewState:string;provenance?:{sourceUrl?:string}
};
type Relation={lessonId:string;explanations:Explanation[]};
type GraphNode={id:string;kind:string;title:string;aliases?:{locale:string;text:string}[]};
const display:Record<LessonId,{title:string;field:string}>={
 'L03-1-2':{title:'Open Questions & Interview Bias',field:'Human–Computer Interaction (HCI)'},
 'L09-1-2':{title:'Sampling Bias',field:'Data Science'},
 'L15-2-2':{title:'Reorder Points & Safety Stock',field:'Supply Chain'}
};
const routes=new Map(releasedLessonRoutes.map(item=>[item.id,item.route]));
type Link={id:LessonId;reason:string;concepts:string;url:string};
const allowedUrl=(url?:string)=>typeof url==='string'&&/^https:\/\//.test(url);
function approved(lesson:Relation,nodes:Map<string,GraphNode>,locale:Locale):Link|null{
 if(!Object.prototype.hasOwnProperty.call(display,lesson.lessonId)||
  !routes.has(lesson.lessonId))return null;
 const evidence=lesson.explanations.find(x=>x.predicate==='RELATED_TO'&&
  x.reviewState==='verified'&&allowedUrl(x.provenance?.sourceUrl));
 if(!evidence?.provenance?.sourceUrl)return null;
 const conceptTitle=(id:string)=>{
  const node=nodes.get(id);
  return node?.aliases?.find(alias=>alias.locale===locale)?.text||node?.title||id;
 };
 return {id:lesson.lessonId as LessonId,
  reason:evidence.reasonLocalized?.[locale]||evidence.reason,
  concepts:conceptTitle(evidence.fromConcept)+' ↔ '+conceptTitle(evidence.concept),
  url:evidence.provenance.sourceUrl};
}
export function RelatedLessons({id,locale}:{id:LessonId;locale:Locale}){
 const [items,setItems]=useState<Link[]>([]);
 useEffect(()=>{
  let active=true;
  const url=new URL('./assets/li-content-adapter.mjs',document.baseURI).href;
  void import(/* @vite-ignore */ url).then(async module=>{
   const client=(module as {contentClient?:{
    getRelatedLessons?:(id:string)=>Promise<Relation[]>;
    graph?:()=>Promise<{nodes:GraphNode[]}>
   }}).contentClient;
   if(!client?.getRelatedLessons||!client.graph)throw Error('CONTENT_GRAPH_MISSING');
   const [related,graph]=await Promise.all([client.getRelatedLessons(id),client.graph()]);
   if(!active)return;
   const nodes=new Map<string,GraphNode>(
    graph.nodes.filter(x=>x.kind==='Concept').map(x=>[x.id,x] as const));
   setItems(related.map(x=>approved(x,nodes,locale)).filter((x):x is Link=>!!x));
  }).catch(()=>{if(active)setItems([]);});
  return()=>{active=false;};
 },[id,locale]);
 if(items.length===0)return null;
 const vi=locale==='vi';
 return <section className="li-related-lessons li-react-related-lessons" aria-labelledby={'li-related-'+id}>
  <div className="li-related-inner">
   <div className="kicker">{vi?'KẾT NỐI KIẾN THỨC':'CONNECTED LEARNING'}</div>
   <Heading level={2} role="titleLarge" id={'li-related-'+id}>
    {vi?'Nối tiếp mạch kiến thức':'Follow the learning thread'}
   </Heading>
   <Text role="support">{vi?
    'Chỉ các liên kết đã đối chiếu nguồn; không phải bài bắt buộc.':
    'Source-checked connections only; not mandatory prerequisites.'}</Text>
   <ul className="li-related-list">{items.map(item=>
    <li className="li-related-item" key={item.id}>
     <a className="li-related-link" href={'./?lesson='+encodeURIComponent(item.id)}
      aria-label={(vi?'Mở bài ':'Open lesson ')+item.id+': '+display[item.id].title}
      onClick={event=>{
       if(event.button!==0||event.metaKey||event.ctrlKey||
        event.shiftKey||event.altKey)return;
       if(window.liAppRouter?.navigate?.(routes.get(item.id)!)){event.preventDefault();}
      }}>
      <span className="li-related-type">{display[item.id].field} · {item.id}</span>
      <strong className="li-related-name">{display[item.id].title}</strong>
      <span className="li-related-go">{vi?'Mở bài học →':'Open lesson →'}</span>
     </a>
     <Text role="support" className="li-related-reason">{item.reason}</Text>
     <Text role="support" className="li-related-concepts">
      {(vi?'Khái niệm: ':'Concepts: ')+item.concepts}
     </Text>
     <a className="li-related-source" href={item.url} target="_blank"
      rel="noopener noreferrer">{vi?'Nguồn phương pháp · Pew Research Center':
       'Method source · Pew Research Center'}</a>
    </li>)}</ul>
  </div>
 </section>;
}
