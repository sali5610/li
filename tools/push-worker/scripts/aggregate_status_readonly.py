#!/usr/bin/env python3
"""Aggregate-only read of existing Push D1 to diagnose missing iPhone delivery.

Never fetch or print owner IDs, endpoints, schedules, push keys, JWTs or rows.
Never mutate D1/Worker/Pages.
"""
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

NAME = "li-push-staging"

def call(path, body=None):
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    token = os.getenv("CLOUDFLARE_API_TOKEN", "")
    if not re.fullmatch(r"[a-fA-F0-9]{32}", account) or not token:
        raise RuntimeError("CLOUDFLARE_ACCESS_MISSING")
    url = "https://api.cloudflare.com/client/v4/accounts/" + account + "/" + path
    headers = {
        "Authorization": "Bearer " + token, "Accept": "application/json",
        "User-Agent": "li-push-aggregate-qa/1.0 (+https://li5610.pages.dev)"
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
    request = Request(url, headers=headers,
                      data=json.dumps(body).encode() if body is not None else None,
                      method="POST" if body is not None else "GET")
    try:
        with urlopen(request, timeout=20) as response:
            result = json.load(response)
    except HTTPError as exc:
        raise RuntimeError("CLOUDFLARE_AGGREGATE_HTTP_" + str(exc.code)) from None
    except (URLError, ValueError, OSError):
        raise RuntimeError("CLOUDFLARE_AGGREGATE_UNREACHABLE") from None
    if not isinstance(result, dict) or result.get("success") is not True:
        raise RuntimeError("CLOUDFLARE_AGGREGATE_UNVERIFIED")
    return result["result"]

def main():
    databases = call("d1/database?per_page=100")
    existing = [item for item in databases if
                isinstance(item, dict) and item.get("name") == NAME]
    if len(existing) != 1:
        raise RuntimeError("EXPECTED_ONE_EXISTING_PUSH_D1")
    db_id = existing[0].get("uuid")
    if not isinstance(db_id, str) or not re.fullmatch(r"[a-fA-F0-9-]{36}", db_id):
        raise RuntimeError("PUSH_D1_ID_UNVERIFIED")

    # One read-only query, no sensitive columns or per-user rows requested.
    sql = """SELECT COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END),0) AS enabled,
         COALESCE(SUM(CASE WHEN last_day IS NOT NULL AND last_day <> '' THEN 1 ELSE 0 END),0) AS marked,
         COALESCE(SUM(CASE WHEN updated_at >= datetime('now', '-24 hours') THEN 1 ELSE 0 END),0) AS updated_24h
         FROM push_subscriptions"""
    result = call("d1/database/" + db_id + "/query", {"sql": sql, "params": []})
    if not isinstance(result, list) or len(result) != 1:
        raise RuntimeError("D1_AGGREGATE_UNEXPECTED")
    rows = result[0].get("results")
    if not isinstance(rows, list) or len(rows) != 1:
        raise RuntimeError("D1_AGGREGATE_NO_ROW")
    row = rows[0]
    for key in ("total", "enabled", "marked", "updated_24h"):
        value = row.get(key)
        if not isinstance(value, int) or value < 0:
            raise RuntimeError("D1_AGGREGATE_INVALID_" + key)
    if row["enabled"] > row["total"] or row["marked"] > row["total"]:
        raise RuntimeError("D1_AGGREGATE_INVALID_COUNTS")
    print("LI_PUSH_D1_AGGREGATE_PASS total=" + str(row["total"]) +
          " enabled=" + str(row["enabled"]) +
          " claimed_at_least_once=" + str(row["marked"]) +
          " updated_24h=" + str(row["updated_24h"]))
    print("NOTE: A last_day claim means an attempt was queued; it does NOT prove APNs accepted or displayed a notification.")
    print("READ_ONLY: no endpoint, keys, user identity, schedule or notification data fetched.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("LI_PUSH_D1_AGGREGATE_BLOCKED " + str(exc), file=sys.stderr)
        raise SystemExit(1)
