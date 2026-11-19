#!/usr/bin/env node
/** Build a small source-reviewed PUBLIC graph pack; no unpublished lesson body. */
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const load = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const original = load('docs/ontology/academic/demo.graph.v0.1.json');
if (original.demoOnly !== true) throw Error('Graph provenance state changed; review before publishing');
const allowedKinds = new Set(['Field', 'Lesson']);
const reviewed = new Set(['verified', 'approved']);
const sourceOk = p => /^https:\/\//.test(p?.sourceUrl || '') &&
  typeof p?.sourceSection === 'string' && p.sourceSection.trim().length > 0;
const nodes = original.nodes.filter(node => allowedKinds.has(node.kind) &&
  node.visibility === 'public_curated' && reviewed.has(node.reviewState) && sourceOk(node.provenance))
  .map(({id,kind,title,aliases,visibility,reviewState,publishState,provenance}) => ({
    id,kind,title,aliases,visibility,reviewState,publishState,provenance
  }));
const byId = new Set(nodes.map(node => node.id));
const edges = original.edges.filter(edge => edge.predicate === 'SCOPED_TO_FIELD' &&
  edge.visibility === 'public_curated' && reviewed.has(edge.reviewState) &&
  byId.has(edge.from) && byId.has(edge.to) && sourceOk(edge.provenance))
  .map(({from,to,predicate,visibility,reviewState,provenance}) => ({
    from,to,predicate,visibility,reviewState,provenance
  }));
if (!edges.some(e => e.from === 'lesson:L09-1-2' && e.to === 'field:F09'))
  throw Error('Expected source-reviewed Wave1 relation missing');
if (nodes.some(x => /Attempt|Learner|Note|Feedback/.test(x.kind))) throw Error('Private type found');
const pack = {schemaVersion:1, contentSource:'docs/ontology/academic/demo.graph.v0.1.json',
  status:'reviewed_public_subset_of_editorial_pilot', demoOnly:true, nodes, edges};
writeFileSync(new URL('site/assets/li-search-graph.json',root), JSON.stringify(pack));
copyFileSync(new URL('docs/ontology/search/real-content-adapter.mjs',root),
  new URL('site/assets/li-search-adapter.mjs',root));
console.log(JSON.stringify({status:'PASS',reviewedNodes:nodes.length,reviewedEdges:edges.length,
  privacy:'PUBLIC_REVIEWED_ONLY',source:'REAL_ONTOLOGY_PILOT',vector:'OFF'}));
