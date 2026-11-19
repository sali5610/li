/* Step16.2 opt-in L09 React inside the existing Vanilla shell.
 * Localhost research ONLY. Native screen stays authoritative everywhere else.
 * No production auth/sync, no shared native attempt key, no paid services.
 */
(()=>{
 'use strict';
 const params=new URLSearchParams(window.location.search);
 const local=window.location.protocol==='http:' &&
   (window.location.hostname==='127.0.0.1'||window.location.hostname==='localhost');
 if(!local||!['l09','l09-native-fixture'].includes(params.get('li-react')))return;
 const fixtureMode=params.get('li-react')==='l09-native-fixture';
 const fixtureKey='step16.l09.shared-native-fixture.v1';
 const page=document.getElementById('page-lessonL09');
 const challenge=document.getElementById('l09-challenge');
 const rubric=document.getElementById('l09-rubric');
 if(!page||!challenge||!rubric||page.dataset.liRuntime==='react-candidate')return;
 const current=document.currentScript;
 if(!current?.src)return;

 const host=document.createElement('div');
 host.id='li-step16-l09-react-host';
 host.hidden=true;
 host.dataset.localOnly='true';
 challenge.before(host);
 const css=document.createElement('link');
 css.rel='stylesheet';
 css.href=new URL('./step16-l09-island.css',current.src).href;

 function projectFixture(){
   // Read-only synthetic research projection: NEVER query the real li.review.* key,
   // mutate learner visits, or claim mastery. Review stage is binary 0 / 1.
   if(!fixtureMode)return;
   let model;
   try{
     const raw=window.localStorage.getItem(fixtureKey);
     model=raw===null?null:JSON.parse(raw);
     if(!model||typeof model!=='object'||Array.isArray(model)||
       !Array.isArray(model.draft)||model.draft.length!==4||
       !model.draft.every(x=>typeof x==='string')||
       typeof model.submitted!=='boolean'||typeof model.reviewed!=='boolean'||
       (model.reviewed&&!model.submitted))throw Error('invalid');
   }catch{
     page.dataset.liResearchStage='invalid';
     const status=document.getElementById('l09-progress');
     if(status)status.textContent='Lượt thử nghiệm không đọc được · không ghi đè';
     return;
   }
   const stage=model.reviewed?'reviewed':model.submitted?'submitted':'draft';
   const en=window.liLanguage?.get?.()==='en';
   page.dataset.liResearchStage=stage;
   const progress=document.getElementById('l09-progress');
   if(progress)progress.textContent=stage==='reviewed'?
     (en?'Demo: one self-review completed':'Bản thử nghiệm · Đã tự đánh giá 1 lượt'):
     stage==='submitted'?(en?'Demo: submitted, not reviewed':'Bản thử nghiệm · Đã nộp, chưa tự chấm'):
     (en?'Demo: self-review not completed':'Bản thử nghiệm · Chưa hoàn tất tự đánh giá');
   const bar=document.getElementById('l09-progressBar');
   if(bar)bar.setAttribute('aria-valuenow',model.reviewed?'1':'0');
   const fill=document.getElementById('l09-progressFill');
   if(fill)fill.style.width=model.reviewed?'100%':'0%';
   const resume=document.getElementById('l09-resume');
   if(resume)resume.textContent=model.reviewed?
     (en?'Demo: return to self-review':'Thử nghiệm · Xem lại lượt tự đánh giá'):
     (en?'Demo: continue L09':'Thử nghiệm · Tiếp tục L09');
   const catalogStatus=document.getElementById('li-l09-resume-status');
   if(catalogStatus)catalogStatus.textContent=model.reviewed?
     (en?'Demo: one self-review':'Thử nghiệm · 1 lượt tự đánh giá'):
     model.submitted?(en?'Demo: submitted':'Thử nghiệm · Đã nộp'):
     (en?'Demo: in progress':'Thử nghiệm · Đang học');
 }

 let settled=false;
 const cssReady=new Promise((resolve,reject)=>{
   css.onload=()=>resolve();
   css.onerror=()=>reject(Error('L09_STYLES_UNAVAILABLE'));
 });
 document.head.appendChild(css);

 const jsUrl=new URL('./step16-l09-island.js',current.src);
 Promise.all([cssReady,import(jsUrl.href)]).then(async ([,candidate])=>{
   if(typeof candidate.mountL09!=='function')throw Error('L09_MOUNT_UNAVAILABLE');
   await candidate.mountL09(host);
   // Keep theory, guided practice and academic sources in the native page.
   // React takes over only challenge + rubric in this local research slice.
   challenge.hidden=true;challenge.inert=true;
   rubric.hidden=true;rubric.inert=true;
   host.hidden=false;
   page.dataset.liRuntime='react-candidate';
   page.dataset.liResearchOnly='true';
   settled=true;
   if(fixtureMode){
     projectFixture();
     window.addEventListener('li:l09-fixture-updated',projectFixture);
     window.addEventListener('li:localechange',projectFixture);
     window.addEventListener('storage',event=>{
       if(event.key===fixtureKey)projectFixture();
     });
     // Local-only diagnostic API; capture holds raw in memory and rollback
     // requires confirmation plus exact expected current value.
     window.liStep16Fixture=Object.freeze({
       capture:()=>candidate.captureFixtureSnapshot(window.localStorage,window.location),
       rollback:(snapshot,expectedRaw,confirmed)=>{
         const restored=candidate.rollbackFixtureSnapshot(
           window.localStorage,window.location,snapshot,expectedRaw,confirmed
         );
         window.dispatchEvent(new CustomEvent('li:l09-fixture-rolled-back'));
         projectFixture();
         return restored;
       }
     });
   }
 }).catch(error=>{
   if(settled)return;
   // Only a local research flag reaches this branch; retain a safe error code for QA.
   page.dataset.liReactError=String(error?.name||'MOUNT_ERROR')+': '+String(error?.message||'unknown').slice(0,160);
   host.remove();css.remove();
   page.dataset.liRuntime='native-fallback';
   const notice=document.createElement('p');
   notice.className='state-note';
   notice.setAttribute('role','status');
   notice.textContent='Bản React thử nghiệm chưa tải được. Đã giữ nguyên bài học hiện tại.';
   challenge.prepend(notice);
 });
})();
