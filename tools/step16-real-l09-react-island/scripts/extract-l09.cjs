'use strict';
/**
 * Extract the literal editorial T object from the EXACT current li. L09-1-2
 * production source. No hand-authored substitute question/rubric content.
 * This is a Node-only build-time operation in a separate research branch.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const base=path.resolve(__dirname,'../../..');
const file=path.join(base,'site/assets/lesson-l09-hifi.js');
const out=path.resolve(__dirname,'../src/l09-exact.generated.json');
const source=fs.readFileSync(file,'utf8');
const marker='const T=';
const start=source.indexOf(marker),end=source.indexOf('\nconst $=',start);
if(start<0||end<0||end<=start)throw Error('The live L09 source contract changed; do not guess lesson copy');
const code=source.slice(start,end)+'\nT;';
const copy=vm.runInNewContext(code,Object.create(null),{timeout:1500});
if(!copy||!copy.vi||!copy.en)throw Error('Exact source is missing VI/EN editorial content');
const required=['title','challengeTitle','caseText','caseClaim','questions','placeholder',
 'hintButton','hint','assisted','submit','submitNeed','submitSuccess','submitLocked',
 'rubricTitle','rubricItems','scoreOptions','scoreLabel','reviewNeed','reviewDone',
 'saveReview','clear','resetConfirm','saveHint','answer','answerTitle'];
for(const language of ['vi','en']){
  const c=copy[language];
  for(const key of required)if(!(key in c))throw Error('Missing real L09 editorial field: '+language+'.'+key);
  if(!Array.isArray(c.questions)||c.questions.length!==4||
     !Array.isArray(c.rubricItems)||c.rubricItems.length!==4||
     !Array.isArray(c.scoreOptions)||c.scoreOptions.length!==4)
     throw Error('Real L09 challenge/rubric contract changed');
}
const payload={
 source:'site/assets/lesson-l09-hifi.js',
 sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
 lessonId:'L09-1-2',
 langs:{vi:copy.vi,en:copy.en}
};
const encoded=JSON.stringify(payload,null,2)+'\n';
if(process.argv.includes('--verify')){
  if(!fs.existsSync(out)||fs.readFileSync(out,'utf8')!==encoded)
   throw Error('Generated L09 copy differs from current lesson source; run npm run extract and rebuild');
}else{
  fs.writeFileSync(out,encoded);
}
console.log('LI_STEP16_L09_EXACT_SOURCE '+JSON.stringify({
 source:payload.source,
 sourceSha256:payload.sourceSha256,
 lessonId:payload.lessonId,
 questionsVI:copy.vi.questions.length,
 questionsEN:copy.en.questions.length,
 rubricRows:copy.vi.rubricItems.length,
 generatedBytes:Buffer.byteLength(encoded)
}));
