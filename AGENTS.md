# AGENTS.md

## Cursor Cloud specific instructions

This is a static HTML/CSS/JS personal portfolio site ("Maya's Sketchbook"). There is no build step, no framework, and no test suite. The only dependency is `http-server` (installed via `npm install`).

### Running the dev server

```bash
npm start
```

Serves on `http://localhost:4321` with caching disabled (`http-server -p 4321 -c-1`, defined in `package.json`). All pages are plain `.html` files at the repo root — there is no routing framework, so open pages by their file name (e.g. `/desktop.html`).

### Key pages

- `index.html` — Landing page / entry point (has an "Enter here" link into the desktop)
- `desktop.html` — Main portfolio with Windows 98-style draggable windows and desktop icons
- `stoccato.html` — Spatial sticky-note canvas (double-click canvas to add a note)
- `little-prince.html` — Animated starfield canvas
- `text-editor.html` — In-browser rich text editor

### Notes

- No linter, no test framework, no build pipeline. `npm test` exits with an error by design, so there is nothing to lint/build/test — validate changes by loading the affected page in a browser.
- Firebase Firestore is optional for `stoccato.html`; without credentials it silently falls back to `localStorage`. See `FIREBASE_SETUP.md` for configuration.
- The `inspo board/` directory (note the space) contains moodboard images; quote the path in shell commands.
- `generate-favicon.js` requires the `canvas` npm package (not installed by default) and is a one-time utility.
