/* li. ONT-04C2a — local, synchronous quote-stage safety for existing S121 buddy.
 * This is UI/anti-spoiler behavior only. Not authentication, scoring or an AI model.
 * Personal invite-only app: copyright reuse clearance is NOT a gate.
 */
(function(root){
"use strict";
const safeStages=new Set(["opening","concept","guided"]);
const blockedStages=new Set(["independent","reflection","extension"]);
function evaluate(input){
 const v=input&&typeof input==="object"&&!Array.isArray(input)?input:{};
 const page=typeof v.page==="string"?v.page:"";
 if(v.calmMode===true)return Object.freeze({allowed:false,reason:"calm_mode"});
 if(v.debateMode===true)return Object.freeze({allowed:false,reason:"buddy_debate"});
 if(v.feedbackVisible===true)return Object.freeze({allowed:false,reason:"hint_feedback_or_solution_visible"});
 // Public/non-lesson surfaces continue to use the authored S121 quote cards.
 const lessonPage=/^lessonL\d{2}$/.test(page);
 // Legacy generic lesson/case screens do not expose a trusted stage, so never
 // infer that an assessment is safe just because no Wave1 context exists.
 if(page==="lesson"||page==="case")return Object.freeze({allowed:false,reason:"unstaged_assessment_screen"});
 if(!lessonPage)return Object.freeze({allowed:true,reason:"nonlesson_cultural_quote"});
 const lesson=v.lessonContext;
 // No companion, incomplete manifest, mismatched native page: fail CLOSED.
 if(!lesson||typeof lesson!=="object"||lesson.page!==page||
   typeof lesson.lesson_id!=="string"||
   !/^L\d{2}-\d+-\d+$/.test(lesson.lesson_id)||
   !Array.isArray(lesson.quote_ids)||lesson.quote_ids.length<1)
  return Object.freeze({allowed:false,reason:"lesson_context_not_ready"});
 if(blockedStages.has(lesson.stage))return Object.freeze({allowed:false,reason:"assessment_or_postsubmit_stage"});
 if(!safeStages.has(lesson.stage))return Object.freeze({allowed:false,reason:"unknown_lesson_stage"});
 return Object.freeze({allowed:true,reason:"preassessment_editorial_quote"});
}
function quoteMetadataOK(q){
 try{
  if(!q||typeof q!=="object")return false;
  if(typeof q.id!=="string"||!q.id||typeof q.original!=="string"||!q.original.trim())return false;
  if(typeof q.meta!=="string"||!q.meta.trim()||typeof q.translation!=="string"||!q.translation.trim())return false;
  return new URL(q.url).protocol==="https:";
 }catch(e){return false;}
}
root.liQuoteStageGate=Object.freeze({evaluate,quoteMetadataOK,version:"ONT-04C2a-0.1.0"});
})(typeof window!=="undefined"?window:globalThis);
