#!/usr/bin/env node
/** Build a reviewable Cloudflare Pages RELEASE CANDIDATE, never deploy.
 * Uses the SAME signed-in React app and static learning site as GitHub staging.
 * Fails closed if any critical marker/asset changes; does not touch site/.
 * Requires a separately G4-approved manual Cloudflare release to publish.
 */
import {cp,copyFile,mkdir,readFile,readdir,rm,stat,writeFile} from 'node:fs/promises';
import {join,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=resolve(fileURLToPath(new URL('..',import.meta.url)));
const src=join(repo,'site');
// Keep the original AI candidate intact. The new Auth-only mode contains
// the SAME React app, but no model endpoint, D1 or AI Worker bundle.
const authOnly=process.argv.length===3&&process.argv[2]==='--build-auth-only';
if(process.argv.length!==3||(!authOnly&&process.argv[2]!=='--build'))
 throw Error('Use --build (AI) or --build-auth-only (first-party Auth only)');
const output=join(repo,authOnly?'dist-cloudflare-auth-candidate':'dist-cloudflare-ai-candidate');
const app=join(repo,'tools/step16-real-l09-react-island/dist-cloudflare-app');
const worker=join(repo,'tools/step16-real-l09-react-island',
 authOnly?'dist-auth-worker/_worker.js':'dist-worker/_worker.js');

function replaceOnce(html,search,replacement){
 const first=html.indexOf(search);
 if(first<0||html.indexOf(search,first+search.length)!==-1)
  throw Error('RELEASE_CANDIDATE_MARKER_CHANGED: '+search.slice(0,70));
 return html.slice(0,first)+replacement+html.slice(first+search.length);
}
function requireOne(text,search){
 if(text.indexOf(search)<0||text.indexOf(search, text.indexOf(search)+search.length)!==-1)
  throw Error('RELEASE_CANDIDATE_MARKER_CHANGED: '+search.slice(0,70));
}
if(!(await stat(worker)).isFile())throw Error('FIRST_PARTY_WORKER_NOT_BUILT');
const files=await readdir(app);
const scripts=files.filter(name=>name.endsWith('.js'));
const css=files.filter(name=>name.endsWith('.css'));
if(!scripts.includes('li-first-party-app.js')||css.length!==1||scripts.length===0)
 throw Error('FIRST_PARTY_REACT_BUNDLE_INCOMPLETE');
if(files.some(name=>name.endsWith('.map')||name.startsWith('.env')))
 throw Error('RELEASE_CANDIDATE_DEV_ARTIFACT');
const origin=await readFile(join(src,'index.html'),'utf8');
if(!origin.includes('id="page-settings"')||
 !origin.includes('lesson-l09-hifi-markup.js'))
 throw Error('APP_SHELL_PARITY_MISSING');
let html=replaceOnce(origin,'<script src="./assets/lesson-l09-hifi.js"></script>','');
if(authOnly){
 // Match the already-shipped invited React staging assembler. These legacy
 // UI scripts are not data ports and must not run beside the React screens.
 // Keep the essential lesson/library data owners and standalone site untouched.
 for(const src of [
  './assets/lesson-related-wave1.js',
  './assets/lesson-spell-suggestions.js',
  './assets/laoly-drag.js',
  './assets/catalog-curriculum-data.js',
  './assets/catalog-drilldown.js',
  './assets/li-catalog-search.js'
 ]){
  const escaped=src.replaceAll('.','\\.');
  const tag=new RegExp('<script src="'+escaped+'(?:\\?v=[^"]+)?"></script>','g');
  const matches=html.match(tag);
  if(!matches||matches.length!==1)throw Error('RETIRED_REACT_SCRIPT_CHANGED: '+src);
  html=html.replace(tag,'');
 }
}
const gate=(
 '<style id="li-auth-gate-critical">'+
 'html:not(.li-auth-verified) .app,'+
 'html.li-auth-verified.li-account-open .app{display:none!important}'+
 'html.li-auth-verified:not(.li-account-open) #li-staging-auth-root'+
 '{display:none!important}</style>'+
 '<link rel="stylesheet" href="./assets/staging-gate.css">'+
 '<link rel="stylesheet" href="./assets/li-react-learning.css">'
);
html=replaceOnce(html,'<head>','<head>'+gate);
const marker='<div class="settings-group-grid"><article class="surface"><div class="kicker">SAO LƯU</div>';
const account=(
 '<article class="surface">'+
 '<div class="kicker">TÀI KHOẢN</div><h2>Tài khoản Google</h2>'+
 '<p class="small">Đăng nhập, đồng bộ và quản lý quyền Lão Lý AI tại đây.</p>'+
 '<button type="button" class="action alt" id="li-open-account">'+
 'Quản lý tài khoản</button></article>'
);
html=replaceOnce(html,marker,
 marker.replace('<article class="surface">',account+'<article class="surface">'));
html=replaceOnce(html,
 '<b>Đồng bộ giữa các thiết bị</b><p class="small">Chưa hỗ trợ.</p>',
 '<b>Đồng bộ dữ liệu cá nhân</b><p class="small" id="li-cloud-status" role="status" aria-live="polite">Đang xác minh quyền đồng bộ…</p>');
const shell=(
 '<div id="li-staging-auth-root" tabindex="-1" role="region" aria-label="Đăng nhập li.">'+
 '<p role="status">Đang xác minh quyền truy cập…</p></div>'+
 '<script type="module" src="./assets/li-first-party-app.js"></script>'
);
html=replaceOnce(html,'</body></html>',shell+'</body></html>');
for(const name of ['li-auth-gate-critical','li-open-account',
 'id="li-staging-auth-root"','li-first-party-app.js','li-cloud-status'])
 requireOne(html,name);
// Existing journal-cloud consent's native data-staging-only marker is part
// of the canonical React consent bridge; it is not an alternate login gate.
if(html.includes('<script src="./assets/lesson-l09-hifi.js"></script>'))
 throw Error('OLD_LESSON_CONTROLLER_LEFT_ACTIVE');

await rm(output,{recursive:true,force:true});
await cp(src,output,{recursive:true});
const assets=join(output,'assets');await mkdir(assets,{recursive:true});
for(const name of scripts)await copyFile(join(app,name),join(assets,name));
await copyFile(join(app,css[0]),join(assets,'li-react-learning.css'));
await copyFile(join(repo,'tools/step16-real-l09-react-island/src/auth/staging-gate.css'),
 join(assets,'staging-gate.css'));
await copyFile(worker,join(output,'_worker.js'));
await writeFile(join(output,'index.html'),html);
if(authOnly){
 // iOS Add to Home Screen must open Cloudflare /, never GitHub Pages /li/.
 // Do not change the existing published staging manifest or SW registration.
 const manifestPath=join(output,'manifest.webmanifest');
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 if(manifest.start_url!=='/li/'||manifest.scope!=='/li/'||
  !Array.isArray(manifest.icons))throw Error('PWA_ORIGIN_SCOPE_CHANGED');
 manifest.start_url='/';manifest.scope='/';
 for(const icon of manifest.icons){
  if(typeof icon.src!=='string'||!icon.src.startsWith('/li/assets/'))
   throw Error('PWA_ICON_SCOPE_CHANGED');
  icon.src=icon.src.slice(3);
 }
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 // This candidate's worker is generated separately after assembly. Never
 // cache /api/auth, Neon responses, private note data or OAuth cookies.
 await copyFile(join(repo,'tools/platform/pwa-cloudflare-register.js'),join(assets,'pwa-register.js'));
}
const stale=[];
for(const name of ['.env','.env.local']){try{await stat(join(output,name));stale.push(name);}catch{}}
if(stale.length)throw Error('CANDIDATE_HAS_PRIVATE_FILES');
if(!html.includes('html:not(.li-auth-verified) .app')||
 !html.includes('id="li-staging-auth-root"')||
 !html.includes('id="li-open-account"'))
 throw Error('INVITED_ONLY_GATE_NOT_ASSEMBLED');
console.log('PASS first-party '+(authOnly?'AUTH-ONLY':'AI')+
 ' Cloudflare candidate assembled locally: '+basename(output));
console.log('Does NOT deploy, configure Cloudflare bindings, or grant access.');
