import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/shell/capture-draft.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {readCaptureDraft,writeCaptureDraft,blankCaptureDraft}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const OWNER='li.sync.local-owner.v1';
function device(){
 const map=new Map([[OWNER,'a']]);
 return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
}
test('unsaved Capture text and field survive reload/offline without a cloud request',()=>{
 const storage=device(),draft={text:'Ý chưa lưu\n中文',fieldId:'field-1'};
 writeCaptureDraft(storage,'a',true,draft);
 assert.deepEqual(readCaptureDraft(storage,'a',true),draft);
});
test('same-device account switch cannot see or overwrite another draft',()=>{
 const storage=device(),a={text:'private A',fieldId:null},b={text:'private B',fieldId:'f2'};
 writeCaptureDraft(storage,'a',true,a);
 storage.setItem(OWNER,'b');
 assert.throws(()=>readCaptureDraft(storage,'a',true));
 assert.throws(()=>writeCaptureDraft(storage,'a',true,b));
 assert.deepEqual(readCaptureDraft(storage,'b',true),blankCaptureDraft());
 writeCaptureDraft(storage,'b',true,b);
 storage.setItem(OWNER,'a');
 assert.deepEqual(readCaptureDraft(storage,'a',true),a);
 assert.throws(()=>readCaptureDraft(storage,'a',false));
 assert.throws(()=>writeCaptureDraft(storage,'a',false,b));
});
test('successful save clears only active owner draft; failed storage does not report success',()=>{
 const storage=device();
 writeCaptureDraft(storage,'a',true,{text:'draft',fieldId:null});
 writeCaptureDraft(storage,'a',true,blankCaptureDraft());
 assert.deepEqual(readCaptureDraft(storage,'a',true),blankCaptureDraft());
 const blocked={...storage,setItem:()=>{}};
 assert.throws(()=>writeCaptureDraft(blocked,'a',true,{text:'draft',fieldId:null}));
});
test('React keeps draft through transient rechecks, uses canonical save and existing backup guard',()=>{
 const ui=readFileSync(new URL('../src/shell/capture-idea.tsx',import.meta.url),'utf8');
 assert.match(ui,/if\(!detail\?\.transient\)/);
 assert.match(ui,/if\(result\.ok\)\{persist\(blankCaptureDraft\(\)\)/);
 assert.match(ui,/getDraft:\(\)=>verified\(\)&&owner\.current\?latest\.current\.text/);
 assert.match(ui,/writeCaptureDraft\(localStorage,owner\.current,verified\(\),next\)/);
});
