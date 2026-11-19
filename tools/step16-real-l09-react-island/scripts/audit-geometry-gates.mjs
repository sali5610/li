#!/usr/bin/env node
/**
 * Stage02B: CI real-screen geometry gate review; NEVER auto-approves G2.
 * Assert all legacy deltas are mapped to explicit review classes, and
 * new Shared.tsx fixture is separately measured (NOT L09 screen adoption).
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const contract=JSON.parse(read('tools/step16-real-l09-react-island/src/ui/geometry-gates.stage02b.json'));
const owners=JSON.parse(read('tools/step16-real-l09-react-island/src/ui/ownership.stage02b.json'));
const pilot=read('tools/step16-real-l09-react-island/src/Pilot.tsx');
const shared=read('tools/step16-real-l09-react-island/src/ui/Shared.tsx');
const preview=read('tools/step16-real-l09-react-island/src/ui/Preview.tsx');
const css=read('site/assets/li-layout.css');
const legacyCss=read('tools/step16-real-l09-react-island/src/pilot.css');
const reportPath='/tmp/li-uxds35-stage02b/combined/real-l09-geometry/computed-real-l09-ledger.json';
const outputPath='/tmp/li-uxds35-stage02b/combined/real-l09-geometry/geometry-gate-classification.json';
const families=['primary','secondary','field','surface','group'];
const paintFamilies=['primary','secondary','field','surface'];
const widths=[320,390,820,1040];
function verify(ledger){
 assert.equal(contract.profile,'uxds35-stage02b-real-l09-geometry-gates');
 assert.equal(contract.approval,'G2_OPEN','No visual decision is approved');
 assert.equal(contract.stage,'Stage02B_PARTIAL','Stage02 promotion requires external gate');
 assert.equal(contract.tracks.nativeVsSharedReactFixture.productAdoption,'NOT_IMPLEMENTED');
 assert.equal(contract.gates.HumanG2,'OPEN');
 assert.equal(ledger.scope,'THREE OWNERS: actual native L09, opt-in LEGACY React L09, and NEW Shared.tsx React preview');
 assert.equal(ledger.provenance.legacyReact.includes('Primitives.tsx'),true,'Legacy source owner was mislabeled');
 assert.equal(ledger.provenance.sharedReact.includes('Shared.tsx'),true,'New shared owner was mislabeled');
 assert.equal(ledger.pixelParity,'NOT_APPROVED');
 assert.equal(ledger.g2,'OPEN');
 assert.equal(ledger.realSafari,'NOT_RUN');
 assert.equal(ledger.learnerWrite,'NONE');
 assert.equal(ledger.samples.length,4);
 assert.deepEqual(ledger.samples.map(x=>x.width),widths);
 assert.ok(ledger.chromiumChecks>=48,'Missing third independent owner track checks');
 const historic=contract.tracks.realScreenNativeVsLegacyReact.variants;
 const unmapped=[],claims=[],deltas={};
 for(const s of ledger.samples){
  assert.equal(s.geometryApproval,'OPEN');
  assert.equal(s.native.viewport,s.width);
  assert.equal(s.react.viewport,s.width);
  assert.equal(s.sharedPreview.viewport,s.width);
  assert.ok(s.native.scrollWidth<=s.width+1&&s.react.scrollWidth<=s.width+1&&s.sharedPreview.scrollWidth<=s.width+1,
   'A source owner horizontally overflows');
  assert.equal(s.native.learnerKey,s.react.learnerKey);
  assert.equal(s.native.learnerKey,s.sharedPreview.learnerKey);
  assert.equal(s.dimensions.length,5);
  assert.equal(s.sharedComparison.length,5);
  for(const [track,arr] of [['legacy',s.dimensions],['shared',s.sharedComparison]]){
   assert.deepEqual(arr.map(x=>x.family),families);
   for(const item of arr){
    assert.equal(item.status,'MEASURED_PENDING_G2');
    if(paintFamilies.includes(item.family))assert.equal(item.paintEqual,true,'Semantic paint drift '+track+item.family);
    if(track==='legacy'){
     for(const key of Object.keys(item.geometryDifferent)){
      const kind=historic[item.family]?.reviewKeys?.[key];
      if(!kind)unmapped.push({width:s.width,family:item.family,key});
      else (deltas[item.family]??=new Set()).add(key);
     }
    }else{
     assert.ok(item.reactSelector.startsWith('.li-ui-preview'),'Fixture falsely labeled as real L09 consumer');
     if(item.family==='field')claims.push({width:s.width,reason:'Native guided textarea vs shared TextInput is a different form variant'});
    }
   }
  }
  for(const name of ['primary','secondary','field']){
   assert.ok(s.sharedPreview.components[name].height>=48,'New shared touch target CSS px shortfall '+name);
  }
 }
 assert.deepEqual(unmapped,[],'Unclassified CSS geometry property drift');
 assert.ok(owners.components.length===9&&owners.components.filter(x=>x.reactUsage==='fixture_only').length===8);
 assert.equal(owners.components.find(x=>x.api==='ActionGroup').reactUsage,'research_L09_island');
 assert.match(pilot,/import \{ActionButton,Surface,StatusMessage\} from '\.\/ui\/Primitives';/);
 assert.match(pilot,/import \{ActionGroup\} from '\.\/ui\/Shared';/);
 assert.equal((pilot.match(/<ActionGroup className="pilot-actions">/g)||[]).length,2);
 assert.match(shared,/export function Button\(/);assert.match(shared,/export function Card\(/);
 assert.match(preview,/<Button data-ui-primary/);assert.match(preview,/<Card aria-label=/);
 assert.ok(css.includes('.action{display:inline-flex')&&css.includes('min-height:46px'));
 assert.ok(css.includes('.surface{background:var(--li-comp-surface-background)'));
 assert.ok(css.includes('padding:var(--li-space-6)'));
 assert.ok(legacyCss.includes('.pilot-surface{background:var(--li-comp-surface-background,var(--cream))'));
 assert.ok(legacyCss.includes('padding:var(--li-space-4)'));
 const classification={
  profile:contract.profile,sourceHead:ledger.sourceHead,stage:'Stage02B_PARTIAL',humanG2:'OPEN',
  checkedViewports:widths,sourceProfiles:['nativeL09','legacyReactL09','newSharedReactFixture'],
  legacyDeltas:Object.fromEntries(Object.entries(deltas).map(([k,v])=>[k,[...v].sort().map(prop=>({property:prop,reviewClass:historic[k].reviewKeys[prop]}))])),
  newSharedFixture:{
   rolePaintMatches:true,intended48pxTargetsMeet:true,
   productComponentAdoption:'FIXTURE_ONLY_EXCEPT_ACTION_GROUP_RESEARCH',
   nonIdenticalNativeContexts:'RECORDED_NOT_PIXEL_APPROVED',
   perFamilyMeasuredDeltas:Object.fromEntries(families.map(f=>[f,ledger.sharedFindings[f].propertiesNeedingReview]))
  },
  guidedTextareaVsSharedTextInput:'NOT_SAME_VARIANT',
  actionGroupHeight:'CONTEXTUAL_CHILD_LAYOUT_NOT_PIXEL_ASSERTION',
  unknownGeometryDeltas:unmapped,negativeFixtures:'RUN_ONLY_WITH_SELFTEST',
  finalApproval:'NONE',noSourceRecolor:true,realSafari:'NOT_RUN',voiceOver:'OUT_OF_SCOPE_PO_S208',
  note:'No native or React visual CSS values edited; this validates provenance and review classification only.'
 };
 return classification;
}
const ledger=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const result=verify(ledger);
if(process.argv.includes('--selftest')){
 const copy=x=>JSON.parse(JSON.stringify(x));
 const tamper=copy(ledger);
 tamper.samples[1].dimensions[0].geometryDifferent.__unknownFutureProperty={native:'a',react:'b'};
 assert.throws(()=>verify(tamper),/Unclassified CSS geometry/,'Unknown new style drift must fail closed');
 const forged=copy(ledger);
 forged.provenance.sharedReact='Primitives.tsx mislabeled';
 assert.throws(()=>verify(forged),/New shared owner was mislabeled/);
 const fake=copy(ledger);
 fake.g2='APPROVED';
 assert.throws(()=>verify(fake),/Expected values to be strictly equal/);
 const missing=copy(ledger);
 delete missing.samples[2].sharedPreview;
 assert.throws(()=>verify(missing));
 result.negativeFixtures='4_OF_4_PASS';
}
fs.writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');
console.log('PASS STAGE02B_THREE_OWNER_GEOMETRY_REVIEW '+JSON.stringify({
 viewports:widths,legacyFamilies:Object.keys(result.legacyDeltas),
 sharedFamilies:Object.keys(result.newSharedFixture.perFamilyMeasuredDeltas),
 legacyDifferingProperties:Object.fromEntries(Object.entries(result.legacyDeltas).map(([k,v])=>[k,v.map(t=>t.property)])),
 negativeFixtures:result.negativeFixtures,sourceRoles:'PROVEN',g2:'OPEN',production:'NONE'}));
