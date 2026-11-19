# li. Step16 — Google sign-in + owner-controlled email invitations (DRAFT)

**Decision input (Human Product Owner, 2026-11-19):** No password setup or OTP onboarding. Google sign-in only. Only specific email addresses explicitly invited by the owner may **use li.** A friend cannot self-approve. Cost must remain 0 VND.

**Status:** CANDIDATE CODE in draft PR #124 only. Never describe this as deployed, end-to-end verified or security-approved until the live Google+JWT+RLS tests pass.

## Three separate security layers

1. **Identity — Neon Managed Better Auth Google OAuth.** The existing Neon project has a `google` shared provider configured. The React draft renders one Google button, never a password form. OAuth sign-in merely establishes who the person is. **Important:** The email/password `allow_sign_up=false` setting must NOT be assumed to disable Google OAuth user creation; live provider behavior and pre-existing-account linking need testing. We do not promise that unauthorized visitors cannot create an *Auth identity*.
2. **Membership — server-side verified-email allowlist.** Migration `db/migrations/0002_invite_only_access.sql` adds `li_invited_emails` and `li_is_invited()`. Membership requires the active Neon Auth user ID and its **verified** database email matching an exact, unrevoked approved email; it never trusts a React boolean, a URL email parameter or client-supplied `owner_id`. Allowlist rows are not browsable/editable via authenticated or anonymous Data API.
3. **Private data — restrictive RLS plus existing owner-only RLS.** Both `li_user_state` and `li_learning_events` receive `RESTRICTIVE` policies. All row reads/writes must pass **both** member allowlist and owner check. A valid JWT from an uninvited Google account must fail. Revoking membership must block the next server Data API request even if the old JWT is unexpired. The React `/rpc/li_is_invited` check improves UX but is NOT the security boundary; table RLS is.

## Invitation and revocation operations (admin-only)

- **Invite:** owner explicitly names a verified recipient email; a trusted database administrator inserts its normalized lowercase address into `li_invited_emails` or clears `revoked_at`. Never ship the list, secrets, emails or an admin key in source, client-side JS, logs or a publicly linked Notion document.
- **Sign in:** the invited person opens the authorized app origin, clicks **Continue with Google**, chooses that exact Google account, then the server checks membership. Different email = denied.
- **Revoke:** admin sets `revoked_at=now()`. No user-level table or function may grant/revoke membership. Cloud permissions should be rescoped if hosting is protected too.
- **Owner admin UI:** Not yet built. If added later, use a verified owner-only server endpoint; NEVER issue administrator SQL or service-role API keys from React.
- **Initial setup:** exactly two Human-PO-supplied test addresses were already provisioned as Neon Auth users. They are NOT added to the proposed allowlist until the reviewed migration is applied, and pre-created user linking with Google is untested. No emails appear in this repository.

## App shell versus data privacy

Cloudflare Pages serves static HTML/JS/assets publicly **unless edge access controls protect it**. The invite RPC + Neon RLS prevent uninvited users from using protected functionality and accessing private records; they do **not** hide public static bundles or published academic content.

If the PO means *literally nobody uninvited can even load the app URL / static learning content*, a separate Cloudflare Access policy covering the exact `li5610.pages.dev` hostname and preview domains is required; official docs: https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain . This may introduce an additional identity step, and has **not** been activated or approved. Preserve manual-only Cloudflare release and zero-cost policy.

## Before permission to release

- [ ] Independent SQL/schema/security review of migration 0002 and actual provider identity linking
- [ ] Human-approved dry run on isolated Neon branch, THEN explicit approval to apply migration to default branch
- [ ] Admin-only seed of exactly the approved test email addresses, without placing them into GitHub or Notion
- [ ] Real Google sign-in at approved origin, with 2 invited accounts, 1 uninvited and 1 revoked case
- [ ] Signed JWT A/B/C negative RLS tests: SELECT, INSERT forged owner, UPDATE/PATCH, DELETE on both private tables; verify synthetic cleanup
- [ ] Check that client RPC shows denied on error/uninvited, while table RLS independently rejects all writes
- [ ] Verify account switch/logout, stale session, offline cache, multi-device privacy boundaries and iPhone/iPad Safari
- [ ] Privacy: revocation cannot reliably remotely erase data already cached offline on someone's device; describe this limit to the owner
- [ ] Explicit remote learner-state consent and separate diary-consent gate before first sync
- [ ] G2 visual gate + owner manual release approval; no paid service, no automatic deploy

**No deploy, live migration, approved email seed or real login has occurred as part of this draft.**
