# Music Bingo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the bingo app for Queen City Games, add Spotify streaming with hook detection, and add a real-time winner checker — replacing the Singo subscription service.

**Architecture:** `bingo.jsx` is split into focused modules: `src/App.jsx` (root), `src/hooks/useSpotify.js` (auth + SDK + API), `src/hooks/useGameState.js` (songs/cards/game state), and four components in `src/components/`. Pure card and winner logic lives in `src/utils/` and is unit-tested with Vitest.

**Tech Stack:** React 18, Vite 6, Vitest, Spotify Web API, Spotify Web Playback SDK (PKCE OAuth, no backend)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/config.js` | Game name, colors, Spotify client ID |
| Create | `src/utils/cardUtils.js` | `shuffle`, `generateCard` (extracted from bingo.jsx) |
| Create | `src/utils/winnerUtils.js` | Pure winner computation: `getLines`, `countCompletedLines`, `isBlackout`, `computeWinners` |
| Create | `src/utils/cardUtils.test.js` | Tests for shuffle and generateCard |
| Create | `src/utils/winnerUtils.test.js` | Tests for all win conditions |
| Create | `src/hooks/useGameState.js` | songs, cards, selected cells, calledSongs, shuffle |
| Create | `src/hooks/useSpotify.js` | PKCE OAuth, Web Playback SDK, playlist fetch, audio analysis |
| Create | `src/components/BingoCard.jsx` | 5×5 card rendering with new branding |
| Create | `src/components/WinnerChecker.jsx` | Prize tier display + quick lookup |
| Create | `src/components/SongEditor.jsx` | Spotify panel + manual song editing |
| Create | `src/components/DJPanel.jsx` | Host playback, hook detection, reveal toggle |
| Create | `src/App.jsx` | Root, wires all hooks and components |
| Modify | `src/main.jsx` | Change import from `../bingo.jsx` to `./App.jsx` |
| Modify | `vite.config.js` | Add Vitest test config |
| Modify | `package.json` | Add test scripts |
| Modify | `index.html` | Update page title |
| Modify | `.gitignore` | Add `.superpowers/` |
| Delete | `bingo.jsx` | Replaced by the above modules |

---

## Task 1: Project Setup

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json`
- Modify: `index.html`
- Modify: `.gitignore`
- Create: `src/config.js`

- [ ] **Step 1: Install Vitest**

```bash
cd /mnt/c/src/SongBingo && npm install -D vitest jsdom
```

Expected output: vitest added to devDependencies, no errors.

- [ ] **Step 2: Add test environment to vite.config.js**

Replace the full contents of `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: Add test scripts to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Update page title in index.html**

Change `<title>Hannah Montana Bingo</title>` to `<title>Queen City Games — Music Bingo</title>`.

- [ ] **Step 5: Add .superpowers to .gitignore**

Read the existing `.gitignore` (if any) and append:

```
.superpowers/
```

- [ ] **Step 6: Create src/config.js**

```js
export const GAME_NAME = 'MUSIC BINGO';
export const COMPANY_NAME = 'Queen City Games';
export const SPOTIFY_CLIENT_ID = ''; // Paste your Spotify app Client ID here
export const REDIRECT_URI = 'http://127.0.0.1:5173'; // Must match exactly what's in your Spotify Developer Dashboard

export const COLORS = {
  navy: '#12005e',
  purple: '#6200ea',
  purpleLight: '#a040ff',
  purpleSoft: '#c5a8f5',
  purplePale: '#f0eeff',
  gradient: 'linear-gradient(135deg, #12005e, #6200ea)',
};
```

- [ ] **Step 7: Commit**

```bash
git add vite.config.js package.json package-lock.json index.html .gitignore src/config.js
git commit -m "chore: add Vitest, config module, update page title"
```

---

## Task 2: Card & Winner Utilities

**Files:**
- Create: `src/utils/cardUtils.js`
- Create: `src/utils/winnerUtils.js`
- Create: `src/utils/cardUtils.test.js`
- Create: `src/utils/winnerUtils.test.js`

- [ ] **Step 1: Write failing tests for cardUtils**

Create `src/utils/cardUtils.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { shuffle, generateCard } from './cardUtils.js';

describe('shuffle', () => {
  it('returns same length array', () => {
    expect(shuffle([1,2,3,4,5], 42).length).toBe(5);
  });
  it('contains same elements', () => {
    const result = shuffle([1,2,3,4,5], 42);
    expect(result.sort()).toEqual([1,2,3,4,5]);
  });
  it('is deterministic with same seed', () => {
    expect(shuffle([1,2,3,4,5], 99)).toEqual(shuffle([1,2,3,4,5], 99));
  });
  it('produces different orders with different seeds', () => {
    expect(shuffle([1,2,3,4,5,6,7,8,9,10], 1))
      .not.toEqual(shuffle([1,2,3,4,5,6,7,8,9,10], 2));
  });
});

