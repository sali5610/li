# ONT-02 · UI ontology binding pilot within UX-DS-35 (Stage 02)

> DRAFT / SOURCE-CROSSWALK ONLY. The sole execution roadmap is [Notion UX-DS-35](https://app.notion.com/p/41d6cf6db72a81d48ffdc4a38de4cec0). These files add executable source-to-UI-rule tests; they do NOT create a second Design System value source, ship React components, validate Safari, or approve G2.

## Files and provenance

- `ont02.graph.v0.1.json`: 20 UI-only ONT-01 typed nodes and 23 proposed graph edges for Button primary/secondary → token → LearningActionArea/slots → L09 screen → rules and QA gates. ONT-01 v0.1 is the single registry; no new NodeKinds or predicates.
- `ont02.source-crosswalk.v0.1.json`: reference CSS variable → semantic role → component use, native selector and L09 markup owner, state evidence, Atomic level, 320–640 / 744–1408 target ranges, Do/Don't, approval/runtime/device gates.
- `tools/validate_ui_ontology.mjs`: reuses ONT-01 graph validation, then checks real repo file/selector/token existence, exact UI link topology, states/variants, rule-to-gate coverage, duplicate selector ownership, unapproved-status and responsive-range guards; includes nine failing mutation fixtures.

## Scope and truth boundary

One authored value source remains `design-system/tokens.json`; `site/assets/design-tokens.css` is generated. This graph **references** existing CSS variables and never authors paint/spacing values. The independent Stage02 token-ref TypeScript generator in [draft PR #134](https://github.com/sali5610/li/pull/134) must be reconciled into the same eventual Design Library, not copied as a second source.

ONT-01 shared registry has `Variant` but no standalone `State` kind. Component state definitions therefore live as typed UI source-crosswalk metadata; the validator rejects fake `State` nodes. The physical Safari/VoiceOver and G2 gates cannot be satisfied by source checks. Existing native L09 markup is not proof a React ActionGroup renders.

### Executable command

`node tools/validate_ui_ontology.mjs --check`

Runs existing ONT-01 validator plus ONT-02 positive/negative tests. The CI workflow is PR-only; no production deployment, Cloudflare/Neon/Auth migration, learner records, academic ONT-03, companion ONT-04 or vector ONT-05.

## Current evidence

Evidence is source-pinned to ONT-01 draft commit `6b486a3a70be356a5dc21a2bb44117c457833caf`, UI runtime selector inspection against native CSS and L09 markup. The graph and metadata are **implementation candidates**, not G2-approved pixels. Follow Stage 02 semantic tokens and then Stage 03 layout rules once Safari failure-to-test evidence exists. No auto merge/deploy; paid cost +0 VND.
