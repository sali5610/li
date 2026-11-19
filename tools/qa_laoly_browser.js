/* ONT-04C2b · real native site in same-origin iframe, actual Chromium DOM/scroll.
 * This QA page is generated ONLY in GitHub Actions working tree (never checked in).
 * It tests no real user account, Neon DB or Cloudflare production deployment.
 */
(async function(){
 "use strict";
 const status=document.getElementById("qa-status");
 const ledger=document.getElementById("qa-ledger");
 const frame=document.getElementById("qa-app");
 const cases=[], failures=[];
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const record=(id,pass,detail="")=>{
  const x={id,status:pass?"PASS":"FAIL",detail:String(detail).slice(0,220)};
  cases.push(x);if(!pass)failures.push(x);
 };
 const until=async(fn,timeout=13000)=>{
  const started=Date.now();
  while(Date.now()-started<timeout){
   try{const result=fn();if(result)return result;}catch(e){}
   await delay(120);
  }
  throw Error("TIMEOUT waiting for real native app bootstrap / companion manifests");
 };
 async function afterScroll(win){
  win.dispatchEvent(new win.Event("scroll"));
  await delay(170);
 }
 function quoteState(doc){
  const original=doc.getElementById("buddy-quote-original");
  const trans=doc.getElementById("buddy-quote-translation");
  const meta=doc.getElementById("buddy-quote-meta");
  const link=doc.getElementById("buddy-quote-link");
  const info=doc.getElementById("buddy-quote-info");
  return {
   shown:!original.hidden&&!trans.hidden&&!info.hidden,
   cleared:original.hidden&&trans.hidden&&info.hidden&&original.textContent===""&&
    trans.textContent===""&&meta.textContent===""&&!link.hasAttribute("href"),
   textLen:original.textContent.length,
   link:link.getAttribute("href")
  };
 }
 function visibleInFrame(doc,elem){
  if(!elem)return false;
  const r=elem.getBoundingClientRect();
  const vw=doc.documentElement.clientWidth;
  return r.width>0&&r.right>0&&r.left<vw&&r.right<=vw+2;
 }
 const run=async()=>{
  const win=await until(()=>{
   const w=frame.contentWindow;
   return w?.liLessonCompanion?.registered?.().length===3&&
    w?.liQuoteEngine?.render&&w?.liQuoteStageGate?.evaluate&&
    typeof w.navigate==="function"?w:null;
  },15000);
  const doc=win.document;
  record("real_app_loaded_and_3_manifest_loaded",true,"native index.html, 3 registered Wave1 companions");
  const viewports=[
   {id:"iphone_se_320",w:320,h:720},
   {id:"iphone_375",w:375,h:812},
   {id:"ipad_portrait_768",w:768,h:1024},
   {id:"ipad_landscape_1024",w:1024,h:768}
  ];
  // The same real app stays mounted when its iframe changes width.
  for(const p of viewports){
   frame.style.width=p.w+"px";frame.style.height=p.h+"px";
   win.dispatchEvent(new win.Event("resize"));
   await delay(100);
   const viewportWidth=doc.documentElement.clientWidth;
   record(p.id+"_width",Math.abs(viewportWidth-p.w)<=1,viewportWidth+" CSS px");
   record(p.id+"_no_document_horizontal_overflow",
    doc.documentElement.scrollWidth<=p.w+3,
    "doc width="+doc.documentElement.scrollWidth+" / view="+p.w);
  }
  frame.style.width="375px";frame.style.height="812px";
  win.dispatchEvent(new win.Event("resize"));await delay(100);
  for(const [id,route,prefix] of [
   ["L09-1-2","lessonL09","l09"],
   ["L03-1-2","lessonL03","l03"],
   ["L15-2-2","lessonL15","l15"]
  ]){
   const manifest=await (await win.fetch("./lessons/companion/"+id+".json")).json();
   win.navigate(route,{focus:false});
   await delay(160);
   record(id+"_native_route_active",doc.getElementById("page-"+route)?.classList.contains("active"),route);
   for(const locale of ["vi","en"]){
    const button=doc.getElementById(prefix+"-"+locale);
    if(button)button.click();
    await delay(65);
    record(id+"_"+locale+"_locale",doc.getElementById("page-"+route)?.getAttribute("lang")===locale,
      "root lang="+doc.getElementById("page-"+route)?.getAttribute("lang"));
    for(const moment of manifest.moments){
     const anchor=doc.getElementById(moment.anchor);
     record(id+"_"+locale+"_"+moment.stage+"_anchor_present",Boolean(anchor),moment.anchor);
     if(!anchor)continue;
     anchor.scrollIntoView({behavior:"instant",block:"start"});
     await afterScroll(win);
     const ctx=win.liLessonCompanion.getContext();
     // Reflection may be coerced to independent until a real submission.
     const expectedStage=moment.stage==="reflection"?"independent":moment.stage;
     record(id+"_"+locale+"_"+moment.stage+"_stage_reached",ctx?.stage===expectedStage,
      "actual="+ctx?.stage+" expected="+expectedStage+" top="+Math.round(anchor.getBoundingClientRect().top));
     // Exercise the actual Lão Lý opening path at each point, not only the pure resolver.
     win.openLaoLy();
     await delay(75);
     const quote=quoteState(doc),allowed=["opening","concept","guided"].includes(expectedStage);
     record(id+"_"+locale+"_"+moment.stage+"_quote",
      allowed?quote.shown:quote.cleared,
      "stage="+ctx?.stage+" shown="+quote.shown+" cleared="+quote.cleared);
     record(id+"_"+locale+"_"+moment.stage+"_modal_open",
      doc.getElementById("buddy-modal")?.classList.contains("open"),
      "Lão Lý native popup");
     if(allowed)record(id+"_"+locale+"_"+moment.stage+"_source_https",
      quote.link?.startsWith("https://"),
      quote.link||"no source");
     win.closeModal?.("buddy-modal");
    }
   }
  }
  // Changing a real hint/feedback DOM while a quote is visible must scrub stale text.
  win.navigate("lessonL09",{focus:false});
  const guidedAnchor=doc.getElementById("l09-guided");
  guidedAnchor?.scrollIntoView({behavior:"instant",block:"start"});
  await afterScroll(win);
  win.openLaoLy();await delay(50);
  const beforeHint=quoteState(doc);
  record("guided_quote_before_feedback",beforeHint.shown,"stage="+win.liLessonCompanion.getContext()?.stage);
  const hint=doc.getElementById("l09-guidedHint");
  hint.hidden=false;
  win.dispatchEvent(new win.Event("scroll"));
  await delay(90);
  record("visible_guided_hint_scrubs_old_quote",quoteState(doc).cleared,"stale quote after feedback");
  hint.hidden=true;
  win.closeModal?.("buddy-modal");
  // Local, isolated synthetic data only. No real user evidence or sync.
  win.navigate("lessonL09",{focus:false});
  const independent=doc.getElementById("l09-challenge");
  independent?.scrollIntoView({behavior:"instant",block:"start"});
  await afterScroll(win);
  const textareas=[...doc.querySelectorAll("#l09-questions textarea")];
  record("synthetic_four_answer_inputs_present",textareas.length===4,"textareas="+textareas.length);
  if(textareas.length===4){
   for(const [index,input]of textareas.entries()){
    input.value="Test only: this is a synthetic browser QA response. I distinguish observations from inferred claims, check the target population and bias, and limit my conclusion. Item "+(index+1)+".";
    input.dispatchEvent(new win.Event("input",{bubbles:true}));
   }
   doc.getElementById("l09-submit")?.click();
   await delay(160);
   const submitted=doc.getElementById("l09-answerBox")?.hidden===false;
   record("synthetic_l09_submit_unlocks_review_ui_only",submitted,
    "answerBox hidden="+doc.getElementById("l09-answerBox")?.hidden);
   const reflection=doc.getElementById("l09-rubric");
   reflection?.scrollIntoView({behavior:"instant",block:"start"});
   await afterScroll(win);
   const state=win.liLessonCompanion.getContext();
   win.openLaoLy();await delay(60);
   record("after_submit_stage_quote_still_suppressed",quoteState(doc).cleared,
    "stage="+state?.stage+" reviewed UI="+submitted);
   win.closeModal?.("buddy-modal");
  }
  const modal=doc.getElementById("buddy-modal");
  win.navigate("home",{focus:false});
  // Call the same native opening handler used by the floating Lão Lý trigger.
  // Old selector targeted a decorative node, not the live buddy action.
  win.openLaoLy();
  await delay(100);
  record("ordinary_home_buddy_quote_retained",quoteState(doc).shown,"non-assessment surface");
  record("home_modal_still_opens",modal.classList.contains("open"));
  // Capture the actual native home scene within responsive iframe.
  const appHasScrollableText=Boolean(doc.querySelector("#buddy-scroll"));
  record("buddy_scroll_region_present",appHasScrollableText);
  const overflow=doc.documentElement.scrollWidth>doc.documentElement.clientWidth+3;
  record("final_phone_no_horizontal_overflow",!overflow,
    doc.documentElement.scrollWidth+"/"+doc.documentElement.clientWidth);
  // NEVER treat simulated viewport/JS as a real iOS device/browser.
 };
 try{await run();}catch(e){record("harness_exception",false,e.stack||e.message);}
 const result={
  environment:"CHROMIUM_HEADLESS_SAME_ORIGIN_NATIVE_APP",
  deviceEmulation:"CSS_IFRAME_VIEWPORT_ONLY_NOT_SAFARI",
  physicalIPhone:"NOT_RUN",physicalIPad:"NOT_RUN",VoiceOver:"OUT_OF_SCOPE_PO_S208",
  humanRelease:"NOT_APPROVED",cloudflareDeploy:"NONE",userData:"EPHEMERAL_SYNTHETIC_ONLY",
  count:cases.length,pass:cases.filter(x=>x.status==="PASS").length,fail:failures.length,
  cases,failures
 };
 status.textContent=failures.length?"FAIL":"PASS";
 status.dataset.qaStatus=failures.length?"FAIL":"PASS";
 status.dataset.qaCount=String(cases.length);
 status.dataset.qaFailures=String(failures.length);
 ledger.textContent=JSON.stringify(result);
 document.title="ONT-04C2b Browser QA "+(failures.length?"FAIL":"PASS")+" "+cases.length;
})();
