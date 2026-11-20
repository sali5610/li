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
 const getCourseLevels=async ()=>(await load("course-levels.json")).levels;
 const hierarchy=()=>load("course-catalog.json");
 const listGroups=async ()=>(await hierarchy()).groups;
 const getGroup=async id=>(await listGroups()).find(g=>g.id===id)??null;
 const listFields=async ({groupId}={})=>(await hierarchy()).fields.filter(f=>!groupId||f.groupId===groupId);
 const getField=async id=>(await listFields()).find(f=>f.id===id)??null;
 const listCourses=async ({level,fieldId,groupId}={})=>(await hierarchy()).courses.filter(c=>(!level||c.level===level)&&(!fieldId||c.fieldId===fieldId)&&(!groupId||c.groupId===groupId));
 const getCourse=async id=>(await listCourses()).find(c=>c.id===id)??null;
 const listLessonOutlines=async ({courseId,fieldId}={})=>(await hierarchy()).lessons.filter(l=>(!courseId||l.courseId===courseId)&&(!fieldId||l.fieldId===fieldId));
 const getLessonOutline=async id=>(await listLessonOutlines()).find(l=>l.id===id)??null;
 const getBreadcrumbs=async id=>{
  const d=await hierarchy(),lesson=d.lessons.find(l=>l.id===id),course=d.courses.find(c=>c.id===(lesson?.courseId??id));
  const field=d.fields.find(f=>f.id===(lesson?.fieldId??course?.fieldId??id));
  const group=d.groups.find(g=>g.id===(lesson?.groupId??course?.groupId??field?.groupId??id));
  if(!group)return [];
  return [
   {kind:"group",id:group.id,title:group.title},
   ...(field?[{kind:"field",id:field.id,title:field.title}]:[]),
   ...(course?[{kind:"course",id:course.id,title:course.title}]:[]),
   ...(lesson?[{kind:"lesson",id:lesson.id,title:lesson.title,contentState:lesson.contentState}]:[])
  ];
 };
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
 return {manifest,graph,search,getCourseLevels,hierarchy,listGroups,getGroup,listFields,getField,listCourses,getCourse,listLessonOutlines,getLessonOutline,getBreadcrumbs,getLesson,getConceptLessons,getRelatedLessons,getBacklinks};
}
export const contentClient=createContentClient();
