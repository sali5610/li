#!/usr/bin/env python3
"""Explicitly approved one-shot Free Push setup. No other Cloudflare/Neon changes.

Create ONE named new D1, apply its existing small schema, generate private VAPID
keys in the ephemeral GitHub runner and deploy ONE named Workers Free candidate.
Do not save secret values, DB IDs or signed user data to GitHub source.
"""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from free_setup_preflight import api, main as preflight, Blocker

ROOT = Path(__file__).resolve().parents[1]
NAME = "li-push-staging"
ORIGIN = "https://li5610.pages.dev"
BASE = "https://api.cloudflare.com/client/v4"

def create_free_d1():
    # Recover the DB created by the first approved setup attempt if migration
    # failed. Never create an additional DB or rotate a live Worker silently.
    databases = api("d1/database?per_page=100", "D1_DATABASE_LIST")
    existing = [d for d in databases if isinstance(d, dict) and d.get("name") == NAME]
    if existing:
        if len(existing) != 1 or not re.fullmatch(r"[0-9a-fA-F-]{36}", str(existing[0].get("uuid", ""))):
            raise Blocker("D1_RESUME_IDENTITY_UNVERIFIED")
        print("LI_PUSH_REUSING_EXISTING_D1 (ID redacted)")
        return existing[0]["uuid"]
    account = os.environ["CLOUDFLARE_ACCOUNT_ID"]
    token = os.environ["CLOUDFLARE_API_TOKEN"]
    request = Request(
        f"{BASE}/accounts/{account}/d1/database",
        method="POST",
        data=json.dumps({"name": NAME}).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + token,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "li-free-webpush-approved-setup",
        },
    )
    try:
        with urlopen(request, timeout=20) as reply:
            result = json.load(reply)
    except HTTPError as exc:
        raise Blocker("D1_CREATE_FAILED_HTTP_" + str(exc.code)) from None
    except (URLError, OSError, ValueError):
        raise Blocker("D1_CREATE_FAILED_UNVERIFIED") from None
    item = result.get("result") if isinstance(result, dict) and result.get("success") is True else None
    uuid = item.get("uuid") if isinstance(item, dict) else None
    if not isinstance(uuid, str) or not re.fullmatch(r"[0-9a-fA-F-]{36}", uuid):
        raise Blocker("D1_CREATE_MISSING_UUID")
    print("LI_PUSH_D1_CREATED (ID redacted)")
    return uuid

def make_vapid():
    script = (
        "const crypto=require('node:crypto');"
        "const e=crypto.createECDH('prime256v1');e.generateKeys();"
        "process.stdout.write(JSON.stringify({"
        "VAPID_PUBLIC_KEY:e.getPublicKey().toString('base64url'),"
        "VAPID_PRIVATE_KEY:e.getPrivateKey().toString('base64url'),"
        "VAPID_SUBJECT:'https://li5610.pages.dev'}));"
    )
    keys = json.loads(subprocess.check_output(["node", "-e", script], text=True))
    if len(keys["VAPID_PUBLIC_KEY"]) != 87 or len(keys["VAPID_PRIVATE_KEY"]) not in (43, 44):
        raise Blocker("VAPID_KEY_GENERATION_INVALID")
    print("LI_PUSH_VAPID_GENERATED_IN_RUNNER (values never printed)")
    return keys

def run_command(*args):
    subprocess.run(list(args), cwd=str(ROOT), check=True, timeout=180)

def http_smoke(worker_url, public_key):
    def call(origin, path="/v1/config"):
        req = Request(worker_url + path, headers={"Origin": origin, "Accept": "application/json"})
        try:
            with urlopen(req, timeout=12) as response:
                return response.status, json.load(response)
        except HTTPError as exc:
            return exc.code, None
        except (URLError, OSError, ValueError):
            raise Blocker("PUSH_LIVE_HTTP_SMOKE_UNREACHABLE") from None
    status, data = call(ORIGIN)
    if status != 200 or not isinstance(data, dict) or data.get("available") is not True or data.get("vapidPublicKey") != public_key:
        raise Blocker("PUSH_LIVE_CONFIG_SMOKE_FAILED")
    status, _ = call("https://untrusted.example.test")
    if status != 403:
        raise Blocker("PUSH_LIVE_CORS_DENIAL_FAILED")
    print("LI_PUSH_LIVE_INFRA_SMOKE_PASS config=200 wrong-origin=403")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if not args.apply or os.getenv("LI_APPROVED_SETUP") != "FREE_WEBPUSH_20261122":
        raise Blocker("EXPLICIT_PO_APPROVAL_GUARD_MISSING")
    preflight(allow_existing_d1=True)
    name = api("workers/subdomain", "WORKER_SUBDOMAIN_READ")["subdomain"]
    if not re.fullmatch(r"[a-z0-9-]{1,63}", name):
        raise Blocker("WORKER_SUBDOMAIN_INVALID")
    config_path = ROOT / "wrangler.approved-once.jsonc"
    secrets_path = None
    try:
        db_id = create_free_d1()
        config = (ROOT / "wrangler.jsonc").read_text(encoding="utf-8")
        marker = "REPLACE_WITH_STAGING_FREE_D1_DATABASE_ID"
        if config.count(marker) != 1 or '"ALLOWED_ORIGIN": "https://li5610.pages.dev"' not in config:
            raise Blocker("PUSH_SOURCE_CONFIG_CHANGED")
        config_path.write_text(config.replace(marker, db_id), encoding="utf-8")
        # Wrangler v4 does not support --yes here: CI/non-interactive mode
        # skips the confirmation prompt for a remote migration.
        run_command("npx", "wrangler", "d1", "migrations", "apply", "PUSH_DB",
                    "--remote", "--config", str(config_path))
        print("LI_PUSH_D1_EMPTY_SCHEMA_APPLIED")
        keys = make_vapid()
        fd, filename = tempfile.mkstemp(prefix=".li-vapid-", suffix=".json", dir=str(ROOT))
        secrets_path = Path(filename)
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(keys, file)
        run_command("npx", "wrangler", "deploy", "--config", str(config_path),
                    "--secrets-file", str(secrets_path))
        print("LI_PUSH_FREE_WORKER_DEPLOYED")
        url = f"https://{NAME}.{name}.workers.dev"
        http_smoke(url, keys["VAPID_PUBLIC_KEY"])
        print("LI_PUSH_PUBLIC_WORKER_URL=" + url)
        print("LI_PUSH_SETUP_PASS: dedicated Worker only. Pages production unchanged.")
    finally:
        if config_path.exists():
            config_path.unlink()
        if secrets_path and secrets_path.exists():
            secrets_path.unlink()

if __name__ == "__main__":
    try:
        main()
    except (Blocker, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        code = str(exc) if isinstance(exc, Blocker) else "WRANGLER_COMMAND_FAILED"
        print("LI_PUSH_SETUP_BLOCKED " + code, file=sys.stderr)
        sys.exit(1)
