import React,{useEffect,useState} from 'react';
import {Button} from '../../../../design-system/react/Components';
import {Text} from '../../../../design-system/react/Atoms';

type Status={dueAt:number|null;awaitingRating:boolean;reviewCount:number};
type T02Port=Window&{LiSpellPractice?:{getT02Status?:(id:string)=>Status|null}};
function read(id:string):Status|null{
 return (window as T02Port).LiSpellPractice?.getT02Status?.(id)??null;
}
/** A small learner-facing status for the existing T02 schedule.
 * No timer writes, new persistence model, or background notification. */
export function T02ReviewEntry({lessonId,vi,disabled,onOpen}:{
 lessonId:string;vi:boolean;disabled:boolean;onOpen:()=>void;
}){
 const [status,setStatus]=useState<Status|null>(()=>read(lessonId));
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{
  const refresh=()=>{setStatus(read(lessonId));setNow(Date.now());};
  refresh();
  const timer=setInterval(refresh,60_000);
  window.addEventListener('focus',refresh);
  window.addEventListener('pageshow',refresh);
  window.addEventListener('li:private-personal-change',refresh);
  window.addEventListener('li:personal-sync-applied',refresh);
  document.addEventListener('visibilitychange',refresh);
  return()=>{
   clearInterval(timer);
   window.removeEventListener('focus',refresh);
   window.removeEventListener('pageshow',refresh);
   window.removeEventListener('li:private-personal-change',refresh);
   window.removeEventListener('li:personal-sync-applied',refresh);
   document.removeEventListener('visibilitychange',refresh);
  };
 },[lessonId]);
 const due=!!status?.dueAt&&status.dueAt<=now;
 let message=vi?'Chưa đặt lịch ôn. Lượt đầu sẽ đến hạn sau 24 giờ.':
  'No review scheduled. Your first review will be due after 24 hours.';
 let button=vi?'Hẹn ôn bài này · T02':'Schedule this lesson · T02';
 let state='unscheduled';
 if(!status){
  state='unavailable';
  message=vi?'Chưa đọc được lịch ôn; mở T02 để kiểm tra.':'Review schedule unavailable; open T02 to check.';
  button=vi?'Mở T02':'Open T02';
 }else if(status.awaitingRating){
  state='rating';
  message=vi?'Đã đối chiếu lượt ôn. Tự đánh giá để đặt lịch tiếp.':
   'Review feedback is ready. Self-rate to schedule the next review.';
  button=vi?'Tiếp tục tự đánh giá · T02':'Finish self-rating · T02';
 }else if(due){
  state='due';
  message=vi?'Đã đến hạn. Tự gọi nhớ trước khi xem feedback.':
   'Review due now. Recall from memory before checking feedback.';
  button=vi?'Ôn đến hạn · T02':'Review due · T02';
 }else if(status.dueAt){
  state='scheduled';
  message=(vi?'Ôn tiếp: ':'Next review: ')+
   new Date(status.dueAt).toLocaleString(vi?'vi-VN':'en-US')+
   (vi?' · Chưa đến hạn.':' · Not due yet.');
  button=vi?'Xem lịch ôn · T02':'View review schedule · T02';
 }
 return <div className="li-t02-review-entry" data-li-t02-status={state}>
  <Text role="support" aria-live="polite">{message}</Text>
  <Button variant="secondary" disabled={disabled} onClick={onOpen}>{button}</Button>
 </div>;
}
