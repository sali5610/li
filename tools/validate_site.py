#!/usr/bin/env python3
"""Static integrity checks for the full li. Hi-Fi Pages package."""
from pathlib import Path
import re, subprocess, tempfile
site=Path(__file__).resolve().parents[1]/"site"
page_html=(site/"index.html").read_text(encoding="utf-8")
layout_css=(site/"assets"/"li-layout.css").read_text(encoding="utf-8")
html=page_html+"\n"+layout_css
assert "<style>" not in page_html and "</style>" not in page_html, "No inline CSS blocks in app HTML"
head=page_html.split("</head>",1)[0]
assert head.index("./assets/design-tokens.css") < head.index("./assets/li-layout.css") < head.index("./assets/lesson-l09-hifi.css") < head.index("./assets/ui-foundations.css")
assets=["lucide.min.js","laoly-neutral.png","laoly-guide-rest.png","laoly-mode-start.png","laoly-mode-focus.png","laoly-mode-overload.png","laoly-mode-recover.png"]
for name in assets:
    p=site/"assets"/name
    assert p.is_file() and p.stat().st_size>1000, f"Missing {name}"
    if name.endswith(".png"):assert p.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"),f"Invalid {name}"
# S143: touch devices never paint Safari's rectangular tap highlight on icon
# buttons or nested SVGs; focus-visible affordance and selected pills stay available.
touch_start=html.index("/* S143 · Shared iOS touch feedback contract.")
touch_end=html.index("/* S139 · Sticky top navigation",touch_start)
assert 0 < touch_start < touch_end, "Shared iOS touch reset must override older rules"
touch_css=html[touch_start:touch_end]
for rule in (
    'button, a, [role="button"], summary,',
    'button *, a *, [role="button"] *{',
    '-webkit-tap-highlight-color:transparent!important;',
    '.header .tool-button,',
    '.mobile-nav .nav-btn,',
    '#page-home .mirror-controls .mirror-refresh,',
    '#laoly-fab{',
    '@media (hover:none) and (pointer:coarse){',
    '.header .tool-button:is(:hover,:active,:focus),',
    '.mobile-nav .nav-btn:is(:hover,:active,:focus),',
    'background:transparent!important;',
    'box-shadow:none!important;',
):
    assert rule in touch_css, f"Safari touch override missing: {rule}"
assert "outline:none" not in touch_css, "Cannot suppress keyboard focus outlines in touch reset"
assert '.header .tool-button:focus-visible{outline:2px solid var(--wood);outline-offset:2px}' in html
assert '.mobile-nav .nav-btn:focus-visible{outline:2px solid var(--li-color-focus-warm);outline-offset:-3px}' in html
assert '.header .tool-button.active::before,' in html and '.header .tool-button[aria-current="page"]::before{opacity:1}' in html

# S142: utility header selection uses the identical sand tint as bottom tabs,
# with dark moss glyphs. State is synchronized by navigate() for Search/Capture/Settings.
for rule in (
    '/* S142 · Header utility selected state mirrors the bottom-nav sand pill.',
    'background:var(--li-color-nav-selected-fill);opacity:0;z-index:-1;pointer-events:none;',
    '.header .tool-button.active::before,',
    '.header .tool-button[aria-current="page"]::before{opacity:1}',
    'color:var(--moss)!important;',
    'document.querySelectorAll(".header .tool-button").forEach(x=>{const active=x.dataset.page===id;',
):
    assert rule in html, f"Header selected state missing: {rule}"
assert html.count('class="tool-button" data-page=')==3
# S145: Human PO split the icon roles:
# browser favicon = carved 理 seal; iOS Home Screen = typography-only 理, no seal.
from hashlib import sha256
touch=site/"assets"/"apple-touch-icon.png"
assert touch.is_file(), "iOS Home Screen text icon missing"
icon_bytes=touch.read_bytes()
assert icon_bytes.startswith(b"\x89PNG\r\n\x1a\n"), "Touch icon must be PNG"
assert (int.from_bytes(icon_bytes[16:20],"big"),int.from_bytes(icon_bytes[20:24],"big"))==(180,180)
assert sha256(icon_bytes).hexdigest()=="0b6dde4d63a2444e899b6409f859c9f6c5456e95a38bb15f1cd31e7547f7dfd7", "Unexpected typography-only 理 icon"
palette_at=icon_bytes.index(b"PLTE")+4
assert icon_bytes[palette_at:palette_at+3]==bytes.fromhex("243A29"), "iOS icon background must be moss"
assert icon_bytes[palette_at+21:palette_at+24]==bytes.fromhex("F3EBDC"), "iOS icon text must be cream"
assert html.count('<link rel="apple-touch-icon" sizes="180x180" href="./assets/apple-touch-icon.png?v=hanzi-text-20261118">')==1
assert '<meta name="apple-mobile-web-app-title" content="li.">' in html
assert '<meta name="theme-color" content="#243A29">' in html

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
assert '#page-home .mirror-refresh:focus-visible {outline:2px solid var(--li-color-mirror-focus-light);outline-offset:2px}' in html
subprocess.run(["node", str(site.parent/"tools"/"test_mirror_navigation.js")],check=True,cwd=site.parent)

