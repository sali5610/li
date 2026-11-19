import React from 'react';
import {createRoot} from 'react-dom/client';
import '../../../../site/assets/design-tokens.css';
import {AuthPanel} from './AuthPanel.js';
import {isTrustedAuthOrigin} from './config.js';
import './auth-shell.css';

const root=document.getElementById('root');
if(!root)throw Error('Auth research pilot mount is missing');
const approved=isTrustedAuthOrigin(window.location.origin);
// Trusted production origin is configured in Neon. Localhost and preview run
// must NOT issue credentialed Auth requests.
createRoot(root).render(approved?
 <AuthPanel/>:
 <main className="auth-pilot" data-auth-origin-blocked="true">
  <p className="auth-tag">li. · React Auth pilot</p>
  <h1>Chưa mở đăng nhập tại địa chỉ này</h1>
  <p>Neon Auth hiện chỉ tin cậy domain chính của li. Đây là bản nghiên cứu độc lập.</p>
  <p role="status" className="auth-local">Chỉ lưu thiết bị · Đồng bộ cloud đang khóa</p>
 </main>);
