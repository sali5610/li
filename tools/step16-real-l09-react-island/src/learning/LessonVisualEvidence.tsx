import React from 'react';
import {Heading,Text} from '../../../../design-system/react/Atoms';
import {Stack} from '../../../../design-system/react/Layout';
import {Disclosure} from '../../../../design-system/react/Molecules';
import {LessonSources} from './LessonDetailParity.js';
import data from '../../../../content/editorial/lesson-visual-evidence.v1.json';

type Locale='vi'|'en';
type Bilingual=Record<Locale,string>;
type Cell=Bilingual|string;
type Source={title:string;url:string;scope:Bilingual;limit:Bilingual;access:string;tier?:string};
type Base={title:Bilingual;caption:Bilingual;sources:Source[];queries:string[]};
type Flow=Base&{kind:'flow';items:Bilingual[]};
type Table=Base&{kind:'table';headers:Bilingual[];rows:Cell[][]};
type Bars=Base&{kind:'bars';labels:Bilingual[];values:number[];unit:Bilingual;max?:number};
type Plot=Base&{kind:'plot';x:number[];series:{label:Bilingual;values:(number|null)[];line?:boolean}[];
 xLabel:Bilingual;unit:Bilingual;mode:'dots'|'line'};
type Figure=Flow|Table|Bars|Plot;
const figures=data.lessons as unknown as Record<string,Figure>;
const loc=(x:Cell,l:Locale)=>typeof x==='string'?x:x[l];
const fmt=(x:number,l:Locale)=>new Intl.NumberFormat(l==='vi'?'vi-VN':'en-US',{maximumFractionDigits:2}).format(x);
function DataTable({headers,rows,locale,label}:{headers:Cell[];rows:Cell[][];locale:Locale;label:string}){
 return <div className="li-learning-table-scroll" tabIndex={0} role="region" aria-label={label}>
  <table aria-label={label}><thead><tr>{headers.map((h,i)=><th key={i} scope="col">{loc(h,locale)}</th>)}</tr></thead>
  <tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?
   <th key={j} scope="row">{loc(cell,locale)}</th>:<td key={j}>{loc(cell,locale)}</td>)}</tr>)}</tbody>
  </table>
 </div>;
}
function PlotFigure({entry,locale}:{entry:Plot;locale:Locale}){
 const lo=Math.min(0,...entry.series.flatMap(s=>s.values.filter((v):v is number=>v!==null)));
 const hi=Math.max(lo+1,...entry.series.flatMap(s=>s.values.filter((v):v is number=>v!==null)));
 const xmin=Math.min(...entry.x),xmax=Math.max(xmin+1,...entry.x);
 const px=(v:number)=>38+(v-xmin)/(xmax-xmin)*264;
 const py=(v:number)=>156-(v-lo)/(hi-lo)*128;
 const strokes=['var(--moss)','var(--wood)','currentColor'];
 const dashes=['','6 4','2 4'];
 const vi=locale==='vi';
 return <>
  <Text role="support">{entry.unit[locale]}</Text>
  <svg viewBox="0 0 320 180" role="img" aria-label={entry.title[locale]+'. '+entry.caption[locale]}>
   {[0,.25,.5,.75,1].map((t,i)=>{const v=lo+t*(hi-lo);return <g key={i}>
    <line x1="38" x2="302" y1={py(v)} y2={py(v)} stroke="currentColor" opacity=".17"/>
    <text x="32" y={py(v)+4} textAnchor="end" fontSize="10" fill="currentColor">{fmt(v,locale)}</text>
   </g>})}
   <path d="M38 28V156H302" fill="none" stroke="currentColor"/>
   {entry.x.map(x=><text key={x} x={px(x)} y="172" textAnchor="middle" fontSize="11" fill="currentColor">{x}</text>)}
   {entry.series.map((s,j)=>{const points=entry.x.flatMap((x,i)=>s.values[i]===null?[]:[{x:px(x),y:py(s.values[i] as number)}]);
    const color=strokes[j%strokes.length];return <g key={j} stroke={color} fill={color}>
     {(entry.mode==='line'||s.line)&&points.length>1&&<polyline points={points.map(p=>p.x+','+p.y).join(' ')}
      fill="none" strokeWidth="2" strokeDasharray={dashes[j%3]}/>}
     {points.map((p,i)=>j%3===1?<rect key={i} x={p.x-3} y={p.y-3} width="6" height="6"/>:j%3===2?
      <path key={i} d={'M'+p.x+' '+(p.y-4)+'l4 7h-8Z'}/>:<circle key={i} cx={p.x} cy={p.y} r="3"/>)}
    </g>})}
  </svg>
  <Text role="support">{entry.xLabel[locale]}</Text>
  <Stack space="2">{entry.series.map((s,j)=><Text key={j} role="support">{['●','■','▲'][j%3]} {s.label[locale]}</Text>)}</Stack>
  <Disclosure summary={vi?'Xem số liệu minh họa':'View illustrative data'}>
   <DataTable locale={locale} label={entry.title[locale]} headers={[entry.xLabel,...entry.series.map(s=>s.label)]}
    rows={entry.x.map((x,i)=>[String(x),...entry.series.map(s=>s.values[i]===null?'—':fmt(s.values[i] as number,locale))])}/>
  </Disclosure>
 </>;
}
function BarsFigure({entry,locale}:{entry:Bars;locale:Locale}){
 const max=entry.max??Math.max(1,...entry.values);
 return <Stack space="3">{entry.labels.map((label,i)=><div key={i}>
  <Text>{label[locale]} · <strong>{fmt(entry.values[i],locale)}{entry.unit[locale]==='%'?'%':' '+entry.unit[locale]}</strong></Text>
  <svg viewBox="0 0 320 10" aria-hidden="true" focusable="false">
   <rect x="0" y="0" width="320" height="10" fill="currentColor" opacity=".12"/>
   <rect x="0" y="0" width={320*entry.values[i]/max} height="10" fill="var(--moss)"/>
  </svg>
 </div>)}</Stack>;
}
/** Read-only first-party lesson figures; no answer, grade or progress write.
 * Shares existing learner figure/table styling and DS text, link, stack and disclosure.
 * Numeric examples are independent of the assessed case and explicitly fictional. */
