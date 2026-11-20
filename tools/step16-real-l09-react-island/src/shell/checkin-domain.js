/**
 * Pure L1 study-rhythm decision model. No DOM, browser APIs, storage or side
 * effects. React Check-in owns the UI; this module is the only recommendation
 * engine. This is a learning-rhythm heuristic, NEVER a health assessment.
 */
export const STUDY_RHYTHMS=Object.freeze({
 start:'Vào nhịp',focus:'Đào sâu',overload:'Quá tải',recover:'Hồi trí'
});
export const CHECKIN_PHYSICAL=Object.freeze(['sleep','move','rest']);
export const CHECKIN_ALLOWED=Object.freeze(['yes','no']);
export function completePhysical(physical){
 return Boolean(physical&&CHECKIN_PHYSICAL.every(key=>CHECKIN_ALLOWED.includes(physical[key])));
}
export function recommendStudyRhythm(physical,energy='',attention=''){
 if(!completePhysical(physical))return null;
 const yesCount=CHECKIN_PHYSICAL.filter(key=>physical[key]==='yes').length;
 const energyPoints={high:1,medium:-1,low:-2}[energy]??0;
 const attentionPoints={steady:1,warming:-1,hard:-2}[attention]??0;
 const physicalPoints=yesCount*2;
 const points=physicalPoints+energyPoints+attentionPoints;
 const positives=[];
 if(energy==='high')positives.push('Năng lượng dồi dào +1');
 if(attention==='steady')positives.push('Tập trung rõ +1');
 let mode,reason;
 if(energy==='low'&&attention==='hard'){
  mode='overload';reason='Năng lượng cạn và rất khó tập trung; giảm tải hoặc nghỉ đều được.';
 }else if(energy==='low'||attention==='hard'){
  mode='recover';reason='Cảm nhận hiện tại báo khó duy trì cường độ, nên ưu tiên nhịp nhẹ.';
 }else if(yesCount===3){
  mode=points>=6?'focus':points===5?'start':'recover';
  reason=mode==='focus'?'Ba mục thể trạng đều Có; cảm nhận hiện tại hỗ trợ học sâu.':
   mode==='start'?'Ba mục thể trạng đều Có; nên bắt đầu vừa sức.':
   'Ba mục thể trạng đều Có, nhưng cảm nhận hiện tại cho thấy nên học nhẹ.';
 }else if(yesCount===2&&points>=5){
  mode='start';reason='Một mục thể trạng là Chưa, nhưng tín hiệu tích cực giúp bạn thử Vào nhịp thay vì chỉ Hồi trí.';
 }else{
  mode='recover';reason='Có mục thể trạng Chưa; trước mắt ưu tiên Hồi trí.';
 }
 return {mode,reason,points,physicalPoints,energyPoints,attentionPoints,positives};
}
