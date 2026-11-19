/** ONT-04C1 read-only companion API typed for the React Search consumer. */
export interface EditorialAction {intent:string;label:string;response:string;executable:false;revealsSolution:false;writesLearnerData:false;}
export interface EditorialContextResult {
 status:string;actor:string;locale:'vi'|'en';stage:string|null;lessonId:string|null;
 context:{intro:string;title:string;fieldId:string;publicationState:string}|null;
 actions:EditorialAction[];
 sources:Array<{url:string;section:string;checkedOn:string;independentScientificVerification:false}>;
 permission:{canNavigate:false;canReadPrivate:false;canRevealAnswer:false;canGrade:false;canSave:false;contentPublished:false;verifiedSubmission:false};
}
export interface EditorialCompanionIndex {lessons:ReadonlyMap<string,unknown>;}
export function buildOfflineCompanionIndex(input:{
 contextRegistry:unknown;templates:unknown;academicGraph:unknown;pedagogyFits:unknown;
 methodCatalog:unknown;routeAudit:unknown;
}):EditorialCompanionIndex;
export function resolveOfflineCompanion(index:EditorialCompanionIndex,input:{
 lessonId:string;locale:'vi'|'en';stage:'opening'|'concept'|'guided'|'independent'|'reflection'|'extension';
 reviewProposals?:boolean;
}):EditorialContextResult;
