import { useState, useMemo, useCallback, useEffect } from 'react';
import { generateCard, shuffle } from '../utils/cardUtils.js';

const STORAGE_KEY = 'bingo-playlists';

const DEFAULT_WINNER_WINDOWS = [
  { min: 20, max: 30, label: '1st Prize' },
  { min: 40, max: 50, label: '2nd Prize' },
  { min: 60, max: 75, label: '3rd Prize' },
];

function loadPlaylists() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function savePlaylists(playlists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

export function useGameState() {
  const [songs, setSongs] = useState([]);
  const [activeSongs, setActiveSongs] = useState([]);
  const [extensionSongs, setExtensionSongs] = useState([]);
  const [winnerWindows, setWinnerWindows] = useState(DEFAULT_WINNER_WINDOWS);
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
    setActiveSongs([]);
    setExtensionSongs([]);
    setSelected(prev => Array.from({ length: prev.length }, () => Array(25).fill(false)));
    setCurrentCard(0);
  }

  function prepareGame(playCount) {
    const count = Math.min(Math.max(25, playCount), songs.length);

    // Pick 3 random cards and guarantee all their songs are in the active set.
    // This ensures blackout is achievable on those cards within the main queue.
    const seed = Date.now();
    const cardOrder = shuffle(Array.from({ length: cards.length }, (_, i) => i), seed);
    const required = new Set();
    for (let i = 0; i < Math.min(3, cardOrder.length) && required.size < count; i++) {
      cards[cardOrder[i]].forEach(s => required.add(s));
    }

    const requiredSongs = songs.filter(s => required.has(s.name));
    const optionalSongs = shuffle(songs.filter(s => !required.has(s.name)), seed + 1);
    const active = shuffle([...requiredSongs, ...optionalSongs].slice(0, count), seed + 2);

    setActiveSongs(active);
    const activeNames = new Set(active.map(s => s.name));
    setExtensionSongs(shuffle(songs.filter(s => !activeNames.has(s.name)), seed + 3));
    setCalledSongs([]);
    setSelected(prev => Array.from({ length: prev.length }, () => Array(25).fill(false)));
    setCurrentCard(0);
  }

  function shuffleSongs() {
    setSongs(prev => shuffle([...prev], Date.now()));
  }

  function setSongsFromSpotify(trackList) {
    setSongs(trackList);
    resetGame();
  }

  function addManualSong(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSongs(prev => {
      if (prev.some(s => s.name === trimmed)) return prev;
      return [...prev, { name: trimmed, artist: null, uri: null, id: null, durationMs: null }];
    });
  }

  function removeSong(index) {
    setSongs(prev => prev.filter((_, i) => i !== index));
  }

  const savePlaylist = useCallback((name) => {
    if (!name.trim() || songs.length < 25) return;
    const updated = { ...playlists, [name.trim()]: songs };
    setPlaylists(updated);
    savePlaylists(updated);
  }, [songs, playlists]);

  const loadPlaylist = useCallback((name) => {
    if (playlists[name]) setSongs([...playlists[name]]);
  }, [playlists]);

  const deletePlaylist = useCallback((name) => {
    const updated = { ...playlists };
    delete updated[name];
    setPlaylists(updated);
    savePlaylists(updated);
  }, [playlists]);

  const applyCardCount = useCallback((input) => {
    const v = parseInt(input, 10);
    if (v >= 2 && v <= 1000) setCardCount(v);
    else setCardCountInput(String(cardCount));
  }, [cardCount]);

  return {
    songs, songNames, setSongsFromSpotify, addManualSong, removeSong, shuffleSongs,
    activeSongs, extensionSongs, prepareGame,
    winnerWindows, setWinnerWindows,
    cardCount, cardCountInput, setCardCountInput, applyCardCount,
    cards, selected, toggleCell,
    calledSongs, addCalledSong, resetGame,
    currentCard, setCurrentCard,
    currentView, setCurrentView,
    playlists, savePlaylist, loadPlaylist, deletePlaylist,
  };
}
