#!/usr/bin/env python3
"""Update only the existing approved li. Free Push Worker and its Cron.

Never create D1, rotate VAPID, touch Neon/Pages, or print any secret.
Invocation is guarded by an exact Human PO approval token in the environment.
"""
import argparse
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

HERE = Path(__file__).resolve().parents[1]
NAME = "li-push-staging"
ORIGIN = "https://li5610.pages.dev"
BASE = "https://api.cloudflare.com/client/v4"
WORKER_URL = "https://li-push-staging.dungho-product.workers.dev/v1/config"
APPROVAL = "LI_PUSH_CRON_1M_EXISTING_ONLY_20261122"
REQUIRED_SECRETS = {"VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"}

class Stop(Exception):
    pass

def cloud(path):
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    token = os.getenv("CLOUDFLARE_API_TOKEN", "")
    if not re.fullmatch(r"[a-fA-F0-9]{32}", account) or not token:
        raise Stop("CLOUDFLARE_SCOPED_TOKEN_OR_ACCOUNT_MISSING")
    req = Request(f"{BASE}/accounts/{account}/{path}", headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
        "User-Agent": "li-existing-free-push-minute-update/1.0"
    })
    try:
        with urlopen(req, timeout=20) as response:
            obj = json.load(response)
    except HTTPError as err:
        raise Stop("CLOUDFLARE_READ_HTTP_" + str(err.code)) from None
    except (ValueError, OSError, URLError):
        raise Stop("CLOUDFLARE_READ_UNREACHABLE") from None
    if not isinstance(obj, dict) or obj.get("success") is not True:
        raise Stop("CLOUDFLARE_READ_UNVERIFIED")
    return obj.get("result")

def inspect():
    paid = cloud("subscriptions")
    if not isinstance(paid, list):
        raise Stop("FREE_PLAN_UNKNOWN")
    for sub in paid:
        if not isinstance(sub, dict):
            raise Stop("SUBSCRIPTION_FORMAT_UNKNOWN")
        plan = sub.get("rate_plan")
        if isinstance(plan, dict) and "workers" in str(plan.get("id", "")).lower():
            if "free" not in str(plan.get("id", "")).lower() and str(sub.get("state", "")).lower() not in ("cancelled", "expired", "failed"):
                raise Stop("PAID_WORKERS_PLAN_PRESENT")
    print("LI_PUSH_ACCOUNT_FREE_PASS")

    dbs = cloud("d1/database?per_page=100")
    if not isinstance(dbs, list):
        raise Stop("PUSH_DB_LIST_UNKNOWN")
    found = [d for d in dbs if isinstance(d, dict) and d.get("name") == NAME]
    if len(found) != 1:
        raise Stop("PUSH_DB_NOT_UNIQUELY_PRESENT")
    db_id = found[0].get("uuid")
    if not isinstance(db_id, str) or not re.fullmatch(r"[a-fA-F0-9-]{36}", db_id):
        raise Stop("PUSH_DB_ID_UNKNOWN")
    print("LI_PUSH_EXISTING_D1_PASS (ID redacted)")

    settings = cloud(f"workers/scripts/{NAME}/settings")
    if not isinstance(settings, dict) or not isinstance(settings.get("bindings"), list):
        raise Stop("WORKER_SETTINGS_UNVERIFIED")
    bindings = {b.get("name"): b for b in settings["bindings"] if isinstance(b, dict) and isinstance(b.get("name"), str)}
    if not REQUIRED_SECRETS.issubset({k for k,b in bindings.items() if b.get("type") == "secret_text"}):
        raise Stop("VAPID_SECRET_BINDINGS_MISSING")
    database = bindings.get("PUSH_DB")
    if not database or database.get("type") != "d1" or database.get("id") != db_id:
        raise Stop("PUSH_WORKER_D1_BINDING_MISMATCH")
    if bindings.get("ALLOWED_ORIGIN", {}).get("text") != ORIGIN:
        raise Stop("PUSH_WORKER_ORIGIN_MISMATCH")
    print("LI_PUSH_EXISTING_BINDINGS_PASS (VAPID values not read)")

    cron = cloud(f"workers/scripts/{NAME}/schedules")
    entries = cron.get("schedules") if isinstance(cron, dict) else None
    if not isinstance(entries, list) or len(entries) != 1 or entries[0].get("cron") != "*/5 * * * *":
        raise Stop("CURRENT_CRON_NOT_THE_APPROVED_FIVE_MINUTES")
    print("LI_PUSH_EXISTING_CRON_5M_PASS")
    return db_id

