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
