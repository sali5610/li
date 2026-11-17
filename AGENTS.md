# li. (理) — mandatory UI/UX implementation protocol

This is a plain HTML/CSS/JS high-fi prototype, **not** a framework component library. For any UI/UX task, read these files BEFORE editing:
1. [Design-system policy](design-system/README.md)
2. [Token contract](design-system/tokens.json)
3. [Typography/spacing contract](design-system/typography-spacing.md) — every new spacing value is a 4px multiple; readable 16/24 body and ≥14px essential copy.
4. [Component contract](design-system/components.md)
5. [Cross-screen QA matrix](design-system/qa-checklist.md)

## Precedence and product governance
- Human Product Owner's newest explicit decision outranks an older snapshot. **Notion is the authority for decisions/approval and current handoff; GitHub `main` is the authority for deployed implementation.**
- Notion [Product Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334), [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5), [S81 G2 design-system draft](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1), [Step13 active UX writing](https://app.notion.com/p/41b6cf6db72a811aba36dcec9cc42c20), and [asset library](https://app.notion.com/p/41b6cf6db72a814fb474dcda6bc15a4f) must be checked for affected work.
- **G2 complete visual identity remains pending**. Existing design decisions and implemented details do not imply blanket G2 approval. Do not publish unapproved illustration candidates.
- Keep frozen WF-BASE and historical review deployments unchanged. Do not present visual review as human usability or device acceptance.

## Every UI change (mandatory)
1. Reconstruct the decision/flow from product purpose → research/IA → wireframe → copy → visuals → code. Record which earlier steps are affected, not just the element named in the bug report.
2. Inventory all instances of the affected component across Home, Catalog, Guide, Library, Research, Search, Capture, Settings and lesson views; use one shared contract for its variants.
3. Update the shared `site/assets/ui-foundations.css` and `design-system/tokens.json` for typography/spacing, not another late `<style>` override. All new margin/padding/gap values must be divisible by 4px. Prefer modifying/reusing the canonical rule over appending yet another last-minute CSS override. If a deviation is intentional, record the scope and reason.
4. Check component states (default/hover/active/selected/focus-visible/disabled/error) and narrow + wide responsive breakpoints, with long VI/EN text.
5. Execute `python3 tools/validate_design_system.py`, `python3 tools/validate_ui_foundations.py` and `python3 tools/validate_site.py`; run relevant existing interaction tests. Source checks are **not** actual browser/Safari/VoiceOver QA.
6. Report Git diff, observed tests, affected screens, any remaining physical-device or G2 gate, and sync real progress to Notion.

Avoid fabricated acceptance, fake saved confirmations, blanket “WCAG pass”, or silent user-flow changes. Maintain zero incremental paid costs.
