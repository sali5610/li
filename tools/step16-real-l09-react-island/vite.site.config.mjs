import {defineConfig} from 'vite';

// This candidate bundle is assembled by non-deploy CI / local builds only.
// EmptyOutDir=false is mandatory: site/assets contains the authoritative app.
export default defineConfig({
  base:'./',
  // Vite library builds do not automatically replace React's NODE_ENV checks.
  // Emit a browser-standalone ESM bundle with no Node process global.
  define:{'process.env.NODE_ENV':JSON.stringify('production')},
  build:{
    target:'es2022',
    outDir:'../../site/assets',
    emptyOutDir:false,
    sourcemap:false,
    cssCodeSplit:false,
    lib:{
      entry:'src/site-entry.tsx',
      name:'LiStep16L09Candidate',
      formats:['es'],
      fileName:()=> 'step16-l09-island.js',
      cssFileName:'step16-l09-island'
    }
  }
});
