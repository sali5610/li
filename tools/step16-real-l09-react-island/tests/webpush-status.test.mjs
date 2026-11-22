import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui=readFileSync(new URL('../src/shell/web-push-settings.tsx',import.meta.url),'utf8');

test('permission-granted server error includes safe issue code after ternary',()=>{
 assert.match(ui,/const explanation=denied\?copy\(/);
 assert.match(ui,/setError\(explanation\+\(denied\?'':' \(' \+safePushIssue\(err\)\+'\)'\)\)/);
 assert.match(ui,/PUSH_BACKEND_\(400\|401\|403\|404\|409\|429\|500\|503\)/);
 assert.doesNotMatch(ui,/setError\(denied\?copy\([\s\S]*?safePushIssue\(err\)/,
  'do not append the issue code only to the final ternary fallback');
});
