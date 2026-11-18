/* li. global language preference, S163.
   One app-wide VI/EN preference, never a per-Lesson setting. Authored Wave1
   manuscripts retain their own localized renderers; unpublished text is not
   auto-translated or silently invented. All storage is same-origin local. */
(()=>{
"use strict";
const KEY="li.app.locale.v1";
const supported=["vi","en"];
let locale="vi";
try{const raw=localStorage.getItem(KEY);if(supported.includes(raw))locale=raw;}catch(error){/* no storage available */}
const TEXT={
 "Đại Sảnh":"Great Hall","Tàng Thư":"Library","Thần Chú":"Spells","Tủ Riêng":"My Shelf",
 "Cài đặt":"Settings","Quay lại":"Back","Trang chủ":"Home",
 "Tra Cứu":"Search","Nhặt ý":"Capture an idea","Khảo Chứng":"Investigate","Phản Chứng":"Test a claim",
 "Bút Ký":"Case Notes","Bộ sưu tập":"Collection","Quay lại gần đây":"Continue",
 "MỤC LỤC":"CONTENTS","KHÁM PHÁ TRI THỨC":"EXPLORE KNOWLEDGE",
 "KHÁM PHÁ":"EXPLORE","CHUYÊN NGÀNH":"FIELD","NHÓM NGÀNH":"DOMAIN GROUP",
 "MÔN HỌC":"COURSE","BÀI HỌC":"LESSON","CHƯƠNG":"CHAPTER",
 "Chương":"Chapters","MỤC LỤC BÀI HỌC":"LESSON CONTENTS",
 "Mục lục chương":"Chapter contents","Toàn bộ bài":"Full lesson","Đóng ✕":"Close ✕",
 "Đóng mục lục chương":"Close chapter contents","← Trước":"← Previous","Tiếp →":"Next →",
 "Khám phá":"Explore","Tất cả":"All","Tiếp tục":"Continue","Xem chi tiết":"View details",
 "Xem môn học":"View course","Vào bài học":"Open lesson","Xem đề cương":"View outline",
 "Khám phá những lĩnh vực khiến bạn tò mò":"Explore the fields that spark your curiosity",
 "13 cách học, ghi nhớ và lập luận":"13 ways to learn, remember, and reason",
 "Những câu hỏi và kết luận muốn quay lại":"Questions and conclusions worth revisiting",
 "LỐI ĐI TRONG THƯ VIỆN":"PATHS THROUGH THE LIBRARY",
 "Mọi câu hỏi":"Every question","đều có rễ.":"has roots.",
 "Không cần biết tất cả. Chỉ cần không ngừng tò mò.":"You don't need to know everything. Just stay curious.",
 "Một câu hỏi, muôn ngả đường":"One question, many paths",
 "Check-in hôm nay":"Today's check-in","Đào sâu":"Go deeper",
 "Khám phá vì sao":"Explore why","Lưu câu hỏi":"Save question","Bỏ lưu câu hỏi":"Remove saved question","Đã lưu":"Saved",
 "Gương Vạn Vấn":"Mirror of Questions","VÍ DỤ GIẢ ĐỊNH":"HYPOTHETICAL EXAMPLE",
 "CẨM NANG TƯ DUY":"THE THINKING GRIMOIRE","Sổ Tay Thần Chú":"The Spellbook",
 "13 phương pháp để học, ghi nhớ và suy nghĩ. Mỗi pháp danh đều có tên học thuật gốc đi kèm.":"Thirteen spells for learning, memory, and reasoning. Beneath each incantation lies a real academic method.",
 "Tìm kiếm":"Search","LỌC THEO NHÓM":"FILTER BY GROUP",
 "CÀI ĐẶT":"SETTINGS","Tùy chỉnh cách học, cách Lão Lý trò chuyện và dữ liệu của bạn.":"Choose how you learn, interact with Lão Lý, and manage your data.",
 "01 · CÁ NHÂN HÓA":"01 · PERSONALIZATION","Trải nghiệm của bạn":"Your experience",
 "Chọn nhịp học và cách trò chuyện cùng Lão Lý.":"Set your study pace and how you interact with Lão Lý.",
 "HỌC TẬP":"LEARNING","Nhịp học của bạn":"Your study pace",
 "Lão Lý đồng hành theo nhịp bạn chọn.":"Lão Lý adapts to your chosen pace.",
 "Vào nhịp":"Ease in","Quá tải":"Overloaded","Hồi trí":"Recover",
 "NGƯỜI ĐỒNG HÀNH":"COMPANION",
 "Lão hơi tự phụ, đãng trí và có thể nhận sai khi bị phản bác bằng lý lẽ hợp lệ.":"A little pompous and forgetful, but willing to admit when a sound argument proves him wrong.",
 "Giọng Dịu":"Gentler tone","Im Lặng":"Mute Lão Lý",
 "Lão gọi bạn thế nào?":"What should Lão Lý call you?",
 "Ba cách xưng hô theo tâm trạng của lão. Để trống để giữ cách gọi mặc định.":"Three forms of address for his moods. Leave blank for the defaults.",
 "Dùng cách gọi mặc định":"Restore default names",
 "Chỉ thay cách gọi trong lời Lão Lý, không đổi nội dung học.":"Changes how Lão Lý addresses you, not what you study.",
 "02 · NHẮC NHỞ":"02 · REMINDERS","Lời nhắc":"Reminders",
 "Thông báo vẫn là tính năng dự kiến, chưa kích hoạt.":"Notifications are planned but not available yet.",
 "NHẮC NHỞ":"REMINDERS","Nhắc nhở riêng":"Personal reminders",
 "Những loại lời nhắc dự kiến. Chưa thể bật thông báo trên thiết bị.":"Planned reminders; device notifications cannot be enabled yet.",
 "Nhắc nghỉ ngơi":"Rest reminders","Nhắc vận động":"Movement reminders","Nhắc lịch ngủ":"Sleep reminders",
 "Lời nhắc trên thiết bị hiện chưa khả dụng.":"Device reminders are not available yet.",
 "03 · DỮ LIỆU & RIÊNG TƯ":"03 · DATA & PRIVACY","Dữ liệu của bạn":"Your data",
 "Xem nơi lưu trữ, quản lý bản sao và quyền riêng tư.":"Review storage, backups and privacy.",
 "SAO LƯU":"BACKUP","Dữ liệu trên thiết bị":"On-device data","Lưu trên thiết bị":"Stored on this device",
 "Đang lưu trong trình duyệt này.":"Stored in this browser.",
 "Đồng bộ giữa các thiết bị":"Sync between devices","Chưa hỗ trợ.":"Not supported yet.",
 "Xuất bản sao":"Export backup","Nhập bản sao":"Import backup",
 "QUYỀN RIÊNG TƯ":"PRIVACY","Kiểm soát thuộc về bạn":"You're in control",
 "Lão Lý hiện dùng hội thoại có sẵn. Ghi chép của bạn không tự động được gửi tới dịch vụ AI bên ngoài.":"Lão Lý currently uses predefined dialogue. Your notes are not automatically sent to an external AI service.",
 "TÌM TRONG THƯ VIỆN":"SEARCH THE LIBRARY","Kết quả tra cứu":"Search results",
 "Nhập điều bạn muốn tìm.":"Enter a topic to search for.",
 "Ý nghĩ, câu sách hoặc nhận định chưa được kiểm chứng":"An idea, quote or claim not yet verified",
 "Lưu ý đã nhặt":"Save idea","Nguồn cá nhân · Chưa xác minh":"Personal source · Unverified",
 "Ngôn ngữ":"Language","NGÔN NGỮ TOÀN APP":"APP LANGUAGE",
 "Ngôn ngữ áp dụng cho toàn bộ giao diện và mọi bài học đã có bản song ngữ. Nội dung chưa được dịch sẽ giữ bản gốc.":"Your choice applies across the app and every lesson with an authored translation. Content without an English edition stays in its original language.",
 "Tiếng Việt":"Vietnamese","Tiếng Anh":"English",
 "Tám nhóm ngành, những lối đi khác nhau vào cùng một thư viện tri thức.":"Eight domain groups, eight routes into one library of knowledge.",
 "Danh mục gồm chương trình đang biên soạn. Chỉ bài đã phát hành mới có nội dung học.":"The catalog includes works in progress. Only published lessons can be studied.",
 "Chọn chuyên ngành để xem lộ trình các môn học.":"Choose a field to browse its course progression.",
 "Các môn được sắp theo nền tảng → trung cấp → chuyên sâu. Thứ tự này là lộ trình đề xuất, không tự động khóa bài.":"Courses are ordered from foundation to intermediate and advanced; they are recommendations, not automatic locks.",
 "Theo dõi các bài trong môn và tiếp tục từ nội dung đã phát hành.":"Track the course and continue with published lessons.",
 "Nền tảng":"Foundation","Trung cấp":"Intermediate","Chuyên sâu":"Advanced",
 "Đã phát hành":"Published","Đề cương · chưa phát hành":"Outline · not published",
 "Bài này mới có tên và vị trí trong lộ trình. Nội dung chương chưa được xuất bản.":"This lesson is an outline only. Its chapters have not been published.",
 "CHƯA PHÁT HÀNH":"NOT PUBLISHED","Nội dung đang được biên soạn":"Content in development",
 "Chưa có chương được phát hành. Chưa có bài tập hoặc tiến độ học.":"No chapters have been published. No exercises or study progress exist yet.",
 "Ngôn ngữ toàn ứng dụng":"App language",
 "Ngôn ngữ nội dung / Lesson language":"App language",
 "Tất cả chuyên ngành":"All fields",
 "Ngôn ngữ":"Language","Công nghệ":"Technology","Khoa học xã hội":"Social Sciences",
 "Kinh doanh":"Business","Toán học":"Mathematics","Tâm lý học":"Psychology",
 "Thiết kế":"Design","Ngôn ngữ & Văn hóa":"Languages & Culture",
 "Tiếng Trung":"Chinese","Tiếng Anh":"English","Xã hội học":"Sociology",
 "Nhân học":"Anthropology","Kinh tế học":"Economics","Khoa học dữ liệu":"Data Science",
 "Lịch sử thế giới":"World History","Tâm lý học nhận thức":"Cognitive Psychology",
 "Tâm lý học hành vi":"Behavioral Psychology","Lý thuyết âm nhạc":"Music Theory",
 "Chuỗi cung ứng":"Supply Chain",
 "Khám phá những lĩnh vực khiến bạn tò mò":"Explore the fields you are curious about"
};
Object.assign(TEXT,window.LI_LEGACY_EN||{});
/* Only authored source fragments enter the composite fallback. This handles phrases
   assembled with counts or names; it must never invent a scholarly translation. */
const COMPOSE_SHORT=new Set([
 "Nhịp “","Đang tìm “","Ngươi đang đọc","Ngươi đang tra “",
 "Tủ Riêng có","Bút Ký và","Đã có","Đã lưu","Đã nhập",
 "Bút Ký,","Dấu Trang và","Ý đã nhặt.","Lão Lý ·",
 "Đã chọn nhịp","Hoàn tác:","Gợi ý:","Điểm cộng gợi ý:",
 "Xem ","So với","Vào nhịp","Đào sâu","Quá tải","Hồi trí",
 "Có","Chưa","Không rõ","Nhật Ký","Bút Ký","Dấu Trang",
 "Lão Lý","Tàng Thư","Thần Chú","Gương Vạn Vấn","Tiểu hữu","Nhóc"
]);
const COMPOSE_KEYS=Object.keys(TEXT)
 .filter(k=>(k.length>=11&&/[\s·,.!?“”]/.test(k))||COMPOSE_SHORT.has(k))
 .sort((a,b)=>b.length-a.length);
const COMPOSE_ANCHORS=[
 "Nhịp “","Đang tìm “","Ngươi đang đọc","Ngươi đang tra “",
 "Tủ Riêng có","Đã có","Đã lưu","Đã nhập","Đã chọn nhịp",
 "Lão Lý ·","Trò chuyện với Lão Lý ·",
 "Hoàn tác:","Gợi ý:","Điểm cộng gợi ý:",
 "Cần hoàn thành:","Chưa thể áp dụng. Hãy trả lời:",
 "Số lần Check-in","Đang hiển thị","Hiển thị "
];
function trComposed(value){
 const input=String(value??"");
 const trimmed=input.trim();
 /* Never translate arbitrary text from a learner's own notes or question. */
 if(!COMPOSE_ANCHORS.some(prefix=>trimmed.startsWith(prefix)))return input;
 if(Object.prototype.hasOwnProperty.call(TEXT,trimmed))return input.replace(trimmed,TEXT[trimmed]);
 let out=input;
 for(const part of COMPOSE_KEYS){
  if(out.includes(part))out=out.split(part).join(TEXT[part]);
 }
 return out;
}
/* Scope contextual collisions by stable key: navigation "Back" is not the
   "Continue" collection title. Textarea values remain learner-owned. */
const CONTEXT_TEXT={
 "resume.pageTitle":{vi:"Quay lại",en:"Continue"}
};
function translateForNode(node,source){
 const key=node?.parentElement?.closest?.("[data-li-i18n]")?.dataset?.liI18n;
 const entry=CONTEXT_TEXT[key];
 if(entry&&String(source).trim()===entry.vi)return String(source).replace(entry.vi,entry.en);
 return tr(source);
}
const ATTRS=["aria-label","aria-description","title","placeholder","alt"];
const originalText=new WeakMap();
const originalAttr=new WeakMap();
let observer=null,locked=false;
/* Exact render strings are preferred. These are the approved variable-bearing
   UX templates: keep user-provided text untouched and translate only surrounding UI. */
function dateForScreenReader(day,month,year){
 return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(Number(year),Number(month)-1,Number(day)));
}
const DYNAMIC_TEMPLATES=[
 [/^Hiển thị (\d+)\/13 phương pháp(?: · (.+))?$/,m=>{
  const suffix={"kết quả tìm kiếm trên cả 13":"search results across all 13","theo nhóm":"filtered by group","đầy đủ":"all techniques"}[m[2]]||TEXT[m[2]]||m[2]||"";
  return "Showing "+m[1]+"/13 spells"+(suffix?" · "+suffix:"");
 }],
 [/^(\d+\/\d+) bài đã phát hành · Chưa có bài nào để học và tự đánh giá\.$/,m=>m[1]+" lessons published · Nothing available to study or review yet."],
 [/^(\d+\/\d+) bài đã phát hành · Chỉ ghi nhận hoàn thành khi có trạng thái tự đánh giá thật trên thiết bị này\.$/,m=>m[1]+" lessons published · Completion counts only after a real self-review on this device."],
 [/^(\d{2}) · (.+)$/,m=>TEXT[m[2]]?m[1]+" · "+TEXT[m[2]]:null],
 [/^(\d{1,2})\/(\d{1,2})\/(\d{4}): (chưa có nhật ký|chưa ghi nhận|(\d+) hoạt động(?: được ghi nhận)?)$/,m=>{
   const status=m[4]==="chưa có nhật ký"?"no journal entry":m[4]==="chưa ghi nhận"?"no activity recorded":m[5]+" recorded "+(m[5]==="1"?"activity":"activities");
   return dateForScreenReader(m[1],m[2],m[3])+": "+status;
 }],
 [/^Trong (\d+) ngày có ghi nhận: (\d+) bài · (\d+) vấn đề · (\d+) input\.$/,m=>
   "Recorded across "+m[1]+(m[1]==="1"?" day: ":" days: ")+m[2]+(m[2]==="1"?" lesson, ":" lessons, ")+m[3]+(m[3]==="1"?" problem, ":" problems, ")+m[4]+(m[4]==="1"?" input.":" inputs.")
 ],

 [/^(\d+) hoạt động được ghi nhận$/,m=>m[1]+" recorded activities"],
 [/^(\d+) ngày có ghi nhận:$/,m=>m[1]+" days with entries:"],
 [/^(\d+) phương pháp khớp tên hoặc bộ lọc hiện tại\.$/,m=>m[1]+" techniques match the current name or filters."],
 [/^Đang hiển thị (\d+) phương pháp$/,m=>"Showing "+m[1]+" techniques"],
 [/^(\d+) bài đã phát hành · Chưa có bài nào để học và tự đánh giá\.$/,m=>m[1]+" published lessons · Nothing available to study or review yet."],
 [/^(\d+) bài đã phát hành · Chỉ ghi nhận hoàn thành khi có trạng thái tự đánh giá thật trên thiết bị này\.$/,m=>m[1]+" published lessons · Completion counts only after a real self-review on this device."],
 [/^Đã nhập (\d+) Bút Ký, (\d+) Dấu Trang và (\d+) Ý đã nhặt\.$/,m=>"Imported "+m[1]+(m[1]==="1"?" case note, ":" case notes, ")+m[2]+(m[2]==="1"?" bookmark, and ":" bookmarks, and ")+m[3]+(m[3]==="1"?" captured idea.":" captured ideas.")],
 [/^Đã hẹn ôn lúc (.+)\. Chưa đến hẹn nên không tính là thực hành ôn giãn cách\.$/,m=>"Review scheduled for "+m[1]+". It isn't due yet, so this doesn't count as spaced practice."],
 [/^Ý nhớ lại ở nơi (\d+)$/,m=>"Idea recalled at location "+m[1]],
 [/^Cần hoàn thành: (.+)\. Chưa có đủ thao tác để đối chiếu\.$/,m=>"Please complete: "+(TEXT[m[1]]||m[1])+". There isn't enough to check yet."],
 [/^Tủ Riêng có (\d+) Bút Ký và (\d+) Dấu Trang trên thiết bị này\. Đây là những gì đã lưu thật, không phải thành tích tưởng tượng\.$/,m=>"My Shelf has "+m[1]+(m[1]==="1"?" case note and ":" case notes and ")+m[2]+(m[2]==="1"?" bookmark":" bookmarks")+" on this device. That's saved data, not imaginary achievements."],
 [/^Đã có (\d+) lượt lưu Phản Chứng\. Mỗi lượt gồm kết luận đã viết lại và phản hồi\.$/,m=>"You have "+m[1]+(m[1]==="1"?" saved Test a Claim attempt":" saved Test a Claim attempts")+", with a revised conclusion and feedback."],
 [/^Đã lưu (\d+) câu hỏi từ Gương Vạn Vấn\.$/,m=>"Saved "+m[1]+(m[1]==="1"?" question":" questions")+" from the Mirror of Questions."],
 [/^Đã chọn nhịp (Vào nhịp|Đào sâu|Quá tải|Hồi trí)\. Đổi lúc nào cũng được!$/,m=>"Selected "+(TEXT[m[1]]||m[1])+". Change it whenever you like!"],
 [/^Nhịp “(Vào nhịp|Đào sâu|Quá tải|Hồi trí)” do chính ngươi chọn\. Lão không tự đoán tình trạng sức khỏe hay độ thông minh của ai\.$/,m=>"You chose the “"+(TEXT[m[1]]||m[1])+"” pace. I won't guess anyone's health or intelligence."],
 [/^Đã chọn nhịp (Vào nhịp|Đào sâu|Quá tải|Hồi trí)$/,m=>"Selected pace: "+(TEXT[m[1]]||m[1])],
 [/^Chưa thể áp dụng\. Hãy trả lời: (.+)\. Hoặc chọn Bỏ qua để học mà không ghi check-in\.$/,m=>"Can't apply yet. Please answer: "+m[1]+". Or choose Skip to learn without recording a check-in."],
 [/^L1 đã đủ ba câu\. Bạn chọn (.+) thủ công; quyền quyết định vẫn thuộc về bạn\.$/,m=>"All three check-in questions are answered. You chose "+(TEXT[m[1]]||m[1])+" manually; the decision is yours."]
];
function tr(value){
 const v=String(value||"");
 const trimmed=v.trim();
 if(!trimmed)return v;
 let translated=TEXT[trimmed];
 if(!translated){
  const match=DYNAMIC_TEMPLATES.map(([pattern,build])=>{const m=trimmed.match(pattern);return m?build(m):null}).find(Boolean);
  if(match)translated=match;
 }
 if(!translated){
  translated=trimmed
   .replace(/^(\d+) chuyên ngành$/,"$1 fields")
   .replace(/^(\d+) môn học theo lộ trình$/,"$1 ordered courses")
   .replace(/^(\d+)\/(\d+) bài đã hoàn thành$/,"$1/$2 lessons completed")
   .replace(/^(\d+)\/(\d+) bài đã phát hành$/,"$1/$2 lessons published");
  if(translated===trimmed)return trComposed(v);
 }
 return v.replace(trimmed,translated);
}
function ignored(node,forAttrs=false){
 const p=node.nodeType===1?node:node.parentElement;
 if(!p)return true;
 const shared='script,style,code,pre,[data-lesson-id],.catalog-sheet-layer,[data-li-no-translate],.library-entry-body,.library-clamp,#li-note-case-question,#li-note-case-scene,#li-note-case-choices';
 // Do not touch learner-entered textarea text; its placeholder/ARIA still needs locale.
 return Boolean(p.closest?.(shared))||(!forAttrs&&Boolean(p.closest?.('textarea,[contenteditable]')));
}
function patchText(node){
 if(ignored(node))return;
 const previous=originalText.get(node);
 // App scripts may update a text node in place (counters, feedback, live status).
 // Preserve that new source instead of restoring a stale value from the first render.
 let original=previous===undefined?node.nodeValue:previous;
 if(previous!==undefined&&node.nodeValue!==original&&node.nodeValue!==translateForNode(node,original)){
  original=node.nodeValue;
 }
 if(previous!==original)originalText.set(node,original);
 const desired=locale==="en"?translateForNode(node,original):original;
 if(node.nodeValue!==desired)node.nodeValue=desired;
}
function patchAttrs(node){
 if(node.nodeType!==1||ignored(node,true))return;
 let saved=originalAttr.get(node);
 if(!saved){saved={};originalAttr.set(node,saved);}
 for(const key of ATTRS){
  if(!node.hasAttribute(key))continue;
  const current=node.getAttribute(key);
  if(!(key in saved)|| (current!==saved[key]&&current!==tr(saved[key])))saved[key]=current;
  const desired=locale==="en"?tr(saved[key]):saved[key];
  if(node.getAttribute(key)!==desired)node.setAttribute(key,desired);
 }
}
function walk(root){
 if(!root)return;
 if(root.nodeType===3){patchText(root);return;}
 if(root.nodeType!==1||ignored(root,true))return;
 patchAttrs(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 let node;
 while((node=walker.nextNode())){
  if(node.nodeType===3)patchText(node);
  else if(!ignored(node,true))patchAttrs(node);
 }
}
function syncSettings(){
 const buttons=document.querySelectorAll("[data-li-app-locale]");
 buttons.forEach(b=>{
  const active=b.dataset.liAppLocale===locale;
  b.setAttribute("aria-pressed",String(active));
 });
}
function apply(root=document.body){
 if(!root||locked)return;
 locked=true;
 try{
  document.documentElement.lang=locale;
  if(root===document.body)document.title=locale==="en"?"理 · li. — Library of Knowledge":"理 · li. — Thư viện tri thức";
  walk(root);
  syncSettings();
 }finally{locked=false;}
}
function get(){return locale;}
function set(next){
 if(!supported.includes(next))return false;
 if(next===locale){apply();return true;}
 locale=next;
 try{localStorage.setItem(KEY,locale);}catch(e){/* session still works */}
 apply();
 window.dispatchEvent(new CustomEvent("li:localechange",{detail:{locale}}));
 return true;
}
window.liLanguage={get,set,translate:value=>locale==="en"?tr(value):String(value??""),translateComposed:value=>locale==="en"?trComposed(value):String(value??""),apply,key:KEY};
const region=document.querySelector("#page-settings .settings-group-grid");
if(region&&!document.getElementById("li-global-language")){
 const card=document.createElement("article");card.id="li-global-language";card.className="surface li-global-language";
 const kicker=document.createElement("div");kicker.className="kicker";kicker.textContent="NGÔN NGỮ TOÀN APP";
 const title=document.createElement("h2");title.textContent="Ngôn ngữ";
 const desc=document.createElement("p");desc.className="small";
 desc.textContent="Ngôn ngữ áp dụng cho toàn bộ giao diện và mọi bài học đã có bản song ngữ. Nội dung chưa được dịch sẽ giữ bản gốc.";
 const control=document.createElement("div");control.className="li-locale-control";
 control.setAttribute("role","group");control.setAttribute("aria-label","Ngôn ngữ toàn ứng dụng");
 for(const [id,label] of [["vi","Tiếng Việt"],["en","English"]]){
  const button=document.createElement("button");button.type="button";button.className="action alt li-locale-choice";
  button.dataset.liAppLocale=id;button.textContent=label;
  button.addEventListener("click",()=>set(id));control.append(button);
 }
 card.append(kicker,title,desc,control);
 region.prepend(card);
}
apply();
if(typeof MutationObserver==="function"){
 observer=new MutationObserver(changes=>{
  if(locked)return;
  for(const mutation of changes){
   if(mutation.type==="characterData")patchText(mutation.target);
   else if(mutation.type==="attributes"){
    if(ATTRS.includes(mutation.attributeName))patchAttrs(mutation.target);
   }else for(const node of mutation.addedNodes||[])walk(node);
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
}
})();