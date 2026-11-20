#!/usr/bin/env node
/* Focused preservation invariant: real Lao Ly React popup must keep every
 * action/content source of the working original. Pure source checks here;
 * existing buddy/quote engine suites exercise runtime behavior separately. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const dialog=read('tools/step16-real-l09-react-island/src/shell/laoly-dialog.tsx');
const shell=read('tools/step16-real-l09-react-island/src/auth/staging-app.tsx');
const plans=read('site/assets/laoly-context-s112.js');
const quotes=read('site/assets/laoly-quotes-s121.js');
const drag=read('site/assets/laoly-drag.js');
const fab=read('tools/step16-real-l09-react-island/src/shell/laoly-fab.tsx');
const page=read('site/index.html');
const researchCase=read('tools/step16-real-l09-react-island/src/shell/research-case.tsx');
const guide=read('tools/step16-real-l09-react-island/src/shell/guide-library.tsx');
const capture=read('tools/step16-real-l09-react-island/src/shell/capture-idea.tsx');
assert.match(shell,/mountLaoLyDialog/);
assert.match(dialog,/createRoot\(root\)/);
assert.match(dialog,/document\.getElementById\('buddy-modal'\)/,
 'Reuse original popup host, no extra/hidden duplicate dialog');
for(const x of [
 'buddy-title','buddy-title-avatar','buddy-text','buddy-scroll','buddy-quote-original',
 'buddy-quote-translation','buddy-quote-info','buddy-quote','buddy-quote-gloss',
 'buddy-quote-meta','buddy-quote-link','buddy-quote-context','buddy-debate'
])assert.ok(dialog.includes(x),'Missing original popup element: '+x);
assert.match(dialog,/view\.editorial\?view\.editorial\.actions\.map\(action=>action\.label\):view\.labels/,
 'All 3 native Lão Lý actions remain available, with exactly 2 per editorial stage');
assert.match(dialog,/liBuddyEngine\?\.choose\(index\)/,
 'React actions must use the real contextual engine, not hardcoded replies');
assert.match(dialog,/aria-expanded=\{expanded\}/,'Source details must disclose interactively');
assert.match(dialog,/setChallenge\(reply\.showChallenge\)/,
 'Original 90% counterexample challenge must remain available');
assert.match(dialog,/onClick=\{\(\)=>submitDebate\(true\)\}/);
assert.match(dialog,/onClick=\{\(\)=>submitDebate\(false\)\}/);
assert.match(dialog,/li-auth-verified/,'Never open without verified invitation');
assert.match(dialog,/setView\(null\)/,'Clear sensitive dialog state after sign-out');
assert.match(dialog,/li:study-mode-applied/,'Avatar follows chosen mode');
assert.match(dialog,/li:localechange/,'Language changes remain observed');
assert.match(page,/id="buddy-modal"[^>]*aria-modal="true"/);
assert.match(plans,/window\.liBuddyEngine=Object\.freeze/,
 'One real contextual plan owner, not a React copy');
assert.match(plans,/localizePlan\(getBuddyPlan\(\)\)/);
assert.match(plans,/item\.perform\(\)/,'Original side effects and navigation persist');
assert.match(plans,/li:buddy-open/);
assert.match(page,/li:buddy-close/);
assert.match(quotes,/window\.liQuoteEngine=\{quotes:QUOTES,environment,matchList,pick,getView,render,lookup\}/,
 'Read-only lesson quote lookup preserves the original quote engine and rotation');
assert.match(quotes,/sessionStorage/,'Quote rotation persists per session');
assert.match(quotes,/QUOTES_EN/,'Bilingual quote metadata persists');
assert.match(drag,/li\.companion\.position\.v1/);
assert.match(drag,/pointermove/);
assert.match(drag,/ArrowLeft/);
assert.match(drag,/suppressAfterDrag/);
// The old draggable FAB remains a safe static fallback. In the real invited
// React app its exact .laoly-support host is replaced with a React button.
assert.match(shell,/mountLaoLyFab/,'Floating avatar must mount in shared React app');
assert.match(fab,/createRoot\(host\)/,'React must own entire floating avatar host');
assert.match(fab,/id="laoly-fab"/,'Keep original navigation/accessible target');
assert.match(fab,/id="laoly-current-icon"/,'Keep study-mode artwork identity');
assert.match(fab,/laoly-face smallface/,'Keep approved visual asset geometry');
assert.match(fab,/li\.companion\.position\.v1/,'No incompatible saved position key');
assert.match(fab,/liCompanionDrag=port/,'Replace native position port with one React owner');
assert.match(fab,/app\.openLaoLy\?\.\(event\.currentTarget\)/,
 'Avatar opens original contextual Lao Ly engine, not a hidden-button click');
assert.match(fab,/Math\.hypot\(dx,dy\)<7/,
 'Preserve 7px tap-vs-drag threshold');
assert.match(fab,/suppressAfterDrag\.current=true/,
 'A drag must suppress the synthetic click');
assert.match(fab,/event\.preventDefault\(\);event\.stopPropagation\(\);return;/);
assert.match(fab,/event\.shiftKey\?32:16/,'Keyboard fine/coarse moves');
assert.match(fab,/saved\.current=null/,'Escape reset must remove remembered position');
assert.match(fab,/localStorage\.removeItem\(STORAGE_KEY\)/,'Reset clears old key');
assert.match(fab,/orientationchange/,'Rotation repositions avatar');
assert.match(fab,/occludesPriorityUI/,'Preserve lesson/catalog action occlusion avoidance');
assert.match(fab,/li-auth-verified/,'Unauthorized sessions cannot open the avatar');
assert.match(fab,/onPointerDown=\{onPointerDown\}/,'React owns actual drag events');
assert.match(fab,/onPointerUp=\{finish\}/,'React owns drag-end persistence');
// Context actions for visible React screens must never assume hidden native
// Case answers, draft, method search/filter, captured idea or bookmark button.
assert.match(plans,/window\.liCaseUi\?\.getState\?\.\(\)/);
assert.match(plans,/window\.liCaseUi\?\.submit\?\.\(\)/);
assert.match(plans,/window\.liGuideUi\?\.getState\?\.\(\)/);
assert.match(plans,/window\.liCaptureUi\?\.getDraft\?\.\(\)/);
assert.match(plans,/window\.liInquiryFlow\.getResearch\(\)\?\.feedback/);
assert.match(plans,/window\.liInquiryFlow\?\.toggleQuestion\?\.\(\)/);
assert.match(plans,/window\.LiSpellPractice\?\.getView\?\.\(\)\?\.active/);
assert.match(plans,/window\.liPersonalDiary\?\.getView\?\.\(\)/);
assert.match(plans,/go\("lessonL09"\)/);
assert.match(researchCase,/window\.liCaseUi=port/);
assert.match(researchCase,/if\(!permitted\)\{setChoice\(null\);setMessage\(''\);\}/);
assert.match(guide,/window\.liGuideUi=port/);
assert.match(capture,/window\.liCaptureUi=port/);

console.log('PASS Lao Ly React full popup parity: 3 actions, 2 debate results, quotes, provenance, preferences, invite, drag, navigation');
