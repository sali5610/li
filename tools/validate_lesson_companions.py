#!/usr/bin/env python3
"""S125 — mandatory per-lesson Lão Lý content gate for native Li Hi-Fi lesson modules.
Source/structure verification only: editorial fit, device QA, source truth still need review.
"""
from pathlib import Path
import json,re,subprocess

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/"site"/"assets"
LESSONS=ROOT/"site"/"lessons"
INDEX=(ROOT/"site"/"index.html").read_text(encoding="utf-8")
STAGES=("opening","concept","guided","independent","reflection","extension")
quote_file=ASSETS/"laoly-quotes-s121.js"
native=ASSETS/"lesson-companion-native.js"
assert quote_file.is_file() and native.is_file()
subprocess.run(["node","--check",str(native)],check=True)
qt=quote_file.read_text(encoding="utf-8")
assert "const QUOTES=" in qt and "const QUOTES_EN=" in qt and ";\nconst MEMORY_KEY=" in qt
Q=json.loads(qt.split("const QUOTES=",1)[1].split("];",1)[0]+"]")
quotes={q["id"]:q for q in Q}
assert len(quotes)>=24 and len(quotes)==len(Q),"Quote bank IDs not unique"

assert INDEX.count('src="./assets/lesson-companion-native.js"')==1,"Native companion must load once"
assert INDEX.count('src="./assets/laoly-context-s112.js"')==1
context_js=(ASSETS/"laoly-context-s112.js").read_text(encoding="utf-8")
assert "window.liLessonCompanion?.getPlan?.(currentPage)" in context_js,"Chat popup not wired to lesson content"
assert "window.liLessonCompanion?.getContext?.()" in qt,"Quote selection not wired to lesson content"
assert "ctx.quoteIds" in qt,"Lesson-approved quote candidates are not applied"

