# AGENTS.md

## Cursor Cloud specific instructions

This is a static HTML/CSS/JS personal portfolio site ("Maya's Sketchbook") with no build step, no framework, and no test suite.

### Running the dev server

```bash
npm start
```

Serves on `http://localhost:4321` with caching disabled (`http-server -p 4321 -c-1`). All pages are plain `.html` files at the repo root — no routing framework.

### Key pages

- `index.html` — Landing page (entry point)
- `desktop.html` — Main portfolio with Windows 98-style draggable windows
- `stoccato.html` — Spatial sticky-note canvas (Firebase optional, falls back to localStorage)
- `little-prince.html` — Animated starfield canvas
- `text-editor.html` — Rich text editor

### Notes

- No linter, no test framework, no build pipeline. `npm test` exits with an error by design.
- Firebase Firestore is optional for `stoccato.html`; without credentials it silently falls back to localStorage. See `FIREBASE_SETUP.md` for configuration if needed.
- The `inspo board/` directory (note the space) contains moodboard images; quote the path in shell commands.
