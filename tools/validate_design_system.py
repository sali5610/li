#!/usr/bin/env python3
"""Low-cost, source-level contract checks for li. high-fi.

This is a smoke test, NOT computed-style, screenshot, device, a11y or G2 acceptance.
The large legacy site/index.html has overlapping CSS; this checker only guards
selected baseline tokens, semantic state hooks and public design-system documents.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_FILE = ROOT / "site" / "index.html"
TOKEN_FILE = ROOT / "design-system" / "tokens.json"
errors: list[str] = []
passed = 0


def check(condition: bool, description: str) -> None:
    global passed
    if condition:
        passed += 1
        print(f"PASS {description}")
    else:
        errors.append(description)
        print(f"FAIL {description}", file=sys.stderr)


def main() -> int:
    for relative in [
        "site/assets/design-tokens.css",
        "site/assets/li-layout.css",
        "tools/generate_design_tokens.py",
        "AGENTS.md",
        "design-system/README.md",
        "design-system/components.md",
        "design-system/qa-checklist.md",
        "design-system/tokens.json",
        "site/index.html",
        "site/assets/li-seal.svg",
        "site/assets/li-favicon.svg",
        "site/assets/apple-touch-icon.png",
    ]:
        check((ROOT / relative).is_file(), f"file exists: {relative}")
    if not HTML_FILE.is_file() or not TOKEN_FILE.is_file():
        return 1

    # UX-ART-04: Human PO supersedes UX-ART-03. Active papercraft assets = 10 mirror expressions + 5 icons; no Outside.
    art_manifest = ROOT / "design-assets" / "lao-ly" / "manifest.json"
    art_contract = ROOT / "design-assets" / "lao-ly" / "README.md"
    check(art_manifest.is_file(), "Lão Lý current papercraft manifest exists")
    check(art_contract.is_file(), "Lão Lý current papercraft contract exists")
    if art_manifest.is_file() and art_contract.is_file():
        artwork = json.loads(art_manifest.read_text(encoding="utf-8"))
        assets = artwork.get("assets", [])
        counts = artwork.get("active_counts", {})
        check(artwork.get("schema") == "li-laoly-current-v3", "papercraft source-of-truth schema v3 — approved head-only mini icons")
        check(counts == {"illustrations_mirror": 10, "icons": 5, "illustrations_outside": 0},
              "one canonical mirror-only illustration family plus functional icons")
        check(len(assets) == 15, "all 15 current Lão Lý papercraft assets registered")
        state_assets = artwork.get("state_assets", [])
        check(len(state_assets) == 2 and [a.get("state") for a in state_assets] == ["loading","error"],
              "two approved Lão Lý contextual system-state illustrations")
        for state_asset in state_assets:
            src = ROOT / "design-assets" / "lao-ly" / state_asset.get("path", "")
            deployed = ROOT / state_asset.get("app_alias", "")
            check(src.is_file() and deployed.is_file(),
                  "system-state source and deployed PNG exist: " + state_asset.get("state","unknown"))
        check(artwork.get("system_state_approval","").startswith("Human PO approved"),
              "system-state art approval recorded without closing G2")
        check(len([a for a in assets if a.get("variant") == "Trong gương"]) == 10,
              "10 active Lão Lý expressions are Trong gương")
        check(len([a for a in assets if a.get("type") == "icon"]) == 5, "five distinct new papercraft micro icons")
        check(len([a for a in assets if a.get("variant") == "Ngoài gương"]) == 0,
              "no active standalone / Ngoài gương illustration")
        check(not (ROOT / "design-assets" / "lao-ly" / "ngoai-guong").exists(),
              "no obsolete Ngoài gương binary in working asset tree")
        for art in assets:
            asset_path = ROOT / "design-assets" / "lao-ly" / art.get("path", "")
            check(asset_path.is_file(), "asset exists: " + art.get("path", "missing"))
        check("papercraft" in art_contract.read_text(encoding="utf-8").lower(),
              "current character art policy documented")
        check(artwork.get("icon_revision") == "UX-ART-07-final-clean-edges-20261119", "final PO-approved five clean-outline mini icons are current")
        check(all(a.get("expression") and a.get("bytes") > 1000 and len(a.get("sha256", "")) == 64 for a in assets if a.get("type") == "icon"), "final five mini icon records have provenance and SHA256")
        check(artwork.get("full_G2_approval") == "PENDING",
              "replacing requested art does not silently close G2")

    # UX-ASSET-01: all separate image files shipped in site/assets have canonical custody.
    visual_registry = ROOT / "design-assets" / "manifest.json"
    check(visual_registry.is_file(), "visual asset custody manifest exists")
    if visual_registry.is_file():
        registry = json.loads(visual_registry.read_text(encoding="utf-8"))
        entries = registry.get("file_based_runtime_snapshot", {}).get("records", [])
        check(registry.get("schema") == "li-visual-assets-index-v1", "visual asset registry schema current")
        check(len(entries) == 6, "Home and brand images inventoried")
        for entry in entries:
            canonical = ROOT / entry.get("canonical", "")
            runtime = ROOT / entry.get("app", "")
            check(canonical.is_file() and runtime.is_file(), "canonical/runtime graphics exist: " + entry.get("name", "?"))
            if canonical.is_file() and runtime.is_file():
                check(canonical.read_bytes() == runtime.read_bytes(), "canonical/runtime graphics byte parity: " + entry.get("name", "?"))
        check((ROOT / "design-assets" / "README.md").is_file(), "visual asset registry README exists")
        css = (ROOT / "site" / "assets" / "li-layout.css").read_text(encoding="utf-8")
        inline = registry.get("embedded_css_images", {}).get("variables", [])
        check(len(inline) == 4 and all(re.search(re.escape(var) + r"\s*:\s*url\(['\"]data:image/", css) for var in inline),
              "four remaining non-Home embedded CSS illustrations inventoried")

    # UX-DS-23: contract navigation is a CI-guarded invariant, not a wiki convention.
    library_entrypoint = ROOT / "design-system" / "README.md"
    agent_entrypoint = ROOT / "AGENTS.md"
    contract_paths = [
        "design-system/tokens.json",
        "design-system/typography-spacing.md",
        "design-system/components.md",
        "design-system/ux-patterns-and-behavior.md",
        "design-system/qa-checklist.md",
    ]
    for path in contract_paths:
        check((ROOT / path).is_file(), f"design library linked contract exists: {path}")
    if library_entrypoint.is_file() and agent_entrypoint.is_file():
        entry = library_entrypoint.read_text(encoding="utf-8")
        agent_rules = agent_entrypoint.read_text(encoding="utf-8")
        check(
            "## Start here — mandatory UI/UX work protocol (UX-DS-23)" in entry,
            "canonical Design Library README contains mandatory UI/UX workflow",
        )
        check(
            "design-system/README.md" in agent_rules
            and ("MUST first open" in agent_rules or "start with [design-system/README.md]" in agent_rules),
            "AGENTS.md instructs all UI/UX agents to open the canonical entrypoint",
        )
        for path in contract_paths:
            contract_label = path.removeprefix("design-system/")
            check(
                f"]({contract_label})" in entry,
                f"Design Library entrypoint links contract: {contract_label}",
            )
        check(
            "ux-patterns-and-behavior.md" in agent_rules
            and "qa-checklist.md" in entry,
            "agent instruction and library QA/behavior links remain discoverable",
        )
    else:
        check(False, "Design Library README and AGENTS.md must exist")

    html = HTML_FILE.read_text(encoding="utf-8")
    layout_css = (ROOT / "site" / "assets" / "li-layout.css").read_text(encoding="utf-8")
    source = html + "\n" + layout_css
    tokens = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
    generated_css = (ROOT / "site" / "assets" / "design-tokens.css").read_text(encoding="utf-8")
    colors = tokens["colors"]
    # Core color tokens exist ONCE in generated runtime CSS, not inline HTML.
    for name, value in colors.items():
        valid_hex = bool(re.fullmatch(r"#[0-9a-fA-F]{6}", value))
        check(valid_hex, f"token format {name}")
        check(
            bool(re.search(
                r"--" + re.escape(name) + r"\s*:\s*" + re.escape(value) + r"\b",
                generated_css,
                flags=re.IGNORECASE,
            )),
            f"site has CSS token --{name}={value}",
        )

    semantic = tokens["semantic"]
    check(
        semantic["activeNavigationPillFill"].lower() in generated_css.lower(),
        "selected sand pill color remains represented in site CSS",
    )
    check(
        semantic["activeNavigationInk"].lower() in generated_css.lower(),
        "selected navigation moss ink remains represented",
    )
    check(
        bool(re.search(r"\.header\s+\.tool-button\[aria-current", source)),
        "header utility has route-selected state selector",
    )
    check(
        bool(re.search(r"\.mobile-nav\s+\.nav-btn\[aria-current", source)),
        "bottom nav has route-selected state selector",
    )
    check("aria-current" in source, "route selection updates aria-current")
    check("<style>" not in html and "</style>" not in html, "HTML has no inline style blocks")
    check("./assets/li-layout.css" in html.split("</head>",1)[0], "consolidated layout CSS linked")
    check('./assets/design-tokens.css' in html.split("</head>",1)[0], "generated token file loaded")
    check('--paper:' not in html.split("</head>",1)[0], "root palette is no longer duplicated in index")
    check(
        "-webkit-tap-highlight-color:transparent" in source.replace(" ", ""),
        "iOS tap-highlight suppression is present",
    )
    check(":focus-visible" in source, "keyboard focus-visible styles remain")
    check(
        "prefers-reduced-motion:reduce" in source,
        "reduced-motion styles remain",
    )
    check(
        "min-height:44px" in source,
        "at least one shared 44px touch target baseline remains",
    )
    check(
        "#page-home .hero" in source,
        "Home full-bleed hero override remains represented",
    )
    check("./assets/apple-touch-icon.png" in html, "iOS Home Screen icon linked")
    # S146 latest logo/fav-icon reference vs S142 older dedicated favicon.
    # Keep brand behavior as currently chosen; typography does not change icons.
    check(
        any('href="./assets/' + filename in html for filename in ("li-seal.svg", "li-favicon.svg")),
        "current approved SVG favicon variant linked",
    )

    # UX-DS-25: scale comes from tokens.json and is applied to live runtime.
    scales = json.loads(TOKEN_FILE.read_text(encoding="utf-8")).get("deviceScales", {})
    check(set(scales) == {"ipad-portrait", "ipad-landscape"}, "distinct iPad portrait / landscape token families")
    for mode in ("ipad-portrait", "ipad-landscape"):
        check(scales.get(mode, {}).get("layout", {}).get("control-min", 0) >= 56,
              f"{mode} control minimum is at least 56px")
    foundations = (ROOT / "site/assets/ui-foundations.css").read_text(encoding="utf-8")
    home_layout = (ROOT / "site/assets/library-hub.css").read_text(encoding="utf-8")
    showcase = (ROOT / "site/design-system/index.html").read_text(encoding="utf-8")
    generated = (ROOT / "site/assets/design-tokens.css").read_text(encoding="utf-8")
    check("--li-device-ipad-portrait-type-body" in generated and
          "--li-device-ipad-landscape-type-body" in generated, "device scale generated CSS exists")
    check("(orientation: landscape)" in foundations and "(orientation: landscape)" in home_layout,
          "iPad landscape uses its own component and Home layout")
    check("(max-width: 1420px) and (orientation: landscape)" in foundations and
          "(max-width: 1420px) and (orientation: landscape)" in home_layout and
          "(max-width:1420px) and (orientation:landscape)" in home_layout and
          "and (any-pointer: coarse)" not in foundations[foundations.index("/* UX-DS-25"):],
          "iPad 1408px landscape uses viewport ratio, not pointer hardware")
    check("ds33-physical-shell" in html, "new Safari rotation response and CSS are cache-versioned")
    check("ipad-safari-rotation.js?v=20261119-ds33" in html, "iPad-only runtime orientation reconciliation installed")
    check("pinch-zoom" in (ROOT / "site/assets/ui-foundations.css").read_text(encoding="utf-8"), "iPad Safari touch-action allows pinch zoom")
    check("ds33-physical-shell" in html,
          "iPad runtime styles use fresh CSS cache versions")
    ipad_canvas = (ROOT / "site/assets/ipad-home-canvas.css").read_text(encoding="utf-8")
    check("ipad-home-canvas.css?v=assets-20261121" in html and
          "html.li-ipad-home-canvas .app.home-focus" in ipad_canvas and
          "position:fixed!important;" in ipad_canvas and
          "home-li-landscape-20261121.webp" in ipad_canvas,
          "one physical iPad Home shell reuses approved artwork")
    check("--li-ipad-active-mode: landscape" in ipad_canvas and
          "--li-ipad-active-mode: portrait" in ipad_canvas and
          "--li-ipad-shell-width" in ipad_canvas and
          "--li-ipad-shell-height" in ipad_canvas,
          "physical iPad shell uses canonical portrait/landscape aliases")
    check("html.li-safari-landscape-recovery" not in foundations and
          "html.li-safari-landscape-recovery" not in home_layout,
          "obsolete conflicting Safari recovery overrides removed")
    check('data-width="1408" data-height="832"' in showcase and
          'data-width="970" data-height="1408"' in showcase,
          "PO screenshot 1408×832 landscape and 970×1408 portrait review presets")
    check('data-width="1133" data-height="744"' in showcase and
          'data-width="820" data-height="1180"' in showcase, "review has iPad portrait and landscape presets")

    print(f"\n{passed} checks passed; {len(errors)} failed.")
    if errors:
        print(
            "Review the source-of-truth decision before changing baseline rules. "
            "This static test does not replace visual/device QA.",
            file=sys.stderr,
        )
        return 1
    print(
        "SOURCE-LEVEL ONLY: not a visual snapshot test, Safari test, "
        "accessibility certification or Human PO G2 approval."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
