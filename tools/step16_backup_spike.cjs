'use strict';
/**
 * ADR-016 backup format SPIKE ONLY.
 * Works with fake in-memory storage. Never reads learner data.
 * Execute: node tools/step16_backup_spike.cjs
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const FIXED_KEYS = Object.freeze([
  'li.private.library.v1', 'li.private.case-draft.v1',
  'li.buddy-address.v1', 'li.study-mode.v1',
  'li.app.locale.v1', 'li.companion.position.v1',
  'li.private.lesson.visits.v1', 'li.private.problem.visits.v1',
  'li.personal.daily.v1', 'li.personal.daily.enabled.v1',
  'li.spell.t02.due.v1'
]);
const FIXED = new Set(FIXED_KEYS);
const LESSON_KEY = /^li\.review\.[A-Za-z0-9-]{1,64}\.v1$/;
const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const FORMAT = 'li-backup-spike';
const VERSION = 2;
const SOURCES = Object.freeze({
  'site/index.html': ['li.private.library.v1','li.private.case-draft.v1','li.buddy-address.v1','li.study-mode.v1'],
  'site/assets/app-language.js': ['li.app.locale.v1'],
  'site/assets/laoly-drag.js': ['li.companion.position.v1'],
  'site/assets/library-hub.js': ['li.private.lesson.visits.v1','li.private.problem.visits.v1','li.review.'],
  'site/assets/personal-diary.js': ['li.personal.daily.v1','li.personal.daily.enabled.v1'],
  'site/assets/spell-practice.js': ['li.spell.t02.due.v1'],
  'site/assets/lesson-wave1-core.js': ['li.review.']
});
function supportedKey(key) {
  return FIXED.has(key) || LESSON_KEY.test(key);
}
function byteSize(value) { return Buffer.byteLength(value, 'utf8'); }
function digest(records) {
  return crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');
}
function listStorage(storage) {
  const records = [];
  const unknown = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !key.startsWith('li.')) continue;
    if (!supportedKey(key)) { unknown.push(key); continue; }
    const value = storage.getItem(key);
    if (typeof value !== 'string') throw Error('Unable to read key: ' + key);
    records.push({ key, value });
  }
  if (unknown.length) throw Error('Unregistered li. keys: ' + unknown.join(', '));
  records.sort((a, b) => a.key.localeCompare(b.key, 'en'));
  return records;
}
function exportSpike(storage, origin, now = '2026-11-19T00:00:00.000Z') {
  assert.equal(typeof origin, 'string');
  const records = listStorage(storage);
  const envelope = {
    format: FORMAT, version: VERSION, exportedAt: now,
    sourceOrigin: origin, records, digest: digest(records)
  };
  const json = JSON.stringify(envelope);
  if (byteSize(json) > MAX_BACKUP_BYTES) throw Error('Too large');
  return json;
}
function validateSpike(json) {
  if (typeof json !== 'string' || byteSize(json) > MAX_BACKUP_BYTES) throw Error('Invalid or oversized backup');
  let envelope;
  try { envelope = JSON.parse(json); }
  catch (_) { throw Error('Invalid JSON'); }
  if (!envelope || envelope.format !== FORMAT || envelope.version !== VERSION
    || typeof envelope.exportedAt !== 'string' || !Number.isFinite(Date.parse(envelope.exportedAt))
    || typeof envelope.sourceOrigin !== 'string' || !Array.isArray(envelope.records)
    || !/^[a-f0-9]{64}$/.test(envelope.digest || '')) throw Error('Unsupported backup envelope');
  const seen = new Set();
  for (const entry of envelope.records) {
    if (!entry || typeof entry.key !== 'string' || !supportedKey(entry.key)
      || typeof entry.value !== 'string' || seen.has(entry.key)) throw Error('Invalid/duplicate record');
    seen.add(entry.key);
  }
  if (digest(envelope.records) !== envelope.digest) throw Error('Checksum mismatch');
  return envelope;
}
function previewSpike(storage, json) {
  const envelope = validateSpike(json);
  const before = listStorage(storage);
  const prior = new Map(before.map(row => [row.key, row.value]));
  const incoming = new Map(envelope.records.map(row => [row.key, row.value]));
  const add = envelope.records.filter(row => !prior.has(row.key)).length;
  const update = envelope.records.filter(row => prior.has(row.key) && prior.get(row.key) !== row.value).length;
  const remove = before.filter(row => !incoming.has(row.key)).length;
  return { envelope, before, counts: { add, update, remove, unchanged: envelope.records.length - add - update } };
}
function restoreSnapshot(storage, before, touchedKeys) {
  const prior = new Map(before.map(row => [row.key, row.value]));
  for (const key of touchedKeys) {
    if (prior.has(key)) storage.setItem(key, prior.get(key));
    else storage.removeItem(key);
  }
  for (const key of touchedKeys) {
    if (storage.getItem(key) !== (prior.has(key) ? prior.get(key) : null))
      throw Error('Rollback verification failed: ' + key);
  }
}
function importSpike(storage, json, { confirmed = false } = {}) {
  const plan = previewSpike(storage, json);
  if (!confirmed) return { applied: false, preview: plan.counts };
  const touched = [...new Set([...plan.before.map(row => row.key), ...plan.envelope.records.map(row => row.key)])];
  try {
    for (const { key, value } of plan.envelope.records) {
      storage.setItem(key, value);
      if (storage.getItem(key) !== value) throw Error('Write readback failed: ' + key);
    }
    const incoming = new Set(plan.envelope.records.map(row => row.key));
    for (const { key } of plan.before) if (!incoming.has(key)) {
      storage.removeItem(key);
      if (storage.getItem(key) !== null) throw Error('Remove readback failed: ' + key);
    }
  } catch (error) {
    try {
      restoreSnapshot(storage, plan.before, touched);
      return { applied: false, rollback: 'verified', error: error.message, preview: plan.counts };
    } catch (rollbackError) {
      return {
        applied: false, rollback: 'FAILED - MANUAL RECOVERY REQUIRED',
        error: error.message, rollbackError: rollbackError.message, preview: plan.counts
      };
    }
  }
  return { applied: true, preview: plan.counts };
}
function mockStorage(initial = {}, fail = {}) {
  const values = new Map(Object.entries(initial));
  let writes = 0;
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      writes += 1;
      if (fail.writeOn === writes || (fail.neverWrite && key === fail.neverWrite))
        throw Error('Synthetic quota/write denial');
      values.set(key, String(value));
    },
    removeItem(key) {
      if (fail.neverRemove && key === fail.neverRemove) throw Error('Synthetic remove denial');
      values.delete(key);
    },
    dump() { return Object.fromEntries(values); }
  };
}
function sourceAudit(root) {
  const issues = [];
  for (const [filename, needles] of Object.entries(SOURCES)) {
    const file = path.join(root, filename);
    if (!fs.existsSync(file)) { issues.push('Missing source: '+ filename); continue; }
    const code = fs.readFileSync(file, 'utf8');
    for (const needle of needles) if (!code.includes(needle))
      issues.push(filename + ': no expected storage key ' + needle);
  }
  const index = path.join(root, 'site/index.html');
  if (fs.existsSync(index)) {
    const html = fs.readFileSync(index, 'utf8');
    const start = html.indexOf('document.getElementById("export-personal-data")');
    const end = html.indexOf('const importTrigger=', start);
    if (start < 0 || end <= start) issues.push('Missing legacy export handler');
    else {
      const body = html.slice(start, end);
      if (!body.includes('cases:processedCases') || !body.includes('questions:savedQuestions'))
        issues.push('Legacy export changed: re-audit schema');
      if (body.includes('li.review.') || body.includes('li.personal.daily.') || body.includes('li.spell.t02.'))
        issues.push('Export gained new state: re-audit P1 gap before claiming it remains');
    }
  }
  return issues;
}
function run() {
  const synthetic = Object.fromEntries(FIXED_KEYS.map((key, index) => [key, JSON.stringify({ fake: true, n: index })]));
  synthetic['li.review.L09-1-2.v1'] = JSON.stringify({ draft: ['FAKE', '', '', ''], reviewed: true });
  synthetic['li.review.L03-1-2.v1'] = JSON.stringify({ reviewed: false });
  synthetic['non-li.other-app'] = 'ignore-but-preserve';
  let tests = 0;
  const test = (name, fn) => { fn(); tests++; console.log('PASS ' + name); };
  test('synthetic full state roundtrip', () => {
    const json = exportSpike(mockStorage(synthetic), 'https://sali5610.github.io');
    const dest = mockStorage({ 'non-li.other-app': 'ignore-but-preserve' });
    assert.equal(importSpike(dest, json, { confirmed: true }).applied, true);
    assert.deepEqual(dest.dump(), synthetic);
  });
  test('dry-run does not write', () => {
    const dest = mockStorage({ 'li.study-mode.v1': 'start' });
    const before = dest.dump();
    const result = importSpike(dest, exportSpike(mockStorage(synthetic), 'https://example.org'));
    assert.equal(result.applied, false);
    assert.ok(result.preview.add > 0);
    assert.deepEqual(dest.dump(), before);
  });
  test('replacement previews removals', () => {
    const dest = mockStorage({ 'li.study-mode.v1': 'start', 'li.buddy-address.v1': 'old' });
    const json = exportSpike(mockStorage({ 'li.study-mode.v1': 'focus' }), 'https://example.org');
    assert.equal(previewSpike(dest, json).counts.remove, 1);
    assert.equal(importSpike(dest, json, { confirmed: true }).applied, true);
    assert.equal(dest.getItem('li.buddy-address.v1'), null);
  });
  test('new unregistered key blocks complete backup', () =>
    assert.throws(() => exportSpike(mockStorage({ 'li.future.v2': 'x' }), 'x'), /Unregistered/));
  test('tamper, duplicate and unknown version reject', () => {
    const json = exportSpike(mockStorage(synthetic), 'https://example.org');
    const corrupt = JSON.parse(json); corrupt.records[0].value = 'tampered';
    assert.throws(() => validateSpike(JSON.stringify(corrupt)), /Checksum/);
    const duplicate = JSON.parse(json); duplicate.records.push(duplicate.records[0]);
    duplicate.digest = digest(duplicate.records);
    assert.throws(() => validateSpike(JSON.stringify(duplicate)), /duplicate/);
    const unsupported = JSON.parse(json); unsupported.version = 3;
    assert.throws(() => validateSpike(JSON.stringify(unsupported)), /Unsupported/);
  });
  test('invalid JSON and oversized backup reject', () => {
    assert.throws(() => validateSpike('{?'), /Invalid JSON/);
    assert.throws(() => validateSpike(' '.repeat(MAX_BACKUP_BYTES + 1)), /oversized/);
  });
  test('storage write denial rolls back synthetic state', () => {
    const dest = mockStorage({ 'li.study-mode.v1': 'old', 'li.app.locale.v1': 'old' }, { writeOn: 2 });
    const before = dest.dump();
    const json = exportSpike(mockStorage({ 'li.study-mode.v1': 'focus', 'li.app.locale.v1': 'en' }), 'x');
    const result = importSpike(dest, json, { confirmed: true });
    assert.equal(result.applied, false);
    assert.equal(result.rollback, 'verified');
    assert.deepEqual(dest.dump(), before);
  });
  test('failed rollback reports manual recovery', () => {
    const dest = mockStorage({ 'li.study-mode.v1': 'old' }, { neverWrite: 'li.study-mode.v1' });
    const json = exportSpike(mockStorage({ 'li.study-mode.v1': 'focus' }), 'x');
    const result = importSpike(dest, json, { confirmed: true });
    assert.equal(result.applied, false);
    assert.match(result.rollback, /FAILED/);
  });
  test('current source registry and old export gap still present', () =>
    assert.deepEqual(sourceAudit(path.resolve(__dirname, '..')), []));
  console.log(JSON.stringify({
    status: 'PASS', syntheticPlusSourceTests: tests,
    fixedKeys: FIXED_KEYS.length, dynamicLessonPattern: LESSON_KEY.source,
    legacyExportCoverage: 'P1 incomplete', productionMutation: false
  }, null, 2));
}
if (require.main === module) run();
module.exports = { FIXED_KEYS, LESSON_KEY, sourceAudit, exportSpike, validateSpike, previewSpike, importSpike, mockStorage };
