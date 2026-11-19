import React from 'react';
import {AuthPanel} from './AuthPanel.js';
import {isTrustedAuthOrigin} from './config.js';
import './settings-account.css';

/**
 * Settings → Data & privacy: one React account panel, reusing Step16.1's
 * Google/Auth/Neon invite checks. No second account implementation.
 * Localhost/preview is a layout-only view: never issue signed auth requests.
 * Production mounting is NOT authorized by this research-only router.
 */
export function SettingsAccount(){
 if(!isTrustedAuthOrigin(window.location.origin)){
  return <section className="li-settings-auth surface" aria-labelledby="li-settings-account-title"
    data-auth-origin-blocked="true" data-settings-account>
    <p className="kicker">TÀI KHOẢN · BẢN THỬ NGHIỆM</p>
    <h3 id="li-settings-account-title">Đăng nhập Google</h3>
    <p role="status">Đăng nhập chỉ hoạt động trên tên miền li. đã được Neon tin cậy.
      Bản thử nghiệm này không yêu cầu hay lưu thông tin đăng nhập.</p>
    <p className="auth-local">Dữ liệu vẫn trên thiết bị · Chưa đồng bộ cloud</p>
  </section>;
 }
 return <AuthPanel embedded/>;
}
