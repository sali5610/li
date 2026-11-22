#!/usr/bin/env python3
"""Read-only script-level route and binding availability check, no secret values."""
from free_setup_preflight import api, Blocker

def main():
    obj = api("workers/scripts/li-push-staging/subdomain", "PUSH_SUBDOMAIN")
    if not isinstance(obj, dict):
        raise Blocker("PUSH_SCRIPT_SUBDOMAIN_NOT_FOUND")
    enabled, previews = obj.get("enabled"), obj.get("previews_enabled")
    if not isinstance(enabled, bool):
        raise Blocker("PUSH_SCRIPT_SUBDOMAIN_STATE_UNKNOWN")
    print("LI_PUSH_SUBDOMAIN_STATUS enabled=" + str(enabled).lower() +
          " previews_enabled=" + (str(previews).lower() if isinstance(previews, bool) else "unknown"))
    if not enabled:
        raise Blocker("PUSH_SCRIPT_SUBDOMAIN_DISABLED")

if __name__ == "__main__":
    try:
        main()
    except Blocker as err:
        print("LI_PUSH_ROUTE_DIAGNOSTIC_BLOCKED " + str(err))
        raise SystemExit(1)
