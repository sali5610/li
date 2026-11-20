/** Only source-reviewed, explicitly staged lessons from canonical GitHub content.
 * Learner-supplied question types, answer keys, citations and rubrics have no
 * authority; unclassified future questions fail closed (no model calls).
 */
import lesson03 from '../../../../content/lessons/L03-1-2.json';
import lesson09 from '../../../../content/lessons/L09-1-2.json';
import lesson15 from '../../../../content/lessons/L15-2-2.json';
import feedbackPolicy from '../../../../content/feedback/ai-question-modes.v1.json';
import type {AiLesson} from './ai-access-server.js';

const approved=[lesson03,lesson09,lesson15];
function plain(html:string):string{
 return html.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();
}
/** Extract authored numbered references without inventing an answer.
 * A mixed-format lesson with no 1–N reference mapping cannot invoke AI.
 */
function numberedAnswers(html:string,count:number):string[]|null{
 const all=plain(html);
 const matches=[...all.matchAll(/(?:^|\n)\s*([1-9])\.\s*/g)];
 if(matches.length!==count)return null;
 const result:string[]=Array(count).fill('');
 for(let i=0;i<matches.length;i++){
  const number=Number(matches[i][1])-1;
  if(number!==i)return null;
  const from=(matches[i].index??0)+matches[i][0].length;
  const until=i+1<matches.length?matches[i+1].index:all.length;
  result[number]=all.slice(from,until).trim();
  if(!result[number])return null;
 }
 return result;
}
export function reviewedAiLesson(id:string,locale:'vi'|'en'):AiLesson|null{
 const lesson=approved.find(entry=>entry.id===id);
 if(!lesson||lesson.reviewState!=='approved'||lesson.publishState!=='review_only')
  return null;
 const text=lesson.content.localized[locale];
 const policy=Object.prototype.hasOwnProperty.call(feedbackPolicy.lessons,id)?
  feedbackPolicy.lessons[id as keyof typeof feedbackPolicy.lessons]:null;
 const modes=policy?.modes;
 if(!text||!Array.isArray(text.questions)||text.questions.length!==4||
  !Array.isArray(text.rubricItems)||text.rubricItems.length!==4||
  typeof text.answer!=='string'||!Array.isArray(modes)||
  policy?.questionCount!==lesson.practice.questionCount||
  modes.length!==text.questions.length||
  !modes.every(mode=>mode==='exact'||mode==='open'))return null;
 const openIndices=modes.flatMap((mode,index)=>mode==='open'?[index]:[]);
 const split=numberedAnswers(text.answer,text.questions.length);
 // If any exact-answer question exists, a full unnumbered model key could
 // leak its exact answer into the prompt. Disable AI rather than guess.
 if(openIndices.length&&openIndices.length!==modes.length&&!split)return null;
 const openQuestions=openIndices.map(index=>({
  index,question:text.questions[index],rubric:text.rubricItems[index].join(' — '),
  modelAnswer:(split?.[index]??plain(text.answer)).slice(0,1900)
 }));
 return {id,title:text.title,locale,openQuestions};
}
