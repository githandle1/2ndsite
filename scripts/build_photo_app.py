#!/usr/bin/env python3
"""Build a Mac app that picks or receives dropped photos."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "add_photo.py"


def applescript(python_script: Path) -> str:
    script = str(python_script)
    return f'''
on addPhoto(posixPath)
	set pythonScript to "{script}"
	try
		do shell script "export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH; /usr/bin/python3 " & quoted form of pythonScript & " --path " & quoted form of posixPath
		display notification "Added — live in ~1 minute" with title "Field photos"
	on error errMsg
		display dialog errMsg with title "Field photos" buttons {{"OK"}} default button "OK"
	end try
end addPhoto

on run
	try
		set theFile to choose file with prompt "Choose a photo to add" of type {{"public.image"}}
	on error
		return
	end try
	addPhoto(POSIX path of theFile)
end run

on open droppedItems
	repeat with theItem in droppedItems
		addPhoto(POSIX path of theItem)
	end repeat
end open
'''


def main() -> int:
    applications = Path.home() / "Applications"
    applications.mkdir(exist_ok=True)
    app_path = applications / "Add photo to filing cabinet.app"
    source = Path("/tmp/add-photo-to-filing-cabinet.applescript")
    source.write_text(applescript(SCRIPT_PATH), encoding="utf-8")
    subprocess.run(["osacompile", "-o", str(app_path), str(source)], check=True)
    print(app_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