describe('generateCard', () => {
  const songs = Array.from({ length: 50 }, (_, i) => `Song ${i}`);
  it('returns exactly 25 songs', () => {
    expect(generateCard(songs, 0).length).toBe(25);
  });
  it('contains only songs from the list', () => {
    const card = generateCard(songs, 0);
    card.forEach(s => expect(songs).toContain(s));
  });
  it('has no duplicate songs on a card', () => {
    const card = generateCard(songs, 0);
    expect(new Set(card).size).toBe(25);
  });
  it('produces different cards for different indices', () => {
    expect(generateCard(songs, 0)).not.toEqual(generateCard(songs, 1));
  });
  it('is deterministic for same songs + index', () => {
    expect(generateCard(songs, 5)).toEqual(generateCard(songs, 5));
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test:run -- src/utils/cardUtils.test.js
```

Expected: FAIL — "Cannot find module './cardUtils.js'"

- [ ] **Step 3: Create src/utils/cardUtils.js**

```js
export function shuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateCard(songList, cardIndex) {
  const shuffled = shuffle(songList, cardIndex * 999983 + 42);
  return shuffled.slice(0, 25);
}
```

- [ ] **Step 4: Run cardUtils tests — confirm all pass**

```bash
npm run test:run -- src/utils/cardUtils.test.js
```

Expected: PASS — 9 tests.

- [ ] **Step 5: Write failing tests for winnerUtils**

Create `src/utils/winnerUtils.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { getLines, countCompletedLines, isBlackout, computeWinners } from './winnerUtils.js';

// A simple ordered card: ['S0','S1',...,'S24']
const makeCard = (offset = 0) => Array.from({ length: 25 }, (_, i) => `S${i + offset}`);

describe('getLines', () => {
  it('returns 12 lines', () => {
    expect(getLines().length).toBe(12);
  });
  it('each line has 5 indices', () => {
    getLines().forEach(line => expect(line.length).toBe(5));
  });
  it('first row is [0,1,2,3,4]', () => {
    expect(getLines()[0]).toEqual([0,1,2,3,4]);
  });
  it('first column is [0,5,10,15,20]', () => {
    expect(getLines()[5]).toEqual([0,5,10,15,20]);
  });
  it('top-left diagonal is [0,6,12,18,24]', () => {
    expect(getLines()[10]).toEqual([0,6,12,18,24]);
  });
  it('top-right diagonal is [4,8,12,16,20]', () => {
    expect(getLines()[11]).toEqual([4,8,12,16,20]);
  });
});

describe('countCompletedLines', () => {
  it('returns 0 when nothing called', () => {
    expect(countCompletedLines(makeCard(), new Set())).toBe(0);
  });
  it('returns 1 when first row called', () => {
    const called = new Set(['S0','S1','S2','S3','S4']);
    expect(countCompletedLines(makeCard(), called)).toBe(1);
  });
  it('returns 2 when first row and first column called', () => {
    const called = new Set(['S0','S1','S2','S3','S4','S5','S10','S15','S20']);
    expect(countCompletedLines(makeCard(), called)).toBe(2);
  });
  it('returns 12 for a full card', () => {
    const called = new Set(makeCard());
    expect(countCompletedLines(makeCard(), called)).toBe(12);
  });
});

describe('isBlackout', () => {
  it('returns false when nothing called', () => {
    expect(isBlackout(makeCard(), new Set())).toBe(false);
  });
  it('returns false when only 24 songs called', () => {
    const called = new Set(makeCard().slice(0, 24));
    expect(isBlackout(makeCard(), called)).toBe(false);
  });
  it('returns true when all 25 songs called', () => {
    expect(isBlackout(makeCard(), new Set(makeCard()))).toBe(true);
  });
});

describe('computeWinners', () => {
  it('returns empty arrays when nothing called', () => {
    const cards = [makeCard(0), makeCard(25), makeCard(50), makeCard(75)];
    const result = computeWinners(cards, new Set());
    expect(result).toEqual({ first: [], second: [], third: [] });
  });

  it('1st prize: sheet 1 eligible when card 1 has a row', () => {
    const cards = [makeCard(0), makeCard(25), makeCard(50), makeCard(75)];
    // Complete first row of card 1 (index 0): S0-S4
    const called = new Set(['S0','S1','S2','S3','S4']);
    const result = computeWinners(cards, called);
    expect(result.first).toContain(1);
    expect(result.first).not.toContain(2);
  });

  it('2nd prize: sheet eligible when same card has 2 lines', () => {
    const cards = [makeCard(0), makeCard(25), makeCard(50), makeCard(75)];
    // First row + first column of card 1
    const called = new Set(['S0','S1','S2','S3','S4','S5','S10','S15','S20']);
    const result = computeWinners(cards, called);
    expect(result.second).toContain(1);
  });

  it('3rd prize: sheet eligible on blackout of one card', () => {
    const cards = [makeCard(0), makeCard(25)];
    const called = new Set(makeCard(0)); // All songs from card 1
    const result = computeWinners(cards, called);
    expect(result.third).toContain(1);
  });

  it('2nd prize requires 2 lines on same card, not split across two', () => {
    // Sheet 1: card A has 1 line, card B has 1 line — should be 1st only
    const cardA = makeCard(0);
    const cardB = makeCard(25);
    const called = new Set([
      // Row 0 of cardA
      'S0','S1','S2','S3','S4',
      // Row 0 of cardB
      'S25','S26','S27','S28','S29',
    ]);
    const result = computeWinners([cardA, cardB], called);
    expect(result.first).toContain(1);
    expect(result.second).not.toContain(1);
  });
});
```

- [ ] **Step 6: Run winnerUtils tests — confirm they fail**

```bash
npm run test:run -- src/utils/winnerUtils.test.js
```

Expected: FAIL — "Cannot find module './winnerUtils.js'"

- [ ] **Step 7: Create src/utils/winnerUtils.js**

```js
// Returns 12 line index arrays for a 5×5 grid: 5 rows, 5 cols, 2 diagonals
export function getLines() {
  const lines = [];
  for (let r = 0; r < 5; r++) lines.push([0,1,2,3,4].map(c => r * 5 + c)); // rows
  for (let c = 0; c < 5; c++) lines.push([0,1,2,3,4].map(r => r * 5 + c)); // cols
  lines.push([0, 6, 12, 18, 24]); // top-left diagonal
  lines.push([4, 8, 12, 16, 20]); // top-right diagonal
  return lines;
}

// Count how many of the 12 lines are fully covered by calledSongsSet
export function countCompletedLines(card, calledSongsSet) {
  return getLines().filter(line =>
    line.every(idx => calledSongsSet.has(card[idx]))
  ).length;
}

// True if all 25 squares are covered
export function isBlackout(card, calledSongsSet) {
  return card.every(song => calledSongsSet.has(song));
}

// Returns { first: number[], second: number[], third: number[] }
// Each array contains 1-indexed sheet numbers eligible for that prize.
// Sheet N = cards at indices (N-1)*2 and (N-1)*2+1.
export function computeWinners(cards, calledSongsSet) {
  const sheetCount = Math.ceil(cards.length / 2);
  const first = [], second = [], third = [];

  for (let s = 0; s < sheetCount; s++) {
    const cardA = cards[s * 2];
    const cardB = cards[s * 2 + 1];
    const linesA = countCompletedLines(cardA, calledSongsSet);
    const linesB = cardB ? countCompletedLines(cardB, calledSongsSet) : 0;
    const blackoutA = isBlackout(cardA, calledSongsSet);
    const blackoutB = cardB ? isBlackout(cardB, calledSongsSet) : false;
    const sheet = s + 1;

    if (blackoutA || blackoutB) third.push(sheet);
    if (linesA >= 2 || linesB >= 2) second.push(sheet);
    if (linesA >= 1 || linesB >= 1) first.push(sheet);
  }

  return { first, second, third };
}
```

- [ ] **Step 8: Run all utility tests — confirm all pass**

```bash
npm run test:run
```

Expected: PASS — all tests across both files.

- [ ] **Step 9: Commit**

```bash
git add src/utils/ vite.config.js package.json package-lock.json
git commit -m "feat: add card and winner computation utilities with tests"
```

---

## Task 3: useGameState Hook

**Files:**
- Create: `src/hooks/useGameState.js`

- [ ] **Step 1: Create src/hooks/useGameState.js**

```js
import { useState, useMemo, useCallback, useEffect } from 'react';
import { generateCard, shuffle } from '../utils/cardUtils.js';

const STORAGE_KEY = 'bingo-playlists';

function loadPlaylists() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function savePlaylists(playlists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

export function useGameState() {
  // songs: array of { name, artist, uri, id, durationMs }
  // For manually added songs: uri/id/durationMs will be null
  const [songs, setSongs] = useState([]);
  const [cardCount, setCardCount] = useState(50);
  const [cardCountInput, setCardCountInput] = useState('50');
  const [selected, setSelected] = useState(() =>
    Array.from({ length: 50 }, () => Array(25).fill(false))
  );
  const [calledSongs, setCalledSongs] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [currentView, setCurrentView] = useState('grid');
  const [playlists, setPlaylists] = useState(loadPlaylists);

  useEffect(() => {
    setCardCountInput(String(cardCount));
    setSelected(prev => {
      if (prev.length === cardCount) return prev;
      return Array.from({ length: cardCount }, (_, i) =>
        prev[i] ?? Array(25).fill(false)
      );
    });
    setCurrentCard(c => Math.min(c, cardCount - 1));
  }, [cardCount]);

  const songNames = useMemo(() => songs.map(s => s.name), [songs]);

  const cards = useMemo(
    () => Array.from({ length: cardCount }, (_, i) => generateCard(songNames, i)),
    [songNames, cardCount]
  );

  const toggleCell = useCallback((cardIdx, cellIdx) => {
    setSelected(prev => {
      const next = prev.map(c => [...c]);
      next[cardIdx][cellIdx] = !next[cardIdx][cellIdx];
      return next;
    });
  }, []);

  function addCalledSong(songName) {
    setCalledSongs(prev =>
      prev.includes(songName) ? prev : [...prev, songName]
    );
  }

  function resetGame() {
    setCalledSongs([]);
    setSelected(Array.from({ length: cardCount }, () => Array(25).fill(false)));
    setCurrentCard(0);
  }

  function shuffleSongs() {
    setSongs(prev => shuffle([...prev], Date.now()));
  }

  function setSongsFromSpotify(trackList) {
    // trackList: array of { name, artist, uri, id, durationMs }
    setSongs(trackList);
    resetGame();
  }

  function addManualSong(name) {
    if (!name.trim()) return;
    if (songs.some(s => s.name === name.trim())) return;
    setSongs(prev => [...prev, { name: name.trim(), artist: null, uri: null, id: null, durationMs: null }]);
  }

  function removeSong(index) {
    setSongs(prev => prev.filter((_, i) => i !== index));
  }

  function savePlaylist(name) {
    if (!name.trim() || songs.length < 25) return;
    const updated = { ...playlists, [name.trim()]: songs };
    setPlaylists(updated);
    savePlaylists(updated);
  }

  function loadPlaylist(name) {
    if (playlists[name]) setSongs([...playlists[name]]);
  }

  function deletePlaylist(name) {
    const updated = { ...playlists };
    delete updated[name];
    setPlaylists(updated);
    savePlaylists(updated);
  }

  function applyCardCount(input) {
    const v = parseInt(input);
    if (v >= 1 && v <= 500) setCardCount(v);
    else setCardCountInput(String(cardCount));
  }

  return {
    songs, songNames, setSongsFromSpotify, addManualSong, removeSong, shuffleSongs,
    cardCount, cardCountInput, setCardCountInput, applyCardCount,
    cards, selected, toggleCell,
    calledSongs, addCalledSong, resetGame,
    currentCard, setCurrentCard,
    currentView, setCurrentView,
    playlists, savePlaylist, loadPlaylist, deletePlaylist,
  };
}
```

- [ ] **Step 2: Verify the app still runs (bingo.jsx still active)**

```bash
npm run dev
```

Open http://localhost:5173 — should load unchanged. Kill server.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameState.js
git commit -m "feat: add useGameState hook"
```

---

## Task 4: BingoCard Component

**Files:**
- Create: `src/components/BingoCard.jsx`

- [ ] **Step 1: Create src/components/BingoCard.jsx**

```jsx
import { GAME_NAME, COMPANY_NAME, COLORS } from '../config.js';

export default function BingoCard({ card, index, isSelected, onToggle, isCurrent }) {
  return (
    <div
      className={`bingo-card${isCurrent ? ' current-card' : ''}`}
      style={{
        background: 'white',
        border: `3px solid ${COLORS.purple}`,
        borderRadius: '12px',
        overflow: 'hidden',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        boxShadow: `0 4px 20px rgba(98,0,234,0.15)`,
        position: 'relative',
      }}
    >
      <div style={{
        background: COLORS.gradient,
        padding: '8px 12px 6px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '9px', color: 'rgba(255,255,255,0.8)',
          letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'sans-serif',
        }}>
          {COMPANY_NAME}
        </div>
        <div style={{
          fontSize: '22px', fontWeight: '900', color: 'white',
          letterSpacing: '2px', lineHeight: 1.1,
          fontFamily: 'Georgia, serif', textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {GAME_NAME}
        </div>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '1px', background: COLORS.purpleSoft, padding: '1px',
      }}>
        {card.map((song, i) => (
          <div
            key={i}
            style={{
              background: isSelected[i] ? COLORS.purplePale : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '3px 2px', minHeight: '52px',
              fontSize: '10px', fontWeight: '500', color: COLORS.navy,
              lineHeight: 1.2, fontFamily: 'sans-serif', cursor: 'pointer',
              transition: 'background 0.2s', wordBreak: 'break-word', hyphens: 'auto',
            }}
            onClick={() => onToggle(i)}
          >
            {song}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BingoCard.jsx
git commit -m "feat: add rebranded BingoCard component"
```

---

## Task 5: WinnerChecker Component

**Files:**
- Create: `src/components/WinnerChecker.jsx`

- [ ] **Step 1: Create src/components/WinnerChecker.jsx**

```jsx
import { useState, useMemo } from 'react';
import { computeWinners } from '../utils/winnerUtils.js';
import { COLORS } from '../config.js';

// awarded: { first: bool, second: bool, third: bool } — lifted to App.jsx so it persists across open/close
// onAward(key): called when host marks a tier as awarded
export default function WinnerChecker({ cards, calledSongs, onClose, awarded, onAward }) {
  const [lookupInput, setLookupInput] = useState('');

  const calledSet = useMemo(() => new Set(calledSongs), [calledSongs]);
  const winners = useMemo(() => computeWinners(cards, calledSet), [cards, calledSet]);

  const sheetCount = Math.ceil(cards.length / 2);
  const lookupNum = parseInt(lookupInput);
  const lookupValid = lookupNum >= 1 && lookupNum <= sheetCount;

  function markAwarded(tier) {
    onAward(tier);
  }

  const tierConfig = [
    { key: 'first',  label: '1st Prize', desc: '1 Line',              color: '#ffd700', bg: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.35)'   },
    { key: 'second', label: '2nd Prize', desc: '2 Lines on 1 Card',   color: '#c0c0c0', bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.35)' },
    { key: 'third',  label: '3rd Prize', desc: 'Blackout on 1 Card',  color: '#cd7f32', bg: 'rgba(205,127,50,0.1)',  border: 'rgba(205,127,50,0.35)'  },
  ];

  const btn = {
    borderRadius: '8px', fontWeight: '700', cursor: 'pointer', border: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1300,
      background: '#1a0040', display: 'flex', flexDirection: 'column',
      fontFamily: 'sans-serif', color: 'white', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 6px' }}>
        <div style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'Georgia, serif' }}>🏆 Winner Checker</div>
        <button onClick={onClose} style={{ ...btn, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '7px 14px', fontSize: '13px' }}>
          ✕ Back to Game
        </button>
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', padding: '0 24px 20px' }}>
        {calledSongs.length} songs called · {sheetCount} sheets in play
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '32px' }}>

        {/* Quick Lookup */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Quick Lookup
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: lookupValid ? '12px' : 0 }}>
            <input
              type="number" min="1" max={sheetCount}
              value={lookupInput}
              onChange={e => setLookupInput(e.target.value)}
              placeholder={`Sheet # (1–${sheetCount})`}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '15px',
                fontWeight: '700', outline: 'none',
              }}
            />
          </div>
          {lookupValid && (
            <div style={{ background: 'rgba(98,0,234,0.2)', border: `1px solid ${COLORS.purpleLight}`, borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontWeight: '800', color: COLORS.purpleLight, marginBottom: '6px', fontSize: '14px' }}>
                Sheet #{lookupNum}
              </div>
              {tierConfig.map(({ key, label, desc }) => {
                const eligible = winners[key].includes(lookupNum);
                return (
                  <div key={key} style={{ fontSize: '13px', color: eligible ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', padding: '2px 0' }}>
                    {eligible ? '✅' : '✗'} {label} ({desc})
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Prize Tiers */}
        {tierConfig.map(({ key, label, desc, color, bg, border }) => {
          const sheets = winners[key];
          const isAwarded = awarded[key];
          return (
            <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isAwarded ? 0 : '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color }}>
                  {isAwarded ? `🏆 ${label} — AWARDED` : `${label} — ${desc}`}
                </div>
                {!isAwarded && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: `${color}99`, background: `${color}18`, borderRadius: '5px', padding: '2px 8px' }}>
                      {sheets.length} eligible
                    </div>
                    {sheets.length > 0 && (
                      <button
                        onClick={() => markAwarded(key)}
                        style={{ ...btn, background: 'none', border: `1px solid ${color}`, color, fontSize: '11px', padding: '3px 10px' }}
                      >
                        Mark Awarded
                      </button>
                    )}
                  </div>
                )}
              </div>
              {!isAwarded && (
                sheets.length === 0
                  ? <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>No eligible sheets yet — keep playing</div>
                  : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sheets.slice(0, 20).map(n => (
                        <span key={n} style={{
                          background: `${color}20`, border: `1px solid ${color}66`,
                          borderRadius: '5px', padding: '3px 9px',
                          fontSize: '12px', fontWeight: '700', color,
                        }}>{n}</span>
                      ))}
                      {sheets.length > 20 && (
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', padding: '3px 5px' }}>+{sheets.length - 20} more</span>
                      )}
                    </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WinnerChecker.jsx
git commit -m "feat: add WinnerChecker component with quick lookup and prize tiers"
```

---

## Task 6: useSpotify Hook

**Files:**
- Create: `src/hooks/useSpotify.js`

- [ ] **Step 1: Create src/hooks/useSpotify.js**

```js
import { useState, useEffect, useRef, useCallback } from 'react';
import { REDIRECT_URI } from '../config.js';

// --- PKCE helpers ---

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function extractPlaylistId(input) {
  const match = input.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : input.trim();
}

// --- Spotify API helpers ---

async function apiGet(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify API error ${res.status}: ${url}`);
  return res.json();
}

async function fetchAllTracks(playlistId, accessToken) {
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(name,artists,uri,duration_ms,id)),next`;
  while (url) {
    const data = await apiGet(url, accessToken);
    tracks.push(
      ...data.items
        .filter(item => item.track && !item.track.is_local && item.track.uri)
        .map(item => ({
          name: item.track.name,
          artist: item.track.artists[0]?.name ?? '',
          uri: item.track.uri,
          id: item.track.id,
          durationMs: item.track.duration_ms,
        }))
    );
    url = data.next;
  }
  return tracks;
}

// Detect hook start using Audio Analysis API.
// Falls back to 40% of duration if the API is unavailable (deprecated for new apps).
async function detectHookStart(trackId, durationMs, accessToken) {
  try {
    const analysis = await apiGet(
      `https://api.spotify.com/v1/audio-analysis/${trackId}`,
      accessToken
    );
    const sections = analysis.sections ?? [];
    const middleStart = durationMs * 0.2;
    const middleEnd = durationMs * 0.8;
    const middle = sections.filter(s => s.start * 1000 >= middleStart && s.start * 1000 <= middleEnd);
    if (middle.length === 0) return Math.floor(durationMs * 0.4);
    // Loudness is negative dB — least negative = loudest
    const best = middle.reduce((a, b) => b.loudness > a.loudness ? b : a);
    return Math.round(best.start * 1000);
  } catch {
    return Math.floor(durationMs * 0.4);
  }
}

// Load the Spotify Web Playback SDK script once
function loadSDK() {
  return new Promise(resolve => {
    if (window.Spotify) { resolve(); return; }
    window.onSpotifyWebPlaybackSDKReady = resolve;
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.head.appendChild(script);
  });
}

// --- Hook ---

export function useSpotify(clientId) {
  const [accessToken, setAccessToken] = useState(() =>
    sessionStorage.getItem('spotify_access_token')
  );
  const [refreshTokenValue, setRefreshToken] = useState(() =>
    sessionStorage.getItem('spotify_refresh_token')
  );
  const [isPremium, setIsPremium] = useState(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [sdkError, setSdkError] = useState(null);
  const playerRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // Handle OAuth callback: exchange code for tokens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || !clientId) return;

    const verifier = sessionStorage.getItem('spotify_code_verifier');
    if (!verifier) return;

    (async () => {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        code_verifier: verifier,
      });
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json();
      if (data.access_token) {
        sessionStorage.setItem('spotify_access_token', data.access_token);
        sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
        sessionStorage.removeItem('spotify_code_verifier');
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        scheduleRefresh(data.expires_in);
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
  }, [clientId]);

  // Fetch user profile to check Premium
  useEffect(() => {
    if (!accessToken) return;
    apiGet('https://api.spotify.com/v1/me', accessToken)
      .then(data => setIsPremium(data.product === 'premium'))
      .catch(() => {});
  }, [accessToken]);

  // Initialize Web Playback SDK once we have a token
  useEffect(() => {
    if (!accessToken || !isPremium) return;
    loadSDK().then(() => {
      const player = new window.Spotify.Player({
        name: 'Queen City Games Music Bingo',
        getOAuthToken: cb => cb(accessToken),
        volume: 1.0,
      });
      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
        setIsSDKReady(true);
      });
      player.addListener('not_ready', () => setIsSDKReady(false));
      player.addListener('initialization_error', ({ message }) => setSdkError(message));
      player.addListener('authentication_error', ({ message }) => setSdkError(message));
      player.addListener('account_error', () => setSdkError('Spotify Premium required for in-browser playback.'));
      player.connect();
      playerRef.current = player;
    });
    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
      setIsSDKReady(false);
    };
  }, [accessToken, isPremium]);

  function scheduleRefresh(expiresIn) {
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      const stored = sessionStorage.getItem('spotify_refresh_token');
      if (!stored || !clientId) return;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: stored,
        client_id: clientId,
      });
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json();
      if (data.access_token) {
        sessionStorage.setItem('spotify_access_token', data.access_token);
        if (data.refresh_token) sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
        setAccessToken(data.access_token);
        scheduleRefresh(data.expires_in);
      }
    }, (expiresIn - 60) * 1000);
  }

  const connect = useCallback(async () => {
    if (!clientId) { alert('Enter your Spotify Client ID in src/config.js first.'); return; }
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem('spotify_code_verifier', verifier);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-modify-playback-state',
        'playlist-read-private',
        'playlist-read-collaborative',
      ].join(' '),
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });
    window.location = `https://accounts.spotify.com/authorize?${params}`;
  }, [clientId]);

  const disconnect = useCallback(() => {
    playerRef.current?.disconnect();
    playerRef.current = null;
    sessionStorage.removeItem('spotify_access_token');
    sessionStorage.removeItem('spotify_refresh_token');
    setAccessToken(null);
    setRefreshToken(null);
    setIsPremium(null);
    setIsSDKReady(false);
    setDeviceId(null);
  }, []);

  const fetchPlaylist = useCallback(async (urlOrId) => {
    if (!accessToken) throw new Error('Not authenticated');
    return fetchAllTracks(extractPlaylistId(urlOrId), accessToken);
  }, [accessToken]);

  const playTrack = useCallback(async (trackUri, positionMs) => {
    if (!accessToken || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ uris: [trackUri], position_ms: positionMs }),
    });
  }, [accessToken, deviceId]);

  const pausePlayback = useCallback(() => playerRef.current?.pause(), []);
  const resumePlayback = useCallback(() => playerRef.current?.resume(), []);

  const getHookStart = useCallback(async (trackId, durationMs) => {
    if (!accessToken) return Math.floor(durationMs * 0.4);
    return detectHookStart(trackId, durationMs, accessToken);
  }, [accessToken]);

  return {
    isAuthenticated: !!accessToken,
    isPremium,
    isSDKReady,
    sdkError,
    connect,
    disconnect,
    fetchPlaylist,
    playTrack,
    pausePlayback,
    resumePlayback,
    getHookStart,
  };
}
```

- [ ] **Step 2: Verify dev server still starts without errors**

```bash
npm run dev
```

Open http://localhost:5173. The original app (bingo.jsx) should still load. Kill server.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSpotify.js
git commit -m "feat: add useSpotify hook (PKCE OAuth, Web Playback SDK, playlist + hook detection)"
```

