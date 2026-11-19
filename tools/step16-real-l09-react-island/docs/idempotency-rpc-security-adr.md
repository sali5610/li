# Step16 Issue 161 — operation ID and atomic receipt contract (PROPOSED)

Status: RESEARCH-ONLY, NOT DEPLOYED, 2026-11-20. G3 In Progress. Disposable PostgreSQL 16 CI contract PASSED; signed Neon RLS migration is still NOT RUN.

## Verified existing constraints

- public.li_user_state is keyed by owner_id/item_type/item_id, carries revision and payload, and has NO opId.
- owner_id defaults to auth.user_id(). Existing table has FORCE ROW LEVEL SECURITY, owner-scoped role authenticated policies, and a RESTRICTIVE li_is_invited() guard.
- The new RPC li_apply_user_edit_v1 does NOT exist on current Neon. A missing RPC must be a hard security-error, never fallback to direct legacy POST/PATCH.
- Current client outbox has durable opId; legacy NeonUserApi.write does not send it to server. Simulated lost ACK retains local edit but triggers revision conflict on replay.

## Proposed atomic RPC protocol

Endpoint: POST /li/rest/v1/rpc/li_apply_user_edit_v1 with signed JWT; request fields p_op_id (UUID), p_item_type, p_item_id, p_base_revision, p_payload and p_deleted_at. NEVER accept caller-supplied owner_id.

Response: one JSON object with protocol li-opid-v1, op_id equal to the request UUID, kind applied or replayed, and item containing owner_id, item_type, item_id, original accepted revision, payload, original changed_at and deleted_at. A replay must return the ORIGINAL ACK even if a subsequent legitimate edit has advanced the row revision.

Errors: HTTP 409 on a genuinely stale different operation or reused opId with different parameters; 401/403 on invalid/revoked user; 404 RPC absent -> fail closed; malformed or wrong-owner ACK -> fail closed. Browser stores no JWT in IndexedDB. Default sync privacy gates remain false.

## Server candidate and security gate

Preferred: one transaction function + owner-scoped immutable receipt ledger with UNIQUE(owner_id, op_id), item identity, base revision, canonical request SHA-256, accepted revision and original timestamp. Avoid copying private lesson payload into receipts; retain receipts until an explicitly designed account-deletion retention policy.

Transaction steps: (1) derive signed auth.user_id() and verify li_is_invited() (2) validate keys/revision/JSON/opId (3) serialize same-owner same-opId requests by a transaction-scoped lock (4) if receipt exists, verify exact canonical request hash and return original ACK or reject forged reuse (5) otherwise revision-CAS INSERT or UPDATE state for this owner and item (6) atomically persist immutable receipt and state write (7) return the ACK. Any error rolls back both. Distinct opIds on stale revision must still conflict.

SECURITY REVIEW BLOCKER: Existing table FORCE RLS and restrictive invited-only policy means SECURITY DEFINER ownership/role may bypass or be denied by policies in nonobvious ways. Do not widen policy, grant public RPC access or expose a client-writable receipts table. Before a real migration, prove function owner, hardened search_path, signed auth.user_id binding, li_is_invited checks, receipt grants, RLS enforcement, transaction concurrency and role isolation against the actual Neon auth model. SECURITY INVOKER alone would require receipt write privileges and could allow forging a supposed server acknowledgement.

Rejected shortcuts: one last_op_id field loses older replay proof after newer writes; client-side payload/revision equality cannot prove which operation committed.

## Evidence versus open gates

- IMPLEMENTED on Draft PR #159: a separate fail-closed opt-in NeonIdempotentPilotApi class and Node mock RPC contract tests. No caller in product/AuthPanel uses this class.
- TESTED: 11 simulated Node RPC contract cases for opId replay, stale/different op, invalid JWT/ACK/missing RPC and default closed gate; **15/15 isolated PostgreSQL 16 transaction/RLS assertions** for receipt insertion/rollback, user isolation, invited/revoked mock identities and two-connection concurrency (CI run #44598258674).
- NOT RUN: real Neon schema/RPC install, Neon signed JWT and invite/RLS integration A/B/C, genuine HTTP lost ACK, Safari eviction, migration/rollback, account deletion and production release. CI auth.user_id uses a spoofable **test-only GUC**, NOT a signed JWT.
- Do not enable real learner cloud sync before a separate RLS-safe schema/RPC implementation and independent security/CI acceptance. Do not mutate Neon or deploy Cloudflare for this research.

## Disposable PostgreSQL evidence and limits

- GitHub Actions #44598258674, PR-only at exact code SHA 6de48bc1de76dcdb4119a47db81b28eb663619a8: PostgreSQL 16-alpine container with no published port, synthetic tables and mock authenticated roles, 15/15 PG CI PASS. Test fixtures are under tests/postgres-idempotency/ and refuse any database not named li_idempotency_ci.
- FORCE RLS and restrictive owner/invite-style policies were modeled, with a NOLOGIN/NOBYPASSRLS SECURITY DEFINER executor and no direct authenticated receipt grants. This shows the candidate transaction and role pattern on disposable PostgreSQL, **not** the same privileges/verified managed JWT/RLS behavior as live Neon.
- Real Neon existing table/role/policy read only; no production migration, receipt table, API RPC, Cloudflare build, or learner data mutation.

## Traceability

GitHub Issue: https://github.com/sali5610/li/issues/161
Notion SYNC: https://app.notion.com/p/41d6cf6db72a8198a9ffdd2b9c5e2b5a
Learning LL-23: https://app.notion.com/p/41d6cf6db72a815c9dd0c5c8f8e88b6d