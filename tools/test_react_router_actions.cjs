#!/usr/bin/env node
/* Scope: React navigation must use real canonical actions, not hidden UI clicks.
 * Existing test_navigation.js tests actual router history, URL and invite gate. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const old=read('site/index.html');
const port=read('tools/step16-real-l09-react-island/src/shell/app-router.ts');
const controls=read('design-system/react/AppNavigation.tsx');
const nav=read('tools/step16-real-l09-react-island/src/shell/mount-navigation.tsx');
const lesson=read('tools/step16-real-l09-react-island/src/learning/staging-ports.ts');
const search=read('tools/step16-real-l09-react-island/src/shell/knowledge-search.tsx');
assert.match(old,/window\.liAppRouter=Object\.freeze/);
assert.match(old,/navigate\(id,options\);return true/);
assert.match(old,/goBack\(\);return true/);
assert.match(old,/li-auth-verified/);
assert.match(old,/li-account-open/);
assert.match(port,/window\.liAppRouter\?\.navigate\(id\)/);
assert.match(port,/window\.liAppRouter\?\.back\(\)/);
assert.match(controls,/onNavigate\?:\(id:string\)=>void/);
assert.match(controls,/data-page=\{onNavigate\?undefined:item\.id\}/);
assert.match(controls,/onClick=\{onNavigate\?\(\)=>onNavigate\(item\.id\):undefined\}/);
assert.match(nav,/onNavigate=\{openRoute\}/);
assert.match(nav,/backRoot\.render/);
assert.match(nav,/onClick=\{goBack\}/);
assert.doesNotMatch(nav,/data-nav-back/);
assert.doesNotMatch(lesson,/button\[data-page=/);
assert.doesNotMatch(lesson,/getElementById\(['"]global-search['"]\)/,
 'A published lesson must not set the hidden legacy query field');
assert.match(lesson,/search\.liSearch\?\.render\(query\)/);
assert.match(search,/app\.openLaoLy\?\.\(\)/);
assert.doesNotMatch(search,/getElementById\('laoly-fab'\)\?\.click\(\)/);
for(const name of ['home-catalog','guide-library','research-case','journal-settings','knowledge-search','detail-practice']){
 const file=read('tools/step16-real-l09-react-island/src/shell/'+name+'.tsx');
 assert.doesNotMatch(file,/<Button[^>]*\bdata-page=/,
  name+' has delegated navigation on a React control');
}
const details=read('tools/step16-real-l09-react-island/src/shell/detail-practice.tsx');
const settings=read('tools/step16-real-l09-react-island/src/shell/journal-settings.tsx');
assert.match(details,/onClick=\{\(\)=>openRoute\(back\)\}/);
assert.match(details,/onClick=\{\(\)=>openRoute\('case'\)\}/);
assert.match(details,/onClick=\{\(\)=>openRoute\('guide'\)\}/);
assert.match(settings,/onClick=\{goBack\}/);
assert.doesNotMatch(settings,/act\('back'\)/);
assert.match(old,/if\(kind===\"mode\"&&STUDY_MODES\[key\]\)setStudyMode\(key\)/);
assert.doesNotMatch(old,/STUDY_MODES\[key\]\).*?\.click\(\)/);
// The React nickname editor must call the same storage owner as the native
// fallback, not fire synthetic events into hidden textboxes.
assert.match(old,/function liSetBuddyName\(key,value,persist=false\)/);
assert.match(old,/liBuddyNames\[key\]=liNormalizeBuddyName\(value\)/);
assert.match(old,/previews:liBuddyNamePreviews\(\)/);
assert.match(old,/nicknameFeedback:liAddressFeedback/);
assert.match(old,/liSetBuddyName\(key,value,kind==="nicknameCommit"\)/);
assert.match(old,/else if\(kind==="resetNames"\)liResetBuddyNames\(\)/);
assert.doesNotMatch(old,/field\.dispatchEvent\(new Event\(kind==="nicknameInput"/);
assert.doesNotMatch(old,/el\("buddy-names-reset"\)\?\.click\(\)/);
assert.match(settings,/normalizeDraft\(draft\)!==value/);
// Calm / Mute must be direct session actions, not clicks on hidden native inputs.
const buddy=read('site/assets/laoly-context-s112.js');
assert.match(old,/const liBuddyVoice=\{/);
assert.match(old,/window\.liBuddyVoice=Object\.freeze\(\{get:/);
assert.match(old,/liSetBuddyVoice\(kind,value\);return;/);
assert.match(old,/calm:liBuddyVoice\.calm,mute:liBuddyVoice\.mute/);
assert.match(old,/field\?\.addEventListener\("change",\(\)=>liSetBuddyVoice\(kind,field\.checked\)\)/);
assert.doesNotMatch(old,/field&&field\.checked!==Boolean\(value\)\)field\.click\(\)/);
assert.match(buddy,/const calm=buddyVoice\("calm"\)/);
assert.match(buddy,/if\(buddyVoice\("mute"\)\)/);
assert.match(buddy,/document\.getElementById\(kind==="calm"/); // native fallback only

console.log('PASS explicit React routes and Back: direct actions, canonical history and search, no hidden click');
