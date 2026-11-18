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
