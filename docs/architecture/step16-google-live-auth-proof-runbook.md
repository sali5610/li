# li. (理) Step16 — Real Google identity + invite RLS verification runbook

## S206 CURRENT SUPERSEDING STATUS — 2026-11-19 (auth invite error diagnosis)

> This section supersedes the earlier **historical State, Release-blocking account-linking risk and old acceptance-table rows below**. Leave the historical procedure for audit only; do not act on claims that both Google identities are still unverified.

- **Live iPhone Safari:** Both approved Google emails have signed in and shown their identity. At 21:49 ICT owner screenshot still shows generic invite RPC failure, access locked and cloud sync OFF.
- **Live Neon read-only status:** exactly 2 Google-linked/verified users; 2 active owner invites; 1 session at inspection time; 0 learner-state rows. The previously pre-created empty credential-only user stubs were already removed with PO approval; do not repeat that deletion. Neon Data API is ACTIVE; `authenticated` may EXECUTE `public.li_is_invited()`; SECURITY DEFINER owner `li_owner` may SELECT required tables. This does NOT prove any genuine user JWT or browser POST/RPC/CORS success.
- **GitHub [Draft PR #145](https://github.com/sali5610/li/pull/145):** safe VI/EN invite error codes. Use only signed JWT from Better Auth JWT plugin `authClient.token()` (GET /token). The `getSession().data.session.token` field is **opaque session/cookie identifier** and must never be passed to Data API. Branch deliberately contains no production `site/` change or Cloudflare workflow change.
- **No preemptive deployment:** the existing manually dispatched Cloudflare workflow is still source-pinned to an older SHA. Any new Auth-only build requires separate PO approval after draft CI. No RLS relaxation, cloud sync, new email-password workflow, paid service or automatic deploy.
- **Raw secrets prohibited:** Never request/put JWT, tokens, callback URL/query, session IDs, raw browser network response bodies or private emails in screenshots, GitHub, Notion or chat. `INV-*` codes below contain no user/token data.

| Safe owner-visible code | Diagnostic meaning (not authorization) |
|---|---|
| `INV-JWT-401`, `INV-JWT-403`, `INV-JWT-429`, `INV-JWT-5XX` | JWT-plugin HTTP status; investigate session/cookies/Neon service |
| `INV-JWT-FETCH`, `INV-JWT-MISSING` | Cannot obtain three-segment signed JWT candidate |
| `INV-JWT-BIND` | JWT cannot be parsed as expected or its `sub` does not match current signed-in account |
| `INV-RPC-401`, `INV-RPC-403`, `INV-RPC-404`, `INV-RPC-5XX` | JWT-backed invitation RPC returned an HTTP error |
| `INV-RPC-FORMAT` | RPC returned unexpected result instead of literal Boolean |
| `INV-NET-OR-CLIENT` | Browser request failed before usable HTTP response; may be CORS/network/redirect |
| `INV-SESSION`, `INV-CONFIG`, `INV-UNKNOWN` | Session, endpoint config, or unknown safe failure |

After a future **explicitly approved manual Auth-only release**, reload the real iPhone pilot once, capture ONLY the safe `INV-*` code, then choose one server or frontend fix based on the exact stage. If the RPC returns literal `true`, verify A/B and uninvited C strict RLS on genuine signed JWTs before permitting any remote learner data.

Official Neon SDK source: https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/neon-auth.ts ; Better Auth JWT plugin: https://better-auth.com/docs/plugins/jwt ; session-token distinction: https://github.com/neondatabase/neon-js/blob/main/CLAUDE.md .

---

**State, 2026-11-19:** The owner-approved migration 0002 is **already active** on Neon Free main. Exactly two invitations are active; both invited precreated Neon Auth users are presently `emailVerified=false`, have ZERO Google provider links and ZERO sessions (Neon SQL read-back, only aggregated counts). UI remains isolated in stacked draft PR #124; no Cloudflare deploy, real OAuth, signed A/B test or learner data sync.

## Release-blocking account-linking risk

Neon Managed Better Auth has a `google` shared OAuth provider. The two precreated test records were provisioned without a password or verified email. Standard Better Auth documentation says implicit linking can occur when an OAuth provider verifies the matching email, **but linking does not automatically update an existing local user's `emailVerified`**. Since li.'s server-side `li_is_invited()` additionally requires `neon_auth.user.emailVerified=true`, a user might successfully authenticate but be denied li. membership. Do **not** bypass this by writing `emailVerified=true` with administrator SQL. Verify via the provider's real flow/Neon official verification before changing a high-stakes identity policy.

Sources:
- Better Auth / Users & accounts: https://www.better-auth.com/docs/concepts/users-accounts#account-linking
- Neon / Managed Auth guide: https://neon.com/docs/auth/overview

## Safety gates

1. No production release, Cloudflare build, OAuth trust-origin change, extra test email account or paid upgrade without human signoff. Existing production is still Vanilla; the draft AuthPanel/Google screen is not exposed at `li5610.pages.dev`.
2. If the PO authorizes a narrowly-scoped manual Auth pilot release, enable the research route on the existing trusted origin only after reviewing the PR, with clear "research only"/"sync disabled" signage. Otherwise, an approved staging hostname + trusted origin would be a separate config decision. No localhost credentialed workaround.
3. Check user A/B signed in with **their own Google accounts**, actual `neon_auth.account.providerId='google'` linked to correct `neon_auth.user.id`, and the verified-email state. Note if Neon creates a different ID, a duplicate user or error `account_not_linked`; stop and resolve **before** allowing any data migration.
4. Use an isolated non-logging environment to run `node scripts/neon-live-invite-check.mjs --check-invites` with short-lived authentic A/B JWT environment variables. Optional C must be another user-controlled Gmail **not invited**. This is **READ-ONLY**: RPC checks A/B true, unauthenticated and tampered JWT blocked, optionally C false/private SELECT blocked. **No token/OTP/callback URL copied to ChatGPT, Notion, GitHub or screenshots.**
5. Only after positive invite checks, run the independent opt-in `neon-live-rls-check.mjs --run-synthetic-rls` on signed A/B JWTs; validates cross-user read/write/delete, forged owner ID and durable cleanup. Ensure synthetic cleanup success and that `syncOnce` still refuses cloud writes until explicit state-consent gate.
6. Revoke/restore test uses admin-only `li_invited_emails.revoked_at`. This is a real access-affecting operation and requires separately authorized reversible test scope; do not perform it on primary learner accounts without permission. Verify old sessions denied by database after revoke. Offline records already cached on the device cannot be remotely erased reliably.
7. iPhone/iPad Safari, logout/login as a different account, resume from background and online reconnection should trigger **fresh membership checks**. React AuthPanel now reruns invite checks on focus, visibility and reconnect, but this remains a compiled draft — not real browser proof.
8. If all gates pass, request distinct manual permission to merge/release the app experience. Do not silently open remote sync; private diary stays local until its own gate.

## API proof command (run only with real signed JWTs)

```sh
# Set LI_TEST_JWT_A / LI_TEST_JWT_B securely in the local ephemeral environment.
# Optionally set LI_TEST_JWT_C for a deliberately uninvited user-controlled account.
node tools/step16-real-l09-react-island/scripts/neon-live-invite-check.mjs --check-invites

# Separate, WRITE-THEN-CLEANUP synthetic-only owner RLS suite:
node tools/step16-real-l09-react-island/scripts/neon-live-rls-check.mjs --run-synthetic-rls
```

No JWT, secret, real email address or sensitive record should be pasted into a command log, CI variable, GitHub issue or Notion. The first script does **not** prove Google provenance on its own; corroborate the Neon Auth `account` provider binding from admin-only SQL.

## Expected read-back and acceptance status

| Gate | Current state |
|---|---|
| Invite-only 0002 applied on Neon main | PASS (live schema/catalog) |
| Exactly two owner-approved active invites | PASS (2, no other addresses) |
| Both users Google-linked + verified | BLOCKED: zero provider links and zero verified users |
| Real OAuth on approved origin | NOT TESTED (draft not released) |
| Signed invite A/B, optional uninvited C | NOT TESTED (no genuine session JWTs) |
| Live A/B owner-only RLS writes and cleanup | NOT TESTED |
| React resume/revoke behavior | Compiles locally; NOT live-tested |
| Cloud sync enabled | NO: defaults closed |
| Manual release / paid upgrade | NO / NO |
