# UX-DS-35 Stage02B · L09 matched-content visual review QA (research-only)

**Purpose:** Build a human-reviewable comparison of the *same actual authored L09 lesson* and *same synthetic state* on two real mounted React source owners, default legacy and scoped D1/D2/D3 Shared. This is not a blanket pixel-equality requirement or global visual identity signoff.

## Scenario matrix

- Research routes: `?lesson=L09-1-2&li-react=l09` and `&li-vc-g2=1`. Both must resolve exact URL and expected React ownership; no site default/native changes.
- 8 CSS viewports: 320, 375, 390, 402, 600, 820, 1040, 1440. Compare in-memory SHA256 of rendered title, challenge, claim, question labels, four empty answers, lesson state, rubric, language, and status. No genuine learner key read/record write, and synthetic key byte-identical across both route owners.
- Full-page PNG pairs at 390 / 820 / 1040 / 1440 initial; plus after **synthetic submit at 390**. Store immutable reviewer sheet `matched-visual-review.html`, redacted content hash + measured CSS deltas `matched-review.json` in 7-day GitHub Actions artifact `uxds35-stage02b-full-three-tree`.
- Synthetic flow answers four fields, requests hint, switches VI⇄EN, submits and reveals rubric. Remounts both owners at the exact persisted submitted snapshot to strip transient submit confirmation. Asserts four disabled fields and visible rubric in both owners. No real user account or Neon connection.
- Same-source semantic text and public state must match; recorded geometry differences reflect **D1 hard shadow/hit/typography**, **D2 raised shadow / responsive 20-24-28-32 padding**, **D3 labeled named answer textarea**, and/or intrinsic layout effects. Do not auto-label differences as defects or assert pixel-perfect screenshots.
- Visual Product Owner review, 200% browser zoom, physical iPad/iPhone Safari, accessibility beyond currently scoped tests and global G2 acceptance **remain separate OPEN gates**. No app CSS edits, merge, Cloudflare deploy, billing or real learner writes.

**Implementation:** dedicated browser script `tools/step16-real-l09-react-island/scripts/l09-matched-visual-browser.cjs` runs after existing 135-check scoped browser fixture, on the same temporary composed React+DS+ONT source tree. If it finds exact rendered content drift, unauthorized storage mutation, source ownership mismatch or a broken submit lock, it fails CI. Screenshots are evidence, not approval.

**Status:** Draft research QA — NOT TESTED until exact-head CI readback.
