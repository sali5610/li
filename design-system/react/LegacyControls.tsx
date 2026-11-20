import React,{useId} from 'react';
import type {ChangeEventHandler,ReactNode} from 'react';
import {Dialog} from './Dialog';
import {Button} from './Components';
import {LiIcon} from './LucideIcons';
import type {LiIconRole} from './LucideIcons';

export interface NativeSelectOption {value:string;label:string;disabled?:boolean}
export interface SelectFieldProps {
 label:string;value:string;options:readonly NativeSelectOption[];
 onChange:(value:string)=>void;hint?:string;disabled?:boolean;
}
export function SelectField({label,value,options,onChange,hint,disabled=false}:SelectFieldProps){
 const id=useId();
 return <div className="li-legacy-form" data-li-legacy="select-field">
  <label htmlFor={id}>{label}</label>
  <select id={id} value={value} disabled={disabled}
   onChange={event=>onChange(event.target.value)}>
   {options.map(option=><option key={option.value} value={option.value}
    disabled={option.disabled}>{option.label}</option>)}
  </select>{hint?<p>{hint}</p>:null}
 </div>;
}

export interface NotebookTextareaProps {
 label:string;value:string;onChange:ChangeEventHandler<HTMLTextAreaElement>;
 maxLength?:number;rows?:number;disabled?:boolean;readOnly?:boolean;hint?:string;
}
export function NotebookTextarea({label,value,onChange,maxLength=240,
 rows=5,disabled,readOnly,hint}:NotebookTextareaProps){
 const id=useId();
 return <div className="li-legacy-form li-legacy-notebook" data-li-legacy="notebook-field">
  <div className="li-legacy-field-heading"><label htmlFor={id}>{label}</label>
   <output>{value.length} / {maxLength}</output></div>
  <textarea id={id} value={value} onChange={onChange} rows={rows}
   maxLength={maxLength} disabled={disabled} readOnly={readOnly}/>
  {hint?<p>{hint}</p>:null}
 </div>;
}

export interface IconFieldProps {
 label:string;value:string;onChange:ChangeEventHandler<HTMLInputElement>;
 icon:ReactNode;type?:'text'|'search'|'email';placeholder?:string;
 disabled?:boolean;error?:string;
}
export function IconField({label,value,onChange,icon,type='text',
 placeholder,disabled,error}:IconFieldProps){
 const id=useId();const errorId=id+'-error';
 return <div className="li-legacy-form" data-li-legacy="icon-field">
  <label htmlFor={id}>{label}</label>
  <div className="li-legacy-input-icon">
   <span aria-hidden="true">{icon}</span>
   <input id={id} value={value} type={type} placeholder={placeholder}
    disabled={disabled} onChange={onChange} aria-invalid={error?true:undefined}
    aria-describedby={error?errorId:undefined}/>
  </div>
  {error?<p id={errorId} role="alert">{error}</p>:null}
 </div>;
}

export interface SmallActionProps {
 label:string;href?:string;onClick?:()=>void;disabled?:boolean;
 appearance?:'primary'|'secondary'|'text';
}
export function SmallAction({label,href,onClick,disabled=false,
 appearance='secondary'}:SmallActionProps){
 if(href&&onClick)throw Error('SmallAction may navigate OR perform an action');
 const className='li-legacy-small-action';
 if(href)return <a className={className} data-li-legacy="small-action"
  data-appearance={appearance} href={href}>{label}</a>;
 return <button className={className} data-li-legacy="small-action"
  data-appearance={appearance} disabled={disabled||!onClick} type="button"
  onClick={onClick}>{label}</button>;
}

export interface ProgressVariantsProps {
 label:string;value?:number;max?:number;
 variant?:'linear'|'compact'|'indeterminate';
}
export function ProgressVariants({label,value,max=100,variant='linear'}:ProgressVariantsProps){
 const indeterminate=variant==='indeterminate'||value===undefined;
 if(value!==undefined&&(!Number.isFinite(value)||value<0||value>max))
  throw Error('ProgressVariants value outside range');
 return <div className="li-legacy-progress" data-li-legacy="progress-variants"
  data-variant={variant}>
  <span>{label}</span>
  <progress max={max} value={indeterminate?undefined:value} aria-label={label}/>
  {!indeterminate?<output>{Math.round((value||0)/max*100)}%</output>:null}
 </div>;
}

export interface CheckinRadioModalProps {
 open:boolean;onOpenChange:(open:boolean)=>void;title:string;question:string;
 yesLabel:string;noLabel:string;closeLabel:string;
 value?:'yes'|'no';onChange:(value:'yes'|'no')=>void;
}
export function CheckinRadioModal({open,onOpenChange,title,question,yesLabel,
 noLabel,closeLabel,value,onChange}:CheckinRadioModalProps){
 const id=useId();
 return <Dialog open={open} onRequestClose={()=>onOpenChange(false)}
  closeLabel={closeLabel} title={title}>
  <fieldset className="li-legacy-checkin" data-li-legacy="checkin-modal">
   <legend>{question}</legend>
   <label><input type="radio" name={id} checked={value==='yes'}
    onChange={()=>onChange('yes')}/>{yesLabel}</label>
   <label><input type="radio" name={id} checked={value==='no'}
    onChange={()=>onChange('no')}/>{noLabel}</label>
  </fieldset>
  <Button variant="secondary" onClick={()=>onOpenChange(false)}>{closeLabel}</Button>
 </Dialog>;
}

/** UX-DS-11 names preserved as adapters; SVG paths now owned by Lucide. */
export type FunctionalIconName='search'|'check'|'info'|'close'|'chevron-left'|
 'book-open'|'bookmark'|'trash'|'menu'|'chevron-right'|'calendar'|'clock'|
 'star'|'home'|'settings'|'layers'|'chat'|'alert-triangle';
export interface FunctionalIconProps {name:FunctionalIconName;size?:18|20|22|24;label?:string}
export function FunctionalIcon({name,size=22,label}:FunctionalIconProps){
 return <LiIcon name={name as LiIconRole} size={size} label={label}
  data-li-legacy="functional-icon"/>;
}
