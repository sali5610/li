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

/* All 12-screen Lão Lý routes use the existing canonical app history.
 * Focus the VISIBLE React screen, never hidden legacy form controls. */
function go(page,focusId){
 // Saved-question shortcuts must open the question drawer, even if React Resume
 // last displayed lesson bookmarks.
 if(page==="resume"&&focusId==="li-saved-questions")
  window.liLibraryShelf?.selectBookmarkTab?.("question");
 closeModal("buddy-modal");
 if(window.liBuddyReactMounted&&window.liAppRouter?.navigate)window.liAppRouter.navigate(page);
 else navigate(page);
 if(!focusId)return;
 const reactTargets={
  "li-saved-questions":"#li-react-tab-question",
  "case-archive-preview":"#li-react-library-host",
  "mirror-question":"#li-react-home-host .mirror-message h2",
  "method-search":"#li-react-method-search",
  "case-revision":"#li-react-case-revision",
  "capture-note":"#li-react-capture-note",
  "global-search":"#li-react-search-host input",
  "study-mode-settings":"#li-react-settings-host .ly-mode-choice"
 };
 const focus=()=>{
  const selector=window.liBuddyReactMounted?reactTargets[focusId]:null;
  const node=window.liBuddyReactMounted?
   (selector?document.querySelector(selector):null):document.getElementById(focusId);
  node?.scrollIntoView?.({block:"center",behavior:"smooth"});
  node?.focus?.({preventScroll:true});
 };
 if(typeof requestAnimationFrame==="function")requestAnimationFrame(focus);
 else focus();
}
function scenarioPlan(){
 const sc=scenarios[qIndex];
 const samples=[
  ["Ai chưa được hỏi?","Chỉ có người đang dùng sản phẩm trong mẫu. Người chưa dùng và người đã rời đi vẫn chưa lên tiếng.","Một mẫu gồm người dùng đang hoạt động không thể thay lời toàn thị trường."],
  ["Ai đặt chuẩn mực?","Chữ “khác thường” là nhãn của cộng đồng. Muốn hiểu chuyện, phải hỏi ai tạo ra chuẩn, ai chịu ảnh hưởng.","Hai cộng đồng có thể đánh giá cùng một hành vi khác nhau. Nhãn gọi không tự chứng minh điều gì."],
  ["Hàng tắc ở đâu?","Tồn kho toàn mạng lưới không đồng nghĩa có hàng tại cửa hàng. Cần vị trí hàng, lịch giao và dữ liệu nhu cầu.","Kho tổng còn 100 món nhưng quầy vẫn trống nếu hàng chưa được chuyển tới đúng chỗ, đúng lúc."]
 ];
 const s=samples[qIndex]||samples[0];
 const saved=window.liBuddyReactMounted&&window.liInquiryFlow?.getMirror
  ?Boolean(window.liInquiryFlow.getMirror()?.saved)
  :savedQuestions.some(x=>x.question===sc.question);
 return {
  intro:sc.buddy,
  actions:[
   action(s[0],s[1]),
   action("Lão cho ví dụ",s[2]),
   ...(!saved?[action("Lưu câu hỏi","Lưu lại câu đáng nghĩ này. Lão sẽ dùng nút lưu thật, không diễn sâu.",()=>{
    if(window.liBuddyReactMounted)window.liInquiryFlow?.toggleQuestion?.();
    else document.getElementById("save-question")?.click();
   })]:[])
  ]
 };
}
function researchPlan(){
 const sc=liCurrentProblem(),locale=window.liLanguage?.get?.()==="en"?"en":"vi";
 const c=sc.localized?.[locale]||sc;
 const feedback=window.liBuddyReactMounted&&window.liInquiryFlow?.getResearch
  ?(window.liInquiryFlow.getResearch()?.feedback||"")
  :(document.getElementById("branch-feedback")?.textContent||"");
 const selected=feedback.replace(/^(Hãy kiểm chứng: |Investigate: )/,"");
 const hasBranch=feedback.startsWith("Hãy kiểm chứng: ")||feedback.startsWith("Investigate: ");
 const hasCase=Boolean(sc.caseKey)||(sc.lessonId==="L09-1-2"&&sc.type!=="hook");
 return {intro:hasBranch?"Ngươi đang theo nhánh “"+selected+"”. Tìm dữ kiện bác bỏ giả thuyết.":"Với “"+c.question+"”, hãy tách quan sát khỏi suy luận.",
  actions:[
   action("Điều đã biết",c.observed),
   action("Điều còn thiếu",c.unknown+(hasBranch?" Nhánh: "+selected+".":"")),
   action(hasCase?"Sang Phản Chứng":"Xem đánh giá nguồn",
    hasCase?"Case riêng cho câu hỏi này: chọn nhận định và sửa kết luận.":"Tình huống này chưa có case riêng; hãy dùng "+methodSourceName("T09")+" để kiểm tra nguồn.",
    ()=>hasCase?go("case"):(closeModal("buddy-modal"),showMethod("T09")))
  ]};
}
function casePlan(){
 const live=window.liBuddyReactMounted?(window.liCaseUi?.getState?.()||{choice:null,revision:""}):null;
 const choice=live?live.choice:selectedCaseAnswer;
 const draft=live?live.revision.trim():(document.getElementById("case-revision")?.value.trim()||"");
 const valid=Boolean(choice)&&draft.length>=12;
 const current=window.liInquiryFlow?.getCase?.();
 const lc=current?.localized?.[window.liLanguage?.get?.()==="en"?"en":"vi"]||null;
 return {intro:lc?"Case giả định: "+lc.question+" Hãy chọn nhận định rồi tự viết Luận Kết.":choice?
   "Ngươi đã chọn một nhận định. Viết lại kết luận sao cho không vượt quá mẫu khảo sát.":
   "Đây là tình huống thiên lệch chọn mẫu. Chọn nhận định mà dữ kiện cho phép.",
  actions:[
   action("Giới hạn kết luận",lc?.feedback?.right||"90% chỉ mô tả người được hỏi, chưa đại diện thị trường."),
   action("Thử phản chứng",lc?.technique?.body||"Nếu người chưa dùng có ý kiến khác, kết luận ấy còn đúng không?"),
   action(valid?"Lưu Bút Ký":"Viết Luận Kết",valid?"Lưu đúng case hiện tại.":"Chọn nhận định và viết ít nhất 12 ký tự trước khi lưu.",()=>{
    if(valid){
     if(window.liBuddyReactMounted){if(window.liCaseUi?.submit?.())closeModal("buddy-modal");}
     else{closeModal("buddy-modal");document.getElementById("finish-case")?.click();}
    }else go("case","case-revision");
   })
  ]};
}
function guidePlan(){
 const mode=STUDY_MODES[studyMode];
 const live=window.liBuddyReactMounted?
  (window.liGuideUi?.getState?.()||{query:"",category:"Tất cả"}):null;
 const query=live?live.query.trim():(document.getElementById("method-search")?.value.trim()||"");
 const category=live?live.category:currentCategory;
 const matches=methods.filter(m=>(!query||methodSearchBlob(m).toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")))&&(category==="Tất cả"||m[4]===category));
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
 const liveId=window.liBuddyReactMounted?window.LiSpellPractice?.getView?.()?.active:null;
 const id=liveId||(!window.liBuddyReactMounted?
  (document.getElementById("detail-id")?.textContent||"").match(/T\d\d/)?.[0]:null)||"T01";
 const m=methods.find(x=>x[0]===id)||methods[0];
 // Compare techniques by a related task, not simply the first category sibling.
 const related={
  T01:"T02",T02:"T01",T13:"T01",T03:"T04",T04:"T05",T05:"T04",
  T06:"T04",T07:"T08",T08:"T07",T09:"T08",T10:"T07",
  T11:"T12",T12:"T11"
 };
 const cross=methods.find(x=>x[0]===related[m[0]])||methods.find(x=>x[0]!==m[0]);
 const comparison={
  ...action("So với "+methodActionName(cross),
   inEnglish()?
    "The difference is what you need to do: "+methodDisplayName(m)+" helps you "+
     methodPurpose(m).toLowerCase()+"; "+methodDisplayName(cross)+" helps you "+
     methodPurpose(cross).toLowerCase()+". Compare both methods and examples below before opening another page.":
    "Khác ở việc cần làm: "+methodDisplayName(m)+" giúp "+methodPurpose(m).toLowerCase()+
     "; còn "+methodDisplayName(cross)+" giúp "+methodPurpose(cross).toLowerCase()+
     ". Lão đặt ví dụ cả hai bên dưới để ngươi đối chiếu trước khi chuyển trang."),
  comparison:{from:m[0],to:cross[0]}
 };
 return {
  intro:"Ngươi đang đọc "+methodDisplayName(m)+" ("+m[2]+"). Cốt lõi của nó là: "+methodPurpose(m).toLowerCase()+".",
  actions:[
   action("Dùng khi nào?",methodPurpose(m)+". Xác định mục tiêu và điều kiện trước, đừng xài thần chú như bùa vạn năng."),
   comparison,
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
/* Personal screen context comes from canonical private read ports, never hidden UI. */
function personalPlan(page){
 const english=inEnglish(),say=(vi,en)=>english?en:vi;
 const shelf=window.liLibraryShelf?.getView?.();
 const cases=shelf?.cases||[],ideas=shelf?.ideas||[];
 if(page==="resume"){
  const lesson=shelf?.lessons?.[0];
  const count=(shelf?.lessonBookmarks?.length||0)+(shelf?.questionBookmarks?.length||0);
  return {intro:say("Quay Lại có "+(shelf?.lessons?.length||0)+" bài gần đây và "+count+" Dấu Trang, không có điểm tự bịa.",
   "Continue has "+(shelf?.lessons?.length||0)+" recent lessons and "+count+" bookmarks, no invented scores."),
   actions:[
    action(say("Học tiếp","Resume lesson"),lesson?.title||say("Chưa có bài học gần đây.","No recent lessons yet."),()=>go(lesson?.route||"catalog")),
    action(say("Dấu Trang","Bookmarks"),say("Xem bài và câu hỏi đã lưu.","Review saved lessons and questions."),()=>go("resume","li-saved-questions")),
    action(say("Bộ Sưu Tập","Collection"),say("Xem Bút Ký và Ý đã nhặt.","Review saved notes and ideas."),()=>go("collection"))
   ]};
 }
 if(page==="collection"){
  const recent=[...cases,...ideas].sort((a,b)=>(Date.parse(b.sortDate)||0)-(Date.parse(a.sortDate)||0))[0];
  return {intro:say("Có "+cases.length+" Bút Ký và "+ideas.length+" Ý đã nhặt. Ý mới chưa phải kết luận kiểm chứng.",
   "There are "+cases.length+" case notes and "+ideas.length+" captured ideas. Ideas remain unverified."),
   actions:[
    action(say("Mở bản mới nhất","Open latest note"),recent?.title||say("Chưa lưu ghi chép nào.","No saved notes."),()=>{
     closeModal("buddy-modal");
     if(recent)window.liNotes?.openDetail?.(recent.type,recent.id);
     else go("capture");
    }),
    action(say("Viết Bút Ký","Write a case note"),say("Phản Chứng trước, kết luận sau.","Test the claim before writing a conclusion."),()=>go("case")),
    action(say("Nhặt ý","Capture an idea"),say("Lưu một ý để kiểm chứng sau.","Save a thought to verify later."),()=>go("capture"))
   ]};
 }
 const note=window.liNotes?.getView?.();
 return {intro:note?.id?
  say("Đang xem "+note.title+". Có "+(note.history?.length||0)+" phiên bản.","Viewing "+note.title+". "+(note.history?.length||0)+" versions preserved."):
  say("Ghi chép không còn ở đây.","The note is unavailable."),
  actions:[
   action(say("Lịch sử phiên bản","Version history"),
    say("Khôi phục tạo bản mới, không xóa bản cũ.","Restoring creates a new version, preserving history."),()=>{
     closeModal("buddy-modal");
     requestAnimationFrame(()=>document.querySelector("#li-react-noteDetail-host .library-note-history")?.scrollIntoView?.({block:"start",behavior:"smooth"}));
    }),
   action(say("Kiểm tra bối cảnh","Review source context"),note?.context?
    say("Đề bài và câu trả lời được giữ trong bản lưu.","The saved case question and answer are in this note."):
    say("Bản ghi cũ có thể không có bản chụp đề bài.","An older note might lack a source snapshot."),()=>go(note?.type==="case"?"case":"research")),
   action(say("Về Bộ Sưu Tập","Back to Collection"),
    say("Trở lại các ghi chép đã lưu.","Return to saved notes."),()=>go("collection"))
  ]};
}
function settingsPlan(){
 const mode=STUDY_MODES[studyMode];
 return {
  intro:"Nhịp “"+mode.label+"” do chính ngươi chọn. Lão không tự đoán tình trạng sức khỏe hay độ thông minh của ai.",
  actions:[
   action("Nhịp này làm gì?",mode.feedback),
   action(inEnglish()?"What's in the backup?":"Bản sao gồm gì?",
    inEnglish()?
     "Settings exports a partial notes JSON: case notes, captured ideas, bookmarks, Elder Ly nicknames and any legacy draft. It does not include Journal, Check-ins, lesson progress, spell reviews or reminders. Do not erase device data assuming this is a full backup.":
     "Settings chỉ xuất tệp JSON ghi chú: Bút Ký, Ý đã nhặt, Dấu Trang, tên gọi Lão Lý và bản nháp legacy nếu có. Không có Nhật Ký, Check-in, tiến độ học, lịch ôn Thần Chú hay lời nhắc. Đừng xóa dữ liệu máy vì tưởng đã sao lưu hết."),
   action("Đổi Nhịp học","Lão đưa ngươi tới đúng bốn lựa chọn. Đổi hay không là quyền của ngươi.",()=>go("settings","study-mode-settings"))
  ]
 };
}
function searchPlan(){
 const q=(window.liBuddyReactMounted?
  (window.liSearch?.getQuery?.()??""):
  (window.liSearch?.getQuery?.()??document.getElementById("global-search")?.value??"")).trim();
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
 const q=window.liBuddyReactMounted?
  (window.liCaptureUi?.getDraft?.()||"").trim():
  (document.getElementById("capture-note")?.value.trim()||"");
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
  action("Bài mẫu có gì?","Bài Thiên lệch chọn mẫu minh họa cách đặt câu hỏi và kiểm tra bằng chứng.",()=>go("lessonL09")),
  action("Mở bài học","Lão dẫn tới bài mẫu hiện có, không hứa những bài chưa phát hành.",()=>go("lessonL09"))
 ]};
 case "lesson":return {intro:"Bài này luyện phân biệt quan sát với kết luận. Tự trả lời một lần rồi hãy xem phản hồi.",actions:[
  action("Câu hỏi cốt lõi","Nhóm được khảo sát có đại diện cho tổng thể mà ta muốn kết luận không?"),
  action("Dễ sai ở đâu?","Từ dữ liệu của người đang dùng sản phẩm, ta chưa thể nhảy thẳng tới “tất cả mọi người”."),
  action("Thử Phản Chứng","Đi từ bài học sang kiểm tra một kết luận cụ thể.",()=>go("case"))
 ]};
 case "dashboard":{
  const journal=window.liBuddyReactMounted?window.liPersonalDiary?.getView?.():null;
  const recorded=journal?.totals?.recorded??0;
  return {intro:journal?(recorded?
   "Nhật Ký có "+recorded+" ngày ghi nhận trong tháng đang xem. Đây là hoạt động thật, không phải điểm năng lực.":
   "Tháng đang xem chưa có ngày nào được ghi nhận. Không có dữ liệu thì lão không tự bịa tiến bộ."):
   "Nhật Ký chỉ hiển thị dữ liệu đã ghi, không chấm điểm năng lực học tập.",actions:[
   action("Đang đo gì?","Lịch đếm số bài, nhánh vấn đề và input đã ghi thực tế; check-in do ngươi tự khai, không phải chẩn đoán sức khỏe."),
   action("Dữ liệu lưu ở đâu?",journal?.consentStatus||"Nhật Ký lưu trên thiết bị và chỉ đồng bộ cloud khi bật quyền riêng."),
   action("Xem Tủ Riêng","Lão dẫn ngươi tới Bút Ký và Dấu Trang đang lưu.",()=>go("library"))
  ]};
 }
 default:return {intro:"Nói ngắn thôi: màn này giúp ngươi đi sâu vào một câu hỏi. Bắt đầu bằng dữ kiện.",actions:[
  action("Bắt đầu từ đâu?","Viết rõ câu hỏi và điều đã quan sát."),
  action("Thử kiểm tra","Điều gì có thể khiến kết luận ban đầu sai?")
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
 case "resume":case "collection":case "noteDetail":return personalPlan(currentPage);
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
 buttons.forEach((button,index)=>{
  const item=activePlan.actions[index];
  button.hidden=!item;
  if(item)setButtonText(button,item.label);
 });
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
 // Draft personal lessons have step-authored dialogue, but their source quote
 // rights are still under review. Never attach an unrelated global quote.
 const lessonContext=window.liLessonCompanion?.getContext?.();
 const quote=lessonContext?.editorial?null:(window.liQuoteEngine?.getView?.()||null);
 // Case links to its own registered lesson; draft routes stay invite-gated.
 const selectedCase=currentPage==="case"?window.liInquiryFlow?.getCase?.():null;
 const caseLesson=selectedCase?window.liMirrorRelatedLesson?.({
  type:"problem",lessonId:selectedCase.lessonId,
  previewState:selectedCase.draft?"draft":undefined
 }):null;
 const mirrorLesson=(currentPage==="home"||currentPage==="research")?
  window.liMirrorRelatedLesson?.(currentPage==="home"?scenarios[qIndex]:liCurrentProblem()):null;
 const relatedLesson=caseLesson||mirrorLesson||null;
 return {
  text:line,
  labels:activePlan.actions.map(item=>
   window.liLanguage?.translateComposed?.(item.label)||item.label),
  // Prefer the live React avatar; old markup remains fallback-only in native mode.
  avatar:window.liCompanionDrag?.getAvatar?.()||(!window.liBuddyReactMounted?
   document.getElementById("laoly-current-icon")?.src:null)||"./assets/laoly-neutral.png",
  quote,triggerId:trigger?.id||"laoly-fab",relatedLesson
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
 const source=(currentPage==="home"||currentPage==="research")?liCurrentProblem():null;
 const supportsSamplingDebate=Boolean(
  (source?.lessonId==="L09-1-2"&&!source.caseKey&&source.type!=="hook")||
  (currentPage==="case"&&window.liInquiryFlow?.getCase?.()?.id==="sampling-bias-90")||
  currentPage==="lesson"||currentPage==="lessonL09");
 if(typeof item.perform==="function")item.perform();
 return {text:line,showChallenge:index===1&&supportsSamplingDebate&&!item.perform&&!item.comparison,
  comparison:item.comparison||null};
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
 if(!item)return;
 debateEl.hidden=true;buddyDebateActive=true;quoteEl.hidden=true;
 textEl.textContent=localizePlanText(window.liAddressLine?window.liAddressLine(item.reply):item.reply);
 document.getElementById("li-native-buddy-compare-method")?.remove();
 if(item.comparison){
  const target=methods.find(method=>method[0]===item.comparison.to);
  if(target){
   const link=document.createElement("button");
   link.id="li-native-buddy-compare-method";link.type="button";link.className="action alt";
   link.textContent=inEnglish()?"Open "+target[0]+" · "+methodDisplayName(target):
    "Mở "+target[0]+" · "+methodDisplayName(target);
   link.addEventListener("click",()=>{closeModal("buddy-modal");showMethod(target[0]);},{once:true});
   scrollEl.append(link);
  }
 }
 scrollEl.scrollTop=0;
 if(typeof item.perform==="function")item.perform();
},true);
window.liGetBuddyPlan=getBuddyPlan; // deterministic UI test hook; does not read or send personal notes.
})();
