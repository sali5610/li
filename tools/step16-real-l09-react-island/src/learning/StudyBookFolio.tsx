import React from 'react';

type Locale='vi'|'en';
const names:Record<Locale,Record<string,string>>={
 vi:{read:'Đọc và hiểu',guided:'Học có hướng dẫn',methods:'Thử phương pháp',practice:'Tự luyện tập',feedback:'Đối chiếu và tự đánh giá',progress:'Hoàn thành lượt học'},
 en:{read:'Read and understand',guided:'Guided learning',methods:'Study methods',practice:'Independent practice',feedback:'Feedback and self-review',progress:'Attempt complete'}
};

/** A visual page marker only: derives its position from the actual phase.
 * It neither estimates mastery nor writes learner progress.
 */
export function StudyBookFolio({phase,steps,locale}:{phase:string;steps:readonly string[];locale:Locale}){
 const index=steps.indexOf(phase);
 const current=index>=0?index+1:1;
 const vi=locale==='vi';
 return <div className="li-study-book-folio" role="note"
  aria-label={vi?`Bước ${current} trên ${steps.length}: ${names.vi[phase]??phase}`:
   `Step ${current} of ${steps.length}: ${names.en[phase]??phase}`}>
  <span className="li-study-book-seal" aria-hidden="true">理</span>
  <span className="li-study-book-folio-index" aria-hidden="true">
   {vi?'TRANG HỌC':'STUDY PAGE'} · {String(current).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}
  </span>
  <span className="li-study-book-folio-title" aria-hidden="true">{names[locale][phase]??phase}</span>
 </div>;
}
