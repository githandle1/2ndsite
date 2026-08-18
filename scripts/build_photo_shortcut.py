#!/usr/bin/env python3
"""Build and sign the Mac Share Shortcut for adding photos."""

from __future__ import annotations

import plistlib
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SHORTCUTS_DIR = REPO_ROOT / "shortcuts"
SCRIPT_PATH = REPO_ROOT / "scripts" / "add_photo.py"


def build_mac_shortcut() -> dict:
    shell = "\n".join(
        [
            "set -euo pipefail",
            f'script="{SCRIPT_PATH}"',
            "src=\"\"",
            'for arg in "$@"; do',
            '  candidate="$arg"',
            '  if [[ "$candidate" == file://* ]]; then',
            '    candidate="${candidate#file://}"',
            '    candidate="$(/usr/bin/python3 -c \'import sys, urllib.parse; print(urllib.parse.unquote(sys.argv[1]))\' "$candidate")"',
            "  fi",
            '  if [[ -f "$candidate" && -s "$candidate" ]]; then',
            '    src="$candidate"',
            "    break",
            "  fi",
            "done",
            'if [[ -z "$src" ]]; then',
            '  src="$(mktemp /tmp/cabinet-photo.XXXXXX)"',
            '  cat > "$src"',
            "fi",
            'if [[ ! -s "$src" ]]; then',
            '  echo "No photo data arrived. In Finder, right-click the image → Share → Add photo to filing cabinet." >&2',
            "  exit 1",
            "fi",
            'exec /usr/bin/python3 "$script" --path "$src"',
        ]
    )
    convert_uuid = "7C9A1B2E-4D3F-4A6C-9E10-22B5D8F3A701"
    return {
        "WFWorkflowActions": [
            {
                "WFWorkflowActionIdentifier": "is.workflow.actions.image.convert",
                "WFWorkflowActionParameters": {
                    "UUID": convert_uuid,
                    "WFImageConvertFormat": "JPEG",
                },
            },
            {
                "WFWorkflowActionIdentifier": "is.workflow.actions.runshellscript",
                "WFWorkflowActionParameters": {
                    "Script": shell,
                    "Shell": "/bin/zsh",
                    "InputMode": 1,
                    "WFInput": {
                        "Value": {
                            "OutputUUID": convert_uuid,
                            "Type": "ActionOutput",
                            "OutputName": "Converted Image",
                        },
                        "WFSerializationType": "WFTextTokenAttachment",
                    },
                },
            },
            {
                "WFWorkflowActionIdentifier": "is.workflow.actions.notification",
                "WFWorkflowActionParameters": {
                    "WFNotificationActionTitle": "Field photos",
                    "WFNotificationActionBody": "Added — live in ~1 minute",
                },
            },
        ],
        "WFWorkflowClientVersion": "2605.0.2",
        "WFWorkflowMinimumClientVersion": 900,
        "WFWorkflowMinimumClientVersionString": "900",
        "WFWorkflowInputContentItemClasses": [
            "WFImageContentItem",
            "WFPhotoMediaContentItem",
            "WFGenericFileContentItem",
        ],
        "WFWorkflowTypes": ["ActionExtension", "WFWorkflowTypeShowInShareSheet"],
        "WFWorkflowName": "Add photo to filing cabinet",
        "WFWorkflowHasOutputFallback": False,
        "WFWorkflowImportQuestions": [],
    }


def main() -> int:
    SHORTCUTS_DIR.mkdir(exist_ok=True)
    unsigned = SHORTCUTS_DIR / "add-photo-to-filing-cabinet.unsigned.shortcut"
    signed = SHORTCUTS_DIR / "Add photo to filing cabinet.shortcut"
    unsigned.write_bytes(plistlib.dumps(build_mac_shortcut(), fmt=plistlib.FMT_BINARY))
    sign = subprocess.run(
        ["shortcuts", "sign", "--mode", "anyone", "--input", str(unsigned), "--output", str(signed)],
        capture_output=True,
        text=True,
    )
    if sign.returncode != 0:
        print(unsigned)
        return 0
    print(signed)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
