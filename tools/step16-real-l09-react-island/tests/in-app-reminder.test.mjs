import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const script=readFileSync(new URL('../src/shell/in-app-reminder.ts',import.meta.url),'utf8');
const output=ts.transpileModule(script,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {parseReminderPreference,validTime,dueInApp,runsOnDay,localDay,
 DEFAULT_REMINDER,readReminderDelivery,writeReminderDelivery}=
 await import('data:text/javascript;base64,'+Buffer.from(output).toString('base64'));
const legacy={version:1,enabled:true,kind:'sleep',time:'21:00'};
const original=()=>parseReminderPreference(JSON.stringify(legacy));
const day=new Date(2026,10,21,21,15);
const empty={lastDay:'',snoozedUntil:0};

test('off by default, strict input and legacy single reminder migration',()=>{
 assert.deepEqual(parseReminderPreference(null),DEFAULT_REMINDER);
 assert.deepEqual(parseReminderPreference('{'),DEFAULT_REMINDER);
 assert.deepEqual(parseReminderPreference(JSON.stringify({...legacy,kind:'diagnosis'})),DEFAULT_REMINDER);
 assert.deepEqual(parseReminderPreference(JSON.stringify({...legacy,time:'30:92'})),DEFAULT_REMINDER);
 assert.equal(validTime('21:00'),true);
 assert.equal(validTime('7:00'),false);
 const migrated=original();
 assert.equal(migrated.version,2);
 assert.equal(migrated.schedules.length,4);
 assert.deepEqual(migrated.schedules.filter(s=>s.enabled).map(s=>s.kind),['sleep']);
 assert.equal(migrated.schedules.find(s=>s.kind==='sleep').time,'21:00');
});
test('all four schedules can be enabled and survive serialization',()=>{
 const pref=original();
 pref.schedules.forEach((s,i)=>{s.enabled=true;s.time=['08:00','21:00','11:00','17:00'][i];});
 assert.deepEqual(parseReminderPreference(JSON.stringify(pref)),pref);
 assert.deepEqual(parseReminderPreference(JSON.stringify({...pref,
  schedules:[...pref.schedules.slice(0,3),pref.schedules[0]]})),DEFAULT_REMINDER);
 pref.schedules[0].frequency='custom';
 assert.deepEqual(parseReminderPreference(JSON.stringify(pref)),DEFAULT_REMINDER,
  'an enabled custom schedule must choose at least one weekday');
 pref.schedules[0].days=[1,3,5];
 assert.deepEqual(parseReminderPreference(JSON.stringify(pref)),pref);
});
test('daily, weekdays, weekends, custom weekdays and window boundaries',()=>{
 const s=original().schedules[1];
 assert.equal(dueInApp(s,empty,new Date(2026,10,21,20,59)),false);
 assert.equal(dueInApp(s,empty,day),true);
 assert.equal(dueInApp(s,empty,new Date(2026,10,21,23,0)),false);
 assert.equal(dueInApp(s,{lastDay:localDay(day),snoozedUntil:0},day),false);
 s.frequency='weekdays';
 assert.equal(runsOnDay(s,6),false);
 assert.equal(runsOnDay(s,1),true);
 assert.equal(dueInApp(s,empty,day),false,'Saturday must not trigger weekday reminder');
 s.frequency='weekends';
 assert.equal(dueInApp(s,empty,day),true);
 s.frequency='custom';s.days=[1,3];
 assert.equal(runsOnDay(s,1),true);
 assert.equal(runsOnDay(s,0),false);
 assert.equal(dueInApp(s,empty,day),false);
});
test('snooze and delivered receipts belong to one type, not the others',()=>{
 const later=new Date(2026,10,21,22,20).getTime();
 const s=original().schedules[1];
 assert.equal(dueInApp(s,{lastDay:'',snoozedUntil:later},new Date(2026,10,21,21,35)),false);
 assert.equal(dueInApp(s,{lastDay:'',snoozedUntil:later},new Date(2026,10,21,22,20)),true);
 assert.equal(dueInApp(s,{lastDay:'',snoozedUntil:later},new Date(2026,10,22,21,15)),true);
 const store=new Map();
 globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 writeReminderDelivery('account-a','sleep',{lastDay:'2026-11-21',snoozedUntil:0});
 writeReminderDelivery('account-a','study',{lastDay:'',snoozedUntil:later});
 assert.equal(readReminderDelivery('account-a','sleep').lastDay,'2026-11-21');
 assert.equal(readReminderDelivery('account-a','study').snoozedUntil,later);
 assert.deepEqual(readReminderDelivery('account-b','study'),empty);
});
test('React settings and account-scoped sync still own the preference',()=>{
 const settings=readFileSync(new URL('../src/shell/journal-settings.tsx',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/shell/in-app-reminder-ui.tsx',import.meta.url),'utf8');
 const personal=readFileSync(new URL('../src/auth/private-state.ts',import.meta.url),'utf8');
 assert.match(settings,/<InAppReminderPanel\s*\/>/);
 assert.match(ui,/writeReminderPreference\(draft\)/);
 assert.match(ui,/writeReminderDelivery\(uid,next.kind,/);
 assert.match(personal,/key:'li\.reminders\.in-app\.v1',type:'preference',id:'in-app-reminders'/);
 assert.match(script,/window\.dispatchEvent\(new Event\('li:private-sync-request'\)\)/);
});

test('snooze crosses midnight, preserves selected-day intent and survives reload',()=>{
 const pref=original();
 const study=pref.schedules[1];
 study.frequency='weekdays';study.time='23:00';
 const saturday=new Date(2026,10,21,0,30);
 const receipt={lastDay:'',snoozedUntil:saturday.getTime()};
 assert.equal(dueInApp(study,receipt,new Date(2026,10,20,23,20)),false);
 assert.equal(dueInApp(study,receipt,saturday),true,
  'a Friday snooze must still show on Saturday');
 assert.equal(dueInApp(study,{...receipt,lastDay:localDay(saturday)},saturday),false);
 assert.equal(dueInApp(study,receipt,new Date(2026,10,23,23,15)),true,
  'next Monday returns to normal weekdays');
});
test('snooze cancellation is wired to device-specific Web Push refresh',()=>{
 const ui=readFileSync(new URL('../src/shell/in-app-reminder-ui.tsx',import.meta.url),'utf8');
 const push=readFileSync(new URL('../src/shell/web-push-settings.tsx',import.meta.url),'utf8');
 const client=readFileSync(new URL('../src/shell/web-push-client.ts',import.meta.url),'utf8');
 assert.match(ui,/dispatchEvent\(new Event\('li:reminder-delivery-changed'\)\)/);
 assert.match(push,/addEventListener\('li:reminder-delivery-changed'/);
 assert.match(push,/removeEventListener\('li:reminder-delivery-changed'/);
 assert.match(client,/snoozedUntil:owner\?readReminderDelivery/);
});

test('in-app due notifications are globally mounted and survive leaving Settings',()=>{
 const ui=readFileSync(new URL('../src/shell/in-app-reminder-ui.tsx',import.meta.url),'utf8');
 const chrome=readFileSync(new URL('../src/shell/react-shell.tsx',import.meta.url),'utf8');
 assert.match(ui,/export function InAppReminderNotifier\(\)/);
 assert.match(ui,/addEventListener\('li:auth-verified-changed',check\)/);
 assert.match(ui,/addEventListener\('visibilitychange',check\)/);
 assert.match(ui,/setInterval\(check,15_000\)/);
 assert.match(chrome,/<InAppReminderNotifier\s*\/>/);
 const settingsRegion=ui.slice(ui.indexOf('export function InAppReminderPanel()'),
  ui.indexOf('export function InAppReminderNotifier()'));
 assert.doesNotMatch(settingsRegion,/createPortal\(/,
  'settings editor cannot own the app-wide notification portal');
 assert.match(settingsRegion,/processedToday/);
});
