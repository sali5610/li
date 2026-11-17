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
