# SYNC-11–13B: disposable PostgreSQL + PostgREST operation-receipt QA

**Research/CI only. Not a Neon migration. Not a production-ready security approval.**

## What the suite actually proves

GitHub Actions workflow `.github/workflows/step16-idempotency-postgres-ci.yml` runs
`bash tools/step16-real-l09-react-island/tests/postgres-idempotency/ci-only-run.sh`
on an ephemeral `postgres:16-alpine` Docker container. PostgreSQL publishes
**no host port**; the disposable PostgREST container binds HTTP only to
`127.0.0.1:28794` on the isolated GitHub runner, with a CI-only synthetic
HS256 JWT secret. No Neon connection is used; both containers and their
private Docker network are stopped/removed after tests, and SQL asserts
that the active database name is exactly `li_idempotency_ci`.
Use it only inside the isolated PR test runner, never against a cloud database.

The fixture intentionally models the production table's core
`owner_id/item_type/item_id/revision/payload` key and FORCE RLS pattern, a
restrictive invitation check, an isolated NOLOGIN/NOBYPASSRLS SECURITY DEFINER
execution role, and an immutable server-issued operation-receipt ledger.
Client role `authenticated` does not receive direct SELECT/INSERT grants
on the receipt ledger and is not a member of the executor role.

SQL assertions PG-01..13 cover first commit/replay, changed-payload and
stale-version conflicts, original receipt after later writes, private
receipt denial, owner isolation, uninvited/anonymous/revoked attempts,
forced rollback if receipt insert fails, and receipt/state cardinality.
Separate live PostgreSQL sessions PG-14..15 exercise concurrent same-op
replay and different-op stale revision rejection via transaction locks.
PG-16..20 explicitly revoke signed browser direct INSERT/UPDATE/DELETE,
deny PUBLIC RPC execution and prove direct-write attempts fail while owner
SELECT survives. PG-21..24 rehearse **CI-only rollback**: disable RPC,
restore previous grants, preserve all state/receipt rows, confirm the old
authorized write path works inside a rolled-back test transaction and the
uninvited user still cannot write. Total: **24/24 SQL groups**.

Current live Neon still grants authenticated direct INSERT/UPDATE/DELETE;
that grant set is NOT changed by this PR. Revoking it prematurely would
break the existing staging synthetic write/guarded DELETE paths. Review
the cutover dependency at
`docs/neon-idempotency-cutover-review.md` before any real migration.

## Trust boundaries / NOT VERIFIED

- **Fake identity only:** `auth.user_id()` in CI uses a custom GUC for
  deterministic accounts. This is **not** Neon signed JWT verification;
  a direct SQL caller can set the GUC in the fixture. Do not reuse it
  outside this disposable database.
- Invitation fixture uses a CI table rather than Neon managed
  `neon_auth."user"`; real verified-email/revocation behavior remains untested.
- Function ownership, grants and SECURITY DEFINER interaction with
  Neon's actual FORCE RLS and authentication require live signed-token
  tests and a separate security review.
- The SQL schema is intentionally created in the CI database only.
  It is **not** a drop-in production migration, and no existing Neon
  role, table, policy or function was changed.
- Actual HTTP status mapping on **disposable PostgREST 16** is now CI-tested
  with synthetic signed JWTs: see `ci-only-postgrest-http.test.mjs`, 13/13
  PASS in [Actions #44604778071](https://github.com/sali5610/li/actions/runs/44604778071).
  The SQLSTATE mapping 23505→409, 22023→400, 42501→401/403 and
  PGRST202→404 is supported by the [PostgREST official reference](https://docs.postgrest.org/en/stable/references/errors.html).
  This is **not Neon Data API**, not the managed Neon JWT signature or
  production role topology; real signed Neon A/B/C tests remain OPEN.
- Actual Neon migration forward/rollback, long-lived receipt retention,
  account deletion, real Safari network faults and cross-browser persistence
  remain outside this suite.

## Gate

**No cloud learner sync until server migration + signed A/B/C JWT/RLS
negative tests and owner-bound operation receipts pass.** Issue:
https://github.com/sali5610/li/issues/161

Project QA dossier:
https://app.notion.com/p/41d6cf6db72a8198a9ffdd2b9c5e2b5a
