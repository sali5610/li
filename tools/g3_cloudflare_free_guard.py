#!/usr/bin/env python3
"""Free-only Cloudflare Pages release guard.

No deployment side effects. Checks local files and, when --online is given,
queries this Pages project's *actual* monthly deployment history. Any failure
to verify quota blocks release. This guard does NOT control unrelated projects
or manual dashboard releases outside CI.
"""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import sys
from urllib import error, parse, request

MAX_FILES = 20_000
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_PROJECT_RELEASES_PER_MONTH = 30  # Deliberately below Pages Free's 500 builds/account.
UNSAFE_PARTS = {".git", "node_modules", ".env", "__pycache__", ".venv"}


class GateError(Exception):
    pass


def check_static_assets(directory: Path):
    if not directory.is_dir():
        raise GateError(f"Published directory missing: {directory}")
    entries = [p for p in directory.rglob("*") if p.is_file()]
    if not entries or len(entries) > MAX_FILES:
        raise GateError(f"Expected 1..{MAX_FILES} static files, got {len(entries)}")
    total = 0
    for p in entries:
        relative = p.relative_to(directory)
        if p.is_symlink():
            raise GateError(f"Symlink not allowed in publish directory: {relative}")
        if set(relative.parts) & UNSAFE_PARTS or any(
            piece.startswith(".env") for piece in relative.parts
        ):
            raise GateError(f"Potential secret/development file: {relative}")
        size = p.stat().st_size
        if size > MAX_FILE_BYTES:
            raise GateError(f"Asset exceeds Pages Free 25 MiB limit: {relative}")
        total += size
    if not (directory / "index.html").is_file():
        raise GateError("No index.html in publication root")
    return len(entries), total


def count_current_month_deployments(account: str, project: str, token: str):
    if not (account and project and token):
        raise GateError("Missing Cloudflare credentials/project; fail closed")
    now = dt.datetime.now(dt.timezone.utc)
    month_start = dt.datetime(now.year, now.month, 1, tzinfo=dt.timezone.utc)
    # Count actual deployment attempts (production + preview) but NOT Git push
    # notifications deliberately skipped by Cloudflare Branch control. A
    # skipped event has no build/deployment and must not exhaust the project
    # release budget. A missing/nonboolean is_skipped means fail closed.
    # This project-only safeguard does NOT prove account-wide Free plan usage.
    matched = 0
    skipped = 0
    def scanned():
        print(
            f"LI_FREE_DEPLOYMENT_AUDIT project_attempted={matched} "
            f"skipped_git_events={skipped} records={matched + skipped}"
        )
        return matched
    for page in range(1, 501):
        # Cloudflare documents a 20-result default for Pages deployment lists.
        # Avoid unsupported 100-item pages and still audit both environments.
        query = parse.urlencode({"page": page, "per_page": 20})
        endpoint = (
            "https://api.cloudflare.com/client/v4/accounts/"
            + parse.quote(account, safe="")
            + "/pages/projects/"
            + parse.quote(project, safe="")
            + "/deployments?"
            + query
        )
        req = request.Request(
            endpoint,
            headers={
                "Authorization": "Bearer " + token,
                "Accept": "application/json",
                "User-Agent": "li-free-only-release-guard/1",
            },
        )
        try:
            with request.urlopen(req, timeout=15) as response:
                data = json.load(response)
        except error.HTTPError as exc:
            # GitHub Actions logs must never print tokens, account IDs or response
            # bodies. HTTP status + Cloudflare numeric errors are safe to debug.
            error_codes = []
            try:
                response_error = json.loads(exc.read(4096))
                if isinstance(response_error, dict):
                    error_codes = [
                        str(item["code"])
                        for item in response_error.get("errors", [])[:5]
                        if isinstance(item, dict)
                        and isinstance(item.get("code"), int)
                    ]
            except (ValueError, TypeError, OSError):
                pass
            suffix = " cf_codes=" + ",".join(error_codes) if error_codes else ""
            raise GateError(
                f"Cloudflare deployment listing HTTP {exc.code}{suffix}; "
                "verify Cloudflare Pages Read/Write token permission, "
                "token account scope and Pages project name"
            ) from None
        except error.URLError:
            raise GateError(
                "Cannot reach Cloudflare deployment API (network/TLS/DNS); fail closed"
            ) from None
        except (ValueError, TypeError, OSError):
            raise GateError(
                "Cloudflare deployment API returned invalid JSON; fail closed"
            ) from None
        if not isinstance(data, dict) or data.get("success") is not True:
            raise GateError("Cloudflare API did not confirm successful deployment listing")
        records = data.get("result")
        if not isinstance(records, list):
            raise GateError("Unexpected Cloudflare deployment response; fail closed")
        for item in records:
            stamp = item.get("created_on") if isinstance(item, dict) else None
            if not isinstance(stamp, str):
                raise GateError("Unknown deployment timestamp; fail closed")
            try:
                moment = dt.datetime.fromisoformat(stamp.replace("Z", "+00:00"))
                if moment.tzinfo is None:
                    raise ValueError("timezone missing")
            except ValueError as exc:
                raise GateError("Unparseable deployment timestamp; fail closed") from exc
            if moment >= month_start:
                skip_flag = item.get("is_skipped")
                if type(skip_flag) is not bool:
                    raise GateError(
                        "Cloudflare deployment lacks boolean is_skipped; fail closed"
                    )
                if skip_flag:
                    skipped += 1
                else:
                    matched += 1
        if matched >= MAX_PROJECT_RELEASES_PER_MONTH:
            scanned()
            raise GateError(
                f"Project has {matched} non-skipped deployment attempts "
                f"this UTC month; release budget is {MAX_PROJECT_RELEASES_PER_MONTH}"
            )
        info = data.get("result_info", {})
        if isinstance(info, dict):
            total_pages = info.get("total_pages")
            if isinstance(total_pages, int) and page >= total_pages:
                return scanned()
        if len(records) < 20:
            return scanned()
    raise GateError("More than 10,000 project deployments; could not safely audit")


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("--site", default="site")
    cli.add_argument("--online", action="store_true",
                     help="Required before uploading; query Cloudflare account")
    args = cli.parse_args()
    try:
        files, size = check_static_assets(Path(args.site))
        print(f"LI_FREE_ASSETS_PASS files={files} total_bytes={size}")
        if args.online:
            count = count_current_month_deployments(
                os.getenv("CLOUDFLARE_ACCOUNT_ID", ""),
                os.getenv("CLOUDFLARE_PAGES_PROJECT", ""),
                os.getenv("CLOUDFLARE_API_TOKEN", ""),
            )
            print(
                f"LI_FREE_RELEASE_BUDGET_PASS project_used={count} "
                f"project_limit={MAX_PROJECT_RELEASES_PER_MONTH}"
            )
        else:
            print("LOCAL_PRECHECK_ONLY — cloud release count NOT VERIFIED")
    except GateError as err:
        print(f"LI_FREE_RELEASE_BLOCKED {err}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
