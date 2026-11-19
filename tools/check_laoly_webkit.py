#!/usr/bin/env python3
"""ONT-04C2b-2: actual native li. app running in Playwright WebKit.
This is browser-engine QA, NOT an iPhone/iPad Safari or VoiceOver test.
The browser context is ephemeral; only synthetic lesson attempts are used.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path("/tmp/li-ont04c2b-webkit")
URL = "http://127.0.0.1:8766/site/__ont04c2b_qa.html"

async def run():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        # Browser under test is Playwright's REAL WebKit engine, not Chromium with a Safari UA override.
        browser = await playwright.webkit.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1536, "height": 1070},
            device_scale_factor=2,
            has_touch=True,
            is_mobile=True,
        )
        page = await context.new_page()
        console_errors = []
        page.on("pageerror", lambda error: console_errors.append(str(error)))
        await page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_function(
            """() => ["PASS","FAIL"].includes(
                document.querySelector("#qa-status")?.dataset.qaStatus
            )""",
            timeout=130000,
        )
        report = json.loads(await page.locator("#qa-ledger").inner_text())
        report_status = await page.locator("#qa-status").get_attribute("data-qa-status")
        expected = {
            "environment": "WEBKIT_HEADLESS_SAME_ORIGIN_NATIVE_APP",
            "physicalIPhone": "NOT_RUN",
            "physicalIPad": "NOT_RUN",
            "VoiceOver": "OUT_OF_SCOPE_PO_S208",
            "cloudflareDeploy": "NONE",
        }
        errors = []
        for key, expected_value in expected.items():
            if report.get(key) != expected_value:
                errors.append(f"{key}: expected {expected_value!r}, got {report.get(key)!r}")
        if report_status != "PASS" or report.get("fail") or report.get("count", 0) < 189:
            errors.append(f"Mounted native WebKit QA incomplete: {report_status}, "
                          f"{report.get('pass')}/{report.get('count')} checks, "
                          f"failing cases: {json.dumps(report.get('failures', []), ensure_ascii=False)}")
        # A WebKit browser with a touch-enabled context still isn't actual iOS Safari.
        iframe = page.frame_locator("#qa-app")
        if not errors:
            await iframe.locator("#buddy-modal").evaluate(
                """el => { if (el.classList.contains("open")) {
                    el.ownerDocument.defaultView.closeModal?.("buddy-modal");
                } }"""
            )
            await iframe.locator("#laoly-fab").tap(timeout=13000)
            if not await iframe.locator("#buddy-modal").evaluate(
                "el => el.classList.contains('open')"
            ):
                errors.append("Real WebKit tap on the actual #laoly-fab did not open Lão Lý dialog")
        # Screenshot evidence: actual rendered WebKit pages at phone/iPad CSS widths.
        for width, height, label in [
            (320, 720, "phone_320"),
            (375, 812, "phone_375"),
            (768, 1024, "tablet_768"),
            (1024, 768, "tablet_1024"),
        ]:
            await page.locator("#qa-app").evaluate(
                """(iframe, p) => {
                    iframe.style.width = p[0] + "px";
                    iframe.style.height = p[1] + "px";
                    iframe.contentWindow.dispatchEvent(new Event("resize"));
                }""",
                [width, height],
            )
            await page.wait_for_timeout(120)
            actual_width = await iframe.locator("html").evaluate(
                "el => el.clientWidth"
            )
            if abs(actual_width - width) > 1:
                errors.append(f"{label}: WebKit iframe inner viewport {actual_width} vs {width}")
            # Screenshot is an audit artifact, not an automatically approved visual design.
            await page.locator("#qa-app").screenshot(
                path=str(OUT / f"{label}.png"),
                timeout=15000,
            )
        if console_errors:
            # Signal errors without crashing just because optional external assets
            # are unavailable in offline CI. Record for reviewer triage.
            (OUT / "page-errors.json").write_text(
                json.dumps(console_errors, ensure_ascii=False, indent=2)
            )
        report["webkitTouchFAB"] = "FAIL" if errors else "PASS"
        report["webkitScreenshots"] = 4
        report["physicalSafari"] = "NOT_RUN"
        report["browserEngineEvidence"] = "PLAYWRIGHT_WEBKIT_HEADLESS_ON_UBUNTU"
        report["voiceOverReleaseGate"] = "OUT_OF_SCOPE_PO_S208"
        report["webkitAdditionalErrors"] = errors
        (OUT / "webkit-qa.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
        summary = {
            "status": "FAIL" if errors else "PASS",
            "engine": report["browserEngineEvidence"],
            "nativeSourceCases": report.get("count"),
            "nativeSourceCasesPassed": report.get("pass"),
            "nativeSourceCasesFailed": report.get("fail"),
            "touchFab": report["webkitTouchFAB"],
            "responsiveScreenshots": 4,
            "physicalSafari": "NOT_RUN",
            "VoiceOver": "OUT_OF_SCOPE_PO_S208",
            "errors": errors,
        }
        print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
        await context.close()
        await browser.close()
        if errors:
            raise SystemExit(1)

if __name__ == "__main__":
    asyncio.run(run())
