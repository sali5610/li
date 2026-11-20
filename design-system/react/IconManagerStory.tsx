/** Full Lucide browser is Studio-only; never import this namespace into the app.
 * Canonical registry is ./LucideIcons.tsx, package pin in package.json.
 */
import React,{useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as Lucide from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import pkg from './package.json';
import {iconRoles,lucideRoleNames,LiIcon} from './LucideIcons';
import './icon-manager.css';
import './focus.css';

type IconItem={name:string;component:LucideIcon};
const all=Object.entries(Lucide).filter(([name,value])=>
 /^[A-Z][a-zA-Z0-9]*$/.test(name)&&!name.endsWith('Icon')&&
 value!==null&&(typeof value==='object'||typeof value==='function')&&
 ('displayName' in value||'render' in value)
).map(([name,component])=>({name,component:component as LucideIcon}))
 .sort((a,b)=>a.name.localeCompare(b.name));
const curated=Object.entries(lucideRoleNames).map(([role,upstream])=>({
 role,upstream
}));
const toKebab=(s:string)=>s.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();
const ver=pkg.dependencies['lucide-react'];
const q=new URLSearchParams(location.search);
const en=q.get('lang')==='en';
const tr=(vi:string,english:string)=>en?english:vi;
function IconManager(){
 const [search,setSearch]=useState('');
 const [filter,setFilter]=useState(q.get('variant')==='Approved'?'approved':'all');
 const [size,setSize]=useState(24);
 const [stroke,setStroke]=useState(2);
 const [page,setPage]=useState(1);
 const [current,setCurrent]=useState('House');
 const [copied,setCopied]=useState('');
 const approvedNames=new Set<string>(curated.map(r=>r.upstream));
 const displayed=useMemo(()=>all.filter(icon=>
   (filter==='all'||approvedNames.has(icon.name))&&
   (!search||toKebab(icon.name).includes(search.toLowerCase().replace(/\s+/g,'-'))||
    icon.name.toLowerCase().includes(search.toLowerCase().replace(/\s+/g,''))||
    curated.some(c=>c.upstream===icon.name&&c.role.includes(search.toLowerCase())))
 ),[search,filter]);
 const items=displayed.slice(0,page*80);
 const selected=all.find(icon=>icon.name===current);
 const role=curated.find(r=>r.upstream===current)?.role;
 const syntax=role?
  "import {LiIcon} from './design-system/react';\n<LiIcon name=\""+role+"\" size={"+size+"} />":
  "import {"+current+"} from 'lucide-react';\n<"+current+" size={"+size+"} strokeWidth={"+stroke+"} />";
 function copy(text:string){
  navigator.clipboard?.writeText(text).then(()=>setCopied(tr('Đã copy','Copied')))
   .catch(()=>setCopied(tr('Không copy được; chọn text mẫu.','Copy unavailable; select code text.')));
 }
 return <main className="li-icon-manager" data-ui-lucide-manager="mounted" lang={en?'en':'vi'}>
  <header className="li-icon-manager-head">
   <span className="li-icon-eyebrow">UX-DS-35 / LUCIDE / ICON GOVERNANCE</span>
   <h1>{tr('Thư viện biểu tượng','Icon library')}</h1>
   <p>{tr('Duyệt toàn bộ Lucide; chỉ các role đã duyệt mới dùng qua API li. trong app.',
     'Browse Lucide; app uses a curated, stable role API.')}</p>
   <div className="li-icon-meta">
    <span>lucide-react <strong>v{ver}</strong></span>
    <span>{all.length} {tr('biểu tượng trong package','package icons')}</span>
    <span>{curated.length} {tr('role dùng trong li.','li. approved roles')}</span>
    <span>{tr('Đồng bộ khi build — không gọi CDN','Synced at build — no CDN')}</span>
   </div>
  </header>
  <section className="li-icon-workbench">
   <div className="li-icon-filters">
    <label>{tr('Tìm icon','Find icon')}
     <input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
      placeholder={tr('Search, calendar, book…','Search, calendar, book…')}/></label>
    <label>{tr('Phạm vi','Collection')}
     <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}>
      <option value="all">{tr('Tất cả Lucide','All Lucide')}</option>
      <option value="approved">{tr('Icon dùng trong li.','li. approved roles')}</option>
     </select></label>
    <label>{tr('Kích thước','Size')}
     <select value={size} onChange={e=>setSize(Number(e.target.value))}>
      {[18,20,22,24,32,40].map(n=><option key={n} value={n}>{n}px</option>)}
     </select></label>
    <label>{tr('Nét','Stroke')}
     <select value={stroke} onChange={e=>setStroke(Number(e.target.value))}>
      {[1,1.5,2,2.5].map(n=><option key={n} value={n}>{n}px</option>)}
     </select></label>
   </div>
   <div className="li-icon-main">
    <div className="li-icon-results">
     <p role="status">{displayed.length} {tr('kết quả','results')} ·
      {tr(' chọn biểu tượng để lấy code',' select an icon to get the code')}</p>
     <div className="li-icon-grid">
      {items.map(item=>{
       const Glyph=item.component;
       return <button key={item.name} type="button"
        className="li-icon-cell" aria-pressed={current===item.name}
        aria-label={item.name} title={item.name} onClick={()=>{setCurrent(item.name);setCopied('')}}>
        <Glyph size={size} strokeWidth={stroke} aria-hidden="true"/>
        <span>{toKebab(item.name)}</span>
       </button>;
      })}
     </div>
     {!displayed.length?<p>{tr('Không tìm thấy icon.','No icons match.')}</p>:null}
     {items.length<displayed.length?<button className="li-icon-more" type="button"
      onClick={()=>setPage(p=>p+1)}>{tr('Xem thêm','Show more')} · {items.length}/{displayed.length}</button>:null}
    </div>
    <aside className="li-icon-detail" aria-label={tr('Thông tin biểu tượng','Icon details')}>
     <span className="li-icon-eyebrow">{tr('ĐANG CHỌN','SELECTED ICON')}</span>
     {selected?<div className="li-icon-hero">{React.createElement(selected.component,{
      size:48,strokeWidth:stroke,'aria-hidden':true})}</div>:null}
     <h2>{current}</h2>
     <p>{toKebab(current)}</p>
     <p>{role?tr('Đã ánh xạ vào role: ','Assigned role: ')+role:
      tr('Chưa duyệt làm role trong li.','Not in the li. approved role registry.')}</p>
     <div className="li-icon-code"><code>{syntax}</code></div>
     <button type="button" onClick={()=>copy(syntax)}>{tr('Copy cách dùng','Copy usage')}</button>
     <button type="button" className="li-icon-secondary" onClick={()=>
      copy(role||current)}>{tr('Copy tên icon','Copy icon name')}</button>
     <p className="li-icon-copy-status" role="status">{copied}</p>
     <a href={'https://lucide.dev/icons/'+toKebab(current)} target="_blank" rel="noopener noreferrer">
      {tr('Xem trên Lucide','View upstream Lucide')}
     </a>
    </aside>
   </div>
  </section>
  <footer className="li-icon-foot">
   <p>{tr('Quyền quản lý: thêm hoặc đổi icon đã duyệt bằng pull request vào LucideIcons.tsx. '+
    'Nâng version bằng npm update có kiểm tra; Studio sẽ đồng bộ danh mục ở lần build sau.',
    'Manage approved icons through a PR to LucideIcons.tsx. Upgrade the pinned npm version '+
    'through review; the gallery syncs on the next build.')}</p>
   <p>{tr('Icon trang trí để aria-hidden, icon truyền tải thông tin phải có nhãn. '+
    'Không thêm outline focus thứ hai.',
    'Decorative icons are aria-hidden, meaningful icons need labels. No extra focus outline.')}</p>
  </footer>
 </main>;
}
const host=document.getElementById('react-icon-manager-root');
if(!host)throw Error('Lucide Icon Manager host missing');
createRoot(host).render(<IconManager/>);
