import React from 'react';
import type {FormEventHandler,HTMLAttributes,ReactNode} from 'react';
import {Field,IconButton} from './Controls';
import {Button,FilterChip} from './Components';

/** Stage05: UI-only composition; consumers own query, result and persistence state. */
export interface SearchFieldProps {
 label:string;value:string;onQueryChange:(next:string)=>void;
 onSearch?:(query:string)=>void;hint?:string;placeholder?:string;
 clearLabel:string;submitLabel:string;disabled?:boolean;
}
export function SearchField({label,value,onQueryChange,onSearch,hint,placeholder,
 clearLabel,submitLabel,disabled=false}:SearchFieldProps){
 const submit:FormEventHandler<HTMLFormElement>=event=>{
  event.preventDefault();if(!disabled)onSearch?.(value.trim());
 };
 return <form role="search" className="li-ds-search-field" data-li-molecule="search-field" onSubmit={submit}>
  <Field label={label} type="search" value={value} disabled={disabled}
   hint={hint} placeholder={placeholder} onChange={event=>onQueryChange(event.target.value)}/>
  <div className="li-ds-search-actions">
   {value.length>0?<IconButton icon="close" disabled={disabled}
     label={clearLabel} onClick={()=>onQueryChange('')}/>:null}
   <Button type="submit" disabled={disabled} variant="secondary">{submitLabel}</Button>
  </div>
 </form>;
}
export function ActionGroup({label,className='',children,...props}:
 HTMLAttributes<HTMLDivElement>&{label:string;children:ReactNode}){
 if(!label.trim())throw Error('ActionGroup requires an accessible label');
 return <div {...props} role="group" aria-label={label} data-li-molecule="action-group"
  className={'li-ds-action-group '+className}>{children}</div>;
}
export type FeedbackTone='info'|'error'|'success'|'loading';
export interface InlineFeedbackProps {
 tone:FeedbackTone;message:string;title?:string;
 actionLabel?:string;onAction?:()=>void;
}
export function InlineFeedback({tone,message,title,actionLabel,onAction}:InlineFeedbackProps){
 if(!message.trim())throw Error('InlineFeedback requires content');
 return <div className="li-ds-inline-feedback" data-li-molecule="inline-feedback"
  data-tone={tone} role={tone==='error'?'alert':'status'} aria-busy={tone==='loading'||undefined}>
  {title?<strong>{title}</strong>:null}
  <p>{message}</p>
  {actionLabel&&onAction&&tone!=='loading'?
   <Button variant="ghost" onClick={onAction}>{actionLabel}</Button>:null}
 </div>;
}

/** Stage05 controlled presentation-only status, not a persistence confirmation. */
export type SaveState='unsaved'|'saving'|'saved-device'|'synced'|'offline'|'error';
export interface SaveStatusProps {
 state:SaveState;message:string;detail?:string;retryLabel?:string;onRetry?:()=>void;
}
export function SaveStatus({state,message,detail,retryLabel,onRetry}:SaveStatusProps){
 if(!message.trim())throw Error('SaveStatus requires truthful caller-supplied status copy');
 return <div className="li-ds-save-status" data-li-molecule="save-status" data-state={state}
  role={state==='error'?'alert':'status'} aria-busy={state==='saving'||undefined}>
  <span className="li-ds-save-status-dot" aria-hidden="true"/>
  <div className="li-ds-save-status-copy"><strong>{message}</strong>{detail?<p>{detail}</p>:null}</div>
  {state==='error'&&onRetry&&retryLabel?
   <Button variant="ghost" onClick={onRetry}>{retryLabel}</Button>:null}
 </div>;
}

export type LanguageCode='vi'|'en';
export interface LanguageSwitchProps {
 label:string;value:LanguageCode;onChange:(next:LanguageCode)=>void;
 viLabel:string;enLabel:string;disabled?:boolean;
}
export function LanguageSwitch({label,value,onChange,viLabel,enLabel,disabled=false}:LanguageSwitchProps){
 if(!label.trim())throw Error('LanguageSwitch requires an accessible group label');
 return <div role="group" aria-label={label} className="li-ds-language-switch"
  data-li-molecule="language-switch">
  {([{code:'vi',name:viLabel},{code:'en',name:enLabel}] as const).map(({code,name})=>
   <button key={code} type="button" lang={code} aria-pressed={value===code} disabled={disabled}
    onClick={()=>{if(value!==code)onChange(code);}}>{name}</button>)}
 </div>;
}

export interface FilterOption {value:string;label:string}
export interface FilterGroupProps {
 label:string;options:readonly FilterOption[];selected:readonly string[];
 onChange:(next:string[])=>void;multiple?:boolean;allowEmpty?:boolean;disabled?:boolean;
}
export function FilterGroup({label,options,selected,onChange,multiple=true,
 allowEmpty=true,disabled=false}:FilterGroupProps){
 if(!label.trim())throw Error('FilterGroup requires an accessible group label');
 function toggle(value:string){
  const chosen=selected.includes(value);
  if(chosen&&!allowEmpty&&selected.length===1)return;
  onChange(multiple?(chosen?selected.filter(s=>s!==value):[...selected,value]):(chosen?[]:[value]));
 }
 return <div role="group" aria-label={label} className="li-ds-filter-group"
  data-li-molecule="filter-group" data-mode={multiple?'multiple':'single'}>
  {options.map(option=><FilterChip key={option.value} pressed={selected.includes(option.value)}
   disabled={disabled} onClick={()=>toggle(option.value)}>{option.label}</FilterChip>)}
 </div>;
}

