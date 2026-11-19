# ONT-INT-04 — Browser history / reload recovery for dual local-only Search + React L09 pilot

**Research-only implementation; no production UX change, no merge or deployment.** Direct parent: [ONT-INT-03 Draft PR #155](https://github.com/sali5610/li/pull/155), exact parent source `5ab42adf1115109c737379a4d530248a2301c5b5`.

## Observed source bug and design boundary

The native `syncLiRoute` originally always used `history.replaceState`, with no `popstate` listener. That made cross-screen browser Back/Forward incapable of restoring local Search/L09 routes, and a hard reload of Search could not lazily remount L09 on Back because its React loader only checked the initial `lesson=L09-1-2` query. Existing ONT-INT-03 same-document `navigate()` 23/23 PASS did not cover these paths.

**Bounded fix:** Under **ALL** exact guards — `http:`, `localhost`/127.0.0.1, pathname `/site/index.html`, `li-search-react=typed-v1` and `li-react=l09|l09-native-fixture` — the native page records only `li-local-page=home|search|lessonL09` in browser history (initial `replaceState`, later `pushState`) and uses real browser `popstate` to restore page without adding another entry. It never puts user queries/answer content in the URL or browser history state. History restoration may lazily insert the existing React L09 research router script just once if the lesson was not initially mounted, preserving the existing ONT quote/Search code and native shell.

**Everything else keeps original native `replaceState` semantics**; publication routes are still NOT authorized and source display still labels content editorial-locked.

## Acceptance matrix

- [ ] Mounted actual Chromium dual candidates start from an explicit L09 URL, seed one local history entry, preserve real learner/visit keys.
- [ ] In-app Search produces a separate browser history entry, removes stale `lesson`, retains both pilot flags.
- [ ] Search query shows verified `L09-1-2` without playable link; user query lives only in component RAM.
- [ ] Hard reload while on Search restores **Search screen**, does not navigate to stale L09, Search query intentionally resets (not persisted by research-only adapter); synthetic L09 draft remains in the separate research key.
- [ ] Actual browser Back to L09 restores React island lazily and its persisted draft, without adding a duplicate host or replacing real native attempt.
- [ ] Actual browser Forward to Search (without reload) restores Search route with correct active selection.
- [ ] After reload, native in-app Search→L09→browser Back/Forward preserves Search local RAM draft and React L09 draft.
- [ ] Hard reload on L09 independently preserves synthetic answer and creates only one React root each.
- [ ] No changes to real learner `li.review.L09-1-2.v1` or `li.private.lesson.visits.v1`; no Neon DB, JWT, SQL or hosted flag.
- [ ] Independent existing ONT-INT-03 23/23 simultaneous Chrome test remains green; ONT anti-spoiler/DS/lesson source workflows remain green.

## Caveats and open gates

Browser QA runs on **real Chromium page + actual native app + real `history.back()/forward()/reload()`**, not synthetic `popstate` dispatch. Key event simulation and device viewport remain separate. Browser history is specific to this local research pilot; broader history semantics, search query persistence on hard reload, and fully unified native/React router remain **unapproved**. GitHub Actions minutes may be consumed; no manual Cloudflare builds, no signed A/B/C row-level Neon RLS test, physical iPhone/iPad Safari, G2/G4, course publishing or full production release. Keep VoiceOver `OUT_OF_SCOPE_PO_S208`, not PASS.

## Learning

Check existing LL-11/LL-10 and the APP STARTER Step20 before new lessons. If the source-route omission is newly observed in actual CI, record a reusable lesson with exact before/after history/QA evidence, rather than assuming all applications exhibit the bug.
