import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
// Neither Worker is deployed by GitHub staging. Choose the Auth-only entry
// at build time; its source has no AI/D1 imports or handler. Existing AI build
// remains the default and still requires its separate G4 approval.
const authOnly=process.env.LI_AUTH_ONLY_WORKER==='1';
export default defineConfig({
 build:{
  target:'es2022',sourcemap:false,minify:true,
  outDir:authOnly?'dist-auth-worker':'dist-worker',
  emptyOutDir:true,
  lib:{entry:resolve(root,authOnly?
   'src/auth/cloudflare-auth-only-worker.ts':'src/auth/cloudflare-worker.ts'),
   formats:['es'],fileName:()=> '_worker.js'},
  rollupOptions:{output:{inlineDynamicImports:true}}
 }
});
