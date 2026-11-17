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
# S136: mirror label is typographic only, not a search control.
assert html.count('<div class="mirror-label">Gương Vạn Vấn</div>') == 1
assert '<div class="mirror-label"><i data-lucide="search"' not in html

# S138/S139: touch swipe only on mirror; fixed-scale viewport and sticky header.
for needle in (
    'content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"',
    '/* S139 · Sticky top navigation, fixed touch-viewport scale.',
    'touch-action:pan-x pan-y;',
    'scroll-padding-top:88px;',
    'position:sticky;',
    'z-index:42;',
    'html{scroll-padding-top:74px}',
    'document.addEventListener("gesturestart",event=>event.preventDefault(),{passive:false});',
    'document.addEventListener("gesturechange",event=>event.preventDefault(),{passive:false});',
    'if(event.touches?.length>1)event.preventDefault();',
    '/* S138 · Swipe directly on the mirror text area. pan-y preserves page scrolling. */',
    'pointer-events:auto;',
    'touch-action:pan-y;',
    'const mirrorSwipeSurface=document.querySelector("#page-home .mirror-message");',
    'mirrorSwipeSurface.addEventListener("touchstart",event=>{',
    'mirrorSwipeSurface.addEventListener("touchend",event=>{',
    'mirrorSwipeSurface.addEventListener("touchcancel",()=>{mirrorSwipeStart=null},{passive:true});',
    'if(Math.abs(dx)<42||Math.abs(dx)<Math.abs(dy)*1.3)return;',
    'shiftMirrorQuestion(dx<0?1:-1);',
):
    assert needle in html, f"Mobile sticky viewport/swipe rule missing: {needle}"

# S137: previous/next arrows cycle questions in both directions; buttons remain stationary.
assert html.count("/* S135/S137 · Mobile mirror: narrower centered question, stationary navigation arrows.") == 1
for needle in (
    "width:min(59%,224px)!important;",
    "width:min(62%,210px)!important;",
    ".mirror-controls{",
    "#page-home .mirror-controls .mirror-refresh{",
    "animation:none!important;",
    "translate:none!important;",
    "-webkit-tap-highlight-color:transparent!important;",
    "#page-home .mirror-refresh:focus:not(:focus-visible){",
    "function shiftMirrorQuestion(direction){",
    "qIndex=(qIndex+direction+scenarios.length)%scenarios.length;",
    'document.getElementById("previous-question").addEventListener("click",()=>shiftMirrorQuestion(-1));',
    'document.getElementById("shuffle").addEventListener("click",()=>shiftMirrorQuestion(1));',
):
    assert needle in html, f"Mirror arrows/accessibility rule missing: {needle}"
assert "animation:li-mirror-float 4s ease-in-out infinite;" not in html, "Old synchronized refresh float must be removed"
assert '<div class="mirror-controls" role="group" aria-label="Chuyển câu hỏi">' in html
assert 'id="previous-question" class="mirror-refresh" type="button" aria-label="Câu hỏi trước"' in html
assert 'id="shuffle" class="mirror-refresh" type="button" aria-label="Câu hỏi tiếp theo"' in html
assert 'data-lucide="refresh-cw" class="icon sm"' not in html
assert '#page-home .mirror-refresh:focus-visible {outline:2px solid #F7E9BD;outline-offset:2px}' in html
subprocess.run(["node", str(site.parent/"tools"/"test_mirror_navigation.js")],check=True,cwd=site.parent)

# S133: seal, wordmark and three header buttons have one 44px vertical alignment axis.
assert html.count("/* S133 · Header shared vertical alignment contract (mobile, tablet, desktop).") == 1
for selector in (
    ".header .brand,.header .tools{display:flex;align-items:center;height:44px;box-sizing:border-box}",
    ".header .brand-copy{display:flex;justify-content:center;height:44px}",
    ".header .logo{display:block;line-height:1;transform:translateY(2px)}",
    ".header .brand-stamp{display:block;align-self:center;object-fit:contain}",
    ".header .tools .tool-button{display:grid;place-items:center;align-self:center;padding:0}",
):
    assert selector in html, f"Header alignment rule missing: {selector}"
assert html.count('class="tool-button" data-page=') == 3

