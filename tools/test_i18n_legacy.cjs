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