# S133: seal, wordmark and three header buttons have one 44px vertical alignment axis.
assert html.count("/* S133 · Header shared vertical alignment contract (mobile, tablet, desktop).") == 1
for selector in (
    ".header .brand,.header .tools{display:flex;align-items:center;height:44px;box-sizing:border-box}",
    ".header .brand-copy{display:flex;justify-content:center;height:44px}",
    ".header .logo{display:block;line-height:1;transform:translateY(2px)}",
    ".header .brand-stamp{display:block;align-self:center;object-fit:contain}",
    ".header .tools .tool-button{display:grid;place-items:center;align-self:center;padding:var(--li-space-0)}",
):
    assert selector in html, f"Header alignment rule missing: {selector}"
assert html.count('class="tool-button" data-page=') == 3

# S134: lesson routes must match the URL while Home clears stale lesson/hash state.
assert 'const LI_LESSON_ROUTES={lessonL09:"L09-1-2",lessonL03:"L03-1-2",lessonL15:"L15-2-2"};' in html
assert 'if(lesson)url.searchParams.set("lesson",lesson);' in html
assert 'else url.searchParams.delete("lesson");' in html
assert 'url.hash="";' in html
assert 'if(syncUrl)syncLiRoute(id);' in html
assert 'const liInitialCatalog=new URLSearchParams(window.location.search).get("catalog");' in html
assert 'navigate(liInitialCatalog&&!liInitialLesson?"catalog":"home"' in html
assert 'syncUrl:!(liInitialCatalog||Object.values(LI_LESSON_ROUTES).includes(liInitialLesson))' in html
assert 'if(!lesson){url.searchParams.delete("chapter");if(id!=="catalog")url.searchParams.delete("catalog");}' in html

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
# S146: favicon MUST use the exact same SVG URL as the approved header seal.
# A separately inverted moss-background/cream-ink SVG is not the header logo.
seal_url="./assets/li-seal.svg?v=exact-header-s146"
assert html.count('src="'+seal_url+'"')==1, "Header seal must be approved SVG"
assert html.count('rel="icon" type="image/svg+xml" href="'+seal_url+'"')==1, "Favicon must share exact header logo asset"
assert 'rel="icon" type="image/svg+xml" href="./assets/li-favicon.svg' not in html, "Legacy inverse-color favicon must not be referenced"
assert seal.count('<path fill="#243A29"')==1, "Approved transparent green seal altered"

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
# Settings IA: the five cards are now in 3 semantic groups in meaningful DOM order.
assert settings.count('class="settings-group"')==3
assert settings.count('class="settings-group-grid"')==3
assert [settings.index(f'id="{x}"') for x in ("settings-personalization","settings-reminders","settings-data")] == sorted([settings.index(f'id="{x}"') for x in ("settings-personalization","settings-reminders","settings-data")])
assert settings.index('id="study-mode-settings"') < settings.index('id="settings-buddy-card"') < settings.index('<div class="kicker">NHẮC NHỞ</div>') < settings.index('id="export-personal-data"')
assert len(re.findall(r'<article class="surface(?: tinted)?"(?: id="[^"]+")?>',settings))==5
assert settings.count('data-ly-mode=')==4
assert settings.count('data-buddy-name=')==3
for key in ('warm','teasing','serious'):
    assert f'data-buddy-name="{key}"' in settings
assert 'id="buddy-names-reset"' in settings
assert 'id="buddy-name-feedback" role="status" aria-live="polite"' in settings
assert 'const LI_BUDDY_NAMES_KEY="li.buddy-address.v1";' in page_html
assert 'window.liAddressLine=liBuddyLine;' in page_html
assert 'buddyNames:liBuddyNames' in page_html
assert 'if(data.buddyNames!==undefined)' in page_html
contextual=(site/"assets"/"laoly-context-s112.js").read_text(encoding="utf-8")
assert contextual.count('window.liAddressLine?window.liAddressLine(')==2
assert 'Settings IA: action-first grouping' in (site/"assets"/"ui-foundations.css").read_text(encoding="utf-8")
assert settings.count('id="export-personal-data"')==1
assert settings.count('id="import-personal-data"')==1
assert 'id="export-personal-data"' not in library and 'id="export-library"' not in html
assert 'document.getElementById("export-personal-data")' in html
assert 'const importTrigger=' in html and 'li-du-lieu-' in html
assert 'Trước khi xóa dữ liệu trang web hoặc đổi thiết bị, website, hãy xuất bản sao để có thể nhập lại ghi chép.' in settings
assert 'Ghi chép của bạn không tự động được gửi tới dịch vụ AI bên ngoài.' in settings
assert 'Bạn có thể xuất bản sao trong Tủ Riêng.' not in html
for selector in (
    '#page-settings > .section-shell > .editorial-grid{gap:var(--li-space-8)!important}',
    '#page-settings > .section-shell > .editorial-grid > .stack-sm{gap:var(--li-space-8)!important}',
    '#page-settings > .section-shell > .editorial-grid>.stack-sm{gap:var(--li-space-8)!important}'
):
    assert selector in html, f"Missing Settings spacing rule: {selector}"

