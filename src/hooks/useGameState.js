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
    cardCount, cardCountInput, setCardCountInput, applyCardCount,
    cards, selected, toggleCell,
    calledSongs, addCalledSong, resetGame,
    currentCard, setCurrentCard,
    currentView, setCurrentView,
    playlists, savePlaylist, loadPlaylist, deletePlaylist,
  };
}
