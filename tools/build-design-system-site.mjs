/**
 * UX-DS-35: publish one standalone Design System website, never the learning app.
 * Input: canonical site/design-system/ source + generated tokens and existing CSS.
 * Output: dist-design-system/ with index.html at web root.
 */
import {cpSync,existsSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const source=join(root,'site','design-system');
const output=join(root,'dist-design-system');
const required=['index.html','studio.js','studio.css','react-layout.html',
 'react-atoms.html','react-controls.html','react-components.html',
 'react-layout.js','react-atoms.js','react-controls.js','react-components.js',
 'react-layout.css','react-atoms.css','react-controls.css','react-components.css'];
for(const file of required){
 if(!existsSync(join(source,file)))throw new Error('Missing DS build output: '+file);
}
for(const asset of ['design-tokens.css','li-layout.css']){
 if(!existsSync(join(root,'site','assets',asset)))throw new Error('Missing source asset '+asset);
}
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});
cpSync(source,output,{recursive:true});
mkdirSync(join(output,'assets'),{recursive:true});
for(const asset of ['design-tokens.css','li-layout.css']){
 cpSync(join(root,'site','assets',asset),join(output,'assets',asset));
}
console.log('PASS standalone UX-DS-35: /index.html + /react-*.html + /assets, no learner app');
