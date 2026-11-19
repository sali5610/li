import test from 'node:test';
import assert from 'node:assert/strict';
import {isBlankNativeAttempt} from '../.sync-test/auth/native-progress.js';

const blank=()=>({locale:'vi',guidedDraft:'',draft:['','','',''],
 hint:false,assisted:false,submitted:false,submission:null,submissionAt:null,
 ratings:[null,null,null,null],reviewed:false,guideOpen:false});

test('a new device can restore real cloud progress over a persisted default state',()=>{
 assert.equal(isBlankNativeAttempt(blank()),true);
 assert.equal(isBlankNativeAttempt({...blank(),guideOpen:true,hint:true,locale:'en'}),true);
});
test('user work is never classified as a blank attempt',()=>{
 assert.equal(isBlankNativeAttempt({...blank(),draft:['','  answer','','']}),false);
 assert.equal(isBlankNativeAttempt({...blank(),guidedDraft:'insight'}),false);
 assert.equal(isBlankNativeAttempt({...blank(),ratings:[0,null,null,null]}),false);
 assert.equal(isBlankNativeAttempt({...blank(),submitted:true}),false);
 assert.equal(isBlankNativeAttempt({...blank(),reviewed:true}),false);
 assert.equal(isBlankNativeAttempt({...blank(),submission:['a','','','']}),false);
 assert.equal(isBlankNativeAttempt({...blank(),customNote:'keep me'}),false);
});
test('malformed state does not become a blank overwrite candidate',()=>{
 assert.equal(isBlankNativeAttempt({...blank(),draft:['']}),false);
 assert.equal(isBlankNativeAttempt({...blank(),ratings:[null]}),false);
 assert.equal(isBlankNativeAttempt({...blank(),draft:['','','',12]}),false);
});
