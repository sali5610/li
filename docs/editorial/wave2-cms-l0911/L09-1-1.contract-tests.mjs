/* Repeatable pure-unit checks for L09-1-1 CMS/offline state.
 * Invoked with current bundle and exported state API.
 * Node runner: run-l0911-offline.mjs. Tests do not simulate browser DOM.
 */
export function runChecks(api,b){
 const results=[];
 function a(v,message){if(!v)throw Error(message||"failed assertion")}
 function err(fn){let did=false;try{fn()}catch(e){did=true}a(did,"expected error")}
 function test(name,fn){try{fn();results.push({name,result:"PASS"});}catch(e){results.push({name,result:"FAIL",detail:String(e.message||e)});}}
 const meaningful=()=>{let s=api.createState("vi");["Tổng thể 8000 learners","Mẫu 320 iOS respondents","Biến là ID, count, thời lượng","Không đại diện toàn bộ"].forEach((x,i)=>{s=api.setDraft(s,i,x)});return s;};
 const six={choices:{A:"nominal",B:"discrete",C:"ordinal",D:"continuous"},reasoning:"A labels, B counts, C orders, D measures time."};
 const seven={premise:"30 of 40 volunteers","claim":"Applies to all learners","missingAssumption":"Sampling coverage is unknown"};
 const view=s=>api.getView(b,s);
 test("bundle schema",()=>a(b.schema==="li.lesson.cms.v1.staging"));
 test("correct lesson identity",()=>a(b.lesson_id==="L09-1-1"));
 test("separate storage from Wave1",()=>a(api.KEY==="li.review.L09-1-1.v1"));
 test("no existing Wave1 DOM ID collision",()=>a(b.runtime_contract.root_id==="page-lessonL0911"));
 test("two locales",()=>a(Object.keys(b.locales).length===2));
 test("VI hook first 90%",()=>a(b.locales.vi.hook.md.includes("90%")));
 test("EN hook first 90%",()=>a(b.locales.en.hook.md.includes("90%")));
 for(const locale of ["vi","en"]){
  test(locale+" no spoiler 80% pre-submit",()=>{
   const v=view(api.createState(locale));
   const texts=[...v.pre,v.practice.T06.prompt,v.practice.T07.prompt,v.independent.prompt];
   a(!texts.join(" ").includes("80%"));a(v.independent.answer===null);
  });
  test(locale+" challenge source numbers available",()=>a(b.locales[locale].independent.prompt_md.includes("256")&&b.locales[locale].independent.prompt_md.includes("320")));
  test(locale+" answer stays separately keyed",()=>a(b.locales[locale].independent.model_answer_md.includes("80%")));
  test(locale+" T06 feedback isolated from T07",()=>a(!b.locales[locale].technique_applications.T06.feedback_md.includes("30/40")));
  test(locale+" T07 feedback uses separate fictional sample",()=>a(b.locales[locale].technique_applications.T07.feedback_md.includes("30/40")));
 }
 test("exact six mentor stages",()=>a(b.companion.moments.length===6));
 test("all mentor labels have localized actions",()=>a(b.companion.moments.every(m=>m.locale.vi.actions.length===2&&m.locale.en.actions.length===2)));
 test("three quote IDs per mentor stage",()=>a(b.companion.moments.every(m=>m.quote_ids.length===3&&m.quote_id===m.quote_ids[0])));
 test("initial feedback locked",()=>a(view(api.createState()).practice.T06.feedback===null&&view(api.createState()).practice.T07.feedback===null));
 test("bad T06 evidence rejected",()=>err(()=>api.submitMethod(api.createState(),"T06",{choices:{A:"nominal"}})));
 test("bad T07 evidence rejected",()=>err(()=>api.submitMethod(api.createState(),"T07",{premise:"yes"})));
 test("T06 attempt unlocks only T06",()=>{const x=view(api.submitMethod(api.createState(),"T06",six));a(x.practice.T06.feedback!==null&&x.practice.T07.feedback===null)});
 test("T07 attempt unlocks only T07",()=>{const x=view(api.submitMethod(api.createState(),"T07",seven));a(x.practice.T06.feedback===null&&x.practice.T07.feedback!==null)});
 test("guide choice K2 not enacted K3",()=>{const m=api.evidence(api.chooseMethod(api.createState(),"T06"));a(m.K2.T06&&!m.K3.T06)});
 test("T06 unsent draft saved and migrates across JSON reload",()=>{let s=api.setMethodDraft(api.createState(),"T06","A","nominal");s=api.setMethodDraft(s,"T06","reasoning","A numeric ID labels a learner");const r=api.restore(JSON.stringify(s)).state;a(r.methods.T06.draft.A==="nominal"&&r.methods.T06.draft.reasoning.includes("labels"));});
 test("T07 unsent draft persisted without K3",()=>{let s=api.setMethodDraft(api.createState(),"T07","premise","Volunteer app banner sample");let r=api.restore(JSON.stringify(s)).state;a(r.methods.T07.draft.premise.includes("banner")&&!api.evidence(r).K3.T07);});
 test("writing a method draft sets K2 but not K3",()=>{let s=api.setMethodDraft(api.createState(),"T06","B","discrete");const e=api.evidence(s);a(e.K2.T06&&!e.K3.T06);});
 test("submitted method drafts cannot be changed",()=>{let s=api.submitMethod(api.createState(),"T06",six);err(()=>api.setMethodDraft(s,"T06","A","ordinal"));});
 test("old v1 save without method draft fields migrates without losing submission",()=>{let s=api.submitMethod(api.createState(),"T06",six);delete s.methods.T06.draft;delete s.methods.T07.draft;const r=api.restore(JSON.stringify(s));a(r.recovered&&r.state.methods.T06.attempted&&r.state.methods.T06.draft.A===""&&r.state.methods.T07.draft.premise==="");});
 test("retry resets draft and archives previous attempt's method evidence",()=>{let s=api.setMethodDraft(meaningful(),"T06","A","nominal");s=api.submitIndependent(s);s=api.startNewAttempt(s);a(s.methods.T06.draft.A===""&&s.attemptHistory[0].methods.T06.draft.A==="nominal");});

 test("actual T06 attempt sets K3 not K1 correctness",()=>{const m=api.evidence(api.submitMethod(api.createState(),"T06",six));a(m.K3.T06&&m.K1==="NOT_AUTOGRADED")});
 test("optional T07 may be skipped",()=>a(api.submitIndependent(meaningful()).independent.submitted));
 test("hint separately logged K7",()=>{let s=api.markHint(api.useMethodHint(api.createState(),"T06"));a(api.evidence(s).K7.methodT06Assisted&&api.evidence(s).K7.independentAssisted)});
 test("no invented K5 retention measurement",()=>a(api.evidence(api.createState()).K5===null));
 test("empty assessment rejected",()=>err(()=>api.submitIndependent(api.createState())));
 test("incomplete assessment must be explicit",()=>{let s=api.setDraft(api.createState(),0,"Có trả lời câu đầu");err(()=>api.submitIndependent(s));a(api.submitIndependent(s,{allowIncomplete:true}).independent.incomplete)});
 test("answer not auto-shown immediately after submit",()=>{const x=view(api.submitIndependent(meaningful()));a(x.independent.answer===null&&x.independent.rubric!==null)});
 test("answer requires submission",()=>err(()=>api.revealAnswer(api.createState())));
 test("answer visible only after reveal",()=>a(view(api.revealAnswer(api.submitIndependent(meaningful()))).independent.answer.includes("80%")));
 test("submission freezes draft editing",()=>err(()=>api.setDraft(api.submitIndependent(meaningful()),0,"Changed")));
 test("cannot submit same attempt twice",()=>err(()=>api.submitIndependent(api.submitIndependent(meaningful()))));
 test("self-rating requires submitted attempt",()=>err(()=>api.scoreSelf(api.createState(),0,2)));
 test("self-rating supports 4 x 0-2",()=>{let s=api.submitIndependent(meaningful());for(let i=0;i<4;i++)s=api.scoreSelf(s,i,i%3);a(s.selfReview.reviewed)});
 test("out-of-range self-rating rejected",()=>err(()=>api.scoreSelf(api.submitIndependent(meaningful()),0,3)));
 test("reflection locked before independent",()=>a(!view(api.createState()).mentor.some(x=>x.stage==="reflection")));
 test("reflection shown after independent",()=>a(view(api.submitIndependent(meaningful())).mentor.some(x=>x.stage==="reflection")));
 test("locale switch preserves drafts",()=>{let s=api.setDraft(api.createState(),0,"Giữ draft");s=api.changeLocale(s,"en");a(s.independent.draft[0]==="Giữ draft")});
 test("locale switch shares one submitted attempt",()=>{let s=api.changeLocale(api.submitIndependent(meaningful()),"en");a(s.independent.submitted&&s.attemptNumber===1&&view(s).locale==="en")});
 test("Spellbook return restores section and locale",()=>{let s=api.setSection(api.createState("vi"),"l0911-method");s=api.goToSpellbook(s);s=api.changeLocale(s,"en");s=api.setSection(s,"l0911-hook");s=api.returnFromSpellbook(s);a(s.section==="l0911-method"&&s.locale==="vi")});
 test("corrupt progress resets safely",()=>{let r=api.restore("{broken");a(!r.recovered&&!r.state.independent.submitted&&r.warning)});
 test("valid progress reload preserves submitted state",()=>{let s=api.submitIndependent(meaningful());a(api.restore(JSON.stringify(s)).state.independent.submitted)});
 test("fresh attempt retains previous submission and ratings",()=>{let s=api.scoreSelf(api.submitIndependent(meaningful()),0,2);s=api.startNewAttempt(s);a(s.attemptHistory.length===1&&s.attemptHistory[0].ratings[0]===2&&!s.independent.submitted)});
 test("fresh attempt retains prior L2-method evidence",()=>{let s=api.submitMethod(meaningful(),"T06",six);s=api.startNewAttempt(api.submitIndependent(s));a(s.attemptHistory[0].methods.T06.attempted&&!s.methods.T06.attempted)});
 test("fresh attempt prohibited before submission",()=>err(()=>api.startNewAttempt(api.createState())));
 test("unsupported locale rejected",()=>err(()=>api.changeLocale(api.createState(),"fr")));
 test("rights clearance remains open",()=>a(b.references.asset_review_gate==="OPEN"&&b.companion.quote_source_rights_review==="OPEN"));
 const pass=results.filter(x=>x.result==="PASS").length;
 return {schema:"li.wave2.offline-pilot.qa.v1",lesson_id:"L09-1-1",date:"2026-11-18",execution:"pure unit V8/Node compatible; not DOM/iPhone/CI",total:results.length,pass,fail:results.length-pass,results};
}
