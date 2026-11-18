#!/usr/bin/env python3
"""Browser E2E for SHA-verified *actual* GitHub L09-1-1 CMS/state/UI.

This sandbox blocks all browser navigations to localhost/file://.  We therefore
run the EXACT source bytes using in-memory blob ES modules, use a fetch shim
that supplies the EXACT CMS JSON, and use an explicit per-page Storage shim.
This tests real Chromium DOM and full controller/state behavior, but DOES NOT
certify a real HTTP origin, native browser localStorage, Safari or VoiceOver.
"""
import json
import re
import subprocess
from datetime import datetime,timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BRANCH='content/wave2-l0911-cms-offline-20261118'
REPORT=ROOT/'qa'/'L09-1-1.actual-cms.chromium-inmemory-20261118.json'
EXPECTED={
'L09-1-1.cms.v1.staging.json':'75475cc365aaa15543af43d8c0d52b79bf48086c',
'L09-1-1.state.offline.mjs':'210a2d9d2d0873d4462f145f0174c395181d9eb4',
'L09-1-1.preview.mjs':'6eaa281b759d8ec3a298a93af5582e8da5f7b490',
'L09-1-1.preview.css':'43b8e1caeab5f25734fb1dbe75197d232b00b50d',
'L09-1-1.preview.html':'4b1603c4b594e6e9b504676c67f25f54263ca952',
}
# Pin exact blob hashes for this staging revision, including the tested draft persistence fix.
sha=dict(EXPECTED)
for name,expected in EXPECTED.items():
  actual=subprocess.check_output(['git','hash-object',str(ROOT/name)],text=True).strip()
  assert actual==expected, f'Unexpected GitHub source revision for {name}: {actual} != {expected}'
CMS=json.loads((ROOT/'L09-1-1.cms.v1.staging.json').read_text())
STATE=(ROOT/'L09-1-1.state.offline.mjs').read_text()
CTRL=(ROOT/'L09-1-1.preview.mjs').read_text()
HTML=(ROOT/'L09-1-1.preview.html').read_text()
CSS=(ROOT/'L09-1-1.preview.css').read_text()
HTML=re.sub(r'<script\s+type="module"\s+src="\./L09-1-1.preview\.mjs"></script>','',HTML)
assert '<script type="module"' not in HTML

CHECKS=[]
def assert_true(x):
    assert x

def test(name,fn):
    try:
        result=fn()
        CHECKS.append({'name':name,'result':'PASS','detail':str(result)[:160] if result is not None else None})
    except Exception as e:
        CHECKS.append({'name':name,'result':'FAIL','detail':f'{type(e).__name__}: {e}'[:650]})
        print('FAIL',name,repr(e))

