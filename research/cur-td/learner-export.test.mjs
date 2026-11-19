import test from 'node:test';
import assert from 'node:assert/strict';
import { exportLearnerFromNotion, hashNotionBody, ExportDenied } from './learner-export.mjs';

const SOURCE = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const OTHER = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const VI = '## VI · Learner practice';
const EN = '## EN · Learner practice';
const END = '## Editorial boundary';
const filler = (word) => `${word} `.repeat(80);
const body = (vi = filler('tín-hiệu'), en = filler('stock-flow')) =>
  `${VI}\n${vi}\n${EN}\n${en}\n${END}\nEDITORIAL FOOTER DO NOT EXPORT`;
const envelope = (content, id = SOURCE) =>
  `Here is the result as of a volatile timestamp\n<page url="https://app.notion.com/p/${id}">\n<ancestor-path>ignore</ancestor-path>\n<content>\n${content}\n</content>\n</page>`;
const manifest = (content = body(), changes = {}) => ({
  [SOURCE]: { version: 'F15-LO1LO3-v0.1', sha256: hashNotionBody(content), viStart: VI,
    enStart: EN, end: END, minimumLocaleChars: 300,
    forbiddenFingerprints: ['solved ledger: 110 = 105 + 5'], ...changes },
});
const run = (content = body(), changes = {}, raw = envelope(content)) =>
  exportLearnerFromNotion({ sourceId: SOURCE, rawNotionFetch: raw, manifest: manifest(content, changes) });
const rejected = (fn, reason) => assert.throws(fn, (e) => e instanceof ExportDenied && (!reason || e.message.includes(reason)));

// Positive fixture is synthetic, never copied learner/teacher material from Notion.
test('accepts reviewed two-locale body and excludes source footer/ancestry', () => {
  const x = run();
  assert.match(x.languages.vi, /tín-hiệu/);
  assert.match(x.languages.en, /stock-flow/);
  assert.ok(!JSON.stringify(x).includes('EDITORIAL FOOTER'));
  assert.ok(!JSON.stringify(x).includes('ancestor-path'));
  assert.equal(x.published, false);
  assert.equal(x.researchOnly, true);
});
test('stable body digest ignores mutable fetch prefix', () => {
  const x = run(body(), {}, envelope(body()).replace('volatile timestamp', 'different timestamp'));
  assert.equal(x.version, 'F15-LO1LO3-v0.1');
});
test('rejects non-allowlisted source', () => rejected(() => exportLearnerFromNotion({
  sourceId: OTHER, rawNotionFetch: envelope(body(), OTHER), manifest: manifest() }), 'SOURCE_NOT_ALLOWLISTED'));
test('rejects source ID vs Notion page mismatch', () => rejected(() => run(body(), {}, envelope(body(), OTHER)), 'SOURCE_PAGE_ID_MISMATCH'));
test('rejects unpinned digest', () => rejected(() => run(body(), { sha256: '' }), 'UNPINNED_SOURCE'));
test('rejects unapproved source content revision', () => rejected(() => run(body(), { sha256: '0'.repeat(64) }), 'SOURCE_REVISION_CHANGED'));
test('rejects absent independent-answer fingerprint review', () => rejected(() => run(body(), { forbiddenFingerprints: [] }), 'NO_ANSWER_FINGERPRINT_REVIEW'));
test('rejects duplicate VI section', () => {
  const b = `${VI}\naccidental duplicate\n${body()}`;
  rejected(() => run(b), 'HEADER_MISSING_OR_DUPLICATED');
});
test('rejects missing EN section', () => {
  const b = body().replace(`${EN}\n`, '## Wrong locale\n');
  rejected(() => run(b), 'HEADER_MISSING_OR_DUPLICATED');
});
test('rejects reversed locale order', () => {
  const b = `${EN}\n${filler('stock-flow')}\n${VI}\n${filler('tín-hiệu')}\n${END}\nfooter`;
  rejected(() => run(b), 'LOCALE_BOUNDARY_ORDER');
});
test('rejects underlength locale even with valid digest', () => {
  const b = body('short', filler('valid'));
  rejected(() => run(b), 'LOCALE_INCOMPLETE');
});
for (const [title, injected] of [
  ['Notion teacher URL', 'https://app.notion.com/p/12345678901234567890123456789012'],
  ['HTML numeric-encoded Notion URL', 'https://app&#46;notion&#46;com/p/12345678901234567890123456789012'],
  ['teacher ledger phrase', 'teacher ledger'],
  ['VI answer reveal', '<b>ĐÁP ÁN MẪU</b>'],
  ['EN reference answer', '<b>REFERENCE SOLUTION</b>'],
  ['known solution fingerprint', 'solved ledger: 110 = 105 + 5'],
  ['JavaScript tag', '<script>alert(1)</script>'],
  ['iframe', '<iframe src="evil"></iframe>'],
  ['Notion page preview', '<link-preview url="https://x.test" />'],
  ['editor ancestry tag', '<ancestor-path>leak</ancestor-path>'],
  ['javascript protocol', '[click me](javascript:alert(1))'],
  ['html event handler', '<img src=x onerror=alert(1)>'],
]) {
  test(`rejects injected ${title}`, () => {
    const b = body(`${filler('tín-hiệu')}\n${injected}`);
    rejected(() => run(b), 'SPOILER_OR_UNSAFE_PAYLOAD');
  });
}
test('rejects missing wrapper', () => rejected(() => run(body(), {}, body()), 'SOURCE_PAGE_ID_MISMATCH'));
test('rejects duplicate content wrapper', () => {
  const b = envelope(body()).replace('</content>', '<content>\n</content>');
  rejected(() => run(body(), {}, b), 'PAGE_ENVELOPE');
});
test('rejects missing marker configuration', () => rejected(() => run(body(), { viStart: '## obsolete' }), 'HEADER_MISSING_OR_DUPLICATED'));
test('rejects hostile oversized source before parsing', () => rejected(() => run(body(), {}, 'x'.repeat(501000)), 'SOURCE_SIZE'));
