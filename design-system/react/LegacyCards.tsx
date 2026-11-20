import React from 'react';
import type {ReactNode} from 'react';
import {Card} from './Components';

export type EditorialSurface='cream'|'ivory'|'secondary'|'dark';
export interface EditorialCardProps {
 title:string;description:string;eyebrow?:string;surface?:EditorialSurface;
 actions?:ReactNode;
}
export function EditorialCard({title,description,eyebrow,surface='cream',
 actions}:EditorialCardProps){
 return <Card variant={surface==='dark'?'inverse':surface==='ivory'?'tinted':
  surface==='secondary'?'flat-study':'raised'}
  className="li-legacy-editorial" data-li-legacy="editorial-card" data-surface={surface}>
  {eyebrow?<small>{eyebrow}</small>:null}<h3>{title}</h3><p>{description}</p>
  {actions?<div className="li-legacy-card-actions">{actions}</div>:null}
 </Card>;
}

export interface MethodTileProps {
 code:string;title:string;original?:string;purpose:string;icon?:ReactNode;
 variant?:'primary'|'secondary'|'dark';href?:string;
 onActivate?:()=>void;actionLabel:string;
}
export function MethodTile({code,title,original,purpose,icon,variant='primary',
 href,onActivate,actionLabel}:MethodTileProps){
 if(href&&onActivate)throw Error('MethodTile is navigation OR action, not both');
 const content=<>
  <span className="li-legacy-method-kicker">{icon?<span aria-hidden="true">{icon}</span>:null}{code}</span>
  <strong>{title}</strong>{original?<span className="li-legacy-method-original">{original}</span>:null}
  <span className="li-legacy-method-purpose">{purpose}</span>
  <span className="li-legacy-method-cta">{actionLabel} <span aria-hidden="true">→</span></span>
 </>;
 const attrs={className:'li-legacy-method', 'data-li-legacy':'method-tile',
  'data-variant':variant} as const;
 if(href)return <a {...attrs} href={href}>{content}</a>;
 return <button {...attrs} type="button" onClick={onActivate}
  disabled={!onActivate}>{content}</button>;
}

export type MediaLayout='top'|'side'|'contained';
export interface MediaCardProps {
 title:string;description:string;src:string;alt:string;
 layout?:MediaLayout;surface?:EditorialSurface;
 href?:string;actionLabel?:string;
}
export function MediaCard({title,description,src,alt,layout='top',
 surface='cream',href,actionLabel}:MediaCardProps){
 return <article data-li-legacy="media-card" className="li-legacy-media-card"
  data-layout={layout} data-surface={surface}>
  <div className="li-legacy-media-frame"><img src={src} alt={alt} loading="lazy"/></div>
  <div className="li-legacy-media-body">
   <h3>{title}</h3><p>{description}</p>
   {href?<a href={href}>{actionLabel||title}</a>:null}
  </div>
 </article>;
}

export type HorizontalMediaKind='text'|'photo'|'illustration'|'icon';
export interface HorizontalCardProps {
 title:string;description:string;mediaKind:HorizontalMediaKind;
 media?:ReactNode;surface?:EditorialSurface;meta?:string;
 href?:string;actionLabel?:string;
}
export function HorizontalCard({title,description,mediaKind,media,
 surface='cream',meta,href,actionLabel}:HorizontalCardProps){
 return <article className="li-legacy-horizontal" data-li-legacy="horizontal-card"
  data-media={mediaKind} data-surface={surface}>
  {mediaKind!=='text'?<div className="li-legacy-horizontal-media"
   aria-hidden={mediaKind==='icon'?true:undefined}>{media}</div>:null}
  <div className="li-legacy-horizontal-copy">
   {meta?<small>{meta}</small>:null}
   <h3>{title}</h3><p>{description}</p>
   {href?<a href={href}>{actionLabel||title}</a>:null}
  </div>
 </article>;
}

export interface ChatBubbleProps {
 text:string;speaker?:string;surface?:'paper'|'forest';
}
export function ChatBubble({text,speaker,surface='forest'}:ChatBubbleProps){
 return <aside className="li-legacy-chat-bubble" data-li-legacy="chat-bubble"
  data-surface={surface}>
  {speaker?<strong>{speaker}</strong>:null}<p>{text}</p>
 </aside>;
}

export interface TagChipProps {
 label:string;tone?:'neutral'|'olive'|'dark';
}
export function TagChip({label,tone='neutral'}:TagChipProps){
 return <span className="li-legacy-tag" data-li-legacy="tag-chip"
  data-tone={tone}>{label}</span>;
}
