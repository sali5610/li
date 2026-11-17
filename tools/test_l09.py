#!/usr/bin/env python3
"""Static regression gate for Wave 1A L09-1-2 bilingual review lesson.

Scope: source and JS syntax, not browser UI, academic signoff or clipboard/device QA.
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parents[1]
PAGE=ROOT/"site"/"lessons"/"L09-1-2.html"
LAB=ROOT/"site"/"lesson-source-lab.html"
assert PAGE.is_file(), "Missing L09-1-2 lesson route"
html=PAGE.read_text(encoding="utf-8")
assert len(html)>14000, "Unexpectedly truncated lesson"
assert LAB.is_file() and 'href="./lessons/L09-1-2.html"' in LAB.read_text(encoding="utf-8"),"Source lab missing lesson entry"

class Structure(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[]
        self.imgs=[]
        self.a=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if "id" in d:self.ids.append(d["id"])
        if tag=="img":self.imgs.append(d)
        if tag=="a":self.a.append(d)

parsed=Structure()
parsed.feed(html)
assert len(set(parsed.ids))==len(parsed.ids),"Duplicate HTML id"
required_ids=[
"btnVI","btnEN","goals","theory","images","example","challenge","rubric","deeper",
"lessonTitle","goalsList","definitions","imgSampling","imgBias",
"questions","hintButton","hint","assistState","submitAttempt","resetDraft",
"answerKey","rubricLock","rubricBody","rubricRows","markReviewed",
"progressTrack","progressFill","sourceCards","keywordLinks","copyAll","toast"
]
assert all(x in parsed.ids for x in required_ids),[x for x in required_ids if x not in parsed.ids]
assert len(parsed.imgs)==2, "Expect 2 sourced Commons diagrams"
assert all("upload.wikimedia.org" in i.get("src","") and i.get("alt") is not None for i in parsed.imgs)
assert html.count('commons.wikimedia.org/wiki/File:Simple_random_sampling.PNG')>=1
assert html.count('commons.wikimedia.org/wiki/File:Statistical_bias_and_statistical_noise_illustration_No_text_in_image.png')>=1
assert 'Dan Kernler · CC BY-SA 4.0' in html
assert 'Tim Isaksson · CC BY-SA 4.0' in html
assert html.count('id="answerKey" hidden')==1
assert html.count('id="rubricBody" hidden')==1
assert 'id="hint" hidden' in html
assert 'KEY="li.review.L09-1-2.v1"' in html
assert 'state.submissionLocale=state.locale' in html
assert 'if(state.draft.some(x=>x.trim().length<12))' in html
assert 'state.submitted=true' in html and 'state.reviewed=true' in html
assert 'state.ratings.some(x=>x===null)' in html
assert 'state.assisted=true' in html
assert 'navigator.clipboard.writeText' in html and 'document.execCommand("copy")' in html
assert 'if(state.submitted)return' in html
assert 'const source=[' in html and html.count('https://www.cdc.gov/casper/php/overview/')>=2
assert 'https://www.google.com/search?q=' in html
assert 'giả vờ' in html and 'never fabricate' in html
assert '.rubric th:nth-child(2),.rubric td:nth-child(2){display:none}' not in html, "Mobile rubric hides criteria"
assert '.rubric tbody,.rubric tr,.rubric td,.rubric th{display:block;width:100%}' in html
assert "Học xong, bạn làm được gì?" in html


script=re.findall(r'<script>(.*?)</script>',html,flags=re.S)
assert len(script)==1, "Lesson must have one self-contained JS block"
with tempfile.NamedTemporaryFile(mode="w",suffix=".js",encoding="utf-8") as f:
    f.write(script[0]);f.flush()
    subprocess.run(["node","--check",f.name],check=True)

# No external paid API, no remote persistence or shared main-app learning key.
assert "fetch(" not in script[0] and "XMLHttpRequest" not in script[0]
assert "openai.com/v1" not in script[0]
assert 'li.review.L09-1-2.v1' in script[0]
assert 'localStorage.setItem(KEY' in script[0]
print("PASS L09-1-2: VI/EN, 2 Commons illustrations, independent challenge, reveal gate, rubric, safe clipboard, JS syntax")
