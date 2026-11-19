# ONT-04C2b · Native Lão Lý mounted-browser acceptance pilot

## S208 · Human PO QA scope override — VoiceOver excluded

PO explicitly instructed: **skip VoiceOver testing for li.** Thus it is **OUT_OF_SCOPE_PO_S208**, neither a release blocker nor a PASS claim. Physical iPhone/iPad **Safari, touch, popup, stage/no-spoiler and responsive UX** remain PENDING; this remains a private invite-only app with no extra copyright-clearing gate. Generic cross-app Vibecode Handbook checklists are not changed, since this is a li.-specific PO decision. The QA ledger enforces the out-of-scope classification. No merge, no Cloudflare deploy.


**Scope:** Test the real, existing native `site/index.html` and Lão Lý quote renderer from [ONT-04C2a draft](https://github.com/sali5610/li/pull/146) with headless Chromium in an ephemeral, same-origin frame. **No merge, Cloudflare deploy, Neon write, auth bypass or actual phone/iPad QA.**

## Reusable Lessons Learned read first

- [LL-10](https://app.notion.com/p/41d6cf6db72a8106a02effa1689d7f57): source/synthetic DOM CI PASS is not mounted-browser E2E or physical iPhone PASS. Use distinct evidence layers and an explicit PASS/FAIL/NOT RUN ledger.
- [LL-04](https://app.notion.com/p/41d6cf6db72a81fba18ae8c31d191aa7): responsive screenshot/geometry and real-device hierarchy need review; source CSS checks alone cannot prove UI behavior.
- [LL-11](https://app.notion.com/p/41d6cf6db72a81e7a9eeceaeba56b8ef): stacked Draft PR branch CI does not prove deployed or merged integration.

## What CI does

1. Locally generates **untracked** `site/__ont04c2b_qa.html`; it is a testing wrapper, never a new app screen or release asset.
2. Hosts repository files on `http://127.0.0.1:8766` inside GitHub runner, runs *actual* `site/index.html` in a same-origin iframe in Chromium.
3. Resizes frame to **320×720, 375×812, 768×1024 and 1024×768** CSS pixels, checks frame viewport and horizontal-overflow. This is **responsive viewport simulation**, not Safari/WebKit or physical devices.
4. Uses the three real Wave1 companion manifests, the native `navigate()` and `openLaoLy()` implementation, VI/EN toggle, DOM anchor scrolling, actual S121 quote renderer and stage gate. Checks opening/concept/guided quote display; independent/reflection/extension suppression and source-link scrubbing. **Reflection before submitted is coerced by S125 to independent**, and is recorded as such in the test, never a false authenticated submission.
5. Verifies legacy hint/feedback visibility scrubs a stale previously displayed quote, and one **synthetic form submission** in the ephemeral browser profile reveals local review UI but never authorizes a quote or private personal data.
6. Confirms ordinary home cultural quotations continue to display, native Lão Lý dialog opens, and source references remain HTTPS.

## Acceptance and evidence

Command (GitHub CI only):

```sh
node tools/create_qa_laoly_page.mjs
python3 -m http.server 8766 --bind 127.0.0.1 --directory .
# second terminal:
google-chrome --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --window-size=1510,1030 --virtual-time-budget=95000 --dump-dom \
  http://127.0.0.1:8766/site/__ont04c2b_qa.html \
  | node tools/parse_qa_laoly_dump.mjs
```

The parser fails closed on missing/incomplete DOM results and writes a JSON QA ledger with exact PASS/FAIL checks. The **physical iPhone/iPad, Safari, owner invite and real signed Neon RLS are explicitly NOT RUN** and cannot silently become green. **VoiceOver = OUT OF SCOPE by Human PO decision S208** (not tested, not PASS, not a release blocker for the personal invite-only li. app). The same CI retains inherited S121 VM, Design System and Tàng Thư IA checks as separately surfaced workflows. Reviewer may open a screenshot/artifact if created, but no screenshot substitutes for physical iOS testing.

## Outstanding product gates

- Real iOS Safari/VoiceOver/manual screenshot and interaction QA, plus G2 design release, still pending.
- C2a branch remains DRAFT and unmerged; Auth/Neon tests are separate Step16 blockers for learner-state integration, not for static quote metadata.
- ONT-04B2b live Search lesson navigation and ONT-03C graph population remain pending. No external copyright reuse-rights checklist under current PO personal/invite-only decision S205.
- **No Cloudflare build or public deploy is invoked by this CI. Cost 0 VND incremental.**
