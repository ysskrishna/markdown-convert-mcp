#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

pkg_ver="$(node -p "require('./package.json').version")"
server_json_ver="$(node -p "require('./server.json').version")"
openclaw_ver="$(node -p "require('./openclaw.plugin.json').version")"
cursor_ver="$(node -p "require('./.cursor-plugin/plugin.json').version")"
ts_ver="$(grep -E "version: '[0-9]" src/server.ts | head -1 | sed -E "s/.*version: '([^']+)'.*/\1/")"

compare() {
  local label="$1"
  local a="$2"
  local b="$3"
  if [[ "$a" != "$b" ]]; then
    echo "error: $label mismatch ($a != $b)" >&2
    exit 1
  fi
}

compare "package.json vs server.json" "$pkg_ver" "$server_json_ver"
compare "package.json vs src/server.ts" "$pkg_ver" "$ts_ver"
compare "package.json vs openclaw.plugin.json" "$pkg_ver" "$openclaw_ver"
compare "package.json vs .cursor-plugin/plugin.json" "$pkg_ver" "$cursor_ver"

pkg_version_in_server_json="$(node -p "require('./server.json').packages[0].version")"
compare "server.json packages[0].version" "$pkg_ver" "$pkg_version_in_server_json"

echo "release versions OK: $pkg_ver"