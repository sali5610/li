#!/usr/bin/env node
// GitHub canonical JSON → deterministic, zero-dependency static content packs.
// Legacy JS is read ONLY as a locked-content parity guard until frontend consumes packs.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const load=path=>JSON.parse(readFileSync(resolve(root,path),"utf8"));
const read=path=>readFileSync(resolve(root,path),"utf8");
function extractLiteral(source, name) {
 const idx=source.indexOf("const "+name+"="); if(idx<0)throw Error("Missing "+name);
 const start=source.slice(idx).search(/[{\[]/)+idx; const open=source[start];const close=open==="{"?"}":"]";
 let depth=0,quote="",escape=false,line=false,block=false,end=-1;
 for(let i=start;i<source.length;i++){
  const c=source[i],n=source[i+1];
  if(line){if(c==="\n")line=false;continue;}
  if(block){if(c==="*"&&n==="/"){block=false;i++;}continue;}
  if(quote){if(escape){escape=false;continue;}if(c==="\\"){escape=true;continue;}if(c===quote)quote="";continue;}
  if(c==="/"&&n==="/"){line=true;i++;continue;}
  if(c==="/"&&n==="*"){block=true;i++;continue;}
  if(c==="'"||c==='"'||c==='`'){quote=c;continue;}
  if(c===open)depth++;
  if(c===close&&--depth===0){end=i+1;break;}
 }
 if(end<0)throw Error("Unclosed literal "+name);
 return eval("("+source.slice(start,end)+")");
}
function compileContent(lessons,concepts,relations,registry,academic){
 const fail=msg=>{throw Error("LI_CONTENT_INVALID: "+msg)};
 const allowed=new Map([...registry.predicates,...academic.relations].map(x=>[x.name,x]));
 const kinds=new Set(registry.nodeKinds.map(x=>x.name));
 const nodeById=new Map(),edgeById=new Map(),triples=new Set(),aliases=new Map();
 const addNode=n=>{if(nodeById.has(n.id)){
  const prev=nodeById.get(n.id);
  // Two lessons under one Course/Field/Group share that identity. Their own
  // content versions differ; don't duplicate or falsely reject the hierarchy.
  const sameHierarchy=["DomainGroup","Field","Course"].includes(n.kind)&&
   prev.kind===n.kind&&Object.keys(n).every(k=>k==="version"||
    JSON.stringify(prev[k])===JSON.stringify(n[k]));
  if(!sameHierarchy&&JSON.stringify(prev)!==JSON.stringify(n))fail("duplicate node ID "+n.id);
  return;
 }
  if(!kinds.has(n.kind)||!new RegExp(registry.idPolicy.pattern).test(n.id))fail("bad node "+n.id);
  if(!registry.enums.reviewState.includes(n.reviewState)||!registry.enums.publishState.includes(n.publishState))fail("bad lifecycle "+n.id);
  if(n.visibility!=="public_curated")fail("private content leak "+n.id);
  if(!n.provenance?.sourceUrl?.startsWith("https://")||!n.provenance?.sourceSection)fail("missing provenance "+n.id);
  for(const t of [{locale:"en",text:n.title},...(n.aliases??[])]){const k=n.kind+":"+t.locale+":"+t.text.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();if(aliases.has(k)&&aliases.get(k)!==n.id)fail("alias collision "+k);aliases.set(k,n.id);}
  nodeById.set(n.id,n);
 };
 const addEdge=e=>{if(edgeById.has(e.id)){
  const prev=edgeById.get(e.id);
  // PART_OF is one structural edge, shared by every lesson within a course.
  if(e.predicate==="PART_OF"&&JSON.stringify(prev)===JSON.stringify(e))return;
  fail("duplicate edge ID "+e.id);
 }
 const key=e.predicate+"|"+e.from+"|"+e.to;
 if(triples.has(key))fail("duplicate triple "+key);
 triples.add(key);edgeById.set(e.id,e);};
 const editorial=(l,section)=>({sourceUrl:l.provenance.sourceUrl,sourceSection:section,evidenceType:"editorial",checkedOn:l.provenance.checkedOn});
 const navSrc={sourceUrl:"https://github.com/sali5610/li/blob/main/site/assets/catalog-curriculum-data.js",sourceSection:"S36 mapped Wave1 hierarchy",evidenceType:"documented",checkedOn:"2026-11-20"};
 const packs=new Map(),search=[];
 const lessonIds=new Set();
 for(const l of [...lessons].sort((a,b)=>a.id.localeCompare(b.id))){
  for(const k of ["schemaVersion","id","kind","version","languages","title","hierarchy","learningOutcomes","conceptIds","content","practice","sources","provenance","reviewState","publishState","rights","editorialStatus","updatedAt"])if(l[k]===undefined)fail(l.id+" missing "+k);
  if(lessonIds.has(l.id))fail("duplicate lesson ID "+l.id);lessonIds.add(l.id);
  if(l.kind!=="Lesson"||!/^L\d{2}-\d+-\d+$/.test(l.id))fail("bad legacy lesson ID "+l.id);
  if(l.languages.join(",")!=="vi,en"||!l.title.vi||!l.title.en||
     !["locked-structured-v1","editorial-structured-v1"].includes(l.content.format))
    fail("bad locales or learning format "+l.id);
  for(const loc of l.languages){
   const x=l.content.localized[loc];
   if(!x)fail("missing localized learning content "+l.id+" "+loc);
   if(l.content.format==="locked-structured-v1"){
    if(x.title!==l.title[loc]||!Array.isArray(x.questions)||x.questions.length!==l.practice.questionCount||
      !Array.isArray(x.rubricItems)||x.rubricItems.length!==4||
      JSON.stringify(l.learningOutcomes[loc])!==JSON.stringify(x.goals))
      fail("missing locked learning/practice/rubric "+l.id+" "+loc);
   }else{
    // Wave2 source-preserving sections. The four independent answers and T06/T07
    // never become visible before their documented learner attempt gate.
    const independent=x.independent,methods=x.technique_applications;
    const n=(independent?.prompt_md?.match(/^\d+\./gm)||[]).length;
    if(!x.hook?.md||!x.goals?.md||!x.concept?.md||!x.variable_types?.md||
       !x.guided?.md||!x.reflection?.md||!methods?.T06?.prompt_md||
       !methods?.T07?.prompt_md||!independent?.prompt_md||!independent?.model_answer_md||
       independent.model_answer_gate!=="AFTER_VALID_INDEPENDENT_SUBMISSION"||
       x.reflection.gate!=="AFTER_VALID_INDEPENDENT_SUBMISSION"||
       methods.T06.feedback_gate!=="AFTER_T06_MEANINGFUL_ATTEMPT"||
       methods.T07.feedback_gate!=="AFTER_T07_MEANINGFUL_ATTEMPT"||
       l.practice.questionCount!==4||n!==4)
      fail("incomplete author-reviewed study/practice/feedback contract "+l.id+" "+loc);
   }
  }
  if(l.publishState==="published"&&l.reviewState!=="approved")fail("publishing unapproved lesson "+l.id);
  if(l.publishState!=="review_only"&&l.publishState!=="draft")fail("unexpected release state "+l.id);
  if(l.rights.text!=="first_party")fail("unlicensed lesson text "+l.id);
  if(!Array.isArray(l.conceptIds)||l.conceptIds.length===0)fail("missing concept mapping "+l.id);
  if(l.prerequisiteLessonIds?.some(x=>x===l.id))fail("self prerequisite "+l.id);
  for(const src of l.sources){if(!src.title||!src.url?.startsWith("https://"))fail("invalid external source "+l.id);}
  const hier=l.hierarchy;
  for(const [kind,v] of [["DomainGroup",hier.group],["Field",hier.field],["Course",hier.course]]){if(!v||!v.id||!v.title)fail("bad hierarchy "+l.id);
   addNode({id:v.id,kind,title:v.title,version:l.version,reviewState:"verified",publishState:"review_only",visibility:"public_curated",rightsState:"first_party",aliases:[],provenance:navSrc,note:"Wave1 navigation metadata, not academic accreditation"});}
  const frozen=l.editorialStatus==="po_locked";
  addNode({id:"lesson:"+l.id,kind:"Lesson",title:l.title.en,version:l.version,reviewState:l.reviewState,publishState:l.publishState,visibility:"public_curated",rightsState:"first_party",aliases:[{locale:"vi",text:l.title.vi}],provenance:editorial(l,frozen?"PO-locked lesson VI/EN":"Reviewed lesson manuscript VI/EN"),note:frozen?"Editorial lock is not release approval":"Editorial manuscript is not publication approval"});
  const part=(from,to)=>addEdge({id:"edge:content:part:"+from,predicate:"PART_OF",from,to,reviewState:"verified",visibility:"public_curated",provenance:navSrc});
  part(hier.field.id,hier.group.id);part(hier.course.id,hier.field.id);part("lesson:"+l.id,hier.course.id);
  const claimId=(frozen?"claim:wave1:":"claim:editorial:")+l.id+":editorial-scope",sourceId="source:editorial:"+l.id+":notion";
  addNode({id:claimId,kind:"SourceClaim",title:(frozen?"Locked lesson scope ":"Editorial lesson scope ")+l.id,version:l.version,reviewState:"verified",publishState:"review_only",visibility:"public_curated",rightsState:"first_party",aliases:[],provenance:editorial(l,"Lesson manuscript contents"),note:"Editorial presence only; not a claim of peer-reviewed scientific support"});
  addNode({id:sourceId,kind:"SourceEdition",title:(frozen?"PO-locked editorial edition ":"Reviewed editorial edition ")+l.id,version:l.version,reviewState:"verified",publishState:"review_only",visibility:"public_curated",rightsState:"first_party",aliases:[],provenance:editorial(l,frozen?"S126 PO content freeze":"Documented lesson manuscript"),note:"Notion research provenance, never fetched at runtime"});
  addEdge({id:"edge:content:states:"+l.id,predicate:"STATES_CLAIM",from:"lesson:"+l.id,to:claimId,reviewState:"verified",visibility:"public_curated",provenance:editorial(l,"Manuscript contents")});
  addEdge({id:"edge:content:support:"+l.id,predicate:"SUPPORTED_BY",from:claimId,to:sourceId,reviewState:"verified",visibility:"public_curated",provenance:editorial(l,"Editorial provenance (not academic proof)")});
  const courseId=hier.course.id.slice("course:".length);
  if(!packs.has(courseId))packs.set(courseId,{courseId,courseTitle:hier.course.title,version:"1.0.0",lessons:[]});
  packs.get(courseId).lessons.push(l);
 }
 for(const c of concepts)addNode(c);
 for(const r of relations)addEdge(r);
 for(const l of lessons)for(const cid of l.conceptIds)if(!relations.some(e=>e.predicate==="TEACHES"&&e.from==="lesson:"+l.id&&e.to===cid))fail("missing TEACHES for "+l.id+" → "+cid);
 for(const e of edgeById.values()){
  const def=allowed.get(e.predicate),a=nodeById.get(e.from),b=nodeById.get(e.to);
  if(!a||!b)fail("broken link "+e.id+" "+e.from+" → "+e.to);
  if(!def||!def.from.includes(a.kind)||!def.to.includes(b.kind))fail("invalid relationship "+e.id+" "+e.predicate+" "+a.kind+" → "+b.kind);
  if(e.from===e.to)fail("self edge "+e.id);
  if(!registry.enums.reviewState.includes(e.reviewState)||!e.provenance?.sourceUrl?.startsWith("https://")||!e.provenance.sourceSection)fail("missing edge evidence "+e.id);
 }
 // Explicit full prerequisite cycle checks (no implicit "related" prerequisite promotions).
 for(const predicate of ["REQUIRES","PART_OF","RECOMMENDED_BEFORE"]){const adjacency=new Map();
  for(const e of edgeById.values())if(e.predicate===predicate){adjacency.set(e.from,[...(adjacency.get(e.from)||[]),e.to]);}
  const visiting=new Set(),done=new Set();const visit=n=>{if(visiting.has(n))fail("cycle "+predicate+" at "+n);if(done.has(n))return;visiting.add(n);for(const t of adjacency.get(n)||[])visit(t);visiting.delete(n);done.add(n);};
  for(const id of adjacency.keys())visit(id);
 }
 const nodes=[...nodeById.values()].sort((a,b)=>a.id.localeCompare(b.id)),edges=[...edgeById.values()].sort((a,b)=>a.id.localeCompare(b.id));
 const used=new Set(edges.flatMap(e=>[e.from,e.to]));for(const n of nodes)if(!used.has(n.id))fail("orphan "+n.id);
 const backlinks={},forward={},adjacency={};
 const append=(obj,key,value)=>{(obj[key]??=[]).push(value);};
 for(const e of edges){
  const record={id:e.id,predicate:e.predicate,from:e.from,to:e.to,reviewState:e.reviewState,reason:e.reason??null,provenance:e.provenance};
  append(backlinks,e.to,record);append(forward,e.from,record);append(adjacency,e.from,{...record,direction:"outgoing",neighbor:e.to});append(adjacency,e.to,{...record,direction:"incoming",neighbor:e.from});
 }
 for(const n of nodes)if(["Lesson","Concept","Course","Field"].includes(n.kind))search.push({id:n.id,kind:n.kind,title:n.title,aliases:n.aliases,reviewState:n.reviewState,publishState:n.publishState,fieldId: n.kind==="Lesson"?lessons.find(l=>"lesson:"+l.id===n.id)?.hierarchy.field.id??null:null});
 const outputs={
  "site/content-packs/graph.json":{schemaVersion:"1.0.0",nodes,edges,adjacency},
  "site/content-packs/backlinks.json":{schemaVersion:"1.0.0",backlinks,forward},
  "site/content-packs/search.json":{schemaVersion:"1.0.0",documents:search},
  "site/content-packs/manifest.json":{schemaVersion:"1.0.0",contentRoot:"content/lessons",status:"review_only",courses:[...packs.values()].sort((a,b)=>a.courseId.localeCompare(b.courseId)).map(p=>({id:p.courseId,title:p.courseTitle,file:p.courseId+".json",lessonIds:p.lessons.map(l=>l.id)}))}
 };
 for(const p of packs.values())outputs["site/content-packs/"+p.courseId+".json"]={schemaVersion:"1.0.0",courseId:p.courseId,lessons:p.lessons};
 return outputs;
}

function augmentCurriculum(compiled,legacyCourses,lessons,levelMap,navSrc){
 const authoredById=new Map(lessons.map(l=>[l.id,l]));
 const groupRows=[],fieldRows=[],courseRows=[],outlineRows=[];
 const groupIds=new Set(),fieldIds=new Set(),courseIds=new Set(),outlineIds=new Set();
 const g=compiled["site/content-packs/graph.json"];
 const nodesById=new Map(g.nodes.map(n=>[n.id,n]));
 const edgesById=new Map(g.edges.map(e=>[e.id,e]));
 for(const n of nodesById.values())if(["DomainGroup","Field","Course"].includes(n.kind))n.provenance=navSrc;
 for(const e of edgesById.values())if(e.predicate==="PART_OF")e.provenance=navSrc;
 const addNode=(id,kind,title,note)=>{
  if(nodesById.has(id))return;
  nodesById.set(id,{id,kind,title,version:"1.0.0",reviewState:kind==="Lesson"?"proposed":"verified",publishState:kind==="Lesson"?"draft":"review_only",visibility:"public_curated",rightsState:"first_party",aliases:[],provenance:navSrc,note});
 };
 const addPart=(from,to)=>{
  const id="edge:content:part:"+from;
  if(edgesById.has(id)){if(edgesById.get(id).to!==to)throw Error("LI_COURSE_CONFLICTING_PARENT "+from);return;}
  edgesById.set(id,{id,predicate:"PART_OF",from,to,reviewState:"verified",visibility:"public_curated",provenance:navSrc});
 };
 for(const group of legacyCourses.groups){
  if(!group.id||!group.title||groupIds.has(group.id))throw Error("LI_COURSE_DUP_GROUP "+group.id);
  groupIds.add(group.id);
  const groupId="group:"+group.id,fieldList=[];
  addNode(groupId,"DomainGroup",group.title,"Navigation group only; not academic accreditation");
  for(const field of group.fields){
   const fId="F"+String(parseInt(field.courses[0]?.id.slice(1,3)??"0",10)).padStart(2,"0");
   if(!/^F\d{2}$/.test(fId)||fieldIds.has(fId)||!field.id||!field.name)throw Error("LI_COURSE_DUP_FIELD "+fId);
   fieldIds.add(fId);fieldList.push(fId);
   const courseList=[],fieldId="field:"+fId;
   addNode(fieldId,"Field",field.name,"Navigation field only; not academic accreditation");
   addPart(fieldId,groupId);
   for(const course of field.courses){
    if(courseIds.has(course.id)||!/^C\d{2}-\d+$/.test(course.id)||!course.id.startsWith("C"+fId.slice(1)+"-"))throw Error("LI_COURSE_DUP_ID "+course.id);
    courseIds.add(course.id);courseList.push(course.id);
    const level=levelMap.get(course.level);
    if(!level)throw Error("LI_COURSE_UNKNOWN_LEVEL "+course.id+" "+course.level);
    const courseId="course:"+course.id;
    addNode(courseId,"Course",course.title,"Course outline only; no released academic syllabus");
    addPart(courseId,fieldId);
    const authored=lessons.filter(l=>l.hierarchy.course.id===courseId);
    for(let i=0;i<course.lessons.length;i++){
     const outline=course.lessons[i],lessonId="lesson:"+outline.id;
     if(outlineIds.has(outline.id)||!outline.id.startsWith("L"+course.id.slice(1)+"-")||!outline.title)throw Error("LI_COURSE_DUP_LESSON "+outline.id);
     outlineIds.add(outline.id);
     const body=authoredById.get(outline.id);
     if(body&&(body.hierarchy.group.id!==groupId||body.hierarchy.field.id!==fieldId||body.hierarchy.course.id!==courseId||body.hierarchy.group.title!==group.title||body.hierarchy.field.title!==field.name||body.hierarchy.course.title!==course.title))throw Error("LI_COURSE_WRONG_PARENT "+outline.id);
     outlineRows.push({id:outline.id,title:outline.title,groupId:group.id,fieldId:fId,courseId:course.id,order:i+1,navigationPublished:outline.published===true,contentState:body?"review_only":"outline_only",publishState:body?body.publishState:"draft",localizedTitle:body?body.title:null});
     addNode(lessonId,"Lesson",outline.title,"Navigation outline only; no reviewed body, exercise or release");
     addPart(lessonId,courseId);
    }
    if(authored.some(l=>!course.lessons.some(o=>o.id===l.id)))throw Error("LI_COURSE_UNLISTED_BODY "+course.id);
    courseRows.push({id:course.id,title:course.title,groupId:group.id,fieldId:fId,level,sourceLevel:course.level,status:authored.length?"review_only":"legacy_outline",lessonIds:authored.map(l=>l.id),outlineLessonIds:course.lessons.map(l=>l.id)});
   }
   fieldRows.push({id:fId,slug:field.id,title:field.name,groupId:group.id,source:field.source??null,courseIds:courseList});
  }
  groupRows.push({id:group.id,title:group.title,fieldIds:fieldList});
 }
 if(lessons.some(l=>!outlineIds.has(l.id)))throw Error("LI_COURSE_ORPHAN_BODY");
 const nodes=[...nodesById.values()].sort((a,b)=>a.id.localeCompare(b.id));
 const edges=[...edgesById.values()].sort((a,b)=>a.id.localeCompare(b.id));
 const nodeKinds=new Map(nodes.map(n=>[n.id,n.kind]));
 for(const e of edges)if(!nodeKinds.has(e.from)||!nodeKinds.has(e.to))throw Error("LI_COURSE_GRAPH_DANGLING "+e.id);
 const backlinks={},forward={},adjacency={};
 const append=(obj,key,value)=>{(obj[key]??=[]).push(value);};
 for(const e of edges){
  const record={id:e.id,predicate:e.predicate,from:e.from,to:e.to,reviewState:e.reviewState,reason:e.reason??null,provenance:e.provenance};
  append(backlinks,e.to,record);append(forward,e.from,record);
  append(adjacency,e.from,{...record,direction:"outgoing",neighbor:e.to});
  append(adjacency,e.to,{...record,direction:"incoming",neighbor:e.from});
 }
 const search=[];
 for(const n of nodes)if(["Lesson","Concept","Course","Field","DomainGroup"].includes(n.kind)&&!(n.kind==="Lesson"&&n.publishState==="draft"))search.push({
  id:n.id,kind:n.kind,title:n.title,aliases:n.aliases,reviewState:n.reviewState,publishState:n.publishState,
  fieldId:n.kind==="Lesson"?(authoredById.get(n.id.slice("lesson:".length))?.hierarchy.field.id??null):null
 });
 compiled["site/content-packs/graph.json"]={schemaVersion:"1.0.0",nodes,edges,adjacency};
 compiled["site/content-packs/backlinks.json"]={schemaVersion:"1.0.0",backlinks,forward};
 compiled["site/content-packs/search.json"]={schemaVersion:"1.0.0",documents:search};
 compiled["site/content-packs/course-catalog.json"]={schemaVersion:"1.0.0",source:"legacy_course_navigation_catalog",publicationState:"outline_only_except_locked_wave1",hierarchy:["group","field","course","lesson"],groups:groupRows,fields:fieldRows,courses:courseRows,lessons:outlineRows};
}
const lessons=readdirSync(resolve(root,"content/lessons")).filter(f=>f.endsWith(".json")).sort().map(f=>load("content/lessons/"+f));
const ids=lessons.map(l=>l.id);
const old=extractLiteral(read("site/assets/lesson-wave1-core.js"),"PACK");
const l09=extractLiteral(read("site/assets/lesson-l09-hifi.js"),"T");
for(const l of lessons){
 // Only frozen Wave1 manuscripts need byte-exact native-copy parity.
 // Future lessons must be validated by the canonical Lesson contract instead.
 if(l.editorialStatus==="po_locked"){
  const source=l.id==="L09-1-2"?l09:old[l.id]&&{vi:old[l.id].vi,en:old[l.id].en};
  if(!source||JSON.stringify(l.content.localized)!==JSON.stringify({vi:source.vi,en:source.en}))
   throw Error("LI_CONTENT_DRIFT: original locked academic content differs for "+l.id);
 }else if(l.publishState!=="review_only"||!["verified","approved"].includes(l.reviewState)){
  throw Error("LI_CONTENT_UNREVIEWED_LEARNER_BODY: "+l.id+"; keep drafts in content/editorial/");
 }
}
const schema=load("content/schema/lesson.schema.json");
for(const l of lessons)for(const key of schema.required)if(!(key in l))throw Error("LI_CONTENT_SCHEMA_REQUIRED: "+l.id+"."+key);
const compiled=compileContent(lessons,load("content/graph/concepts.json"),load("content/graph/edges.json"),load("docs/ontology/registry.v0.1.json"),load("docs/ontology/academic/registry.v0.1.json"));
const courseLevels=load("content/curriculum/course-levels.v1.json");
const legacyCourses=load("content/curriculum/legacy-catalog.v1.json");
const researchCandidates=load("content/curriculum/research-candidates.v0.1.json");
const canonicalLegacyHeader="/* GENERATED from GitHub content/curriculum/legacy-catalog.v1.json — DO NOT EDIT.\n   8 groups / 15 fields / 45 course outlines / 135 lesson outlines.\n   Navigation metadata only. A published route is NOT an academic release approval. */\n";
// Keep the existing native Tàng Thư/search app reading an exact generated copy of the
// GitHub canonical four-layer tree; no new renderer, site URL or content fork.
compiled["site/assets/catalog-curriculum-data.js"]=canonicalLegacyHeader+"window.LI_CATALOG_DATA="+JSON.stringify(legacyCourses.groups,null,2)+";\n";
const levelMap=new Map();
const allLevels=new Set();
for(const level of courseLevels.levels){
 if(allLevels.has(level.id)||!["foundation","intermediate","advanced","capstone"].includes(level.id))throw Error("LI_COURSE_BAD_LEVEL: "+level.id);
 allLevels.add(level.id);
 if(!level.title?.vi||!level.title?.en||!Number.isInteger(level.order))throw Error("LI_COURSE_INCOMPLETE_LEVEL: "+level.id);
 for(const label of level.sourceLabels){if(levelMap.has(label))throw Error("LI_COURSE_DUP_LEVEL_ALIAS: "+label);levelMap.set(label,level.id);}
}
if(allLevels.size!==4||new Set(courseLevels.levels.map(x=>x.order)).size!==4)throw Error("LI_COURSE_REQUIRED_FOUR_LEVELS");
const navSrc={"sourceUrl":"https://github.com/sali5610/li/blob/integration/staging/content/curriculum/legacy-catalog.v1.json","sourceSection":"8 groups / 15 fields / 45 courses / 135 lesson navigation outlines (metadata only)","evidenceType":"documented","checkedOn":"2026-11-20"};
augmentCurriculum(compiled,legacyCourses,lessons,levelMap,navSrc);
const fields=compiled["site/content-packs/course-catalog.json"].fields;
const candidateIds=new Set();
for(const c of researchCandidates.courses){
 if(candidateIds.has(c.id)||!/^PROP-F\d{2}-\d{3}$/.test(c.id))throw Error("LI_COURSE_DUP_RESEARCH_ID "+c.id);
 candidateIds.add(c.id);
 if(!allLevels.has(c.level)||c.status!=="research_candidate"||c.canonicalCourseId!==null||!fields.some(f=>f.id===c.fieldId))throw Error("LI_COURSE_UNAPPROVED_PROMOTION "+c.id);
}
if(researchCandidates.publicationStatus!=="not_authorized")throw Error("LI_COURSE_RESEARCH_RELEASE_FORBIDDEN");
compiled["site/content-packs/course-levels.json"]={schemaVersion:courseLevels.schemaVersion,levels:courseLevels.levels};

const check=process.argv.includes("--check");
for(const [path,value] of Object.entries(compiled)){
 const payload=path.endsWith(".js")?value:JSON.stringify(value,null,2)+"\n";
 if(check){if(read(path)!==payload)throw Error("LI_CONTENT_PACK_STALE: "+path+"; run node tools/build_content_packs.mjs");}
 else{mkdirSync(dirname(resolve(root,path)),{recursive:true});writeFileSync(resolve(root,path),payload);}
}
console.log("LI_CONTENT_PACKS_PASS lessons="+ids.length+" files="+Object.keys(compiled).length+" mode="+(check?"check":"build"));
