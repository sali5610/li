/** Safe, non-secret OAuth return classifier for the isolated Google-only pilot.
 * Never render raw error_description, code, state, access tokens, or URL.
 * An OAuth redirect never grants access: useSession + server invite/RLS decide.
 */
export type OAuthReturnCode =
 'account_not_linked'|'signup_disabled'|'unable_to_create_user'|
 'unable_to_create_session'|'state_mismatch'|'state_security_mismatch'|
 'no_callback_url'|'invalid_callback_request'|'unknown';

export type OAuthReturnStatus =
 |{kind:'oauth-error';code:OAuthReturnCode}
 |{kind:'no-session'};

const approvedCodes = new Set<OAuthReturnCode>([
 'account_not_linked','signup_disabled','unable_to_create_user',
 'unable_to_create_session','state_mismatch','state_security_mismatch',
 'no_callback_url','invalid_callback_request'
]);

export function classifyOAuthReturn(
 search:string, hasSession:boolean, isPending:boolean
):OAuthReturnStatus|null{
 if(hasSession||isPending)return null;
 const q=new URLSearchParams(search);
 if(q.get('pilot')!=='auth')return null;
 // Only a tiny code allowlist is displayed, never response description/raw URL.
 const code=q.get('error');
 if(code||q.get('oauth')==='failed')
  return {kind:'oauth-error',code:approvedCodes.has(code as OAuthReturnCode)
   ?code as OAuthReturnCode:'unknown'};
 if(q.get('oauth')==='returned')return {kind:'no-session'};
 return null;
}
