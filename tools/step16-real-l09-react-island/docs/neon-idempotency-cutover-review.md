# SYNC-12 — Neon migration security review & reversible cutover gate

**Decision status: PROPOSED / NOT APPROVED / NOT DEPLOYED.** Issue [#161](https://github.com/sali5610/li/issues/161). This is a review plan **not an executable Neon migration**. The only runnable DDL lives under `tests/postgres-idempotency/ci-only-*`, guarded by disposable database name `li_idempotency_ci` and CI-only mock identity.

## Verified current Neon facts (read-only, 2026-11-20)

- `public.li_user_state` currently has `(owner_id,item_type,item_id)` key, `revision`, payload, `deleted_at`. `owner_id DEFAULT auth.user_id()` (extension function owned by `cloud_admin`).
- `public.li_user_state` has enabled **FORCE ROW LEVEL SECURITY**, authenticated owner policies and restrictive `public.li_is_invited()`. The invite function is a SECURITY DEFINER owned by `li_owner`.
- **Authenticated has direct SELECT, INSERT, UPDATE, DELETE grants on this table today.** This is legitimate for the *existing* signed QA flow but would **bypass a future opId receipt RPC**. Owner RLS protects cross-user rows; it does not force writes through an idempotent operation ledger.
- `public.li_sync_operation_receipts` is absent, and the proposed `li_sync_executor` role is absent. No RPC was installed.
- Current GitHub Pages staging pins `dfa87c67223fdea76b94b97b592a991785b42380`. `NeonUserApi.write` uses direct REST POST/PATCH, and guarded QA cleanup uses signed REST DELETE. **Revoking live authenticated DML before migrating both paths would break QA flows.**
- Production learner cloud sync remains OFF. No live Neon schema or user data was changed.

## Recommended target contract (subject to security gate)

1. The signed browser may **SELECT only its own invited state**, and may **EXECUTE** a specifically granted atomic edit RPC. Browser role cannot directly INSERT/UPDATE/DELETE `li_user_state`, or read/write the receipt ledger, or assume the executor role.
2. An isolated NOLOGIN NOBYPASSRLS executor owns the restricted SECURITY DEFINER function (exact privileges, inherited membership and special Neon extension interactions must be independently verified). Signed owner identity must be resolved by **real** `auth.user_id()`, not a caller-provided `owner_id`.
3. The RPC validates invite status, UUID operation key, type/id/size/revision, hashes the canonical request, serializes by owner-opId and owner-item, and commits owner-scoped CAS + receipt **atomically**. Replays of an unchanged op return the *original* acknowledged version. Another operation on a stale base must conflict.
4. **Existing direct DELETE users need a replacement first.** For product deletion, use a separate account-deletion workflow with an explicit privacy/retention decision. For QA-only removal, design a narrow, signed, synthetic-ID-specific cleanup function or stop offering live QA deletion after the trial is closed. **Do not re-open unrestricted DELETE** to solve testing friction.
5. Receipt retention: do not prune while clients can retry an old pending op. Account erasure must purge owner-scoped state **and** receipts through a reviewed, privileged workflow. Payload fingerprints may still be personal metadata; do not include raw payload in the receipt ledger unnecessarily.
6. HTTP error mapping is a gate, not assumed: real Neon Data API must demonstrate proper 409 on stale/opId replay misuse, 401/403 on revoked/invalid signer, 404 RPC absent (client fail closed), 2xx applied/replayed ACK. Header/role forwarding and PostgREST schema exposure require exact live-version validation.

## Phase-by-phase safe rollout (NO phase authorized yet)

| Stage | Action | Mandatory evidence | Stop condition |
| --- | --- | --- | --- |
| P0 Preflight | Read-only inventory `pg_roles`, `pg_policies`, `pg_proc`, `role_table_grants`, app client paths and known QA flows. Document no real learner data writes. | Snapshot + exact pinned source SHA | Identity/invite/role ownership drift |
| P1 Dry run | Rehearse additive table/function/RLS on **disposable** PG, negative spoof/direct write and concurrency, schema teardown. | CI 24/24 (synthetic GUC), plus test limitations | Any CI failure |
| P2 Signed integration | With explicitly approved isolated environment and no unplanned cost, test real Neon Auth signed A/B/C, verified invite/revoke and RLS negative access. | Actual signed JWT, Data API response evidence; not credential contents | Owner leak, role bypass, unauthorized ACK |
| P3 Compatibility | Migrate the old writer and guarded QA deletion/erasure flow to suitable narrow endpoints and tested UI/SDK, with **default remote sync OFF**. | Browser and CI paths, successful cleanup/recovery | Existing staging QA data stranded |
| P4 Controlled migration | After Human PO security/schema approval, add receipt ledger, executor permissions, function + explicit RPC grant. **Only after P3** revoke `authenticated` direct DML and validate RLS. | Verified migration checksum, privileges and atomic behavior on approved target | Any regression, mismatch or uncontrolled spend |
| P5 Release | Separate G4 and explicit cloud sync permission for private users; Cloudflare remains gated. | Signed system tests, privacy backup/erase and iOS risk decision | Missing evidence; no release |

## Rollback contract

**Immediately:** close remote sync feature gate and revoke RPC execution. Do not silently replay pending operations or delete receipts.

**Compatibility restoration (explicit rollback approval):** restore the exact previously recorded INSERT/UPDATE/DELETE grants only if the older staging writer/cleanup must run, with awareness this intentionally re-opens direct writes and disables the idempotency guarantee. Re-verify RLS and invited-only enforcement.

**Preservation:** retain all pre-existing state and receipt ledger rows; do **not** drop receipts while any queued retry or user account might depend on their acknowledgement. Schedule later schema removal only after separate data retention/erasure decision and backup. Verify rollback does not promote production sync.

The disposable PG CI tests `PG-21..24` rehearse this **ACL-only functional rollback**, NOT a full real-Neon migration/reversal or signed JWT behavior.

## Evidence and unresolved gates

- [Draft PR #159](https://github.com/sali5610/li/pull/159) has an unmounted client adapter and disposable SQL fixture, not a live migration.
- [PostgreSQL 24/24 CI](https://github.com/sali5610/li/actions/runs/44601340487): forced RLS, atomic receipts, concurrent writes, **direct DML denial**, public EXECUTE denial, simulated ACL rollback without state/receipt loss. Fixture account ID uses a **spoofable test-only GUC**.
- [SYNC dossier](https://app.notion.com/p/41d6cf6db72a8198a9ffdd2b9c5e2b5a), [LL-23](https://app.notion.com/p/41d6cf6db72a815c9dd0c5c8f8e88b6d).
- **OPEN**: production-compatible schema migration/checksum, real Neon signed JWT/RLS and invite revocation, actual SQL role capabilities, HTTP status mapping, portable rollback, end-user export/erase/restore and iPhone network outage.
- **No Cloudflare deploy and no Neon DDL/DML is authorized by this document.**
