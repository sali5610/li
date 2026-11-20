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
    found.get(key).explanations.push({fromConcept:e.to,concept:bridge.concept,predicate:bridge.relation?.predicate??"SHARED_CONCEPT",reason:bridge.relation?.reason??"Both lessons teach this concept",reasonLocalized:bridge.relation?.reasonLocalized??null,reviewState:bridge.relation?.reviewState??e.reviewState,provenance:bridge.relation?.provenance??e.provenance});
   }
  }
  return [...found.values()].sort((a,b)=>a.lessonId.localeCompare(b.lessonId));
 };

 // Tra Cứu uses this SAME canonical graph/search client as lesson related-links.
 // Titles/IDs/aliases are indexed; proposed concepts, outline-only lessons and
 // learner-private data never become public lesson matches.
 const searchKnowledge=async (raw,{limit=14}={})=>{
  if(typeof raw!=="string"||!raw.trim()||raw.length>128||
     !Number.isInteger(limit)||limit<1||limit>30)
   return {status:"invalid_query",results:[]};
  const normalize=s=>String(s??"").normalize("NFD").replace(/\p{M}/gu,"")
   .replace(/đ/gi,"d").toLocaleLowerCase("vi").replace(/[^\p{L}\p{N}]+/gu," ").trim();
  const needle=normalize(raw),reviewed=s=>s==="verified"||s==="approved";
  const [index,tree,g]=await Promise.all([search(),hierarchy(),graph()]);
  const nodeById=new Map(g.nodes.map(n=>[n.id,n]));
  const lessonById=new Map(tree.lessons
   .filter(l=>l.navigationPublished===true&&l.contentState==="review_only")
   .map(l=>[l.id,l]));
  const fieldById=new Map(tree.fields.map(x=>[x.id,x]));
  const courseById=new Map(tree.courses.map(x=>[x.id,x]));
  const rank=d=>{
   const id=normalize(d.id),title=normalize(d.title);
   const aliases=(d.aliases||[]).map(x=>normalize(x.text));
   if(id===needle||title===needle||aliases.includes(needle))return 120;
   if(id.startsWith(needle)||title.startsWith(needle)||aliases.some(x=>x.startsWith(needle)))return 85;
   if(title.includes(needle)||aliases.some(x=>x.includes(needle)))return 65;
   const corpus=[id,title,...aliases].join(" ");
   return needle.split(" ").every(x=>corpus.includes(x))?20:-1;
  };
  const permitted=d=>d.kind==="Concept"?reviewed(d.reviewState)&&reviewed(nodeById.get(d.id)?.reviewState):
   d.kind==="Lesson"?lessonById.has(d.id.slice(7)):
   ["Field","Course","DomainGroup"].includes(d.kind);
  const hits=index.documents.filter(permitted).map(d=>({doc:d,score:rank(d)}))
   .filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||a.doc.id.localeCompare(b.doc.id))
   .slice(0,limit);
  const results=await Promise.all(hits.map(async ({doc,score})=>{
   const id=doc.id,links=[];
   const lessonId=doc.kind==="Lesson"?id.slice(7):null;
   if(doc.kind==="Lesson"){
    const lesson=lessonById.get(lessonId);
    const field=fieldById.get(lesson.fieldId);
    if(field)links.push({kind:"Field",id:"field:"+field.id,title:field.title,
     label:"Thuộc lĩnh vực",sourceUrl:field.source||null,sourceType:"catalog"});
   }
   if(doc.kind==="Concept"){
    // Author-reviewed TEACHES edges only; no inferred learning prerequisites.
    const direct=g.edges.filter(e=>e.predicate==="TEACHES"&&e.to===id&&reviewed(e.reviewState)&&
      lessonById.has(e.from.slice(7)));
    const seen=new Set();
    for(const edge of direct){
     const taughtId=edge.from.slice(7),lesson=lessonById.get(taughtId);
     if(!lesson||seen.has(taughtId))continue;
     seen.add(taughtId);
     links.push({kind:"Lesson",id:edge.from,lessonId:taughtId,title:lesson.title,
       label:"Bài học về khái niệm",sourceUrl:edge.provenance?.sourceUrl||null,
       sourceType:"academic",reason:null,relation:"TEACHES"});
     for(const bridge of await getRelatedLessons(taughtId)){
      const other=lessonById.get(bridge.lessonId);
      if(!other||seen.has(other.id))continue;
      const proof=bridge.explanations.find(x=>reviewed(x.reviewState)&&x.provenance?.sourceUrl);
      if(!proof)continue;
      seen.add(other.id);
      links.push({kind:"Lesson",id:"lesson:"+other.id,lessonId:other.id,title:other.title,
        label:"Bài liên quan để so sánh",sourceUrl:proof.provenance.sourceUrl,
        sourceType:"academic",reason:proof.reasonLocalized?.vi||proof.reason,
        relation:proof.predicate});
     }
    }
   }else if(doc.kind==="Lesson"){
    for(const related of await getRelatedLessons(lessonId)){
     const other=lessonById.get(related.lessonId);
     const proof=related.explanations.find(x=>reviewed(x.reviewState)&&x.provenance?.sourceUrl);
     if(!other||!proof)continue;
     links.push({kind:"Lesson",id:"lesson:"+other.id,lessonId:other.id,title:other.title,
       label:"Bài liên quan để so sánh",sourceUrl:proof.provenance.sourceUrl,
       sourceType:"academic",reason:proof.reasonLocalized?.vi||proof.reason,
       relation:proof.predicate});
    }
   }
   const lesson=lessonId?lessonById.get(lessonId):null;
   const field=doc.kind==="Field"?fieldById.get(id.slice(6)):null;
   const course=doc.kind==="Course"?courseById.get(id.slice(7)):null;
   return {id,kind:doc.kind,title:doc.title,aliases:doc.aliases||[],score,
    lessonId,fieldId:lesson?.fieldId||field?.id||course?.fieldId||null,
    courseId:lesson?.courseId||course?.id||null,
    sourceUrl:field?.source||null,
    contentState:lesson?.contentState||null,
    links,coverage:"canonical_search_graph_v1"};
  }));
  return {status:results.length?"ok":"no_match",results,total:hits.length,
   coverage:"canonical_search_graph_v1"};
 };

 const getBacklinks=async id=>(await backlinks()).backlinks[id]??[];
 return {manifest,graph,search,getCourseLevels,hierarchy,listGroups,getGroup,listFields,getField,listCourses,getCourse,listLessonOutlines,getLessonOutline,getBreadcrumbs,getLesson,getConceptLessons,getRelatedLessons,getBacklinks,searchKnowledge};
}
export const contentClient=createContentClient();
