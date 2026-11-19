# li. (理) Step16 — Real Google identity + invite RLS verification runbook

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
