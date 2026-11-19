#!/usr/bin/env node
/**
 * UX-DS-35 Stage02B: PR-only exact-source reconciliation.
 * Nothing is merged, pushed, deployed or written to user data by this script.
 * The only source overlay is DS-generated CSS inside a disposable CI checkout.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const ds='d22f469a52d13baa73c0c8952b198fdfeb2b2891';
const ont='0fe2d9b92a66e64ea3244d910d789ccc0d458a5b';
const initialReact='734dc257be47f778a929acba5cdca570979e247d';
const pinPaths={ds:path.join(repo,'uxds35-design-pin'),ont:path.join(repo,'uxds35-ont-pin')};
const git=(args,at=repo)=>execFileSync('git',args,{cwd:at,encoding:'utf8'}).trim();
assert.equal(process.env.CI,'true','This composition may only run in a disposable CI checkout');
const actual=git(['rev-parse','HEAD']);
assert.equal(actual,process.env.LI_STAGE02B_HEAD,'Must check out exact PR head, not an ephemeral GitHub merge ref');
assert.equal(git(['rev-parse','HEAD'],pinPaths.ds),ds,'DS source SHA drift');
assert.equal(git(['rev-parse','HEAD'],pinPaths.ont),ont,'ONT-02 source SHA drift');
const read=(dir,rel)=>fs.readFileSync(path.join(dir,rel),'utf8');
const meta=JSON.parse(read(pinPaths.ont,'docs/ontology/ui/ont02.source-crosswalk.v0.1.json'));
const tokens=JSON.parse(read(pinPaths.ds,'design-system/tokens.json'));
const dsCss=read(pinPaths.ds,'site/assets/design-tokens.css');
const reactCss=read(repo,'tools/step16-real-l09-react-island/src/ui/shared.css');
const pilotCss=read(repo,'tools/step16-real-l09-react-island/src/pilot.css');
const shared=read(repo,'tools/step16-real-l09-react-island/src/ui/Shared.tsx');
const pilot=read(repo,'tools/step16-real-l09-react-island/src/Pilot.tsx');
assert.equal(meta.sourcePins.ont01,'6b486a3a70be356a5dc21a2bb44117c457833caf');
assert.equal(meta.sourcePins.uxDs35Draft,ds);
assert.equal(meta.sourcePins.reactPrimitivesDraft,initialReact,'Original ONT graph pin unexpectedly rewritten');
assert.equal(meta.crossBranchIntegration,'PENDING_SAME_TREE_REVIEW');
assert.equal(meta.runtimeStatus,'source_mapping_only');
assert.deepEqual(meta.unmappedProposals,['component:ActionGroup']);
let mapped=0;
for(const component of meta.components){
 for(const role of component.roles){
  assert.equal(tokens.semanticRoles[role.semanticRole],role.referenceToken,'semantic source drift: '+role.role);
  assert.equal(tokens.componentRoles[role.componentRole],role.semanticCssVar,'component source drift: '+role.role);
  assert.ok(dsCss.includes(role.componentCssVar+': var('+role.semanticCssVar+')'),
    'generated component CSS role missing: '+role.componentCssVar);
  mapped++;
 }
}
assert.equal(mapped,19,'ONT native role count unexpectedly changed');
const refs=[...new Set([...reactCss.matchAll(/var\((--li-comp-[a-z0-9-]+)/g),...pilotCss.matchAll(/var\((--li-comp-[a-z0-9-]+)/g)].map(x=>x[1]))].sort();
assert.ok(refs.length>=10,'React component CSS role references unexpectedly sparse');
for(const name of refs)assert.ok(dsCss.includes(name+': var('),'React token reference absent from canonical DS generated CSS: '+name);
for(const name of ['Button','IconButton','TextInput','TextAreaField','Card','ActionGroup','Navigation','Feedback','Dialog'])
 assert.ok(shared.includes('export function '+name+'('),'React typed source family missing '+name);
assert.equal((pilot.match(/<ActionGroup className="pilot-actions">/g)||[]).length,2,'L09 pilot ActionGroup adoption drift');
assert.equal((pilot.match(/<\/ActionGroup>/g)||[]).length,2,'L09 ActionGroup unbalanced');
assert.ok(!/#[0-9a-f]{6}\b/i.test(reactCss),'React shared CSS duplicates raw palette values');
const cssPath=path.join(repo,'site/assets/design-tokens.css');
fs.copyFileSync(path.join(pinPaths.ds,'site/assets/design-tokens.css'),cssPath);
assert.equal(fs.readFileSync(cssPath,'utf8'),dsCss,'Failed to mount exact pinned DS tokens in CI');
const out='/tmp/li-uxds35-stage02b';
fs.mkdirSync(out,{recursive:true});

function mergeTree(a,b){
 const command=spawnSync('git',['merge-tree','--write-tree','--messages','--name-only',a,b],
   {cwd:repo,encoding:'utf8',maxBuffer:2*1024*1024});
 const status=command.status===0?'CLEAN':command.status===1?'CONFLICT':'UNVERIFIED';
 return {status,exitCode:command.status,output:(command.stdout||'').slice(0,40000),
   error:(command.stderr||'').slice(0,4000)};
}
// Diagnostic only: exact Git three-way trees. No merge operation against a branch.
const pairDs=mergeTree(actual,ds);
const pairOnt=mergeTree(actual,ont);
let triple={status:'UNVERIFIED',reason:'first pair did not resolve cleanly'};
if(pairDs.status==='CLEAN'){
 const tree=pairDs.output.trim().split(/\s+/)[0];
 if(/^[a-f0-9]{40}$/.test(tree)){
  const env={...process.env,GIT_AUTHOR_NAME:'li-ci-only',GIT_AUTHOR_EMAIL:'ci@example.invalid',
    GIT_COMMITTER_NAME:'li-ci-only',GIT_COMMITTER_EMAIL:'ci@example.invalid'};
  const c=spawnSync('git',['commit-tree',tree,'-p',actual,'-p',ds],
    {cwd:repo,encoding:'utf8',input:'TEMP STAGE02B GIT OBJECT; NOT A BRANCH MERGE\n',env});
  if(c.status===0)triple=mergeTree(c.stdout.trim(),ont);
  else triple={status:'UNVERIFIED',reason:'ephemeral commit-tree diagnostic failed',error:c.stderr?.slice(0,500)};
 }
}
const evidence={
 label:'UX-DS-35 Stage02B RESEARCH/CI ONLY; source provenance, not production integration',
 sourcePins:{react:actual,designSystem:ds,ontology:ont,originalOntReact:initialReact},
 checks:{nativeSourceRoleMappings:mapped,reactComponentAliasRefs:refs.length,reactTokens:refs,
  typedSharedApis:9,l09ActionGroups:2,generatedCssMountedInTemporaryCi:true},
 nativeOntologyState:'source_mapping_only',reactUiState:'DRAFT_MOUNTED_FIXTURE_EXCEPT_L09_ACTION_GROUP',
 coverage:{Button:'fixture + existing L09 ActionButton (distinct APIs)',
  Surface:'existing L09 Surface + Card fixture',FilterChip:'native only',
  TextInput:'React fixture; actual L09 textarea not migrated',
  StatusBanner:'native CSS only; Feedback/StatusMessage NOT claimed equivalent',
  ActionGroup:'real research L09 island only',
  Navigation:'React fixture only; not mapped into native ONT-02 graph',
  Dialog:'React fixture only; native own modal helper retained'},
 gitMergeDiagnostic:{reactPlusDS:pairDs,reactPlusONT:pairOnt,reactPlusDSPlusONT:triple},
 acceptedAsFullSameTreeIntegration:false,physicalSafari:'UNVERIFIED',humanG2:'OPEN'
};
fs.writeFileSync(path.join(out,'source-bridge-and-merge-ledger.json'),JSON.stringify(evidence,null,2)+'\n');
console.log('PASS STAGE02B_PINNED_SOURCE_BRIDGE '+JSON.stringify({
 react:actual,aliases:mapped,reactRefs:refs.length,gitPairDS:pairDs.status,
 gitPairONT:pairOnt.status,gitTriple:triple.status,
 sameTree:'NOT_APPROVED',g2:'OPEN'}));
