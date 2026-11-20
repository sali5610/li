(function(){
"use strict";
const exercises={
T01:{title:"Nhớ lại chủ động",mode:"hide",lesson:"Selection bias là thiên lệch xuất phát từ cách chọn người tham gia: nhóm bị bỏ sót có thể khác nhóm được hỏi. Một banner chỉ hiện cho người đang dùng app không hỏi được người đã rời app.",prompt:"Không nhìn đoạn trên: vì sao khảo sát qua banner không đủ để kết luận về tất cả người dùng?",fields:[["reason","Tự giải thích"]],model:"Một số người không có cơ hội tham gia (như người đã rời app); kết quả chỉ mô tả nhóm được hỏi. Hãy đối chiếu xem câu mình có nói ai được chọn, ai bị thiếu và phạm vi kết luận chưa."},
T02:{title:"Ôn giãn cách",mode:"due",lesson:"Bạn đã đọc: cỡ mẫu lớn có thể làm giảm biến thiên ngẫu nhiên, nhưng không sửa được thiên lệch trong cơ chế chọn mẫu.",prompt:"Không xem lại: selection bias là gì, và vì sao mẫu lớn không tự sửa nó?",fields:[["reason","Điều tự nhớ"]],model:"Selection bias là sai lệch do cách lấy mẫu, không phải chỉ do ít người trả lời. Mẫu 1.000 người cũng có thể lệch nếu những người vắng mặt khác về đặc điểm quan trọng."},
T03:{title:"Ví dụ giảm gợi ý",mode:"faded",lesson:"Mẫu có lời giải: điểm đặt hàng lại = nhu cầu/ngày × số ngày chờ + tồn an toàn. 4 đơn vị/ngày, chờ 3 ngày, an toàn 6: 4×3+6 = 18 đơn vị.",prompt:"Bước có gợi ý: 5 đơn vị/ngày, chờ 2 ngày, an toàn 4. Tính 5×2+4.",fields:[["number","Kết quả (đơn vị)"]],model:"Bước có gợi ý bằng 14. Bài mới độc lập: 7 đơn vị/ngày, chờ 3 ngày, an toàn 5 thì 7×3+5 = 26 đơn vị."},
T04:{title:"Tự giải thích",lesson:"Một khảo sát chỉ gửi cho 100 khách đang hoạt động, 85 người phản hồi hài lòng. Người đã ngừng sử dụng không có trong danh sách nhận.",prompt:"Vì sao 85% phản hồi hài lòng không có nghĩa 85% tất cả khách đều hài lòng?",fields:[["reason","Giải thích bằng lời của bạn"]],model:"Cơ chế tiếp cận chỉ bao gồm khách đang hoạt động; các nhóm vắng mặt chưa được khảo sát. Câu trả lời tốt nối cơ chế → nhóm vắng mặt → giới hạn kết luận; đừng tự dựng nguyên nhân."},
T05:{title:"Truy vấn nguyên do",lesson:"Sau khi đổi giao diện, số đơn đặt tăng. Cùng thời điểm đó có chiến dịch giảm giá.",prompt:"Chọn bằng chứng hợp lý rồi nêu điều kiện cần có để quy nguyên nhân cho giao diện.",fields:[["evidence","Dữ kiện có thể gây nhiễu",["Không có nhóm so sánh","Khuyến mãi cũng thay đổi","UI chắc chắn là nguyên nhân duy nhất"],"multi"],["reason","Cần kiểm tra gì thêm?"]],model:"Có thay đổi đồng thời về giảm giá, nên số đơn tăng chưa chứng minh riêng tác động UI. Cần thiết kế so sánh có thể cô lập hoặc kiểm soát tác động của thay đổi khác."},
T06:{title:"So sánh – phân biệt",lesson:"Selection bias: có nhóm không có cơ hội được mời. Random sampling variation: hai mẫu ngẫu nhiên hợp lệ ra hai tỷ lệ khác nhau do ngẫu nhiên.",prompt:"Phân loại hai trường hợp mới, rồi viết dấu hiệu quyết định.",fields:[["case1","Chỉ người còn dùng app thấy banner",["Selection bias","Random variation"],"radio"],["case2","Hai mẫu ngẫu nhiên hợp lệ cho 48% và 52%",["Selection bias","Random variation"],"radio"],["reason","Dấu hiệu giúp phân biệt"]],model:"Banner chỉ người đang dùng app = selection bias. Hai mẫu ngẫu nhiên đúng quy trình cho tỷ lệ khác nhau = random variation. Cốt lõi là cơ chế chọn, không phải tỷ lệ cao/thấp."},
T07:{title:"Soi tiền đề và suy luận",lesson:"Tiền đề: Mọi A đều là B; C là A. Kết luận: C là B. Không có dữ liệu xác nhận tiền đề ngoài thực tế.",prompt:"Phân biệt tính hợp lệ về hình thức với tính đúng ngoài đời.",fields:[["valid","Kết luận có theo logic không?",["Có, hợp lệ","Không, không hợp lệ"],"radio"],["truth","Có đủ chứng minh kết luận đúng ngoài đời không?",["Đã đủ","Chưa đủ"],"radio"]],model:"Hợp lệ về cấu trúc: nếu tiền đề đúng thì kết luận theo sau. Nhưng chưa chứng minh tiền đề là sự thật, nên không thể tự tuyên bố kết luận đúng trong thế giới thực."},
T08:{title:"Bản đồ lập luận",lesson:"Tình huống giả định: 90% trong 200 người trả lời tích cực, nhưng khảo sát chỉ hiện cho người còn dùng app. Nhóm dự án muốn nói tất cả người dùng đều hài lòng.",prompt:"Tự tách bốn vai trò của một lập luận.",fields:[["claim","Luận điểm"],["evidence","Chứng cứ được nêu"],["warrant","Giả định nối chứng cứ với kết luận"],["counter","Phản biện mạnh có liên quan"]],model:"Luận điểm: tất cả người dùng hài lòng. Chứng cứ: 90% trong 200 phản hồi. Cầu nối ngầm: người trả lời đại diện cho tất cả. Phản biện: người đã rời app không được hỏi. Bốn vai trò phải tách nhau, không chỉ chép lại một câu."},
T09:{title:"Soi nguồn chứng cứ",lesson:"Nguồn A: slide không có tác giả/ngày/phương pháp viết ‘Hầu hết người dùng thích’. Nguồn B: báo cáo có tác giả, ngày, phương pháp, ghi 90/100 người đang hoạt động được mời phản hồi hài lòng.",prompt:"Nguồn nào hỗ trợ tốt hơn và nó chưa cho phép kết luận gì?",fields:[["source","Chọn nguồn",["A","B","Như nhau"],"radio"],["reason","Giới hạn của nguồn mạnh hơn"]],model:"B có provenance và phương pháp rõ hơn, nhưng chỉ nói về nhóm được mời và đã phản hồi; không đại diện được toàn bộ người dùng hoặc chứng minh quan hệ nhân quả."},
T10:{title:"Phân rã và thử giới hạn",lesson:"Công ty còn hàng ở kho tổng, nhưng một cửa hàng không có hàng bán. Cần quyết định có thể hứa giao trong ngày không.",prompt:"Đặt ràng buộc, chia việc kiểm tra và chọn một trường hợp biên.",fields:[["constraint","Ràng buộc giao hàng"],["steps","Hai hoặc ba bước kiểm tra"],["edge","Một trường hợp biên"]],model:"Đặt khung giờ/địa điểm; kiểm tồn khả dụng tại cửa hàng; kiểm vận chuyển và giờ chốt. Edge case: kho tổng có hàng nhưng hàng đến cửa hàng sau giờ chốt. Danh sách bước chưa có boundary test là chưa đủ."},
T11:{title:"Chọn cách học phù hợp",lesson:"Bạn mới thấy công thức đặt hàng lại lần đầu, chưa hiểu cách thế số. Không có bài đã học trước đó để ôn.",prompt:"Chọn cách tiếp cận phù hợp, hoặc giải thích vì sao muốn bỏ qua.",fields:[["method","Ưu tiên",["Ôn giãn cách ngay","Xem ví dụ có lời giải rồi giảm gợi ý (T03)","Kiểm tra độ tin cậy của slide thay cho tập công thức"],"radio"],["reason","Vì sao chọn / bỏ qua?"]],model:"T03 phù hợp để học thủ tục mới: mẫu đã giải → có gợi ý → bài mới. T02 cần có lần học trước và thời điểm ôn thật; người học vẫn có quyền bỏ qua kỹ thuật."},
T12:{title:"Lấy lại mạch học",mode:"resume",lesson:"Bài đang dở: 15 trong 20 người dùng app được hỏi hài lòng; cần viết kết luận không vượt phạm vi mẫu.",prompt:"Ghi dấu vết trước khi tạm ngắt công việc.",fields:[["context","Mình đang dở bước nào?"],["next","Một hành động nhỏ khi quay lại"]],model:"Một kết luận đúng phạm vi: ‘Trong 20 người đang dùng app được hỏi, 15 người (75%) hài lòng.’ Chưa thể suy rộng cho tất cả người dùng."},
T13:{title:"Cung lộ ghi nhớ",mode:"loci",lesson:"Ba ý đã học theo thứ tự: (1) Tổng thể đích = nhóm ta muốn kết luận tới; (2) Cách chọn mẫu = ai có cơ hội tham gia; (3) Người bị bỏ sót = nhóm không được khảo sát.",prompt:"Chọn ba vị trí quen thuộc KHÁC NHAU theo lộ trình, gắn một liên tưởng tự nghĩ cho từng ý.",fields:[["place1","Nơi thứ nhất"],["cue1","Liên tưởng cho ý 1"],["place2","Nơi thứ hai"],["cue2","Liên tưởng cho ý 2"],["place3","Nơi thứ ba"],["cue3","Liên tưởng cho ý 3"]],model:"So lần lượt với ba khái niệm: Tổng thể đích; Cách chọn mẫu; Người bị bỏ sót. Kiểm tra bằng nghĩa, không chỉ đúng tên chữ. Chọn địa điểm và đặt liên tưởng chưa phải trí nhớ: phải nhớ không nhìn và đối chiếu."}
};
// Same reviewed L03 learning outcomes as the real lesson, not L09's generic T06.
// Exercise answers are disclosed only after a meaningful attempt, never stored.
const l03T06={
 ...exercises.T06,
 lesson:"Hai câu hỏi phỏng vấn người dùng: A — ‘Điều gì khiến bạn yêu thích giao diện mới?’; B — ‘Hãy kể lần gần nhất bạn dùng giao diện mới. Bạn đã thực hiện những bước nào?’",
 prompt:"Câu hỏi mở chưa chắc trung lập. Phân loại A và B, giải thích giả định nằm trong câu A, rồi viết lại A để hỏi về một trải nghiệm thật.",
 fields:[
  ["case1","Câu A",["Mở nhưng dẫn dắt","Mở và trung lập"],"radio"],
  ["case2","Câu B",["Mở nhưng dẫn dắt","Mở và trung lập"],"radio"],
  ["reason","Vì sao A có thể dẫn dắt?"],
  ["rewrite","Viết lại câu A thành câu hỏi trung lập"]
 ],
 model:"A là câu hỏi mở nhưng dẫn dắt: nó mặc định người dùng yêu thích giao diện mới. B là câu hỏi mở trung lập vì hỏi về một lần sử dụng thật, không ép đánh giá. Ví dụ sửa A: ‘Hãy kể lần gần nhất bạn dùng giao diện mới. Bạn đã làm gì? Điều gì thuận lợi hoặc khó khăn?’ Tự đối chiếu xem câu của bạn có bỏ giả định khen ngợi và hỏi được tình huống cụ thể hay không."
};
const l03T06en={
 ...exercises.T06,
 lesson:"Two user interview questions: A — ‘What makes you love the new interface?’; B — ‘Tell me about the last time you used the new interface. What steps did you take?’",
 prompt:"Open-ended does not always mean neutral. Classify A and B, explain the assumption in A, then rewrite A as a neutral question about a real experience.",
 fields:[
  ["case1","Question A",["Open but leading","Open and neutral"],"radio"],
  ["case2","Question B",["Open but leading","Open and neutral"],"radio"],
  ["reason","Why might A lead the participant?"],
  ["rewrite","Rewrite A as a neutral question"]
 ],
 model:"A is open-ended but leading: it assumes that the participant loves the new interface. B is open and neutral: it asks about an actual occasion without requiring praise. Example rewrite: ‘Tell me about the last time you used the new interface. What did you do? What was easy or difficult?’ Compare your wording with that example: did you remove the praise assumption and ask about a concrete experience?"
};
let root,guide,tabs,active=null,phase=0,exposure=null,feedback="",resumeNote="",privatePlaces=[],tabDraft=null;
let activeLessonId=null,reviewedInSession=false,viewSession=0;
let activeTab="guide",actionValues=null;
const reactOwnsSpell=()=>window.liReactGuideDetailMounted===true;
const T12_OWNER="li.sync.local-owner.v1";
const T12_PREFIX="li.spell.t12.resume.v1:";
let t12Draft={context:"",next:"",answer:""};
let t12SavedOnDevice=false,t12StorageError="",t12LocalModified=false,t12Synced=false;
function t12NotifySync(){
 if(typeof window.dispatchEvent==="function"&&typeof Event==="function")
  window.dispatchEvent(new Event("li:private-personal-change"));
}
const t12Terminal=()=>JSON.stringify({schema:"li.spell.t12.v1",phase:2,
 context:"",next:"",answer:"",updatedAt:new Date().toISOString()});
// Restore only the verified active owner's cue for the same lesson context.
// Device-local only: no unapproved Neon writer or cross-device sync.
function t12Key(){
 try{
  if(!document.documentElement.classList.contains("li-auth-verified")||
     document.documentElement.classList.contains("li-account-open"))return null;
  const owner=localStorage.getItem(T12_OWNER);
  if(!owner||owner.length>128)return null;
  return T12_PREFIX+encodeURIComponent(owner)+":"+(activeLessonId||"standalone");
 }catch{return null;}
}
function t12Read(){
 const key=t12Key();if(!key)return null;
 try{
  const raw=localStorage.getItem(key);
  if(!raw||raw.length>4800)return null;
  const data=JSON.parse(raw);
  if(!data||data.schema!=="li.spell.t12.v1"||
     (data.phase!==0&&data.phase!==1)||
     !["context","next","answer"].every(k=>
      typeof data[k]==="string"&&data[k].length<=1200)||
     (data.phase===1&&(!data.context.trim()||!data.next.trim())))
   return null;
  return data;
 }catch{return null;}
}
function t12Write(){
 const key=t12Key();
 if(!key){
  t12SavedOnDevice=false;
  t12StorageError="Chưa xác minh tài khoản; dấu vết T12 chưa được lưu.";
  return false;
 }
 try{
  const raw=JSON.stringify({schema:"li.spell.t12.v1",phase,
   context:t12Draft.context,next:t12Draft.next,answer:t12Draft.answer,
   updatedAt:new Date().toISOString()});
  localStorage.setItem(key,raw);
  if(localStorage.getItem(key)!==raw)throw Error("SAVE_VERIFY_FAILED");
  t12SavedOnDevice=true;t12StorageError="";t12LocalModified=true;t12Synced=false;
  t12NotifySync();
  return true;
 }catch{
  t12SavedOnDevice=false;
  t12StorageError="Không lưu được dấu vết T12 trên thiết bị. Nội dung đang nhập vẫn còn trong phiên này.";
  return false;
 }
}
function t12Clear(){
 const key=t12Key();
 if(!key){t12SavedOnDevice=false;t12StorageError="";return true;}
 try{
  // A redacted terminal checkpoint prevents stale cloud drafts resurfacing
  // after reset or completion, even on a device without prior observation.
  const cleared=t12Terminal();
  localStorage.setItem(key,cleared);
  if(localStorage.getItem(key)!==cleared)throw Error("DELETE_VERIFY_FAILED");
  t12SavedOnDevice=false;t12StorageError="";t12LocalModified=true;t12Synced=false;
  t12NotifySync();
  return true;
 }catch{
  t12StorageError="Không xóa được dấu vết T12 đã lưu trên thiết bị.";
  return false;
 }
}
function setT12Draft(field,value){
 if(active!=="T12"||reviewedInSession||
    !["context","next","answer"].includes(field)||typeof value!=="string")return false;
 t12Draft[field]=value.slice(0,1200);
 if(!reactOwnsSpell()){
  const input=root?.querySelector("#sp-"+field);
  if(input)input.value=t12Draft[field];
 }
 const saved=t12Write();
 notifyReactSpell();
 return saved;
}
const currentExercise=()=>active==="T06"&&activeLessonId==="L03-1-2"?
 (window.liLanguage?.get?.()==="en"?l03T06en:l03T06):exercises[active];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* Separate authored feedback lead and explanation for accurate VI/EN
   translation and reversible language switching without rewriting input. */
const FEEDBACK_LEADS=[
 "Hai phân loại đúng. ","Hãy nhìn lại dấu hiệu chọn mẫu. ",
 "Đã tách đúng hai câu hỏi. ","Một đáp án cần xem lại. ",
 "B là nguồn tốt hơn cho câu hỏi hẹp này. ","Hãy kiểm tra lại provenance và cơ chế chọn người. ",
 "T03 phù hợp cho thủ tục mới. ","Chưa có lần học trước nên T02 không phù hợp ngay. ",
 "Bạn chọn hai dữ kiện quan trọng, không chọn khẳng định quá mức. ",
 "Dữ kiện không có nhóm so sánh và khuyến mãi đồng thời đều quan trọng. "
];
const feedbackMarkup=raw=>{
 const value=String(raw??"");
 const prefix=FEEDBACK_LEADS.find(text=>value.startsWith(text));
 return prefix?'<span>'+escape(prefix.trim())+'</span> '+escape(value.slice(prefix.length)):escape(value);
};
const field=f=>{const id="sp-"+f[0];const label='<span>'+escape(f[1])+'</span>';if(f[2])return '<fieldset class="spell-field"><legend>'+escape(f[1])+'</legend>'+f[2].map((o,i)=>'<label class="spell-option"><input type="'+(f[3]==="multi"?"checkbox":"radio")+'" name="'+id+'" value="'+i+'"><span>'+escape(o)+'</span></label>').join("")+'</fieldset>';return '<label class="spell-field" for="'+id+'">'+label+'<textarea id="'+id+'" rows="2" maxlength="1200"></textarea></label>';};
const act=(a,t,cl="action")=>'<button type="button" class="'+cl+'" data-spell-action="'+a+'">'+t+'</button>';
const fmt=t=>new Date(t).toLocaleString(window.liLanguage?.get?.()==="en"?"en-US":"vi-VN");
// One canonical checker accepts React values directly; only native fallback
// reads its own visible form when no React action is active.
const rawValue=id=>actionValues!==null?
 (typeof actionValues[id]==="string"?actionValues[id].trim():""):
 (root?.querySelector("#sp-"+id)?.value||"").trim();
const radio=id=>actionValues!==null?
 (typeof actionValues[id]==="string"?actionValues[id]:null):
 (root?.querySelector('input[name="sp-'+id+'"]:checked')?.value??null);
const checked=id=>actionValues!==null?
 (Array.isArray(actionValues[id])?actionValues[id]:[]):
 [...(root?.querySelectorAll('input[name="sp-'+id+'"]:checked')||[])].map(x=>x.value);
// T02 is a successive retrieval cycle, not a single 24h reminder.
// Intervals are app defaults, not a scientifically universal best schedule.
const T02_PREFIX="li.spell.t02.schedule.v2:";
const T02_LEGACY="li.spell.t02.due.v1";
const T02_DAYS=[1,3,7,14,30],T02_DAY_MS=86400000;
const t02Empty=()=>({schema:"li.spell.t02.v2",due:null,reviewCount:0,streak:0,
 awaitingRating:false,lastReviewedAt:null,lastRating:null,updatedAt:new Date().toISOString()});
function t02Key(){
 try{
  if(!document.documentElement.classList.contains("li-auth-verified")||
     document.documentElement.classList.contains("li-account-open"))return null;
  const owner=localStorage.getItem(T12_OWNER);
  if(!owner||owner.length>128)return null;
  return T02_PREFIX+encodeURIComponent(owner)+":"+(activeLessonId||"standalone");
 }catch{return null;}
}
function t02Valid(d){
 return !!d&&d.schema==="li.spell.t02.v2"&&
  (d.due===null||(Number.isSafeInteger(d.due)&&d.due>0))&&
  Number.isSafeInteger(d.reviewCount)&&d.reviewCount>=0&&d.reviewCount<=10000&&
  Number.isSafeInteger(d.streak)&&d.streak>=0&&d.streak<=d.reviewCount&&
  typeof d.awaitingRating==="boolean"&&(!d.awaitingRating||d.due!==null)&&
  (d.lastReviewedAt===null||(Number.isSafeInteger(d.lastReviewedAt)&&d.lastReviewedAt>0))&&
  [null,"remembered","retry"].includes(d.lastRating)&&
  typeof d.updatedAt==="string"&&d.updatedAt.length<=48;
}
function t02NotifySync(){
 if(typeof window.dispatchEvent==="function"&&typeof Event==="function")
  window.dispatchEvent(new Event("li:private-personal-change"));
}
function t02Write(data){
 const key=t02Key();if(!key)return false;
 try{
  const next={...data,schema:"li.spell.t02.v2",updatedAt:new Date().toISOString()};
  if(!t02Valid(next))return false;
  const raw=JSON.stringify(next);
  localStorage.setItem(key,raw);
  if(localStorage.getItem(key)!==raw)throw Error("T02_SAVE_VERIFY_FAILED");
  t02NotifySync();return true;
 }catch{return false;}
}
function scheduleRead(){
 const key=t02Key();if(!key)return null;
 try{
  const raw=localStorage.getItem(key);
  if(raw){
   if(raw.length>2400)return null;
   const saved=JSON.parse(raw);
   return t02Valid(saved)?saved:null;
  }
  // Migrate previous 24h review once after verifying the signed owner.
  const legacy=JSON.parse(localStorage.getItem(T02_LEGACY)||"null");
  if(!legacy||!Number.isSafeInteger(legacy.due)||legacy.due<=0)return null;
  const migrated={...t02Empty(),due:legacy.due};
  if(!t02Write(migrated))return null;
  localStorage.setItem(T02_LEGACY,JSON.stringify({due:null,migrated:true}));
  t02NotifySync();return migrated;
 }catch{return null;}
}
function activateDueReview(){
 if(active==="T02"&&phase===0){
  const due=scheduleRead();
  if(due&&(due.awaitingRating||(due.due!==null&&due.due<=Date.now()))){
   phase=1;
   if(due.awaitingRating){
    reviewedInSession=true;feedback=currentExercise().model;
   }
  }
 }
}
function t02Rate(recalled){
 const previous=scheduleRead();
 if(active!=="T02"||phase!==1||!previous?.awaitingRating)return false;
 const streak=recalled?Math.min(previous.streak+1,10000):0;
 const nextDays=recalled?T02_DAYS[Math.min(streak,T02_DAYS.length-1)]:1;
 if(!t02Write({...previous,reviewCount:previous.reviewCount+1,streak,
  awaitingRating:false,lastReviewedAt:Date.now(),
  lastRating:recalled?"remembered":"retry",due:Date.now()+nextDays*T02_DAY_MS})){
  showMessage("Không lưu được lượt ôn mới. Hãy kiểm tra bộ nhớ trước khi thoát.");return false;
 }
 phase=0;reviewedInSession=false;feedback="";draw();return true;
}
function draw(){
 if(!active)return;
 activateDueReview();
 // Visible React exercises never require a second, hidden DOM rendering.
 if(reactOwnsSpell()){notifyReactSpell();return;}
 if(!root)return;
 const e=currentExercise();let inner="";
 if(phase===0){inner='<div class="spell-demo"><span class="kicker">BỐI CẢNH MẪU · ĐÃ ĐƯỢC GIỚI THIỆU</span><p>'+e.lesson+'</p></div><p>'+e.prompt+'</p>';
  if(e.mode==="due"){
   const due=scheduleRead();if(due&&due.due>Date.now()){inner+='<p class="spell-honest">Đã hẹn ôn lúc '+fmt(due.due)+'. Chưa đến hẹn nên không tính là thực hành ôn giãn cách.</p>'+act("clear","Xóa mốc ôn","action alt")}
   else if(due&&due.due<=Date.now()){phase=1;draw();return;}
   else inner+=act("schedule","Đặt mốc ôn sau 24 giờ");
  }else if(["hide","faded","resume","loci"].includes(e.mode)){
   if(["resume","loci"].includes(e.mode))inner+=e.fields.map(field).join("");
   inner+=act("next",e.mode==="resume"?"Tạm ngắt · Lưu dấu vết trong phiên":e.mode==="loci"?"Giấu nguồn · Đi qua lộ trình":"Giấu nguồn · Tiếp tục");
  }else {inner+=e.fields.map(field).join("")+act("check","Đối chiếu bài làm");}
 }else if(e.mode==="faded"&&phase===1){
   inner='<h3>Bước có gợi ý</h3><p>5 đơn vị/ngày × 2 ngày + 4 tồn an toàn = ?</p>'+field(["number","Kết quả (đơn vị)"])+act("check","Kiểm tra để sang bài mới");
 }else if(e.mode==="faded"&&phase===2){
   inner='<h3>Bài tương tự, tự làm</h3><p>7 đơn vị/ngày, 3 ngày chờ, 5 đơn vị an toàn. Điểm đặt hàng lại là bao nhiêu?</p>'+field(["number","Kết quả (đơn vị)"])+act("check","Đối chiếu độc lập");
 }else if(e.mode==="resume"){
   inner='<p>Hành động nhỏ đã tự đặt: <strong>'+escape(resumeNote)+'</strong></p><p>Hãy viết một câu kết luận chỉ về 20 người được khảo sát.</p>'+field(["answer","Câu kết luận sau khi quay lại"])+act("check","Đối chiếu bước nhỏ");
 }else if(e.mode==="loci"){
   inner='<p>Hình dung đi qua ba nơi vừa chọn: <strong>'+privatePlaces.map(escape).join(" → ")+'</strong>. Không hiện ba ý hoặc liên tưởng trong lúc gọi nhớ.</p>'+[1,2,3].map(i=>field(["recall"+i,"Ý nhớ lại ở nơi "+i])).join("")+act("check","Đối chiếu ba ý");
 }else{
   inner='<p><strong>Không nhìn lại lời giải:</strong> '+e.prompt+'</p>'+e.fields.map(field).join("")+act("check",e.mode==="due"?"Đối chiếu lượt ôn":"Đối chiếu bài làm");
 }
 root.innerHTML='<div class="spell-activity-head"><div><span class="kicker">'+active+' · <span>THỬ THI TRIỂN</span></span><h2>'+e.title+'</h2></div><span class="spell-state">'+(feedback?"Đã đối chiếu":phase===0?"Đang chuẩn bị":"Đang thực hành")+'</span></div><div class="spell-activity-body">'+inner+(feedback?'<div class="spell-feedback" role="status" tabindex="-1"><strong>Phản hồi để tự kiểm chứng</strong><p>'+feedbackMarkup(feedback)+'</p><p class="small">Bài mẫu minh họa, không chứng nhận thành thạo, IQ hay kết quả học thuật ngoài nhiệm vụ này.</p></div>':"")+'</div><footer class="spell-activity-footer"><p class="small">'+
  (active==="T12"?
   (t12StorageError?escape(t12StorageError):
    t12Synced?"Dấu vết T12 đã đồng bộ với tài khoản.":
    t12SavedOnDevice?"Đã lưu trên máy · đang chờ đồng bộ.":
     "T12 tự lưu bản nháp và đồng bộ khi có mạng."):
   "Tự chọn, có thể bỏ qua. Trừ mốc T02 do bạn chủ động đặt, nội dung điền không tự lưu hay gửi lên máy chủ.")+
  '</p>'+act("reset","Làm lại","action alt")+'</footer>';

 if(active==="T12"){
  for(const [name,value] of Object.entries(t12Draft)){
   const input=root.querySelector("#sp-"+name);
   if(input)input.value=value;
  }
 }
 window.liLanguage?.apply?.(root);
 notifyReactSpell();
}
function switchTab(which){
 const practice=which==="practice";
 activeTab=practice?"practice":"guide";
 if(reactOwnsSpell()||!root||!tabs){notifyReactSpell();return;}
 if(!practice&&!root.hidden){tabDraft=[...root.querySelectorAll("textarea,input")].map(x=>({value:x.value,checked:x.checked}));}
 guide.hidden=practice;root.hidden=!practice;
 const g=tabs.querySelector("#spell-tab-guide"),p=tabs.querySelector("#spell-tab-practice");
 g.setAttribute("aria-selected",String(!practice));p.setAttribute("aria-selected",String(practice));g.tabIndex=practice?-1:0;p.tabIndex=practice?0:-1;
 if(practice){
  draw();
  if(tabDraft){[...root.querySelectorAll("textarea,input")].forEach((el,i)=>{const d=tabDraft[i];if(d){el.value=d.value;el.checked=d.checked;}});tabDraft=null;}
 }
 notifyReactSpell();
}
function open(id,tab="guide",lessonId=null){
 if(!Object.prototype.hasOwnProperty.call(exercises,id))return;
 active=id;activeLessonId=["L03-1-2","L09-1-2","L15-2-2"].includes(lessonId)?lessonId:null;
 phase=0;feedback="";reviewedInSession=false;viewSession++;privatePlaces=[];resumeNote="";
 t12Draft={context:"",next:"",answer:""};t12SavedOnDevice=false;t12StorageError="";
 t12LocalModified=false;t12Synced=false;
 if(id==="T12"){
  const saved=t12Read();
  if(saved){
   phase=saved.phase;
   t12Draft={context:saved.context,next:saved.next,answer:saved.answer};
   resumeNote=saved.next;
   t12SavedOnDevice=true;
  }
 }
 tabDraft=null;
 switchTab(tab==="practice"?"practice":"guide");
 notifyReactSpell();
}
function missing(){
 for(const f of currentExercise().fields){
  if(f[2]){
   const hasChoice=f[3]==="multi"?checked(f[0]).length>0:radio(f[0])!==null;
   if(!hasChoice)return f[1];
  }else if(!rawValue(f[0]))return f[1];
 }return "";
}
function showMessage(text){
 feedback=text;
 if(reactOwnsSpell()||!root){notifyReactSpell();return;}
 let box=root.querySelector(".spell-feedback");
 if(!box){box=document.createElement("div");box.className="spell-feedback";box.setAttribute("role","status");box.tabIndex=-1;root.querySelector(".spell-activity-body").append(box);}
 box.innerHTML='<strong>Phản hồi để tự kiểm chứng</strong><p>'+feedbackMarkup(text)+'</p><p class="small">Đây là bài mẫu minh họa, không chứng nhận thành thạo hay kết quả học thuật ngoài nhiệm vụ.</p>'+
  (reviewedInSession?'<p class="small" role="status">Đã thực hành và tự đối chiếu trong phiên này · chưa lưu hoặc đồng bộ · không phải điểm thông thạo.</p>':"");
 window.liLanguage?.apply?.(box);
 box.focus();
 notifyReactSpell();
}
function check(){
 const e=currentExercise();
 if(e.mode==="faded"){
  const n=rawValue("number");if(!n){showMessage("Nhập số trước khi kiểm tra.");return;}
  if(Number(n)!==(phase===1?14:26)){showMessage("Chưa đúng: nhu cầu mỗi ngày × số ngày chờ + tồn an toàn. Thử lại.");return;}
  if(phase===1){phase=2;feedback="";draw();return;}
  reviewedInSession=true;
  showMessage("Ví dụ độc lập đúng: 7×3+5 = 26 đơn vị.");return;
 }
 if(e.mode==="loci"&&phase===1){
  if(![1,2,3].every(i=>rawValue("recall"+i))){showMessage("Ghi đủ ba ý nhớ lại rồi mới xem đáp án.");return;}
 }else if(e.mode==="resume"&&phase===1){if(!rawValue("answer")){showMessage("Hãy viết câu kết luận nhỏ của bạn.");return;}}
 else{const m=missing();if(m){showMessage("Cần hoàn thành: "+escape(m)+". Chưa có đủ thao tác để đối chiếu.");return;}}
 let info=e.model;
 if(active==="T06"){
  const correct=radio("case1")==="0"&&radio("case2")==="1";
  const english=activeLessonId==="L03-1-2"&&window.liLanguage?.get?.()==="en";
  info=(english?(correct?"Both classifications are correct. ":"Review both classifications. "):
   (correct?"Hai phân loại đúng. ":"Hai phân loại cần đối chiếu lại. "))+info;
 }
 if(active==="T07")info=(radio("valid")==="0"&&radio("truth")==="1"?"Đã tách đúng hai câu hỏi. ":"Một đáp án cần xem lại. ")+info;
 if(active==="T09")info=(radio("source")==="1"?"B là nguồn tốt hơn cho câu hỏi hẹp này. ":"Hãy kiểm tra lại provenance và cơ chế chọn người. ")+info;
 if(active==="T11")info=(radio("method")==="1"?"T03 phù hợp cho thủ tục mới. ":"Chưa có lần học trước nên T02 không phù hợp ngay. ")+info;
 if(active==="T05")info=(checked("evidence").sort().join(",")==="0,1"?"Bạn chọn hai dữ kiện quan trọng, không chọn khẳng định quá mức. ":"Dữ kiện không có nhóm so sánh và khuyến mãi đồng thời đều quan trọng. ")+info;
 if(active==="T12"&&!t12Clear()){showMessage(t12StorageError);return;}
 reviewedInSession=true; // feedback follows successfully stored clearing state
 showMessage(info);
 if(active==="T02")try{localStorage.removeItem("li.spell.t02.due.v1")}catch(err){}
 if(!reactOwnsSpell())root?.querySelector(".spell-feedback")?.focus();
}
function next(){
 const e=currentExercise();
 if(e.mode==="resume"){
  if(!rawValue("context")||!rawValue("next")){showMessage("Ghi rõ công việc đang dở và bước kế tiếp rồi mới tạm ngắt.");return;}
  t12Draft.context=rawValue("context");t12Draft.next=rawValue("next");
  resumeNote=t12Draft.next;phase=1;feedback="";
  t12Write();draw();return;
 }
 if(e.mode==="loci"){
  if(!e.fields.every(f=>rawValue(f[0]))){showMessage("Tự chọn đủ ba nơi và ba liên tưởng.");return;}
  privatePlaces=[1,2,3].map(i=>rawValue("place"+i));
  const unique=privatePlaces.map(x=>x.toLocaleLowerCase("vi").trim());
  if(new Set(unique).size!==3){showMessage("Ba nơi phải khác nhau để tạo ba mốc nhớ phân biệt.");return;}
  phase=1;feedback="";draw();return;
 }
 phase=1;feedback="";draw();
}

/* Existing exercise engine remains single owner of 13 techniques and feedback.
 * React consumes typed snapshots and calls the same action listeners. */
function notifyReactSpell(){
 if(typeof window.dispatchEvent==="function"&&typeof Event==="function")
  window.dispatchEvent(new Event("li:spell-view-changed"));
}
function getView(){
 if(!active||!exercises[active])return null;
 activateDueReview();
 const e=currentExercise(),mode=e.mode||"direct";
 let fields=[];
 if(phase===0){
  if(!["hide","faded","due"].includes(mode))fields=e.fields;
 }else if(mode==="faded")fields=[["number","Kết quả (đơn vị)"]];
 else if(mode==="resume")fields=[["answer","Câu kết luận sau khi quay lại"]];
 else if(mode==="loci")fields=[1,2,3].map(i=>["recall"+i,"Ý nhớ lại ở nơi "+i]);
 else fields=e.fields;
 const due=mode==="due"?scheduleRead():null;
 return {
  active,title:e.title,mode,phase,tab:activeTab,
  lesson:e.lesson,prompt:e.prompt,fields:fields.map(field=>({
   id:field[0],label:field[1],options:Array.isArray(field[2])?field[2].slice():null,
   choiceKind:field[3]==="multi"?"multi":"radio"
  })),
  feedback,resumeNote,places:privatePlaces.slice(),dueAt:due?.due||null,
  lessonId:activeLessonId,reviewedInSession,viewSession,
  t12Draft:active==="T12"?{...t12Draft}:undefined,
  t12SavedOnDevice:active==="T12"&&t12SavedOnDevice,
  t12Synced:active==="T12"&&t12Synced,
  t12StorageError:active==="T12"?t12StorageError:""
 };
}
/** Both frontends invoke the same 13-technique action engine. React values
 * are supplied to the checker directly; native fallback reads its visible form.
 * No hidden input writes, synthetic events or button clicks. */
function runAction(action){
 if(!active||!["next","check","reset","schedule","clear"].includes(action))return false;
 const mode=currentExercise().mode||"direct";
 if(action==="next"&&(phase!==0||!["hide","faded","resume","loci"].includes(mode)))return false;
 if(action==="check"&&(mode==="due"&&phase===0||
   phase===0&&["hide","faded","resume","loci"].includes(mode)))return false;
 if(["schedule","clear"].includes(action)&&(mode!=="due"||phase!==0))return false;
 switch(action){
 case "reset":
  if(active==="T12"&&!t12Clear()){showMessage(t12StorageError);return false;}
  phase=0;feedback="";reviewedInSession=false;viewSession++;privatePlaces=[];resumeNote="";
  t12Draft={context:"",next:"",answer:""};draw();return true;
 case "next":next();return true;
 case "check":check();return true;
 case "schedule":
  try{
   const scheduled={exposed:Date.now(),due:Date.now()+86400000};
   const raw=JSON.stringify(scheduled);
   localStorage.setItem("li.spell.t02.due.v1",raw);
   if(localStorage.getItem("li.spell.t02.due.v1")!==raw)throw Error("verify");
   feedback="";
  }catch{feedback="Trình duyệt không lưu được mốc. Chưa có lịch ôn thực nào được tạo.";}
  draw();return true;
 case "clear":
  try{localStorage.setItem("li.spell.t02.due.v1",JSON.stringify({clearedAt:Date.now(),due:null}));}
  catch{}
  feedback="";draw();return true;
 }
 return false;
}
function performReact(action,values={}){
 // The explicit port also serves existing native fallback automation and
 // authorized callers. It never depends on a hidden button or React mount.
 if(!active||
   !document.documentElement.classList.contains("li-auth-verified")||
   document.documentElement.classList.contains("li-account-open")||
   !values||typeof values!=="object"||Array.isArray(values))return false;
 const view=getView(),allowed=new Map(view.fields.map(field=>[field.id,field]));
 const safe=Object.create(null);
 for(const [id,value] of Object.entries(values)){
  const field=allowed.get(id);if(!field)continue;
  if(field.options){
   const options=field.options.map((_,i)=>String(i));
   if(field.choiceKind==="multi"){
    if(!Array.isArray(value)||value.length>options.length)continue;
    safe[id]=value.filter(item=>typeof item==="string"&&options.includes(item));
   }else if(typeof value==="string"&&options.includes(value))safe[id]=value;
  }else if(typeof value==="string")safe[id]=value.slice(0,1200);
 }
 actionValues=safe;
 try{return runAction(action);}
 finally{actionValues=null;}
}
function setup(){
 const page=document.getElementById("page-guideDetail");if(!page)return;
 guide=page.querySelector(".editorial-grid");if(!guide)return;
 guide.id="spell-guide-panel";guide.setAttribute("role","tabpanel");guide.setAttribute("aria-labelledby","spell-tab-guide");
 tabs=document.createElement("div");tabs.className="spell-tabs";tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","Chế độ của thần chú");
 tabs.innerHTML='<button type="button" role="tab" id="spell-tab-guide" aria-controls="spell-guide-panel" aria-selected="true" tabindex="0">Chú giải</button><button type="button" role="tab" id="spell-tab-practice" aria-controls="spell-practice-panel" aria-selected="false" tabindex="-1">Thử thi triển</button>';
 guide.before(tabs);
 root=document.createElement("section");root.id="spell-practice-panel";root.className="spell-practice-root";root.hidden=true;root.setAttribute("role","tabpanel");root.setAttribute("aria-labelledby","spell-tab-practice");guide.after(root);
 tabs.querySelector("#spell-tab-guide").addEventListener("click",()=>switchTab("guide"));
 tabs.querySelector("#spell-tab-practice").addEventListener("click",()=>switchTab("practice"));
 tabs.addEventListener("keydown",ev=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(ev.key))return;ev.preventDefault();const side=ev.key==="ArrowLeft"||ev.key==="Home"?"guide":"practice";switchTab(side);tabs.querySelector("#spell-tab-"+side).focus();});
 root.addEventListener("input",ev=>{
  if(active!=="T12")return;
  const target=ev.target,field=typeof target?.id==="string"?target.id.slice(3):"";
  if(!["context","next","answer"].includes(field)||typeof target.value!=="string")return;
  t12Draft[field]=target.value.slice(0,1200);
  t12Write();
 });
 // Native UI is only a fallback; it calls the SAME direct action reducer.
 root.addEventListener("click",ev=>{
  const button=ev.target.closest("[data-spell-action]");
  if(button&&root.contains(button))runAction(button.dataset.spellAction);
 });
 if(typeof window.addEventListener==="function"){
  // Only a signed, exact-payload readback can release the local edit gate.
  window.addEventListener("li:t12-sync-confirmed",ev=>{
   const detail=ev.detail,key=t12Key();
   if(active!=="T12"||!key||!detail||
      detail.accountId!==localStorage.getItem(T12_OWNER)||
      !Array.isArray(detail.keys)||!detail.keys.includes(key))return;
   t12LocalModified=false;t12Synced=true;
   notifyReactSpell();
  });
  window.addEventListener("li:personal-sync-applied",ev=>{
   if(active!=="T12"||!root||t12LocalModified||reviewedInSession)return;
   const key=t12Key(),detail=ev.detail;
   if(!key||!detail||detail.accountId!==localStorage.getItem(T12_OWNER)||
      !Array.isArray(detail.keys)||!detail.keys.includes(key))return;
   const saved=t12Read();
   phase=saved?saved.phase:0;
   t12Draft=saved?{context:saved.context,next:saved.next,answer:saved.answer}:
    {context:"",next:"",answer:""};
   resumeNote=saved?saved.next:"";
   t12SavedOnDevice=!!saved;t12Synced=true;t12StorageError="";feedback="";
   viewSession++;tabDraft=null;
   if(!root.hidden)draw();
   notifyReactSpell();
  });
 }
 window.LiSpellPractice={open,methods:Object.keys(exercises),getView,
  perform:performReact,setTab:switchTab,setT12Draft,
  refreshNative:()=>{if(!reactOwnsSpell())switchTab(activeTab);}};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();