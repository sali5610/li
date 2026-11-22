/**
 * Trusted-origin offline continuation for a recently invited learner on THIS browser.
 * NOT a Google session, JWT, remote permission or proof of current membership.
 * Server checks remain required for all Neon requests on reconnect.
 * A revoked invite cannot be observed without a network: offline access is
 * deliberately time-limited, device-local, and cannot authorize cloud writes.
 */
const KEY='li.offline.recent-invite.v1';
const OWNER='li.sync.local-owner.v1';
const TRUSTED_ORIGINS=new Set(['https://sali5610.github.io','https://li5610.pages.dev']);
export const OFFLINE_LEASE_MS=12*60*60*1000;
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type Lease={v:1;uid:string;verifiedAt:number};

export function forgetOfflineInvite(store:Store=localStorage):void{
 try{store.removeItem(KEY);}catch{/* no device grant if storage is unavailable */}
}

export function rememberOfflineInvite(
 uid:string,now=Date.now(),store:Store=localStorage,origin=location.origin
):boolean{
 if(!TRUSTED_ORIGINS.has(origin)||typeof uid!=='string'||!uid.trim()||
    !Number.isFinite(now)||now<=0)return false;
 try{
  if(store.getItem(OWNER)!==uid)return false;
  store.setItem(KEY,JSON.stringify({v:1,uid,verifiedAt:now} satisfies Lease));
  return true;
 }catch{return false;}
}

/** Only offline: current owner must match a recently server-verified account.
 * Never use this for server auth or when the browser says it is online. */
export function recentOfflineOwner(
 offline:boolean,now=Date.now(),store:Store=localStorage,origin=location.origin
):string|null{
 if(!offline||!TRUSTED_ORIGINS.has(origin)||!Number.isFinite(now))return null;
 try{
  const raw=store.getItem(KEY);
  if(!raw||raw.length>500)return null;
  const value=JSON.parse(raw) as Partial<Lease>|null;
  if(!value||value.v!==1||typeof value.uid!=='string'||!value.uid.trim()||
     typeof value.verifiedAt!=='number'||!Number.isSafeInteger(value.verifiedAt)||
     value.verifiedAt>now||now-value.verifiedAt>=OFFLINE_LEASE_MS||
     store.getItem(OWNER)!==value.uid)return null;
  return value.uid;
 }catch{return null;}
}