export interface ListRowProps {
 title:string;description?:string;meta?:string;leading?:ReactNode;trailing?:ReactNode;
 href?:string;onActivate?:()=>void;current?:boolean;disabled?:boolean;
}
export function ListRow({title,description,meta,leading,trailing,href,
 onActivate,current=false,disabled=false}:ListRowProps){
 if(!title.trim())throw Error('ListRow needs a visible title');
 if(href&&onActivate)throw Error('ListRow is a link OR an action, not both');
 const body=<>
  {leading?<span className="li-ds-list-row-leading">{leading}</span>:null}
  <span className="li-ds-list-row-content"><strong>{title}</strong>
   {description?<span className="li-ds-list-row-description">{description}</span>:null}</span>
  {meta?<small className="li-ds-list-row-meta">{meta}</small>:null}
  {trailing?<span className="li-ds-list-row-trailing">{trailing}</span>:null}
 </>;
 const attrs={className:'li-ds-list-row', 'data-li-molecule':'list-row'} as const;
 if(disabled)return <div {...attrs} aria-disabled="true">{body}</div>;
 if(href)return <a {...attrs} href={href} aria-current={current?'page':undefined}>{body}</a>;
 if(onActivate)return <button {...attrs} type="button" onClick={onActivate}>{body}</button>;
 return <div {...attrs}>{body}</div>;
}

export interface BreadcrumbItem {label:string;href?:string}
export interface BreadcrumbProps {label:string;items:readonly BreadcrumbItem[]}
export function Breadcrumb({label,items}:BreadcrumbProps){
 if(!label.trim()||!items.length)throw Error('Breadcrumb needs a label and at least one item');
 return <nav aria-label={label} className="li-ds-breadcrumb" data-li-molecule="breadcrumb">
  <ol>{items.map((item,i)=>{
   const last=i===items.length-1;
   return <li key={i}>{!last&&item.href?<a href={item.href}>{item.label}</a>:
     <span aria-current={last?'page':undefined}>{item.label}</span>}</li>;
  })}</ol>
 </nav>;
}


/** Source provenance metadata. The consumer owns evidence and review status. */
export type SourceReviewState='unreviewed'|'linked'|'reviewed'|'unavailable';
export interface SourceStatusProps {
 title:string;sourceLabel:string;statusLabel:string;state:SourceReviewState;
 href?:string;detail?:string;
}
export function SourceStatus({title,sourceLabel,statusLabel,state,href,detail}:SourceStatusProps){
 if(!title.trim()||!sourceLabel.trim()||!statusLabel.trim())
  throw Error('SourceStatus requires a title, source label and caller-supplied status');
 return <section className="li-ds-source-status" data-li-molecule="source-status"
  data-state={state} aria-label={title}>
  <div className="li-ds-source-heading"><strong>{title}</strong>
   <span className="li-ds-source-review">{statusLabel}</span></div>
  <div className="li-ds-source-reference">
   {href?<a href={href}>{sourceLabel}</a>:<span>{sourceLabel}</span>}
  </div>
  {detail?<p>{detail}</p>:null}
 </section>;
}

/** A native details disclosure, with keyboard behavior supplied by HTML. */
export interface DisclosureProps {
 summary:string;children:ReactNode;defaultOpen?:boolean;
 onOpenChange?:(open:boolean)=>void;
}
export function Disclosure({summary,children,defaultOpen=false,onOpenChange}:DisclosureProps){
 if(!summary.trim())throw Error('Disclosure needs a visible summary');
 return <details className="li-ds-disclosure" data-li-molecule="disclosure"
  open={defaultOpen?true:undefined}
  onToggle={event=>onOpenChange?.(event.currentTarget.open)}>
  <summary>{summary}</summary>
  <div className="li-ds-disclosure-body">{children}</div>
 </details>;
}

export interface ActionMenuItem {
 id:string;label:string;href?:string;onSelect?:()=>void;disabled?:boolean;
}
export interface ActionMenuProps {
 label:string;items:readonly ActionMenuItem[];
}
export function ActionMenu({label,items}:ActionMenuProps){
 const root=React.useRef<HTMLDetailsElement>(null);
 const trigger=React.useRef<HTMLElement>(null);
 if(!label.trim())throw Error('ActionMenu needs a visible trigger label');
 const close=()=>{if(root.current)root.current.open=false;trigger.current?.focus();};
 return <details ref={root} className="li-ds-action-menu" data-li-molecule="action-menu"
  onKeyDown={event=>{if(event.key==='Escape'&&event.currentTarget.open){
   event.preventDefault();event.stopPropagation();close();
  }}}
  onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))event.currentTarget.open=false;}}>
  <summary ref={trigger}>{label}</summary>
  <ul>{items.map(item=>{
   if(item.href&&item.onSelect)throw Error('ActionMenu item must be link OR action');
   const unavailable=item.disabled||(!item.href&&!item.onSelect);
   return <li key={item.id}>
    {item.href&&!unavailable?<a href={item.href}>{item.label}</a>:
     <button type="button" disabled={unavailable} onClick={()=>{
      close();item.onSelect?.();
     }}>{item.label}</button>}
   </li>;
  })}</ul>
 </details>;
}
