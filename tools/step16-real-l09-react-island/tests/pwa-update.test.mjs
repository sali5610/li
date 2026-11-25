import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script=readFileSync(new URL('../../../tools/platform/pwa-cloudflare-register.js',import.meta.url),'utf8');
function harness({first=false,safe=true,route='home',locale='vi',oauth=false}={}){
 class Target{
  constructor(){this.listeners=new Map();}
  addEventListener(name,cb){const list=this.listeners.get(name)||[];list.push(cb);this.listeners.set(name,list);}
  fire(name){for(const cb of this.listeners.get(name)||[])cb();}
 }
 class Node extends Target{
  constructor(){super();this.children=[];this.style={};}
  setAttribute(k,v){this[k]=v;}
  append(...nodes){this.children.push(...nodes);for(const node of nodes)node.parent=this;}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  remove(){this.parent.children=this.parent.children.filter(x=>x!==this);}
 }
 let reloads=0,posts=0,updates=0;
 const sw=new Target(),old={},waiting=new Target(),registration=new Target();
 waiting.postMessage=msg=>{assert.equal(msg.type,'SKIP_WAITING');posts++;};
 Object.assign(registration,{waiting:first?null:waiting,update:async()=>{updates++;}});
 sw.controller=first?null:old;sw.register=async(path,options)=>{assert.equal(path,'/sw.js');assert.equal(options.scope,'/');return registration;};
 const document=new Target();document.body=new Node();document.hidden=false;
 document.documentElement={lang:locale,classList:{contains:()=>true}};
 document.createElement=()=>new Node();document.querySelectorAll=()=>[];
 const window=new Target();
 window.liReactRouter={getCurrent:()=>route};window.liCaptureUi={isReloadSafe:()=>safe};
 window.setTimeout=()=>1;window.clearTimeout=()=>{};
 const location={protocol:'https:',origin:'https://li5610.pages.dev',pathname:'/',search:oauth?'?neon_auth_session_verifier=opaque':'',reload:()=>reloads++};
 vm.runInNewContext(script,{window,document,navigator:{onLine:true,serviceWorker:sw},location,URLSearchParams});
 const panel=()=>document.body.children[0];
 const click=i=>panel().children[2].children[i].fire('click');
 const activate=()=>{registration.waiting=null;sw.controller={};sw.fire('controllerchange');};
 return {window,document,registration,panel,click,activate,stats:()=>({posts,reloads,updates}),setSafe:v=>safe=v,setRoute:v=>route=v,
  start:async()=>{window.fire('load');await Promise.resolve();await Promise.resolve();await Promise.resolve();}};
}
test('real waiting worker prompts, defer does not activate or reload; return can accept',async()=>{
 const h=harness();await h.start();
 assert.equal(h.panel().children[0].textContent,'li. có bản cập nhật mới');
 h.click(1);assert.equal(h.panel(),undefined);assert.equal(h.stats().posts,0);
 h.document.fire('visibilitychange');assert(h.panel());
 h.click(0);assert.equal(h.stats().posts,1);assert.equal(h.stats().reloads,0);
 h.activate();assert.equal(h.stats().reloads,1);
});
test('active lesson and unpersisted Capture prevent unsafe activation or reload',async()=>{
 const h=harness({route:'lessonL09'});await h.start();
 h.click(0);assert.equal(h.stats().posts,0);
 h.setRoute('capture');h.setSafe(false);h.click(0);assert.equal(h.stats().posts,0);
 h.setSafe(true);h.click(0);assert.equal(h.stats().posts,1);
 h.setSafe(false);h.activate();assert.equal(h.stats().reloads,0);
});
test('first install never prompts; another tab activation never reloads automatically',async()=>{
 const h=harness({first:true});await h.start();h.activate();assert.equal(h.panel(),undefined);assert.equal(h.stats().reloads,0);
 const x=harness({locale:'en'});await x.start();x.activate();
 assert.equal(x.stats().reloads,0);assert.equal(x.panel().children[0].textContent,'A new li. update is ready');
 x.click(0);assert.equal(x.stats().reloads,1);
});
test('OAuth verifier page never presents an update prompt',async()=>{
 const h=harness({oauth:true});await h.start();assert.equal(h.panel(),undefined);assert.equal(h.stats().posts,0);
});
test('actual Cloudflare assembler and Workbox config retain Push and opt-in activation',()=>{
 const config=readFileSync(new URL('../../../tools/platform/workbox-auth-only-config.cjs',import.meta.url),'utf8');
 const builder=readFileSync(new URL('../../../tools/prepare_cloudflare_ai_candidate.mjs',import.meta.url),'utf8');
 assert.match(config,/skipWaiting:false/);assert.match(config,/li-push-handler\.js/);
 assert.match(builder,/copyFile\(join\(repo,'tools\/platform\/pwa-cloudflare-register\.js'\)/);
});
