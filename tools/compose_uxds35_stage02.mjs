#!/usr/bin/env node
/**
 * UX-DS-35 Stage02: CI-only composed source fixture.
 * NEVER merges commits, pushes code, changes data, publishes apps or uses Git network.
 * The outer Actions workflow checks out immutable, explicit repo SHAs first.
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,copyFileSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dsHead='d22f469a52d13baa73c0c8952b198fdfeb2b2891';
const reactHead='734dc257be47f778a929acba5cdca570979e247d';
const pins=[['uxds35-design-pin',dsHead],['uxds35-react-pin',reactHead]];
const files=[
 'design-system/tokens.json',
 'site/assets/design-tokens.css',
 'site/assets/li-layout.css',
 'site/assets/ui-foundations.css',
 'tools/generate_design_tokens.py',
 'tools/generate_design_token_types.mjs',
 'tools/test_design_semantic_roles.py',
 'design-system/generated/css-token-refs.ts'
];
function pinCheck(){
 for(const [dir,expected] of pins){
  const p=join(root,dir);
  assert.ok(existsSync(join(p,'.git')),'pinned read-only checkout missing: '+dir);
  const actual=execFileSync('git',['-C',p,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assert.equal(actual,expected,'immutable source pin changed: '+dir);
 }
 const meta=JSON.parse(readFileSync(join(root,'docs/ontology/ui/ont02.source-crosswalk.v0.1.json'),'utf8'));
 assert.equal(meta.sourcePins.uxDs35Draft,dsHead,'ONT-02 source pin must match composed DS ref');
 assert.equal(meta.crossBranchIntegration,'PENDING_SAME_TREE_REVIEW','no false merged status');
}
if(process.argv.includes('--compose')){
 pinCheck();
 const src=join(root,pins[0][0]);
 for(const relative of files){
  const from=join(src,relative),to=join(root,relative);
  assert.ok(existsSync(from),'missing DS source for allowlist: '+relative);
  mkdirSync(dirname(to),{recursive:true});
  copyFileSync(from,to);
 }
 process.stdout.write('PASS source fixture: overlay exactly '+files.length+' immutable DS files onto ONT-02 CI checkout; React pinned separately. No Git merge/commit/deploy.\n');
}else if(process.argv.includes('--check-pins')){
 pinCheck();
 process.stdout.write('PASS immutable SHA pins: DS '+dsHead+'; React '+reactHead+'. ONT-02 PR remains DRAFT.\n');
}else{
 throw new Error('Usage: node tools/compose_uxds35_stage02.mjs [--check-pins|--compose]');
}
