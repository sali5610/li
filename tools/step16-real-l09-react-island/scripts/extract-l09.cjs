'use strict';
/**
 * Compile React L09 editorial from the canonical GitHub lesson JSON.
 * Keep the existing editor, private attempt key, and invited Auth flow unchanged.
 * The Content Owner separately checks byte-for-byte native copy parity in
 * tools/build_content_packs.mjs --check; no second editorial source exists.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=path.resolve(__dirname,'../../..');
const file=path.join(base,'content/lessons/L09-1-2.json');
const out=path.resolve(__dirname,'../src/l09-exact.generated.json');
const source=fs.readFileSync(file,'utf8');
const lesson=JSON.parse(source);
if(lesson.id!=='L09-1-2'||lesson.kind!=='Lesson'||
 lesson.content?.format!=='locked-structured-v1'||
 lesson.reviewState!=='approved'||lesson.publishState!=='review_only'||
 lesson.rights?.text!=='first_party'){
 throw Error('Canonical L09 ID, review, rights or content schema changed; do not publish.');
}
const copy=lesson.content.localized;
if(!copy||!copy.vi||!copy.en)throw Error('Canonical L09 missing VI/EN editorial content');
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
 source:'content/lessons/L09-1-2.json',
 sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
 lessonId:'L09-1-2',
 langs:{vi:copy.vi,en:copy.en}
};
const encoded=JSON.stringify(payload,null,2)+'\n';
if(process.argv.includes('--verify')){
  if(!fs.existsSync(out)||fs.readFileSync(out,'utf8')!==encoded)
   throw Error('Generated L09 copy differs from canonical lesson JSON; run npm run extract and rebuild');
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
