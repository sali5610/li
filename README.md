# li. (理) — Thư viện tri thức

**🎨 Design Library — one place to start:** [design-system/README.md](design-system/README.md). All li. UI/UX tasks must open this entrypoint first and follow its canonical tokens, component, Do/Don't interaction patterns, accessibility and QA links. AI/code agents are bound by [AGENTS.md](AGENTS.md); Notion continues to own decisions and Human PO approval.

This repository contains the functional high-fidelity **li.** prototype, recovered from the existing Vercel review app and kept as plain static HTML/CSS/JavaScript. No paid hosting, AI API, login, or cross-device synchronization is introduced.

## Published site

GitHub Pages is enabled. The existing workflow publishes the exact `site/` directory when the site or its validation/deployment workflow changes:

https://sali5610.github.io/li/

**GitHub `main` is the source of truth for the deployed app.** S107 placed **Xuất bản sao / Nhập bản sao** under **Cài đặt → Dữ liệu & Đồng bộ** (not in Bút Ký). Its historical inline CSS used 28px mobile and 30px desktop Settings gaps; the newer **v0.2 4px spacing system supersedes both with 32px**, loaded via `site/assets/ui-foundations.css`. Do not reapply older Vercel/S107 styling patches.

The original Vercel application is retained as an independent backup.

## Migration safety

The original app saves Bút Ký entries, saved Gương questions (Dấu Trang), and the Luận Kết draft in `localStorage` on the **Vercel domain**. Browsers do **not** transfer those data to the GitHub Pages domain.

1. On the **old Vercel S106 site**, open **Tủ Riêng → Xuất bản sao** to save the JSON file. On **GitHub Pages S107**, exporting lives under **Cài đặt → Dữ liệu & Đồng bộ**. Keep the downloaded JSON in a safe location.
2. Open the new GitHub Pages app, navigate to **Cài đặt → Dữ liệu & Đồng bộ**, and select **Nhập bản sao**.
3. Confirm the imported Bút Ký and Dấu Trang entries, then reload the page to verify they persist.
4. Import replaces any existing local entries in that browser, but only after explicit confirmation. Export a copy first if you already have data on the new domain.

**No data from the old origin can be read automatically.** The JSON is handled locally in the browser and is never uploaded to a server.

## Typography & spacing v0.3 — canonical runtime tokens

Read the [design-system type/spacing contract](design-system/typography-spacing.md) and [mobile-responsive visual specimen](site/design-system-preview.html). Typography follows Material 3 role principles, retains Crimson Text + system sans, and uses 16/24 body copy, 14/20 supporting text, and 4px spacing tokens. The source of truth is `design-system/tokens.json`, which deterministically generates `site/assets/design-tokens.css` using `python3 tools/generate_design_tokens.py`; check drift with `--check`. Six old `<style>` blocks were extracted to `site/assets/li-layout.css` (original cascade order), common component roles live in `site/assets/ui-foundations.css`, and Wave1 lessons use the same token vocabulary. **No `<style>` blocks remain in `index.html`.** All audited numeric margin/padding/gap literals in app/lesson CSS are on the 4px grid. The specimen is review material, **not G2/physical-device acceptance**.

## High-fi parity and checks

The application contains 13 techniques in Sổ Tay Thần Chú; four explicit Nhịp học choices tied to Lão Lý; the existing routes; notebook, bookmarks, draft persistence and other current prototype interactions. S107 fixes relocate export to Settings, improve Settings card spacing and user-facing copy, and make the Guide illustration larger without resizing its card.

`tools/validate_site.py` checks asset presence, 13 techniques, four mode choices, the S107 Settings export/import controls and event handler, all five Settings cards, the canonical 32px Settings gaps, privacy/backup copy, and inline JavaScript syntax. It is **not** a substitute for device, accessibility, or end-to-end browser testing. User acceptance remains open.

## Source recovery

`tools/import_from_vercel.py` recovers the legacy Vercel HTML/assets and applies the approved migration fixes. The recovered frozen production snapshot is committed in `site/`, so future hosting no longer depends on Vercel. The restore workflow is scoped to the migration review branch; the publish workflow is scoped to `main`.

Original Vercel URL: https://li-step15-arborium-hifi-review.vercel.app/

## UI/UX design contract (new baseline)

Before changing visual layouts or controls, read **[design-system/README.md](design-system/README.md)**, **[components.md](design-system/components.md)** and **[qa-checklist.md](design-system/qa-checklist.md)**. Shared design tokens are machine-readable in **[tokens.json](design-system/tokens.json)**; run `python3 tools/validate_design_system.py` for the free source-level regression smoke test.

The contract covers the **currently implemented** high-fi UI and specific PO decisions. CSS extraction is in place: JSON → generated tokens → preserved layout and art → shared Wave1 lesson CSS → reusable component-role CSS. [v0.3 remediation report](design-system/audits/2026-11-18-css-refactor-v03.md) records the remaining historical scene rules. CI also runs actual headless Chrome computed-style checks at seven responsive widths alongside native route/lesson regression. **G2 overall visual signoff and physical-device accessibility/visual QA remain open.** Decision approvals live in Notion, implementation in GitHub.
