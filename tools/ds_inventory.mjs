#!/usr/bin/env node
/**
 * UX-DS-35 Stage 00 — source inventory. Zero dependencies; read-only by default.
 * This inventories authored source, NOT computed cascade/physical Safari/React parity.
 * Run: node tools/ds_inventory.mjs --check
 *      node tools/ds_inventory.mjs --write [path]
 *      node tools/ds_inventory.mjs --self-test
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const rel=(s)=>s.split(path.sep).join("/");
const hash=(s)=>crypto.createHash("sha256").update(s).digest("hex");
function files(dir,exts){
  const absolute=path.join(root,dir);
  if(!fs.existsSync(absolute))return [];
  const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap((x)=>{
    const p=path.join(d,x.name);
    if(x.isDirectory())return walk(p);
    return x.isFile()&&exts.some((e)=>p.endsWith(e))?[rel(path.relative(root,p))]:[];
  });
  return walk(absolute).sort();
}
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const cachedNewlines=new Map();
function lineOf(source,at){
  let lines=cachedNewlines.get(source);
  if(!lines){lines=[];for(let i=0;i<source.length;i++)if(source.charCodeAt(i)===10)lines.push(i);cachedNewlines.set(source,lines);}
  let l=0,h=lines.length;
  while(l<h){const m=(l+h)>>>1;if(lines[m]<at)l=m+1;else h=m;}
  return l+1;
}
function splitSelectors(raw){
  return raw.split(/,(?![^()]*\))/).map((s)=>s.trim().replace(/\s+/g," ")).filter(Boolean);
}
function parseCss(src,filename){
  const clean=src.replace(/\/\*[\s\S]*?\*\//g,(m)=>m.replace(/[^\n]/g," "));
  let stack=[],cursor=0,rules=[],atRules=[];
  for(let i=0;i<clean.length;i++){
    if(clean[i]==="{"){
      const prelude=clean.slice(cursor,i).trim();
      const at=/^@/.test(prelude);
      const start=Math.max(0,i-prelude.length);
      stack.push({prelude,at,atPosition:start,bodyStart:i+1});
      if(at)atRules.push({text:prelude,line:lineOf(src,start)});
      cursor=i+1;
    }else if(clean[i]==="}"){
      const current=stack.pop();
      if(!current){cursor=i+1;continue;}
      const body=clean.slice(current.bodyStart,i);
      if(!current.at&&!body.includes("{")){
        const declarations=body.split(";").map((d)=>d.trim()).filter((d)=>d.includes(":")).map((d)=>{
          const index=d.indexOf(":");
          return {property:d.slice(0,index).trim(),value:d.slice(index+1).trim()};
        });
        if(declarations.length)rules.push({
          selectors:splitSelectors(current.prelude),
          line:lineOf(src,current.atPosition),
          context:stack.filter((s)=>s.at).map((s)=>s.prelude),
          declarations,
          important:declarations.filter((d)=>d.value.includes("!important")).length
        });
      }
      cursor=i+1;
    }
  }
  return {file:filename,rules,atRules};
}
function flatten(node,prefix="",out=[]){
  if(node&&typeof node==="object"&&!Array.isArray(node)){
    for(const [k,v] of Object.entries(node))flatten(v,prefix?prefix+"."+k:k,out);
  }else if(Array.isArray(node)){
    for(let i=0;i<node.length;i++)flatten(node[i],prefix+"["+i+"]",out);
  }else out.push({path:prefix,value:node});
  return out;
}
function getScreens(html){
  const markers=[...html.matchAll(/\bid=["'](page-[^"']+)["']/g)].map((m)=>({name:m[1],start:m.index}));
  const seen=new Set();
  return markers.filter((m)=>!seen.has(m.name)&&seen.add(m.name)).map((m,i,a)=>({
    name:m.name,html:html.slice(m.start,i+1<a.length?a[i+1].start:html.length)
  }));
}
function build(){
  const tokens=JSON.parse(read("design-system/tokens.json"));
  const cssFiles=[...files("site",[".css"]),...files("tools/step16-real-l09-react-island",[".css"])]
    .filter((p)=>!p.endsWith("site/assets/lucide.min.css"));
  const docs=[...files("site",[".html"]),...files("tools/step16-real-l09-react-island/src",[".tsx",".jsx"])];
  const runtimeJs=[...files("site",[".js"]),...files("tools/step16-real-l09-react-island/src",[".ts",".tsx",".jsx"])]
    .filter((p)=>!p.endsWith("lucide.min.js"));
  const htmlIndex=fs.existsSync(path.join(root,"site/index.html"))?read("site/index.html"):"";
  const screens=getScreens(htmlIndex);
  const inlineCss=files("site",[".html"]).flatMap((p)=>{
    const html=read(p);
    return [...html.matchAll(/<style\\b[^>]*>([\\s\\S]*?)<\\/style>/gi)].map((m,i)=>parseCss(m[1],p+"#style-"+(i+1)));
  });
  const css=[...cssFiles.map((p)=>parseCss(read(p),p)),...inlineCss];
  const rules=css.flatMap((f)=>f.rules.map((r)=>({...r,file:f.file})));
  const owners=new Map(),varUses=new Map(),definedVars=new Map();
  for(const r of rules){
    for(const s of r.selectors){
      if(!owners.has(s))owners.set(s,[]);
      owners.get(s).push({file:r.file,line:r.line,context:r.context,important:r.important});
    }
    for(const d of r.declarations){
      if(d.property.startsWith("--")){
        if(!definedVars.has(d.property))definedVars.set(d.property,[]);
        definedVars.get(d.property).push(r.file+":"+r.line);
      }
      for(const v of d.value.matchAll(/var\(\s*(--[\w-]+)/g)){
        if(!varUses.has(v[1]))varUses.set(v[1],0);
        varUses.set(v[1],varUses.get(v[1])+1);
      }
    }
  }
  const pageNames=screens.map((s)=>s.name);
  const docTexts=docs.map((p)=>({file:p,text:read(p)}));
  const jsTexts=runtimeJs.map((p)=>({file:p,text:read(p)}));
  const usage=rules.flatMap((r)=>r.selectors.map((selector)=>{
    const classes=[...selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m)=>m[1]);
    const ids=[...selector.matchAll(/#([A-Za-z_][\w-]*)/g)].map((m)=>m[1]);
    const key=ids[0]||classes[classes.length-1]||null;
    if(!key)return null;
    const needle=key;
    const pageUsage=screens.filter((s)=>s.html.includes(needle)).map((s)=>s.name);
    const staticFiles=docTexts.filter((d)=>d.text.includes(needle)).map((d)=>d.file);
    const dynamicFiles=jsTexts.filter((d)=>d.text.includes(needle)).map((d)=>d.file);
    return {selector,file:r.file,line:r.line,identifier:needle,pages:pageUsage,markupFiles:staticFiles,dynamicSourceFiles:dynamicFiles,
      confidence:"lexical only; runtime condition and cascade UNVERIFIED"};
  }).filter(Boolean));
  const duplicateSelectors=[...owners.entries()].filter(([,v])=>v.length>1).map(([selector,locations])=>({
    selector,locations,count:locations.length,multiFile:new Set(locations.map((x)=>x.file)).size>1
  })).sort((a,b)=>b.count-a.count||a.selector.localeCompare(b.selector));
  const breakpoints=css.flatMap((f)=>f.atRules.filter((x)=>/^@(media|container|supports)\b/.test(x.text)).map((x)=>({file:f.file,...x})));
  const styles=css.map((f)=>({file:f.file,ruleBlocks:f.rules.length,selectors:f.rules.reduce((n,r)=>n+r.selectors.length,0),
    declarations:f.rules.reduce((n,r)=>n+r.declarations.length,0),
    important:f.rules.reduce((n,r)=>n+r.important,0),atRules:f.atRules.length,
    sha256:f.file.includes("#style-")?"embedded in HTML; consult source file":hash(read(f.file))}));
  const tokenLeaves=flatten(tokens);
  const statusStates=new Set(["hover","focus","focus-visible","active","disabled","checked","invalid","empty","selected","loading","error","success","open","expanded","pressed","readonly","read-only"]);
  const occurrences=[];
  for(const r of rules)for(const s of r.selectors){
    const states=[...statusStates].filter((name)=>new RegExp("(?::|[.\\-_])"+name+"(?:\\b|$)").test(s));
    if(states.length)occurrences.push({selector:s,file:r.file,line:r.line,states});
  }
  const report={
    tool:"UX-DS-35-stage00",schemaVersion:1,generatedAt:"deterministic source scan; no wall-clock timestamp",
    evidence:"static source only; no computed CSS or physical-device verification",
    source:{tokenFile:"design-system/tokens.json",tokenSha256:hash(read("design-system/tokens.json")),
      cssFiles:css.map((f)=>f.file),htmlFiles:docs,jsFiles:runtimeJs,screens:pageNames},
    summary:{tokenLeaves:tokenLeaves.length,cssFiles:styles.length,cssRuleBlocks:rules.length,
      selectorOccurrences:[...owners.values()].reduce((n,v)=>n+v.length,0),
      distinctSelectors:owners.size,duplicateSelectorKeys:duplicateSelectors.length,
      crossFileDuplicateKeys:duplicateSelectors.filter((r)=>r.multiFile).length,
      importantDeclarations:styles.reduce((n,x)=>n+x.important,0),mediaAndContainerRules:breakpoints.length,
      knownScreenIDs:pageNames.length,staticReactFiles:docs.filter((p)=>/\.(tsx|jsx)$/.test(p)).length},
    tokenLeaves,styles,breakpoints,selectorOwners:Object.fromEntries([...owners].sort((a,b)=>a[0].localeCompare(b[0]))),
    duplicateSelectors,stateSelectors:occurrences,customProperties:{
      authoredDefinitions:Object.fromEntries([...definedVars].sort()),
      referenced:Object.fromEntries([...varUses].sort()),
      undefinedInScannedCss:[...varUses.keys()].filter((v)=>!definedVars.has(v)).sort()
    },selectorUsage:usage
  };
  return report;
}
function selfTest(){
  const s=parseCss(".a,.b:hover{color:var(--ink)!important}@media(max-width:640px){.a{padding:4px}}","demo.css");
  assert.equal(s.rules.length,2);
  assert.equal(s.rules[0].selectors.length,2);
  assert.equal(s.rules[0].important,1);
  assert.ok(s.rules[1].context[0].includes("max-width"));
  assert.deepEqual(flatten({a:{b:1}}),[{path:"a.b",value:1}]);
  console.log("PASS DS stage00 parser self-test");
}
const args=process.argv.slice(2);
if(args.includes("--self-test")){selfTest();process.exit(0);}
const inventory=build();
if(args.includes("--check")){
  assert.ok(inventory.summary.tokenLeaves>0,"Tokens must parse");
  assert.ok(inventory.summary.cssRuleBlocks>0,"CSS sources must be scanned");
  assert.ok(inventory.source.screens.length>0,"Screen anchors must be scanned");
  assert.ok(inventory.source.cssFiles.includes("site/assets/ui-foundations.css"),"UI foundation must be included");
  assert.ok(inventory.source.cssFiles.includes("site/assets/li-layout.css"),"Legacy CSS must be included");
  console.log("PASS Stage00 inventory source coverage: "+JSON.stringify(inventory.summary));
  console.log("UNVERIFIED: computed cascade, real Safari/iPhone/iPad/VoiceOver, visual G2 and React branches not checked out");
}else if(args.includes("--write")){
  const i=args.indexOf("--write");
  const dest=args[i+1]&&!args[i+1].startsWith("--")?args[i+1]:"/tmp/li-ux-ds-35-stage00-inventory.json";
  fs.writeFileSync(path.resolve(root,dest),JSON.stringify(inventory,null,2)+"\n");
  console.log("WROTE "+dest+" "+JSON.stringify(inventory.summary));
}else{
  console.log(JSON.stringify(inventory.summary,null,2));
}
