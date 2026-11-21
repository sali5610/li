#!/usr/bin/env node
"use strict";
// Focused contract for the redesigned field guide.
// The old two-MethodTile iPhone grid was intentionally replaced by readable
// one-column chapter entries. Keep the real lookup/filters and route actions.
const {readFileSync}=require("node:fs");
const {join}=require("node:path");
const assert=require("node:assert/strict");
const root=join(__dirname,"..");
const css=readFileSync(join(root,"tools/step16-real-l09-react-island/src/shell/guide-library.css"),"utf8");
const component=readFileSync(join(root,"tools/step16-real-l09-react-island/src/shell/guide-library.tsx"),"utf8");
const mobile=css.slice(css.indexOf("@media(max-width:600px)"));
assert.ok(mobile.length<css.length,"Missing iPhone breakpoint");
assert.match(mobile,/\.li-react-guide \.guide-index-contents\{grid-template-columns:1fr\}/,
 "Field-guide chapters should be readable on iPhone");
assert.match(css,/\.li-react-guide \.guide-index-contents\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,
 "Chapter layout should use two columns where space allows");
assert.match(component,/const visible=view\.methods\.filter\(method=>\{/,
 "Visible entries must come from all canonical methods, not just suggestions");
assert.match(component,/className="guide-method-entry" onClick=\{\(\)=>app\.liMethods\?\.open\(method\.id\)\}/,
 "Each method must open its real detail through the canonical port");
assert.match(component,/<SearchField inputId="li-react-method-search"/,
 "Method search must use the accessible canonical SearchField");
assert.match(component,/app\.liGuideUi|window\.liGuideUi/,"Search state port must remain registered");
assert.doesNotMatch(component,/<MethodTile\b/,"Legacy two-tile markup must not return");
console.log("PASS React Thần Chú field guide: grouped chapters, readable iPhone list and direct method routes");
