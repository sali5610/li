import {defineConfig} from 'vite';
import {resolve} from 'node:path';

/** Explicit Vite 8 multipage entry; no effect on publicly shipped site/. */
const pages={
 lesson:resolve(process.cwd(),'index.html'),
 auth:resolve(process.cwd(),'auth-shell.html')
};
export default defineConfig({
 input:pages,
 build:{rolldownOptions:{input:pages}}
});
