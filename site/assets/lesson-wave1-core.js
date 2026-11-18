/* Wave1A/1B native Hi-Fi learner logic.
   Canonical editorial texts from Notion L03-1-2 and L15-2-2. UI iteration remains separate.
   This module does not provide auto-grading, paid AI ingestion, or server sync. */
(function(){
"use strict";
const PACK={
"L03-1-2":{
 route:"lessonL03",prefix:"l03",subject:"UX Design / User Problems & Research Basics",
 image:{url:"https://upload.wikimedia.org/wikipedia/commons/c/c4/Interview.svg",
 page:"https://commons.wikimedia.org/wiki/File:Interview.svg",
 credit:"Alexander Koenig MA · CC BY-SA 3.0 Germany"},
 sources:[
 {title:"Digital.gov — How to create a user interview checklist",url:"https://digital.gov/resources/how-create-user-interview-checklist",level:"intro"},
 {title:"Digital.gov — How to conduct an interview",url:"https://digital.gov/resources/how-conduct-interview",level:"core"},
 {title:"GOV.UK Service Manual — Using in-depth interviews",url:"https://www.gov.uk/service-manual/user-research/using-in-depth-interviews",level:"core"},
 {title:"Nielsen Norman Group — User Interviews 101",url:"https://www.nngroup.com/articles/user-interviews/",level:"deep"}],
 queries:["leading questions in user interviews","open ended vs neutral UX questions","site:gov.uk/service-manual/user-research in depth interviews","site:digital.gov interview checklist"],
 vi:{
 title:"Câu hỏi mở & thiên lệch phỏng vấn",intro:"Một câu hỏi mở vẫn có thể gài sẵn câu trả lời. Hỏi sao để nghe được chuyện thực?",
 goalsKicker:"I · MỤC TIÊU",goalsTitle:"Hỏi đúng trước khi vội kết luận",
 goals:["Phân biệt câu hỏi mở với câu hỏi trung lập.","Nhận ra lời khen, đánh giá hoặc giả định được cài sẵn trong câu hỏi.","Viết lại câu hỏi để người tham gia kể một tình huống thực tế.","Không tự suy rộng từ vài cuộc phỏng vấn định tính sang tỷ lệ người dùng."],
 conceptKicker:"II · HIỂU BẢN CHẤT",conceptTitle:"“Tiện hơn nhiều, đúng không?” — chưa hỏi đã tự trả lời",
 conceptText:"Bạn thiết kế Bút Ký cho app học tập rồi hỏi người dùng: <b>“Tính năng lưu ghi chú mới tiện hơn nhiều, đúng không?”</b> Câu này cung cấp sẵn lời khen và gợi rằng đồng ý là đáp án mong đợi. Người được hỏi có thể thuận theo vì lịch sự, chứ chưa kể trải nghiệm thật.",
 conceptList:[
 "<b>Câu hỏi đóng:</b> giới hạn câu trả lời; hữu ích khi xác nhận chi tiết, nhưng dễ bỏ lỡ diễn biến thật nếu dùng quá sớm.",
 "<b>Câu hỏi mở:</b> cho phép kể tình huống và hành động; tuy vậy, “Tại sao giao diện này khó dùng?” vẫn ngầm khẳng định nó khó dùng.",
 "<b>Câu hỏi trung lập:</b> tránh gài đánh giá hoặc mặc định người tham gia gặp lỗi. Hỏi về lần dùng thật trước, diễn giải sau."],
 compareTitle1:"Dẫn dắt · Leading",compareText1:"“Nút lưu mới đẹp và dễ thấy hơn, phải không?” — đưa sẵn đánh giá và gây áp lực đồng ý.",
 compareTitle2:"Trung lập · Neutral",compareText2:"“Lần gần nhất bạn muốn lưu điều vừa học, bạn đã làm gì?” — để người dùng kể lại hành vi.",
 conceptNote:"<b>Đừng nhầm:</b> Một câu hỏi bỏ “đúng không?” chưa chắc trung lập. Giả định có thể nằm trong chính cách mô tả tình huống. Lời người tham gia, điều quan sát, và suy luận của người nghiên cứu là ba loại bằng chứng khác nhau.",
 visualKicker:"III · MINH HOẠ",visualTitle:"Một cuộc phỏng vấn — nơi câu chữ quyết định chất lượng dữ liệu",
 visualCaption:"Bối cảnh phỏng vấn",visualNote:"Hình chỉ minh hoạ tình huống hai người trao đổi; không chứng minh câu hỏi nào là trung lập. Xem cặp ví dụ phía trên để phân tích bias.",
 guidedKicker:"IV · THỬ PHÂN TÍCH",guidedTitle:"Từ hỏi ý kiến sang hỏi hành vi",
 guidedText:"Hãy xem lời đề nghị phỏng vấn ban đầu: <b>“Tính năng mới tiện hơn nhiều, đúng không?”</b> So với câu <b>“Bạn kể lại lần gần nhất muốn lưu điều vừa học. Khi đó bạn làm gì?”</b>",
 guidedQuestion:"<b>Tự giải thích:</b> Câu nào đang gài sẵn đánh giá? Vì sao câu còn lại có khả năng thu được câu chuyện thực tế hơn?",
 guidedLabel:"Giải thích bằng lời của bạn",guidedPlaceholder:"Phân tích giả định và loại bằng chứng sẽ thu được...",guidedSave:"Phần giải thích này được lưu cục bộ, không tính điểm.",
 guidedShow:"Xem gợi ý phân tích",guidedHide:"Ẩn gợi ý phân tích",
 guidedHint:"Câu đầu có cụm <b>“tiện hơn nhiều”</b> và lời mời xác nhận. Câu thứ hai hướng người dùng tới một sự kiện cụ thể; vẫn có thể dùng follow-up trung lập như “Điều gì xảy ra tiếp theo?”",
 challengeKicker:"V · BÀI TẬP ĐỘC LẬP",challengeTitle:"Nghiên cứu Process Monitor",
 challengeText:"Một nhóm UX muốn hiểu vì sao nhân viên ít sử dụng màn Process Monitor. Người phỏng vấn định hỏi:",
 challengeClaim:"1. “Dashboard của chúng tôi đủ trực quan rồi, sao bạn vẫn không dùng?”<br>2. “Bạn thấy bộ lọc quốc gia mới rất hữu ích đúng không?”<br>3. “Tại sao bảng Report hiện tại làm bạn chậm?”",
 questions:[
 "Chọn bất kỳ hai câu trong ba câu trên. Nêu giả định hoặc áp lực dẫn dắt trong từng câu bạn chọn.",
 "Viết lại câu hỏi thứ nhất bạn chọn thành câu hỏi trung lập về tình huống thật.",
 "Viết lại câu hỏi thứ hai bạn chọn; thêm một follow-up trung lập giúp hiểu hành vi.",
 "Nêu điều không được suy diễn chỉ từ ba cuộc phỏng vấn như vậy."],
 placeholder:"Viết câu trả lời của bạn...",
 hintButton:"Nhìn một gợi ý",hint:"Đừng đoán người tham gia thích hay ghét tính năng. Hãy tìm <b>giả định được nói trước</b>, rồi hỏi về <b>lần gần nhất</b> họ thực hiện tác vụ. Chưa có dữ liệu thì đừng suy tỷ lệ toàn tổ chức.",
 assistStatus:"Lượt có hỗ trợ — không tính là làm độc lập hoàn toàn.",
 saveHint:"Bản nháp lưu trên thiết bị này; đổi VI/EN không tạo thêm lượt mới.",submit:"Nộp lượt trả lời",clear:"Xóa bản nháp",
 needAnswers:"Cần trả lời đủ bốn phần bằng ý của bạn trước khi nộp.",
 submittedText:"Đã nộp và khóa câu trả lời. Có thể đối chiếu đáp án và rubric.",
 answerTitle:"ĐÁP ÁN MẪU · SAU LƯỢT THỬ",
 answer:"<b>Cả ba câu đều có định hướng/tiền giả định;</b> chọn bất kỳ hai nếu giải thích đúng. Ví dụ: (1) thay bằng “Lần gần nhất cần kiểm tra một process, bạn dùng công cụ nào và đi qua các bước nào?”; (2) thay bằng “Khi cần xem dữ liệu theo quốc gia, bạn tìm hoặc lọc thông tin như thế nào?”; (3) thay bằng “Khi tra Report gần đây, có bước nào mất nhiều thời gian không? Kể lại giúp tôi.” Follow-up trung lập: “Điều gì xảy ra tiếp theo?” Ba cuộc phỏng vấn không tự cho biết tỷ lệ phần trăm tất cả người dùng.",
 answerNote:"<b>Chấm theo lập luận:</b> Không nhất thiết trùng câu chữ đáp án. Câu hỏi mở vẫn có thể dẫn dắt, và trích lời một người không tự chứng minh nhận định phổ quát.",
 rubricKicker:"VI · TỰ ĐỐI CHIẾU",rubricTitle:"Rubric tự đánh giá 0–8",
 rubricLead:"Bốn tiêu chí × 0–2 điểm. Đây là bài tự chấm, chưa hiệu chuẩn bằng người học và không phải điểm AI.",
 rubricBefore:"Nộp bài trước để mở rubric và đáp án.",
 rubricItems:[
 ["Nhận diện bias","2: tìm đúng tiền giả định/định hướng; 1: phát hiện chung chung; 0: không phát hiện."],
 ["Viết lại trung lập","2: bỏ tiền giả định và không gợi đáp án; 1: cải thiện nhưng còn dẫn dắt; 0: giữ nguyên bias."],
 ["Khai thác hành vi","2: hỏi sự kiện gần nhất, trình tự và follow-up; 1: hỏi chung; 0: chỉ hỏi ý kiến có hướng."],
 ["Giới hạn suy luận","2: không suy tỷ lệ dân số từ vài phỏng vấn; 1: chỉ nói mẫu nhỏ; 0: suy rộng vô căn cứ."]],
 scoreOptions:["Chưa đánh giá","0 · Chưa đạt","1 · Một phần","2 · Đầy đủ"],
 scoreLabel:"Tổng điểm tự đánh giá",saveReview:"Lưu tự đánh giá & hoàn tất",needRubric:"Chọn điểm cho đủ cả bốn tiêu chí.",reviewDone:"Đã lưu một lượt tự đánh giá. Không đồng nghĩa đã được xác nhận mastery.",
 sourcesKicker:"VII · ĐÀO SÂU",sourcesTitle:"Nguồn đọc thêm về UX interviews",
 sourcesLead:"Đọc đúng nguồn gốc để kiểm chứng khuyến nghị phỏng vấn. Mỗi link có nút copy prompt dành riêng cho tài liệu đó.",
 tiers:{intro:"Hiểu nhanh",core:"Nguồn phương pháp",deep:"Đọc sâu"},
 queriesTitle:"Từ khóa tìm thêm",allPrompt:"Copy prompt tổng hợp",openChat:"Mở ChatGPT ↗",
 sourceNote:"Nếu ChatGPT không thực sự đọc được nguồn, hãy dán đoạn liên quan có quyền chia sẻ. Không bịa trích dẫn.",
 sidebarTitle:"LỘ TRÌNH BÀI HỌC",sidebarLead:"UX Design · Interview Bias",
 progressBefore:"Chưa tự đánh giá",progressDone:"Đã tự đánh giá 1 lượt",
 navLabels:["Mục tiêu","Hiểu bản chất","Hình minh họa","Ví dụ","Bài độc lập","Rubric","Nguồn học"],
 sidebarExtra:"Đã chốt nội dung · UI Hi-Fi tiếp tục được điều chỉnh.",
 back:"Về Tàng Thư",status:"Content đã chốt · QA giao diện mở",guide:"Thần Chú",catalog:"Tàng Thư",
 openSource:"Mở nguồn",copyPrompt:"Copy prompt",copied:"Đã copy prompt.",copyFailed:"Không sao chép được; kiểm tra quyền clipboard.",
 reset:"Xóa bản nháp chưa nộp? Không xóa lượt đã nộp.",storageOff:"Thiết bị không cho phép tự lưu; hãy sao chép câu trả lời trước khi rời trang."},
 en:{
 title:"Open Questions and Interview Bias",intro:"An open-ended question can still steer the answer. Learn to ask about real experiences.",
 goalsKicker:"I · OBJECTIVES",goalsTitle:"What makes a neutral interview?",
 goals:["Distinguish open-ended from neutral interview questions.","Identify praise or unverified assumptions built into a prompt.","Rewrite a question to invite a real past episode.","Avoid claiming population prevalence based only on a few qualitative interviews."],
 conceptKicker:"II · CORE EXPLANATION",conceptTitle:"“Our new feature is much easier, right?”",
 conceptText:"You are designing a note-saving feature and ask: <b>“Our new saving feature is much easier, right?”</b> That question offers a positive judgment before the participant responds. Some interviewees may agree to be polite rather than describe what actually happened.",
 conceptList:["<b>Closed question:</b> often limits the response to yes/no or given choices; useful for confirmation but less exploratory.","<b>Open-ended question:</b> encourages the participant's narrative, but can still be leading: “Why is this interface hard to use?” presupposes difficulty.","<b>Neutral question:</b> avoids untested judgments or assuming everyone had a problem. Ask about a real event before interpreting it."],
 compareTitle1:"Leading question",compareText1:"“The new save button looks nicer and is easier to spot, doesn't it?” — suggests the desired evaluation.",
 compareTitle2:"Neutral question",compareText2:"“Think of the last time you wanted to save something you learned. What did you do?” — invites a concrete account.",
 conceptNote:"<b>Watch out:</b> Removing “right?” does not remove a presupposition. Participant statements, observations and researcher interpretations are different kinds of evidence.",
 visualKicker:"III · VISUAL CONTEXT",visualTitle:"An interview context, not proof of neutrality",
 visualCaption:"An interview situation",visualNote:"This online illustration shows an interview context, not a diagnostic for leading questions. Compare the example wording above.",
 guidedKicker:"IV · GUIDED ANALYSIS",guidedTitle:"From opinions to past actions",
 guidedText:"Compare <b>“Our new feature is much easier, right?”</b> with <b>“Tell me about the last time you wanted to save something you had just learned. What did you do?”</b>",
 guidedQuestion:"<b>Explain:</b> Which question supplies a judgment? Why might the alternative elicit stronger behavioral evidence?",
 guidedLabel:"Explain in your own words",guidedPlaceholder:"Identify the assumptions and the evidence each question could produce...",guidedSave:"Locally saved; this guided explanation is unscored.",
 guidedShow:"Show analysis hint",guidedHide:"Hide analysis hint",
 guidedHint:"The first prompt presupposes the feature is <b>easier</b> and invites agreement. The second asks for a concrete event, followed by neutral probes like “What happened next?”",
 challengeKicker:"V · INDEPENDENT CHALLENGE",challengeTitle:"Process Monitor interviews",
 challengeText:"A UX team wants to know why staff rarely use Process Monitor. The interview guide proposes:",
 challengeClaim:"1. “Our dashboard is already intuitive, so why don't you use it?”<br>2. “You find the new country filter very useful, right?”<br>3. “Why does the current Report table slow you down?”",
 questions:[
 "Select any two of these three questions and identify the assumptions or response pressure in both.",
 "Rewrite your first selected question into a neutral prompt about a real situation.",
 "Rewrite your second selected question and add a neutral behavioral follow-up.",
 "Explain one inference you cannot draw from just three interviews."],
 placeholder:"Write your response...",hintButton:"Show a hint",hint:"Don't assume the user likes or dislikes the tool. First isolate the <b>assumption embedded in the wording</b>; then ask about the <b>last actual task</b>. Do not invent an organization-wide percentage.",
 assistStatus:"Assisted attempt, not fully unaided.",saveHint:"Drafts stay on your device. Switching language does not create another attempt.",submit:"Submit attempt",clear:"Clear draft",
 needAnswers:"Please respond meaningfully to all four parts before submitting.",submittedText:"Attempt submitted and locked. The key and rubric are now available.",
 answerTitle:"MODEL RESPONSE · AFTER FIRST ATTEMPT",
 answer:"<b>All three prompts contain leading assumptions;</b> any two may be selected if explained well. For example: (1) “The last time you needed to check a process, which tool did you use and what steps did you take?”; (2) “When you needed to see data by country, how did you find or filter it?”; (3) “When you recently consulted the Report, did any step take a long time? Tell me about it.” A neutral follow-up is “What happened next?” Three interviews cannot establish the percentage of all organizational users who face the issue.",
 answerNote:"<b>Evaluation:</b> Wording can differ; judge whether the presupposition has been removed and the question invites a real account. Qualitative interview responses do not automatically estimate prevalence.",
 rubricKicker:"VI · SELF-REVIEW",rubricTitle:"Self-rating rubric, 0–8",
 rubricLead:"Four dimensions scored 0–2, not calibrated and not automatically AI-graded.",
 rubricBefore:"Submit an attempt before revealing the rubric and model response.",
 rubricItems:[
 ["Detect leading bias","2: names assumptions and pressures; 1: vague recognition; 0: no relevant detection."],
 ["Neutral rewrite","2: removes presupposition and answer cues; 1: improved but still leading; 0: unchanged bias."],
 ["Behavioral focus","2: past episode, sequence and follow-up; 1: generalized question; 0: guided opinion only."],
 ["Inference boundary","2: no prevalence claim based on three interviews; 1: vague small-sample warning; 0: unjustified generalization."]],
 scoreOptions:["Not rated","0 · Missing","1 · Partial","2 · Complete"],scoreLabel:"Your self-rating",
 saveReview:"Save self-review & complete",needRubric:"Rate all four dimensions first.",reviewDone:"One self-review saved; mastery is not certified.",
 sourcesKicker:"VII · READ FURTHER",sourcesTitle:"Sources for user interviewing",
 sourcesLead:"Open originals to verify the interview techniques. Each reference has its own source-aware Copy prompt.",
 tiers:{intro:"Start here",core:"Core guidance",deep:"Deep dive"},queriesTitle:"Search keywords",
 allPrompt:"Copy cross-source prompt",openChat:"Open ChatGPT ↗",
 sourceNote:"If ChatGPT cannot access a reference, paste material you are permitted to share. Never invent source access.",
 sidebarTitle:"YOUR LEARNING PATH",sidebarLead:"UX Design · Interview Bias",progressBefore:"No review completed",progressDone:"One self-review completed",
 navLabels:["Goals","Core concepts","Illustrations","Guided example","Independent task","Rubric","Sources"],
 sidebarExtra:"Content locked · Hi-Fi visuals remain open for refinement.",
 back:"Back to Catalog",status:"Content locked · UI QA open",guide:"Study methods",catalog:"Catalog",
 openSource:"Open source",copyPrompt:"Copy prompt",copied:"Prompt copied.",copyFailed:"Clipboard unavailable; check permissions.",
 reset:"Clear unsubmitted draft? Past attempts are kept.",storageOff:"Local storage unavailable. Copy your responses before leaving."}
},
"L15-2-2":{
 route:"lessonL15",prefix:"l15",subject:"Supply Chain / Planning, Inventory & Visibility",
 image:{url:"https://upload.wikimedia.org/wikipedia/commons/f/f1/Inventory_control_-_reorder_point_and_service_level.png",
 page:"https://commons.wikimedia.org/wiki/File:Inventory_control_-_reorder_point_and_service_level.png",
 credit:"Poul G · Public domain"},
 sources:[
 {title:"IBM Think — Safety Stock",url:"https://www.ibm.com/think/topics/safety-stock",level:"intro"},
 {title:"MIT OCW — Supply Chain Planning (course syllabus)",url:"https://ocw.mit.edu/courses/15-762j-supply-chain-planning-spring-2011/pages/syllabus/",level:"core"},
 {title:"IBM Think — Inventory Optimization",url:"https://www.ibm.com/think/topics/inventory-optimization",level:"deep"},
 {title:"Springer — Inventory replenishment chapter (bibliographic source)",url:"https://link.springer.com/chapter/10.1007/978-981-19-5145-9_7",level:"deep"}],
 queries:["reorder point versus order quantity","inventory position on hand on order backorders","safety stock lead time variability","continuous review inventory reorder point formula"],
 vi:{
 title:"Điểm đặt hàng lại & tồn kho an toàn",intro:"Đợi kho trống rồi mới mua? Hàng còn đang trên đường, tiểu hữu ơi.",
 goalsKicker:"I · MỤC TIÊU",goalsTitle:"Nhận ra đúng lúc cần tái đặt",
 goals:["Phân biệt safety stock, reorder point và order quantity.","Tính ROP khi giả định về nhu cầu, lead time và buffer đã rõ.","Dùng inventory position để xác định thời điểm kích hoạt đặt thêm.","Nêu giới hạn của mô hình khi lead time hoặc nhu cầu biến động."],
 conceptKicker:"II · HIỂU BẢN CHẤT",conceptTitle:"Chờ kho rỗng rồi đặt? Trễ quá rồi.",
 conceptText:"Một cửa hàng tiêu thụ trung bình <b>24 hộp linh kiện/ngày</b>. Nhà cung cấp giao trong <b>5 ngày cố định</b>; chính sách dự trữ thêm <b>30 hộp</b> safety stock. Nhu cầu dự kiến trong thời gian chờ là <b>24 × 5 = 120 hộp</b>. Do đó <b>ROP = 24 × 5 + 30 = 150 hộp</b>.",
 conceptList:[
 "<b>Lead time:</b> thời gian từ đặt hàng tới nhận hàng; ở ví dụ này giả định là cố định 5 ngày.",
 "<b>Safety stock (SS):</b> phần đệm để giảm rủi ro thiếu hàng; 30 hộp là đầu vào chính sách, không được tính từ một service level.",
 "<b>Reorder point (ROP):</b> ngưỡng của inventory position kích hoạt phát lệnh tái đặt trong chính sách continuous review.",
 "<b>Inventory position:</b> tồn hiện có + hàng đang đặt chưa nhận − lượng nợ giao (backorders)."],
 compareTitle1:"Khi nào đặt? · Reorder point",compareText1:"<b>ROP = d × L + SS</b> (mô hình đơn giản). Đơn vị: hộp; 150 hộp là ngưỡng tái đặt, không phải lượng mua.",
 compareTitle2:"Đặt bao nhiêu? · Order quantity",compareText2:"Số lượng cần đặt được xác định bởi chính sách replenishment, lot size và chi phí riêng. Không thể lấy 150 làm lượng đặt chỉ vì đó là ROP.",
 conceptNote:"<b>Trade-off:</b> Đệm quá ít dễ thiếu hàng; đệm quá lớn giam vốn và tăng chi phí hoặc rủi ro lỗi thời. Công thức đơn giản không tự đưa ra service level, lượng đặt tối ưu hay xác suất không thiếu hàng.",
 visualKicker:"III · ĐỒ THỊ NGUỒN THAM KHẢO",visualTitle:"Nhìn ngưỡng đặt hàng trên đồ thị",
 visualCaption:"Reorder point & service level",visualNote:"Hình mô tả mô hình tồn kho tổng quát có bất định, không phải biểu đồ dữ liệu 24×5+30 trong bài. Safety stock không đảm bảo tuyệt đối không thiếu hàng.",
 guidedKicker:"IV · VÍ DỤ CÓ HƯỚNG DẪN",guidedTitle:"Phụ tùng 12 chiếc/ngày",
 guidedText:"Giả sử nhu cầu là <b>12 chiếc/ngày</b>, lead time <b>3 ngày cố định</b> và safety stock <b>15 chiếc</b>. Nhu cầu khi chờ hàng là <b>12 × 3 = 36 chiếc</b>; <b>ROP = 36 + 15 = 51 chiếc</b>. Inventory position 54 chưa chạm ngưỡng; 49 đã chạm.",
 guidedQuestion:"<b>Tự giải thích:</b> Vì sao <b>51</b> cho biết khi nào đặt thêm, không phải mặc định nên đặt 51 chiếc?",
 guidedLabel:"Giải thích bằng lời của bạn",guidedPlaceholder:"Chỉ ra sự khác nhau giữa thời điểm và số lượng...",guidedSave:"Phần ví dụ có hướng dẫn không tính điểm; câu trả lời lưu trên thiết bị.",
 guidedShow:"Xem gợi ý phân tích",guidedHide:"Ẩn gợi ý phân tích",
 guidedHint:"Câu hỏi <b>khi nào</b> cần tái đặt theo ngưỡng <b>inventory position</b> khác câu hỏi <b>đặt bao nhiêu</b>. Số lượng mua còn phụ thuộc chính sách order quantity riêng.",
 challengeKicker:"V · BÀI TẬP ĐỘC LẬP",challengeTitle:"Kiểm tra ngưỡng tái đặt",
 challengeText:"Một xưởng sửa chữa cần <b>18 bộ linh kiện/ngày</b>, lead time giả định <b>7 ngày cố định</b>, safety stock theo chính sách là <b>34 bộ</b>. Inventory position hiện tại <b>158 bộ</b>.",
 challengeClaim:"Bạn cần xác định ngưỡng đặt hàng, thời điểm phát lệnh và giới hạn của mô hình này; đừng tự giả định đây là bài toán tối ưu tồn kho đầy đủ.",
 questions:[
 "Tính demand during lead time và ROP; ghi rõ phép tính và đơn vị.",
 "Với inventory position = 158, đã chạm ngưỡng đặt hàng theo continuous review chưa? Vì sao?",
 "Nếu lead time thực tế dao động từ 3 đến 12 ngày, giả định nào của mô hình không còn chắc chắn?",
 "Dữ liệu hiện có đã đủ tính order quantity tối ưu hoặc xác suất không stockout chưa? Giải thích."],
 placeholder:"Viết lời giải có đơn vị...",hintButton:"Gợi ý cách giải",hint:"Hãy tách đơn vị trước khi tính: <b>bộ/ngày × ngày</b> ra số bộ. Sau đó cộng buffer và so sánh với inventory position. Đừng suy ra lượng đặt hoặc xác suất khi đề không có dữ liệu đó.",
 assistStatus:"Lượt có hỗ trợ — không tính là làm độc lập hoàn toàn.",
 saveHint:"Bản nháp lưu trên thiết bị; không gửi dữ liệu nội bộ nào cho AI.",submit:"Nộp lời giải",clear:"Xóa bản nháp",
 needAnswers:"Viết lời giải có nghĩa cho đủ bốn câu trước khi nộp.",
 submittedText:"Đã khóa lượt giải. Mở đáp án để tự kiểm tra các phép tính và giả định.",
 answerTitle:"ĐÁP ÁN MẪU · SAU LẦN THỬ",
 answer:"<b>1.</b> Demand during lead time = 18 bộ/ngày × 7 ngày = <b>126 bộ</b>. ROP = 126 + 34 = <b>160 bộ</b>.<br><b>2.</b> Inventory position 158 ≤ 160 nên đã đến ngưỡng kích hoạt đặt thêm.<br><b>3.</b> Nếu lead time có thể từ 3 đến 12 ngày, giả định lead time cố định 7 ngày không còn chắc; cần đánh giá lại mô hình và safety stock.<br><b>4.</b> Chưa đủ dữ liệu về lot size, chi phí và độ bất định để suy ra lượng đặt tối ưu hay xác suất không stockout.",
 answerNote:"<b>Giới hạn:</b> 160 là ngưỡng tái đặt, không có nghĩa phải mua 160 bộ; không tự tuyên bố 95% service level. Chỉ là mô hình học tập, không dùng dữ liệu SAP nội bộ.",
 rubricKicker:"VI · TỰ ĐỐI CHIẾU",rubricTitle:"Rubric tự đánh giá 0–8",
 rubricLead:"Bốn tiêu chí, mỗi tiêu chí 0–2. Đây là self-review chưa hiệu chuẩn, không phải phép chấm điểm tối ưu kho hàng.",
 rubricBefore:"Hãy nộp lời giải trước khi mở đáp án và rubric.",
 rubricItems:[
 ["Nhu cầu trong lead time","2: 126 bộ đúng và có đơn vị; 1: số đúng nhưng thiếu giải thích; 0: sai."],
 ["ROP & quyết định đặt","2: 160 bộ và 158 ≤ 160, kết luận trigger đúng; 1: một phần; 0: nhầm ngưỡng và lượng đặt."],
 ["Giới hạn giả định","2: nhận ra lead time biến động ảnh hưởng; 1: nói chung chung cần thêm dữ liệu; 0: khẳng định chắc chắn."],
 ["Điều không suy ra được","2: không bịa EOQ hoặc xác suất stockout; 1: chỉ nói thiếu dữ liệu; 0: tự tạo kết quả."]],
 scoreOptions:["Chưa đánh giá","0 · Chưa đạt","1 · Một phần","2 · Đầy đủ"],
 scoreLabel:"Điểm tự đánh giá",saveReview:"Lưu tự đánh giá & hoàn tất",needRubric:"Chấm đủ bốn tiêu chí trước khi hoàn tất.",reviewDone:"Đã lưu một lượt tự đánh giá. Chưa phải chứng nhận hiểu supply chain.",
 sourcesKicker:"VII · ĐỌC SÂU",sourcesTitle:"Nguồn inventory & replenishment",
 sourcesLead:"IBM và MIT hỗ trợ bối cảnh học thuật; mỗi nguồn được mở riêng, không sao chép hoặc nạp toàn văn tự động.",
 tiers:{intro:"Hiểu nhanh",core:"Chương trình học thuật",deep:"Đọc chuyên sâu"},
 queriesTitle:"Từ khóa tìm hiểu thêm",allPrompt:"Copy prompt đối chiếu các nguồn",openChat:"Mở ChatGPT ↗",
 sourceNote:"Nếu nguồn không thể truy cập, ChatGPT phải nói rõ và yêu cầu bạn dán phần liên quan. Không khẳng định công thức của bài đã được nguồn chứng thực nếu chưa đọc.",
 sidebarTitle:"LỘ TRÌNH BÀI HỌC",sidebarLead:"Supply Chain · Reorder Point",progressBefore:"Chưa tự đánh giá",progressDone:"Đã tự đánh giá 1 lượt",
 navLabels:["Mục tiêu","Mô hình","Đồ thị","Ví dụ","Bài độc lập","Rubric","Nguồn học"],sidebarExtra:"Wave 1B · Content đã chốt; academic/domain release gate vẫn mở.",
 back:"Về Tàng Thư",status:"Wave 1B · Content khóa · QA/domain mở",guide:"Thần Chú",catalog:"Tàng Thư",
 openSource:"Mở nguồn",copyPrompt:"Copy prompt",copied:"Đã copy prompt.",copyFailed:"Không thể copy; hãy kiểm tra quyền clipboard.",
 reset:"Xóa bản nháp chưa nộp? Lượt đã nộp không bị ảnh hưởng.",storageOff:"Trình duyệt không cho lưu, nên sao chép lời giải trước khi rời trang."},
 en:{
 title:"Reorder Points and Safety Stock",intro:"Do not wait for the shelf to empty. Inventory decisions have lead times.",
 goalsKicker:"I · OBJECTIVES",goalsTitle:"Know when to reorder",
 goals:["Distinguish safety stock, reorder point and order quantity.","Calculate a simplified reorder threshold from stated assumptions.","Compare the threshold with inventory position.","Recognize limits when demand or lead time varies."],
 conceptKicker:"II · CORE EXPLANATION",conceptTitle:"Don't wait until inventory is empty",
 conceptText:"A store uses <b>24 boxes of components/day</b>. Fixed lead time is <b>5 days</b>; an assumed policy sets <b>30 boxes</b> of safety stock. Expected demand during lead time is <b>24 × 5 = 120 boxes</b>. So <b>ROP = 24 × 5 + 30 = 150 boxes</b>.",
 conceptList:[
 "<b>Lead time:</b> time from placing an order to replenishment; fixed at 5 days in this exercise.",
 "<b>Safety stock (SS):</b> an additional buffer; 30 boxes is assumed policy input, not a calculated service-level result.",
 "<b>Reorder point (ROP):</b> inventory-position threshold triggering replenishment under a continuous-review policy.",
 "<b>Inventory position:</b> on-hand inventory plus outstanding orders minus backorders."],
 compareTitle1:"When to reorder? · ROP",compareText1:"<b>ROP = d × L + SS</b> in this simplified deterministic-parameter exercise. The 150-box threshold is not the default order quantity.",
 compareTitle2:"How much to reorder? · Order quantity",compareText2:"Order size needs a separate replenishment or lot-size policy and relevant cost data. Do not mistake the threshold for the number of boxes to purchase.",
 conceptNote:"<b>Trade-off:</b> Less buffer means greater stockout risk; extra buffer ties up capital and may increase storage costs or obsolescence. This formula does not provide an optimal order quantity, precise service level or stockout probability.",
 visualKicker:"III · REFERENCE DIAGRAM",visualTitle:"Reorder threshold on an inventory chart",
 visualCaption:"Reorder point and service level",visualNote:"A general inventory-control figure showing uncertainty, not a plot of the lesson's exact 24×5+30 inputs. Safety stock does not eliminate stockout risk.",
 guidedKicker:"IV · GUIDED EXAMPLE",guidedTitle:"Spare part demand: 12 units/day",
 guidedText:"Suppose demand is <b>12 units/day</b>, fixed lead time <b>3 days</b> and policy safety stock <b>15 units</b>. Lead-time demand is <b>12 × 3 = 36 units</b>; <b>ROP = 36 + 15 = 51 units</b>. Inventory position 54 is above the threshold; 49 is below.",
 guidedQuestion:"<b>Explain:</b> Why is <b>51</b> a reorder threshold rather than necessarily the quantity that should be purchased?",
 guidedLabel:"Explain in your own words",guidedPlaceholder:"Distinguish order timing from order quantity...",guidedSave:"Unscored guided work, saved locally.",
 guidedShow:"Show analysis hint",guidedHide:"Hide analysis hint",
 guidedHint:"<b>When</b> inventory position reaches the threshold is a separate question from <b>how many</b> to order. Quantity requires a distinct replenishment policy.",
 challengeKicker:"V · INDEPENDENT CHALLENGE",challengeTitle:"Evaluate the reorder trigger",
 challengeText:"A repair facility requires <b>18 component sets/day</b>, assumed fixed lead time <b>7 days</b> and policy safety stock <b>34 sets</b>. Current inventory position is <b>158 sets</b>.",
 challengeClaim:"Determine the reorder threshold, whether ordering should be triggered, and model limitations. No full stochastic optimization model is supplied.",
 questions:[
 "Compute lead-time demand and ROP; show calculations and units.",
 "With inventory position 158, does the simulated continuous-review policy trigger an order? Explain.",
 "If actual lead time ranges from 3 to 12 days, what simplifying assumption becomes unreliable?",
 "Can you derive the optimal order quantity or probability of no stockout from the data provided? Why?"],
 placeholder:"Explain with units...",hintButton:"Show a hint",hint:"First check dimensional units: <b>sets/day × days</b> gives sets. Add the specified buffer, then compare with inventory position. Do not infer order quantity or probabilities from missing data.",
 assistStatus:"Assisted attempt, distinct from fully independent performance.",
 saveHint:"Drafts stay on your device; no company data is shared with AI.",submit:"Submit solution",clear:"Clear draft",
 needAnswers:"Provide meaningful answers to all four questions before submission.",
 submittedText:"Attempt submitted and locked. The model calculations and assumptions can now be reviewed.",
 answerTitle:"MODEL SOLUTION · AFTER ATTEMPT",
 answer:"<b>1.</b> Lead-time demand = 18 sets/day × 7 days = <b>126 sets</b>. ROP = 126 + 34 = <b>160 sets</b>.<br><b>2.</b> Inventory position 158 ≤ 160, so the simplified continuous-review policy triggers replenishment.<br><b>3.</b> Lead time changing from 3 to 12 days invalidates confidence in a fixed 7-day lead time; the demand-in-lead-time assumptions and buffer policy require review.<br><b>4.</b> Available data do not determine optimal lot size or stockout probabilities; cost, variability and a model are missing.",
 answerNote:"<b>Boundary:</b> The 160-set reorder threshold is not a 160-set purchase quantity. Do not invent a 95% service level or SAP-internal case from the supplied assumptions.",
 rubricKicker:"VI · SELF-REVIEW",rubricTitle:"0–8 editorial self-rating",
 rubricLead:"Four dimensions × 0–2. Uncalibrated, not an AI grade or supply-chain professional certification.",
 rubricBefore:"Submit a valid solution before seeing the model answer and rubric.",
 rubricItems:[
 ["Lead-time demand","2: 126 sets with correct units; 1: correct number with weak explanation; 0: incorrect."],
 ["ROP and trigger","2: 160 sets and 158 ≤ 160, correctly triggers; 1: partial; 0: confuses timing and quantity."],
 ["Model assumptions","2: identifies effect of variable lead time; 1: generic missing-data remark; 0: unjustified certainty."],
 ["Unavailable outputs","2: rejects invented EOQ/stockout probabilities; 1: says only 'not enough'; 0: fabricates results."]],
 scoreOptions:["Not rated","0 · Missing","1 · Partial","2 · Complete"],scoreLabel:"Self-rating",
 saveReview:"Save self-review & complete",needRubric:"Rate all four dimensions first.",reviewDone:"One self-review saved; no mastery certification implied.",
 sourcesKicker:"VII · FURTHER READING",sourcesTitle:"Inventory and replenishment references",
 sourcesLead:"IBM and MIT provide context for inventory decisions. These are reference links, not scraped or automatically ingested copyrighted texts.",
 tiers:{intro:"Start here",core:"Academic course",deep:"Further reading"},
 queriesTitle:"Research keywords",allPrompt:"Copy cross-source prompt",openChat:"Open ChatGPT ↗",
 sourceNote:"If ChatGPT cannot read a source, it should say so and ask for accessible excerpts. Do not force a source to confirm this simplified model without verifying the source.",
 sidebarTitle:"YOUR LEARNING PATH",sidebarLead:"Supply Chain · Reorder Point",progressBefore:"No review completed",progressDone:"One self-review completed",
 navLabels:["Goals","Model","Diagram","Worked example","Independent task","Rubric","Sources"],sidebarExtra:"Wave 1B · Content locked; academic/domain release gate remains open.",
 back:"Back to Catalog",status:"Wave 1B · Content locked · Domain QA open",guide:"Study methods",catalog:"Catalog",
 openSource:"Open source",copyPrompt:"Copy prompt",copied:"Prompt copied.",copyFailed:"Clipboard unavailable; check permissions.",
 reset:"Clear unsubmitted draft? Previous submissions remain.",storageOff:"Local storage unavailable; copy your solution before leaving."}
}
};
function init(id){
const data=PACK[id];if(!data)throw Error("Unknown lesson "+id);
const p=data.prefix,root=document.getElementById("page-"+data.route);if(!root)return;
const $=part=>document.getElementById(p+"-"+part);
const KEY="li.review."+id+".v1";
let state={locale:"vi",guidedDraft:"",draft:["","","",""],hint:false,assisted:false,submitted:false,submission:null,submissionAt:null,ratings:[null,null,null,null],reviewed:false,guideOpen:false};
try{const old=JSON.parse(localStorage.getItem(KEY)||"null");
 if(old&&typeof old==="object")state={...state,...old};
 if(!Array.isArray(state.draft)||state.draft.length!==4)state.draft=["","","",""];
 if(!Array.isArray(state.ratings)||state.ratings.length!==4)state.ratings=[null,null,null,null];
 if(typeof state.guidedDraft!=="string")state.guidedDraft="";
 if(!["vi","en"].includes(state.locale))state.locale="vi";
}catch(err){}
// Global language in Settings takes precedence over stored lesson-local language.
if(["vi","en"].includes(window.liLanguage?.get?.()))state.locale=window.liLanguage.get();
let storageError=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){storageError=true;return false;}}
function plain(id,value){const el=$(id);if(el)el.textContent=value||"";}
function html(id,value){const el=$(id);if(el)el.innerHTML=value||"";}
function feedback(message){
 if(typeof window.toast==="function"){window.toast(message);return;}
 const el=$("live");el.hidden=false;el.textContent=message;
 clearTimeout(feedback.timer);feedback.timer=setTimeout(()=>{el.hidden=true;},3000);
}
function makePrompt(src){
const L=data[state.locale],links=(src?[src]:data.sources).map(s=>"- "+s.title+": "+s.url).join("\n");
const prompt=state.locale==="vi"?
 "Tôi đang học bài "+id+" thuộc "+data.subject+" trong app li. (理), nội dung đã chốt: "+L.conceptTitle+".\nNguồn đọc:\n"+links+
 "\n\nChỉ tóm tắt phần bạn thực sự truy cập. Nếu URL bị chặn hoặc không có toàn văn, hãy nói rõ và đề nghị tôi dán nội dung, tuyệt đối không bịa trích dẫn. Trả lời bằng tiếng Việt: 1) tóm tắt 5 ý có link nguồn; 2) định nghĩa các khái niệm của bài; 3) tách điều nguồn nói và suy luận; 4) phân tích một tình huống thực tế cùng giới hạn suy rộng; 5) giả định/cảnh báo; 6) ba câu active recall không hiện đáp án. Nếu nguồn có mô hình khác bài học, hãy giải thích sự khác biệt thay vì ép đồng nhất.":
 "I am studying li. (理) lesson "+id+" in "+data.subject+": "+L.conceptTitle+".\nSources:\n"+links+
 "\n\nSummarize only materials you can actually access. If URLs are blocked or full text is missing, say so and request excerpts rather than inventing citations. In English: (1) five source-linked insights; (2) main concepts; (3) verified source claims versus your inferences; (4) a practical case with limits; (5) assumptions and cautions; and (6) three active recall questions without immediate answers. Explain differences if a source uses a different model.";
return prompt;
}
async function copyPrompt(src){
 try{
 const text=makePrompt(src);
 if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
 else{
 const t=document.createElement("textarea");t.value=text;t.setAttribute("readonly","");
 t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();
 const copied=document.execCommand("copy");t.remove();if(!copied)throw Error("clipboard");
 }
 feedback(data[state.locale].copied);
 }catch(e){feedback(data[state.locale].copyFailed);}
}
function render(){
const L=data[state.locale];root.setAttribute("lang",state.locale);
for(const loc of ["vi","en"])$(loc).setAttribute("aria-pressed",String(state.locale===loc));
for(const k of ["title","intro","status","back","goalsKicker","goalsTitle","conceptKicker","conceptTitle",
"compareTitle1","compareTitle2","visualKicker","visualTitle","visualCaption","visualNote",
"guidedKicker","guidedTitle","guidedLabel","guidedSave","challengeKicker","challengeTitle",
"hintButton","saveHint","submit","clear","answerTitle","rubricKicker","rubricTitle","rubricLead",
"rubricGate","scoreLabel","saveReview","sourcesKicker","sourcesTitle","sourcesLead","queriesTitle",
"allPrompt","openChat","sourceNote","sidebarTitle","sidebarLead","sidebarExtra","sidebarGuide","sidebarCatalog"]){
 const mapped={rubricGate:"rubricBefore",sidebarGuide:"guide",sidebarCatalog:"catalog"}[k]||k;
 plain(k,L[mapped]);
}
html("conceptText",L.conceptText);
html("conceptNote",L.conceptNote);
html("compareText1",L.compareText1);html("compareText2",L.compareText2);
html("guidedText",L.guidedText);html("guidedQuestion",L.guidedQuestion);html("guidedHint",L.guidedHint);
html("challengeText",L.challengeText);html("challengeClaim",L.challengeClaim);
html("hint",L.hint);html("answer",L.answer);html("answerNote",L.answerNote);
$("goalsList").replaceChildren(...L.goals.map(t=>{const e=document.createElement("li");e.textContent=t;return e;}));
$("conceptList").replaceChildren(...L.conceptList.map(t=>{const e=document.createElement("li");e.innerHTML=t;return e;}));
$("visualImg").alt=L.visualCaption+". "+L.visualNote;
$("guidedDraft").placeholder=L.guidedPlaceholder;$("guidedDraft").value=state.guidedDraft;
$("guidedHint").hidden=!state.guideOpen;
$("guidedToggle").setAttribute("aria-expanded",String(state.guideOpen));
plain("guidedToggle",state.guideOpen?L.guidedHide:L.guidedShow);
const q=$("questions");q.replaceChildren();
L.questions.forEach((question,i)=>{
 const wrap=document.createElement("div");wrap.className="l09-q-row";
 const label=document.createElement("label");label.htmlFor=p+"-question-"+i;label.textContent=(i+1)+". "+question;
 const textarea=document.createElement("textarea");textarea.id=p+"-question-"+i;textarea.className="text-editor";
 textarea.rows=4;textarea.value=state.draft[i]||"";textarea.disabled=Boolean(state.submitted);textarea.placeholder=L.placeholder;
 textarea.addEventListener("input",()=>{if(state.submitted)return;state.draft[i]=textarea.value;save();});
 wrap.append(label,textarea);q.appendChild(wrap);
});
$("hint").hidden=!state.hint;plain("assistStatus",state.hint?L.assistStatus:"");
$("hintButton").hidden=Boolean(state.submitted);$("submit").hidden=Boolean(state.submitted);$("clear").hidden=Boolean(state.submitted);
$("answerBox").hidden=!state.submitted;$("rubricGate").hidden=Boolean(state.submitted);$("rubricArea").hidden=!state.submitted;
plain("submissionStatus",state.reviewed?L.reviewDone:state.submitted?L.submittedText:(storageError?L.storageOff:""));
const rows=$("rubricRows");rows.replaceChildren();
if(state.submitted)L.rubricItems.forEach((item,i)=>{
 const e=document.createElement("div");e.className="l09-review-row path-item";
 const label=document.createElement("label");label.htmlFor=p+"-rating-"+i;
 const b=document.createElement("b");b.textContent=item[0];label.append(b,document.createElement("br"),document.createTextNode(item[1]));
 const select=document.createElement("select");select.id=p+"-rating-"+i;select.disabled=!!state.reviewed;
 L.scoreOptions.forEach((word,j)=>{const o=document.createElement("option");o.value=j===0?"":String(j-1);o.textContent=word;select.appendChild(o);});
 select.value=state.ratings[i]===null?"":String(state.ratings[i]);
 select.onchange=()=>{state.ratings[i]=select.value===""?null:Number(select.value);save();updateScore();};
 e.append(label,select);rows.appendChild(e);
});
$("saveReview").hidden=!!state.reviewed;
plain("progress",state.reviewed?L.progressDone:L.progressBefore);$("progressBar").setAttribute("aria-valuenow",String(state.reviewed?1:0));
$("progressFill").style.width=state.reviewed?"100%":"0%";
$("index").replaceChildren(...["goals","concept","visuals","guided","challenge","rubric","sources"].map((section,i)=>{
 const a=document.createElement("a");a.href="#"+p+"-"+section;a.textContent=String(i+1).padStart(2,"0")+" · "+L.navLabels[i];return a;
}));
const sources=$("sourcesList");sources.replaceChildren();
data.sources.forEach(source=>{
 const row=document.createElement("div");row.className="l09-source path-item";
 const text=document.createElement("div"),b=document.createElement("b");b.textContent=source.title;
 const tier=document.createElement("p");tier.className="small";tier.textContent=L.tiers[source.level];text.append(b,tier);
 const actions=document.createElement("div");actions.className="l09-source-actions";
 const a=document.createElement("a");a.href=source.url;a.target="_blank";a.rel="noopener noreferrer";a.className="action alt";a.textContent=L.openSource;
 const btn=document.createElement("button");btn.type="button";btn.className="action";btn.textContent=L.copyPrompt;
 btn.setAttribute("aria-label",L.copyPrompt+": "+source.title);btn.addEventListener("click",()=>copyPrompt(source));
 actions.append(a,btn);row.append(text,actions);sources.appendChild(row);
});
$("queries").replaceChildren(...data.queries.map(query=>{
 const a=document.createElement("a");a.href="https://www.google.com/search?q="+encodeURIComponent(query);
 a.target="_blank";a.rel="noopener noreferrer";a.textContent=query;return a;
}));
updateScore();
const resume=document.getElementById(p+"-resume-status");
if(resume)resume.textContent=state.reviewed?(state.locale==="vi"?"Đã hoàn thành 1 lượt":"One review completed"):(state.locale==="vi"?"Đang học":"In progress");
}
function updateScore(){const sum=state.ratings.every(x=>x!==null)?state.ratings.reduce((a,b)=>a+b,0):null;plain("score",sum===null?"— / 8":sum+" / 8");}
for(const loc of ["vi","en"])$(loc).addEventListener("click",()=>{
 if(typeof window.liLanguage?.set==="function"){window.liLanguage.set(loc);return;}
 if(state.locale===loc)return;state.locale=loc;save();render();
});
window.addEventListener?.("li:localechange",event=>{
 const next=event.detail?.locale;
 if(!["vi","en"].includes(next)||next===state.locale)return;
 state.locale=next;save();render();
});
$("guidedDraft").addEventListener("input",()=>{state.guidedDraft=$("guidedDraft").value;save();});
$("guidedToggle").addEventListener("click",()=>{
 state.guideOpen=!state.guideOpen;save();$("guidedHint").hidden=!state.guideOpen;
 $("guidedToggle").setAttribute("aria-expanded",String(state.guideOpen));plain("guidedToggle",state.guideOpen?data[state.locale].guidedHide:data[state.locale].guidedShow);
});
$("hintButton").addEventListener("click",()=>{if(state.submitted)return;state.hint=true;state.assisted=true;save();$("hint").hidden=false;plain("assistStatus",data[state.locale].assistStatus);});
$("submit").addEventListener("click",()=>{
 if(state.submitted)return;state.draft=Array.from({length:4},(_,i)=>$( "question-"+i ).value);
 if(state.draft.some(x=>x.trim().length<12)){feedback(data[state.locale].needAnswers);return;}
 state.submitted=true;state.submission=state.draft.slice();state.submissionAt=new Date().toISOString();const recorded=save();
 if(recorded)typeof CustomEvent==="function"&&typeof window.dispatchEvent==="function"&&window.dispatchEvent(new CustomEvent("li:lesson-submitted",{detail:{lessonId:id}}));
 render();$("answerBox").scrollIntoView({block:"start",behavior:"smooth"});feedback(data[state.locale].submittedText);
});
$("clear").addEventListener("click",()=>{
 if(state.submitted||!window.confirm(data[state.locale].reset))return;
 state.draft=["","","",""];state.hint=false;state.assisted=false;save();render();
});
$("saveReview").addEventListener("click",()=>{
 if(!state.submitted||state.reviewed)return;
 if(state.ratings.some(x=>x===null)){feedback(data[state.locale].needRubric);return;}
 state.reviewed=true;save();render();feedback(data[state.locale].reviewDone);
});
$("allPrompt").addEventListener("click",()=>copyPrompt(null));
$("visualImg").addEventListener("error",()=>{$("visualImg").hidden=true;$("visualFallback").style.display="block";});
render();
}
window.liWave1Init=init;
})();