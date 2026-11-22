#!/usr/bin/env node
/**
 * UI preflight: discover existing shared components before editing an app screen.
 * No dependency, no generated registry and no claim of G2 approval/adoption.
 * Usage: node tools/find_design_component.mjs "filter" | "nút lưu" | "loading"
 */
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const base=resolve(root,'design-system/react');
const api=readFileSync(resolve(base,'index.ts'),'utf8');
const components=new Map();
function register(name,source){
  if(!/^[A-Z][A-Za-z\d]*$/.test(name))return;
  if(name.endsWith('Props')||name.endsWith('State'))return;
  components.set(name,{name,source:'design-system/react/'+source+'.tsx'});
}
for(const found of api.matchAll(/export\s*\{([^}]+)\}\s*from\s*['"]\.\/([^'"]+)['"]/g)){
  const source=found[2];
  for(const declaration of found[1].split(',')){
    const part=declaration.trim().replace(/^type\s+/,'').split(/\s+as\s+/)[0];
    if(!/^[A-Z][A-Za-z\d]*$/.test(part))continue;
    // Ignore type-only exports.
    if(declaration.trim().startsWith('type '))continue;
    register(part,source);
  }
}
for(const found of api.matchAll(/export\s*\*\s*from\s*['"]\.\/([^'"]+)['"]/g)){
  const source=found[1],file=resolve(base,source+'.tsx');
  if(!existsSync(file))continue;
  const body=readFileSync(file,'utf8');
  for(const item of body.matchAll(/export\s+(?:function|const|class)\s+([A-Z][A-Za-z\d]*)/g)){
    register(item[1],source);
  }
}
const normalized=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
const raw=process.argv.slice(2).join(' ').trim();
if(!raw){
 console.error('Usage: node tools/find_design_component.mjs "<UI feature, e.g. filter, card, loading, navigation>"');
 process.exitCode=2;
}else{
 const replacements=[
  [/\b(loc|filter)\b/g,'filter'],[/\b(nut|button)\b/g,'button'],
  [/\b(the|card)\b/g,'card'],[/\b(cong|portal)\b/g,'portal'],
  [/\b(luu|save)\b/g,'save'],[/\b(dieu huong|navigation|menu)\b/g,'navigation'],
  [/\b(tim kiem|search)\b/g,'search'],[/\b(loi|error)\b/g,'feedback'],
  [/\b(tai|loading)\b/g,'feedback'],[/\b(ghi chep|notebook)\b/g,'notebook'],
  [/\b(phien ban|variant)\b/g,'variant']
 ];
 let query=normalized(raw);
 for(const [pattern,next] of replacements)query=query.replace(pattern,next);
 const tokens=[...new Set(query.split(/[^a-z0-9]+/).filter(Boolean))];
 const extra={
  navigation:['appnavigationcontrols','appheader','actionmenu','breadcrumb','sidebarmenu'],
  feedback:['inlinefeedback','feedbackscene','savestatus'],
  filter:['filtergroup','filterchip'],
  card:['card','numberedcard','catalogfieldcard','portalcategorycard'],
  save:['savestatus','button','iconbutton'],
  search:['searchfield','field'],
  portal:['portalcategorycard']
 };
 const results=[...components.values()].map(item=>{
  const words=normalized(item.name).replace(/([a-z])([A-Z])/g,'$1 $2'); // fallback: substring also matches CamelCase
  const id=normalized(item.name);
  let score=0;
  for(const token of tokens){
   if(id===token)score+=12;
   else if(id.startsWith(token)||id.endsWith(token))score+=7;
   else if(id.includes(token))score+=4;
   if((extra[token]||[]).includes(id))score+=5;
  }
  return {...item,score};
 }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 console.log('Design System lookup: '+raw);
 if(!results.length){
  console.log('NO DIRECT MATCH. Inspect design-system/components.md and existing app instances before proposing a new component.');
 }else{
  for(const item of results.slice(0,12))
   console.log('  '+item.name.padEnd(27)+' '+item.source);
 }
 console.log('\nBefore editing: inspect the matching source/variants and real consumer. Import shared code or edit the owner first; do not clone visual HTML.');
 console.log('Authority: design-system/react/index.ts · design-system/components.md · design-system/ux-patterns-and-behavior.md');
 console.log('Output in UI task report: DS match (or none + reason) → source modified → consumer affected → focused verification.');
}
