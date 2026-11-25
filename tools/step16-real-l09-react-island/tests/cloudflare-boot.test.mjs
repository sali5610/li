import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const boot=read('tools/platform/cloudflare-boot.html');
const builder=read('tools/prepare_cloudflare_ai_candidate.mjs');
const config=read('tools/platform/workbox-auth-only-config.cjs');
const app=read('tools/step16-real-l09-react-island/src/auth/staging-app.tsx');
const ai=read('tools/step16-real-l09-react-island/src/learning/AiFeedbackPanel.tsx');
test('Cloudflare assembly inserts real boot scenes before protected app and retains approved assets',()=>{
 assert.match(builder,/cloudflare-boot\.html/);
 assert.match(builder,/html:not\(\.li-boot-ready\) \.app/);
 assert.match(builder,/html\.li-boot-ready #li-boot-splash\{display:none!important\}/);
 for(const id of ['li-boot-loading','li-boot-error','li-boot-error-retry']){
  assert(boot.includes('id="'+id+'"'));
  assert(app.includes("'"+id+"'"));
 }
 for(const asset of ['laoly-state-loading.png','laoly-state-error.png']){
  assert(boot.includes(asset));assert(config.includes(asset));
  const bytes=readFileSync(new URL('site/assets/'+asset,root));
  assert(bytes.length>1000);assert.equal(bytes.subarray(1,4).toString(),'PNG');
 }
 assert.match(config,/li-push-handler\.js/);
});
function fixture(owned=false,lang='vi'){
 let reloads=0,timeout,listener;
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{hidden:id==='li-boot-error',textContent:'',addEventListener(_,fn){this.click=fn;}});return elements.get(id);};
 const window={liBootRuntimeReady:owned,addEventListener(_,fn){listener=fn;},setTimeout(fn){timeout=fn;}};
 vm.runInNewContext(boot.match(/<script>([\s\S]*?)<\/script>/)[1],{window,document:{getElementById:get,documentElement:{lang,classList:{contains:()=>false}}},location:{reload(){reloads++;}}});
 return {get,window,timeout:()=>timeout(),error:()=>listener({target:{tagName:'SCRIPT',src:'https://li5610.pages.dev/assets/li-first-party-app.js'}}),reloads:()=>reloads};
}
test('actual entry failure shows approved error, retry works, English copy supported',()=>{
 const f=fixture(false,'en');assert.equal(f.get('li-boot-error').hidden,true);
 f.error();assert.equal(f.get('li-boot-loading').hidden,true);assert.equal(f.get('li-boot-error').hidden,false);
 assert.equal(f.get('li-boot-error-retry').textContent,'Reload the app');f.get('li-boot-error-retry').click();assert.equal(f.reloads(),1);
});
test('fallback timeout only acts before React startup ownership',()=>{
 const f=fixture();f.timeout();assert.equal(f.get('li-boot-error').hidden,false);
 const live=fixture(true);live.timeout();live.error();assert.equal(live.get('li-boot-error').hidden,true);
 live.get('li-boot-error-retry').click();assert.equal(live.reloads(),0);
});
test('AI scene reflects actual request state, no fake delay or automatic inference',()=>{
 assert.match(ai,/busy&&<div className="li-state-scene" data-li-state="loading"/);
 assert.match(ai,/message&&!busy&&<div className="li-state-scene" data-li-state="error"/);
 assert.match(ai,/message\?\(vi\?'Thử lại':'Retry'\)/);
 assert.match(ai,/onClick=\{\(\)=>void review\(\)\}/);
 assert.match(ai,/await fetch\('\/api\/ai\/feedback'/);
 assert.doesNotMatch(ai,/setTimeout\(/);
});

test('offline shell includes required Home content script, public art and safe SPA route fallback',()=>{
 assert.match(config,/content-packs\/\*\.\{js,json\}/);
 assert.match(config,/assets\/discipline\/\*\.webp/);
 assert.match(config,/assets\/home-li-\*\.webp/);
 assert.match(config,/navigateFallback:'index\.html'/);
 assert.match(config,/navigateFallbackDenylist:[^\n]*neon_auth_session_verifier/);
 assert.match(app,/route!=='home'\|\|!navigator\.onLine\|\|home\.dataset\.liBootArtReady/);
 const home=read('tools/step16-real-l09-react-island/src/shell/home-catalog.tsx');
 assert.match(home,/candidate\.onerror=reveal/);
 assert.match(home,/image\.onerror=fail/);
 assert.match(home,/mirrorSettled/);
});
