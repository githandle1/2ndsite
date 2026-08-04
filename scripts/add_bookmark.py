#!/usr/bin/env python3
"""Add a bookmark to bookmarks.json and push via GitHub API (uses gh CLI)."""

from __future__ import annotations

import argparse
import base64
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

REPO = "mayasthinking/2ndsite"
FILE_PATH = "bookmarks.json"
USER_AGENT = "Mozilla/5.0 (compatible; filing-cabinet-bot/1.0)"


def run_gh(args: list[str]) -> str:
    result = subprocess.run(
        ["gh", "api", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def normalize_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title).strip()
    title = re.sub(r"\s*[|\-–—]\s*[^|\-–—]+$", "", title).strip()
    return title.lower()


def fetch_page_title(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        html = response.read().decode("utf-8", errors="replace")
    match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if not match:
        raise ValueError(f"Could not find a page title for {url}")
    return normalize_title(re.sub(r"\s+", " ", match.group(1)))


def guess_publication(url: str) -> str:
    host = re.sub(r"^www\.", "", urlparse(url).netloc.lower())
    mapping = {
        "newyorker.com": "the new yorker",
        "theideasletter.org": "the ideas letter",
        "nytimes.com": "the new york times",
        "theatlantic.com": "the atlantic",
    }
    return mapping.get(host, host)


def load_bookmarks() -> tuple[list[dict], str]:
    payload = json.loads(run_gh([f"repos/{REPO}/contents/{FILE_PATH}"]))
    sha = payload["sha"]
    content = base64.b64decode(payload["content"]).decode("utf-8")
    bookmarks = json.loads(content)
    if not isinstance(bookmarks, list):
        raise ValueError("bookmarks.json must contain a JSON array")
    return bookmarks, sha


def save_bookmarks(bookmarks: list[dict], sha: str, message: str) -> None:
    encoded = base64.b64encode(
        (json.dumps(bookmarks, indent=2) + "\n").encode("utf-8")
    ).decode("ascii")
    body = json.dumps(
        {
            "message": message,
            "content": encoded,
            "sha": sha,
        }
    )
    subprocess.run(
        [
            "gh",
            "api",
            "--method",
            "PUT",
            f"repos/{REPO}/contents/{FILE_PATH}",
            "--input",
            "-",
        ],
        input=body,
        check=True,
        text=True,
    )


def prompt(label: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{label}{suffix}: ").strip()
    return value or default


def main() -> int:
    parser = argparse.ArgumentParser(description="Add a bookmark to the filing cabinet site.")
    parser.add_argument("--url", required=True, help="Bookmark URL")
    parser.add_argument("--title", help="Bookmark title (fetched from page if omitted)")
    parser.add_argument("--publication", help="Publication name")
    parser.add_argument("--author", help="Author name")
    parser.add_argument("--non-interactive", action="store_true", help="Do not prompt for missing fields")
    args = parser.parse_args()

    url = args.url.strip()
    if not url.startswith(("http://", "https://")):
        print("URL must start with http:// or https://", file=sys.stderr)
        return 1

    try:
        title = args.title or fetch_page_title(url)
        title = normalize_title(title)
    except (urllib.error.URLError, ValueError) as error:
        if args.non_interactive:
            print(str(error), file=sys.stderr)
            return 1
        title = normalize_title(prompt("Title"))

    publication = args.publication
    author = args.author
    if not args.non_interactive:
        if publication is None:
            publication = prompt("Publication (optional)", guess_publication(url))
        if author is None:
            author = prompt("Author (optional)")

    bookmark = {"title": title, "url": url}
    if publication:
        bookmark["publication"] = publication.strip().lower()
    if author:
        bookmark["author"] = author.strip().lower()

    try:
        bookmarks, sha = load_bookmarks()
    except subprocess.CalledProcessError as error:
        print(error.stderr or error.stdout or str(error), file=sys.stderr)
        return 1

    if any(item.get("url") == url for item in bookmarks):
        print(f"Already bookmarked: {url}")
        return 0

    bookmarks.append(bookmark)
    message = f"Add bookmark: {title}"

    try:
        save_bookmarks(bookmarks, sha, message)
    except subprocess.CalledProcessError as error:
        print(error.stderr or error.stdout or str(error), file=sys.stderr)
        return 1

    print(f"Added '{title}'. Live on site in ~1 minute.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
