import test from 'node:test';
import assert from 'node:assert/strict';
import { exportLearnerFromNotion, hashNotionBody, ExportDenied } from './learner-export.mjs';
const id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const cases = [
  ['F15', '## VI · Phần bổ sung cho người học (chưa xuất bản)', '## EN · Self-contained learner supplement (NOT released)', '## Source and uncertainty boundary'],
  ['F04Q', '# VI · Tin nhắn đến nơi chưa chắc tác vụ chỉ chạy một lần', '# EN · Reliability is not “the message was received once”', '<b>Editorial release gates:'],
  ['F09W', '# VI · Dữ liệu bẩn không tự sạch nhờ một câu SQL đẹp', '# EN · A neat SQL query cannot repair an undefined dataset', '<b>Editorial OPEN gates:'],
  ['F04HTTP', '# TIẾNG VIỆT · BÀI HỌC CHO NGƯỜI HỌC', '# ENGLISH · COMPLETE LEARNER LESSON', '<b>Editorial footer / NOT learner UI:'],
  ['F05GEN', '# TIẾNG VIỆT · BÀI HỌC CHO NGƯỜI HỌC', '# ENGLISH · COMPLETE LEARNER LESSON', '<b>Editorial footer / NOT learner UI:'],
];
const filler = x => `${x} `.repeat(110);
const raw = (s, sourceId=id) => `Notion fetched at 2026-11-20\n<page url="https://app.notion.com/p/${sourceId}">\n<ancestor-path>secret</ancestor-path>\n<content>\n${s}\n</content>\n</page>`;
const mk = ([key,vi,en,end], leak='') => {
  let body=`${vi}\n${filler('Tài-liệu')}\n${en}\n${filler('Learner-body')}\n${leak}\n${end.startsWith('#')?end:`${end}</b> internal editor only`}\nNot public`;
  const manifest = {[id]:{version:`${key}:v0.1`,sha256:hashNotionBody(body),viStart:vi,enStart:en,end,minimumLocaleChars:300,forbiddenFingerprints:['solved ledger: 110 = 105 + 5']}};
  return {body,manifest};
};
const run=(c,leak='',extra={})=>{const v=mk(c,leak);return exportLearnerFromNotion({sourceId:extra.sourceId??id,rawNotionFetch:extra.raw??raw(v.body),manifest:extra.manifest??v.manifest})};
for(const c of cases){test(`live Notion heading shape accepts ${c[0]}`,()=>{const x=run(c,c[0]==='F09W'?'Do not disclose independent answers in this learner manuscript.':'');assert.ok(x.languages.vi.length>300&&x.languages.en.length>300);assert.equal(x.published,false);assert.ok(!JSON.stringify(x).includes('internal editor only'));});}
const neg=[
 ['key URL', 'https://app.notion.com/p/12345678901234567890123456789012'],
 ['entity encoded URL', 'https://app&amp;#46;notion&amp;#46;com/p/12345678901234567890123456789012'],
 ['double percent encoding', 'https%253A%252F%252Fapp%252Enotion%252Ecom%252Fp%252F12345678901234567890123456789012'],
 ['key label','teacher ledger'],
 ['independent answer', 'Independent answer: 110'],
 ['known fingerprint','solved ledger: 110 = 105 + 5'],
 ['unsafe tag','<iframe src="https://x.invalid"></iframe>'],
 ['onerror','<img onerror=alert(1)>'],
];
for(const [name,leak] of neg){test(`deny ${name}`,()=>assert.throws(()=>run(cases[0],leak),ExportDenied));}
test('deny modified revision',()=>{const v=mk(cases[0]);v.manifest[id].sha256='0'.repeat(64);assert.throws(()=>run(cases[0],'',{manifest:v.manifest}),/SOURCE_REVISION_CHANGED/);});
test('deny source page mismatch',()=>{const v=mk(cases[0]);assert.throws(()=>run(cases[0],'',{raw:raw(v.body,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')}),/SOURCE_PAGE_ID_MISMATCH/);});
test('deny wrong boundary',()=>{const v=mk(cases[0]);v.manifest[id].enStart='## Not part of source';assert.throws(()=>run(cases[0],'',{manifest:v.manifest}),/HEADER_MISSING_OR_DUPLICATED/);});
