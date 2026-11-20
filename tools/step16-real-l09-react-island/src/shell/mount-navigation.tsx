import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppNavigationControls} from '../../../../design-system/react/AppNavigation';
import type {AppNavigationItem,AppNavigationControlsProps} from '../../../../design-system/react/AppNavigation';
import {openRoute,goBack,syncCanonicalRoute,mountReactRouter} from './app-router.js';
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

const english:Record<string,[string,string,string]>={
 home:['Great Hall','Great Hall — Home','Home'],
 catalog:['Library','Library — Explore fields','Explore fields'],
 guide:['Spells','Spells — 13 learning techniques','13 learning techniques'],
 library:['My Shelf','My Shelf — Your learning and notes','Your shelf'],
 search:['Search','Search the library','Search'],
 capture:['Capture','Capture an idea','Capture an idea'],
 settings:['Settings','Settings','Settings']
};
function useAppLocale(){
 const owner=window as Window&{liLanguage?:{get:()=>string}};
 const [locale,setLocale]=useState(()=>owner.liLanguage?.get?.()||'vi');
 useEffect(()=>{
  const sync=()=>setLocale(owner.liLanguage?.get?.()||'vi');
  window.addEventListener('li:localechange',sync);
  return()=>window.removeEventListener('li:localechange',sync);
 },[]);
 return locale;
}
function NavigationSurface({area,items}:{area:AppNavigationControlsProps['area'];items:readonly AppNavigationItem[]}){
 const active=useAppUiStore(state=>state.route),locale=useAppLocale();
 const localized=locale==='en'?items.map(item=>{
  const [label,accessibleLabel,title]=english[item.id]||[item.label,item.accessibleLabel,item.title];
  return {...item,label,accessibleLabel,title};
 }):items;
 return <AppNavigationControls area={area} activeId={active} items={localized} onNavigate={openRoute}/>;
}
/** The only visible account entry point: no hidden legacy Settings button. */
function AccountControl(){
 const locale=useAppLocale();
 const open=(trigger:HTMLElement)=>{
  const owner=window as Window&{
   liAccountOverlay?:{open:(trigger:HTMLElement)=>boolean}
  };
  owner.liAccountOverlay?.open(trigger);
 };
 return <button id="li-react-account-trigger" className="tool-button"
  type="button" aria-label={locale==='en'?'Manage account':'Quản lý tài khoản'}
  title={locale==='en'?'Account':'Tài khoản'}
  onClick={event=>open(event.currentTarget)}>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
   strokeLinejoin="round" aria-hidden="true">
   <circle cx="12" cy="8" r="3.5"/>
   <path d="M4 21v-2a8 8 0 0 1 16 0v2"/>
  </svg>
 </button>;
}
function BackControl(){
 const active=useAppUiStore(state=>state.route),locale=useAppLocale();
 return <button id="li-global-back" className="li-global-back"
  type="button" hidden={active==='home'} onClick={goBack}
  aria-label={locale==='en'?'Go back':'Quay lại màn trước'}
  title={locale==='en'?'Back':'Quay lại'}>
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
 // React owns route state. All native, draft-preview and browser history
 // entrypoints dispatch through the same port and explicit state event.
 const stopRouter=mountReactRouter();
 window.addEventListener('li:route-changed',syncCanonicalRoute);
 syncCanonicalRoute();
 mounts.forEach(({root,area,items})=>
  root.render(<>
   <NavigationSurface area={area} items={items}/>
   {area==='utilities'&&<AccountControl/>}
  </>));
 backRoot.render(<BackControl/>);
 return ()=>{
  window.removeEventListener('li:route-changed',syncCanonicalRoute);
  mounts.forEach(({root})=>root.unmount());
  backRoot.unmount();backHost.replaceWith(originalBack);
  stopRouter();
 };
}
