/* li. L09-1-1 pure offline pilot state machine. No site integration or deployment.
 * Local progress is USER-EDITABLE: UX spoiler gate, never cryptographic protection.
 * Editorial source stays in Notion; runtime adapter/device QA still required.
 */
const L0911Pilot=(function(){
 "use strict";
 const LESSON_ID="L09-1-1",KEY="li.review.L09-1-1.v1",VERSION=1;
 const choices=new Set(["nominal","ordinal","discrete","continuous"]);
 function copy(v){return JSON.parse(JSON.stringify(v));}
 function localeOK(v){return v==="vi"||v==="en";}
 function createState(locale){
  const l=localeOK(locale)?locale:"vi";
  return {schema:VERSION,lesson_id:LESSON_ID,locale:l,section:"l0911-hook",attemptNumber:1,
   methods:{T06:{chosen:false,attempted:false,feedbackUnlocked:false,evidence:null,assisted:false},T07:{chosen:false,attempted:false,feedbackUnlocked:false,evidence:null,assisted:false}},
   independent:{draft:["","","",""],submitted:false,submission:null,submittedAt:null,answerRevealed:false,hintUsed:false,assisted:false,incomplete:false},
   selfReview:{ratings:[null,null,null,null],reviewed:false},guideReturn:null,attemptHistory:[],
   storageAvailable:true,warning:null};
 }
 function ensure(s){if(!s||s.schema!==VERSION||s.lesson_id!==LESSON_ID||!localeOK(s.locale)||!Array.isArray(s.independent&&s.independent.draft)||s.independent.draft.length!==4)throw Error("Invalid L09-1-1 state");}
 function update(s,fn){ensure(s);const n=copy(s);fn(n);return n;}
 function changeLocale(s,l){if(!localeOK(l))throw Error("Unsupported locale");return update(s,n=>{n.locale=l;});}
 function setSection(s,section){if(typeof section!=="string"||!/^l0911-[a-z-]+$/.test(section))throw Error("Invalid section");return update(s,n=>{n.section=section;});}
 function setDraft(s,index,value){if(!Number.isInteger(index)||index<0||index>3||typeof value!=="string")throw Error("Invalid draft input");return update(s,n=>{if(n.independent.submitted)throw Error("Submission is frozen");n.independent.draft[index]=value;});}
 function markHint(s){return update(s,n=>{if(n.independent.submitted)throw Error("Submission is frozen");n.independent.hintUsed=true;n.independent.assisted=true;});}
 function chooseMethod(s,id){if(id!=="T06"&&id!=="T07")throw Error("Unsupported method");return update(s,n=>{n.methods[id].chosen=true;});}
 function useMethodHint(s,id){if(id!=="T06"&&id!=="T07")throw Error("Unsupported method");return update(s,n=>{n.methods[id].assisted=true;n.methods[id].chosen=true;});}
 function submitMethod(s,id,evidence){if(id!=="T06"&&id!=="T07")throw Error("Unsupported method");
  if(!evidence||typeof evidence!=="object")throw Error("Method requires evidence");
  if(id==="T06"){
   const a=evidence.choices||{},keys=["A","B","C","D"];
   if(!keys.every(k=>choices.has(a[k]))||typeof evidence.reasoning!=="string"||evidence.reasoning.trim().length<10)throw Error("T06 requires four classifications and reasoning");
  }else{
   if(!["premise","claim","missingAssumption"].every(k=>typeof evidence[k]==="string"&&evidence[k].trim().length>=5))throw Error("T07 requires premise, claim and missing assumption");
  }
  return update(s,n=>{n.methods[id].chosen=true;n.methods[id].attempted=true;n.methods[id].feedbackUnlocked=true;n.methods[id].evidence=copy(evidence);});
 }
 function submitIndependent(s,opts){const o=opts||{};return update(s,n=>{
  if(n.independent.submitted)throw Error("Submission already frozen");
  const answers=n.independent.draft.map(x=>x.trim());const filled=answers.filter(x=>x.length>=5).length;
  if(filled===0)throw Error("Cannot submit empty answers");
  if(filled<4&&!o.allowIncomplete)throw Error("Four substantive answers required, or mark incomplete");
  n.independent.submitted=true;n.independent.incomplete=filled<4;n.independent.submission=copy(n.independent.draft);n.independent.submittedAt=typeof o.submittedAt==="string"?o.submittedAt:null;
  n.independent.answerRevealed=false;
 });}
 function revealAnswer(s){return update(s,n=>{if(!n.independent.submitted)throw Error("Submit before answer");n.independent.answerRevealed=true;});}
 function scoreSelf(s,index,score){if(!Number.isInteger(index)||index<0||index>3||!Number.isInteger(score)||score<0||score>2)throw Error("Invalid self score");return update(s,n=>{if(!n.independent.submitted)throw Error("Submit before self rating");n.selfReview.ratings[index]=score;n.selfReview.reviewed=n.selfReview.ratings.every(x=>x!==null);});}
 function goToSpellbook(s){return update(s,n=>{n.guideReturn={lesson_id:LESSON_ID,section:n.section,locale:n.locale};});}
 function returnFromSpellbook(s){return update(s,n=>{const a=n.guideReturn;if(a&&a.lesson_id===LESSON_ID){n.section=a.section;n.locale=a.locale;}else{n.section="l0911-hook";n.warning="Return point unavailable";}n.guideReturn=null;});}
 function startNewAttempt(s){return update(s,n=>{if(!n.independent.submitted)throw Error("Finish current attempt first");n.attemptHistory.push({attemptNumber:n.attemptNumber,submission:copy(n.independent.submission),submittedAt:n.independent.submittedAt,assisted:n.independent.assisted,ratings:copy(n.selfReview.ratings)});n.attemptNumber+=1;n.independent={draft:["","","",""],submitted:false,submission:null,submittedAt:null,answerRevealed:false,hintUsed:false,assisted:false,incomplete:false};n.selfReview={ratings:[null,null,null,null],reviewed:false};n.methods={T06:{chosen:false,attempted:false,feedbackUnlocked:false,evidence:null,assisted:false},T07:{chosen:false,attempted:false,feedbackUnlocked:false,evidence:null,assisted:false}};n.section="l0911-hook";});}
 function restore(raw){try{const s=typeof raw==="string"?JSON.parse(raw):copy(raw);ensure(s);if(typeof s.independent.submitted!=="boolean"||!s.methods||!s.methods.T06||!s.methods.T07)throw Error("Malformed progress");return {state:s,recovered:true,warning:null};}catch(err){const s=createState("vi");s.warning="Saved progress invalid; restarted locally";return {state:s,recovered:false,warning:s.warning};}}
 function getView(bundle,s){ensure(s);if(!bundle||bundle.schema!=="li.lesson.cms.v1.staging"||bundle.lesson_id!==LESSON_ID)throw Error("Mismatched content bundle");
  const l=bundle.locales[s.locale],m=l.technique_applications;
  return {locale:s.locale,lesson_id:LESSON_ID,pre:[l.hook.md,l.goals.md,l.concept.md,l.variable_types.md,l.guided.md],
   practice:{T06:{prompt:m.T06.prompt_md,feedback:s.methods.T06.feedbackUnlocked?m.T06.feedback_md:null},
     T07:{prompt:m.T07.prompt_md,feedback:s.methods.T07.feedbackUnlocked?m.T07.feedback_md:null}},
   independent:{prompt:l.independent.prompt_md,answer:s.independent.submitted&&s.independent.answerRevealed?l.independent.model_answer_md:null,
      rubric:s.independent.submitted?l.reflection.md:null},
   mentor:bundle.companion.moments.filter(x=>x.stage!=="reflection"||s.independent.submitted).map(x=>({stage:x.stage,anchor:x.anchor,quote_id:x.quote_id,quote_ids:x.quote_ids,prompt:x.locale[s.locale].prompt_md,actions:x.locale[s.locale].actions})),
   status:{submitted:s.independent.submitted,incomplete:s.independent.incomplete,rubricReviewed:s.selfReview.reviewed,assisted:s.independent.assisted,
     methodT06Enacted:s.methods.T06.attempted,methodT07Enacted:s.methods.T07.attempted}};
 }
 function evidence(s){ensure(s);return {K1:"NOT_AUTOGRADED",K2:{T06:s.methods.T06.chosen,T07:s.methods.T07.chosen},K3:{T06:s.methods.T06.attempted,T07:s.methods.T07.attempted},K4:"SELF_REPORT_OR_UNASSESSED",K5:null,K7:{independentAssisted:s.independent.assisted,methodT06Assisted:s.methods.T06.assisted,methodT07Assisted:s.methods.T07.assisted}};}
 return {LESSON_ID,KEY,VERSION,createState,changeLocale,setSection,setDraft,markHint,chooseMethod,useMethodHint,submitMethod,submitIndependent,revealAnswer,scoreSelf,goToSpellbook,returnFromSpellbook,startNewAttempt,restore,getView,evidence};
})();
export default L0911Pilot;
