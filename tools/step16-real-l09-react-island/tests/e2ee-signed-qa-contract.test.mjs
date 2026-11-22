import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/auth/e2ee-qa.ts',import.meta.url),'utf8');
const config=readFileSync(new URL('../vite.e2ee-qa.config.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../../../site/e2ee-qa/index.html',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../../../.github/workflows/li-pages.yml',import.meta.url),'utf8');

test('QA cannot call production auth/database, even if attacker changes page origin',()=>{
 assert.match(src,/location\.origin!=='https:\/\/sali5610\.github\.io'/);
 assert.match(src,/location\.pathname!=='\/li\/e2ee-qa\/'/);
 assert.match(src,/ep-delicate-firefly-azsbs1xb\.neonauth/);
 assert.match(src,/ep-delicate-firefly-azsbs1xb\.apirest/);
 assert.doesNotMatch(src,/ep-misty-snow-azfrrm3o/);
 assert.doesNotMatch(src,/li5610\.pages\.dev/);
 assert.match(config,/VITE_LI_AUTH_TARGET!=='github-pages-staging'/);
 assert.match(config,/VITE_LI_E2EE_QA_BUILD!=='1'/);
});

test('QA signs real Google JWT, requires invite RLS, never scans/copies personal rows',()=>{
 assert.match(src,/auth\.signIn\.social\(\{provider:'google'/);
 assert.match(src,/fetchSignedNeonJwt\(QA_AUTH\)/);
 assert.match(src,/checkInviteAccess\(QA_API,sessionPort\)/);
 assert.match(src,/bindNeonAccount\(QA_API,sessionPort\)/);
 assert.match(src,/QA_PREFIX\+crypto\.randomUUID\(\)/);
 assert.match(src,/api\.one\('note',item\.id\)/);
 assert.match(src,/new SealedNeonUserApi\(api,item\.vault\)/);
 assert.match(src,/recoverVault\(manifest,api\.accountId,code\)/);
 assert.doesNotMatch(src,/\.all\(\)/);
 assert.doesNotMatch(src,/migrateLegacyPayloads|li_learning_events|li_user_state.*DELETE|setCurrentVault|finishVaultMigration/);
 assert.doesNotMatch(src,/localStorage|indexedDB|sessionStorage|document\.cookie/i);
});

test('write is only a deliberate confirmed click; recovery and test IDs never go in URL',()=>{
 assert.match(src,/button\('qa-save'\)\.addEventListener\('click'/);
 assert.match(src,/!item\|\|!input\('qa-confirm-save'\)\.checked/);
 assert.match(src,/canonical\(keybag\)!==canonical\(item\.manifest\)/);
 assert.match(src,/raw\.payload\).*QA_MESSAGE|includes\(QA_MESSAGE\)/);
 assert.doesNotMatch(src,/URLSearchParams.*recovery|URLSearchParams.*password|URLSearchParams.*qa-item/);
 assert.match(html,/input id="qa-recovery-input" type="password"/);
 assert.match(html,/id="qa-confirm-save" type="checkbox"/);
 assert.match(html,/noindex,nofollow,noarchive/);
});

test('QA is a separate staging-only entrypoint, not an extra Cloudflare deploy',()=>{
 assert.match(workflow,/VITE_LI_E2EE_QA_BUILD=1 npx vite build --config vite\.e2ee-qa\.config\.mjs/);
 assert.match(workflow,/cp tools\/step16-real-l09-react-island\/dist-e2ee-qa\/\*\.js site\/assets\//);
 assert.match(config,/outDir:'dist-e2ee-qa'/);
 assert.match(workflow,/site\/e2ee-qa\/index\.html/);
 assert.match(html,/src="\.\.\/assets\/e2ee-qa\.js"/);
});
