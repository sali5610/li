# li. (理) — Product-first implementation agreement v3.0
Effective: 2026-11-20. Human Product Owner decision. Supersedes the older exhaustive "mandatory every UI change" protocol for process and QA scope; security/privacy/content release safeguards remain required.

## Objective and operating priority
- **Deliver a usable, valuable learning flow before polishing the system.** Measurable user outcome > quantity of PRs, tests, CI assertions, ontology models, pages, or reports.
- First prioritize ONE complete vertical slice using permitted real content: entry/Home → course/lesson → learning content → exercise → feedback → visible or retained progress. Verify the smallest blocker and fix it; arrange a real user learning session before asserting usefulness.
- Technical PASS != product usefulness; a draft PR != main integration; local/staging != production; Proposed != Approved != Implemented != Tested != Deployed != User-Validated.
- Work-in-progress limit: ONE main user-value stream plus no more than ONE essential supporting stream. Do not spawn speculative architecture, research, framework, gate, QA or design-library expansion without a concrete user flow, dependency or risk.
- PO saying "tiếp" means make the smallest useful next move and STOP when its acceptance is met. Never turn it into more test rounds by default.

## Source of truth, scope and decisions
- Latest explicit Human PO decision takes precedence over old process instructions. Notion [Hub](https://app.notion.com/p/4196cf6db72a81269c71c90c39310334) and [Latest Handoff](https://app.notion.com/p/4196cf6db72a81f7b000f75783f210b5) govern priorities/approvals. GitHub main is implementation truth; this branch alone is NOT production rollout.
- Read the relevant sections only; don't scan every plan, all eight specialist roles, every dependency and every past QA checklist for a small change.
- For affected UI/UX component work, start with [design-system/README.md](design-system/README.md) and follow only relevant contracts. For asset work, consult [design-assets/README.md](design-assets/README.md) and approval status. These are practical references, not invitations for whole-library audits.
- Human PO approves scope jumps, G1 product intent, G2 final visual identity, G3 security/cost architecture and G4 production release. Existing G2 visual identity is NOT globally approved. Avoid inventing extra decision gates.
- Prioritize reuse. No unrequested full ontology mapping, fixed course quota, new layers or systems for imagined future scale.
- **PO-approved React rewrite requires strict feature and content parity (2026-11-20).** Migrate ALL existing app UI/routes/modals/interactions to React without deleting, hiding permanently, simplifying away or silently substituting any working original feature, teaching section, figure, source, companion action, history or user setting. “Remove legacy UI” means **replace its implementation** after an equivalent React component works, NEVER remove the user-facing capability. Until parity is proven on a particular route, keep the old working behavior available; report it as transitional, not complete. This decision supersedes the old restriction on unrequested React rewrites.
- **Released lesson detail parity:** before declaring a React learner view migrated, compare the original full seven-section Hi-Fi learning page: goals, theory + examples, illustrations with rights/alt/fallback, guided practice, four-question independent practice, gated answers + rubric, sources with working links/copy/search prompts, bookmarked lesson, contextual Lão Lý, VI/EN, progress, and draft/reset. Preserve existing content semantics and post-submission gates. If a reusable component is missing, build it in the canonical Design System or learner component tree rather than deleting content or feature. No new unapproved academic material or automatic grading.

## Practical design and code invariants
- Treat [design-system/tokens.json](design-system/tokens.json) as the source of design token values; generate `site/assets/design-tokens.css` with `python3 tools/generate_design_tokens.py`. Never hand-edit generated output.
- Preserve the existing CSS layering (tokens → `li-layout.css` → lesson styles → `ui-foundations.css`) and user-visible behavior. Avoid ad-hoc inline CSS overrides. Check relevant responsive breakpoints, states and VI/EN long text only where changes can affect them.
- Follow [UX patterns and behavior](design-system/ux-patterns-and-behavior.md) for the specific component changed. Don't redo the full Home/Catalog/Guide/Library/Research/Search/Capture/Settings instance inventory unless a shared-contract change actually reaches them.
- Make the smallest implementation change that solves the real bug or unblocks the learning journey. Preserve private user data, auth/invite boundaries, access control, academic source quality, and approved cost constraints.

## QA-SLIM: risk-based, NOT six-script mandatory
1. Docs/copy/ordinary content: direct review of changed text; verify academic claims/sources when affected. No browser/E2E/device suite.
2. Local UI/React component: suitable lint/typecheck or component smoke, then affected interaction/viewport. No blanket full visual suite or manual device demand for each commit.
3. Shared routing, primitives, progress persistence or integration: focused tests of affected flows and representative regressions. Reuse unaffected PASS.
4. Auth/invite/RLS, real-user privacy, migration, destructive writes, confidential teacher answers: mandatory relevant negative/security/integration checks and rollback proof BEFORE enabling/releasing the risky feature. Do not substitute synthetic CI for live release evidence.
5. Full regression/physical Safari/PWA/release acceptance only when affected scope or actual milestone warrants it; never by habit.
- In particular, the old command list (`generate_design_tokens.py --check`, `validate_design_system.py`, `validate_ui_foundations.py`, `audit_design_tokens.py --check-zero`, `audit_design_tokens.py --check-baseline`, `validate_site.py`) is **not mandatory as a batch on every UI change**. Run the specific checks relevant to changed files/contracts. Existing targeted GitHub CI is welcome but does not alone justify another manual QA gate.
- Stop testing when the acceptance/risk bar is met. Don't generate another test matrix, artifact inspection, or QA ticket without naming the previously uncovered real risk.

## Deployment, cost and honest reporting
- Local first → existing CI/staging if needed → production only with PO's release approval. Confirm workflow/Cloudflare triggers before pushes; do not use production builds for debugging, do not incur paid charges.
- Do not silently deploy, migrate Neon, change permissions or erase users' data.
- Keep documentation updates proportional: meaningful task outcome, important decision or transferable learning; no serial handoff paragraphs for minor steps. Reuse existing learning records; create new only with genuine cause, prevention and evidence.
- Report briefly: (1) user-visible result, (2) evidence & correct state, (3) essential blocker, (4) ONE highest-value next step. Distinguish NOT TESTED and NOT DEPLOYED.

## ONE staging app, ONE testing URL, integrated merges (PO-approved 2026-11-20)
- Maintain exactly ONE canonical shared testing environment: `https://sali5610.github.io/li/`. All test-ready user features must work inside the same app and same codebase (including Login, Home/Catalog, lessons/exercises/feedback/progress). The DS Studio and optional internal Test Lab can have routes under this same domain, NOT unrelated separate apps or separate public preview URLs.
- Maintain one integration/staging branch as the code source for GitHub Pages staging. Feature PRs enter that branch only after focused checks. Build staging from that branch's actual integrated tree; NEVER compose staging by pinning unrelated feature commits, injecting runtime router patches in CI, or making one-off Auth/L09 demo copies. A feature is NOT "Integrated" until present in the shared staging build; "Deployed" and "User-Validated" require separate evidence.
- Keep production `main` and Cloudflare release distinct. Promote the tested integrated changes to production only with PO G4 approval; staging does not mutate production data or weaken auth/invite/RLS/privacy gates. Preserve free-tier constraints.
- Avoid branch/PR sprawl: no stacked draft chains by default; consolidate or close superseded PRs after assessing their unique changes. Do not bulk-merge old drafts. Keep at most one primary integration stream and one truly needed support stream.
- Tests: automate the affected flow in CI or the internal test route; keep privileged/synthetic QA hidden from normal learners. No repeated PO manual login/security testing when existing evidence remains valid. A green build is not evidence that a human can use the end-to-end app.
- Any staging blocker takes priority over speculative feature expansion. Report the ONE URL, current integrated SHA, user-visible pass/fail and smallest unblocker. Do not claim these rules are implemented until the pipeline/branches are actually updated and validated.
