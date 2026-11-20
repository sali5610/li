#!/usr/bin/env python3
"""Read-only Auth-only release guard: requires a configured Cloudflare Pages
production secret, without reading or logging its value. No AI/D1 dependency."""
import json
import os
import sys
from urllib import error, parse, request


def verify(config):
    production = config.get("deployment_configs", {}).get("production")
    if not isinstance(production, dict):
        raise ValueError("LI_AUTH_PRODUCTION_CONFIG_MISSING")
    env_vars = production.get("env_vars")
    secret = env_vars.get("NEON_AUTH_COOKIE_SECRET") if isinstance(env_vars, dict) else None
    if not isinstance(secret, dict) or secret.get("type") != "secret_text":
        raise ValueError("LI_AUTH_COOKIE_SECRET_NOT_CONFIGURED")
    return True


def main():
    token = os.getenv("CLOUDFLARE_API_TOKEN")
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    project = os.getenv("CLOUDFLARE_PAGES_PROJECT")
    if not (token and account and project):
        raise ValueError("LI_AUTH_CLOUDFLARE_ACCESS_MISSING")
    endpoint = (
        "https://api.cloudflare.com/client/v4/accounts/"
        + parse.quote(account, safe="")
        + "/pages/projects/"
        + parse.quote(project, safe="")
    )
    req = request.Request(endpoint, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
        "User-Agent": "li-auth-only-release-guard/1",
    })
    try:
        with request.urlopen(req, timeout=12) as response:
            payload = json.load(response)
    except error.HTTPError as exc:
        raise ValueError("LI_AUTH_PROJECT_READ_HTTP_" + str(exc.code)) from None
    except (error.URLError, ValueError, OSError):
        raise ValueError("LI_AUTH_PROJECT_READ_FAILED") from None
    if not isinstance(payload, dict) or payload.get("success") is not True:
        raise ValueError("LI_AUTH_PROJECT_NOT_VERIFIED")
    project_info = payload.get("result")
    if not isinstance(project_info, dict):
        raise ValueError("LI_AUTH_PROJECT_DATA_MISSING")
    verify(project_info)
    print("PASS Cloudflare production Auth cookie secret binding present (read-only)")
    print("NOT proof of live OAuth login, invite authorization, or iPhone PWA session")


if __name__ == "__main__":
    try:
        main()
    except ValueError as exc:
        print("FAIL " + str(exc), file=sys.stderr)
        sys.exit(1)
