import React,{useState} from 'react';
import {Button} from '../../../../design-system/react/Components';
import {Heading,Text} from '../../../../design-system/react/Atoms';
import type {Attempt} from '../native-bridge';
import {summarizeSavedAttempt} from './learning-analytics.mjs';

/** Private per-lesson progress from an already saved attempt only. */
type SpellReceipt={methodId:string;count:number};
type SpellHistoryWindow=Window&{LiSpellPractice?:{
 getLessonPracticeSummary?:(lessonId:string,subjectId:string)=>SpellReceipt[]|null
}};
/** Export only an explicitly saved submission. No account identifier, history,
 * answer key, external AI, or network request is included in this local file. */
export function buildReasoningReceipt(lessonId:string,attempt:Attempt){
 if(!summarizeSavedAttempt(attempt).submitted||!attempt.submission)return null;
 const locale=attempt.submissionLocale;
 const frozen=locale?attempt.reviewSnapshot?.questions[locale]:undefined;
 const criteria=locale?attempt.reviewSnapshot?.criteria[locale]:undefined;
 return {
  schemaVersion:1,lessonId,submittedAt:attempt.submittedAt,submissionLocale:locale??null,
  contentVersion:attempt.contentVersion??null,rubricVersion:attempt.rubricVersion??null,
  responses:attempt.submission.map((answer,i)=>({question:frozen?.[i]??null,answer})),
  selfReview:attempt.reviewed&&attempt.ratings.every(x=>x===0||x===1||x===2)?
   attempt.ratings.map((rating,i)=>({criterion:criteria?.[i]?.[0]??null,rating})):null,
  assistance:attempt.hint||attempt.assisted?'hint_recorded':'unknown',
  assessment:'self_review_only',untrainedTransferMeasured:false
 };
}
function ReasoningExport({attempt,lessonId,vi}:{attempt:Attempt;lessonId:string;vi:boolean}){
 const [error,setError]=useState(false);
 const receipt=buildReasoningReceipt(lessonId,attempt);
 if(!receipt)return null;
 function download(){
  if(!receipt)return;
  setError(false);
  let url:string|undefined;
  let anchor:HTMLAnchorElement|undefined;
  try{
   url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json;charset=utf-8'}));
   anchor=document.createElement('a');anchor.href=url;anchor.download='li-'+lessonId+'-submission.json';
   document.body.appendChild(anchor);anchor.click();
  }catch{setError(true);}
  finally{anchor?.remove();if(url){const release=url;window.setTimeout(()=>URL.revokeObjectURL(release),1000);}}
 }
 return <div data-li-reasoning-export={lessonId}>
  <Text role="support">{vi?'Xuất bài đã nộp và tự đánh giá đã lưu (nếu có) thành tệp riêng trên thiết bị. Tệp chứa nội dung bài làm của ngươi.':'Export the saved submission and saved self-review (if available) as a local file. It contains your answers.'}</Text>
  <Button variant="secondary" onClick={download}>{vi?'Xuất bài đã lưu (JSON)':'Export saved submission (JSON)'}</Button>
  {error&&<Text role="support">{vi?'Không tạo được tệp. Hãy thử lại.':'Could not create the file. Please try again.'}</Text>}
 </div>;
}

export function SavedLearningEvidence({attempt,vi,lessonId,subjectId}:{attempt:Attempt;vi:boolean;lessonId:string;subjectId:string|null}){
 const e=summarizeSavedAttempt(attempt);
 // Do not merge lifetime Spellbook receipts into this round's method submission.
 const history=subjectId?(window as SpellHistoryWindow).LiSpellPractice?.getLessonPracticeSummary?.(lessonId,subjectId):null;
 return <section data-li-saved-learning-evidence aria-label={vi?'Bằng chứng học đã lưu':'Saved learning evidence'}>
  <Heading level={3} role="titleSmall">{vi?'Bằng chứng học đã lưu':'Saved learning evidence'}</Heading>
  <Text role="support">{vi?'Lượt tự luyện: ':'Independent exercise: '}{e.submitted?(vi?'Đã nộp':'Submitted'):(vi?'Chưa có bài nộp':'No submission')}</Text>
  <Text role="support">{vi?'Lượt hoàn tất tự đánh giá (gồm lịch sử): ':'Completed self-review rounds (including saved history): '}{e.completedRounds}</Text>
  <Text role="support">{vi?'Thần Chú đã chọn: ':'Selected spell: '}{e.methodChoice==='skip'?(vi?'Bỏ qua':'Skipped'):e.methodChoice??(vi?'Chưa có ghi nhận':'Not recorded')}</Text>
  <Text role="support">{vi?'Thần Chú có bài luyện đã nộp: ':'Spells with a saved exercise: '}{e.methodApplications.length?e.methodApplications.join(', '):(vi?'Chưa có ghi nhận trong bài này':'Not recorded in this lesson')}</Text>
  {!!history?.length&&<Text role="support">{vi?'Lượt tự đối chiếu trong Sổ Tay (theo bài, gồm các lần trước): ':'Spellbook self-checks (lesson history, all rounds): '}{history.map(r=>r.methodId+' × '+r.count).join(', ')}</Text>}
  {e.assistance==='hint_recorded'&&<Text role="support">{vi?'Có ghi nhận dùng gợi ý.':'Hint use is recorded.'}</Text>}
  <ReasoningExport attempt={attempt} lessonId={lessonId} vi={vi}/>
  <Text role="support">{vi?'Tự đánh giá không phải điểm thông thạo. Chưa đo khả năng áp dụng vào tình huống mới chưa luyện.':'Self-review is not mastery. Transfer to an untrained task has not been measured.'}</Text>
 </section>;
}
