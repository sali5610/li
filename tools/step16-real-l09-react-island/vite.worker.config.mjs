import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
// Worker is deployed only on a separately PO-approved Cloudflare release.
// The static GitHub Pages app does not execute _worker.js.
export default defineConfig({
 build:{
  target:'es2022',sourcemap:false,minify:true,outDir:'dist-worker',
  emptyOutDir:true,
  lib:{entry:resolve(root,'src/auth/cloudflare-worker.ts'),
   formats:['es'],fileName:()=> '_worker.js'},
  rollupOptions:{output:{inlineDynamicImports:true}}
 }
});
