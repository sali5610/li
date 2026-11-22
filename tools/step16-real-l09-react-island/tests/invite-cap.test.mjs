import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Source-contract checks only. The migration must also pass real PostgreSQL
// integration checks on a disposable Neon branch BEFORE a production rollout.
const migration=readFileSync(
  new URL('../../../db/migrations/0004_invite_cap_30.sql',import.meta.url),
  'utf8'
);

test('cap counts only unrevoked approvals and aborts pre-existing over-cap',()=>{
 assert.match(migration,/FROM public\.li_invited_emails WHERE revoked_at IS NULL\) > 30/);
 assert.match(migration,/LI_INVITE_CAP_PREEXISTING_OVER_30/);
 assert.doesNotMatch(migration,/DELETE FROM public\.li_invited_emails/i);
});

test('all insert and reactivation paths are checked within the transaction',()=>{
 assert.match(migration,/CREATE TRIGGER li_invite_cap_30_enforced\s+AFTER INSERT OR UPDATE ON public\.li_invited_emails/);
 assert.match(migration,/WHEN \(NEW\.revoked_at IS NULL\)/);
 assert.match(migration,/pg_advisory_xact_lock\(5610, 30\)/);
 assert.match(migration,/count\(\*\) FROM public\.li_invited_emails WHERE revoked_at IS NULL\) > 30/);
 assert.match(migration,/LI_INVITE_CAP_REACHED_30/);
});

test('owner approval reports approved/remaining count, idempotency and strict cap',()=>{
 assert.match(migration,/CREATE FUNCTION public\.li_approve_invite\(p_email text\)/);
 assert.match(migration,/RETURNS TABLE \(approved_accounts integer, remaining_accounts integer, newly_approved boolean\)/);
 assert.match(migration,/IF NOT was_active AND total >= 30 THEN/);
 assert.match(migration,/ON CONFLICT \(email\) DO UPDATE SET revoked_at = NULL/);
 assert.match(migration,/RETURN QUERY SELECT total, 30 - total, NOT was_active/);
});

test('approval remains admin-only: no browser or shared role gains write/execute',()=>{
 assert.match(migration,/SECURITY INVOKER/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public\.li_approve_invite\(text\) FROM PUBLIC, anonymous, authenticated;/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public\.li_invite_cap_guard\(\) FROM PUBLIC, anonymous, authenticated;/);
 assert.doesNotMatch(migration,/GRANT\s+(?:EXECUTE|INSERT|UPDATE|ALL)\s+.*\s+TO\s+(?:authenticated|anonymous)/i);
 assert.doesNotMatch(migration,/\b(?:CREATE|ALTER)\s+POLICY\b/i);
 assert.doesNotMatch(migration,/DATABASE_URL|NEON_DATABASE_URL|client_secret|password\s*=/i);
});
