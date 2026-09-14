# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server at http://localhost:5173 (use 127.0.0.1, not localhost, for Spotify redirect)
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm run test       # run tests in watch mode (vitest)
npm run test:run   # run tests once (CI)
```

No linter is configured.

## Architecture

React + Vite app. `src/main.jsx` mounts `App.jsx`; all significant logic is split across:

```
src/
  App.jsx               — root component; owns layout, print logic, winner-awarded state
  config.js             — GAME_NAME, COMPANY_NAME, SPOTIFY_CLIENT_ID, REDIRECT_URI, COLORS
  hooks/
    useGameState.js     — all non-Spotify state: songs, cards, selections, playlists, winner windows
    useSpotify.js       — Spotify PKCE auth, Web Playback SDK, mobile Spotify Connect, token refresh
  components/
    BingoCard.jsx       — 5×5 grid; cells toggle marks
    SongEditor.jsx      — slide-in panel for song list, file upload (.txt/.csv), named playlists
    DJPanel.jsx         — fullscreen DJ view; plays tracks, blurs title until reveal, advances queue
    WinnerChecker.jsx   — side drawer or fullscreen; shows eligible sheets per prize tier
  utils/
    cardUtils.js        — shuffle (seeded LCG) + generateCard (deterministic by cardIndex)
    winnerUtils.js      — getLines, countCompletedLines, isBlackout, computeWinners
    cardUtils.test.js
    winnerUtils.test.js
```

**Key data flows:**

- `useGameState` holds `songs[]` (full roster) and derives `cards[]` via `generateCard(songNames, i)` — same songs always produce the same cards (seeded LCG).
- `prepareGame(playCount)` selects an `activeSongs[]` queue that guarantees all 25 squares on 3 random cards are reachable. Remaining songs go into `extensionSongs[]` for overtime.
- **Sheets**: two cards print per physical sheet. `WinnerChecker` works in sheet numbers (1-indexed), where sheet N = card indices `(N-1)*2` and `(N-1)*2+1`. Prize tiers: 1st = 1 line on either card, 2nd = 2 lines on one card, 3rd = blackout on one card.
- Playlists persist in `localStorage` under `"bingo-playlists"`.
- `winnerWindows` (configurable min/max song-count thresholds per prize tier) is state in `useGameState` — not currently wired to `WinnerChecker`'s hardcoded tier logic; reconcile before changing prize rules.

**Spotify integration (`useSpotify.js`):**

- PKCE OAuth flow; tokens stored in `sessionStorage`.
- Desktop (non-mobile): loads the Web Playback SDK and creates an in-browser player (`deviceId`).
- Mobile (iPhone/iPad/Android): skips SDK; falls back to preview URL via `<Audio>`, or Spotify Connect to the first Tablet/Smartphone device found via the devices API. Mobile device ID is cached in `mobileDeviceIdRef` and cleared on 404/403.
- `getHookStart` uses the Audio Analysis API to find the loudest section in the middle 60% of a track for the best clip start point.
- Token auto-refresh is scheduled 60 s before expiry via `scheduleRefresh`.

**Deployment:**

- `REDIRECT_URI` in `config.js` switches between `http://127.0.0.1:5173` (dev) and the GitHub Pages URL based on `window.location.hostname`. Dev must run on `127.0.0.1`, not `localhost`.
- `SPOTIFY_CLIENT_ID` in `config.js` is committed — it's a public client ID (PKCE, no secret).

**Print layout:** CSS injected via a `<style>` tag in `App`. Two cards per page; `body.print-single` hides all sheets except `.current-card`. No external UI library — all styles are inline `style` objects.
