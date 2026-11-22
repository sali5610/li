import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
if(process.env.VITE_LI_AUTH_TARGET!=='github-pages-staging'||
   process.env.VITE_LI_E2EE_QA_BUILD!=='1')
 throw Error('E2EE QA must ONLY build for explicit GitHub staging, never Cloudflare.');
export default defineConfig({
 base:'/li/assets/',
 build:{
  target:'es2022',outDir:'dist-e2ee-qa',emptyOutDir:true,sourcemap:false,
  rollupOptions:{
   input:resolve(root,'src/auth/e2ee-qa.ts'),
   output:{entryFileNames:'e2ee-qa.js',chunkFileNames:'e2ee-qa-[hash].js',
    assetFileNames:'e2ee-qa-[name][extname]'}
  }
 }
});
