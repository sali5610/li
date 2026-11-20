# Temporary one-shot smoke of the REAL deployed invited-only GitHub Pages UI.
# Uses fake localStorage, no Google session/JWT, no Neon writes or user uploads.
import json
import shutil
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ORIGIN="https://sali5610.github.io/li/"
FIXTURE={
 "schema":1,
 "cases":[{"title":"Synthetic case","revision":"Synthetic reasoning","correct":True}],
 "questions":[{"question":"Synthetic bookmark","id":"question-qa-1"}],
 "ideas":[{"id":"idea-qa-1","text":"Synthetic idea for backup","savedAt":"2026-11-20T12:00:00Z"}],
 "savedContent":[{"type":"lesson","id":"L09-1-2","savedAt":"2026-11-20T12:00:00Z"}],
 "draft":"Synthetic private draft"
}
KEY="li.private.library.v1"
DRAFT="li.private.case-draft.v1"
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    ctx=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
    # This is scoped to the temporary browser context, never an actual person's device.
    ctx.add_init_script(f"""() => {{
      localStorage.setItem({json.dumps(KEY)},JSON.stringify({json.dumps(FIXTURE)}));
      localStorage.setItem({json.dumps(DRAFT)},{json.dumps(FIXTURE['draft'])});
    }}""")
    page=ctx.new_page()
    js_errors=[]
    page.on("pageerror",lambda err:js_errors.append(str(err)[:200]))
    page.goto(ORIGIN,wait_until="domcontentloaded",timeout=45000)
    page.wait_for_timeout(2200)
    # UI rendering-only synthetic class as in verified previous live-browser test.
    # It does not create JWTs, send privileged REST requests or grant actual server access.
    page.evaluate("""() => {
      document.documentElement.classList.add('li-auth-verified');
      const screen=document.getElementById('page-settings');
      if(screen)screen.classList.add('active');
    }""")
    panel=page.locator("#li-react-settings-host")
    panel.wait_for(state="visible",timeout=10000)
    export_btn=panel.locator(".settings-data-actions button").first
    export_btn.wait_for(state="visible",timeout=8000)
    with page.expect_download(timeout=10000) as downloading:
        export_btn.click()
    download=downloading.value
    save_dir=Path(tempfile.mkdtemp(prefix="li-oneoff-backup-"))
    file_path=save_dir/"backup.json"
    shutil.copyfile(download.path(),file_path)
    result=json.loads(file_path.read_text(encoding="utf-8"))
    assert result["schema"]==1
    for key in ["cases","questions","ideas","savedContent","draft"]:
        assert result[key]==FIXTURE[key],f"exported {key} mismatch"
    assert all("token" not in k.lower() and "password" not in k.lower() for k in result)
    print("PASS REAL BROWSER export via visible React Settings button, fake content roundtrip fields",sorted(result.keys()))
    ctx.close()

    restore_context=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
    restore=restore_context.new_page()
    errors=[]
    restore.on("pageerror",lambda err:errors.append(str(err)[:200]))
    restore.on("dialog",lambda dialog:dialog.accept())
    restore.goto(ORIGIN,wait_until="domcontentloaded",timeout=45000)
    restore.wait_for_timeout(2000)
    restore.evaluate("""() => {
      document.documentElement.classList.add('li-auth-verified');
      const screen=document.getElementById('page-settings');
      if(screen)screen.classList.add('active');
    }""")
    settings=restore.locator("#li-react-settings-host")
    settings.wait_for(state="visible",timeout=10000)
    import_btn=settings.locator(".settings-data-actions button").nth(1)
    with restore.expect_file_chooser(timeout=10000) as picking:
        import_btn.click()
    picking.value.set_files(str(file_path))
    restore.wait_for_function("""() => {
      try {return JSON.parse(localStorage.getItem('li.private.library.v1')||'{}').ideas?.[0]?.id==='idea-qa-1';}
      catch {return false;}
    }""",timeout=10000)
    roundtrip=restore.evaluate("""() => ({
      library:JSON.parse(localStorage.getItem('li.private.library.v1')),
      draft:localStorage.getItem('li.private.case-draft.v1')
    })""")
    for key in ["cases","questions","ideas","savedContent"]:
        assert roundtrip["library"][key]==FIXTURE[key],f"restore {key} mismatch"
    assert roundtrip["draft"]==FIXTURE["draft"]
    print("PASS REAL BROWSER import JSON via visible React Settings button, fake local state restored")

    before=roundtrip["library"]
    invalid=save_dir/"bad.json"
    invalid.write_text('{"schema":1,"cases":"malformed","questions":[],"draft":""}',encoding="utf-8")
    restore.locator("#import-personal-data").set_input_files(str(invalid))
    restore.wait_for_timeout(1100)
    after=restore.evaluate("JSON.parse(localStorage.getItem('li.private.library.v1'))")
    assert after==before,"malformed import overwrote local data!"
    assert not errors,f"runtime JS errors {errors}"
    print("PASS malformed JSON rejected with existing saved state untouched, JS errors none")
    restore_context.close()
    browser.close()
