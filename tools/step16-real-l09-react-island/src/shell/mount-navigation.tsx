import React from 'react';
import {createRoot} from 'react-dom/client';
import {AppNavigationControls} from '../../../../design-system/react/AppNavigation';
import type {AppNavigationItem,AppNavigationControlsProps} from '../../../../design-system/react/AppNavigation';
import {openRoute,goBack,syncCanonicalRoute} from './app-router.js';
import {useAppUiStore} from './app-store.js';
import {LiIcon} from '../../../../design-system/react/LucideIcons';

/** One staging app, not an injected second router.
 * Visible React controls dispatch typed direct routes to the existing one
 * history/focus/URL controller; no delegated data-page click for this nav.
 */
const destinations:readonly AppNavigationItem[]=[
 {id:'home',label:'Đại Sảnh',accessibleLabel:'Đại Sảnh — Trang chủ',title:'Trang chủ',icon:'trees'},
 {id:'catalog',label:'Tàng Thư',accessibleLabel:'Tàng Thư — Khám phá ngành học',title:'Khám phá ngành học',icon:'library-big'},
 {id:'guide',label:'Thần Chú',accessibleLabel:'Thần Chú — 13 phương pháp học',title:'13 phương pháp học',icon:'sparkle'},
 {id:'library',label:'Tủ Riêng',accessibleLabel:'Tủ Riêng — Hành trình và case cá nhân',title:'Hành trình và case cá nhân',icon:'archive'}
];
const utilities:readonly AppNavigationItem[]=[
 {id:'search',label:'Tra Cứu',accessibleLabel:'Tìm kiếm',title:'Tìm kiếm',icon:'search'},
 {id:'capture',label:'Nhặt ý',accessibleLabel:'Nhặt ý',title:'Nhặt ý',icon:'feather'},
 {id:'settings',label:'Cài đặt',accessibleLabel:'Cài đặt',title:'Cài đặt',icon:'settings-2'}
];

function NavigationSurface({area,items}:{area:AppNavigationControlsProps['area'];items:readonly AppNavigationItem[]}){
 const active=useAppUiStore(state=>state.route);
 return <AppNavigationControls area={area} activeId={active} items={items} onNavigate={openRoute}/>;
}
function BackControl(){
 const active=useAppUiStore(state=>state.route);
 return <button id="li-global-back" className="li-global-back"
  type="button" hidden={active==='home'} onClick={goBack}
  aria-label="Quay lại màn trước" title="Quay lại">
  <LiIcon name="arrow-left" size={20}/>
 </button>;
}

export function mountSharedNavigation(){
 const surfaces:{selector:string;area:AppNavigationControlsProps['area'];items:readonly AppNavigationItem[]}[]=[
  {selector:'.header .topnav',area:'desktop',items:destinations},
  {selector:'.mobile-nav',area:'mobile',items:destinations},
  {selector:'.header .tools',area:'utilities',items:utilities}
 ];
 const mounts=surfaces.map(({selector,area,items})=>{
  const host=document.querySelector<HTMLElement>(selector);
  if(!host)throw Error('REACT_NAV_HOST_MISSING: '+selector);
  const root=createRoot(host);
  host.dataset.liReactNavigation=area;
  return {root,area,items};
 });
 const originalBack=document.getElementById('li-global-back');
 if(!originalBack)throw Error('REACT_BACK_HOST_MISSING');
 const backHost=document.createElement('span');
 backHost.id='li-react-global-back-root';
 // Keep header flex geometry: React's button occupies the original flex item.
 backHost.style.display='contents';
 originalBack.replaceWith(backHost);
 const backRoot=createRoot(backHost);
 // The old route controller remains authoritative; Zustand notifies all
 // React navigation roots together (including native-origin route changes).
 const observer=new MutationObserver(syncCanonicalRoute);
 document.querySelectorAll('section.page').forEach(section=>
  observer.observe(section,{attributes:true,attributeFilter:['class']}));
 syncCanonicalRoute();
 mounts.forEach(({root,area,items})=>
  root.render(<NavigationSurface area={area} items={items}/>));
 backRoot.render(<BackControl/>);
 return ()=>{
  observer.disconnect();mounts.forEach(({root})=>root.unmount());
  backRoot.unmount();backHost.replaceWith(originalBack);
 };
}