# S134: lesson routes must match the URL while Home clears stale lesson/hash state.
assert 'const LI_LESSON_ROUTES={lessonL09:"L09-1-2",lessonL03:"L03-1-2",lessonL15:"L15-2-2"};' in html
assert 'if(lesson)url.searchParams.set("lesson",lesson);' in html
assert 'else url.searchParams.delete("lesson");' in html
assert 'url.hash="";' in html
assert 'if(syncUrl)syncLiRoute(id);' in html
assert 'syncUrl:!Object.values(LI_LESSON_ROUTES).includes(liInitialLesson)' in html

# S135: mobile mirror safe-area, independent subtle text float, and no square iOS tap flash.
assert html.count("/* S135 · Mirror copy safe area + paper-float.") == 1
for token in (
    "width:min(54%,194px)!important;",
    "max-width:194px!important;",
    "font-size:clamp(19px,5.1vw,22px)!important;",
    "@keyframes li-mirror-copy-float{",
    "animation:li-mirror-copy-float 4.2s ease-in-out infinite;",
    "-webkit-tap-highlight-color:transparent!important;",
    "border-radius:50%!important;",
    "#page-home .mirror-refresh svg{pointer-events:none}",
    "#page-home .mirror-refresh:focus-visible{",
    "#page-home .mirror-message h2{animation:none!important;will-change:auto}",
):
    assert token in html, f"Missing mirror touch/layout/accessibility contract: {token}"
assert html.count("animation:li-mirror-copy-float 4.2s ease-in-out infinite;") == 1
s135_touch=html[html.index("#page-home .mirror-refresh,",html.index("/* S135 · Mirror copy")):html.index("@media(prefers-reduced-motion",html.index("/* S135 · Mirror copy"))]
assert "animation:li-mirror-copy-float" not in s135_touch, "Only the text, not the refresh button, may float"

# S129: the brand mark is a drawn, self-contained 理 seal, never live text in a CSS box.
from xml.etree import ElementTree as ET
seal_file=site/"assets"/"li-seal.svg"
assert seal_file.is_file(), "Missing vector seal mark"
seal=seal_file.read_text(encoding="utf-8")
seal_root=ET.fromstring(seal)
assert seal_root.attrib.get("viewBox")=="0 0 256 256"
assert seal.count("<path ")==1 and "<text" not in seal, "Logo reverted to text glyph"
assert "理" in seal_root.attrib.get("aria-label","")
assert 'fill="#243A29"' in seal, "Logo ink must match approved moss theme"
assert html.count('src="./assets/li-seal.svg?v=moss-243a29"')==1, "Approved brand image not connected"
assert html.count('rel="icon" type="image/svg+xml" href="./assets/li-favicon.svg?v=moss-bg-20261118"')==1
# S140: favicon has a solid PO-theme moss background with light stamped artwork;
# independent from the transparent green seal used in the app header.
favicon_file=site/"assets"/"li-favicon.svg"
assert favicon_file.is_file(), "Missing brand favicon"
favicon=favicon_file.read_text(encoding="utf-8")
favicon_root=ET.fromstring(favicon)
assert favicon_root.attrib.get("viewBox")=="0 0 256 256"
assert favicon.count('<rect width="256" height="256" fill="#243A29"/>')==1, "Favicon background must match moss"
assert favicon.count('<path fill="#F3EBDC"')==1, "Favicon seal must contrast with green"
assert "<text" not in favicon, "Favicon glyph must be artwork"
assert seal.count('<path fill="#243A29"')==1, "Approved transparent header seal must remain green"
assert '<span class="brand-stamp">理</span>' not in html
assert '.brand-stamp{display:block;width:42px;height:42px;object-fit:contain;flex:none}' in html
assert '.header .brand-stamp{height:38px;width:38px}' in html

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

# S107: Settings contract must remain intact across future edits.
def section(name):
    start=html.index(f'<section id="page-{name}"')
    return html[start:html.index('</section>',start)]
settings=section("settings")
library=section("library")
assert settings.count('class="stack-sm"')==2
assert len(re.findall(r'<article class="surface(?: tinted)?"(?: id="[^"]+")?>',settings))==5
assert settings.count('data-ly-mode=')==4
assert settings.count('id="export-personal-data"')==1
assert settings.count('id="import-personal-data"')==1
assert 'id="export-personal-data"' not in library and 'id="export-library"' not in html
assert 'document.getElementById("export-personal-data")' in html
assert 'const importTrigger=' in html and 'li-du-lieu-' in html
assert 'Trước khi xóa dữ liệu trang web hoặc đổi thiết bị, website, hãy xuất bản sao để có thể nhập lại ghi chép.' in settings
assert 'Ghi chép của bạn không tự động được gửi tới dịch vụ AI bên ngoài.' in settings
assert 'Bạn có thể xuất bản sao trong Tủ Riêng.' not in html
for selector in (
    '#page-settings > .section-shell > .editorial-grid{gap:30px!important}',
    '#page-settings > .section-shell > .editorial-grid > .stack-sm{gap:30px!important}',
    '#page-settings > .section-shell > .editorial-grid{gap:28px!important}',
    '#page-settings > .section-shell > .editorial-grid>.stack-sm{gap:28px!important}'
):
    assert selector in html, f"Missing Settings spacing rule: {selector}"

