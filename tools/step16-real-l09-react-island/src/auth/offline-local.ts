/**
 * Owner-bound, local-only offline continuation for seven days after an
 * actual online invite verification. Survives PWA/browser process eviction.
 * This is a device-local UX grant, NOT a JWT or authority to access Neon.
 * Device clock/storage are not a trusted security boundary; online access
 * and every remote write still require the real Auth/invite/RLS checks.
 */
export const OFFLINE_LEASE_MS=7*24*60*60*1000;
const KEY='li.offline.device-invite.v3';
const SESSION_KEY='li.offline.active-session.v1';
const LEGACY_KEY='li.offline.recent-invite.v1';
const OWNER='li.sync.local-owner.v1';
const TRUSTED_ORIGINS=new Set(['https://sali5610.github.io','https://li5610.pages.dev']);
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type Lease={v:3;uid:string;verifiedAt:number};

/** Local lock/logout/explicit denial invalidates the durable grant, not drafts. */
export function forgetOfflineInvite(deviceStore?:Store):boolean{
 let locked=false;
 try{
  const device=deviceStore??localStorage;
  // Prefer deletion; if unavailable try a non-authorizing tombstone.
  try{device.removeItem(KEY);}catch{try{device.setItem(KEY,'locked');}catch{/* inaccessible */}}
  locked=device.getItem(KEY)===null||device.getItem(KEY)==='locked';
  try{device.removeItem(LEGACY_KEY);}catch{/* legacy ignored */}
 }catch{/* unavailable storage cannot be reported as successfully locked */}
 try{sessionStorage.removeItem(SESSION_KEY);}catch{/* legacy ignored */}
 return locked;
}

/** Called ONLY after a successful live invite check for the matching owner.
 * verifiedAt is the time of that result, never the time of offline use.
 */
export function rememberOfflineInvite(
 uid:string,verifiedAt=Date.now(),deviceStore?:Store,origin=location.origin
):boolean{
 if(!TRUSTED_ORIGINS.has(origin)||typeof uid!=='string'||!uid.trim()||
    !Number.isSafeInteger(verifiedAt)||verifiedAt<=0)return false;
 try{
  const device=deviceStore??localStorage;
  if(device.getItem(OWNER)!==uid)return false;
  const value=JSON.stringify({v:3,uid,verifiedAt} satisfies Lease);
  device.setItem(KEY,value);
  if(device.getItem(KEY)!==value)return false;
  try{device.removeItem(LEGACY_KEY);}catch{/* legacy ignored */}
  try{sessionStorage.removeItem(SESSION_KEY);}catch{/* legacy ignored */}
  return true;
 }catch{return false;}
}

/** Read-only; no refresh of expiry while offline or during startup.
 * Never accept legacy grants, a changed owner, future timestamp, or age >= 7d.
 */
export function recentOfflineOwner(
 offline:boolean,now=Date.now(),deviceStore?:Store,origin=location.origin
):string|null{
 if(!offline||!TRUSTED_ORIGINS.has(origin)||!Number.isSafeInteger(now))return null;
 try{
  const device=deviceStore??localStorage;
  const raw=device.getItem(KEY);
  if(!raw||raw.length>500)return null;
  const value=JSON.parse(raw) as Partial<Lease>|null;
  if(!value||value.v!==3||typeof value.uid!=='string'||!value.uid.trim()||
    typeof value.verifiedAt!=='number'||!Number.isSafeInteger(value.verifiedAt)||
    value.verifiedAt>now||value.verifiedAt<=0||
    now-value.verifiedAt>=OFFLINE_LEASE_MS||
    device.getItem(OWNER)!==value.uid)return null;
  return value.uid;
 }catch{return null;}
}
