#!/usr/bin/env python3
"""Build and sign the Mac Share Shortcut for adding bookmarks."""

from __future__ import annotations

import plistlib
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SHORTCUTS_DIR = REPO_ROOT / "shortcuts"
SCRIPT_PATH = REPO_ROOT / "scripts" / "add_bookmark.py"


def build_mac_shortcut() -> dict:
    shell = f'/usr/bin/python3 "{SCRIPT_PATH}" --url "$1"'
    extension_input = {
        "Value": {"Type": "ExtensionInput"},
        "WFSerializationType": "WFTextTokenAttachment",
    }
    return {
        "WFWorkflowActions": [
            {
                "WFWorkflowActionIdentifier": "is.workflow.actions.runshellscript",
                "WFWorkflowActionParameters": {
                    "Script": shell,
                    "Shell": "/bin/zsh",
                    "InputMode": 0,
                    "WFInput": extension_input,
                },
            },
            {
                "WFWorkflowActionIdentifier": "is.workflow.actions.notification",
                "WFWorkflowActionParameters": {
                    "WFNotificationActionTitle": "Filing cabinet",
                    "WFNotificationActionBody": "Added — live in ~1 minute",
                },
            },
        ],
        "WFWorkflowClientVersion": "2605.0.2",
        "WFWorkflowMinimumClientVersion": 900,
        "WFWorkflowMinimumClientVersionString": "900",
        "WFWorkflowInputContentItemClasses": [
            "WFURLContentItem",
            "WFSafariWebPageContentItem",
            "WFStringContentItem",
        ],
        "WFWorkflowTypes": ["ActionExtension", "WFWorkflowTypeShowInShareSheet"],
        "WFWorkflowName": "Add to filing cabinet",
        "WFWorkflowHasOutputFallback": False,
        "WFWorkflowImportQuestions": [],
    }


def main() -> int:
    SHORTCUTS_DIR.mkdir(exist_ok=True)
    unsigned = SHORTCUTS_DIR / "add-to-filing-cabinet.unsigned.shortcut"
    signed = SHORTCUTS_DIR / "Add to filing cabinet.shortcut"
    unsigned.write_bytes(plistlib.dumps(build_mac_shortcut(), fmt=plistlib.FMT_BINARY))
    sign = subprocess.run(
        ["shortcuts", "sign", "--mode", "anyone", "--input", str(unsigned), "--output", str(signed)],
        capture_output=True,
        text=True,
    )
    if sign.returncode != 0:
        print(sign.stderr or sign.stdout or "Could not sign shortcut.", file=sys.stderr)
        print(f"Unsigned shortcut written to {unsigned}", file=sys.stderr)
        return 1
    print(signed)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
