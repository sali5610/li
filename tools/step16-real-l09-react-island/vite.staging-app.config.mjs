import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
if(process.env.VITE_LI_AUTH_TARGET!=='github-pages-staging'){
 throw Error('This gate is STAGING ONLY');
}
export default defineConfig({
 resolve:{dedupe:['react','react-dom']},
 base:'/li/assets/',
 build:{
  target:'es2022',cssCodeSplit:false,outDir:'dist-staging-app',emptyOutDir:true,sourcemap:false,
  rollupOptions:{
   input:resolve(root,'src/auth/staging-app.tsx'),
   output:{entryFileNames:'staging-auth-gate.js',
    chunkFileNames:'staging-auth-[hash].js',assetFileNames:'staging-auth-[name][extname]'}
  }
 }
});
