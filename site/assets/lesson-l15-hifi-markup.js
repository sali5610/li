/* Native Hi-Fi L15-2-2: mounts existing li. components, no standalone draft layout. */
(()=>{
"use strict";
const anchor=document.getElementById("page-case"),catalog=document.querySelector("#page-catalog .surface-grid");
if(!anchor||!catalog||document.getElementById("page-lessonL15"))return;
const page=String.raw`
<section id="page-lessonL15" class="page" tabindex="-1" aria-labelledby="l15-title" data-lesson-id="L15-2-2" data-companion-manifest="./lessons/companion/L15-2-2.json">
 <div class="section-shell">
 <div class="kicker">BUSINESS · SUPPLY CHAIN · PLANNING, INVENTORY & VISIBILITY · L15-2-2</div>
 <h1 class="display-title" id="l15-title">Reorder Points & Safety Stock</h1>
 <p class="intro" id="l15-intro">Ngưỡng đặt hàng không phải số lượng đặt hàng.</p>
 <div class="l09-hero-tools">
  <button class="action alt" type="button" data-page="catalog" id="l15-back">Về Tàng Thư</button>
  <span class="status-chip" id="l15-status">Wave 1 · Content locked / UI in review</span>
  <div class="l09-lang-switch" role="group" aria-label="Ngôn ngữ bài học / Lesson language">
   <button type="button" class="action alt" id="l15-vi" aria-pressed="true">VI</button>
   <button type="button" class="action alt" id="l15-en" aria-pressed="false">EN</button>
  </div>
 </div>
 <div class="editorial-grid">
  <div class="stack-sm l09-stack">
   <article class="surface" id="l15-goals">
    <div class="kicker" id="l15-goalsKicker">I · MỤC TIÊU</div><h2 id="l15-goalsTitle">Mục tiêu bài học</h2>
    <ul class="l09-goal-list" id="l15-goalsList"></ul>
   </article>
   <article class="surface" id="l15-concept">
    <div class="kicker" id="l15-conceptKicker">II · HIỂU ĐIỀU CỐT LÕI</div><h2 id="l15-conceptTitle">Hiểu bản chất</h2>
    <p id="l15-conceptText"></p><ul class="l09-points" id="l15-conceptList"></ul>
    <div class="l09-compare">
     <div class="path-item"><b id="l15-compareTitle1"></b><p id="l15-compareText1"></p></div>
     <div class="path-item"><b id="l15-compareTitle2"></b><p id="l15-compareText2"></p></div>
    </div>
    <div class="state-note" id="l15-conceptNote"></div>
   </article>
   <article class="surface" id="l15-visuals">
    <div class="kicker" id="l15-visualKicker">III · MINH HOẠ BẰNG NGUỒN THẬT</div><h2 id="l15-visualTitle">Điểm đặt hàng và tồn kho an toàn</h2>
    <figure class="l09-figure">
     <img id="l15-visualImg" loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Inventory_control_-_reorder_point_and_service_level.png" alt="Điểm đặt hàng và tồn kho an toàn" width="450" height="334">
     <p class="l09-img-fallback" id="l15-visualFallback"><a href="https://commons.wikimedia.org/wiki/File:Inventory_control_-_reorder_point_and_service_level.png" target="_blank" rel="noopener noreferrer">Mở ảnh nguồn nếu hình không tải ↗</a></p>
     <figcaption><strong id="l15-visualCaption"></strong><p class="small" id="l15-visualNote"></p><a href="https://commons.wikimedia.org/wiki/File:Inventory_control_-_reorder_point_and_service_level.png" target="_blank" rel="noopener noreferrer">Poul G · Public Domain · Wikimedia Commons ↗</a></figcaption>
    </figure>
   </article>
   <article class="surface tinted" id="l15-guided">
    <div class="kicker" id="l15-guidedKicker">IV · THỬ TỰ GIẢI THÍCH</div><h2 id="l15-guidedTitle">Ví dụ có hướng dẫn</h2>
    <p id="l15-guidedText"></p>
    <div class="state-note" id="l15-guidedQuestion"></div>
    <div class="l09-q-row">
     <label for="l15-guidedDraft" id="l15-guidedLabel">Tự giải thích bằng lời của bạn</label>
     <textarea id="l15-guidedDraft" class="text-editor" rows="4"></textarea>
     <p class="small" id="l15-guidedSave">Không tính điểm · lưu trên thiết bị.</p>
    </div>
    <div class="action-row"><button type="button" class="action alt" id="l15-guidedToggle" aria-expanded="false" aria-controls="l15-guidedHint">Xem gợi ý phân tích</button></div>
    <div class="state-note l09-hint" id="l15-guidedHint" hidden></div>
   </article>
   <article class="surface" id="l15-challenge">
    <div class="kicker" id="l15-challengeKicker">V · BÀI TẬP ĐỘC LẬP</div><h2 id="l15-challengeTitle">Tự làm bài</h2>
    <p id="l15-challengeText"></p><div class="state-note" id="l15-challengeClaim"></div>
    <div id="l15-questions"></div>
    <div class="action-row"><button type="button" class="action alt" id="l15-hintButton">Xem gợi ý</button><span class="small" id="l15-assistStatus"></span></div>
    <div class="state-note l09-hint" id="l15-hint" hidden></div>
    <p class="small" id="l15-saveHint">Lưu cục bộ, không gửi nội dung lên dịch vụ AI.</p>
    <div class="action-row"><button type="button" class="action" id="l15-submit">Nộp bài</button><button type="button" class="action alt" id="l15-clear">Xóa bản nháp</button></div>
    <p class="small" id="l15-submissionStatus" role="status" aria-live="polite"></p>
    <div class="state-note l09-answer" id="l15-answerBox" hidden>
     <div class="kicker" id="l15-answerTitle">ĐÁP ÁN MẪU · SAU KHI NỘP</div>
     <p id="l15-answer"></p><p id="l15-answerNote"></p>
    </div>
   </article>
   <article class="surface" id="l15-rubric">
    <div class="kicker" id="l15-rubricKicker">VI · ĐỐI CHIẾU</div><h2 id="l15-rubricTitle">Rubric tự đánh giá</h2>
    <p id="l15-rubricLead"></p>
    <div class="state-note l09-lock" id="l15-rubricGate">Nộp bài trước để đối chiếu.</div>
    <div class="l09-review" id="l15-rubricArea" hidden>
     <div id="l15-rubricRows"></div>
     <div class="section-rule"></div><div class="kicker" id="l15-scoreLabel">Điểm tự đánh giá</div><p class="l09-score" id="l15-score">— / 8</p>
     <div class="action-row"><button type="button" class="action" id="l15-saveReview">Lưu tự đánh giá</button></div>
    </div>
   </article>
   <article class="surface" id="l15-sources">
    <div class="kicker" id="l15-sourcesKicker">VII · ĐỌC SÂU</div><h2 id="l15-sourcesTitle">Nguồn đọc thêm</h2>
    <p id="l15-sourcesLead"></p><div class="l09-sources" id="l15-sourcesList"></div>
    <div class="section-rule"></div><div class="kicker" id="l15-queriesTitle">Tự tìm hiểu thêm</div>
    <div class="l09-keywords" id="l15-queries"></div>
    <div class="action-row">
     <button class="action" type="button" id="l15-allPrompt">Copy prompt tổng hợp</button>
     <a class="action alt" id="l15-openChat" target="_blank" rel="noopener noreferrer" href="https://chatgpt.com/">Mở ChatGPT ↗</a>
    </div>
    <div class="state-note l09-source-note" id="l15-sourceNote"></div>
   </article>
  </div>
  <aside class="surface tinted l09-sidebar" aria-label="Lesson progress and Lão Lý">
   <div class="kicker" id="l15-sidebarTitle">HÀNH TRÌNH BÀI HỌC</div><h2 id="l15-sidebarLead">Reorder Points & Safety Stock</h2>
   <span class="status-chip" id="l15-progress">Chưa hoàn thành lượt tự đánh giá</span>
   <div class="l09-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" aria-label="Self-review progress" id="l15-progressBar"><span id="l15-progressFill"></span></div>
   <nav class="l09-index" id="l15-index" aria-label="Bài học / Lesson sections"></nav>
   <div class="section-rule"></div>
   <div class="kicker">LÃO LÝ ĐỌC CÙNG NGƯƠI</div>
   <p class="small" id="l15-mentor-stage" data-lesson-mentor-stage="1">Lão đang chọn câu hỏi theo mục học.</p>
   <div class="action-row"><button type="button" class="action alt" data-buddy="1">Hỏi Lão Lý theo mục học</button></div>
   <p class="small" id="l15-sidebarExtra"></p>
   <div class="action-row"><button type="button" class="action alt" data-page="guide" id="l15-sidebarGuide">Thần Chú</button><button type="button" class="action alt" data-page="catalog" id="l15-sidebarCatalog">Tàng Thư</button></div>
  </aside>
 </div>
 </div>
 <div id="l15-live" role="status" class="state-note" aria-live="polite" hidden></div>
</section>`;
anchor.insertAdjacentHTML("beforebegin",page);
const match=Array.from(catalog.querySelectorAll("article")).find(x=>x.querySelector("h2")?.textContent.trim()==="Supply Chain");
if(match){
 const b=match.querySelector("button[data-page]");if(b){b.dataset.page="lessonL15";b.textContent="Vào bài Safety Stock";}
 const chip=match.querySelector(".status-chip");if(chip)chip.textContent="L15-2-2 · VI/EN";
}
if(new URLSearchParams(window.location.search).get("lesson")==="L15-2-2"&&typeof navigate==="function")navigate("lessonL15",{focus:true});
})();