/**
 * li. E2EE v1 — WebCrypto-only client vault. No new database/service.
 *
 * Protected: all private JSON payloads sent to li_user_state. Index fields
 * (owner_id, item_type, item_id, revision, timestamps, tombstones) remain
 * server-visible for RLS and sync. Never claim those are end-to-end hidden.
 *
 * This module does not touch production, persist a key, or automatically
 * convert the user's existing plaintext rows.
 */
import type {Edit,ItemType,JsonValue} from './contract.js';

const encoder=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
const encode=(text:string)=>encoder.encode(text);
const MASTER_BYTES=32;
const SALT_BYTES=16;
const NONCE_BYTES=12;
const MIN_PASSPHRASE=12;
const PBKDF2_ROUNDS=600_000;
const PAYLOAD_SCHEMA='li.e2ee.payload.v1' as const;
const VAULT_SCHEMA='li.e2ee.keybag.v1' as const;
export const VAULT_ITEM_ID='__li_e2ee_keybag_v1';
const random=(size:number)=>crypto.getRandomValues(new Uint8Array(size));

type Wrap={nonce:string;ciphertext:string};
export type VaultManifest={
 schema:typeof VAULT_SCHEMA;
 accountId:string;
 passphrase:{salt:string;rounds:number;wrap:Wrap};
 recovery:{wrap:Wrap};
};
export type SealedPayload={
 schema:typeof PAYLOAD_SCHEMA;
 nonce:string;
 ciphertext:string;
};
export type Vault={
 readonly accountId:string;
 readonly aesKey:CryptoKey;
 readonly nonceKey:CryptoKey;
 /** Memory-only. Required to rewrap with a recovery key. Never serialize. */
 readonly master:Uint8Array;
};

