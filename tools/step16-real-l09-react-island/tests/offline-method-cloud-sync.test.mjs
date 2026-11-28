import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/learning/validate-method-attempts.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const {validMethodAttempts}=await import('data:text/javascript;base64,'+
 Buffer.from(compiled).toString('base64'));
const unsent={draft:'Learning while offline',submission:null,submittedAt:null};
const sent={draft:'Learning while offline',submission:'Learning while offline',
 submittedAt:'2026-11-21T01:00:00.000Z'};

test('all six UI-supported method drafts survive the same sync contract, including older history',()=>{
 for(const id of ['T03','T04','T06','T07','T09','T10']){
  assert.equal(validMethodAttempts({methodAttempts:{[id]:unsent}}),true,id+' offline');
  assert.equal(validMethodAttempts({methodAttempts:{[id]:sent}}),true,id+' submitted');
 }
 assert.equal(validMethodAttempts({}),true,'legacy attempts');
 assert.equal(validMethodAttempts({methodAttempts:{T06:{...unsent,classifications:{A:'nominal'}}}}),true);
 assert.equal(validMethodAttempts({methodAttempts:{T06:{...sent,classifications:{
  A:'nominal',B:'ordinal',C:'discrete',D:'continuous'
 }}}}),true);
});

test('reject corrupted methods instead of accepting unsafe private payloads',()=>{
 assert.equal(validMethodAttempts({methodAttempts:{T99:unsent}}),false);
 assert.equal(validMethodAttempts({methodAttempts:{T03:{...unsent,submission:'done',submittedAt:null}}}),false);
 assert.equal(validMethodAttempts({methodAttempts:{T03:{...unsent,classifications:{A:'nominal'}}}}),false);
 assert.equal(validMethodAttempts({methodAttempts:{T06:{...sent,classifications:{A:'nominal'}}}}),false);
 assert.equal(validMethodAttempts({methodAttempts:[]}),false);
});

test('lesson UI and persisted offline sync share validator, and a conflicting attempt has its own status',()=>{
 const ui=readFileSync(new URL('../src/learning/staging-ports.ts',import.meta.url),'utf8');
 const sync=readFileSync(new URL('../src/auth/learner-sync.ts',import.meta.url),'utf8');
 const ports=readFileSync(new URL('../src/learning/ports.ts',import.meta.url),'utf8');
 const shared=readFileSync(new URL('../src/auth/private-state.ts',import.meta.url),'utf8');
 assert.match(ui,/import \{validMethodAttempts\} from '\.\/validate-method-attempts\.js'/);
 assert.match(sync,/parseLearnerAttempt as attempt/);
 assert.match(shared,/import \{validMethodAttempts\} from '\.\.\/learning\/validate-method-attempts\.js'/);
 assert.match(shared,/!validMethodAttempts\(a\)/);
 assert.match(sync,/if\(pending\?\.conflict\)return 'conflict'/);
 assert.match(ports,/type SyncState = 'on-device'\|'queued'\|'synced'\|'conflict'\|'unavailable'/);
});
