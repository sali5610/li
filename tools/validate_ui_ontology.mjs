#!/usr/bin/env node
/**
 * UX-DS-35 / ONT-02: UI-only crosswalk validator.
 * Reuses ONT-01 validate() and registry. No graph service, app mount or private data.
 * --check: shared typed graph + file-token-selector/slot/rule/QA coverage + negative fixtures.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validate as validateSharedGraph} from "./validate_ontology.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const load=(f)=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const uiGraph=load("docs/ontology/ui/ont02.graph.v0.1.json");
const crosswalk=load("docs/ontology/ui/ont02.source-crosswalk.v0.1.json");
const css=fs.readFileSync(path.join(root,"site/assets/design-tokens.css"),"utf8");
const values=load("design-system/tokens.json");
const registry=load("docs/ontology/registry.v0.1.json");
const kinds=new Set(registry.nodeKinds.filter(x=>x.domain==="ui").map(x=>x.name));
const allowedStates=new Set(["default","hover","focus-visible","pressed","disabled","loading","error","success","selected","readonly"]);
const allowedEvidence=new Set(["source_observed","specified_unverified"]);
function fail(message){throw new Error(message)}
function unique(arr,msg){if(new Set(arr).size!==arr.length)fail("duplicate "+msg)}
function hasEdge(g,predicate,from,to){return g.edges.some(e=>e.predicate===predicate&&e.from===from&&e.to===to)}
function validate(g,m){
  validateSharedGraph(g);
  assert.equal(m.contractVersion,registry.schemaVersion,"ONT-01 version drift");
  assert.equal(m.graphFile,"docs/ontology/ui/ont02.graph.v0.1.json");
  assert.equal(m.tokenValueAuthority,"design-system/tokens.json");
  assert.equal(m.runtimeGeneratedCss,"site/assets/design-tokens.css");
  assert.equal(m.approvalState,"g2_open","UI crosswalk cannot self-approve G2");
  assert.equal(m.runtimeStatus,"source_mapping_only","UI ontology is not a live React runtime");
  assert.ok(css.includes("GENERATED from design-system/tokens.json"),"only generated CSS can define values");
  assert.ok(values.colors.moss&&values.colors.cream&&values.semanticColors["focus-ring"],"authored tokens missing");
  const graphNodes=new Map(g.nodes.map(n=>[n.id,n]));
  const components=g.nodes.filter(n=>n.kind==="Component");
  assert.ok(components.length>0);
  assert.ok(g.nodes.every(n=>kinds.has(n.kind)),"non-UI kind leaked");
  assert.ok(g.edges.every(e=>["USES_TOKEN","HAS_VARIANT","HAS_SLOT","FILLS_SLOT","USES_PATTERN","CONSTRAINS","VALIDATES"].includes(e.predicate)),"non-UI edge leaked");
  assert.ok(g.nodes.every(n=>n.reviewState!=="approved"&&n.publishState!=="published"),"unapproved UI nodes falsely published");
  const ownerKeys=[];
  for(const c of m.components){
    assert.equal(c.approvalState,"g2_open","component G2 self approval");
    assert.equal(c.implementationStatus,"native_static_only");
    assert.equal(c.reactApiStatus,"not_implemented");
    assert.equal(c.deviceQa,"UNVERIFIED");
    assert.equal(graphNodes.get(c.componentId)?.kind,"Component","unknown component binding");
    assert.ok(["atom","molecule","organism","template"].includes(c.atomicLevel),"bad Atomic level");
    const owner=c.selectorOwner, markup=c.markupOwner;
    assert.ok(owner&&markup&&owner.file&&owner.selector&&markup.file&&markup.anchor);
    const ownerKey=owner.file+"#"+owner.selector;
    ownerKeys.push(ownerKey);
    assert.ok(fs.existsSync(path.join(root,owner.file)),"missing CSS owner "+owner.file);
    assert.ok(fs.readFileSync(path.join(root,owner.file),"utf8").includes(owner.selector),"selector not in owner "+ownerKey);
    assert.ok(fs.readFileSync(path.join(root,markup.file),"utf8").includes(markup.anchor),"markup anchor missing");
    assert.ok(c.variants.length>=2,"primary and secondary contracts required");
    unique(c.variants,"variant IDs");
    for(const v of c.variants){
      assert.equal(graphNodes.get(v)?.kind,"Variant","unsupported variant "+v);
      assert.ok(hasEdge(g,"HAS_VARIANT",c.componentId,v),"variant not owned by component "+v);
    }
    assert.ok(c.states.length>0,"states missing");
    unique(c.states.map(s=>s.name),"component states");
    for(const s of c.states){
      assert.ok(allowedStates.has(s.name),"unsupported component state "+s.name);
      assert.ok(allowedEvidence.has(s.evidence),"unknown state evidence label");
    }
    assert.equal(graphNodes.get(c.screenId)?.kind,"Screen");
    assert.equal(graphNodes.get(c.patternId)?.kind,"Pattern");
    assert.ok(hasEdge(g,"USES_PATTERN",c.screenId,c.patternId),"screen pattern link missing");
    unique(c.slotIds,"slot IDs");
    for(const slot of c.slotIds){
      assert.equal(graphNodes.get(slot)?.kind,"Slot","untyped slot "+slot);
      assert.ok(hasEdge(g,"HAS_SLOT",c.patternId,slot),"orphan slot "+slot);
      assert.ok(hasEdge(g,"FILLS_SLOT",c.componentId,slot),"slot has no component filler "+slot);
    }
    assert.ok(c.roles.length>=4,"button token roles incomplete");
    unique(c.roles.map(r=>r.role),"semantic token roles");
    for(const role of c.roles){
      assert.equal(graphNodes.get("token:css:"+role.referenceToken)?.kind,"DesignToken","unknown token "+role.referenceToken);
      assert.ok(hasEdge(g,"USES_TOKEN",c.componentId,"token:css:"+role.referenceToken),"unlinked token "+role.referenceToken);
      const actual=css.split("\n").some(line=>line.trim().startsWith(role.referenceToken+":"));
      assert.ok(actual,"token not in JSON-generated runtime CSS: "+role.referenceToken);
      assert.ok(role.semanticRole&&role.componentUse&&role.role,"missing semantic/component role metadata");
    }
    assert.ok(c.ruleIds.length>=4&&c.qaGateIds.length>=3,"rule/gate matrix insufficient");
    for(const rule of c.ruleIds){
      assert.equal(graphNodes.get(rule)?.kind,"UIRule","rule missing");
      assert.ok(g.edges.some(e=>e.predicate==="CONSTRAINS"&&e.from===rule),"unbound UI rule "+rule);
      assert.ok(g.edges.some(e=>e.predicate==="VALIDATES"&&e.to===rule),"missing QA gate for "+rule);
    }
    for(const gate of c.qaGateIds){
      assert.equal(graphNodes.get(gate)?.kind,"QAGate","QA Gate missing");
      assert.ok(g.edges.some(e=>e.predicate==="VALIDATES"&&e.from===gate),"gate no target "+gate);
    }
    assert.ok(c.responsiveScopes.length>=2,"responsive scopes missing");
    for(const x of c.responsiveScopes){
      assert.ok(Number.isInteger(x.minWidth)&&Number.isInteger(x.maxWidth)&&x.minWidth>=320&&x.maxWidth>=x.minWidth,"stale/invalid width range");
      assert.equal(x.qa,"unverified_physical","cannot self-certify physical Safari");
    }
    assert.ok(c.do&&c.dont,"Do/Don't required");
  }
  unique(ownerKeys,"selector ownership");
  return {components:m.components.length,nodes:g.nodes.length,edges:g.edges.length,tokenRoles:m.components.reduce((a,c)=>a+c.roles.length,0)};
}
function negative(){
  let count=0;
  function reject(name,mutate){
    const g=structuredClone(uiGraph),m=structuredClone(crosswalk);
    mutate(g,m);
    assert.throws(()=>validate(g,m),undefined,"negative must fail: "+name);
    count++;
  }
  reject("unknown token",(g,m)=>{m.components[0].roles[0].referenceToken="--unknown-token";});
  reject("orphan slot",(g,m)=>{g.edges=g.edges.filter(e=>!(e.predicate==="HAS_SLOT"&&e.to==="slot:LearningActionArea:secondary"));});
  reject("unsupported variant",(g,m)=>{m.components[0].variants.push("variant:Button:rounded-unapproved");});
  reject("missing UI rule gate",(g,m)=>{g.edges=g.edges.filter(e=>!(e.predicate==="VALIDATES"&&e.to==="rule:UX-DS-35:button-focus"));});
  reject("false G2 approval",(g,m)=>{m.approvalState="approved";});
  reject("duplicate selector ownership",(g,m)=>{m.components.push(structuredClone(m.components[0]));});
  reject("stale responsive range",(g,m)=>{m.components[0].responsiveScopes[0].maxWidth=300;});
  reject("unregistered State kind",(g,m)=>{g.nodes[0].kind="State";});
  reject("unreviewed node published",(g,m)=>{g.nodes.find(n=>n.kind==="Slot").publishState="published";});
  return count;
}
const args=process.argv.slice(2);
if(args.length===0||args.includes("--check")){
 const result=validate(uiGraph,crosswalk);
 console.log("PASS ONT-02 typed UI source crosswalk "+JSON.stringify({...result,negativeCases:negative(),physicalSafari:"UNVERIFIED",runtimeUI:"NOT IMPLEMENTED",g2:"OPEN"}));
}else fail("Usage: node tools/validate_ui_ontology.mjs --check");
