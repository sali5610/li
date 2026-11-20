/* S121 · Source-checked context-aware quotation library for Lão Lý.
   Original language is quoted; Vietnamese is our explanatory gloss, not a claimed canonical translation.
   Commentary is explicitly Lão Lý's interpretation, separate from the author.
   No third-party APIs, no telemetry; only anonymous quote IDs in sessionStorage. */
(function(){
"use strict";
const QUOTES=[{"id":"analects-practice","original":"學而時習之，不亦說乎？","gloss":"Học rồi thường xuyên ôn luyện, chẳng phải đáng vui sao?","meta":"Khổng Tử · Luận Ngữ, Học Nhi 1.1","url":"https://zh.wikisource.org/zh-hant/論語/學而第一","lang":"zh-Hant","tags":["practice","memory","knowledge","methods"],"comment":"Học xong cất vào tủ là cách biến kiến thức thành đồ trang trí đó, tiểu hữu.","translation":"Học rồi thường xuyên ôn tập và thực hành, chẳng phải vui sao?","interpretation":"Việc ôn và vận dụng thường xuyên biến kiến thức đã học thành hiểu biết bền vững."},{"id":"analects-honesty","original":"知之爲知之，不知爲不知，是知也。","gloss":"Biết thì nhận là biết; chưa biết thì nhận là chưa biết — đó mới là biết.","meta":"Khổng Tử · Luận Ngữ, Vi Chính 2.17","url":"https://zh.wikisource.org/zh-hant/論語/為政第二","lang":"zh-Hant","tags":["doubt","evidence","knowledge","reflection"],"comment":"Dán nhãn 'chưa biết' đỡ tốn công chữa một kết luận bịa cho sang.","translation":"Biết thì nói là biết, không biết thì nói là không biết; đó chính là biết.","interpretation":"Biết rõ ranh giới điều mình hiểu là một biểu hiện của trí tuệ, không phải sự yếu kém."},{"id":"analects-review","original":"溫故而知新，可以爲師矣。","gloss":"Ôn điều cũ để hiểu thêm điều mới; nhờ thế có thể hướng dẫn người khác.","meta":"Khổng Tử · Luận Ngữ, Vi Chính 2.11","url":"https://zh.wikisource.org/zh-hant/論語/為政第二","lang":"zh-Hant","tags":["memory","practice","reading","reflection"],"comment":"Nhớ lại không chỉ để thuộc; còn để phát hiện mình vừa hiểu khác đi.","translation":"Ôn lại điều cũ mà hiểu thêm điều mới, thì có thể làm thầy được rồi.","interpretation":"Nhìn lại điều từng học có thể giúp phát hiện một lớp nghĩa mới, không chỉ nhắc lại nguyên xi."},{"id":"analects-think","original":"學而不思則罔，思而不學則殆。","gloss":"Học mà chẳng suy xét thì mơ hồ; chỉ suy nghĩ mà không học thì dễ lạc.","meta":"Khổng Tử · Luận Ngữ, Vi Chính 2.15","url":"https://zh.wikisource.org/zh-hant/論語/為政第二","lang":"zh-Hant","tags":["knowledge","methods","evidence","reading"],"comment":"Não có hai việc: tiếp nhận và kiểm tra. Bỏ một vế là dễ trật đường.","translation":"Học mà không suy nghĩ thì mờ mịt; suy nghĩ mà không học thì nguy.","interpretation":"Tiếp nhận kiến thức và suy xét độc lập cần bổ sung cho nhau; chỉ làm một vế dễ dẫn đến nhận định lệch."},{"id":"analects-others","original":"見賢思齊焉，見不賢而內自省也。","gloss":"Gặp người hay thì học theo; gặp điều chưa hay thì tự soi lại.","meta":"Khổng Tử · Luận Ngữ, Lý Nhân 4.17","url":"https://zh.wikisource.org/zh-hant/論語/里仁第四","lang":"zh-Hant","tags":["social","norms","reflection","methods"],"comment":"Đừng vội đóng dấu một người là 'khác thường'; thử xem chuẩn mình dùng từ đâu ra.","translation":"Thấy người hiền thì nghĩ đến việc noi theo; thấy người không hiền thì tự xét lại mình.","interpretation":"Quan sát người khác là cơ hội vừa học điều tốt vừa tự soi cách hành xử của chính mình."},{"id":"analects-peers","original":"三人行，必有我師焉。","gloss":"Đi cùng người khác vẫn có điều để mình học từ họ.","meta":"Khổng Tử · Luận Ngữ, Thuật Nhi 7.22","url":"https://zh.wikisource.org/zh-hant/論語/述而第七","lang":"zh-Hant","tags":["social","knowledge","reading","practice"],"comment":"Một ngành chẳng độc quyền tri thức. Học chéo ngành mới hay vỡ ra chuyện lạ.","translation":"Ba người cùng đi, ắt có người làm thầy ta.","interpretation":"Người khác có thể cho ta điều đáng học ngay cả khi họ không mang danh nghĩa thầy giáo."},{"id":"laozi-begin","original":"千里之行，始於足下。","gloss":"Đường xa nghìn dặm bắt đầu từ bước chân đầu tiên.","meta":"Đạo Đức Kinh · chương 64, bản Vương Bật","url":"https://zh.wikisource.org/zh-hant/道德經_(王弼本)","lang":"zh-Hant","tags":["pace","practice","agency","focus"],"comment":"Muốn học hết thư viện? Được. Nhưng hôm nay cứ mở một trang đã.","translation":"Hành trình ngàn dặm bắt đầu từ dưới chân.","interpretation":"Mục tiêu lớn trở nên khả thi khi bắt đầu bằng một hành động cụ thể, nhỏ và gần."},{"id":"laozi-self","original":"知人者智，自知者明。","gloss":"Hiểu người là trí; hiểu chính mình là sáng.","meta":"Đạo Đức Kinh · chương 33, bản Vương Bật","url":"https://zh.wikisource.org/zh-hant/道德經_(王弼本)","lang":"zh-Hant","tags":["reflection","agency","social","pace"],"comment":"Nhịp học là do ngươi chọn; lão không đoán hộ đầu óc ngươi đang chịu được bao nhiêu.","translation":"Biết người là trí, tự biết mình là sáng suốt.","interpretation":"Hiểu được giới hạn, động cơ và khả năng của chính mình là một dạng sáng suốt khác với hiểu người."},{"id":"zhuangzi-limits","original":"吾生也有涯，而知也無涯。","gloss":"Đời người hữu hạn, còn điều có thể biết thì vô hạn.","meta":"Trang Tử · Dưỡng Sinh Chủ","url":"https://zh.wikisource.org/zh-hant/莊子/養生主","lang":"zh-Hant","tags":["pace","focus","knowledge","reading"],"comment":"Câu sau của đoạn này còn cảnh báo cái giá của việc đuổi theo tri thức vô tận. Nghỉ đúng lúc không phải thua.","translation":"Đời ta có giới hạn, còn tri thức thì không có giới hạn.","interpretation":"Đoạn văn tiếp tục cảnh báo việc dùng đời sống hữu hạn để chạy theo tri thức vô tận một cách không biết điểm dừng."},{"id":"zhuangzi-craft","original":"臣之所好者，道也，進乎技矣。","gloss":"Điều ta theo đuổi là đạo lý vận hành, vượt lên trên một kỹ thuật đơn lẻ.","meta":"Trang Tử · Dưỡng Sinh Chủ, chuyện Bào Đinh","url":"https://zh.wikisource.org/zh-hant/莊子/養生主","lang":"zh-Hant","tags":["systems","supply","methods","practice"],"comment":"Bào Đinh nhìn ra cấu trúc trước khi động dao; làm sản phẩm cũng cần hiểu luồng trước khi đẩy nút.","translation":"Điều thần ưa thích là Đạo, đã vượt lên trên kỹ nghệ.","interpretation":"Bào Đinh nhấn mạnh việc nắm nguyên lý vận hành và cấu trúc của công việc, thay vì chỉ giỏi thao tác."},{"id":"mencius-sources","original":"盡信《書》，則不如無《書》。","gloss":"Nếu tin hoàn toàn vào Kinh Thư, thà chẳng đọc còn hơn.","meta":"Mạnh Tử · Tận Tâm Hạ","url":"https://zh.wikisource.org/zh-hant/孟子/盡心下","lang":"zh-Hant","tags":["critique","evidence","reading","doubt"],"comment":"Ở đây 'Thư' là Kinh Thư cụ thể. Ý hay nằm ở việc kiểm tra nguồn, không phải bảo vứt hết sách.","translation":"Nếu tin hết vào Kinh Thư, thà không có Kinh Thư còn hơn.","interpretation":"Dù là kinh điển có uy tín, văn bản vẫn cần được đọc với sự chọn lọc và đối chiếu chứng cứ."},{"id":"bacon-studies","original":"Reading maketh a full man; conference a ready man; and writing an exact man.","gloss":"Đọc để bồi đắp hiểu biết, trao đổi để nhanh trí, viết để suy nghĩ chính xác hơn.","meta":"Francis Bacon · Essays, Of Studies","url":"https://en.wikisource.org/wiki/The_Essays_of_Francis_Bacon/L_Of_Studies","lang":"en","tags":["reading","writing","practice","knowledge"],"comment":"Đọc xong tưởng mình hiểu? Thử viết lại bằng lời mình xem, lão đợi.","translation":"Đọc làm người ta phong phú; bàn luận làm người ta nhanh nhạy; viết làm người ta chính xác.","interpretation":"Đọc, thảo luận và viết rèn những năng lực khác nhau: tích lũy, ứng đáp và diễn đạt chính xác."},{"id":"bacon-cause","original":"Knowledge and human power are synonymous, since the ignorance of the cause frustrates the effect.","gloss":"Hiểu nguyên nhân mới giúp tác động được vào kết quả.","meta":"Francis Bacon · Novum Organum, quyển I, bản dịch Wood","url":"https://en.wikisource.org/wiki/Novum_Organum/Book_I_(Wood)","lang":"en","tags":["systems","supply","evidence","methods"],"comment":"Có hàng trong hệ thống mà khách không mua được? Hãy lần chuỗi nguyên nhân, đừng nhìn mỗi tổng tồn.","translation":"Tri thức và sức mạnh của con người là một; không biết nguyên nhân thì không đạt được kết quả.","interpretation":"Biết nguyên nhân cho phép ta can thiệp vào kết quả; chỉ nhìn bề mặt hiện tượng thì chưa đủ."},{"id":"hume-evidence","original":"A wise man, therefore, proportions his belief to the evidence.","gloss":"Mức độ tin một kết luận phải tương xứng với bằng chứng có được.","meta":"David Hume · An Enquiry Concerning Human Understanding, mục X","url":"https://davidhume.org/texts/e/full","lang":"en","tags":["sampling","evidence","critique","doubt"],"comment":"Một mẫu trả lời 90% không tự biến thành 90% toàn thị trường. Bằng chứng đến đâu, lời nói đến đó.","translation":"Vì vậy, người khôn ngoan cân đối niềm tin của mình theo bằng chứng.","interpretation":"Niềm tin nên mạnh hay yếu tùy vào độ đáng tin và sức nặng của chứng cứ, thay vì theo cảm giác chắc chắn."},{"id":"mill-other-side","original":"He who knows only his own side of the case, knows little of that.","gloss":"Chỉ hiểu phía mình thì vẫn chưa hiểu rõ chính vấn đề.","meta":"John Stuart Mill · On Liberty, chương II","url":"https://en.wikisource.org/wiki/On_Liberty/Chapter_2","lang":"en","tags":["social","critique","sampling","evidence"],"comment":"Cần nghe cả người không có mặt trong mẫu, kể cả người không đồng ý với mình.","translation":"Người chỉ biết phía mình trong một vấn đề thì biết rất ít ngay cả về phía ấy.","interpretation":"Không hiểu quan điểm đối lập cũng khiến ta khó nhận ra điểm yếu trong lập luận của chính mình."},{"id":"darwin-confidence","original":"ignorance more frequently begets confidence than does knowledge","gloss":"Thiếu hiểu biết đôi khi lại tạo ra sự chắc chắn lớn hơn là hiểu biết thực sự.","meta":"Charles Darwin · The Descent of Man, Lời dẫn","url":"https://en.wikisource.org/wiki/The_Descent_of_Man_(Darwin)/Introduction","lang":"en","tags":["doubt","critique","evidence","reflection"],"comment":"Lão ngại nhất kiểu chưa kiểm tra mà khẳng định như đóng đinh.","translation":"Sự thiếu hiểu biết thường sinh ra sự tự tin hơn là tri thức.","interpretation":"Cảm giác chắc chắn có thể tăng khi người ta chưa nhận ra mình đang thiếu bao nhiêu thông tin."},{"id":"aristotle-know","original":"All men by nature desire to know.","gloss":"Con người vốn có khuynh hướng muốn hiểu biết.","meta":"Aristotle · Metaphysics, quyển I, bản dịch W. D. Ross","url":"https://en.wikisource.org/wiki/Page:Metaphysics_by_Aristotle_Ross_1908_(deannotated).djvu/21","lang":"en","tags":["knowledge","reading","methods"],"comment":"Tò mò là lý do tốt để bước vào Tàng Thư; còn đi sâu tới đâu thì tùy câu hỏi.","translation":"Con người, theo bản tính, đều mong muốn hiểu biết.","interpretation":"Ham muốn tìm hiểu được Aristotle nhìn nhận như một khuynh hướng tự nhiên của con người."},{"id":"seneca-time","original":"the life we receive is not short, but we make it so","gloss":"Không hẳn đời quá ngắn; chính cách sử dụng thời gian có thể làm nó thành ngắn ngủi.","meta":"Seneca · On the Shortness of Life, chương I, bản dịch tiếng Anh","url":"https://en.wikisource.org/wiki/On_the_shortness_of_life/Chapter_I","lang":"en","tags":["pace","focus","reflection","agency"],"comment":"Đừng mở 18 việc rồi than một ngày chỉ có 24 giờ. Tập trung một việc cho ra hồn đã.","translation":"Cuộc đời được trao cho ta không ngắn, nhưng chính ta làm nó thành ngắn.","interpretation":"Cảm giác đời ngắn còn đến từ việc phung phí thời gian, không chỉ từ số năm được sống."},{"id":"epictetus-appearance","original":"You are but a semblance and by no means the real thing.","gloss":"Đó mới là một ấn tượng ban đầu, chưa chắc là chính sự việc.","meta":"Epictetus · Enchiridion, bản dịch tiếng Anh","url":"https://en.wikisource.org/wiki/The_Works_of_Epictetus,_His_Discourses,_in_Four_Books,_the_Enchiridion,_and_Fragments/The_Enchiridion","lang":"en","tags":["doubt","critique","social","reflection"],"comment":"Đừng biến cảm giác đầu tiên thành dữ kiện. Nhìn lại cách mình quan sát đã.","translation":"Ngươi chỉ là một biểu hiện bề ngoài, tuyệt nhiên không phải chính sự vật.","interpretation":"Ấn tượng đầu tiên chỉ là cách sự việc hiện ra với ta; không thể mặc nhiên coi nó là sự thật."},{"id":"box-models","original":"Essentially, all models are wrong, but some are useful.","gloss":"Mô hình luôn đơn giản hóa thực tại, nhưng vẫn có thể hữu ích.","meta":"George E. P. Box · Empirical Model-Building and Response Surfaces (1987)","url":"https://mathshistory.st-andrews.ac.uk/Biographies/Box/quotations/","lang":"en","tags":["models","sampling","systems","evidence"],"comment":"Một dashboard hay mô hình dự báo chỉ giúp quyết định, chứ không thay thế toàn bộ thực tế.","translation":"Về cơ bản, mọi mô hình đều sai, nhưng có những mô hình hữu ích.","interpretation":"Mô hình giản lược hiện thực; tính hữu ích phụ thuộc câu hỏi và giới hạn áp dụng của nó."},{"id":"smith-incentive","original":"Give me that which I want, and you shall have this which you want","gloss":"Đưa tôi điều tôi cần, tôi sẽ đưa anh điều anh cần — trao đổi dựa trên lợi ích đôi bên.","meta":"Adam Smith · The Wealth of Nations, quyển I, chương II","url":"https://en.wikisource.org/wiki/The_Wealth_of_Nations/Book_I/Chapter_2","lang":"en","tags":["supply","economy","systems","social"],"comment":"Trong chuỗi cung ứng, mỗi bên có động lực và ràng buộc riêng. Đừng giả định cả mạng lưới tự đồng lòng.","translation":"Hãy cho tôi thứ tôi muốn, rồi anh sẽ có được thứ anh muốn.","interpretation":"Trao đổi có thể hình thành bởi lợi ích tương hỗ, vì mỗi bên đều muốn thỏa mãn một nhu cầu."},{"id":"hamlet-thought","original":"there is nothing either good or bad but thinking makes it so","gloss":"Cách nhìn của ta có thể ảnh hưởng mạnh đến việc đánh giá một chuyện.","meta":"Shakespeare · Hamlet, hồi II cảnh II (lời nhân vật Hamlet)","url":"https://www.folger.edu/explore/shakespeares-works/Hamlet/read/","lang":"en","tags":["social","norms","reflection","critique"],"comment":"Đây là lời một nhân vật trong kịch, không phải định luật tâm lý. Nhưng đáng hỏi: nhãn 'bình thường' xuất phát từ đâu?","translation":"Không có gì vốn là tốt hay xấu; chính suy nghĩ khiến nó thành như vậy.","interpretation":"Đây là lời nhân vật Hamlet suy ngẫm về vai trò của suy nghĩ trong đánh giá sự vật, không phải một định luật."},{"id":"woolf-room","original":"a woman must have money and a room of her own if she is to write fiction","gloss":"Để phụ nữ có thể viết văn, họ cần điều kiện vật chất và một không gian riêng.","meta":"Virginia Woolf · A Room of One's Own, chương I (1929)","url":"https://en.wikisource.org/wiki/A_Room_of_One%27s_Own_(Hogarth_1929)/Chapter_1","lang":"en","tags":["social","norms","economy","writing"],"comment":"Cơ hội sáng tạo không chỉ do tài năng; còn phụ thuộc quyền tiếp cận nguồn lực và không gian.","translation":"Một người phụ nữ phải có tiền và một căn phòng riêng nếu muốn viết tiểu thuyết.","interpretation":"Sáng tạo cần cả điều kiện kinh tế và quyền có không gian riêng, chứ không chỉ tài năng."},{"id":"mencius-small","original":"吾於《武成》，取二三策而已矣。","gloss":"Với thiên Võ Thành, ta chỉ lấy đôi ba phần đáng tin.","meta":"Mạnh Tử · Tận Tâm Hạ","url":"https://zh.wikisource.org/zh-hant/孟子/盡心下","lang":"zh-Hant","tags":["evidence","critique","reading"],"comment":"Lời này nối ngay sau chuyện đừng tin trọn cuốn. Chọn lọc theo chứng cứ, không chọn theo vẻ oai của sách.","translation":"Đối với thiên Võ Thành, ta chỉ chọn lấy hai ba thẻ tre mà thôi.","interpretation":"Mạnh Tử minh họa việc chỉ giữ lại phần văn bản đáng tin, không tiếp nhận cả thiên sách như chân lý."}];
/* Localized glosses are editorial paraphrases, not claimed canonical editions. */
const QUOTES_EN={
  "analects-practice": {
    "gloss": "Learning and returning to practice—what joy could be greater?",
    "translation": "Learning and returning to practice—what joy could be greater?",
    "comment": "Learn something and then lock it away? Fine way to turn knowledge into shelf decoration, young scholar.",
    "interpretation": "Revisiting and applying what we learn can deepen understanding over time.",
    "meta": "Confucius · Analects, Xue Er 1.1"
  },
  "analects-honesty": {
    "gloss": "Know what you know, and admit what you don't—that is knowing.",
    "translation": "Know what you know, and admit what you don't—that is knowing.",
    "comment": "A neat little “not sure” saves you from defending a confident invention later.",
    "interpretation": "Recognizing the limits of your knowledge is a form of understanding, not a failure.",
    "meta": "Confucius · Analects, Wei Zheng 2.17"
  },
  "analects-review": {
    "gloss": "Review the familiar to discover something new; then you may guide others.",
    "translation": "Review the familiar to discover something new; then you may guide others.",
    "comment": "Review isn't just repeating words. It's noticing what you understand differently this time.",
    "interpretation": "Revisiting prior learning can reveal new meaning instead of merely repeating it.",
    "meta": "Confucius · Analects, Wei Zheng 2.11"
  },
  "analects-think": {
    "gloss": "Learning without reflection leaves you confused; thinking without learning can mislead you.",
    "translation": "Learning without reflection leaves you confused; thinking without learning can mislead you.",
    "comment": "Your brain has two jobs: take things in and question them. Skip either and you'll wander off course.",
    "interpretation": "Learning and independent reflection work together; relying on either alone limits understanding.",
    "meta": "Confucius · Analects, Wei Zheng 2.15"
  },
  "analects-others": {
    "gloss": "When you meet someone admirable, learn from them; when you see a shortcoming, reflect on yourself.",
    "translation": "When you meet someone admirable, learn from them; when you see a shortcoming, reflect on yourself.",
    "comment": "Before calling someone “unusual,” examine the standard you're using.",
    "interpretation": "Other people's actions can prompt learning and self-reflection, not just judgment.",
    "meta": "Confucius · Analects, Li Ren 4.17"
  },
  "analects-peers": {
    "gloss": "Even among people walking beside me, there is someone I can learn from.",
    "translation": "Even among people walking beside me, there is someone I can learn from.",
    "comment": "No field owns all the wisdom. Crossing disciplines is where things get interesting.",
    "interpretation": "Learning can come from peers, even when they aren't formal teachers.",
    "meta": "Confucius · Analects, Shu Er 7.22"
  },
  "laozi-begin": {
    "gloss": "A journey of a thousand miles begins with a step beneath your feet.",
    "translation": "A journey of a thousand miles begins with a step beneath your feet.",
    "comment": "Want to study the entire Library? Splendid. Try opening one page today.",
    "interpretation": "Large goals become more manageable when we begin with a small, concrete action.",
    "meta": "Daodejing · Chapter 64, Wang Bi recension"
  },
  "laozi-self": {
    "gloss": "Understanding others takes insight; understanding yourself takes clarity.",
    "translation": "Understanding others takes insight; understanding yourself takes clarity.",
    "comment": "You choose the pace. I won't pretend I can read how much your mind can handle.",
    "interpretation": "Understanding your own motives and limits is a different kind of insight from understanding others.",
    "meta": "Daodejing · Chapter 33, Wang Bi recension"
  },
  "zhuangzi-limits": {
    "gloss": "Our lives are limited; what there is to know has no end.",
    "translation": "Our lives are limited; what there is to know has no end.",
    "comment": "The passage goes on to warn about chasing boundless knowledge with a finite life. Resting isn't losing.",
    "interpretation": "The wider passage questions pursuing endless knowledge without recognizing human limits.",
    "meta": "Zhuangzi · Nourishing Life"
  },
  "zhuangzi-craft": {
    "gloss": "What I follow is the underlying Way, beyond mere technical skill.",
    "translation": "What I follow is the underlying Way, beyond mere technical skill.",
    "comment": "Cook Ding understood the structure before lifting his blade. In product work, understand the flow before moving the buttons.",
    "interpretation": "The Cook Ding story emphasizes grasping underlying structure and principles, not merely repeating techniques.",
    "meta": "Zhuangzi · Nourishing Life, Cook Ding episode"
  },
  "mencius-sources": {
    "gloss": "If you believe every word of the Documents, you'd be better off without them.",
    "translation": "If you believe every word of the Documents, you'd be better off without them.",
    "comment": "The “Documents” here is a specific classic, not every book on earth. Check your sources; don't set fire to the Library.",
    "interpretation": "Even respected classical texts deserve selective, evidence-aware reading.",
    "meta": "Mencius · Jin Xin II"
  },
  "bacon-studies": {
    "gloss": "Reading enriches, discussion sharpens, and writing makes thought more precise.",
    "translation": "Reading enriches, discussion sharpens, and writing makes thought more precise.",
    "comment": "Think you've understood it because you read it? Explain it in your own words. I'll wait.",
    "interpretation": "Reading, discussion, and writing develop complementary abilities.",
    "meta": "Francis Bacon · Essays, “Of Studies”"
  },
  "bacon-cause": {
    "gloss": "Understanding causes is what gives us the ability to affect outcomes.",
    "translation": "Understanding causes is what gives us the ability to affect outcomes.",
    "comment": "Plenty in the warehouse but nothing on the shelf? Trace the cause, not just the inventory total.",
    "interpretation": "Knowing causes helps us intervene; a surface observation alone isn't enough.",
    "meta": "Francis Bacon · Novum Organum, Book I"
  },
  "hume-evidence": {
    "gloss": "The strength of a belief should match the strength of the evidence.",
    "translation": "The strength of a belief should match the strength of the evidence.",
    "comment": "90% of one sample doesn't become 90% of the market by magic. Claim only what the evidence supports.",
    "interpretation": "Confidence in a conclusion should reflect the quality and weight of its evidence.",
    "meta": "David Hume · An Enquiry Concerning Human Understanding, Section X"
  },
  "mill-other-side": {
    "gloss": "Knowing only your own side means scarcely knowing the issue at all.",
    "translation": "Knowing only your own side means scarcely knowing the issue at all.",
    "comment": "Hear from the people missing in the sample, including those who disagree with you.",
    "interpretation": "Understanding opposing views can expose weaknesses in our own arguments.",
    "meta": "John Stuart Mill · On Liberty, Chapter II"
  },
  "darwin-confidence": {
    "gloss": "Ignorance sometimes breeds more confidence than knowledge does.",
    "translation": "Ignorance sometimes breeds more confidence than knowledge does.",
    "comment": "I fear the conclusion delivered with great certainty before anyone checks a thing.",
    "interpretation": "Unwarranted certainty can grow when people don't recognize gaps in their understanding.",
    "meta": "Charles Darwin · The Descent of Man, Introduction"
  },
  "aristotle-know": {
    "gloss": "People naturally desire to know.",
    "translation": "People naturally desire to know.",
    "comment": "Curiosity gets you into the Library. Your question decides how far to explore.",
    "interpretation": "Aristotle treats the desire to understand as part of human nature.",
    "meta": "Aristotle · Metaphysics, Book I"
  },
  "seneca-time": {
    "gloss": "Life isn't necessarily too short; how we spend it can make it feel that way.",
    "translation": "Life isn't necessarily too short; how we spend it can make it feel that way.",
    "comment": "Start eighteen tasks and you'll wonder where twenty-four hours went. Finish one thing properly first.",
    "interpretation": "Wasted time, not only the number of years available, contributes to the sense that life is short.",
    "meta": "Seneca · On the Shortness of Life, Chapter I"
  },
  "epictetus-appearance": {
    "gloss": "This is only how something first appears to you, not necessarily what it is.",
    "translation": "This is only how something first appears to you, not necessarily what it is.",
    "comment": "Don't promote your first impression to “fact.” Look again at how you observed it.",
    "interpretation": "An initial impression is not automatically an accurate account of reality.",
    "meta": "Epictetus · Enchiridion"
  },
  "box-models": {
    "gloss": "Models simplify reality, but some can still help us.",
    "translation": "Models simplify reality, but some can still help us.",
    "comment": "A dashboard or forecast helps decisions; it is not the entire world in a neat little chart.",
    "interpretation": "Models simplify reality, and their usefulness depends on the question and their limits.",
    "meta": "George E. P. Box · Empirical Model-Building and Response Surfaces (1987)"
  },
  "smith-incentive": {
    "gloss": "Offer me what I need, and I'll offer what you need: exchange can serve mutual interests.",
    "translation": "Offer me what I need, and I'll offer what you need: exchange can serve mutual interests.",
    "comment": "In a supply chain, each party has its own incentives and constraints. Don't assume the network agrees by default.",
    "interpretation": "Exchange can emerge from mutual interest because each party is trying to meet a need.",
    "meta": "Adam Smith · The Wealth of Nations, Book I, Chapter II"
  },
  "hamlet-thought": {
    "gloss": "How we think can strongly shape how we judge something.",
    "translation": "How we think can strongly shape how we judge something.",
    "comment": "A character in a play said this, not a psychologist stating a law. Still worth asking: who defined “normal”?",
    "interpretation": "Hamlet reflects on how thought shapes judgment. The line isn't a scientific law.",
    "meta": "Shakespeare · Hamlet, Act II, Scene II (spoken by Hamlet)"
  },
  "woolf-room": {
    "gloss": "For women to write fiction, they need material means and space of their own.",
    "translation": "For women to write fiction, they need material means and space of their own.",
    "comment": "Creative opportunity isn't talent alone. Resources and access to space count too.",
    "interpretation": "Woolf connects creativity to economic conditions and access to private space, not just personal talent.",
    "meta": "Virginia Woolf · A Room of One's Own, Chapter I (1929)"
  },
  "mencius-small": {
    "gloss": "From the Wu Cheng chapter, I would keep only a few trustworthy passages.",
    "translation": "From the Wu Cheng chapter, I would keep only a few trustworthy passages.",
    "comment": "This follows the warning against believing a whole book. Select by evidence, not by how grand the cover looks.",
    "interpretation": "Mencius illustrates the idea of accepting only credible portions rather than treating an entire text as unquestionable.",
    "meta": "Mencius · Jin Xin II"
  }
};
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
 const lesson=window.liLessonCompanion?.getContext?.();
 if(lesson&&lesson.page===page){
  return {scope:page+":"+lesson.lesson_id+":"+lesson.stage,
   keys:lesson.topics.slice(0,3),page,scenario,mode,quoteIds:lesson.quote_ids};
 }
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
 const pool=Array.isArray(ctx.quoteIds)&&ctx.quoteIds.length?QUOTES.filter(q=>ctx.quoteIds.includes(q.id)):matchList(ctx);if(!pool.length)return null;
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
/* Canonical quote data view for React and the previous DOM renderer.
 * Rotation, original-language text, source rights and VI/EN metadata remain
 * managed by this one S121 engine; React never duplicates the quote bank. */
function getView(){
 const calm=window.liBuddyVoice?.get?.()?.calm ??
  document.getElementById("calm-toggle")?.checked; // native fallback
 if((typeof buddyDebateActive==="boolean"&&buddyDebateActive)||calm)return null;
 const item=pick();
 if(!item)return null;
 const inEnglish=window.liLanguage?.get?.()==="en";
 const shown=inEnglish?{...item,...QUOTES_EN[item.id]}:item;
 return {
  id:item.id,original:item.original,lang:item.lang,
  translation:(inEnglish?"Meaning: ":"Dịch nghĩa: ")+shown.translation,
  interpretation:(inEnglish?"Interpretation: ":"Diễn nghĩa: ")+shown.interpretation,
  meta:shown.meta,url:item.url,comment:shown.comment
 };
}
/* Legacy DOM renderer stays as an adapter until all unaffected owners are
 * migrated. It calls exactly the same safe data view as the React dialog. */
function render(){
 const details=document.getElementById("buddy-quote");
 const original=document.getElementById("buddy-quote-original");
 const translation=document.getElementById("buddy-quote-translation");
 const info=document.getElementById("buddy-quote-info");
 const note=document.getElementById("buddy-quote-context");
 if(!details||!original||!translation||!info||!note)return;
 const hide=()=>{
  details.hidden=true;original.hidden=true;translation.hidden=true;info.hidden=true;note.hidden=true;
  info.setAttribute("aria-expanded","false");
 };
 const view=getView();if(!view){hide();return;}
 const gloss=document.getElementById("buddy-quote-gloss");
 const meta=document.getElementById("buddy-quote-meta");
 const link=document.getElementById("buddy-quote-link");
 if(!gloss||!meta||!link){hide();return;}
 const item=QUOTES.find(q=>q.id===view.id);
 if(!item){hide();return;}
 const inEnglish=window.liLanguage?.get?.()==="en";
 const shown=inEnglish?{...item,...QUOTES_EN[item.id]}:item;
 original.textContent=item.original;original.lang=item.lang;original.hidden=false;
 translation.textContent=(inEnglish?"Meaning: ":"Dịch nghĩa: ")+shown.translation;translation.hidden=false;
 gloss.textContent=(inEnglish?"Interpretation: ":"Diễn nghĩa: ")+shown.interpretation;
 meta.textContent=shown.meta;
 link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";
 note.textContent=shown.comment;note.hidden=false;
 details.hidden=true;info.hidden=false;info.setAttribute("aria-expanded","false");
}
/** Read-only source-first lookup for authorized editorial React moments. */
function lookup(id,locale="vi"){
 const q=QUOTES.find(item=>item.id===id);
 if(!q||typeof q.url!=="string"||!q.url.startsWith("https://"))return null;
 const shown=locale==="en"?{...q,...QUOTES_EN[id]}:q;
 if(!shown.translation||!shown.interpretation||!shown.meta)return null;
 return Object.freeze({
  id:q.id,original:q.original,lang:q.lang,url:q.url,
  translation:shown.translation,interpretation:shown.interpretation,
  comment:shown.comment,meta:shown.meta
 });
}
window.liQuoteEngine={quotes:QUOTES,environment,matchList,pick,getView,render,lookup};
})();