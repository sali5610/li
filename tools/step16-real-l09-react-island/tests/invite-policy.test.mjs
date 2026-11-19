import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('../../db/migrations/0002_invite_only_access.sql','utf8');

test('invite migration does not publish any real learner email or privileged credential',()=>{
 assert.doesNotMatch(migration,/@gmail\.com|password\s*=|client_secret\s*=/i);
});
test('only database administrators can modify the invitation allowlist',()=>{
 assert.match(migration,/REVOKE ALL ON public\.li_invited_emails FROM PUBLIC, anonymous, authenticated;/);
 assert.doesNotMatch(migration,/GRANT (?:INSERT|UPDATE|DELETE|ALL) ON public\.li_invited_emails TO authenticated/);
});
test('membership is computed from server-side verified identity and revocation, not user input',()=>{
 assert.match(migration,/verified_user\.id::text = auth\.user_id\(\)/);
 assert.match(migration,/verified_user\."emailVerified" IS TRUE/);
 assert.match(migration,/allowed\.revoked_at IS NULL/);
 assert.match(migration,/SECURITY DEFINER/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public\.li_is_invited\(\) FROM PUBLIC, anonymous/);
});
test('each private table has a restrictive policy independent of owner-only policies',()=>{
 for(const table of ['li_user_state','li_learning_events']){
  assert.match(migration,new RegExp('CREATE POLICY '+table+'_invited_only ON public\\.'+table+'\\s+AS RESTRICTIVE FOR ALL TO authenticated'));
  assert.match(migration,/USING \(\(SELECT public\.li_is_invited\(\)\)\)/);
  assert.match(migration,/WITH CHECK \(\(SELECT public\.li_is_invited\(\)\)\)/);
 }
});
