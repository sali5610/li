# ONT-02 · UX-DS-35 Stage02 typed UI crosswalk

> **ONE Master Plan:** [UX-DS-35](https://app.notion.com/p/41d6cf6db72a81d48ffdc4a38de4cec0). This is a source-contract+negative-test implementation in an **unmerged draft**, not G2 visual approval, runtime React migration, independent ontology or another roadmap.

## Five native families, source-grounded

Typed ONT-01 UI-only graph now has **43 nodes / 62 proposed edges** representing Button, Surface, FilterChip, TextInput and StatusBanner, their canonical source token dependencies, rule/QA links, and grounded L09/Guide pattern/slots only when real markup evidence exists.

- Button: native `.action` primary+secondary in L09 (secondary source ref `--paper`, not `--porcelain`), keyboard focus and 48px target intent
- Surface: L09 `article.surface` main/tinted panel roles
- FilterChip: dynamic Guide `#method-filters .filter[aria-pressed]` with selection distinct from keyboard focus
- TextInput: L09 `#l09-guidedDraft` and editable field focus/error roles (search documented as existing variant, not runtime React conversion)
- StatusBanner: native `.status-banner` CSS owner only; actual DOM screen binding <b>not established</b> and therefore no fabricated `USES_PATTERN` relation

The crosswalk explicitly distinguishes observed source states vs specified/unverified states, native selector and markup anchor, Atomic level, Do/Don't, screen/slot graph, responsive target ranges, and validation gates. No State node kind is invented (ONT-01 v0.1 has no such node).

## Token authority / cross-branch truth

The reference→semantic→component role **names** match the separate [UX-DS-35 draft #134](https://github.com/sali5610/li/pull/134) SHA `bf8d9717a10da3bb7b5a7d10663113b829e352a1`: 27 semantic aliases, 21 component aliases, 358 CSS references. THIS PR remains stacked on [ONT-01 draft #127](https://github.com/sali5610/li/pull/127) and therefore has no actual generated alias definitions in its own tree. The validator verifies the raw reference token exists and the crosswalk role-name syntax; when the JSON role maps appear in a unified tree it additionally checks **reference→semantic→component values**. Until that happens, **cross-branch integration = PENDING_SAME_TREE_REVIEW**, never PASS by implication. No paint values copied into the ontology fixture.

Run `node tools/validate_ui_ontology.mjs --check`. It runs the shared ONT-01 graph validator plus filesystem source ownership, typed endpoints, graph topology, token role contracts, rule/gate coverage, responsive ranges, and **14 mutation-rejection tests**. CI PR-only, zero third-party dependencies.

## Gate truth

Source CI PASS (if hosted runs succeed) is not computed CSS parity, React-mounted primitive, VoiceOver, iPad Safari repeated orientation, keyboard, 200% zoom, Split View, PWA or Human G2. StatusBanner DOM consumers and real React component props are NOT VERIFIED. No OAuth/Neon/RLS/learner data, ONT-03/04/05, Cloudflare deploy, merge, or paid spending. Status ONT-02 **In Progress**, Stage02 **partial**.

## Stage02 composed CI fixture — source-only, not a merge

The ONT-02 PR-only workflow now checks out <b>immutable</b> Design System draft [#134](https://github.com/sali5610/li/pull/134) at `bf8d9717a10da3bb7b5a7d10663113b829e352a1` and React Step16.2 draft [#126](https://github.com/sali5610/li/pull/126) at `df882d46f75f39f48c733752ced15bf6f549a5d3` into separate local folders. `tools/compose_uxds35_stage02.mjs` verifies both Git SHAs then copies exactly eight generated/owned DS files into the **ephemeral GitHub Actions workspace**, not back into the source PR branch. This is a composed test working tree, **not a Git merge, changed base or deploy**. The ONT-02 source graph/validator stays in the PR checkout.

`node tools/validate_ui_ontology.mjs --composed-check` executes the 14 mutation-negative cases and verifies all 19 source→semantic→component alias chains in `tokens.json`, generated CSS and typed TS, with an explicit 18/19 native adoption count; native focus-ring remains not yet consumed. Then the workflow installs pinned open-source React build dependencies in isolated CI and runs `tools/test_ont02_react_primitives.cjs`: real React 19 `renderToStaticMarkup` on existing Step16.2 `ActionButton`, `Surface` and `StatusMessage`, including default and explicit button types, disabled/secondary, native label/ARIA, semantic surface and status/live-region contract plus eight scoped CSS role fallbacks. No mounted browser/app, no Cloudflare deploy, no production React parity or physical WebKit is implied. Only native and React pilot source contracts overlap; StatusBanner and StatusMessage are **not** declared equivalent components.

**Gate:** At any unchanged head, record hosted CI URL and exact results before claiming PASS. Source "composed" CI never turns `crossBranchIntegration` into merged or changes G2.
