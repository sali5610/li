#!/usr/bin/env node
/** ONT-04C2a: source-real S121 quote renderer + pure stage-gate in isolated VM.
 * No browser, paid model, authentication, network, deploy or learner records.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const gateSource=read('site/assets/laoly-quote-stage-gate.js');
const quoteSource=read('site/assets/laoly-quotes-s121.js');
const appSource=read('site/index.html');
assert.ok(appSource.indexOf('laoly-quote-stage-gate.js')>0);
assert.ok(appSource.indexOf('laoly-quote-stage-gate.js')<appSource.indexOf('laoly-quotes-s121.js'),'Stage policy must load before quote renderer');
assert.ok(appSource.includes('laoly-context-s112.js'),'Legacy mentor remains intact');
assert.ok(appSource.includes('lesson-companion-native.js'),'Native stage source remains intact');
const manifests=['L09-1-2','L03-1-2','L15-2-2'].map(id=>JSON.parse(read('site/lessons/companion/'+id+'.json')));
const byLesson=new Map(manifests.map(m=>[m.lesson_id,m]));
const legacyPages={ 'L09-1-2':'lessonL09','L03-1-2':'lessonL03','L15-2-2':'lessonL15' };
const classes=['buddy-quote','buddy-quote-original','buddy-quote-translation','buddy-quote-info','buddy-quote-context','buddy-quote-gloss','buddy-quote-meta','buddy-quote-link','calm-toggle'];
for(const page of Object.values(legacyPages)){
 classes.push('page-'+page);
 const prefix='l'+page.slice(-2);
 for(const key of ['hint','guidedHint','answerBox','rubricArea','live'])classes.push(prefix+'-'+key);
}
const makeEl=id=>({
 id,hidden:id==='buddy-quote-context'||id==='buddy-quote-original'||id==='buddy-quote-translation'||id==='buddy-quote-info'||id==='buddy-quote',
 textContent:'',attrs:new Map(),checked:false,href:undefined,
 setAttribute(k,v){this.attrs.set(k,String(v));},
 removeAttribute(k){this.attrs.delete(k);if(k==='href')delete this.href;},
 getAttribute(k){return this.attrs.get(k)||null;},
 closest(){return null;},
 contains(el){return Boolean(el?.id?.startsWith('l'+id.slice(-2)+'-'));}
});
const nodes=new Map(classes.map(id=>[id,makeEl(id)]));
for(const [id,el] of nodes)if(/^(l09|l03|l15)-/.test(id))el.hidden=true;
const windowEvents=new Map(),documentEvents=new Map();
const state={page:'home',locale:'vi',stage:'opening',lessonId:null,quoteIds:[],calm:false,debate:false};
const on=(map,type,callback)=>{const arr=map.get(type)||[];arr.push(callback);map.set(type,arr);};
const storage=new Map();
const win={
 sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 addEventListener:(name,handler)=>on(windowEvents,name,handler),
 liLanguage:{get:()=>state.locale},
 liLessonCompanion:{getContext:()=>state.lessonId?{
   page:legacyPages[state.lessonId],lesson_id:state.lessonId,stage:state.stage,
   quote_ids:state.quoteIds,topics:['evidence']
 }:null}
};
const document={
 getElementById:id=>nodes.get(id)||null,
 addEventListener:(name,handler)=>on(documentEvents,name,handler)
};
const context=vm.createContext({window:win,document,URL,Promise,console,globalThis:win,
 get currentPage(){return state.page;}, get buddyDebateActive(){return state.debate;}
});
vm.runInContext(gateSource,context,{filename:'laoly-quote-stage-gate.js'});
vm.runInContext(quoteSource,context,{filename:'laoly-quotes-s121.js'});
const engine=win.liQuoteEngine;
assert.equal(typeof engine.render,'function');
assert.equal(typeof engine.pick,'function');
assert.equal(typeof win.liQuoteStageGate.evaluate,'function');
assert.equal(engine.quotes.length,24);
let total=0,shown=0,suppressed=0,negatives=0;
const original=nodes.get('buddy-quote-original'),translation=nodes.get('buddy-quote-translation'),meta=nodes.get('buddy-quote-meta'),info=nodes.get('buddy-quote-info'),link=nodes.get('buddy-quote-link');
function expectHidden(label){
 assert.equal(original.hidden,true,label+' original hidden');
 assert.equal(translation.hidden,true,label+' translation hidden');
 assert.equal(info.hidden,true,label+' info hidden');
 assert.equal(original.textContent,'',label+' original scrub');
 assert.equal(translation.textContent,'',label+' translation scrub');
 assert.equal(meta.textContent,'',label+' author scrub');
 assert.equal(link.href,undefined,label+' link scrub');
}
function expectShown(label){
 assert.equal(original.hidden,false,label+' original');
 assert.ok(original.textContent.length>1,label+' quote content');
 assert.equal(translation.hidden,false,label+' localized');
 assert.ok(translation.textContent.length>1,label+' translation');
 assert.ok(meta.textContent.length>1,label+' attribution');
 assert.equal(info.hidden,false,label+' source disclosure');
 assert.match(link.href,/^https:\/\//,label+' actual source URL');
}
function resetFeedback(){
 for(const id of nodes.keys())if(/^(l09|l03|l15)-(?:hint|guidedHint|answerBox|rubricArea|live)$/.test(id)){nodes.get(id).hidden=true;nodes.get(id).textContent='';}
}
for(const manifest of manifests){
 state.lessonId=manifest.lesson_id;
 state.page=legacyPages[manifest.lesson_id];
 for(const moment of manifest.moments)for(const locale of ['vi','en']){
  resetFeedback();state.stage=moment.stage;state.quoteIds=moment.quote_ids;state.locale=locale;
  engine.render();total++;
  if(['opening','concept','guided'].includes(moment.stage)){expectShown(manifest.lesson_id+':'+moment.stage+':'+locale);shown++;}
  else {expectHidden(manifest.lesson_id+':'+moment.stage+':'+locale);suppressed++;}
 }
}
assert.equal(total,36);assert.equal(shown,18);assert.equal(suppressed,18);
// Existing home/library cultural experience is retained for ordinary public metadata.
for(const page of ['home','research','library','guide','search']){
 state.page=page;state.lessonId=null;resetFeedback();engine.render();expectShown('nonlesson '+page);negatives++;
}
// Generic unstaged lesson/case must fail closed rather than make up a safe stage.
for(const page of ['lesson','case']){
 state.page=page;state.lessonId=null;engine.render();expectHidden('unstaged '+page);negatives++;
}
// No manifest readiness -> no quote on a native lesson, even if screen exists.
state.page='lessonL09';state.lessonId=null;engine.render();expectHidden('manifest unavailable');negatives++;
state.lessonId='L09-1-2';state.quoteIds=byLesson.get('L09-1-2').moments[0].quote_ids;state.stage='opening';state.locale='vi';resetFeedback();
engine.render();expectShown('baseline');
state.stage='independent';
engine.pick({scope:'attacker',keys:['evidence'],quoteIds:['hume-evidence']});
assert.equal(engine.pick({scope:'attacker',keys:['evidence'],quoteIds:['hume-evidence']}),null,'pick must fail closed even with caller-supplied context');
for(const cb of windowEvents.get('scroll')||[])cb();
expectHidden('scroll changed to challenge');negatives+=2;
state.stage='opening';engine.render();expectShown('reopened');
state.stage='reflection';
for(const cb of windowEvents.get('resize')||[])cb();
expectHidden('resize changed to reflection');negatives++;
state.stage='guided';
for(const key of ['hint','guidedHint','answerBox','rubricArea','live']){
 resetFeedback();const el=nodes.get('l09-'+key);el.hidden=false;el.textContent='feedback';
 engine.render();expectHidden('visible '+key);negatives++;
}
resetFeedback();state.stage='opening';engine.render();expectShown('before calm');
nodes.get('calm-toggle').checked=true;engine.render();expectHidden('calm');nodes.get('calm-toggle').checked=false;negatives++;
state.debate=true;engine.render();expectHidden('debate');state.debate=false;negatives++;
state.stage='unknown';engine.render();expectHidden('unknown stage');negatives++;
// The quote source metadata needs actual attribution, original and HTTPS link,
// but NO copyright rights signoff in the private/invite-only product.
const specimen=engine.quotes[0];
assert.equal(win.liQuoteStageGate.quoteMetadataOK(specimen),true);
assert.equal(win.liQuoteStageGate.quoteMetadataOK({...specimen,url:'http://example.invalid'}),false);
assert.equal(win.liQuoteStageGate.quoteMetadataOK({...specimen,meta:''}),false);
negatives+=3;
assert.equal(win.liQuoteStageGate.evaluate({page:'lessonL09',lessonContext:{page:'lessonL03',lesson_id:'L09-1-2',stage:'opening',quote_ids:['hume-evidence']}}).allowed,false);
assert.equal(win.liQuoteStageGate.evaluate({page:'lessonL09',lessonContext:{page:'lessonL09',lesson_id:'L09-1-2',stage:'opening',quote_ids:[]}}).allowed,false);
negatives+=2;
assert.ok(!quoteSource.includes('translationRightsCleared')&&!quoteSource.includes('copyrightGate'));
assert.ok(quoteSource.includes('safeQuoteMoment()'));
assert.ok(quoteSource.indexOf('if(!safeQuoteMoment()){hide();return;}')<quoteSource.indexOf('const item=pick();'));
assert.ok(quoteSource.includes('original.textContent="";translation.textContent="";'));
assert.ok(quoteSource.includes('window.addEventListener("scroll",suppressStaleQuote'));
assert.ok(quoteSource.includes('document.addEventListener("click",'));
console.log(JSON.stringify({status:'PASS',sourceQuoteIDs:engine.quotes.length,lessonManifests:manifests.length,localeStageCases:total,visiblePreassessment:shown,suppressedAssessmentAndAfter:suppressed,additionalSafetyChecks:negatives,sourceScope:'PERSONAL_INVITE_ONLY',reuseRightsRequired:false,authOrLearnerData:'NOT_TOUCHED',production:'NO_DEPLOY'}));
