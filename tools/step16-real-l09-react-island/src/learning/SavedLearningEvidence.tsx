import React from 'react';
import {Heading,Text} from '../../../../design-system/react/Atoms';
import type {Attempt} from '../native-bridge';
import {summarizeSavedAttempt} from './learning-analytics.mjs';

/** Private per-lesson progress from an already saved attempt only. */
type SpellReceipt={methodId:string;count:number};
type SpellHistoryWindow=Window&{LiSpellPractice?:{
 getLessonPracticeSummary?:(lessonId:string,subjectId:string)=>SpellReceipt[]|null
}};
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
  <Text role="support">{vi?'Tự đánh giá không phải điểm thông thạo. Chưa đo khả năng áp dụng vào tình huống mới chưa luyện.':'Self-review is not mastery. Transfer to an untrained task has not been measured.'}</Text>
 </section>;
}
