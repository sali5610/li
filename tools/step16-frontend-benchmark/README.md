# Step 16 — Frontend feasibility benchmark (research only)

**Not production. Not G3 approval.** Compare three interaction implementations using the same three representative li. lesson prompts, the *same core reducer and local-only persistence*, and the *same generated li. design tokens*: Vanilla JS with retained DOM nodes, React 19 (with Vite), Lit 3 (with Vite). Vite 8 is a **benchmark bundler only**, not an approval to rewrite current static app.

## Run on free GitHub Actions

The folder has its own private package.json (top-level dependencies pinned; transitive dependency tree still needs a lockfile for a reproducible production project). On Node 22:

```sh
cd tools/step16-frontend-benchmark
npm install --no-audit --no-fund
npm run build
node report-sizes.cjs
cd ../..
python3 -m http.server 8769 --bind 127.0.0.1 --directory .
# In Chromium: http://127.0.0.1:8769/tools/step16-frontend-benchmark/benchmark-fixture.html
```

CI tests all variants with 30 synthetic practice attempts each, 2 full reloads, VI/EN, hint, correct/wrong answers, feedback, progress, 48 CSS px control minimum, saved state and new lesson. It reports bundled JS/CSS gzip bytes, initial mount and DOM-response timing observations. **Comparative timing is noisy** in shared runner, and React/Lit versus Vanilla framework overhead is more informative than tiny absolute millisecond differences.

This is a limited UI rendering/state-integration experiment. Does **not** test production-sized component reuse, developer throughput, accessibility via screen reader, real iPhone/iPad Safari, cross-device cloud/auth, security/rights, PWA, app navigation, all page states, or migration of real data. It reuses source tokens but is not a new approved design. Incremental paid spend 0 VND.

Sources: https://react.dev/learn/add-react-to-an-existing-project · https://lit.dev/docs/tools/adding-lit/ · https://vite.dev/guide/static-deploy . Current li. policy: ../../design-system/README.md and https://app.notion.com/p/4196cf6db72a81379aaccba71303cb75 .

**Decision use:** benchmark evidence contributes to G3 but cannot settle it alone; measure actual full-app migration risk and maintenance complexity separately. No real learner data, secrets, production changes, or deploy.


## Observed CI evidence — actual Chromium (2026-11-19)

[GitHub Actions run #44392646674](https://github.com/sali5610/li/actions/runs/44392646674) **COMPLETED SUCCESS**. Tested all three variants against identical shared 3-task lesson/reducer/local persistence/approved token CSS, 30 attempts and 2 reloads each, 107 click events each, real synthetic same-browser storage, two language changes and controlled options/feedback.

| Variant | Bundled JS raw bytes | Bundled JS gzip bytes | Shared CSS gzip bytes | First mount (single run, ms) |
| --- | ---: | ---: | ---: | ---: |
| Vanilla JS (Vite build) | 6,595 | 2,951 | 3,280 | 58.5 |
| React 19 + Vite 8 | 196,257 | 61,745 | 3,280 | 32.0 |
| Lit 3 + Vite 8 | 20,921 | 8,311 | 3,280 | 19.9 |

The mount numbers are **single-run non-reproducible observations**, not a speed ranking. DOM response median (0ms Vanilla, 12ms React/Lit) reflects 12ms polling resolution in the test harness and different scheduling, **not** true comparative app responsiveness; do not use to rank frameworks. Sizes describe **one prototype** and shared CSS, not the current production li. total page size or production page load.

**Bounded interpretation:** The identical small flow gives Vanilla the lowest JS footprint and Lit moderate JS cost; React adds about 59 KB gzip over Vanilla on this tiny scenario. The long-run maintenance, integration with all current screens, state ownership, accessibility, animation and test ergonomics remain untested. The result **does not support automatically selecting React** and does not mean React is inherently slow. Production G3 architectural decision is still OPEN.

**Dependency hygiene before any approved implementation:** add an actual lockfile and use npm ci; current `npm install` in research CI pins direct dependencies but may resolve transitive versions. Any real migration needs separate source review, CI build baseline and rollback.
