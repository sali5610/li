#!/usr/bin/env node
/* Step16: real-clock headless Chrome E2E reader over DevTools Protocol.
 * No npm dependencies. Reads ONLY rendered #result text, never source PASS strings.
 * Runs against synthetic localhost fixtures in an ephemeral Chromium profile.
 */
"use strict";
const {spawn}=require("node:child_process");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");

const [chromeBin,url,prefix,countText,maxText]=process.argv.slice(2);
const count=Number(countText),maxMs=Number(maxText||65000);
if(!chromeBin||!/^http:\/\/127\.0\.0\.1:\d+\//.test(url||"")||!/^LI_BACKUP_V2_(?:[A-Z]+_)?PASS $/.test(prefix||"")||
  !Number.isInteger(count)||count<1||!Number.isFinite(maxMs)||maxMs<1000){
  console.error("Usage: node tools/step16_cdp_page.cjs <chrome-path> <127.0.0.1-url> <PASS-prefix> <count> [timeout-ms]");
  process.exit(2);
}
if(typeof WebSocket!=="function")throw Error("Node 22 global WebSocket is required");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"li-step16-cdp-"));
let stderr="",socket,chrome;
let lastResult="",sequence=0;
const pending=new Map();
async function waitFor(test,why,ms=10000){
  const started=Date.now();
  while(Date.now()-started<ms){
    const result=await test();
    if(result)return result;
    await sleep(120);
  }
  throw Error("Timed out: "+why);
}
async function launch(){
  chrome=spawn(chromeBin,[
    "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
    "--no-first-run","--no-default-browser-check","--disable-background-networking",
    "--remote-debugging-port=0","--remote-allow-origins=*",
    "--user-data-dir="+profile,url
  ],{stdio:["ignore","ignore","pipe"]});
  chrome.stderr.on("data",data=>{stderr=(stderr+data.toString("utf8")).slice(-9000);});
  const portFile=path.join(profile,"DevToolsActivePort");
  const port=await waitFor(async()=>fs.existsSync(portFile)?fs.readFileSync(portFile,"utf8").split("\n")[0]:null,"Chromium DevTools port",18000);
  const pages=await waitFor(async()=>{
    try{
      const response=await fetch("http://127.0.0.1:"+port+"/json/list");
      if(!response.ok)return null;
      const entries=await response.json();
      return entries.find(page=>page.type==="page"&&page.url.startsWith(url)&&page.webSocketDebuggerUrl)||null;
    }catch(e){return null;}
  },"real localhost fixture page",18000);
  socket=new WebSocket(pages.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error("CDP websocket not opened")),10000);
    socket.addEventListener("open",()=>{clearTimeout(timer);resolve();},{once:true});
    socket.addEventListener("error",()=>{clearTimeout(timer);reject(Error("CDP websocket error"));},{once:true});
  });
  socket.addEventListener("message",event=>{
    let data;
    try{data=JSON.parse(String(event.data));}catch(e){return;}
    if(!data.id)return;
    const callback=pending.get(data.id);
    if(callback){pending.delete(data.id);callback(data);}
  });
}
function evaluate(expression){
  return new Promise((resolve,reject)=>{
    const id=++sequence;
    const timer=setTimeout(()=>{pending.delete(id);reject(Error("CDP evaluation timeout"));},6000);
    pending.set(id,response=>{
      clearTimeout(timer);
      if(response.error||response.result?.exceptionDetails)reject(Error("CDP evaluation error"));
      else resolve(response.result?.result?.value);
    });
    socket.send(JSON.stringify({id,method:"Runtime.evaluate",params:{expression,returnByValue:true}}));
  });
}
async function run(){
  await launch();
  const begin=Date.now();
  while(Date.now()-begin<maxMs){
    const value=await evaluate('document.getElementById("result")?.textContent || ""');
    if(typeof value==="string")lastResult=value;
    if(lastResult.startsWith(prefix)){
      let payload;
      try{payload=JSON.parse(lastResult.slice(prefix.length));}
      catch(e){throw Error("Rendered PASS but invalid JSON "+lastResult.slice(0,400));}
      if(payload.count!==count)throw Error("Wrong actual scenario count "+payload.count+" expected "+count);
      process.stdout.write("PASS rendered Chromium result: "+lastResult.slice(0,3800)+"\n");
      return;
    }
    if(lastResult.startsWith("LI_BACKUP_V2_")&&lastResult.includes("_FAIL ")){
      throw Error("Browser test failed: "+lastResult.slice(0,4800));
    }
    await sleep(130);
  }
  throw Error("Browser did not finish within "+maxMs+"ms; DOM result="+lastResult.slice(0,1500));
}
run().catch(error=>{
  console.error("FAIL "+error.message);
  if(stderr)console.error("Last Chromium stderr: "+stderr.slice(-1800));
  process.exitCode=1;
}).finally(()=>{
  if(socket){try{socket.close();}catch(e){}}
  if(chrome){try{chrome.kill("SIGKILL");}catch(e){}}
  fs.rmSync(profile,{recursive:true,force:true});
});
