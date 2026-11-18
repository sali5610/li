#!/usr/bin/env python3
"""Generate canonical runtime CSS tokens from design-system/tokens.json.

Use --check in CI to reject edits to generated CSS or design token drift.
Only the JSON is authored. No third-party dependencies.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "design-system" / "tokens.json"
TARGET = ROOT / "site" / "assets" / "design-tokens.css"
TYPE_NAMES = {
    "display": "display",
    "headline": "headline",
    "titleLarge": "title-lg",
    "titleMedium": "title-md",
    "titleSmall": "title-sm",
    "bodyLarge": "body-lg",
    "body": "body",
    "support": "support",
    "caption": "caption",
}

def render(data: dict) -> str:
    lines = [
        "/* GENERATED from design-system/tokens.json by tools/generate_design_tokens.py.",
        "   Do not edit this CSS manually; change the JSON then regenerate.",
        "   G2 global visual identity remains pending PO approval. */",
        ":root {",
    ]
    for key, value in data["colors"].items():
        lines.append(f"  --{key}: {value};")
    lines.append("  /* Semantic colors retain the currently accepted visual values. */")
    for key, value in data["semanticColors"].items():
        lines.append(f"  --li-color-{key}: {value};")
    lines.append("  /* PO-preserved illustrated Lão Lý paint details. */")
    for key, value in data.get("sceneColors", {}).items():
        lines.append(f"  --li-scene-{key}: {value};")
    lines.append("  /* Material-inspired readable typography roles. */")
    for key, name in TYPE_NAMES.items():
        spec = data["typography"]["scale"][key]
        lines.append(f"  --li-type-{name}: {spec['fontSizePx']}px;")
        lines.append(f"  --li-leading-{name}: {spec['lineHeightPx']}px;")
    lines.append('  --li-font-editorial: "Crimson Text", Georgia, "Times New Roman", serif;')
    lines.append('  --li-font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;')
    lines.append(f"  --li-leading-notebook: {data['typography']['notebookLineHeightPx']}px;")
    # UX-DS-20: exact legacy source values preserved as named tokens, so a
    # future scale consolidation can be visual-reviewed without losing current UI.
    for family, entries in data.get("legacyTypographyTokens", {}).items():
        prefix = {"fluid": "li-type-fluid", "leading": "li-leading-legacy",
                  "tracking": "li-tracking-legacy", "font": "li-font-legacy",
                  "family": "li-family-legacy", "weight": "li-weight"}[family]
        for key, value in entries.items():
            lines.append(f"  --{prefix}-{key}: {value};")
    # Alpha scene/overlay paints and review-only chart/status colors are authored
    # once; converting their call sites to var() does not recolor the illustrations.
    for key, value in data.get("alphaColors", {}).items():
        lines.append(f"  --li-effect-{key}: {value};")
    for key, value in data.get("reviewColors", {}).items():
        lines.append(f"  --li-review-color-{key}: {value};")
    # Preview-only transparent shadows are tokens, not raw component hex literals.
    for key, value in data.get("previewEffects", {}).items():
        lines.append(f"  --li-preview-effect-{key}: {value};")
    # PO-accepted S118 compact two-up micro-geometry; not general grid tokens.
    for key, value in data.get("approvedMicroSpacing", {}).items():
        lines.append(f"  --li-micro-{key}: {value};")
    lines.append("  /* 4px spacing grid; suffix equals grid index, not literal pixels. */")
    for value in data["spacing"]["valuesPx"]:
        if value % 4:
            raise ValueError(f"Off-grid spacing token: {value}px")
        lines.append(f"  --li-space-{value // 4}: {value}px;")
    lines.append("}")
    return "\n".join(lines) + "\n"

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if generated CSS differs")
    args = parser.parse_args()
    tokens = json.loads(DATA.read_text(encoding="utf-8"))
    for key, value in {**tokens["colors"], **tokens["semanticColors"], **tokens.get("sceneColors", {})}.items():
        if not re.fullmatch(r"#[a-fA-F0-9]{6}", value):
            raise ValueError(f"Invalid {key}: {value}")
    css = render(tokens)
    if args.check:
        if not TARGET.exists() or TARGET.read_text(encoding="utf-8") != css:
            print("FAIL: runtime design-tokens.css is stale; regenerate from JSON", file=sys.stderr)
            return 1
        print("PASS: runtime color/type/spacing tokens exactly match design-system/tokens.json")
        return 0
    TARGET.write_text(css, encoding="utf-8")
    print(f"Wrote {TARGET.relative_to(ROOT)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
