#!/usr/bin/env python3
"""UX-DS-35 Stage02: role chain, value parity, native family consumers, and negative cases."""
import copy
import json
import re
from pathlib import Path
from generate_design_tokens import render

ROOT=Path(__file__).resolve().parents[1]
values=json.loads((ROOT/"design-system/tokens.json").read_text(encoding="utf-8"))
generated=(ROOT/"site/assets/design-tokens.css").read_text(encoding="utf-8")
assert render(values)==generated, "CSS generated value drift"
assert len(values["semanticRoles"])==27 and len(values["componentRoles"])==21
cssVars=dict(re.findall(r"^\s*(--[a-z0-9-]+):\s*([^;]+);",generated,re.M))
assert len(cssVars)==358
def resolve(k,seen=()):
    assert k in cssVars, "missing token "+k
    assert k not in seen, "token alias cycle "+k
    value=cssVars[k].strip()
    return resolve(value[4:-1],seen+(k,)) if re.fullmatch(r"var\(--[a-z0-9-]+\)",value) else value
expected={
 "--li-comp-button-primary-background":values["colors"]["moss"],
 "--li-comp-button-primary-color":values["colors"]["cream"],
 "--li-comp-button-secondary-background":values["colors"]["paper"],
 "--li-comp-button-secondary-color":values["colors"]["moss"],
 "--li-comp-button-min-hit-size":"48px",
 "--li-comp-surface-background":values["colors"]["cream"],
 "--li-comp-surface-tinted-background":values["colors"]["paper-2"],
 "--li-comp-surface-inverse-background":values["colors"]["moss"],
 "--li-comp-surface-inverse-color":values["colors"]["cream"],
 "--li-comp-filter-chip-background":values["colors"]["paper"],
 "--li-comp-filter-chip-color":values["colors"]["moss"],
 "--li-comp-filter-chip-selected-background":values["colors"]["moss"],
 "--li-comp-filter-chip-selected-color":values["colors"]["cream"],
 "--li-comp-field-background":values["colors"]["porcelain"],
 "--li-comp-field-focus-border":values["semanticColors"]["input-focus-ring"],
 "--li-comp-field-error-border":values["semanticColors"]["danger-fill"],
 "--li-comp-status-banner-background":values["semanticColors"]["status-banner-fill"],
 "--li-comp-status-banner-color":values["colors"]["ink"],
 "--li-comp-app-nav-active-background":values["semanticColors"]["nav-selected-fill"]
}
for name,baseline in expected.items():
    assert resolve(name)==baseline, name+": value mismatch"
native=(ROOT/"site/assets/li-layout.css").read_text(encoding="utf-8")
foundation=(ROOT/"site/assets/ui-foundations.css").read_text(encoding="utf-8")
for name in expected:
    if name.startswith("--li-comp-app-nav"): continue # reserve for later nav mapping
    assert "var("+name+")" in native+foundation, "no native alias consumer "+name
assert ".surface{background:var(--li-comp-surface-background)" in native
assert ".action.alt{background:var(--li-comp-button-secondary-background)" in native
assert ".filter[aria-pressed=true]{background:var(--li-comp-filter-chip-selected-background)" in native
assert "min-height: var(--li-comp-button-min-hit-size);" in foundation
assert "border:3px solid var(--li-comp-field-focus-border)!important;" in foundation
def reject(name,update):
    sample=copy.deepcopy(values)
    update(sample)
    try:render(sample)
    except ValueError:return
    raise AssertionError("negative unexpectedly accepted: "+name)
reject("unknown semantic",lambda t:t["semanticRoles"].update({"broken":"--unknown-css"}))
reject("unknown component",lambda t:t["componentRoles"].update({"broken":"--li-role-unknown"}))
reject("invalid role ID",lambda t:t["semanticRoles"].update({"invalid Role":"--moss"}))
reject("self-cycle semantic",lambda t:t["semanticRoles"].update({"recursive":"--li-role-recursive"}))
reject("self-cycle component",lambda t:t["componentRoles"].update({"recursive":"--li-comp-recursive"}))
print("PASS UX-DS-35 Stage02: 27 semantic, 21 component, 358 generated CSS vars, five native families, 19 value invariants, five negative cases")
print("Physical Safari/VoiceOver, React runtime parity and Human G2: UNVERIFIED")
