/**
 * Step 16 private learner state contract. Personal diary is deliberately excluded.
 * The signed-in identity is supplied by Neon Auth; no caller-owned row owner_id.
 */
export const kinds=['lesson_attempt','review_schedule','bookmark','note','preference','l2_progress'] as const;
export type ItemType=(typeof kinds)[number];
export type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
export type PrivateItem={owner_id:string;item_type:ItemType;item_id:string;revision:number;payload:JsonValue;changed_at:string;deleted_at:string|null;last_op_id?:string|null};
export type Edit={itemType:ItemType;itemId:string;payload:JsonValue;deletedAt:string|null;baseRevision:number;opId:string};
export class RevisionConflict extends Error{constructor(){super('REVISION_CONFLICT');this.name='RevisionConflict';}}
export function checkScope(accountId:string,itemType:string,itemId:string):asserts itemType is ItemType{
 if(!accountId.trim()||!kinds.includes(itemType as ItemType)||!itemId.trim()||itemId.length>180)throw new Error('INVALID_PRIVATE_SCOPE');
}
export function storageKey(accountId:string,itemType:ItemType,itemId:string){checkScope(accountId,itemType,itemId);return JSON.stringify([accountId,itemType,itemId]);}
