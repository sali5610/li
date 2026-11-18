/* S158 · Available Wave1 cross-lesson journeys. Navigation metadata only:
   never edits PO-locked lesson body, never exposes unpublished Wave2/3. */
(()=>{
"use strict";
const LESSONS={
 "L03-1-2":{route:"lessonL03",title:"Open Questions & Interview Bias",field:{vi:"UX Design",en:"UX Design"}},
 "L09-1-2":{route:"lessonL09",title:"Sampling Bias",field:{vi:"Data Science",en:"Data Science"}},
 "L15-2-2":{route:"lessonL15",title:"Reorder Points & Safety Stock",field:{vi:"Supply Chain",en:"Supply Chain"}}
};
/* Relationships are conceptual, not false prerequisite or completion requirements. */
const RELATED={
 "L03-1-2":[
  {target:"L09-1-2",type:{vi:"MỞ RỘNG · THIÊN LỆCH",en:"EXTEND · BIAS"},
   reason:{vi:"Câu hỏi có thể dẫn dắt câu trả lời. Vậy nếu ngay từ đầu ta đã hỏi sai nhóm người thì sao?",en:"Questions can lead answers. What if the people selected to answer are not representative?"}}
 ],
 "L09-1-2":[
  {target:"L03-1-2",type:{vi:"SO SÁNH · NGHIÊN CỨU",en:"COMPARE · RESEARCH"},
   reason:{vi:"Chọn đúng người vẫn chưa đủ: cách đặt câu hỏi cũng có thể làm lệch kết quả.",en:"Even with suitable participants, leading questions can distort what you learn."}},
  {target:"L15-2-2",type:{vi:"ĐỔI GÓC NHÌN · VẬN HÀNH",en:"NEW CONTEXT · OPERATIONS"},
   reason:{vi:"Từ chất lượng dữ liệu sang quyết định tồn kho: cần hiểu số liệu trước khi chọn ngưỡng đặt hàng.",en:"From data quality to inventory decisions: understand the numbers before setting a reorder point."}}
 ],
 "L15-2-2":[
  {target:"L09-1-2",type:{vi:"NỀN TẢNG · ĐỌC DỮ LIỆU",en:"FOUNDATION · DATA READING"},
   reason:{vi:"Một quyết định dùng số liệu cần biết số liệu ấy đại diện cho điều gì — và chưa đại diện cho ai.",en:"Before using numbers to decide, ask what those numbers do and do not represent."}}
 ]
};
function render(id){
 const root=document.querySelector('[data-lesson-id="'+id+'"]');
 const section=root?.querySelector(".li-related-lessons");
 if(!root||!section)return;
 const en=root.querySelector("#"+id.slice(1,3).toLowerCase()+"-en");
 const locale=en?.getAttribute("aria-pressed")==="true"?"en":"vi";
 const title=section.querySelector(".li-related-title"),intro=section.querySelector(".li-related-intro"),list=section.querySelector(".li-related-list");
 title.textContent=locale==="vi"?"Nối tiếp mạch kiến thức":"Follow the learning thread";
 intro.textContent=locale==="vi"?"Những bài đang mở, nối với điều vừa học theo một góc nhìn cụ thể. Không phải bài bắt buộc.":"Available lessons connected by a specific idea, not mandatory prerequisites.";
 list.replaceChildren();
 RELATED[id].forEach(entry=>{
  const lesson=LESSONS[entry.target];
  if(!lesson||!document.getElementById("page-"+lesson.route))return;
  const link=document.createElement("a");
  link.className="li-related-link";
  link.href="./?lesson="+encodeURIComponent(entry.target);
  link.dataset.relatedLessonId=entry.target;
  link.setAttribute("aria-label",(locale==="vi"?"Mở bài ":"Open lesson ")+entry.target+": "+lesson.title);
  const top=document.createElement("span"),heading=document.createElement("strong"),why=document.createElement("span"),end=document.createElement("span");
  top.className="li-related-type";top.textContent=entry.type[locale]+" · "+lesson.field[locale];
  heading.className="li-related-name";heading.textContent=lesson.title;
  why.className="li-related-reason";why.textContent=entry.reason[locale];
  end.className="li-related-go";end.textContent=(locale==="vi"?"Mở bài học":"Open lesson")+" →";
  link.append(top,heading,why,end);
  link.addEventListener("click",event=>{
   if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
   if(typeof window.navigate==="function"){event.preventDefault();window.navigate(lesson.route);}
  });
  const li=document.createElement("li");li.append(link);list.append(li);
 });
 section.hidden=list.children.length===0;
}
Object.keys(RELATED).forEach(id=>{
 const root=document.querySelector('[data-lesson-id="'+id+'"]');
 const stack=root?.querySelector(".l09-stack");
 if(!stack||stack.querySelector(".li-related-lessons"))return;
 const section=document.createElement("section");
 section.className="surface li-related-lessons";section.setAttribute("aria-labelledby","li-related-"+id);
 const kicker=document.createElement("div");kicker.className="kicker";kicker.textContent="KẾT NỐI KIẾN THỨC";
 const heading=document.createElement("h2");heading.className="li-related-title";heading.id="li-related-"+id;
 const intro=document.createElement("p");intro.className="li-related-intro small";
 const list=document.createElement("ul");list.className="li-related-list";
 section.append(kicker,heading,intro,list);
 stack.append(section);
 ["vi","en"].forEach(locale=>{
  root.querySelector("#"+id.slice(1,3).toLowerCase()+"-"+locale)?.addEventListener("click",()=>render(id));
 });
 render(id);
});
})();
