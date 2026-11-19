import {defineConfig} from 'vite';
import {resolve} from 'node:path';

/** Both pages are research-only; public site/ is NOT part of this build. */
export default defineConfig({
  build:{rollupOptions:{input:{
    lesson:resolve(process.cwd(),'index.html'),
    auth:resolve(process.cwd(),'auth-shell.html')
  }}}
});
