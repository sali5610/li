# li. UI/UX Design Library — foundation v0.2

**v0.2 update:** [Readable typography & 4px spacing](typography-spacing.md) is now wired into the actual app through `site/assets/ui-foundations.css`. Legacy inline CSS still contains unresolved off-grid declarations, so this is a controlled migration, **not** proof that every historic declaration has been normalized.

**Scope:** A versioned, testable reference for the current [li. (理) GitHub Pages high-fi](https://sali5610.github.io/li/). This is **not yet an extracted runtime CSS/component package**. The live prototype currently keeps most styles and markup inside `site/index.html`, with additional lesson CSS. Foundation v0.1 captures observed implementation plus existing PO decisions to prevent drift during the next refactor.

**Governance:** Notion = latest decisions/acceptance; GitHub = implementation and executable checks. An implemented detail may still be **G2 pending**. Newer direct PO decisions override older design proposals. No new visual direction or asset is approved by writing this library.

## Read order / source hierarchy
1. [Notion Product Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334) and [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5).
2. [Step13 ACTIVE UX writing](https://app.notion.com/p/41b6cf6db72a811aba36dcec9cc42c20), [S81 G2 token + crosswalk](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1), [illustration asset library](https://app.notion.com/p/41b6cf6db72a814fb474dcda6bc15a4f).
3. More recent explicit PO bug/visual decisions (see handoff S142/S143 for header selected pill and touch feedback).
4. Latest `main` implementation (actual behavior, not proof of acceptance); compare against documents when they disagree.

## Files and responsibilities
| File | What it controls |
| --- | --- |
| [typography-spacing.md](typography-spacing.md) | M3-inspired readable type scale and strict 4px spatial grid, responsive mapping and migration boundary |
| [../site/assets/ui-foundations.css](../site/assets/ui-foundations.css) | Canonical runtime layer, loaded last in app head |
| [../tools/validate_ui_foundations.py](../tools/validate_ui_foundations.py) | Mechanical spacing/type checks for new CSS; source only |
| [tokens.json](tokens.json) | Machine-readable implemented color, geometry, typography and touch baseline |
| [components.md](components.md) | Canonical component purpose, variants, states and code selectors |
| [qa-checklist.md](qa-checklist.md) | Mandatory full-system review + screen/state/device matrix |
| [../tools/validate_design_system.py](../tools/validate_design_system.py) | Free stdlib structural checks comparing core tokens with current source |
| [../.github/workflows/li-design-contract.yml](../.github/workflows/li-design-contract.yml) | PR/push check; no production publish |
| [../AGENTS.md](../AGENTS.md) | Instructions for assistants editing the repo |

## State model
- **PO-accepted specific decision:** accepted only for its documented scope (e.g., seal symbol, sand active icon state); cite decision.
- **Observed implementation:** code exists in current site; not automatically approved or visually validated.
- **G2 pending:** overall visual consistency/signoff remains open; cannot be marked complete by code or CI.
- **Draft asset:** do not move into public repo or production until individually reviewed.
- **Deprecated:** earlier contradictory rule is archived; do not revive it.

## Current invariants
- Brand: **理 / li.**; scholar **Lão Lý**. A living, illustrated ancient-tree library, parchment/wood/moss/forest aesthetic.
- Controls generally have square geometry, opaque offset shadows and restrained decoration. **Exceptions**: active top/bottom nav **sand oval pill**, Lão Lý's actual **rounded speech bubble**, natural illustrated shapes. Newer explicit decisions outrank the old blanket “zero radius” rule.
- Current color baselines: paper `#F3EBDC`, moss `#243A29`, ink `#272A23`, nav active sand `#E5D8BA`; typography: Crimson Text headings, system sans utility/body.
- Global header icon controls and bottom navigation share the **same semantic selected state** (sand pill + moss ink, `aria-current="page"`), not a white-on-white active icon.
- Screen layout: Home scene edge-to-edge; reading areas bounded. Mirror question must fit within illustrated mirror; exactly **two Home main CTA buttons** in order **Lưu (left), Đào sâu (right)**. Persistent Lão Lý cannot block text or CTAs.
- Touch: accessible intended hit area at least **44×44 CSS px**, no iOS square highlight on icon controls; preserve visible keyboard focus. Text, buttons and layouts must accommodate Vietnamese/English lengths.
- Lessons must not imply published/proven/approved content when source or release state is draft. No fake persistence, metrics, diagnoses or academic signoff.

## Migration backlog — beyond v0.2
1. Audit duplicated late-cascade rules in `site/index.html` and all lesson styles; catalog collisions before deleting anything.
2. Extract color/spacing/typography to canonical CSS custom properties, then real reusable control styles/component primitives, with visual-diff checks.
3. Add Storybook-like static **component showcase** or equivalent visual fixtures for all states, if possible with free tooling.
4. Add screenshot-based browser regression for mobile/desktop and assistive-tech test records; CI alone cannot certify physical iPhone Safari/PWA or VoiceOver.

The initial automated contract checks a limited set of baseline invariants, not computed CSS layout or cross-browser rendering. Any visual identity or interaction redesign still goes through Human PO G2/other applicable gates.
