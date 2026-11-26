import React from 'react';
import {Heading,Text} from '../../../../design-system/react/Atoms';
import {Disclosure} from '../../../../design-system/react/Molecules';
import data from '../../../../content/editorial/lesson-ontology-analogy.v1.json';

type Locale='vi'|'en';
type Concept={id:string;vi:string;en:string};
type Entry={concepts:Concept[];relation:{from:string;to:string;predicate:string;
 reason:Record<Locale,string>;reviewState:string};
 analogy:Record<Locale,{example:string;limit:string}>;reviewState:string};

/** Read-only lesson-level view of proposed concept mappings. The canonical
 * graph IDs are reused; this never publishes candidate edges or writes progress. */
export function LessonUnderstanding({id,locale}:{id:string;locale:Locale}){
 const entry=(data.lessons as Record<string,Entry>)[id];
 if(!entry)return null;
 const vi=locale==='vi';
 const from=entry.concepts.find(c=>c.id===entry.relation.from);
 const to=entry.concepts.find(c=>c.id===entry.relation.to);
 if(!from||!to)return null;
 const relationship=entry.relation.predicate==='CONTRASTS_WITH'?
  (vi?'Phân biệt với':'Contrasts with'):(vi?'Liên quan đến':'Related to');
 const analogy=entry.analogy[locale];
 return <section aria-label={vi?'Hiểu sâu khái niệm':'Deepen understanding'}
  data-li-lesson-understanding={id}>
  <Disclosure summary={vi?'Ontology · Mạng khái niệm':'Ontology · Concept relations'}>
   <Heading level={3} role="titleMedium">{vi?'Khái niệm và quan hệ':'Concepts and relationships'}</Heading>
   <div className="li-learning-comparison" data-li-ontology-relation={entry.relation.predicate}>
    <div data-li-concept-id={from.id}><Text>{from[locale]}</Text></div>
    <div data-li-concept-id={to.id}><Text>{to[locale]}</Text></div>
   </div>
   <Text role="support">{relationship} · {entry.relation.reason[locale]}</Text>
   <Text role="support">{vi?'Liên kết biên tập đề xuất; không phải điều kiện tiên quyết.':'Proposed editorial relation; not a prerequisite.'}</Text>
  </Disclosure>
  <Disclosure summary={vi?'Analogy · Liên tưởng dễ hiểu':'Analogy · Familiar comparison'}>
   <Text>{analogy.example}</Text>
   <Text role="support">{vi?'Giới hạn phép so sánh: ':'Where the analogy breaks: '}{analogy.limit}</Text>
  </Disclosure>
 </section>;
}
