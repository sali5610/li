#!/usr/bin/env python3
"""Static integrity checks for the full li. Hi-Fi Pages package."""
from pathlib import Path
import re, subprocess, tempfile, json, hashlib
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

# UX-HOME-05: PO removes the visible mirror title; question + accessible region survive.
assert 'class="mirror-titlebar"' not in html
assert 'class="mirror-label"' not in html
assert 'aria-label="Cảnh thư viện cổ thụ và Gương Vạn Vấn"' in html

# UX-DS-28: native Safari viewport and zoom remain enabled; mirror swipe stays local.
for needle in (
    'content="width=device-width,initial-scale=1,minimum-scale=1,viewport-fit=cover"',
    '/* S139 · Sticky top navigation, fixed touch-viewport scale.',
    'touch-action:pan-x pan-y;',
    'scroll-padding-top:88px;',
    'position:sticky;',
    'z-index:42;',
    'html{scroll-padding-top:74px}',
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

# No global gesture interception: 1x is the zoom-out floor; pinch-in stays available.
for forbidden in ("user-scalable=no", "maximum-scale=1",
                  'document.addEventListener("gesturestart"', 'document.addEventListener("gesturechange"',
                  "event.touches?.length>1)event.preventDefault()"):
    assert forbidden not in page_html, f"Native pinch-zoom blocked by {forbidden}"
foundations=(site/"assets"/"ui-foundations.css").read_text(encoding="utf-8")
assert "html { touch-action: pan-x pan-y pinch-zoom; }" in foundations
assert "#page-home .mirror-message { touch-action: pan-y pinch-zoom; }" in foundations
# Assert the active Safari/iPad physical-shell stylesheet, not an obsolete cache-buster.
assert 'ipad-home-canvas.css?v=' in page_html, "iPad physical shell stylesheet missing"


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
    ".header .logo{display:block;line-height:var(--li-leading-legacy-01);transform:translateY(2px)}",
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
# The native pre-mount paint may not erase permitted React ?view= bookmarks.
# Unknown/lesson-shaped views are not trusted; the React router gates lessons.
assert 'const liInitialQuery=new URLSearchParams(window.location.search);' in html
assert 'const liInitialCatalog=liInitialQuery.get("catalog");' in html
assert 'const liRequestedView=liInitialView&&/^[A-Za-z][A-Za-z0-9]*$/.test(liInitialView)' in html
assert 'document.getElementById("page-"+liInitialView)?liInitialView:null;' in html
assert 'navigate(liInitialCatalog&&!liInitialLesson?"catalog":"home"' in html
assert 'syncUrl:!(liInitialCatalog||liInitialLesson||liRequestedView)' in html
assert 'const lesson=LI_LESSON_ROUTES[id]||window.liReleasedEditorialRoutes?.[id];' in html
assert 'if(!lesson){url.searchParams.delete("chapter");if(id!=="catalog")url.searchParams.delete("catalog");}' in html

# S135: mobile mirror safe-area, independent subtle text float, and no square iOS tap flash.
assert html.count("/* S135 · Mirror copy safe area + paper-float.") == 1
for token in (
    "width:min(54%,194px)!important;",
    "max-width:194px!important;",
    "font-size:var(--li-type-fluid-07)!important;",
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
# S146: favicon and standard header use the same approved geometric SVG.
# The transparent Home header swaps to the separately shipped cream SVG,
# so the visual contrast stays correct without CSS filter inversion.
seal_matches=re.findall(r'<link rel="icon" type="image/svg\+xml" href="(\./assets/li-seal\.svg\?v=[\w-]+)">',page_html)
assert len(seal_matches)==1, "Favicon must reference the approved geometric seal"
seal_url=seal_matches[0]
assert page_html.count('class="brand-stamp brand-stamp--default" src="'+seal_url+'"')==1, "Standard header must share favicon SVG URL"
home_seal=site/"assets"/"li-seal-home.svg"
assert home_seal.is_file() and 'fill="#FAF9F5"' in home_seal.read_text(encoding="utf-8"), "Geometric cream Home seal missing"
assert page_html.count('class="brand-stamp brand-stamp--home" src="./assets/li-seal-home.svg?v=')==1, "Home must use the light geometric SVG"
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
assert bool(re.search(r'<link rel="stylesheet" href="\./assets/li-layout\.css\?v=[A-Za-z0-9._-]+">', head)) and bool(re.search(r'<link rel="stylesheet" href="\./assets/ui-foundations\.css\?v=[A-Za-z0-9._-]+">', head))

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
assert "--li-guide-s118-col-gap: var(--li-micro-guide-column-gap-18);" in foundation and "--li-guide-s118-row-gap: var(--li-space-5);" in foundation
assert "--li-guide-s118-col-gap: var(--li-micro-guide-column-gap-14);" in foundation and "--li-guide-s118-row-gap: var(--li-micro-guide-row-gap-18);" in foundation
assert "function renderMethods(){" in html and (
    "function showMethod(id){" in html or
    "function showMethod(id,{practice=false}={}){" in html or
    "function showMethod(id,{practice=false,lessonId=null}={}){" in html
), "Spells must retain the existing working detail/practice route"
if "function showMethod(id,{practice=false}={}){" in html:
    assert 'practice:t.dataset.spellPractice==="true"' in html
    assert 'window.LiSpellPractice?.open(id,practice?"practice":"guide")' in html
if "function showMethod(id,{practice=false,lessonId=null}={}){" in html:
    assert 'practice:t.dataset.spellPractice==="true",lessonId:t.dataset.spellLesson||null' in html
    assert 'window.LiSpellPractice?.open(id,practice?"practice":"guide",lessonId)' in html
    # React owns the direct Thần Chú action; hidden DOM attributes were retired.
    assert 'onClick={()=>openLessonSpell(id,spell.shortId,index===0)}' in (site.parent/"tools/step16-real-l09-react-island/src/learning/Wave1Journey.tsx").read_text(encoding="utf-8")
    assert 'activeLessonId==="L03-1-2"' in (site/"assets/spell-practice.js").read_text(encoding="utf-8")
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
assert '--li-notebook-line-height: var(--li-leading-notebook)' in foundation
assert "textarea::placeholder{color:var(--muted);opacity:.8}" in html
assert html.count('class="text-editor"') >= 2

# UX-IA-04: note review belongs under the collection list; edit history is append-only.
library=section("library")
assert library.count('library-more-link')==3
assert library.count('data-page="bookmarks"')==1, "Tủ Riêng must link to the standalone Dấu trang page"
assert library.count('data-lucide="arrow-right"')>=3
assert library.count('id="li-library-latest-lesson"')==1
assert 'id="li-saved-questions"' not in library
assert '<section id="page-noteDetail"' in page_html
assert '<button id="li-note-save"' in page_html
assert '<button id="li-note-delete"' in page_html
assert '<div id="li-note-history-list"' in page_html
assert '<script src="./assets/library-note-editor.js?v=5"></script>' in page_html
hub=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'Xem trong Bộ sưu tập' not in hub
assert hub.count('library-detail-link","Xem chi tiết"')==2
assert 'library-detail-link",ui("Xem chi tiết","View details")' in hub
assert 'library-danger-link",ui("Xóa","Delete")' in hub
assert 'window.liNotes?.deleteNote(item.entryType,item.id)' in hub
assert 'library-text-link library-open-lesson' in hub
assert 'if(id==="noteDetail")window.liNotes?.renderDetail();' in page_html
# UX-DS-25: honor device-aware Home cache key.
assert re.search(r'<link rel="stylesheet" href="\./assets/library-hub\.css\?v=[A-Za-z0-9._-]+">', page_html), "Versioned library CSS must be loaded"
# UX-HOME-07: no Home-only min-height can force a page scroll, and routing
# must restore browser scrolling for all other screens.
homecss=(site/"assets"/"library-hub.css").read_text(encoding="utf-8")
home_lock=homecss[homecss.index("/* UX-HOME-07 · Fixed one-screen Home"):]
for token in ("html:has(.app.home-focus)", "body:has(.app.home-focus)", "overflow-y:hidden!important;", "height:100dvh!important;", "min-height:0!important;", "--home-actions-bottom:calc(52px + var(--li-space-3)"):
    assert token in home_lock, f"Home viewport lock contract missing: {token}"
assert 'classList.toggle("home-focus",id==="home")' in page_html
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

# UX-HOME-20261121: validate both new PO-supplied binary snapshots, not retired art.
for name,git_sha in [
    ("home-li-iphone-20261121.webp","3e8e60fea09c3be78e3c254862f97fed5b35ffca"),
    ("home-li-landscape-20261121.webp","8791df23defddad10a19e47d88b742c4aafce54c"),
]:
    art=(site/"assets"/name).read_bytes()
    assert len(art)>100_000 and art[:4]==b"RIFF" and art[8:12]==b"WEBP",name
    git_blob=hashlib.sha1(b"blob "+str(len(art)).encode()+b"\0"+art).hexdigest()
    assert git_blob==git_sha,(name,"PO supplied artwork changed")
    assert (site.parent/"design-assets"/"home"/name).read_bytes()==art,name
for obsolete in ("home-li-iphone-20261119.jpg","home-li-ipad-20261119.jpg","home-mystic-cool-desktop.webp","home-mystic-cool-mobile.webp"):
    assert not (site/"assets"/obsolete).exists(),obsolete
device_css=(site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'background-image:url("./home-li-iphone-20261121.webp")!important;' in device_css
assert 'background-image:url("./home-li-landscape-20261121.webp")!important;' in device_css
assert "(max-width:1420px) and (orientation:landscape)" in device_css
# UX-DS-30 · Safari rotation recovery is a tightly scoped iPad-only, no-reload fallback.
rotation_js=(site/"assets"/"ipad-safari-rotation.js").read_text(encoding="utf-8")
assert 'ipad-safari-rotation.js?v=20261119-ds33' in page_html
assert 'ipad-viewport-debug.js' not in page_html, "iPad QA overlay must not ship in app"
for must in ('screen.orientation', 'window.orientation', 'navigator.maxTouchPoints>1', 'setTimeout(reconcile,0)', '--li-ipad-shell-width', '--li-ipad-shell-height', 'li-ipad-home-canvas', 'width=device-width,initial-scale=1,minimum-scale=1,viewport-fit=cover'):
    assert must in rotation_js, f"Safari recovery missing: {must}"
for forbid in ('window.location.reload(', 'localStorage.setItem(', 'indexedDB.deleteDatabase(', 'sessionStorage.clear('):
    assert forbid not in rotation_js, f"Rotation recovery must not touch persistence/reload: {forbid}"
ipad_canvas=(site/"assets"/"ipad-home-canvas.css").read_text(encoding="utf-8")
assert 'ipad-home-canvas.css?v=assets-20261121' in page_html, "single physical iPad Home shell must be loaded"
assert 'html.li-ipad-home-canvas .app.home-focus' in ipad_canvas
assert 'position:fixed!important;' in ipad_canvas
assert 'home-li-landscape-20261121.webp' in ipad_canvas
assert 'li-ipad-home-portrait' in ipad_canvas and 'li-ipad-home-landscape' in ipad_canvas
assert 'html.li-safari-landscape-recovery' not in (site/"assets"/"ui-foundations.css").read_text(encoding="utf-8")
assert 'html.li-safari-landscape-recovery' not in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'background-size:cover!important;' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")

assert "(any-pointer:coarse)" not in device_css, "Viewport-responsive iPad must not depend on hardware pointer"
assert html.count("/* S119 · Approved S106 Home art") == 1
assert layout_css.count('url("./home-li-iphone-20261121.webp")') >= 1, "CSS-relative artwork URL must resolve from assets/"
assert layout_css.count('url("./home-li-landscape-20261121.webp")') >= 1, "CSS-relative artwork URL must resolve from assets/"
home=section("home")
for identifier in ['id="mirror-question"','id="home-scene"','id="save-question"','id="previous-question"','id="shuffle"']:
    assert home.count(identifier)==1,identifier
assert 'data-page="research"' in home
assert "Muốn nhớ: thử T01/T02" not in (site/"assets"/"laoly-context-s112.js").read_text(encoding="utf-8")

# S112 — context-aware companion must be present, parse and pass UI-plan QA.
companion=site/"assets"/"laoly-context-s112.js"
assert companion.is_file() and companion.stat().st_size>4000
# Verify the single canonical companion script tag, independent of its cache-busting version.
assert html.count('<script src="./assets/laoly-context-s112.js?v=')==1
assert re.search(r'<script src="\./assets/laoly-context-s112\.js\?v=[a-zA-Z0-9-]+"></script>',html)
subprocess.run(["node","--check",str(companion)],check=True)
subprocess.run(["node",str(site.parent/"tools"/"test_buddy.js")],check=True,cwd=site.parent)
subprocess.run(["node",str(site.parent/"tools"/"test_lesson_companion_react_stage.cjs")],check=True,cwd=site.parent)

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
assert '<span class="hero-dialogue-avatar" aria-hidden="true"><img src="./assets/laoly-neutral.png?v=ux-art07-clean-five-20261119"' in html
assert 'const pageHistory=[];' in html
assert 'function goBack(){' in html
assert 'if(t.hasAttribute("data-nav-back")){goBack();return}' in html
subprocess.run(["node",str(site.parent/"tools"/"test_navigation.js")],check=True,cwd=site.parent)

# S120: Tủ Riêng Bút Ký matches the same neutral paper surface as cards 03 and 04.
library_section=section("library")
assert '<article id="notebook-section" class="surface" tabindex="-1"' in library_section
assert '<article id="notebook-section" class="surface tinted"' not in library_section
# UX-DASH-01: cards are grouped by the user's job, not the legacy card 03/04 DOM adjacency.
# Dấu trang is a standalone fourth Tủ Riêng group, not nested in Quay lại.
assert library_section.count('class="library-group" role="region"')==4
assert all(x in library_section for x in ('library-resume-heading','library-collection-heading','library-bookmarks-heading','library-reflection-heading'))
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
assert all(x in library_section for x in ('library-resume-heading','library-collection-heading','library-bookmarks-heading','library-reflection-heading'))
assert 'id="li-library-latest-lesson"' in library_section
assert 'id="li-library-latest-idea"' in library_section
assert 'id="li-saved-questions"' not in library_section, "Saved questions belong to the standalone Dấu trang page"
assert 'id="page-resume"' in html and 'id="page-collection"' in html and 'id="page-bookmarks"' in html
assert html.count('id="li-saved-questions"')==1
assert html.count('id="case-archive-preview"')==1
assert 'data-demo="Chưa lưu được ý này' not in html
assert 'id="save-capture-note"' in html
# L1 Check-in is React-owned; the privacy statement is now rendered in its
# authenticated dialog rather than a static guest-visible modal.
checkin_react=(site.parent/"tools"/"step16-real-l09-react-island"/"src"/"shell"/"checkin-dialog.tsx").read_text(encoding="utf-8")
assert 'id="li-react-checkin-root"' in page_html
assert 'id="checkin-modal"' not in page_html, "Legacy L1 modal must not reappear in static HTML"
assert 'id="li-checkin-recording-disclosure"' in checkin_react
assert 'data-react-owner="checkin"' in checkin_react
assert html.index('li-diary-privacy')>html.index('li-diary-day-status')
assert '<script src="./assets/library-hub.js?v=8"></script>' in html
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
# React Case persists to canonical storage; the hidden native textarea may be stale.
# Keep the notes-only backup shape and assert its data source, not old code formatting.
assert 'ideas:collectedIdeas,savedContent,draft,buddyNames:liBuddyNames' in page_html
assert 'const savedDraft=window.localStorage.getItem(LI_DRAFT_KEY)' in page_html
assert 'savedDraft??(window.liReactRouter?"":field?.value||"")' in page_html
# React Case writer must archive visible text; never derive the snapshot from hidden native markup.
assert 'const reactSnapshot=window.liReactRouter?window.liCaseUi?.getSnapshot?.():null;' in page_html
assert 'const caseArticle=window.liReactRouter?null:document.querySelector' in page_html
assert 'const caseSnapshot=reactSnapshot||{' in page_html
assert 'selectedText:caseOptions.find' in page_html # standalone native fallback
assert 'id="li-note-case-context"' in page_html
assert 'data-li-bookmark-kind="case"' in page_html
assert '<script src="./assets/library-bookmarks.js?v=4"></script>' in page_html
assert '<script src="./assets/library-note-editor.js?v=5"></script>' in page_html
assert '<script src="./assets/library-hub.js?v=8"></script>' in page_html
for lesson_id,slug in (("L03-1-2","l03"),("L09-1-2","l09"),("L15-2-2","l15")):
    content=(site/"assets"/f"lesson-{slug}-hifi-markup.js").read_text(encoding="utf-8")
    assert f'data-li-bookmark-id="{lesson_id}"' in content
    assert 'data-li-bookmark-kind="lesson"' in content
assert 'function renderCaseContext(note,type)' in (site/"assets"/"library-note-editor.js").read_text(encoding="utf-8")
subprocess.run(["node",str(site.parent/"tools"/"test_library_bookmarks.cjs")],check=True,cwd=site.parent)
subprocess.run(["node",str(site.parent/"tools"/"test_library_case_review.cjs")],check=True,cwd=site.parent)

# UX-HOME-01: The Home-only Save action shares the primary CTA component;
# elsewhere Save/Unsave and Delete remain independent icon utilities.
home=section("home")
assert 'class="mirror-titlebar"' not in home and 'class="library-icon-utility mirror-bookmark-slot"' not in home
assert 'id="save-question"' in home
hero_actions=home[home.index('<div class="hero-actions">'):home.index('</div></div>',home.index('<div class="hero-actions">'))]
assert 'id="save-question"' in hero_actions
assert 'class="primary mirror-save-action"' in hero_actions
assert hero_actions.count('class="action-icon"')==2
assert 'id="mirror-save-label">Lưu câu hỏi</span>' in hero_actions
assert 'class="home-tile"' not in home and 'LỐI ĐI TRONG THƯ VIỆN' not in home
assert home.count('class="hero"')==1
assert '<div class="app home-focus">' in page_html
assert 'classList.toggle("home-focus",id==="home")' in page_html
assert 'label.textContent=saved?"Đã lưu":"Lưu câu hỏi";' in page_html
# UX-HOME-02: bubble and its two shared-primary CTAs move together; the
# background fills the dynamic mobile viewport with the original approved art.
assert 'laoly-drag.js?v=20261119-control-dodge' in page_html
assert 'window.liCompanionDrag?.place?.();' in page_html
assert '/* UX-HOME-02 · Mobile Safari scene-fit' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert '--home-actions-bottom:var(--li-space-8);' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'height:max(580px,calc(100dvh - 66px))!important;' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert '--home-actions-bottom:calc(52px + var(--li-space-8) + env(safe-area-inset-bottom,0px));' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
# Scene extends behind the tab bar only while Home is active, with an
# app-color-derived overlay and readable active/inactive tab controls.
assert 'body:has(.app.home-focus) .mobile-nav{' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'color-mix(in srgb,var(--forest) 88%,var(--li-uxds10-touch-clear))' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'body:has(.app.home-focus) .mobile-nav .nav-btn[aria-current="page"]' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'border-top-width:0!important;' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'box-shadow:var(--li-uxds10-touch-no-shadow)!important;' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'background-size:cover!important;' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'body .laoly-support.li-companion-draggable{' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
subprocess.run(["node",str(site.parent/"tools"/"test_companion_drag.cjs")],check=True,cwd=site.parent)
assert '.app.home-focus .footer{display:none!important}' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'height:max(600px,calc(100svh - 82px))!important;' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
assert 'height:max(580px,calc(100svh - 66px - 52px - env(safe-area-inset-bottom,0px)))!important;' in (site/"assets"/"library-hub.css").read_text(encoding="utf-8")
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
assert '/* UX-IA-12 · Non-Home Save/Unsave icon utilities' in iconcss
assert '.page .library-icon-action:not(.library-danger-icon)' in iconcss
assert '#page-home .hero-actions .mirror-save-action' in iconcss
assert 'window.liShowUndo=(message,undo)=>toast(message,{undo});' in page_html
assert 'toast("Đã bỏ lưu câu hỏi.",{undo:' in page_html
assert 'toast("Đã bỏ lưu câu hỏi.",{undo:' in hub
assert 'toast("Đã xóa ghi chép và lịch sử phiên bản.",{undo:' in (site/"assets"/"library-note-editor.js").read_text(encoding="utf-8")
assert 'window.liShowUndo("Đã xóa lịch hoạt động.",' in (site/"assets"/"personal-diary.js").read_text(encoding="utf-8")

# UX-IA-08: Quay lại overview has exactly one actual lesson AND one actual
# problem/case, while saved bookmarks remain on their own page.
library=section("library")
resume=section("resume")
assert library.count('id="li-library-latest-lesson"')==1
assert library.count('id="li-library-latest-problem"')==1
assert library.count('library-resume-previews')==1
assert 'id="li-lesson-history"' not in library
assert 'id="li-problem-history"' not in library
assert resume.count('id="li-lesson-history"')==1
assert resume.count('id="li-problem-history"')==1
assert resume.count('id="li-saved-questions"')==0
assert section("bookmarks").count('id="li-saved-questions"')==1
hub=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'PROBLEM_VISITS_KEY="li.private.problem.visits.v1"' in hub
assert 'renderProblemRows($("li-library-latest-problem"),1)' in hub
assert 'renderProblemRows($("li-problem-history"),40)' in hub
assert 'const details=add(row,"button","library-text-link library-detail-link","Tiếp tục");' in hub
assert 'btn(row,"Tiếp tục",item.route,"library-text-link library-open-lesson");' in hub
# This port can gain additional exports without changing the existing
# problem-history contract; check membership, not adjacent source formatting.
assert 'window.liLibraryShelf=Object.freeze({' in hub
library_port=hub.split('window.liLibraryShelf=Object.freeze({',1)[1].split('});',1)[0]
assert {'trackProblem','renderProblemRows','registerPersonalLessons'}.issubset(set(library_port.split(',')))
assert 'if(id==="case")window.liLibraryShelf?.trackProblem("case",liCurrentCase().id);' in page_html
assert 'window.liLibraryShelf?.trackProblem("research",scenarios[qIndex]);' in page_html
subprocess.run(["node",str(site.parent/"tools"/"test_resume_problem_case.cjs")],check=True,cwd=site.parent)

# UX-IA-09: Dedicated Dấu trang page keeps two separate accessible tabs.
bookmarks=section("bookmarks")
resume=section("resume")
library=section("library")
assert 'role="tablist"' not in resume
assert bookmarks.count('role="tablist"')==1
assert bookmarks.count('role="tabpanel"')==2
assert bookmarks.count('data-bookmark-tab="lesson"')==1
assert bookmarks.count('data-bookmark-tab="question"')==1
assert bookmarks.count('id="li-saved-lessons"')==1
assert bookmarks.count('id="li-saved-questions"')==1
assert bookmarks.count('id="li-bookmarks-empty-lessons"')==1
assert bookmarks.count('id="li-bookmarks-empty-questions"')==1
assert 'id="li-saved-lessons"' not in library and 'id="li-saved-questions"' not in library
assert bookmarks.count('aria-selected="true"')>=1
assert 'id="li-bookmark-panel-questions"' in bookmarks and 'tabindex="-1" data-bookmark-tab="question"' in bookmarks
assert 'Bài học, case và câu hỏi đã lưu' not in bookmarks
hub=(site/"assets"/"library-hub.js").read_text(encoding="utf-8")
assert 'let bookmarkTab="lesson";' in hub
assert 'function selectBookmarkTab(type,focus=false)' in hub
assert 'renderSavedBookmarkEntries(lessonRoot,lessons' in hub
assert 'renderSavedBookmarkEntries(questionRoot,questions' in hub
assert 'const questions=ordered([' in hub and 'x.type==="case"' in hub
assert 'savedQuestions.map(x=>({kind:"question"' in hub
assert 'shelf.renderResume()' in (site.parent/"tools"/"test_library_hub_v2.cjs").read_text(encoding="utf-8")

# UX-ART-04: current geometric papercraft art, GitHub canonical source
# preserved as illustration, with original Bút Ký surface.
illustrated=site/"assets"/"laoly-mirror-suy-nghi.png"
assert illustrated.is_file() and illustrated.stat().st_size > 100000
raw_illustrated=illustrated.read_bytes()
assert raw_illustrated[:8] == bytes([137,80,78,71,13,10,26,10])
assert (int.from_bytes(raw_illustrated[16:20],"big"), int.from_bytes(raw_illustrated[20:24],"big")) == (1024,1024)
assert raw_illustrated == (site.parent/"design-assets"/"lao-ly"/"trong-guong"/"lao_ly_10_suy_nghi_mirror.png").read_bytes(), "Settings Lão Lý illustration must match canonical papercraft source"
assert (site/"assets"/"laoly-guide-rest.png").read_bytes() == (site.parent/"design-assets"/"lao-ly"/"trong-guong"/"lao_ly_04_buon_ngu_mirror.png").read_bytes(), "Guide Lão Lý illustration must match current papercraft source"
for deployed, source in [
 ("laoly-neutral.png", "lao_ly_mini_neutral_96.png"),
 ("laoly-mode-start.png", "lao_ly_mini_vao_nhip_96.png"),
 ("laoly-mode-focus.png", "lao_ly_mini_dao_sau_96.png"),
 ("laoly-mode-overload.png", "lao_ly_mini_qua_tai_96.png"),
 ("laoly-mode-recover.png", "lao_ly_mini_hoi_tri_96.png"),
]:
    assert (site/"assets"/deployed).read_bytes() == (site.parent/"design-assets"/"lao-ly"/"icon"/source).read_bytes(), "Lão Lý app icon must match current papercraft source: " + deployed
    raw_icon=(site/"assets"/deployed).read_bytes()
    assert raw_icon[:8] == bytes([137,80,78,71,13,10,26,10]), "Mini icon must be PNG: " + deployed
    assert (int.from_bytes(raw_icon[16:20],"big"), int.from_bytes(raw_icon[20:24],"big")) == (96,96), "Mini icon size must be 96px: " + deployed
    assert b"tRNS" in raw_icon, "Mini icons must have transparency: " + deployed
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
assert 'translation.textContent=(inEnglish?"Meaning: ":"Dịch nghĩa: ")+shown.translation;' in quote_js
assert 'gloss.textContent=(inEnglish?"Interpretation: ":"Diễn nghĩa: ")+shown.interpretation;' in quote_js
assert quote_js.count('"translation":')>=48 and quote_js.count('"interpretation":')>=48
assert 'note.textContent=shown.comment;' in quote_js and 'Lão Lý liên hệ: ' not in quote_js
assert 'const QUOTES_EN=' in quote_js and 'window.liLanguage?.get?.()==="en"' in quote_js
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
# The native fallback opens a lesson only when a published hook has a route.
# Preserve the safety guard; a missing lessonRoute must fall back to research.
assert 'action.dataset.page=isHook&&item.lessonRoute?item.lessonRoute:"research";' in page_html
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
assert 'Object.keys(LESSONS).forEach(mount)' in cross
assert 'import("./li-content-adapter.mjs")' in cross
assert 'api.getRelatedLessons(id)' in cross
assert 'x.reviewState==="verified"' in cross
assert 'li-related-source' in cross and 'noopener noreferrer' in cross
assert 'const RELATED=' not in cross
assert all(k in cross for k in ("L03-1-2", "L09-1-2", "L15-2-2"))
assert 'L03-2-' not in cross and 'L09-2-' not in cross and 'L15-3-' not in cross
assert 'list.replaceChildren()' in cross
assert 'window.navigate(lesson.route)' in cross
assert 'locale==="vi"?' in cross
assert 'li-related-lessons' in foundation

# UX-DS-11 · Review components are connected; app Guide chips use full pills.
assert 'ui-foundations.css?v=' in page_html
assert '#page-guide #method-filters .filter,' in foundation and 'border-radius:999px!important;' in foundation
# The public entry now routes to React Studio; old UX-DS-11 specimens are archived.
studio_entry=(site/"component-library-review.html").read_text(encoding="utf-8")
assert "design-system/" in studio_entry
assert (site/"design-system"/"index.html").is_file()
v3=(site/"component-library-archive.html").read_text(encoding="utf-8")
assert 'component-review-v3.css?v=20261118-ds20-coverage' in v3
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
assert 'component-review-v4.css?v=20261118-ds20-coverage' in v3
assert 'component-review-v2.css?v=20261119-ds24-no-stroke' in v3
assert 'component-review-v3.js?v=20261118-ds13-week-fix' in v3
assert '--porcelain: #FEFDFC;' in (site/"assets"/"design-tokens.css").read_text(encoding="utf-8")
assert all(x in foundation for x in ("/* UX-DS-12", ".page input[type=\"checkbox\"]", "background-color:var(--porcelain)!important"))
assert all(x in v3 for x in ("ds12-horizontal-stack","ds12-tag-row","ds11-month-today","ds11-week-today"))
assert all(x in ds12 for x in ("ds12-variant-secondary","ds12-variant-dark","ds12-horizontal-card","ds12-tag","data-today"))
assert all(x in v3js for x in ("function returnToday(){","new Date()","dataset.ds12CardMode"))

# UX-DS-13 · PO correction: gallery uses existing full Lão Lý mirror image;
# no week-range tile shadow; today dot is separate from selected stroke.
assert 'component-review-v4.css?v=20261118-ds20-coverage' in v3
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

# UX-DS-16: true image enlargement is illustration-specific, not an empty media-rail zoom.
assert 'ds12-horizontal-card ds12-horizontal-illustration' in v3
assert all('ds12-horizontal-card.ds12-horizontal-illustration{grid-template-columns:minmax(0,'+width+'px)' in ds12 for width in ('208','168','136'))
assert 'ds12-horizontal-illustration .ds12-horizontal-media.figure{padding:var(--li-space-0)}' in ds12
assert 'ds12-horizontal-illustration .ds12-horizontal-media.figure img{width:100%;height:auto;max-height:240px;object-fit:contain}' in ds12

# UX-DS-15: Top Navigation is a component gallery family, NOT a silent change
# to the approved live app Home shell or route history.
topnavcss=(site/"assets"/"component-review-v5.css").read_text(encoding="utf-8")
assert 'component-review-v5.css?v=20261119-ds21-olive-spec' in v3
assert all('data-ds15-topvariant="'+x+'"' in v3 for x in ("logo","back","overlay"))
assert v3.count('src="./assets/li-seal.svg?v=geometric-20261122"')>=2
assert 'data-ds15-back aria-label="Quay lại màn trước"' in v3
assert 'src="./assets/home-li-landscape-20261121.webp"' in v3
assert 'ds15-topnav-overlay' in topnavcss and 'background:var(--ds11-clear)!important' in topnavcss
assert 'border-bottom-width:var(--li-space-0)!important' in topnavcss
assert 'min-width:48px;min-height:48px' in topnavcss
assert 'document.querySelector("[data-ds15-back]")' in v3
assert 'Top Navigation transparent Home' not in page_html

# UX-DS-10: updated Safari CSS must defeat stale rectangular tap overlay without
# removing keyboard focus-visible affordance or changing approved Home CTA geometry.
assert 'li-layout.css?v=assets-20261121' in page_html
assert 'ui-foundations.css?v=' in page_html
assert '/* UX-DS-10 · iOS pressed feedback:' in foundation
assert '-webkit-tap-highlight-color: var(--li-uxds10-touch-clear) !important;' in foundation
assert ':focus:not(:focus-visible)' in foundation
review10=(site/"component-library-archive.html").read_text(encoding="utf-8")
assert 'ds-notebook' in review10 and 'ds-home-bubble green' in review10
assert all('src="./assets/'+p+'"' in review10 for p in
 ("home-li-landscape-20261121.webp","home-li-iphone-20261121.webp","laoly-mirror-suy-nghi.png"))
review10css=(site/"assets"/"component-review-v2.css").read_text(encoding="utf-8")
assert 'background-size:100% 16px,100% var(--li-review-notebook-line)!important;' in review10css
assert '.ds-home-bubble.green' in review10css and '.ds-image-split' in review10css
# UX-DS-24: forest bubble and tail zero-width stroke; light-paper border unchanged.
assert '.ds-home-bubble.green{\n  background:var(--li-review-home-forest-bubble);\n  border-width:var(--li-space-0);' in review10css
assert '.ds-home-bubble.green::before{\n  background:var(--li-color-home-dialogue-tail);\n  border-width:var(--li-space-0);' in review10css
assert '.ds-home-bubble{position:relative;' in review10css and 'border:1px solid var(--rule)' in review10css
assert '/* UX-DS-24: forest green bubble has zero-width stroke' in foundation
assert '#page-home .hero-dialogue-bubble { border-width:var(--li-space-0); padding:' in foundation
assert '#page-home .hero-dialogue-bubble::before { border-width:var(--li-space-0); }' in foundation
assert './assets/ui-foundations.css?v=' in page_html

# UX-DS-09: mobile Tủ Riêng uses the same Archive icon as Home, never Bookmark.
mobile_nav=page_html.split('<nav class="mobile-nav"',1)[1].split('</nav>',1)[0]
library_tab=re.search(r'<button[^>]+data-page="library"[^>]*>\s*<i data-lucide="([^"]+)"',mobile_nav)
assert library_tab and library_tab.group(1)=="archive", "Tủ Riêng nav icon must be archive (bookmark is Save)"
# UX-NAV-ICON-01: Thần Chú tab is a SINGLE four-point Lucide sparkle.
guide_tab=re.search(r'<button[^>]+data-page="guide"[^>]*>\s*<i data-lucide="([^"]+)"',mobile_nav)
assert guide_tab and guide_tab.group(1)=="sparkle", "Thần Chú mobile tab must use 4-point sparkle"
assert '<button class="nav-btn" data-page="guide" aria-label="Thần Chú — 13 phương pháp học"' in mobile_nav, "Keep meaningful guide tab label and route"
assert 'Sparkle:' in (site/"assets"/"lucide.min.js").read_text(encoding="utf-8"), "Bundled Lucide must support single sparkle icon"

review=(site/"component-library-archive.html").read_text(encoding="utf-8")
assert '<section id="icons"' in review and '<section id="inputs"' in review
assert '<script src="./assets/lucide.min.js"></script>' in review
assert '<div class="ds-icon-tile"><i data-lucide="sparkle" aria-hidden="true"></i>Thần Chú</div>' in review, "Component Library iconography matches spell tab"
assert '<span class="ds-tab-icon"><i data-lucide="sparkle" aria-hidden="true"></i></span>Thần Chú' in review, "Component Library bottom tabs match app"
assert '<button data-ds11-sidebar type="button"><i data-lucide="sparkle" aria-hidden="true"></i>Thần Chú</button>' in review, "Component Library sidebar navigation matches spell tab"
assert 'data-lucide="book-open" aria-hidden="true"></i> BÀI HỌC' in page_html, "Reading/lesson icons remain book-open"

assert 'ds-large light' in review and 'ds-large warm' in review
assert all(x in review for x in ('ds-textarea','ds-chip-result','ds-error','ds-disabled','ds-readonly'))
assert all(x in review for x in ('ds-home-bubble','ds-tabs','ds-utility','ds-back','ds-link'))

# UX-HOME-05: no JS rerender can resurrect the removed visible mirror title.
assert 'if(kind)kind.textContent="Gương Vạn Vấn";' not in page_html
assert 'querySelector("#page-home .mirror-message .mirror-label")' not in page_html
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

# UX-ART-06: two approved papercraft system-state scenes, actual live import flow and shared specimen.
art_manifest=json.loads((site.parent/"design-assets"/"lao-ly"/"manifest.json").read_text(encoding="utf-8"))
state_assets=art_manifest.get("state_assets",[])
assert [x.get("state") for x in state_assets]==["loading","error"], "Exactly two PO-approved state illustrations"
assert art_manifest.get("system_state_approval","").startswith("Human PO approved"), "System-state art approval must be explicit"
for asset in state_assets:
    source=(site.parent/"design-assets"/"lao-ly"/asset["path"]).read_bytes()
    live=(site.parent/asset["app_alias"]).read_bytes()
    assert source==live, "App system-state image differs from GitHub asset master: "+asset["state"]
    assert hashlib.sha256(source).hexdigest()==asset["sha256"], "State illustration source integrity mismatch"
    assert source[:8]==b"\x89PNG\r\n\x1a\n", "System-state master must be a PNG"
    assert (int.from_bytes(source[16:20],"big"),int.from_bytes(source[20:24],"big"))==(1024,1024), "State art size wrong"
    assert source[25]==6, "State art must use true-color RGBA alpha PNG"
assert '<link rel="stylesheet" href="./assets/li-state-scenes.css?v=20261119-art06">' in head
shared=(site/"assets"/"li-state-scenes.css").read_text(encoding="utf-8")
assert ".li-state-scene[hidden]" in shared and "prefers-reduced-motion:reduce" in shared
assert 'id="import-state-loading" role="status" aria-live="polite"' in page_html
assert 'id="import-state-error" role="alert"' in page_html
assert 'id="import-state-retry"' in page_html
assert 'importLoading.hidden=!liBackupImport.loading' in page_html and 'importError.hidden=!liBackupImport.error' in page_html
assert 'importTrigger.disabled=liBackupImport.loading' in page_html
assert 'importInput.value="";' in page_html, "Selecting same file must work on Retry"
assert 'document.getElementById("import-state-retry")?.addEventListener("click",()=>importInput?.click());' in page_html
assert 'const data=JSON.parse(await file.text());' in page_html, "Only real async file read may show Loading"
assert 'if(!window.confirm(existing' in page_html, "Import must still request explicit overwrite confirmation"
assert 'if(window.localStorage.getItem(LI_STORAGE_KEY)!==next' in page_html, "No success before localStorage readback"
review_status=(site/"component-library-archive.html").read_text(encoding="utf-8")
assert 'id="feedback"' in review_status and 'li-state-scene-showcase' in review_status
for name in ("laoly-state-loading.png","laoly-state-error.png"):
    assert name in page_html and name in review_status
assert "li-state-scenes.css?v=20261119-art06" in review_status
assert "UX-ART-06" in (site.parent/"design-system"/"components.md").read_text(encoding="utf-8")
