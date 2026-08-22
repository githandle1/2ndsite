# Add bookmarks from Safari

Bookmarks live in [`bookmarks.json`](../bookmarks.json). The Notion reading log lives in [`readings.json`](../readings.json). The homepage merges both (bookmarks first). Bookmarks stay visible; readings show 10 at a time, with a `more +` control to reveal the next page.

## Quick install (Mac)

1. Make sure GitHub CLI is logged in:
   ```bash
   gh auth login
   ```
2. Run the installer:
   ```bash
   ./scripts/install_share_shortcut.sh
   ```
3. Double-click `shortcuts/Add to filing cabinet.shortcut` to import.
4. In Shortcuts → **Add to filing cabinet** → **Shortcut Details**:
   - Turn on **Show in Share Sheet**
   - Accept: **URLs**, **Safari web pages**

**Use:** Safari → Share → **Add to filing cabinet** → answer prompts → live in ~1 minute.

The Mac shortcut runs [`scripts/add_bookmark.py`](../scripts/add_bookmark.py), which uses `gh` to commit to GitHub.

Photos use a separate share sheet: see [add-photos.md](add-photos.md). `./scripts/install_share_shortcut.sh` installs both.

## Edit locally (Cursor / terminal)

```bash
python3 scripts/add_bookmark.py --url "https://example.com/article"
```

Or edit `bookmarks.json` directly, then commit and push.

## iPhone setup

The Mac shortcut uses a local script, so set up a separate iOS shortcut with the GitHub API.

### 1. Create a GitHub token (one time)

1. Open [GitHub fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Create a token for repo **mayasthinking/2ndsite**
3. Permission: **Contents → Read and write**
4. Copy the token (starts with `github_pat_...`)

### 2. Build the iOS shortcut

Create a new shortcut named **Add to filing cabinet** with these actions:

| # | Action | Settings |
|---|--------|----------|
| 1 | **Get URLs from Input** | Share sheet input |
| 2 | **Set Variable** | Name: `Bookmark URL` |
| 3 | **Get Contents of URL** | URL: `Bookmark URL` |
| 4 | **Match Text** | Pattern: `<title[^>]*>(.*?)</title>` |
| 5 | **Change Case** | Lowercase |
| 6 | **Ask for Input** | Prompt: `Title` |
| 7 | **Set Variable** | Name: `Bookmark Title` |
| 8 | **Ask for Input** | Prompt: `Publication (optional)` |
| 9 | **Set Variable** | Name: `Bookmark Publication` |
| 10 | **Ask for Input** | Prompt: `Author (optional)` |
| 11 | **Set Variable** | Name: `Bookmark Author` |
| 12 | **Text** | Paste your token: `github_pat_...` |
| 13 | **Set Variable** | Name: `GitHub Token` |
| 14 | **Get Contents of URL** | GET `https://api.github.com/repos/mayasthinking/2ndsite/contents/bookmarks.json` — Headers: `Authorization` = `GitHub Token`, `Accept` = `application/vnd.github+json` |
| 15 | **Set Variable** | Name: `GitHub Response` |
| 16 | **Dictionary** | Keys: `githubResponse` = GitHub Response, `title` = Bookmark Title, `url` = Bookmark URL, `publication` = Bookmark Publication, `author` = Bookmark Author |
| 17 | **Run JavaScript** | Paste contents of [`shortcuts/ios-merge-bookmark.js`](../shortcuts/ios-merge-bookmark.js) |
| 18 | **Get Contents of URL** | PUT same GitHub URL — Method PUT — JSON body from JavaScript output — same headers as step 14 |
| 19 | **Show Notification** | `Added — live in ~1 min` |

Enable **Show in Share Sheet** and accept **URLs**.

### 3. Use on iPhone

Safari or Messages → **Share** → **Add to filing cabinet**.

## JSON schema

| Field | Required | Notes |
|-------|----------|-------|
| `title` | yes | Lowercase link text |
| `url` | yes | Full HTTPS URL |
| `publication` | no | Muted grey attribution |
| `author` | no | Shown as `publication / author` |

## Files

| File | Purpose |
|------|---------|
| `bookmarks.json` | Bookmark data |
| `scripts/add_bookmark.py` | Mac/terminal add script |
| `scripts/install_share_shortcut.sh` | Build + import Mac shortcut |
| `shortcuts/Add to filing cabinet.shortcut` | Signed Mac Share shortcut |
| `shortcuts/ios-merge-bookmark.js` | JavaScript for iOS shortcut step 17 |
