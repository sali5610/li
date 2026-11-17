/* S121 · Source-checked context-aware quotation library for Lão Lý.
   Original language is quoted; Vietnamese is our explanatory gloss, not a claimed canonical translation.
   Commentary is explicitly Lão Lý's interpretation, separate from the author.
   No third-party APIs, no telemetry; only anonymous quote IDs in sessionStorage. */
(function(){
"use strict";
const QUOTES=[{"id":"analects-practice","original":"學而時習之，不亦說乎？","gloss":"Học rồi thường xuyên ôn luyện, chẳng phải đáng vui sao?","meta":"Khổng Tử · Luận Ngữ, Học Nhi 1.1","url":"https://zh.wikisource.org/zh-hant/論語/學而第一","lang":"zh-Hant","tags":["practice","memory","knowledge","methods"],"comment":"Học xong cất vào tủ là cách biến kiến thức thành đồ trang trí đó, tiểu hữu."},{"id":"analects-honesty","original":"知之爲知之，不知爲不知，是知也。","gloss":"Biết thì nhận là biết; chưa biết thì nhận là chưa biết — đó mới là biết.","meta":"Khổng Tử · Luận Ngữ, Vi Chính 2.17","url":"https://zh.wikisource.org/zh-hant/論語/為政第二","lang":"zh-Hant","tags":["doubt","evidence","knowledge","reflection"],"comment":"Dán nhãn 'chưa biết' đỡ tốn công chữa một kết luận bịa cho sang."},{"id":"analects-review","original":"溫故而知新，可以爲師矣。","gloss":"Ôn điều cũ để hiểu thêm điều mới; nhờ thế có thể hướng dẫn người khác.","meta":"Khổng Tử · Luận Ngữ, Vi Chính 2.11","url":"https://zh.wikisource.org/zh-hant/論語/為政第二","lang":"zh-Hant","tags":["memory","practice","reading","reflection"],"comment":"Nhớ lại không chỉ để thuộc; còn để phát hiện mình vừa hiểu khác đi."},{"id":"analects-think","original":"學而不思則罔，思而不學則殆。","gloss":"Học mà chẳng suy xét thì mơ hồ; chỉ suy nghĩ mà không học thì dễ lạc.","meta":"Khổng Tử · Luận Ngữ, Vi Chính 2.15","url":"https://zh.wikisource.org/zh-hant/論語/為政第二","lang":"zh-Hant","tags":["knowledge","methods","evidence","reading"],"comment":"Não có hai việc: tiếp nhận và kiểm tra. Bỏ một vế là dễ trật đường."},{"id":"analects-others","original":"見賢思齊焉，見不賢而內自省也。","gloss":"Gặp người hay thì học theo; gặp điều chưa hay thì tự soi lại.","meta":"Khổng Tử · Luận Ngữ, Lý Nhân 4.17","url":"https://zh.wikisource.org/zh-hant/論語/里仁第四","lang":"zh-Hant","tags":["social","norms","reflection","methods"],"comment":"Đừng vội đóng dấu một người là 'khác thường'; thử xem chuẩn mình dùng từ đâu ra."},{"id":"analects-peers","original":"三人行，必有我師焉。","gloss":"Đi cùng người khác vẫn có điều để mình học từ họ.","meta":"Khổng Tử · Luận Ngữ, Thuật Nhi 7.22","url":"https://zh.wikisource.org/zh-hant/論語/述而第七","lang":"zh-Hant","tags":["social","knowledge","reading","practice"],"comment":"Một ngành chẳng độc quyền tri thức. Học chéo ngành mới hay vỡ ra chuyện lạ."},{"id":"laozi-begin","original":"千里之行，始於足下。","gloss":"Đường xa nghìn dặm bắt đầu từ bước chân đầu tiên.","meta":"Đạo Đức Kinh · chương 64, bản Vương Bật","url":"https://zh.wikisource.org/zh-hant/道德經_(王弼本)","lang":"zh-Hant","tags":["pace","practice","agency","focus"],"comment":"Muốn học hết thư viện? Được. Nhưng hôm nay cứ mở một trang đã."},{"id":"laozi-self","original":"知人者智，自知者明。","gloss":"Hiểu người là trí; hiểu chính mình là sáng.","meta":"Đạo Đức Kinh · chương 33, bản Vương Bật","url":"https://zh.wikisource.org/zh-hant/道德經_(王弼本)","lang":"zh-Hant","tags":["reflection","agency","social","pace"],"comment":"Nhịp học là do ngươi chọn; lão không đoán hộ đầu óc ngươi đang chịu được bao nhiêu."},{"id":"zhuangzi-limits","original":"吾生也有涯，而知也無涯。","gloss":"Đời người hữu hạn, còn điều có thể biết thì vô hạn.","meta":"Trang Tử · Dưỡng Sinh Chủ","url":"https://zh.wikisource.org/zh-hant/莊子/養生主","lang":"zh-Hant","tags":["pace","focus","knowledge","reading"],"comment":"Câu sau của đoạn này còn cảnh báo cái giá của việc đuổi theo tri thức vô tận. Nghỉ đúng lúc không phải thua."},{"id":"zhuangzi-craft","original":"臣之所好者，道也，進乎技矣。","gloss":"Điều ta theo đuổi là đạo lý vận hành, vượt lên trên một kỹ thuật đơn lẻ.","meta":"Trang Tử · Dưỡng Sinh Chủ, chuyện Bào Đinh","url":"https://zh.wikisource.org/zh-hant/莊子/養生主","lang":"zh-Hant","tags":["systems","supply","methods","practice"],"comment":"Bào Đinh nhìn ra cấu trúc trước khi động dao; làm sản phẩm cũng cần hiểu luồng trước khi đẩy nút."},{"id":"mencius-sources","original":"盡信《書》，則不如無《書》。","gloss":"Nếu tin hoàn toàn vào Kinh Thư, thà chẳng đọc còn hơn.","meta":"Mạnh Tử · Tận Tâm Hạ","url":"https://zh.wikisource.org/zh-hant/孟子/盡心下","lang":"zh-Hant","tags":["critique","evidence","reading","doubt"],"comment":"Ở đây 'Thư' là Kinh Thư cụ thể. Ý hay nằm ở việc kiểm tra nguồn, không phải bảo vứt hết sách."},{"id":"bacon-studies","original":"Reading maketh a full man; conference a ready man; and writing an exact man.","gloss":"Đọc để bồi đắp hiểu biết, trao đổi để nhanh trí, viết để suy nghĩ chính xác hơn.","meta":"Francis Bacon · Essays, Of Studies","url":"https://en.wikisource.org/wiki/The_Essays_of_Francis_Bacon/L_Of_Studies","lang":"en","tags":["reading","writing","practice","knowledge"],"comment":"Đọc xong tưởng mình hiểu? Thử viết lại bằng lời mình xem, lão đợi."},{"id":"bacon-cause","original":"Knowledge and human power are synonymous, since the ignorance of the cause frustrates the effect.","gloss":"Hiểu nguyên nhân mới giúp tác động được vào kết quả.","meta":"Francis Bacon · Novum Organum, quyển I, bản dịch Wood","url":"https://en.wikisource.org/wiki/Novum_Organum/Book_I_(Wood)","lang":"en","tags":["systems","supply","evidence","methods"],"comment":"Có hàng trong hệ thống mà khách không mua được? Hãy lần chuỗi nguyên nhân, đừng nhìn mỗi tổng tồn."},{"id":"hume-evidence","original":"A wise man, therefore, proportions his belief to the evidence.","gloss":"Mức độ tin một kết luận phải tương xứng với bằng chứng có được.","meta":"David Hume · An Enquiry Concerning Human Understanding, mục X","url":"https://davidhume.org/texts/e/full","lang":"en","tags":["sampling","evidence","critique","doubt"],"comment":"Một mẫu trả lời 90% không tự biến thành 90% toàn thị trường. Bằng chứng đến đâu, lời nói đến đó."},{"id":"mill-other-side","original":"He who knows only his own side of the case, knows little of that.","gloss":"Chỉ hiểu phía mình thì vẫn chưa hiểu rõ chính vấn đề.","meta":"John Stuart Mill · On Liberty, chương II","url":"https://en.wikisource.org/wiki/On_Liberty/Chapter_2","lang":"en","tags":["social","critique","sampling","evidence"],"comment":"Cần nghe cả người không có mặt trong mẫu, kể cả người không đồng ý với mình."},{"id":"darwin-confidence","original":"ignorance more frequently begets confidence than does knowledge","gloss":"Thiếu hiểu biết đôi khi lại tạo ra sự chắc chắn lớn hơn là hiểu biết thực sự.","meta":"Charles Darwin · The Descent of Man, Lời dẫn","url":"https://en.wikisource.org/wiki/The_Descent_of_Man_(Darwin)/Introduction","lang":"en","tags":["doubt","critique","evidence","reflection"],"comment":"Lão ngại nhất kiểu chưa kiểm tra mà khẳng định như đóng đinh."},{"id":"aristotle-know","original":"All men by nature desire to know.","gloss":"Con người vốn có khuynh hướng muốn hiểu biết.","meta":"Aristotle · Metaphysics, quyển I, bản dịch W. D. Ross","url":"https://en.wikisource.org/wiki/Page:Metaphysics_by_Aristotle_Ross_1908_(deannotated).djvu/21","lang":"en","tags":["knowledge","reading","methods"],"comment":"Tò mò là lý do tốt để bước vào Tàng Thư; còn đi sâu tới đâu thì tùy câu hỏi."},{"id":"seneca-time","original":"the life we receive is not short, but we make it so","gloss":"Không hẳn đời quá ngắn; chính cách sử dụng thời gian có thể làm nó thành ngắn ngủi.","meta":"Seneca · On the Shortness of Life, chương I, bản dịch tiếng Anh","url":"https://en.wikisource.org/wiki/On_the_shortness_of_life/Chapter_I","lang":"en","tags":["pace","focus","reflection","agency"],"comment":"Đừng mở 18 việc rồi than một ngày chỉ có 24 giờ. Tập trung một việc cho ra hồn đã."},{"id":"epictetus-appearance","original":"You are but a semblance and by no means the real thing.","gloss":"Đó mới là một ấn tượng ban đầu, chưa chắc là chính sự việc.","meta":"Epictetus · Enchiridion, bản dịch tiếng Anh","url":"https://en.wikisource.org/wiki/The_Works_of_Epictetus,_His_Discourses,_in_Four_Books,_the_Enchiridion,_and_Fragments/The_Enchiridion","lang":"en","tags":["doubt","critique","social","reflection"],"comment":"Đừng biến cảm giác đầu tiên thành dữ kiện. Nhìn lại cách mình quan sát đã."},{"id":"box-models","original":"Essentially, all models are wrong, but some are useful.","gloss":"Mô hình luôn đơn giản hóa thực tại, nhưng vẫn có thể hữu ích.","meta":"George E. P. Box · Empirical Model-Building and Response Surfaces (1987)","url":"https://mathshistory.st-andrews.ac.uk/Biographies/Box/quotations/","lang":"en","tags":["models","sampling","systems","evidence"],"comment":"Một dashboard hay mô hình dự báo chỉ giúp quyết định, chứ không thay thế toàn bộ thực tế."},{"id":"smith-incentive","original":"Give me that which I want, and you shall have this which you want","gloss":"Đưa tôi điều tôi cần, tôi sẽ đưa anh điều anh cần — trao đổi dựa trên lợi ích đôi bên.","meta":"Adam Smith · The Wealth of Nations, quyển I, chương II","url":"https://en.wikisource.org/wiki/The_Wealth_of_Nations/Book_I/Chapter_2","lang":"en","tags":["supply","economy","systems","social"],"comment":"Trong chuỗi cung ứng, mỗi bên có động lực và ràng buộc riêng. Đừng giả định cả mạng lưới tự đồng lòng."},{"id":"hamlet-thought","original":"there is nothing either good or bad but thinking makes it so","gloss":"Cách nhìn của ta có thể ảnh hưởng mạnh đến việc đánh giá một chuyện.","meta":"Shakespeare · Hamlet, hồi II cảnh II (lời nhân vật Hamlet)","url":"https://www.folger.edu/explore/shakespeares-works/Hamlet/read/","lang":"en","tags":["social","norms","reflection","critique"],"comment":"Đây là lời một nhân vật trong kịch, không phải định luật tâm lý. Nhưng đáng hỏi: nhãn 'bình thường' xuất phát từ đâu?"},{"id":"woolf-room","original":"a woman must have money and a room of her own if she is to write fiction","gloss":"Để phụ nữ có thể viết văn, họ cần điều kiện vật chất và một không gian riêng.","meta":"Virginia Woolf · A Room of One's Own, chương I (1929)","url":"https://en.wikisource.org/wiki/A_Room_of_One%27s_Own_(Hogarth_1929)/Chapter_1","lang":"en","tags":["social","norms","economy","writing"],"comment":"Cơ hội sáng tạo không chỉ do tài năng; còn phụ thuộc quyền tiếp cận nguồn lực và không gian."},{"id":"mencius-small","original":"吾於《武成》，取二三策而已矣。","gloss":"Với thiên Võ Thành, ta chỉ lấy đôi ba phần đáng tin.","meta":"Mạnh Tử · Tận Tâm Hạ","url":"https://zh.wikisource.org/zh-hant/孟子/盡心下","lang":"zh-Hant","tags":["evidence","critique","reading"],"comment":"Lời này nối ngay sau chuyện đừng tin trọn cuốn. Chọn lọc theo chứng cứ, không chọn theo vẻ oai của sách."}];
const MEMORY_KEY="li.quotes.session.s121";
let memory={routes:{},recent:[]};
try{
 const raw=window.sessionStorage?.getItem(MEMORY_KEY);
 if(raw){const saved=JSON.parse(raw);if(saved&&typeof saved==="object"&&saved.routes&&Array.isArray(saved.recent))memory=saved;}
}catch(e){/* private browsing: in-memory rotation still works */}
function persist(){try{window.sessionStorage?.setItem(MEMORY_KEY,JSON.stringify(memory))}catch(e){}}
function environment(){
 const page=typeof currentPage==="string"?currentPage:"home";
 const scenario=typeof qIndex==="number"?qIndex:0;
 const mode=typeof studyMode==="string"?studyMode:"start";
 let keys=[],scope=page;
 if(page==="home"||page==="research"){
  keys=scenario===0?["sampling","evidence","critique"]:scenario===1?["norms","social","critique"]:["supply","systems","economy"];
  scope+=":"+scenario;
 }else if(page==="case"||page==="lesson")keys=["sampling","evidence","critique"];
 else if(page==="catalog")keys=["knowledge","reading","social"];
 else if(page==="guide"){
  keys=mode==="overload"||mode==="recover"?["pace","focus","practice"]:mode==="focus"?["methods","evidence","reading"]:["practice","memory","methods"];
  scope+=":"+mode;
 }else if(page==="guideDetail"){
  const id=(document.getElementById("detail-id")?.textContent||"").match(/T\d{2}/)?.[0]||"T01";
  keys=["T01","T02","T13"].includes(id)?["memory","practice","knowledge"]:
       ["T03","T04","T05","T06"].includes(id)?["methods","reading","practice"]:
       ["T07","T08","T09"].includes(id)?["evidence","critique","doubt"]:
       id==="T10"?["systems","methods","supply"]:["reflection","pace","agency"];
  scope+=":"+id;
 }else if(page==="library")keys=["memory","reflection","reading"];
 else if(page==="dashboard")keys=["reflection","pace","practice"];
 else if(page==="settings")keys=["agency","pace","reflection"];
 else if(page==="search")keys=["doubt","evidence","knowledge"];
 else if(page==="capture")keys=["reading","reflection","evidence"];
 else keys=["knowledge","reflection","methods"];
 return {scope,keys,page,scenario,mode};
}
function matchList(ctx){
 const scored=QUOTES.map(q=>({...q,score:ctx.keys.reduce((total,key,index)=>total+(q.tags.includes(key)?[100,60,30][index]||10:0),0)}))
 .filter(q=>q.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const max=scored[0]?.score||0;
 let list=scored.filter(q=>q.score>=max-35);
 if(list.length<4)list=scored.slice(0,Math.min(Math.max(4,list.length),scored.length));
 return list;
}
function pick(ctx=environment()){
 const pool=matchList(ctx);if(!pool.length)return null;
 let seen=Array.isArray(memory.routes[ctx.scope])?memory.routes[ctx.scope].filter(id=>pool.some(q=>q.id===id)):[];
 let available=pool.filter(q=>!seen.includes(q.id));
 if(!available.length){seen=[];available=pool;}
 const notRecent=available.filter(q=>!memory.recent.includes(q.id));
 const selected=(notRecent.length?notRecent:available)[0];
 seen.push(selected.id);
 memory.routes[ctx.scope]=seen;
 memory.recent=[selected.id,...memory.recent.filter(id=>id!==selected.id)].slice(0,3);
 persist();
 return selected;
}
function render(){
 const box=document.getElementById("buddy-quote");
 if(!box)return;
 if((typeof buddyDebateActive==="boolean"&&buddyDebateActive)||document.getElementById("calm-toggle")?.checked){
  box.hidden=true;return;
 }
 const item=pick();if(!item){box.hidden=true;return;}
 const original=document.getElementById("buddy-quote-original");
 const gloss=document.getElementById("buddy-quote-gloss");
 const meta=document.getElementById("buddy-quote-meta");
 const link=document.getElementById("buddy-quote-link");
 if(!original||!gloss||!meta||!link){box.hidden=true;return;}
 original.textContent=item.original;original.lang=item.lang;
 gloss.textContent="Diễn nghĩa: "+item.gloss;
 meta.textContent=item.meta;
 link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";
 let note=document.getElementById("buddy-quote-context");
 if(!note){
  note=document.createElement("p");note.id="buddy-quote-context";note.className="small li-quote-context";
  box.append(note);
 }
 note.textContent="Lão Lý liên hệ: "+item.comment;
 box.hidden=false;
}
window.liQuoteEngine={quotes:QUOTES,environment,matchList,pick,render};
})();