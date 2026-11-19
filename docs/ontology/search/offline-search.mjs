/**
 * ONT-04A — deterministic read-only typed search.
 * Accepts explicit local fixtures; no network/storage/PII/LLM/vector route.
 */
const searchable=new Set(['Field','Lesson','Concept','Course','SourceProgramme','SourceCourse','TechniqueDefinition']);
const relations=new Set(['SCOPED_TO_FIELD','STATES_CLAIM','SUPPORTED_BY','OFFERED_BY','CATALOGUED_IN']);
const positive=new Set(['verified','approved']);
export const normalize=(v)=>String(v??'').normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/[_.,/\\:()&]+/g,' ').replace(/\s+/g,' ').trim();
const words=s=>normalize(s).split(/[\s-]+/).filter(Boolean);
const sourceOk=p=>Boolean(p&&/^https:\/\//.test(p.sourceUrl||'')&&p.sourceSection?.trim()&&/^\d{4}-\d\d-\d\d$/.test(p.checkedOn||''));
const hidden=n=>['rejected','superseded','suspended','retired'].includes(n.reviewState)||['retired','suspended'].includes(n.publishState)||['revoked','denied'].includes(n.rightsState);
function editOne(a,b){
 if(Math.abs(a.length-b.length)>1)return false;
 if(a===b)return true;
 if(a.length>b.length)[a,b]=[b,a];
 let i=0,j=0,d=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++d>1)return false;if(a.length===b.length)i++;j++;}
 return d+b.length-j<=1;
}
function rowOf(n){
 if(n.visibility!=='public_curated'||!searchable.has(n.kind)||!sourceOk(n.provenance)||hidden(n))return null;
 if(typeof n.id!=='string'||typeof n.title!=='string'||!n.version)return null;
 return Object.freeze({id:n.id,kind:n.kind,title:n.title,aliases:(n.aliases||[]).filter(x=>['vi','en'].includes(x.locale)&&x.text?.trim()).map(x=>({locale:x.locale,text:x.text})),reviewState:n.reviewState,publishState:n.publishState,rightsState:n.rightsState,version:n.version,provenance:{sourceUrl:n.provenance.sourceUrl,sourceSection:n.provenance.sourceSection,checkedOn:n.provenance.checkedOn,evidenceType:n.provenance.evidenceType}});
}
function evidenceOf(n){
 if(n.visibility!=='public_curated'||!['SourceClaim','SourceEdition'].includes(n.kind)||!positive.has(n.reviewState)||!sourceOk(n.provenance)||hidden(n))return null;
 return {id:n.id,kind:n.kind,title:n.title,reviewState:n.reviewState,provenance:{sourceUrl:n.provenance.sourceUrl,sourceSection:n.provenance.sourceSection,checkedOn:n.provenance.checkedOn}};
}
const methodOf=m=>({id:'technique:'+m.id,kind:'TechniqueDefinition',title:m.scientificName,aliases:[{locale:'en',text:m.id},{locale:'en',text:m.uiShortId}],reviewState:m.reviewState,publishState:'draft',rightsState:'first_party',visibility:'public_curated',version:m.sourceEdition,provenance:m.provenance});
export function buildPilotIndex({academicGraph,pedagogyGraph,methodCatalog,candidateOutlines=[]}){
 if(!academicGraph?.demoOnly||!pedagogyGraph?.demoOnly||methodCatalog?.entries?.length!==13)throw Error('Expected complete local demo bundle');
 const raw=[...academicGraph.nodes,...pedagogyGraph.nodes,...methodCatalog.entries.map(methodOf),...candidateOutlines];
 const index=new Map(),evidence=new Map();
 for(const n of raw){
  if(n.visibility!=='public_curated'||['Learner','Attempt','TechniqueExecution','ReviewDue','AssistanceEvent','Feedback'].includes(n.kind))throw Error('Learner-private node cannot be indexed');
  const a=rowOf(n),b=evidenceOf(n);
  if(a){if(index.has(a.id)){
    const previous=index.get(a.id);
    if(previous.kind!==a.kind||normalize(previous.title)!==normalize(a.title))throw Error('Conflicting canonical ID: '+a.id);
   }else index.set(a.id,a);}
  if(b&&!evidence.has(b.id))evidence.set(b.id,b);
 }
 if(index.size<10)throw Error('Incomplete demo index');
 const all=new Map([...index,...evidence]),links=[];
 for(const e of [...academicGraph.edges,...pedagogyGraph.edges]){
  if(!relations.has(e.predicate)||!positive.has(e.reviewState)||e.visibility!=='public_curated'||!sourceOk(e.provenance))continue;
  const a=all.get(e.from),b=all.get(e.to);
  if(!a||!b||!positive.has(a.reviewState)||!positive.has(b.reviewState))continue;
  links.push({from:e.from,to:e.to,predicate:e.predicate,sourceUrl:e.provenance.sourceUrl,sourceSection:e.provenance.sourceSection});
 }
 return {index,evidence,links,fixtureOnly:true,sourceCount:raw.length};
}
function readiness(r){
 // No actual route state in a source-led demo: never claim playable.
 let state='reference_only';
 if(r.reviewState==='proposed')state='proposed_candidate';
 else if(r.kind==='Lesson'&&r.publishState==='review_only'&&r.reviewState==='approved')state='po_content_locked_not_released_by_this_index';
 else if(r.kind==='Lesson'&&r.publishState==='draft')state='editorial_draft';
 else if(r.kind==='TechniqueDefinition')state='technique_definition_reference';
 return {playable:false,state,reason:'No production route/rights-release verification in this read-only prototype'};
}
function match(r,query,locale){
 const q=normalize(query),qWords=words(query);
 const entries=[{field:'id',text:r.id,locale:'id'},{field:'short_id',text:r.id.split(':').slice(1).join(':'),locale:'id'},{field:'title',text:r.title,locale:'en'},...r.aliases.map(x=>({...x,field:'alias'}))];
 let best=null;
 for(const f of entries){
  const val=normalize(f.text),tokens=words(f.text);
  let score=0,type='';
  if(val===q){score=f.field==='id'?120:f.field==='short_id'?114:f.field==='title'?104:100;type='exact_'+f.field;}
  else if(q.length>=3&&val.startsWith(q)){score=85;type='prefix_'+f.field;}
  else if(q.length>=4&&qWords.length>1&&qWords.every(w=>tokens.some(t=>t===w||t.startsWith(w)))){score=68;type='all_tokens_'+f.field;}
  else if(q.length>=4&&val.includes(q)){score=65;type='contains_'+f.field;}
  else if(q.length>=5&&qWords.length===1&&tokens.some(t=>t.length>=5&&editOne(t,q))){score=40;type='one_edit_'+f.field;}
  if(score){if(f.locale===locale)score+=3;if(!best||score>best.score)best={score,matchType:type,matchedText:f.text,matchedLocale:f.locale};}
 }
 return best;
}
export function expandReviewed(data,from,{hops=2}={}){
 if(!Number.isInteger(hops)||hops<0||hops>2)throw Error('Graph expansion limited to 0–2 hops');
 if(!data.index.has(from))return [];
 let frontier=[{id:from,path:[]}],seen=new Set([from]),out=[];
 for(let n=0;n<hops;n++){
  const next=[];
  for(const item of frontier)for(const edge of data.links){
   const forward=edge.from===item.id,reverse=edge.to===item.id;
   if(!forward&&!reverse)continue;
   const target=forward?edge.to:edge.from;
   if(seen.has(target))continue;
   seen.add(target);
   const r=data.index.get(target)||data.evidence.get(target);
   if(!r)continue;
   const path=[...item.path,{predicate:edge.predicate,from:edge.from,to:edge.to,sourceUrl:edge.sourceUrl}];
   out.push({id:r.id,kind:r.kind,title:r.title,hops:n+1,path,whyShown:'curator-verified '+edge.predicate+' relation, NOT prerequisite',provenance:r.provenance});
   next.push({id:target,path});
  }
  frontier=next;
 }
 return out;
}
export function searchPilot(data,query,{locale='vi',kind=null,includeCandidates=false,limit=10,expandHops=0}={}){
 if(typeof query!=='string'||!query.trim()||query.length>128)return {status:'invalid_query',results:[],message:'Query must be 1–128 characters'};
 if(!['vi','en'].includes(locale))throw Error('Unsupported locale');
 if(kind!==null&&!searchable.has(kind))throw Error('Unsupported type');
 if(!Number.isInteger(limit)||limit<1||limit>50)throw Error('Invalid limit');
 const matches=[];
 for(const r of data.index.values()){
  if(kind&&r.kind!==kind||!includeCandidates&&r.reviewState==='proposed')continue;
  const hit=match(r,query,locale);
  if(!hit)continue;
  matches.push({id:r.id,kind:r.kind,title:r.title,localizedTitle:r.aliases.find(x=>x.locale===locale)?.text||r.title,...hit,reviewState:r.reviewState,publishState:r.publishState,rightsState:r.rightsState,readiness:readiness(r),version:r.version,provenance:r.provenance,whyShown:hit.matchType+' / '+hit.matchedLocale+'; source checked '+r.provenance.checkedOn,related:[]});
 }
 matches.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const selected=matches.slice(0,limit);
 if(expandHops)for(const r of selected)r.related=expandReviewed(data,r.id,{hops:expandHops});
 return {status:selected.length?'ok':'no_match',query,locale,results:selected,totalMatched:matches.length,shown:selected.length,coverage:'limited source-linked demo; NOT full 15 fields',message:selected.length?'Read-only records. No app route verified.':'No supported match in this limited pilot; unknown stays unknown.'};
}
