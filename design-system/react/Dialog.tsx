import React,{useEffect,useId,useRef} from 'react';
import type {ReactNode} from 'react';
import {IconButton} from './Controls';

/** Stage04 controlled modal. Native focus containment/Escape; no persistence or app navigation. */
export interface DialogProps {
 open:boolean; title:string; onRequestClose:()=>void;
 children:ReactNode; footer?:ReactNode; description?:string; closeLabel:string;
}
export function Dialog({open,title,onRequestClose,children,footer,description,closeLabel}:DialogProps){
 const dialogRef=useRef<HTMLDialogElement>(null);
 const previousFocus=useRef<HTMLElement|null>(null);
 const titleId=useId(), descriptionId=useId();
 useEffect(()=>{
  const node=dialogRef.current;
  if(!node)return;
  if(open){
   if(!node.open){
    previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    node.showModal();
   }
  }else{
   if(node.open)node.close();
   previousFocus.current?.focus();
   previousFocus.current=null;
  }
 },[open]);
 useEffect(()=>()=>{if(dialogRef.current?.open)dialogRef.current.close();previousFocus.current?.focus();},[]);
 return <dialog ref={dialogRef} className="li-ds-dialog" data-li-component="dialog"
  aria-labelledby={titleId} aria-describedby={description?descriptionId:undefined}
  onCancel={event=>{event.preventDefault();onRequestClose();}}
  onClose={()=>{if(open)onRequestClose();}}>
  <header className="li-ds-dialog-head">
   <h2 id={titleId}>{title}</h2>
   <IconButton icon="close" label={closeLabel} onClick={onRequestClose}/>
  </header>
  {description?<p className="li-ds-dialog-description" id={descriptionId}>{description}</p>:null}
  <div className="li-ds-dialog-body">{children}</div>
  {footer?<footer className="li-ds-dialog-footer">{footer}</footer>:null}
 </dialog>;
}
