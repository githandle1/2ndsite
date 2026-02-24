## Cursor Cloud specific instructions

This is a static frontend-only website ("Maya's Sketchbook") — vanilla HTML/CSS/JS with no build step.

### Running the dev server

```
npm start
```

Starts `http-server` on port 4321 with caching disabled (`-c-1`). Open `http://localhost:4321` to view the site.

### Project structure

- `index.html` — Landing page (Stalogy notebook cover)
- `desktop.html` — Main interactive page with Windows 98-style draggable windows
- `stoccato.html` — Shared sticky-notes sub-app (Firebase optional, falls back to localStorage)
- `text-editor.html` — In-browser text editor
- `little-prince.html` — Creative content page

### Notes

- No linter or test suite is configured. `npm test` exits with an error by design.
- Firebase/Firestore integration in `stoccato.html` is optional; without credentials, it gracefully falls back to localStorage.
- The `music/` directory contains MP3 files for the built-in music player.
- The `generate-favicon.js` script requires the `canvas` npm package (not installed by default) and is a one-time utility.
