# S-G3-16E — Complete local backup v2: integration candidate

**Status:** DRAFT / NOT RELEASED · 2026-11-19 · [Step16 G3 Notion](https://app.notion.com/p/4196cf6db72a81379aaccba71303cb75) · [PR #111](https://github.com/sali5610/li/pull/111)

## Change boundary

This candidate is intentionally a small, reversible safety fix in the **existing Vanilla/HTML app**; it is **not** a decision to retain Vanilla or to reject React/Lit, nor does it create a database, account, cloud sync or hosting migration.

The original `site/index.html` Settings controls remain. A new standalone `site/assets/backup-v2.js` is loaded after the existing global language script. The existing inline export/import handlers now call its reviewed APIs, reusing the approved Lão Lý loading/error scenes. No new visual assets, color tokens, CSS overrides or paid providers.

The production site is still `main`; this code is only on the unmerged Draft PR.

## What a file actually contains

- Full version 2 JSON envelope: `format=li-backup`, `version=2`, `exportedAt`, `sourceOrigin`, raw per-key `records` and a SHA-256 `digest`.
- 11 enumerated `li.*` keys, including full Library, draft, mentor address, study mode, locale, mentor position, lesson/problem visits, daily journal, journal enablement, T02 due schedule; plus dynamic `li.review.{lesson-id}.v1` records for Wave1 lessons.
- Export overrides the draft entry with the actual editor value when the editor is present, preventing a recently typed unsaved draft from silently being omitted.
- A new, unknown `li.*` key stops export rather than silently presenting a partial file as a full backup. Any future storage namespace requires an explicit registry and test update.
- A maximum of 1,000 recognized keys and a 10 MiB file cap bound local memory usage. File is **plaintext** and may include private notes/journal; user must guard copies.

## Import contract

1. **Read** the selected JSON locally, bounded by file size.
2. **Validate** envelope, version, keys and nested Library record shape; check SHA-256 for v2 before any write. SHA-256 is corruption detection, not sender authentication.
3. **Preview** exact adds/overwrites/removals via native confirmation. Reject a stale preview if current storage has changed since it was shown. A full v2 file replaces registered `li.*` state (including removing recognized keys absent from snapshot), whereas **legacy v1 is strictly merge-only**.
4. **Persist and verify** every `localStorage` write; on failure attempt to restore the prior snapshot and verify it. Failure to verify rollback has a **separate, explicit serious error state**; never tell the user save succeeded.
5. **Reload on success** because existing lesson, diary, Library and preference modules cache data in JS memory. No fabricated cloud sync. On cancel, parsing error or invalid schema, write nothing.
6. Reuse existing loading and illustrated error/retry states with real busy semantics; avoid a fake spinner hold.

**Legacy limitation:** Old schema1 files only carried Library/cases/questions/ideas/saved lessons, draft and mentor name. When imported, they can preserve independently stored records on the destination, but **cannot recreate lesson progress or journal data missing from the original file**.

## Evidence ledger

- [GitHub Actions — candidate integrated-browser suite](https://github.com/sali5610/li/actions/runs/44398153127): **5/5 PASS** on actual `site/index.html` Settings UI with synthetic browser state: full export Blob, restoring lesson/diary/due/preference keys, legacy partial merge, corrupted v2 error illustration, and cancelable exact-count preview.
- [GitHub Actions — source/library/companion/design checks](https://github.com/sali5610/li/pull/111/checks): source validators migrated from literal schema1 fields to runtime v2 contract. No old v1 export handler retained to pass stale tests.
- [Prior two-origin PoC](https://github.com/sali5610/li/pull/104): different browser origins can receive user-exported JSON explicitly, not via cross-origin storage access.
- New adversarial suite `tools/step16_v2_fault_fixture.html`: checksum mismatch, unknown keys, nested invalid Library records even with valid digest, stale preview, simulated quota/write rollback, failed rollback warning, malicious key rejection, oversized JSON, non-destructive cancel and legacy merge. **Only call it PASS after checking current workflow head logs.**

**Not yet checked:** actual physical iPhone/iPad Safari Files download/import, installed-home-screen PWA, VoiceOver, 200% zoom, real storage quota and eviction, password-protected exports, lost-device restore from actual user storage, future cloud user isolation. Headless Chrome and synthetic failures cannot establish those results.

## Gate/rollout and rollback

- G3 architecture and persistence/privacy/cost remains **Human PO approval pending**; G2 visual identity remains separate.
- PR #111 is intentionally **Draft**, not merged, not deployed and costs 0 VND.
- Because this changes only the backup feature UI and script, backing out the candidate means reverting the backup handler to the prior implementation; it does not migrate or wipe any actual storage keys. Existing user schema1 JSON files must remain importable after any later rollout.
- If approved for release, require reviewed PR CI green, test across VI/EN and app states, real Safari/iPad/VoiceOver where available, branch freshness and exact GitHub Pages publish verification. Do not erase any user storage at release.

## Follow-ups owned by backlog

- Step16: frontend framework choice, device-sync/account requirement, database authorization/cost, full system boundary map and final G3 ADR decision.
- Step18: versioned typed data schema, schema migrations and long-term persistence model.
- Step27: user-visible complete backup, recovery, delete/account controls, re-entry and data rights.
- Steps28–34: browser regression, accessibility, physical-device and final release gates.


## S-G3-16F · Actual app cross-origin and adversarial CI evidence (2026-11-19)

**Validated on research branch; no production deploy.** New standalone fake-data fixture pages `tools/step16_v2_origin_fixture.html` and `tools/step16_v2_origin_agent.html` exercise `site/index.html` Settings **actual Export click** at localhost port 8774 and **actual Import File input** at localhost port 8775, with a real browser cross-origin boundary. The harness uses strict postMessage origin/source checks, but this bridge is test-only, NOT a product feature.

[Actions #44400005495](https://github.com/sali5610/li/actions/runs/44400005495) **SUCCESS**, Chromium rendered DOM checks (not fixture source-string matches):
- **5/5 actual Settings** full v2 Blob, restore lesson/journal/due/settings, schema1 merge-only, corrupted file error state, cancellable preview.
- **11/11 adversarial** invalid shapes including nested saved-case record with recomputed digest, unknown/malicious key, edited checksum, 10 MiB cap, stale preview, simulated quota denial with verified rollback, simulated rollback failure explicitly reported, and deletion/cancel preview. The quota and rollback failures are **injected test doubles**, not actual Safari disk exhaustion.
- **5/5 two-origin with actual Settings UI**: A's real Export creates v2; browser forbids direct storage access from B; B's real Import via fake File restores lesson, consent, diary and T02 due records; A unchanged; B records survive target iframe reload. *This is not physical cross-device testing; no real user notes or data leave the runner.*
- All other 4 workflows on that commit also **completed SUCCESS**: companion source validator, Design System contract, Tàng Thư IA, rendered responsive Chrome smoke. [PR #111](https://github.com/sali5610/li/pull/111) remains Draft and not merged.

**Important remaining risks:** physical iPhone/iPad Safari and Files import, downloaded file durability, actual low-storage write failure and browser eviction, schema1 false expectations for omitted data, accidental plaintext file disclosure, other tabs mutating data while a restore is applied (a preview fingerprint is not an atomic cross-tab transaction), multi-year migration path and account synchronization. The runtime has no cloud auth or remote copy. Diary default-on for fresh installs was explicitly accepted in the existing Human PO-led UX-IA-04 release (Notion Handoff PR #32); previous manually paused journals remain off. This PR does not change that approved behavior. Privacy of downloaded plaintext journal data still requires the G3 backup policy decision.

**Source freshness:** PR branched from `main` `6cccb478...`, with current `main` already advanced during research; re-review/reconcile the latest UI code before merge. G3 architecture and persistence privacy decision **NOT APPROVED**, G2 separate. +0 VND incremental.


## S-G3-16G · Cross-document race prevention + diary decision audit (2026-11-19)

**No deployment; PR #111 is still Draft and behind current main UI changes.**

### Risk discovered in the v2 import sequence

The earlier candidate compared the preview fingerprint before additional asynchronous SHA-256 work. A different same-origin browser document could write to localStorage in the async gap after preview validation and before the import begins writing. An old fingerprint check alone did **not** guarantee the state was unchanged at commit time (time-of-check to time-of-use / TOCTOU).

**Mitigation introduced on this candidate branch:**
1. `navigator.locks.request("li:backup:v2:import", {mode:"exclusive", ifAvailable:true})` means two **cooperating v2 importers** on the same browser origin cannot restore concurrently. When already held, the second importer fails with actionable `busy` messaging rather than waiting and silently overwriting. If Web Locks is unavailable, it refuses to import with an explicit compatibility message; it does not claim fallback safety.
2. Re-parse/validate the payload, capture all current registered keys, recompute their digest **inside the lock**, compare to the preview fingerprint and then synchronously read the exact current records again before starting the write loop. This rejects another document's update while WebCrypto was running, rather than relying on an earlier snapshot.
3. Existing per-write readback and best-effort rollback remain. The visible `changed` state instructs the user to reselect/preview, not claim successful restore.

**Important non-guarantee:** Web Locks is an advisory coordination primitive for code requesting the same lock. Ordinary lesson, diary, bookmark, and browser extensions that directly write localStorage **do not participate** in this lock. Individual localStorage writes are not a multi-key ACID transaction and cannot guarantee complete isolation against simultaneous non-cooperating tabs or browser crashes. The final synchronous preflight only **narrows**, never eliminates, that residual race. Long-term cross-device/DB state consistency requires a transactional persistence strategy under G3/Step18; do not mark "multi-tab fully solved".

### Real browser evidence and harness correction

At code commit `bb8e956d5285618e6736704479e0a414af0f5b20`, [GitHub Actions #44416837387](https://github.com/sali5610/li/actions/runs/44416837387) **SUCCESS** with actual Linux Chrome 157 and synthetic localStorage. The test runner was replaced with a **real-clock DevTools Protocol driver** (`tools/step16_cdp_page.cjs`, no npm package dependency), which reads only `#result.textContent`; previous `--dump-dom --virtual-time-budget` caused premature PENDING and a false timeout when Web Locks scheduled asynchronous work. The first CDP run verified all browser assertions but failed while deleting an ephemeral Chrome profile directory; the runner cleanup race was fixed and all 4 suites reran successfully.

| Chrome runtime suite | Verified |
| --- | ---: |
| Actual Settings v2 Export / Import + legacy merge + preview + corrupt file | 5/5 |
| Adversarial records, SHA, stale preview and simulated rollback/quota faults | 11/11 |
| Actual Settings File transfer between two different localhost web origins | 5/5 |
| **New:** two same-origin browsing contexts (iframe + parent), Web Locks contention, release, second-context change, late digest write, diary disabled | **5/5** |
| **Combined** | **26/26** |

New same-origin suite `tools/step16_v2_lock_fixture.html` confirms: independent document can hold the lock; import refuses with zero writes; import succeeds after release; unrelated second-document write invalidates preview; changed state during asynchronous digest is rejected; explicit `li.personal.daily.enabled.v1="false"` stays off. A same-origin iframe is **not literally two iPad Safari tabs**. Source static support references: [MDN Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) and [MDN browser compatibility source](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json) (Safari and iOS support from 15.4 per published compatibility metadata; **not** on-device validation).

### Privacy decision reconciliation — Human PO controls still respected

The authoritative [li. Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5) records that **fresh-install local daily diary defaults ON** as an approved product behavior of the merged UX-IA-04/PR #32 iteration; previously paused diaries are explicitly preserved OFF, and user manual OFF is persisted. Older UX-DASH-01 wording "opt-in default OFF" is superseded **for the default-on toggle decision only**. The branch did not change `site/assets/personal-diary.js`, consent state, or sharing model.

**Remaining privacy decision at G3** is about export policy, not silently changing the previously approved toggle: a full plaintext v2 file intentionally includes diary and enablement state, so the UI must warn that downloaded files contain private notes and are not encrypted. No server collection, analytics, cloud account or paid provider was introduced. A real Safari Files picker, private-tab storage behavior and data erasure/export UX remain unverified.

**Release blockers:** PR behind latest main source (several concurrent iPad fixes; currently mergeability unknown/conflicted), real physical Safari and PWA, all app writers not taking lock, account ownership and cloud sync policy, source compatibility regression, final G3 gate. No merge/deploy/data removal; 0 VND incremental.
