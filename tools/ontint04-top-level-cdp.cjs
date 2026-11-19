#!/usr/bin/env node
/* ONT-INT-04: real TOP-LEVEL localhost Chromium CDP history; no iframe or remote write. */
'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const chromeBin=process.argv[2],base='http://127.0.0.1:8794/site/index.html';
const url=base+'?lesson=L09-1-2&li-react=l09-native-fixture&li-search-react=typed-v1';
if(!chromeBin||typeof WebSocket!=='function')throw Error('Node22+ and Chromium path required');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),profile=fs.mkdtempSync(path.join(os.tmpdir(),'li-ont04-top-'));
let chrome,socket,seq=0,stderr='';const pending=new Map(),checks=[],cdpEvents=[];
async function until(fn,label,max=23000){let last;for(let t=Date.now();Date.now()-t<max;){try{last=await fn();if(last)return last}catch(e){last=e.message}await sleep(100)}throw Error('TIMEOUT '+label+' '+JSON.stringify(last))}
async function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},12000);pending.set(id,m=>{clearTimeout(t);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result||{})});socket.send(JSON.stringify({id,method,params}))})}
async function js(expression){const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(x.exceptionDetails)throw Error('Runtime '+JSON.stringify(x.exceptionDetails));return x.result?.value}
async function state(){return js(`(()=>({url:location.pathname+location.search,claimed:new URLSearchParams(location.search).get('li-local-page'),history:history.state,length:history.length,active:[...document.querySelectorAll('section.page.active')].map(x=>x.id),current:typeof currentPage==='string'?currentPage:null,search:document.querySelectorAll('#li-typed-search-root[data-li-search-mount="active"]').length,lesson:document.querySelectorAll('#li-step16-l09-react-host').length,runtime:document.getElementById('page-lessonL09')?.dataset.liRuntime||null,draft:document.querySelector('.pilot [data-answer="0"]')?.value||null,realKey:localStorage.getItem('li.review.L09-1-2.v1'),visits:localStorage.getItem('li.private.lesson.visits.v1'),synthetic:localStorage.getItem('step16.l09.shared-native-fixture.v1'),trace:window.__ont04Events||[],nav:performance.getEntriesByType('navigation').map(x=>x.type)}))()`)}
function assert(ok,label,proof){if(!ok)throw Error('ASSERT '+label+' '+JSON.stringify(proof));checks.push(label)}
async function start(){
 chrome=spawn(chromeBin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,url],{stdio:['ignore','ignore','pipe']});
 chrome.stderr.on('data',v=>stderr=(stderr+v.toString()).slice(-5000));
 const f=path.join(profile,'DevToolsActivePort'),port=await until(()=>fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n')[0]:null,'port',18000);
 const p=await until(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list'),a=await r.json();return a.find(x=>x.type==='page'&&x.url.startsWith(base)&&x.webSocketDebuggerUrl)},'page',18000);
 socket=new WebSocket(p.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('socket timeout')),12000);socket.addEventListener('open',()=>{clearTimeout(t);resolve()},{once:true});socket.addEventListener('error',()=>{clearTimeout(t);reject(Error('socket error'))},{once:true})});
 socket.addEventListener('message',e=>{let m;try{m=JSON.parse(String(e.data))}catch{return}if(m.id){const cb=pending.get(m.id);if(cb){pending.delete(m.id);cb(m)}}else if(['Page.frameNavigated','Page.navigatedWithinDocument','Page.lifecycleEvent'].includes(m.method))cdpEvents.push({event:m.method,url:m.params?.url||m.params?.frame?.url||'',name:m.params?.name||''})});
 await send('Page.enable');await send('Page.setLifecycleEventsEnabled',{enabled:true});await send('Runtime.enable');
}
async function main(){
 await start();
 const initial=await until(async()=>{const s=await state();return s.claimed==='lessonL09'&&s.runtime==='react-candidate'&&s.search===1&&s.lesson===1?s:null},'L09+Search top-level mount');
 assert(initial.active.length===1&&initial.active[0]==='page-lessonL09','initial lesson active',initial);
 assert(initial.search===1&&initial.lesson===1,'two roots mounted',initial);
 const real=initial.realKey,visits=initial.visits;
 await js(`(()=>{const el=document.querySelector('.pilot [data-answer="0"]'),setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(el,'ONT-INT04 top-level synthetic');el.dispatchEvent(new Event('input',{bubbles:true}))})()`);
 await until(async()=>{const s=await state();return s.synthetic?.includes('ONT-INT04 top-level')?s:null},'synthetic draft');
 assert((await state()).realKey===real,'synthetic writer cannot alter real key');
 await js("navigate('search',{focus:false})");
 const search=await until(async()=>{const s=await state();return s.claimed==='search'&&s.active.includes('page-search')?s:null},'navigate search');
 assert(search.length===2&&search.history?.liOntInt04Page==='search','two history entries',search);
 await send('Page.reload',{ignoreCache:true});
 const reload=await until(async()=>{const s=await state();return s.claimed==='search'&&s.active.includes('page-search')&&s.search===1&&s.lesson===0?s:null},'hard reload Search');
 assert(reload.active.length===1,'reload has one active Search view',reload);
 await js(`(()=>{window.__ont04Events=[];for(const type of ['popstate','pageshow','pagehide'])window.addEventListener(type,()=>window.__ont04Events.push({type,claimed:new URLSearchParams(location.search).get('li-local-page'),active:[...document.querySelectorAll('section.page.active')].map(x=>x.id)}))})()`);
 const h=await send('Page.getNavigationHistory');
 const lessonEntry=h.entries.find(x=>new URL(x.url).searchParams.get('li-local-page')==='lessonL09');
 const searchEntry=h.entries.find(x=>new URL(x.url).searchParams.get('li-local-page')==='search');
 assert(!!lessonEntry&&!!searchEntry,'CDP top-level history entry IDs',h.entries);
 await send('Page.navigateToHistoryEntry',{entryId:lessonEntry.id});
 const back=await until(async()=>{const s=await state();return s.claimed==='lessonL09'&&s.active.includes('page-lessonL09')&&s.lesson===1?s:null},'CDP Back');
 assert(back.active.length===1&&back.draft?.includes('ONT-INT04 top-level'),'Back restores single L09 and synthetic draft',back);
 await send('Page.navigateToHistoryEntry',{entryId:searchEntry.id});
 let forward;try{forward=await until(async()=>{const s=await state();return s.claimed==='search'&&s.active.includes('page-search')?s:null},'CDP Forward',12000)}
 catch(e){throw Error('FORWARD_DIAGNOSTIC '+JSON.stringify({error:String(e),state:await state(),events:cdpEvents.slice(-25),entries:(await send('Page.getNavigationHistory')).entries.map(x=>({id:x.id,url:x.url}))}))}
 assert(forward.active.length===1,'Forward restores single active Search',forward);
 assert(forward.search===1&&forward.lesson<=1,'single React owners retained',forward);
 assert(forward.realKey===real&&forward.visits===visits,'real learner storage unchanged',forward);
 console.log('PASS ONT-INT04 TOP_LEVEL_CDP '+JSON.stringify({count:checks.length,checks,historyIds:[lessonEntry.id,searchEntry.id],physicalSafari:'NOT_RUN',signedRls:'NOT_RUN',deploy:'NONE'}));
}
main().catch(e=>{console.error('FAIL ONT-INT04 TOP_LEVEL_CDP '+e.message);if(stderr)console.error('Chromium stderr tail '+stderr.slice(-1300));process.exitCode=1}).finally(async()=>{try{socket?.close()}catch{}try{chrome?.kill('SIGKILL')}catch{}await sleep(400);try{await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:200})}catch{}});
