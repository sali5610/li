#!/usr/bin/env node
/* Creates an UNTRACKED QA wrapper in the CI checkout: no production route/edit. */
import {writeFileSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(root,'site/__ont04c2b_qa.html');
const original=readFileSync(resolve(root,'site/index.html'),'utf8');
if(!original.includes('laoly-quote-stage-gate.js')||!original.includes('laoly-quotes-s121.js')||
 !original.includes('lesson-companion-native.js'))throw Error('Native app source does not include C2a stage bridge');
const html="<!doctype html>\n<html lang=\"vi\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>ONT-04C2b Native Browser QA</title>\n<style>\n*{box-sizing:border-box}\nbody{background:#ededed;color:#111;font-family:system-ui,sans-serif;padding:12px;margin:0}\n#qa-app{display:block;border:0;outline:2px solid #333;width:375px;height:812px;max-width:100%;background:white}\n#qa-status{font-weight:700}\n#qa-ledger{white-space:pre-wrap;overflow-wrap:anywhere;max-height:40vh;overflow:auto}\n</style></head>\n<body>\n<h1>ONT-04C2b · Native browser QA (Chrome only)</h1>\n<p id=\"qa-status\" data-qa-status=\"RUNNING\">RUNNING</p>\n<iframe id=\"qa-app\" title=\"Actual native li. learning app\" src=\"./index.html\"></iframe>\n<pre id=\"qa-ledger\">No result yet</pre>\n<script src=\"../tools/qa_laoly_browser.js\"></script>\n</body></html>";
writeFileSync(target,html,'utf8');
console.log('Generated QA-only page: site/__ont04c2b_qa.html (UNTRACKED, not deployed)');
