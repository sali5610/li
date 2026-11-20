/**
 * Step16 L09-1-2 native/React compatibility bridge — TEST-ONLY.
 * The actual production lesson remains the sole owner of li.review.L09-1-2.v1.
 * Real-key mode is gated to local testing URLs under this research fixture path.
 */
export type Locale='vi'|'en';
export type Rating=0|1|2|null;
export type MethodCategory='nominal'|'ordinal'|'discrete'|'continuous';
export type MethodAttempt={
 draft:string;submission:string|null;submittedAt:string|null;
 /** T06 has four explicit classifications in addition to the learner's reasoning. */
 classifications?:Partial<Record<'A'|'B'|'C'|'D',MethodCategory>>;
};
export type MethodChoice='T06'|'T07'|'skip'|null;
export type PastEditorialAttempt={
 submission:[string,string,string,string];submissionLocale:Locale;submittedAt:string;
 ratings:[Rating,Rating,Rating,Rating];reviewedAt:string|null;answerRevealed:boolean;
 contentVersion:string;rubricVersion:string;attemptNumber:number;
 guidedDraft:string;hint:boolean;methodChoice:MethodChoice;
 methodAttempts?:Partial<Record<'T06'|'T07',MethodAttempt>>;
};
export type EditorialReviewSnapshot={
 /** A bilingual first-party model answer/rubric frozen at independent submission. */
 contentVersion:string;rubricVersion:string;
 modelAnswer:Record<Locale,string>;
 criteria:Record<Locale,[string,string,string,string][]>;
};
export type Attempt={
 locale:Locale;
 draft:[string,string,string,string];
 guidedDraft:string;
 hint:boolean;
 assisted:boolean;
 submitted:boolean;
 submittedAt:string|null;
 submission:[string,string,string,string]|null;
 submissionLocale:Locale|null;
 ratings:[Rating,Rating,Rating,Rating];
 reviewed:boolean;
 /** Optional per-spell attempt; distinct from independent assessment. */
 methodAttempts?:Partial<Record<'T06'|'T07',MethodAttempt>>;
 /** K2 selection is separate from K3 actually submitting a method exercise. */
 methodChoice?:MethodChoice;
 /** One completed revision stays frozen when a fresh practice round begins. */
 contentVersion?:string;
 rubricVersion?:string;
 reviewedAt?:string|null;
 /** Explicit post-save learner action; no automatic model-answer reveal. */
 answerRevealed?:boolean;
 /** Never compare an older submitted answer against a later editorial revision. */
 reviewSnapshot?:EditorialReviewSnapshot;
 startedAt?:string|null;
 attemptNumber?:number;
 attemptHistory?:PastEditorialAttempt[];
};
export const NATIVE_KEY='li.review.L09-1-2.v1';
export const PILOT_KEY='step16.l09.react-island.v1';
export const LOCALE_KEY='li.app.locale.v1';
const TEST_QUERY='native-localhost-test';

