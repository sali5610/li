import React,{useId} from 'react';
import type {ChangeEventHandler,ReactNode} from 'react';
import {Dialog} from './Dialog';
import {Button} from './Components';
import {Icon} from './Controls';
import type {IconName} from './Controls';

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

export type FunctionalIconName=IconName|'bookmark'|'trash'|'menu'|'chevron-right'|
 'calendar'|'clock'|'star'|'home'|'settings'|'layers'|'chat'|'alert-triangle';
export interface FunctionalIconProps {name:FunctionalIconName;size?:18|20|22|24;label?:string}
export function FunctionalIcon({name,size=22,label}:FunctionalIconProps){
 const legacy=['search','check','info','close','chevron-left','book-open'];
 if(legacy.includes(name))return <Icon name={name as IconName} label={label}
  width={size} height={size}/>;
 const paths:Record<Exclude<FunctionalIconName,IconName>,ReactNode>={
  bookmark:<path d="M5 3h14v18l-7-5-7 5z"/>,
  trash:<><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7m4-7v7"/></>,
  menu:<path d="M3 6h18M3 12h18M3 18h18"/>,
  'chevron-right':<path d="m9 18 6-6-6-6"/>,
  calendar:<><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
  clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l5 2"/></>,
  star:<path d="m12 2 3 7 8 .7-6 5 2 8-7-4-7 4 2-8-6-5L9 9z"/>,
  home:<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3z"/>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></>,
  layers:<><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5m-18 4 9 5 9-5"/></>,
  chat:<path d="M4 4h16v12H9l-5 5z"/>,
  'alert-triangle':<><path d="M12 3 2 21h20z"/><path d="M12 9v5m0 3v1"/></>
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
  strokeLinejoin="round" role={label?'img':undefined} aria-label={label}
  aria-hidden={label?undefined:true} data-li-legacy="functional-icon">
  {paths[name as Exclude<FunctionalIconName,IconName>]}
 </svg>;
}
