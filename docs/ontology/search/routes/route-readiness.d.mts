/**
 * ONT-INT-05: types for source-only ONT-04B2b-1 inspector.
 * Never a browser/user permission or publication proof.
 */
export interface SourceRouteCandidate {
 canonicalLessonId:string;
 nativeCode:string;
}
export interface SourceRouteAuditManifest {
 profile:string;
 scope:string;
 candidates?:ReadonlyArray<SourceRouteCandidate>;
}
export interface SourceRouteAudit {
 readonly state:string;
 readonly nativeCodeKnown:boolean;
 readonly navigationPermitted:false;
 readonly deepLink:null;
 readonly action:null;
 readonly why:string;
 readonly canonicalLessonId?:string;
 readonly sourcePath?:string;
 readonly blockers?:ReadonlyArray<string>;
}
export function inspectSearchRoute(manifest:SourceRouteAuditManifest,canonicalLessonId:string):SourceRouteAudit;
