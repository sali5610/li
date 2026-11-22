// Synthetic QA state ONLY. Never imported into the app's release entrypoint.
import {mountReactChrome} from '../src/shell/react-shell.js';
import {REMINDER_KINDS,writeReminderPreference} from '../src/shell/in-app-reminder.js';
import '../src/shell/journal-settings.css';
const RealDate=Date;
let frozen= new RealDate(2026,10,22,20,49,0).getTime();
class ClockDate extends RealDate{
 constructor(...args:any[]){super(args.length?Reflect.construct(RealDate,args).getTime():frozen);}
 static now(){return frozen;}
}
Object.defineProperty(window,'Date',{configurable:true,writable:true,value:ClockDate});
document.documentElement.classList.add('li-auth-verified');
localStorage.setItem('li.sync.local-owner.v1','synthetic-owner-a');
const schedules=REMINDER_KINDS.map(kind=>({
 kind,enabled:kind==='study',time:kind==='study'?'20:53':'',frequency:'daily' as const,days:[]
}));
writeReminderPreference({version:2,schedules});
(window as any).__liQa={
 advance(time:string){
  const [hour,minute]=time.split(':').map(Number);
  frozen=new RealDate(2026,10,22,hour,minute,0).getTime();
  window.dispatchEvent(new Event('focus'));
 },
 owner(id:string){
  localStorage.setItem('li.sync.local-owner.v1',id);
  window.dispatchEvent(new CustomEvent('li:auth-verified-changed',{detail:{verified:true}}));
 },
 signout(){
  document.documentElement.classList.remove('li-auth-verified');
  window.dispatchEvent(new CustomEvent('li:auth-verified-changed',{detail:{verified:false}}));
 },
 signin(id:string){
  document.documentElement.classList.add('li-auth-verified');
  localStorage.setItem('li.sync.local-owner.v1',id);
  window.dispatchEvent(new CustomEvent('li:auth-verified-changed',{detail:{verified:true}}));
 },
 isDue(){return Boolean(document.body.querySelector('.li-in-app-reminder'))}
};
mountReactChrome();
(window as any).__liQaReady=true;
