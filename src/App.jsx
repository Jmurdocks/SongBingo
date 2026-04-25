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
