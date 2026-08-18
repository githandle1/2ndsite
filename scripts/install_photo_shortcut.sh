#!/bin/bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

chmod +x scripts/add_photo.py scripts/build_photo_app.py

echo "Checking GitHub CLI auth..."
if ! gh auth status >/dev/null 2>&1; then
  echo "Run: gh auth login"
  exit 1
fi

app_path="$(python3 scripts/build_photo_app.py)"

echo
echo "App ready:"
echo "  $app_path"
echo
echo "Use it by:"
echo "  • Double-clicking the app and picking a photo"
echo "  • Dragging a photo onto the app"
echo
echo "You can ignore the Shortcuts version — Share Sheet was not passing the file."
echo

open -R "$app_path"
open "$app_path"
