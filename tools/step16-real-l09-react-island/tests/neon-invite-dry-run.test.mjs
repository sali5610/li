import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const program='scripts/neon-live-invite-check.mjs';
const jwt=(sub,role='authenticated')=>['e30',Buffer.from(JSON.stringify({
 sub,role,exp:Math.floor(Date.now()/1000)+600
})).toString('base64url'),'fake-signature'].join('.');
function run(args=[],extra={}){
 return spawnSync(process.execPath,[program,...args],{
  env:{...process.env,LI_TEST_JWT_A:'',LI_TEST_JWT_B:'',LI_TEST_JWT_C:'',...extra},
  encoding:'utf8'
 });
}
test('read-only invite proof refuses missing opt-in flag and JWTs before network',()=>{
 for(const args of [[],['--check-invites'],['--run-synthetic-rls']]){
  const result=run(args);
  assert.equal(result.status,2);
  assert.match(result.stderr,/No requests made/);
  assert.doesNotMatch(result.stdout,/LI_STEP16_LIVE_INVITE_PASS/);
 }
});
test('read-only invite proof refuses obviously malformed JWT before network',()=>{
 const result=run(['--check-invites'],{LI_TEST_JWT_A:'bad',LI_TEST_JWT_B:'bad'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/TEST_JWT_INVALID/);
 assert.doesNotMatch(result.stdout,/LI_STEP16_LIVE_INVITE_PASS/);
});
test('read-only invite proof refuses duplicate A/B JWT identities',()=>{
 const same=jwt('same-account');
 const result=run(['--check-invites'],{LI_TEST_JWT_A:same,LI_TEST_JWT_B:same});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/A\/B must be distinct verified users/);
 assert.doesNotMatch(result.stdout,/LI_STEP16_LIVE_INVITE_PASS/);
});
test('read-only invite proof refuses C if same JWT subject as an invited account',()=>{
 const result=run(['--check-invites'],{
  LI_TEST_JWT_A:jwt('account-A'),LI_TEST_JWT_B:jwt('account-B'),LI_TEST_JWT_C:jwt('account-A')
 });
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/C must not be A or B/);
});
test('read-only invite proof refuses anonymous-role JWT',()=>{
 const result=run(['--check-invites'],{
  LI_TEST_JWT_A:jwt('account-A','anonymous'),LI_TEST_JWT_B:jwt('account-B')
 });
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/TEST_JWT_AUTH_OR_EXP_INVALID/);
});
test('read-only invite proof refuses expired JWT',()=>{
 const expired=['e30',Buffer.from(JSON.stringify({
  sub:'A',role:'authenticated',exp:1
 })).toString('base64url'),'fake-signature'].join('.');
 const result=run(['--check-invites'],{LI_TEST_JWT_A:expired,LI_TEST_JWT_B:jwt('B')});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/TEST_JWT_AUTH_OR_EXP_INVALID/);
});
