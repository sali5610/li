#!/usr/bin/env node
/**
 * One-shot PUBLIC-CONTENT-ONLY, no-release benchmark for li. Phase C.
 * Baseline is the exact shipped contentClient.searchKnowledge(), not a clone.
 * Candidate is pinned MIT multilingual E5 small, 8-bit ONNX, evaluated offline
 * on GitHub Actions CPU; no browser model, private learner data or external API.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createContentClient} from "../../site/assets/li-content-adapter.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const read=(relative)=>JSON.parse(fs.readFileSync(path.join(root,relative),"utf8"));
const gold=read("tools/benchmarks/semantic-wave1-gold.json");
const manifest=read("site/content-packs/manifest.json");
const graph=read("site/content-packs/graph.json");
const published=new Set(manifest.courses.flatMap(c=>c.lessonIds));
const reviewed=s=>s==="approved"||s==="verified";
const fetcher=async url=>{
 const name=new URL(url).pathname.split("/").at(-1);
 const file=path.join(root,"site/content-packs",name);
 return {ok:fs.existsSync(file),json:async()=>JSON.parse(fs.readFileSync(file,"utf8"))};
};
const client=createContentClient({baseUrl:"https://canonical-packs.invalid/",fetcher});
const index=await client.search();
const docById=new Map(index.documents.map(d=>[d.id,d]));
const lessonToConcepts=new Map();
for(const e of graph.edges.filter(e=>e.predicate==="TEACHES"&&reviewed(e.reviewState)&&
 published.has(e.from.slice("lesson:".length)))){
 if(!lessonToConcepts.has(e.to))lessonToConcepts.set(e.to,[]);
 lessonToConcepts.get(e.to).push(e.from.slice("lesson:".length));
}
const canonicalDocs=[];
const strip=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
for(const id of published){
 const lesson=await client.getLesson(id);
 if(!lesson||!docById.has("lesson:"+id))throw Error("Missing published canonical lesson "+id);
 const vi=lesson.content?.localized?.vi||{};
 const en=lesson.content?.localized?.en||{};
 const note=[
  lesson.title.vi,lesson.title.en,
  ...(lesson.learningOutcomes?.vi||[]),...(lesson.learningOutcomes?.en||[]),
  vi.intro,vi.conceptTitle,vi.conceptText,vi.theoryLead,vi.biasText,vi.variationText,
  vi.compareTitle1,vi.compareText1,vi.compareTitle2,vi.compareText2,
  en.intro,en.conceptTitle,en.conceptText,en.theoryLead,
 ].filter(Boolean).map(strip).join(" | ").slice(0,2500);
 canonicalDocs.push({id:"lesson:"+id,lessonIds:[id],kind:"Lesson",
  passage:"passage: "+note});
}
for(const node of graph.nodes.filter(n=>n.kind==="Concept"&&reviewed(n.reviewState)&&
 docById.has(n.id)&&reviewed(docById.get(n.id).reviewState))){
 const taught=lessonToConcepts.get(node.id)||[];
 if(!taught.length)continue;
 const names=(node.aliases||[]).map(x=>x.text).join(". ");
 const sourceScope=node.provenance?.sourceSection||"";
 const passage=[node.title,names,sourceScope].filter(Boolean).join(". ");
 canonicalDocs.push({id:node.id,lessonIds:taught,kind:"Concept",
  passage:"passage: "+strip(passage)});
}
if(canonicalDocs.length<5)throw Error("Benchmark candidates too sparse; refuse cosmetic score");
const lessonOrder=hits=>{
 const seen=new Set(),arr=[];
 for(const item of hits)for(const id of item.lessonIds){
  if(published.has(id)&&!seen.has(id)){seen.add(id);arr.push(id);}
 }
 return arr;
};
const toLessons=(records)=>{
 const rows=[];
 for(const record of records){
  if(record.kind==="Lesson"&&published.has(record.lessonId))
   rows.push({id:record.id,lessonIds:[record.lessonId],score:record.score});
  if(record.kind==="Concept"){
   // Only directly TEACHES reviewed lessons, not transitive or proposed relatedness.
   const taught=(record.links||[]).filter(l=>l.relation==="TEACHES"&&published.has(l.lessonId));
   if(taught.length)rows.push({id:record.id,lessonIds:taught.map(l=>l.lessonId),score:record.score});
  }
 }
 return rows;
};
const rows=[];
for(const item of [...gold.positives,...gold.negatives]){
 const result=await client.searchKnowledge(item.query);
 rows.push({...item,lexicalHits:toLessons(result.results)});
}
// Real multilingual E5 model, NOT a TF-IDF proxy or fake cosine encoder.
const {pipeline,env}=await import("@xenova/transformers");
env.allowLocalModels=false;
env.useBrowserCache=false;
const model="Xenova/multilingual-e5-small";
const revision="761b726dd34fb83930e26aab4e9ac3899aa1fa78";
console.log("LI_SEMANTIC_MODEL_LOADING "+model+"@"+revision+" quantized=true");
const start=Date.now();
const encoder=await pipeline("feature-extraction",model,{quantized:true,revision});
console.log("LI_SEMANTIC_MODEL_READY_MS "+(Date.now()-start));
const embedding=async text=>{
 const tensor=await encoder(text,{pooling:"mean",normalize:true});
 return Array.from(tensor.data);
};
const passages=[];
for(const item of canonicalDocs)passages.push(await embedding(item.passage));
const dot=(a,b)=>a.reduce((acc,x,i)=>acc+x*b[i],0);
for(const item of rows){
 const vec=await embedding("query: "+item.query);
 item.semanticHits=canonicalDocs.map((d,i)=>({...d,score:dot(vec,passages[i])}))
  .sort((a,b)=>b.score-a.score).slice(0,5)
  .map(x=>({id:x.id,lessonIds:x.lessonIds,score:Number(x.score.toFixed(4))}));
 // Exact lesson IDs always beat a semantic guess, regardless of legacy rank.
 const directId=/^L\d{2}-\d+-\d+$/i.test(item.query.trim())&&
  lessonOrder(item.lexicalHits)[0]===item.query.trim();
 const strongLexical=directId||item.lexicalHits[0]?.score>=65;
 item.hybridHits=strongLexical?item.lexicalHits:item.semanticHits;
 // Predeclared 0.83 after six calibration negatives; report NEW holdout separately.
 // Similarity threshold does not authorize app release.
 const threshold=0.83;
 item.gatedHits=strongLexical?item.lexicalHits:
  (item.semanticHits[0]?.score??0)>=threshold?item.semanticHits:[];
}
const metrics=(key,subset=rows.filter(r=>r.targetLessonId))=>{
 const eligible=subset.filter(x=>x.targetLessonId);
 return {total:eligible.length,
  top1:eligible.filter(x=>lessonOrder(x[key])[0]===x.targetLessonId).length,
  recallAt3:eligible.filter(x=>lessonOrder(x[key]).slice(0,3).includes(x.targetLessonId)).length};
};
const metricsByType={};
for(const cls of ["id","alias","paraphrase"]){
 const subset=rows.filter(x=>x.queryClass===cls);
 metricsByType[cls]={
  lexical:metrics("lexicalHits",subset),
  semantic:metrics("semanticHits",subset),
  hybrid:metrics("hybridHits",subset),
  gated:metrics("gatedHits",subset)};
}
const negativeRows=rows.filter(x=>x.expected==="no_relevant_lesson");
const report={
 benchmark:"li-semantic-wave1-v1",scope:"3_published_lessons_only",
 docs:canonicalDocs.map(({id,kind,lessonIds})=>({id,kind,lessonIds})),
 model:{repo:model,revision,license:"MIT (upstream intfloat/multilingual-e5-small)",
  quantized:true,runner:"GitHub Actions CPU-only, not client"},
 baseline:"exact production createContentClient.searchKnowledge + reviewed TEACHES",
 docsCount:canonicalDocs.length,positives:gold.positives.length,hardNegatives:negativeRows.length,
 metrics:{lexical:metrics("lexicalHits"),semantic:metrics("semanticHits"),
  hybrid:metrics("hybridHits"),gated:metrics("gatedHits")},
 similarityGate:{threshold:0.83,chosenOn:"six_first_run_calibration_negatives_not_holdout",
  status:"research_only_do_not_ship"},
 byType:metricsByType,
 hardNegativeForcedMatches:{
  lexical:negativeRows.filter(x=>lessonOrder(x.lexicalHits).length>0).length,
  semantic:negativeRows.filter(x=>lessonOrder(x.semanticHits).length>0).length,
  hybrid:negativeRows.filter(x=>lessonOrder(x.hybridHits).length>0).length,
  gated:negativeRows.filter(x=>lessonOrder(x.gatedHits).length>0).length},
 negativesBySplit:Object.fromEntries(["calibration","holdout"].map(split=>[
  split,Object.fromEntries(["lexical","semantic","hybrid","gated"].map(k=>[
   k,negativeRows.filter(x=>x.split===split&&lessonOrder(x[k+"Hits"]).length>0).length
  ]))])),
 detail:rows.map(x=>({q:x.query,group:x.queryClass||"negative",target:x.targetLessonId||null,
   lexical:lessonOrder(x.lexicalHits).slice(0,3),
   semantic:lessonOrder(x.semanticHits).slice(0,3),
   hybrid:lessonOrder(x.hybridHits).slice(0,3),
   gated:lessonOrder(x.gatedHits).slice(0,3),
   negativeSplit:x.split||null,
   vectorTopScore:x.semanticHits[0]?.score||null}))
};
fs.writeFileSync(path.join(root,"tools/benchmarks/semantic-wave1-results.json"),
 JSON.stringify(report,null,2)+"\n");
console.log("LI_SEMANTIC_BENCHMARK_JSON "+JSON.stringify(report));
if(process.env.GITHUB_STEP_SUMMARY){
 const m=report.metrics,p=report.byType.paraphrase;
 const line=k=>[k,m[k].top1+"/"+m[k].total,m[k].recallAt3+"/"+m[k].total,
  report.hardNegativeForcedMatches[k]+"/"+negativeRows.length].join(" | ");
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,[
  "## li. semantic E5 small — one-time Wave1 benchmark",
  "Model pinned: "+model+" @ "+revision+" (quantized, MIT upstream).",
  "Targets: "+gold.positives.length+" queries over 3 real approved content bodies; "+negativeRows.length+" unsupported negatives.",
  "| Method | Top1 relevant | Recall@3 | Forced match on unsupported queries |",
  "| --- | ---: | ---: | ---: |",
  "| "+line("lexical")+" |","| "+line("semantic")+" |","| "+line("hybrid")+" |","| "+line("gated")+" |",
  "",
  "Paraphrase-only Top1: lexical "+p.lexical.top1+"/"+p.lexical.total+
    ", semantic "+p.semantic.top1+"/"+p.semantic.total+
    ", hybrid "+p.hybrid.top1+"/"+p.hybrid.total+".",
  "New near-domain holdout negatives (10) forced matches: "+JSON.stringify(report.negativesBySplit.holdout)+".",
  "**Do not ship automatically.** Six calibration negatives cannot establish safe abstention; academic approval and iOS performance gates still apply.",
 ].join("\n")+"\n");
}
console.log("LI_SEMANTIC_DECISION_GATE=EVAL_ONLY_NEVER_DEPLOY_AND_REVIEW_HOLDOUT");
