# Queen City Games — Music Bingo Design Spec

**Date:** 2026-04-25
**Status:** Approved

## Overview

Replace the Singo subscription app with a self-hosted React/Vite web app branded for Queen City Games. Key additions: Spotify playlist streaming (Web Playback SDK), automatic hook detection with manual override, and a real-time winner checker that verifies player sheet numbers against songs called.

---

## Branding

- **Company name:** Queen City Games
- **Game name:** MUSIC BINGO (placeholder — stored as a single config string, easy to swap)
- **Color scheme:** Deep navy `#12005e` → royal purple `#6200ea` gradient throughout
- **Card grid divider:** Soft purple `#c5a8f5`
- **Cell text:** Deep navy `#12005e`
- **Card border:** Royal purple `#6200ea`
- **Default song list:** Empty — songs come from Spotify playlists, not hardcoded defaults
- **Removed:** All Hannah Montana / Miley Cyrus song data and pink/hot-pink theming

---

## Architecture

`bingo.jsx` is split into focused modules:

```
src/
  App.jsx                    # Root component — owns global state, wires modules together
  hooks/
    useSpotify.js            # OAuth PKCE, Web Playback SDK, Audio Analysis API
    useGameState.js          # Songs, cards, selected cells, called songs, game phase
  components/
    BingoCard.jsx            # Single 5×5 card (visual only, no state)
    SongEditor.jsx           # Spotify playlist import + manual song editing
    DJPanel.jsx              # Host playback panel — Spotify player + hook controls
    WinnerChecker.jsx        # Computes and displays eligible winner sheet numbers
```

### One-time Setup (user action)
The user creates a free app at [developer.spotify.com](https://developer.spotify.com), adds `http://localhost:5173` as a redirect URI, and enters the Client ID in the app's settings. No backend or client secret is required — the PKCE flow is browser-only.

---

## Spotify Integration

### Authentication
- OAuth 2.0 with PKCE flow, handled entirely in `useSpotify.js`
- Redirect to Spotify → capture code → exchange for access + refresh tokens → store in `sessionStorage`
- Token refresh handled automatically before expiry

### Playlist Import
- `SongEditor` shows a side panel (slides in from right) with a "Connect Spotify" button and a playlist URL paste field
- On connect or URL paste, `useSpotify.fetchPlaylist(id)` calls the Spotify Web API and returns the full track list (name, artist, URI, duration)
- Track list replaces the current song list in `useGameState`
- Existing saved playlists (localStorage) remain accessible as a fallback

### Playback
- `useSpotify` initializes the Spotify Web Playback SDK, registering the browser tab as a Spotify device
- Requires Spotify Premium on the host's account
- `player.playTrack(uri, startMs)` seeks to `startMs` and begins playback
- Audio streams from Spotify's servers — no MP3 uploads needed

### Queue & Shuffle
- Song order is managed entirely in-app via `useGameState`
- In-app shuffle button randomizes the queue independently of Spotify's shuffle state
- Spotify is used only for authentication, track data, and audio streaming

---

## DJ Panel

### Layout
- Fullscreen overlay (dark navy background) with:
  - Top bar: Exit button · "Song X of Y" counter · "🏆 Winners" button
  - Song title (blurred or clear depending on Reveal toggle)
  - 30-second progress bar
  - Hook offset control
  - Play/Pause button
  - Reveal toggle + Next Song button

### Hook Detection
1. When a song loads, `useSpotify.getAudioAnalysis(trackId)` fetches section timing data
2. The section with the highest loudness within the middle 60% of the track is selected as the auto-detected hook start
3. The detected start time is displayed as "Auto-detected · 0:47"
4. The host can nudge the start point with − / + buttons (5-second increments per press)
5. Adjusted times are stored in a `Map<trackId, startMs>` in component state for the session — the same song won't need re-adjustment in one game night
6. Playback always stops after 30 seconds regardless of start point

### Reveal Toggle
- A single toggle button: "👁 Reveal: OFF" / "👁 Reveal: ON"
- When OFF: song title and artist are blurred
- When ON: song title and artist are visible, unblurred instantly
- State persists across songs — host sets it once, doesn't need to press it per song
- Toggling mid-song takes effect immediately

---

## Winner Checker

### Sheet Structure
- Cards are numbered sequentially starting at 1
- Sheet 1 = Cards 1 & 2, Sheet 2 = Cards 3 & 4, and so on
- Each player receives one printed sheet (two cards)

### Prize Tiers
| Prize | Condition |
|-------|-----------|
| 1st | Any 1 complete line (row, column, or diagonal) on either card of the sheet |
| 2nd | Any 2 complete lines on the same single card |
| 3rd | Full blackout (all 25 squares) on one card |

Lines are: 5 rows × 2 cards + 5 columns × 2 cards + 2 diagonals × 2 cards = 24 possible lines per sheet.

### Computation
- Cards are deterministically generated from `(songList, cardIndex)` — the app can reconstruct any card at any time
- `WinnerChecker` takes `calledSongs[]` (songs revealed so far) and `cardCount` as inputs
- A song is added to `calledSongs[]` when the host presses "Next Song" — this is the moment the song title has been revealed to players and they would mark their cards
- For each sheet, it checks whether the called songs complete the required pattern on either card
- A sheet appears in a prize tier's list if the called songs *would* complete the required pattern, assuming the player marked correctly
- Computation runs on every song reveal; result is memoized

### UI
- Opened from "🏆 Winners" button in the DJ Panel
- **Quick Lookup:** host types a sheet number, instantly sees which prizes it's eligible for and which it isn't
- **Prize tier lists:** each tier shows sheet numbers as numbered badges; lists update in real time
- **Mark as awarded:** once a prize is claimed the host taps the prize tier badge to mark it awarded; the tier collapses to a single "🏆 1st Prize — AWARDED" line and is no longer expandable, preventing confusion as the game continues toward the next prize
- Closed via "✕ Back to Game" — returns to DJ Panel without interrupting playback

---

## Data Flow Summary

```
Spotify API ──► useSpotify ──► SongEditor ──► useGameState (songs[])
                    │                               │
                    │ (playTrack, getAnalysis)       │ (cards[], calledSongs[])
                    ▼                               ▼
                DJPanel ────────────────► WinnerChecker
```

---

## Constraints & Notes

- Spotify Premium is required for Web Playback SDK streaming — the app should display a clear message if the user's account doesn't support it
- The PKCE flow requires the app to be served over `http://localhost` or `https://` — plain `file://` won't work
- Hook auto-detection is a heuristic (loudest section in middle 60%); it will occasionally land on a bridge rather than the chorus, which is why the manual override exists
- All audio analysis calls are made lazily (when a song loads in the DJ Panel), not upfront when the playlist is imported
- `URL.revokeObjectURL` cleanup from the old MP3 approach is no longer needed; Spotify SDK handles its own cleanup
