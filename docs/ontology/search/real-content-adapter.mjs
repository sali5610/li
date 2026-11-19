/**
 * li. Search/content adapter for the existing app + the React Tra Cứu owner.
 * Inputs: the ACTUAL LI_CATALOG_DATA catalog and existing ONT-03A graph.
 * No learner records, network calls, embeddings, speculative graph promotion,
 * publication decisions, UI, or writable state.
 *
 * Usage:
 *   const index = buildRealContentIndex({catalog: window.LI_CATALOG_DATA, academicGraph});
 *   searchRealContent(index, 'L09-1-2');
 *   relatedReviewed(index, 'lesson:L09-1-2');
 *   resolveLessonRoute(result, {hasInvitedSession: true, routeExists: key => !!document.getElementById('page-'+key)});
 */
const REVIEWED = new Set(['verified', 'approved']);
const PUBLIC = 'public_curated';
const GRAPH_PREDICATES = new Set(['SCOPED_TO_FIELD', 'STATES_CLAIM', 'SUPPORTED_BY']);
const NON_INDEXABLE = new Set(['Learner', 'Attempt', 'Feedback', 'ReviewDue', 'AssistanceEvent', 'TechniqueExecution', 'PrivateNote']);
export const normalizeSearchText = value => String(value ?? '')
  .normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd')
  .toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
const hasSource = p => typeof p?.sourceUrl === 'string' && p.sourceUrl.startsWith('https://')
  && typeof p.sourceSection === 'string' && Boolean(p.sourceSection.trim());
const safeText = value => typeof value === 'string' ? value.trim() : '';
const canonical = id => /^L\d{2}-\d-\d$/.test(id) ? 'lesson:' + id : null;

export function buildRealContentIndex({catalog, academicGraph = null} = {}) {
  if (!Array.isArray(catalog)) throw new TypeError('Real canonical catalog is required');
  const records = new Map();
  const catalogLessonIds = new Set();
  for (const group of catalog) for (const field of group.fields || []) {
    for (const course of field.courses || []) {
      if (course.id && course.title) {
        const id = 'course:' + course.id;
        if (records.has(id)) throw new Error('Duplicate course ID: ' + id);
        records.set(id, Object.freeze({
          id, kind: 'Course', title: course.title, aliases: [], sourceUrl: field.source || null,
          context: [group.title, field.name].filter(Boolean).join(' · '),
          publishState: 'catalog_outline', navigable: false, route: null
        }));
      }
      for (const lesson of course.lessons || []) {
        const id = canonical(lesson.id);
        if (!id || !safeText(lesson.title)) throw new Error('Invalid real catalog lesson');
        if (records.has(id)) throw new Error('Duplicate lesson ID: ' + id);
        const releasedInCatalog = lesson.published === true;
        const route = releasedInCatalog && /^lessonL\d{2}$/.test(lesson.route || '') ? lesson.route : null;
        catalogLessonIds.add(id);
        records.set(id, Object.freeze({
          id, lessonId: lesson.id, kind: 'Lesson', title: lesson.title, aliases: [],
          sourceUrl: field.source || null,
          context: [group.title, field.name, course.title].filter(Boolean).join(' · '),
          publishState: releasedInCatalog ? 'catalog_published' : 'candidate',
          navigable: Boolean(route), route
        }));
      }
    }
  }

  const links = [];
  // This graph remains a scoped editorial PILOT; only its verified edges can be
  // retrieved as review evidence. Never infer TEACHES/prerequisite from proposals.
  if (academicGraph) {
    const graphRecords = new Map();
    for (const node of academicGraph.nodes || []) {
      if (NON_INDEXABLE.has(node.kind) || node.visibility !== PUBLIC ||
          !REVIEWED.has(node.reviewState) || !hasSource(node.provenance)) continue;
      graphRecords.set(node.id, node);
      if (node.kind === 'Lesson' && records.has(node.id)) {
        const old = records.get(node.id);
        const aliases = (node.aliases || []).filter(a => a && ['vi', 'en'].includes(a.locale) && safeText(a.text))
          .map(a => ({locale: a.locale, text: a.text}));
        records.set(node.id, Object.freeze({...old, aliases, ontologySource: node.provenance.sourceUrl}));
      } else if (node.kind === 'Field' && !records.has(node.id)) {
        records.set(node.id, Object.freeze({
          id: node.id, kind: 'Field', title: node.title, aliases: (node.aliases || []).filter(a => a?.text),
          sourceUrl: node.provenance.sourceUrl, context: 'Academic field · source-reviewed pilot',
          publishState: 'reviewed_reference', navigable: false, route: null
        }));
      }
    }
    for (const edge of academicGraph.edges || []) {
      if (!GRAPH_PREDICATES.has(edge.predicate) || edge.visibility !== PUBLIC ||
          !REVIEWED.has(edge.reviewState) || !hasSource(edge.provenance)) continue;
      // Never show a link between editorial-only nodes that cannot be
      // retrieved by the real-catalog adapter.
      if (!records.has(edge.from) || !records.has(edge.to)) continue;
      if (!graphRecords.has(edge.from) || !graphRecords.has(edge.to)) continue;
      if (edge.from.startsWith('lesson:') && !catalogLessonIds.has(edge.from)) continue;
      links.push(Object.freeze({
        from: edge.from, to: edge.to, predicate: edge.predicate,
        provenance: Object.freeze({
          sourceUrl: edge.provenance.sourceUrl,
          sourceSection: edge.provenance.sourceSection,
          checkedOn: edge.provenance.checkedOn || null
        }),
        evidenceState: 'verified_relation_in_editorial_pilot'
      }));
    }
  }
  return Object.freeze({
    records, links: Object.freeze(links),
    coverage: 'actual_versioned_catalog_plus_reviewed_pilot_edges',
    graphIsPilot: Boolean(academicGraph?.demoOnly)
  });
}

