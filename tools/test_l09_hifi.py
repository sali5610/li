#!/usr/bin/env python3
"""L09 native Hi-Fi lesson regression checks: Section IV, localized hint, and integration.

Static structural QA + Node parsing; not a substitute for real iPhone tests.
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess

root = Path(__file__).resolve().parents[1]
site = root / "site"
markup = (site / "assets" / "lesson-l09-hifi-markup.js").read_text(encoding="utf-8")
script = (site / "assets" / "lesson-l09-hifi.js").read_text(encoding="utf-8")
css = (site / "assets" / "lesson-l09-hifi.css").read_text(encoding="utf-8")
hifi = (site / "index.html").read_text(encoding="utf-8")

assert 'id="page-lessonL09"' in markup
assert 'class="surface tinted" id="l09-guided"' in markup
assert 'id="l09-exQuestion"' in markup
assert 'id="l09-guidedLabel" for="l09-guidedDraft"' in markup
assert markup.count('id="l09-guidedDraft"') == 1
assert 'id="l09-guidedDraft" class="text-editor"' in markup, "Must use native text-editor"
assert 'id="l09-guidedSaveNote"' in markup
assert 'id="l09-guidedToggle" aria-expanded="false" aria-controls="l09-guidedHint"' in markup
assert 'id="l09-guidedHint" hidden' in markup

for text in (
    'guidedLabel:"Thử giải thích bằng lời của bạn"',
    'guidedLabel:"Explain it in your own words"',
    'guidedSaveNote:"Ý tự giải thích được lưu trên thiết bị.',
    'guidedSaveNote:"Your guided explanation is saved on this device.',
    'sHtml("guidedHint",L.exHelp)',
    'sText("guidedLabel",L.guidedLabel)',
    '$("guidedDraft").value=state.guidedDraft;',
    'state.guidedDraft=$("guidedDraft").value',
    'if(typeof state.guidedDraft!=="string")state.guidedDraft=""',
    '$("guidedToggle").setAttribute("aria-expanded",String(now));',
    '$("guidedToggle").setAttribute("aria-expanded",String(!$("guidedHint").hidden));',
):
    assert text in script, f"Missing guided practice behavior: {text[:80]}"

assert script.count('exHelp:') == 2, "VI and EN must both supply a hint"
assert 'guidedDraft:""' in script, "Guided answer must use existing canonical state"
assert ':is(#page-lessonL09,#page-lessonL03,#page-lessonL15) .l09-q-row .text-editor' in css
assert ':is(#page-lessonL09,#page-lessonL03,#page-lessonL15) .l09-lock[hidden]' in css
assert hifi.count('<script src="./assets/lesson-l09-hifi-markup.js?v=20261118-ia05"></script>') == 1
assert hifi.count('<script src="./assets/lesson-l09-hifi.js"></script>') == 1
assert hifi.count('<link rel="stylesheet" href="./assets/lesson-l09-hifi.css?v=0.3">') == 1

for p in (site / "assets" / "lesson-l09-hifi-markup.js",site / "assets" / "lesson-l09-hifi.js"):
    subprocess.run(["node","--check",str(p)],check=True)

subprocess.run(["node", str(root / "tools" / "test_l09_guided_runtime.js")], check=True, cwd=root)
print("PASS L09 Hi-Fi Section IV: native response input, VI/EN visible hint, persistence, aria, JS parse")
