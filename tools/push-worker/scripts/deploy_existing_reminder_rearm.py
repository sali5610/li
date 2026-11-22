#!/usr/bin/env python3
"""Deploy the workerd-tested reminder rearm fix to the EXISTING Free Push Worker.

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

HERE = Path(os.environ.get("LI_REARM_WORKER_DIR", Path(__file__).resolve().parents[1])).resolve()
NAME = "li-push-staging"
ORIGIN = "https://li5610.pages.dev"
BASE = "https://api.cloudflare.com/client/v4"
WORKER_URL = "https://li-push-staging.dungho-product.workers.dev/v1/config"
APPROVAL = "LI_REMINDER_REARM_EXISTING_FREE_20261123"
EXPECTED_WORKER_VERSION = "dff4300d-bfbb-4545-b8c3-69c817f9d1be"
EXPECTED_PAGES_SHORT_ID = "229af7c2"
REQUIRED_SECRETS = {"VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"}

class Stop(Exception):
    pass

def cloud(path, token_env="LI_PUSH_CLOUDFLARE_API_TOKEN"):
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    token = os.getenv(token_env, "")
    if not re.fullmatch(r"[a-fA-F0-9]{32}", account) or not token:
        raise Stop("CLOUDFLARE_SCOPED_TOKEN_OR_ACCOUNT_MISSING")
    req = Request(f"{BASE}/accounts/{account}/{path}", headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
        "User-Agent": "li-reminder-exact-live-release/1.0"
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
    if not isinstance(entries, list) or len(entries) != 1 or entries[0].get("cron") != "* * * * *":
        raise Stop("CURRENT_CRON_NOT_APPROVED_ONE_MINUTE")
    if bindings.get("NEON_DATA_API_URL", {}).get("text") != (
        "https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1"
    ):
        raise Stop("LIVE_NEON_URL_MISMATCH")
    print("LI_PUSH_EXISTING_CRON_1M_PASS")
    return db_id

def current_worker_version():
    result = cloud(f"workers/scripts/{NAME}/deployments")
    deployments = result.get("deployments") if isinstance(result, dict) else None
    if not isinstance(deployments, list) or not deployments:
        raise Stop("WORKER_DEPLOYMENTS_NOT_VERIFIABLE")
    versions = deployments[0].get("versions") if isinstance(deployments[0], dict) else None
    if not isinstance(versions, list) or len(versions) != 1:
        raise Stop("WORKER_TRAFFIC_SPLIT_UNEXPECTED")
    v = versions[0]
    if v.get("percentage") != 100 or not re.fullmatch(
        r"[a-fA-F0-9-]{36}", str(v.get("version_id", ""))):
        raise Stop("WORKER_ACTIVE_VERSION_UNKNOWN")
    return v["version_id"]


def current_pages_short_id():
    result = cloud("pages/projects/li5610", "CLOUDFLARE_API_TOKEN")
    deployment = result.get("canonical_deployment") if isinstance(result, dict) else None
    short = deployment.get("short_id") if isinstance(deployment, dict) else None
    if not isinstance(short, str) or not re.fullmatch(r"[a-fA-F0-9]{8}", short):
        raise Stop("PAGES_CANONICAL_DEPLOYMENT_UNKNOWN")
    return short.lower()


def public_key():
    req = Request(WORKER_URL, headers={"Origin": ORIGIN, "Accept": "application/json",
        "User-Agent": "li-reminder-exact-live-release/1.0"})
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

def negative_auth_status(expected, tries=1):
    # Synthetic invalid JWT is refused before Neon or D1, never sending
    # real user data or exposing the bearer token used by a signed session.
    import time
    last = None
    for attempt in range(tries):
        # Well-formed JSON JWT payload with a deliberately INVALID signature.
        # This passes the Worker's local shape check and forces the Neon RPC.
        # Never use a real owner, token, Apple endpoint or private record.
        head = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').decode().rstrip("=")
        payload = base64.urlsafe_b64encode(
            b'{"sub":"li-fake-never-invited-release-check","exp":4102444800}'
        ).decode().rstrip("=")
        synthetic = head + "." + payload + ".invalid-signature"
        req = Request(
            WORKER_URL.replace("/v1/config", "/v1/subscriptions"),
            data=b"{}",
            method="PUT",
            headers={
                "Origin": ORIGIN,
                "Authorization": "Bearer " + synthetic,
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "li-reminder-exact-live-release/1.0"
            }
        )
        try:
            with urlopen(req, timeout=15) as response:
                last = response.status
                allowed = response.headers.get("Access-Control-Allow-Origin")
        except HTTPError as error:
            last = error.code
            allowed = error.headers.get("Access-Control-Allow-Origin")
        except (URLError, OSError):
            raise Stop("LIVE_NEGATIVE_SMOKE_UNREACHABLE") from None
        if last == expected and allowed == ORIGIN:
            return
        if attempt + 1 < tries:
            time.sleep(5)
    raise Stop("LIVE_NEGATIVE_SMOKE_EXPECTED_" + str(expected) +
               "_GOT_" + str(last))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if not args.apply or os.getenv("LI_APPROVED_REMINDER_REARM_RELEASE") != APPROVAL:
        raise Stop("EXPLICIT_REMINDER_RELEASE_APPROVAL_MISSING")
    if os.getenv("GITHUB_EVENT_NAME") != "workflow_dispatch":
        raise Stop("MANUAL_DISPATCH_REQUIRED")

    db_id = inspect()
    if current_worker_version() != EXPECTED_WORKER_VERSION:
        raise Stop("WORKER_LIVE_VERSION_CHANGED_ABORT")
    if current_pages_short_id() != EXPECTED_PAGES_SHORT_ID:
        raise Stop("PAGES_LIVE_DEPLOYMENT_CHANGED_ABORT")
    before_key = public_key()
    negative_auth_status(401)
    print("LI_REMINDER_LIVE_BASELINE_VERIFIED (Worker+Pages unchanged)")
    raw = (HERE / "wrangler.jsonc").read_text(encoding="utf-8")
    marker = "REPLACE_WITH_STAGING_FREE_D1_DATABASE_ID"
    if raw.count(marker) != 1 or '"crons": ["* * * * *"]' not in raw or f'"ALLOWED_ORIGIN": "{ORIGIN}"' not in raw:
        raise Stop("PINNED_WORKER_SOURCE_NOT_APPROVED_REARM_PATCH")
    candidate = HERE / "wrangler.verified-reminder-rearm.jsonc"
    try:
        candidate.write_text(raw.replace(marker, db_id), encoding="utf-8")
        # Wrangler keeps existing secret bindings by default. Do NOT provide
        # --secrets-file, call 'wrangler secret', or regenerate any VAPID key.
        wrangler = HERE / "node_modules" / ".bin" / "wrangler"
        if not wrangler.is_file():
            raise Stop("LOCAL_PINNED_WRANGLER_MISSING")
        worker_env = os.environ.copy()
        worker_env["CLOUDFLARE_API_TOKEN"] = os.getenv("LI_PUSH_CLOUDFLARE_API_TOKEN", "")
        subprocess.run([str(wrangler), "deploy", "--config", str(candidate)],
                       cwd=HERE, env=worker_env, check=True, timeout=180)
        print("LI_REMINDER_EXISTING_WORKER_UPDATED (no secret writes)")
        negative_auth_status(401, tries=7)
        print("LI_REMINDER_NEON_INVALID_SIGNATURE_401_PASS (no D1 write)")
        if current_worker_version() == EXPECTED_WORKER_VERSION:
            raise Stop("WORKER_VERSION_NOT_CHANGED_AFTER_DEPLOY")
        print("LI_REMINDER_NEW_WORKER_VERSION_PASS")
        if public_key() != before_key:
            raise Stop("VAPID_PUBLIC_KEY_CHANGED_UNEXPECTEDLY")
        state = cloud(f"workers/scripts/{NAME}/schedules")
        schedules = state.get("schedules") if isinstance(state, dict) else None
        if not isinstance(schedules, list) or len(schedules) != 1 or schedules[0].get("cron") != "* * * * *":
            raise Stop("WORKER_CRON_1M_NOT_CONFIRMED")
        print("LI_PUSH_LIVE_CRON_1M_UNCHANGED_PASS")
        print("LI_PUSH_VAPID_PRESERVED_PASS")
        print("LI_REMINDER_WORKER_ONLY_DONE_NO_NEW_D1_NO_NEON_NO_PAGES_NO_PAID_UPGRADE")
    finally:
        if candidate.exists():
            candidate.unlink()

if __name__ == "__main__":
    try:
        main()
    except Stop as err:
        print("LI_REMINDER_RELEASE_BLOCKED " + str(err), file=sys.stderr)
        sys.exit(1)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        print("LI_REMINDER_RELEASE_BLOCKED WRANGLER_DEPLOY_FAILED", file=sys.stderr)
        sys.exit(1)
