import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
// Auth-only is the sole Pages Worker. No alternate AI/D1 build.
export default defineConfig({
 build:{
  target:'es2022',sourcemap:false,minify:true,
  outDir:'dist-auth-worker',
  emptyOutDir:true,
  lib:{entry:resolve(root,'src/auth/cloudflare-auth-only-worker.ts'),
   formats:['es'],fileName:()=> '_worker.js'},
  rollupOptions:{output:{inlineDynamicImports:true}}
 }
});
