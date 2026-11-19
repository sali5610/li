import {defineConfig} from 'vite';

// This compiler emits local research assets into site/assets at CI/runtime.
// The assets are never committed to main or deployed by this draft PR.
export default defineConfig({
 base:'./',
 define:{'process.env.NODE_ENV':JSON.stringify('production')},
 build:{
  target:'es2022',outDir:'../../site/assets',emptyOutDir:false,
  sourcemap:false,cssCodeSplit:false,
  lib:{
   entry:'src/site-entry.tsx',name:'LiONT04B2LocalSearch',
   formats:['es'],fileName:()=> 'ont04b-search-site-island.js',
   cssFileName:'ont04b-search-site-island'
  }
 }
});
