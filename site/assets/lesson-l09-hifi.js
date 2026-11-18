/* L09-1-2 in native li. Hi-Fi route/components; editorial Wave1A only. */
(()=>{
"use strict";
const root=document.getElementById("page-lessonL09");
if(!root)return;
const KEY="li.review.L09-1-2.v1";
const SOURCES=[
{title:"NIST — Populations and Sampling",url:"https://www.itl.nist.gov/div898/handbook/ppc/section1/ppc134.htm",tier:"core"},
{title:"CDC — CASPER Sampling Methodology",url:"https://www.cdc.gov/casper/php/overview/sampling-methodology.html",tier:"core"},
{title:"CDC — Analyze and Report CASPER Data",url:"https://www.cdc.gov/casper/php/overview/analyze-and-report-casper-data.html",tier:"deep"},
{title:"OpenStax — Data, Sampling and Variation",url:"https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling",tier:"intro"}
];
const QUERIES=["sampling bias vs random sampling variation","selection bias survey example","nonresponse bias statistics","site:cdc.gov CASPER sampling methodology","site:openstax.org sampling variation"];
const T={
vi:{
title:"Sampling Bias · Sai lệch chọn mẫu",intro:"Một ngàn người trả lời. Có chắc kết luận nói được về tất cả mọi người?",
status:"Wave 1A · Bài đã duyệt nội dung, đang kiểm thử",back:"Về Tàng Thư",goalsTitle:"Mục tiêu bài học",goalLabel:"I · CHỦ ĐÍCH",goals:[
"Xác định tổng thể mục tiêu và nhóm thực sự tham gia khảo sát.",
"Giải thích một cơ chế làm mẫu bị lệch theo cách tuyển người hoặc phản hồi.",
"Phân biệt selection bias với random sampling variation.",
"Viết lại kết luận để không suy rộng quá những gì dữ liệu hỗ trợ."],
theoryKicker:"II · HIỂU ĐIỀU CỐT LÕI",theoryTitle:"1.000 câu trả lời có đủ tin chưa?",
theoryLead:"Giả sử một cộng đồng yêu chạy bộ khảo sát 1.000 thành viên. 82% nói họ chạy ít nhất ba buổi mỗi tuần. Bài đăng kết luận: “82% người trưởng thành tại Việt Nam chạy thường xuyên.” Phép tính có thể đúng, nhưng <b>người được hỏi không đại diện cho mọi người trưởng thành.</b>",
stats:["thành viên hội chạy bộ","trả lời chạy ≥3 buổi/tuần","có suy ra toàn dân?"],
defs:[
"<b>Tổng thể mục tiêu (target population):</b> tất cả người trưởng thành tại Việt Nam — nhóm mà kết luận muốn nhắm tới.",
"<b>Mẫu quan sát (sample):</b> những người trong cộng đồng chạy bộ thực sự trả lời.",
"<b>Cơ chế chọn mẫu:</b> người ngoài cộng đồng không được tiếp cận; người hứng thú chạy có thể còn dễ phản hồi hơn."],
biasTitle:"Sampling bias · Sai lệch chọn mẫu",biasText:"Một số nhóm có cơ hội được chọn hoặc phản hồi khác hẳn nhóm khác theo cách liên quan kết quả đang đo. Mẫu lớn không tự đưa những người bị loại khỏi khung khảo sát trở lại.",
variationTitle:"Random sampling variation · Biến động ngẫu nhiên",variationText:"Ngay cả hai mẫu được rút độc lập theo một thiết kế xác suất phù hợp vẫn có thể cho tỷ lệ khác nhau do tình cờ. Mẫu lớn có thể giảm bất định ngẫu nhiên, nhưng không tự sửa selection bias.",
limit:"<b>Trước khi tin một con số:</b> Kết luận muốn nói về ai? Ai có cơ hội vào mẫu? Nhóm nào vắng mặt? Kết luận có vượt quá dữ liệu không? Mẫu không xác suất có thể hữu ích để khám phá giả thuyết, nhưng không tự trở thành ước lượng dân số.",
figKicker:"III · NHÌN BẰNG HÌNH",figTitle:"Thử nhìn xem mẫu đại diện cho ai",
fig1:"Rút mẫu ngẫu nhiên đơn",fig1Note:"Minh họa phương pháp rút mẫu có xác suất. Không bảo đảm không còn sai lệch không phản hồi hay lỗi khung mẫu.",
fig2:"Bias và nhiễu ngẫu nhiên (phép ví von)",fig2Note:"Hình bia bắn minh họa statistical bias/noise nói chung, không phải riêng cơ chế sai lệch chọn mẫu.",
missingImg:"Nếu ảnh chưa tải, mở hình gốc và xem giấy phép.",
exKicker:"IV · THỬ TỰ GIẢI THÍCH",exTitle:"400/500 người thích nhắc học hằng ngày?",
exBody:"Một app học tập khảo sát trong nhóm Facebook của những người học rất tích cực. Có 400 trên 500 người trả lời thích thông báo nhắc học. Một PM muốn viết: “80% người dùng tương lai đều thích notification mỗi ngày.”",
exQuestion:"<b>Tự hỏi:</b> Kết luận đã nhảy từ nhóm nào sang nhóm nào? Kể cả khi lấy mẫu xác suất đúng tổng thể, vẫn còn rủi ro gì?",
exHelp:"Người trả lời trong một hội học tập tích cực không tương đương toàn bộ người dùng tương lai. Tuyển đúng khung mẫu tốt hơn vẫn phải kiểm tra nonresponse và cách hỏi.",
exShow:"Xem gợi ý phân tích",exHide:"Ẩn gợi ý phân tích",guidedLabel:"Thử giải thích bằng lời của bạn",guidedPlaceholder:"Mẫu này có đại diện cho người dùng tương lai không? Vì sao?",guidedSaveNote:"Ý tự giải thích được lưu trên thiết bị. Phần này không tính điểm.",
challengeKicker:"V · THỬ SỨC ĐỘC LẬP",challengeTitle:"Khảo sát banner trong ứng dụng tài chính",
caseText:"Một app tài chính chỉ hiển thị banner khảo sát cho người mở app ít nhất <b>5 lần mỗi tuần</b>. Có <b>1.200</b> người trả lời; <b>78%</b> nhận xét tính năng mới là <b>hữu ích</b>.",
caseClaim:"Nhóm sản phẩm định kết luận: “78% tất cả khách hàng hài lòng với tính năng này.”",
questions:[
"Nhóm sản phẩm muốn suy ra về ai? Mẫu thực sự đã được khảo sát là ai?",
"Nêu một cơ chế cụ thể gây sai lệch chọn mẫu trong tình huống này.",
"Viết lại kết luận để vừa hữu ích vừa không vượt quá dữ liệu. “Hữu ích” có đồng nghĩa “hài lòng” không?",
"Đề xuất một cách thu thập bằng chứng tốt hơn và ít nhất một giới hạn vẫn còn."],
placeholder:"Viết câu trả lời của bạn...",hintButton:"Gợi ý một chút",hint:"Hãy tách <b>người được thấy banner</b>, <b>người đã trả lời</b>, <b>khái niệm được đo</b> và <b>khách hàng bị bỏ sót</b>. Gợi ý này không tiết lộ đáp án.",
assisted:"Lượt này có hỗ trợ; phân biệt với lượt tự làm.",
saveHint:"Tự lưu câu trả lời trên thiết bị này. Đổi ngôn ngữ không tạo một bài mới.",
submit:"Nộp lượt làm bài",clear:"Xóa bản nháp",
submitNeed:"Cần trả lời cả bốn câu bằng ý có nghĩa trước khi nộp.",submitSuccess:"Đã ghi nhận lượt trả lời; hãy mở đáp án để tự đối chiếu.",submitLocked:"Đã nộp lượt thử. Câu trả lời được khóa để giữ bằng chứng học.",
answerTitle:"ĐÁP ÁN THAM KHẢO · MỞ SAU KHI NỘP",
answer:"<b>1.</b> Tổng thể mục tiêu là mọi khách hàng; mẫu quan sát là 1.200 người dùng app thường xuyên đã thấy banner và tự trả lời.<br><b>2.</b> Người ít mở app không thấy khảo sát; người mở thường xuyên có thể có trải nghiệm khác.<br><b>3.</b> “Trong số 1.200 người dùng thường xuyên tham gia khảo sát, 78% cho biết tính năng hữu ích.” Chưa có cơ sở suy ra mọi khách hàng hoặc đổi “hữu ích” thành “hài lòng”.<br><b>4.</b> Tuyển người từ khung khách hàng mục tiêu với đủ nhóm mức sử dụng; vẫn cần xét người không trả lời và sai lệch đo lường.",
answerCaution:"<b>Đừng nhầm:</b> n=1.200 không sửa sai lệch chọn mẫu; random sampling không loại bỏ được mọi vấn đề đo lường hoặc nonresponse.",
rubricKicker:"VI · ĐỐI CHIẾU",rubricTitle:"Tự chấm bằng tiêu chí rõ ràng",
rubricLead:"Đây là rubric 0–8 để tự đánh giá; chưa phải chấm tự động, thang điểm chưa hiệu chuẩn và không phải chứng nhận năng lực.",
rubricBefore:"Nộp bài trước để xem rubric và đáp án; không mở đáp án khi chưa có lượt thử.",
rubricItems:[
["Tổng thể & mẫu","2 = xác định đúng cả hai; 1 = mới đúng một phần; 0 = sai hoặc thiếu."],
["Cơ chế sai lệch","2 = nêu cơ chế cụ thể; 1 = chỉ nói chung là bias; 0 = không chỉ ra."],
["Kết luận có căn cứ","2 = không đổi đối tượng và điều đo; 1 = giới hạn mơ hồ; 0 = vẫn suy rộng."],
["Bằng chứng tốt hơn","2 = cải tiến hợp lý và nêu rủi ro còn lại; 1 = thiếu một vế; 0 = chỉ đề nghị tăng n."]],
scoreOptions:["Chưa chấm","0 · Chưa đạt","1 · Một phần","2 · Đầy đủ"],scoreLabel:"Tổng điểm tự đánh giá",saveReview:"Lưu đánh giá & hoàn tất",reviewNeed:"Hãy đánh giá đủ bốn tiêu chí trước khi hoàn thành.",reviewDone:"Đã hoàn thành một lượt tự đánh giá. Đây chưa phải xác nhận đã thành thạo.",
sourcesKicker:"VII · ĐÀO SÂU",sourcesTitle:"Đọc thêm từ nguồn chính",sourcesLead:"Nguồn để đối chiếu, không phải nội dung đã được ChatGPT tự đọc. Bạn có thể mở trực tiếp hoặc copy prompt để nhờ tóm tắt.",
openSource:"Mở nguồn",copySource:"Copy prompt",tiers:{core:"Nguồn chính",deep:"Đọc chuyên sâu",intro:"Đọc nhập môn"},queriesTitle:"Gợi ý tìm kiếm",allPrompt:"Copy prompt đối chiếu 4 nguồn",openChat:"Mở ChatGPT",
sourceNote:"Nếu ChatGPT không đọc được URL, hãy dán đoạn tài liệu bạn có quyền chia sẻ. Không tự nhận là đã đọc khi chưa truy cập được.",
sidebarTitle:"LỘ TRÌNH BÀI HỌC",sidebarProgressBefore:"Chưa hoàn tất lượt tự đánh giá",sidebarProgressAfter:"Đã hoàn tất 1 lượt tự đánh giá",sidebarLead:"Bài học · Data Science",sidebarLinks:["Mục tiêu","Khái niệm","Hình minh họa","Ví dụ","Bài tập","Rubric","Nguồn đọc"],sidebarExtra:"Đang sử dụng giao diện Hi-Fi của li.; bản thân bài vẫn trong vòng kiểm thử học thuật.",
sidebarMethods:"Xem Thần Chú",sidebarCatalog:"Về Tàng Thư",resumeLabel:"Mở tiếp bài Sampling Bias",resumeDone:"Đã tự đánh giá · Xem lại bài",
copied:"Đã sao chép prompt.",copyFailed:"Không sao chép được; kiểm tra quyền truy cập clipboard.",resetConfirm:"Xóa bốn câu trả lời chưa nộp? Lượt đã nộp sẽ không bị xóa.",storageOff:"Không thể lưu trên thiết bị; hãy sao chép nội dung trước khi thoát."
},
en:{
title:"Sampling Bias versus Random Sampling Variation",intro:"A thousand survey responses. Can we really generalize to everyone?",
status:"Wave 1A · Content approved, QA in progress",back:"Back to Catalog",goalsTitle:"Learning objectives",goalLabel:"I · OBJECTIVES",
goals:["Identify the target population and the observed sample.","Explain a recruitment or response mechanism linked to selection bias.","Distinguish selection bias from random sampling variation.","Rewrite a claim to stay within the observed evidence."],
theoryKicker:"II · CORE EXPLANATION",theoryTitle:"1,000 responses. Is that enough?",
theoryLead:"A community of running enthusiasts surveys 1,000 members. Of respondents, 82% say they run at least three times per week. A post concludes: “82% of adults in Vietnam run regularly.” The arithmetic might be fine, but <b>the respondents are not all adults.</b>",
stats:["running-community respondents","report running ≥3 times/week","represent all adults?"],
defs:["<b>Target population:</b> all adults in Vietnam — the people the public conclusion claims to describe.","<b>Observed sample:</b> the running-community members who actually responded.","<b>Selection mechanism:</b> outsiders were not reached, and running enthusiasts may be especially likely to participate."],
biasTitle:"Sampling bias · Systematic selection",biasText:"Recruitment, sampling or responding can favor certain groups in a way related to the outcome. A larger sample does not automatically bring excluded people into the sampling frame.",
variationTitle:"Random sampling variation",variationText:"Two independent probability samples following the same appropriate design may produce different estimates by chance. A larger sample can reduce random sampling uncertainty under suitable assumptions, but not automatically repair selection bias.",
limit:"<b>Three checks:</b> Who is the claim about? Who had a chance to respond? Does the conclusion generalize beyond the observed group? Nonprobability sampling can still help explore hypotheses, but it is not automatically a population estimate.",
figKicker:"III · VISUAL EXPLANATION",figTitle:"Look at who enters the sample",
fig1:"Selecting a simple random sample",fig1Note:"Shows a probability-based selection method, not a guarantee against coverage or nonresponse bias.",
fig2:"Statistical bias versus random noise (analogy)",fig2Note:"A target-chart analogy for statistical bias/noise in general, not a direct illustration of sampling bias mechanisms.",
missingImg:"If the picture fails to load, open its original file page and license.",
exKicker:"IV · GUIDED SELF-EXPLANATION",exTitle:"400/500 favor reminders. Is that 80% of all future users?",
exBody:"An education app surveys a Facebook group of highly engaged learners. Of 500 respondents, 400 favor daily notifications. A PM writes: “80% of all future users want reminders every day.”",
exQuestion:"<b>Ask yourself:</b> From which observed group to which intended population has the claim jumped? Even with suitable probability sampling, what else could introduce bias?",
exHelp:"Respondents from a highly engaged group are not all future users. Better recruitment still needs checks for nonresponse and question wording.",
exShow:"Show the guided hint",exHide:"Hide guided hint",guidedLabel:"Explain it in your own words",guidedPlaceholder:"Does this sample represent future app users? Why or why not?",guidedSaveNote:"Your guided explanation is saved on this device. This part is unscored.",
challengeKicker:"V · INDEPENDENT CHALLENGE",challengeTitle:"Finance-app banner survey",
caseText:"A finance app shows a survey banner <b>only to people who open it at least 5 times a week</b>. There are <b>1,200 respondents</b>; <b>78%</b> say a new feature is <b>useful</b>.",
caseClaim:"The team plans to announce: “78% of all customers are satisfied with the feature.”",
questions:["Identify the intended target population and the observed sample.","Give one specific selection mechanism that could distort the result.","Rewrite the claim without exceeding the evidence. Is “useful” the same as “satisfied”?","Suggest an improvement in evidence collection and at least one remaining limitation."],
placeholder:"Write your answer...",hintButton:"Show a hint",hint:"Separate <b>who could see the banner</b>, <b>who responded</b>, <b>what was measured</b> and <b>who was missing</b>. This is guidance, not a model answer.",
assisted:"Assisted attempt; distinct from an unaided attempt.",saveHint:"Your response stays on this device. Switching VI/EN does not create a separate lesson.",
submit:"Submit your attempt",clear:"Clear draft",
submitNeed:"Please answer all four questions meaningfully before submitting.",submitSuccess:"Your attempt is saved. Open the model response to self-review.",submitLocked:"An attempt has been submitted; responses are now locked as learning evidence.",
answerTitle:"MODEL RESPONSE · REVEALED AFTER SUBMISSION",
answer:"<b>1.</b> The target is all customers; the observed sample is the 1,200 frequent app users who saw and responded to the banner.<br><b>2.</b> Infrequent users could not see the survey; highly active users may have different experiences.<br><b>3.</b> “Among 1,200 frequent app users who responded, 78% said the feature was useful.” This cannot imply all customers or replace “useful” with “satisfied.”<br><b>4.</b> Recruit from a suitable customer frame spanning usage levels; still investigate nonresponse and measurement validity.",
answerCaution:"<b>Avoid:</b> assuming n=1,200 fixes selection bias or probability sampling eliminates all measurement/nonresponse problems.",
rubricKicker:"VI · SELF-REVIEW",rubricTitle:"Assess your reasoning, not your eloquence",
rubricLead:"This 0–8 guide is uncalibrated self-assessment, not automatic grading, mastery certification or a professional credential.",
rubricBefore:"Submit an attempt to unlock the reference answer and rubric.",
rubricItems:[["Population & sample","2 = accurately identifies both; 1 = partial; 0 = missing/confused."],["Selection mechanism","2 = concrete mechanism; 1 = says 'biased' vaguely; 0 = none."],["Defensible claim","2 = correct scope and measured construct; 1 = vague limits; 0 = unsupported generalization."],["Better evidence","2 = suitable improvement and its limits; 1 = one only; 0 = 'increase n' without logic."]],
scoreOptions:["Not assessed","0 · Missing","1 · Partial","2 · Strong"],scoreLabel:"Your self-rating",saveReview:"Save self-review & complete",reviewNeed:"Choose a rating for all four criteria.",reviewDone:"One self-review is complete; mastery has not been certified.",
sourcesKicker:"VII · LEARN MORE",sourcesTitle:"Read from primary references",sourcesLead:"These are reading links, not content already read by ChatGPT. Open a source directly or copy a contextual summary prompt.",
openSource:"Open source",copySource:"Copy prompt",tiers:{core:"Core reference",deep:"Further reading",intro:"Introduction"},queriesTitle:"Suggested searches",allPrompt:"Copy cross-source prompt",openChat:"Open ChatGPT",
sourceNote:"If ChatGPT cannot access a URL, paste material you have rights to share. Do not claim an unread source was accessed.",
sidebarTitle:"YOUR LEARNING PATH",sidebarProgressBefore:"No completed review yet",sidebarProgressAfter:"One self-review completed",sidebarLead:"Data Science lesson",sidebarLinks:["Objectives","Core ideas","Illustrations","Example","Challenge","Rubric","Sources"],sidebarExtra:"Displayed within the existing li. Hi-Fi design; the lesson remains subject to academic QA.",
sidebarMethods:"View study methods",sidebarCatalog:"Back to Catalog",resumeLabel:"Continue Sampling Bias",resumeDone:"Reviewed · Return to lesson",
copied:"Prompt copied.",copyFailed:"Clipboard unavailable. Check permissions.",resetConfirm:"Clear unsubmitted answers? Past submissions stay saved.",storageOff:"Local storage is unavailable. Copy your answers before leaving."
}
};
const $=id=>document.getElementById("l09-"+id);
function initial(){return {locale:"vi",draft:["","","",""],guidedDraft:"",hint:false,assisted:false,submitted:false,submittedAt:null,submission:null,submissionLocale:null,ratings:[null,null,null,null],reviewed:false};}
let state=initial();let storageAvailable=true;
try{const v=JSON.parse(localStorage.getItem(KEY)||"null");if(v&&typeof v==="object"){
state={...state,...v};
if(!Array.isArray(state.draft)||state.draft.length!==4)state.draft=["","","",""];
if(!Array.isArray(state.ratings)||state.ratings.length!==4)state.ratings=[null,null,null,null];
if(!["vi","en"].includes(state.locale))state.locale="vi";
if(typeof state.guidedDraft!=="string")state.guidedDraft="";
}}catch(e){}
// Global Settings language supersedes any saved per-lesson locale.
if(["vi","en"].includes(window.liLanguage?.get?.()))state.locale=window.liLanguage.get();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){storageAvailable=false;return false;}}
function sText(id,s){const el=$(id);if(el)el.textContent=s;}
function sHtml(id,s){const el=$(id);if(el)el.innerHTML=s;}
function toast(message){
 // Use the real Hi-Fi feedback component, not a second lesson-only toast design.
 if(typeof window.toast==="function"){window.toast(message);return;}
 const b=$("live");if(!b)return;
 b.textContent=message;b.hidden=false;clearTimeout(toast.timer);
 toast.timer=setTimeout(()=>{b.hidden=true;},3200);
}
function updateResume(){const el=$("resume");if(el)el.textContent=T[state.locale][state.reviewed?"resumeDone":"resumeLabel"];
 const ext=document.getElementById("li-l09-resume-status");
 if(ext)ext.textContent=state.reviewed?"Đã tự đánh giá · 1 lượt":state.submitted?"Đã nộp · Chưa tự chấm":"Bài học VI/EN · Đang học";
}
function promptFor(source){
const start=state.locale==="vi"?
"Tôi đang học bài L09-1-2 của li. (理): Sampling Bias vs Random Sampling Variation. Mục tiêu: phân biệt sai lệch chọn mẫu với biến động ngẫu nhiên; không suy rộng hơn dữ liệu.\nNguồn:\n":
"I am studying li. (理) lesson L09-1-2: Sampling Bias versus Random Sampling Variation. Focus on sampling mechanisms, chance variation and evidence-based inference.\nSources:\n";
const list=(source?[source]:SOURCES).map(x=>"- "+x.title+": "+x.url).join("\n");
const end=state.locale==="vi"?
"\n\nHãy chỉ tóm tắt những gì bạn thực sự truy cập được. Nếu link bị chặn, không có toàn văn hoặc không đọc được, hãy nói rõ và nhờ tôi dán phần liên quan; không bịa nội dung/trích dẫn. Trả lời bằng tiếng Việt: 1) 5 ý chính, 2) target population, sample, selection bias, nonresponse và random sampling variation, 3) điều nguồn nói và phần suy luận riêng, 4) ví dụ khảo sát qua banner và giới hạn kết luận, 5) giả định/điểm cần kiểm chứng, 6) 3 câu active recall không hiện đáp án. Kèm đúng URL cho từng nhận định được nguồn hỗ trợ.":
"\n\nSummarize only what you actually access. If a page is blocked or you lack the full text, say so and ask me to paste relevant material; do not fabricate citations. In English give: (1) five main points, (2) target population, sample, selection bias, nonresponse and random sampling variation, (3) what each source establishes versus your inference, (4) a banner-survey case and inference limits, (5) assumptions and cautions, (6) three active recall questions without showing answers. Cite actual accessed source URLs.";
return start+list+end;
}
async function copyPrompt(src){
try{
 const text=promptFor(src);
 if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
 else{
  const t=document.createElement("textarea");t.value=text;t.setAttribute("readonly","");
  t.style.cssText="position:fixed;left:-1000px;opacity:0";document.body.appendChild(t);t.select();
  const ok=document.execCommand("copy");t.remove();if(!ok)throw Error("clipboard");
 }
 toast(T[state.locale].copied);
}catch(e){toast(T[state.locale].copyFailed);}
}
function render(){
 const L=T[state.locale];root.setAttribute("lang",state.locale);
 ["vi","en"].forEach(k=>{const b=$(k);b.setAttribute("aria-pressed",String(k===state.locale));});
 for(const id of ["title","intro","status","goalsTitle","goalLabel","theoryKicker","theoryTitle","biasTitle","variationTitle",
 "figKicker","figTitle","fig1","fig1Note","fig2","fig2Note","exKicker","exTitle","exBody","exShow","challengeKicker","challengeTitle",
 "hintButton","saveHint","submit","clear","rubricKicker","rubricTitle","rubricLead","rubricBefore","scoreLabel",
 "saveReview","answerTitle","sourcesKicker","sourcesTitle","sourcesLead","queriesTitle","allPrompt","openChat","sourceNote",
 "sidebarTitle","sidebarLead","sidebarExtra","sidebarMethods","sidebarCatalog","back"]){
  sText(id,L[id]);
 }
 sHtml("theoryLead",L.theoryLead);sHtml("limit",L.limit);sHtml("exQuestion",L.exQuestion);
 sHtml("guidedHint",L.exHelp);
 sText("guidedLabel",L.guidedLabel);
 sText("guidedSaveNote",L.guidedSaveNote);
 $("guidedDraft").placeholder=L.guidedPlaceholder;
 $("guidedDraft").value=state.guidedDraft;
 sHtml("caseText",L.caseText);sText("caseClaim",L.caseClaim);sHtml("hint",L.hint);
 sHtml("answer",L.answer);sHtml("answerCaution",L.answerCaution);
 $("stats").querySelectorAll(".l09-stat-desc").forEach((e,i)=>e.textContent=L.stats[i]);
 $("goals").querySelector("ul").replaceChildren(...L.goals.map(v=>{const e=document.createElement("li");e.textContent=v;return e;}));
 $("defs").replaceChildren(...L.defs.map(v=>{const e=document.createElement("li");e.innerHTML=v;return e;}));
 sText("biasText",L.biasText);sText("variationText",L.variationText);
 $("imgOne").alt=L.fig1+". "+L.fig1Note;
 $("imgTwo").alt=L.fig2+". "+L.fig2Note;
 const task=$("questions");task.replaceChildren();
 L.questions.forEach((q,i)=>{
  const div=document.createElement("div");div.className="l09-q-row";
  const label=document.createElement("label");label.htmlFor="l09-question-"+i;label.textContent=(i+1)+". "+q;
  const a=document.createElement("textarea");a.id="l09-question-"+i;a.className="text-editor";a.rows=4;
  a.placeholder=L.placeholder;a.value=state.draft[i]||"";a.disabled=!!state.submitted;
  a.addEventListener("input",()=>{if(state.submitted)return;state.draft[i]=a.value;persist();});
  div.append(label,a);task.appendChild(div);
 });
 $("hint").hidden=!state.hint;
 sText("assistStatus",state.hint?L.assisted:"");
 $("hintButton").hidden=!!state.submitted;
 $("submit").hidden=!!state.submitted;$("clear").hidden=!!state.submitted;
 $("answerBox").hidden=!state.submitted;
 $("rubricGate").hidden=!!state.submitted;
 $("rubricArea").hidden=!state.submitted;
 sText("submissionStatus",state.reviewed?L.reviewDone:state.submitted?L.submitLocked:(!storageAvailable?L.storageOff:""));
 const rows=$("rubricRows");rows.replaceChildren();
 if(state.submitted){
  L.rubricItems.forEach((row,i)=>{
   const container=document.createElement("div");container.className="l09-review-row path-item";
   const label=document.createElement("label");label.htmlFor="l09-rating-"+i;
   const strong=document.createElement("b");strong.textContent=row[0];label.append(strong,document.createElement("br"),document.createTextNode(row[1]));
   const select=document.createElement("select");select.id="l09-rating-"+i;select.disabled=!!state.reviewed;
   L.scoreOptions.forEach((opt,j)=>{const o=document.createElement("option");o.value=j===0?"":String(j-1);o.textContent=opt;select.appendChild(o);});
   select.value=state.ratings[i]===null?"":String(state.ratings[i]);
   select.onchange=()=>{state.ratings[i]=select.value===""?null:Number(select.value);persist();updateScore();};
   container.append(label,select);rows.appendChild(container);
  });
 }
 $("saveReview").hidden=!!state.reviewed;
 $("guidedHint").hidden=!$("guidedHint").dataset.open;
 sText("guidedToggle",$("guidedHint").hidden?L.exShow:L.exHide);
 $("guidedToggle").setAttribute("aria-expanded",String(!$("guidedHint").hidden)); 
 const stage=state.reviewed?1:0;
 sText("progress",stage?L.sidebarProgressAfter:L.sidebarProgressBefore);
 $("progressBar").setAttribute("aria-valuenow",String(stage));
 $("progressFill").style.width=stage?"100%":"0%";
 $("index").replaceChildren(...["goals","concept","illustrations","guided","challenge","rubric","sources"].map((id,i)=>{
  const a=document.createElement("a");a.href="#l09-"+id;a.textContent=String(i+1).padStart(2,"0")+" · "+L.sidebarLinks[i];return a;
 }));
 const src=$("sourcesList");src.replaceChildren();
 SOURCES.forEach(s=>{
  const row=document.createElement("div");row.className="l09-source path-item";
  const title=document.createElement("div");
  const b=document.createElement("b");b.textContent=s.title;
  const hint=document.createElement("p");hint.className="small";hint.textContent=L.tiers[s.tier];title.append(b,hint);
  const actions=document.createElement("div");actions.className="l09-source-actions";
  const a=document.createElement("a");a.className="action alt";a.href=s.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=L.openSource;
  const copy=document.createElement("button");copy.className="action";copy.type="button";copy.textContent=L.copySource;
  copy.setAttribute("aria-label",L.copySource+": "+s.title);copy.onclick=()=>copyPrompt(s);
  actions.append(a,copy);row.append(title,actions);src.appendChild(row);
 });
 const chips=$("queries");chips.replaceChildren(...QUERIES.map(q=>{
  const a=document.createElement("a");a.href="https://www.google.com/search?q="+encodeURIComponent(q);
  a.target="_blank";a.rel="noopener noreferrer";a.textContent=q;return a;
 }));
 updateScore();updateResume();
}
function updateScore(){
 const sum=state.ratings.every(x=>x!==null)?state.ratings.reduce((a,b)=>a+b,0):null;
 sText("score",sum===null?"— / 8":sum+" / 8");
}
function changeLocale(locale){
 if(typeof window.liLanguage?.set==="function"){window.liLanguage.set(locale);return;}
 if(locale===state.locale)return;state.locale=locale;persist();render();
}
window.addEventListener("li:localechange",event=>{
 const next=event.detail?.locale;
 if(!["vi","en"].includes(next)||next===state.locale)return;
 state.locale=next;persist();render();
});
$("vi").addEventListener("click",()=>changeLocale("vi"));
$("en").addEventListener("click",()=>changeLocale("en"));
$("guidedDraft").addEventListener("input",()=>{
 state.guidedDraft=$("guidedDraft").value;
 persist();
});
$("guidedToggle").addEventListener("click",()=>{
 const h=$("guidedHint");const now=h.hidden;h.hidden=!now;
 if(now)h.dataset.open="1";else delete h.dataset.open;
 sText("guidedToggle",now?T[state.locale].exHide:T[state.locale].exShow);
 $("guidedToggle").setAttribute("aria-expanded",String(now));
});
$("hintButton").addEventListener("click",()=>{
 if(state.submitted)return;state.hint=true;state.assisted=true;persist();
 $("hint").hidden=false;sText("assistStatus",T[state.locale].assisted);
});
$("submit").addEventListener("click",()=>{
 if(state.submitted)return;
 state.draft=Array.from({length:4},(_,i)=>$("question-"+i).value);
 if(state.draft.some(v=>v.trim().length<12)){toast(T[state.locale].submitNeed);return;}
 state.submitted=true;state.submittedAt=new Date().toISOString();state.submission=state.draft.slice();state.submissionLocale=state.locale;
 const recorded=persist();if(recorded)typeof CustomEvent==="function"&&typeof window.dispatchEvent==="function"&&window.dispatchEvent(new CustomEvent("li:lesson-submitted",{detail:{lessonId:"L09-1-2"}}));render();$("answerBox").scrollIntoView({block:"start",behavior:"smooth"});
 toast(T[state.locale].submitSuccess);
});
$("clear").addEventListener("click",()=>{
 if(state.submitted||!window.confirm(T[state.locale].resetConfirm))return;
 state.draft=["","","",""];state.hint=false;state.assisted=false;persist();render();
});
$("saveReview").addEventListener("click",()=>{
 if(!state.submitted||state.reviewed)return;
 if(state.ratings.some(v=>v===null)){toast(T[state.locale].reviewNeed);return;}
 state.reviewed=true;persist();render();toast(T[state.locale].reviewDone);
});
$("allPrompt").addEventListener("click",()=>copyPrompt(null));
[["imgOne","imgFallbackOne"],["imgTwo","imgFallbackTwo"]].forEach(([id,fb])=>{
 $(id).addEventListener("error",()=>{$(id).hidden=true;$(fb).style.display="block";});
});
render();
})();