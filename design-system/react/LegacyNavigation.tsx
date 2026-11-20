import React from 'react';
import type {ReactNode} from 'react';
import {Dialog} from './Dialog';

export interface NavChoice {id:string;label:string;href:string;icon?:ReactNode}

/** UX-DS-11 bottom nav parity: four actual links, active sand icon surface. */
export interface MobileBottomNavProps {
 label:string;items:readonly NavChoice[];activeId:string;
}
export function MobileBottomNav({label,items,activeId}:MobileBottomNavProps){
 if(items.length!==4)throw Error('MobileBottomNav expects four navigation items');
 return <nav className="li-legacy-bottom-nav" data-li-legacy="bottom-nav" aria-label={label}>
  <ul>{items.map(item=><li key={item.id}><a href={item.href}
   aria-current={item.id===activeId?'page':undefined}>
   <span className="li-legacy-bottom-icon" aria-hidden="true">{item.icon||'✦'}</span>
   <span>{item.label}</span></a></li>)}</ul>
 </nav>;
}

export interface SidebarMenuProps {
 label:string;items:readonly NavChoice[];activeId?:string;
}
export function SidebarMenu({label,items,activeId}:SidebarMenuProps){
 return <nav className="li-legacy-sidebar" data-li-legacy="sidebar-menu" aria-label={label}>
  <ul>{items.map(item=><li key={item.id}>
   <a href={item.href} aria-current={activeId===item.id?'page':undefined}>
    {item.icon?<span aria-hidden="true">{item.icon}</span>:null}<span>{item.label}</span>
   </a>
  </li>)}</ul>
 </nav>;
}

export type TopNavMode='logo'|'back'|'transparent';
export interface TopNavContextProps {
 mode:TopNavMode;brand:string;homeHref:string;
 backHref?:string;backLabel?:string;pageTitle?:string;
 artwork?:ReactNode;actions?:ReactNode;
}
export function TopNavContext({mode,brand,homeHref,backHref,backLabel,
 pageTitle,artwork,actions}:TopNavContextProps){
 return <header className="li-legacy-top-nav" data-li-legacy="top-nav" data-mode={mode}>
  <div className="li-legacy-top-brand">
   {mode==='back'&&backHref?<a href={backHref} className="li-legacy-top-back">
    <span aria-hidden="true">‹</span>{backLabel||'Back'}</a>:
    <a className="li-legacy-top-home" href={homeHref}>
     {artwork?<span className="li-legacy-top-art" aria-hidden="true">{artwork}</span>:null}
     <span>{brand}</span>
    </a>}
   {pageTitle?<span className="li-legacy-top-page">{pageTitle}</span>:null}
  </div>
  {actions?<div className="li-legacy-top-actions">{actions}</div>:null}
 </header>;
}

export interface LaoLyCompanionProps {
 label:string;title:string;open:boolean;onOpenChange:(open:boolean)=>void;
 artworkSrc:string;description?:string;children?:ReactNode;closeLabel:string;
}
export function LaoLyCompanion({label,title,open,onOpenChange,artworkSrc,
 description,children,closeLabel}:LaoLyCompanionProps){
 return <div data-li-legacy="companion">
  <button className="li-legacy-companion-fab" type="button" aria-label={label}
   aria-haspopup="dialog" aria-expanded={open} onClick={()=>onOpenChange(true)}>
   <img src={artworkSrc} alt="" aria-hidden="true" loading="lazy"/>
   <span>{label}</span>
  </button>
  <Dialog title={title} open={open} onRequestClose={()=>onOpenChange(false)}
   closeLabel={closeLabel} description={description}>
   <div className="li-legacy-companion-body">
    <img src={artworkSrc} alt="" aria-hidden="true" loading="lazy"/>
    <div>{children}</div>
   </div>
  </Dialog>
 </div>;
}
