import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
// Release candidate ONLY; this config never deploys. Keeps the same React
// invited app as GitHub staging but uses first-party /api/auth/* cookies.
if(process.env.VITE_LI_AUTH_TARGET!=='cloudflare-first-party')
 throw Error('FIRST_PARTY_RELEASE_TARGET_REQUIRED');
export default defineConfig({
 resolve:{dedupe:['react','react-dom']},
 base:'/assets/',
 build:{
  target:'es2022',cssCodeSplit:false,sourcemap:false,
  outDir:'dist-cloudflare-app',emptyOutDir:true,
  rollupOptions:{
   input:resolve(root,'src/auth/staging-app.tsx'),
   output:{entryFileNames:'li-first-party-app.js',
    chunkFileNames:'li-first-party-[hash].js',
    assetFileNames:'li-first-party-[name][extname]'}
  }
 }
});