modules=sorted(ASSETS.glob("lesson-*-hifi-markup.js"))
assert modules,"No native lesson modules found"
found=set()
for module in modules:
    raw=module.read_text(encoding="utf-8")
    ids=re.findall(r'data-lesson-id="(L\d{2}-\d+-\d+)"',raw)
    assert len(ids)==1,(module,"Each lesson module needs exactly one explicit lesson ID")
    ident=ids[0]
    assert ident not in found,f"Duplicate lesson ID: {ident}"
    found.add(ident)
    link='./lessons/companion/'+ident+'.json'
    assert f'data-companion-manifest="{link}"' in raw,f"{ident}: missing exact companion asset link"
    assert ('id="li-lesson-mentor-stage"' in raw or 'data-lesson-mentor-stage="1"' in raw),f"{ident}: mentor stage status missing"
    assert 'data-buddy="1"' in raw,f"{ident}: mentor entry point missing"
    slug=module.name.removesuffix("-markup.js")
    logic=ASSETS/(slug+".js")
    assert logic.is_file(),f"{ident}: missing native lesson logic"
    assert len(re.findall(r'src="\./assets/'+re.escape(module.name)+r'(?:\?v=[A-Za-z0-9._-]+)?"',INDEX))==1,f"{ident}: markup not included exactly once by app"
    assert INDEX.count(f'src="./assets/{logic.name}"')==1,f"{ident}: lesson logic not included"
    file=LESSONS/"companion"/(ident+".json")
    assert file.is_file(),f"{ident}: Lão Lý content manifest mandatory before publish"
    d=json.loads(file.read_text(encoding="utf-8"))
    assert d.get("schema")==1 and d.get("lesson_id")==ident,f"{ident}: contract version or lesson ID mismatch"
    assert len(d.get("title",""))>15 and len(d.get("objectives",[]))>=2,f"{ident}: lesson scope/objectives missing"
    topics=d.get("topics",[])
    assert isinstance(topics,list) and len(topics)>=2,f"{ident}: topic tags required"
    editorial=d.get("editorial",{})
    assert editorial.get("status") in ("review","approved"),f"{ident}: review state missing"
    assert len(editorial.get("provenance",""))>=45,f"{ident}: source basis missing"
    assert len(editorial.get("spoiler_policy",""))>=45,f"{ident}: spoiler prevention policy missing"
    assert editorial.get("review_gate"),f"{ident}: editorial gate must be explicit"
    moments=d.get("moments",[])
    assert [m.get("stage") for m in moments]==list(STAGES),f"{ident}: 6 contextual moments required"
    assert len(set(m.get("anchor") for m in moments))==len(moments),f"{ident}: stage anchors must be unique"
    allQuotes=set()
    for m in moments:
        key=m["stage"]
        anchor=m.get("anchor","")
        assert re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*",anchor),f"{ident}/{key}: invalid section anchor"
        assert raw.count('id="'+anchor+'"')==1,f"{ident}/{key}: missing real lesson section {anchor}"
        candidates=m.get("quote_ids",[])
        assert isinstance(candidates,list) and len(candidates)>=3 and len(set(candidates))==len(candidates),f"{ident}/{key}: at least 3 diverse, nonrepeating source quotes"
        assert m.get("quote_id") in candidates,f"{ident}/{key}: primary quote missing from candidate set"
        for quoteId in candidates:
            assert quoteId in quotes,f"{ident}/{key}: unverified quote ID {quoteId}"
            assert set(topics).intersection(quotes[quoteId].get("tags",[])),f"{ident}/{key}: off-topic quote ID {quoteId}"
            allQuotes.add(quoteId)
        assert len(m.get("relevance",""))>=45,f"{ident}/{key}: must explain why the primary quote fits the specific lesson"
        for lang in ("vi","en"):
            c=m.get(lang,{})
            assert len(c.get("label",""))>=6 and len(c.get("prompt",""))>=50,f"{ident}/{key}/{lang}: generic or missing mentor speech"
            assert len(c.get("quote_comment",""))>=40,f"{ident}/{key}/{lang}: quote interpretation missing"
            actions=c.get("actions",[])
            assert isinstance(actions,list) and len(actions)==2,f"{ident}/{key}/{lang}: two distinct mentor probes required"
            assert len(set(a.get("label","") for a in actions))==2,f"{ident}/{key}/{lang}: duplicate actions"
            for a in actions:
                assert len(a.get("label",""))>=5 and len(a.get("reply",""))>=50,f"{ident}/{key}/{lang}: incomplete response"
    assert len(allQuotes)>=6,f"{ident}: quote bank coverage is too repetitive"
    # All independent mentor prompts must be non-spoiler by numerical or direct answer leak.
    if ident=="L15-2-2":
        independent=next(m for m in moments if m["stage"]=="independent")
        early=json.dumps({"vi":independent["vi"],"en":independent["en"]},ensure_ascii=False)
        assert not re.search(r"(?<!\d)(?:126|160|158)(?!\d)",early),f"{ident}: quantitative answer leaked before attempt"
    if ident=="L03-1-2":
        independent=next(m for m in moments if m["stage"]=="independent")
        early=json.dumps({"vi":independent["vi"],"en":independent["en"]},ensure_ascii=False)
        for forbidden in ("Lần gần nhất bạn cần kiểm tra một process","Khi cần xem dữ liệu theo quốc gia"):
            assert forbidden not in early,f"{ident}: full independent answer given before submission"

    if ident=="L09-1-2":
        # Existing independent 1200/78% finance-app answers must never be given early.
        independent=next(m for m in moments if m["stage"]=="independent")
        early=json.dumps({"vi":independent["vi"],"en":independent["en"]},ensure_ascii=False)
        assert "78%" not in early and "1.200" not in early and "1200" not in early,f"{ident}: case-specific answer leak in independent guidance"
        assert 'id="l09-answerBox"' in raw and 'hidden' in raw
    print(f"PASS {ident}: 6 VI/EN lesson moments, {len(allQuotes)} sourced quote choices, real UI anchors, no naked mentor placeholders")

# Legacy URLs redirect into the new in-app lesson; do not treat them as a separate course.
for page in sorted(LESSONS.glob("L*.html")):
    assert page.stem in found,f"Unregistered old lesson URL {page.name}"
    html=page.read_text(encoding="utf-8")
    assert f"lesson={page.stem}" in html,f"Legacy route must redirect to the native module: {page.name}"
print(f"PASS S125: mandatory lesson companion gate for {len(found)} native lesson(s)")
