# ONT-INT-01 · Real same-tree semantic integration rehearsal

**2026-11-19 · DRAFT / NOT MERGED / NOT DEPLOYED / NOT G2-APPROVED**

## Evidence input (immutable source heads)

| Owner | Head | Imported |
| --- | --- | --- |
| ONT-01 → 03A/B → 04A/B/C2b | `c6a78a7b35eea304ac080b1e698b36c937070299` (draft #147) | Entire parent Git tree, including search, source-only routes, contextual Lão Lý and browser QA |
| UX-DS-35 | `d22f469a52d13baa73c0c8952b198fdfeb2b2891` (draft #134) | Entire `design-system/` owner subtree; generated semantic/token CSS and native layout/component CSS; generator and token source check tools |
| ONT-02 | `0fe2d9b92a66e64ea3244d910d789ccc0d458a5b` (draft #137) | Entire `docs/ontology/ui/` subtree; UI validator/contract/QA source fixtures |
| React Stage02B | `d1baad59e5d3e211c262deea3934a44bf6fca12b` (draft #148, stacked on Step16.2 #126) | Research-only `tools/step16-real-l09-react-island/` subtree, **not** the native launcher or production build |

All imported files belong to **one real commit tree** in this rehearsal branch, rather than separate checkouts in CI. It is not a Git merge of the four histories, a production app build, or an accepted release. Root branch has one parent (#147) and intentionally stages files as a bounded integration patch.

## First bounded proof

Run `node tools/check_ont_integration.mjs` from the repository root. It checks source presence, canonical token generation, ONT-01/03/02 typed semantic validation, 19 source→semantic→component consumers through the existing ONT02 composed checker, and design role invariants. It deliberately does **not** call any live Auth/Neon/Cloudflare endpoint, install a paid service, edit user data or run a browser.

Check the separate ONT-02/React/DS CI evidence at the original pinned SHAs before treating those individual draft features as tested. This new branch needs its own GitHub CI result; a composed-source test alone does not mean native-React runtime parity.

## Known conflict and intentionally excluded files

**DO NOT simply overwrite `site/index.html`.** Existing ONT-04 tree includes Search/Lão Lý/quote-stage changes; independent UX-DS-35 draft modified its native Dialog focus trap; Step16.2 draft added a localhost-only React route. These are overlapping behaviors on a large central source. The source-tree rehearsal **preserves the ONT-04 #147 `site/index.html` exactly** and leaves DS modal runtime logic / React launcher unapplied. The React shared UI code is present only as a research-local module.

Other excluded paths: real Neon RLS/migrations, Google auth patch #145, Step16 production lifecycle, fixed original Wave1 lesson bodies, live search route authority, and all Cloudflare release artifacts. ONT-03C course corpus remains PENDING curriculum; vector index ONT-05 remains OFF.

## Exit gates remaining OPEN

- [ ] Verify actual GitHub branch diff and no unintended files/secret or learner-key mutation.
- [ ] Native `site/index.html` true three-way reconciliation for DS modal behavior + ONT quote/companion + local-only React mounts, with source contract tests and rollback.
- [ ] Real same-tree TypeScript/Vite + Chromium browser acceptance (native, React shared and integration cases), including no dual writers.
- [ ] End-to-end signed Google invite allowlist / Neon FORCE-RLS tests before live private navigation or sync.
- [ ] Physical iPhone + iPad Safari gestures/rotation/keyboard/stage no-spoiler; VoiceOver **OUT_OF_SCOPE_PO_S208**.
- [ ] Human G2 for visual design; independent G4 release approval.
- [ ] Confirm Cloudflare build/preview counters; no assumption about provider side effects from branch pushes.

**No status promotion:** ONT-02 stays In Progress; ONT-04 parent Backlog; ONT-03C Pending, ONT-05 Later. This branch is a safe contract/compiler foothold, not feature rollout.
