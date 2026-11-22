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
        return exc.code, dict(exc.headers), None

def main():
    first_failure = None
    for attempt in range(6):
        try:
            status, headers, data = get(ORIGIN)
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
        if attempt == 5:
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
