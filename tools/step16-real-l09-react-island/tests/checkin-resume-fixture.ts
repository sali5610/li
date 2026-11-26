import {mountCheckinDialog} from '../src/shell/checkin-dialog.js';
import type {SavedCheckin} from '../src/shell/checkin-domain.js';

export async function runCheckinResumeFixture(root:HTMLElement){
 const app=window as unknown as Record<string,any>;
 const key='li.sync.local-owner.v1',prior=localStorage.getItem(key);
 const ownerA='qa-checkin-a',ownerB='qa-checkin-b';
 const records=new Map<string,SavedCheckin>();
 let applied=0,checks=0;
 const sleep=(ms=60)=>new Promise<void>(resolve=>window.setTimeout(resolve,ms));
 const until=async(test:()=>boolean,label:string)=>{
  for(let i=0;i<120;i++){if(test())return;await sleep(25);}
  throw Error(label);
 };
 const check=(condition:unknown,label:string)=>{if(!condition)throw Error(label);checks++;};
 const modal=()=>document.getElementById('checkin-modal');
 const radio=(name:string,value:string)=>modal()?.querySelector<HTMLInputElement>('input[name="checkin-'+name+'"][value="'+value+'"]');
 const click=(id:string)=>{const node=modal()?.querySelector<HTMLButtonElement>('#'+id);if(!node)throw Error('missing '+id);node.click();};
 const auth=(uid:string|null)=>{
  if(uid)localStorage.setItem(key,uid);
  else localStorage.removeItem(key);
  document.documentElement.classList.toggle('li-auth-verified',!!uid);
  window.dispatchEvent(new CustomEvent('li:auth-verified-changed',{detail:{verified:!!uid,accountId:uid,transient:false}}));
 };
 const manual=()=>window.dispatchEvent(new CustomEvent('li:open-checkin',{detail:{triggerId:'checkin'}}));
 const route=()=>window.dispatchEvent(new CustomEvent('li:route-changed',{detail:{route:'home'}}));
 const onRecord=(event:Event)=>{
  const uid=localStorage.getItem(key);
  if(!uid)throw Error('fixture applied without owner');
  records.set(uid,(event as CustomEvent<SavedCheckin>).detail);applied++;
  window.dispatchEvent(new Event('li:diary-view-changed'));
 };
 app.liPersonalDiary={getView:()=>({consentStatus:'Synthetic local journal'}),
  getTodayCheckin:(uid:string)=>document.documentElement.classList.contains('li-auth-verified')&&localStorage.getItem(key)===uid?records.get(uid):null};
 app.liSettingsPort={setMode:()=>true};
 app.liLanguage={get:()=> 'vi'};
 root.id='li-react-checkin-root';root.closest('section')!.id='page-home';
 auth(null);
 window.addEventListener('li:l1-physical-checkin',onRecord);
 let release!:()=>void;
 const hydration=new Promise<void>(resolve=>{release=resolve;});
 let dispose=mountCheckinDialog(()=>hydration);
 try{
  await sleep();check(!modal(),'guest auto-opened');
  auth(ownerA);await sleep();check(!modal(),'prompt before hydration');
  release();
  await until(()=>!!modal(),'missing automatic prompt');
  check(!!modal()!.querySelector<HTMLButtonElement>('#apply-checkin')?.disabled,'blank input is applicable');
  radio('sleep','yes')!.click();click('close-checkin');
  await until(()=>!modal(),'skip did not close');route();await sleep(180);
  check(!modal()&&applied===0,'skip repeated prompt or wrote data');
  manual();await until(()=>!!modal(),'manual reopen missing');
  check(radio('sleep','yes')?.checked&&!radio('move','yes')?.checked,'partial input lost on reopen');
  radio('move','no')!.click();radio('rest','yes')!.click();
  (modal()!.querySelector('.checkin-context') as HTMLDetailsElement).open=true;
  radio('energy','low')!.click();radio('attention','hard')!.click();
  (modal()!.querySelector('.checkin-manual') as HTMLDetailsElement).open=true;
  radio('override','start')!.click();
  await until(()=>!modal()!.querySelector<HTMLButtonElement>('#apply-checkin')!.disabled,'cannot apply complete input');
  click('apply-checkin');await until(()=>!modal(),'apply did not close');
  check(applied===1&&records.get(ownerA)?.energy==='low'&&records.get(ownerA)?.attention==='hard'&&records.get(ownerA)?.override==='start','applied optional values lost');
  manual();await until(()=>!!modal(),'saved reopen missing');
  check(radio('sleep','yes')?.checked&&radio('move','no')?.checked&&radio('rest','yes')?.checked&&radio('energy','low')?.checked&&radio('attention','hard')?.checked&&radio('override','start')?.checked,'saved inputs not prefilled');
  check(modal()?.querySelector('#apply-checkin')?.textContent?.trim()==='Cập nhật','update label missing');
  radio('move','yes')!.click();click('apply-checkin');await until(()=>!modal(),'update did not close');
  check(applied===2&&records.get(ownerA)?.move==='yes','update failed');
  // Full React remount: restore from the same existing owner port.
  dispose();dispose=mountCheckinDialog(()=>Promise.resolve());
  await sleep(220);check(!modal(),'saved check-in opened automatically');
  manual();await until(()=>!!modal(),'stored record reopen missing');
  check(radio('move','yes')?.checked&&radio('energy','low')?.checked,'remount lost saved input');
  click('close-checkin');await until(()=>!modal(),'close failed');
  auth(null);await sleep();auth(ownerB);
  await until(()=>!!modal(),'new owner missing prompt');
  check(!modal()!.querySelector('input:checked')?.matches('input[name^="checkin-sleep"],input[name^="checkin-move"],input[name^="checkin-rest"]'),'previous owner input leaked');
  check(!radio('energy','low')?.checked&&!radio('override','start')?.checked,'previous owner optional input leaked');
  click('close-checkin');await until(()=>!modal(),'new owner skip failed');
  check(applied===2,'automatic or skipped check-in created extra record');
  return {status:'PASS',checks,scope:'actual React dialog, isolated synthetic diary owner port; no live auth or cloud'};
 }finally{
  dispose();window.removeEventListener('li:l1-physical-checkin',onRecord);
  auth(null);if(prior!==null)localStorage.setItem(key,prior);
 }
}
