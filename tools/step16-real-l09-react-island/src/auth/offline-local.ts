/**
 * Local-only offline continuation for the CURRENT browser/PWA session
 * after this SAME device was verified as invited while online.
 *
 * sessionStorage survives page refresh but is normally cleared at the end
 * of a tab/app session. iOS may restore browser sessions across device boots:
 * web apps CANNOT reliably detect a hardware restart. Never promise a
 * restart-exact lock; keep account ownership checks and revalidate on reconnect.
 *
 * This lease is NOT a Google session, JWT, remote permission, or authority to
 * access Neon. Local learning edits stay in the existing durable Dexie outbox.
 */
const KEY='li.offline.active-session.v1';
const LEGACY_KEY='li.offline.recent-invite.v1'; // Invalidate old 12h localStorage leases.
const OWNER='li.sync.local-owner.v1';
const TRUSTED_ORIGINS=new Set(['https://sali5610.github.io','https://li5610.pages.dev']);
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type Lease={v:2;uid:string;verifiedAt:number};

/** Logout / denied invite locks this browser's offline continuation too. */
export function forgetOfflineInvite(sessionStore?:Store,deviceStore?:Store):void{
 try{(sessionStore??sessionStorage).removeItem(KEY);}catch{/* fail closed */}
 try{(deviceStore??localStorage).removeItem(LEGACY_KEY);}catch{/* legacy ignored anyway */}
}

/** Called ONLY after server-side invite verification, never on offline startup.
 * The offline pass lives in sessionStorage, not durable localStorage.
 */
export function rememberOfflineInvite(
 uid:string,now=Date.now(),sessionStore?:Store,origin=location.origin,
 deviceStore?:Store
):boolean{
 if(!TRUSTED_ORIGINS.has(origin)||typeof uid!=='string'||!uid.trim()||
    !Number.isSafeInteger(now)||now<=0)return false;
 try{
  const device=deviceStore??localStorage,session=sessionStore??sessionStorage;
  if(device.getItem(OWNER)!==uid)return false;
  const value=JSON.stringify({v:2,uid,verifiedAt:now} satisfies Lease);
  session.setItem(KEY,value);
  if(session.getItem(KEY)!==value)return false;
  device.removeItem(LEGACY_KEY); // Older durable grants cannot authorize offline.
  return true;
 }catch{return false;}
}

/** Offline only, same owner, SAME browser session; no fixed 12-hour expiry.
 * Closing/restarting Safari or an iPhone PWA normally ends this session,
 * though iOS session restoration is not under web-app control.
 * Online never trusts this token; the real Google session/invite is required.
 */
export function recentOfflineOwner(
 offline:boolean,now=Date.now(),sessionStore?:Store,origin=location.origin,
 deviceStore?:Store
):string|null{
 if(!offline||!TRUSTED_ORIGINS.has(origin)||!Number.isSafeInteger(now))return null;
 try{
  const session=sessionStore??sessionStorage,device=deviceStore??localStorage;
  const raw=session.getItem(KEY);
  if(!raw||raw.length>500)return null;
  const value=JSON.parse(raw) as Partial<Lease>|null;
  if(!value||value.v!==2||typeof value.uid!=='string'||!value.uid.trim()||
    typeof value.verifiedAt!=='number'||!Number.isSafeInteger(value.verifiedAt)||
    value.verifiedAt>now||value.verifiedAt<=0||
    device.getItem(OWNER)!==value.uid)return null;
  return value.uid;
 }catch{return null;}
}
