#!/usr/bin/env node
/** UX-DS-35 ONT-02: source-grounded UI graph; cross-branch alias ownership remains pending same-tree checks. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validate as validateSharedGraph} from "./validate_ontology.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const load=(name)=>JSON.parse(fs.readFileSync(path.join(root,name),"utf8"));
const ui=load("docs/ontology/ui/ont02.graph.v0.1.json");
const metadata=load("docs/ontology/ui/ont02.source-crosswalk.v0.1.json");
const css=fs.readFileSync(path.join(root,"site/assets/design-tokens.css"),"utf8");
const vals=load("design-system/tokens.json");
const registry=load("docs/ontology/registry.v0.1.json");
const kinds=new Set(registry.nodeKinds.filter(k=>k.domain==="ui").map(k=>k.name));
const allowedStates=new Set(["default","hover","focus","focus-visible","pressed","selected","disabled","loading","error","success","readonly"]);
const allowedEvidence=new Set(["source_observed","specified_unverified"]);
const validPreds=new Set(["USES_TOKEN","HAS_VARIANT","HAS_SLOT","FILLS_SLOT","USES_PATTERN","CONSTRAINS","VALIDATES"]);
function existsAndIncludes(f,token){
 assert.ok(typeof f==="string"&&f.startsWith("site/"),"expected native site source path");
 assert.ok(fs.existsSync(path.join(root,f)),"missing native source "+f);
 assert.ok(fs.readFileSync(path.join(root,f),"utf8").includes(token),"native source anchor missing: "+f+"#"+token);
}
const edge=(g,p,f,t)=>g.edges.some(e=>e.predicate===p&&e.from===f&&e.to===t);
const unique=(arr,label)=>assert.equal(new Set(arr).size,arr.length,"duplicate "+label);
function validate(g,m){
 const shared=validateSharedGraph(g);
 assert.equal(m.contractVersion,registry.schemaVersion,"ONT-01 version drift");
 assert.equal(m.graphFile,"docs/ontology/ui/ont02.graph.v0.1.json");
 assert.equal(m.tokenValueAuthority,"design-system/tokens.json");
 assert.equal(m.runtimeGeneratedCss,"site/assets/design-tokens.css");
 assert.equal(m.sourcePins.ont01,"6b486a3a70be356a5dc21a2bb44117c457833caf");
 assert.equal(m.sourcePins.uxDs35Draft,"d22f469a52d13baa73c0c8952b198fdfeb2b2891");
 assert.equal(m.crossBranchIntegration,"PENDING_SAME_TREE_REVIEW","must not claim branch merge/runtime integration");
 assert.equal(m.approvalState,"g2_open");
 assert.equal(m.runtimeStatus,"source_mapping_only");
 assert.ok(css.includes("GENERATED from design-system/tokens.json"));
 const n=new Map(g.nodes.map(x=>[x.id,x]));
 assert.ok(g.nodes.every(x=>kinds.has(x.kind)),"non-UI ontology node");
 assert.ok(g.edges.every(x=>validPreds.has(x.predicate)),"non-UI ontology relation");
 assert.ok(g.nodes.every(x=>x.reviewState!=="approved"&&x.publishState!=="published"),"unapproved node promoted");
 const proposedOnly=["component:ActionGroup"];
 assert.deepEqual(m.unmappedProposals,proposedOnly,"only explicitly unimplemented ActionGroup is exempt");
 for(const id of proposedOnly)assert.equal(n.get(id)?.reviewState,"proposed","unmapped component must remain proposal");
 const components=g.nodes.filter(x=>x.kind==="Component"&&!proposedOnly.includes(x.id)).map(x=>x.id).sort();
 assert.deepEqual(m.components.map(x=>x.componentId).sort(),components,"untracked component node");
 assert.equal(components.length,5,"five native families must have source mappings");
 const owner=[];
 for(const c of m.components){
  assert.equal(c.approvalState,"g2_open");
  assert.equal(c.implementationStatus,"native_static_only");
  assert.equal(c.reactApiStatus,"not_implemented");
  assert.equal(c.deviceQa,"UNVERIFIED");
  assert.ok(["atom","molecule","organism","template"].includes(c.atomicLevel));
  assert.equal(n.get(c.componentId)?.kind,"Component");
  existsAndIncludes(c.selectorOwner.file,c.selectorOwner.selector);
  owner.push(c.selectorOwner.file+"#"+c.selectorOwner.selector);
  if(c.markupOwner){
   assert.equal(c.sourceStatus,"native_markup_observed");
   existsAndIncludes(c.markupOwner.file,c.markupOwner.anchor);
  }else{
   assert.equal(c.sourceStatus,"css_only_markup_unverified");
   assert.equal(c.patternId,null,"CSS-only state may not claim screen pattern");
   assert.equal(c.screenId,null,"CSS-only state may not claim screen presence");
  }
  unique(c.variants,"variants");
  for(const variant of c.variants){
   assert.equal(n.get(variant)?.kind,"Variant");
   assert.ok(edge(g,"HAS_VARIANT",c.componentId,variant),"variant without component edge "+variant);
  }
  if(c.patternId!==null){
   assert.equal(n.get(c.patternId)?.kind,"Pattern");
   assert.equal(n.get(c.screenId)?.kind,"Screen");
   assert.ok(edge(g,"USES_PATTERN",c.screenId,c.patternId),"screen pattern link missing");
  }
  unique(c.slotIds,"slot IDs");
  for(const slot of c.slotIds){
   assert.equal(n.get(slot)?.kind,"Slot","unregistered slot");
   assert.ok(edge(g,"HAS_SLOT",c.patternId,slot),"pattern slot missing "+slot);
   assert.ok(edge(g,"FILLS_SLOT",c.componentId,slot),"no filler for slot "+slot);
  }
  assert.ok(c.states.length>0);
  unique(c.states.map(x=>x.name),"states");
  for(const state of c.states){
   assert.ok(allowedStates.has(state.name),"unsupported UI state "+state.name);
   assert.ok(allowedEvidence.has(state.evidence),"state evidence must distinguish observed vs specified");
  }
  assert.ok(c.roles.length>=2,"token role coverage missing");
  unique(c.roles.map(x=>x.role),"token roles");
  for(const role of c.roles){
   const id="token:css:"+role.referenceToken;
   assert.equal(n.get(id)?.kind,"DesignToken","unregistered source token "+id);
   assert.ok(edge(g,"USES_TOKEN",c.componentId,id),"unlinked role token "+id);
   assert.ok(css.split("\n").some(line=>line.trim().startsWith(role.referenceToken+":")),"source reference token missing "+id);
   assert.ok(/^[a-z][a-z0-9-]*$/.test(role.semanticRole),"bad semantic role identifier");
   assert.ok(/^[a-z][a-z0-9-]*$/.test(role.componentRole),"bad component role identifier");
   assert.equal(role.semanticCssVar,"--li-role-"+role.semanticRole);
   assert.equal(role.componentCssVar,"--li-comp-"+role.componentRole);
   assert.ok(role.role&&role.componentUse,"empty role label");
   // ONT-01 branch does not contain UX-DS-35 alias additions; when combined, validate exact authored chain.
   if(vals.semanticRoles&&vals.componentRoles){
    assert.equal(vals.semanticRoles[role.semanticRole],role.referenceToken,"semantic→ref drift");
    assert.equal(vals.componentRoles[role.componentRole],role.semanticCssVar,"component→semantic drift");
    assert.ok(css.includes(role.componentCssVar+":"),"component CSS alias missing");
   }else{
    assert.equal(m.crossBranchIntegration,"PENDING_SAME_TREE_REVIEW");
   }
  }
  assert.ok(c.ruleIds.length>=2&&c.qaGateIds.length>=2,"missing UI rule/QA matrix");
  for(const rule of c.ruleIds){
   assert.equal(n.get(rule)?.kind,"UIRule");
   assert.ok(g.edges.some(e=>e.predicate==="CONSTRAINS"&&e.from===rule),"orphan UI rule "+rule);
   assert.ok(g.edges.some(e=>e.predicate==="VALIDATES"&&e.to===rule),"rule has no QA gate "+rule);
  }
  for(const gate of c.qaGateIds){
   assert.equal(n.get(gate)?.kind,"QAGate");
   assert.ok(g.edges.some(e=>e.predicate==="VALIDATES"&&e.from===gate),"orphan gate "+gate);
  }
  assert.ok(c.responsiveScopes.length>=2);
  for(const view of c.responsiveScopes){
   assert.ok(Number.isInteger(view.minWidth)&&Number.isInteger(view.maxWidth)&&view.minWidth>=320&&view.maxWidth>=view.minWidth,"invalid responsive range");
   assert.equal(view.qa,"unverified_physical","physical device cannot self-pass");
  }
  assert.ok(c.do&&c.dont,"Do/Don't missing");
 }
 unique(owner,"selector owners");
 return {components:components.length,nodes:g.nodes.length,edges:g.edges.length,tokenRoles:m.components.reduce((n,c)=>n+c.roles.length,0),sharedNodes:shared.nodes};
}
function negatives(){
 let count=0;
 const rejects=(name,mutate)=>{
  const g=structuredClone(ui),m=structuredClone(metadata);
  mutate(g,m);
  assert.throws(()=>validate(g,m),undefined,"negative accepted: "+name);
  count++;
 };
 rejects("unknown source token",(g,m)=>{m.components[0].roles[0].referenceToken="--not-a-token";});
 rejects("orphan slot",(g,m)=>{g.edges=g.edges.filter(e=>!(e.predicate==="HAS_SLOT"&&e.to==="slot:LearningActionArea:secondary"));});
 rejects("unsupported variant",(g,m)=>{m.components[0].variants.push("variant:Button:unapproved-rounded");});
 rejects("missing UI rule QA",(g,m)=>{g.edges=g.edges.filter(e=>!(e.predicate==="VALIDATES"&&e.to==="rule:UX-DS-35:button-focus"));});
 rejects("false G2 approval",(g,m)=>{m.approvalState="approved";});
 rejects("duplicate selector ownership",(g,m)=>{m.components[1].selectorOwner=structuredClone(m.components[0].selectorOwner);});
 rejects("stale responsive range",(g,m)=>{m.components[0].responsiveScopes[0].maxWidth=300;});
 rejects("fake State kind",(g,m)=>{g.nodes[0].kind="State";});
 rejects("unreviewed node published",(g,m)=>{g.nodes.find(x=>x.kind==="Slot").publishState="published";});
 rejects("fake status banner markup",(g,m)=>{m.components.find(x=>x.componentId==="component:StatusBanner").sourceStatus="native_markup_observed";});
 rejects("alias name mismatch",(g,m)=>{m.components[0].roles[0].semanticCssVar="--li-role-some-wrong-name";});
 rejects("absent native owner",(g,m)=>{m.components.find(x=>x.componentId==="component:Surface").selectorOwner.selector=".made-up-class";});
 rejects("false React runtime",(g,m)=>{m.components[0].reactApiStatus="implemented";});
 rejects("missing native component",(g,m)=>{m.components.pop();});
 return count;
}
if(process.argv.length===2||process.argv.includes("--check")||process.argv.includes("--composed-check")){
const composed=process.argv.includes('--composed-check');
if(composed){
 assert.ok(vals.semanticRoles&&vals.componentRoles,'composed DS token maps absent');
 assert.equal(Object.keys(vals.semanticRoles).length,27,'DS semantic roles drift');
 assert.equal(Object.keys(vals.componentRoles).length,21,'DS component roles drift');
 const typed=fs.readFileSync(path.join(root,'design-system/generated/css-token-refs.ts'),'utf8');
 const native=fs.readFileSync(path.join(root,'site/assets/li-layout.css'),'utf8')+
              fs.readFileSync(path.join(root,'site/assets/ui-foundations.css'),'utf8');
 let aliases=0,consumers=0;
 for(const c of metadata.components){
  for(const role of c.roles){
   assert.equal(vals.semanticRoles[role.semanticRole],role.referenceToken,'semantic token drift: '+role.role);
   assert.equal(vals.componentRoles[role.componentRole],role.semanticCssVar,'component token drift: '+role.role);
   assert.ok(css.includes(role.semanticCssVar+': var('+role.referenceToken+');'),'generated semantic CSS drift: '+role.role);
   assert.ok(css.includes(role.componentCssVar+': var('+role.semanticCssVar+');'),'generated component CSS drift: '+role.role);
   assert.ok(typed.includes(JSON.stringify(role.componentCssVar)+': '+JSON.stringify('var('+role.componentCssVar+')')),'typed TS drift: '+role.role);
   if(native.includes('var('+role.componentCssVar+')'))consumers++;
   aliases++;
  }
 }
 assert.equal(aliases,19);
 assert.equal(consumers,19,'native selector adoption moved: investigate before promotion');
 assert.ok(native.includes('button:focus-visible{outline:3px solid var(--li-comp-button-focus-ring);'),'native button focus selector missing');
 assert.ok(native.includes('a:focus-visible{outline:3px solid var(--li-color-general-focus-ring);'),'link focus was altered');
 console.log('PASS composed immutable DS+ONT02 test worktree: 19/19 exact alias chains and 19/19 native CSS consumers, no source visual drift; branches remain DRAFT');
}
console.log("PASS UX-DS-35 ONT-02 UI crosswalk "+JSON.stringify({...validate(ui,metadata),negativeCases:negatives(),composedFixture:composed?"PASS_SOURCE_ONLY":"NOT_EXECUTED",crossBranch:"PENDING_SAME_TREE_REVIEW",device:"UNVERIFIED",g2:"OPEN",runtime:"NOT IMPLEMENTED"}));
}else throw new Error("Usage: node tools/validate_ui_ontology.mjs [--check|--composed-check]");
