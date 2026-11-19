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

## Browser review finding — desktop 1440 inherited iPad geometry (SCOPED FIX)

The actual initial CI [#44596346991](https://github.com/sali5610/li/actions/runs/44596346991) at SHA `856716d` exposed an approved-contract mapping gap in the research owner: **1440 desktop had Card padding 32px + button min-height 56px**, because opt-in `shared.css` used broad `@media(min-width:744px)` and `@media(min-width:1024px) and (orientation:landscape)` without excluding actual desktop. The scoped D1/D2 contract states **desktop standard Card 24px and CTA min hit 48px**, iPad Card 28/32 and target 56.

**Fix, not a new visual decision:** use upstream native-generated `--li-card-pad` and `--li-current-control-min` inside the canonical device-density region 744..1420 CSS px with standard fallbacks, preserving current UI-only opt-in query flag. Targeted browser negative regression: 820 portrait, 820 narrow landscape, 1040 landscape, 1408 landscape iPad all keep expected source aliases; 1200 portrait standard and 1440 desktop remain Card 24px / button 48px intended min. This distinguishes CSS min target from intrinsic rendered height, which can exceed 48. No edit to original `site/`, tokens, auth, Neon or release code.

**Validation:** Exact-head CI PENDING until source-branch and Chrome readback. Global G2 and physical Safari still OPEN.

## S237 · Human PO correction: L09 exercise uses SECONDARY/FLAT card, not raised

On 2026-11-20, Human PO reported that the answer/exercise card had been flat (no shadow) and was incorrectly changed to raised when adopting `Shared Card`. Cause confirmed in source: the shared Card default `raised` hard 5px shadow was applied indiscriminately to both L09 study panels, despite VC-G2-D2 already preserving *explicit named flat/inset variants*.

**Scoped correction:** add independent `elevation: 'raised'|'flat'` to `Shared.Card`; default remains raised for standard editorial/preview cards, preserving approved D2 raised sample. Declare both L09 exercise and self-review StudySurfaces as flat (secondary), use `li-ui-card-flat` to remove shadow and preserve quiet border, with same semantic fill and responsive density. This is restoration of already approved variant mapping, not a new visual identity decision. New browser regression checks BOTH actual mounted panels are flat at every test viewport and match legacy no-shadow styles; full screenshot pairs and exact rendered content/state remain checked. No native site, DS generator, auth, Neon or production deploy changes. Global G2 still OPEN.

**Status at authored source:** Draft only; require exact-head CI green before claiming Tested.
