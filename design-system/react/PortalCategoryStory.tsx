/** Real PortalCategoryCard specimen: seven supplied alpha overlays + editable interior preview. */
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
 const [opened,setOpened]=useState(0);
 useEffect(()=>()=>{if(illustration)URL.revokeObjectURL(illustration)},[illustration]);
 function chooseFile(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];
  if(file?.type.startsWith('image/'))setIllustration(URL.createObjectURL(file));
 }
 return <main className="li-portal-story" data-ui-react-portal="mounted" lang={en?'en':'vi'}>
  <p className="li-portal-story-kicker">UX-DS-35 / CARDS / REACT</p>
  <h1>{tr('Thẻ nhóm ngành · Cổng vòm','Group category · Portal card')}</h1>
  <p className="li-portal-story-explain">{tr(
    'Bảy cổng gốc chuyển thành ảnh WebP trong suốt. Minh hoạ có thể thay riêng bên dưới, còn bố cục chữ giữ nguyên.',
    'Seven supplied portal designs, converted to transparent WebP. Replace the illustration behind the arch independently of the text.')}</p>
  <nav className="li-portal-story-variants" aria-label={tr('Chọn cổng vòm','Select portal variant')}>
   {([1,2,3,4,5,6,7] as PortalVariant[]).map(v=>
    <button key={v} type="button" aria-pressed={portal===v}
     onClick={()=>setPortal(v)}>{String(v).padStart(2,'0')}</button>)}
  </nav>
  <PortalCategoryCard portal={portal}
   portalSrc={'../assets/portals/cong-moi-'+String(portal).padStart(2,'0')+'.webp'}
   eyebrow={tr('NHÓM NGÀNH','DOMAIN GROUP')} title={tr('Ngôn ngữ','Languages')}
   detail={tr('2 chuyên ngành','2 disciplines')} actionLabel={tr('Khám phá','Explore')}
   onOpen={()=>setOpened(n=>n+1)}
   illustrationSrc={illustration} illustrationAlt={tr('Hình thử được tải lên trong trình duyệt','Local illustration preview')}
   placeholder={<span>{tr('Chỗ đặt minh hoạ','Illustration slot')}</span>}/>
  <div className="li-portal-story-tools">
   <label htmlFor="portal-illustration">{tr('Thử thêm minh hoạ vào ruột cổng','Try an illustration inside the portal')}</label>
   <input id="portal-illustration" type="file" accept="image/*" onChange={chooseFile}/>
   {illustration?<button type="button" onClick={()=>setIllustration(undefined)}>{tr('Xoá ảnh thử','Clear preview')}</button>:null}
  </div>
  <p className="li-portal-story-status" role="status">{opened
   ?tr('Đã bấm Khám phá (demo): ','Explore demo activations: ')+opened
   :tr('Chỉ để review component; không thay nội dung Tàng Thư.','Component preview only; live library cards are unchanged.')}</p>
 </main>;
}
const root=document.getElementById('portal-category-root');
if(!root)throw Error('Portal Category React host missing');
createRoot(root).render(<Story/>);
