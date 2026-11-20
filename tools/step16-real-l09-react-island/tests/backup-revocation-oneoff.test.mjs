import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {PrivateDeviceStore} from '../.sync-test/local-dexie.js';
import {exportAccountBackup,restoreAccountBackup} from '../.sync-test/account-backup.js';
import {checkInviteAccess} from '../.sync-test/invite-access.js';
import {storageKey} from '../.sync-test/contract.js';

const owner='synthetic-invite-owner-A',other='synthetic-uninvited-C';
const id=()=>crypto.randomUUID();
const make=()=>new PrivateDeviceStore('li-auth-backup-oneoff-'+id());
async function dispose(...stores){
 for(const store of stores){store.close();await store.delete();}
}
function token(sub){
 return 'e30.'+Buffer.from(JSON.stringify({sub,role:'authenticated',exp:4102444800})).toString('base64url')+'.signature';
}
const auth=(sub)=>({async getSession(){return {data:{user:{id:sub}}};},async getJWTToken(){return token(sub);}});
const api='https://example.apirest.neon.tech/li/rest/v1';
const response=x=>new Response(JSON.stringify(x),{status:200,headers:{'Content-Type':'application/json'}});

test('real Dexie backup -> fresh local DB restore, no credentials and same durable upload intents',async()=>{
 const first=make(),second=make();
 try{
  await first.edit(owner,'note','sample-note',{text:'Chỉ là dữ liệu giả',order:{b:2,a:1}});
  await first.edit(owner,'bookmark','sample-deleted',{isSaved:false},'2026-11-20T12:00:00Z');
  await first.edit(other,'note','other-owner',{text:'Do not export'});
  const json=await exportAccountBackup(first,owner),backup=JSON.parse(json);
  assert.equal(backup.items.length,2);
  assert.equal(backup.accountId,owner);
  assert.doesNotMatch(json,/other-owner|Do not export|access_token|refresh_token|Authorization|password/);
  const restored=await restoreAccountBackup(second,owner,json);
  assert.deepEqual(restored,{restored:2,skipped:0});
  assert.equal((await second.records.get(storageKey(owner,'note','sample-note'))).payload.text,'Chỉ là dữ liệu giả');
  assert.equal((await second.records.get(storageKey(owner,'bookmark','sample-deleted'))).deletedAt,'2026-11-20T12:00:00Z');
  assert.equal((await second.pending(owner)).length,2);
  assert.equal(await second.records.get(storageKey(other,'note','other-owner')),undefined);
  const twice=await restoreAccountBackup(second,owner,json);
  assert.deepEqual(twice,{restored:0,skipped:2},'must NOT overwrite existing local records');
 }finally{await dispose(first,second);}
});

test('wrong-account import, duplicated items, invalid JSON all fail before writing anything',async()=>{
 const source=make(),target=make();
 try{
  await source.edit(owner,'preference','one',{view:'light'});
  const backup=await exportAccountBackup(source,owner);
  await assert.rejects(restoreAccountBackup(target,other,backup),/WRONG_ACCOUNT_OR_SCHEMA/);
  const duplicated=JSON.parse(backup);
  duplicated.items.push({...duplicated.items[0]});
  await assert.rejects(restoreAccountBackup(target,owner,JSON.stringify(duplicated)),/DUPLICATE_ITEM/);
  await assert.rejects(restoreAccountBackup(target,owner,'{invalid'),/INVALID_JSON/);
  assert.equal((await target.accountRecords(owner)).length,0);
  assert.equal((await target.accountRecords(other)).length,0);
 }finally{await dispose(source,target);}
});

test('revoke invite: SAME signed session becomes denied on next server invitation check',async()=>{
 let revoked=false,seen=0;
 const request=async(url,options)=>{
  seen++;
  assert.equal(new URL(url).pathname,'/li/rest/v1/rpc/li_is_invited');
  assert.equal(options.method,'POST');
  assert.equal(options.headers.Authorization,'Bearer '+token(owner));
  assert.equal(options.credentials,'omit');
  return response(!revoked);
 };
 assert.equal(await checkInviteAccess(api,auth(owner),request),true);
 revoked=true;
 assert.equal(await checkInviteAccess(api,auth(owner),request),false);
 assert.equal(seen,2);
});

test('unsigned and subject-mismatched session never gets the invitation check',async()=>{
 let calls=0;
 const request=async()=>{calls++;return response(true);};
 assert.equal(await checkInviteAccess(api,{async getSession(){return {data:{user:null}};},async getJWTToken(){throw Error('MUST_NOT_CALL');}},request),false);
 await assert.rejects(checkInviteAccess(api,{async getSession(){return {data:{user:{id:owner}}};},async getJWTToken(){return token(other);}},request),/ACCOUNT_MISMATCH/);
 assert.equal(calls,0);
});
