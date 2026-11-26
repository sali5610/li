import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/shell/case-selection.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {readCaseChoice,writeCaseChoice,keepCaseOnRecheck}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const a={uid:'a',caseId:'sampling-bias-90'},b={uid:'b',caseId:a.caseId},other={uid:'a',caseId:'another-case'};
function fixture(){
 const m=new Map([['li.sync.local-owner.v1','a']]);
 return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
}
test('selection survives app recheck and remount; is scoped to verified owner and case',()=>{
 const store=fixture();
 writeCaseChoice(store,a,true,'right');
 assert.equal(keepCaseOnRecheck(a,{transient:true,accountId:'a'}),true);
 assert.equal(keepCaseOnRecheck(a,{transient:true,accountId:null}),true);
 assert.equal(readCaseChoice(store,a,true),'right');
 assert.equal(readCaseChoice(store,other,true),null);
 assert.throws(()=>readCaseChoice(store,a,false));
 assert.throws(()=>readCaseChoice(store,b,true));
 assert.equal(keepCaseOnRecheck(a,{transient:true,accountId:'b'}),false);
 assert.equal(keepCaseOnRecheck(a,{transient:false,accountId:'a'}),false);
 store.setItem('li.sync.local-owner.v1','b');
 assert.equal(readCaseChoice(store,b,true),null);
 assert.throws(()=>readCaseChoice(store,a,true));
 store.setItem('li.sync.local-owner.v1','a');
 writeCaseChoice(store,a,true,null);
 assert.equal(readCaseChoice(store,a,true),null);
});
test('React Case listens to transient auth and hydrates matching choice without weakening analysis gate',()=>{
 const ui=readFileSync(new URL('../src/shell/research-case.tsx',import.meta.url),'utf8');
 assert.match(ui,/if\(!keepCaseOnRecheck\(owner.current,detail\)\)clear\(\);\s*return;/);
 assert.match(ui,/setChoice\(readCaseChoice\(localStorage,owner.current,true\)\)/);
 assert.match(ui,/choice&&revision.trim\(\).length>=12/);
 assert.match(ui,/disabled=\{!analysis\}/);
});
