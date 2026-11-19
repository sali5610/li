# ONT-INT-05 — Search candidate source disclosure without navigation

**Status: Research Draft, NO publication approval, no G2 visual approval, no user-private data or release.** Inherits [ONT-INT-04 Draft PR #156](https://github.com/sali5610/li/pull/156), [ONT-04B2b-1 source manifest](https://app.notion.com/p/41d6cf6db72a815da0f1c1c5e3f2a47a), [ONT-04 parent](https://app.notion.com/p/41d6cf6db72a81129242d2044fa76927).

## Gap and bounded integration

Existing React Search pilot indexes only source-reviewed ontology nodes and labels lessons as non-playable. A separate ONT-04B2b-1 manifest audits three code-level native routes (L09-1-2/L03-1-2/L15-2-2) but was not consumed by the React research Search screen.

ONT-INT-05 imports the **existing** read-only `inspectSearchRoute()` and the exact manifest into the isolated `SearchIsland.tsx`. A source-attested indexed L09-1-2 result gets a localized plain-text note **native screen exists in code; Search access unapproved**. It adds NO button, href, router event, JWT, new index entity or access entitlement. Missing/non-indexed L03 and L15 lessons are NOT synthesized. A normal reviewed lesson without a known route receives no new code-claim label. React CSS/tokens and G2 components remain unchanged.

This is **UI research transparency**, not a publication switch. Existing manifest has scope `DRAFT_NON_NAVIGABLE_CANDIDATES`, zero approved routes, absent server authorization and no signed private Neon RLS. Editor-locked content does not mean public.

## Acceptance

- [ ] TypeScript compile/Vite bundle and React Vitest pass.
- [ ] Exact L09 result shows VI/EN code-only note; still only external source link and no app navigation.
- [ ] No fabricated native route note on L09-1-1 or S37-only candidates; L03/L15 do not appear from absent search graph.
- [ ] Real native Chromium dual-island mounted browser test (13 checks), normal history test (10/27), dual regression (23), native-negative (33), other affected workflows on same SHA.
- [ ] Real learner attempt / visits unchanged by this read-only Search experiment.
- [ ] Generated JS/CSS remain untracked ephemeral CI files.

Still NOT RUN / OPEN: physical iPhone/iPad Safari, signed Google invite A/B/C + Neon RLS, ONT-02 G2 visual approval, ONT-03C curriculum, real Search publication, G4, merge/deploy. VoiceOver OUT_OF_SCOPE_PO_S208.