---

## Task 7: SongEditor Component

**Files:**
- Create: `src/components/SongEditor.jsx`

- [ ] **Step 1: Create src/components/SongEditor.jsx**

```jsx
import { useState, useRef } from 'react';
import { COLORS } from '../config.js';

export default function SongEditor({
  songs, playlists,
  onSave, onClose,
  onAddSong, onRemoveSong, onSavePlaylist, onLoadPlaylist, onDeletePlaylist,
  spotify, // { isAuthenticated, isPremium, sdkError, connect, fetchPlaylist }
  onLoadFromSpotify,
}) {
  const [tab, setTab] = useState('spotify');
  const [playlistInput, setPlaylistInput] = useState('');
  const [addInput, setAddInput] = useState('');
  const [saveNameInput, setSaveNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const fileRef = useRef();
  const addInputRef = useRef();

  const isValid = songs.length >= 25;

  async function handleLoadSpotifyPlaylist() {
    if (!playlistInput.trim()) return;
    setLoading(true);
    setLoadError(null);
    try {
      const tracks = await spotify.fetchPlaylist(playlistInput.trim());
      onLoadFromSpotify(tracks);
      setPlaylistInput('');
      setTab('edit');
    } catch (e) {
      setLoadError(e.message ?? 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }

  function handleAddSong() {
    if (!addInput.trim()) return;
    onAddSong(addInput.trim());
    setAddInput('');
    addInputRef.current?.focus();
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const raw = ev.target.result;
      const parsed = raw.includes('\n') ? raw.split('\n') : raw.split(',');
      parsed.map(s => s.trim()).filter(Boolean).forEach(name => onAddSong(name));
      setTab('edit');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const btnBase = { padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', border: 'none' };

  const tabs = [
    ['spotify', '🎵 Spotify'],
    ['edit', `✏️ Edit (${songs.length})`],
    ['playlists', `📂 Saved (${Object.keys(playlists).length})`],
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ width: '460px', maxWidth: '100vw', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ background: COLORS.gradient, padding: '20px 24px' }}>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: '800', fontFamily: 'Georgia, serif' }}>🎵 Songs & Playlists</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginTop: '4px' }}>Import from Spotify or edit manually</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${COLORS.purpleSoft}` }}>
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '12px 6px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '12px',
              background: tab === id ? COLORS.purplePale : 'white',
              color: tab === id ? COLORS.purple : '#888',
              borderBottom: tab === id ? `3px solid ${COLORS.purple}` : '3px solid transparent',
            }}>{label}</button>
          ))}
        </div>

        {/* Spotify Tab */}
        {tab === 'spotify' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!spotify.isAuthenticated ? (
              <>
                <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6 }}>
                  Connect your Spotify account to import playlists directly. Requires Spotify Premium for playback.
                </p>
                <button onClick={spotify.connect} style={{ ...btnBase, background: COLORS.gradient, color: 'white', padding: '12px', fontSize: '14px' }}>
                  Connect Spotify
                </button>
                <p style={{ fontSize: '12px', color: '#999' }}>
                  First time? Add <code>http://localhost:5173</code> as a redirect URI in your Spotify Developer app, then paste your Client ID into <code>src/config.js</code>.
                </p>
              </>
            ) : (
              <>
                {spotify.sdkError && (
                  <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e65100' }}>
                    ⚠ {spotify.sdkError}
                  </div>
                )}
                <div style={{ background: COLORS.purplePale, border: `1px solid ${COLORS.purpleSoft}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: COLORS.navy }}>
                  ✓ Connected to Spotify {spotify.isPremium ? '(Premium)' : '(Free — playback unavailable)'}
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px' }}>Paste playlist URL or ID</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={playlistInput}
                      onChange={e => setPlaylistInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLoadSpotifyPlaylist()}
                      placeholder="https://open.spotify.com/playlist/..."
                      style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: `2px solid ${COLORS.purpleSoft}`, outline: 'none', fontSize: '13px' }}
                    />
                    <button
                      onClick={handleLoadSpotifyPlaylist}
                      disabled={loading || !playlistInput.trim()}
                      style={{ ...btnBase, background: loading || !playlistInput.trim() ? '#e0e0e0' : COLORS.gradient, color: loading || !playlistInput.trim() ? '#9e9e9e' : 'white' }}
                    >
                      {loading ? '...' : 'Load'}
                    </button>
                  </div>
                  {loadError && <div style={{ fontSize: '12px', color: '#c62828', marginTop: '6px' }}>⚠ {loadError}</div>}
                </div>
                <button onClick={spotify.disconnect} style={{ ...btnBase, background: 'none', border: '1px solid #e0e0e0', color: '#999', fontSize: '12px' }}>
                  Disconnect
                </button>
              </>
            )}
          </div>
        )}

        {/* Edit Tab */}
        {tab === 'edit' && (
          <>
            <div style={{ padding: '12px 24px', background: COLORS.purplePale, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={addInputRef} value={addInput}
                onChange={e => setAddInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSong()}
                placeholder="Type a song name and press +"
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `2px solid ${COLORS.purpleSoft}`, outline: 'none', fontSize: '13px' }}
              />
              <button onClick={handleAddSong} disabled={!addInput.trim()} style={{ ...btnBase, width: '36px', height: '36px', padding: 0, fontSize: '20px', lineHeight: 1, borderRadius: '50%', background: addInput.trim() ? COLORS.purple : '#e0e0e0', color: 'white', flexShrink: 0 }}>+</button>
              <input ref={fileRef} type="file" accept=".txt,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
              <button onClick={() => fileRef.current.click()} style={{ ...btnBase, background: COLORS.navy, color: 'white', fontSize: '12px', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                📁 Upload
              </button>
            </div>
            <div style={{ padding: '6px 24px', background: COLORS.purplePale, borderBottom: `1px solid ${COLORS.purpleSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: COLORS.navy, fontWeight: '600' }}>
                {songs.length} songs {!isValid && <span style={{ color: '#d32f2f' }}>· ⚠ Need 25+</span>}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {songs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: '14px' }}>No songs yet. Import from Spotify or add manually.</div>
              )}
              {songs.map((song, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', background: i % 2 === 0 ? '#fafafa' : 'white', border: `1px solid ${COLORS.purpleSoft}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: COLORS.navy, fontWeight: '500' }}>{song.name}</div>
                    {song.artist && <div style={{ fontSize: '11px', color: '#888' }}>{song.artist}</div>}
                  </div>
                  <button onClick={() => onRemoveSong(i)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: COLORS.purplePale, color: COLORS.purple, fontWeight: '900', fontSize: '14px', cursor: 'pointer', lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 24px', background: '#f3e5f5', display: 'flex', gap: '8px' }}>
              <input
                value={saveNameInput} onChange={e => setSaveNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && isValid && saveNameInput.trim() && (onSavePlaylist(saveNameInput), setSaveNameInput(''))}
                placeholder="Save as playlist..."
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `2px solid ${COLORS.purpleSoft}`, outline: 'none', fontSize: '13px' }}
              />
              <button
                onClick={() => { if (saveNameInput.trim() && isValid) { onSavePlaylist(saveNameInput); setSaveNameInput(''); }}}
                disabled={!saveNameInput.trim() || !isValid}
                style={{ ...btnBase, background: saveNameInput.trim() && isValid ? COLORS.purple : '#e0e0e0', color: saveNameInput.trim() && isValid ? 'white' : '#9e9e9e', cursor: saveNameInput.trim() && isValid ? 'pointer' : 'not-allowed' }}
              >Save</button>
            </div>
            <div style={{ padding: '12px 24px 20px', display: 'flex', gap: '10px' }}>
              <button onClick={() => isValid && onSave()} disabled={!isValid} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: isValid ? COLORS.gradient : '#e0e0e0', color: isValid ? 'white' : '#9e9e9e', fontWeight: '800', fontSize: '14px', cursor: isValid ? 'pointer' : 'not-allowed' }}>
                Apply &amp; Regenerate Cards
              </button>
              <button onClick={onClose} style={{ ...btnBase, border: `2px solid ${COLORS.purple}`, background: 'white', color: COLORS.purple, padding: '12px 18px', fontSize: '14px' }}>Cancel</button>
            </div>
          </>
        )}

        {/* Playlists Tab */}
        {tab === 'playlists' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.keys(playlists).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: '14px' }}>
                No saved playlists.<br /><span style={{ fontSize: '12px' }}>Edit songs and save them with a name.</span>
              </div>
            ) : Object.entries(playlists).map(([name, songArr]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', border: `2px solid ${COLORS.purpleSoft}`, borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: COLORS.navy, fontSize: '14px' }}>{name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{songArr.length} songs</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => { onLoadPlaylist(name); setTab('edit'); }} style={{ ...btnBase, background: COLORS.gradient, color: 'white', fontSize: '12px', padding: '6px 14px' }}>Load</button>
                  <button onClick={() => onDeletePlaylist(name)} style={{ ...btnBase, background: 'white', border: '1px solid #e0e0e0', color: '#999', fontSize: '12px', padding: '6px 10px' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SongEditor.jsx
git commit -m "feat: add SongEditor component with Spotify import panel"
```

---

## Task 8: DJPanel Component

**Files:**
- Create: `src/components/DJPanel.jsx`

- [ ] **Step 1: Create src/components/DJPanel.jsx**

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS } from '../config.js';

export default function DJPanel({ songs, onAddCalledSong, onOpenWinners, onExit, spotify }) {
  // songs: array of { name, artist, uri, id, durationMs }
  const [queue] = useState(() => [...songs]); // order fixed at game start
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hookOffsets, setHookOffsets] = useState({}); // { [trackId]: startMs }
  const [autoHooks, setAutoHooks] = useState({});     // { [trackId]: startMs } from analysis
  const [hookLoading, setHookLoading] = useState(false);
  const [playError, setPlayError] = useState(null);
  const intervalRef = useRef(null);
  const playStartRef = useRef(null); // wall-clock ms when play started
  const hookStartRef = useRef(0);

  const currentSong = queue[currentIndex] ?? null;
  const isEnd = currentIndex >= queue.length;

  const getHookStart = useCallback((song) => {
    if (!song) return 0;
    if (hookOffsets[song.id] !== undefined) return hookOffsets[song.id];
    if (autoHooks[song.id] !== undefined) return autoHooks[song.id];
    return song.durationMs ? Math.floor(song.durationMs * 0.4) : 0;
  }, [hookOffsets, autoHooks]);

  // Auto-detect hook when song changes
  useEffect(() => {
    if (!currentSong || !currentSong.id || autoHooks[currentSong.id] !== undefined) return;
    setHookLoading(true);
    spotify.getHookStart(currentSong.id, currentSong.durationMs ?? 210000)
      .then(ms => setAutoHooks(prev => ({ ...prev, [currentSong.id]: ms })))
      .finally(() => setHookLoading(false));
  }, [currentIndex]);

  // Progress timer
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const newElapsed = (Date.now() - playStartRef.current) / 1000;
        setElapsed(newElapsed);
        if (newElapsed >= 30) {
          clearInterval(intervalRef.current);
          spotify.pausePlayback();
          setIsPlaying(false);
          setElapsed(30);
        }
      }, 100);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  async function handlePlay() {
    if (!currentSong?.uri) { setPlayError('No Spotify URI for this song.'); return; }
    setPlayError(null);
    const startMs = getHookStart(currentSong);
    hookStartRef.current = startMs;
    try {
      await spotify.playTrack(currentSong.uri, startMs);
      playStartRef.current = Date.now();
      setElapsed(0);
      setIsPlaying(true);
    } catch (e) {
      setPlayError('Playback failed. Is Spotify connected?');
    }
  }

  async function handlePause() {
    await spotify.pausePlayback();
    setIsPlaying(false);
  }

  function nudgeHook(deltaSec) {
    if (!currentSong) return;
    const current = getHookStart(currentSong);
    const max = (currentSong.durationMs ?? 210000) - 30000;
    const next = Math.max(0, Math.min(max, current + deltaSec * 1000));
    setHookOffsets(prev => ({ ...prev, [currentSong.id]: next }));
  }

  function resetHook() {
    if (!currentSong) return;
    setHookOffsets(prev => { const n = { ...prev }; delete n[currentSong.id]; return n; });
  }

  function handleNext() {
    clearInterval(intervalRef.current);
    spotify.pausePlayback();
    if (currentSong) onAddCalledSong(currentSong.name);
    setIsPlaying(false);
    setElapsed(0);
    setPlayError(null);
    setCurrentIndex(i => i + 1);
  }

  const progressPct = Math.min((elapsed / 30) * 100, 100);
  const isRed = elapsed > 25;
  const hookMs = currentSong ? getHookStart(currentSong) : 0;
  const hookDisplay = `${Math.floor(hookMs / 60000)}:${String(Math.floor((hookMs % 60000) / 1000)).padStart(2, '0')}`;
  const isAuto = currentSong && hookOffsets[currentSong.id] === undefined;

  const btn = { borderRadius: '10px', fontWeight: '700', cursor: 'pointer', border: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: COLORS.navy, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'sans-serif' }}>

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' }}>
        <button onClick={onExit} style={{ ...btn, background: 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.25)' }}>✕ Exit</button>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '600' }}>
          {isEnd ? 'All songs played!' : `Song ${currentIndex + 1} of ${queue.length}`}
        </div>
        <button onClick={onOpenWinners} style={{ ...btn, background: 'rgba(98,0,234,0.45)', color: 'white', padding: '8px 16px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.35)' }}>🏆 Winners</button>
      </div>

      {isEnd ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: COLORS.purpleLight }}>All songs played!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', maxWidth: '520px', padding: '0 24px' }}>

          {/* Song title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>🎵 Now Playing</div>
            <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'Georgia, serif', filter: isRevealed ? 'none' : 'blur(8px)', transition: 'filter 0.35s ease', userSelect: isRevealed ? 'auto' : 'none', lineHeight: 1.3 }}>
              {currentSong?.name}
            </div>
            {currentSong?.artist && (
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', filter: isRevealed ? 'none' : 'blur(5px)', transition: 'filter 0.35s ease' }}>
                {currentSong.artist}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', height: '12px', overflow: 'hidden', marginBottom: '5px' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: isRed ? '#f44336' : COLORS.gradient, borderRadius: '8px', transition: 'width 0.1s linear, background 0.3s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              <span>{Math.floor(elapsed)}s</span><span>30s</span>
            </div>
          </div>

          {/* Hook offset */}
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '12px', padding: '13px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontWeight: '700' }}>🎯 Hook Start</div>
              <div style={{ fontSize: '10px', color: hookLoading ? 'rgba(255,255,255,0.4)' : (isAuto ? 'rgba(120,230,160,0.85)' : COLORS.purpleLight), background: 'rgba(255,255,255,0.08)', borderRadius: '5px', padding: '2px 8px' }}>
                {hookLoading ? 'Detecting...' : (isAuto ? `Auto · ${hookDisplay}` : `Manual · ${hookDisplay}`)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => nudgeHook(-5)} style={{ ...btn, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '16px', lineHeight: 1 }}>−</button>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '6px', height: '8px' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (hookMs / (currentSong?.durationMs ?? 210000)) * 100)}%`, background: COLORS.purple, borderRadius: '6px' }} />
              </div>
              <button onClick={() => nudgeHook(5)} style={{ ...btn, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '16px', lineHeight: 1 }}>+</button>
              {!isAuto && <button onClick={resetHook} style={{ ...btn, fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '5px' }}>Reset</button>}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '6px' }}>± 5 second nudge per press</div>
          </div>

          {playError && (
            <div style={{ background: 'rgba(244,67,54,0.18)', border: '1px solid #f44336', borderRadius: '8px', padding: '10px 14px', color: '#ff8a80', fontSize: '13px', textAlign: 'center', width: '100%' }}>
              ⚠ {playError}
            </div>
          )}

          {/* Play/Pause */}
          <button onClick={isPlaying ? handlePause : handlePlay} style={{ ...btn, background: COLORS.gradient, color: 'white', padding: '18px 52px', fontSize: '22px', boxShadow: '0 8px 28px rgba(98,0,234,0.4)' }}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          {/* Reveal + Next */}
          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            <button
              onClick={() => setIsRevealed(r => !r)}
              style={{ ...btn, flex: 1, padding: '13px', fontSize: '14px', background: isRevealed ? 'rgba(98,0,234,0.35)' : 'rgba(255,255,255,0.08)', color: 'white', border: isRevealed ? `2px solid ${COLORS.purpleLight}` : '1px solid rgba(255,255,255,0.22)' }}
            >
              👁 Reveal: {isRevealed ? 'ON' : 'OFF'}
            </button>
            <button onClick={handleNext} style={{ ...btn, flex: 1, padding: '13px', fontSize: '14px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.22)' }}>
              ⏭ Next Song
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DJPanel.jsx
git commit -m "feat: add DJPanel with hook detection, reveal toggle, and Spotify playback"
```

---

## Task 9: App.jsx + Migration

**Files:**
- Create: `src/App.jsx`
- Modify: `src/main.jsx`
- Delete: `bingo.jsx`

- [ ] **Step 1: Create src/App.jsx**

```jsx
import { useState } from 'react';
import { useGameState } from './hooks/useGameState.js';
import { useSpotify } from './hooks/useSpotify.js';
import BingoCard from './components/BingoCard.jsx';
import SongEditor from './components/SongEditor.jsx';
import DJPanel from './components/DJPanel.jsx';
import WinnerChecker from './components/WinnerChecker.jsx';
import { COLORS, COMPANY_NAME, SPOTIFY_CLIENT_ID } from './config.js';

