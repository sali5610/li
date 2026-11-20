import React from 'react';
import {Button} from '../../../../design-system/react/Components';
import {Text} from '../../../../design-system/react/Atoms';

/** Step 17: no model/API calls, no answer inspection or automatic grading.
 * Uses only a learner's own ratings and the published lesson's existing rubric.
 * Works with the bundled VI/EN course content even without a network response.
 */
type SelfRating=0|1|2|null;
type Props={
 rubricItems:readonly (readonly string[])[];
 ratings:readonly SelfRating[];
 locale:'vi'|'en';
 onReviewTheory:()=>void;
};
export function SelfReviewNextStep({rubricItems,ratings,locale,onReviewTheory}:Props){
 const vi=locale==='vi';
 const completed=ratings.filter(score=>score!==null).length;
 if(completed===0)return null;
 // Pick a 0 before a 1, retaining authored rubric order for ties.
 // Never infer correctness by matching keywords in a private free-text answer.
 let focus=-1;
 for(let i=0;i<rubricItems.length;i++){
  const rating=ratings[i];
  if(rating!==0&&rating!==1)continue;
  if(focus<0||rating<(ratings[focus]??2))focus=i;
 }
 if(focus<0){
  if(completed<rubricItems.length)return null;
  return <div className="li-learning-next-action" role="status" aria-live="polite">
   <Text role="support">{vi?
    'Bạn tự chấm đủ 2 điểm ở mọi tiêu chí. Đây chỉ là tự đánh giá, không phải AI chấm hay xác nhận đã thành thạo.':
    'You rated every criterion 2 points. This is your self-review, not an AI grade or verified mastery.'}</Text>
  </div>;
 }
 const criterion=rubricItems[focus];
 return <div className="li-learning-next-action" role="status" aria-live="polite">
  <strong>{vi?'Gợi ý ôn tiếp theo':'Suggested next review'}</strong>
  <Text role="support">{vi?
   'Dựa trên điểm bạn tự chấm (không phân tích bài viết): hãy đối chiếu lại tiêu chí này với đáp án mẫu.':
   'Based on your own rating (without analysing your written answer): compare this criterion with the model response.'}</Text>
  <Text role="body"><strong>{criterion[0]}</strong></Text>
  <Text role="support">{criterion[1]}</Text>
  <Button variant="secondary" onClick={onReviewTheory}>
   {vi?'Ôn lại phần lý thuyết':'Review the lesson theory'}
  </Button>
 </div>;
}
