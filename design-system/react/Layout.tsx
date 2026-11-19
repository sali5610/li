import React from 'react';
import type {HTMLAttributes,ReactNode} from 'react';

/** UX-DS-35 Stage03 — layout only. No app route, learner state or CSS paint owner.
 * Tokens are inherited from design-system/tokens.json via generated CSS. */
type LayoutProps=HTMLAttributes<HTMLDivElement>&{children:ReactNode};
type Space='2'|'3'|'4'|'6';
const classes=(...parts:(string|undefined|false)[])=>parts.filter(Boolean).join(' ');

export function Container({measure='content',className='',...props}:LayoutProps&{
 measure?:'reading'|'content'|'wide'
}){
 return <div {...props} data-li-layout="container" data-measure={measure}
  className={classes('li-layout-container',className)}/>;
}

export function Stack({space='4',className='',...props}:LayoutProps&{space?:Space}){
 return <div {...props} data-li-layout="stack" data-space={space}
  className={classes('li-layout-stack',className)}/>;
}

export function Inline({space='3',align='center',collapseOnNarrow=false,className='',...props}:LayoutProps&{
 space?:Space;align?:'start'|'center'|'end';collapseOnNarrow?:boolean
}){
 return <div {...props} data-li-layout="inline" data-space={space} data-align={align}
  data-collapse={collapseOnNarrow?'narrow':undefined}
  className={classes('li-layout-inline',className)}/>;
}

export function Cluster({space='3',distribution='start',className='',...props}:LayoutProps&{
 space?:Space;distribution?:'start'|'between'|'end'
}){
 return <div {...props} data-li-layout="cluster" data-space={space} data-distribution={distribution}
  className={classes('li-layout-cluster',className)}/>;
}

export function Grid({space='4',cell='regular',className='',...props}:LayoutProps&{
 space?:Space;cell?:'compact'|'regular'|'wide'
}){
 return <div {...props} data-li-layout="grid" data-space={space} data-cell={cell}
  className={classes('li-layout-grid',className)}/>;
}

export function SafeArea({className='',...props}:LayoutProps){
 return <div {...props} data-li-layout="safe-area"
  className={classes('li-layout-safe-area',className)}/>;
}

export function ScrollRegion({label,className='',...props}:Omit<LayoutProps,'aria-label'>&{label:string}){
 if(!label.trim())throw Error('ScrollRegion requires a descriptive accessible label');
 return <div {...props} role="region" aria-label={label} tabIndex={0}
  data-li-layout="scroll-region" className={classes('li-layout-scroll-region',className)}/>;
}
