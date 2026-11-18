/**
 * Zero-dependency source-level learner interaction regression harness.
 * Does NOT run a browser. Executes current native Wave1 lesson JS in a
 * deliberately minimal DOM simulation, without network, deploy, or app edits.
 * Run from repository root:
 *   node tools/validate_wave1_native_handlers_offline.mjs
 */
import fs from "node:fs";
import vm from "node:vm";

class FakeNode {
  constructor(doc, tag = "div", id = "") {
    this.doc = doc; this.tag = tag; this.id = id; this.children = [];
    this.listeners = {}; this.attrs = {}; this.style = {}; this.dataset = {};
    this.hidden = false; this.textContent = ""; this.innerHTML = "";
    this.value = ""; this.disabled = false; this.className = ""; this._query = {};
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(k, fn) { (this.listeners[k] ??= []).push(fn); }
  fire(k) { for (const fn of this.listeners[k] || []) fn({ target: this }); }
  append(...items) {
    for (const item of items) {
      this.children.push(item);
      if (item?.id) this.doc.map.set(item.id, item);
    }
  }
  appendChild(item) { this.append(item); return item; }
  replaceChildren(...items) { this.children = []; this.append(...items); }
  querySelector(q) { return this._query[q] ??= this.doc.createElement(q); }
  querySelectorAll(q) {
    return q === ".l09-stat-desc" ?
      [0,1,2].map(() => this.doc.createElement("span")) : [];
  }
  scrollIntoView() {}
  remove() {}
  select() {}
}
class FakeDocument {
  constructor() { this.map = new Map(); this.body = new FakeNode(this, "body"); }
  getElementById(id) {
    if (!this.map.has(id)) this.map.set(id, new FakeNode(this, "div", id));
    return this.map.get(id);
  }
  createElement(tag) { return new FakeNode(this, tag); }
  createTextNode(value) {
    const node = new FakeNode(this, "text"); node.textContent = value; return node;
  }
  execCommand() { return true; }
}

const repoRoot = process.cwd();
const sourceL09 = fs.readFileSync(repoRoot + "/site/assets/lesson-l09-hifi.js", "utf8");
const sourceCore = fs.readFileSync(repoRoot + "/site/assets/lesson-wave1-core.js", "utf8");
const saved = new Map();
const tests = [];
const fails = [];
function test(lesson, stage, ok, detail = "") {
  const result = { lesson, stage, status: ok ? "PASS" : "FAIL", detail };
  tests.push(result);
  if (!ok) fails.push(result);
}

function boot(id, source, rootId, prefix, perLessonStore) {
  const doc = new FakeDocument();
  doc.getElementById(rootId);
  const win = { isSecureContext: false, toast: () => {}, confirm: () => true };
  const storage = {
    getItem: key => perLessonStore.has(key) ? perLessonStore.get(key) : null,
    setItem: (key, value) => perLessonStore.set(key, value)
  };
  const context = {
    document: doc, window: win, localStorage: storage,
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout: () => 1, clearTimeout: () => {},
    encodeURIComponent
  };
  vm.runInNewContext(source, context, { timeout: 3000, filename: id + "-runtime.js" });
  if (id !== "L09-1-2") win.liWave1Init(id);
  return { doc, win, storage };
}

for (const [id, source, root, prefix] of [
  ["L09-1-2", sourceL09, "page-lessonL09", "l09"],
  ["L03-1-2", sourceCore, "page-lessonL03", "l03"],
  ["L15-2-2", sourceCore, "page-lessonL15", "l15"]
]) {
  const store = new Map();
  let h = boot(id, source, root, prefix, store);
  const get = name => h.doc.getElementById(prefix + "-" + name);
  const key = "li.review." + id + ".v1";
  const read = () => JSON.parse(store.get(key) || "null");
  test(id, "BEFORE_SUBMIT_GATE",
    get("answerBox").hidden && get("rubricArea").hidden && !get("rubricGate").hidden);
  test(id, "NO_RUBRIC_BEFORE_SUBMIT", get("rubricRows").children.length === 0);
  test(id, "QUESTION_COUNT", get("questions").children.length === 4);
  get("hintButton").fire("click");
  test(id, "HINT_ASSISTED",
    read()?.assisted === true && !get("hint").hidden && get("answerBox").hidden);
  get("submit").fire("click");
  test(id, "INVALID_ATTEMPT_REJECTED",
    read()?.submitted === false && get("answerBox").hidden);
  const entered = [
    "First substantive answer is at least twelve characters.",
    "Second substantive answer is at least twelve characters.",
    "Third substantive answer is at least twelve characters.",
    "Fourth substantive answer is at least twelve characters."
  ];
  for (let i = 0; i < 4; i++) {
    const field = h.doc.getElementById(prefix + "-question-" + i);
    field.value = entered[i];
    field.fire("input");
  }
  test(id, "DRAFT_PERSIST",
    JSON.stringify(read()?.draft) === JSON.stringify(entered));
  get("submit").fire("click");
  test(id, "VALID_ATTEMPT_ACCEPTED",
    read()?.submitted === true && !get("answerBox").hidden && !get("rubricArea").hidden);
  test(id, "ANSWERS_LOCKED",
    get("questions").children.every(row => row.children[1]?.disabled === true));
  test(id, "POST_SUBMIT_HINT_DISABLED", get("hintButton").hidden);
  test(id, "AFTER_SUBMIT_RUBRIC_VISIBLE", get("rubricRows").children.length === 4);
  const viAnswer = get("answer").innerHTML;
  get("en").fire("click");
  test(id, "LOCALE_WITH_STATE",
    read()?.locale === "en" && read()?.submitted && !get("answerBox").hidden);
  test(id, "ENGLISH_MODEL_ANSWER",
    Boolean(get("answer").innerHTML) && get("answer").innerHTML !== viAnswer);
  for (const row of get("rubricRows").children) {
    const select = row.children.find(node => node.tag === "select");
    if (select) { select.value = "2"; select.onchange?.(); }
  }
  test(id, "FOUR_RATINGS_SAVE",
    Array.isArray(read()?.ratings) && read().ratings.every(value => value === 2));
  get("saveReview").fire("click");
  test(id, "SELF_REVIEW_DONE",
    read()?.reviewed && get("progressBar").getAttribute("aria-valuenow") === "1");
  h = boot(id, source, root, prefix, store);
  test(id, "RELOAD_RECOVERS_SUBMITTED",
    !get("answerBox").hidden && !get("rubricArea").hidden &&
    get("questions").children.every(row => row.children[1]?.disabled));
  test(id, "RELOAD_RECOVERS_LOCALE", get("en").getAttribute("aria-pressed") === "true");
  test(id, "RELOAD_RECOVERS_REVIEW", get("saveReview").hidden === true);
  const snapshot = store.get(key);
  store.delete(key);
  h = boot(id, source, root, prefix, store);
  test(id, "FRESH_RELOAD_RELOCKS",
    get("answerBox").hidden && get("rubricArea").hidden);
  store.set(key, snapshot);
}

const result = {
  schema: "li.wave1.native-handlers-headless.v1",
  runner: "Node vm + minimal FakeDocument (NOT browser DOM)",
  scope: "Unmodified Wave1 source JS. No deployment or app source mutation.",
  summary: {
    total: tests.length,
    pass: tests.filter(x => x.status === "PASS").length,
    fail: fails.length
  },
  tests,
  limitations: [
    "No actual Chromium/Safari rendering, CSS, focus or accessibility tree",
    "No real iOS PWA, VoiceOver or device browser QA",
    "No Sheets-to-app compiler/cutover tested",
    "Answer text exists in JS bundle and hidden DOM before submission: UX gate, not access control"
  ]
};
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
if (fails.length || tests.length !== 54) process.exitCode = 1;
