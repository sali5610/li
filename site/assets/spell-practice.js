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

/* One answer-free practice receipt per verified account. Existing T02/T12
 * checkpoints stay canonical; cloud replication requires auth owner's registry. */
const PRACTICE_PREFIX="li.spell.practice.v1:";
const PRACTICE_SCHEMA="li.spell.practice.v1";
let practiceError="",practiceSessionOwner=null,practiceSynced=false;
const blankReceipt=()=>({count:0,lastAt:null,phase:0,places:[]});
function verifiedOwner(){
 try{
  if(!document.documentElement.classList.contains("li-auth-verified")||
     document.documentElement.classList.contains("li-account-open"))return null;
  const uid=localStorage.getItem("li.sync.local-owner.v1");
  return uid&&uid.length<=128?uid:null;
 }catch{return null;}
}
function receiptKey(){
 const uid=verifiedOwner();
 return uid?PRACTICE_PREFIX+encodeURIComponent(uid):null;
}
function receiptStore(reportError=true){
 const key=receiptKey();if(!key)return null;
 try{
  const raw=localStorage.getItem(key),d=raw===null?{schema:PRACTICE_SCHEMA,scopes:{}}:JSON.parse(raw);
  if(raw!==null&&raw.length>60000||!d||d.schema!==PRACTICE_SCHEMA||
     !d.scopes||typeof d.scopes!=="object"||Array.isArray(d.scopes)||
     Object.keys(d.scopes).length>30)throw Error("BAD_PRACTICE_STORE");
  for(const [ctx,methods] of Object.entries(d.scopes)){
   if(ctx!=="standalone"&&!/^L\d{2}-\d+-\d+$/.test(ctx)||
      !methods||typeof methods!=="object"||Array.isArray(methods))throw Error("BAD_CONTEXT");
   for(const [id,entry] of Object.entries(methods)){
    if(!Object.prototype.hasOwnProperty.call(exercises,id)||id==="T02"||
       !entry||typeof entry!=="object"||Array.isArray(entry)||
       !Number.isSafeInteger(entry.count)||entry.count<0||entry.count>100000||
       !(entry.lastAt===null||Number.isSafeInteger(entry.lastAt)&&entry.lastAt>0)||
       !Number.isSafeInteger(entry.phase)||entry.phase<0||
       entry.phase>(id==="T03"?2:1)||
       entry.phase>0&&!["T01","T03","T13"].includes(id)||
       !Array.isArray(entry.places)||entry.places.length>(id==="T13"?3:0)||
       entry.places.some(x=>typeof x!=="string"||x.length>1200)||
       entry.phase===0&&entry.places.length!==0||
       id==="T13"&&entry.phase===1&&
        (entry.places.length!==3||
         new Set(entry.places.map(x=>x.trim().toLocaleLowerCase("vi"))).size!==3))
      throw Error("BAD_RECEIPT");
   }
  }
  // A successful read must not erase a failed write warning.
  return d;
 }catch{if(reportError)practiceError="Không đọc được lịch sử luyện, chưa ghi đè bản cũ.";return null;}
}
// Read-only lesson history for the current authorized reader; no raw answers.
function getLessonPracticeSummary(lessonId,subjectId){
 const owner=verifiedOwner();
 if(!owner||owner!==subjectId||typeof lessonId!=="string"||
    !/^L\d{2}-\d+-\d+$/.test(lessonId))return null;
 const known=["L03-1-2","L09-1-2","L15-2-2"].includes(lessonId)||
   Object.prototype.hasOwnProperty.call(window.liPersonalStudyRoutes||{},lessonId);
 if(!known)return null;
 const store=receiptStore(false);
 if(!store)return null;
 return Object.entries(store.scopes[lessonId]||{})
  .filter(([id,r])=>id!=="T02"&&r.count>0)
  .map(([methodId,r])=>({methodId,count:r.count}))
  .sort((a,b)=>a.methodId.localeCompare(b.methodId));
}
function receipt(){
 if(!active||active==="T02")return blankReceipt();
 return receiptStore()?.scopes?.[activeLessonId||"standalone"]?.[active]||blankReceipt();
}
function saveReceipt({phase:step=0,places=[],complete=false}={}){
 if(!active||active==="T02")return true;
 const key=receiptKey(),store=receiptStore();
 if(!key||!store){if(!practiceError)practiceError="Chưa xác minh tài khoản để lưu.";return false;}
 const ctx=activeLessonId||"standalone",prior=store.scopes[ctx]?.[active]||blankReceipt();
 const next={count:prior.count+(complete?1:0),
  lastAt:complete?Date.now():prior.lastAt,phase:step,
  places:step===1&&active==="T13"?places.slice():[]};
 try{
  const raw=JSON.stringify({schema:PRACTICE_SCHEMA,
   scopes:{...store.scopes,[ctx]:{...store.scopes[ctx],[active]:next}}});
  if(raw.length>60000)throw Error("RECEIPT_TOO_LARGE");
  localStorage.setItem(key,raw);
  if(localStorage.getItem(key)!==raw)throw Error("RECEIPT_NOT_SAVED");
  practiceError="";practiceSynced=false;
  window.dispatchEvent(new Event("li:private-personal-change"));
  return true;
 }catch{practiceError="Chưa lưu được lượt luyện trên máy.";return false;}
}

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
// Contextual T02 review cues: one bounded, previously-taught concept per
// canonical lesson. These are recall cues, not unpublished assessment keys.
// Invited personal draft lessons remain preview-only; no release is implied.
const T02_LESSON_CUES={
  "L03-1-1": {
    "vi": [
      "Một yêu cầu tính năng như “thêm nút Export PDF” là giải pháp người dùng đề xuất, chưa phải nhu cầu đã kiểm chứng.",
      "Không nhìn nguồn: phân biệt feature request, giả thuyết user need và giải pháp; cần hỏi gì để biết nhu cầu thật?",
      "Feature request nêu cách làm cụ thể; user need mô tả kết quả/công việc cần đạt trong bối cảnh. Nhu cầu suy ra từ lời yêu cầu chỉ là giả thuyết, phải kiểm tra bằng câu hỏi trung lập về trải nghiệm thật."
    ],
    "en": [
      "A request such as “add an Export PDF button” proposes a solution, not a verified user need.",
      "From memory: distinguish a feature request, a user-need hypothesis and a solution. What would you ask to investigate the need?",
      "A feature request specifies a possible implementation; a need describes the outcome or job in context. The inferred need remains a hypothesis until neutral questions about real experiences test it."
    ]
  },
  "L03-1-2": {
    "vi": [
      "Câu hỏi mở vẫn có thể dẫn dắt: “Vì sao giao diện này khó dùng?” đã mặc định nó khó dùng.",
      "Không nhìn nguồn: điều gì làm một câu hỏi phỏng vấn dẫn dắt, và sửa thế nào để hỏi trung lập?",
      "Dẫn dắt là nhúng nhận định hoặc đáp án mong muốn vào câu hỏi. Hỏi về một lần sử dụng thật, các bước và điều đã xảy ra; không giả định thích/ghét hay khó/dễ trước."
    ],
    "en": [
      "Open-ended questions can still lead: “Why is this interface hard to use?” assumes difficulty.",
      "From memory: what makes an interview question leading, and how would you make it neutral?",
      "A leading question presupposes a judgment or desired response. Ask about a specific recent experience, actions and events without assuming ease, difficulty, praise or dislike."
    ]
  },
  "L03-1-3": {
    "vi": [
      "Một người dừng thao tác 18 giây là hành vi quan sát; “người ấy kém kỹ năng số” chỉ là diễn giải chưa kiểm chứng.",
      "Không nhìn nguồn: tách observation, quote, inference và finding. Vì sao một trích dẫn chính xác vẫn có thể dẫn tới kết luận sai?",
      "Observation mô tả hành vi; quote là lời nói nguyên văn đúng ngữ cảnh; inference là cách giải thích cần kiểm tra. Finding phải giới hạn theo bằng chứng và không suy từ vài phiên ra tất cả người dùng."
    ],
    "en": [
      "A participant pausing for 18 seconds is an observation; calling them digitally unskilled is an unverified inference.",
      "From memory: distinguish an observation, a quote, an inference and a finding. Why can an accurate quote still support a poor conclusion?",
      "Observations record behavior, quotes report actual words, and inferences propose explanations. Findings must stay within the evidence and context, not generalize from a few sessions."
    ]
  },
  "L03-2-1": {
    "vi": [
      "Một bài có thể mang nhiều nhãn taxonomy mà không cần nhiều đường dẫn trong menu; canonical concept ID vẫn ổn định.",
      "Không nhìn nguồn: taxonomy, hierarchy, navigation và content model khác nhau ở đâu?",
      "Taxonomy quản lý khái niệm/nhãn; hierarchy mô tả quan hệ cha–con; navigation là đường người dùng thấy; content model quy định kiểu và trường dữ liệu. Đừng nhân bản concept ID chỉ vì có nhiều nhãn hay lối vào."
    ],
    "en": [
      "A document may have several taxonomy tags without needing several menu routes; its canonical concept ID stays stable.",
      "From memory: how do taxonomy, hierarchy, navigation and content models differ?",
      "Taxonomy manages controlled terms; hierarchy defines parent-child relationships; navigation is the user-facing path; a content model defines object types and fields. Multiple labels or routes do not require duplicate concept IDs."
    ]
  },
  "L03-2-2": {
    "vi": [
      "Card sorting giúp khám phá cách người dùng nhóm nội dung; tree testing kiểm tra họ tìm đích trong cây điều hướng cụ thể.",
      "Không nhìn nguồn: mỗi phương pháp trả lời câu hỏi nghiên cứu gì, và điều gì card sorting không chứng minh được?",
      "Card sorting gợi ý mental model và cách nhóm/đặt tên; tree testing đo khả năng tìm đúng vị trí với task và đích định trước. Kết quả xếp thẻ giống nhau chưa chứng minh menu cuối cùng dễ tìm."
    ],
    "en": [
      "Card sorting explores how people group content; tree testing checks whether they can find destinations in a proposed navigation tree.",
      "From memory: what question does each method answer, and what can card sorting not prove?",
      "Card sorting suggests grouping and labels. Tree testing evaluates findability with a defined task and correct destination. Agreement in a sort does not validate a final navigation tree."
    ]
  },
  "L03-2-3": {
    "vi": [
      "Trong 10 người thử, 6 người tìm đúng ngay, 2 người đi vòng rồi đúng và 2 người thất bại: completion khác direct success.",
      "Không nhìn nguồn: phân biệt overall task completion, direct success, indirect success và navigation error.",
      "Completion tính mọi người hoàn thành theo tiêu chí đã định; direct success tới đích không đi sai; indirect success phải quay đầu hoặc rẽ nhánh sai rồi vẫn tới đích; error là sự kiện thao tác sai được định nghĩa riêng."
    ],
    "en": [
      "Of 10 participants, 6 reach the goal directly, 2 after backtracking and 2 fail: completion differs from direct success.",
      "From memory: distinguish overall completion, direct success, indirect success and navigation errors.",
      "Completion counts participants who eventually meet the task criterion; direct success uses the correct route without backtracking; indirect success reaches it after detours; errors are separately defined wrong actions."
    ]
  },
  "L09-1-2": {
    "vi": [
      "Mẫu lớn có thể giảm biến thiên ngẫu nhiên, nhưng không sửa được thiên lệch do nhóm nào đó không có cơ hội được chọn.",
      "Không nhìn nguồn: selection bias khác random sampling variation như thế nào, và vì sao thêm người không tự chữa bias?",
      "Selection bias xuất phát từ cơ chế chọn/phản hồi bỏ sót nhóm liên quan kết quả; random variation là khác biệt tình cờ giữa các mẫu ngẫu nhiên hợp lệ. Tăng cỡ mẫu chủ yếu giảm bất định ngẫu nhiên, không sửa khung chọn lệch."
    ],
    "en": [
      "Larger samples can reduce random variation, but cannot fix selection bias when relevant groups have no chance to participate.",
      "From memory: distinguish selection bias from random sampling variation. Why does a larger sample not automatically remove bias?",
      "Selection bias follows unequal inclusion or response opportunities related to the outcome; random sampling variation occurs between valid random samples. Larger samples mostly reduce random uncertainty, not exclusion by design."
    ]
  },
  "L09-1-3": {
    "vi": [
      "Hai bộ dữ liệu có cùng mean vẫn có thể khác mức phân tán; mean không nói hết hình dạng phân phối.",
      "Không nhìn nguồn: mean, median, mode và range đo gì? Vì sao một giá trị cực lớn có thể làm mean lệch khỏi median?",
      "Mean là tổng chia số quan sát, median là giá trị giữa sau sắp xếp, mode là giá trị phổ biến nhất, range bằng max trừ min. Mean nhạy với ngoại lệ; cần mô tả center cùng spread."
    ],
    "en": [
      "Two datasets with the same mean may have very different spreads; a mean does not describe the full distribution.",
      "From memory: what do mean, median, mode and range measure? Why can an extreme value pull the mean away from the median?",
      "Mean is total divided by count; median is the ordered middle; mode is the most frequent value; range is maximum minus minimum. The mean is sensitive to extremes, so report center with spread."
    ]
  },
  "L09-2-1": {
    "vi": [
      "Nếu rủi ro hiếm, hệ thống báo trúng 90% ca rủi ro vẫn có thể có nhiều cảnh báo nhầm từ nhóm bình thường đông hơn.",
      "Không nhìn nguồn: P(cảnh báo | rủi ro) khác P(rủi ro | cảnh báo) ra sao và vai trò của base rate là gì?",
      "Hai xác suất điều kiện đảo chiều có mẫu số khác nhau. Muốn biết nguy cơ trong các cảnh báo phải đếm cả true positives và false positives, có xét tỷ lệ rủi ro ban đầu; không lấy sensitivity thay posterior probability."
    ],
    "en": [
      "When a risk is rare, detecting 90% of risky cases can still yield many false alerts from the much larger normal population.",
      "From memory: how do P(alert | risk) and P(risk | alert) differ, and why does the base rate matter?",
      "Reversing conditional probability changes the denominator. The risk among alerts depends on true positives and false positives as well as the original prevalence; sensitivity alone is not posterior probability."
    ]
  },
  "L09-2-2": {
    "vi": [
      "Confidence interval 95% trong khung frequentist nói về độ phủ dài hạn của quy trình tạo khoảng dưới các giả định phù hợp.",
      "Không nhìn nguồn: phân biệt point estimate, standard error, margin of error và confidence interval; vì sao không nói tham số cố định có 95% xác suất nằm trong khoảng đã tính?",
      "Point estimate là ước lượng một điểm; standard error là độ biến thiên của ước lượng; margin of error là biên cho khoảng; CI có độ phủ qua lặp mẫu nếu giả định đúng. Không biến độ tin cậy của thủ tục thành xác suất hậu nghiệm cho tham số cố định."
    ],
    "en": [
      "A frequentist 95% confidence interval concerns the long-run coverage of the interval procedure under its assumptions.",
      "From memory: distinguish a point estimate, standard error, margin of error and confidence interval. Why is a fixed parameter not assigned a 95% probability after calculating one interval?",
      "The point estimate is a single estimate; SE measures sampling variability; the margin defines the interval width; a CI procedure has long-run coverage when assumptions hold, not a posterior probability for a fixed parameter."
    ]
  },
  "L09-2-3": {
    "vi": [
      "Hồi quy mô tả mối liên hệ trong dữ liệu; đường dốc lên không tự chứng minh tăng X sẽ gây tăng Y.",
      "Không nhìn nguồn: slope, intercept, residual là gì; vì sao confounding khiến association khác causal effect?",
      "Đường dự đoán y-hat=a+b×x; b là slope, a là intercept, residual=y−y-hat. Yếu tố thứ ba ảnh hưởng cả X và Y có thể tạo tương quan giả; prediction và association không tự chứng minh nhân quả."
    ],
    "en": [
      "Regression describes relationships in observed data; an upward slope does not prove that increasing X causes Y to rise.",
      "From memory: what are slope, intercept and residual? Why can confounding separate association from causal effect?",
      "A fitted line is y-hat=a+b×x; b is slope, a is intercept and residual=y−y-hat. A third factor affecting both X and Y can create association without a causal effect."
    ]
  },
  "L09-3-1": {
    "vi": [
      "Train để học tham số; validation để chọn mô hình hoặc ngưỡng; test giữ lại để đánh giá cuối cùng trên dữ liệu chưa dùng chọn quyết định.",
      "Không nhìn nguồn: phân biệt train, validation và test; cho ví dụ data leakage phá hỏng độ tin cậy đánh giá.",
      "Train fit mô hình và tiền xử lý; validation hỗ trợ lựa chọn/tinh chỉnh; test dùng đánh giá cuối sau khi khóa quyết định. Fit preprocessing trên toàn dữ liệu hoặc nhìn test để chọn threshold là leakage làm kết quả lạc quan."
    ],
    "en": [
      "Training fits model parameters; validation guides selection and tuning; the held-out test set supports a final evaluation.",
      "From memory: distinguish train, validation and test, and give an example of leakage that invalidates evaluation.",
      "Training fits the model and preprocessing, validation guides model or threshold selection, and the test set is reserved until decisions are fixed. Fitting preprocessing across all data or tuning on test leaks information."
    ]
  },
  "L09-3-2": {
    "vi": [
      "Khi positive được định nghĩa là đơn giao trễ, TP/FP/FN/TN đều phải đọc theo định nghĩa này.",
      "Không nhìn nguồn: precision và recall có mẫu số nào, và tại sao accuracy cao vẫn có thể bỏ sót nhiều đơn trễ?",
      "Precision=TP/(TP+FP), trong số báo trễ có bao nhiêu thực sự trễ. Recall=TP/(TP+FN), trong số đơn thực sự trễ phát hiện được bao nhiêu. Accuracy có thể cao khi ca trễ hiếm dù FN nhiều."
    ],
    "en": [
      "When positive means a truly late shipment, TP/FP/FN/TN must all follow that definition.",
      "From memory: what are the denominators of precision and recall, and why might high accuracy miss many late shipments?",
      "Precision=TP/(TP+FP) is correctness among predicted late cases; recall=TP/(TP+FN) is detection among truly late cases. Accuracy can look high for rare events despite many false negatives."
    ]
  },
  "L09-3-3": {
    "vi": [
      "Hai nhóm có cùng accuracy nhưng recall hay false positive rate rất khác nhau, dẫn đến hậu quả phân bổ không đều.",
      "Không nhìn nguồn: demographic parity, equal opportunity và equalized odds khác nhau thế nào? Vì sao không có một fairness metric hợp mọi trường hợp?",
      "Demographic parity xem tỷ lệ được dự đoán positive; equal opportunity so sánh true-positive rate giữa nhóm; equalized odds xét cả true-positive và false-positive rate. Chọn tiêu chí phải gắn bối cảnh, ai chịu tác động và hậu quả sai sót."
    ],
    "en": [
      "Two groups may have equal accuracy but different recall or false-positive rates, distributing errors unevenly.",
      "From memory: distinguish demographic parity, equal opportunity and equalized odds. Why is no fairness metric universally sufficient?",
      "Demographic parity compares predicted-positive rates; equal opportunity compares true-positive rates; equalized odds considers both true- and false-positive rates. Metric choice depends on context, affected groups and harms."
    ]
  },
  "L15-2-1": {
    "vi": [
      "Sales quan sát không mặc nhiên là demand: hết hàng có thể làm số bán về 0 dù khách vẫn muốn mua.",
      "Không nhìn nguồn: phân biệt sales, demand, forecast và replenishment plan; stockout có thể làm dữ liệu dự báo sai như thế nào?",
      "Sales là giao dịch hoàn tất, demand là nhu cầu cần đo riêng; forecast ước lượng tương lai còn plan là quyết định hành động chịu tồn kho, lead time và ràng buộc. Stockout che nhu cầu chưa được phục vụ."
    ],
    "en": [
      "Recorded sales are not necessarily demand: stockouts can drive sales to zero while customers still want the item.",
      "From memory: distinguish sales, demand, forecast and replenishment plan. How can stockouts distort forecasting data?",
      "Sales count completed transactions; demand includes interest that may be unmet; a forecast estimates future demand while a plan chooses actions under inventory and lead-time constraints. Stockouts can censor demand."
    ]
  },
  "L15-2-2": {
    "vi": [
      "Trong continuous review đơn giản, ROP = nhu cầu trong lead time + safety stock; kích hoạt khi inventory position chạm ngưỡng.",
      "Không nhìn nguồn: viết công thức ROP và inventory position. Vì sao safety stock không mặc nhiên là lượng đặt hàng?",
      "ROP=demand rate×lead time+safety stock với giả định phù hợp. Inventory position=on-hand+đang đặt−backorders. Safety stock là đệm; ngưỡng tái đặt không xác định luôn số lượng đặt tối ưu hay xác suất phục vụ."
    ],
    "en": [
      "Under a simple continuous-review policy, ROP = lead-time demand + safety stock, triggered by the inventory position reaching the threshold.",
      "From memory: give the ROP and inventory-position formulas. Why is safety stock not the order quantity?",
      "ROP=demand rate×lead time+safety stock under stated assumptions; inventory position=on-hand+on-order−backorders. Safety stock is a buffer, not an automatically optimal order size or guaranteed service level."
    ]
  },
  "L15-2-3": {
    "vi": [
      "Planned arrival là kế hoạch, ETA là ước lượng tại một thời điểm, actual arrival là sự kiện được báo cáo; message receipt time là lúc hệ thống nhận tin.",
      "Không nhìn nguồn: phân biệt planned, ETA, actual và receipt time; vì sao chưa có actual không có nghĩa xe chắc chắn chưa đến?",
      "Planned nói mốc dự kiến theo kế hoạch; ETA là dự đoán có as-of time; actual là giờ sự kiện xảy ra được ghi nhận; receipt time là giờ hệ thống nhận bản tin. Bản tin có thể trễ hoặc thiếu nên phải nói 'chưa xác nhận'."
    ],
    "en": [
      "Planned arrival is a plan, ETA is an as-of prediction, actual arrival is a reported real event, and receipt time is when its message arrives.",
      "From memory: distinguish planned, ETA, actual and receipt time. Why does a missing actual report not prove the truck has not arrived?",
      "Planned is the original schedule; ETA is a time-stamped estimate; actual describes reported event time; receipt is message arrival. A delayed or missing report means unconfirmed, not certainly absent."
    ]
  },
  "L15-3-1": {
    "vi": [
      "Khách mua đều nhưng đơn bổ sung dọc chuỗi có thể lên xuống mạnh do đặt theo lô, thông tin trễ và cách phản ứng.",
      "Không nhìn nguồn: bullwhip effect là gì, và vì sao upstream orders không đồng nhất end-customer demand?",
      "Bullwhip là mức biến động đơn đặt có thể khuếch đại về phía upstream dù nhu cầu cuối ít đổi. Đơn bổ sung phản ánh chính sách tồn kho, lô đặt, lead time và độ trễ thông tin, không chỉ lượng khách mua."
    ],
    "en": [
      "Even with stable customer purchases, orders upstream can oscillate because of batch ordering, delays and inventory responses.",
      "From memory: what is the bullwhip effect, and why are upstream orders not the same as end-customer demand?",
      "Bullwhip means order variability can amplify upstream despite steadier final demand. Replenishment orders reflect lot sizes, inventory policy, lead times and information delays, not merely final purchases."
    ]
  },
  "L15-3-2": {
    "vi": [
      "Risk pooling có thể giảm safety stock khi nhu cầu các điểm không dao động hoàn toàn cùng nhịp và kho chung thực sự phục vụ được.",
      "Không nhìn nguồn: vì sao gộp kho có thể giảm tồn dự phòng? Tương quan và lead time ảnh hưởng kết luận ra sao?",
      "Khi nhu cầu đủ độc lập hoặc không tương quan hoàn toàn, biến động tổng có thể nhỏ hơn tổng mức biến động riêng, giảm safety stock với cùng điều kiện. Tương quan dương cao, lead time hoặc giới hạn phục vụ có thể làm mất lợi ích."
    ],
    "en": [
      "Risk pooling may reduce safety stock when locations' demand is not perfectly correlated and a shared warehouse can genuinely serve them.",
      "From memory: why might inventory pooling lower buffers? How do correlation and lead time change the conclusion?",
      "With less-than-perfectly correlated demand, aggregate variability may be lower than the sum of separate variability at comparable service assumptions. High correlation, lead times or service constraints can remove the benefit."
    ]
  },
  "L15-3-3": {
    "vi": [
      "Fill rate đo phần nhu cầu theo đơn vị được đáp ứng ngay; cycle service level đo phần chu kỳ không stockout.",
      "Không nhìn nguồn: unit fill rate khác cycle service level thế nào? Vì sao 98% fill rate vẫn có nhiều chu kỳ hết hàng?",
      "Unit fill rate=đơn vị đáp ứng ngay/tổng đơn vị nhu cầu; CSL=chu kỳ không stockout/tổng chu kỳ. Một chu kỳ thiếu ít đơn vị vẫn bị tính là có stockout dù tỷ trọng số đơn vị được phục vụ rất cao."
    ],
    "en": [
      "Unit fill rate measures demand units immediately served; cycle service level measures replenishment cycles without stockouts.",
      "From memory: how does unit fill rate differ from cycle service level? Why can 98% fill rate coexist with many stockout cycles?",
      "Unit fill rate=units immediately filled/total demand units; CSL=cycles without stockouts/all cycles. A cycle short by a few units still counts as a stockout even when most demand units are served."
    ]
  }
};
const t02Exercise=()=>{
 const lang=window.liLanguage?.get?.()==="en"?"en":"vi";
 const cue=Object.prototype.hasOwnProperty.call(T02_LESSON_CUES,activeLessonId)?
  T02_LESSON_CUES[activeLessonId][lang]:null;
 return cue?{...exercises.T02,lesson:cue[0],prompt:cue[1],model:cue[2]}:exercises.T02;
};
// Author-approved, previously-taught example for each of the three Wave1
// suggestions that still used a mismatched standalone exercise. Keep the
// standalone demo and all 13 canonical answer/checking paths unchanged.
const CONTEXTUAL_SUGGESTED_EXERCISES={
  "L03-1-2": {
    "T04": {
      "vi": {
        "lesson": "Bạn nghiên cứu tính năng lưu ghi chú. Người phỏng vấn hỏi: “Tính năng lưu mới tiện hơn nhiều, đúng không?” Người tham gia đáp: “Ừ, cũng tiện.”",
        "prompt": "Tự giải thích vì sao câu trả lời này chưa chứng minh tính năng tiện hơn. Viết một câu hỏi trung lập để tìm hiểu trải nghiệm thực tế.",
        "fields": [
          [
            "reason",
            "Giải thích và viết lại câu hỏi"
          ]
        ],
        "model": "Câu hỏi đã gài sẵn nhận định 'tiện hơn' và hướng người tham gia đồng ý; lời đáp có thể do lịch sự hoặc bị dẫn dắt. Cần hỏi về tình huống thật, ví dụ: “Lần gần nhất bạn lưu ghi chú, bạn đã làm những bước nào? Điều gì xảy ra tiếp theo?” Không khẳng định người tham gia chắc chắn bị thiên lệch."
      },
      "en": {
        "lesson": "In a note-saving feature interview, the researcher asks: “The new save feature is much easier, right?” The participant replies: “Yes, fairly easy.”",
        "prompt": "Explain why this reply does not yet prove the feature is easier. Rewrite the interview prompt as a neutral question about a real experience.",
        "fields": [
          [
            "reason",
            "Explanation and neutral rewrite"
          ]
        ],
        "model": "The question embeds a positive evaluation and invites agreement; the answer could reflect politeness or leading wording. Ask about an actual event, such as: “Tell me about the last time you saved a note. What steps did you take, and what happened next?” Do not assume the interviewee was definitely biased."
      }
    }
  },
  "L09-1-2": {
    "T07": {
      "vi": {
        "lesson": "Một khảo sát qua banner chỉ tiếp cận người còn sử dụng app. Nhóm dự án lập luận: “Nếu mẫu phù hợp để suy ra tổng thể, tỷ lệ mẫu có thể dùng làm ước lượng. Mẫu banner này phù hợp để suy ra tất cả khách hàng. Vậy tỷ lệ mẫu có thể ước lượng tỷ lệ của tất cả khách hàng.”",
        "prompt": "Xét hình thức ‘Nếu P thì Q; P; vậy Q’ có hợp lệ không? Với khảo sát chỉ hiện cho người đang dùng app, có đủ bằng chứng rằng tiền đề P (mẫu phù hợp với tất cả khách hàng) đúng không?",
        "fields": [
          [
            "valid",
            "Kết luận có theo logic từ hai tiền đề không?",
            [
              "Có, hình thức hợp lệ",
              "Không, hình thức không hợp lệ"
            ],
            "radio"
          ],
          [
            "truth",
            "Đã chứng minh tiền đề mẫu đại diện cho tổng thể chưa?",
            [
              "Đã đủ bằng chứng",
              "Chưa đủ bằng chứng"
            ],
            "radio"
          ]
        ],
        "model": "Cấu trúc ‘Nếu P thì Q; P; suy ra Q’ hợp lệ về mặt logic. Nhưng tiền đề ‘mẫu banner phù hợp để suy ra tất cả khách hàng’ chưa được xác minh và có nguy cơ loại người ít dùng hoặc đã rời app. Hợp lệ của phép suy luận không chữa được tiền đề sai; ước lượng cũng không có nghĩa tỷ lệ tổng thể chính xác bằng tỷ lệ mẫu."
      },
      "en": {
        "lesson": "An in-app banner only reaches active users. A team argues: “If a sample is suitable for inference to the target population, its rate can estimate the population rate. This banner sample is suitable for all customers. Therefore its rate can estimate the rate for all customers.”",
        "prompt": "Is the form ‘If P then Q; P; therefore Q’ logically valid? Has the banner survey established that premise P (a suitable sample for all customers) is true?",
        "fields": [
          [
            "valid",
            "Does the conclusion logically follow from the premises?",
            [
              "Yes, valid form",
              "No, invalid form"
            ],
            "radio"
          ],
          [
            "truth",
            "Is the sample-suitability premise established?",
            [
              "Sufficient evidence",
              "Insufficient evidence"
            ],
            "radio"
          ]
        ],
        "model": "The form ‘If P then Q; P; therefore Q’ is valid. But the claim that active-user banner responses can represent all customers is not established; infrequent or former users may be excluded. Logical validity cannot rescue an unsupported premise, and a sample estimate is not an exact population rate."
      }
    }
  },
  "L15-2-2": {
    "T10": {
      "vi": {
        "lesson": "Mức dùng bình quân 24 hộp/ngày; lead time cố định theo ví dụ là 5 ngày; safety stock 30 hộp. ROP theo mô hình đơn giản bằng 150 hộp. Inventory position hiện 149 hộp.",
        "prompt": "Chia quyết định đặt lại thành giả định, các bước kiểm tra và một trường hợp biên. Nếu lead time tăng lên 12 ngày, có còn dùng máy móc ngưỡng ROP 150 không? Đừng tự suy ra lượng đặt tối ưu.",
        "fields": [
          [
            "constraint",
            "Nêu giả định và ràng buộc của mô hình ROP"
          ],
          [
            "steps",
            "Hai hoặc ba bước kiểm tra trước khi đặt lại"
          ],
          [
            "edge",
            "Trường hợp biên và điều cần đánh giá lại"
          ]
        ],
        "model": "Ở giả định lead time 5 ngày và safety stock 30: ROP = 24 × 5 + 30 = 150 hộp. Inventory position 149 ≤ 150 kích hoạt tái đặt trong chính sách continuous review đơn giản. Nếu lead time có thể là 12 ngày, demand trong lead time thành 24 × 12 = 288 hộp (chưa kể đệm), nên cần đánh giá lại ROP, sự bất định và safety stock; không suy ra được số lượng đặt hay service level chỉ từ dữ liệu này."
      },
      "en": {
        "lesson": "Average demand is 24 boxes/day, the example assumes fixed 5-day lead time and 30 safety-stock boxes. Its simple reorder point is 150 boxes. Current inventory position is 149 boxes.",
        "prompt": "Break the reorder decision into assumptions, checking steps and one boundary case. If lead time reaches 12 days, can the 150-box reorder point still be used without re-evaluation? Do not infer an optimal order quantity.",
        "fields": [
          [
            "constraint",
            "Assumptions and constraints of the ROP policy"
          ],
          [
            "steps",
            "Two or three checks before replenishment"
          ],
          [
            "edge",
            "One boundary case and what to reassess"
          ]
        ],
        "model": "For a fixed 5-day lead time and 30-box buffer, ROP = 24 × 5 + 30 = 150 boxes. With inventory position 149 ≤ 150, the simple continuous-review policy triggers replenishment. If lead time rises to 12 days, expected lead-time demand is 24 × 12 = 288 boxes before the buffer. Reassess ROP, uncertainty and safety stock; this information alone does not determine order size or service level."
      }
    }
  }
};
const currentExercise=()=>{
 if(active==="T02")return t02Exercise();
 if(active==="T06"&&activeLessonId==="L03-1-2")
  return window.liLanguage?.get?.()==="en"?l03T06en:l03T06;
 const byLesson=Object.prototype.hasOwnProperty.call(CONTEXTUAL_SUGGESTED_EXERCISES,activeLessonId)?
  CONTEXTUAL_SUGGESTED_EXERCISES[activeLessonId]:null;
 const byMethod=byLesson&&Object.prototype.hasOwnProperty.call(byLesson,active)?byLesson[active]:null;
 const authored=byMethod?.[window.liLanguage?.get?.()==="en"?"en":"vi"];
 return authored?{...exercises[active],...authored}:exercises[active];
};
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
function t02Key(lessonId=activeLessonId){
 try{
  if(!document.documentElement.classList.contains("li-auth-verified")||
     document.documentElement.classList.contains("li-account-open"))return null;
  const owner=localStorage.getItem(T12_OWNER);
  if(!owner||owner.length>128)return null;
  return T02_PREFIX+encodeURIComponent(owner)+":"+(lessonId||"standalone");
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
/** Read-only, invite-guarded lesson status for the React Progress screen.
 * Never switches active exercises, migrates old data, or edits a schedule. */
function getT02Status(lessonId){
 if(typeof lessonId!=="string"||!Object.prototype.hasOwnProperty.call(T02_LESSON_CUES,lessonId))
  return null;
 const released=["L03-1-2","L09-1-2","L15-2-2"].includes(lessonId);
 const personal=Object.prototype.hasOwnProperty.call(window.liPersonalStudyRoutes||{},lessonId);
 if(!released&&!personal)return null;
 const key=t02Key(lessonId);if(!key)return null;
 try{
  const raw=localStorage.getItem(key);
  if(!raw)return {dueAt:null,awaitingRating:false,reviewCount:0};
  if(raw.length>2400)return null;
  const saved=JSON.parse(raw);
  if(!t02Valid(saved))return null;
  return {dueAt:saved.due,awaitingRating:saved.awaitingRating,reviewCount:saved.reviewCount};
 }catch{return null;}
}
/** Postpone one genuinely due, unexposed lesson review. Preserve all history,
 * and reject stale UI/sync values, pending feedback, or inaccessible lessons. */
function postponeT02(lessonId,expectedDue){
 const status=getT02Status(lessonId),now=Date.now();
 if(!status||status.awaitingRating||status.dueAt===null||
    status.dueAt!==expectedDue||status.dueAt>now)return false;
 const key=t02Key(lessonId);if(!key)return false;
 try{
  const raw=localStorage.getItem(key);
  if(!raw||raw.length>2400)return false;
  const saved=JSON.parse(raw);
  if(!t02Valid(saved)||saved.awaitingRating||saved.due!==expectedDue)return false;
  const ok=t02Write({...saved,due:now+T02_DAY_MS},lessonId);
  if(ok&&active==="T02"&&activeLessonId===lessonId){
   phase=0;feedback="";reviewedInSession=false;viewSession++;tabDraft=null;draw();
  }
  return ok;
 }catch{return false;}
}
function t02NotifySync(){
 if(typeof window.dispatchEvent==="function"&&typeof Event==="function")
  window.dispatchEvent(new Event("li:private-personal-change"));
}
function t02Write(data,lessonId=activeLessonId){
 const key=t02Key(lessonId);if(!key)return false;
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
  // Legacy standalone demo may never become a subject review.
  if(activeLessonId!==null)return null;
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
   const due=scheduleRead();
   inner+='<p class="spell-honest">Đã hoàn thành '+(due?.reviewCount||0)+' lượt ôn. Mỗi lượt: nhớ lại khi đến hạn → đối chiếu → tự đánh giá → hẹn lượt tiếp.</p>';
   if(due?.due&&due.due>Date.now()){
    inner+='<p class="spell-honest">Lần ôn tiếp: '+fmt(due.due)+'. Chưa đến hạn thì không tính là ôn giãn cách.</p>'+act("clear","Hủy lịch lượt tới","action alt");
   }else if(due?.due&&due.due<=Date.now()){phase=1;draw();return;}
   else inner+=act("schedule","Bắt đầu · hẹn ôn lần 1 sau 24 giờ");
  }else if(["hide","faded","resume","loci"].includes(e.mode)){
   if(["resume","loci"].includes(e.mode))inner+=e.fields.map(field).join("");
   inner+=act("next",e.mode==="resume"?"Tạm ngắt · Lưu dấu vết trong phiên":e.mode==="loci"?"Giấu nguồn · Đi qua lộ trình":"Giấu nguồn · Tiếp tục");
  }else {inner+=e.fields.map(field).join("")+act("check","Đối chiếu bài làm");}
 }else if(e.mode==="due"&&scheduleRead()?.awaitingRating){
   inner='<p class="spell-honest">Đã đối chiếu. Hãy tự đánh giá phần mình thật sự nhớ được trước khi lên lịch lượt tiếp theo.</p>'+
    act("rate-remembered","Nhớ được · giãn lịch")+
    act("rate-retry","Chưa nhớ vững · ôn lại sớm","action alt");
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
   active==="T02"?"Lịch và số lượt ôn T02 lưu theo tài khoản, đồng bộ khi online. Câu trả lời không lưu.":"Tự chọn, có thể bỏ qua. Câu trả lời không tự lưu hay gửi lên máy chủ.")+
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
 active=id;practiceSessionOwner=verifiedOwner();practiceError="";practiceSynced=false;
 const released=["L03-1-2","L09-1-2","L15-2-2"].includes(lessonId);
 const personal=typeof lessonId==="string"&&
  Object.prototype.hasOwnProperty.call(window.liPersonalStudyRoutes||{},lessonId);
 activeLessonId=released||personal?lessonId:null;
 phase=0;feedback="";reviewedInSession=false;viewSession++;privatePlaces=[];resumeNote="";
 t12Draft={context:"",next:"",answer:""};t12SavedOnDevice=false;t12StorageError="";
 t12LocalModified=false;t12Synced=false;
 if(id!=="T02"&&id!=="T12"){
  const saved=receipt();
  if(!practiceError&&saved.phase>0){
   phase=saved.phase;privatePlaces=id==="T13"?saved.places.slice():[];
  }
 }
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
/* Bind the exact invited personal lesson after Chat 1's gated spell opener. */
function setLessonContext(id){
 if(!active||!verifiedOwner()||typeof id!=="string"||
   !Object.prototype.hasOwnProperty.call(window.liPersonalStudyRoutes||{},id))return false;
 if(activeLessonId===id)return true;
 activeLessonId=id;phase=0;feedback="";reviewedInSession=false;
 privatePlaces=[];viewSession++;
 if(active==="T12"){
  const saved=t12Read();
  t12Draft=saved?{context:saved.context,next:saved.next,answer:saved.answer}:
   {context:"",next:"",answer:""};
  phase=saved?saved.phase:0;resumeNote=saved?saved.next:"";
  t12SavedOnDevice=!!saved;
 }else if(active!=="T02"){
  const saved=receipt();
  if(!practiceError&&saved.phase>0){
   phase=saved.phase;privatePlaces=active==="T13"?saved.places.slice():[];
  }
 }
 draw();return true;
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
  if(phase===1){phase=2;feedback="";saveReceipt({phase:2});draw();return;}
  if(!reviewedInSession)saveReceipt({complete:true});
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
 if(active==="T07"){
  const correct=radio("valid")==="0"&&radio("truth")==="1";
  const english=activeLessonId==="L09-1-2"&&window.liLanguage?.get?.()==="en";
  info=(english?(correct?"Logical form and evidence separated correctly. ":"Recheck logical form and evidence. "):
   (correct?"Đã tách đúng hai câu hỏi. ":"Một đáp án cần xem lại. "))+info;
 }
 if(active==="T09")info=(radio("source")==="1"?"B là nguồn tốt hơn cho câu hỏi hẹp này. ":"Hãy kiểm tra lại provenance và cơ chế chọn người. ")+info;
 if(active==="T11")info=(radio("method")==="1"?"T03 phù hợp cho thủ tục mới. ":"Chưa có lần học trước nên T02 không phù hợp ngay. ")+info;
 if(active==="T05")info=(checked("evidence").sort().join(",")==="0,1"?"Bạn chọn hai dữ kiện quan trọng, không chọn khẳng định quá mức. ":"Dữ kiện không có nhóm so sánh và khuyến mãi đồng thời đều quan trọng. ")+info;
 if(active==="T12"&&!t12Clear()){showMessage(t12StorageError);return;}
 if(active==="T02"){
  const saved=scheduleRead();
  if(!saved||saved.awaitingRating||saved.due===null||saved.due>Date.now())return;
  if(!t02Write({...saved,awaitingRating:true})){
   showMessage("Không lưu được dấu mốc ôn. Chưa ghi nhận lượt này.");return;
  }
  reviewedInSession=true;showMessage(info);
  if(!reactOwnsSpell())draw();
  return;
 }
 if(!reviewedInSession)saveReceipt({complete:true});
 reviewedInSession=true;
 showMessage(info);
 /* T02 history is retained until the learner explicitly resets it. */
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
  phase=1;feedback="";saveReceipt({phase:1,places:privatePlaces});draw();return;
 }
 phase=1;feedback="";saveReceipt({phase:1});draw();
}