const EMPTY_ROW = Array(25).fill(false);

export default function App() {
  const game = useGameState();
  const spotify = useSpotify(SPOTIFY_CLIENT_ID);
  const [showEditor, setShowEditor] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  // Lifted here so awarded state persists when WinnerChecker closes and reopens
  const [awardedPrizes, setAwardedPrizes] = useState({ first: false, second: false, third: false });

  function handleStartGame() {
    if (game.songs.length < 25) { alert('Add at least 25 songs before starting.'); return; }
    game.resetGame();
    setAwardedPrizes({ first: false, second: false, third: false });
    setGameActive(true);
    setShowWinners(false);
  }

  function handleExitGame() {
    setGameActive(false);
    setShowWinners(false);
  }

  const btnStyle = {
    background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)',
    color: 'white', padding: '8px 16px', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '700', fontSize: '13px',
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.purplePale} 0%, #e8eaf6 100%)`, fontFamily: 'sans-serif' }}>

      {/* Toolbar */}
      <div className="no-print" style={{ background: COLORS.gradient, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div>
          <div style={{ color: 'white', fontSize: '22px', fontWeight: '900', fontFamily: 'Georgia, serif', letterSpacing: '1px' }}>
            ♪ {COMPANY_NAME}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>
            {game.songs.length} songs · {game.cardCount} unique cards
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}># Cards:</label>
            <input
              type="number" min="1" max="500" value={game.cardCountInput}
              onChange={e => game.setCardCountInput(e.target.value)}
              onBlur={() => game.applyCardCount(game.cardCountInput)}
              onKeyDown={e => { if (e.key === 'Enter') { game.applyCardCount(game.cardCountInput); e.target.blur(); } }}
              style={{ width: '60px', padding: '6px 8px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'center' }}
            />
          </div>

          <button onClick={() => setShowEditor(true)} style={btnStyle}>🎵 Songs &amp; Playlists</button>
          <button onClick={() => game.shuffleSongs()} disabled={game.songs.length < 25} style={{ ...btnStyle, opacity: game.songs.length < 25 ? 0.5 : 1 }}>🔀 Shuffle</button>
          <button onClick={handleStartGame} disabled={game.songs.length < 25} style={{ ...btnStyle, background: 'rgba(160,64,255,0.5)', border: '2px solid rgba(255,255,255,0.6)', opacity: game.songs.length < 25 ? 0.5 : 1 }}>🎮 Start Game</button>

          <button onClick={() => game.setCurrentView(v => v === 'grid' ? 'single' : 'grid')} style={btnStyle}>
            {game.currentView === 'grid' ? '📄 Single View' : '📋 All Cards'}
          </button>

          {game.currentView === 'single' && (
            <>
              <button onClick={() => game.setCurrentCard(c => Math.max(0, c - 1))} disabled={game.currentCard === 0} style={btnStyle}>◀</button>
              <span style={{ color: 'white', fontWeight: '700', alignSelf: 'center' }}>Card {game.currentCard + 1} / {game.cardCount}</span>
              <button onClick={() => game.setCurrentCard(c => Math.min(game.cardCount - 1, c + 1))} disabled={game.currentCard === game.cardCount - 1} style={btnStyle}>▶</button>
            </>
          )}

          <button onClick={game.resetGame} style={{ ...btnStyle, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)' }}>🔄 Reset</button>

          {game.currentView === 'single' ? (
            <button onClick={() => { document.body.classList.add('print-single'); window.print(); document.body.classList.remove('print-single'); }} style={{ background: 'white', border: 'none', color: COLORS.purple, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
              🖨️ Print This Card
            </button>
          ) : (
            <button onClick={() => window.print()} style={{ background: 'white', border: 'none', color: COLORS.purple, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
              🖨️ Print All Cards
            </button>
          )}
        </div>
      </div>

      {/* Card grid */}
      <div style={{ padding: '24px' }}>
        {game.songs.length < 25 ? (
          <div className="no-print" style={{ textAlign: 'center', padding: '80px 24px', color: COLORS.navy }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>No songs loaded</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Click "Songs &amp; Playlists" to import a Spotify playlist or add songs manually.</div>
          </div>
        ) : game.currentView === 'grid' ? (
          <>
            <div className="no-print" style={{ textAlign: 'center', marginBottom: '20px', color: COLORS.navy, fontSize: '13px', fontStyle: 'italic' }}>
              Click any cell to mark it · Print to get all {game.cardCount} physical cards
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {game.cards.map((card, i) => (
                <BingoCard key={i} card={card} index={i} isSelected={game.selected[i] ?? EMPTY_ROW} onToggle={cellIdx => game.toggleCell(i, cellIdx)} />
              ))}
            </div>
          </>
        ) : (
          <div style={{ maxWidth: '420px', margin: '0 auto' }}>
            <BingoCard card={game.cards[game.currentCard]} index={game.currentCard} isSelected={game.selected[game.currentCard] ?? EMPTY_ROW} onToggle={cellIdx => game.toggleCell(game.currentCard, cellIdx)} isCurrent />
            <div className="no-print" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
              {Array.from({ length: game.cardCount }, (_, i) => (
                <button key={i} onClick={() => game.setCurrentCard(i)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${COLORS.purple}`, background: game.currentCard === i ? COLORS.purple : 'white', color: game.currentCard === i ? 'white' : COLORS.purple, fontWeight: '700', fontSize: '10px', cursor: 'pointer', padding: 0 }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      {showEditor && (
        <SongEditor
          songs={game.songs}
          playlists={game.playlists}
          onSave={() => setShowEditor(false)}
          onClose={() => setShowEditor(false)}
          onAddSong={game.addManualSong}
          onRemoveSong={game.removeSong}
          onSavePlaylist={game.savePlaylist}
          onLoadPlaylist={game.loadPlaylist}
          onDeletePlaylist={game.deletePlaylist}
          spotify={spotify}
          onLoadFromSpotify={game.setSongsFromSpotify}
        />
      )}

      {/* DJPanel stays mounted for the full game so queue/playback state is preserved.
          WinnerChecker renders on top at a higher z-index when open. */}
      {gameActive && (
        <>
          <DJPanel
            songs={game.songs}
            onAddCalledSong={game.addCalledSong}
            onOpenWinners={() => setShowWinners(true)}
            onExit={handleExitGame}
            spotify={spotify}
          />
          {showWinners && (
            <WinnerChecker
              cards={game.cards}
              calledSongs={game.calledSongs}
              onClose={() => setShowWinners(false)}
              awarded={awardedPrizes}
              onAward={key => setAwardedPrizes(prev => ({ ...prev, [key]: true }))}
            />
          )}
        </>
      )}

      <style>{`
        @page { size: letter portrait; margin: 0.4in; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          div[style*="minHeight: 100vh"] { background: white !important; }
          div[style*="padding: 24px"] { padding: 0 !important; }
          div[style*="grid-template-columns: repeat(auto-fill"] { display: block !important; }
          .bingo-card { width: 4.9in !important; max-width: 4.9in !important; margin: 0 auto 0.1in !important; box-sizing: border-box !important; break-inside: avoid !important; page-break-inside: avoid !important; display: flex !important; flex-direction: column !important; height: 4.9in !important; }
          .bingo-card:nth-child(2n) { page-break-after: always !important; break-after: page !important; margin-bottom: 0 !important; }
          .bingo-card > div:nth-child(2) { flex: 1 !important; grid-template-rows: repeat(5, 1fr) !important; }
          body.print-single .bingo-card:not(.current-card) { display: none !important; }
          body.print-single .bingo-card.current-card { width: 5in !important; max-width: 5in !important; height: 5in !important; page-break-after: avoid !important; break-after: avoid !important; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Update src/main.jsx**

Replace the contents of `src/main.jsx` with:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Start dev server and verify the new app loads**

```bash
npm run dev
```

Open http://localhost:5173. You should see the Queen City Games header with purple/navy theme and the "No songs loaded" empty state. No console errors. Kill server.

- [ ] **Step 4: Delete bingo.jsx**

```bash
rm /mnt/c/src/SongBingo/bingo.jsx
```

- [ ] **Step 5: Verify again after bingo.jsx removal**

```bash
npm run dev
```

Open http://localhost:5173 — should still load cleanly. Kill server.

- [ ] **Step 6: Run all tests one final time**

```bash
npm run test:run
```

Expected: all utility tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/main.jsx
git rm bingo.jsx
git commit -m "feat: wire App.jsx, migrate main.jsx, remove bingo.jsx — migration complete"
```

---

## Manual Testing Checklist

After completing all tasks, verify these flows end-to-end in the browser:

- [ ] App loads with Queen City Games branding, purple/navy colors
- [ ] "MUSIC BINGO" appears on card headers
- [ ] Card count input updates the grid
- [ ] Print layout: 2 cards per page, correct sizing
- [ ] Songs panel opens as side panel, Spotify tab is default
- [ ] With `SPOTIFY_CLIENT_ID` empty: clicking Connect shows an alert
- [ ] With valid `SPOTIFY_CLIENT_ID`: OAuth redirect initiates, tokens stored in sessionStorage after return
- [ ] Pasting a Spotify playlist URL loads songs into the Edit tab
- [ ] Shuffle button randomizes song order
- [ ] Start Game launches DJ Panel
- [ ] DJ Panel shows blurred song title, Reveal toggle persists across Next Song
- [ ] Hook − / + buttons update the displayed start time; Reset returns to Auto
- [ ] Next Song adds song to calledSongs and advances
- [ ] Winners button opens WinnerChecker; Back to Game returns without stopping imaginary playback
- [ ] Quick Lookup correctly identifies eligible/ineligible prize tiers for a sheet number
- [ ] Mark Awarded collapses the tier row
