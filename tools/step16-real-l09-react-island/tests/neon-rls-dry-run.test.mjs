import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('live RLS runner fails closed without explicit flag and two genuine user JWT inputs',()=>{
 const program='scripts/neon-live-rls-check.mjs';
 const env={...process.env,LI_TEST_JWT_A:'',LI_TEST_JWT_B:''};
 const first=spawnSync(process.execPath,[program],{env,encoding:'utf8'});
 assert.equal(first.status,2);
 assert.match(first.stderr,/No requests made/);
 const second=spawnSync(process.execPath,[program,'--run-synthetic-rls'],{env,encoding:'utf8'});
 assert.equal(second.status,2);
 assert.match(second.stderr,/No requests made/);
});


test('live RLS runner rejects forged-looking malformed JWT locally, without network',()=>{
 const program='scripts/neon-live-rls-check.mjs';
 const env={...process.env,LI_TEST_JWT_A:'not-a-jwt',LI_TEST_JWT_B:'another-not-jwt'};
 const result=spawnSync(process.execPath,[program,'--run-synthetic-rls'],{env,encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/TEST_JWT_INVALID/);
 assert.doesNotMatch(result.stdout,/LI_STEP16_LIVE_RLS_PASS/);
});

test('live RLS runner requires two distinct signed-in test subjects before network',()=>{
 const program='scripts/neon-live-rls-check.mjs';
 const fake=['e30',Buffer.from(JSON.stringify({
  sub:'same-test-user',role:'authenticated',exp:Math.floor(Date.now()/1000)+600
 })).toString('base64url'),'fake-signature'].join('.');
 const env={...process.env,LI_TEST_JWT_A:fake,LI_TEST_JWT_B:fake};
 const result=spawnSync(process.execPath,[program,'--run-synthetic-rls'],{env,encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/TWO_DISTINCT_TEST_USERS_REQUIRED/);
 assert.doesNotMatch(result.stdout,/LI_STEP16_LIVE_RLS_PASS/);
});
