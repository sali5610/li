/* STEP16 research fixture only; browser-compatible prototype, NOT used by site/. */
(function (root) {
  'use strict';
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
  const LIMIT_BYTES = 10 * 1024 * 1024;
  const encoder = new TextEncoder();
  const supports = key => FIXED.has(key) || LESSON_KEY.test(key);
  const size = text => encoder.encode(text).byteLength;
  const fail = message => { throw Error(message); };
  function recordsFrom(storage) {
    const records = [], unregistered = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (typeof key !== 'string' || !key.startsWith('li.')) continue;
      if (!supports(key)) { unregistered.push(key); continue; }
      const value = storage.getItem(key);
      if (typeof value !== 'string') fail('Unreadable key: ' + key);
      records.push({key, value});
    }
    if (unregistered.length) fail('Unregistered li. keys: ' + unregistered.join(', '));
    records.sort((a,b) => a.key.localeCompare(b.key, 'en'));
    return records;
  }
  async function sha(records) {
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(records)));
    return [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2,'0')).join('');
  }
  async function backup(storage, origin, date = new Date().toISOString()) {
    const records = recordsFrom(storage);
    const payload = {format:'li-backup-spike',version:2,exportedAt:date,
      sourceOrigin:origin,records,digest:await sha(records)};
    const text = JSON.stringify(payload);
    if (size(text) > LIMIT_BYTES) fail('Backup too large');
    return text;
  }
  function legacyRecords(value) {
    if (!value || value.schema !== 1 || !Array.isArray(value.cases)
      || !Array.isArray(value.questions) || typeof value.draft !== 'string')
      fail('Invalid legacy schema');
    if (!value.cases.every(x => x && typeof x.title === 'string'
       && typeof x.revision === 'string' && typeof x.correct === 'boolean'))
       fail('Invalid legacy cases');
    if (!value.questions.every(x => x && typeof x.question === 'string')) fail('Invalid legacy questions');
    if (value.ideas !== undefined && (!Array.isArray(value.ideas) ||
      !value.ideas.every(x => x && typeof x.id === 'string' && typeof x.text === 'string'
      && x.text.length <= 5000 && typeof x.savedAt === 'string')))
      fail('Invalid legacy ideas');
    if (value.savedContent !== undefined && (!Array.isArray(value.savedContent) ||
      !value.savedContent.every(x => x && ['lesson','case'].includes(x.type)
        && typeof x.id === 'string' && typeof x.savedAt === 'string'))) fail('Invalid legacy bookmarks');
    if (value.buddyNames !== undefined && (!value.buddyNames || typeof value.buddyNames !== 'object'
      || Array.isArray(value.buddyNames) ||
      !['warm','teasing','serious'].every(k => typeof value.buddyNames[k] === 'string'
      && value.buddyNames[k].length <= 100))) fail('Invalid legacy buddy names');
    const records = [
      {key:'li.private.library.v1', value:JSON.stringify({schema:1,
        cases:value.cases,questions:value.questions,ideas:value.ideas || [],
        savedContent:value.savedContent || [],updatedAt:value.exportedAt || new Date(0).toISOString()})},
      {key:'li.private.case-draft.v1', value:value.draft}
    ];
    if (value.buddyNames !== undefined) records.push({key:'li.buddy-address.v1',value:JSON.stringify(value.buddyNames)});
    records.sort((a,b) => a.key.localeCompare(b.key,'en'));
    return records;
  }
  async function parse(json) {
    if (typeof json !== 'string' || size(json) > LIMIT_BYTES) fail('Invalid/oversized backup');
    let payload;
    try { payload = JSON.parse(json); } catch (_) { fail('Invalid JSON'); }
    if (payload && payload.schema === 1) return {records:legacyRecords(payload),legacy:true,
      warning:'Legacy schema 1 contained library/draft/preferences only; missing independent lesson/journal data cannot be recovered.'};
    if (!payload || payload.format !== 'li-backup-spike' || payload.version !== 2
      || !Number.isFinite(Date.parse(payload.exportedAt)) || typeof payload.sourceOrigin !== 'string'
      || !Array.isArray(payload.records) || !/^[0-9a-f]{64}$/.test(payload.digest || ''))
      fail('Unsupported backup format');
    const seen = new Set();
    for (const record of payload.records) {
      if (!record || typeof record.key !== 'string' || !supports(record.key)
        || typeof record.value !== 'string' || seen.has(record.key)) fail('Duplicate/unregistered/invalid record');
      seen.add(record.key);
    }
    if (await sha(payload.records) !== payload.digest) fail('Checksum mismatch');
    return {records:payload.records,legacy:false,warning:null};
  }
  async function inspect(storage, json, {mode='replace'}={}) {
    if (mode !== 'replace' && mode !== 'merge') fail('Unknown restore mode');
    const incoming = await parse(json);
    if (incoming.legacy && mode !== 'merge') fail('Legacy backup can only merge: refusing to erase unavailable progress');
    const before = recordsFrom(storage);
    const current = new Map(before.map(x => [x.key,x.value]));
    const desired = new Map(incoming.records.map(x => [x.key,x.value]));
    const add = incoming.records.filter(x => !current.has(x.key)).length;
    const update = incoming.records.filter(x => current.has(x.key) && current.get(x.key) !== x.value).length;
    const remove = mode === 'replace' ? before.filter(x => !desired.has(x.key)).length : 0;
    const unchanged = incoming.records.length - add - update;
    return {before,incoming,mode,counts:{add,update,remove,unchanged},fingerprint:await sha(before)};
  }
  function rollback(storage, before, touched) {
    const old = new Map(before.map(x => [x.key,x.value]));
    for (const key of touched) {
      if (old.has(key)) storage.setItem(key,old.get(key));
      else storage.removeItem(key);
    }
    for (const key of touched) {
      if (storage.getItem(key) !== (old.has(key) ? old.get(key) : null)) fail('Rollback mismatch: '+key);
    }
  }
  async function restore(storage, json, {confirmed=false,mode='replace',expectedFingerprint=null}={}) {
    const plan = await inspect(storage,json,{mode});
    if (!confirmed) return {applied:false,preview:plan.counts,legacy:plan.incoming.legacy,
      warning:plan.incoming.warning,fingerprint:plan.fingerprint};
    if (expectedFingerprint !== null && expectedFingerprint !== plan.fingerprint)
      fail('Stale preview: browser data changed before confirmation');
    const touched = [...new Set([...plan.before.map(x=>x.key),...plan.incoming.records.map(x=>x.key)])];
    try {
      for (const {key,value} of plan.incoming.records) {
        storage.setItem(key,value);
        if (storage.getItem(key) !== value) fail('Write readback mismatch: '+key);
      }
      if (mode === 'replace') {
        const keep = new Set(plan.incoming.records.map(x=>x.key));
        for (const {key} of plan.before) if (!keep.has(key)) {
          storage.removeItem(key);
          if (storage.getItem(key) !== null) fail('Remove readback mismatch: '+key);
        }
      }
    } catch (error) {
      try {
        rollback(storage,plan.before,touched);
        return {applied:false,rollback:'verified',reason:error.message};
      } catch (failure) {
        return {applied:false,rollback:'FAILED_MANUAL_RECOVERY_REQUIRED',reason:error.message,
          rollbackError:failure.message};
      }
    }
    return {applied:true,preview:plan.counts,legacy:plan.incoming.legacy,
      warning:plan.incoming.warning};
  }
  root.LiStep16BrowserSpike = Object.freeze({FIXED_KEYS,recordsFrom,sha,backup,parse,inspect,restore});
})(window);
