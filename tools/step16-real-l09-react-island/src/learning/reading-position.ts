import type {Attempt} from '../native-bridge.js';
import type {LearningPorts} from './ports.js';

export const readingPages=['read','guided','practice','feedback','progress'] as const;
export type ReadingPage=typeof readingPages[number];
export type ReadingPosition={phase:ReadingPage;top:number;stamp:string;locale:'vi'|'en'};
export type ReadingPositionPort={
 load(input:{lessonId:string;subjectId:string}):unknown;
 save(input:{lessonId:string;subjectId:string;position:ReadingPosition}):void;
 clear(input:{lessonId:string;subjectId:string}):void;
};
// No answer text, notes or ratings in this device-only position.
// An older attempt/round must not override newly committed learning progress.
export function readingStamp(a:Attempt):string{
 return JSON.stringify([a.attemptNumber||1,a.startedAt||null,a.submittedAt||null,
  a.submitted,a.reviewed,a.contentVersion||null,
  a.draft.some(x=>x.trim()),!!a.guidedDraft.trim(),a.methodChoice||null,
  Object.entries(a.methodAttempts||{}).map(([id,m])=>[id,!!m?.draft,!!m?.submittedAt]).sort()]);
}
export function readPosition(ports:LearningPorts,lessonId:string,subjectId:string,a:Attempt):ReadingPosition|null{
 try{
  const p=ports.readingPosition?.load({lessonId,subjectId}) as Partial<ReadingPosition>|null|undefined;
  if(!p||!readingPages.includes(p.phase as ReadingPage)||p.stamp!==readingStamp(a)||
   (p.locale!=='vi'&&p.locale!=='en')||typeof p.top!=='number'||!Number.isFinite(p.top)||p.top<0||p.top>1000000)return null;
  return {phase:p.phase as ReadingPage,top:p.top,stamp:p.stamp,locale:p.locale};
 }catch{return null;}
}
export function clearPosition(ports:LearningPorts,lessonId:string,subjectId:string|null){
 if(!subjectId)return;
 try{ports.readingPosition?.clear({lessonId,subjectId});}catch{/* Optional device bookmark. */}
}
export const readingPositionKey=(lessonId:string,subjectId:string)=>
 'li.reader.position.'+encodeURIComponent(subjectId)+'.'+lessonId+'.v1';
