import {defineConfig} from 'vite';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
export default defineConfig({
 resolve:{dedupe:['react','react-dom']},
 base:'./',
 build:{
  target:'es2022',outDir:'dist-qa-reminder',emptyOutDir:true,sourcemap:false,
  rollupOptions:{input:resolve(root,'tests/reminder-qa-fixture.html')}
 }
});
