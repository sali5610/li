/* Zero-dependency Wave1 assessment staging validator.
 * Reads only editorial snapshots and existing runtime source; does not deploy.
 * Run from repository root: node tools/validate_wave1_assessment_staging.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import assert from "node:assert/strict";

const cases = [
  ["L09-1-2", "site/assets/lesson-l09-hifi.js", "const T="],
  ["L03-1-2", "site/assets/lesson-wave1-core.js", "const PACK="],
  ["L15-2-2", "site/assets/lesson-wave1-core.js", "const PACK="],
];
const read = p => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");
const same = (x, y, msg) => assert.equal(JSON.stringify(x), JSON.stringify(y), msg);
const gitBlobSha = text => crypto.createHash("sha1")
  .update("blob " + Buffer.byteLength(text, "utf8") + "\0")
  .update(text, "utf8").digest("hex");

function objectLiteral(src, token) {
  const at = src.indexOf(token);
  assert.ok(at !== -1, "Cannot find source data literal " + token);
  const start = src.indexOf("{", at + token.length);
  assert.ok(start !== -1);
  let depth = 0, quoted = null, escaped = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quoted) quoted = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quoted = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error("Unclosed source literal " + token);
}

function sourceData(src, token, lessonId) {
  // Only the versioned local object literal is evaluated in an isolated VM.
  const obj = vm.runInNewContext("(" + objectLiteral(src, token) + ")",
    Object.create(null), { timeout: 1500 });
  return token === "const T=" ? obj : obj[lessonId];
}

function expectedLocale(L, lessonId) {
  const l09 = lessonId === "L09-1-2";
  return {
    challenge: {
      title: L.challengeTitle,
      intro: L[l09 ? "caseText" : "challengeText"],
      claim: L[l09 ? "caseClaim" : "challengeClaim"],
      questions: L.questions,
    },
    support: {
      guided_hint: L[l09 ? "exHelp" : "guidedHint"],
      hint: L.hint,
      submit_validation: L[l09 ? "submitNeed" : "needAnswers"],
    },
    review: {
      answer_title: L.answerTitle,
      model_answer: L.answer,
      answer_note: L[l09 ? "answerCaution" : "answerNote"],
      rubric_title: L.rubricTitle,
      rubric_lead: L.rubricLead,
      rubric_before: L.rubricBefore,
      rubric_items: L.rubricItems,
      review_validation: L[l09 ? "reviewNeed" : "needRubric"],
    },
  };
}

let checked = 0;
for (const [lessonId, sourceFile, marker] of cases) {
  const snapshot = JSON.parse(read("docs/editorial/wave1-cms/assessment/" + lessonId + ".json"));
  const sourceText = read(sourceFile);
  const native = sourceData(sourceText, marker, lessonId);
  assert.equal(snapshot.schema, "li.assessment.v1.staging");
  assert.equal(snapshot.lesson_id, lessonId);
  assert.equal(snapshot.source.file_path, sourceFile);
  assert.equal(snapshot.source.blob_sha, gitBlobSha(sourceText), lessonId + ": runtime source changed");
  assert.equal(snapshot.contract.question_count, 4);
  assert.equal(snapshot.contract.rubric_count, 4);
  assert.equal(snapshot.contract.min_trimmed_chars, 12);

  for (const locale of ["vi", "en"]) {
    const L = native[locale];
    assert.ok(L, lessonId + "/" + locale + ": missing locale");
    same(snapshot.locales[locale], expectedLocale(L, lessonId),
      lessonId + "/" + locale + ": exact editorial parity failed");
    assert.equal(L.questions.length, 4);
    assert.equal(L.rubricItems.length, 4);
    L.questions.forEach((q, i) => assert.ok(q.trim(), locale + "/question " + (i + 1)));
    L.rubricItems.forEach((item, i) => {
      assert.equal(item.length, 2);
      assert.ok(item[0].trim() && item[1].trim(), locale + "/rubric " + (i + 1));
    });
    const projectedBeforeSubmit = { challenge: snapshot.locales[locale].challenge,
      support: snapshot.locales[locale].support };
    const keys = JSON.stringify(Object.keys(projectedBeforeSubmit));
    assert.ok(!/model_answer|rubric_items|answer_note|answer_title|review_validation/.test(keys),
      lessonId + ": pre-submit projection leaked answer/rubric fields");
    checked++;
  }

  // Structural indicators only; browser/DOM, mobile, accessibility, and
  // semantic non-spoiler correctness still require separate QA.
  assert.match(sourceText, /["']answerBox["']\)\.hidden\s*=\s*!state\.submitted/);
  assert.match(sourceText, /["']rubricArea["']\)\.hidden\s*=\s*!state\.submitted/);
  assert.match(sourceText, /["']hintButton["']\)\.addEventListener\(["']click["'],\(\)=>\{\s*if\(state\.submitted\)return/);
  assert.match(sourceText, /\.trim\(\)\.length\s*<\s*12/);
  console.log("PASS " + lessonId + ": exact VI/EN copy + static gates; no production changes");
}
assert.equal(checked, 6);
console.log("PASS Wave1: 3 lessons, 6 locales, 24 questions, 24 rubric criteria.");
console.log("OPEN: browser behavior, native render parity, accessibility, source/rights review.");
