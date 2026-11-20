/** Only source-reviewed, explicitly staged lessons from canonical GitHub content.
 * No client-provided "reference", "rubric" or citation is accepted.
 */
import lesson03 from '../../../../content/lessons/L03-1-2.json';
import lesson09 from '../../../../content/lessons/L09-1-2.json';
import lesson15 from '../../../../content/lessons/L15-2-2.json';
import type {AiLesson} from './ai-access-server.js';

const approved=[lesson03,lesson09,lesson15];
export function reviewedAiLesson(id:string,locale:'vi'|'en'):AiLesson|null{
 const lesson=approved.find(entry=>entry.id===id);
 if(!lesson||lesson.reviewState!=='approved'||lesson.publishState!=='review_only')
  return null;
 const text=lesson.content.localized[locale];
 if(!text||!Array.isArray(text.questions)||text.questions.length!==4||
  !Array.isArray(text.rubricItems)||text.rubricItems.length!==4||
  typeof text.answer!=='string')return null;
 return {
  id,title:text.title,locale,
  questionText:[...text.questions],
  modelAnswer:text.answer.replace(/<[^>]*>/g,' ').slice(0,2600),
  rubric:text.rubricItems.map(pair=>pair.join(' — '))
 };
}
