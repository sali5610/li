/**
 * Conflict-aware reconciliation for personal collections.
 * Only unambiguous, distinct records merge automatically. A same-record
 * divergent edit stays in the existing explicit conflict UI.
 *
 * A legacy device without a stored baseline uses add-wins for distinct IDs:
 * it preserves both copies rather than silently dropping unfamiliar notes.
 * New edits carry a durable basePayload so deletions can be distinguished.
 */
type Entry=Record<string,unknown>;
type Library={schema:1;cases:Entry[];questions:Entry[];ideas:Entry[];
 savedContent:Entry[];updatedAt?:string};
const MAX_RAW=300000;
const LISTS=['cases','questions','ideas','savedContent'] as const;
type ListName=typeof LISTS[number];

function stable(value:unknown):string{
 if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 const o=value as Record<string,unknown>;
 return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+stable(o[k])).join(',')+'}';
}
function equal(a:unknown,b:unknown):boolean{return stable(a)===stable(b);}
function object(v:unknown):v is Entry{return v!==null&&typeof v==='object'&&!Array.isArray(v);}
function parse(raw:string|null):unknown{
 if(raw===null||raw.length>MAX_RAW)return null;
 try{return JSON.parse(raw) as unknown;}catch{return null;}
}
function library(raw:string|null):Library|null{
 const x=parse(raw);
 if(!object(x)||x.schema!==1||!Array.isArray(x.cases)||
    !Array.isArray(x.questions)||
    (x.ideas!==undefined&&!Array.isArray(x.ideas))||
    (x.savedContent!==undefined&&!Array.isArray(x.savedContent))||
    Object.keys(x).some(k=>!['schema','updatedAt',...LISTS].includes(k))||
    (x.updatedAt!==undefined&&typeof x.updatedAt!=='string'))return null;
 // Older valid local libraries predate Ideas/Bookmarks arrays.
 return {...x,ideas:x.ideas??[],savedContent:x.savedContent??[]} as Library;
}
function idFor(kind:ListName,e:Entry):string|null{
 if(kind==='questions'){
  // Two independently saved copies of the same question are ONE bookmark.
  const q=e.scenarioKey||e.question;
  return typeof q==='string'&&q.length>0&&q.length<5000?'question:'+q:null;
 }
 if(kind==='savedContent'){
  return (e.type==='case'||e.type==='lesson')&&typeof e.id==='string'&&
   e.id.length>0&&e.id.length<5000?e.type+':'+e.id:null;
 }
 return typeof e.id==='string'&&e.id.length>0&&e.id.length<5000?e.id:null;
}
function indexed(kind:ListName,items:Entry[]):Map<string,Entry>|null{
 if(items.length>1000)return null;
 const map=new Map<string,Entry>();
 for(const value of items){
  if(!object(value))return null;
  const id=idFor(kind,value);
  if(!id||map.has(id))return null; // Ambiguous duplicate identity.
  map.set(id,value);
 }
 return map;
}
function sameEntry(kind:ListName,a:Entry|undefined,b:Entry|undefined):boolean{
 if((kind==='questions'||kind==='savedContent')&&a&&b){
  // Independent bookmark clicks have different generated IDs/timestamps.
  const strip=(x:Entry)=>{
   const v={...x};delete v.id;delete v.savedAt;return v;
  };
  return equal(strip(a),strip(b));
 }
 return equal(a,b);
}
function newerBookmark(a:Entry,b:Entry):Entry{
 const at=typeof a.savedAt==='string'?Date.parse(a.savedAt):0;
 const bt=typeof b.savedAt==='string'?Date.parse(b.savedAt):0;
 return bt>at?b:a;
}
function mergeList(kind:ListName,b:Entry[],l:Entry[],r:Entry[]):Entry[]|null{
 const base=indexed(kind,b),local=indexed(kind,l),remote=indexed(kind,r);
 if(!base||!local||!remote)return null;
 const merged:Entry[]=[];
 const ids=new Set([...local.keys(),...remote.keys(),...base.keys()]);
 for(const id of ids){
  const old=base.get(id),left=local.get(id),right=remote.get(id);
  const leftChanged=!sameEntry(kind,left,old);
  const rightChanged=!sameEntry(kind,right,old);
  let value:Entry|undefined;
  if(!leftChanged)value=right;
  else if(!rightChanged)value=left;
  else if(sameEntry(kind,left,right))
   value=left&&right&&(kind==='questions'||kind==='savedContent')?
    newerBookmark(left,right):left;
  else return null; // Same identity edited/deleted differently: human resolves.
  if(value)merged.push(value);
 }
 return merged;
}
function mergeLibrary(baseRaw:string|null,localRaw:string,remoteRaw:string):string|null{
 const local=library(localRaw),remote=library(remoteRaw);
 const base=baseRaw===null?{schema:1,cases:[],questions:[],ideas:[],savedContent:[]} as Library:library(baseRaw);
 if(!base||!local||!remote)return null;
 const merged:Library={schema:1,cases:[],questions:[],ideas:[],savedContent:[]};
 for(const kind of LISTS){
  const entries=mergeList(kind,base[kind],local[kind],remote[kind]);
  if(!entries)return null;
  merged[kind]=entries;
 }
 // The header is not a user edit: don't turn a timestamp into a conflict.
 merged.updatedAt=[local.updatedAt,remote.updatedAt].filter(
  (x):x is string=>typeof x==='string').sort().at(-1);
 const raw=JSON.stringify(merged);
 return raw.length<=MAX_RAW?raw:null;
}
function visits(raw:string|null,id:string):{schema:1;items:Entry[]}|null{
 const x=parse(raw);
 if(!object(x)||x.schema!==1||!Array.isArray(x.items)||
  Object.keys(x).some(k=>!['schema','items'].includes(k))||
  x.items.length>1000)return null;
 const seen=new Set<string>();
 for(const v of x.items){
  if(!object(v)||typeof v.visitedAt!=='string'||!Number.isFinite(Date.parse(v.visitedAt)))return null;
  const key=id==='lesson-visits'?v.route:JSON.stringify([v.kind,v.key]);
  if(typeof key!=='string'||!key||key==='[null,null]'||seen.has(key))return null;
  seen.add(key);
 }
 return x as {schema:1;items:Entry[]};
}
function mergeVisits(id:string,localRaw:string,remoteRaw:string):string|null{
 const left=visits(localRaw,id),right=visits(remoteRaw,id);
 if(!left||!right)return null;
 const byId=new Map<string,Entry>();
 for(const entry of [...left.items,...right.items]){
  const key=id==='lesson-visits'?String(entry.route):
   JSON.stringify([entry.kind,entry.key]);
  const prior=byId.get(key);
  if(!prior||Date.parse(String(entry.visitedAt))>Date.parse(String(prior.visitedAt)))
   byId.set(key,entry);
  else if(Date.parse(String(entry.visitedAt))===Date.parse(String(prior.visitedAt))&&
   !equal(prior,entry))return null;
 }
 const raw=JSON.stringify({schema:1,items:[...byId.values()].sort((a,b)=>
  Date.parse(String(b.visitedAt))-Date.parse(String(a.visitedAt))).slice(0,40)});
 return raw.length<=MAX_RAW?raw:null;
}
/** Null = unsafe to auto-merge: retain both originals and display conflict. */
export function mergePersonalConflictRaw(
 id:string,baseRaw:string|null,localRaw:string,remoteRaw:string):string|null{
 if(id==='library')return mergeLibrary(baseRaw,localRaw,remoteRaw);
 if(id==='lesson-visits'||id==='problem-visits')return mergeVisits(id,localRaw,remoteRaw);
 return null;
}