/* Existing exercise engine remains single owner of 13 techniques and feedback.
 * React consumes typed snapshots and calls the same action listeners. */
function notifyReactSpell(){
 if(typeof window.dispatchEvent==="function"&&typeof Event==="function")
  window.dispatchEvent(new Event("li:spell-view-changed"));
}
function getView(){
 if(practiceSessionOwner&&practiceSessionOwner!==verifiedOwner()){
  active=null;feedback="";reviewedInSession=false;privatePlaces=[];resumeNote="";
  return null;
 }
 // React owns every visible spell form; discard stale fallback controls
 // rather than leaving a hidden second form behind the React tab.
 // Native fallback can rebuild from canonical engine state on unmount.
 if(reactOwnsSpell()&&root?.childElementCount)root.replaceChildren();
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
 if(mode==="due"&&due?.awaitingRating)fields=[];
 return {
  active,title:e.title,mode,phase,tab:activeTab,
  lesson:e.lesson,prompt:e.prompt,fields:fields.map(field=>({
   id:field[0],label:field[1],options:Array.isArray(field[2])?field[2].slice():null,
   choiceKind:field[3]==="multi"?"multi":"radio"
  })),
  feedback,resumeNote,places:privatePlaces.slice(),dueAt:due?.due??null,
  t02ReviewCount:due?.reviewCount??0,t02Streak:due?.streak??0,
  t02AwaitingRating:!!due?.awaitingRating,
  lessonId:activeLessonId,reviewedInSession,viewSession,
  t12Draft:active==="T12"?{...t12Draft}:undefined,
  t12SavedOnDevice:active==="T12"&&t12SavedOnDevice,
  t12Synced:active==="T12"&&t12Synced,
  t12StorageError:active==="T12"?t12StorageError:"",
  practiceCount:active==="T02"?(due?.reviewCount??0):receipt().count,
  practiceLastAt:active==="T02"?(due?.lastReviewedAt??null):receipt().lastAt,
  practiceError:active==="T02"?"":practiceError,
  practiceSynced:active!=="T02"&&active!=="T12"&&practiceSynced
 };
}
/** Both frontends invoke the same 13-technique action engine. React values
 * are supplied to the checker directly; native fallback reads its visible form.
 * No hidden input writes, synthetic events or button clicks. */
