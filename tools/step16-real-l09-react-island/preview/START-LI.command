#!/bin/bash
# li. L09 local React preview. Opens the EXISTING native app with the opt-in
# React challenge. No account, network service, deploy, or real learner key.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [[ ! -f site/index.html || ! -f site/assets/step16-l09-island.js || ! -f site/assets/step16-l09-island.css ]]; then
  echo "This preview package is incomplete. Download the full build artifact."
  read -r -p "Press Return to close..."
  exit 1
fi
PORT=8794
URL="http://127.0.0.1:${PORT}/site/index.html?li-react=l09&li-vc-g2=1"
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
elif command -v ruby >/dev/null 2>&1; then
  ruby -run -e httpd "$ROOT" -p "$PORT" -b 127.0.0.1 >/dev/null 2>&1 &
else
  echo "To open this preview, install Python 3 or Ruby. No app/deploy was changed."
  read -r -p "Press Return to close..."
  exit 1
fi
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
sleep 2
if ! kill -0 "$server_pid" 2>/dev/null; then
  echo "Could not start local preview; port $PORT may already be in use."
  read -r -p "Press Return to close..."
  exit 1
fi
echo "li. local-only preview: $URL"
echo "Browser: Home → Học thử L09 → practice → self-review → Home / resume."
echo "Progress stays ONLY in this browser, on this computer. No cloud sync."
echo "Close this Terminal window to stop the private localhost server."
open "$URL"
wait "$server_pid"
