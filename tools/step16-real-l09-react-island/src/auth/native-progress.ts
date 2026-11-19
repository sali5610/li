/**
 * A brand-new browser can have a persisted default lesson object even though
 * nobody has answered anything. This is not a conflict with a real cloud attempt.
 * Conservative: unknown fields or any submitted/rated/answered work count as data.
 */
export function isBlankNativeAttempt(v:Record<string,unknown>):boolean{
 const known=new Set(['locale','guidedDraft','draft','hint','assisted','submitted',
  'submission','submissionAt','submissionLocale','ratings','reviewed','guideOpen']);
 if(Object.keys(v).some(k=>!known.has(k)))return false;
 if(!Array.isArray(v.draft)||v.draft.length!==4||!v.draft.every(x=>typeof x==='string'&&x.trim()===''))return false;
 if(!Array.isArray(v.ratings)||v.ratings.length!==4||!v.ratings.every(x=>x===null))return false;
 return (typeof v.guidedDraft!=='string'||v.guidedDraft.trim()==='')&&
  v.submitted!==true&&v.reviewed!==true&&
  (v.submission===null||v.submission===undefined)&&
  (v.submissionAt===null||v.submissionAt===undefined);
}
