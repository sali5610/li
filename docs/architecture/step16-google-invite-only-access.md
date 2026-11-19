# li. Step16 — Google sign-in + owner-controlled email invitations (DRAFT)

**Decision input (Human Product Owner, 2026-11-19):** No password setup or OTP onboarding. Google sign-in only. Only specific email addresses explicitly invited by the owner may **use li.** A friend cannot self-approve. Cost must remain 0 VND.

**Status (2026-11-19):** Invitation migration 0002 WAS applied to the existing Neon Free main DB after successful isolated-branch test; exactly two PO-approved email invitations WERE seeded and read back (2/2 active, 0 unexpected). GitHub PR #124 and the Google React UI remain DRAFT/UNDEPLOYED. No genuine Google login, signed A/B/C JWT RLS or Safari verification yet. Do not claim production readiness.

## Three separate security layers

1. **Identity — Neon Managed Better Auth Google OAuth.** The existing Neon project has a `google` shared provider configured. The React draft renders one Google button, never a password form. OAuth sign-in merely establishes who the person is. **Important:** The email/password `allow_sign_up=false` setting must NOT be assumed to disable Google OAuth user creation; live provider behavior and pre-existing-account linking need testing. We do not promise that unauthorized visitors cannot create an *Auth identity*.
2. **Membership — server-side verified-email allowlist.** Migration `db/migrations/0002_invite_only_access.sql` adds `li_invited_emails` and `li_is_invited()`. Membership requires the active Neon Auth user ID and its **verified** database email matching an exact, unrevoked approved email; it never trusts a React boolean, a URL email parameter or client-supplied `owner_id`. Allowlist rows are not browsable/editable via authenticated or anonymous Data API.
3. **Private data — restrictive RLS plus existing owner-only RLS.** Both `li_user_state` and `li_learning_events` receive `RESTRICTIVE` policies. All row reads/writes must pass **both** member allowlist and owner check. A valid JWT from an uninvited Google account must fail. Revoking membership must block the next server Data API request even if the old JWT is unexpired. The React `/rpc/li_is_invited` check improves UX but is NOT the security boundary; table RLS is.

## Invitation and revocation operations (admin-only)

- **Invite:** owner explicitly names a verified recipient email; a trusted database administrator inserts its normalized lowercase address into `li_invited_emails` or clears `revoked_at`. Never ship the list, secrets, emails or an admin key in source, client-side JS, logs or a publicly linked Notion document.
- **Sign in:** the invited person opens the authorized app origin, clicks **Continue with Google**, chooses that exact Google account, then the server checks membership. Different email = denied.
- **Revoke:** admin sets `revoked_at=now()`. No user-level table or function may grant/revoke membership. Cloud permissions should be rescoped if hosting is protected too.
- **Owner admin UI:** Not yet built. If added later, use a verified owner-only server endpoint; NEVER issue administrator SQL or service-role API keys from React.
- **Initial setup:** exactly two Human-PO-approved test email addresses are already provisioned as Neon Auth users AND have active invite rows in the live Neon main DB after approval. Both pre-created Auth records were still email-unverified at last SQL read-back; Google account-linking remains untested. No real email addresses appear in this repository.

## App shell versus data privacy

Cloudflare Pages serves static HTML/JS/assets publicly **unless edge access controls protect it**. The invite RPC + Neon RLS prevent uninvited users from using protected functionality and accessing private records; they do **not** hide public static bundles or published academic content.

If the PO means *literally nobody uninvited can even load the app URL / static learning content*, a separate Cloudflare Access policy covering the exact `li5610.pages.dev` hostname and preview domains is required; official docs: https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain . This may introduce an additional identity step, and has **not** been activated or approved. Preserve manual-only Cloudflare release and zero-cost policy.

## Before permission to release

- [ ] Independent SQL/schema/security review of migration 0002 and actual provider identity linking
- [x] Human-approved schema dry run on isolated Neon branch, applied migration 0002 to default branch, verified restrictive RLS, grants and safe temp-branch deletion (2026-11-19)
- [x] Admin-only seed of exactly two approved test email addresses (2 active, 0 unexpected), read back directly from Neon. No email address embedded into GitHub or Notion.
- [ ] Real Google sign-in at approved origin, with 2 invited accounts, 1 uninvited and 1 revoked case
- [ ] Signed JWT A/B/C negative RLS tests: SELECT, INSERT forged owner, UPDATE/PATCH, DELETE on both private tables; verify synthetic cleanup
- [ ] Check that client RPC shows denied on error/uninvited, while table RLS independently rejects all writes
- [ ] Verify account switch/logout, stale session, offline cache, multi-device privacy boundaries and iPhone/iPad Safari
- [ ] Privacy: revocation cannot reliably remotely erase data already cached offline on someone's device; describe this limit to the owner
- [ ] Explicit remote learner-state consent and separate diary-consent gate before first sync
- [ ] G2 visual gate + owner manual release approval; no paid service, no automatic deploy

**No deploy, real Google login, genuine signed user-isolation test, or remote sync occurred. Live invite-only migration and two approved invitations DID take effect on Neon main with explicit Human PO approval.**
