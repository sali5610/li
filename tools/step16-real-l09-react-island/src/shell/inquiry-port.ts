/** One canonical Inquiry domain/persistence port supplied by the original app.
 * React owns the visible components and calls actions directly—no hidden
 * button click, hidden textarea event, duplicated scenario, or new writer.
 */
export type MirrorView={
 index:number;question:string;scene:string;source:string;
 route:string;cta:string;saved:boolean
};
export type ResearchView={
 question:string;branches:string[];observed:string;unknown:string;feedback:string
};
export type CaseChoice='right'|'wrong';
export interface InquiryFlowPort{
 getMirror():MirrorView|null;
 shift(direction:-1|1):boolean;
 toggleQuestion():boolean;
 getResearch():ResearchView|null;
 chooseBranch(index:number):boolean;
 getCaseDraft():string;
 setCaseDraft(text:string):boolean;
 submitCase(choice:CaseChoice|null,revision:string):boolean;
 isCaseBookmarked():boolean;
 toggleCaseBookmark():boolean;
}
declare global{interface Window{
 liInquiryFlow?:InquiryFlowPort;
 openLaoLy?:(trigger?:HTMLElement|null)=>void;
}}
export function inquiryFlow():InquiryFlowPort{
 const service=window.liInquiryFlow;
 if(!service)throw Error('REACT_INQUIRY_PORT_MISSING');
 return service;
}
