# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

No test suite or linter is configured.

## Architecture

This is a single-component React app built with Vite. All application logic lives in **`bingo.jsx`** — `src/main.jsx` just mounts it.

**Component hierarchy in `bingo.jsx`:**

- `App` — root component; owns all state (songs, card count, view mode, game phase)
  - `BingoCard` — renders a single 5×5 bingo card; cells are clickable to toggle marks
  - `SongEditor` — slide-in panel (right side) for adding/removing songs, uploading `.txt`/`.csv` files, and saving/loading named playlists to `localStorage`
  - `GameModeSetup` — modal for uploading MP3 files before a game; matches filenames to song names via `buildFileMap` (exact then substring match after normalizing)
  - `DJPanel` — fullscreen DJ view; plays up to 30s per song, blurs the title until "Reveal" is clicked, advances through a shuffled queue

**Key data flows:**

- Cards are deterministically generated: `generateCard(songs, cardIndex)` uses a seeded LCG shuffle (`shuffle(arr, seed)`), so the same song list always produces the same cards.
- Playlists persist in `localStorage` under the key `"bingo-playlists"`.
- Game mode creates `blob:` URLs via `URL.createObjectURL` for uploaded audio files and revokes them on unmount.

**Print layout:** CSS is injected inline via a `<style>` tag at the bottom of `App`. Two cards print per page; `body.print-single` hides all cards except `.current-card`.

**No external UI library or CSS framework** — all styles are inline `style` objects.
