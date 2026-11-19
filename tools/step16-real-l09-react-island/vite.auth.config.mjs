import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const ghStaging=process.env.VITE_LI_AUTH_TARGET==='github-pages-staging';
// A SEPARATE HTML entrypoint: exclude the experimental lesson screen,
// all personal sync wiring, and the full React app from the Cloudflare pilot.
export default defineConfig({
 base:ghStaging?'/li/auth-pilot/':'/auth-pilot/',
 build:{
  target:'es2022',
  outDir:'dist-auth',
  emptyOutDir:true,
  sourcemap:false,
  rollupOptions:{input:resolve(root,'auth-entry.html')}
 }
});
