import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
// A SEPARATE HTML entrypoint: exclude the experimental lesson screen,
// all personal sync wiring, and the full React app from the Cloudflare pilot.
export default defineConfig({
 base:'/auth-pilot/',
 build:{
  target:'es2022',
  outDir:'dist-auth',
  emptyOutDir:true,
  sourcemap:false,
  rollupOptions:{input:resolve(root,'auth-entry.html')}
 }
});
