import React,{useEffect,useId,useRef} from 'react';
import type {ButtonHTMLAttributes,HTMLAttributes,InputHTMLAttributes,TextareaHTMLAttributes,ReactNode} from 'react';

/** UX-DS-35 draft React UI only. CSS consumes canonical DS aliases; no storage or routing owner. */
const cx=(...classes:(string|false|undefined)[])=>classes.filter(Boolean).join(' ');
type Variant='primary'|'secondary';
export type LiButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{variant?:Variant;loading?:boolean};
export function Button({variant='primary',loading=false,disabled=false,type='button',className='',children,...rest}:LiButtonProps){
 return <button {...rest} type={type} disabled={disabled||loading} aria-busy={loading||undefined}
   data-loading={loading||undefined} className={cx('li-ui-button',variant==='secondary'&&'secondary',className)}>{children}</button>;
}
export function IconButton({label,children,...rest}:Omit<LiButtonProps,'aria-label'|'children'>&{label:string;children:ReactNode}){
 if(!label.trim())throw Error('IconButton requires a nonempty accessible label');
 return <Button {...rest} aria-label={label} className={cx('li-ui-icon-button',rest.className)}>{children}</Button>;
}
type BaseField={label:string;hint?:string;error?:string};
export type TextInputProps=Omit<InputHTMLAttributes<HTMLInputElement>,'children'|'aria-label'> & BaseField;
export function TextInput({label,hint,error,id,className='', 'aria-describedby':describedBy,...rest}:TextInputProps){
 const auto=useId(),fid=id||auto,hintId=hint?fid+'-hint':'',errorId=error?fid+'-error':'';
 const description=[describedBy,hintId,errorId].filter(Boolean).join(' ')||undefined;
 return <div className="li-ui-field">
   <label htmlFor={fid}>{label}</label>
   <input {...rest} id={fid} className={cx('li-ui-input',className)} aria-invalid={!!error||undefined} aria-describedby={description}/>
   {hint&&<span id={hintId} className="li-ui-field-hint">{hint}</span>}
   {error&&<span id={errorId} className="li-ui-field-error" role="alert">{error}</span>}
 </div>;
}
export type TextAreaFieldProps=Omit<TextareaHTMLAttributes<HTMLTextAreaElement>,'children'|'aria-label'>&BaseField&{purpose?:'guided'|'answer'|'notes'};
export function TextAreaField({label,hint,error,purpose,id,className='', 'aria-describedby':describedBy,...rest}:TextAreaFieldProps){
 const auto=useId(),fid=id||auto,hintId=hint?fid+'-hint':'',errorId=error?fid+'-error':'';
 return <div className="li-ui-field">
   <label htmlFor={fid}>{label}</label>
   <textarea {...rest} id={fid} data-field-purpose={purpose} className={cx('li-ui-input',className)}
     aria-invalid={!!error||undefined} aria-describedby={[describedBy,hintId,errorId].filter(Boolean).join(' ')||undefined}/>
   {hint&&<span id={hintId} className="li-ui-field-hint">{hint}</span>}
   {error&&<span id={errorId} className="li-ui-field-error" role="alert">{error}</span>}
 </div>;
}
/** Surface tone and elevation are separate design roles. */
export function Card({tone='default',elevation='raised',className='',children,...rest}:HTMLAttributes<HTMLElement>&{
 tone?:'default'|'tinted'|'inverse';elevation?:'raised'|'flat';children:ReactNode;
}){
 return <section {...rest} data-card-elevation={elevation}
  className={cx('pilot-surface','li-ui-card',tone!=='default'&&'li-ui-card-'+tone,
   elevation==='flat'&&'li-ui-card-flat',className)}>{children}</section>;
}
export function ActionGroup({className='',children,...rest}:HTMLAttributes<HTMLDivElement>&{children:ReactNode}){
 return <div {...rest} className={cx('li-ui-action-group',className)}>{children}</div>;
}
export type NavItem={id:string;href:string;label:string;icon?:ReactNode};
export function Navigation({items,currentId,label,onNavigate,className=''}:{items:readonly NavItem[];currentId:string;label:string;onNavigate?:(itemId:string)=>void;className?:string}){
 return <nav aria-label={label} className={cx('li-ui-navigation',className)}>
   {items.map(item=><a key={item.id} href={item.href} onClick={()=>onNavigate?.(item.id)} aria-current={item.id===currentId?'page':undefined}
     className="li-ui-nav-link">{item.icon&&<span aria-hidden="true">{item.icon}</span>}<span>{item.label}</span></a>)}
 </nav>;
}
export function Feedback({tone='info',className='',children,...rest}:HTMLAttributes<HTMLParagraphElement>&{tone?:'info'|'loading'|'error'|'success';children:ReactNode}){
 return <p {...rest} className={cx('li-ui-feedback','li-ui-feedback-'+tone,className)}
   role={tone==='error'?'alert':'status'} aria-live={tone==='error'?'assertive':'polite'}
   aria-busy={tone==='loading'||undefined}>{children}</p>;
}
/** Native <dialog> owns the top layer and background inert; explicitly wrap boundary Tab.
 * Do not let browser-specific focus order escape or focus unrendered controls. */
function wrapDialogTab(event:React.KeyboardEvent<HTMLDialogElement>){
 if(event.key!=='Tab')return;
 const dialog=event.currentTarget;
 const selector='a[href],button,input,select,textarea,summary,[tabindex]';
 const tabbable=Array.from(dialog.querySelectorAll<HTMLElement>(selector))
  .filter(el=>el.tabIndex>=0&&!el.matches(':disabled')&&el.getClientRects().length>0
   &&getComputedStyle(el).visibility!=='hidden'
   &&!el.closest('[inert],[aria-hidden="true"]'));
 if(!tabbable.length){event.preventDefault();dialog.focus();return;}
 const first=tabbable[0],last=tabbable[tabbable.length-1],active=document.activeElement;
 if(event.shiftKey && (active===first||!dialog.contains(active))){
  event.preventDefault();last.focus();
 }else if(!event.shiftKey && (active===last||!dialog.contains(active))){
  event.preventDefault();first.focus();
 }
}
export function Dialog({open,title,closeLabel,onRequestClose,children,className=''}:{
 open:boolean;title:string;closeLabel:string;onRequestClose:(reason:'escape'|'close'|'backdrop')=>void;children:ReactNode;className?:string;
}){
 const ref=useRef<HTMLDialogElement>(null),returnTo=useRef<HTMLElement|null>(null),titleId=useId();
 useEffect(()=>{
  const node=ref.current;
  if(!node||!open)return;
  returnTo.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(!node.open)node.showModal(); // native top-layer modal makes background inert and traps Tab
  node.querySelector<HTMLElement>('[data-dialog-close]')?.focus();
  return()=>{
   if(node.open)node.close();
   const opener=returnTo.current;
   if(opener?.isConnected&&!opener.hasAttribute('disabled')&&!opener.closest('[inert]'))opener.focus();
  };
 },[open]);
 return <dialog ref={ref} aria-labelledby={titleId} className={cx('li-ui-dialog',className)}
   onKeyDown={wrapDialogTab}
   onCancel={event=>{event.preventDefault();onRequestClose('escape');}}
   onClick={event=>{if(event.target===event.currentTarget)onRequestClose('backdrop');}}>
   <header className="li-ui-dialog-head"><h2 id={titleId}>{title}</h2>
     <Button variant="secondary" data-dialog-close onClick={()=>onRequestClose('close')} aria-label={closeLabel}>×</Button></header>
   <div className="li-ui-dialog-body">{children}</div>
 </dialog>;
}
