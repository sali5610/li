#!/usr/bin/env node
/**
 * UX-DS-35 · VC-G2-01 scoped Human PO approval RECORD only.
 * Fail-closed governance+source contract tests: never changes app CSS, G2 or DB.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const proposal=JSON.parse(read('tools/step16-real-l09-react-island/src/ui/visual-contract-g2-proposal.v0.1.json'));
const tokens=JSON.parse(read('design-system/tokens.json'));
const geometry=JSON.parse(read('tools/step16-real-l09-react-island/src/ui/geometry-gates.stage02b.json'));
const ownership=JSON.parse(read('tools/step16-real-l09-react-island/src/ui/ownership.stage02b.json'));
const native=read('site/assets/li-layout.css');
const legacy=read('tools/step16-real-l09-react-island/src/pilot.css');
const sharedCss=read('tools/step16-real-l09-react-island/src/ui/shared.css');
const sharedTsx=read('tools/step16-real-l09-react-island/src/ui/Shared.tsx');
const pilotTsx=read('tools/step16-real-l09-react-island/src/Pilot.tsx');
const source=(p,txt)=>assert.ok(p.includes(txt),'Required source evidence absent: '+txt);

function validate(p){
 assert.equal(p.id,'UXDS35-VC-G2-01');
 assert.equal(p.version,'0.1.0');
 assert.equal(p.decisionStatus,'APPROVED_SCOPED');
 assert.equal(p.poGate,'G2_OPEN');
 assert.equal(p.implementationStatus,'RESEARCH_PILOT_IMPLEMENTED');
 assert.equal(p.nextActivity,'EXACT_HEAD_LOCAL_CHROMIUM_QA_AND_DEPENDENCY_REVIEW_NO_DEPLOY');
 assert.equal(p.testing.researchVisualPilot,'IMPLEMENTED_BUT_NOT_YET_CI_VERIFIED');
 assert.equal(p.researchOptInVisualCss,'IMPLEMENTED_SCOPED_TO_DATA_VC_G2_APPROVED_RESEARCH');
 assert.equal(p.safety.modifyProductionVisualCss,false);
 assert.equal(p.reviewMode,'HUMAN_PO_SCOPED_APPROVAL_RECORDED');
 assert.equal(p.approvalEvidence.authorizedBy,'Human Product Owner');
 assert.equal(p.approvalEvidence.message,'duyệt');
 assert.equal(p.approvalEvidence.dateTime,'2026-11-20T00:55:00+07:00');
 assert.deepEqual(p.approvalEvidence.approvedDecisionIds,['VC-G2-D1','VC-G2-D2','VC-G2-D3']);
 for(const v of ['global_visual_identity','global_G2_stage_exit','main_merge','deploy','Auth_Neon_RLS'])assert.ok(p.approvalEvidence.notApproved.includes(v),'Scope exclusion missing '+v);
 assert.ok(p.nextActivity.startsWith('EXACT_HEAD_LOCAL_CHROMIUM_QA'),'Approved research next action not scoped to QA');
 assert.equal(tokens.quality.g2Approved,false,'Source must not claim human visual acceptance');
 assert.equal(tokens.quality.physicalDeviceQAVerified,false,'Source must not claim real device acceptance');
 assert.equal(tokens.quality.humanTypographySpacingSignoff,false);
 assert.equal(geometry.approval,'G2_OPEN');
 assert.equal(ownership.review,'G2_OPEN');
 assert.equal(p.authority.dsHead,ownership.sourcePins.ds);
 assert.equal(p.authority.ontHead,ownership.sourcePins.ontology);
 assert.equal(p.foundation.tapTargetCssPx,tokens.interaction.minimumIntendedTapTargetPx);
 assert.equal(p.foundation.ordinaryRadiusPx,tokens.shape.ordinaryControlRadiusPx);
 assert.equal(p.foundation.spacingUnitPx,tokens.spacing.baseUnitPx);
 const body=tokens.typography.scale.body,support=tokens.typography.scale.support;
 assert.equal(p.foundation.bodyFontSizePx,body.fontSizePx);
 assert.equal(p.foundation.bodyLineHeightPx,body.lineHeightPx);
 assert.equal(p.foundation.supportFontSizePx,support.fontSizePx);
 assert.equal(p.foundation.supportLineHeightPx,support.lineHeightPx);
 assert.equal(p.foundation.deviceScale.ipadPortrait.cardPadPx,tokens.deviceScales['ipad-portrait'].layout['card-pad']);
 assert.equal(p.foundation.deviceScale.ipadLandscape.cardPadPx,tokens.deviceScales['ipad-landscape'].layout['card-pad']);
 assert.equal(p.foundation.deviceScale.ipadPortrait.minControlPx,tokens.deviceScales['ipad-portrait'].layout['control-min']);
 assert.equal(p.foundation.deviceScale.ipadLandscape.minControlPx,tokens.deviceScales['ipad-landscape'].layout['control-min']);
 assert.deepEqual(p.components.map(x=>x.id),['Button','Card','Field','ActionGroup']);
 for(const c of p.components){
  const expected=c.id==='ActionGroup'?'SOURCE_RULE_ONLY':'APPROVED_SCOPED_RESEARCH_IMPLEMENTED';
  assert.equal(c.status,expected,'Cannot expand approved component scope');
 }
 const [button,card,field,group]=p.components;
 assert.equal(button.sourceObserved.nativeActionMinHeightPx,46);
 assert.equal(button.proposed.targetCssPx,48);
 assert.equal(button.proposed.radiusPx,0);
 assert.equal(button.proposed.secondaryBg,'--li-comp-button-secondary-background');
 assert.equal(button.sourceObserved.nativeFontRole,'var(--li-type-support)');
 assert.equal(button.sourceObserved.nativeShadow,'4px 4px 0 var(--wood)');
 assert.equal(card.sourceObserved.nativePadding,'var(--li-space-6)');
 assert.equal(card.sourceObserved.legacyPadding,'var(--li-space-4)');
 assert.equal(card.sourceObserved.nativeShadow,'5px 5px 0 var(--wood)');
 assert.equal(card.proposed.mobilePaddingPx,tokens.spacing.aliasesPx.mobileCardPadding);
 assert.equal(card.proposed.standardPaddingPx,tokens.spacing.aliasesPx.desktopCardPadding);
 assert.equal(card.proposed.ipadPortraitPadPx,tokens.deviceScales['ipad-portrait'].layout['card-pad']);
 assert.equal(card.proposed.ipadLandscapePadPx,tokens.deviceScales['ipad-landscape'].layout['card-pad']);
 assert.equal(field.sourceObserved.nativeGuidedTextareaMinHeightPx,174);
 assert.equal(field.sourceObserved.legacyAnswerTextareaMinHeightPx,112);
 assert.equal(field.proposed.singleLineMinTargetCssPx,48);
 assert.equal(field.proposed.textAreaHeight,'CONTEXT_VARIANT_NOT_ONE_UNIVERSAL_MIN');
 assert.equal(field.proposed.tabletMinControlCssPx,tokens.deviceScales['ipad-portrait'].layout['control-min']);
 assert.equal(group.proposed.gapPx,12);
 assert.equal(group.proposed.oneDominantPrimary,true);
 assert.deepEqual(p.decisionGates.map(x=>x.id),['VC-G2-D1','VC-G2-D2','VC-G2-D3']);
 for(const gate of p.decisionGates){
  assert.equal(gate.status,'APPROVED','Human PO scoped approval must be recorded');
  assert.equal(gate.poAction,'APPROVED_BY_HUMAN_PO');
  assert.equal(gate.implementationStatus,'RESEARCH_PILOT_IMPLEMENTED');
  assert.equal(gate.approvalScope,'VISUAL_CONTRACT_ONLY');
  assert.equal(gate.approvedAt,p.approvalEvidence.dateTime);
  assert.equal(gate.noChangeBeforeApproval,true);
  assert.ok(gate.scopeImpact.length>30,'Downstream dependencies must be listed');
 }
 for(const [name,flag] of Object.entries(p.safety))assert.equal(flag,false,'Unsafe attempted side effect: '+name);
 assert.equal(p.testing.physicalSafari,'NOT_RUN');
 assert.equal(p.testing.humanG2,'OPEN');
 assert.equal(p.testing.stage03,'NOT_PROMOTED');
 // Exact observed source; do not collapse native / legacy / NEW shared ownership.
 source(native,'.action{display:inline-flex');
 source(native,'min-height:46px');
 source(native,'box-shadow:4px 4px 0 var(--wood)');
 source(native,'.surface{background:var(--li-comp-surface-background)');
 source(native,'box-shadow:5px 5px 0 var(--wood)');
 source(native,'padding:var(--li-space-6)');
 source(native,'.text-editor{width:100%;min-height:174px');
 source(legacy,'.pilot-surface{background:var(--li-comp-surface-background,var(--cream))');
 source(legacy,'padding:var(--li-space-4)');
 source(legacy,'.pilot textarea{resize:vertical;width:100%;min-height:112px}');
 source(sharedCss,'.pilot .li-ui-button{min-height:var(--li-comp-button-min-hit-size,48px)}');
 source(sharedCss,'.pilot .li-ui-field .li-ui-input{');
 source(sharedCss,'.pilot .li-ui-card-tinted{');
 source(sharedTsx,'export function Button(');
 source(sharedTsx,'export function Card(');
 source(sharedTsx,'export function TextInput(');
 source(pilotTsx,"import {ActionButton,Surface,StatusMessage} from './ui/Primitives';");
 source(pilotTsx,"import {ActionGroup,Button,Card,TextAreaField} from './ui/Shared';");
 source(pilotTsx,"function StudyAction(");
 source(pilotTsx,"function StudySurface(");
 source(pilotTsx,"data-vc-g2={visualContractPilot?'approved-research':undefined}");
 source(pilotTsx,'purpose="answer"');
 assert.equal(ownership.components.filter(x=>x.reactUsage==='fixture_only').length,8);
 assert.equal(ownership.components.filter(x=>x.reactUsage==='research_L09_island').length,1);
 const tokenMap={
 'button-primary-background':'action-primary-surface','button-secondary-background':'action-secondary-surface',
 'surface-background':'surface-raised','surface-tinted-background':'surface-tinted',
 'surface-inverse-background':'surface-inverse','field-background':'input-surface',
 'field-focus-border':'field-focus-border','field-error-border':'field-error-border'
 };
 for(const [comp,sem] of Object.entries(tokenMap)){
  const actual=tokens.componentRoles[comp],name=actual.replace('--li-role-','');
  assert.equal(name,sem,'Canonical component role changed '+comp);
 }
 // Human PO approved only the proposed contract. Still NEVER mutate source geometry in this validation.
 return {id:p.id,decisionStatus:p.decisionStatus,g2:p.poGate,sourcePins:p.authority,
  reviewedFamilies:p.components.map(x=>x.id),approvedScopedDecisionIds:p.decisionGates.map(x=>x.id),approvalDate:p.approvalEvidence.dateTime,globalG2:'OPEN',
  rawSourceNativeMinHeight:46,newSharedTarget:48,sourceRolesVerified:Object.keys(tokenMap).length,
  originalLegacyVsShared:"DISTINCT",actualCssModified:'OPT_IN_RESEARCH_ONLY',deviceQA:'NOT_RUN'};
}
const result=validate(proposal);
let negatives=0;
if(process.argv.includes('--selftest')){
 const clone=x=>JSON.parse(JSON.stringify(x));
 for(const change of [
  x=>x.decisionStatus='APPROVED',
  x=>x.decisionGates[0].status='PROPOSED',
  x=>x.approvalEvidence.approvedDecisionIds.pop(),
  x=>x.poGate='G2_APPROVED',
  x=>x.components[0].proposed.secondaryBg='--li-comp-field-background',
  x=>x.safety.modifyProductionVisualCss=true,
  x=>x.foundation.deviceScale.ipadPortrait.cardPadPx=24,
  x=>x.testing.physicalSafari='PASS'
 ]){
  const caseData=clone(proposal);change(caseData);
  assert.throws(()=>validate(caseData),undefined,'Invalid scoped approval mutation was not rejected');
  negatives++;
 }
}
const dest='/tmp/li-uxds35-stage02b/visual-contract-g2-proposal-source-validation.json';
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify({...result,negativeFixtures:negatives},null,2)+'\n');
console.log('PASS UXDS35_VISUAL_CONTRACT_SCOPED_APPROVAL_SOURCE '+JSON.stringify({
 families:result.reviewedFamilies,poGates:result.approvedScopedDecisionIds,semanticRoles:result.sourceRolesVerified,
 negativeFixtures:negatives,approval:'D1_D2_D3_APPROVED_SCOPED',globalG2:'OPEN',implementation:'RESEARCH_PILOT_ONLY',visualCssChanges:'SCOPED_OPT_IN_ONLY'}));