function rank(record, query) {
  const id = normalizeSearchText(record.id);
  const title = normalizeSearchText(record.title);
  const aliases = record.aliases.map(a => normalizeSearchText(a.text));
  if (id === query || normalizeSearchText(record.lessonId) === query) return 120;
  if (title === query) return 105;
  if (aliases.includes(query)) return 100;
  if (title.startsWith(query) || aliases.some(a => a.startsWith(query))) return 86;
  if (title.includes(query) || aliases.some(a => a.includes(query))) return 68;
  const all = [id, title, ...aliases, normalizeSearchText(record.context)].join(' ');
  return query.split(' ').every(term => all.includes(term)) ? 25 : -1;
}

export function searchRealContent(index, rawQuery, {includeCandidates = false, limit = 15, kind = null} = {}) {
  if (typeof rawQuery !== 'string' || !rawQuery.trim() || rawQuery.length > 128)
    return {status: 'invalid_query', results: []};
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new RangeError('limit must be 1–50');
  const query = normalizeSearchText(rawQuery);
  const ranked = [];
  for (const record of index.records.values()) {
    if (kind && record.kind !== kind) continue;
    if (!includeCandidates && !['catalog_published', 'reviewed_reference'].includes(record.publishState)) continue;
    const score = rank(record, query);
    if (score >= 0) ranked.push({record, score});
  }
  ranked.sort((a, b) => b.score - a.score ||
    Number(b.record.navigable) - Number(a.record.navigable) ||
    a.record.id.localeCompare(b.record.id));
  const results = ranked.slice(0, limit).map(({record, score}) => ({...record, score,
    whyShown: 'Matched source-versioned title, ID or reviewed alias; not a publication decision'}));
  return {status: results.length ? 'ok' : 'no_match', results,
    total: ranked.length, coverage: index.coverage};
}

export function relatedReviewed(index, canonicalId) {
  if (!index.records.has(canonicalId)) return [];
  const out = [];
  for (const link of index.links) {
    if (link.from !== canonicalId && link.to !== canonicalId) continue;
    const other = link.from === canonicalId ? link.to : link.from;
    const record = index.records.get(other);
    if (!record) continue;
    out.push({
      id: other, title: record.title, kind: record.kind,
      publishState: record.publishState, route: record.route,
      relationship: link.predicate, direction: link.from === canonicalId ? 'outgoing' : 'incoming',
      provenance: link.provenance, evidenceState: link.evidenceState,
      explanation: 'Verified scoped editorial relation; NOT a prerequisite or publication approval'
    });
  }
  return out;
}

export function resolveLessonRoute(result, {hasInvitedSession = false, routeExists} = {}) {
  if (!hasInvitedSession || result?.kind !== 'Lesson' || result.publishState !== 'catalog_published' ||
      !result.navigable || typeof result.route !== 'string' || typeof routeExists !== 'function') return null;
  return routeExists(result.route) === true ? result.route : null;
}
