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
