import {readFileSync} from "node:fs";
import L0911Pilot from "./L09-1-1.state.offline.mjs";
import {runChecks} from "./L09-1-1.contract-tests.mjs";
const source=new URL("./L09-1-1.cms.v1.staging.json",import.meta.url);
const bundle=JSON.parse(readFileSync(source,"utf8"));
const report=runChecks(L0911Pilot,bundle);
process.stdout.write(JSON.stringify({total:report.total,pass:report.pass,fail:report.fail,failed:report.results.filter(x=>x.result==="FAIL")},null,2)+"\n");
if(report.fail>0)process.exitCode=1;
