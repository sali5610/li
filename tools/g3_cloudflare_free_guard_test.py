#!/usr/bin/env python3
"""Offline unit tests for Cloudflare free deployment guard; zero network and no releases."""
import contextlib
import datetime as dt
import io
import json
import os
from urllib import error, parse
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import g3_cloudflare_free_guard as guard


class FreeGuardTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.site = Path(self.tmp.name) / "site"
        self.site.mkdir()
        (self.site / "index.html").write_text("<html></html>", encoding="utf-8")

    def test_allows_a_small_valid_static_site(self):
        self.assertEqual(guard.check_static_assets(self.site)[0], 1)

    def test_rejects_env_secrets_and_development_directories(self):
        (self.site / ".env.production").write_text("SECRET=untrusted")
        with self.assertRaises(guard.GateError):
            guard.check_static_assets(self.site)
        (self.site / ".env.production").unlink()
        (self.site / "node_modules").mkdir()
        (self.site / "node_modules" / "package.js").write_text("bad")
        with self.assertRaises(guard.GateError):
            guard.check_static_assets(self.site)

    def test_rejects_missing_index_and_oversized_asset(self):
        (self.site / "index.html").unlink()
        with self.assertRaises(guard.GateError):
            guard.check_static_assets(self.site)
        (self.site / "index.html").write_text("<html></html>")
        with (self.site / "large.data").open("wb") as file:
            file.truncate(guard.MAX_FILE_BYTES + 1)
        with self.assertRaises(guard.GateError):
            guard.check_static_assets(self.site)

    def test_rejects_bad_symlink(self):
        source = Path(self.tmp.name) / "outside"
        source.write_text("outside")
        (self.site / "other").symlink_to(source)
        with self.assertRaises(guard.GateError):
            guard.check_static_assets(self.site)

    def test_rejects_missing_cloudflare_account_credentials(self):
        with self.assertRaises(guard.GateError):
            guard.count_current_month_deployments("", "", "")

    @staticmethod
    def fake_result(count, *, success=True):
        timestamp = dt.datetime.now(dt.timezone.utc).isoformat()
        return json.dumps({
            "success": success,
            "result": [{"created_on": timestamp}] * count,
            "result_info": {"total_pages": 1},
        }).encode()

    def test_passes_with_less_than_30_project_deployments(self):
        with patch.object(guard.request, "urlopen") as fetch:
            fetch.return_value.__enter__.return_value.read.return_value = self.fake_result(29)
            self.assertEqual(guard.count_current_month_deployments("account","li","token"), 29)

    def test_fails_closed_at_project_release_budget(self):
        with patch.object(guard.request, "urlopen") as fetch:
            fetch.return_value.__enter__.return_value.read.return_value = self.fake_result(30)
            with self.assertRaises(guard.GateError):
                guard.count_current_month_deployments("account","li","token")

    def test_fails_closed_on_cloudflare_api_error(self):
        with patch.object(guard.request, "urlopen") as fetch:
            fetch.return_value.__enter__.return_value.read.return_value = b'{"success":false,"result":[]}'
            with self.assertRaises(guard.GateError):
                guard.count_current_month_deployments("account","li","token")

    def test_deployment_listing_uses_documented_small_pages(self):
        with patch.object(guard.request, "urlopen") as fetch:
            fetch.return_value.__enter__.return_value.read.return_value = self.fake_result(1)
            self.assertEqual(guard.count_current_month_deployments("account", "li", "token"), 1)
            sent = fetch.call_args.args[0]
            query = parse.parse_qs(parse.urlsplit(sent.full_url).query)
            self.assertEqual(query["per_page"], ["20"])

    def test_http_error_surfaces_only_status_and_numeric_cloudflare_codes(self):
        unsafe = b'{"errors":[{"code":10000,"message":"SECRET_DO_NOT_LOG"}]}'
        with patch.object(guard.request, "urlopen", side_effect=error.HTTPError(
            "https://api.cloudflare.com/forbidden", 403,
            "SECRET_DO_NOT_LOG", {}, io.BytesIO(unsafe)
        )):
            with self.assertRaises(guard.GateError) as raised:
                guard.count_current_month_deployments("account", "li", "token")
            self.assertIn("HTTP 403", str(raised.exception))
            self.assertIn("cf_codes=10000", str(raised.exception))
            self.assertNotIn("SECRET_DO_NOT_LOG", str(raised.exception))

    def test_network_error_fails_closed_without_leaking_private_details(self):
        with patch.object(guard.request, "urlopen", side_effect=error.URLError(
            "SECRET_DO_NOT_LOG"
        )):
            with self.assertRaises(guard.GateError) as raised:
                guard.count_current_month_deployments("account", "li", "token")
            self.assertIn("network/TLS/DNS", str(raised.exception))
            self.assertNotIn("SECRET_DO_NOT_LOG", str(raised.exception))

    def test_fails_closed_on_unknown_timestamp(self):
        with patch.object(guard.request, "urlopen") as fetch:
            fetch.return_value.__enter__.return_value.read.return_value = json.dumps({
                "success":True,"result":[{"created_on":"not-a-date"}],
                "result_info":{"total_pages":1},
            }).encode()
            with self.assertRaises(guard.GateError):
                guard.count_current_month_deployments("account","li","token")


if __name__ == "__main__":
    unittest.main(verbosity=2)
