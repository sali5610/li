import React from 'react';
import type {AnchorHTMLAttributes,HTMLAttributes,ProgressHTMLAttributes,ReactNode} from 'react';

/** UX-DS-35 Stage04 — visual atoms, no product state or navigation router.
 * All color, spacing and type values resolve through canonical generated DS tokens. */
const join=(...parts:(string|undefined|false)[])=>parts.filter(Boolean).join(' ');
export type TextRole='body'|'bodyLarge'|'support'|'caption';
export function Text({as='p',role='body',className='',...props}:
 HTMLAttributes<HTMLElement>&{as?:'p'|'span'|'small';role?:TextRole;children:ReactNode}){
 return React.createElement(as,{...props,'data-li-atom':'text','data-role':role,
  className:join('li-atom-text',className)});
}
export type HeadingRole='display'|'headline'|'titleLarge'|'titleMedium'|'titleSmall';
export function Heading({level=2,role='titleMedium',className='',...props}:
 HTMLAttributes<HTMLHeadingElement>&{level?:1|2|3|4;role?:HeadingRole;children:ReactNode}){
 return React.createElement('h'+level,{...props,'data-li-atom':'heading','data-role':role,
  className:join('li-atom-heading',className)});
}
export function Link({className='',href,children,...props}:
 AnchorHTMLAttributes<HTMLAnchorElement>&{href:string;children:ReactNode}){
 if(!href.trim())throw Error('Link requires an actual destination');
 return <a {...props} href={href} data-li-atom="link" className={join('li-atom-link',className)}>
  {children}</a>;
}
export function Divider({decorative=false,className='',...props}:
 HTMLAttributes<HTMLHRElement>&{decorative?:boolean}){
 return <hr {...props} data-li-atom="divider" aria-hidden={decorative||undefined}
   className={join('li-atom-divider',className)}/>;
}
export function Badge({tone='neutral',className='',children,...props}:
 HTMLAttributes<HTMLSpanElement>&{tone?:'neutral'|'emphasis';children:ReactNode}){
 return <span {...props} data-li-atom="badge" data-tone={tone}
  className={join('li-atom-badge',className)}>{children}</span>;
}
export function Progress({label,value,max=100,className='',...props}:
 Omit<ProgressHTMLAttributes<HTMLProgressElement>,'max'|'value'|'aria-label'> & {
 label:string;value?:number;max?:number
 }){
 if(!label.trim())throw Error('Progress requires an accessible label');
 if(!(max>0))throw Error('Progress max must be positive');
 if(value!==undefined&&(!Number.isFinite(value)||value<0||value>max))
  throw Error('Progress value outside range');
 return <progress {...props} data-li-atom="progress" aria-label={label}
  value={value} max={max} className={join('li-atom-progress',className)}/>;
}
