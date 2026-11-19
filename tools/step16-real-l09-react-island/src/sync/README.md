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
