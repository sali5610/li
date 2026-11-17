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
    tokens = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
    colors = tokens["colors"]
    # Each core token must remain represented in the currently deployed CSS.
    # Checks anywhere in the inline stylesheet; not proof of computed precedence.
    for name, value in colors.items():
        valid_hex = bool(re.fullmatch(r"#[0-9a-fA-F]{6}", value))
        check(valid_hex, f"token format {name}")
        check(
            bool(re.search(
                r"--" + re.escape(name) + r"\s*:\s*" + re.escape(value) + r"\b",
                html,
                flags=re.IGNORECASE,
            )),
            f"site has CSS token --{name}={value}",
        )

    semantic = tokens["semantic"]
    check(
        semantic["activeNavigationPillFill"].lower() in html.lower(),
        "selected sand pill color remains represented in site CSS",
    )
    check(
        semantic["activeNavigationInk"].lower() in html.lower(),
        "selected navigation moss ink remains represented",
    )
    check(
        bool(re.search(r"\.header\s+\.tool-button\[aria-current", html)),
        "header utility has route-selected state selector",
    )
    check(
        bool(re.search(r"\.mobile-nav\s+\.nav-btn\[aria-current", html)),
        "bottom nav has route-selected state selector",
    )
    check("aria-current" in html, "route selection updates aria-current")
    check(
        "-webkit-tap-highlight-color:transparent" in html.replace(" ", ""),
        "iOS tap-highlight suppression is present",
    )
    check(":focus-visible" in html, "keyboard focus-visible styles remain")
    check(
        "prefers-reduced-motion:reduce" in html,
        "reduced-motion styles remain",
    )
    check(
        "min-height:44px" in html,
        "at least one shared 44px touch target baseline remains",
    )
    check(
        "#page-home .hero" in html,
        "Home full-bleed hero override remains represented",
    )
    check("./assets/apple-touch-icon.png" in html, "iOS Home Screen icon linked")
    check("./assets/li-favicon.svg" in html, "SVG favicon linked")

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