# S114: both missing internal Settings gaps are explicit and isolated.
assert '#page-settings .surface > .select-row + .state-note' in html
assert '#page-settings .surface > .select-row + .action' in html
assert html.count('margin-top: 20px;')>=2
assert html.count('margin-top: 16px;')>=2
assert '<label class="select-row">Nhắc lịch ngủ' in settings
assert '<label class="select-row">Im Lặng' in settings
# S115: reminder uses the same base paper color as other Settings cards.
assert '<article class="surface"><div class="kicker">NHẮC NHỞ</div>' in settings
assert '<article class="surface tinted"><div class="kicker">NHẮC NHỞ</div>' not in settings
assert all('tinted' not in element for element in re.findall(
    r'<article class="surface(?: tinted)?"(?: id="[^"]+")?>', settings
))

# S117: Settings uses exactly one concise migration/data-loss hint,
# and Lão Lý remains a compact illustrated character with accessible controls.
assert settings.count('Trước khi xóa dữ liệu trang web hoặc đổi thiết bị, website, hãy xuất bản sao để có thể nhập lại ghi chép.') == 1
assert 'Đổi thiết bị hoặc website?' not in settings
assert 'Xóa dữ liệu trang web có thể làm mất Bút Ký' not in settings
assert '<article class="surface" id="settings-buddy-card">' in settings
assert '<div class="folio-art roots" style="height:154px;margin-top:12px"></div>' not in settings
assert settings.count('class="settings-buddy-illustration"') == 1
assert 'class="settings-buddy-illustration" src="./assets/laoly-mirror-suy-nghi.png"' in settings
assert settings.count('data-buddy="1"') == 1
assert '#settings-buddy-card .settings-buddy-footer' in html
assert '#settings-buddy-card .settings-buddy-illustration' in html

# S118: two compact mobile Guide tiles with shadow-safe column/row gutters; no duplicate S99 rule.
guide=section("guide")
assert guide.count('id="method-count"') == 1
assert 'id="method-cards" class="method-grid"' in guide
assert html.count("/* S118 · Guide two-up mobile tiles with deliberate outer gutters (consolidated S99/S116) */") == 1
assert "/* S99 guidebook responsive fix */" not in html
assert "/* S99 responsive Thần Chú - scoped to Guide route */" not in html
assert "#page-guide #method-cards{display:grid!important;width:100%!important;min-width:0;max-width:100%!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:18px;row-gap:20px;padding:3px 6px 8px 3px;margin:18px 0 0;" in html
assert "#page-guide #method-cards{column-gap:14px;row-gap:18px;padding:3px 5px 8px 2px}" in html
# S127: mentor border matches the actual card borders, including the <=360px inset.
assert "#page-guide .editorial-grid>.guide-mentor{margin-left:3px!important;margin-right:6px!important;width:auto!important;max-width:none!important;min-width:0;justify-self:stretch;box-sizing:border-box}" in html
assert "#page-guide .editorial-grid>.guide-mentor{margin-left:2px!important;margin-right:5px!important}" in html
assert "#page-guide #method-cards>.method-card{width:100%!important;min-width:0;max-width:100%!important;box-sizing:border-box;padding:11px 10px;min-height:194px" in html
assert "#page-guide #method-cards>.method-card .purpose{" in html
assert "function renderMethods(){" in html and "function showMethod(id){" in html
assert "/* S114 — restrained Lão Lý peek:" in html