# S114: both missing internal Settings gaps are explicit and isolated.
assert '#page-settings .surface > .select-row + .state-note' in html
assert '#page-settings .surface > .select-row + .action' in html
assert 'margin-top: var(--li-space-5);' in html or 'margin-top:var(--li-space-5)' in html
assert 'margin-top: var(--li-space-4);' in html or 'margin-top:var(--li-space-4)' in html
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
assert settings.count('data-buddy="1"') == 0
assert 'Xem mẫu câu thoại' not in settings
assert 'class="settings-buddy-footer"' not in settings
assert 'class="settings-buddy-heading"' in settings
assert '#settings-buddy-card .settings-buddy-heading' in html
assert '#settings-buddy-card .settings-buddy-illustration' in html
# S157: the final toggle already has a bottom rule; no separate top rule for names.
settings_styles=(site/"assets"/"ui-foundations.css").read_text(encoding="utf-8")
assert 'border-top: 1px solid var(--rule)' not in settings_styles.split('#page-settings .buddy-address-settings {', 1)[1].split('}', 1)[0]
assert '#settings-buddy-card .settings-buddy-footer' not in html
assert 'li-layout.css?v=20261118-back-undo' in page_html and bool(re.search(r'<link rel="stylesheet" href="\./assets/ui-foundations\.css\?v=[A-Za-z0-9._-]+">', head))

# S118: two compact mobile Guide tiles with shadow-safe column/row gutters; no duplicate S99 rule.
guide=section("guide")
assert guide.count('id="method-count"') == 1
assert 'id="method-cards" class="method-grid"' in guide
assert html.count("/* S118 · Guide two-up mobile tiles with deliberate outer gutters (consolidated S99/S116) */") == 1
assert "/* S99 guidebook responsive fix */" not in html
assert "/* S99 responsive Thần Chú - scoped to Guide route */" not in html
foundation=(site/"assets"/"ui-foundations.css").read_text(encoding="utf-8")
assert "grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)) !important;" in foundation
assert "-webkit-line-clamp: unset !important;" in foundation
# S127: mentor border matches the actual card borders, including the <=360px inset.
assert "#page-guide #method-cards > .method-card {" in foundation
assert "padding: var(--li-space-5) !important;" in foundation
assert "#page-guide #method-cards>.method-card .purpose{" not in html, "Retired S118 text-clamping CSS must not return"
assert "#page-guide #method-cards > .method-card .purpose {" in foundation
assert "--li-guide-s118-col-gap: 18px;" in foundation and "--li-guide-s118-row-gap: 20px;" in foundation
assert "--li-guide-s118-col-gap: 14px;" in foundation and "--li-guide-s118-row-gap: 18px;" in foundation
assert "function renderMethods(){" in html and "function showMethod(id){" in html
assert "/* S114 — restrained Lão Lý peek:" in html

# S134: all native writing areas use a real 32px background TILE, not an
# auto-sized gradient (auto-size made background-position ineffective on iOS).
assert html.count("/* S128/S134 · Shared ruled writing paper.") == 1
assert "textarea,.notebook{" in html
assert "line-height:var(--li-notebook-line-height)!important;" in html
assert "background-image:" in html
assert "linear-gradient(to bottom,transparent 0 31px,var(--li-color-notebook-rule) 31px 32px)!important;" in html
assert "background-size:100% 16px,100% var(--li-notebook-line-height)!important;" in html
assert "background-position:0 0,0 8px!important;" in html
assert "background-repeat:no-repeat,repeat!important;" in html
assert "background-attachment:scroll,local;" in html
assert "--li-notebook-baseline-shift:" not in html, "Removed ineffective phase-offset hack must stay removed"
# The tiled rule is aligned to the 32px text line (first rule at 8 + 31).
# Its preceding repeat is masked by the first 16px opaque cream layer.
notebook_first_rule = 8 + 31
assert notebook_first_rule == 39
assert (notebook_first_rule - 32) < 16
assert ':root{--li-notebook-line-height:31px' not in html
assert '--li-notebook-line-height: 32px' in foundation
assert "textarea::placeholder{color:var(--muted);opacity:.8}" in html
assert html.count('class="text-editor"') >= 2

