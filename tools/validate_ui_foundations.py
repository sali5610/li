#!/usr/bin/env python3
"""Check only the new canonical type/spacing layer, not legacy computed CSS.

The older inline stylesheet still contains off-grid local declarations.
This checker guards new work; it is not screenshot, runtime or accessibility QA.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKENS = ROOT / "design-system" / "tokens.json"
CSS_FILE = ROOT / "site" / "assets" / "ui-foundations.css"
HTML = ROOT / "site" / "index.html"
failed: list[str] = []
passed = 0


def check(test: bool, label: str) -> None:
    global passed
    if test:
        passed += 1
        print("PASS", label)
    else:
        failed.append(label)
        print("FAIL", label, file=sys.stderr)


def main() -> int:
    data = json.loads(TOKENS.read_text(encoding="utf-8"))
    css = CSS_FILE.read_text(encoding="utf-8")
    html = HTML.read_text(encoding="utf-8")
    spacing = data["spacing"]
    type_scale = data["typography"]["scale"]

    check(data["libraryVersion"] == "0.2.0", "v0.2 foundation version")
    check(spacing["baseUnitPx"] == 4, "4px base unit")
    check(all(n % 4 == 0 for n in spacing["valuesPx"]), "spacing scale obeys 4px")
    check(all(n % 4 == 0 for n in spacing["aliasesPx"].values()), "semantic spacing obeys 4px")
    check(all(x["lineHeightPx"] % 4 == 0 for x in type_scale.values()), "text leading obeys 4px")
    check(all(x["fontSizePx"] >= 12 for x in type_scale.values()), "no tiny UI type in scale")
    check(type_scale["body"]["fontSizePx"] == 16 and type_scale["body"]["lineHeightPx"] == 24, "readable 16/24 body")
    check(type_scale["support"]["fontSizePx"] == 14, "essential support at 14px")
    check(data["interaction"]["minimumIntendedTapTargetPx"] == 48, "48px new touch target")

    css_spacing = {
        k: int(v)
        for k, v in re.findall(r"(--li-space-\d+)\s*:\s*(\d+)px\s*;", css)
    }
    check(len(css_spacing) == len(spacing["valuesPx"]), "all scale entries defined in CSS")
    check(sorted(css_spacing.values()) == sorted(spacing["valuesPx"]), "CSS spacing scale matches JSON")
    check("var(--li-space-" in css, "UI spacing consumes tokens")
    # Literal paddings/margins/gaps introduced to the canonical file are not
    # allowed to drift off the 4px grid. Artwork coordinates aren't spacing.
    for match in re.finditer(r"(?<![-\w])(padding(?:-[\w-]+)?|margin(?:-[\w-]+)?|(?:row-|column-)?gap)\s*:\s*([^;{}]+);", css):
        prop, value = match.groups()
        for px in re.findall(r"(?<![\w.])(\d+(?:\.\d+)?)px", value):
            amount = float(px)
            check(amount % 4 == 0, f"on-grid {prop}={amount:g}px")
    check(not re.search(r"font-size:\s*(?:[0-9]|10|11)(?:\.\d+)?px", css), "canonical layer avoids 9–11px fonts")
    check(css.count("{") == css.count("}"), "balanced CSS braces")

    head = html.split("</head>", 1)[0]
    css_name = "./assets/ui-foundations.css"
    check(css_name in head, "foundation linked in HTML head")
    check(
        head.rfind(css_name) > head.rfind("</style>") and
        head.rfind(css_name) > head.rfind("./assets/lesson-l09-hifi.css"),
        "foundation loaded after inline and lesson CSS",
    )
    for selector in (
        "#page-guide #method-cards", "#page-settings", "#page-home .hero-actions",
        "#buddy-modal", ".mobile-nav .nav-btn", ".l09-stack",
    ):
        check(selector in css, f"canonical component coverage: {selector}")
    check(".purpose" in css and "-webkit-line-clamp: unset" in css, "Guide descriptions not force-clamped")

    print(f"\n{passed} checks passed; {len(failed)} failed.")
    if failed:
        print("This test guards NEW canonical CSS only; legacy style debt remains.", file=sys.stderr)
        return 1
    print("SOURCE-LEVEL ONLY; viewport, screenshot, iOS Safari, VoiceOver and G2 acceptance remain unverified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
