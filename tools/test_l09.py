#!/usr/bin/env python3
"""Source-level regression for Wave 1A Sampling Bias within the existing li. Hi-Fi SPA.

Not a real-device, browser clipboard, academic signoff or G2/G3/G4 release test.
"""
from pathlib import Path
from html.parser import HTMLParser
import re, subprocess

site=Path(__file__).resolve().parents[1]/"site"
html=(site/"index.html").read_text(encoding="utf-8")
css=(site/"assets"/"lesson-l09-hifi.css").read_text(encoding="utf-8")
mount=(site/"assets"/"lesson-l09-hifi-markup.js").read_text(encoding="utf-8")
logic=(site/"assets"/"lesson-l09-hifi.js").read_text(encoding="utf-8")
lab=(site/"lesson-source-lab.html").read_text(encoding="utf-8")

for name in ("lesson-l09-hifi.css","lesson-l09-hifi-markup.js","lesson-l09-hifi.js"):
    href=("./assets/"+name)
    assert html.count(href)==1,("Hi-Fi missing/duplicate asset",href)
    assert (site/"assets"/name).stat().st_size>2500,name

# Native li. page/router and components, never an iframe/isolated draft design.
assert "page-lessonL09" in mount
assert '<section id="page-lessonL09" class="page"' in mount
assert 'class="section-shell"' in mount
assert 'class="editorial-grid"' in mount
assert 'class="stack-sm l09-stack"' in mount
assert mount.count('class="surface"')>=4
assert 'class="surface tinted"' in mount
assert 'class="action"' in mount
assert 'class="text-editor"' not in mount or 'class="text-editor"' in logic
assert 'data-page="lessonL09"' in mount
assert 'shelf.id="li-l09-library-entry"' in mount
assert 'data-page="catalog"' in mount and 'data-page="guide"' in mount
assert 'new URLSearchParams(window.location.search).get("lesson")==="L09-1-2"' in mount
assert 'typeof navigate==="function"' in mount
assert 'href="./?lesson=L09-1-2"' in lab, "Source lab must open Hi-Fi, not old separate UI"

assert "#page-lessonL09" in css
for token in ("var(--cream)","var(--paper)","var(--moss)","var(--rule)","var(--wood)"):
    assert token in css,("CSS must use native Hi-Fi design tokens",token)
assert "body{" not in css and ".siteheader" not in css, "No second app shell theme"
assert "#page-catalog .surface-grid" in css

# Native vs new injected IDs cannot collide.
class Ids(HTMLParser):
    def __init__(self):super().__init__();self.ids=[]
    def handle_starttag(self, tag, attrs):
        for k,v in attrs:
            if k=="id":self.ids.append(v)
native=Ids();native.feed(html)
added=re.findall(r'\bid="([^"]+)"',mount)
assert len(set(added))==len(added), "Duplicate ID within injected lesson"
assert not(set(added)&set(native.ids)), "Lesson ID collision with native Hi-Fi"
for needle in (
'id="l09-title"','id="l09-goals"','id="l09-concept"',
'id="l09-illustrations"','id="l09-guided"','id="l09-challenge"',
'id="l09-rubric"','id="l09-sources"','id="l09-vi"','id="l09-en"',
'id="l09-answerBox"','id="l09-rubricGate"','id="l09-rubricArea"',
'id="l09-submit"','id="l09-hintButton"','id="l09-saveReview"',
'id="l09-sourcesList"','id="l09-allPrompt"','id="l09-progressBar"'
):
    assert needle in mount,needle

# Academic parity, original sourced images, source links, state/answer gating.
assert "1.000" in mount and "82%" in mount
assert "1,200" in logic and "78%" in logic
assert "400/500" in logic and "400/500" in mount
assert logic.count("vi:{")==1 and logic.count("en:{")==1
assert 'state.draft.some(v=>v.trim().length<12)' in logic
assert 'state.submitted=true' in logic and 'state.reviewed=true' in logic
assert 'state.hint=true' in logic and 'state.assisted=true' in logic
assert 'state.ratings.some(v=>v===null)' in logic
assert 'state.submissionLocale=state.locale' in logic
assert 'KEY="li.review.L09-1-2.v1"' in logic
assert 'localStorage.setItem(KEY,JSON.stringify(state))' in logic
assert 'localStorage.clear()' not in logic, "Do not alter private app storage"
assert "navigator.clipboard.writeText" in logic
assert 'document.execCommand("copy")' in logic
assert 'Nếu link bị chặn' in logic and 'If a page is blocked' in logic
assert 'https://www.itl.nist.gov/div898/handbook/ppc/section1/ppc134.htm' in logic
assert logic.count("https://www.cdc.gov/casper/php/overview/")==2
assert 'upload.wikimedia.org/wikipedia/commons/' in mount
assert 'Dan Kernler · CC BY-SA 4.0' in mount
assert 'Tim Isaksson · CC BY-SA 4.0' in mount
assert 'id="l09-answerBox" class="l09-answer state-note" hidden' in mount
assert 'id="l09-rubricArea" hidden' in mount
assert '.l09-review-row' in css and 'grid-template-columns:minmax(0,1fr) 90px' in css

# Check behavior and mount JS with CI's Node binary before publishing.
for path in (site/"assets"/"lesson-l09-hifi-markup.js",site/"assets"/"lesson-l09-hifi.js"):
    subprocess.run(["node","--check",str(path)],check=True)

print("PASS L09 native Hi-Fi: routes/components, source imagery, VI/EN, protected challenge, local state, clipboard prompt, JS parsing")