export function initial():Attempt{
 return{locale:'vi',draft:['','','',''],guidedDraft:'',hint:false,assisted:false,
  submitted:false,submittedAt:null,submission:null,submissionLocale:null,
  ratings:[null,null,null,null],reviewed:false};
}
function isTextTuple(input:unknown):input is [string,string,string,string]{
 return Array.isArray(input)&&input.length===4&&input.every(x=>typeof x==='string');
}
function isRatingTuple(input:unknown):input is [Rating,Rating,Rating,Rating]{
 return Array.isArray(input)&&input.length===4&&input.every(x=>x===null||x===0||x===1||x===2);
}
function object(input:unknown):input is Record<string,unknown>{
 return input!==null&&typeof input==='object'&&!Array.isArray(input);
}
function nativeShape(input:Record<string,unknown>):boolean{
 // Strict on fields present; native lesson has shipped records with no schema property.
 return (!('draft' in input)||isTextTuple(input.draft))&&
   (!('ratings' in input)||isRatingTuple(input.ratings))&&
   (!('guidedDraft' in input)||typeof input.guidedDraft==='string')&&
   (!('hint' in input)||typeof input.hint==='boolean')&&
   (!('assisted' in input)||typeof input.assisted==='boolean')&&
   (!('submitted' in input)||typeof input.submitted==='boolean')&&
   (!('reviewed' in input)||typeof input.reviewed==='boolean')&&
   (!('locale' in input)||input.locale==='vi'||input.locale==='en')&&
   (!('submittedAt' in input)||input.submittedAt===null||typeof input.submittedAt==='string')&&
   (!('submission' in input)||input.submission===null||isTextTuple(input.submission))&&
   (!('submissionLocale' in input)||input.submissionLocale===null||input.submissionLocale==='vi'||input.submissionLocale==='en');
}
export class BridgeError extends Error{
 constructor(public reason:'changed'|'invalid'|'storage'|'readback'){super(reason);}
}
export type ReadResult={state:Attempt;raw:string|null;invalid:boolean};
type StorageReader=Pick<Storage,'getItem'|'setItem'>;
export class L09StorageBridge{
 readonly nativeFixture:boolean;
 readonly key:string;
 constructor(private storage:StorageReader,locationInfo:Pick<Location,'hostname'|'pathname'|'search'>){
  this.nativeFixture=(locationInfo.hostname==='localhost'||locationInfo.hostname==='127.0.0.1')&&
   locationInfo.pathname.includes('/tools/step16-real-l09-react-island/dist')&&
   new URLSearchParams(locationInfo.search).get('bridge')===TEST_QUERY;
  this.key=this.nativeFixture?NATIVE_KEY:PILOT_KEY;
 }
 read():ReadResult{
  let raw:string|null;
  try{raw=this.storage.getItem(this.key);}
  catch{throw new BridgeError('storage');}
  if(raw===null){
   const fresh=initial();
   if(this.nativeFixture){
    try{const global=this.storage.getItem(LOCALE_KEY);if(global==='vi'||global==='en')fresh.locale=global;}
    catch{throw new BridgeError('storage');}
   }
   return{state:fresh,raw:null,invalid:false};
  }
  try{
   const data:unknown=JSON.parse(raw);
   if(!object(data)||!nativeShape(data))throw new Error('Invalid native attempt shape');
   const state={...initial(),...data} as Attempt;
   if(this.nativeFixture){
    const global=this.storage.getItem(LOCALE_KEY);
    if(global==='vi'||global==='en')state.locale=global;
   }
   return{state,raw,invalid:false};
  }catch{
   return{state:initial(),raw,invalid:true};
  }
 }
 write(next:Attempt,expectedRaw:string|null):string{
  if(!nativeShape(next))throw new BridgeError('invalid');
  let current:string|null;
  try{current=this.storage.getItem(this.key);}
  catch{throw new BridgeError('storage');}
  if(current!==expectedRaw)throw new BridgeError('changed');
  let prior:Record<string,unknown>={};
  if(current!==null){
   try{
    const parsed:unknown=JSON.parse(current);
    if(!object(parsed)||!nativeShape(parsed))throw new Error('Unsupported current record');
    prior=parsed;
   }catch{throw new BridgeError('invalid');}
  }
  // Keep future fields the old native author may have stored; don't silently discard.
  const value=JSON.stringify({...prior,...next});
  try{
   // localStorage.setItem is one atomic string assignment, not a multi-tab
   // compare-and-swap or a multi-key ACID transaction.
   this.storage.setItem(this.key,value);
   if(this.storage.getItem(this.key)!==value)throw new BridgeError('readback');
  }catch(e){
   if(e instanceof BridgeError)throw e;
   throw new BridgeError('storage');
  }
  return value;
 }
 setGlobalLocale(locale:Locale){
  if(!this.nativeFixture)return;
  try{
   this.storage.setItem(LOCALE_KEY,locale);
   if(this.storage.getItem(LOCALE_KEY)!==locale)throw new BridgeError('readback');
  }catch(e){
   if(e instanceof BridgeError)throw e;
   throw new BridgeError('storage');
  }
 }
}
