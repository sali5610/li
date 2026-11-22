#!/usr/bin/env python3
"""Read-only, non-secret checks against the already deployed approved Push Worker."""
import base64
import json
import sys
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

URL = "https://li-push-staging.dungho-product.workers.dev"
ORIGIN = "https://li5610.pages.dev"

def get(origin, path="/v1/config", method="GET", data=None):
    request = Request(URL + path, method=method, data=data, headers={
        "Origin": origin, "Accept": "application/json",
        **({"Content-Type": "application/json"} if data is not None else {})
    })
    try:
        with urlopen(request, timeout=12) as response:
            body = response.read(8192)
            return response.status, dict(response.headers), json.loads(body) if body else None
    except HTTPError as exc:
        # Classify edge HTML vs first-party Worker JSON without logging private values.
        try:
            payload = json.loads(exc.read(2048))
            if isinstance(payload, dict):
                safe = {k: payload.get(k) for k in ("ok", "available") if k in payload}
                if not safe:
                    safe = {"_keys": sorted(payload.keys()),
                            "_numeric_error_codes": [e.get("code") for e in payload.get("errors", [])
                                if isinstance(e, dict) and isinstance(e.get("code"), int)]
                            if isinstance(payload.get("errors"), list) else [],
                            "_edge_error_code": payload.get("error_code"),
                            "_edge_error_name": payload.get("error_name"),
                            "_edge_error_category": payload.get("error_category"),
                            "_retryable": payload.get("retryable")}
                payload = safe
            else:
                payload = None
        except (ValueError, OSError):
            payload = None
        return exc.code, dict(exc.headers), payload

def main():
    first_failure = None
    for attempt in range(2):
        try:
            status, headers, data = get(ORIGIN)
            print("LI_PUSH_CONFIG_PROBE status=" + str(status) +
                  " content_type=" + str(headers.get("Content-Type", "missing")).split(";")[0] +
                  " json_kind=" + ("worker_error" if isinstance(data, dict) and data.get("ok") is False else
                                  "available" if isinstance(data, dict) and data.get("available") is True else "other") +
                  " server=" + str(headers.get("Server", "missing")) +
                  " response_keys=" + str(data.get("_keys", []) if isinstance(data, dict) else []) +
                  " cf_error_codes=" + str(data.get("_numeric_error_codes", []) if isinstance(data, dict) else []) +
                  " edge_code=" + str(data.get("_edge_error_code", "none") if isinstance(data, dict) else "none") +
                  " edge_name=" + str(data.get("_edge_error_name", "none") if isinstance(data, dict) else "none") +
                  " edge_category=" + str(data.get("_edge_error_category", "none") if isinstance(data, dict) else "none") +
                  " retryable=" + str(data.get("_retryable", "none") if isinstance(data, dict) else "none"))
            if status == 200 and isinstance(data, dict) and data.get("available") is True:
                public = data.get("vapidPublicKey")
                padded = public + "=" * (-len(public) % 4) if isinstance(public, str) else ""
                point = base64.urlsafe_b64decode(padded) if padded else b""
                if (len(point) == 65 and point[0] == 4 and
                    headers.get("Access-Control-Allow-Origin") == ORIGIN and
                    headers.get("Cache-Control") == "no-store"):
                    print("LI_PUSH_LIVE_CONFIG_PASS (200, restricted CORS, P-256 VAPID)")
                    break
            first_failure = "CONFIG_NOT_READY_HTTP_" + str(status)
        except (URLError, OSError, ValueError):
            first_failure = "CONFIG_NETWORK_OR_FORMAT_ERROR"
        if attempt == 1:
            raise RuntimeError(first_failure)
        time.sleep(3)
    if get("https://untrusted.example.test")[0] != 403:
        raise RuntimeError("WRONG_ORIGIN_NOT_BLOCKED")
    print("LI_PUSH_CORS_DENY_PASS")
    if get(ORIGIN, path="/v1/subscriptions", method="OPTIONS")[0] != 204:
        raise RuntimeError("PREFLIGHT_OPTIONS_NOT_READY")
    print("LI_PUSH_OPTIONS_PASS")
    if get(ORIGIN, path="/v1/subscriptions", method="PUT", data=b"{}")[0] != 403:
        raise RuntimeError("UNAUTH_SUBSCRIPTION_NOT_REJECTED")
    print("LI_PUSH_UNAUTH_SUBSCRIBE_BLOCKED_PASS")
    print("LI_PUSH_LIVE_WORKER_SMOKE_PASS; no JWT, subscriptions or D1 rows used")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("LI_PUSH_LIVE_WORKER_SMOKE_BLOCKED " + str(exc), file=sys.stderr)
        sys.exit(1)
