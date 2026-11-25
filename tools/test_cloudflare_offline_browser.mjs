// Actual assembled Cloudflare app + generated Workbox SW, isolated browser profile.
// Synthetic verified-device receipt only; no production user, API, or credential.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:https';
import {readFileSync,mkdtempSync,rmSync,statSync} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as sleep} from 'node:timers/promises';
const dir=resolve('dist-cloudflare-auth-candidate'), origin='https://li5610.pages.dev';
const tmp=mkdtempSync(join(tmpdir(),'li-offline-browser-'));
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-keyout',join(tmp,'key.pem'),'-out',join(tmp,'cert.pem'),'-subj','/CN=li5610.pages.dev'],{stdio:'ignore'});
let cut=false,servedAfterCut=0;
const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer({key:readFileSync(join(tmp,'key.pem')),cert:readFileSync(join(tmp,'cert.pem'))},(req,res)=>{
 if(cut){servedAfterCut++;req.socket.destroy();return;}
 const url=new URL(req.url,origin);
 if(url.pathname==='/__qa_seed'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end('<!doctype html><title>isolated local QA seed</title>');return;}
 if(url.pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"QA_NETWORK_UNAVAILABLE"}');return;}
 const file=resolve(dir,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!file.startsWith(dir+'/')){res.writeHead(403);res.end();return;}
 try{
  if(!statSync(file).isFile())throw Error('not file');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(readFileSync(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise((r,j)=>{server.once('error',j);server.listen(8766,'127.0.0.1',r);});
const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
let proc,socket,serial=0,stderr='',events=[];
const pending=new Map();
const wait=async(fn,label,ms=30000)=>{
 const end=Date.now()+ms;let last;
 while(Date.now()<end){try{const x=await fn();if(x)return x;}catch(e){last=String(e);}await sleep(100);}
 throw Error(label+' timeout '+(last||'')+' '+stderr.slice(-500));
};
function send(method,params={}){
 return new Promise((res,rej)=>{
  const id=++serial;
  const timer=setTimeout(()=>{pending.delete(id);rej(Error('CDP timeout '+method));},10000);
  pending.set(id,{res,rej,timer});socket.send(JSON.stringify({id,method,params}));
 });
}
async function start(){
 events=[];
 proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-default-browser-check','--no-proxy-server','--ignore-certificate-errors','--host-resolver-rules=MAP li5610.pages.dev 127.0.0.1:8766, MAP * ~NOTFOUND, EXCLUDE localhost','--remote-allow-origins=*','--remote-debugging-port=9223','--user-data-dir='+join(tmp,'profile'),'about:blank'],{stdio:['ignore','ignore','pipe']});
 proc.stderr.on('data',b=>{stderr+=String(b);});
 const tab=await wait(async()=>{const a=await (await fetch('http://127.0.0.1:9223/json/list')).json();return a.find(t=>t.type==='page'&&t.webSocketDebuggerUrl);},'chrome');
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 socket.addEventListener('message',e=>{
  const x=JSON.parse(String(e.data));
  if(x.id){const p=pending.get(x.id);if(!p)return;clearTimeout(p.timer);pending.delete(x.id);x.error?p.rej(Error(JSON.stringify(x.error))):p.res(x.result||{});}
  else if(x.method==='Runtime.exceptionThrown'||x.method==='Network.loadingFailed')events.push(x);
 });
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 // Read-only diagnostics from before the app code runs. Only synthetic QA data.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`if(location.origin==='https://li5610.pages.dev'){try{window.__qaInitial={online:navigator.onLine,owner:localStorage.getItem('li.sync.local-owner.v1')==='offline-qa-owner',grant:JSON.parse(localStorage.getItem('li.offline.device-invite.v3')||'null')?.uid==='offline-qa-owner'};}catch{window.__qaInitial={storageError:true};}}`});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
}
async function stop(){
 if(proc){
  const p=proc;proc=null;
  // Graceful profile shutdown is essential: SIGTERM can interrupt delayed
  // localStorage LevelDB writes and falsely simulate eviction of the grant.
  const exited=p.exitCode!==null||p.signalCode!==null?Promise.resolve(true):new Promise(r=>p.once('exit',()=>r(true)));
  if(socket?.readyState===WebSocket.OPEN){
   const id=++serial;socket.send(JSON.stringify({id,method:'Browser.close'}));
  }
  const clean=await Promise.race([exited,sleep(12000).then(()=>false)]);
  if(!clean){p.kill('SIGTERM');await exited;throw Error('QA browser did not shut down cleanly');}
 }
 if(socket){socket.close();socket=null;}
}
async function evaluate(expression){const x=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(x.exceptionDetails)throw Error(JSON.stringify(x.exceptionDetails));return x.result?.value;}
async function navigate(path){const x=await send('Page.navigate',{url:origin+path});assert(!x.errorText,'navigation failed: '+path+' '+x.errorText);}
async function offline(){
 await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Network.setBypassServiceWorker',{bypass:false});
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
}
async function state(){return evaluate("({url:location.href,online:navigator.onLine,verified:document.documentElement.classList.contains('li-auth-verified'),ready:document.documentElement.classList.contains('li-boot-ready'),route:window.liReactRouter?.getCurrent(),home:!!document.querySelector('[data-li-react-screen=\"home\"]'),auth:!!document.querySelector('.auth-pilot'),boot:document.getElementById('li-boot-error-title')?.textContent,sw:!!navigator.serviceWorker?.controller,initial:window.__qaInitial,owner:localStorage.getItem('li.sync.local-owner.v1')==='offline-qa-owner',grant:JSON.parse(localStorage.getItem('li.offline.device-invite.v3')||'null')?.uid==='offline-qa-owner',authCopy:document.querySelector('.auth-card')?.innerText?.slice(0,500)})");}
async function ready(route){
 try{await wait(async()=>{const s=await state();return !s.online&&s.verified&&s.ready&&s.route===route&&s.home&&s.sw;},'offline '+route,25000);}
 catch(e){console.error('BOOT_DIAGNOSTIC',await state().catch(()=>null),JSON.stringify(events.slice(-12)));throw e;}
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.app')).display!=='none'"),true);
 console.log('PASS actual offline app rendered '+route,JSON.stringify(await state()));
}
try{
 await start();
 await navigate('/');
 await wait(()=>evaluate('Boolean(navigator.serviceWorker?.controller)'), 'real Workbox controller',45000);
 // Inspect actual cache inventory before cutting network; all public boot dependencies.
 const cached=await evaluate("caches.keys().then(ks=>Promise.all(ks.map(k=>caches.open(k).then(c=>c.keys())))).then(xs=>xs.flat().map(r=>r.url))");
 for(const suffix of ['/index.html','/assets/li-first-party-app.js','/content-packs/home-mirror-draft-hooks.js','/assets/home-li-iphone-20261121.webp','/assets/home-li-landscape-20261121.webp','/assets/discipline/sociology.webp'])assert(cached.some(x=>new URL(x).pathname===suffix),'missing precache '+suffix);
 assert(cached.every(x=>!new URL(x).pathname.startsWith('/api/')));
 // Seed the existing durable receipt in an isolated, non-app QA page, after the
 // real SW was installed. Never create a bypass inside product code.
 await navigate('/__qa_seed');
 await wait(()=>evaluate("document.title==='isolated local QA seed'"),'seed page');
 await evaluate("localStorage.setItem('li.sync.local-owner.v1','offline-qa-owner');localStorage.setItem('li.offline.device-invite.v3',JSON.stringify({v:3,uid:'offline-qa-owner',verifiedAt:Date.now()}));true");
 assert.equal(await evaluate("localStorage.getItem('li.sync.local-owner.v1')==='offline-qa-owner'&&JSON.parse(localStorage.getItem('li.offline.device-invite.v3')).uid==='offline-qa-owner'"),true,'QA seed readback');
 // Chromium asynchronously batches localStorage writes. Do not race them.
 await sleep(6000);
 await stop(); // new process with same persistent browser profile
 cut=true;
 await start();await offline();
 await navigate('/');
 const initial=await wait(()=>evaluate('window.__qaInitial'), 'pre-app storage diagnostic');
 console.log('COLD_LAUNCH_INITIAL',JSON.stringify(initial));
 assert(initial.owner&&initial.grant,'QA profile lost its synthetic owner or grant before product startup');
 assert.equal(initial.online,false,'cold navigation did not start offline');
 await ready('home');
 await evaluate("window.liReactRouter.navigate('capture')");
 await ready('capture');
 const draft='Offline cold launch QA note';
 await wait(()=>evaluate("Boolean(document.getElementById('li-react-capture-note'))"),'Capture field');
 await evaluate("document.getElementById('li-react-capture-note').focus()");
 await send('Input.insertText',{text:draft});
 await wait(()=>evaluate("window.liCaptureUi?.getDraft()==="+JSON.stringify(draft)+"&&window.liCaptureUi?.isReloadSafe()===true"),'offline draft durable');
 await sleep(6000);
 await stop();
 await start();await offline();await navigate('/?view=capture');await ready('capture');
 await wait(()=>evaluate("window.liCaptureUi?.getDraft()==="+JSON.stringify(draft)),'offline draft restored after process restart');
 await navigate('/?view=catalog');await ready('catalog');
 // Expired and missing receipt must never expose private screens even if SDK
 // remains pending. Local work is not deleted.
 await evaluate("localStorage.setItem('li.offline.device-invite.v3',JSON.stringify({v:3,uid:'offline-qa-owner',verifiedAt:Date.now()-8*86400000}));true");
 await navigate('/?view=capture');
 await wait(async()=>{const s=await state();return s.ready&&!s.verified&&s.auth;},'expired offline grant locked');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.app')).display==='none'"),true);
 await evaluate("localStorage.removeItem('li.offline.device-invite.v3');true");
 await navigate('/');
 await wait(async()=>{const s=await state();return s.ready&&!s.verified&&s.auth;},'no offline grant locked');
 // OAuth callback is not a public SPA fallback; offline fetch cannot be served.
 const callback=await evaluate("fetch('/?neon_auth_session_verifier=qa-unreal',{cache:'no-store'}).then(()=>false,()=>true)");
 assert.equal(callback,true);
 assert.equal(await evaluate("fetch('/api/auth/get-session',{cache:'no-store'}).then(()=>false,()=>true)"),true);
 console.log('PASS cold launch, deep link, real draft persistence, expired/no-grant denial and uncached Auth endpoints. Origin server unavailable; blocked requests='+servedAfterCut);
}finally{await stop();server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(tmp,{recursive:true,force:true});}
