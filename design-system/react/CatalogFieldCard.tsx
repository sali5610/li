/** Canonical Tàng Thư field card. Presentation only; routing and labels belong to the caller.
 * The entire illustration is a single arch silhouette, never a rectangle plus inner arch.
 */
import React,{useRef} from 'react';
import {Heading,Text} from './Atoms';
import {Button} from './Components';
import {LiIcon} from './LucideIcons';

export interface CatalogFieldCardProps {
 title:string;
 category:string;
 detail:string;
 imageSrc:string;
 actionLabel:string;
 onOpen:(media:HTMLElement|null)=>void;
 className?:string;
}
export function CatalogFieldCard({
 title,category,detail,imageSrc,actionLabel,onOpen,className=''
}:CatalogFieldCardProps){
 const mediaRef=useRef<HTMLDivElement>(null);
 return <article className={['li-catalog-field-card',className].filter(Boolean).join(' ')}
  data-li-component="catalog-field-card">
  <div className="li-catalog-field-card__media" ref={mediaRef}>
   <img src={imageSrc} alt="" loading="lazy" decoding="async"/>
  </div>
  <div className="li-catalog-field-card__copy">
   <span className="li-catalog-field-card__tag">{category}</span>
   <Heading level={2} role="titleMedium">{title}</Heading>
   <Text role="support" className="li-catalog-field-card__detail">{detail}</Text>
  </div>
  <Button variant="secondary" className="li-catalog-field-card__action" onClick={()=>onOpen(mediaRef.current)}>
   {actionLabel} <LiIcon name="arrow-right" size={18}/>
  </Button>
 </article>;
}
