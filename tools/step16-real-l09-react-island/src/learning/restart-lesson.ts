/* Reset only the current lesson attempt. Persist through the existing
 * account-scoped Dexie/Neon writer; never delete the key locally. */
import {initial} from '../native-bridge.js';
import type {Attempt} from '../native-bridge.js';

export function freshLessonAttempt(current:Attempt):Attempt{
 return {...initial(),locale:current.locale};
}

export function confirmLessonRestart(id:string,locale:'vi'|'en'):boolean{
 const message=locale==='vi'
  ?'Học lại bài '+id+' từ đầu? Toàn bộ câu trả lời, lượt nộp, tự đánh giá và lượt luyện Thần Chú trong bài này sẽ bị xóa. Các bài khác không bị ảnh hưởng. Không thể hoàn tác.'
  :'Restart lesson '+id+'? This clears its answers, submissions, self-ratings and in-lesson spell attempts. Other lessons stay unchanged. This cannot be undone.';
 return window.confirm(message);
}
