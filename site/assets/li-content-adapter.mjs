/* One read-only Content API for React lesson UI and the Search Owner.
   Only fetches GitHub-generated public packs; never reads Notion/Neon/private progress. */
export function createContentClient({ baseUrl=new URL("../content-packs/",import.meta.url), fetcher=(...args)=>fetch(...args) }={}){
 const root=String(baseUrl).endsWith("/")?String(baseUrl):String(baseUrl)+"/";
 const cache=new Map();
 const load=path=>{if(!cache.has(path))cache.set(path,Promise.resolve(fetcher(root+path)).then(r=>{if(!r.ok)throw Error("Content pack "+path+" HTTP "+r.status);return r.json();}).catch(e=>{cache.delete(path);throw e;}));return cache.get(path);};
 const manifest=()=>load("manifest.json");
 const graph=()=>load("graph.json");
 const search=()=>load("search.json");
 const backlinks=()=>load("backlinks.json");
 const getLesson=async id=>{
  const m=await manifest(),course=m.courses.find(c=>c.lessonIds.includes(id));
  if(!course)return null;
  return (await load(course.file)).lessons.find(l=>l.id===id)??null;
 };
 const getConceptLessons=async conceptId=>{
  const g=await graph(),concept=g.nodes.find(n=>n.id===conceptId&&n.kind==="Concept");
  if(!concept)return [];
  return g.edges.filter(e=>e.predicate==="TEACHES"&&e.to===conceptId).map(e=>({lessonId:e.from.slice("lesson:".length),via:e.predicate,reviewState:e.reviewState,reason:e.reason??null,provenance:e.provenance}));
 };
 const getRelatedLessons=async (id,{includeProposed=false}={})=>{
  const g=await graph(),origin="lesson:"+id;
  const allowed=e=>includeProposed||["approved","verified"].includes(e.reviewState);
  const taught=g.edges.filter(e=>e.predicate==="TEACHES"&&e.from===origin&&allowed(e));
  const found=new Map();
  for(const e of taught){
   const bridges=[{concept:e.to,relation:null},...g.edges.filter(x=>["RELATED_TO","CONTRASTS_WITH"].includes(x.predicate)&&allowed(x)&&(x.from===e.to||x.to===e.to)).map(x=>({concept:x.from===e.to?x.to:x.from,relation:x}))];
   for(const bridge of bridges)for(const other of g.edges.filter(x=>x.predicate==="TEACHES"&&x.to===bridge.concept&&x.from!==origin&&allowed(x))){
    const key=other.from.slice("lesson:".length);
    if(!found.has(key))found.set(key,{lessonId:key,explanations:[]});
    found.get(key).explanations.push({fromConcept:e.to,concept:bridge.concept,predicate:bridge.relation?.predicate??"SHARED_CONCEPT",reason:bridge.relation?.reason??"Both lessons teach this concept",reviewState:bridge.relation?.reviewState??e.reviewState,provenance:bridge.relation?.provenance??e.provenance});
   }
  }
  return [...found.values()].sort((a,b)=>a.lessonId.localeCompare(b.lessonId));
 };
 const getBacklinks=async id=>(await backlinks()).backlinks[id]??[];
 return {manifest,graph,search,getLesson,getConceptLessons,getRelatedLessons,getBacklinks};
}
export const contentClient=createContentClient();