# S134: all native writing areas use a real 31px background TILE, not an
# auto-sized gradient (auto-size made background-position ineffective on iOS).
assert html.count("/* S128/S134 · Shared ruled writing paper.") == 1
assert "textarea,.notebook{" in html
assert "line-height:var(--li-notebook-line-height)!important;" in html
assert "background-image:" in html
assert "linear-gradient(to bottom,transparent 0 30px,var(--li-notebook-rule) 30px 31px)!important;" in html
assert "background-size:100% 16px,100% var(--li-notebook-line-height)!important;" in html
assert "background-position:0 0,0 8px!important;" in html
assert "background-repeat:no-repeat,repeat!important;" in html
assert "background-attachment:scroll,local;" in html
assert "--li-notebook-baseline-shift:" not in html, "Removed ineffective phase-offset hack must stay removed"
# The tiled line is at 8 + 30 = 38px, below 15px text on a 31px line.
# A preceding repeated line at 7px is hidden under the first 16px cream mask.
notebook_first_rule = 8 + 30
assert notebook_first_rule == 38
assert (notebook_first_rule - 31) < 16
assert "textarea::placeholder{color:var(--muted);opacity:.8}" in html
assert html.count('class="text-editor"') >= 2

# S120: all 13 Thần Chú methods share this same Guide Detail template.
# Guard semantic spacing around section labels, step list, references and back CTA.
guide_detail=section("guideDetail")
assert guide_detail.count('id="detail-title"')==1
assert guide_detail.count('id="detail-purpose"')==1
assert guide_detail.count('class="path-list"')==1
assert guide_detail.count('III · GIẢI CHÚ')==1 and guide_detail.count('IV · DẪN CHỨNG')==1
assert '<div class="kicker">IV · DẪN CHỨNG</div><div class="state-note">' in guide_detail
assert '<button class="action alt" data-page="guide">Xem pháp khác</button>' in guide_detail
assert html.count("/* S120 · Guide detail semantic spacing") == 1
for selector,spacing in (
    ("#page-guideDetail .editorial-grid > .surface > .kicker + h2","margin-top:12px"),
    ("#page-guideDetail .editorial-grid > .surface > .kicker + .path-list","margin-top:14px"),
    ("#page-guideDetail .editorial-grid > .surface > h2 + p","margin:12px 0 0"),
    ("#page-guideDetail .editorial-grid > .surface > p + .kicker","margin-top:24px"),
    ("#page-guideDetail .editorial-grid > .surface > .kicker + .state-note","margin-top:12px"),
    ("#page-guideDetail .editorial-grid > .surface > .state-note + .action","margin-top:18px"),
    ("#page-guideDetail .path-item p","margin:0"),
):
    assert re.search(re.escape(selector)+r"\s*\{\s*"+re.escape(spacing)+r";?\s*\}",html),selector

# S119: approved Home assets must be exactly PO-provided originals.
import hashlib
for name,expected in [
    ("home-mystic-cool-mobile.webp","b528fd92cc9d8d26cb50916870bb5b144cf69b1d"),
    ("home-mystic-cool-desktop.webp","6a5083fbba0742a29ff2a32c9c6cbe2ee946b3de")
]:
    data=(site/"assets"/name).read_bytes()
    assert len(data)>100_000 and data[:4]==b"RIFF" and data[8:12]==b"WEBP",name
    sha=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
    assert sha==expected,(name,"approved artwork mismatch")
assert html.count("/* S119 · Approved S106 Home art") == 1
assert html.count('url("./assets/home-mystic-cool-mobile.webp")') == 1
assert html.count('url("./assets/home-mystic-cool-desktop.webp")') == 1
home=section("home")
for identifier in ['id="mirror-question"','id="home-scene"','id="save-question"','id="previous-question"','id="shuffle"']:
    assert home.count(identifier)==1,identifier
assert 'data-page="research"' in home
assert "Muốn nhớ: thử T01/T02" not in (site/"assets"/"laoly-context-s112.js").read_text(encoding="utf-8")

# S112 — context-aware companion must be present, parse and pass UI-plan QA.
companion=site/"assets"/"laoly-context-s112.js"
assert companion.is_file() and companion.stat().st_size>4000
assert html.count('<script src="./assets/laoly-context-s112.js"></script>')==1
subprocess.run(["node","--check",str(companion)],check=True)
subprocess.run(["node",str(site.parent/"tools"/"test_buddy.js")],check=True,cwd=site.parent)

# Wave1 L09 bilingual lesson source-safety and syntax gate (not device QA).
subprocess.run(["python3", str(site.parent/"tools"/"test_l09.py")],check=True,cwd=site.parent)
# S124: Guided explanation input + real localized hint in native L09 Hi-Fi Section IV.
subprocess.run(["python3", str(site.parent/"tools"/"test_l09_hifi.py")],check=True,cwd=site.parent)
# Wave1 editorial-locked L03 + L15 share native Hi-Fi state and complete VI/EN behavior.
subprocess.run(["node", str(site.parent/"tools"/"test_wave1_native.js")],check=True,cwd=site.parent)