function runAction(action){
 if(!active||!["next","check","reset","schedule","clear","rate-remembered","rate-retry"].includes(action))return false;
 const mode=currentExercise().mode||"direct";
 if(action==="next"&&(phase!==0||!["hide","faded","resume","loci"].includes(mode)))return false;
 if(action==="check"&&(mode==="due"&&(phase===0||scheduleRead()?.awaitingRating)||
   phase===0&&["hide","faded","resume","loci"].includes(mode)))return false;
 if(["rate-remembered","rate-retry"].includes(action)&&
   (mode!=="due"||phase!==1||!scheduleRead()?.awaitingRating))return false;
 if(["schedule","clear"].includes(action)&&(mode!=="due"||phase!==0))return false;
 switch(action){
 case "reset":
  if(active==="T12"&&!t12Clear()){showMessage(t12StorageError);return false;}
  if(active==="T02"&&!t02Write(t02Empty())){
   showMessage("Không lưu được lần làm lại T02. Lịch cũ vẫn còn.");return false;
  }
  if(active!=="T02"&&active!=="T12"&&!saveReceipt({phase:0})){
   showMessage(practiceError);return false;
  }
  phase=0;feedback="";reviewedInSession=false;viewSession++;privatePlaces=[];resumeNote="";
  t12Draft={context:"",next:"",answer:""};draw();return true;
 case "next":next();return true;
 case "check":check();return true;
 case "schedule":{
  const saved=scheduleRead()||t02Empty();
  if(saved.due!==null)return false;
  if(!t02Write({...saved,due:Date.now()+T02_DAY_MS,awaitingRating:false})){
   showMessage("Không lưu được lịch ôn theo tài khoản. Chưa đặt hẹn.");return false;
  }
  feedback="";draw();return true;
 }
 case "clear":{
  const saved=scheduleRead();
  if(!saved||saved.due===null||saved.due<=Date.now()||saved.awaitingRating)return false;
  if(!t02Write({...saved,due:null})){
   showMessage("Không hủy được lịch ôn đã lưu.");return false;
  }
  feedback="";draw();return true;
 }
 case "rate-remembered":return t02Rate(true);
 case "rate-retry":return t02Rate(false);
 }
 return false;
}
function performReact(action,values={}){
 // The explicit port also serves existing native fallback automation and
 // authorized callers. It never depends on a hidden button or React mount.
 if(!active||(practiceSessionOwner&&practiceSessionOwner!==verifiedOwner())||
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
  window.addEventListener("li:spell-practice-sync-confirmed",ev=>{
   const detail=ev.detail,key=receiptKey();
   if(!key||!detail||!Array.isArray(detail.keys)||
      detail.accountId!==practiceSessionOwner||
      !detail.keys.includes(key)||!active||active==="T02"||active==="T12")return;
   practiceSynced=true;notifyReactSpell();
  });
  window.addEventListener("li:personal-sync-applied",ev=>{
   const receiptDetail=ev.detail,receiptStorageKey=receiptKey();
   if(active&&active!=="T02"&&active!=="T12"&&receiptStorageKey&&
      receiptDetail?.accountId===practiceSessionOwner&&
      Array.isArray(receiptDetail.keys)&&receiptDetail.keys.includes(receiptStorageKey)){
    practiceSynced=false;
    // Preserve an in-progress answer while still showing downloaded history.
    if(phase===0&&!reviewedInSession){
     const saved=receipt();
     if(!practiceError&&saved.phase>0){
      phase=saved.phase;
      privatePlaces=active==="T13"?saved.places.slice():[];
      viewSession++;tabDraft=null;
     }
    }
    notifyReactSpell();
   }
   if(active==="T02"){
    const key=t02Key(),detail=ev.detail;
    if(key&&detail&&detail.accountId===localStorage.getItem(T12_OWNER)&&
       Array.isArray(detail.keys)&&detail.keys.includes(key)){
     phase=0;reviewedInSession=false;feedback="";viewSession++;tabDraft=null;
     draw();notifyReactSpell();
    }
   }
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
 window.LiSpellPractice={open,methods:Object.keys(exercises),getView,getT02Status,postponeT02,getLessonPracticeSummary,
  perform:performReact,setTab:switchTab,setT12Draft,setLessonContext,
  refreshNative:()=>{if(!reactOwnsSpell())switchTab(activeTab);}};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();