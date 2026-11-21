import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppNavigationControls} from '../../../../design-system/react/AppNavigation';
import {Breadcrumb} from '../../../../design-system/react/Molecules';
import '../../../../design-system/react/molecules.css';
import './app-screen-rhythm.css';
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
 const navActive=/^(lesson|draftLesson)/.test(active)?'catalog':
  active==='guideDetail'?'guide':
  ['resume','collection','noteDetail','dashboard'].includes(active)?'library':
  ['research','case'].includes(active)?'home':active;
 return <AppNavigationControls area={area} activeId={navActive} items={localized} onNavigate={openRoute}/>;
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
  type="button" aria-haspopup="dialog"
  aria-label={locale==='en'?'Manage account':'Quản lý tài khoản'}
  title={locale==='en'?'Account':'Tài khoản'}
  onClick={event=>open(event.currentTarget)}>
  <LiIcon name="user-round" size={22}/>
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

/** The global Back follows history; these crumbs express IA, not history.
 * The Catalog owns its deeper group > field > course > lesson trail.
 * Route labels are UI-only. No second router or data owner is introduced. */
type TrailPart={id?:string;vi:string;en:string};
const homeTrail:TrailPart={id:'home',vi:'Đại Sảnh',en:'Great Hall'};
const catalogTrail:TrailPart={id:'catalog',vi:'Tàng Thư',en:'Library'};
const libraryTrail:TrailPart={id:'library',vi:'Tủ Riêng',en:'My Shelf'};
const guideTrail:TrailPart={id:'guide',vi:'Thần Chú',en:'Spells'};
const researchTrail:TrailPart={id:'research',vi:'Khảo Chứng',en:'Investigate'};
const collectionTrail:TrailPart={id:'collection',vi:'Bộ Sưu Tập',en:'Collection'};
const trails:Record<string,TrailPart[]>={
 search:[{vi:'Tra Cứu',en:'Search'}],
 research:[researchTrail],
 case:[researchTrail,{vi:'Phản Chứng',en:'Challenge'}],
 capture:[{vi:'Nhặt Ý',en:'Capture'}],
 guide:[guideTrail],
 guideDetail:[guideTrail,{vi:'Chi tiết Thần Chú',en:'Spell detail'}],
 library:[libraryTrail],
 resume:[libraryTrail,{vi:'Quay Lại',en:'Continue'}],
 collection:[libraryTrail,collectionTrail],
 noteDetail:[libraryTrail,collectionTrail,{vi:'Chi tiết ghi chú',en:'Note detail'}],
 dashboard:[libraryTrail,{vi:'Nhật Ký',en:'Journal'}],
 settings:[{vi:'Cài Đặt',en:'Settings'}]
};
export function RouteTrail(){
 const route=useAppUiStore(state=>state.route);
 const locale=useAppLocale(),en=locale==='en';
 const lessonRoute=/^(lesson|draftLesson)/.test(route);
 const [lessonTitle,setLessonTitle]=useState('');
 useEffect(()=>{
  if(!lessonRoute){setLessonTitle('');return;}
  const page=document.getElementById('page-'+route);
  const sync=()=>setLessonTitle(page?.querySelector('h1')?.textContent?.trim()||'');
  sync();
  if(!page)return;
  const observer=new MutationObserver(sync);
  observer.observe(page,{childList:true,subtree:true,characterData:true});
  return()=>observer.disconnect();
 },[route,lessonRoute]);
 // Actual lesson routes still need the canonical clickable breadcrumb.
 // The global Back handles history; this trail shows hierarchy only.
 if(route==='home'||route==='catalog')return null;
 const flow=trails[route]||
  (/^(lesson|draftLesson)/.test(route)?
   [catalogTrail,{vi:lessonTitle||'Bài Học',en:lessonTitle||'Lesson'}]:
   [{vi:'Trang hiện tại',en:'Current page'}]);
 const parts=[homeTrail,...flow];
 return <div className="li-app-route-trail" data-li-review-status="draft">
  <Breadcrumb label={en?'You are here':'Vị trí hiện tại'}
   items={parts.map((part,index)=>({
    label:en?part.en:part.vi,
    onActivate:index<parts.length-1&&part.id?
     ()=>openRoute(part.id!):undefined
   }))}/>
 </div>;
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
 const main=document.getElementById('main');
 if(!main)throw Error('REACT_MAIN_FOR_ROUTE_TRAIL_MISSING');
 const trailHost=document.createElement('div');
 trailHost.id='li-react-route-trail';
 main.before(trailHost);
 const trailRoot=createRoot(trailHost);
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
 trailRoot.render(<RouteTrail/>);
 return ()=>{
  window.removeEventListener('li:route-changed',syncCanonicalRoute);
  mounts.forEach(({root})=>root.unmount());
  backRoot.unmount();backHost.replaceWith(originalBack);
  trailRoot.unmount();trailHost.remove();
  stopRouter();
 };
}
