# ADR-016 · APPROVED STACK & FREE-ONLY OPERATIONS (2026-11-19)

**Human Product Owner decision: APPROVED technology stack. Implementation/provisioning: NOT DONE.**
Source: [Notion G3](https://app.notion.com/p/4196cf6db72a81379aaccba71303cb75) and [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5).

The owner selected the previous proposal with **absolute zero paid charges**. Intended users: owner and 2–3 friends. **Each individual's learning progress, notes, answers, journal, SRS schedules, bookmarks and account settings are private to that user.** Academic curriculum and knowledge graph are shared. Auth + automatic multi-device sync are now required, superseding the earlier no-login MVP decision. This does NOT approve any particular untested database authorization policy, billing upgrade, external access to private notes, production deployment or the separate G2 visual identity gate.

## Approved solution stack

| Layer | Technology | Boundary |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Migrate from the existing Vanilla UI in small reversible slices |
| UI and practice | Motion for React + CSS, Zustand, selective XState for L2-T01–T13 | Respect reduced motion, touch and iPad/iPhone layouts |
| Offline state | Dexie on IndexedDB | Device-first, outbox, recovery and old localStorage/JSON v2 adapter |
| Sync/accounts | Neon **Free** Postgres + managed Better Auth + Data API + server-side RLS | One owner per private record, deny access by other accounts |
| Shared knowledge | GitHub-versioned MDX/JSON, typed source-backed graph, static content shards | Curriculum public/shared; do not store giant corpus in Free user DB |
| Semantic search | Hybrid keyword+vector+graph, build-time pinned multilingual embeddings | No paid embedding API; fallback when free query inference unavailable |
| Hosting | Cloudflare Pages **Free** | No paid domain; manual-only Cloudflare releases |
| Offline and reminders | PWA/Workbox, in-app due inbox, optional Apple Shortcuts → Reminders | Push scheduling optional, NOT required for initial free release |

**Auth threat model:** private data tables must carry verified user owner IDs and enforce them in PostgreSQL Row Level Security for SELECT, INSERT, UPDATE and DELETE. The browser must never receive a privileged database connection string or service-role secret. Invite-only 3–4 accounts; verify anonymous and user-A→user-B negative tests before syncing real notes. Local diary ON is a previously approved on-device setting, **not automatic permission to upload its content to cloud**; remote journal inclusion needs an explicit privacy release decision.

## Cloudflare Free quota policy

The current published [Cloudflare Pages Free limits](https://developers.cloudflare.com/pages/platform/limits/) include 500 builds per account per month, 1 concurrent build, 20,000 files/site and 25 MiB/asset. The 500 builds are **account-wide**, not 500 reserved for li.

**Release design:** GitHub Actions handles code/test/build; Cloudflare Pages is configured for **zero automatic builds** on production pushes and PR previews. Deploy only on an explicit main-branch, manual GitHub Actions release with an exact confirmation phrase and the real Cloudflare API token. Cloudflare permits Wrangler uploads to an existing Git-connected Pages project with Git auto-deploy disabled. Manual uploads still create deployments; never assume they are unlimited or exempt from other limits. [Official disable-auto guide](https://developers.cloudflare.com/pages/configuration/git-integration/).

**Internal strict budget:** 30 or fewer manual deployments per Pages project per UTC month. Target 4–12 consolidated releases monthly. The current account's total Pages builds across all projects still needs checking in the dashboard; this guard checks only this project's deployments. At 30 releases this project stays far under 500 if other projects do not consume the allowance. No auto-paid upgrades or auto-overages.

### Actual release protections prepared in this PR

- [Manual-only release GitHub workflow](../../.github/workflows/li-cloudflare-free-manual-release.yml): only workflow_dispatch on main, exact typed PUBLISH_LI_FREE_ONLY phrase; no push/PR triggers, read-only GitHub permissions, concurrency block, canonical source/Design System validation and dedicated cloudflare-free-production GitHub environment.
- [Fail-closed quota/asset guard](../../tools/g3_cloudflare_free_guard.py): checks 20,000 file count, max 25 MiB each, no development/secret-looking files, index.html; then Cloudflare Pages API must confirm this project's current-month deployment count is less than 30. Missing permissions, API errors or unexpected response **block release**.
- Cloudflare Pages manual upload via Wrangler only after account/token/project are configured; no unknown paid network service, AI credit or database provisioning in this workflow.
- The workflow currently publishes the existing static site/ folder **only if** the user explicitly initiates a release. When the future React app is signed off, change the output to its validated dist/ folder in a separate reviewed PR. Keep existing GitHub Pages live until the migration passes release QA.

### Cloudflare one-time account setup — user actions (NOT completed by this PR)

1. In Cloudflare dashboard choose the **Free** account plan. Do not buy a domain, Pro/Business, paid Workers, R2 upgrade, Workers AI credits or usage-based add-ons.
2. Connect only the GitHub repository sali5610/li to one Pages project; production branch main. **Immediately** disable automatic production deployments under project Settings → Build → Branch controls, and set preview branches to None. An initial Git connection may cause one build. Keep all PR test branches excluded. An account dashboard setting cannot be changed just by committing this workflow.
3. In GitHub repository Settings → Secrets and variables → Actions add secrets CLOUDFLARE_API_TOKEN (scoped to Pages edit, not global key) and CLOUDFLARE_ACCOUNT_ID; add repository variable CLOUDFLARE_PAGES_PROJECT matching the real Pages slug. Do not paste these values in chat or commit to Git.
4. Configure GitHub environment cloudflare-free-production with a required reviewer if desired. Only after private-data/release QA is accepted, manually dispatch **Release li. to Cloudflare Pages Free** from main, input PUBLISH_LI_FREE_ONLY. If any quota check fails, no upload occurs.
5. Check the Cloudflare Billing/Usage dashboard after initial setup and every month. The CI guard does not control deployments performed manually in the dashboard nor spend on unrelated Cloudflare products.

Sources: [Pages Free limits](https://developers.cloudflare.com/pages/platform/limits/), [stop auto builds](https://developers.cloudflare.com/pages/configuration/git-integration/), [Wrangler deploy](https://developers.cloudflare.com/pages/get-started/direct-upload/).

### Neon Free account setup — user connection REQUIRED

1. The connected Neon account must show **Free**, without an upgrade to a usage-billed plan. Verify the current console quotas and plan terms at the time of provisioning. The October 2026 [Neon update](https://neon.com/blog/neon-free-plan-1-gb-per-project) lists 1 GB Postgres/project, 100 CU-hours/project/month. Quotas may change, and Free has limits.
2. Create **one** project, not many development/preview database clones. Keep public lessons and large vector arrays on static CDN, not in the personal-state database.
3. Configure Managed Better Auth and user-scoped Data API/JWT integration, deny public registration after the four intended accounts, and enforce database-level RLS. Do not assume JWT alone creates row policies.
4. Before allowing real users: prove user A cannot access user B's attempts, note, diary, due or settings; prove logout revokes access; prove failed sync leaves records safely queued on IndexedDB.
5. Never allow a paid plan upgrade, credit purchase, overage or AI Gateway credits. Show a truthful unsynced state when Free quota runs out. Manual JSON export remains available for disaster recovery.

Neon provider is not connected to this session yet. An app connection can be suggested but must be accepted by the owner. No service account, secret or database was created here.

**Current truth:** Architecture G3 **approved**; engineering adoption still in progress. GitHub main remains the existing Vanilla app on GitHub Pages; Cloudflare and Neon are **not verified as provisioned**. Draft research PRs remain unmerged. **Actual new paid spend: 0 VND**. No provider can guarantee perpetual zero pricing/uptime; policy is to refuse paid features and degrade gracefully rather than incur charges.
