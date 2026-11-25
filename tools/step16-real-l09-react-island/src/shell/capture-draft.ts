/** Unsaved Capture text is local-only, not a new Neon record or auth grant.
 * Only the already verified learner who owns the device's active account
 * may read/write this draft through the UI. Persist text and taxonomy together.
 */
export type CaptureDraft={text:string;fieldId:string|null};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const OWNER='li.sync.local-owner.v1';
const key=(uid:string)=>'li.private.capture-draft.v1:'+encodeURIComponent(uid);
export const blankCaptureDraft=():CaptureDraft=>({text:'',fieldId:null});
function requireOwner(store:Store,uid:string,verified:boolean){
 if(!verified||!uid||store.getItem(OWNER)!==uid)throw Error('CAPTURE_DRAFT_OWNER_REQUIRED');
}
export function readCaptureDraft(store:Store,uid:string,verified:boolean):CaptureDraft{
 requireOwner(store,uid,verified);
 const raw=store.getItem(key(uid));
 if(raw===null)return blankCaptureDraft();
 const data=JSON.parse(raw) as CaptureDraft;
 if(!data||typeof data.text!=='string'||
    !(data.fieldId===null||typeof data.fieldId==='string'))throw Error('CAPTURE_DRAFT_INVALID');
 return {text:data.text,fieldId:data.fieldId};
}
export function writeCaptureDraft(store:Store,uid:string,verified:boolean,draft:CaptureDraft):void{
 requireOwner(store,uid,verified);
 const k=key(uid);
 if(draft.text===''&&draft.fieldId===null){
  store.removeItem(k);
  if(store.getItem(k)!==null)throw Error('CAPTURE_DRAFT_REMOVE_FAILED');
  return;
 }
 const raw=JSON.stringify(draft);
 store.setItem(k,raw);
 if(store.getItem(k)!==raw)throw Error('CAPTURE_DRAFT_WRITE_FAILED');
}
