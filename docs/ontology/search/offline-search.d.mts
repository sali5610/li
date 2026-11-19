/** ONT-04A JavaScript contract typed for 04B React consumers. */
export type SearchKind='Field'|'Lesson'|'Concept'|'Course'|'SourceProgramme'|'SourceCourse'|'TechniqueDefinition';
export type SearchLocale='vi'|'en';
export interface SourceProvenance {sourceUrl:string;sourceSection:string;checkedOn:string;evidenceType?:string;}
export interface ReviewedPath {predicate:string;from:string;to:string;sourceUrl:string;}
export interface RelatedResult {id:string;kind:string;title:string;hops:number;path:ReviewedPath[];whyShown:string;provenance:SourceProvenance;}
export interface SearchResult {
 id:string;kind:SearchKind;title:string;localizedTitle:string;score:number;matchType:string;
 matchedText:string;matchedLocale:string;reviewState:string;publishState:string;rightsState:string;
 readiness:{playable:boolean;state:string;reason:string};version:string;provenance:SourceProvenance;
 whyShown:string;related:RelatedResult[];
}
export interface SearchResponse {
 status:'ok'|'no_match'|'invalid_query';query?:string;locale?:SearchLocale;results:SearchResult[];
 totalMatched?:number;shown?:number;coverage?:string;message:string;
}
export interface PilotIndex {
 index:Map<string,unknown>;evidence:Map<string,unknown>;
 links:Array<{from:string;to:string;predicate:string;sourceUrl:string;sourceSection:string}>;
 fixtureOnly:true;sourceCount:number;
}
export function normalize(text:unknown):string;
export function buildPilotIndex(input:{
 academicGraph:unknown;pedagogyGraph:unknown;methodCatalog:unknown;candidateOutlines?:unknown[];
}):PilotIndex;
export function expandReviewed(index:PilotIndex,id:string,opts?:{hops?:number}):RelatedResult[];
export function searchPilot(index:PilotIndex,query:string,opts?:{
 locale?:SearchLocale;kind?:SearchKind|null;includeCandidates?:boolean;limit?:number;expandHops?:number;
}):SearchResponse;
