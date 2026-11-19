import {defineConfig} from 'vite';

// Build the frontend slice as an importable module, NOT a competing app or URL.
// Chat 1 owns bundling it into the sole GitHub Pages staging publisher.
export default defineConfig({
 base:'./',
 resolve:{dedupe:['react','react-dom']},
 define:{'process.env.NODE_ENV':JSON.stringify('production')},
 build:{
  target:'es2022',outDir:'dist-learning',emptyOutDir:true,sourcemap:false,
  cssCodeSplit:false,
  lib:{entry:'src/learning/app-entry.tsx',name:'LiLearning',
   formats:['es'],fileName:()=> 'li-learning.js',cssFileName:'li-learning'}
 }
});
