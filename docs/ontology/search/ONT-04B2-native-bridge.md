# ONT-04B2a — localhost-only native Tra Cứu React bridge (draft candidate)

**Scope:** Real source-level integration trial in `site/index.html` behind a **hard localhost + explicit opt-in query** gate, with native search still authoritative by default. This is NOT the full ONT-04B2 release or approved UI. Do not merge/deploy. No production feature flag, email bypass, Cloudflare build, auth/data changes or paid provider.

## Actual integration point

The existing native app already has `data-page="search"`, `#page-search`, `#global-search`, `#global-results`, `navigate('search')` and a working Back control. This branch adds only a bounded `<script type="module" data-li-ont04b2-local-only>` at the end of the site HTML. It does nothing except when all are true:

- `location.protocol === 'http:'`, exact hostname `localhost` or `127.0.0.1`
- pathname exactly `/site/index.html`
- query **`li-search-react=typed-v1`**
- the existing native `#page-search .section-shell` is found and unoccupied
- separately built JS + CSS assets load successfully and React mount effect confirms ready

After that, it inserts the React island inside the *existing* native search section, keeps the native Back control in place, and hides only the native search content. A failed CSS import, failed JS import or React mount failure **leaves or restores all native controls**. The `mountTypedSearch` disposer restores every old `hidden` value on pagehide. One mount only, no other writers. React's embedded mode uses `<div>` instead of nesting `<main>` inside the app's existing `<main>`.

The content itself continues to use [ONT-04A source-bounded typed retrieval](./../../docs/ontology/search/README.md): a 30-entity demo, no released lesson routes, no attempts or user-private data, no search network request. Current native search results are retained on all actual production URLs.

## Local developer preview — manual / NEVER deploy

From root with Node 22:

```sh
cd tools/ont04b-react-search-island
npm install --no-audit --no-fund
npm run build:site-candidate
cd ../..
python3 -m http.server 8794 --bind 127.0.0.1 --directory .
```

Open the native app at `http://127.0.0.1:8794/site/index.html?li-search-react=typed-v1`, then click the existing Search icon. Compiled site assets remain local/untracked for this trial; do not stage/commit them and do not deploy Cloudflare. Without this query, `/site/index.html` remains exactly the native route, even on localhost.

## Tests / no release implication

The PR-only GitHub Actions checks **ONT-01/03A/03B/04A baseline**, isolated React TypeScript/Vite, candidate `site/assets` compilation, and jsdom tests: localhost/prod flag denial, native Back preservation, feature swap after React ready, duplicate mount denial, exact hidden-state restore on cleanup, pagehide disposal, no learner state writes, no published/open lesson link. GitHub runners compile locally and do **not** upload/trigger a Cloudflare deployment.

The existing UI/DS semantic contract [ONT-02](https://app.notion.com/p/41d6cf6db72a81e0aa1ef66c7ddc0507) remains Backlog; React L09 shell is another workstream, Step16 auth pilot Free release policy is blocked, real iPhone/iPad Safari/VoiceOver and the 15-field course corpus remain unverified. **Full ONT-04B2 app release is still PENDING.**

## Next reviewer handoff

Do not wire any live route until there is an **approved publication-route manifest** linking a versioned canonical ID to a real app location, with rights/review state and RLS/Google invite checks. Do not convert a Notion editorial document or demo S37 title into a live route. Reconcile Design System Stage02+ and Step16 native↔React one-writer ownership, test real mobile orientation, and run manual QA before requesting human release approval.

Related: [ONT-04 parent](https://app.notion.com/p/41d6cf6db72a81129242d2044fa76927) · [ONT-04B1](https://app.notion.com/p/41d6cf6db72a8174b9dafeb44a8a03fe) · [ONT-03C pending](https://app.notion.com/p/41d6cf6db72a81d0b0d3dbde49b8ad43). Zero paid cost.
