#!/usr/bin/env node
"use strict";
// Regression for the iPhone screenshot: this screen was accidentally changed
// from two tiles per row to one during the React adoption.
const {readFileSync}=require("node:fs");
const {join}=require("node:path");
const assert=require("node:assert/strict");
const root=join(__dirname,"..");
const css=readFileSync(join(root,"tools/step16-real-l09-react-island/src/shell/guide-library.css"),"utf8");
const component=readFileSync(join(root,"tools/step16-real-l09-react-island/src/shell/guide-library.tsx"),"utf8");
const mobile=css.slice(css.indexOf("@media(max-width:600px)"));
assert.ok(mobile.length<css.length,"Missing iPhone breakpoint");
assert.match(mobile,/\.li-react-guide \.li-react-method-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,
 "React Guide on iPhone must keep two MethodTile columns");
assert.doesNotMatch(mobile,/\.li-react-guide \.li-react-method-grid\{grid-template-columns:1fr\}/,
 "Do not collapse React Thần Chú tiles to a single mobile column");
assert.match(component,/import '\.\/guide-library\.css'/,"React Guide must load its scoped layout");
assert.match(component,/import '\.\.\/\.\.\/\.\.\/\.\.\/design-system\/react\/legacy\.css'/,
 "MethodTile must load its canonical CSS (otherwise iPhone cards are unstyled)");
console.log("PASS React Thần Chú mobile keeps 2 columns and styled MethodTile");
