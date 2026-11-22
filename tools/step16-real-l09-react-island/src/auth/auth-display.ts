/**
 * The signed-in React app is invite-only. While restoring a managed session,
 * show the existing neutral boot cover, NEVER a sign-in card flash.
 * Settled signed-out, denied, expired or failed sessions still show Auth UI.
 * This is presentation-only: it grants no access and does not read cached JWTs.
 */
export function deferAuthScreen(
 integrated:boolean,pending:boolean,offlineGrant:boolean,
 accountId:string|null,access:'checking'|'granted'|'offline'|'denied'|'error',
 ownerReady:boolean
):boolean{
 if(!integrated)return false;
 if(pending&&!offlineGrant)return true;
 return Boolean(accountId)&&
  (access==='checking'||((access==='granted'||access==='offline')&&!ownerReady));
}
