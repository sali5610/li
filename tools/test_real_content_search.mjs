#!/usr/bin/env node
/** Focused, zero-dependency integration checks against the REAL catalog and ONT graph. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {buildRealContentIndex,searchRealContent,relatedReviewed,resolveLessonRoute} from '../docs/ontology/search/real-content-adapter.mjs';

const context = {window: {}};
runInNewContext(readFileSync(new URL('../site/assets/catalog-curriculum-data.js', import.meta.url), 'utf8'), context);
const catalog = context.window.LI_CATALOG_DATA;
const graph = JSON.parse(readFileSync(new URL('../docs/ontology/academic/demo.graph.v0.1.json', import.meta.url), 'utf8'));
const index = buildRealContentIndex({catalog, academicGraph: graph});
const found = (q, options = {}) => searchRealContent(index, q, options).results;

const released = [...index.records.values()].filter(x => x.kind === 'Lesson' && x.publishState === 'catalog_published');
assert.deepEqual(released.map(x => x.lessonId).sort(), ['L03-1-2', 'L09-1-2', 'L15-2-2']);
assert.equal(found('L09-1-2')[0].id, 'lesson:L09-1-2');
assert.equal(found('Sampling Bias')[0].id, 'lesson:L09-1-2');
assert.equal(found('sai lech chon mau')[0].id, 'lesson:L09-1-2');
assert.equal(found('Data Science')[0].id, 'field:F09');
assert.equal(found('L03-1-2')[0].route, 'lessonL03');
assert.equal(found('L15-2-2')[0].route, 'lessonL15');
assert.equal(found('Pinyin').length, 0, 'candidate title must not surface as published');
assert.equal(found('Pinyin', {includeCandidates: true})[0].publishState, 'candidate');
assert.equal(found('Selection bias', {kind: 'Concept'}).length, 0, 'proposed concept must not be promoted');

const related = relatedReviewed(index, 'lesson:L09-1-2');
const fieldLink = related.find(x => x.id === 'field:F09');
assert.ok(fieldLink, 'canonical lesson must have sourced reviewed field relation');
assert.equal(fieldLink.relationship, 'SCOPED_TO_FIELD');
assert.equal(fieldLink.evidenceState, 'verified_relation_in_editorial_pilot');
assert.match(fieldLink.provenance.sourceUrl, /^https:\/\/app\.notion\.com\//);
assert.match(fieldLink.explanation, /NOT a prerequisite/);
assert.ok(relatedReviewed(index, 'field:F09').some(x => x.id === 'lesson:L09-1-2'));

const target = found('L09-1-2')[0];
assert.equal(resolveLessonRoute(target), null, 'no implicit login or route trust');
assert.equal(resolveLessonRoute(target, {hasInvitedSession: true, routeExists: () => false}), null);
assert.equal(resolveLessonRoute(target, {hasInvitedSession: true, routeExists: route => route === 'lessonL09'}), 'lessonL09');
assert.equal(resolveLessonRoute(found('Pinyin', {includeCandidates: true})[0],
  {hasInvitedSession: true, routeExists: () => true}), null);
assert.equal(searchRealContent(index, 'x'.repeat(200)).status, 'invalid_query');
assert.ok([...index.records.values()].every(x => !['Learner', 'Attempt', 'Feedback', 'PrivateNote'].includes(x.kind)));
assert.ok(index.graphIsPilot, 'do not lose pilot provenance signal');
assert.ok(index.links.every(e => e.evidenceState === 'verified_relation_in_editorial_pilot'));

// The old pilot remains isolated contract research; the deployed Search uses
// the one canonical Content API, and its visible links are browser-checked separately.
const searchUi = readFileSync(new URL('../site/assets/li-catalog-search.js', import.meta.url), 'utf8');
assert.ok(searchUi.includes('import(new URL("./assets/li-content-adapter.mjs"'),
  'real Search must reuse the canonical content client');
assert.ok(searchUi.includes('client.searchKnowledge(value)'),
  'native Search must retrieve canonical search/graph relationships');
assert.ok(!searchUi.includes('li-search-graph.json')&&!searchUi.includes('li-search-adapter.mjs'),
  'pilot packs must not be loaded by the learner-facing Search');
assert.match(searchUi, /sourceLink\(item\.sourceUrl,"Nguồn danh mục \(Notion\)"\)/);
assert.ok(!searchUi.includes('document.createElement("details")'),
  'source evidence must not be hidden in collapsed details');
assert.match(searchUi, /a\.target="_blank";a\.rel="noopener noreferrer"/,
  'source opens safely as an external link');
assert.ok([...index.records.values()].some(x => x.kind === 'Lesson' &&
  x.publishState === 'catalog_published' && /^https:\/\//.test(x.sourceUrl)));

console.log(JSON.stringify({
  status: 'PASS', corpus: 'ACTUAL_CATALOG_PLUS_REVIEWED_GRAPH_PILOT',
  totalCatalogLessons: [...index.records.values()].filter(r => r.kind === 'Lesson').length,
  navigableCatalogLessons: released.length,
  graphLinks: index.links.length,
  queries: {
    'L09-1-2': found('L09-1-2')[0].id,
    'sai lech chon mau': found('sai lech chon mau')[0].id,
    'Data Science': found('Data Science')[0].id,
    'Pinyin (public)': 'no_match',
    'L09-1-2 -> reviewed relation': fieldLink.relationship + ' -> ' + fieldLink.id
  },
  routeGate: 'EXPLICIT_INVITED_SESSION_AND_REGISTERED_NATIVE_ROUTE_REQUIRED',
  vector: 'LATER_NO_DEPLOY', privateData: 'NOT_INDEXED'
}, null, 2));
