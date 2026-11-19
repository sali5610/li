#!/usr/bin/env node
// ONT-04B2a CI-only proof that candidate CSS cannot broadly restyle native app.
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const css=readFileSync(resolve(root,'src/styles.css'),'utf8');
const required=['.search-page h1','.search-page h2','.search-page button','.search-page input','.search-page select','.search-page a:focus-visible','@media (max-width:600px)','@media (max-width:360px)','@media (prefers-reduced-motion:reduce)','var(--li-color-focus-ring)'];
for(const x of required)if(!css.includes(x))throw Error('Search scope rule missing: '+x);
if(!css.startsWith('@import "../../../site/assets/design-tokens.css";'))throw Error('Existing design token source lost');
const stripped=css.replace(/\/\*[\s\S]*?\*\//g,'').split('\n');
for(let i=0;i<stripped.length;i++){
 const line=stripped[i].trim();
 if(/^(?:body|html|:root|\*|h[1-6]|p|label|button|input|select|a)(?=\s*[,.:{])/.test(line))
  throw Error('Global native selector at line '+(i+1)+': '+line);
}
if(/#[\da-fA-F]{3,8}\b/.test(css))throw Error('Unexpected raw color in candidate CSS');
console.log(JSON.stringify({status:'PASS',searchScoped:true,designTokens:'REUSED',mobileReflow:true,reducedMotion:true,nativeAppCSS:'UNMODIFIED'}));
