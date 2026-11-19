import React from 'react';
import type {ButtonHTMLAttributes,HTMLAttributes,ReactNode} from 'react';

/** Step16.2 first shared React primitives; inherit canonical site design tokens. */
export function ActionButton({kind='primary',className='',type='button',...props}:
  ButtonHTMLAttributes<HTMLButtonElement>&{kind?:'primary'|'secondary'}){
 return <button type={type} {...props} className={['pilot-action',kind==='secondary'?'secondary':'',className].filter(Boolean).join(' ')}/>;
}
export function Surface({children,className='',...props}:
  HTMLAttributes<HTMLElement>&{children:ReactNode}){
 return <section {...props} className={['pilot-surface',className].filter(Boolean).join(' ')}>{children}</section>;
}
export function StatusMessage({children,...props}:
  HTMLAttributes<HTMLParagraphElement>&{children:ReactNode}){
 return <p {...props} role="status" aria-live="polite">{children}</p>;
}
