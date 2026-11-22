import React,{useEffect,useState} from 'react';
import {Button,Card,Heading,Text} from '../../../../design-system/react/index';
import {
 createVault,readVaultManifest,registerVault,unlockVault,recoverVault,
 migrateLegacyPayloads,setCurrentVault,currentVault,finishVaultMigration,replacePassphrase
} from '../sync/e2ee-cloud.js';
import type {MigrationProgress} from '../sync/e2ee-cloud.js';
import type {Vault,VaultManifest} from '../sync/e2ee-vault.js';
import {bindNeonAccount} from '../sync/neon-session.js';
import {NEON_DATA_API_URL} from './config.js';
import {neonSessionPort} from './neon-client.js';

/** Settings-only E2EE pilot. No passwords/recovery codes are written to storage.
 * Uses canonical Design System Card/Button and existing ds-control input contract. */
export function VaultSettings({accountId,locale,online}:{
 accountId:string;locale:'vi'|'en';online:boolean
}){
 const [manifest,setManifest]=useState<VaultManifest|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [password,setPassword]=useState('');
 const [confirmation,setConfirmation]=useState('');
 const [recoveryInput,setRecoveryInput]=useState('');
 const [useRecovery,setUseRecovery]=useState(false);
 const [pending,setPending]=useState<{manifest:VaultManifest;vault:Vault;recoveryCode:string}|null>(null);
 const [savedCode,setSavedCode]=useState(false);
 const [migration,setMigration]=useState<MigrationProgress|null>(null);
 const [unlocked,setUnlocked]=useState(Boolean(currentVault(accountId)));
 const vi=locale==='vi';
 useEffect(()=>{
  let cancelled=false;
  setManifest(null);setLoading(true);setError('');setPending(null);
  setUnlocked(Boolean(currentVault(accountId)));
  if(!online){setLoading(false);return;}
  void (async()=>{
   try{
    const api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
    if(!api||api.accountId!==accountId)throw Error('E2EE_ACCOUNT_CHANGED');
    const vault=await readVaultManifest(api);
    if(!cancelled)setManifest(vault);
   }catch{if(!cancelled)setError(vi?
    'Chưa đọc được trạng thái mã hóa từ Neon. Không có dữ liệu nào bị thay đổi.':
    'Cannot read encryption status from Neon. No data has been changed.');}
   finally{if(!cancelled)setLoading(false);}
  })();
  return()=>{cancelled=true;};
 },[accountId,online]);
 async function connected(){
  if(!online)throw Error('E2EE_OFFLINE_NOT_SETUP');
  const api=await bindNeonAccount(NEON_DATA_API_URL,neonSessionPort);
  if(!api||api.accountId!==accountId)throw Error('E2EE_ACCOUNT_CHANGED');
  return api;
 }
 const message=(err:unknown)=>{
  const code=err instanceof Error?err.message:'';
  if(code==='E2EE_PASSPHRASE_TOO_SHORT')return vi?
   'Mật khẩu mã hóa cần ít nhất 12 ký tự.':'Use at least 12 characters for the encryption passphrase.';
  if(code==='E2EE_UNLOCK_FAILED')return vi?
   'Sai mật khẩu/khóa khôi phục hoặc dữ liệu khóa bị thay đổi.':'Incorrect passphrase/recovery key or modified keybag.';
  if(code==='E2EE_KEYBAG_ALREADY_EXISTS')return vi?
   'Tài khoản đã có khóa mã hóa. Tải lại trạng thái và mở khóa.':
   'This account already has a vault. Refresh and unlock it.';
  return vi?'Chưa hoàn tất bảo vệ dữ liệu. Đồng bộ đang khóa; hãy thử lại.':
   'Encryption is incomplete. Sync remains locked; retry.';
 };
 async function generate(){
  if(busy)return;
  setError('');setBusy(true);
  try{
   if(password!==confirmation)throw Error('PASSWORD_MISMATCH');
   const created=await createVault(accountId,password);
   setPending(created);setSavedCode(false);setPassword('');setConfirmation('');
  }catch(err){setError(err instanceof Error&&err.message==='PASSWORD_MISMATCH'?
   (vi?'Hai mật khẩu không khớp.':'Passwords do not match.'):message(err));}
  finally{setBusy(false);}
 }
 async function finishSetup(){
  if(!pending||!savedCode||busy)return;
  setBusy(true);setError('');
  try{
   const api=await connected();
   const current=await readVaultManifest(api);
   if(!current)await registerVault(api,pending.manifest);
   else if(JSON.stringify(current)!==JSON.stringify(pending.manifest))
    throw Error('E2EE_KEYBAG_ALREADY_EXISTS');
   setManifest(pending.manifest);
   setCurrentVault(accountId,pending.vault);
   const summary=await migrateLegacyPayloads(api,pending.vault,setMigration);
   finishVaultMigration(accountId,pending.vault);
   setMigration(summary);setUnlocked(true);setPending(null);
  }catch(err){setError(message(err));}
  finally{setBusy(false);}
 }
 async function unlockAndProtect(){
  if(busy||!manifest)return;
  setBusy(true);setError('');
  try{
   const vault=useRecovery?
    await recoverVault(manifest,accountId,recoveryInput.trim()):
    await unlockVault(manifest,accountId,password);
   const api=await connected();
   // Migration explicitly resumes after unlock. A failed partial migration
   // never unlocks normal sync or marks data as protected.
   setCurrentVault(accountId,vault);
   const summary=await migrateLegacyPayloads(api,vault,setMigration);
   finishVaultMigration(accountId,vault);
   setMigration(summary);setUnlocked(true);setPassword('');setRecoveryInput('');
  }catch(err){setError(message(err));}
  finally{setBusy(false);}
 }
 async function resetPassword(){
  if(busy||!manifest||!currentVault(accountId))return;
  setBusy(true);setError('');
  try{
   if(password!==confirmation)throw Error('PASSWORD_MISMATCH');
   await replacePassphrase(await connected(),currentVault(accountId)!,password);
   setManifest(await readVaultManifest(await connected()));
   setPassword('');setConfirmation('');
  }catch(err){setError(err instanceof Error&&err.message==='PASSWORD_MISMATCH'?
   (vi?'Hai mật khẩu không khớp.':'Passwords do not match.'):message(err));}
  finally{setBusy(false);}
 }
 return <Card variant="raised">
  <Heading level={4} role="titleSmall">{vi?'Quyền riêng tư · E2EE':'Privacy · E2EE'}</Heading>
  <Text role="support">{vi?
   'Bảo vệ nội dung đồng bộ bằng khóa trên thiết bị. Neon vẫn thấy email và metadata phục vụ xác thực/đồng bộ.':
   'Protect synced content using a device-side key. Neon can still see email and sync metadata.'}</Text>
  {!online&&<Text role="support">{vi?
   'Đang offline: có thể tiếp tục học trên máy. Mở khóa cloud cần kết nối.':
   'Offline: device learning still works. Cloud unlock needs a connection.'}</Text>}
  {loading?<p role="status">{vi?'Đang kiểm tra khóa…':'Checking vault…'}</p>:null}
  {error?<p role="alert">{error}</p>:null}
  {!loading&&!manifest&&!pending&&online&&!error&&<section>
   <p>{vi?'Tạo mật khẩu riêng (khác mật khẩu Google) và lưu mã khôi phục.':
     'Create a separate encryption passphrase and save the recovery code.'}</p>
   <label htmlFor="li-e2ee-new-pass">{vi?'Mật khẩu mã hóa':'Encryption passphrase'}</label>
   <input id="li-e2ee-new-pass" className="ds-control" type="password"
    autoComplete="new-password" minLength={12} value={password}
    onChange={e=>setPassword(e.target.value)} disabled={busy}/>
   <label htmlFor="li-e2ee-new-confirm">{vi?'Nhập lại':'Confirm passphrase'}</label>
   <input id="li-e2ee-new-confirm" className="ds-control" type="password"
    autoComplete="new-password" value={confirmation}
    onChange={e=>setConfirmation(e.target.value)} disabled={busy}/>
   <Button variant="primary" disabled={busy||password.length<12||!confirmation}
    onClick={()=>void generate()}>{vi?'Tạo khóa bảo vệ':'Create vault'}</Button>
  </section>}
  {pending&&<section>
   <p><strong>{vi?'Mã khôi phục — chỉ xuất hiện lúc tạo khóa:':
    'Recovery code — displayed only during setup:'}</strong></p>
   <output style={{overflowWrap:'anywhere'}}>{pending.recoveryCode}</output>
   <Button variant="secondary" onClick={()=>void navigator.clipboard.writeText(pending.recoveryCode)
    .catch(()=>setError(vi?'Không copy được. Hãy lưu mã thủ công.':'Copy failed. Save manually.'))}>
    {vi?'Sao chép mã':'Copy recovery code'}</Button>
   <label><input type="checkbox" checked={savedCode}
    onChange={e=>setSavedCode(e.target.checked)}/>
    {vi?' Tôi đã lưu mã khôi phục ở nơi an toàn.':
     ' I saved the recovery code somewhere safe.'}</label>
   <Button variant="primary" disabled={!savedCode||busy}
    onClick={()=>void finishSetup()}>{busy?
     (vi?'Đang mã hóa dữ liệu cũ…':'Encrypting existing data…'):
     (vi?'Bắt đầu bảo vệ':'Protect my data')}</Button>
  </section>}
  {!loading&&manifest&&!unlocked&&!pending&&<section>
   <p>{vi?'Dữ liệu cloud chỉ đồng bộ sau khi mở khóa và hoàn tất chuyển đổi.':
    'Cloud sync resumes after vault unlock and migration.'}</p>
   <Button variant={!useRecovery?'primary':'secondary'} disabled={busy}
    onClick={()=>setUseRecovery(false)}>{vi?'Mật khẩu':'Passphrase'}</Button>
   <Button variant={useRecovery?'primary':'secondary'} disabled={busy}
    onClick={()=>setUseRecovery(true)}>{vi?'Mã khôi phục':'Recovery code'}</Button>
   {useRecovery?
    <><label htmlFor="li-e2ee-recovery">{vi?'Nhập mã khôi phục':'Enter recovery code'}</label>
    <input id="li-e2ee-recovery" className="ds-control" type="password"
     autoComplete="off" value={recoveryInput}
     onChange={e=>setRecoveryInput(e.target.value)} disabled={busy}/></>:
    <><label htmlFor="li-e2ee-pass">{vi?'Mật khẩu mã hóa':'Encryption passphrase'}</label>
    <input id="li-e2ee-pass" className="ds-control" type="password"
     autoComplete="off" value={password}
     onChange={e=>setPassword(e.target.value)} disabled={busy}/></>}
   <Button variant="primary" disabled={busy||(useRecovery?!recoveryInput:!password)}
    onClick={()=>void unlockAndProtect()}>{busy?
     (vi?'Đang mở khóa và chuyển dữ liệu…':'Unlocking and migrating…'):
     (vi?'Mở khóa đồng bộ':'Unlock sync')}</Button>
  </section>}
  {unlocked&&<section>
   <p role="status">{vi?'Đã mở khóa trên thiết bị này. Dữ liệu cloud đã kiểm tra mã hóa.':
     'Unlocked on this device. Cloud payloads verified encrypted.'}</p>
   <p>{vi?'Đổi mật khẩu mã hóa (không đổi mã khôi phục):':
     'Change encryption passphrase (keeps existing recovery code):'}</p>
   <label htmlFor="li-e2ee-change">{vi?'Mật khẩu mới':'New passphrase'}</label>
   <input id="li-e2ee-change" className="ds-control" type="password"
    autoComplete="new-password" value={password}
    onChange={e=>setPassword(e.target.value)} disabled={busy}/>
   <label htmlFor="li-e2ee-change-confirm">{vi?'Nhập lại':'Confirm'}</label>
   <input id="li-e2ee-change-confirm" className="ds-control" type="password"
    autoComplete="new-password" value={confirmation}
    onChange={e=>setConfirmation(e.target.value)} disabled={busy}/>
   <Button variant="secondary" disabled={busy||password.length<12||!confirmation}
    onClick={()=>void resetPassword()}>{vi?'Đổi mật khẩu':'Change passphrase'}</Button>
  </section>}
  {migration&&<Text role="support">{vi?
   'Mã hóa bản cũ: '+migration.encrypted+'; đã mã hóa: '+migration.alreadyEncrypted+'/'+migration.total:
   'Converted: '+migration.encrypted+'; previously encrypted: '+migration.alreadyEncrypted+'/'+migration.total}</Text>}
  <Text role="support">{vi?
   'Mất cả mật khẩu và mã khôi phục có thể khiến dữ liệu cloud không thể phục hồi.':
   'Losing both the passphrase and recovery code may make cloud data unrecoverable.'}</Text>
 </Card>;
}
