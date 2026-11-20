/** UX-DS-35: REAL React Stage03 story, preview-only. No app router or learner data. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Container,Stack,Inline,Cluster,Grid,SafeArea,ScrollRegion} from './Layout';
import './layout.css';
import './focus.css';

const params=new URLSearchParams(location.search);
if(params.get('state')==='focus')document.documentElement.dataset.dsFocusDemo='true';
const variants=['Container','Stack','Inline','Cluster','Grid','SafeArea','ScrollRegion'] as const;
type Variant=typeof variants[number];
const requested=params.get('variant');
const variant:Variant=variants.find(v=>v===requested)||'Grid';
const en=params.get('lang')==='en';
const lang=(vi:string,english:string)=>en?english:vi;
const tiles=[1,2,3].map(i=>(
 <div className="li-layout-demo-tile" key={i} data-layout-tile>
  <strong>{lang('Thành phần','Element')} {i}</strong>
  <span>{lang('Nội dung co giãn theo vùng chứa.','Content adapts to its own container.')}</span>
 </div>
));
function Example(){
 switch(variant){
  case 'Container':
   return <Container measure="reading" data-story-container><Stack space="3">
    <p>{lang('Container giữ dòng đọc có giới hạn và gutter phù hợp.',
        'Container bounds reading width and keeps responsive gutters.')}</p>{tiles[0]}
   </Stack></Container>;
  case 'Stack':
   return <Container><Stack space="4" data-story-stack>{tiles}</Stack></Container>;
  case 'Inline':
   return <Container><Inline collapseOnNarrow space="3" data-story-inline>{tiles}</Inline></Container>;
  case 'Cluster':
   return <Container><Cluster distribution="between" space="3" data-story-cluster>{tiles}</Cluster></Container>;
  case 'Grid':
   return <Container><Grid cell="compact" space="3" data-story-grid>{tiles}</Grid></Container>;
  case 'SafeArea':
   return <SafeArea data-story-safe-area><div className="li-layout-demo-tile">
     {lang('Bố cục tôn trọng safe-area ở mọi cạnh.',
       'Layout respects viewport safe-area insets on each side.')}
    </div></SafeArea>;
  case 'ScrollRegion':
   return <Container><ScrollRegion label={lang('Vùng minh họa có thể cuộn',
     'Scroll-friendly example region')} data-story-scroll>
    <Stack space="2">{Array.from({length:12},(_,i)=>
     <p key={i} className="li-layout-story-line">{i+1}. {lang('Dòng có thể cuộn bằng bàn phím',
       'Keyboard-scrollable content')}</p>)}</Stack>
   </ScrollRegion></Container>;
 }
}
function Story(){
 return <main className="li-layout-story" lang={en?'en':'vi'}
   data-ui-react-layout="mounted" data-layout-variant={variant}>
   <p className="li-layout-story-kicker">UX-DS-35 / STAGE 03 / REACT SOURCE</p>
   <h1>{variant}</h1>
   <p className="li-layout-story-description">
     {lang('Component React thật từ thư viện Design System — bản Draft.',
       'Actual React component from the Design System library — Draft.')}
   </p>
   <Example/>
   <p className="li-layout-story-note">
     {lang('Chỉ là mẫu UI; không ghi dữ liệu người học.',
       'UI fixture only. No learner data is written.')}
   </p>
 </main>;
}
const host=document.getElementById('react-layout-root');
if(!host)throw Error('Missing React Layout story root');
createRoot(host).render(<Story/>);