# UX-IA-04: note review belongs under the collection list; edit history is append-only.
library=section("library")
assert library.count('library-more-link')==2
assert library.count('data-lucide="arrow-right"')>=2
assert library.count('id="li-library-latest-lesson"')==1
assert 'id="li-saved-questions"' not in library
assert '<section id="page-noteDetail"' in page_html
assert '<button id="li-note-save"' in page_html
assert '<button id="li-note-delete"' in page_html
assert '<div id="li-note-history-list"' in page_html
assert '<script src="./assets/library-note-editor.js?v=4"></script>' in page_html
hub=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'Xem trong Bộ sưu tập' not in hub
assert hub.count('library-detail-link","Xem chi tiết"')==3
assert 'library-text-link library-open-lesson' in hub
assert 'if(id==="noteDetail")window.liNotes?.renderDetail();' in page_html
assert 'library-hub.css?v=7' in page_html
subprocess.run(["node",str(site.parent/"tools"/"test_library_note_versions.cjs")],check=True,cwd=site.parent)

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
    ("#page-guideDetail .editorial-grid > .surface > .kicker + h2","margin-top:var(--li-space-3)"),
    ("#page-guideDetail .editorial-grid > .surface > .kicker + .path-list","margin-top:var(--li-space-4)"),
    ("#page-guideDetail .editorial-grid > .surface > h2 + p","margin:var(--li-space-3) var(--li-space-0) var(--li-space-0)"),
    ("#page-guideDetail .editorial-grid > .surface > p + .kicker","margin-top:var(--li-space-6)"),
    ("#page-guideDetail .editorial-grid > .surface > .kicker + .state-note","margin-top:var(--li-space-3)"),
    ("#page-guideDetail .editorial-grid > .surface > .state-note + .action","margin-top:var(--li-space-5)"),
    ("#page-guideDetail .path-item p","margin:var(--li-space-0)"),
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
assert layout_css.count('url("./home-mystic-cool-mobile.webp")') == 1, "CSS-relative artwork URL must resolve from assets/"
assert layout_css.count('url("./home-mystic-cool-desktop.webp")') == 1, "CSS-relative artwork URL must resolve from assets/"
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
assert html.count('data-nav-back aria-label="Quay lại màn trước"')==4
assert page_html.count('id="li-global-back"')==1
assert 'if(back)back.hidden=id==="home"' in page_html
assert '.header #li-global-back{' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
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
# UX-DASH-01: cards are grouped by the user's job, not the legacy card 03/04 DOM adjacency.
assert library_section.count('class="library-group" role="region"')==3
assert all(x in library_section for x in ('library-resume-heading','library-collection-heading','library-reflection-heading'))
assert '<div class="surface-grid cols2">' in library_section
assert library_section.count('id="case-archive-preview"')==1
assert html.count('id="li-diary-calendar"')==1
assert html.count('id="li-diary-bars"')==1
assert html.count('id="li-diary-consent"')==1
assert html.count('id="li-diary-delete"')==1
assert (site/"assets"/"personal-diary.js").is_file()
assert (site/"assets"/"personal-diary.css").is_file()

# UX-IA-03: no flattened top-level shelf items; latest truthful records and full details.
library_section=section("library")
assert all(x in library_section for x in ('library-resume-heading','library-collection-heading','library-reflection-heading'))
assert 'id="li-library-latest-lesson"' in library_section
assert 'id="li-library-latest-idea"' in library_section
assert 'id="li-saved-questions"' not in library_section, "Dấu Trang must live only in Quay lại details"
assert 'id="page-resume"' in html and 'id="page-collection"' in html
assert html.count('id="li-saved-questions"')==1
assert html.count('id="case-archive-preview"')==1
assert 'data-demo="Chưa lưu được ý này' not in html
assert 'id="save-capture-note"' in html
assert html.count('id="li-checkin-recording-disclosure"')==1
assert html.index('li-diary-privacy')>html.index('li-diary-day-status')
assert '<script src="./assets/library-hub.js?v=7"></script>' in html
subprocess.run(["node",str(site.parent/"tools"/"test_library_hub_v2.cjs")],check=True,cwd=site.parent)

# UX-IA-05: lesson modules only own lesson/catalog DOM, never Tủ Riêng overview.
# Regression reproduced on iPhone: L09/L03/L15 static lesson cards were prepended
# above Quay lại and bypassed the one-latest-item shelf.
for lesson in ("l09","l03","l15"):
    module=site/"assets"/f"lesson-{lesson}-hifi-markup.js"
    source=module.read_text(encoding="utf-8")
    assert "library.prepend(" not in source
    assert 'document.querySelector("#page-library .stack-sm")' not in source
    assert f'<script src="./assets/lesson-{lesson}-hifi-markup.js?v=20261118-ia07"></script>' in page_html
subprocess.run(["node",str(site.parent/"tools"/"test_library_wave1_mount_ia.cjs")],check=True,cwd=site.parent)

# UX-IA-06: Save and Unsave have distinct semantics from submitting an answer
# or deleting a Bút Ký. Full case context must survive in the saved snapshot.
assert 'const savedContent=liInitialState.savedContent;' in page_html
assert 'savedContent:data.savedContent||[]' in page_html
assert 'ideas:collectedIdeas,savedContent,draft:' in page_html
assert 'caseSnapshot' in page_html and 'selectedText:caseOptions.find' in page_html
assert 'id="li-note-case-context"' in page_html
assert 'data-li-bookmark-kind="case"' in page_html
assert '<script src="./assets/library-bookmarks.js?v=3"></script>' in page_html
assert '<script src="./assets/library-note-editor.js?v=4"></script>' in page_html
assert '<script src="./assets/library-hub.js?v=7"></script>' in page_html
for lesson_id,slug in (("L03-1-2","l03"),("L09-1-2","l09"),("L15-2-2","l15")):
    content=(site/"assets"/f"lesson-{slug}-hifi-markup.js").read_text(encoding="utf-8")
    assert f'data-li-bookmark-id="{lesson_id}"' in content
    assert 'data-li-bookmark-kind="lesson"' in content
