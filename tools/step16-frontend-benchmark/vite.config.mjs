import {defineConfig} from 'vite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig(({mode})=>{
  if(!['vanilla','react','lit'].includes(mode)) throw Error('Unsupported research variant '+mode);
  return {
    root:path.resolve(here,'apps',mode),
    base:'./',
    build:{
      target:'es2022',
      outDir:path.resolve(here,'dist',mode),
      emptyOutDir:true,
      sourcemap:false,
      cssCodeSplit:false
    }
  };
});
