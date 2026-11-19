#!/usr/bin/env python3
"""UX-DS-35 Stage02: reference→semantic→component token aliases, no second value authority."""
import copy
import json
import re
from pathlib import Path
from generate_design_tokens import render

ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/"design-system/tokens.json").read_text(encoding="utf-8"))
generated=(ROOT/"site/assets/design-tokens.css").read_text(encoding="utf-8")
assert render(data)==generated, "CSS drift from single JSON source"
assert len(data["semanticRoles"])==15 and len(data["componentRoles"])==9
varmap=dict(re.findall(r"^\s*(--[a-z0-9-]+):\s*([^;]+);",generated,re.M))
def resolve(name,seen=()):
    assert name in varmap, f"unknown var {name}"
    assert name not in seen, f"cycle in token roles {name}"
    v=varmap[name].strip()
    if re.fullmatch(r"var\(--[a-z0-9-]+\)",v):
        return resolve(v[4:-1],seen+(name,))
    return v
assert resolve("--li-comp-button-min-hit-size")=="48px", "button target intent changed"
assert resolve("--li-comp-button-primary-background")==data["colors"]["moss"]
assert resolve("--li-comp-button-primary-color")==data["colors"]["cream"]
assert resolve("--li-comp-field-background")==data["colors"]["porcelain"]
assert resolve("--li-comp-app-nav-active-background")==data["semanticColors"]["nav-selected-fill"]
css=(ROOT/"site/assets/ui-foundations.css").read_text(encoding="utf-8")
assert "min-height: var(--li-comp-button-min-hit-size);" in css, "component token has no live CSS consumer"
def must_reject(mutator,name):
    bad=copy.deepcopy(data)
    mutator(bad)
    try:
        render(bad)
    except ValueError:
        return
    raise AssertionError("negative unexpectedly accepted: "+name)
must_reject(lambda d:d["semanticRoles"].update({"bad-role":"--missing-css-variable"}),"missing semantic ref")
must_reject(lambda d:d["componentRoles"].update({"bad-component":"--li-role-does-not-exist"}),"missing component ref")
must_reject(lambda d:d["semanticRoles"].update({"invalid Role":"--moss"}),"invalid role name")
must_reject(lambda d:d["semanticRoles"].update({"recursive":"--li-role-recursive"}),"recursive role rejected")
print("PASS UX-DS-35 Stage02: 15 semantic + 9 component aliases, generated CSS/TS dependency, live 48px consumer, 4 negative cases")
print("UNVERIFIED: real Safari/VoiceOver, all components, React pilot parity, Human G2")