def public_key():
    req = Request(WORKER_URL, headers={"Origin": ORIGIN, "Accept": "application/json",
        "User-Agent": "li-existing-free-push-minute-update/1.0"})
    try:
        with urlopen(req, timeout=15) as response:
            obj = json.load(response)
            if response.status != 200 or not isinstance(obj, dict) or obj.get("available") is not True:
                raise Stop("PUSH_WORKER_HTTP_NOT_READY")
    except (HTTPError, OSError, URLError, ValueError):
        raise Stop("PUSH_WORKER_PUBLIC_CONFIG_UNAVAILABLE") from None
    key = obj.get("vapidPublicKey")
    if not isinstance(key, str):
        raise Stop("PUBLIC_VAPID_MISSING")
    try:
        point = base64.urlsafe_b64decode(key + "=" * (-len(key) % 4))
    except ValueError:
        raise Stop("PUBLIC_VAPID_INVALID") from None
    if len(point) != 65 or point[0] != 4:
        raise Stop("PUBLIC_VAPID_INVALID")
    return key

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if not args.apply or os.getenv("LI_APPROVED_CRON_CHANGE") != APPROVAL:
        raise Stop("EXPLICIT_WORKER_CRON_APPROVAL_MISSING")

    db_id = inspect()
    before_key = public_key()
    raw = (HERE / "wrangler.jsonc").read_text(encoding="utf-8")
    marker = "REPLACE_WITH_STAGING_FREE_D1_DATABASE_ID"
    if raw.count(marker) != 1 or '"crons": ["* * * * *"]' not in raw or f'"ALLOWED_ORIGIN": "{ORIGIN}"' not in raw:
        raise Stop("PINNED_WORKER_SOURCE_NOT_THE_APPROVED_MINUTE_UPDATE")
    candidate = HERE / "wrangler.verified-minute.jsonc"
    try:
        candidate.write_text(raw.replace(marker, db_id), encoding="utf-8")
        # Wrangler keeps existing secret bindings by default. Do NOT provide
        # --secrets-file, call 'wrangler secret', or regenerate any VAPID key.
        subprocess.run(["npx", "wrangler", "deploy", "--config", str(candidate)],
                       cwd=HERE, check=True, timeout=180)
        print("LI_PUSH_EXISTING_WORKER_UPDATED (no secret writes)")
        if public_key() != before_key:
            raise Stop("VAPID_PUBLIC_KEY_CHANGED_UNEXPECTEDLY")
        state = cloud(f"workers/scripts/{NAME}/schedules")
        schedules = state.get("schedules") if isinstance(state, dict) else None
        if not isinstance(schedules, list) or len(schedules) != 1 or schedules[0].get("cron") != "* * * * *":
            raise Stop("WORKER_CRON_1M_NOT_CONFIRMED")
        print("LI_PUSH_LIVE_CRON_1M_PASS (provider propagation may take up to 15 minutes)")
        print("LI_PUSH_VAPID_PRESERVED_PASS")
        print("LI_PUSH_NO_NEW_D1_NO_NEON_NO_PAGES_NO_PAID_UPGRADE")
    finally:
        if candidate.exists():
            candidate.unlink()

if __name__ == "__main__":
    try:
        main()
    except Stop as err:
        print("LI_PUSH_UPDATE_BLOCKED " + str(err), file=sys.stderr)
        sys.exit(1)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        print("LI_PUSH_UPDATE_BLOCKED WRANGLER_DEPLOY_FAILED", file=sys.stderr)
        sys.exit(1)
