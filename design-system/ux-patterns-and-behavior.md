# UX-DS-22 · li. UI/UX patterns & behavior contract v1.0

**Authored 2026-11-19 · Status: documented candidate, NOT implemented audit or Human PO G2 visual signoff.** This extends [components.md](components.md), [tokens.json](tokens.json), [qa-checklist.md](qa-checklist.md) and [Notion Step15 G2](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1). Existing app code is not changed by this spec.

## 0. Source hierarchy and enforcement

**Normative:** WCAG 2.2 Level AA for web accessibility where applicable. **Platform guidance:** Apple HIG and Android/Material; don't confuse pt, dp and CSS px. **Design-system exemplars:** IBM Carbon and GOV.UK provide pattern recommendations, not law. **Product rules:** li.-specific contracts below; these can exceed WCAG. When a rule conflicts with an explicit later Human PO decision, log the decision, reconcile upstream IA/UX flows, change affected instances/tests, and do not silently patch one screen.

**Priority:** P0 = blocker (can't complete task, lost data, blocked controls, major accessibility failure or deceptive status); P1 = functional inconsistency, missing interaction state, overlap, clipped essential copy; P2 = optical/layout refinement. No unverified G2, device or contrast certification claims.

## 1. Universal component contract — required for each component

Every component entry must define: **purpose and when to use; when NOT to use; anatomy; variant hierarchy; semantic token bindings; size/spacing/typography; content rules (VI/EN); mouse/touch/keyboard/assistive-tech interactions; state model; placement/responsive behavior; empty/error/loading behavior; accessibility name/role/value; dependencies; test case; approval status**. Variants must reuse the same primitive and behavior where possible, not accumulate one-off CSS overrides.

States (define relevant ones and visible + programmatic responses): default, hover (fine pointer only), focus-visible, pressed, selected/checked, disabled, readonly, loading/busy, success, error, empty. **Selected is not focus; disabled is not readonly; saved is not merely clicked.** Never convey status by color only. Hover must not be the sole way to discover an action; touch must never retain an accidental desktop hover highlight.

### Global Do / Don't

| Do | Don't |
| --- | --- |
| Reuse semantic token + existing component variant; document exceptions | Hardcode new paint/type/spacing or copy a screen-specific override to fix one screenshot |
| Use action verbs, stable labels, one clear dominant action per decision area | Style every nearby action as primary or use identical icon for different tasks |
| Use native button for action; link for navigation; correct label/role/state | Make a decorative div clickable, nest interactive controls, or make whole card and inner buttons compete |
| Keep geometry, baseline and inset consistent among sibling controls | Create misaligned Save/Explore buttons or mismatched adjacent hit areas |
| Render state with text/icon/shape + semantic attributes | Express status with green/red alone or shadow-only feedback |
| Preserve user data and return actionable failure | Show success or fabricated progress before true completion |

## 2. Touch, layout, typography and visual identity

- Web accessibility baseline WCAG 2.2 AA: pointer target **at least 24×24 CSS px with defined exceptions** (SC 2.5.8); **li. intended mobile touch target 48×48 CSS px**, using invisible hit-area expansion around smaller icons where needed and avoiding overlap. Apple's 44×44 **pt** and Android's 48×48 **dp** are separate platform guidance, not interchangeable conversion factors. Existing legacy 44px wording is a floor for cases explicitly documented, not permission to shrink new controls.
- Typical essential body: 16/24; instructions/support >=14/20; 12/16 only non-essential metadata. WCAG AA target: ordinary text contrast >=4.5:1, large text >=3:1, essential non-text controls/indicators >=3:1 against adjacent colors (subject to each criterion's exceptions). Check contrast on actual opaque/background-image context; colors in the token file are not proof of certification.
- 4px spacing scale and token-first: preserve approved 14/18px compact Guide micro-geometry as explicit exception. Align sibling button heights, icon baseline, label-to-field gaps and optical grid; account for asymmetric opaque hard shadows in bounding boxes.
- Preserve established li. direction: neutral-ivory paper, porcelain editable fields, Moss for primary actions, muted Olive **decorative kicker only**, Crimson Text headings, system sans body; square ordinary controls and hard offset shadows. Intentional exceptions are sand oval selected nav, round filter chips and Lão Lý speech bubble. Do not recolor artwork or use Olive as CTA, focus, error or selected.
- WCAG AA: reflow equivalent to 320 CSS px for vertical content and text resizable to 200% without loss of content/function. Avoid blocking browser pinch zoom. For li., test 320/375/390/402/600/820/1440px, landscape short heights, VI/EN strings, on-screen keyboard and safe-area insets; fixed bars/FAB must not occlude content or focused elements. Prefer wrapping and flexible containers over truncating essential text.

## 3. Buttons, links, chips and selectable controls

| Pattern | Do | Don't | Behavior & QA |
| --- | --- | --- | --- |
| Primary CTA | One dominant decision per action group, explicit verb, active result | Two competing primary actions; ambiguous Save when not actually saving | Press/keyboard activation once; busy label/state; no duplicate submit |
| Secondary/tertiary | Secondary for alternative; underlined text link for low prominence navigation | Use button appearance for a simple inline source link | Distinguishable hover/focus/pressed; clear destination |
| Icon-only action | Accessible name, stable 48px hit-area, tooltip optional on pointer | Rely on icon glyph alone or use bookmark for unrelated action | Enter/Space activation as appropriate; visible focus; no Safari rectangular flash |
| Filter chip | Full pill specifically for filters, selected text/shape + aria-pressed as appropriate | Reuse pill shape for global CTA or conflate filter with navigation tab | Toggle reflected in results/count; clear / All path; keyboard and scroll |
| Radio / checkbox / switch | Radio = exactly one of set; checkbox = independent multiple; switch = immediate on/off setting | Use radio for independent choices, fake disabled look while still operable | Native semantics where possible; label clickable; selection and persistence truthful |
| Disabled / readonly | Disabled: not operable and explain prerequisite when needed; readonly: value inspect/copy, not edit | Dim an element that still triggers action; hide all explanation | Keyboard disabled semantics; no false hover/pressed |

The Guide 2-up cards at phone <=640px preserve full Vietnamese method names, English academic labels, PO-approved gaps and two-line teaser; don't force ellipsis or switch the grid to one column under a generic system rule.

## 4. Navigation, wayfinding, hierarchy

- Global route labels, order, meaning and icon semantics stay consistent across header/mobile nav; exactly one active destination where applicable, visible sand oval + moss ink and aria-current=page on the active route link. Do not use a selected style to mark merely keyboard-focused icon.
- Back returns to meaningful prior context; Resume continues exact saved task; these are not synonyms. Preserve search query, filter, reading scroll or unsaved draft when navigation requires return. Avoid unexpected reset on locale change.
- Use breadcrumb/back for hierarchy Group → Discipline → Course → Lesson; reserve tabs for peers, not step progression. Do not add new main tabs for utilities already in the global header.
- No content, floating Lão Lý, dialog footer or nav under fixed bottom bar. Where overlays coexist, define stack order and scroll ownership.

## 5. Forms, input, validation and saving

- Persistent visible label; placeholder is example/hint, not label. Label above field, optional helper below, required/optional clearly described. Porcelain for editable fields; readonly/disabled visually distinct. Search input, textarea and ruled notebook must map to their component roles.
- Error appears at field + concise instruction on how to recover, connected with aria-describedby / aria-invalid when appropriate. On submission with multiple errors, provide summary and focus/links to problematic fields when appropriate. Keep typed values and user context. Avoid red border alone, vague “invalid”, wiping the form, or flashing every keystroke before users finish.
- Notebook: retain 32px ruled lines and explicit unsaved/saving/saved/failed semantics. Save success only after persistence is confirmed (or explicitly label optimistic/pending), no fabricated cloud sync. Storage denied = visible actionable error, text remains recoverable where possible.
- Destructive permanent action: confirm when costly/irreversible and no easy Undo; for common reversible actions prefer Undo over interruptive confirmation. A manual data import replacing existing entries requires explicit warning/confirmation and backup opportunity.
- Check-in is optional/skippable; if Apply needs 3/3 radio answers, show unmet fields and disable Apply, while Skip/Close remain reachable. Recommendations are not medical diagnoses.

## 6. Search, filter, lists, cards and pagination

- Search covers supported VI/EN aliases and original academic terms; query changes result set predictably, clear resets query without silently changing unrelated study mode. Distinguish: empty initial / loading / no matches / error / populated / filtered; show counts when grounded.
- Guide default six methods in Light mode is a presentation preference; active explicit search must be able to search all 13. Don't silently filter out a valid result because of the default six.
- Entire clickable cards have one owner action and clear keyboard focus. Nested Save inside a clickable card needs structurally separate controls/events; never two independent tab stops that activate the same route unexpectedly.
- Long titles wrap; secondary previews may clamp only if full content remains accessible in detail. Stable ordering and intentional scrolling; avoid masonry visual reorder that contradicts screen-reader order.

## 7. Modal, popover, dialog, menu and Lão Lý

- Use modal only for a blocking decision or focused subtask. On opening: focus moves logically into dialog, background is inactive; Tab stays within modal; Escape/cancel behavior and explicit Close available when safe; close returns focus to opener or logical continuation. Native dialog semantics/ARIA title as applicable.
- Modal long content: header and actions stay reachable, **body owns scrolling**, not overlapping fixed footer. On short landscape and virtual keyboard, avoid clipped final action. No nested modal unless essential; prevent background page scroll inappropriately.
- Nonblocking popover/disclosure: click/tap and keyboard open, dismiss via outside click/Escape where appropriate, sensible focus restoration; don't use dialog behavior for a simple filter.
- Lão Lý uses its actual character bubble, hides floating avatar while open, cannot cover Home mirror text, CTA, fixed nav or another overlay. Advice is contextual but cannot claim a real AI action completed unless it truly executed.

## 8. Feedback, async, notifications and progress

| Event | Do | Don't |
| --- | --- | --- |
| Small transient success | Nonblocking toast/status message for genuinely completed, low-risk result; accessibility announcement | “Đã lưu” before write/readback or success painted green while failing |
| Field-level error | Persistent inline message until corrected, recovery guidance | Auto-dismiss error before user sees/fixes it |
| Form/system failure | Inline/section error or persistent banner depending scope, Retry / Export as appropriate | Auto-advance after error, erase draft or bury failure in toast |
| Loading | Indicate progress/busy without jump; disable only the conflicting action; prevent duplicate requests | Spinner forever, all-controls lock, fake determinate percentage |
| Empty state | Name what is empty and useful next action; explicit no-record vs zero | Invent records, show blank as zero, imply false “mastery” |
| Destructive outcome | Confirm as needed; prefer Undo for reversible actions | Confirmation dialog for every routine reversible action |

Progress bar reports the **real numerator/denominator** (or indeterminate), not XP/mastery inferred from page opens. Calendar no-record is distinct from recorded Quá tải; seven-day bar charts only use actual documented categories and count windows.

## 9. Motion, images, language and content

- Motion exists to explain context change, not decorate every interaction. Respect prefers-reduced-motion and offer nonanimated alternative to essential movement; maintain focus and task continuity. Never make selected state discernible only by animation.
- Images: preserve art direction and crop-safe center for landscape ↔ portrait; no critical text baked into illustration or cropped under safe areas; decorative art has empty alt, meaningful images have useful alternative. No new unapproved artwork in public app.
- Copy must be human-facing, concise, VI/EN equivalent in function rather than literal length. Localize labels, dynamic messages, dates, accessible names, and action outcomes together; don't translate user-authored notes. Never leak editorial source-verification instructions into learner-facing text.
- Scholarly source label, draft/published state, storage boundaries and health/study-mode suggestions must be truthful. Do not collapse unknown, unverified, incomplete and error into the same “success” style.

## 10. Definition of Done — behavior QA before G2 claim

Test each touched **screen × component variant × state × modality × viewport × locale**. Log Pass/Fail/Unverified, screenshot or reproducible test step, build SHA, and severity. At minimum:
1. Keyboard (Tab, Shift+Tab, Enter/Space, Escape where relevant), visible focus and correct semantic role/name/state.
2. Pointer/touch at 320/375/390/402/600/820/1440; no overlapping hit-targets, fixed-bar occlusion, accidental scroll lock or iPhone hover flash.
3. Contrast, text at 200%, 320px reflow; VI/EN long labels, portrait/landscape, content behind overlays and iPhone keyboard.
4. Forms: empty/partial/invalid/valid, storage denied, duplicate submit, reload/readback, import cancel, failure recovery, unsaved drafts.
5. Search/filter: zero/one/many, no-results, explicit query across all 13, Light default six, clear, navigation back.
6. Modal: open/close, focus containment/restoration, last action visible at short height, scroll body, floating Lão Lý hidden.
7. Progress/data: true zero vs missing, unknown vs error, no invented diagnosis/source status; full VI/EN a11y announcements.
8. Check all instances of changed component, upstream research→IA→wireframe→state and downstream screenshot/test/docs, not just reported screenshot.

**Evidence boundaries:** A static markdown update is documentation only. GitHub CI/source audits do not certify physical iPhone Safari/PWA/VoiceOver or WCAG conformance. G2 remains **Human PO pending**; Step14 real-user research and G3/G4 gates remain separate. New costs: 0 VND.

## References / provenance

- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) — normative accessibility success criteria; baseline target AA.
- [Apple HIG accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) and [Apple UI tips](https://developer.apple.com/design/tips/) — platform ergonomics, 44×44 pt.
- [Android touch target](https://support.google.com/accessibility/android/answer/7101858?hl=en) — platform ergonomics, 48×48 dp.
- [IBM Carbon components](https://carbondesignsystem.com/components/overview/) and [Carbon forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms) and [Carbon notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications) — interaction anatomy, communication.
- [GOV.UK validation](https://design-system.service.gov.uk/patterns/validation/) and [error messages](https://design-system.service.gov.uk/components/error-message/) — actionable field error patterns.

- [WCAG 2.2 focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum), [dragging alternative](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow), [resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text).
- [Apple HIG modality](https://developer.apple.com/design/human-interface-guidelines/modality) and [alerts](https://developer.apple.com/design/human-interface-guidelines/alerts).
- Project-specific historical decisions: [G2 contract](https://app.notion.com/p/41b6cf6db72a81529796dc5d1e134dd1), [active UX writing canon](https://app.notion.com/p/41b6cf6db72a811aba36dcec9cc42c20), [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5).