# S118: the three top-navigation utility destinations have an accessible
# in-app Back action, and Settings uses the exact neutral portrait from Gương.
for page_name in ("settings","search","capture"):
    utility=section(page_name)
    assert utility.count('data-nav-back aria-label="Quay lại màn trước"')==1,page_name
assert html.count('data-nav-back aria-label="Quay lại màn trước"')==3
assert 'class="settings-buddy-illustration" src="./assets/laoly-mirror-suy-nghi.png"' in settings
assert 'class="settings-buddy-illustration" src="./assets/laoly-guide-rest.png"' not in settings
assert '<span class="hero-dialogue-avatar" aria-hidden="true"><img src="./assets/laoly-neutral.png"' in html
assert 'const pageHistory=[];' in html
assert 'function goBack(){' in html
assert 'if(t.hasAttribute("data-nav-back")){goBack();return}' in html
subprocess.run(["node",str(site.parent/"tools"/"test_navigation.js")],check=True,cwd=site.parent)

# S120: Tủ Riêng Bút Ký matches the same neutral paper surface as cards 03 and 04.
library_section=section("library")
assert '<article id="notebook-section" class="surface" tabindex="-1"' in library_section
assert '<article id="notebook-section" class="surface tinted"' not in library_section
assert library_section.count('<div class="surface-grid cols2"><article class="surface">')==1

# S120: mirror-variant illustration stored locally and not silently downgraded
# to a chat icon; Bút Ký uses same paper surface as cards 03-04.
illustrated=site/"assets"/"laoly-mirror-suy-nghi.png"
assert illustrated.is_file() and illustrated.stat().st_size > 100000
raw_illustrated=illustrated.read_bytes()
assert raw_illustrated[:8] == bytes([137,80,78,71,13,10,26,10])
assert (int.from_bytes(raw_illustrated[16:20],"big"), int.from_bytes(raw_illustrated[20:24],"big")) == (1024,1024)
assert 'class="settings-buddy-illustration" src="./assets/laoly-mirror-suy-nghi.png"' in settings
assert 'class="settings-buddy-illustration" src="./assets/laoly-neutral.png"' not in settings
assert '<article id="notebook-section" class="surface" tabindex="-1"' in library
assert '<article id="notebook-section" class="surface tinted"' not in library

# S122: fixed bottom navigation retains one thin top divider on iPhone.
# S105 had accidentally removed it with border:0!important.
assert '/* S105 · Compact mobile tabs:' in html
assert '.mobile-nav{background:var(--paper)!important;border:0!important;border-top:1px solid var(--moss)!important;box-shadow:none!important}' in html
assert html.count('.mobile-nav{background:var(--paper)!important;border:0!important;border-top:1px solid var(--moss)!important;box-shadow:none!important}')==1
assert '<nav class="mobile-nav" aria-label="Điều hướng chính mobile">' in html
assert html.count('class="nav-btn" data-page=') >= 4


# S121: context-aware quotation engine, 24 verified original texts with sources
# and a separate Vietnamese gloss/commentary, without breaking the existing companion.
quotes=site/"assets"/"laoly-quotes-s121.js"
assert quotes.is_file() and quotes.stat().st_size>12_000
quote_js=quotes.read_text(encoding="utf-8")
assert quote_js.count('"id":"')>=24, "Quotes library must contain at least 24 entries"
assert html.count('<script src="./assets/laoly-quotes-s121.js"></script>')==1
assert 'if(window.liQuoteEngine?.render){window.liQuoteEngine.render();return;}' in html
assert '#buddy-modal #buddy-quote .li-quote-context{' in html
assert 'https://zh.wikisource.org/' in quote_js and 'https://en.wikisource.org/' in quote_js
subprocess.run(["node","--check",str(quotes)],check=True)
subprocess.run(["node",str(site.parent/"tools"/"test_quotes.js")],check=True,cwd=site.parent)

# S125: mandatory source-grounded Lão Lý for all native lesson modules.
subprocess.run(["python3",str(site.parent/"tools"/"validate_lesson_companions.py")],check=True,cwd=site.parent)

assert (site/".nojekyll").is_file()
print("PASS 13 techniques, 4 modes, 7 assets, S107 Settings export/import and 28/30px gaps, privacy copy, JS parsing")