def boot(browser,store=None,blocked_storage=False,viewport=None):
    context=browser.new_context(viewport=viewport or {'width':1280,'height':900},reduced_motion='reduce')
    page=context.new_page()
    page.set_default_timeout(5000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('about:blank')
    page.set_content(HTML)
    page.add_style_tag(content=CSS)
    page.evaluate('''([cms,store,denied]) => {
      window.__cms=structuredClone(cms);
      window.__fetchRequests=[];
      window.fetch=async (url,options)=>{
        window.__fetchRequests.push({url:String(url),cache:options?.cache??null});
        if(String(url)==='./L09-1-1.cms.v1.staging.json')return {ok:true,status:200,json:async()=>structuredClone(window.__cms)};
        throw new Error('Unexpected URL: '+url);
      };
      if(!denied){window.__sandboxStorage={...(store||{})};Object.defineProperty(window,'localStorage',{configurable:true,value:{
          getItem(k){return Object.prototype.hasOwnProperty.call(window.__sandboxStorage,k)?window.__sandboxStorage[k]:null},
          setItem(k,v){window.__sandboxStorage[k]=String(v)},
          removeItem(k){delete window.__sandboxStorage[k]},
          clear(){window.__sandboxStorage={}}
      }});}
    }''',[CMS,store,blocked_storage])
    page.evaluate('''async ([stateSource,controllerSource])=>{
      const stateURL=URL.createObjectURL(new Blob([stateSource],{type:'text/javascript'}));
      const importName="import Pilot from './L09-1-1.state.offline.mjs';";
      if(!controllerSource.includes(importName))throw new Error('Controller state import unexpectedly changed');
      const controllerWithSource=controllerSource.replace(importName,"import Pilot from '"+stateURL+"';");
      const controllerURL=URL.createObjectURL(new Blob([controllerWithSource],{type:'text/javascript'}));
      await import(controllerURL);
      window.__actualSourcesRun=true;
    }''',[STATE,CTRL])
    page.locator('#l0911-challenge').wait_for(state='attached',timeout=7500)
    return context,page,errors

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    context,page,errors=boot(browser)

    def validate_cms():
        assert page.evaluate('window.__actualSourcesRun')
        assert page.evaluate('window.__cms.lesson_id')=='L09-1-1'
        assert page.evaluate('window.__cms.source.notion_page_id')=='41b6cf6db72a8149b622ed4b789860fc'
        requests=page.evaluate('window.__fetchRequests')
        assert len(requests)==1 and requests[0]['url']=='./L09-1-1.cms.v1.staging.json',requests
        assert page.locator('#l0911-hook h1').count()==1
        assert '90%' in page.locator('#l0911-hook').inner_text()
        assert '256' in page.locator('#l0911-challenge').inner_text()
        assert '320' in page.locator('#l0911-challenge').inner_text()
    test('Exact SHA-verified source and real CMS boot',validate_cms)
    test('Initial model answer absent from DOM',lambda: assert_true(page.locator('#model-answer').count()==0 and '80%' not in page.locator('#l0911-challenge').inner_text()))
    test('Reflection hidden before submitted answer',lambda: assert_true(not page.locator('#l0911-reflection').is_visible()))
    test('Six contextual source mentor moments loaded',lambda: assert_true(len(CMS['companion']['moments'])==6 and page.locator('#mentor-content .mentor-choice').count()==2))

    def invalid_t06():
        page.locator('#submit-T06').click()
        assert page.locator('#error-status').is_visible()
        assert page.locator('#feedback-T06').count()==0
        assert page.locator('#feedback-T07').count()==0
    test('Cannot submit empty T06 practice',invalid_t06)

    def unsent_t06_draft_reload():
        page.locator('#method-T06-A').select_option('nominal')
        page.locator('#method-reasoning').fill('A numeric identifier is a category label and not a quantity.')
        store=page.evaluate('window.__sandboxStorage')
        ctx_test,pg_test,err_test=boot(browser,store)
        try:
            assert pg_test.locator('#method-T06-A').input_value()=='nominal', 'T06 selection lost after reload'
            assert pg_test.locator('#method-reasoning').input_value().startswith('A numeric'), 'T06 reasoning lost after reload'
            assert not err_test,err_test
        finally:ctx_test.close()
    test('Unsubmitted T06 draft survives simulated reload (S148 contract)',unsent_t06_draft_reload)

    def valid_t06():
        for k,v in [('A','nominal'),('B','discrete'),('C','ordinal'),('D','continuous')]:
            page.locator('#method-T06-'+k).select_option(v)
        page.locator('#method-reasoning').fill('Learner ID is a label; counts are discrete; priorities are ordered; time measured.')
        page.locator('#submit-T06').click()
        assert page.locator('#feedback-T06').is_visible()
        assert page.locator('#feedback-T07').count()==0
        saved=json.loads(page.evaluate('window.__sandboxStorage["li.review.L09-1-1.v1"]'))
        assert saved['methods']['T06']['attempted'] and not saved['methods']['T07']['attempted']
        assert page.evaluate('document.activeElement.id')=='feedback-T06'
    test('T06 submit, independent gate, focus, and actual state persistence',valid_t06)

    def guide_after_t06():
        page.locator('#open-spellbook').click()
        assert page.locator('#spellbook-dialog').is_visible()
        assert page.evaluate('document.activeElement.id')=='spellbook-close'
        page.keyboard.press('Escape')
        assert not page.locator('#spellbook-dialog').is_visible()
    test('Spellbook opens after T06 and closes with Escape',guide_after_t06)

    def locale_switch():
        page.locator('#language-switch').click()
        assert page.locator('#language-switch').inner_text()=='VI'
        assert page.locator('#feedback-T06').count()==1
        assert 'Population' in page.locator('#l0911-concept').inner_text()
        assert page.locator('#l0911-challenge').locator('textarea').count()==4
        assert page.evaluate('document.documentElement.lang')=='en'
    test('VI to EN switch retains real T06 method evidence',locale_switch)

    def incomplete_reject():
        page.locator('#answer-0').fill('8000 active learners in target population')
        page.locator('#submit-independent').click()
        assert page.locator('#error-status').is_visible()
        assert not page.locator('#l0911-reflection').is_visible()
        assert not json.loads(page.evaluate('window.__sandboxStorage["li.review.L09-1-1.v1"]'))['independent']['submitted']
    test('Partial assessment rejected unless explicitly marked incomplete',incomplete_reject)

    def draft_reload():
        # Capture storage bytes then reinitialize the ACTUAL CMS modules on a fresh about:blank page.
        storage=page.evaluate('window.__sandboxStorage')
        ctx2,pg2,es2=boot(browser,storage)
        try:
            assert pg2.evaluate('document.documentElement.lang')=='en'
            assert pg2.locator('#answer-0').input_value()=='8000 active learners in target population'
            assert pg2.locator('#feedback-T06').count()==1
            assert not pg2.locator('#l0911-reflection').is_visible()
        finally:ctx2.close()
    test('Draft and method retained across simulated reload (storage shim)',draft_reload)

    def independent_submit():
        for i,a in [(1,'Variable types are ordinal, nominal, discrete and continuous.'),(2,'256 from 320 is an observed sample statistic, not a population parameter.'),(3,'Volunteer respondents are not a probability sample of all active users.')]:
            page.locator('#answer-'+str(i)).fill(a)
        page.locator('#submit-independent').click()
        assert page.locator('#l0911-reflection').is_visible()
        assert page.locator('#answer-0').is_disabled()
        assert page.locator('#model-answer').count()==0
        assert page.evaluate('document.activeElement.id')=='l0911-reflection'
        assert page.locator('#lesson-nav button[aria-current="location"]').inner_text()=='Review'
        assert 'Submitted' in page.locator('#mentor-content').inner_text() or page.locator('#mentor-content .mentor-choice').count()==2
    test('Independent submit freezes answers, changes nav/mentor, focuses reflection',independent_submit)

    def reveal():
        page.locator('#reveal-answer').click()
        assert page.locator('#model-answer').is_visible()
        assert '80%' in page.locator('#model-answer').inner_text()
        assert page.evaluate('document.activeElement.id')=='model-answer'
        store=json.loads(page.evaluate('window.__sandboxStorage["li.review.L09-1-1.v1"]'))
        assert store['independent']['answerRevealed']
    test('Explicit reveal unlocks real CMS answer only after submit',reveal)

    def self_review():
        for i,score in [(0,2),(1,1),(2,0),(3,2)]:page.locator('#rating-'+str(i)).select_option(str(score))
        d=json.loads(page.evaluate('window.__sandboxStorage["li.review.L09-1-1.v1"]'))
        assert d['selfReview']['reviewed'] and d['selfReview']['ratings']==[2,1,0,2]
        assert d['independent']['submitted']
    test('Self-rating 4 criteria persists separately from K1 correctness',self_review)

    def post_submit_reload():
        store=page.evaluate('window.__sandboxStorage')
        ctx3,pg3,err3=boot(browser,store)
        try:
            assert pg3.locator('#answer-0').is_disabled()
            assert pg3.locator('#model-answer').is_visible()
            assert pg3.locator('#rating-0').input_value()=='2'
        finally:ctx3.close()
    test('Submitted/revealed/rubric survive simulated browser restart',post_submit_reload)

    def retry():
        page.locator('#retry-independent').click()
        assert page.locator('#answer-0').input_value()==''
        assert page.locator('#model-answer').count()==0
        d=json.loads(page.evaluate('window.__sandboxStorage["li.review.L09-1-1.v1"]'))
        assert d['attemptNumber']==2 and len(d['attemptHistory'])==1
        assert d['attemptHistory'][0]['methods']['T06']['attempted']
        assert not d['methods']['T06']['attempted']
    test('Retry archives prior submitted evidence and clears current attempt',retry)

    def unsent_t07_reload():
        page.locator('#method-premise').fill('Respondents came from a convenience iOS community and self-selected.')
        page.locator('#method-claim').fill('The user claims this ratio applies to everyone in the population.')
        storage=page.evaluate('window.__sandboxStorage')
        ctx_tmp,pg_tmp,errs_tmp=boot(browser,storage)
        try:
            assert pg_tmp.locator('#method-premise').input_value().startswith('Respondents came from')
            assert pg_tmp.locator('#method-claim').input_value().startswith('The user claims')
            assert not errs_tmp,errs_tmp
        finally:ctx_tmp.close()
    test('Unsubmitted optional T07 draft survives simulated reload',unsent_t07_reload)

    def t07_optional():
        page.locator('#method-premise').fill('The 30 responders were all voluntary participants in an iOS survey.')
        page.locator('#method-claim').fill('The satisfaction ratio was wrongly extended to 1000 users.')
        page.locator('#method-missingAssumption').fill('Probability sampling and response coverage are not established.')
        page.locator('#submit-T07').click()
        assert page.locator('#feedback-T07').is_visible()
        assert page.locator('#feedback-T06').count()==0
        d=json.loads(page.evaluate('window.__sandboxStorage["li.review.L09-1-1.v1"]'))
        assert d['methods']['T07']['attempted']
    test('Optional T07 independent attempt/feedback after retry',t07_optional)

    def mobile():
        page.set_viewport_size({'width':390,'height':844})
        x=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')
        assert x['scroll']<=x['inner']+1,x
        assert page.locator('#lesson-nav').is_visible()
    test('390px mobile layout no horizontal page overflow',mobile)

    def responsive_widths():
        for width in [320,375,402,768,1280]:
            page.set_viewport_size({'width':width,'height':844})
            dimensions=page.evaluate('({document:document.documentElement.scrollWidth,viewport:innerWidth})')
            assert dimensions['document']<=width+1, f'Horizontal overflow at {width}: {dimensions}'
    test('320/375/402/768/1280 widths avoid page overflow',responsive_widths)

    def screenreader_structure():
        assert page.locator('main').count()==1 and page.locator('nav').count()==1
        assert page.locator('dialog[aria-labelledby="spellbook-title"]').count()==1
        assert page.locator('#save-status[aria-live="polite"]').count()==1
        assert page.locator('#error-status[role="alert"]').count()==1
        assert page.locator('a[target="_blank"]:not([rel="noopener noreferrer"])').count()==0
    test('Screenreader landmarks/ARIA static structure from real DOM',screenreader_structure)

    def no_js_errors():
        assert not errors,errors
    test('No uncaught browser page errors across full lesson flow',no_js_errors)

    # Permission-denied storage path in isolated actual CMS/controller run.
    def denied_storage():
        ctx4,pg4,errs=boot(browser,blocked_storage=True)
        try:
            assert 'Storage unavailable' in pg4.locator('#save-status').inner_text()
            pg4.locator('#answer-0').fill('A long answer that should stay only in memory during denied storage.')
            assert any(x in pg4.locator('#save-status').inner_text() for x in ['Storage unavailable','Không lưu được']), pg4.locator('#save-status').inner_text()
            assert not errs,errs
        finally:ctx4.close()
    test('localStorage-denied fallback remains usable and honestly warns',denied_storage)

    def explicit_incomplete_submission():
        ctx,pg,errs=boot(browser)
        try:
            pg.locator('#answer-0').fill('Only population and sample are distinguished; still missing other parts.')
            pg.locator('#allow-incomplete').check()
            pg.locator('#submit-independent').click()
            assert pg.locator('#l0911-reflection').is_visible()
            assert pg.locator('#model-answer').count()==0
            saved=json.loads(pg.evaluate('window.__sandboxStorage["li.review.L09-1-1.v1"]'))
            assert saved['independent']['incomplete'] and saved['independent']['submitted']
        finally:ctx.close()
    test('Explicit incomplete submission marked incomplete, no silent grading',explicit_incomplete_submission)

    def corrupted_progress_reset():
        ctx,pg,errs=boot(browser,store={'li.review.L09-1-1.v1':'{bad-json'})
        try:
            assert pg.locator('#l0911-hook h1').is_visible()
            assert not pg.locator('#l0911-reflection').is_visible()
            assert pg.locator('#save-status').inner_text()
            assert not errs,errs
        finally:ctx.close()
    test('Corrupt saved state falls back without false completion',corrupted_progress_reset)

    # Capture representative UI screenshots against EXACT CMS for independent review.
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('window.scrollTo(0,0)')
    page.screenshot(path=str(ROOT/'qa'/'actual-cms-mobile.png'),full_page=True)
    page.set_viewport_size({'width':1280,'height':900})
    page.evaluate('window.scrollTo(0,0)')
    page.screenshot(path=str(ROOT/'qa'/'actual-cms-desktop.png'),full_page=True)
    context.close()
    browser.close()

report={
 'schema':'li.L09-1-1.actual-GitHub-CMS.chromium-memory-e2e.v1',
 'run_utc':datetime.now(timezone.utc).isoformat(),
 'source_branch':BRANCH,
 'source_files':[{'path':k,'blob_sha':sha[k]} for k in EXPECTED],
 'browser':'Chromium /usr/bin/chromium via Python Playwright',
 'execution':'actual committed CMS + actual state module + actual controller and HTML/CSS; in-memory ES modules using blob URLs; exact CMS served by fetch shim; storage shim for simulated reload',
 'assertions':CHECKS,
 'pass':sum(x['result']=='PASS' for x in CHECKS),
 'fail':sum(x['result']=='FAIL' for x in CHECKS),
 'limits':['Browser admin blocks localhost/file/data navigations: no real HTTP origin tested',
           'Storage shim is not native localStorage or PWA persistence',
           'No Safari/iPhone/VoiceOver/device testing',
           'Controller import path rewritten only to blob URL for browser memory injection',
           'CMS/state/HTML/CSS payloads otherwise are exact SHA-verified GitHub staging bytes',
           'Client-side CMS still contains keys inspectable outside UX gate',
           'This is not a release/QA28 signoff or production app integration']
}
REPORT.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'report':str(REPORT),'pass':report['pass'],'fail':report['fail'],'failures':[x for x in CHECKS if x['result']=='FAIL']},indent=2,ensure_ascii=False))
if report['fail']:
    raise SystemExit(2)