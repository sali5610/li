/** Only the selected enum is retained locally; the existing Inquiry port
 * still owns conclusion text and submission. No auth grant or cloud record. */
import type {CaseChoice} from './inquiry-port.js';
export type CaseOwner={uid:string;caseId:string};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type AuthDetail={transient?:boolean;accountId?:string|null};
const key=(owner:CaseOwner)=>'li.case-choice.v1:'+encodeURIComponent(owner.uid)+':'+encodeURIComponent(owner.caseId);
function requireOwner(store:Store,owner:CaseOwner,verified:boolean){
 if(!verified||!owner.uid||!owner.caseId||store.getItem('li.sync.local-owner.v1')!==owner.uid)
  throw Error('CASE_CHOICE_OWNER_REQUIRED');
}
export function keepCaseOnRecheck(owner:CaseOwner|null,detail?:AuthDetail):boolean{
 return Boolean(owner&&detail?.transient&&(!detail.accountId||detail.accountId===owner.uid));
}
export function readCaseChoice(store:Store,owner:CaseOwner,verified:boolean):CaseChoice|null{
 requireOwner(store,owner,verified);
 const value=store.getItem(key(owner));
 return value==='right'||value==='wrong'?value:null;
}
export function writeCaseChoice(store:Store,owner:CaseOwner,verified:boolean,choice:CaseChoice|null):void{
 requireOwner(store,owner,verified);
 if(choice===null)store.removeItem(key(owner));
 else if(choice==='right'||choice==='wrong')store.setItem(key(owner),choice);
 else throw Error('CASE_CHOICE_INVALID');
 if(store.getItem(key(owner))!==choice)throw Error('CASE_CHOICE_WRITE_FAILED');
}
