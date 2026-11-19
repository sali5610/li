#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
const html=readFileSync(0,'utf8');
const marker=html.match(/<p id="qa-status"[^>]*data-qa-status="(PASS|FAIL|RUNNING)"[^>]*>/i);
const body=html.match(/<pre id="qa-ledger"[^>]*>([\s\S]*?)<\/pre>/i);
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
if(!marker||!body){console.error('FAIL_BROWSER_QA: expected page/ledger not found in chromium --dump-dom output');process.exit(2)}
let report;
try{report=JSON.parse(decode(body[1]));}
catch(e){console.error('FAIL_BROWSER_QA: JSON ledger not finalized: '+decode(body[1]).slice(0,1800));process.exit(3)}
if(report.environment!=='CHROMIUM_HEADLESS_SAME_ORIGIN_NATIVE_APP'||
report.physicalIPhone!=='NOT_RUN'||report.physicalIPad!=='NOT_RUN'||
report.VoiceOver!=='NOT_RUN'||report.cloudflareDeploy!=='NONE')
{console.error('FAIL_BROWSER_QA: test-level provenance or no-release guard missing');process.exit(4)}
const compact={
 status:marker[1],evidenceLayer:report.environment,
 viewports:"CSS iframe viewport only",physicalIPhone:report.physicalIPhone,
 physicalIPad:report.physicalIPad,VoiceOver:report.VoiceOver,
 tested:report.count,passed:report.pass,failed:report.fail,
 failures:report.failures
};
console.log(JSON.stringify(compact,null,2));
writeFileSync('/tmp/li-ont04c2b-results.json',JSON.stringify(report,null,2));
if(marker[1]!=='PASS'||report.fail||report.count<90){process.exit(5)}
