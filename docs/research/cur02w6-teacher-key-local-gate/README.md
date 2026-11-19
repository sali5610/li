# CUR-02W.6 — Local-only content / teacher-key boundary pilot

**Status:** Executable local research fixture, **not integrated, not deployed, not production security proof**. The Human PO has not approved Neon schema changes, real learner data or a release. GitHub main, React runtime, AuthPanel, Neon, Cloudflare Pages, GitHub Pages and app content remain untouched.

## How to run

Requires Node.js 22+, no packages, no network service except an ephemeral server bound to `127.0.0.1` by the test process:

```sh
node --test docs/research/cur02w6-teacher-key-local-gate/gate.test.mjs
```

The test creates fake users A, B and C, a **synthetic, nonsecret** HMAC test key, an in-memory teacher answer, a two-language learner content object and a temporary HTTP listener. It closes the listener after tests. There are no real Notion/Neon/Google credentials and no personal data.

## Implemented in this isolated pilot

- `compileLearner()`: strict `learner-only` object contract; exact declared VI/EN fields, version and official source domain allowlist. Rejects unknown fields, a teacher key, absent locale/independent work, HTML scripts/frames, known solution markers and unsupported source URLs.
- Local HTTP `makePilot()`: verifies a **test-only HS256 signed JWT** for issuer/audience/sub/time; checks invited subject from an internal set; derives ownership from the validated token, not a request-supplied email/owner; validates exact assessment and teacher-key versions.
- `GET /api/lessons/:id/:locale`: sends learner-only fields, never a teacher key.
- `POST /api/attempts/draft` / `POST /api/attempts/:id/submit`: draft then trusted-server submission/evaluation; early feedback denied, foreign-owner operations denied.
- `GET /api/attempts/:id/feedback`: returns minimal rubric-style feedback after evaluated state only, not the raw expected answer. All responses use `Cache-Control: private, no-store`.
- Tests cover actual local HTTP requests for missing/invalid/expired/signature-tampered JWT, invitation denial and revocation, cross-user attempt reads/submissions, no premature feedback, forged client owner, malformed data, repeat submissions, stale key revision, and absence of a raw teacher-key route. **This is NOT a real Neon JWT or second-account Notion permission test.**

## Critical limitations — do not promote as-is

1. **Authentication:** The local HMAC fixture is NOT compatible with real Neon Auth/Google JWTs; real signed JWT verification must use the reviewed Neon/Auth JWKS/issuer/audience and verified invitation/RLS policy. Never copy this test signing key into a service.
2. **Storage:** Attempts are held in memory; no durable database, RLS, concurrency lock, multi-tenant isolation, timeout/rate limiting, account deletion or schema/migration work. Simple equality feedback is a test placeholder, not academic grading.
3. **Content:** Only typed editorial learner objects are accepted. This is NOT a Notion HTML/Markdown sanitizer, nor a whole-workspace solution fingerprint detector. Upstream five-source allowlist evidence remains in Notion CUR-02W.5; raw legacy L15-3-1 includes answers and MUST NOT be exported wholesale.
4. **Teacher permission:** Three editorial key Notion page ACLs are still **UNKNOWN**; separate root/draft pages are not proof of actual access denial. Verify Notion Share settings and logged-out/uninvited second identity externally. Never grant app identities direct Notion teacher-key access.
5. **Runtime:** Never bundle this local fixture, teacher keys or a privileged server credential into Vite/public assets, GitHub Pages, Cloudflare site, PWA service worker, source maps, browser storage, indexed search or Lão Lý prompts.
6. **Release:** Human PO and G3/academic/translation/security gates still OPEN. No main merge, no application wiring, no deployments, no paid service.

## What needs to be implemented before release

- A reviewed, server-owned Neon-compatible feedback route that authenticates the real signed JWT and checks RLS/invited membership, owner, exact content version, key version and server-trusted evaluated submission on **every** request.
- Real teacher-key storage as a separate restricted, non-client-readable authority; no direct raw-key route. Negative tests with signed A/B/C identities and session revocation.
- Actual content compiler integration into source-managed typed learner CMS, only approved VI/EN sections (independently exportable). End-to-end scans of browser bundle, browser network, source maps and offline caches; prove early/replayed/cross-account requests cannot reveal answers.
- Content/rights and human editorial acceptance, browser and physical device testing.

