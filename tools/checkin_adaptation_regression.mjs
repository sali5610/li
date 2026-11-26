/* React L1 Check-in parity + source ownership regression.
 * No DOM mocking: the decision model is pure, the React layer owns all UI.
 * No privileged session is fabricated for a test fixture. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 completePhysical,recommendStudyRhythm,STUDY_RHYTHMS,savedCheckin,checkinDay
} from './step16-real-l09-react-island/src/shell/checkin-domain.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const page=read('../site/index.html');
const react=read('./step16-real-l09-react-island/src/shell/checkin-dialog.tsx');
const diary=read('../site/assets/personal-diary.js');
const rules=read('./step16-real-l09-react-island/src/shell/checkin-domain.js');
const shell=read('./step16-real-l09-react-island/src/auth/staging-app.tsx');
const css=read('../site/assets/checkin-adaptation.css');
assert.ok(page.includes('id="li-react-checkin-root"'),'React portal root must exist');
assert.ok(!page.includes('id="checkin-modal"'),'old static check-in form must be gone');
assert.ok(!page.includes('function recommendStudyMode('),'no duplicated inline heuristic');
assert.ok(!page.includes('function refreshCheckinRecommendation('),'no legacy modal input reader');
assert.ok(react.includes('id="checkin-modal"')&&react.includes('data-react-owner="checkin"'));
assert.ok(react.includes('id="li-checkin-recording-disclosure"'));
assert.ok(react.includes('li:open-checkin')&&react.includes('li:l1-physical-checkin'));
assert.ok(react.includes('li-auth-verified'),'uninvited accounts must not open modal');
assert.ok(react.includes("latest=null"),'clear sensitive in-memory check-in on signout');
assert.ok(react.includes("if(!chosen||!complete)return"),'manual override cannot bypass physical questions');
assert.ok(react.includes("if(!app.liSettingsPort?.setMode?.("),'existing study-mode account state owns persistence');
assert.ok(shell.includes('mountCheckinDialog'),'check-in must mount from the one React app');
assert.ok(diary.includes('li:open-checkin')&&diary.includes('li:l1-physical-checkin'));
assert.ok(!diary.includes('$("checkin-modal").dataset.trigger'),'old modal controller must not be used');
assert.ok(!rules.includes('localStorage')&&!rules.includes('document.')&&!rules.includes('window.'),'recommendation rules must be pure');
assert.ok(css.includes('#checkin-modal .checkin-scroll')&&css.includes('#checkin-modal .checkin-actions{'));
assert.ok(css.includes('position:relative'), 'footer remains separate from scroll body');
assert.ok(!css.includes('position:sticky'),'no modal footer overlay');
assert.equal(Object.keys(STUDY_RHYTHMS).length,4);
const p=(sleep,move,rest)=>({sleep,move,rest});
const examples=[
 [p('','',''),'','',null],
 [p('yes','',''),'','',null],
 [p('yes','yes',''),'high','steady',null],
 [p('yes','yes','yes'),'','','focus'],
 [p('yes','no','yes'),'high','steady','start'],
 [p('no','no','no'),'','','recover'],
 [p('yes','unsure','yes'),'','',null],
 [p('unsure','unsure','unsure'),'','',null],
 [p('yes','yes','yes'),'medium','','start'],
 [p('yes','yes','yes'),'','warming','start'],
 [p('yes','yes','yes'),'low','','recover'],
 [p('yes','yes','yes'),'','hard','recover'],
 [p('no','yes','yes'),'low','hard','overload'],
 [p('yes','yes','yes'),'low','hard','overload'],
 [p('no','yes','yes'),'high','steady','start'],
 [p('yes','yes','yes'),'high','steady','focus'],
 [p('yes','yes','yes'),'medium','steady','focus'],
 [p('yes','yes','yes'),'high','warming','focus'],
 [p('yes','no','yes'),'high','','start'],
 [p('yes','no','yes'),'high','steady','start'],
 [p('yes','no','yes'),'','steady','start'],
 [p('yes','no','yes'),'high','hard','recover'],
 [p('no','no','yes'),'high','steady','recover'],
 [p('invalid','yes','yes'),'','',null]
];
for(const [physical,energy,attention,expected] of examples){
 const actual=recommendStudyRhythm(physical,energy,attention);
 assert.equal(actual?.mode??null,expected,JSON.stringify({physical,energy,attention,expected}));
 assert.equal(completePhysical(physical),expected!==null);
}
const base=recommendStudyRhythm(p('yes','no','yes'));
const high=recommendStudyRhythm(p('yes','no','yes'),'high');
const both=recommendStudyRhythm(p('yes','no','yes'),'high','steady');
assert.equal(base.mode,'recover');assert.equal(high.mode,'start');assert.equal(high.points,base.points+1);
assert.equal(both.points,base.points+2);
assert.ok(both.positives.some(x=>x.includes('Năng lượng dồi dào +1')));
assert.ok(both.positives.some(x=>x.includes('Tập trung rõ +1')));
const now=new Date(2026,10,27,10);
const recorded={sleep:'yes',move:'no',rest:'yes',energy:'low',attention:'hard',override:'start',selectedMode:'start',recordedAt:now.toISOString()};
assert.deepEqual(savedCheckin(recorded,now),recorded);
assert.equal(savedCheckin(recorded,new Date(2026,10,28,10)),null);
assert.equal(savedCheckin({...recorded,sleep:'unsure'},now),null);
assert.equal(savedCheckin({...recorded,recordedAt:'bad'},now),null);
assert.equal(savedCheckin({...recorded,energy:'invalid',attention:'invalid'},now).energy,'');
assert.equal(checkinDay(now),'2026-11-27');
assert.ok(diary.includes('getTodayCheckin(uid)')&&diary.includes('localStorage.getItem("li.sync.local-owner.v1")!==uid'));
assert.ok(react.includes('waitForReady(uid)')&&react.includes('prompted.current===day.current'));
console.log('LI_CHECKIN_PREFILL_PASS saved inputs, local day, stale or invalid record, owner guard, hydration and single prompt contracts');
console.log('LI_REACT_CHECKIN_PASS '+examples.length+' pure decision cases; React UI owner; invite/record/skip/consent contracts');