assert 'function renderCaseContext(note,type)' in (site/"assets"/"library-note-editor.js").read_text(encoding="utf-8")
subprocess.run(["node",str(site.parent/"tools"/"test_library_bookmarks.cjs")],check=True,cwd=site.parent)
subprocess.run(["node",str(site.parent/"tools"/"test_library_case_review.cjs")],check=True,cwd=site.parent)

# UX-IA-07: Save/Unsave and Delete are independent icon utilities.
# A different purpose must not share the same CTA toolbar / button hierarchy.
home=section("home")
assert 'class="mirror-titlebar"' in home and 'class="library-icon-utility mirror-bookmark-slot"' not in home
assert 'id="save-question"' in home
hero_actions=home[home.index('<div class="hero-actions">'):home.index('</div></div>',home.index('<div class="hero-actions">'))]
assert 'id="save-question"' in hero_actions
assert 'function refreshQuestionBookmark()' in page_html
assert 'findSavedMirrorQuestion(sc)' in page_html
assert 'class="library-heading-with-utility"' in section("case")
assert 'data-li-bookmark-kind="case"' in section("case")
detail=section("noteDetail")
assert 'class="library-note-head"' in detail
assert 'id="li-note-delete"' in detail
note_management=detail[detail.index('class="library-note-management"'):detail.index('</div>',detail.index('class="library-note-management"'))]
assert 'li-note-delete' not in note_management, "Destructive action must not share Edit toolbar"
assert 'class="library-icon-utility library-delete-utility"' in detail
for slug,lesson in (("l03","L03-1-2"),("l09","L09-1-2"),("l15","L15-2-2")):
    mount=(site/"assets"/f"lesson-{slug}-hifi-markup.js").read_text(encoding="utf-8")
    assert 'class="library-heading-with-utility library-lesson-heading"' in mount
    assert f'data-li-bookmark-id="{lesson}"' in mount
    hero=mount[mount.index('<div class="l09-hero-tools">'):mount.index('<div class="l09-lang-switch"',mount.index('<div class="l09-hero-tools">'))]
    assert 'data-li-bookmark-kind=' not in hero, "Save must not share Back / Language controls"
