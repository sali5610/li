import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const script=readFileSync(new URL('../src/shell/in-app-reminder.ts',import.meta.url),'utf8');
const output=ts.transpileModule(script,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {parseReminderPreference,validTime,dueInApp,localDay,DEFAULT_REMINDER}=
 await import('data:text/javascript;base64,'+Buffer.from(output).toString('base64'));
const active={version:1,enabled:true,kind:'sleep',time:'21:00'};
const inactive={...active,enabled:false};
const day=new Date(2026,10,21,21,15);

test('in-app reminder is OFF by default and invalid preferences fail closed',()=>{
 assert.deepEqual(parseReminderPreference(null),DEFAULT_REMINDER);
 assert.deepEqual(parseReminderPreference('{'),DEFAULT_REMINDER);
 assert.deepEqual(parseReminderPreference(JSON.stringify({...active,kind:'diagnosis'})),DEFAULT_REMINDER);
 assert.deepEqual(parseReminderPreference(JSON.stringify({...active,time:'30:92'})),DEFAULT_REMINDER);
 assert.deepEqual(parseReminderPreference(JSON.stringify({...active,time:''})),DEFAULT_REMINDER);
 assert.deepEqual(parseReminderPreference(JSON.stringify(active)),active);
 assert.equal(validTime('21:00'),true);
 assert.equal(validTime('7:00'),false);
});
test('user chosen in-app daily time, visible window and one-per-day cap',()=>{
 const empty={lastDay:'',snoozedUntil:0};
 assert.equal(dueInApp(inactive,empty,day),false);
 assert.equal(dueInApp(active,empty,new Date(2026,10,21,20,59)),false);
 assert.equal(dueInApp(active,empty,day),true);
 assert.equal(dueInApp(active,empty,new Date(2026,10,21,23,0)),false);
 assert.equal(dueInApp(active,{lastDay:localDay(day),snoozedUntil:0},day),false);
 assert.equal(dueInApp(active,{lastDay:'2026-11-20',snoozedUntil:0},day),true);
});
test('snooze does not create a push task and does not show before the chosen delay',()=>{
 const later=new Date(2026,10,21,22,20).getTime();
 const state={lastDay:'',snoozedUntil:later};
 assert.equal(dueInApp(active,state,new Date(2026,10,21,21,35)),false);
 assert.equal(dueInApp(active,state,new Date(2026,10,21,22,20)),true);
});
test('real settings and existing account-scoped Neon preferences own the reminder',()=>{
 const source=readFileSync(new URL('../src/shell/journal-settings.tsx',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/shell/in-app-reminder-ui.tsx',import.meta.url),'utf8');
 const personal=readFileSync(new URL('../src/auth/private-state.ts',import.meta.url),'utf8');
 assert.match(source,/<InAppReminderPanel\s*\/>/);
 assert.match(ui,/writeReminderPreference\(next\)/);
 assert.match(ui,/writeReminderDelivery\(account,/);
 assert.match(personal,/key:'li\.reminders\.in-app\.v1',type:'preference',id:'in-app-reminders'/);
 assert.match(script,/window\.dispatchEvent\(new Event\('li:private-sync-request'\)\)/);
});
