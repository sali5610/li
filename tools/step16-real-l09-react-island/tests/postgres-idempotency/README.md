# SYNC-11: disposable PostgreSQL operation-receipt QA

**Research/CI only. Not a Neon migration. Not a production-ready security approval.**

## What the suite actually proves

GitHub Actions workflow `.github/workflows/step16-idempotency-postgres-ci.yml` runs
`bash tools/step16-real-l09-react-island/tests/postgres-idempotency/ci-only-run.sh`
on an ephemeral `postgres:16-alpine` Docker container. It publishes **no network
port**, uses **no Neon connection**, deletes the database when the container stops,
and checks that the active database name is exactly `li_idempotency_ci`.
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
- HTTP status mapping through the real PostgREST/Data API, migration
  forward/rollback, long-lived receipt retention, account deletion,
  network-fault retries in Safari, and cross-browser data persistence
  remain outside this suite.

## Gate

**No cloud learner sync until server migration + signed A/B/C JWT/RLS
negative tests and owner-bound operation receipts pass.** Issue:
https://github.com/sali5610/li/issues/161

Project QA dossier:
https://app.notion.com/p/41d6cf6db72a8198a9ffdd2b9c5e2b5a
