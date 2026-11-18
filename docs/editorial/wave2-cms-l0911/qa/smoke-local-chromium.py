#!/usr/bin/env python3
"""Local-only end-to-end Chromium smoke suite for the ACTUAL staged L09-1-1 CMS.
Run from repo root after installing the free playwright Python package and browser:
    python docs/editorial/wave2-cms-l0911/qa/smoke-local-chromium.py
This runs a loopback-only HTTP server. NEVER publishes/deploys a site.
Unlike the documented 2026-11-18 in-memory fixture smoke, this EXACT-CMS
local-server suite was NOT executed in the restricted assistant sandbox.
"""
import asyncio, json, subprocess, sys
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
PORT=18791
async def main():
    server=subprocess.Popen([sys.executable,"-m","http.server",str(PORT),"--bind","127.0.0.1"],
                            cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    checks=[]
    async def check(name,fn):
        try:
            await fn()
            checks.append({"id":name,"result":"PASS"})
        except Exception as exc:
            checks.append({"id":name,"result":"FAIL","error":str(exc)[:350]})
    try:
        await asyncio.sleep(.5)
        async with async_playwright() as p:
            browser=await p.chromium.launch(headless=True)
            context=await browser.new_context(viewport={"width":1280,"height":900})
            page=await context.new_page()
            page.set_default_timeout(6500)
            errors=[]
            page.on("pageerror",lambda err:errors.append(str(err)))
            await page.goto(f"http://127.0.0.1:{PORT}/L09-1-1.preview.html")
            await page.locator("#l0911-challenge").wait_for()
            async def hook():
                assert await page.locator("#l0911-hook h1").count()==1
                assert not await page.locator("#l0911-reflection").is_visible()
                assert await page.locator("#model-answer").count()==0
            await check("Hook First, answer/reflection initially locked",hook)
            async def invalid_method():
                await page.locator("#submit-T06").click()
                assert await page.locator("#error-status").is_visible()
                assert await page.locator("#feedback-T06").count()==0
            await check("Reject unattempted T06",invalid_method)
            async def method():
                for key,val in [("A","nominal"),("B","discrete"),("C","ordinal"),("D","continuous")]:
                    await page.locator(f"#method-T06-{key}").select_option(val)
                await page.locator("#method-reasoning").fill("These fields differ by the measurement they represent.")
                await page.locator("#submit-T06").click()
                assert await page.locator("#feedback-T06").is_visible()
                assert await page.locator("#feedback-T07").count()==0
            await check("T06 independent feedback gate",method)
            async def guide():
                await page.locator("#open-spellbook").click()
                assert await page.locator("#spellbook-dialog").is_visible()
                await page.keyboard.press("Escape")
                assert not await page.locator("#spellbook-dialog").is_visible()
            await check("Spellbook dialog keyboard Escape",guide)
            async def localization():
                await page.locator("#language-switch").click()
                assert await page.locator("#language-switch").inner_text()=="VI"
                assert await page.locator("#feedback-T06").count()==1
            await check("Locale switch retains T06 evidence",localization)
            async def submit():
                for i,answer in enumerate([
                    "Target population contains 8000 active learners",
                    "The four variables are typed by meaning and measurement",
                    "Only the sample statistic comes from observed responses",
                    "Opt-in iOS users cannot represent all learners without assumptions"
                ]):
                    await page.locator(f"#answer-{i}").fill(answer)
                await page.locator("#submit-independent").click()
                assert await page.locator("#l0911-reflection").is_visible()
                assert await page.locator("#answer-0").is_disabled()
                assert await page.locator("#model-answer").count()==0
                assert await page.evaluate("document.activeElement.id")=="l0911-reflection"
            await check("Independent freezes and focuses review, without auto-reveal",submit)
            async def reveal():
                await page.locator("#reveal-answer").click()
                assert await page.locator("#model-answer").is_visible()
                assert await page.evaluate("document.activeElement.id")=="model-answer"
            await check("Explicit answer reveal and focus",reveal)
            async def reload():
                await page.reload()
                await page.locator("#l0911-reflection").wait_for(state="visible")
                assert await page.locator("#answer-0").is_disabled()
                assert await page.locator("#model-answer").count()==1
            await check("Real-origin localStorage reload",reload)
            async def retry():
                await page.locator("#retry-independent").click()
                assert await page.locator("#answer-0").input_value()==""
                assert await page.locator("#model-answer").count()==0
            await check("Retry resets new attempt",retry)
            async def mobile():
                await page.set_viewport_size({"width":390,"height":844})
                width=await page.evaluate("({document:document.documentElement.scrollWidth,viewport:innerWidth})")
                assert width["document"]<=width["viewport"]+1,width
                assert await page.locator("#lesson-nav").is_visible()
            await check("390px responsive layout",mobile)
            await check("No JavaScript page errors",lambda: asyncio.sleep(0) if not errors else (_ for _ in ()).throw(AssertionError(errors)))
            await browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)
    passed=sum(x["result"]=="PASS" for x in checks)
    report={"schema":"li.l0911.local-chromium.smoke.v1","status":"TEST_RESULT_WHEN_EXECUTED",
            "pass":passed,"fail":len(checks)-passed,"checks":checks}
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if report["fail"]:sys.exit(1)
if __name__=="__main__":asyncio.run(main())
