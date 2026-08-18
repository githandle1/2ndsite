#!/bin/bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

chmod +x scripts/add_bookmark.py scripts/build_share_shortcut.py
chmod +x scripts/add_photo.py scripts/build_photo_app.py

echo "Checking GitHub CLI auth..."
if ! gh auth status >/dev/null 2>&1; then
  echo "Run: gh auth login"
  exit 1
fi

python3 scripts/build_share_shortcut.py
app_path="$(python3 scripts/build_photo_app.py)"

bookmark_shortcut="$repo_root/shortcuts/Add to filing cabinet.shortcut"

echo
echo "Bookmarks (Shortcuts):"
echo "  $bookmark_shortcut"
echo "  Double-click to import, then enable 'Show in Share Sheet' (URLs + Safari web pages)"
echo
echo "Photos (Mac app — not Shortcuts):"
echo "  $app_path"
echo "  Double-click and pick a photo, or drag a photo onto the app"
echo
echo "iPhone: follow docs/add-bookmarks.md and docs/add-photos.md"
echo

open "$bookmark_shortcut" 2>/dev/null || true
open -R "$app_path"
