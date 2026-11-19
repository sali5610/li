/** Export UX-DS-35 as a real independent GitHub Pages repository source.
 * No remote writes or provider deployment. Source remains under one repo. */
import {cpSync,existsSync,mkdirSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const target=join(root,'dist-design-system-repository');
rmSync(target,{recursive:true,force:true});
const paths=[
 'site/design-system','site/assets/design-tokens.css','site/assets/li-layout.css',
 'design-system/react','design-system/tokens.json','design-system/components.md',
 'design-system/typography-spacing.md','design-system/ux-patterns-and-behavior.md',
 'tools/generate_design_tokens.py','tools/build-design-system-site.mjs'];
for(const path of paths){
 const src=join(root,path),dst=join(target,path);
 if(!existsSync(src))throw new Error('Missing DS source '+path);
 mkdirSync(dirname(dst),{recursive:true});
 cpSync(src,dst,{recursive:true});
}
const workflow=join(target,'.github/workflows/pages.yml');
mkdirSync(dirname(workflow),{recursive:true});
cpSync(join(root,'tools/uxds35-pages-publish.yml'),workflow);
const siteJS=join(target,'site/design-system/studio.js');
const webSource='https://github.com/sali5610/li-design-system/blob/main/';
let js=readFileSync(siteJS,'utf8');
const original='https://github.com/sali5610/li/blob/main/';
const draft='https://github.com/sali5610/li/blob/design-system/uxds35-single-studio-20261120/';
if(!js.includes(original)||!js.includes(draft))throw new Error('Studio source links drifted');
js=js.replaceAll(original,webSource).replaceAll(draft,webSource)
 .replace('../component-library-review.html',
          'https://github.com/sali5610/li/blob/main/site/component-library-review.html');
writeFileSync(siteJS,js,'utf8');
const htmlFile=join(target,'site/design-system/index.html');
let html=readFileSync(htmlFile,'utf8');
html=html.replaceAll(original,webSource)
 .replace('Tokens: GitHub main · React stories: Draft PR #168',
          'Authoritative GitHub source: li-design-system · G2 open');
writeFileSync(htmlFile,html,'utf8');
writeFileSync(join(target,'README.md'),
 '# li. (理) Design System\n\nIndependent GitHub Pages site and source for UX-DS-35.\n'
 +'The only design-system browser reference; NOT the learner app staging.\n\n'
 +'Author components in design-system/react and tokens in design-system/tokens.json.\n'
 +'After editing tokens: python3 tools/generate_design_tokens.py\n'
 +'Every push to main runs the own-repository Pages workflow. '
 +'Enable GitHub Pages Source: GitHub Actions in repository Settings.\n'
 +'Global G2 visual approval remains open. No app login, learner data or Cloudflare release.\n');
console.log('PASS independent repository source prepared: '+target);
