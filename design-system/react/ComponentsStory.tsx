/** Actual React Button/Card in the one Studio. Fixture-only, never saves. */
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,Card,FilterChip} from './index';
import type {ButtonVariant,CardVariant} from './index';
import './components.css';
import './components-story.css';
import './focus.css';
const params=new URLSearchParams(location.search);
if(params.get('state')==='focus')document.documentElement.dataset.dsFocusDemo='true';
const requestedStory=params.get('story');
const story=requestedStory==='card'||requestedStory==='chip'?requestedStory:'button';
const variant=params.get('variant')||'Primary';
const state=params.get('state')||'default';
const en=params.get('lang')==='en';
const tr=(vi:string,english:string)=>en?english:vi;
function Example(){
 const [hits,setHits]=useState(0);
 const [pressed,setPressed]=useState(state==='selected');
 if(story==='button'){
  const v:ButtonVariant=variant==='Secondary'?'secondary':variant==='Ghost'?'ghost':'primary';
  return <div className="li-component-demo" data-story-button>
   <Button variant={v} disabled={state==='disabled'} loading={state==='loading'}
    onClick={()=>setHits(n=>n+1)}>
    {state==='loading'?tr('Đang xử lý…','Working…'):tr('Tiếp tục','Continue')}
   </Button>
   <p role="status">{tr('Lượt bấm demo: ','Demo activations: ')}{hits}</p>
  </div>;
 }
 if(story==='chip')return <div className="li-component-demo" data-story-chip>
  <div role="group" aria-label={tr('Bộ lọc demo','Demo filters')}>
   <FilterChip pressed={pressed} disabled={state==='disabled'}
    onClick={()=>setPressed(value=>!value)}>
    {tr('Tất cả','All')}
   </FilterChip>
  </div>
  <p role="status">{pressed?tr('Bộ lọc đang chọn (demo)','Filter selected (demo)'):
   tr('Chưa chọn bộ lọc','Filter not selected')}</p>
 </div>;
 const v:CardVariant=variant==='Tinted'?'tinted':variant==='Inverse'?'inverse':
  variant==='Flat study'?'flat-study':'raised';
 return <Card variant={v} data-story-card>
  <h2>{tr('Khu vườn tri thức','Knowledge garden')}</h2>
  <p>{tr('Mẫu phân cấp nội dung và chiều sâu.',
   'A sample of content hierarchy and elevation.')}</p>
 </Card>;
}
function Story(){
 return <main className="li-component-story" data-ui-react-component="mounted"
  data-component-name={story} lang={en?'en':'vi'}>
  <p className="li-component-kicker">UX-DS-35 / STAGE04 / REACT</p>
  <h1>{story==='button'?'Button':story==='card'?'Card / Surface':'Filter Chip'}</h1>
  <div className="li-component-sample"><Example/></div>
  <p className="li-component-caution">{tr(
   'React source thật · Chỉ demo · G2 chưa duyệt · Không lưu dữ liệu.',
   'Real React source · Demo only · G2 open · No data saved.')}</p>
 </main>;
}
const root=document.getElementById('react-components-root');
if(!root)throw Error('Missing component story root');
createRoot(root).render(<Story/>);
