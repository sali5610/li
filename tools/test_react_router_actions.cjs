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
assert.match(nav,/id="li-react-account-trigger"/,
 'The account control is a visible React navigation action');
assert.match(nav,/liAccountOverlay\?\.open\(trigger\)/,
 'Account opens by direct action, never a hidden native button click');
assert.doesNotMatch(nav,/data-nav-back/);
assert.doesNotMatch(lesson,/button\[data-page=/);
assert.doesNotMatch(lesson,/getElementById\(['"]global-search['"]\)/,
 'A published lesson must not set the hidden legacy query field');
assert.match(lesson,/search\.liSearch\?\.render\(query\)/);
assert.match(search,/app\.openLaoLy\?\.\(\)/);

assert.match(search,/searchPersonalStudy\(query\)/,
 'React search must include canonical personal-study lesson manuscripts');
assert.match(search,/onSearch=\{\(\)=>setSubmitCount\(n=>n\+1\)\}/,
 'The visible Search submit button must perform a real search');
assert.match(search,/availableRoute\(record\.lessonId\|\|record\.id\)/,
 'Search results must navigate to learnable personal routes');
const stagePreview=read('tools/step16-real-l09-react-island/src/learning/staging-draft-preview.tsx');
const stagingApp=read('tools/step16-real-l09-react-island/src/auth/staging-app.tsx');
assert.match(stagingApp,/import \{mountPersonalStudyRoutes\} from/);
assert.doesNotMatch(stagingApp,/import\('\.\.\/learning\/staging-draft-preview\.js'\)/,
 'Lesson routes cannot rely on asynchronous import after the Catalog is interactive');
assert.match(stagePreview,/export function mountPersonalStudyRoutes\(\)/);

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
assert.match(old,/setVoice:\(kind,enabled\)=>liSetBuddyVoice\(kind,enabled\)/);
assert.match(settings,/app\.liSettingsPort\?\.setVoice\('calm',event\.target\.checked\)/);
assert.match(settings,/app\.liSettingsPort\?\.setVoice\('mute',event\.target\.checked\)/);
assert.match(old,/calm:liBuddyVoice\.calm,mute:liBuddyVoice\.mute/);
assert.match(old,/field\?\.addEventListener\("change",\(\)=>liSetBuddyVoice\(kind,field\.checked\)\)/);
assert.doesNotMatch(old,/field&&field\.checked!==Boolean\(value\)\)field\.click\(\)/);
assert.match(buddy,/const calm=buddyVoice\("calm"\)/);
assert.match(buddy,/if\(buddyVoice\("mute"\)\)/);
assert.match(buddy,/document\.getElementById\(kind==="calm"/); // native fallback only
const libraryReact=read('tools/step16-real-l09-react-island/src/shell/guide-library.tsx');
assert.match(libraryReact,/const tab=view\.bookmarkTab;/,
 'React Resume tab must follow the canonical bookmark port after mentor navigation');
assert.doesNotMatch(libraryReact,/\[tab,setTab\]=useState/,
 'React must not keep a stale second copy of the bookmark tab');
assert.match(buddy,/window\.liLibraryShelf\?\.selectBookmarkTab\?\.\("question"\)/,
 'Mentor saved-question shortcut must select question bookmarks');
assert.match(buddy,/"li-saved-questions":"#li-react-tab-question"/,
 'Mentor must focus the visible selected React question tab');
assert.match(buddy,/Settings exports a partial notes JSON/,
 'Lao Ly must not claim the notes-only export covers all account data');

// S303: Settings is one React-owned flow, not a collection of hidden-button bridges.
const auth=read('tools/step16-real-l09-react-island/src/auth/AuthPanel.tsx');
assert.match(auth,/const permitted=Boolean\(IS_INTEGRATED_LI_APP&&accountId&&access==='granted'&&ownerReady\)/);
const appConfig=read('tools/step16-real-l09-react-island/src/auth/config.ts');
assert.match(appConfig,/IS_INTEGRATED_LI_APP=IS_GITHUB_STAGING\|\|/);
assert.match(appConfig,/VITE_LI_AUTH_TARGET==='cloudflare-first-party'/);
assert.match(auth,/owner\.liJournalCloudConsent=port/);
assert.match(auth,/set:\(enabled:boolean\)=>\{if\(permitted&&!journalBusy\)void toggleJournalCloud\(enabled\)/);
assert.match(auth,/changeJournalCloudConsent\(accountId,enabled\)/,
 'The existing verified account + Neon consent writer remains canonical');
assert.match(settings,/app\.liJournalCloudConsent\?\.set\(event\.target\.checked\)/);
assert.match(settings,/ref=\{backupInput\} type="file"/);
assert.match(settings,/app\.liPersonalBackup\?\.importFile\(file\)/);
assert.match(settings,/app\.liPersonalBackup\?\.export\(\)/);
assert.match(settings,/onAction=\{chooseBackup\}/);
assert.doesNotMatch(settings,/act\('(cloud|export|import|retryImport|back)'/);
const settingsViewHook=settings.slice(settings.indexOf('function useSettings()'),
 settings.indexOf('function BuddyName('));
assert.doesNotMatch(settingsViewHook,/new MutationObserver/);
assert.match(old,/window\.liPersonalBackup=Object\.freeze\(\{/);
assert.match(old,/importFile:liImportPersonalData/);
assert.match(old,/if\(file\.size>10\*1024\*1024\)throw Error\("large"\)/);
assert.match(old,/const oldRaw=window\.localStorage\.getItem\(LI_STORAGE_KEY\)/);
assert.match(old,/if\(oldRaw===null\)window\.localStorage\.removeItem\(LI_STORAGE_KEY\)/);
assert.match(old,/if\(oldDraft===null\)window\.localStorage\.removeItem\(LI_DRAFT_KEY\)/);
assert.match(old,/if\(oldNames===null\)window\.localStorage\.removeItem\(LI_BUDDY_NAMES_KEY\)/);
assert.match(old,/return false;[\s\S]*liBackupImport\.loading=false;liPublishBackup\(\)/,
 'Cancel/errors must finish without leaving the file picker blocked');
assert.match(old,/const cloud=window\.liJournalCloudConsent\?\.getView\?\.\(\)/);
assert.match(old,/const backup=window\.liPersonalBackup\?\.getView\?\.\(\)/);
assert.doesNotMatch(old,/el\("import-personal-trigger"\)\?\.click\(\)/);
assert.doesNotMatch(old,/el\("export-personal-data"\)\?\.click\(\)/);
assert.doesNotMatch(old,/el\("li-journal-cloud-toggle"\)/);

// Journal screen: complete Check-in → recording → deletion/Undo controls now
// use the SAME canonical ledger functions as the native fallback.
const diary=read('site/assets/personal-diary.js');
const diaryActions=diary.slice(diary.indexOf('function actReact('),
 diary.indexOf('function notifyReactDiary('));
const diaryModel=diary.slice(diary.indexOf('function getView(){'),
 diary.indexOf('function actReact('));
assert.match(diaryActions,/openCheckin\(value\|\|"li-diary-checkin-now"\)/);
assert.match(diaryActions,/toggleRecording\(\)/);
assert.match(diaryActions,/deleteDiary\(\)/);
assert.doesNotMatch(diaryActions,/\.click\(\)/);
assert.match(settings,/id="li-react-diary-checkin"/);
assert.match(settings,/act\('checkin','li-react-diary-checkin'\)/);
assert.match(diary,/window\.dispatchEvent\(new CustomEvent\("li:open-checkin",\{detail:\{triggerId\}\}\)\)/);
assert.match(diary,/function toggleRecording\(\)/);
assert.match(diary,/function deleteDiary\(confirmed=false\)/);
assert.match(diary,/if\(!confirmed&&!window\.confirm\("Xóa toàn bộ lịch thể trạng/);
assert.match(diary,/if\(kind==="deleteConfirmed"\)\{return deleteDiary\(true\);\}/);
assert.match(diary,/window\.liShowUndo\("Đã xóa lịch hoạt động\."/);
assert.match(diary,/existing\.activities\[type\]=\[\.\.\.new Set\(\[\.\.\.previous,\.\.\.added\]\)\]/);
assert.match(diary,/\$\("li-diary-consent"\)\.addEventListener\("click",toggleRecording\)/);
assert.match(diary,/\$\("li-diary-delete"\)\.addEventListener\("click",deleteDiary\)/);
assert.match(diaryModel,/monthLabel:monthLabel\(\)/);
assert.match(diaryModel,/selectedLabel:selectedLabel\(\)/);
assert.match(diaryModel,/dayStatus:recordedDayStatus\(record\)/);
assert.match(diaryModel,/consentStatus:recordingStatus\(\)/);
assert.doesNotMatch(diaryModel,/\$\("li-diary-/,
 'React Journal must not read labels or status from hidden native DOM');

// One Catalog→Course→Lesson flow. Public releases remain pack-gated;
// 17 personal-only manuscripts may be learned through invited staging routes.
const catalog=read('site/assets/catalog-drilldown.js');
const reactCatalog=read('tools/step16-real-l09-react-island/src/shell/home-catalog.tsx');
const staging=read('tools/step16-real-l09-react-island/src/auth/staging-app.tsx');
const lessonPorts=read('tools/step16-real-l09-react-island/src/learning/staging-ports.ts');
const release=read('tools/step16-real-l09-react-island/src/learning/released-lessons.ts');
assert.match(release,/l\.navigationPublished===true&&l\.contentState==='review_only'&&/);
assert.match(release,/l\.publishState==='review_only'&&packed\.has\(l\.id\)/);
assert.match(reactCatalog,/const releasedRoutes=new Map\(releasedLessonRoutes\.map/);
assert.match(reactCatalog,/const canOpenLesson=\(lesson:Lesson\)=>!!personalStudyRoute\(lesson\.id\)/);
assert.match(reactCatalog,/lesson\.published===true&&typeof lesson\.route==='string'/);
assert.match(reactCatalog,/if\(personalRoute\)\{/);
assert.match(reactCatalog,/if\(!openRoute\(personalRoute\)\)\{/);
assert.match(reactCatalog,/setLessonNavError\(/);
assert.match(release,/VITE_LI_AUTH_TARGET==='github-pages-staging'/);
assert.match(release,/export const learnableLessonIds/);
assert.match(staging,/mountPersonalStudyRoutes\(\)/);
assert.match(reactCatalog,/course\.lessons\.filter\(canOpenLesson\)/);
assert.match(reactCatalog,/if\(canOpenLesson\(item\)\)\{/);
assert.match(reactCatalog,/const releasedRoute=releasedRoutes\.get\(item\.id\)/,
 'Published lesson navigation must resolve through the canonical release gate');
assert.match(reactCatalog,/!releasedRoute\|\|!openRoute\(releasedRoute\)/,
 'Released Catalog lessons use the single React router, including an actionable failure');
assert.doesNotMatch(reactCatalog,/app\.liCatalog\?\.openLesson\(/,
 'React must never delegate released lesson navigation to native double-push history');
assert.match(reactCatalog,/window\.addEventListener\('li:lesson-attempt-changed',update\)/,
 'A saved offline lesson self-review must refresh course progress immediately');
assert.match(reactCatalog,/window\.removeEventListener\('li:lesson-attempt-changed',update\)/,
 'React Catalog progress listener must be cleaned up');
assert.match(reactCatalog,/pendingCatalogReturn=\{path:path\.slice\(0,3\)\.join\('\/'\),top:window\.scrollY\}/,
 'Opening a lesson should remember the selected course scroll position');
assert.match(reactCatalog,/window\.addEventListener\('li:route-changed',onRoute\)/,
 'Returning to Catalog should restore the course location without replacing router history');
assert.match(reactCatalog,/window\.addEventListener\('li:auth-verified-changed',onAuth\)/,
 'Pending scroll location must be cleared across invited-account changes');
assert.match(reactCatalog,/openPath\(\[\.\.\.path\.slice\(0,3\),item\.id\]\)/);
assert.match(staging,/liReleasedLessonRoutes=Object\.freeze\(Object\.fromEntries\(/);
assert.match(staging,/liAccountOverlay=accountOverlay/);
assert.match(staging,/accountTrigger\?\.isConnected/);
assert.doesNotMatch(staging,/opener\?\.addEventListener\('click'/);
assert.match(catalog,/released\[id\]===lesson\.route/);
assert.match(catalog,/if\(kind==="open-lesson"\)\{openCatalogLesson\(v\);return;\}/);
assert.match(catalog,/function findCatalogLesson\(id\)/);
assert.match(catalog,/function openForLesson\(id\)/);
assert.match(catalog,/setPath\(\[found\.group\.id,found\.field\.id,found\.course\.id\],false\)/);
assert.match(catalog,/url\.searchParams\.set\("catalog",path\.join\("\/"\)\)/);
assert.match(catalog,/url\.searchParams\.delete\("lesson"\)/);
assert.match(lessonPorts,/owner\.liCatalog\?\.openForLesson\?\.\(LESSON\)/);
assert.match(catalog,/if\(reactOwnsCatalog\(\)\)return;/);
assert.match(reactCatalog,/app\.liReactCatalogMounted=true/);
assert.match(reactCatalog,/app\.liReactCatalogMounted=false/);
assert.match(reactCatalog,/app\.liCatalog\?\.render\(\)/);

// All three released learner routes own their actionable UI. Optional
// technique practice retains the lesson ID and the same authored checker.
const l09=read('tools/step16-real-l09-react-island/src/learning/LearningJourney.tsx');
const wave=read('tools/step16-real-l09-react-island/src/learning/Wave1Journey.tsx');
const parity=read('tools/step16-real-l09-react-island/src/learning/LessonDetailParity.tsx');
const spellDetail=read('tools/step16-real-l09-react-island/src/shell/detail-practice.tsx');
assert.match(old,/open:\(id,practice=false,lessonId=null\)=>\{/);
assert.match(old,/!liInquiryAllowed\(\)\|\|!methods\.some\(m=>m\[0\]===id\)/);
assert.match(old,/window\.liReleasedLessonRoutes\?\.\[lessonId\]!==route/);
assert.match(old,/showMethod\(id,\{practice,lessonId\}\);return true/);
assert.match(l09,/onClick=\{\(\)=>openLessonSpell\('L09-1-2',spell\.shortId,index===0\)\}/);
assert.match(wave,/onClick=\{\(\)=>openLessonSpell\(id,spell\.shortId,index===0\)\}/);
for(const [name,src] of [['L09',l09],['L03/L15',wave]]){
 assert.doesNotMatch(src,/data-method=\{spell\.shortId\}/,
  name+' must not delegate its visible spell CTA through legacy DOM');
 assert.doesNotMatch(src,/data-spell-lesson=/);
 assert.match(src,/onClick=\{ports\.navigation\.openCatalog\}/);
 assert.match(src,/LessonMentor id=/);
 assert.match(src,/onClick=\{\(\)=>void restartLesson\(\)\}/);
 assert.match(src,/AiFeedbackPanel id=/);
 assert.match(src,/SelfReviewNextStep rubricItems=/);
}
assert.match(parity,/export function openLessonSpell\(lessonId:LessonId,methodId:string,practice:boolean\):boolean/);
assert.match(parity,/app\.liMethods\?\.open\(methodId,practice,lessonId\)===true/);
assert.match(parity,/onClick=\{event=>app\.openLaoLy\?\.\(event\.currentTarget\)\}/);
assert.doesNotMatch(parity,/<Button variant="secondary" data-buddy=/);
assert.match(spellDetail,/const lessonRoute=view\.lessonId\?app\.liReleasedLessonRoutes\?\.\[view\.lessonId\]:undefined/);
assert.match(spellDetail,/onClick=\{\(\)=>openRoute\(lessonRoute\)\}/);
assert.match(spellDetail,/onClick=\{\(\)=>openRoute\('guide'\)\}/);

// Product-level React UI coverage: every addressable legacy page must
// have an explicitly mounted React screen or a guarded redirect. If a new
// page is added to index.html without a React owner, this test fails.
const shell=read('tools/step16-real-l09-react-island/src/shell/react-shell.tsx');
const noteEditor=read('site/assets/library-note-editor.js');
const nativeLibrary=read('site/assets/library-hub.js');
const declared=[...old.matchAll(/<section id="page-([^"]+)"/g)].map(x=>x[1]);
const ownerByRoute={
 home:'home-catalog',catalog:'home-catalog',
 research:'research-case',case:'research-case',
 guide:'guide-library',guideDetail:'guide-library',
 library:'guide-library',resume:'guide-library',
 collection:'guide-library',noteDetail:'guide-library',
 dashboard:'journal-settings',settings:'journal-settings',
 search:'knowledge-search',capture:'capture-idea'
};
assert.deepEqual([...new Set(declared)].sort(),
 [...Object.keys(ownerByRoute),'lesson'].sort(),
 'An unexpected vanilla page was introduced without a React UI owner');
const routeFingerprints={
 home:"'page-home'",catalog:"'page-catalog'",
 research:"mountPage('research'",case:"mountPage('case'",
 guide:"route:'guide'",guideDetail:"route:'guideDetail'",
 library:"route:'library'",resume:"route:'resume'",
 collection:"route:'collection'",noteDetail:"route:'noteDetail'",
 dashboard:"route:'dashboard'",settings:"route:'settings'",
 search:"'page-search'",capture:"'page-capture'"
};
for(const [route,owner] of Object.entries(ownerByRoute)){
 const ui=read('tools/step16-real-l09-react-island/src/shell/'+owner+'.tsx');
 assert.ok(ui.includes(routeFingerprints[route]),
  route+' has no identified React mount target in '+owner);
 assert.match(ui,/createRoot\(/,route+' is not mounted through React');
}
assert.match(staging,/mountReactChrome/);
assert.match(staging,/mountLearningJourney\(node,ports\)/);
assert.match(staging,/mountWave1Journey\(node,id as/);
assert.match(staging,/mountEditorialJourney\(node,id,ports\)/);
assert.match(staging,/releasedLessonRoutes/);
assert.match(old,/if\(id==="lesson"\)id=window\.liReleasedLessonRoutes\?\.\["L09-1-2"\]==="lessonL09"\?/,
 'Retired vanilla sample must redirect to a released React lesson');
assert.match(old,/const react=window\.liReactToastPort/);
assert.match(old,/react\.show\(String\(message\),typeof options\.undo==="function"\?options\.undo:null\)/);
assert.match(old,/window\.liShowUndo=\(message,undo\)=>toast\(message,\{undo\}\)/);
assert.match(shell,/createRoot\(brand\),footerRoot=createRoot\(footer\),toastRoot=createRoot\(toast\)/);
assert.match(shell,/app\.liReactToastPort=port/);
assert.match(shell,/notice\.undo\?7000:2600/);
assert.match(shell,/restored\?'Đã hoàn tác\.'/);
assert.match(shell,/className="li-snackbar-undo"/);
assert.match(shell,/function Brand\(\)/);
assert.match(shell,/function Footer\(\)/);

// These native modules own storage/undo but may not repaint duplicate hidden
// calendars, bookmarks, case titles or version histories during React use.
assert.match(diary,/if\(window\.liReactDiaryMounted\)\{notifyReactDiary\(\);return;\}/);
assert.match(settings,/native\.liReactDiaryMounted=true/);
assert.match(nativeLibrary,/if\(window\.liReactLibraryMounted\)\{notifyReactLibrary\(\);return;\}/);
assert.match(read('tools/step16-real-l09-react-island/src/shell/guide-library.tsx'),
 /spellOwner\.liReactLibraryMounted=true/);
assert.match(noteEditor,/if\(window\.liReactLibraryMounted\)\{notifyReactNote\(\);return;\}/);
assert.doesNotMatch(nativeLibrary,/document\.querySelector\?\.\("#page-case \.editorial-grid \.surface\.tinted h2"\)/);

console.log('PASS explicit React routes and Back: direct actions, canonical history and search, no hidden click');
