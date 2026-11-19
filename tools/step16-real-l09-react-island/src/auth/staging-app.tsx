import React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthPanel} from './AuthPanel.js';

// Unified GitHub Pages staging: no guest app. React verifies signed invitation.
const root=document.getElementById('li-staging-auth-root');
if(!root)throw Error('STAGING_AUTH_ROOT_MISSING');
const opener=document.getElementById('li-open-account');
function closeAccount(){
 document.documentElement.classList.remove('li-account-open');
 opener?.focus();
}
opener?.addEventListener('click',()=>{
 if(!document.documentElement.classList.contains('li-auth-verified'))return;
 document.documentElement.classList.add('li-account-open');
 root.focus();
});
createRoot(root).render(<AuthPanel onClose={closeAccount}/>);
