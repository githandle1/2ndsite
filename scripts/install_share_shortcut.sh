#!/bin/bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

chmod +x scripts/add_bookmark.py scripts/build_share_shortcut.py

echo "Checking GitHub CLI auth..."
if ! gh auth status >/dev/null 2>&1; then
  echo "Run: gh auth login"
  exit 1
fi

python3 scripts/build_share_shortcut.py

shortcut_file="$repo_root/shortcuts/Add to filing cabinet.shortcut"

echo
echo "Mac shortcut ready:"
echo "  $shortcut_file"
echo
echo "Next steps:"
echo "  1. Double-click the shortcut file to import"
echo "  2. Shortcuts → Add to filing cabinet → Shortcut Details"
echo "  3. Enable 'Show in Share Sheet' (URLs + Safari web pages)"
echo
echo "iPhone: follow docs/add-bookmarks.md to build the iOS shortcut"
echo

open "$shortcut_file" 2>/dev/null || true
