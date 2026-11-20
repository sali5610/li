#!/usr/bin/env python3
"""Read-only pre-release check of Cloudflare Pages production AI bindings.

Uses the existing GitHub Actions Pages API token. Never logs values, project IDs,
private email, cookies or response bodies; no Cloudflare changes or AI calls.
Fails closed if names are missing. Does NOT prove Workers plan, D1 migration,
real Neon sessions or actual inference.
"""
import json
import os
import sys
from urllib import error, parse, request


def verify(config: dict):
    prod = config.get("deployment_configs", {}).get("production")
    if not isinstance(prod, dict):
        raise ValueError("LI_AI_PRODUCTION_CONFIG_MISSING")
    ai = prod.get("ai_bindings")
    if not isinstance(ai, dict) or not isinstance(ai.get("AI"), dict):
        raise ValueError("LI_AI_BINDING_MISSING")
    d1 = prod.get("d1_databases")
    binding = d1.get("LI_AI_DB") if isinstance(d1, dict) else None
    if not isinstance(binding, dict) or not binding.get("id"):
        raise ValueError("LI_AI_D1_BINDING_MISSING")
    env_vars = prod.get("env_vars")
    if not isinstance(env_vars, dict):
        raise ValueError("LI_AI_PRIVATE_VARIABLES_MISSING")
    for name in ("NEON_AUTH_COOKIE_SECRET", "LI_AI_OWNER_EMAIL"):
        value = env_vars.get(name)
        if not isinstance(value, dict) or value.get("type") != "secret_text":
            raise ValueError("LI_AI_SECRET_NOT_CONFIGURED_" + name)
    return True


def main():
    token = os.getenv("CLOUDFLARE_API_TOKEN")
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    project = os.getenv("CLOUDFLARE_PAGES_PROJECT")
    if not all((token, account, project)):
        raise ValueError("LI_AI_CLOUDFLARE_ACCESS_MISSING")
    api_url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        + parse.quote(account, safe="")
        + "/pages/projects/"
        + parse.quote(project, safe="")
    )
    req = request.Request(api_url, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
        "User-Agent": "li-ai-free-release-preflight/1",
    })
    try:
        with request.urlopen(req, timeout=12) as response:
            payload = json.load(response)
    except error.HTTPError as exc:
        raise ValueError(f"LI_AI_PROJECT_READ_HTTP_{exc.code}") from None
    except (error.URLError, ValueError, OSError):
        raise ValueError("LI_AI_PROJECT_READ_FAILED") from None
    if not isinstance(payload, dict) or payload.get("success") is not True:
        raise ValueError("LI_AI_PROJECT_NOT_VERIFIED")
    result = payload.get("result")
    if not isinstance(result, dict):
        raise ValueError("LI_AI_PROJECT_DATA_MISSING")
    verify(result)
    print("PASS production AI + D1 binding names and private secret flags present")
    print("NOT proof of Workers Free plan, D1 schema, JWT invite, or model inference")


if __name__ == "__main__":
    try:
        main()
    except ValueError as exc:
        print("FAIL " + str(exc), file=sys.stderr)
        sys.exit(1)
