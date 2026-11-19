#!/usr/bin/env node
/* ONT-INT-02 single-tree entrypoint guard. Zero external requests or learner writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('site/index.html'),l09=read('site/assets/lesson-l09-hifi.js');
const library=read('site/assets/library-hub.js'),router=read('site/assets/step16-react-router.js');
const req=(s,terms,label)=>terms.forEach(term=>assert.ok(s.includes(term),label+': missing '+term));
const occurrence=(s,part)=>s.split(part).length-1;
req(html,['function liModalTabStops(modal)','liModalPreviousInert','liModalSetBackgroundInert(true)',
  'liModalSetBackgroundInert(false)','[hidden],[inert]','[tabindex]','opener.focus({preventScroll:true})',
  'liModalTabStops(m)','e.shiftKey','openModal("buddy-modal",trigger)',
  'openModal("checkin-modal",event.currentTarget)'],'shared modal');
assert.equal(occurrence(html,'function openModal(id,trigger)'),1,'single modal owner');
assert.equal(occurrence(html,'function closeModal(id)'),1,'single modal closer');
assert.ok(!html.includes('m.querySelectorAll("button,input")'),'stale two-field Tab trap');
req(html,['laoly-quote-stage-gate.js?v=ont04c2a','laoly-quotes-s121.js',
  'lesson-companion-native.js','li-search-react','typed-v1','li-ont-int02-local-react-gate',
  'loc.pathname!=="/site/index.html"','new URLSearchParams(window.location.search).get("lesson")!=="L09-1-2"',
  'loader.src="./assets/step16-react-router.js?v=ont-int02-local"',
  'window.addEventListener("li:dual-local-route",ensureL09)',
  'liDualLocalHistoryAllowed()'],'ONT quote/search + local gate');
assert.equal(occurrence(html,'laoly-quote-stage-gate.js'),1,'quote runtime duplicate');
assert.equal(occurrence(html,'data-li-ont04b2-local-only'),1,'native search module script duplicated');
assert.equal(occurrence(html,"const flag=new URLSearchParams(loc.search).get('li-search-react')"),1,'native search module owner duplicated');
assert.equal(occurrence(html,'step16-react-router.js'),1,'react local loader duplicated');
assert.ok(html.lastIndexOf('laoly-quote-stage-gate.js')<html.lastIndexOf('step16-react-router.js'),
 'lesson companion must precede optional React loader');
req(l09,['LI_LOCAL_FIXTURE','LI_LOCATION.pathname==="/site/index.html"',
 'step16.l09.shared-native-fixture.v1','li.review.L09-1-2.v1',
 'root.dataset.liRuntime==="react-candidate"','k!=="guidedDraft"&&k!=="locale"',
 'persist({guidedDraft:state.guidedDraft})'],'L09 local synthetic-only native handover');
req(library,['["l09","l09-native-fixture"].includes(','place.pathname==="/site/index.html"'],
 'no genuine L09 lesson visit for local experiment');
req(router,['window.location.protocol===\'http:\'',
 'window.location.hostname===\'127.0.0.1\'','li-react',
 'step16.l09.shared-native-fixture.v1','candidate.mountL09(host)',
 'challenge.hidden=true;challenge.inert=true','rubric.hidden=true;rubric.inert=true',
 'page.dataset.liRuntime=\'native-fallback\''],'React loader fail-closed');
assert.ok(!html.includes('step16-l09-island.js"'),'compiled bundle must never ship as eager script');
console.log('PASS ONT-INT-02 source contract: shared Dialog, ONT Search/Quote, local React opt-in, synthetic L09 data isolation and native fallback; NOT physical Safari or deployed runtime');
