/**
 * Identical data, state machine and save semantics across all framework candidates.
 * This benchmark compares UI implementations and output bundle costs, not full
 * enterprise architecture or migration of the production li. source.
 */
export const STORAGE_KEY='step16.framework-benchmark.v1';
export const TASKS=[
 {id:'L09-1-2',title:{vi:'Lấy mẫu và thiên lệch',en:'Sampling and selection bias'},
  question:{vi:'Khảo sát chỉ lấy người tự bấm banner có rủi ro gì?',en:'What is the risk of a self-selected banner survey?'},
  options:{vi:['Không có rủi ro','Thiên lệch chọn mẫu','Chắc chắn ngẫu nhiên'],
   en:['No risk','Selection bias','Always random']},correct:1,
  hint:{vi:'Ai không bấm banner cũng không xuất hiện trong mẫu.',en:'People who never click the banner are absent.'}},
 {id:'L03-1-2',title:{vi:'Câu hỏi phỏng vấn',en:'Interview questions'},
  question:{vi:'Câu hỏi nào ít dẫn dắt người trả lời hơn?',en:'Which question is less leading?'},
  options:{vi:['Tính năng này tuyệt vời chứ?','Lần gần nhất bạn dùng nó thế nào?','Bạn đồng ý với tôi chứ?'],
   en:['This is excellent, right?','What happened the last time you used it?','You agree with me, right?']},correct:1,
  hint:{vi:'Hỏi về hành vi đã xảy ra, không gợi câu trả lời.',en:'Ask about a past behavior without suggesting an answer.'}},
 {id:'L15-2-2',title:{vi:'Lập luận và bằng chứng',en:'Reasoning and evidence'},
  question:{vi:'Một ví dụ cá biệt chứng minh điều gì?',en:'What can a single anecdote establish?'},
  options:{vi:['Một khả năng cần kiểm chứng','Kết luận cho toàn bộ dân số','Quan hệ nhân quả chắc chắn'],
   en:['A hypothesis to investigate','A population-wide conclusion','Certain causation']},correct:0,
  hint:{vi:'Một trường hợp không đại diện cho cả quần thể.',en:'One case does not represent an entire population.'}}
];
export const TEXT={
 vi:{brand:'li. · Thử nghiệm Step 16',progress:'Bài',submit:'Kiểm tra',next:'Tiếp',hint:'Gợi ý',reset:'Xóa dữ liệu giả',done:'Đã ghi bài luyện trong trình duyệt giả lập',need:'Chọn một đáp án',correct:'Đúng rồi',wrong:'Cần xem lại',locale:'English'},
 en:{brand:'li. · Step 16 spike',progress:'Lesson',submit:'Check',next:'Next',hint:'Hint',reset:'Clear fake progress',done:'Local practice saved in this fixture',need:'Pick an answer',correct:'Correct',wrong:'Try again',locale:'Tiếng Việt'}
};
const fresh=()=>({locale:'vi',index:0,selected:null,assisted:false,submitted:false,feedback:'',
  attempts:[]});
function valid(input){
 return input&&['vi','en'].includes(input.locale)&&Number.isInteger(input.index)
  &&input.index>=0&&input.index<TASKS.length&&Array.isArray(input.attempts);
}
export function load(storage=localStorage){
 try{const v=JSON.parse(storage.getItem(STORAGE_KEY)||'null');return valid(v)?v:fresh();}
 catch{return fresh();}
}
export function reduce(state,event){
 const task=TASKS[state.index],txt=TEXT[state.locale];
 switch(event.type){
 case 'locale':return {...state,locale:state.locale==='vi'?'en':'vi'};
 case 'hint':return state.submitted?state:{...state,assisted:!state.assisted};
 case 'option':return state.submitted?state:{...state,selected:event.value,feedback:''};
 case 'submit':
  if(state.submitted)return state;
  if(!Number.isInteger(state.selected))return {...state,feedback:txt.need};
  return {...state,submitted:true,feedback:state.selected===task.correct?txt.correct:txt.wrong,
    attempts:[...state.attempts,{lessonId:task.id,correct:state.selected===task.correct,assisted:state.assisted}].slice(-120)};
 case 'next':return !state.submitted?state:{...state,index:(state.index+1)%TASKS.length,
  selected:null,assisted:false,submitted:false,feedback:''};
 case 'reset':return fresh();
 default:return state;
 }
}
export function createStore(){
 let state=load();
 const listeners=new Set();
 return {
   getState:()=>state,
   subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
   dispatch(event){
     const next=reduce(state,event);if(next===state)return;
     const serial=JSON.stringify(next);
     localStorage.setItem(STORAGE_KEY,serial);
     if(localStorage.getItem(STORAGE_KEY)!==serial)throw Error('Persistence readback failed');
     state=next;listeners.forEach(fn=>fn(state));
   }
 };
}