**Notion sources:** [CUR-02W.4 isolation contract](https://app.notion.com/p/41d6cf6db72a8131830ac9ab039b17f6), [CUR-02W.5 five-source export QA](https://app.notion.com/p/41d6cf6db72a81298ab2d7a5b104e120), [LL-21 preventive learning](https://app.notion.com/p/41d6cf6db72a81f6b699e0d76b25bfc4).

This branch is **docs/research only**, deliberately outside `site/`, `tools/`, `src/`, and `.github/workflows/`. Creating/reviewing it does not trigger the existing main-only GitHub Pages or manual Cloudflare release workflows.

## CUR-02W.7 · Pinned public-JWKS signature verifier (LOCAL TESTED, NOT NEON VERIFIED)

- New server-only **jwks-verifier.mjs** and **jwks-verifier.test.mjs**, no npm packages or new workflow. Run: node --test docs/research/cur02w6-teacher-key-local-gate/jwks-verifier.test.mjs. Node.js 22.16.0 local run passed **24/24** top-level cases: RS256, ES256, bounded key rotation/cache and wrong iss/aud/exp/iat/nbf/kid/alg/crit/jku, JWKS duplicate/private-field/malformed/oversized/failed network cases.
- Only server-owned pinned HTTPS JWKS URL, issuer, exact single audience and algorithm allowlist may be used. Tests inject a fake JWKS responder and synthetic public/private keypairs. No actual JWT or personal data is used.
- **Neon connector read-only** confirms li-learning-free default branch uses Neon Auth, has a JWKS URL, allow_localhost=false, trusted GitHub Pages STAGING and Cloudflare production. No auth config/DDL/DML modified. The endpoint's live key algorithm/issuer/audience and a genuine session JWT were NOT verified; the public JWKS endpoint could not be fetched via available read tools. Do not infer actual Neon compatibility.
- Existing gate.mjs remains local **test HS256**, and does not call this verifier; this is a standalone crypto adapter fixture, NOT real server wiring, Google OAuth, RLS, persisted attempts or Notion ACL proof. Teacher keys remain editorial-only, actual second-user ACL UNKNOWN. No branch PR, CI dispatch, merge or deployment.
- Before any app use: review actual signed Neon token claims and authoritative issuer/JWKS configuration; use a vetted JOSE library in the eventual server rather than deploying custom cryptography unreviewed; integrate trusted invitation and persistent owner/attempt/key-version lookup and tests against signed A/B/C identities. Do not put verifier, key or privileged server secrets in client bundles.
- Technical source pointers: https://neon.com/blog/building-a-private-searchable-photo-library-on-the-neon-backend and https://github.com/panva/jose/blob/main/docs/jwks/remote/functions/createRemoteJWKSet.md

## CUR-02W.8 — Synthetic RS256 JWKS authority wired into local HTTP attempt gate

- IMPLEMENTED in this branch: makePilot() accepts an **optional server-owned verifyPrincipal callback** that returns a previously signature-verified subject. It is mutually exclusive with the old local HS256 secret; a thrown/invalid verifier result defaults to HTTP 401 with **NO HMAC fallback**. The original synthetic HS256 mode remains supported for older regression fixtures.
- New `provider-gate.integration.test.mjs` runs actual ephemeral localhost HTTP requests using locally generated RSA signed JWTs and injectable fake pinned JWKS; its test principals are A/B/C **only** (no real Neon, Google, Notion token). Denies wrong issuer/audience, tampered or expired tokens, algorithm confusion, uninvited C, cross-user attempt access, pre-submit feedback, revoked invitation, stale key revision and public teacher-key lookup. No expected-answer strings are returned to the HTTP client.
- LOCAL EXACT-SOURCE TESTED: `node --test docs/research/cur02w6-teacher-key-local-gate/*.test.mjs` = **47/47 PASS** (15 original HTTP/learner fixture + 24 standalone crypto/JWKS + 8 new bridge-level HTTP). Local Node 22.16.0 Git blob hashes of all five MJS files matched read-back GitHub branch blobs: gate=7fae2f590881bb9988c922a9dda9b7f6eed51a1e, gate.test=6933de4c53944cb8b4d2a9a22d3b4da2e3d99d3b, verifier=2e4386313af1337b146e9fc33d2e6db0704a141e, verifier.test=2eb086a3ecc730c17b0f142632e308a67a907cd8, bridge test=08fbb6b12244a00ff0a9f792cb241898d071cbb3. This is **local exact-file proof**, NOT Actions CI.
- Neon connector READ-ONLY shows default Auth JWKS configured, localhost disabled and two existing trusted origins. The **real provider's JWT alg/iss/aud, signed tokens and live JWKS contents have NOT been verified**. A production backend cannot assume the synthetic `aud`, or silently drop issuer/audience validation to make a token work. The bridge still has no server-persistent storage, real RLS, invitelist verification or authorization proof for Notion teacher key drafts.
- Production requirements: adopt a maintained JOSE verifier, confirm token fields by secure provider evidence, verify invite+owner+attempt+evaluation+key-version for each response, test signed accounts A/B/C, staleness, client/PWA cache and true Notion ACL. No GitHub Actions CI, React/AuthPanel integration, Neon data/schema write, PR/merge or Cloudflare/GitHub Pages deployment.
- Parallel **CUR-TD-07.1 content secrecy blocker** must be resolved separately: an earlier public synthetic test fixture overlapped F15 private assessment numbers; historical commit may still be accessible. Rotate F15 assessment/key values and rerun source pins/bilingual consistency BEFORE any learner release; do not edit PO-locked original L15-3-1 silently.
