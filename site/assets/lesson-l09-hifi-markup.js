/* Inserts L09 content into li.'s native Tàng Thư -> Page, and Tủ Riêng Continue.
   This is NOT a second app shell: native page/surface/action/route design is preserved. */
(()=>{
"use strict";
const main=document.getElementById("main"),catalog=document.querySelector("#page-catalog .surface-grid"),library=document.querySelector("#page-library .stack-sm");
const after=document.getElementById("page-case");
if(!main||!after||!catalog||!library||document.getElementById("page-lessonL09"))return;
const page=String.raw`
<section id="page-lessonL09" class="page" tabindex="-1" aria-labelledby="l09-title" data-lesson-id="L09-1-2" data-companion-manifest="./lessons/companion/L09-1-2.json">
<div class="section-shell">
 <div class="kicker">TOÁN HỌC / DATA SCIENCE · DATA & STATISTICAL FOUNDATIONS · L09-1-2</div>
 <h1 class="display-title" id="l09-title">Sampling Bias · Sai lệch chọn mẫu</h1>
 <p class="intro" id="l09-intro">Một ngàn người trả lời. Có chắc kết luận nói được về tất cả mọi người?</p>
 <div class="l09-hero-tools">
  <button type="button" class="action alt" data-page="catalog" id="l09-back">Về Tàng Thư</button>
  <span class="status-chip" id="l09-status">Wave 1A · Bài đã duyệt nội dung, đang kiểm thử</span>
  <div class="l09-lang-switch" role="group" aria-label="Ngôn ngữ nội dung / Lesson language">
   <button type="button" class="action alt" id="l09-vi" aria-pressed="true">VI</button>
   <button type="button" class="action alt" id="l09-en" aria-pressed="false">EN</button>
  </div>
 </div>
 <div class="editorial-grid">
 <div class="stack-sm l09-stack">
  <article class="surface" id="l09-goals">
   <div class="kicker" id="l09-goalLabel">I · CHỦ ĐÍCH</div><h2 id="l09-goalsTitle">Mục tiêu bài học</h2>
   <ul class="l09-goal-list" aria-label="Learning goals"></ul>
  </article>
  <article class="surface" id="l09-concept">
   <div class="kicker" id="l09-theoryKicker">II · HIỂU ĐIỀU CỐT LÕI</div><h2 id="l09-theoryTitle">1.000 câu trả lời có đủ tin chưa?</h2>
   <p id="l09-theoryLead"></p>
   <div class="l09-stats" id="l09-stats">
    <div class="path-item"><strong>1.000</strong><span class="l09-stat-desc">thành viên hội chạy bộ</span></div>
    <div class="path-item"><strong>82%</strong><span class="l09-stat-desc">trả lời chạy ≥3 buổi/tuần</span></div>
    <div class="path-item"><strong>?</strong><span class="l09-stat-desc">có suy ra toàn dân?</span></div>
   </div>
   <ul class="l09-points" id="l09-defs"></ul>
   <div class="l09-compare">
    <div class="path-item"><b id="l09-biasTitle">Sampling bias</b><p id="l09-biasText"></p></div>
    <div class="path-item"><b id="l09-variationTitle">Random sampling variation</b><p id="l09-variationText"></p></div>
   </div>
   <div class="state-note" id="l09-limit"></div>
  </article>
  <article class="surface" id="l09-illustrations">
   <div class="kicker" id="l09-figKicker">III · NHÌN BẰNG HÌNH</div><h2 id="l09-figTitle">Thử nhìn xem mẫu đại diện cho ai</h2>
   <div class="l09-figures">
    <figure class="l09-figure">
     <img id="l09-imgOne" loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/b/bf/Simple_random_sampling.PNG" alt="Simple random sampling from a population" width="618" height="476">
     <p class="l09-img-fallback" id="l09-imgFallbackOne"><a href="https://commons.wikimedia.org/wiki/File:Simple_random_sampling.PNG" target="_blank" rel="noopener noreferrer">Mở hình gốc / Open image ↗</a></p>
     <figcaption><strong id="l09-fig1">Rút mẫu ngẫu nhiên đơn</strong><p class="small" id="l09-fig1Note"></p><a href="https://commons.wikimedia.org/wiki/File:Simple_random_sampling.PNG" target="_blank" rel="noopener noreferrer">Dan Kernler · CC BY-SA 4.0 · Wikimedia Commons ↗</a></figcaption>
    </figure>
    <figure class="l09-figure">
     <img id="l09-imgTwo" loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/a/a7/Statistical_bias_and_statistical_noise_illustration_No_text_in_image.png" alt="Statistical bias and random variation target-chart analogy" width="764" height="852">
     <p class="l09-img-fallback" id="l09-imgFallbackTwo"><a href="https://commons.wikimedia.org/wiki/File:Statistical_bias_and_statistical_noise_illustration_No_text_in_image.png" target="_blank" rel="noopener noreferrer">Mở hình gốc / Open image ↗</a></p>
     <figcaption><strong id="l09-fig2">Bias và nhiễu ngẫu nhiên</strong><p class="small" id="l09-fig2Note"></p><a href="https://commons.wikimedia.org/wiki/File:Statistical_bias_and_statistical_noise_illustration_No_text_in_image.png" target="_blank" rel="noopener noreferrer">Tim Isaksson · CC BY-SA 4.0 · Wikimedia Commons ↗</a></figcaption>
    </figure>
   </div>
  </article>
  <article class="surface tinted" id="l09-guided">
   <div class="kicker" id="l09-exKicker">IV · THỬ TỰ GIẢI THÍCH</div><h2 id="l09-exTitle">400/500 người thích nhắc học?</h2>
   <p id="l09-exBody"></p><div class="state-note" id="l09-exQuestion"></div>
   <div class="l09-q-row l09-guided-entry">
    <label id="l09-guidedLabel" for="l09-guidedDraft">Thử giải thích bằng lời của bạn</label>
    <textarea id="l09-guidedDraft" class="text-editor" rows="4" placeholder="Viết suy luận của bạn ở đây..."></textarea>
    <p class="small l09-status-line" id="l09-guidedSaveNote">Câu trả lời ví dụ được lưu riêng, không tính điểm.</p>
   </div>
   <div class="action-row"><button type="button" class="action alt" id="l09-guidedToggle" aria-expanded="false" aria-controls="l09-guidedHint">Xem gợi ý phân tích</button></div>
   <div class="state-note l09-hint" id="l09-guidedHint" hidden></div>
  </article>
  <article class="surface" id="l09-challenge">
   <div class="kicker" id="l09-challengeKicker">V · THỬ SỨC ĐỘC LẬP</div><h2 id="l09-challengeTitle">Khảo sát banner trong app tài chính</h2>
   <p id="l09-caseText"></p><div class="state-note" id="l09-caseClaim"></div>
   <div id="l09-questions"></div>
   <div class="action-row"><button type="button" class="action alt" id="l09-hintButton">Gợi ý một chút</button><span class="small" id="l09-assistStatus"></span></div>
   <div class="state-note l09-hint" id="l09-hint" hidden></div>
   <p class="small l09-status-line" id="l09-saveHint">Tự lưu câu trả lời trên thiết bị.</p>
   <div class="action-row"><button type="button" class="action" id="l09-submit">Nộp lượt làm bài</button><button type="button" class="action alt" id="l09-clear">Xóa bản nháp</button></div>
   <p id="l09-submissionStatus" class="small l09-status-line" role="status" aria-live="polite"></p>
   <div id="l09-answerBox" class="l09-answer state-note" hidden>
    <div class="kicker" id="l09-answerTitle">ĐÁP ÁN THAM KHẢO</div><p id="l09-answer"></p><p id="l09-answerCaution"></p>
   </div>
  </article>
  <article class="surface" id="l09-rubric">
   <div class="kicker" id="l09-rubricKicker">VI · ĐỐI CHIẾU</div><h2 id="l09-rubricTitle">Tự chấm bằng tiêu chí rõ ràng</h2><p id="l09-rubricLead"></p>
   <div class="state-note l09-lock" id="l09-rubricGate">Nộp bài trước để xem rubric.</div>
   <div class="l09-review" id="l09-rubricArea" hidden><div id="l09-rubricRows"></div><div class="section-rule"></div>
    <div class="kicker" id="l09-scoreLabel">Tổng điểm tự đánh giá</div><p class="l09-score" id="l09-score">— / 8</p>
    <div class="action-row"><button type="button" class="action" id="l09-saveReview">Lưu đánh giá &amp; hoàn tất</button></div>
   </div>
  </article>
  <article class="surface" id="l09-sources">
   <div class="kicker" id="l09-sourcesKicker">VII · ĐÀO SÂU</div><h2 id="l09-sourcesTitle">Đọc thêm từ nguồn chính</h2>
   <p id="l09-sourcesLead"></p><div id="l09-sourcesList" class="l09-sources"></div>
   <div class="section-rule"></div><div class="kicker" id="l09-queriesTitle">Gợi ý tìm kiếm</div><div id="l09-queries" class="l09-keywords"></div>
   <div class="action-row l09-quick">
    <button type="button" class="action" id="l09-allPrompt">Copy prompt đối chiếu 4 nguồn</button>
    <a href="https://chatgpt.com/" class="action alt" target="_blank" rel="noopener noreferrer" id="l09-openChat">Mở ChatGPT</a>
   </div>
   <div class="state-note" id="l09-sourceNote" style="margin-top:18px"></div>
  </article>
 </div>
 <aside class="surface tinted l09-sidebar" aria-label="Lesson progress and navigation">
  <div class="kicker" id="l09-sidebarTitle">LỘ TRÌNH BÀI HỌC</div><h2 id="l09-sidebarLead">Bài học · Data Science</h2>
  <span class="status-chip" id="l09-progress">Chưa hoàn tất lượt tự đánh giá</span>
  <div class="l09-progress-bar" role="progressbar" aria-label="Review progress" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" id="l09-progressBar"><span id="l09-progressFill"></span></div>
  <nav class="l09-index" id="l09-index" aria-label="Lesson sections"></nav>
  <div class="section-rule"></div>
  <div class="kicker">LÃO LÝ ĐỌC CÙNG NGƯƠI</div>
  <p class="small l09-status-line" id="li-lesson-mentor-stage">Lão đang theo dõi mục học hiện tại để đặt câu hỏi phù hợp.</p>
  <div class="action-row"><button type="button" class="action alt" data-buddy="1">Hỏi Lão Lý theo mục đang học</button></div>
  <p class="small l09-status-line" id="l09-sidebarExtra">Giao diện Hi-Fi của li.; nội dung học thuật vẫn đang trong vòng kiểm thử.</p>
  <div class="action-row"><button type="button" class="action alt" data-page="guide" id="l09-sidebarMethods">Xem Thần Chú</button><button type="button" class="action alt" data-page="catalog" id="l09-sidebarCatalog">Về Tàng Thư</button></div>
 </aside>
 </div>
</div>
<div class="state-note" id="l09-live" hidden role="status" aria-live="polite"></div>
</section>
`;
after.insertAdjacentHTML("beforebegin",page);
const card=document.createElement("article");
card.className="surface tinted";
card.id="li-l09-catalog-entry";
card.innerHTML=`<div class="folio-art"></div><div class="kicker">TOÁN HỌC · DATA SCIENCE</div><h2>Data Science</h2><p>Data &amp; Statistical Foundations · Sampling Bias vs Random Variation.</p><span class="status-chip">Bài L09-1-2 · VI/EN</span><div class="action-row"><button type="button" class="action" data-page="lessonL09">Vào bài học</button></div>`;
const third=catalog.children[2];if(third)catalog.insertBefore(card,third);else catalog.appendChild(card);
const shelf=document.createElement("article");
shelf.className="surface";shelf.id="li-l09-library-entry";
shelf.innerHTML=`<div class="kicker">TIẾP TỤC HỌC · DATA SCIENCE</div><h2>Sampling Bias</h2><p>Data &amp; Statistical Foundations · L09-1-2 · VI/EN</p><span class="status-chip" id="li-l09-resume-status">Đang học</span><div class="action-row"><button type="button" class="action" data-page="lessonL09" id="l09-resume">Mở tiếp bài Sampling Bias</button></div>`;
library.prepend(shelf);
const openL09=new URLSearchParams(window.location.search).get("lesson")==="L09-1-2" || window.location.hash==="#l09-goals";
 if(openL09&&typeof navigate==="function"){navigate("lessonL09",{focus:true});}
})();