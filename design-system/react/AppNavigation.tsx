import React from 'react';
import {LiIcon} from './LucideIcons';
import type {LiIconRole} from './LucideIcons';

/** Canonical app navigation buttons. Product routing remains owned by the app.
 * Preserve the native data-page contract until each page is fully React.
 */
export interface AppNavigationItem {
 id:string;
 label:string;
 accessibleLabel:string;
 title?:string;
 icon?:LiIconRole;
}
export interface AppNavigationControlsProps {
 area:'desktop'|'mobile'|'utilities';
 activeId:string;
 items:readonly AppNavigationItem[];
}
export function AppNavigationControls({area,activeId,items}:AppNavigationControlsProps){
 return <React.Fragment>{items.map(item=><button
  key={item.id}
  type="button"
  className={(area==='utilities'?'tool-button':'nav-btn')+(activeId===item.id?' active':'')}
  data-page={item.id}
  data-li-component="app-navigation-control"
  aria-current={activeId===item.id?'page':undefined}
  aria-label={item.accessibleLabel}
  title={item.title||item.label}>
  {area!=='desktop'&&item.icon?<LiIcon name={item.icon} className="icon" size={22}/>:null}
  {area==='utilities'?null:item.label}
 </button>)}</React.Fragment>;
}
