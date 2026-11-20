#!/usr/bin/env bash
# One actual rendered Search interaction, not a catalog-only source/string assertion.
set -euo pipefail
chrome="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || true)"
test -n "$chrome" || { echo 'FAIL no browser for Search source-link smoke'; exit 1; }
test -s site/assets/li-search-adapter.mjs
test -s site/assets/li-search-graph.json
grep -Fq '"assets/li-search-adapter.mjs"' tools/platform/workbox-config.cjs
grep -Fq '"assets/li-search-graph.json"' tools/platform/workbox-config.cjs
cat > site/li-search-source-smoke.html <<'HTML'
<!doctype html>
<html lang="vi"><head><meta charset="utf-8"></head><body>
<input id="global-search" aria-label="Tra Cứu">
<div id="global-results"></div>
<pre id="result">LI_SEARCH_PENDING</pre>
<script src="./assets/catalog-curriculum-data.js"></script>
<script src="./assets/li-catalog-search.js"></script>
<script>
const input=document.getElementById('global-search'),out=document.getElementById('result');
input.value='L09-1-2';
input.dispatchEvent(new Event('input',{bubbles:true}));
const container=document.getElementById('global-results');
const initiallyHasCatalogSource=Array.from(container.querySelectorAll('a')).some(
 a=>a.textContent==='Nguồn danh mục (Notion)' && a.href.startsWith('https://app.notion.com/'));
if(!initiallyHasCatalogSource){
 out.textContent='LI_SEARCH_CATALOG_FALLBACK_FAIL';
}else{
 let checks=0;
 const timer=setInterval(()=>{
  const status=window.liSearch?.getStatus?.();
  if(status==='ready'){
   clearInterval(timer);
   const evidence=Array.from(container.querySelectorAll('a')).find(
    a=>a.textContent==='Nguồn quan hệ (Notion)');
   const hasField=container.textContent.includes('Data Science') &&
    container.textContent.includes('field:F09');
   const hasSection=container.textContent.includes('Quan hệ phân loại đã đối chiếu');
   const sourceLinks=Array.from(container.querySelectorAll('a')).filter(
    a=>a.textContent.includes('Nguồn ') && a.href.startsWith('https://app.notion.com/'));
   out.textContent=evidence?.href.startsWith('https://app.notion.com/') &&
    hasField && hasSection && sourceLinks.length===1 &&
    sourceLinks[0].textContent==='Nguồn quan hệ (Notion)'?
    'LI_SEARCH_SOURCE_PASS':'LI_SEARCH_VISIBLE_SOURCE_FAIL';
  }else if(status==='error'||++checks>60){
   clearInterval(timer);out.textContent='LI_SEARCH_GRAPH_FAILED_'+String(status);
  }
 },100);
}
</script></body></html>
HTML
python3 -m http.server 8772 --bind 127.0.0.1 --directory site > /tmp/li-search-http.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; rm -f site/li-search-source-smoke.html' EXIT
sleep 1
dom="$("$chrome" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --hide-scrollbars --window-size=1000,900 --virtual-time-budget=9000 \
 --dump-dom http://127.0.0.1:8772/li-search-source-smoke.html 2>/tmp/li-search-browser.log || true)"
if [[ "$dom" != *'<pre id="result">LI_SEARCH_SOURCE_PASS</pre>'* ]];then
 echo "FAIL real rendered Search didn't show Data Science relation with visible Notion evidence"
 echo "$dom" | grep -o '<pre id="result">[^<]*</pre>' | tail -1 || true
 tail -20 /tmp/li-search-browser.log || true
 exit 1
fi
echo 'PASS real rendered Search: L09-1-2 -> F09 Data Science + visible Notion relation source; fallback has catalog source'
