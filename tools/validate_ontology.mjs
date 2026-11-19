#!/usr/bin/env node
/**
 * ONT-01: Zero-dependency typed graph contract validator.
 * Scope: public curated demo only. Do not use this as RLS authorization.
 * Execute: node tools/validate_ontology.mjs --check
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const registry = load('docs/ontology/registry.v0.1.json');
const graph = load('docs/ontology/demo.graph.v0.1.json');
const schema = load('docs/ontology/graph.schema.json');
const semver = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const idPattern = new RegExp(registry.idPolicy.pattern);

function fail(msg) { throw new Error(msg); }
function unique(xs, context) {
  const dup = xs.find((x, i) => xs.indexOf(x) !== i);
  if (dup !== undefined) fail(context + ': duplicate ' + dup);
}
function typeSource(p, context) {
  assert.ok(p && typeof p === 'object', context + ' missing provenance');
  assert.ok(/^https:\/\//.test(p.sourceUrl || ''), context + ' requires https source URL');
  assert.ok(typeof p.sourceSection === 'string' && p.sourceSection.trim(), context + ' requires source section');
  assert.ok(registry.enums.evidenceType.includes(p.evidenceType), context + ' bad evidence type');
  assert.match(p.checkedOn || '', /^\d{4}-\d{2}-\d{2}$/, context + ' invalid checkedOn');
}
function normalize(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('en').trim().replace(/\s+/g,' ');
}
function hasCycle(edges, predicate) {
  const adj = new Map();
  for (const edge of edges.filter((e) => e.predicate === predicate)) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    adj.get(edge.from).push(edge.to);
  }
  const visited = new Set(), visiting = new Set();
  const visit = (v) => {
    if (visiting.has(v)) return true;
    if (visited.has(v)) return false;
    visiting.add(v);
    for (const next of adj.get(v) || []) if (visit(next)) return true;
    visiting.delete(v); visited.add(v); return false;
  };
  return [...adj.keys()].some(visit);
}
export function validate(g) {
  assert.ok(semver.test(registry.schemaVersion), 'registry version');
  assert.equal(g.contractVersion, registry.schemaVersion, 'fixture contract version mismatch');
  assert.ok(semver.test(g.graphVersion), 'graph version');
  assert.equal(g.demoOnly, true, 'only demo curated fixtures accepted');
  assert.equal(schema.properties.demoOnly.const, true, 'schema must enforce demo-only');
  const kinds = new Map(registry.nodeKinds.map(k => [k.name, k]));
  const predicates = new Map(registry.predicates.map(p => [p.name, p]));
  unique([...kinds.keys()], 'registry kinds');
  unique([...predicates.keys()], 'registry predicates');
  for (const rel of predicates.values()) {
    for (const kind of [...rel.from, ...rel.to]) assert.ok(kinds.has(kind), 'unknown kind in predicate '+rel.name+': '+kind);
  }
  const ids = g.nodes.map(n => n.id), edgeIds = g.edges.map(e => e.id);
  unique(ids, 'nodes'); unique(edgeIds, 'edges');
  const nodes = new Map(g.nodes.map(n => [n.id, n]));
  const touched = new Set(), aliases = new Map();
  for (const n of g.nodes) {
    assert.ok(idPattern.test(n.id), 'bad node ID: '+n.id);
    const def = kinds.get(n.kind);
    assert.ok(def, 'unknown node kind: '+n.kind);
    assert.equal(n.visibility, def.defaultVisibility, 'visibility mismatch for '+n.id);
    assert.equal(n.visibility, 'public_curated', 'private user node leaked into public manifest: '+n.id);
    assert.ok(registry.enums.reviewState.includes(n.reviewState), 'node review state '+n.id);
    assert.ok(registry.enums.publishState.includes(n.publishState), 'node publish state '+n.id);
    assert.ok(registry.enums.rightsState.includes(n.rightsState), 'node rights state '+n.id);
    assert.ok(semver.test(n.version), 'node version '+n.id);
    assert.ok(typeof n.title === 'string' && n.title.trim(), 'node title '+n.id);
    typeSource(n.provenance, n.id);
    if (n.reviewState === 'approved') assert.notEqual(n.provenance.evidenceType, 'synthetic_fixture','synthetic approved node '+n.id);
    if (n.publishState === 'published') assert.equal(n.reviewState, 'approved', 'published without approval: '+n.id);
    const terms = [{locale:'en',text:n.title}, ...(n.aliases || [])];
    for (const {locale, text} of terms) {
      assert.ok(['vi','en'].includes(locale) && typeof text === 'string' && text.trim(), 'bad alias '+n.id);
      const k = n.kind + ':' + locale + ':' + normalize(text);
      if (aliases.has(k) && aliases.get(k)!==n.id) fail('same-kind/locale alias collision: '+k+' between '+aliases.get(k)+' and '+n.id);
      aliases.set(k,n.id);
    }
  }
  const triple = new Set(), symmetry = new Set();
  for (const edge of g.edges) {
    assert.ok(idPattern.test(edge.id), 'bad edge ID '+edge.id);
    assert.ok(nodes.has(edge.from) && nodes.has(edge.to), 'dangling link '+edge.id);
    assert.notEqual(edge.from, edge.to, 'self edge '+edge.id);
    assert.equal(edge.visibility, 'public_curated', 'private edge leaked: '+edge.id);
    assert.ok(registry.enums.reviewState.includes(edge.reviewState), 'bad review state '+edge.id);
    typeSource(edge.provenance, edge.id);
    if (['verified','approved'].includes(edge.reviewState)) assert.notEqual(edge.provenance.evidenceType,'synthetic_fixture','unproven promoted edge '+edge.id);
    const spec = predicates.get(edge.predicate);
    assert.ok(spec, 'unknown relation '+edge.id+': '+edge.predicate);
    const fromKind=nodes.get(edge.from).kind, toKind=nodes.get(edge.to).kind;
    assert.ok(spec.from.includes(fromKind) && spec.to.includes(toKind), 'invalid endpoints '+edge.id+' '+fromKind+' -> '+toKind);
    if (edge.predicate === 'PART_OF') {
      assert.ok(registry.specificEndpointRules.PART_OF.some(([a,b])=>a===fromKind && b===toKind), 'bad PART_OF pairing '+edge.id);
    }
    const t=edge.predicate+'|'+edge.from+'|'+edge.to;
    if (triple.has(t)) fail('duplicate relation triple: '+t);
    triple.add(t);
    if (spec.symmetric) {
      const s=edge.predicate+'|'+[edge.from,edge.to].sort().join('|');
      if (symmetry.has(s)) fail('duplicate reversed symmetric relation: '+s);
      symmetry.add(s);
    }
    touched.add(edge.from); touched.add(edge.to);
  }
  for (const predicate of registry.gatePolicy.detectCycles) if (hasCycle(g.edges,predicate)) fail('cycle detected: '+predicate);
  for (const id of ids) if (!touched.has(id)) fail('orphan node without edge: '+id);
  return {nodes:ids.length,edges:edgeIds.length,kinds:kinds.size,predicates:predicates.size};
}
function renderTypes() {
  const union = (arr) => arr.map(s=>JSON.stringify(s)).join(' | ');
  return [
  '// GENERATED from docs/ontology/registry.v0.1.json; read-only type reference, not deployed runtime.',
  '// Regenerate through node tools/validate_ontology.mjs --emit-types; do not hand-maintain unions.',
  'export type OntologyNodeKind = '+union(registry.nodeKinds.map(x=>x.name))+';',
  'export type OntologyPredicate = '+union(registry.predicates.map(x=>x.name))+';',
  'export type OntologyReviewState = '+union(registry.enums.reviewState)+';',
  'export type OntologyPublishState = '+union(registry.enums.publishState)+';',
  'export type OntologyVisibility = '+union(registry.enums.visibility)+';',
  'export type OntologyRightsState = '+union(registry.enums.rightsState)+';',
  'export type OntologyEvidenceType = '+union(registry.enums.evidenceType)+';',
  'export interface OntologyProvenance { sourceUrl: string; sourceSection: string; evidenceType: OntologyEvidenceType; checkedOn: string; }',
  'export interface OntologyAlias { locale: "vi" | "en"; text: string; }',
  'export interface OntologyNode { id: string; kind: OntologyNodeKind; title: string; version: string; reviewState: OntologyReviewState; publishState: OntologyPublishState; visibility: OntologyVisibility; rightsState: OntologyRightsState; aliases: OntologyAlias[]; provenance: OntologyProvenance; note: string; }',
  'export interface OntologyEdge { id: string; predicate: OntologyPredicate; from: string; to: string; reviewState: OntologyReviewState; visibility: OntologyVisibility; provenance: OntologyProvenance; }',
  'export interface OntologyGraph { profile: string; graphVersion: string; contractVersion: string; demoOnly: true; boundary: string; nodes: OntologyNode[]; edges: OntologyEdge[]; }',
  ''
  ].join('\n');
}
function clone(g){return JSON.parse(JSON.stringify(g));}
function negativeTests(g){
  let count=0;
  const rejects=(name,mutate)=>{
    const sample=clone(g);
    mutate(sample);
    let rejected=false;
    try{validate(sample);}catch{rejected=true;}
    assert.ok(rejected, 'negative fixture unexpectedly accepted: '+name);count++;
  };
  rejects('dangling link',s=>{s.edges[0].to='concept:ont01:missing';});
  rejects('wrong endpoints',s=>{s.edges[0].predicate='TEACHES';});
  rejects('alias collision',s=>{s.nodes.find(n=>n.id==='concept:ont01:sample').aliases.push({locale:'en',text:'Population'});});
  rejects('prerequisite cycle',s=>{
    const p=s.edges.find(e=>e.id==='edge:academic:population-sample-related');
    s.edges.push({...p,id:'edge:test:requires-1',predicate:'REQUIRES',from:'concept:ont01:population',to:'concept:ont01:sample'});
    s.edges.push({...p,id:'edge:test:requires-2',predicate:'REQUIRES',from:'concept:ont01:sample',to:'concept:ont01:population'});
  });
  rejects('private user leaked',s=>{s.nodes[0].visibility='private_user';});
  rejects('synthetic evidence promoted',s=>{s.edges[0].reviewState='approved';s.edges[0].provenance.evidenceType='synthetic_fixture';});
  rejects('published without approval',s=>{s.nodes.find(n=>n.id==='lesson:L09-1-1').publishState='published';});
  rejects('duplicate reverse symmetric',s=>{
    const p=s.edges.find(e=>e.predicate==='CONTRASTS_WITH');
    s.edges.push({...p,id:'edge:test:reverse',from:p.to,to:p.from});
  });
  rejects('orphan node',s=>{s.edges=s.edges.filter(e=>e.from!=='source:editorial:L09-1-2:notion' && e.to!=='source:editorial:L09-1-2:notion');});
  rejects('bad decision PART_OF',s=>{s.edges[0].predicate='PART_OF';});
  return count;
}
const args = process.argv.slice(2);
if (args.includes('--emit-types')) {
  process.stdout.write(renderTypes());
} else if (args.includes('--check') || args.length === 0) {
  const actual = readFileSync(resolve(root,'docs/ontology/ontology-types.ts'),'utf8');
  assert.equal(actual,renderTypes(),'generated TS contract stale: regenerate types');
  const result = validate(graph);
  const negativeCases = negativeTests(graph);
  process.stdout.write(JSON.stringify({status:'PASS',...result,negativeCases,privateGraphRuntime:'NOT IMPLEMENTED',deployment:'NONE'})+'\n');
} else { fail('Usage: node tools/validate_ontology.mjs [--check|--emit-types]'); }
