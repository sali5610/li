/* Regression: all pre-existing Home shell text/ARIA paired VI/EN, plus authored
   contextual and quote coverage. Static audit is not real-device localization QA. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const index=read("site/index.html"),runtime=read("site/assets/app-language.js");
const extraSrc=read("site/assets/app-language-legacy.js");
const sandbox={window:{}};
vm.runInNewContext(extraSrc,sandbox,{filename:"app-language-legacy.js"});
const translations=sandbox.window.LI_LEGACY_EN;
assert(translations&&Object.keys(translations).length>800,"Legacy VI/EN ledger is missing");
const old=new Map([...runtime.matchAll(/"([^"]+)":"([^"]+)"/g)].map(m=>[m[1],m[2]]));
const paired=k=>(Object.hasOwn(translations,k)&&String(translations[k]).trim())||(old.has(k)&&old.get(k).trim());
const stripped=index.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"")
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"")
 .replace(/<!--[\s\S]*?-->/g,"");
const visible=[...new Set([...stripped.matchAll(/>([^<>]+)</g)].map(m=>m[1].replace(/&[a-z]+;/g," ").replace(/\s+/g," ").trim())
 .filter(x=>x.length>1&&/[A-Za-zÀ-ỹ]/u.test(x)))];
const accessibility=[...new Set([...stripped.matchAll(/\b(?:aria-label|placeholder|title|alt)="([^"]+)"/g)].map(m=>m[1]))];
const unmatchedVisible=visible.filter(x=>x!=="理 · li. — Thư viện tri thức"&&!paired(x));
const unmatchedAttrs=accessibility.filter(x=>!paired(x));
assert.deepEqual(unmatchedVisible,[],"Unpaired static UI copy: "+unmatchedVisible.join("; "));
assert.deepEqual(unmatchedAttrs,[],"Unpaired accessibility/tooltip copy: "+unmatchedAttrs.join("; "));
assert(index.indexOf("assets/app-language-legacy.js")<index.indexOf("assets/app-language.js"),"Load authored copy before app runtime");
assert(runtime.includes('Object.assign(TEXT,window.LI_LEGACY_EN||{})'),"Runtime must consume authored EN ledger");
assert(runtime.includes('"alt"'),"Image descriptions must follow locale");
for(const phrase of [
 "Hôm nay cơ thể ra sao?","Không thể đọc/ghi lịch. Đã dừng ghi để tránh mất dữ liệu.",
 "Nhóm UX chỉ khảo sát người đang dùng sản phẩm. Từ 90% phản hồi tích cực, họ kết luận: “Ai cũng muốn tính năng này”.",
 "Selection bias là thiên lệch xuất phát từ cách chọn người tham gia: nhóm bị bỏ sót có thể khác nhóm được hỏi. Một banner chỉ hiện cho người đang dùng app không hỏi được người đã rời app.",
 "Ý đã nhặt chỉ lưu trên thiết bị khi ngươi bấm Lưu. Nếu lưu lỗi, app sẽ báo rõ; lão không nhận vơ."
])assert(paired(phrase),"Missing cross-feature copy: "+phrase);
/* Every canonical VI spell remains paired with an English fantasy display name.
   Academic method identity, T13 ordering and filter keys must stay untouched. */
const entries=JSON.parse(index.match(/const methods=(\[[\s\S]*?\]);\s*const categories=/)[1]);
const schools=JSON.parse(index.match(/const categories=(\[[\s\S]*?\]);\s*const STUDY_MODE_KEY=/)[1]);
assert.equal(entries.length,13,"Exactly thirteen canonical spells");
assert.deepEqual(entries.slice(0,3).map(row=>row[0]),["T01","T02","T13"],"T13 remains directly after T02");
assert.equal(new Set(entries.map(row=>row[0])).size,13,"All spell IDs stay stable");
for(const [id,spell,academic,purpose,school] of entries){
 assert(translations[spell]&&translations[spell]!==spell,"Untranslated fantasy spell name "+id+" "+spell);
 assert(translations[school]&&translations[school]!==school,"Untranslated magic school "+school);
 assert(academic.includes(" / ")||academic.length>=12,"Original academic name missing "+id);
 assert(translations[purpose]&&translations[purpose]!==purpose,"Missing truthful EN purpose "+id);
}
assert.equal(schools.length,6,"All + five spell schools");
assert.equal(new Set(schools.slice(1).map(k=>translations[k])).size,5,"Five distinct English spell schools");
assert(runtime.includes('"Thần Chú":"Spells"'),"Spell navigation must not read Techniques");
assert(runtime.includes('"Sổ Tay Thần Chú":"The Spellbook"'),"English Guide should feel like a spellbook");
assert(index.includes('window.LI_LEGACY_EN?.[m[1]]'),"Search by English spell name is required");
assert(index.includes('function paintMethodDetail(id)'),"Detail name and school must be localized");
/* Dynamic user-facing copy needs a fully authored EN rendering, not merely
   a placeholder global locale preference. Do not translate learner-owned notes. */
