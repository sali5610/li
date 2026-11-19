/** Creates a THIN publisher GitHub repository; never duplicates DS source. */
import {cpSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const target=join(root,'dist-design-system-repository');
rmSync(target,{recursive:true,force:true});
const workflow=join(target,'.github/workflows/pages.yml');
mkdirSync(dirname(workflow),{recursive:true});
cpSync(join(root,'tools/uxds35-pages-publish.yml'),workflow);
writeFileSync(join(target,'README.md'),[
 '# li. (理) — Design System independent GitHub Pages publisher',
 '',
 'One source: https://github.com/sali5610/li/tree/design-system/uxds35-single-studio-20261120/design-system',
 'This repo holds ONLY the workflow to publish the design system site.',
 'Never copy React components, tokens, or the Studio source here.',
 '',
 'Pages settings -> Build and deployment -> Source: GitHub Actions.',
 'Push main or run workflow_dispatch to publish. Background source refresh every 6 hours.',
 'After PR #168 merges, change only the source checkout ref to main.',
 'No learner app staging, Cloudflare, Auth, Neon or product data.',
 'Human PO G2 approval remains OPEN.',
 ''
].join('\n'));
console.log('PASS thin GitHub Pages publisher source: '+target);
