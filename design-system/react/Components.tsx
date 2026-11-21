import React from 'react';
import type {ButtonHTMLAttributes,HTMLAttributes,ReactNode} from 'react';
/** UX-DS-35 DRAFT only: native React Button and semantic Card, no app adoption. */
export type ButtonVariant='primary'|'secondary'|'ghost';
export type ButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{
 variant?:ButtonVariant;loading?:boolean;children:ReactNode;
};
export function Button({variant='primary',loading=false,disabled=false,type='button',
 className='',children,...props}:ButtonProps){
 return <button {...props} type={type} disabled={disabled||loading}
  aria-busy={loading||undefined} data-li-component="button" data-variant={variant}
  className={'li-ds-button '+className}>
  {loading?<span className="li-ds-button-spinner" aria-hidden="true"/>:null}
  <span>{children}</span></button>;
}
/** Shared numbered process/evidence row. The number inset is owned by this component,
 * rather than by each screen's card padding override. */
export type NumberedCardProps=HTMLAttributes<HTMLDivElement>&{
 number:string|number;children:ReactNode;
};
export function NumberedCard({number,className='',children,...props}:NumberedCardProps){
 return <div {...props} data-li-component="numbered-card"
  className={'path-item li-ds-numbered-card '+className}>
  <span className="path-num li-ds-numbered-card__number">{number}</span>
  {children}</div>;
}
export type CardVariant='raised'|'tinted'|'inverse'|'flat-study';
export type CardProps=HTMLAttributes<HTMLElement>&{variant?:CardVariant;children:ReactNode};
export function Card({variant='raised',className='',children,...props}:CardProps){
 return <section {...props} data-li-component="card" data-variant={variant}
  className={'li-ds-card '+className}>{children}</section>;
}

/** Filter Chip is the only round/pill exception to the square action grammar. */
export type FilterChipProps=ButtonHTMLAttributes<HTMLButtonElement>&{
 pressed:boolean;children:ReactNode;
};
export function FilterChip({pressed,type='button',className='',children,...props}:FilterChipProps){
 return <button {...props} type={type} aria-pressed={pressed}
  className={'li-ds-filter-chip '+className} data-li-component="filter-chip">
  {children}</button>;
}
