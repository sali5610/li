import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button} from './Components';
import {Heading,Text,Badge} from './Atoms';
import {HomeLayout,homeLayoutVariants} from './HomeLayoutVariants';
import type {HomeLayoutVariant} from './HomeLayoutVariants';
import './atoms.css';
import './components.css';
import './templates.css';
import './legacy.css';
import './focus.css';
import './home-ui-lab.css';

/** React-only, fixture-only: zero localStorage, Neon, auth, routes or writes. */
const examples=[
 {question:'90% người tham gia nói họ hài lòng. Vậy có đủ kết luận chưa?',
  en:'90% of participants say they are satisfied. Is that enough evidence?',
  scene:'Nhóm UX hỏi những người đang dùng sản phẩm. Còn người đã bỏ đi thì sao?',
  sceneEn:'The UX team asked current users. What about those who left?',
  source:'VÍ DỤ GIẢ ĐỊNH'},
 {question:'Một kết luận đúng có nhất thiết bắt đầu từ dữ liệu đúng?',
  en:'Can a sound conclusion begin with unreliable data?',
  scene:'Lão Lý nghĩ: trước khi tin câu trả lời, phải xem cách câu hỏi được đặt.',
  sceneEn:'Lao Ly wonders: before trusting the answer, inspect the question.',
  source:'CÂU HỎI MỞ'}
] as const;
function UiLab(){
 const [variant,setVariant]=useState<HomeLayoutVariant>('heritage');
 const [compare,setCompare]=useState(false);
 const [other,setOther]=useState<HomeLayoutVariant>('editorial');
 const [locale,setLocale]=useState<'vi'|'en'>('vi');
 const [index,setIndex]=useState(0);
 const [saved,setSaved]=useState<number[]>([]);
 const [notice,setNotice]=useState('');
 const t=(vi:string,en:string)=>locale==='vi'?vi:en;
 const current=examples[index];
 const view={
  locale,question:locale==='vi'?current.question:current.en,
  scene:locale==='vi'?current.scene:current.sceneEn,
  source:current.source,
  backgroundSrc:'../assets/home-li-landscape-20261121.webp',
  mirrorArtSrc:'../assets/home-li-landscape-20261121.webp',
  avatarSrc:'../assets/laoly-neutral.png',
  saved:saved.includes(index),
  onPrevious:()=>{setIndex(i=>(i+examples.length-1)%examples.length);setNotice('');},
  onNext:()=>{setIndex(i=>(i+1)%examples.length);setNotice('');},
  onSave:()=>{setSaved(list=>list.includes(index)?list.filter(n=>n!==index):[...list,index]);setNotice(t('Chỉ lưu trong phiên preview.','Saved in preview memory only.'));},
  onExplore:()=>setNotice(t('Mẫu UI: không chuyển route thật.','UI-only: real routes are disabled.')),
  onCheckin:()=>setNotice(t('Mẫu UI: không ghi check-in.','UI-only: no check-in is written.'))
 };
 return <main className="li-ui-lab" lang={locale} data-li-react-ui-lab="mounted">
  <header className="li-ui-lab-header">
   <div><span className="li-ui-lab-eyebrow">li. / DESIGN SYSTEM / EXPERIMENT</span>
    <Heading level={1} role="headline">UI Lab · Home</Heading>
    <Text role="support">{t('Layout React thật, dùng lại component đang có. Dữ liệu chỉ là ví dụ.',
     'Real React components, isolated fixture-only data.')}</Text>
   </div>
   <a href="./" className="li-ui-lab-back">{t('Về Design System','Back to Design System')}</a>
  </header>
  <section className="li-ui-lab-toolbar" aria-label={t('Điều khiển thử nghiệm','Experiment controls')}>
   <div className="li-ui-lab-control"><span>{t('Layout đang xem','Active layout')}</span>
    <div className="li-ui-lab-options">
     {homeLayoutVariants.map(item=><Button key={item.id} variant={variant===item.id?'primary':'secondary'}
      aria-pressed={variant===item.id} onClick={()=>setVariant(item.id)}>{locale==='vi'?item.vi:item.en}</Button>)}
    </div>
   </div>
   <div className="li-ui-lab-control"><span>{t('Thử nghiệm','Preview')}</span>
    <div className="li-ui-lab-options">
     <Button variant={compare?'primary':'secondary'} aria-pressed={compare} onClick={()=>setCompare(v=>!v)}>
      {t('So sánh 2 bản','Compare two')}</Button>
     <Button variant="secondary" onClick={()=>setLocale(l=>l==='vi'?'en':'vi')}>{locale.toUpperCase()}</Button>
    </div>
   </div>
   {compare?<div className="li-ui-lab-control"><label htmlFor="li-ui-compare-variant">{t('So với','Compare against')}</label>
    <select id="li-ui-compare-variant" value={other}
     onChange={e=>setOther(e.target.value as HomeLayoutVariant)}>
     {homeLayoutVariants.map(item=><option key={item.id} value={item.id}>{item.vi}</option>)}
    </select>
   </div>:null}
  </section>
  <div className="li-ui-lab-status"><Badge tone="emphasis">{t('BRANCH THỬ NGHIỆM','EXPERIMENT BRANCH')}</Badge>
   <Text role="support">{t('Không chạm dữ liệu học, đăng nhập hay giao diện app thật.',
    'No learner data, sign-in or existing app UI is changed.')}</Text>
  </div>
  <div className="li-ui-lab-previews" data-compare={compare?'true':'false'}>
   <section className="li-ui-lab-preview" aria-label={'Preview '+variant}>
    <p className="li-ui-lab-preview-label">{variant.toUpperCase()}</p>
    <HomeLayout variant={variant} {...view}/>
   </section>
   {compare?<section className="li-ui-lab-preview" aria-label={'Preview '+other}>
    <p className="li-ui-lab-preview-label">{other.toUpperCase()}</p>
    <HomeLayout variant={other} {...view}/>
   </section>:null}
  </div>
  {notice?<p role="status" className="li-ui-lab-feedback">{notice}</p>:null}
  <footer className="li-ui-lab-footer">
   <Text role="support">{t('Muốn áp dụng: import HomeLayout và truyền state/actions thật từ Home React. Không copy lại JSX/CSS.',
    'To promote: import HomeLayout and pass the existing Home React state/actions. No JSX/CSS rewrite.')}</Text>
  </footer>
 </main>;
}
const root=document.getElementById('li-ui-lab-root');
if(!root)throw Error('LI_UI_LAB_ROOT_MISSING');
createRoot(root).render(<UiLab/>);
