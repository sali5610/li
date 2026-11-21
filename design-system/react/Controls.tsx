import React,{useId} from 'react';
import type {ButtonHTMLAttributes,ChangeEventHandler,InputHTMLAttributes,ReactNode} from 'react';
import {LiIcon} from './LucideIcons';
import type {LiIconRole,LiIconProps} from './LucideIcons';

/** UX-DS-35 Stage04 native atoms. No routing, persistence, or learner state. */
type ChoiceProps=Omit<InputHTMLAttributes<HTMLInputElement>,'type'|'children'|'size'> & {label:ReactNode};
export function Checkbox({label,id:given,className='',...props}:ChoiceProps){
 const auto=useId();const id=given||auto;
 return <label className={'li-atom-choice '+className} data-li-atom="checkbox" htmlFor={id}>
  <input {...props} id={id} type="checkbox"/><span>{label}</span>
 </label>;
}
export function Radio({label,id:given,className='',name,...props}:ChoiceProps&{name:string}){
 const auto=useId();const id=given||auto;
 if(!name.trim())throw Error('Radio requires a shared group name');
 return <label className={'li-atom-choice '+className} data-li-atom="radio" htmlFor={id}>
  <input {...props} id={id} type="radio" name={name}/><span>{label}</span>
 </label>;
}
export interface FieldProps {
 label:string;kind?:'input'|'textarea';type?:'text'|'email'|'search';name?:string;
 id?:string;placeholder?:string;hint?:string;error?:string;required?:boolean;
 disabled?:boolean;readOnly?:boolean;rows?:number;value?:string;defaultValue?:string;
 className?:string;autoComplete?:string;
 onChange?:ChangeEventHandler<HTMLInputElement|HTMLTextAreaElement>
}
export function Field({label,kind='input',type='text',id:given,hint,error,
 className='',rows=3,...props}:FieldProps){
 const auto=useId();
 if(!label.trim())throw Error('Field requires a visible label');
 const id=given||auto;
 const hintId=id+'-hint',errorId=id+'-error';
 const describedBy=[hint&&hintId,error&&errorId].filter(Boolean).join(' ')||undefined;
 const attrs={id,name:props.name,placeholder:props.placeholder,required:props.required,
  disabled:props.disabled,readOnly:props.readOnly,value:props.value,
  defaultValue:props.defaultValue,autoComplete:props.autoComplete,onChange:props.onChange,
  'aria-invalid':error?true:undefined,'aria-describedby':describedBy};
 return <div className={'li-atom-field '+className} data-li-atom="field"
  data-kind={kind} data-invalid={error?'true':undefined}>
  <label htmlFor={id}>{label}{props.required?<span aria-hidden="true"> *</span>:null}</label>
  {kind==='textarea'?<textarea {...attrs} rows={rows}/>:<input {...attrs} type={type}/>}
  {hint?<p className="li-atom-field-hint" id={hintId}>{hint}</p>:null}
  {error?<p className="li-atom-field-error" id={errorId} role="alert">{error}</p>:null}
 </div>;
}
/** Existing Stage04 icon names remain stable; all glyphs now come from Lucide. */
export type IconName='search'|'check'|'info'|'close'|'chevron-left'|'book-open'|'bookmark'|'trash'|'chevron-right';
export function Icon({name,label,className='',...props}:Omit<LiIconProps,'name'> &{
 name:IconName;label?:string
}){
 return <LiIcon {...props} name={name} label={label} className={className}
  data-li-atom="icon"/>;
}
export function IconButton({label,icon,className='',type='button',...props}:
 Omit<ButtonHTMLAttributes<HTMLButtonElement>,'children'> & {label:string;icon:IconName}){
 if(!label.trim())throw Error('IconButton requires an accessible name');
 return <button {...props} type={type} className={'li-atom-icon-button '+className}
  data-li-atom="icon-button" aria-label={label} title={props.title||label}>
  <Icon name={icon}/>
 </button>;
}
