#!/usr/bin/env node
/**
 * Actual React 19 DOM SSR of the pinned Step16.2 primitives.
 * Test-only: no browser navigation, app mount, local storage, Neon or publication.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const {execFileSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const pinned='df882d46f75f39f48c733752ced15bf6f549a5d3';
const reactRoot=path.join(root,'uxds35-react-pin');
const repoDir=path.join(reactRoot,'tools/step16-real-l09-react-island');
const actual=execFileSync('git',['-C',reactRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(actual,pinned,'React fixture must use immutable Step16.2 candidate');
const ts=require(path.join(repoDir,'node_modules/typescript'));
const React=require(path.join(repoDir,'node_modules/react'));
const SSR=require(path.join(repoDir,'node_modules/react-dom/server'));
const srcPath=path.join(repoDir,'src/ui/Primitives.tsx');
const cssPath=path.join(repoDir,'src/pilot.css');
const source=fs.readFileSync(srcPath,'utf8');
const CSS=fs.readFileSync(cssPath,'utf8');
const out=ts.transpileModule(source,{
 compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
 fileName:'Primitives.tsx',reportDiagnostics:true
});
assert.deepEqual(out.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error) || [],[],'TSX compilation diagnostics');
const compiled=path.join(repoDir,'src/ui/.ont02-primitives-ssr-test.cjs');
fs.writeFileSync(compiled,out.outputText);
let widgets;
try{
 const dynamic=new Module(compiled,module);
 dynamic.filename=compiled;
 dynamic.paths=Module._nodeModulePaths(path.dirname(compiled));
 dynamic._compile(out.outputText,compiled);
 widgets=dynamic.exports;
}finally{
 fs.rmSync(compiled,{force:true});
}
const {ActionButton,Surface,StatusMessage}=widgets;
assert.equal(typeof ActionButton,'function');
assert.equal(typeof Surface,'function');
assert.equal(typeof StatusMessage,'function');
const render=(Component,props,children)=>SSR.renderToStaticMarkup(React.createElement(Component,props,children));
const primary=render(ActionButton,{id:'primary',onClick:()=>{},'aria-label':'Lưu'},'Lưu');
assert.match(primary,/<button\b/);
assert.match(primary,/type="button"/,'button must default to safe native type');
assert.match(primary,/class="pilot-action"/);
assert.match(primary,/aria-label="Lưu"/);
const secondary=render(ActionButton,{kind:'secondary',disabled:true,'aria-describedby':'reason'},'Đóng');
assert.match(secondary,/class="pilot-action secondary"/);
assert.match(secondary,/disabled=""/);
assert.match(secondary,/type="button"/);
const submit=render(ActionButton,{type:'submit'},'Nộp');
assert.match(submit,/type="submit"/,'explicit submit must not be overridden');
const card=render(Surface,{'aria-labelledby':'section-label',className:'pilot-context'},React.createElement('p',null,'Nội dung'));
assert.match(card,/<section/);
assert.match(card,/class="pilot-surface pilot-context"/);
assert.match(card,/aria-labelledby="section-label"/);
const status=render(StatusMessage,{'aria-atomic':true,className:'pilot-status'},'Đã lưu');
assert.match(status,/role="status"/);
assert.match(status,/aria-live="polite"/);
assert.match(status,/aria-atomic="true"/);
// CSS contract: scoped, source-preserving fallbacks for the UNMERGED design-system draft.
const roleFallbacks={
 '--li-comp-surface-background':'--cream',
 '--li-comp-field-background':'--porcelain',
 '--li-comp-button-primary-background':'--moss',
 '--li-comp-button-primary-color':'--cream',
 '--li-comp-button-secondary-background':'--paper',
 '--li-comp-button-secondary-color':'--moss',
 '--li-comp-button-focus-ring':'--li-color-focus-ring',
 '--li-comp-button-min-hit-size':'48px'
};
for(const [role,fallback] of Object.entries(roleFallbacks)){
 assert.ok(CSS.includes('var('+role+','),'React style missing typed token role '+role);
 const expectedPrefix='var('+role+','+(fallback.startsWith('--')?'var('+fallback:fallback);
 assert.ok(CSS.includes(expectedPrefix),'React role fallback mismatch '+role+'; expected '+expectedPrefix);
}
assert.ok(CSS.includes('.pilot button:disabled'),'disabled affordance not sourced');
assert.ok(CSS.includes('@media(prefers-reduced-motion:reduce)'),'reduced motion remains');
const tokens=JSON.parse(fs.readFileSync(path.join(root,'design-system/tokens.json'),'utf8'));
for(const role of Object.keys(roleFallbacks)){
 assert.ok(role.startsWith('--li-comp-'));
 assert.ok(tokens.componentRoles[role.slice('--li-comp-'.length)],'undefined design component role '+role);
}
assert.equal(tokens.semanticRoles['action-secondary-surface'],'--paper','React secondary fallback cannot diverge from native paper');
process.stdout.write('PASS ONT-02 SSR: React 19 real JSX primitives (Button default/explicit submit+disabled/secondary, Surface, StatusMessage) and 8 alias fallback contracts; real app/PWA/device NOT MOUNTED.\n');
