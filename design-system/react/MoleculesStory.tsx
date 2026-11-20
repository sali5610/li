import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ActionGroup,Button,InlineFeedback,SearchField} from './index';
import type {FeedbackTone} from './index';
import './components.css';
import './controls.css';
import './molecules.css';
import './molecules-story.css';
const params=new URLSearchParams(location.search);
const story=params.get('story')||'searchField',variant=params.get('variant')||'Info';
const state=params.get('state')||'default',en=params.get('lang')==='en';
const t=(vi:string,english:string)=>en?english:vi;
function Example(){
 const [query,setQuery]=useState(state==='query'?'học':'');
 const [submitted,setSubmitted]=useState<string|null>(null);
 const [clicks,setClicks]=useState(0);
 const [retry,setRetry]=useState(0);
 const disabled=state==='disabled';
 if(story==='searchField')return <div data-story-search>
  <SearchField label={t('Tra cứu thử','Demo search')} value={query} onQueryChange={setQuery}
   onSearch={setSubmitted} disabled={disabled}
   hint={t('Không tìm trên máy chủ, không lưu nội dung.','No server search or saved query.')}
   placeholder={t('Ví dụ: nhận thức','Example: cognition')}
   clearLabel={t('Xóa truy vấn','Clear query')} submitLabel={t('Tìm thử','Try search')}/>
  <p role="status">{submitted===null?t('Chưa tìm thử','No demo query yet'):
   t('Truy vấn thử: ','Demo query: ')+(submitted||'∅')}</p>
 </div>;
 if(story==='actionGroup')return <div data-story-action-group>
  <ActionGroup label={t('Hành động minh họa','Demo actions')}>
   <Button disabled={disabled} onClick={()=>setClicks(n=>n+1)}>{t('Tiếp tục','Continue')}</Button>
   <Button disabled={disabled} variant="secondary" onClick={()=>setClicks(n=>n+1)}>{t('Xem chi tiết','View details')}</Button>
  </ActionGroup>
  <p role="status">{t('Lượt bấm demo: ','Demo clicks: ')}{clicks}</p>
 </div>;
 const tone:FeedbackTone=variant==='Error'?'error':variant==='Success'?'success':
  variant==='Loading'?'loading':'info';
 const messages={info:t('Đây là thông báo minh họa.','This is an example message.'),
 error:t('Thao tác mẫu chưa hoàn tất. Có thể thử lại.','Demo action did not finish. Retry is available.'),
 success:t('Bước minh họa hoàn tất; không ghi dữ liệu.','Example step completed; nothing was saved.'),
 loading:t('Đang trình diễn trạng thái xử lý…','Demonstrating a pending state…')};
 return <div data-story-inline-feedback>
  <InlineFeedback tone={tone} title={variant} message={messages[tone]}
   actionLabel={tone==='error'?t('Thử lại','Retry'):undefined}
   onAction={tone==='error'?()=>setRetry(n=>n+1):undefined}/>
  <p role="status">{t('Số lần thử lại: ','Demo retries: ')}{retry}</p>
 </div>;
}
function Story(){
 return <main className="li-molecules-story" data-ui-react-molecules="mounted"
  data-molecule={story} lang={en?'en':'vi'}>
  <p className="li-molecules-kicker">UX-DS-35 / STAGE05 / REACT</p>
  <h1>{story==='searchField'?'Search Field':story==='actionGroup'?'Action Group':'Inline Feedback'}</h1>
  <div className="li-molecules-sample"><Example/></div>
  <p className="li-molecules-footnote">{t('Chỉ là fixture UI · Không thực hiện tìm kiếm hoặc lưu.',
  'UI fixture only · No server search or storage.')}</p>
 </main>;
}
const root=document.getElementById('react-molecules-root');
if(!root)throw Error('Missing molecules story root');
createRoot(root).render(<Story/>);
