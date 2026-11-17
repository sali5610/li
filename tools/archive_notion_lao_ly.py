#!/usr/bin/env python3
"""Archive exact Notion Lão Lý PNG files without exposing expiring signed URLs in output.

Usage: python3 tools/archive_notion_lao_ly.py --batch 01 < source-records.json
The source JSON is a transient signed-URL record list; never commit that input.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import struct
import sys
import time
import urllib.request


ROOT = Path("design-assets/lao-ly")
MAX_BYTES = 15_000_000


def fetch_one(record):
    path = Path(record["path"])
    if not str(path).startswith(str(ROOT) + "/") or path.suffix != ".png":
        raise ValueError("Invalid archive path: " + str(path))
    data = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(
                record["download_url"],
                headers={"User-Agent": "Li-Notion-Asset-Archive/1.0"},
            )
            with urllib.request.urlopen(req, timeout=75) as response:
                data = response.read(MAX_BYTES + 1)
            break
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2**attempt)
    if len(data) > MAX_BYTES or len(data) < 8000:
        raise ValueError("Unexpected image size: " + str(path))
    if data[:8] != bytes([137, 80, 78, 71, 13, 10, 26, 10]):
        raise ValueError("Invalid PNG signature: " + str(path))
    width, height = struct.unpack(">II", data[16:24])
    color_type = data[25]
    if not (64 <= width <= 4000 and 64 <= height <= 4000):
        raise ValueError("Unexpected PNG dimensions: " + str(path))
    if record["variant"] in ("Ngoài gương", "Trong gương"):
        if (width, height) != (1024, 1024):
            raise ValueError("Expression should be 1024x1024: " + str(path))
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_bytes() != data:
        raise ValueError("Refusing to overwrite different source bytes: " + str(path))
    path.write_bytes(data)
    metadata = {k: v for k, v in record.items() if k != "download_url"}
    metadata.update(
        width=width, height=height, bytes=len(data),
        sha256=hashlib.sha256(data).hexdigest(),
        png_color_type=color_type
    )
    return metadata


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", required=True)
    args = parser.parse_args()
    if not (len(args.batch) == 2 and args.batch.isdigit()):
        parser.error("--batch must be a two-digit number")
    records = json.load(sys.stdin)
    if not (1 <= len(records) <= 10):
        raise ValueError("Each chunk must contain 1–10 Notion assets")
    if len({r["path"] for r in records}) != len(records):
        raise ValueError("Duplicate output paths")
    with ThreadPoolExecutor(max_workers=5) as pool:
        files = list(pool.map(fetch_one, records))
    ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema": "li-laoly-archive-v1",
        "source": "Notion Biểu cảm Lão Lý · Asset Library",
        "batch": args.batch,
        "count": len(files),
        "files": sorted(files, key=lambda item: item["path"]),
    }
    file = ROOT / ("manifest-part" + args.batch + ".json")
    file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for item in files:
        print("ASSET_OK", item["path"], str(item["width"])+"x"+str(item["height"]), item["bytes"], item["sha256"][:12], item["review"])
    print("BATCH_COMPLETE", args.batch, len(files), "exact PNG bytes, SHA256 + dimensions")


if __name__ == "__main__":
    main()
