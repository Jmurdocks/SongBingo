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
