/* Native Hi-Fi L03-1-2: mounts existing li. components, no standalone draft layout. */
(()=>{
"use strict";
const anchor=document.getElementById("page-case"),catalog=document.querySelector("#page-catalog .surface-grid");
if(!anchor||!catalog||document.getElementById("page-lessonL03"))return;
const page=String.raw`
<section id="page-lessonL03" class="page" tabindex="-1" aria-labelledby="l03-title" data-lesson-id="L03-1-2" data-companion-manifest="./lessons/companion/L03-1-2.json">
 <div class="section-shell">
 <div class="kicker">TECHNOLOGY · UX DESIGN · USER PROBLEMS & RESEARCH BASICS · L03-1-2</div>
 <h1 class="display-title" id="l03-title">Open Questions & Interview Bias</h1>
 <p class="intro" id="l03-intro">Câu hỏi mở chưa chắc là câu hỏi trung lập.</p>
 <div class="l09-hero-tools">
  <button class="action alt" type="button" data-page="catalog" id="l03-back">Về Tàng Thư</button>
  <span class="status-chip" id="l03-status">Wave 1 · Content locked / UI in review</span>
  <div class="l09-lang-switch" role="group" aria-label="Ngôn ngữ bài học / Lesson language">
   <button type="button" class="action alt" id="l03-vi" aria-pressed="true">VI</button>
   <button type="button" class="action alt" id="l03-en" aria-pressed="false">EN</button>
  </div>
 </div>
 <div class="editorial-grid">
  <div class="stack-sm l09-stack">
   <article class="surface" id="l03-goals">
    <div class="kicker" id="l03-goalsKicker">I · MỤC TIÊU</div><h2 id="l03-goalsTitle">Mục tiêu bài học</h2>
    <ul class="l09-goal-list" id="l03-goalsList"></ul>
   </article>
   <article class="surface" id="l03-concept">
    <div class="kicker" id="l03-conceptKicker">II · HIỂU ĐIỀU CỐT LÕI</div><h2 id="l03-conceptTitle">Hiểu bản chất</h2>
    <p id="l03-conceptText"></p><ul class="l09-points" id="l03-conceptList"></ul>
    <div class="l09-compare">
     <div class="path-item"><b id="l03-compareTitle1"></b><p id="l03-compareText1"></p></div>
     <div class="path-item"><b id="l03-compareTitle2"></b><p id="l03-compareText2"></p></div>
    </div>
    <div class="state-note" id="l03-conceptNote"></div>
   </article>
   <article class="surface" id="l03-visuals">
    <div class="kicker" id="l03-visualKicker">III · MINH HOẠ BẰNG NGUỒN THẬT</div><h2 id="l03-visualTitle">Phỏng vấn người dùng · Interview</h2>
    <figure class="l09-figure">
     <img id="l03-visualImg" loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Interview.svg" alt="Phỏng vấn người dùng · Interview" width="450" height="334">
     <p class="l09-img-fallback" id="l03-visualFallback"><a href="https://commons.wikimedia.org/wiki/File:Interview.svg" target="_blank" rel="noopener noreferrer">Mở ảnh nguồn nếu hình không tải ↗</a></p>
     <figcaption><strong id="l03-visualCaption"></strong><p class="small" id="l03-visualNote"></p><a href="https://commons.wikimedia.org/wiki/File:Interview.svg" target="_blank" rel="noopener noreferrer">Alexander Koenig MA · CC BY-SA 3.0 DE · Wikimedia Commons ↗</a></figcaption>
    </figure>
   </article>
   <article class="surface tinted" id="l03-guided">
    <div class="kicker" id="l03-guidedKicker">IV · THỬ TỰ GIẢI THÍCH</div><h2 id="l03-guidedTitle">Ví dụ có hướng dẫn</h2>
    <p id="l03-guidedText"></p>
    <div class="state-note" id="l03-guidedQuestion"></div>
    <div class="l09-q-row">
     <label for="l03-guidedDraft" id="l03-guidedLabel">Tự giải thích bằng lời của bạn</label>
     <textarea id="l03-guidedDraft" class="text-editor" rows="4"></textarea>
     <p class="small" id="l03-guidedSave">Không tính điểm · lưu trên thiết bị.</p>
    </div>
    <div class="action-row"><button type="button" class="action alt" id="l03-guidedToggle" aria-expanded="false" aria-controls="l03-guidedHint">Xem gợi ý phân tích</button></div>
    <div class="state-note l09-hint" id="l03-guidedHint" hidden></div>
   </article>
   <article class="surface" id="l03-challenge">
    <div class="kicker" id="l03-challengeKicker">V · BÀI TẬP ĐỘC LẬP</div><h2 id="l03-challengeTitle">Tự làm bài</h2>
    <p id="l03-challengeText"></p><div class="state-note" id="l03-challengeClaim"></div>
    <div id="l03-questions"></div>
    <div class="action-row"><button type="button" class="action alt" id="l03-hintButton">Xem gợi ý</button><span class="small" id="l03-assistStatus"></span></div>
    <div class="state-note l09-hint" id="l03-hint" hidden></div>
    <p class="small" id="l03-saveHint">Lưu cục bộ, không gửi nội dung lên dịch vụ AI.</p>
    <div class="action-row"><button type="button" class="action" id="l03-submit">Nộp bài</button><button type="button" class="action alt" id="l03-clear">Xóa bản nháp</button></div>
    <p class="small" id="l03-submissionStatus" role="status" aria-live="polite"></p>
    <div class="state-note l09-answer" id="l03-answerBox" hidden>
     <div class="kicker" id="l03-answerTitle">ĐÁP ÁN MẪU · SAU KHI NỘP</div>
     <p id="l03-answer"></p><p id="l03-answerNote"></p>
    </div>
   </article>
   <article class="surface" id="l03-rubric">
    <div class="kicker" id="l03-rubricKicker">VI · ĐỐI CHIẾU</div><h2 id="l03-rubricTitle">Rubric tự đánh giá</h2>
    <p id="l03-rubricLead"></p>
    <div class="state-note l09-lock" id="l03-rubricGate">Nộp bài trước để đối chiếu.</div>
    <div class="l09-review" id="l03-rubricArea" hidden>
     <div id="l03-rubricRows"></div>
     <div class="section-rule"></div><div class="kicker" id="l03-scoreLabel">Điểm tự đánh giá</div><p class="l09-score" id="l03-score">— / 8</p>
     <div class="action-row"><button type="button" class="action" id="l03-saveReview">Lưu tự đánh giá</button></div>
    </div>
   </article>
   <article class="surface" id="l03-sources">
    <div class="kicker" id="l03-sourcesKicker">VII · ĐỌC SÂU</div><h2 id="l03-sourcesTitle">Nguồn đọc thêm</h2>
    <p id="l03-sourcesLead"></p><div class="l09-sources" id="l03-sourcesList"></div>
    <div class="section-rule"></div><div class="kicker" id="l03-queriesTitle">Tự tìm hiểu thêm</div>
    <div class="l09-keywords" id="l03-queries"></div>
    <div class="action-row">
     <button class="action" type="button" id="l03-allPrompt">Copy prompt tổng hợp</button>
     <a class="action alt" id="l03-openChat" target="_blank" rel="noopener noreferrer" href="https://chatgpt.com/">Mở ChatGPT ↗</a>
    </div>
    <div class="state-note l09-source-note" id="l03-sourceNote"></div>
   </article>
  </div>
  <aside class="surface tinted l09-sidebar" aria-label="Lesson progress and Lão Lý">
   <div class="kicker" id="l03-sidebarTitle">HÀNH TRÌNH BÀI HỌC</div><h2 id="l03-sidebarLead">Open Questions & Interview Bias</h2>
   <span class="status-chip" id="l03-progress">Chưa hoàn thành lượt tự đánh giá</span>
   <div class="l09-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" aria-label="Self-review progress" id="l03-progressBar"><span id="l03-progressFill"></span></div>
   <nav class="l09-index" id="l03-index" aria-label="Bài học / Lesson sections"></nav>
   <div class="section-rule"></div>
   <div class="kicker">LÃO LÝ ĐỌC CÙNG NGƯƠI</div>
   <p class="small" id="l03-mentor-stage" data-lesson-mentor-stage="1">Lão đang chọn câu hỏi theo mục học.</p>
   <div class="action-row"><button type="button" class="action alt" data-buddy="1">Hỏi Lão Lý theo mục học</button></div>
   <p class="small" id="l03-sidebarExtra"></p>
   <div class="action-row"><button type="button" class="action alt" data-page="guide" id="l03-sidebarGuide">Thần Chú</button><button type="button" class="action alt" data-page="catalog" id="l03-sidebarCatalog">Tàng Thư</button></div>
  </aside>
 </div>
 </div>
 <div id="l03-live" role="status" class="state-note" aria-live="polite" hidden></div>
</section>`;
anchor.insertAdjacentHTML("beforebegin",page);
const match=Array.from(catalog.querySelectorAll("article")).find(x=>x.querySelector("h2")?.textContent.trim()==="UX Research");
if(match){
 const b=match.querySelector("button[data-page]");if(b){b.dataset.page="lessonL03";b.textContent="Vào bài Interview Bias";}
 const chip=match.querySelector(".status-chip");if(chip)chip.textContent="L03-1-2 · VI/EN";
}
if(new URLSearchParams(window.location.search).get("lesson")==="L03-1-2"&&typeof navigate==="function")navigate("lessonL03",{focus:true});
})();