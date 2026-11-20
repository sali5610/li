/** Real Stage04 React component specimens only. Not a learner flow. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Text,Heading,Link,Divider,Badge,Progress} from './Atoms';
import './atoms.css';
import './focus.css';

const params=new URLSearchParams(location.search);
if(params.get('state')==='focus')document.documentElement.dataset.dsFocusDemo='true';
const atom=params.get('story')||'text';
const variant=params.get('variant')||'body';
const en=params.get('lang')==='en';
const copy=(vi:string,english:string)=>en?english:vi;
const titleMap:Record<string,string>={text:'Text',heading:'Heading',link:'Link',
 divider:'Divider',badge:'Badge',progress:'Progress'};
function Example(){
 switch(atom){
  case 'text':
   return <Text role={['body','bodyLarge','support','caption'].includes(variant)?
    variant as 'body'|'bodyLarge'|'support'|'caption':'body'} data-story-text>
    {copy('Một thư viện tri thức cần nhịp chữ rõ ràng, dễ đọc trên màn hình nhỏ và lớn.',
      'A knowledge library needs readable type across compact and wide screens.')}
   </Text>;
  case 'heading':{
   const roles=['display','headline','titleLarge','titleMedium','titleSmall'] as const;
   const role=roles.find(v=>v===variant)||'titleMedium';
   const level=role==='display'?1:role==='headline'?2:3;
   return <Heading level={level} role={role} data-story-heading>
    {copy('Khám phá điều chưa biết','Explore the unknown')}
   </Heading>;
  }
  case 'link':
   return <><Link href="#target" data-story-link>
     {copy('Đọc hướng dẫn thiết kế','Read design guidance')}
    </Link><Text role="support" as="span" id="target">
     {copy('Đích nội bộ của mẫu liên kết.','In-page link destination in this specimen.')}
    </Text></>;
  case 'divider':
   return <><Text role="support">{copy('Phần đầu','First section')}</Text>
    <Divider decorative={variant==='Decorative'} data-story-divider/>
    <Text role="support">{copy('Phần sau','Next section')}</Text></>;
  case 'badge':
   return <Badge tone={variant==='Emphasis'?'emphasis':'neutral'} data-story-badge>
    {copy(variant==='Emphasis'?'Bản nổi bật':'Đang xem',variant==='Emphasis'?'Emphasis':'Current',)}
   </Badge>;
  case 'progress':
   return <><Progress label={copy('Tiến độ minh họa','Sample progress')}
    value={variant==='Indeterminate'?undefined:60} data-story-progress/>
    <Text role="support">{variant==='Indeterminate'?
      copy('Đang xử lý mô phỏng — chưa biết tỷ lệ','Demo processing — percentage unknown'):
      copy('60% trong mẫu thử, không phải tiến độ người học.','60% in this fixture, not learner progress.')}</Text></>;
  default:return <Text>{copy('Chưa có mẫu.','No specimen.')}</Text>;
 }
}
function Story(){
 return <main className="li-atom-story" data-ui-react-atom="mounted" data-atom-name={atom}
  lang={en?'en':'vi'}>
  <Text as="span" role="caption">UX-DS-35 / STAGE 04 / REACT SOURCE</Text>
  <Heading level={2} role="titleMedium">{titleMap[atom]||'Atom'}</Heading>
  <div className="li-atom-sample" data-atom-sample><Example/></div>
  <Text role="caption">
   {copy('Mẫu UI React thực tế · Chưa duyệt G2 · Không lưu dữ liệu.',
    'Actual React component fixture · G2 open · No data saved.')}
  </Text>
 </main>;
}
const root=document.getElementById('react-atoms-root');
if(!root)throw Error('Missing React Atoms story root');
createRoot(root).render(<Story/>);
