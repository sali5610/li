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
const page=read('site/index.html');
assert.match(shell,/mountLaoLyDialog/);
assert.match(dialog,/createRoot\(root\)/);
assert.match(dialog,/document\.getElementById\('buddy-modal'\)/,
 'Reuse original popup host, no extra/hidden duplicate dialog');
for(const x of [
 'buddy-title','buddy-title-avatar','buddy-text','buddy-scroll','buddy-quote-original',
 'buddy-quote-translation','buddy-quote-info','buddy-quote','buddy-quote-gloss',
 'buddy-quote-meta','buddy-quote-link','buddy-quote-context','buddy-debate'
])assert.ok(dialog.includes(x),'Missing original popup element: '+x);
assert.match(dialog,/view\.labels\.map/,'All 3 contextual actions must be shown');
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
assert.match(dialog,/aria-modal/);
assert.match(plans,/window\.liBuddyEngine=Object\.freeze/,
 'One real contextual plan owner, not a React copy');
assert.match(plans,/localizePlan\(getBuddyPlan\(\)\)/);
assert.match(plans,/item\.perform\(\)/,'Original side effects and navigation persist');
assert.match(plans,/li:buddy-open/);
assert.match(page,/li:buddy-close/);
assert.match(quotes,/window\.liQuoteEngine=\{quotes:QUOTES,environment,matchList,pick,getView,render\}/);
assert.match(quotes,/sessionStorage/,'Quote rotation persists per session');
assert.match(quotes,/QUOTES_EN/,'Bilingual quote metadata persists');
assert.match(drag,/li\.companion\.position\.v1/);
assert.match(drag,/pointermove/);
assert.match(drag,/ArrowLeft/);
assert.match(drag,/suppressAfterDrag/);
console.log('PASS Lao Ly React full popup parity: 3 actions, 2 debate results, quotes, provenance, preferences, invite, drag, navigation');
