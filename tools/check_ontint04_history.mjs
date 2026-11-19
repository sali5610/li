#!/usr/bin/env node
/* ONT-INT-04 · zero-remote source guard for research-only browser history behavior. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const get=p=>readFileSync(resolve(root,p),'utf8');
const html=get('site/index.html');
const localOnly=html.slice(html.indexOf('function liDualLocalHistoryAllowed(){'),html.indexOf('const LI_DUAL_PILOT_PAGES=',html.indexOf('function liDualLocalHistoryAllowed(){')));
const routes=html.slice(html.indexOf('function syncLiRoute(id){'),html.indexOf('function navigate(',html.indexOf('function syncLiRoute(id){')));
const initial=html.slice(html.indexOf('const liInitialLesson='),html.indexOf('setStudyMode(studyMode,{persist:false})',html.indexOf('const liInitialLesson=')));
const ensure=html.slice(html.indexOf('<script id="li-ont-int02-local-react-gate">'),html.indexOf('</script>',html.indexOf('<script id="li-ont-int02-local-react-gate">')));
for(const [snippet,s]of [
 ['loc.protocol!=="http:"',localOnly],
 ['["localhost","127.0.0.1"].includes(loc.hostname)',localOnly],
 ['loc.pathname!=="/site/index.html"',localOnly],
 ['p.get("li-search-react")==="typed-v1"',localOnly],
 ['["l09","l09-native-fixture"].includes(p.get("li-react"))',localOnly],
 ['const LI_DUAL_PILOT_PAGES=new Set(["home","search","lessonL09"]);',html],
 ['if(pilot&&LI_DUAL_PILOT_PAGES.has(id))',routes],
 ['url.searchParams.set("li-local-page",id)',routes],
 ['window.history.replaceState(state,"",target)',routes],
 ['window.history.pushState(state,"",target)',routes],
 ['else window.history.replaceState(window.history.state,"",target)',routes],
 ['window.addEventListener("popstate",liRestoreDualPilotHistory)',html],
 ['window.addEventListener("pageshow",liRestoreDualPilotHistory)',html],
 ['function liRestoreDualPilotHistory(){',html],
 ['if(document.getElementById("page-"+route)?.classList.contains("active"))return',html],
 ['navigate(route,{remember:false,syncUrl:false})',html],
 ['window.dispatchEvent(new CustomEvent("li:dual-local-route"',html],
 ['liInitialPilotRoute',initial],
 ['window.addEventListener("li:dual-local-route",ensureL09)',ensure],
 ['params.get("li-react")',ensure],
 ['loc.pathname!=="/site/index.html"',ensure],
 ['new URLSearchParams(window.location.search).get("lesson")!=="L09-1-2"',ensure],
 ['let requested=false',ensure],
 ['page.dataset.liRuntime==="react-candidate"',ensure],
 ['loader.dataset.liStep16Loader="true"',ensure],
 ['laoly-quote-stage-gate.js?v=ont04c2a',html],
 ["const flag=new URLSearchParams(loc.search).get('li-search-react')",html]
 ])assert.ok(s.includes(snippet),'missing history guard: '+snippet);
assert.equal(html.split('window.addEventListener("popstate"').length,2,'unexpected duplicate popstate listeners');
assert.equal(html.split('loader.src="./assets/step16-react-router.js?v=ont-int02-local"').length,2,'L09 loader not unique');
assert.ok(routes.indexOf('if(pilot&&LI_DUAL_PILOT_PAGES.has(id))')<
 routes.indexOf('window.history.pushState(state,"",target)'),'pushState must be behind local-only flag');
assert.ok(html.includes('const LI_LESSON_ROUTES={lessonL09:"L09-1-2"'),'original native lesson route table changed');
assert.ok(!html.includes('localStorage.setItem("li-local-page"'),'browser route not persisted to learner storage');
const fixture=get('tools/ontint04-history-browser.html');
for(const needle of ['current().history.back()','current().history.forward()','current().location.reload()',
 'localStorage.getItem(realKey)===realBefore','LI_STEP16_L09_SHELL_PASS'])
 assert.ok(fixture.includes(needle),'missing real browser history test: '+needle);
console.log('PASS ONT-INT-04: strict local-only push/replace history, popstate route recovery, L09 lazy mount and no source-owned learner writes');
