import {spawn} from 'node:child_process';
import {writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
const chrome=process.env.CHROME_BIN||'/usr/bin/chromium';
const profile=resolve('/tmp','li-reminder-qa-'+process.pid);
const port=9227;
const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu',
 '--disable-dev-shm-usage','--no-first-run','--no-default-browser-check',
 '--remote-allow-origins=*','--remote-debugging-address=127.0.0.1',
 '--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const wait=async (fn,timeout=20000)=>{
 const until=Date.now()+timeout;
 while(Date.now()<until){try{const value=await fn();if(value)return value;}catch{}await sleep(100);}
 throw Error('BROWSER_QA_TIMEOUT');
};
let socket,serial=0;const pending=new Map();
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++serial,timeout=setTimeout(()=>{pending.delete(id);reject(Error('CDP '+method+' TIMEOUT'));},12000);
 pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));
});
const evalJs=async js=>{
 const {result,exceptionDetails}=await send('Runtime.evaluate',{expression:js,returnByValue:true,awaitPromise:true});
 if(exceptionDetails)throw Error('EVALUATION_EXCEPTION '+JSON.stringify(exceptionDetails).slice(0,450));
 return result?.value;
};
const assert=async (test,msg)=>{const result=await evalJs(test);if(result!==true)throw Error('QA_FAILED '+msg+': '+String(result));console.log('QA_PASS '+msg);};
try{
 const tab=await wait(async()=>{
  const response=await fetch('http://127.0.0.1:'+port+'/json/list');
  const list=await response.json();
  return list.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
 });
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 socket.addEventListener('message',event=>{
  const message=JSON.parse(String(event.data));
  if(!message.id)return;
  const task=pending.get(message.id);if(!task)return;
  clearTimeout(task.timeout);pending.delete(message.id);
  message.error?task.reject(Error(JSON.stringify(message.error))):task.resolve(message.result);
 });
 await send('Page.enable');
 await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true,
  screenWidth:390,screenHeight:844});
 await send('Page.navigate',{url:'http://127.0.0.1:8767/reminder-qa-fixture.html'});
 await wait(()=>evalJs('Boolean(window.__liQaReady && window.liReactToastPort)'));
 await assert("document.querySelector('#toast')?.style.display==='none'","toast hidden by default");
 await assert("!window.__liQa.isDue()","20:49 not due");
 await evalJs("window.__liQa.advance('20:53'); true");
 await wait(()=>evalJs("window.__liQa.isDue()"));
 await assert("(()=>{const n=document.querySelector('.li-in-app-reminder');return n?.parentElement===document.body && getComputedStyle(n).display!=='none' && n.textContent.includes('LÃO LÝ')})()",
  "20:53 real foreground popup visible despite hidden toast root");
 const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 mkdirSync('.qa-reminder-evidence',{recursive:true});
 writeFileSync('.qa-reminder-evidence/20-53-popup.png',Buffer.from(screenshot.data,'base64'));
 await evalJs("location.hash='#catalog'; true");
 await assert("window.__liQa.isDue()","popup survives route change");
 await evalJs("(()=>{document.querySelector('.li-in-app-reminder button')?.click();return true})()");
 await wait(()=>evalJs("!window.__liQa.isDue()"));
 await assert("(()=>{const v=JSON.parse(localStorage.getItem('li.reminders.delivery.v1:synthetic-owner-a'));return v.byKind.study.lastDay==='2026-11-22'})()",
  "dismissal receipt stored for current owner");
 await evalJs("window.__liQa.advance('20:54'); true");
 await sleep(300);
 await assert("!window.__liQa.isDue()","same-kind same-day does not notify twice");
 await evalJs("window.__liQa.signout(); true");
 await assert("!window.__liQa.isDue()","signout clears popup");
 await evalJs("window.__liQa.signin('synthetic-owner-b'); true");
 await wait(()=>evalJs("window.__liQa.isDue()"));
 await assert("window.__liQa.isDue()","second owner has independent due receipt");
 await evalJs("window.__liQa.signin('synthetic-owner-a'); true");
 await wait(()=>evalJs("!window.__liQa.isDue()"));
 await assert("!window.__liQa.isDue()","original owner receipt restored without cross-account leak");
 console.log('LI_IN_APP_REAL_CHROME_BROWSER_PASS 390 CSS pixels / synthetic 20:49→20:53 / no Cloudflare');
}finally{
 if(socket){for(const t of pending.values())clearTimeout(t.timeout);socket.close();}
 proc.kill('SIGTERM');
 try{rmSync(profile,{recursive:true,force:true});}catch{}
}
