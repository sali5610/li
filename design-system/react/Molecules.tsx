import React from 'react';
import type {FormEventHandler,HTMLAttributes,ReactNode} from 'react';
import {Field,IconButton} from './Controls';
import {Button} from './Components';

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