export function LessonVisualEvidence({id,locale,title,onSearch}:{id:string;locale:Locale;title:string;onSearch:(query:string)=>void}){
 const entry=figures[id];if(!entry)return null;
 const vi=locale==='vi';
 return <Stack space="4">
  <figure className="li-editorial-visual" data-li-lesson-figure={id} aria-labelledby={'li-figure-title-'+id}>
   <Heading level={3} role="titleMedium" id={'li-figure-title-'+id}>{entry.title[locale]}</Heading>
   <Text role="support">{vi?'Minh họa tự biên soạn · Dữ liệu/tình huống giả định':'First-party illustration · Fictional data/scenario'}</Text>
   {entry.kind==='flow'&&<Stack space="2">{entry.items.map((item,i)=><React.Fragment key={i}>
    <Text><strong>{i+1}.</strong> {item[locale]}</Text>
    {i<entry.items.length-1&&<Text role="support" aria-hidden="true">↓</Text>}
   </React.Fragment>)}</Stack>}
   {entry.kind==='table'&&<DataTable headers={entry.headers} rows={entry.rows} locale={locale} label={entry.title[locale]}/>}
   {entry.kind==='bars'&&<BarsFigure entry={entry} locale={locale}/>}
   {entry.kind==='plot'&&<PlotFigure entry={entry} locale={locale}/>}
   <figcaption><Text role="support">{entry.caption[locale]}</Text></figcaption>
  </figure>
  <details className="li-learning-extra-sources">
   <summary>{vi?'Nguồn & đọc thêm':'Sources & further reading'}</summary>
   <LessonSources id={id} locale={locale}
    copy={vi?{
     sourcesTitle:'Đọc thêm từ nguồn chính',sourcesLead:'Mở nguồn trực tiếp hoặc sao chép prompt để tìm hiểu sâu hơn.',
     sourceNote:'Chỉ sử dụng tài liệu thực sự truy cập được. Đối chiếu nguồn có giới hạn; chưa phải duyệt học thuật toàn bài.',
     queriesTitle:'Gợi ý tìm kiếm',openSource:'Mở nguồn',allPrompt:'Copy prompt tổng hợp',openChat:'Mở ChatGPT',
     tiers:{core:'Nguồn chính',deep:'Đọc chuyên sâu',intro:'Đọc nhập môn',further:'Đọc thêm'}
    }:{
     sourcesTitle:'Read from primary references',sourcesLead:'Open a source directly or copy a contextual research prompt.',
     sourceNote:'Use only material actually accessed. Scoped source check, not academic approval of the full lesson.',
     queriesTitle:'Suggested searches',openSource:'Open source',allPrompt:'Copy cross-source prompt',openChat:'Open ChatGPT',
     tiers:{core:'Core reference',deep:'Further reading',intro:'Introduction',further:'Further reading'}
    }}
    sources={entry.sources.map((source,i)=>({
     title:source.title,url:source.url,tier:source.tier??(i===0?'core':'deep'),
     usage:source.scope[locale],
     note:(source.access==='readable'?
      (vi?'Đã đối chiếu phần liên quan. ':'Relevant portion checked. '):
      (vi?'Nguồn đọc mở rộng, chưa rà toàn văn. ':'Further reading, full text not reviewed. '))+source.limit[locale]
    }))}
    subject={id.startsWith('L03')?'HCI':id.startsWith('L09')?'Data Science':'Supply Chain'}
    conceptTitle={title} searchQueries={entry.queries} onSearch={onSearch}/>
  </details>
 </Stack>;
}
