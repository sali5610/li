import React from 'react';
import {createRoot} from 'react-dom/client';
import {AppNavigationControls} from '../../../../design-system/react/AppNavigation';
import type {AppNavigationItem,AppNavigationControlsProps} from '../../../../design-system/react/AppNavigation';

/** One staging app, not an injected second router.
 * The existing document-level data-page handler keeps history/focus/URL behavior
 * while the visible shared navigation is now React-owned.
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

function currentPage(){
 const id=document.querySelector<HTMLElement>('section.page.active')?.id||'page-home';
 return id.startsWith('page-')?id.slice(5):'home';
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
 let active=currentPage();
 const render=()=>mounts.forEach(({root,area,items})=>root.render(
  <AppNavigationControls area={area} activeId={active} items={items}/>
 ));
 const update=()=>{
  const next=currentPage();
  if(next!==active){active=next;render();}
 };
 const observer=new MutationObserver(update);
 document.querySelectorAll('section.page').forEach(section=>
  observer.observe(section,{attributes:true,attributeFilter:['class']}));
 render();
 return ()=>{observer.disconnect();mounts.forEach(({root})=>root.unmount());};
}
