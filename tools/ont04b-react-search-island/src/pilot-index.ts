import academicGraph from '../../../docs/ontology/academic/demo.graph.v0.1.json';
import pedagogyGraph from '../../../docs/ontology/pedagogy/demo.graph.v0.1.json';
import methodCatalog from '../../../docs/ontology/pedagogy/techniques.v0.2.json';
import candidateData from '../../../docs/ontology/search/candidate-outlines.v0.1.json';
import {buildPilotIndex} from '../../../docs/ontology/search/offline-search.mjs';
export const pilotIndex=buildPilotIndex({
 academicGraph,pedagogyGraph,methodCatalog,candidateOutlines:candidateData.nodes
});
// Curated static fixture only. No fetch, auth, storage, tracking or model.
