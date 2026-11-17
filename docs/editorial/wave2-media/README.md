# L15-2-3 · Four timestamp clocks — editorial image candidate

**Status:** FIRST-PARTY ORIGINAL EDUCATIONAL VECTOR PROTOTYPE ONLY. **Not merged, not deployed, not a final G2 visual identity decision.** Human Product Owner content/media gate and iPhone/VoiceOver QA remain OPEN. No third-party copyrighted graphics, fonts, or screenshot tracing.

## Purpose and variants
- `l15-four-clocks-vi-wide.svg` and `l15-four-clocks-en-wide.svg`: accessible wide variants.
- `l15-four-clocks-vi-mobile.svg` and `l15-four-clocks-en-mobile.svg`: dedicated mobile layout (not a cropped desktop image).
- Data in ALL variants: **one Arrival event; same fictional day/timezone UTC+7**.
  - Planned Arrival **10:00** (schedule, not a report).
  - ETA Arrival **11:20**, predicted **as of 09:00** (forecast snapshot, not actual).
  - Reported actual Arrival **11:45** (business event timestamp, subject to evidence).
  - System receipt **12:00** (when the event report reaches the system, NOT vehicle arrival).
- **All values are original fictional teaching data** and correspond to L15-2-3's conceptual example (with a newly declared fictional report-receipt 12:00). **They intentionally do not reuse the independent assessment**: Departure 12:00/12:10; Arrival planned 14:00; ETA 16:30 as of 13:00; actual 17:05; receipt 17:20. This avoids pre-submit answer leakage.
- Separation relies on **explicit labels and text, not only color**. The four cards are not a mathematically scaled horizontal timeline; they list four semantically different timestamps.
- Each SVG has accessible `<title>` and `<desc>`; VI/EN semantic parity preserved. Final HTML should add a distinct local `alt` and source disclosure. Do NOT present any fictional event as SAP or Oracle real shipment data.

## Academic source
Oracle Transportation Management 25c, [Agent Variables](https://docs.oracle.com/en/cloud/saas/transportation/25c/otmol/agent_manager/agent_variables.htm): separately documents planned arrival, destination ETA, event occurrence timestamp and receipt timestamp. There is **no claim about SAP GTT's specific implementation**. All card numbers are independently authored.

## QA and release gates
- [x] Edit-friendly text/vector SVG with no external assets/fonts/scripts, no remote calls, and no third-party copied image.
- [x] Two locales × wide/mobile layouts.
- [x] Distinct method/time semantics and data different from independent assessment.
- [ ] Human PO media approval, final G2 design tokens/review, smartphone 320–402px screenshots and VoiceOver screenreader testing, final alt/link/source annotation, document rights record.
- [ ] Actual app integration. These are files in an **editorial branch**, NOT a native lesson view or released asset.

## Quote-bank known exceptions (separate, not modified by this PR)
- `analects-peers` uses 7.22, but the **currently linked Wikisource 述而 page numbers it 7.21**. Numbering is edition-dependent; attach *according to this linked edition*, not a universal assertion.
- `box-models` source is supported by a professional reproduction of 1987 p.424, with Box & Draper as book authors. Keep original text; separate literal VI translation from modern explanatory gloss.
- `epictetus-appearance` matched Thomas W. Higginson's English published translation; original Greek and international redistribution rights not reviewed.
- `woolf-room` excerpt checked in Project Gutenberg Australia, explicitly Woolf's argument/opinion; avoid calling it an empirically proven necessary-and-sufficient law.
- Current shared production quote bank and PO-locked Wave1 content **not changed** by this illustration PR.
