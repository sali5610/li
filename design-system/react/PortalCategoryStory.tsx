/** React Portal Category specimen: seven foreground overlays and a tappable portal. */
import React,{useEffect,useState} from 'react';
import type {ChangeEvent} from 'react';
import {createRoot} from 'react-dom/client';
import {PortalCategoryCard} from './PortalCategoryCard';
import type {PortalVariant} from './PortalCategoryCard';
import './portal-category-card.css';
import './portal-category-story.css';

const q=new URLSearchParams(location.search);
const parsed=Number.parseInt((q.get('variant')||'Portal 01').replace(/[^0-9]/g,''),10);
const initial=(Number.isFinite(parsed)?Math.min(7,Math.max(1,parsed)):1) as PortalVariant;
const en=q.get('lang')==='en';
const tr=(vi:string,english:string)=>en?english:vi;

function Story(){
 const [portal,setPortal]=useState<PortalVariant>(initial);
 const [illustration,setIllustration]=useState<string|undefined>();
 const [opened,setOpened]=useState(false);
 useEffect(()=>()=>{if(illustration)URL.revokeObjectURL(illustration)},[illustration]);
 function chooseFile(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];
  if(file?.type.startsWith('image/'))setIllustration(URL.createObjectURL(file));
 }
 return <main className="li-portal-story" data-ui-react-portal="mounted" lang={en?'en':'vi'}>
  <p className="li-portal-story-kicker">UX-DS-35 / CARDS / REACT</p>
  <h1>{tr('Thẻ nhóm ngành · Cổng vòm','Group category · Portal card')}</h1>
  <p className="li-portal-story-explain">{tr(
   'Chạm vào toàn bộ hình và cổng để mở nhóm ngành. Không còn nút Khám phá; minh hoạ nằm dưới lớp cổng và có thể thay riêng.',
   'Tap the full portal illustration to open the category. No Explore button; replace the illustration behind the arch independently.')}</p>
  <nav className="li-portal-story-variants" aria-label={tr('Chọn cổng vòm','Select portal variant')}>
   {([1,2,3,4,5,6,7] as PortalVariant[]).map(v=>
    <button key={v} type="button" aria-pressed={portal===v}
     onClick={()=>{setPortal(v);setOpened(false);}}>{String(v).padStart(2,'0')}</button>)}
  </nav>
  {opened?
   <section className="li-portal-story-opened" aria-label={tr('Nhóm ngành Ngôn ngữ','Languages group')}>
    <button type="button" className="li-portal-story-back" onClick={()=>setOpened(false)}>
     {tr('← Quay lại nhóm ngành','← Back to categories')}
    </button>
    <p className="li-portal-story-kicker">{tr('NHÓM NGÀNH','DOMAIN GROUP')}</p>
    <h2>{tr('Ngôn ngữ','Languages')}</h2>
    <p>{tr('Chọn chuyên ngành để xem các môn học.','Choose a field to browse its courses.')}</p>
    <ul className="li-portal-story-fields">
     <li>{tr('Tiếng Trung','Chinese')}</li>
     <li>{tr('Tiếng Anh','English')}</li>
    </ul>
    <p className="li-portal-story-status">{tr(
     'Mô phỏng section được mở trong Studio. Khi dùng trong app, onOpen/href dẫn đến nhóm ngành thật.',
     'Studio section preview. In the app, onOpen/href navigates to the real category.')}</p>
   </section>:
   <PortalCategoryCard portal={portal}
    portalSrc={'../assets/portals/cong-moi-'+String(portal).padStart(2,'0')+'.webp'}
    eyebrow={tr('NHÓM NGÀNH','DOMAIN GROUP')} title={tr('Ngôn ngữ','Languages')}
    detail={tr('2 chuyên ngành','2 fields')}
    onOpen={()=>setOpened(true)}
    openLabel={tr('Mở nhóm ngành Ngôn ngữ','Open Languages group')}
    illustrationSrc={illustration}
    illustrationAlt={tr('Hình minh hoạ thử','Preview illustration')}
    placeholder={<span>{tr('Chỗ đặt minh hoạ','Illustration slot')}</span>}/>
  }
  <div className="li-portal-story-tools">
   <label htmlFor="portal-illustration">{tr('Thử thêm minh hoạ vào ruột cổng','Try an illustration inside the portal')}</label>
   <input id="portal-illustration" type="file" accept="image/*" onChange={chooseFile}/>
   {illustration?<button type="button" onClick={()=>setIllustration(undefined)}>{tr('Xoá ảnh thử','Clear preview')}</button>:null}
  </div>
  {!opened?<p className="li-portal-story-status">{tr(
   'Component demo · Thẻ Tàng Thư hiện tại chưa bị thay đổi.',
   'Component demo · Existing Library cards remain unchanged.')}</p>:null}
 </main>;
}
const root=document.getElementById('portal-category-root');
if(!root)throw Error('Portal Category React host missing');
createRoot(root).render(<Story/>);
