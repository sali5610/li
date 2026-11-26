#!/usr/bin/env node
/* Focused preservation invariant: real Lao Ly React popup must keep every
 * action/content source of the working original. Pure source checks here;
 * existing buddy/quote engine suites exercise runtime behavior separately. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const dialog=read('tools/step16-real-l09-react-island/src/shell/laoly-dialog.tsx');
const chatBubble=read('design-system/react/LegacyCards.tsx');
const chatStyle=read('design-system/react/legacy.css');
const shell=read('tools/step16-real-l09-react-island/src/auth/staging-app.tsx');
const plans=read('site/assets/laoly-context-s112.js');
const quotes=read('site/assets/laoly-quotes-s121.js');
const drag=read('site/assets/laoly-drag.js');
const fab=read('tools/step16-real-l09-react-island/src/shell/laoly-fab.tsx');
const page=read('site/index.html');
const researchCase=read('tools/step16-real-l09-react-island/src/shell/research-case.tsx');
const guide=read('tools/step16-real-l09-react-island/src/shell/guide-library.tsx');
const capture=read('tools/step16-real-l09-react-island/src/shell/capture-idea.tsx');
assert.match(chatBubble,/data-tail=\{tail\}/,
 'Shared library ChatBubble must expose a tail direction');
assert.match(chatStyle,/clip-path:polygon\(100% 0,0 50%,100% 100%\)/,
 'Bubble tail must have a real protruding triangular silhouette');
assert.match(shell,/mountLaoLyDialog/);
assert.match(dialog,/createRoot\(root\)/);
assert.match(dialog,/document\.getElementById\('buddy-modal'\)/,
 'Reuse original popup host, no extra/hidden duplicate dialog');
for(const x of [
 'buddy-title','buddy-title-avatar','buddy-text','buddy-scroll','buddy-quote-original',
 'buddy-quote-translation','li-buddy-quote-thought','buddy-quote','buddy-quote-gloss',
 'buddy-quote-meta','buddy-quote-link','buddy-quote-context','buddy-debate'
])assert.ok(dialog.includes(x),'Missing original popup element: '+x);
assert.match(dialog,/view\.editorial\?view\.editorial\.actions\.map\(action=>action\.label\):view\.labels/,
 'All 3 native Lão Lý actions remain available, with exactly 2 per editorial stage');
assert.match(dialog,/liBuddyEngine\?\.choose\(index\)/,
 'React actions must use the real contextual engine, not hardcoded replies');
assert.match(dialog,/<ChatBubble surface="paper" tail="left" className="li-buddy-quote-thought">/,
 'Lão Lý quote must use the shared Design System chat frame with a real hook');
assert.match(dialog,/<details key=\{quote\.id\}>/,
 'The original quotation remains inside a native collapsed accordion');
assert.doesNotMatch(dialog,/Cùng học, cùng phản biện|Learn and question together/,
 'Remove the redundant Lão Lý subtitle');
assert.match(dialog,/className="li-buddy-sr-title"/,
 'Lão Lý remains a screen-reader name but must not display as modal title');
assert.match(read('tools/step16-real-l09-react-island/src/shell/laoly-dialog.css'),
 /#buddy-modal #buddy-title\.li-buddy-sr-title\{/,
 'Hide the heading visually without losing VoiceOver dialog label');

assert.match(dialog,/<summary aria-label=\{chooseLanguage/,
 'Thought bubble must be keyboard accessible');
assert.ok(dialog.indexOf('li-buddy-quote-thought')<dialog.indexOf('id="buddy-scroll"'),
 'Original quote belongs beside portrait, before the scroll conversation');
assert.doesNotMatch(dialog,/setExpanded\(/,'Quote disclosure belongs to one native accordion');
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
assert.match(fab,/getAvatar:\(\)=>avatarSource\.current/,
 'React avatar exposes its live asset through the existing companion port');
assert.match(plans,/window\.liCompanionDrag\?\.getAvatar\?\.\(\)/,
 'React mentor view reads avatar state, not a hidden native image');
assert.match(dialog,/app\.liCompanionDrag\?\.getAvatar\?\.\(\)/,
 'Visible mentor dialog reacts to the live React avatar');
assert.doesNotMatch(dialog,/getElementById\('laoly-current-icon'\)/,
 'Do not query the rendered React image to update the dialog');
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
const copyPrompt=read('tools/step16-real-l09-react-island/src/learning/CopyAnalysisPrompt.tsx');
assert.match(researchCase,/const analysis=completed\?\?\(choice&&revision\.trim\(\)\.length>=12/,
 'Case review action must unlock from completed draft, not require a Notebook save');
assert.match(researchCase,/<CopyAnalysisPrompt locale=\{locale\} step="case" disabled=\{!analysis\}/,
 'Visible Case button stays on screen with a clear disabled state until ready');
assert.match(researchCase,/data-li-case-analysis-state=\{completed\?'saved':analysis\?'ready':'incomplete'\}/,
 'Case button must remain visible after a successful save clears the form');
assert.match(researchCase,/setCompleted\(\{choice,conclusion:revision\}\)/,
 'Saved conclusion must persist in the in-session analysis prompt');
assert.match(copyPrompt,/disabled\?:boolean/);
assert.match(copyPrompt,/<CopyPromptAction locale=\{locale\} prompt=\{prompt\} disabled=\{disabled\}/,
 'Analysis wrapper must forward disabled state to shared action');
assert.match(copyPrompt,/<Button variant=\{variant\} disabled=\{disabled\|\|status==='copying'\}/,
 'Shared copy button must honor disabled state and prevent duplicate copying');
assert.match(copyPrompt,/if\(copied\)\{open\(\);return;\}/);
assert.match(copyPrompt,/writeText\(prompt\)\.then\(open,\(\)=>setStatus\('error'\)\)/,
 'Do not request external navigation before successful copy');
assert.match(copyPrompt,/window\.location\.href='chatgpt:\/\/'/);
assert.match(copyPrompt,/href="https:\/\/chatgpt\.com\/" target="_blank" rel="noopener noreferrer"/,
 'Keep an explicit web fallback without a private prompt in the URL');
assert.match(researchCase,/if\(!keepCaseOnRecheck\(owner.current,detail\)\)clear\(\);\s*return;/,
 'Transient same-account rechecks must not erase selected claim; settled denial clears visible state');
assert.match(researchCase,/const clear=\(\)=>\{owner.current=null;setChoice\(null\);setCompleted\(null\);setRevision\(''\)/,
 'Settled denial or owner change must clear private state');
assert.match(guide,/window\.liGuideUi=port/);
assert.match(capture,/window\.liCaptureUi=port/);


// The Case mentor suggests the known published sample-bias lesson without
// replacing any of its existing 3 explanations/save actions.
const routing=read('tools/step16-real-l09-react-island/src/shell/app-router.ts');
const lessonCta=dialog.indexOf('id="li-buddy-related-lesson"');
const normalActions=dialog.indexOf('(view.editorial?view.editorial.actions.map');
assert.match(plans,/currentPage==="case"\?/,'Only the Case screen exposes its learning link');
assert.match(plans,/window\.liInquiryFlow\?\.getCase\?\.\(\)/,
 'Use the active Case identity, not the old Sampling Bias constant');
assert.match(plans,/window\.liMirrorRelatedLesson\?\.\(\{/,
 'Resolve a Case source lesson through the canonical invite and release gate');
assert.match(dialog,/if\(openRoute\(related\.route\)\)close\(false\)/,
 'Open through the canonical router, then close without returning focus to hidden Case');
assert(lessonCta>=0&&lessonCta<normalActions,
 'Related lesson CTA must be discoverable before ordinary mentor actions');
assert.match(routing,/window\.history\.pushState\(/,
 'Case-to-lesson keeps its own browser history entry');
assert.match(routing,/window\.history\.back\(\)/,
 'Existing global Back returns to the exact originating Case entry');
assert.match(researchCase,/const \[choice,setChoice\]=useState<CaseChoice\|null>\(null\)/);
assert.match(researchCase,/setRevision\(inquiryFlow\(\)\.getCaseDraft\(\)\);\s*setChoice\(readCaseChoice\(localStorage,owner.current,true\)\)/,
 'Case text and selection are hydrated only after matching verified owner and case');


assert.match(plans,/window\.liMirrorRelatedLesson\?\.\(currentPage==="home"\?scenarios\[qIndex\]:liCurrentProblem\(\)\)/,
 'The Home and Research mentor must use the exact active question');
assert.match(dialog,/app\.liPersonalStudyRoutes\?\.\[related\.id\]===related\.route/,
 'A draft lesson needs its actual staging route mapping');
assert.match(dialog,/app\.liReleasedLessonRoutes\?\.\[related\.id\]===related\.route/,
 'Published lessons need their actual release route mapping');
assert.match(dialog,/!app\.liAppRouter\?\.hasRoute\(related\.route\)/,
 'Unmounted or unauthorized lesson routes are not followed');
assert.match(dialog,/\{view\.relatedLesson&&/,
 'Related CTA is not restricted to the original L09 Case');

console.log('PASS Lao Ly React full popup parity: 3 actions, 2 debate results, quotes, provenance, preferences, invite, drag, navigation');
