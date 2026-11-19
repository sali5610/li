/**
 * ONT-04B2b1 — route presence is NOT publication authorization.
 * This module is intentionally incapable of approving navigation: no server
 * assertion verification, RLS check, invited account, release manifest or
 * signed user permission exists in this source-only pilot.
 * 
 * Do not replace a backend invitation/authorization gate with this function.
 */
const KNOWN_PROFILE='li-ONT04B2b1-native-route-audit-only';
export function inspectSearchRoute(manifest,canonicalLessonId) {
 if(manifest?.profile!==KNOWN_PROFILE || manifest?.scope!=='DRAFT_NON_NAVIGABLE_CANDIDATES') {
  return Object.freeze({
   state:'invalid_route_audit',nativeCodeKnown:false,
   navigationPermitted:false,deepLink:null,action:null,
   why:'Untrusted or unsupported route-audit scope; deny navigation.'
  });
 }
 if(typeof canonicalLessonId!=='string'||!/^L\d{2}-\d+-\d+$/.test(canonicalLessonId)){
  return Object.freeze({
   state:'invalid_canonical_id',nativeCodeKnown:false,
   navigationPermitted:false,deepLink:null,action:null,
   why:'Malformed or missing canonical lesson ID.'
  });
 }
 const item=manifest.candidates?.find(x=>x.canonicalLessonId===canonicalLessonId);
 if(!item) {
  return Object.freeze({
   state:'no_curated_route_candidate',nativeCodeKnown:false,
   navigationPermitted:false,deepLink:null,action:null,
   why:'No source-audited route candidate in this limited fixture; unknown remains unknown.'
  });
 }
 return Object.freeze({
  state:'native_code_present_release_unverified',
  nativeCodeKnown:item.nativeCode==='ROUTE_AND_MARKUP_PRESENT',
  navigationPermitted:false,deepLink:null,action:null,
  why:'Native code mapping is research evidence ONLY. Publishing, rights, approved route, real Google invite and Neon RLS remain unverified.',
  canonicalLessonId:item.canonicalLessonId,
  sourcePath:item.markupPath,
  blockers:Object.freeze([
   'approved_versioned_publication_manifest_absent',
   'rights_release_gate_unverified',
   'real_signed_user_google_invitation_and_neon_rls_not_tested',
   'G2_mobile_Safari_accessibility_and_react_parity_open',
   'human_release_approval_absent'
  ])
 });
}
export function annotateSearchResult(manifest,result){
 if(!result||typeof result!=='object')throw Error('Invalid read-only search result');
 const id=typeof result.id==='string'&&result.id.startsWith('lesson:')
  ?result.id.slice('lesson:'.length):'';
 const audited=inspectSearchRoute(manifest,id);
 // Deep copy only the safe, existing public search result fields; do not
 // attach route keys, browse URL, session, JWT, or login metadata.
 return {...result,publicationAudit:audited};
}
