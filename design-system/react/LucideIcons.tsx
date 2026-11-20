/** Canonical li. Lucide adapter.
 * Lucide source: lucide-react, pinned in this directory's package.json.
 * Only product-approved roles belong here. The Studio lets designers browse
 * the full upstream catalog without importing every icon into the learner app.
 */
import React from 'react';
import {
 Search,Check,Info,X,ChevronLeft,ChevronRight,BookOpen,Bookmark,
 Trash2,Menu,CalendarDays,Clock,Star,House,Settings,Layers,
 MessageCircle,TriangleAlert,Sparkles,Sparkle,ArrowRight,RotateCcw,
 Trees,LibraryBig,Archive,Feather,Settings2
} from 'lucide-react';
import type {LucideProps} from 'lucide-react';

export const iconRoles={
 search:Search,check:Check,info:Info,close:X,
 'chevron-left':ChevronLeft,'chevron-right':ChevronRight,
 'book-open':BookOpen,bookmark:Bookmark,trash:Trash2,menu:Menu,
 calendar:CalendarDays,clock:Clock,star:Star,home:House,
 settings:Settings,layers:Layers,chat:MessageCircle,
 'alert-triangle':TriangleAlert,sparkles:Sparkles,sparkle:Sparkle,
 'arrow-right':ArrowRight,refresh:RotateCcw,
 trees:Trees,'library-big':LibraryBig,archive:Archive,feather:Feather,'settings-2':Settings2
} as const;
export type LiIconRole=keyof typeof iconRoles;
export type LiIconProps=Omit<LucideProps,'children'|'name'> &{
 name:LiIconRole;label?:string
};
/** Stable role names protect app consumers when Lucide names/aliases evolve. */
export function LiIcon({name,label,className='',size=24,strokeWidth=2,
 ...props}:LiIconProps){
 const Glyph=iconRoles[name];
 return <Glyph {...props} data-li-icon-role={name}
  className={'li-atom-icon '+className} size={size} strokeWidth={strokeWidth}
  role={label?'img':undefined} aria-label={label}
  aria-hidden={label?undefined:true}/>;
}
/** Real upstream exports used by the pinned library; useful for usage snippets. */
export const lucideRoleNames={
 search:'Search',check:'Check',info:'Info',close:'X',
 'chevron-left':'ChevronLeft','chevron-right':'ChevronRight',
 'book-open':'BookOpen',bookmark:'Bookmark',trash:'Trash2',menu:'Menu',
 calendar:'CalendarDays',clock:'Clock',star:'Star',home:'House',
 settings:'Settings',layers:'Layers',chat:'MessageCircle',
 'alert-triangle':'TriangleAlert',sparkles:'Sparkles',sparkle:'Sparkle',
 'arrow-right':'ArrowRight',refresh:'RotateCcw',
 trees:'Trees','library-big':'LibraryBig',archive:'Archive',feather:'Feather','settings-2':'Settings2'
} as const satisfies Record<LiIconRole,string>;