hub=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'library-icon-utility library-row-utility' in hub
assert 'library-icon-action library-unsave-icon' in hub
assert 'library-bookmark-actions' in hub
assert 'library-unsave-link' not in hub
bookmark=(site/"assets"/"library-bookmarks.js").read_text(encoding="utf-8")
assert 'button.innerHTML=' in bookmark and 'button.textContent=saved?' not in bookmark
iconcss=(site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'width:var(--li-space-12)' in iconcss and '.library-icon-action:focus-visible' in iconcss
assert '/* UX-IA-12 · All real-app Save/Unsave actions' in iconcss
assert '.page .library-icon-action:not(.library-danger-icon)' in iconcss
assert '#page-home .hero-actions .mirror-save-action' in iconcss
assert 'window.liShowUndo=(message,undo)=>toast(message,{undo});' in page_html
assert 'toast("Đã bỏ lưu câu hỏi.",{undo:' in page_html
assert 'toast("Đã bỏ lưu câu hỏi.",{undo:' in hub
assert 'toast("Đã xóa ghi chép và lịch sử phiên bản.",{undo:' in (site/"assets"/"library-note-editor.js").read_text(encoding="utf-8")
assert 'window.liShowUndo("Đã xóa lịch hoạt động.",' in (site/"assets"/"personal-diary.js").read_text(encoding="utf-8")

# UX-IA-08: Quay lại overview has exactly one actual lesson AND one actual
# problem/case, while full rows and bookmarks remain on the detail route.
library=section("library")
resume=section("resume")
assert library.count('id="li-library-latest-lesson"')==1
assert library.count('id="li-library-latest-problem"')==1
assert library.count('library-resume-previews')==1
assert 'id="li-lesson-history"' not in library
assert 'id="li-problem-history"' not in library
assert resume.count('id="li-lesson-history"')==1
assert resume.count('id="li-problem-history"')==1
assert resume.count('id="li-saved-questions"')==1
hub=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'PROBLEM_VISITS_KEY="li.private.problem.visits.v1"' in hub
assert 'renderProblemRows($("li-library-latest-problem"),1)' in hub
assert 'renderProblemRows($("li-problem-history"),40)' in hub
assert 'const details=add(row,"button","library-text-link library-detail-link","Tiếp tục");' in hub
assert 'btn(row,"Tiếp tục",item.route,"library-text-link library-open-lesson");' in hub
assert 'trackProblem,renderProblemRows' in hub
assert 'if(id==="case")window.liLibraryShelf?.trackProblem("case","sampling-bias-90");' in page_html
assert 'window.liLibraryShelf?.trackProblem("research",scenarios[qIndex]);' in page_html
subprocess.run(["node",str(site.parent/"tools"/"test_resume_problem_case.cjs")],check=True,cwd=site.parent)

# UX-IA-09: Dấu Trang is two exclusive accessible tabs, not a mixed list.
resume=section("resume")
library=section("library")
assert resume.count('role="tablist"')==1
assert resume.count('role="tabpanel"')==2
assert resume.count('data-bookmark-tab="lesson"')==1
assert resume.count('data-bookmark-tab="question"')==1
assert resume.count('id="li-saved-lessons"')==1
assert resume.count('id="li-saved-questions"')==1
assert resume.count('id="li-bookmarks-empty-lessons"')==1
assert resume.count('id="li-bookmarks-empty-questions"')==1
assert 'id="li-saved-lessons"' not in library and 'id="li-saved-questions"' not in library
assert resume.count('aria-selected="true"')>=1
assert 'id="li-bookmark-panel-questions"' in resume and 'tabindex="-1" data-bookmark-tab="question"' in resume
assert 'Bài học, case và câu hỏi đã lưu' not in resume
hub=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'let bookmarkTab="lesson";' in hub
assert 'function selectBookmarkTab(type,focus=false)' in hub
assert 'renderSavedBookmarkEntries(lessonRoot,lessons' in hub
assert 'renderSavedBookmarkEntries(questionRoot,questions' in hub
assert 'const questions=ordered([' in hub and 'x.type==="case"' in hub
assert 'savedQuestions.map(x=>({kind:"question"' in hub
assert 'shelf.renderResume()' in (site.parent/"tools"/"test_library_hub_v2.cjs").read_text(encoding="utf-8")

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
# S147: retain the sourced text, but surface a concise original + commentary.
# Disclosure metadata must remain accessible via a single opt-in info button.
assert len(re.findall(r'<script src="\./assets/laoly-quotes-s121\.js(?:\?v=[0-9]+)?"></script>', page_html))==1
assert 'if(window.liQuoteEngine?.render){window.liQuoteEngine.render();return;}' in html
for element_id in ("buddy-quote-original","buddy-quote-translation","buddy-quote-context","buddy-quote-info","buddy-quote-gloss","buddy-quote-meta","buddy-quote-link"):
    assert page_html.count(f'id="{element_id}"')==1, f"Quote element missing or duplicated: {element_id}"
assert 'aria-controls="buddy-quote" aria-expanded="false"' in page_html
assert 'document.getElementById("buddy-quote-info").addEventListener("click"' in page_html
assert '#buddy-modal #buddy-quote-context {' in foundation
assert '#buddy-modal .buddy-heading #buddy-quote-original {' in foundation
assert '#buddy-modal .buddy-heading #buddy-quote-translation {' in foundation
heading=page_html.split('<header class="buddy-heading">',1)[1].split('</header>',1)[0]
body=page_html.split('<div id="buddy-scroll"',1)[1].split('<div id="buddy-debate"',1)[0]
assert '<aside id="buddy-quote"' in heading and '<aside id="buddy-quote"' not in body
assert heading.index('id="buddy-quote-original"') < heading.index('id="buddy-quote-translation"') < heading.index('id="buddy-quote-info"') < heading.index('id="buddy-quote"')
assert 'translation.textContent="Dịch nghĩa: "+item.translation;' in quote_js
assert 'gloss.textContent="Diễn nghĩa: "+item.interpretation;' in quote_js
assert quote_js.count('"translation":')>=24 and quote_js.count('"interpretation":')>=24
assert 'note.textContent=item.comment;' in quote_js and 'Lão Lý liên hệ: ' not in quote_js
assert 'https://zh.wikisource.org/' in quote_js and 'https://en.wikisource.org/' in quote_js
subprocess.run(["node","--check",str(quotes)],check=True)
subprocess.run(["node",str(site.parent/"tools"/"test_quotes.js")],check=True,cwd=site.parent)

# S125: mandatory source-grounded Lão Lý for all native lesson modules.
subprocess.run(["python3",str(site.parent/"tools"/"validate_lesson_companions.py")],check=True,cwd=site.parent)

assert (site/".nojekyll").is_file()
print("PASS 13 techniques, 4 modes, 7 assets, S107 Settings export/import and canonical 32px gaps, privacy copy, JS parsing")


# S158: Home mirror now has two honest entry routes (problem -> research,
# published Wave1 hook -> canonical lesson). Cross-links never point to draft Wave2/3.
home = section("home")
assert home.count('id="mirror-primary-action"') == 1
assert home.count('id="mirror-primary-label"') == 1
assert 'action.dataset.page=isHook?item.lessonRoute:"research";' in page_html
assert 'document.getElementById("mirror-primary-label").textContent=isHook?"Khám phá vì sao":"Đào sâu";' in page_html
assert 'function renderMirrorItem()' in page_html
assert 'renderMirrorItem();' in page_html
assert 'if(scenarios[qIndex].type!=="hook")syncResearch();' in page_html
for route in ("lessonL03", "lessonL09", "lessonL15"):
    assert f'type:"hook",lessonRoute:"{route}"' in page_html
assert page_html.count('type:"hook",lessonRoute:') == 3
assert 'sc.type==="hook"?"Đã lưu điều bất ngờ vào Dấu Trang."' in page_html
library_js=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'const target=scenarios[idx].type==="hook"?scenarios[idx].lessonRoute:"research";' in library_js
assert 'navigate(target);' in library_js
assert '<script src="./assets/lesson-related-wave1.js"></script>' in page_html
assert bool(re.search(r'<link rel="stylesheet" href="\./assets/ui-foundations\.css\?v=[A-Za-z0-9._-]+">', head))
cross=(site/"assets"/"lesson-related-wave1.js").read_text(encoding="utf-8")
assert 'Object.keys(RELATED).forEach' in cross
assert all(k in cross for k in ("L03-1-2", "L09-1-2", "L15-2-2"))
assert 'L03-2-' not in cross and 'L09-2-' not in cross and 'L15-3-' not in cross
assert 'list.replaceChildren()' in cross
assert 'window.navigate(lesson.route)' in cross
assert 'locale==="vi"?' in cross
assert 'li-related-lessons' in foundation

# UX-DS-11 · Review components are connected; app Guide chips use full pills.
assert 'ui-foundations.css?v=20261118-ds14-brand-focus' in page_html
assert '#page-guide #method-filters .filter,' in foundation and 'border-radius:999px!important;' in foundation
v3=(site/"component-library-review.html").read_text(encoding="utf-8")
assert 'component-review-v3.css?v=20261118-ds13-selection' in v3
assert 'component-review-v3.js?v=20261118-ds13-week-fix' in v3
assert all('<section id="'+id+'"' in v3 for id in ("controls","dataviz"))
assert all('id="'+id+'"' in v3 for id in
 ("ds11-calendar","ds11-chart","ds11-lang-switch","ds11-dropdown-trigger",
  "ds11-icon-input","ds11-week-prev","ds11-week-next"))
assert '4 cấp màu là đề xuất chưa được PO chốt' in v3
v3css=(site/"assets"/"component-review-v3.css").read_text(encoding="utf-8")
assert '.ds-chip{border-radius:999px}' in v3css
assert all('--ds11-rhythm-'+k in v3css for k in ("overload","recover","start","focus"))
v3js=(site/"assets"/"component-review-v3.js").read_text(encoding="utf-8")
assert 'const order=["overload","recover","start","focus"]' in v3js
assert 'role="menuitemradio"' in v3
assert 'role="switch"' in v3
assert 'const starts=windowStarts()' in v3js
assert 'id="ds11-progress-demo"' in v3 and 'class="ds11-progress-track compact"' in v3
assert 'class="ds11-progress-track indeterminate"' in v3
assert '.ds11-progress-track.indeterminate' in v3css
assert 'doneSteps=Math.min(6,doneSteps+1)' in v3js
assert 'No data' not in v3js or 'DEMO' in v3js

# UX-DS-12 · PO-requested component and actual-app deltas. Review-only new
# visuals are not G2 signoff, and demo charts never touch private diary.
ds12=(site/"assets"/"component-review-v4.css").read_text(encoding="utf-8")
assert 'component-review-v4.css?v=20261118-ds14-brand-mirror' in v3
assert 'component-review-v2.css?v=20261118-ds12-white-note' in v3
assert 'component-review-v3.js?v=20261118-ds13-week-fix' in v3
assert '--white: #FFFFFF;' in (site/"assets"/"design-tokens.css").read_text(encoding="utf-8")
assert all(x in foundation for x in ("/* UX-DS-12", ".page input[type=\"checkbox\"]", "background-color:var(--white)!important"))
assert all(x in v3 for x in ("ds12-horizontal-stack","ds12-tag-row","ds11-month-today","ds11-week-today"))
assert all(x in ds12 for x in ("ds12-variant-secondary","ds12-variant-dark","ds12-horizontal-card","ds12-tag","data-today"))
assert all(x in v3js for x in ("function returnToday(){","new Date()","dataset.ds12CardMode"))

# UX-DS-13 · PO correction: gallery uses existing full Lão Lý mirror image;
# no week-range tile shadow; today dot is separate from selected stroke.
assert 'component-review-v4.css?v=20261118-ds14-brand-mirror' in v3
assert v3.count('src="./assets/laoly-mirror-suy-nghi.png"')==3
assert 'src="./assets/laoly-neutral.png"' not in v3
assert 'border-right-width:var(--li-space-0)' in ds12
assert '.ds11-date[data-window="true"]' not in v3css
assert 'b.dataset.window=' not in v3js
assert '.ds11-date[data-today="true"]::after,' in ds12
assert 'width:6px;height:6px;' in ds12
assert 'border:3px solid var(--li-color-input-focus-ring)!important;' in ds12
assert 'outline:var(--ds11-no-shadow)!important;' in ds12
assert '/* UX-DS-13' in foundation
assert 'border:3px solid var(--li-color-input-focus-ring)!important;' in foundation
assert 'outline:var(--li-space-0) solid var(--li-color-input-focus-ring)!important;' in foundation

# UX-DS-14 · Brand focus color is dark moss, not olive green;
# horizontal Lão Lý mirror artwork grows at desktop, mobile and narrow.
assert '"input-focus-ring": "#243A29"' in (site.parent/"design-system"/"tokens.json").read_text(encoding="utf-8")
assert '--li-color-input-focus-ring: #243A29;' in (site/"assets"/"design-tokens.css").read_text(encoding="utf-8")
assert 'grid-template-columns:minmax(0,164px) minmax(0,1fr)' in ds12
assert 'grid-template-columns:minmax(0,124px) minmax(0,1fr)' in ds12
assert 'grid-template-columns:minmax(0,104px) minmax(0,1fr)' in ds12
assert ds12.count('border:3px solid var(--li-color-input-focus-ring)!important;')==2

# UX-DS-10: updated Safari CSS must defeat stale rectangular tap overlay without
# removing keyboard focus-visible affordance or changing approved Home CTA geometry.
assert 'li-layout.css?v=20261118-back-undo' in page_html
assert 'ui-foundations.css?v=20261118-ds14-brand-focus' in page_html
assert '/* UX-DS-10 · iOS pressed feedback:' in foundation
assert '-webkit-tap-highlight-color: var(--li-uxds10-touch-clear) !important;' in foundation
assert ':focus:not(:focus-visible)' in foundation
review10=(site/"component-library-review.html").read_text(encoding="utf-8")
assert 'ds-notebook' in review10 and 'ds-home-bubble green' in review10
assert all('src="./assets/'+p+'"' in review10 for p in
 ("home-mystic-cool-desktop.webp","home-mystic-cool-mobile.webp","laoly-mirror-suy-nghi.png"))
review10css=(site/"assets"/"component-review-v2.css").read_text(encoding="utf-8")
assert 'background-size:100% 16px,100% var(--li-review-notebook-line)!important;' in review10css
assert '.ds-home-bubble.green' in review10css and '.ds-image-split' in review10css

# UX-DS-09: mobile Tủ Riêng uses the same Archive icon as Home, never Bookmark.
mobile_nav=page_html.split('<nav class="mobile-nav"',1)[1].split('</nav>',1)[0]
library_tab=re.search(r'<button[^>]+data-page="library"[^>]*>\s*<i data-lucide="([^"]+)"',mobile_nav)
assert library_tab and library_tab.group(1)=="archive", "Tủ Riêng nav icon must be archive (bookmark is Save)"
review=(site/"component-library-review.html").read_text(encoding="utf-8")
assert '<section id="icons"' in review and '<section id="inputs"' in review
assert '<script src="./assets/lucide.min.js"></script>' in review
assert 'ds-large light' in review and 'ds-large warm' in review
assert all(x in review for x in ('ds-textarea','ds-chip-result','ds-error','ds-disabled','ds-readonly'))
assert all(x in review for x in ('ds-home-bubble','ds-tabs','ds-utility','ds-back','ds-link'))

# S159: mirror name remains consistent while purpose-specific CTAs still route.
assert 'if(kind)kind.textContent="Gương Vạn Vấn";' in page_html
assert 'Gương Vạn Vấn · Vấn đề' not in page_html
assert 'Gương Vạn Vấn · Điều bất ngờ' not in page_html
assert 'if(kind)kind.textContent="Gương Vạn Vấn · "' not in page_html
for original in (
    'Một câu hỏi mở vẫn có thể gài sẵn câu trả lời.',
    'Ngưỡng đặt hàng không phải số lượng đặt hàng.',
    'Một ngàn câu trả lời vẫn có thể dẫn tới kết luận lệch.',
):
    assert f'previousQuestion:"{original}"' in page_html, "Old Dấu Trang hook must remain resolvable"
library_hub=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'x.question===item.question||x.previousQuestion===item.question||(x.key&&x.key===item.scenarioKey)' in library_hub
assert 'sc.key&&x.scenarioKey===sc.key' in page_html
assert 'scenarioKey:sc.key||null' in page_html
assert 'Câu hỏi mở vẫn có thể âm thầm dẫn dắt câu trả lời. Vì sao?' in page_html
assert 'Ngưỡng đặt hàng khác lượng hàng cần mua. Nhầm hai thứ ấy thì sao?' in page_html
assert 'Có tới một ngàn người trả lời khảo sát. Sao kết luận vẫn có thể lệch?' in page_html
assert 'top: 39% !important;' in foundation
assert 'gap: var(--li-space-1) !important;' in foundation
assert 'overflow: visible;' in foundation
