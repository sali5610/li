#!/usr/bin/env node
/**
 * UX-DS-35 Stage02B: assert explicit React API ownership + status provenance
 * while keeping ONT-02 native-only source contract unchanged.
 * NO networking, auth, user storage, staging or deployment.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const own=JSON.parse(read('tools/step16-real-l09-react-island/src/ui/ownership.stage02b.json'));
const native=JSON.parse(read('docs/ontology/ui/ont02.source-crosswalk.v0.1.json'));
const ds=JSON.parse(read('design-system/tokens.json'));
const css=read('tools/step16-real-l09-react-island/src/ui/shared.css');
const shared=read('tools/step16-real-l09-react-island/src/ui/Shared.tsx');
const pilot=read('tools/step16-real-l09-react-island/src/Pilot.tsx');
const preview=read('tools/step16-real-l09-react-island/src/ui/Preview.tsx');
const generated=read('site/assets/design-tokens.css');
const one=(p,t)=>assert.ok(read(p).includes(t),'Missing source: '+p+'#'+t);
assert.equal(own.profile,'UX-DS-35-Stage02B-react-ownership');
assert.equal(own.review,'G2_OPEN');
assert.equal(own.implementation,'DRAFT_UNMERGED');
assert.equal(native.approvalState,'g2_open');
assert.equal(native.runtimeStatus,'source_mapping_only');
assert.equal(native.crossBranchIntegration,'PENDING_SAME_TREE_REVIEW');
assert.deepEqual(native.unmappedProposals,['component:ActionGroup']);
assert.equal(own.sourcePins.ds,native.sourcePins.uxDs35Draft);
assert.equal(own.sourcePins.ontology,'0fe2d9b92a66e64ea3244d910d789ccc0d458a5b');
assert.equal(own.sourcePins.reactParent,native.sourcePins.reactPrimitivesDraft);
assert.ok(own.sourcePins.integratedSibling.length===40);
assert.equal(own.components.length,9,'No additional React owner silently introduced');
assert.deepEqual(own.components.map(x=>x.api),[
  'Button','IconButton','TextInput','TextAreaField','Card',
  'ActionGroup','Navigation','Feedback','Dialog'
]);
const nativeIds=new Set(native.components.map(x=>x.componentId));
let mapped=0,roleRefs=new Set();
for(const e of own.components){
 assert.ok(['atom','molecule','organism'].includes(e.atomicLevel));
 assert.equal(e.reactOwner,'tools/step16-real-l09-react-island/src/ui/Shared.tsx');
 assert.equal(e.cssOwner,'tools/step16-real-l09-react-island/src/ui/shared.css');
 assert.ok(['fixture_only','research_L09_island'].includes(e.reactUsage));
 assert.equal(e.equivalence,'NOT_VERIFIED','Cannot claim component native parity without actual rendered proof');
 assert.ok(Array.isArray(e.statesSpecified)&&e.statesSpecified.length>0);
 assert.ok(e.notes.length>30,'No implicit owner/equivalence assumptions');
 assert.ok(shared.includes('export function '+e.api+'('),'Shared API absent '+e.api);
 assert.ok(preview.includes(e.api),'Research UI fixture missing '+e.api);
 assert.ok(css.includes(e.selector),'Scoped CSS owner absent '+e.api+' '+e.selector);
 if(e.ontologyNode){
  assert.ok(nativeIds.has(e.ontologyNode)||native.unmappedProposals.includes(e.ontologyNode),
    'React component has unregistered ontology candidate '+e.api);
  mapped++;
 }
 const [nativeFile]=e.nativeAnalog.split('#');
 assert.ok(fs.existsSync(path.join(root,nativeFile)),'Native source owner missing '+e.api);
 if(e.api==='ActionGroup')assert.equal(e.reactUsage,'research_L09_island');
 else assert.equal(e.reactUsage,'fixture_only','No false production consumer '+e.api);
}
assert.equal(mapped,7);
assert.equal((pilot.match(/<ActionGroup className="pilot-actions">/g)||[]).length,2);
assert.equal((pilot.match(/<\/ActionGroup>/g)||[]).length,2);
assert.equal(native.components.filter(x=>x.reactApiStatus==='not_implemented').length,5,
 'Native historical graph status must not be rewritten to React approval');
for(const m of native.components)for(const role of m.roles){
 assert.equal(ds.semanticRoles[role.semanticRole],role.referenceToken);
 assert.equal(ds.componentRoles[role.componentRole],role.semanticCssVar);
 assert.ok(generated.includes(role.componentCssVar+': var('+role.semanticCssVar+')'));
 roleRefs.add(role.componentCssVar);
}
assert.equal(roleRefs.size,19,'19 distinct ontology native role bindings');
const refs=[...new Set([...css.matchAll(/var\((--li-comp-[a-z0-9-]+)/g)].map(x=>x[1]))].sort();
for(const ref of refs)assert.ok(generated.includes(ref+': var('),'New React token alias absent '+ref);
assert.ok(refs.length>=10,'React shared CSS role references unexpectedly sparse');
const authoredCss=css.replace(/\/\*[\s\S]*?\*\//g,''); // PR number #134 is a comment, not a 3-digit hex color
const paintLiterals=[...authoredCss.matchAll(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi)].map(x=>x[0]);
assert.deepEqual(paintLiterals,[],'Unapproved React palette literal');
const cssReview=[
 ...css.matchAll(/(?:max-width|max-height|border|box-shadow|border-radius|font-size):[^;}]+/g)
].map(x=>x[0]).filter(x=>/\d+(?:px|svh|dvh)/.test(x));
const qa={
 owner:'React ownership register v0.1 / G2 OPEN',
 source:'full-tree CI unmerged',nativeOntology:'native_only_source_mapping',
 componentApis:own.components.map(x=>({name:x.api,usage:x.reactUsage,ontologyNode:x.ontologyNode,equivalence:x.equivalence})),
 mappedNativeAnalogCount:mapped,nativeRoles:roleRefs.size,reactComponentRoles:refs,
 rawPaintDebt:paintLiterals,geometryCandidatesForG2Review:cssReview,
 gates:{reactSource:'PASS',actualProductScreenOwnership:'ONLY_RESEARCH_L09_ACTION_GROUP',
 nativeToReactPixelParity:'NOT_RUN',physicalSafari:'NOT_RUN',G2:'OPEN'}
};
const out='/tmp/li-uxds35-stage02b';
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'react-ownership-and-geometry-ledger.json'),JSON.stringify(qa,null,2)+'\n');
console.log('PASS STAGE02B_REACT_OWNERSHIP '+JSON.stringify({
 apis:own.components.length,usedInL09:1,fixtureOnly:8,
 nativeAnalogs:mapped,ontologyRoles:roleRefs.size,reactAliases:refs.length,
 rawPaintDebt:paintLiterals.length,geometryPending:cssReview.length,G2:'OPEN'}));
