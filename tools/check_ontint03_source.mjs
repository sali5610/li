#!/usr/bin/env node
/* ONT-INT-03 · Local-only dual React island source contract; no network writes. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=p=>readFileSync(join(root,p),'utf8');
const html=read('site/index.html'),reactRouter=read('site/assets/step16-react-router.js');
const searchBridge=read('tools/ont04b-react-search-island/src/site-entry.tsx');
const searchBuild=read('tools/ont04b-react-search-island/vite.site.config.mjs');
const l09Build=read('tools/step16-real-l09-react-island/vite.site.config.mjs');
const l09Native=read('site/assets/lesson-l09-hifi.js');
const found=(s,term)=>assert.ok(s.includes(term),'missing contract: '+term);
const count=(s,term)=>s.split(term).length-1;
for(const term of ['li-search-react','flag===\'typed-v1\'',
 'loc.protocol===\'http:\'','loc.pathname===\'/site/index.html\'',
 'mountTypedSearch(host)','SEARCH_LOCAL_CSS_MISSING','li-typed-search-root',
 'li-ont-int02-local-react-gate','params.get("lesson")!=="L09-1-2"',
 '["l09","l09-native-fixture"].includes(params.get("li-react"))',
 'loader.src="./assets/step16-react-router.js?v=ont-int02-local"',
 'laoly-quote-stage-gate.js','liModalSetBackgroundInert(true)'])found(html,term);
assert.equal(count(html,'data-li-ont04b2-local-only'),1,'single native Search owner');
assert.equal(count(html,'li-ont-int02-local-react-gate'),1,'single L09 React gate');
assert.equal(count(html,'laoly-quote-stage-gate.js'),1,'single quote engine entry');
found(searchBridge,'SEARCH_CANDIDATE_ORIGIN_DENIED');
found(searchBridge,'isLocalSearchCandidate(loc)');
found(searchBridge,'host.dataset.liSearchMount');
found(searchBridge,'window.addEventListener(\'pagehide\',unmount');
found(searchBridge,'for(const prev of originals)prev.node.hidden=prev.hidden');
found(reactRouter,"page.dataset.liRuntime='native-fallback'");
found(reactRouter,"challenge.hidden=true;challenge.inert=true");
found(reactRouter,"rubric.hidden=true;rubric.inert=true");
found(reactRouter,"const fixtureKey='step16.l09.shared-native-fixture.v1'");
found(l09Native,'LI_LOCAL_FIXTURE');
found(l09Native,'k!=="guidedDraft"&&k!=="locale"');
for(const [config,output] of [[searchBuild,'ont04b-search-site-island.js'],[l09Build,'step16-l09-island.js']]){
 found(config,"outDir:'../../site/assets'");
 found(config,output);
}
for(const output of ['site/assets/ont04b-search-site-island.js','site/assets/step16-l09-island.js']){
 // Both are ephemeral local-build outputs, not checked in as source on this branch.
 if(existsSync(join(root,output)))console.log('local-only build output present:',output);
}
const test=read('tools/ontint03-browser-fixture.html');
found(test,'li-react=l09-native-fixture&li-search-react=typed-v1');
found(test,"mode:fallback?'FALLBACK':'DUAL'");
found(test,'localStorage.getItem(nativeKey)===originalNative');
console.log('PASS ONT-INT-03 source audit: two isolated, OFF-by-default local flags; exact search/lesson owners; shared quote and data guard; no published route or real learner writes');
