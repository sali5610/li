#!/usr/bin/env python3
"""Read-only Cloudflare Free Web Push prerequisite audit. No resource creation."""
import json
import os
import re
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

BASE = "https://api.cloudflare.com/client/v4"
class Blocker(Exception):
    pass

def api(path, name, allow_404=False):
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    if not re.fullmatch(r"[a-fA-F0-9]{32}", account) or not token:
        raise Blocker("CLOUDFLARE_CREDENTIALS_MISSING_OR_INVALID")
    req = Request(f"{BASE}/accounts/{account}/{path}", headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
        "User-Agent": "li-webpush-free-one-time-preflight",
    })
    try:
        with urlopen(req, timeout=15) as response:
            payload = json.load(response)
    except HTTPError as err:
        if allow_404 and err.code == 404:
            return None
        if err.code in (401, 403):
            raise Blocker(name + "_TOKEN_PERMISSION_OR_SCOPE_MISSING_HTTP_" + str(err.code)) from None
        raise Blocker(name + "_HTTP_" + str(err.code)) from None
    except (URLError, ValueError, OSError):
        raise Blocker(name + "_NOT_REACHABLE") from None
    if not isinstance(payload, dict) or payload.get("success") is not True:
        raise Blocker(name + "_UNVERIFIED")
    return payload.get("result")

def main():
    errors = []
    def probe(name, action):
        try:
            return action()
        except Blocker as exc:
            errors.append(str(exc))
            print("LI_PUSH_SCOPE_" + name + "_BLOCKED")
            return None

    subs = probe("BILLING", lambda: api("subscriptions?per_page=100", "BILLING_READ"))
    if subs is not None:
        if not isinstance(subs, list):
            errors.append("WORKERS_FREE_PLAN_NOT_PROVABLE")
        else:
            paid = [s for s in subs if isinstance(s, dict) and
                    isinstance(s.get("rate_plan"), dict) and
                    "workers" in str(s["rate_plan"].get("id", "")).lower() and
                    "paid" in str(s["rate_plan"].get("id", "")).lower() and
                    s.get("state", s.get("status", "active")) in ("active", "Active", None)]
            if paid:
                errors.append("WORKERS_PAID_SUBSCRIPTION_PRESENT_STOP")
            else:
                print("LI_PUSH_FREE_PLAN_READ_PASS")
    subdomain = probe("WORKER", lambda: api("workers/subdomain", "WORKER_SUBDOMAIN_READ"))
    if subdomain is not None:
        name = subdomain.get("subdomain") if isinstance(subdomain, dict) else None
        if not isinstance(name, str) or not re.fullmatch(r"[a-z0-9-]{1,63}", name):
            errors.append("WORKERS_DEV_SUBDOMAIN_NOT_CONFIGURED")
        else:
            print("LI_PUSH_SUBDOMAIN_READ_PASS")

    databases = probe("D1", lambda: api("d1/database?per_page=100", "D1_DATABASE_LIST"))
    if databases is not None:
        if not isinstance(databases, list):
            errors.append("D1_LIST_UNVERIFIED")
        elif any(d.get("name") == "li-push-staging" for d in databases if isinstance(d, dict)):
            errors.append("PUSH_D1_ALREADY_EXISTS_STOP_TO_AVOID_OVERWRITE")
        elif len(databases) >= 10:
            errors.append("FREE_D1_DATABASE_COUNT_LIMIT")
        else:
            print("LI_PUSH_FREE_D1_SLOT_PASS")

    # 404 means free, absent dedicated Worker. Other failures are blockers.
    def check_script():
        result = api("workers/scripts/li-push-staging", "PUSH_SCRIPT_READ", allow_404=True)
        if result is not None:
            raise Blocker("PUSH_WORKER_ALREADY_EXISTS_STOP_TO_AVOID_VAPID_ROTATION")
        print("LI_PUSH_WORKER_NAME_AVAILABLE_PASS")
    probe("SCRIPT", check_script)

    if errors:
        raise Blocker(" | ".join(errors))
    print("LI_PUSH_PREFLIGHT_PASS - read-only; no resources created")

if __name__ == "__main__":
    try:
        main()
    except Blocker as exc:
        print("LI_PUSH_PREFLIGHT_BLOCKED " + str(exc), file=sys.stderr)
        sys.exit(1)
