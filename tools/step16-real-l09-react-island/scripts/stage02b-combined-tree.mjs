#!/usr/bin/env node
/**
 * UX-DS-35 Stage02B: disposable COMPLETE three-ref Git tree in Github CI.
 * Merge commits and worktree are local objects ONLY: no branch ref, push or deploy.
 * Never accepts credentials, learner state, production flags or database writes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const ds='d22f469a52d13baa73c0c8952b198fdfeb2b2891';
const ont='0fe2d9b92a66e64ea3244d910d789ccc0d458a5b';
const oldReact='734dc257be47f778a929acba5cdca570979e247d';
const originalBase='feefc50a55139f78b1685a11acbcaf0e6102f961';
const evidence='/tmp/li-uxds35-stage02b';
assert.equal(process.env.CI,'true','Disposable GitHub CI environment required');
assert.equal(process.env.GITHUB_EVENT_NAME,'pull_request','No manual or production workflow invocation');
function git(args,env={}){
 const x=spawnSync('git',args,{cwd:repo,encoding:'utf8',maxBuffer:3e6,env:{...process.env,...env}});
 assert.equal(x.status,0,'git '+args[0]+' error: '+(x.stderr||x.stdout).slice(0,1900));
 return x.stdout.trim();
}
const actual=git(['rev-parse','HEAD']);
assert.equal(actual,process.env.LI_STAGE02B_HEAD,'Only exact PR head, not GitHub synthesized merge');
assert.equal(git(['rev-parse','--is-shallow-repository']),'false','Full ancestry required');
assert.equal(git(['-C','uxds35-design-pin','rev-parse','HEAD']),ds);
assert.equal(git(['-C','uxds35-ont-pin','rev-parse','HEAD']),ont);

const identity={GIT_AUTHOR_NAME:'li-ci-only',GIT_AUTHOR_EMAIL:'ci@example.invalid',
 GIT_COMMITTER_NAME:'li-ci-only',GIT_COMMITTER_EMAIL:'ci@example.invalid'};
function syntheticMerge(left,right,label){
 const x=spawnSync('git',['merge-tree','--write-tree',left,right],
   {cwd:repo,encoding:'utf8',maxBuffer:3e6});
 assert.equal(x.status,0,'Git tree conflict at '+label+': '+(x.stdout||x.stderr).slice(0,2100));
 const tree=x.stdout.trim().split(/\s+/)[0];
 assert.match(tree,/^[a-f0-9]{40}$/,'Missing merge tree hash at '+label);
 const commit=git(['commit-tree',tree,'-p',left,'-p',right],identity);
 assert.match(commit,/^[a-f0-9]{40}$/);
 return {commit,tree,left,right};
}
const first=syntheticMerge(actual,ds,'React + Design System');
const second=syntheticMerge(first.commit,ont,'React + Design System + ONT-02');
const combined=fs.mkdtempSync(path.join(os.tmpdir(),'li-uxds35-stage02b-combined-'));
git(['worktree','add','--detach',combined,second.commit]);
assert.equal(git(['-C',combined,'rev-parse','HEAD']),second.commit);

function blob(ref,name){return git(['rev-parse',ref+':'+name])}
const proof=[
 [actual,'tools/step16-real-l09-react-island/src/ui/Shared.tsx'],
 [actual,'tools/step16-real-l09-react-island/src/ui/shared.css'],
 [ds,'design-system/tokens.json'],
 [ds,'site/assets/design-tokens.css'],
 [ds,'site/assets/li-layout.css'],
 [ont,'docs/ontology/ui/ont02.graph.v0.1.json'],
 [ont,'docs/ontology/ui/ont02.source-crosswalk.v0.1.json'],
 [ont,'tools/validate_ui_ontology.mjs']
].map(([ref,file])=>{
 const original=blob(ref,file),result=blob(second.commit,file);
 assert.equal(result,original,'combined tree lost or rewrote pinned owner '+file);
 return {owner:ref,file,blob:original};
});
const touched=git(['diff','--name-only',actual,second.commit]).split('\n').filter(Boolean);
const prohibited=touched.filter(f=>/^(db\/|tools\/step16-real-l09-react-island\/src\/(auth|sync)\/|site\/assets\/step16-react-router\.js$)/.test(f));
assert.deepEqual(prohibited,[],'Combined tree unintentionally alters Auth, Neon, RLS or React router');
const mergeability=syntheticMerge(originalBase,oldReact,'PR #126 old base vs head');
const m={
 purpose:'CI-only THREE FULL SOURCE TREES, detached ephemeral Git worktree',
 reactHead:actual,dsHead:ds,ontologyHead:ont,
 syntheticFirst:first,syntheticSecond:second,
 combinedPath:combined,combinedHead:second.commit,
 approvedForMerge:false,mainUnchanged:true,g2:'OPEN',
 pinnedFileProof:proof,changedVsReact:touched,prohibitedSourceDiff:prohibited,
 pr126:{originalBase,head:oldReact,gitTreeMerge:'CLEAN',synthetic:mergeability.commit,
   githubMergeability:'reported dirty (independent GitHub API) — inconsistency, no forced merge'},
 physicalSafari:'UNVERIFIED'
};
fs.mkdirSync(evidence,{recursive:true});
fs.writeFileSync(path.join(evidence,'combined-worktree-ledger.json'),JSON.stringify(m,null,2)+'\n');
assert.ok(process.env.GITHUB_ENV,'GitHub step environment not provided');
fs.appendFileSync(process.env.GITHUB_ENV,'LI_STAGE02B_COMBINED='+combined+'\n');
console.log('PASS STAGE02B_FULL_THREE_REF_GIT_WORKTREE '+JSON.stringify({
 reactHead:actual,combinedHead:second.commit,pinnedFiles:proof.length,
 changedVsReact:touched.length,protectedDiff:prohibited.length,
 pr126GitBaseTree:'CLEAN',g2:'OPEN',branchMerge:'NONE',deploy:'NONE'}));