for(const phrase of [
 "Chế độ của thần chú","Chú giải","Thử thi triển",
 "Hai phân loại đúng.","Hãy nhìn lại dấu hiệu chọn mẫu.",
 "Đã tách đúng hai câu hỏi.","Một đáp án cần xem lại.",
 "B là nguồn tốt hơn cho câu hỏi hẹp này.",
 "Hãy kiểm tra lại provenance và cơ chế chọn người.",
 "T03 phù hợp cho thủ tục mới.","Chưa có lần học trước nên T02 không phù hợp ngay.",
 "Bạn chọn hai dữ kiện quan trọng, không chọn khẳng định quá mức.",
 "Dữ kiện không có nhóm so sánh và khuyến mãi đồng thời đều quan trọng."
])assert(paired(phrase),"Missing dynamic exercise copy: "+phrase);
assert(read("site/assets/laoly-context-s112.js").includes("methodSearchBlob(m)"),"Mentor search must match English spell aliases");
assert(read("site/assets/laoly-context-s112.js").includes("methodDisplayName(m)"),"Mentor must refer to localized spell identities");
assert(read("site/assets/spell-practice.js").includes("feedbackMarkup(feedback)"),"Composite practice feedback must preserve separately translated clauses");
assert(read("site/assets/library-hub.js").includes("lessonStatusText(info)"),"Library lesson statuses must be locale-aware");
assert(read("site/assets/library-hub.js").includes("item.title).dataset.liNoTranslate"),"Stored case titles must not be silently translated");
assert(read("site/assets/library-note-editor.js").includes("const ui=(vi,en)"),"Saved case provenance requires authored bilingual UI");
/* S77 proper-name localization. Do not freeze the Vietnamese narrator's
   name in EN or alter the VI source; alternate names remain editorial choices. */
assert.equal(translations["Lão Lý"],"Elder Li","English identity must be Elder Li");
assert.equal(translations["LÃO LÝ"],"ELDER LI","Uppercase mentor identity needs an English form");
const voice=Object.values(translations);
for(const phrase of [
 "A NOTE FROM ELDER LI","A WHISPER FROM ELDER LI",
 "Hmm. A question worth waking from a century of slumber for.",
 "Even an elder must yield when the evidence wins.",
 "Ah, seeking the deeper shelves? Thirteen spells await."
])assert(voice.some(value=>value.includes(phrase)),
 "Missing storybook EN character voice: "+phrase);
assert(!voice.some(value=>value.includes("Old Li")),"Old Li must not appear in English");

for(const [vi,en] of Object.entries(translations)){
 assert(!en.includes("Lão Lý"),"Untranslated mentor name in English copy: "+vi);
}
const coreEnglishValues=[...runtime.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)":"([^"\\]*(?:\\.[^"\\]*)*)"/g)].map(m=>m[2]);
assert(!coreEnglishValues.some(value=>value.includes("Lão Lý")),"Core UI English must not keep the Vietnamese companion name");
for(const key of ["Lão hỏi ngược","Phản biện lão","Lão quên gì rồi?","Trò chuyện với Lão Lý","Lời Lão Lý về nhịp học","Lão Lý ngái ngủ"]){
 assert(translations[key]?.includes("Elder Li"),"Missing authored EN mentor alias in "+key);
}
/* Compile the browser fixture itself: a previous test edit accidentally
   reused a lexical name, leaving browser QA pending instead of executing. */
const browserFixtureScripts=[...read("tools/i18n_browser_fixture.html").matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
assert(browserFixtureScripts.length>=2,"Real-app bilingual fixture scripts are missing");
for(const [i,entry] of browserFixtureScripts.entries()){
 assert.doesNotThrow(()=>new Function(entry[1]),"Bilingual browser fixture syntax error in script "+i);
}
/* User-reported iPhone bilingual leaks: composite deep-course statuses and
   T01's dynamically concatenated mode label must have their own localized DOM. */
const deepCatalog=read("site/assets/catalog-drilldown.js");
const practice=read("site/assets/spell-practice.js");
const draggable=read("site/assets/laoly-drag.js");
assert(deepCatalog.includes('copy("Đã phát hành","Published")'),"Deep published status must be EN-aware");
assert(deepCatalog.includes('copy("Đề cương · chưa phát hành","Outline · not published")'),"Deep outline status must be EN-aware");
assert(deepCatalog.includes('window.scrollTo?.({top:0,left:0,behavior:"instant"})'),"Catalog drilldown must reset scroll instantly despite global smooth-scroll, so the sticky header does not clip content");
assert(deepCatalog.includes('finally{localize(host);}'),"Every catalog depth must get translation, not only the root view");
assert(practice.includes(" · <span>THỬ THI TRIỂN</span>"),"Practice mode must be an independently translatable node");
assert(practice.includes("window.liLanguage?.apply?.(root)"),"Practice rerenders must apply app locale");
assert(draggable.includes("nudgeAwayFromPriorityUI(b)"),"Persisted mascot position must dodge essential study controls");
const quotes=read("site/assets/laoly-quotes-s121.js");
const vi=JSON.parse(quotes.match(/const QUOTES=(\[[\s\S]*?\]);/)[1]);
const en=JSON.parse(quotes.match(/const QUOTES_EN=(\{[\s\S]*?\});/)[1]);
assert.equal(vi.length,24,"Canonical scholarly quote list changed");
assert.equal(Object.keys(en).length,vi.length,"Every quote requires an EN edition");
for(const q of vi){
 assert(q.original&&q.url&&q.lang,"Original-language quotation/source must stay intact");
 for(const key of ["gloss","translation","interpretation","comment","meta"])
  assert(en[q.id]?.[key]?.trim(),"Missing "+q.id+" EN "+key);
}
assert(quotes.includes('window.liLanguage?.get?.()==="en"'),"Quotations must be rendered in app locale");
console.log("PASS UX-CONTENT: "+visible.length+" static strings; "+accessibility.length+" attributes; "+Object.keys(translations).length+" authored VI/EN legacy mappings; "+vi.length+" bilingual quote records.");
