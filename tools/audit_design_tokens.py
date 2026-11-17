#!/usr/bin/env python3
"""Static inventory of li. color/type/spacing token coverage.

Purpose: expose unmapped legacy declarations without asserting that they win the
CSS cascade or are defects. No third-party dependencies and no paid services.
Excludes downloaded icon-vendor code, illustration binaries and SVG artwork.
"""
from __future__ import annotations
import argparse
import collections
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = [
    "site/index.html",
    "site/assets/lesson-l09-hifi.css",
    "site/assets/ui-foundations.css",
]
SECONDARY = ["site/design-system-preview.html", "site/lesson-source-lab.html"]
TEMPLATES = [
    "site/assets/lesson-l03-hifi-markup.js",
    "site/assets/lesson-l09-hifi-markup.js",
    "site/assets/lesson-l15-hifi-markup.js",
]
BASELINE = ROOT / "design-system" / "audits" / "token-coverage-baseline.json"
PROP_PATTERN = re.compile(r"^([-\\w]+)\\s*:\\s*([\\s\\S]+)$")
SPACE_PROP = re.compile(r"^(?:padding|margin)(?:-(?:top|bottom|left|right|inline|block|inline-start|inline-end|block-start|block-end))?$|^(?:gap|row-gap|column-gap)$")
CSS_PX = re.compile(r"(-?\\d+(?:\\.\\d+)?)px\\b")
CSS_HEX = re.compile(r"#[0-9a-fA-F]{3,8}\\b")
INLINE_STYLE = re.compile(r"""\\bstyle\\s*=\\s*(["'])([\\s\\S]*?)\\1""")
TYPE_PROPS = {"font-size", "font", "font-family", "line-height"}
LITERAL_COLOR = re.compile(r"#[0-9a-fA-F]{3,8}\\b|(?:rgba?|hsla?)\\(|\\b(?:transparent|currentColor|white|black|red|blue|green|grey|gray)\\b", re.I)
SMALL_FONT = re.compile(r"(?<![\\d.])(?:[6-9]|10|11)(?:\\.\\d+)?px\\b")
VAR = re.compile(r"var\\(\\s*--")

def color_prop(p: str) -> bool:
    if p in ("color", "background", "background-color", "fill", "stroke", "box-shadow", "text-shadow"):
        return True
    if p.startswith("border") and not any(x in p for x in ("radius", "width", "style", "spacing")):
        return True
    return p.startswith("outline") and not any(x in p for x in ("offset", "width", "style"))

def scrub(css: str) -> str:
    # Preserve newlines/line numbers when omitting comments and huge data URLs.
    css = re.sub(r"/\\*[\\s\\S]*?\\*/", lambda m: re.sub(r"[^\\n]", " ", m.group()), css)
    css = re.sub(r"url\\(\\s*(['\\\"]?)data:[\\s\\S]*?\\1\\s*\\)", "url(data-skipped)", css, flags=re.I)
    return css

def parse(css: str, line_offset: int = 0) -> list[dict]:
    css = scrub(css)
    declarations: list[dict] = []
    stack: list[str] = []
    buffer: list[str] = []
    quote = ""
    escaped = False
    depth = 0
    line = 1 + line_offset
    for ch in css:
        if ch == "\\n":
            line += 1
        if quote:
            buffer.append(ch)
            if escaped:
                escaped = False
            elif ch == "\\\\":
                escaped = True
            elif ch == quote:
                quote = ""
            continue
        if ch in ("'", '"'):
            quote = ch
            buffer.append(ch)
            continue
        if ch in "([":
            depth += 1
            buffer.append(ch)
            continue
        if ch in ")]":
            depth = max(0, depth - 1)
            buffer.append(ch)
            continue
        if depth == 0 and ch == "{":
            stack.append("".join(buffer).strip()[-300:])
            buffer.clear()
            continue
        if depth == 0 and ch in ";}":
            value = "".join(buffer).strip()
            match = PROP_PATTERN.match(value)
            if match:
                declarations.append({
                    "property": match.group(1).lower(),
                    "value": match.group(2).strip(),
                    "selector": stack[-1] if stack else "INLINE",
                    "line": line - value.count("\\n"),
                })
            buffer.clear()
            if ch == "}" and stack:
                stack.pop()
            continue
        buffer.append(ch)
    return declarations

