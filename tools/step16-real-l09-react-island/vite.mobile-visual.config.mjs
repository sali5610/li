import {defineConfig} from 'vite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
// CI-only rendering fixture. Never bundled into or copied as a public release.
export default defineConfig({
 resolve:{dedupe:['react','react-dom']},
 base:'./',
 build:{
  target:'es2022',outDir:'dist-mobile-visual',emptyOutDir:true,sourcemap:false,
  rollupOptions:{
   input:resolve(root,'mobile-visual.html'),
   output:{entryFileNames:'assets/mobile-visual-[hash].js',
    chunkFileNames:'assets/mobile-visual-chunk-[hash].js',
    assetFileNames:'assets/mobile-visual-[name]-[hash][extname]'}
  }
 }
});
