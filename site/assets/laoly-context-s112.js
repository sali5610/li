/* li. S112 — Context-aware Lão Lý. Deterministic, on-device; no invented generative AI. */
(function(){
"use strict";
const modal=document.getElementById("buddy-modal");
const textEl=document.getElementById("buddy-text");
const scrollEl=document.getElementById("buddy-scroll");
const quoteEl=document.getElementById("buddy-quote");
const debateEl=document.getElementById("buddy-debate");
const buttons=["buddy-question","buddy-challenge","buddy-forget"].map(id=>document.getElementById(id));
if(!modal||!textEl||buttons.some(x=>!x))return;
let activePlan=null;
/* Invited React and native fallback read the same in-session voice choice. */
function buddyVoice(kind){
 const current=window.liBuddyVoice?.get?.();
 if(current&&typeof current[kind]==="boolean")return current[kind];
 return Boolean(document.getElementById(kind==="calm"?"calm-toggle":"mute-toggle")?.checked);
}

function action(label,reply,perform){return {label,reply,perform:perform||null};}
function methodSourceName(id){return methods.find(m=>m[0]===id)?.[2]||"phương pháp chưa có trong thư viện";}
function inEnglish(){return window.liLanguage?.get?.()==="en";}
function methodDisplayName(m){return inEnglish()?(window.liLanguage?.translate?.(m?.[1]||"")||m?.[1]):m?.[1];}
function methodPurpose(m){return inEnglish()?(window.liLanguage?.translate?.(m?.[3]||"")||m?.[3]):m?.[3];}
function methodSearchBlob(m){return m.join(" ")+" "+(window.LI_LEGACY_EN?.[m[1]]||"")+" "+(window.LI_LEGACY_EN?.[m[4]]||"");}
function methodActionName(m){return inEnglish()?methodDisplayName(m):(m?.[2]||m?.[1]||"phương pháp").split("/")[0].trim();}

function go(page,focusId){
  closeModal("buddy-modal");navigate(page);
  if(focusId){const el=document.getElementById(focusId);el?.scrollIntoView?.({block:"center",behavior:"smooth"});el?.focus?.({preventScroll:true});}
}
function scenarioPlan(){
 const sc=scenarios[qIndex];
 const samples=[
  ["Ai chưa được hỏi?","Chỉ có người đang dùng sản phẩm trong mẫu. Người chưa dùng và người đã rời đi vẫn chưa lên tiếng.","Một mẫu gồm người dùng đang hoạt động không thể thay lời toàn thị trường."],
  ["Ai đặt chuẩn mực?","Chữ “khác thường” là nhãn của cộng đồng. Muốn hiểu chuyện, phải hỏi ai tạo ra chuẩn, ai chịu ảnh hưởng.","Hai cộng đồng có thể đánh giá cùng một hành vi khác nhau. Nhãn gọi không tự chứng minh điều gì."],
  ["Hàng tắc ở đâu?","Tồn kho toàn mạng lưới không đồng nghĩa có hàng tại cửa hàng. Cần vị trí hàng, lịch giao và dữ liệu nhu cầu.","Kho tổng còn 100 món nhưng quầy vẫn trống nếu hàng chưa được chuyển tới đúng chỗ, đúng lúc."]
 ];
 const s=samples[qIndex]||samples[0];
 return {
  intro:sc.buddy,
  actions:[
   action(s[0],s[1]),
   action("Lão cho ví dụ",s[2]),
   action(savedQuestions.some(x=>x.question===sc.question)?"Mở Dấu Trang":"Lưu câu hỏi",savedQuestions.some(x=>x.question===sc.question)?"Câu này đã có trong Dấu Trang. Lão đưa ngươi đến đó.":"Lưu lại câu đáng nghĩ này. Lão sẽ dùng nút lưu thật, không diễn sâu.",()=>{
    if(savedQuestions.some(x=>x.question===sc.question))go("library","li-saved-questions");
    else document.getElementById("save-question")?.click();
   })
  ]
 };
}
function researchPlan(){
 const sc=scenarios[qIndex];
 const feedback=document.getElementById("branch-feedback")?.textContent||"";
 const selected=feedback.startsWith("Hãy kiểm chứng: ")?feedback.replace("Hãy kiểm chứng: ",""):"";
 return {
  intro:selected?"Ngươi đang theo nhánh “"+selected+"”. Được. Giờ thử tìm dữ kiện có thể bác bỏ giả thuyết.":"Một câu hỏi hay chưa phải kết luận. Với “"+sc.question+"”, cứ bắt đầu từ điều quan sát được.",
  actions:[
   action("Điều đã biết",sc.observed),
   action("Điều còn thiếu",sc.unknown+(selected?" Nhánh đang xét: "+selected+".":"")),
   action(qIndex===0&&selected?"Sang Phản Chứng":qIndex!==0?"Xem đánh giá nguồn":"Chọn nhánh khảo sát",qIndex===0&&selected?"Ta thử một kết luận và xem nó đứng được tới đâu.":qIndex!==0?"Tình huống này chưa có Phản Chứng riêng. Hãy dùng "+methodSourceName("T09")+" để kiểm tra nguồn, đừng lạc qua ví dụ khảo sát 90%.":"Chọn một nhánh cụ thể rồi kiểm chứng. Đừng ôm cả ba một lúc.",()=>qIndex===0&&selected?go("case"):qIndex!==0?(closeModal("buddy-modal"),showMethod("T09")):go("research"))
  ]
 };
}
function casePlan(){
 const draft=document.getElementById("case-revision")?.value.trim()||"";
 const valid=Boolean(selectedCaseAnswer)&&draft.length>=12;
 return {
  intro:selectedCaseAnswer?"Ngươi đã chọn một nhận định. Giờ viết lại kết luận sao cho không vượt quá mẫu khảo sát.":"Đây là tình huống thiên lệch chọn mẫu. Trước hết, chọn nhận định nào thực sự được dữ kiện cho phép.",
  actions:[
   action("Giới hạn kết luận","90% chỉ mô tả những người được khảo sát. Chưa đủ căn cứ để suy ra toàn bộ thị trường."),
   action("Thử phản chứng","Nếu người chưa sử dụng sản phẩm có ý kiến khác thì kết luận “ai cũng hài lòng” còn đứng vững không?"),
   action(valid?"Lưu Bút Ký":"Viết Luận Kết",valid?"Ta dùng đúng chức năng lưu Bút Ký đang có.":"Chọn một nhận định, rồi viết lại kết luận ít nhất 12 ký tự trước khi lưu.",()=>{
    if(valid){closeModal("buddy-modal");document.getElementById("finish-case")?.click();}
    else go("case","case-revision");
   })
  ]
 };
}
function guidePlan(){
 const mode=STUDY_MODES[studyMode];
 const query=document.getElementById("method-search")?.value.trim()||"";
 const matches=methods.filter(m=>(!query||methodSearchBlob(m).toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")))&&(currentCategory==="Tất cả"||m[4]===currentCategory));
 const picks=(mode.suggestions||methods.map(m=>m[0])).map(id=>methods.find(m=>m[0]===id)).filter(Boolean);
 const proposed=picks[0]||methods[0];
 return {
  intro:"Ngươi đang chọn nhịp “"+mode.label+"”. "+(query?"Đang tìm “"+query+"”.":"Lão sẽ gợi ý theo nhịp này, nhưng cả 13 phương pháp vẫn có thể tra cứu."),
  actions:[
   action("Chọn pháp cho đúng","Muốn ghi nhớ: "+methodSourceName("T01")+" (tự nhớ trước khi xem đáp án) hoặc "+methodSourceName("T02")+" (ôn tập cách quãng). Muốn hiểu sâu: "+methodSourceName("T04")+" (tự giải thích) hoặc "+methodSourceName("T05")+" (hỏi nguyên nhân). Muốn kiểm chứng: "+methodSourceName("T09")+" (đánh giá nguồn và độ tin cậy). Chọn phương pháp theo vấn đề, đừng chọn theo tên cho kêu."),
   action("Xem "+methodActionName(proposed),proposed[2]+" · "+methodDisplayName(proposed)+" — "+methodPurpose(proposed)+". Đọc điều kiện áp dụng rồi mới thử.",()=>{closeModal("buddy-modal");showMethod(proposed[0]);}),
   action(query?"Sửa từ khóa":"Tìm đủ 13 phép",query?"Có "+matches.length+" phương pháp khớp tên hoặc bộ lọc hiện tại.":"Tìm bằng tên học thuật, pháp danh hoặc lọc nhóm; không cần đổi nhịp học.",()=>go("guide","method-search"))
  ]
 };
}
function guideDetailPlan(){
 const id=(document.getElementById("detail-id")?.textContent||"").match(/T\d\d/)?.[0]||"T01";
 const m=methods.find(x=>x[0]===id)||methods[0];
 const cross=methods.find(x=>x[4]===m[4]&&x[0]!==m[0])||methods[0];
 return {
  intro:"Ngươi đang đọc "+methodDisplayName(m)+" ("+m[2]+"). Cốt lõi của nó là: "+methodPurpose(m).toLowerCase()+".",
  actions:[
   action("Dùng khi nào?",methodPurpose(m)+". Xác định mục tiêu và điều kiện trước, đừng xài thần chú như bùa vạn năng."),
   action("So với "+methodActionName(cross),cross[2]+" · "+methodDisplayName(cross)+" phù hợp khi cần: "+methodPurpose(cross).toLowerCase()+".",()=>{closeModal("buddy-modal");showMethod(cross[0]);}),
   action("Về 13 Thần Chú","Lão đưa ngươi về danh sách, giữ nguyên nhịp học và bộ lọc.",()=>go("guide","method-search"))
  ]
 };
}
function libraryPlan(){
 const cases=processedCases.length,questions=savedQuestions.length;
 return {
  intro:cases||questions?"Tủ Riêng có "+cases+" Bút Ký và "+questions+" Dấu Trang trên thiết bị này. Đây là những gì đã lưu thật, không phải thành tích tưởng tượng.":"Tủ Riêng đang trống trên thiết bị này. Lão chưa có gì để khoe giùm ngươi đâu.",
  actions:[
   action("Bút Ký có gì?",cases?"Đã có "+cases+" lượt lưu Phản Chứng. Mỗi lượt gồm kết luận đã viết lại và phản hồi.":"Chưa có Phản Chứng nào được lưu."),
   action("Dấu Trang có gì?",questions?"Đã lưu "+questions+" câu hỏi từ Gương Vạn Vấn.":"Chưa lưu câu hỏi nào từ Gương Vạn Vấn."),
   action(cases?"Xem Bút Ký":"Đi tìm câu hỏi",cases?"Lão đưa ngươi tới bản ghi đang lưu.":"Thử một câu ở Gương Vạn Vấn, rồi lưu vào Dấu Trang.",()=>go(cases?"library":"home",cases?"case-archive-preview":"mirror-question"))
  ]
 };
}
function settingsPlan(){
 const mode=STUDY_MODES[studyMode];
 return {
  intro:"Nhịp “"+mode.label+"” do chính ngươi chọn. Lão không tự đoán tình trạng sức khỏe hay độ thông minh của ai.",
  actions:[
   action("Nhịp này làm gì?",mode.feedback),
   action("Dữ liệu cất đâu?","Bút Ký, Dấu Trang và bản nháp lưu trên trình duyệt hiện tại. Muốn chuyển trang hoặc thiết bị, dùng Xuất/Nhập bản sao JSON trong Cài đặt."),
   action("Đổi Nhịp học","Lão đưa ngươi tới đúng bốn lựa chọn. Đổi hay không là quyền của ngươi.",()=>go("settings","study-mode-settings"))
  ]
 };
}
function searchPlan(){
 const q=(window.liSearch?.getQuery?.()??document.getElementById("global-search")?.value??"").trim();
 const focus=window.liSearch?.getMentorContext?.();
 // Only explicitly selected, source-reviewed PUBLIC graph links; no personal data,
 // hallucinated answer, paid LLM, spoiler or implicit learning prerequisite.
 if(focus?.links?.length){
  const english=inEnglish();
  const compared=focus.links.find(link=>link.reason&&link.relation==="RELATED_TO");
  const taught=focus.links.find(link=>link.relation==="TEACHES");
  const primary=focus.lessonId||(taught?.lessonId||null);
  const explanation=compared?
   (compared.reasonLocalized?.[english?"en":"vi"]||compared.reason):
   english?"The indexed lesson is linked to this concept by a reviewed TEACHES edge. This is not a prerequisite.":
    "Bài trong kết quả giảng khái niệm này theo liên kết TEACHES đã đối chiếu nguồn; không phải bài tiên quyết.";
  const source=focus.links.find(link=>/^https:\/\//.test(link.sourceUrl||""));
  const sourceText=english?
   "The methodology link is available directly below the selected result. It supports the named relationship, not the grading of any exercise.":
   "Nguồn phương pháp nằm ngay dưới kết quả Tra Cứu. Nguồn xác nhận mối liên hệ được nêu, không phải đáp án bài tập.";
  return {
   intro:english?"You selected “"+focus.title+"”. I can explain the reviewed links, without revealing exercise answers.":
    "Ngươi đang xem “"+focus.title+"”. Lão chỉ giải thích liên kết đã đối chiếu, không tiết lộ đáp án.",
   actions:[
    action(english?"Why are they connected?":"Vì sao có liên kết?",explanation),
    action(english?"Where is the source?":"Nguồn kiểm chứng ở đâu?",source?
      sourceText:(english?"No verified method source is available for this result.":"Kết quả này chưa có nguồn phương pháp được xác minh.")),
    action(primary?(english?"Open "+primary:"Mở bài "+primary):(english?"Back to results":"Trở về kết quả"),
      english?"A lesson opens only through a valid invited session and an existing native route.":
       "Chỉ mở bài khi phiên đăng nhập hợp lệ và bài đã có màn học thật.",
      ()=>{if(primary){
        if(window.liSearch?.openLesson?.(primary))closeModal("buddy-modal");
       }else go("search","global-search");})
   ]
  };
 }
 return {
  intro:q?"Ngươi đang tra “"+q+"”. Không thấy kết quả thì thử tên học thuật, ngành hoặc một từ khóa khác.":"Thư viện rộng thật, nhưng trước hết phải biết đang tìm cái gì, tiểu hữu.",
  actions:[
   action("Đổi cách tìm","Thử một khái niệm cụ thể thay cho câu quá dài. Ví dụ “Thiên lệch chọn mẫu” hoặc “Retrieval Practice”."),
   action("Tra phương pháp","13 Thần Chú có cả tên học thuật tiếng Anh. Đây là một lối tìm khác.",()=>go("guide","method-search")),
   action("Gõ từ khóa",q?"Giữ nguyên từ ngươi đã gõ, sửa thêm nếu cần.":"Nhập từ khóa ở ô tìm kiếm, lão không bịa ra kết quả.",()=>go("search","global-search"))
  ]
 };
}
function capturePlan(){
 const q=document.getElementById("capture-note")?.value.trim()||"";
 return {
  intro:q?"Ngươi đã nhặt được một ý. Giờ nên ghi thêm nguồn và điều chưa chắc, kẻo mai lại tưởng mình đã kiểm chứng.":"Nhặt ý trước khi quên là tốt. Nhưng ý vừa nghe chưa tự biến thành sự thật đâu.",
  actions:[
   action("Thêm gì vào ý?","Ghi nguyên nhận định, ai nói, đọc ở đâu, thời điểm nào và chi tiết nào cần kiểm tra."),
   action("Kiểm chứng thế nào?","Tách điều quan sát khỏi suy luận; tìm nguồn độc lập và thử một trường hợp phản ví dụ.",()=>go("research")),
   action("Về ô ghi ý","Ý đã nhặt chỉ lưu trên thiết bị khi ngươi bấm Lưu. Nếu lưu lỗi, app sẽ báo rõ; lão không nhận vơ.",()=>go("capture","capture-note"))
  ]
 };
}
function genericPlan(page){
 switch(page){
 case "catalog":return {intro:"Đây là bản đồ các lĩnh vực. Chọn một ngả đủ hẹp để bắt đầu, chớ nuốt cả khu rừng.",actions:[
  action("Nên chọn gì?","Bắt đầu từ một câu hỏi mình thực sự tò mò, rồi mở ngành phù hợp."),
  action("Bài mẫu có gì?","Bài Thiên lệch chọn mẫu minh họa cách đặt câu hỏi và kiểm tra bằng chứng.",()=>go("lesson")),
  action("Mở bài học","Lão dẫn tới bài mẫu hiện có, không hứa những bài chưa phát hành.",()=>go("lesson"))
 ]};
 case "lesson":return {intro:"Bài này luyện phân biệt quan sát với kết luận. Tự trả lời một lần rồi hãy xem phản hồi.",actions:[
  action("Câu hỏi cốt lõi","Nhóm được khảo sát có đại diện cho tổng thể mà ta muốn kết luận không?"),
  action("Dễ sai ở đâu?","Từ dữ liệu của người đang dùng sản phẩm, ta chưa thể nhảy thẳng tới “tất cả mọi người”."),
  action("Thử Phản Chứng","Đi từ bài học sang kiểm tra một kết luận cụ thể.",()=>go("case"))
 ]};
 case "dashboard":return {intro:"Nhật Ký hiện chưa có số liệu hoạt động. Lão thà để trống còn hơn tô vẽ tiến bộ.",actions:[
  action("Đang đo gì?","Màn này chưa thu thập hay tính điểm hoạt động cá nhân."),
  action("Có gì được lưu?","Bút Ký và Dấu Trang được lưu riêng trong Tủ Riêng, không tự biến thành điểm thành tích."),
  action("Xem Tủ Riêng","Đó mới là nơi có dữ liệu lưu thật.",()=>go("library"))
 ]};
 default:return {intro:"Nói ngắn thôi: màn này giúp ngươi đi sâu vào một câu hỏi. Bắt đầu bằng dữ kiện.",actions:[
  action("Bắt đầu từ đâu?","Viết rõ câu hỏi và điều đã quan sát."),
  action("Thử kiểm tra","Điều gì có thể khiến kết luận ban đầu sai?"),
  action("Về Đại Sảnh","Lão đưa về Gương Vạn Vấn.",()=>go("home"))
 ]};
 }
}
function getBuddyPlan(){
 const lessonPlan=window.liLessonCompanion?.getPlan?.(currentPage);
 if(lessonPlan)return lessonPlan;
 switch(currentPage){
 case "home":return scenarioPlan();
 case "research":return researchPlan();
 case "case":return casePlan();
 case "guide":return guidePlan();
 case "guideDetail":return guideDetailPlan();
 case "library":return libraryPlan();
 case "settings":return settingsPlan();
 case "search":return searchPlan();
 case "capture":return capturePlan();
 default:return genericPlan(currentPage);
 }
}
function setButtonText(button,label){
 label=window.liLanguage?.translateComposed?.(label)||label;
 const svg=button.querySelector("svg");
 if(svg)button.replaceChildren(svg,document.createTextNode(" "+label));
 else button.textContent=label;
 button.setAttribute("aria-label",label);
}
/* The companion assembles messages with saved counts and user-entered search terms.
   Localize only approved copy fragments; never rewrite someone's query or saved note. */
const PLAN_SEGMENTS=[
 "Ngươi đang theo nhánh “","”. Được. Giờ thử tìm dữ kiện có thể bác bỏ giả thuyết.",
 "Một câu hỏi hay chưa phải kết luận. Với “","”, cứ bắt đầu từ điều quan sát được.",
 "Nhánh đang xét:","Ngươi đang chọn nhịp “","Đang tìm “",
 "Lão sẽ gợi ý theo nhịp này, nhưng cả 13 phương pháp vẫn có thể tra cứu.",
 "Muốn ghi nhớ:","(tự nhớ trước khi xem đáp án) hoặc","(ôn tập cách quãng). Muốn hiểu sâu:",
 "(tự giải thích) hoặc","(hỏi nguyên nhân). Muốn kiểm chứng:",
 "(đánh giá nguồn và độ tin cậy). Chọn phương pháp theo vấn đề, đừng chọn theo tên cho kêu.",
 ". Đọc điều kiện áp dụng rồi mới thử.","phương pháp khớp tên hoặc bộ lọc hiện tại.",
 "Ngươi đang đọc","). Cốt lõi của nó là:","phù hợp khi cần:",
 "Tủ Riêng có","Bút Ký và","Dấu Trang trên thiết bị này. Đây là những gì đã lưu thật, không phải thành tích tưởng tượng.",
 "Đã có","lượt lưu Phản Chứng. Mỗi lượt gồm kết luận đã viết lại và phản hồi.",
 "Đã lưu","câu hỏi từ Gương Vạn Vấn.",
 "Nhịp “","” do chính ngươi chọn. Lão không tự đoán tình trạng sức khỏe hay độ thông minh của ai.",
 "Ngươi đang tra “","”. Không thấy kết quả thì thử tên học thuật, ngành hoặc một từ khóa khác.",
 "Lão Lý ·","Trò chuyện với Lão Lý ·"
].sort((a,b)=>b.length-a.length);
function localizePlanText(text){
 const source=String(text??"");
 const language=window.liLanguage;
 if(!language||language.get()!=="en")return source;
 const count=source.match(/^Có (\d+) phương pháp khớp tên hoặc bộ lọc hiện tại\.$/);
 if(count)return count[1]+(count[1]==="1"?" spell matches":" spells match")+" the current search or filter.";
 const exact=language.translate(source);
 if(exact!==source)return exact;
 const approved=window.LI_LEGACY_EN||{};
 let result=source;
 for(const part of PLAN_SEGMENTS)if(approved[part])result=result.split(part).join(approved[part]);
 result=result.replace(/“(Vào nhịp|Đào sâu|Quá tải|Hồi trí)”/g,(_,mode)=>"“"+language.translate(mode)+"”");
 result=result.replace(/^(Xem|So với) (.+)$/,(all,verb,subject)=> (verb==="Xem"?"View ":"Compare with ")+language.translate(subject));
 return result;
}
function localizePlan(plan){
 if(!plan||window.liLanguage?.get?.()!=="en")return plan;
 return {...plan,intro:localizePlanText(plan.intro),
  actions:(plan.actions||[]).map(item=>({...item,label:localizePlanText(item.label),reply:localizePlanText(item.reply)}))};
}
function updatePlan(){
 activePlan=localizePlan(getBuddyPlan());
 const calm=buddyVoice("calm");
 const intro=calm?"Ta đi từng bước. "+activePlan.intro:activePlan.intro;
 textEl.textContent=localizePlanText(window.liAddressLine?window.liAddressLine(intro):intro);
 buttons.forEach((b,i)=>setButtonText(b,activePlan.actions[i].label));
 debateEl.hidden=true;buddyDebateActive=false;
 showBuddyQuote();
 scrollEl.scrollTop=0;
}
/* New React owner receives a complete view and action intents. The original
 * plan evaluator, source localization, spell/navigation actions and privacy
 * behavior remain authoritative; no duplicate mentor content/AI service. */
const applyNickname=line=>window.liAddressLine?.(line)??line;
function reactView(trigger){
 if(buddyVoice("mute")){
  toast("Im Lặng · Lời thoại Lão Lý đang tắt.");return null;
 }
 activePlan=localizePlan(getBuddyPlan());
 buddyDebateActive=false;
 const calm=buddyVoice("calm");
 const intro=calm?"Ta đi từng bước. "+activePlan.intro:activePlan.intro;
 const line=localizePlanText(applyNickname(intro));
 const quote=window.liQuoteEngine?.getView?.()||null;
 return {
  text:line,
  labels:activePlan.actions.map(item=>
   window.liLanguage?.translateComposed?.(item.label)||item.label),
  avatar:document.getElementById("laoly-current-icon")?.src||"./assets/laoly-neutral.png",
  quote,triggerId:trigger?.id||"laoly-fab"
 };
}
function reactReply(index){
 if(!Number.isInteger(index)||index<0||index>2)return null;
 if(!activePlan)activePlan=localizePlan(getBuddyPlan());
 const item=activePlan.actions[index];
 if(!item)return null;
 buddyDebateActive=true;
 const line=localizePlanText(applyNickname(item.reply));
 // Actions preserve original navigation, saved-question, approved-source,
 // study-method and note-taking side effects.
 const supportsSamplingDebate=
  (currentPage==="home"&&qIndex===0)||
  (currentPage==="research"&&qIndex===0)||
  currentPage==="case"||currentPage==="lesson"||currentPage==="lessonL09";
 if(typeof item.perform==="function")item.perform();
 return {text:line,showChallenge:index===1&&supportsSamplingDebate&&!item.perform};
}
window.liBuddyEngine=Object.freeze({open:reactView,choose:reactReply});
openLaoLy=function(trigger){
 if(window.liBuddyReactMounted){
  if(!document.documentElement?.classList?.contains("li-auth-verified"))return;
  const view=reactView(trigger);
  if(view)window.dispatchEvent(new CustomEvent("li:buddy-open",{detail:view}));
  return;
 }
 if(buddyVoice("mute")){toast("Im Lặng · Lời thoại Lão Lý đang tắt.");return;}
 updatePlan();
 document.getElementById("buddy-title-avatar").src=document.getElementById("laoly-current-icon").src;
 openModal("buddy-modal",trigger);
 refreshLucide();
};
document.addEventListener("click",function(event){
 const btn=event.target.closest?.("#buddy-question, #buddy-challenge, #buddy-forget");
 if(!btn||!modal.classList.contains("open"))return;
 const index=buttons.indexOf(btn);
 if(index<0)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(!activePlan)updatePlan();
 const item=activePlan.actions[index];
 debateEl.hidden=true;buddyDebateActive=true;quoteEl.hidden=true;
 textEl.textContent=localizePlanText(window.liAddressLine?window.liAddressLine(item.reply):item.reply);
 scrollEl.scrollTop=0;
 if(typeof item.perform==="function")item.perform();
},true);
window.liGetBuddyPlan=getBuddyPlan; // deterministic UI test hook; does not read or send personal notes.
})();
