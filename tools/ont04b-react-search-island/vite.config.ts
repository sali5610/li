import {defineConfig} from 'vitest/config';
export default defineConfig({
 base:'./',
 build:{outDir:'dist',emptyOutDir:true},
 server:{fs:{allow:['../..']}},
 test:{environment:'jsdom',include:['tests/**/*.test.tsx'],css:false,restoreMocks:true,clearMocks:true}
});
