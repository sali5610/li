#!/usr/bin/env python3
"""Static integrity checks for the full li. Hi-Fi Pages package."""
from pathlib import Path
import re, subprocess, tempfile
site=Path(__file__).resolve().parents[1]/"site"
html=(site/"index.html").read_text(encoding="utf-8")
assets=["lucide.min.js","laoly-neutral.png","laoly-guide-rest.png","laoly-mode-start.png","laoly-mode-focus.png","laoly-mode-overload.png","laoly-mode-recover.png"]
for name in assets:
    p=site/"assets"/name
    assert p.is_file() and p.stat().st_size>1000, f"Missing {name}"
    if name.endswith(".png"):assert p.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"),f"Invalid {name}"
for needle,amount in [('id="export-personal-data"',1),('id="import-personal-data"',1),('id="method-count"',1),('data-ly-mode=',4),('id="page-settings"',1),('id="page-library"',1),('id="page-guide"',1),('id="page-home"',1),('const processedCases=liInitialState.cases;',1),('const savedQuestions=liInitialState.questions;',1)]:
    assert html.count(needle)==amount,(needle,html.count(needle),amount)
ids=set(re.findall(r'\["(T\d\d)","',html))
assert len(ids)==13,ids
assert 'image:"/assets/' not in html,"Absolute asset URL breaks GitHub project Pages"
assert 'id="export-library"' not in html
assert 'Nội dung bạn nhập chưa được lưu' not in html
parts=re.findall(r'<script>(.*?)</script>',html,flags=re.S)
assert len(parts)==1,len(parts)
with tempfile.NamedTemporaryFile(mode="w",suffix=".js",encoding="utf-8") as f:
    f.write(parts[0]);f.flush()
    subprocess.run(["node","--check",f.name],check=True)
assert (site/".nojekyll").is_file()
print("PASS 13 techniques, 4 study modes, 7 assets, storage actions, JS parsing")