def stats(declarations: list[dict]) -> dict:
    out: dict = {"declarations": len(declarations)}
    for group, pred in (
        ("color", lambda p: color_prop(p)),
        ("typography", lambda p: p in TYPE_PROPS),
        ("spacing", lambda p: bool(SPACE_PROP.fullmatch(p))),
    ):
        rows = [d for d in declarations if pred(d["property"])]
        mapped = [d for d in rows if VAR.search(d["value"])]
        raw = [d for d in rows if not VAR.search(d["value"])]
        o = {"total": len(rows), "with_var": len(mapped), "without_var": len(raw)}
        if group == "color":
            hexes = [h.upper() for d in rows if not d["property"].startswith("--") for h in CSS_HEX.findall(d["value"])]
            o["raw_literal_color_declarations"] = sum(bool(LITERAL_COLOR.search(d["value"])) for d in raw)
            o["hex_occurrences"] = len(hexes)
            o["unique_hex"] = len(set(hexes))
            o["top_hex"] = collections.Counter(hexes).most_common(12)
        if group == "typography":
            size = [d for d in rows if d["property"] == "font-size"]
            o["font_size_declarations"] = len(size)
            o["font_size_with_var"] = sum(bool(VAR.search(d["value"])) for d in size)
            o["sub_12px_size_declarations"] = sum(bool(SMALL_FONT.search(d["value"])) for d in size)
        if group == "spacing":
            offgrid = [
                (d["line"], d["property"], px.group(0), d["selector"][:100])
                for d in rows for px in CSS_PX.finditer(d["value"])
                if float(px.group(1)) % 4 != 0
            ]
            o["offgrid_px_occurrences"] = len(offgrid)
            o["offgrid_declarations"] = len({
                (d["line"], d["property"], d["value"])
                for d in rows if any(float(px.group(1)) % 4 != 0 for px in CSS_PX.finditer(d["value"]))
            })
            o["offgrid_examples"] = offgrid[:8]
        out[group] = o
    return out

def collect(path: str) -> dict:
    raw = (ROOT / path).read_text(encoding="utf-8")
    if path.endswith(".css"):
        css = [(raw, 0)]
    else:
        css = [
            (m.group(1), raw[:m.start()].count("\\n"))
            for m in re.finditer(r"<style\\b[^>]*>([\\s\\S]*?)</style>", raw, flags=re.I)
        ]
    declarations = [d for section, line in css for d in parse(section, line)]
    inline_attrs = [
        (raw[:m.start()].count("\\n") + 1, m.group(2))
        for m in INLINE_STYLE.finditer(raw)
    ]
    inline_rows = []
    for line, content in inline_attrs:
        inline_rows.extend(parse(content + ";", line - 1))
    inline_spacing = [
        d for d in inline_rows if SPACE_PROP.fullmatch(d["property"]) and
        any(float(px.group(1)) % 4 != 0 for px in CSS_PX.finditer(d["value"]))
    ]
    return {
        "stylesheets": len(css),
        **stats(declarations),
        "inline_style_attributes": len(inline_attrs),
        "offgrid_inline_spacing_declarations": len(inline_spacing),
        "inline_offgrid_examples": [
            [d["line"], d["property"], d["value"]] for d in inline_spacing[:10]
        ],
    }

def main() -> int:
    args = argparse.ArgumentParser()
    args.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args.add_argument("--check-baseline", action="store_true", help="fail if core raw-token debt increases above baseline")
    options = args.parse_args()
    report = {
        "audit_kind": "static CSS declarations, not computed styles / visual accessibility",
        "core": {path: collect(path) for path in CORE},
        "secondary_tools": {path: collect(path) for path in SECONDARY},
        "lesson_templates": {path: collect(path) for path in TEMPLATES},
        "limitations": [
            "not browser cascade, mobile screenshots or human G2 approval",
            "declarations with transparent/currentColor are counted as without-var even if intentional",
            "inline dynamic element.style assignment is inventoried separately in audit prose",
            "SVG artwork/binary assets and third-party lucide.min.js excluded",
            "CSS values may remain in historical overridden rules",
        ],
    }
    if options.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        for section in ("core", "secondary_tools", "lesson_templates"):
            print(f"\\n[{section}]")
            for path, item in report[section].items():
                a = item["color"]; b = item["typography"]; c = item["spacing"]
                print(f"{path}: color={a['without_var']}/{a['total']} raw; "
                      f"type={b['without_var']}/{b['total']} raw; "
                      f"spacing={c['without_var']}/{c['total']} raw; "
                      f"offgrid_px={c['offgrid_px_occurrences']}; "
                      f"offgrid_inline={item['offgrid_inline_spacing_declarations']}")
        print("Source-only inventory; CI success is not complete design-token compliance.")
    if options.check_baseline:
        if not BASELINE.is_file():
            print("No baseline file found; cannot enforce ratchet.")
            return 2
        baseline = json.loads(BASELINE.read_text(encoding="utf-8"))
        errors = []
        for path, item in report["core"].items():
            old = baseline["core"][path]
            for metric in ("color", "typography", "spacing"):
                if item[metric]["without_var"] > old[metric]["without_var"]:
                    errors.append(f"{path}: {metric} unmapped declarations grew")
            if item["spacing"]["offgrid_px_occurrences"] > old["spacing"]["offgrid_px_occurrences"]:
                errors.append(f"{path}: off-grid spacing literals grew")
        for error in errors:
            print("REGRESSION:", error)
        return 1 if errors else 0
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
