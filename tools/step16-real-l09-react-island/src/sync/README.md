# Step16 · Private learner sync foundation (draft, no live cloud writes)

This source extends the existing stacked L09 React/TS research island; it is **not mounted in the public Vanilla app**. Existing legacy keys and real personal data remain untouched. It is not an auth integration or completed multi-device sync.

## Safety and behavior

- Dexie/IndexedDB writes each local record + matching offline outbox entry in the same transaction. All keys are partitioned by signed-in Neon Auth account ID. A guest must remain separately local-only; this does not encrypt IndexedDB on shared devices.
- The Neon Data API adapter uses a short-lived JWT supplied by future managed Neon Auth integration, HTTPS, and only public `li_user_state`. It never includes `owner_id`, admin tokens, database passwords or API keys. The already deployed PostgreSQL RLS must independently enforce permissions.
- Optimistic revision compare/conditional PATCH prevents silent last-write-wins; stale revisions stay in a conflict queue for a future explicit resolution UI. Deletions are tombstones, not immediate hard deletes. Edit while upload is in flight keeps a pending outbox entry and rebases it to the server revision.
- Reads are paged at 100, limited to the user's RLS-filtered scope. It is a full scan (no realtime/WebSocket, no pagination snapshot); subsequent sync cycles recover changed pages. Current Free quotas may interrupt; offline records remain.
- `syncOnce()` defaults **closed** until TWO conditions are verified: a genuine two-account JWT/RLS A↔B isolation suite, and an explicit private learning-state remote consent decision. Cloud diary is outside the schema and strictly not uploaded. Never flip these flags for production based on a mocked test.
- A successful `syncOnce` result is only an adapter-level result; UI should show "Đã đồng bộ" only after verified authenticated upload+download, not after a local click.
- Logout must unmount account-specific data, clear cached session and prohibit reading the prior account's IndexedDB rows. Device-local records remain unencrypted; add opt-in account-local wipe/export and physical shared-device QA before shipping.

## Remaining gates

Neon Auth sign-in and invite/onboarding, trusted origin/CORS, token subject-to-account binding, **real** A/B cross-user SELECT/INSERT/PATCH/DELETE negative tests, actual network sync + conflicts + token expiry, backup/import completeness, offline iPhone/iPad Safari and device switch, document consent, and Human PO G2/release QA. No Cloudflare/GitHub Pages deployment is triggered by this research branch.

## S177 · Auth session boundary and conflict safety (2026-11-19)

- Neon Auth has an actual trusted-origin allowlist entry for `https://li5610.pages.dev`; localhost remains DISABLED, open registration remains DISABLED. The frontend cannot use it until the official SDK is wired into an approved app build and real test accounts exist.
- `neon-session.ts` accepts the documented Neon Auth `getSession()` + `getJWTToken()` interface (official Neon SDK integration remains pending) and binds API requests to the active user ID. Any switch/sign-out between mount and a request refuses the request; JWT subject also must match the account before network access.
- Every Neon Data API response now requests and checks `owner_id` against the signed-in account. Server-side PostgreSQL RLS is still mandatory and must pass REAL two-user JWT/API negative tests.
- `syncOnce()` reports `pending` when an outbox batch remains, `sign-in-required` on HTTP 401/403 or expired/missing session, `security-error` on cross-owner payload, `conflict` when human resolution is needed, `offline` on network/Free quota failure, and `synced` only after a no-error run with no pending rows/conflicts. Concurrent calls for one device/account share an in-flight Promise.
- `resolveConflict()` requires an explicit learner choice, the freshest authenticated remote row, the same owner and an unchanged conflicted op ID. Choices: `keep-local` rebases the local outbox for a later conditional retry; `use-remote` accepts that remote revision only on deliberate choice. A real conflict comparison UI remains NOT built.
- Current tests use synthetic JWT and fake-indexeddb; NEVER label them signed-in production privacy or end-to-end device sync. Cloud upload consent and real JWT/RLS proof remain CLOSED. No production route, user records, personal diary, deployment or paid service changed by this branch.