function fail(code:string):never{throw new Error(code);}
function base64(bytes:Uint8Array):string{
 let binary='';
 for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function unbase64(value:string):Uint8Array{
 if(typeof value!=='string'||!value||!/^[A-Za-z0-9_-]+$/.test(value))fail('E2EE_INVALID_BASE64');
 const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/'));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function bytes(value:Uint8Array):ArrayBuffer{
 // Workaround for DOM BufferSource overloads (TS 5.9 typed-array generics).
 return Uint8Array.from(value).buffer as ArrayBuffer;
}
function aad(accountId:string,kind:string,id:string){
 return bytes(encode(JSON.stringify([PAYLOAD_SCHEMA,accountId,kind,id])));
}
function wrapAad(accountId:string){
 return bytes(encode(JSON.stringify([VAULT_SCHEMA,accountId])));
}
async function passphraseKey(passphrase:string,salt:Uint8Array,rounds:number):Promise<CryptoKey>{
 if(typeof passphrase!=='string'||[...passphrase].length<MIN_PASSPHRASE)
  fail('E2EE_PASSPHRASE_TOO_SHORT');
 if(salt.length!==SALT_BYTES||rounds!==PBKDF2_ROUNDS)fail('E2EE_UNSUPPORTED_KDF');
 const input=await crypto.subtle.importKey('raw',encode(passphrase),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey(
  {name:'PBKDF2',hash:'SHA-256',salt:bytes(salt),iterations:rounds},
  input,{name:'AES-GCM',length:256},false,['encrypt','decrypt']
 );
}
async function recoveryKey(code:string):Promise<CryptoKey>{
 if(typeof code!=='string'||!code.startsWith('li1-'))fail('E2EE_INVALID_RECOVERY_CODE');
 const raw=unbase64(code.slice(4));
 if(raw.length!==MASTER_BYTES)fail('E2EE_INVALID_RECOVERY_CODE');
 return crypto.subtle.importKey('raw',bytes(raw),{name:'AES-GCM'},false,['decrypt']);
}
async function wrap(master:Uint8Array,key:CryptoKey,accountId:string):Promise<Wrap>{
 const nonce=random(NONCE_BYTES);
 const ciphertext=await crypto.subtle.encrypt(
  {name:'AES-GCM',iv:bytes(nonce),additionalData:wrapAad(accountId),tagLength:128},
  key,bytes(master)
 );
 return {nonce:base64(nonce),ciphertext:base64(new Uint8Array(ciphertext))};
}
async function unwrap(record:Wrap,key:CryptoKey,accountId:string):Promise<Uint8Array>{
 if(!record||typeof record!=='object')fail('E2EE_BAD_KEYBAG');
 const nonce=unbase64(record.nonce),cipher=unbase64(record.ciphertext);
 if(nonce.length!==NONCE_BYTES||cipher.length<MASTER_BYTES+16)fail('E2EE_BAD_KEYBAG');
 try{
  const clear=await crypto.subtle.decrypt(
   {name:'AES-GCM',iv:bytes(nonce),additionalData:wrapAad(accountId),tagLength:128},
   key,bytes(cipher)
  );
  const master=new Uint8Array(clear);
  if(master.length!==MASTER_BYTES)fail('E2EE_BAD_KEYBAG');
  return master;
 }catch{fail('E2EE_UNLOCK_FAILED');}
}
async function importVault(accountId:string,master:Uint8Array):Promise<Vault>{
 if(!accountId?.trim()||master.length!==MASTER_BYTES)fail('E2EE_INVALID_VAULT');
 const ikm=await crypto.subtle.importKey('raw',bytes(master),'HKDF',false,['deriveKey']);
 const salt=encode('li:e2ee:hkdf:v1:'+accountId);
 const aesKey=await crypto.subtle.deriveKey(
  {name:'HKDF',hash:'SHA-256',salt:bytes(salt),info:bytes(encode('payload:aes-gcm'))},
  ikm,{name:'AES-GCM',length:256},false,['encrypt','decrypt']
 );
 const nonceKey=await crypto.subtle.deriveKey(
  {name:'HKDF',hash:'SHA-256',salt:bytes(salt),info:bytes(encode('payload:nonce-hmac'))},
  ikm,{name:'HMAC',hash:'SHA-256',length:256},false,['sign']
 );
 return {accountId,aesKey,nonceKey,master};
}
export function isVaultManifest(value:unknown):value is VaultManifest{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 const p=v.passphrase as Record<string,unknown>|undefined;
 const r=v.recovery as Record<string,unknown>|undefined;
 const valid=(w:unknown):w is Wrap=>Boolean(w&&typeof w==='object'&&
  typeof (w as Wrap).nonce==='string'&&typeof (w as Wrap).ciphertext==='string');
 return v.schema===VAULT_SCHEMA&&typeof v.accountId==='string'&&
  Boolean(p)&&typeof p?.salt==='string'&&p.rounds===PBKDF2_ROUNDS&&
  valid(p?.wrap)&&Boolean(r)&&valid(r?.wrap);
}
export function isSealedPayload(value:unknown):value is SealedPayload{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return v.schema===PAYLOAD_SCHEMA&&typeof v.nonce==='string'&&
   typeof v.ciphertext==='string';
}
export async function createVault(accountId:string,passphrase:string):
 Promise<{manifest:VaultManifest;vault:Vault;recoveryCode:string}>{
 if(!accountId?.trim())fail('E2EE_INVALID_ACCOUNT');
 if(typeof passphrase!=='string'||[...passphrase].length<MIN_PASSPHRASE)
  fail('E2EE_PASSPHRASE_TOO_SHORT');
 const master=random(MASTER_BYTES);
 const salt=random(SALT_BYTES),codeBytes=random(MASTER_BYTES);
 const key=await passphraseKey(passphrase,salt,PBKDF2_ROUNDS);
 const backupKey=await crypto.subtle.importKey('raw',bytes(codeBytes),'AES-GCM',false,['encrypt']);
 const manifest:VaultManifest={
  schema:VAULT_SCHEMA,accountId,
  passphrase:{salt:base64(salt),rounds:PBKDF2_ROUNDS,wrap:await wrap(master,key,accountId)},
  recovery:{wrap:await wrap(master,backupKey,accountId)}
 };
 return {manifest,vault:await importVault(accountId,master),recoveryCode:'li1-'+base64(codeBytes)};
}
export async function unlockVault(manifest:VaultManifest,accountId:string,passphrase:string):Promise<Vault>{
 if(!isVaultManifest(manifest)||manifest.accountId!==accountId)fail('E2EE_VAULT_OWNER_MISMATCH');
 const key=await passphraseKey(passphrase,unbase64(manifest.passphrase.salt),manifest.passphrase.rounds);
 return importVault(accountId,await unwrap(manifest.passphrase.wrap,key,accountId));
}
export async function recoverVault(manifest:VaultManifest,accountId:string,code:string):Promise<Vault>{
 if(!isVaultManifest(manifest)||manifest.accountId!==accountId)fail('E2EE_VAULT_OWNER_MISMATCH');
 return importVault(accountId,await unwrap(manifest.recovery.wrap,await recoveryKey(code),accountId));
}
export async function changeVaultPassphrase(vault:Vault,manifest:VaultManifest,newPassphrase:string):Promise<VaultManifest>{
 if(!isVaultManifest(manifest)||vault.accountId!==manifest.accountId)fail('E2EE_VAULT_OWNER_MISMATCH');
 const salt=random(SALT_BYTES);
 const key=await passphraseKey(newPassphrase,salt,PBKDF2_ROUNDS);
 return {...manifest,passphrase:{
  salt:base64(salt),rounds:PBKDF2_ROUNDS,wrap:await wrap(vault.master,key,vault.accountId)
 }};
}
/** Canonical JSONB-style equality for security-sensitive Neon round-trips. */
export function canonical(value:unknown):string{
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 const obj=value as Record<string,unknown>;
 return '{'+Object.keys(obj).sort().map(k=>JSON.stringify(k)+':'+canonical(obj[k])).join(',')+'}';
}
function bound(vault:Vault,accountId:string,itemType:ItemType,itemId:string){
 if(!accountId||vault.accountId!==accountId||!itemType||!itemId)fail('E2EE_ACCOUNT_OR_ITEM_MISMATCH');
}
/** Stable across offline retry/restart for one UUID opId+one exact plaintext.
 * HMAC secret makes IV unpredictable; changing the message changes the IV.
 * Never reuse an opId for a logically distinct edit. */
export async function sealPrivatePayload(vault:Vault,accountId:string,edit:Edit):Promise<SealedPayload>{
 bound(vault,accountId,edit.itemType,edit.itemId);
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(edit.opId))
  fail('E2EE_INVALID_OPERATION_ID');
 const raw=canonical(edit.payload);
 const input=encode(JSON.stringify([edit.opId,edit.itemType,edit.itemId,raw]));
 const digest=await crypto.subtle.sign('HMAC',vault.nonceKey,bytes(input));
 const nonce=new Uint8Array(digest).slice(0,NONCE_BYTES);
 const cipher=await crypto.subtle.encrypt(
  {name:'AES-GCM',iv:bytes(nonce),additionalData:aad(accountId,edit.itemType,edit.itemId),tagLength:128},
  vault.aesKey,bytes(encode(raw))
 );
 return {schema:PAYLOAD_SCHEMA,nonce:base64(nonce),ciphertext:base64(new Uint8Array(cipher))};
}
export async function openPrivatePayload(vault:Vault,accountId:string,itemType:ItemType,itemId:string,
 payload:JsonValue):Promise<JsonValue>{
 bound(vault,accountId,itemType,itemId);
 if(!isSealedPayload(payload))fail('E2EE_UNENCRYPTED_REMOTE');
 const nonce=unbase64(payload.nonce),cipher=unbase64(payload.ciphertext);
 if(nonce.length!==NONCE_BYTES||cipher.length<17)fail('E2EE_MALFORMED_PAYLOAD');
 let clear:ArrayBuffer;
 try{
  clear=await crypto.subtle.decrypt(
   {name:'AES-GCM',iv:bytes(nonce),additionalData:aad(accountId,itemType,itemId),tagLength:128},
   vault.aesKey,bytes(cipher)
  );
 }catch{fail('E2EE_DECRYPT_FAILED');}
 try{return JSON.parse(decoder.decode(clear)) as JsonValue;}
 catch{fail('E2EE_DECODE_FAILED');}
}
