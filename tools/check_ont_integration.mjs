#!/usr/bin/env node
/**
 * ONT-INT-01 one-real-tree source rehearsal (NO deploy/Auth/Neon access).
 * Checks actual files coexisting in one checkout. Does not claim runtime parity.
 */
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=[
  'docs/ontology/registry.v0.1.json',
  'docs/ontology/academic/demo.graph.v0.1.json',
  'docs/ontology/pedagogy/method-fit.v0.1.json',
  'docs/ontology/search/offline-search.mjs',
  'docs/ontology/companion/offline-context.mjs',
  'docs/ontology/ui/ont02.graph.v0.1.json',
  'docs/ontology/ui/ont02.source-crosswalk.v0.1.json',
  'design-system/tokens.json',
  'design-system/generated/css-token-refs.ts',
  'site/assets/design-tokens.css',
  'site/assets/li-layout.css',
  'site/assets/ui-foundations.css',
  'site/assets/laoly-quote-stage-gate.js',
  'tools/step16-real-l09-react-island/src/ui/Shared.tsx',
  'tools/step16-real-l09-react-island/src/Pilot.tsx',
  'tools/validate_ui_ontology.mjs'
];
for(const relative of files)assert.ok(existsSync(path.join(root,relative)), 'missing source owner: '+relative);
const html=readFileSync(path.join(root,'site/index.html'),'utf8');
assert.ok(html.includes('laoly-quote-stage-gate.js'),'ONT-04 source owner unexpectedly replaced');
const ui=JSON.parse(readFileSync(path.join(root,'docs/ontology/ui/ont02.source-crosswalk.v0.1.json'),'utf8'));
assert.equal(ui.approvalState,'g2_open','unapproved G2 status was promoted');
assert.equal(ui.runtimeStatus,'source_mapping_only','runtime adoption was fabricated');
assert.equal(ui.components.length,5,'source UI family coverage drift');
const tokens=JSON.parse(readFileSync(path.join(root,'design-system/tokens.json'),'utf8'));
assert.equal(Object.keys(tokens.semanticRoles||{}).length,27,'semantic DS role count drift');
assert.equal(Object.keys(tokens.componentRoles||{}).length,21,'component DS role count drift');
const jobs=[
 ['node',['tools/validate_ontology.mjs','--check']],
 ['node',['tools/validate_academic_ontology.mjs','--check']],
 ['node',['tools/validate_pedagogy_ontology.mjs','--check']],
 ['node',['tools/validate_ui_ontology.mjs','--composed-check']],
 ['python3',['tools/generate_design_tokens.py','--check']],
 ['python3',['tools/test_design_semantic_roles.py']]
];
for(const [exe,args] of jobs){
 const r=spawnSync(exe,args,{cwd:root,encoding:'utf8',timeout:120000,env:{...process.env,LI_INTEGRATION_NO_REMOTE:'1'}});
 process.stdout.write('CHECK '+exe+' '+args.join(' ')+'\n'+(r.stdout||''));
 if(r.error||r.status!==0){
   process.stderr.write((r.stderr||'')+'\n'+String(r.error||''));
   throw new Error('integration source check FAILED: '+exe+' '+args.join(' '));
 }
}
console.log(JSON.stringify({
 stage:'ONT-INT-01',
 tree:'ACTUAL_SINGLE_CHECKOUT',
 scope:'semantic-source-only',
 schema:'PASS',
 roles:'27 semantic + 21 component; 5 UI families',
 browser:'NOT_RUN_IN_THIS_SUITE',
 nativeReactRuntime:'PENDING_CONFLICT_RECONCILIATION',
 physicalSafari:'NOT_RUN',
 voiceOver:'OUT_OF_SCOPE_PO_S208',
 googleInviteRls:'NOT_RUN',
 cloudflareRelease:'NOT_AUTHORIZED',
 g2:'OPEN'
}));
