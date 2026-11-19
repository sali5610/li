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
