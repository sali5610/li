#!/usr/bin/env bash
# One focused Chromium rendering check against the same canonical static packs used by li.
set -euo pipefail
chrome="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || true)"
test -n "$chrome" || { echo 'FAIL no browser for canonical Search smoke'; exit 1; }
test -s site/content-packs/search.json
test -s site/content-packs/graph.json
test -s site/content-packs/course-catalog.json
test -s site/assets/li-content-adapter.mjs
grep -Fq '"assets/li-content-adapter.mjs"' tools/platform/workbox-config.cjs
grep -Fq '"content-packs/graph.json"' tools/platform/workbox-config.cjs
grep -Fq '"content-packs/search.json"' tools/platform/workbox-config.cjs
cat > site/li-search-source-smoke.html <<'HTML'
<!doctype html>
<html lang="vi"><head><meta charset="utf-8"></head><body>
<input id="global-search" aria-label="Tra Cứu">
<div id="global-results"></div>
<div id="buddy-modal" class="modal">
 <p id="buddy-text"></p><div id="buddy-scroll"></div><div id="buddy-quote"></div>
 <div id="buddy-debate"></div><img id="buddy-title-avatar" alt="">
 <button id="buddy-question">Lão hỏi ngược</button>
 <button id="buddy-challenge">Phản biện lão</button>
 <button id="buddy-forget">Lão quên gì rồi?</button>
</div>
<button id="laoly-fab">Lão Lý</button><img id="laoly-current-icon" alt="">
<pre id="result">LI_SEARCH_PENDING</pre>
<script>
 var currentPage="search",buddyDebateActive=false;
 var openLaoLy=function(){},showBuddyQuote=function(){},refreshLucide=function(){};
 var openModal=function(id){document.getElementById(id).classList.add("open");};
 var closeModal=function(id){document.getElementById(id).classList.remove("open");};
 document.getElementById("laoly-fab").addEventListener("click",()=>openLaoLy(document.getElementById("laoly-fab")));
</script>
<script src="./assets/catalog-curriculum-data.js"></script>
<script src="./assets/li-catalog-search.js"></script>
<script src="./assets/laoly-context-s112.js"></script>
<script>
(async function(){
 const input=document.getElementById("global-search");
 const results=document.getElementById("global-results");
 const marker=document.getElementById("result");
 const tick=()=>new Promise(resolve=>setTimeout(resolve,150));
 const fail=code=>{marker.textContent="LI_SEARCH_FAIL_"+code;};
 const query=async q=>{
  input.value=q;input.dispatchEvent(new Event("input",{bubbles:true}));await tick();
 };
 await query("L09-1-2");
 // Offline/static-catalog fallback must retain a source even before canonical packs load.
 const hasFallback=Array.from(results.querySelectorAll("a"))
  .some(a=>a.textContent==="Nguồn danh mục (Notion)"&&a.href.startsWith("https://"));
 if(window.liSearch?.getStatus?.()==="loading"&&!hasFallback){
  fail("FALLBACK_SOURCE");return;
 }
 for(let i=0;i<60&&window.liSearch?.getStatus?.()==="loading";i++)await tick();
 if(window.liSearch?.getStatus?.()!=="ready"){fail("CANONICAL_PACK_"+window.liSearch?.getStatus?.());return;}
 await query("L09-1-2");
 const lesson=results.querySelector('[data-search-result="L09-1-2"]');
 const body=results.textContent;
 const visibleSources=Array.from(results.querySelectorAll("a")).filter(a=>a.href.startsWith("https://"));
 if(!lesson||!body.includes("Data Science")||!body.includes("L03-1-2")||
    !body.includes("khác nhau")||
    !visibleSources.some(a=>a.textContent==="Nguồn phân loại"&&a.href.includes("notion.com"))||
    !visibleSources.some(a=>a.textContent==="Nguồn phương pháp"&&a.href.includes("pewresearch.org"))){
  fail("L09_FIELD_RELATED_SOURCE");return;
 }
 await query("Selection bias");
 const concept=results.querySelector('[data-search-result="concept:ont01:selection-bias"]');
 const related=results.textContent;
 const pew=Array.from(results.querySelectorAll("a"))
  .filter(a=>a.href.includes("pewresearch.org"));
 if(!concept||!related.includes("L09-1-2")||!related.includes("L03-1-2")||
    !related.includes("Bài liên quan để so sánh")||pew.length!==1){
  fail("CONCEPT_TO_LESSON_TO_RELATED");return;
 }
 const mentor=Array.from(results.querySelectorAll("button")).find(
  b=>b.textContent==="Hỏi Lão Lý về kết nối này");
 if(!mentor){fail("MENTOR_ENTRY");return;}
 mentor.click();
 const dialog=document.getElementById("buddy-modal");
 const plan=window.liGetBuddyPlan?.();
 if(!dialog.classList.contains("open")||
    !document.getElementById("buddy-text").textContent.includes("Selection bias")||
    !plan?.actions?.[0]?.reply.includes("khác nhau")||
    !plan?.actions?.[2]?.label.includes("L09-1-2")){
  fail("MENTOR_CONTEXT");return;
 }
 document.getElementById("buddy-question").click();
 if(!document.getElementById("buddy-text").textContent.includes("khác nhau")){
  fail("MENTOR_REVIEWED_REASON");return;
 }
 document.getElementById("buddy-challenge").click();
 if(!document.getElementById("buddy-text").textContent.includes("Nguồn phương pháp")){
  fail("MENTOR_SOURCE_RESPONSE");return;
 }
 await query("Reorder point");
 if(window.liSearch?.getMentorContext?.()!==null){
  fail("MENTOR_STALE_CONTEXT");return;
 }
 if(!results.querySelector('[data-search-result="concept:wave1:reorder-point"]')||
    !results.textContent.includes("L15-2-2")||
    !Array.from(results.querySelectorAll("a")).some(a=>a.href.includes("MITx_MicroMasters_SCM_KeyConcepts.pdf"))||
    results.textContent.includes("L09-1-2")){
  fail("VERIFIED_INVENTORY_CONCEPT_OR_BRIDGE");return;
 }
 await query("Data leakage");
 if(results.querySelector('[data-search-result="concept:lesson:data-leakage"]')){
  fail("PROPOSED_CONCEPT_LEAK");return;
 }
 await query("L09-1-1");
 if(results.querySelector('[data-search-result="L09-1-1"]')){
  fail("OUTLINE_LESSON_LEAK");return;
 }
 marker.textContent="LI_SEARCH_CANONICAL_PASS";
})();
</script></body></html>
HTML
python3 -m http.server 8772 --bind 127.0.0.1 --directory site > /tmp/li-search-http.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; rm -f site/li-search-source-smoke.html' EXIT
sleep 1
dom="$("$chrome" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --hide-scrollbars --window-size=1000,900 --virtual-time-budget=18000 \
 --dump-dom http://127.0.0.1:8772/li-search-source-smoke.html 2>/tmp/li-search-browser.log || true)"
if [[ "$dom" != *'<pre id="result">LI_SEARCH_CANONICAL_PASS</pre>'* ]];then
 echo "FAIL rendered canonical Search: Selection bias → L09 → reviewed L03 + sources"
 echo "$dom" | grep -o '<pre id="result">[^<]*</pre>' | tail -1 || true
 tail -20 /tmp/li-search-browser.log || true
 exit 1
fi
echo 'PASS rendered Search + existing Lão Lý popup: sourced concept→L09→L03, real source explanation, context reset, proposed hidden'
