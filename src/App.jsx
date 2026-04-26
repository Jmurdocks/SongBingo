import { useState } from 'react';
import { useGameState } from './hooks/useGameState.js';
import { useSpotify } from './hooks/useSpotify.js';
import BingoCard from './components/BingoCard.jsx';
import SongEditor from './components/SongEditor.jsx';
import DJPanel from './components/DJPanel.jsx';
import WinnerChecker from './components/WinnerChecker.jsx';
import { COLORS, COMPANY_NAME, GAME_NAME, SPOTIFY_CLIENT_ID } from './config.js';

const EMPTY_ROW = Array(25).fill(false);

function SheetFooter({ sheetNumber }) {
  return (
    <div className="sheet-footer" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px', borderTop: '1.5px solid #ddd', background: 'white',
    }}>
      <div>
        <div style={{ fontSize: '38px', fontWeight: '900', color: COLORS.navy, fontFamily: 'Georgia, serif', letterSpacing: '2px', lineHeight: 1, textShadow: '2px 2px 0 rgba(98,0,234,0.15)' }}>
          {GAME_NAME}
        </div>
        <div style={{ fontSize: '10px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '3px' }}>
          {COMPANY_NAME}
        </div>
      </div>
      <div style={{ background: COLORS.navy, color: 'white', borderRadius: '10px', padding: '8px 20px', textAlign: 'center', minWidth: '80px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>Sheet</div>
        <div style={{ fontSize: '36px', fontWeight: '900', lineHeight: 1 }}>{sheetNumber}</div>
      </div>
    </div>
  );
}

function BingoSheet({ sheetNumber, cards, cardIndices, selected, onToggle, currentCard }) {
  return (
    <div className="bingo-sheet" style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '8px', overflow: 'visible', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div className="bingo-sheet-cards" style={{ display: 'flex', flex: 1, gap: '20px', padding: '0 40px', alignItems: 'center', justifyContent: 'center' }}>
        {cards.map((card, j) => (
          <div key={j} className="card-wrapper" style={{ flex: '0 0 44%', display: 'flex', flexDirection: 'column' }}>
            <BingoCard
              card={card}
              isSelected={selected[j] ?? EMPTY_ROW}
              onToggle={i => onToggle(cardIndices[j], i)}
              isCurrent={currentCard === cardIndices[j]}
            />
          </div>
        ))}
      </div>
      <SheetFooter sheetNumber={sheetNumber} />
    </div>
  );
}

export default function App() {
  const game = useGameState();
  const spotify = useSpotify(SPOTIFY_CLIENT_ID);
  const [showEditor, setShowEditor] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  const [awardedPrizes, setAwardedPrizes] = useState({ first: false, second: false, third: false });

  const sheetCount = Math.ceil(game.cardCount / 2);
  const currentSheetIdx = Math.floor(game.currentCard / 2);

  function buildSheet(sheetIdx) {
    const leftIdx = sheetIdx * 2;
    const rightIdx = sheetIdx * 2 + 1;
    const cardIndices = [leftIdx, rightIdx].filter(i => i < game.cardCount);
    return {
      sheetNumber: sheetIdx + 1,
      cards: cardIndices.map(i => game.cards[i]),
      cardIndices,
      selected: cardIndices.map(i => game.selected[i] ?? EMPTY_ROW),
    };
  }

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
      <div className="no-print" style={{ background: COLORS.gradient, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div>
          <div style={{ color: 'white', fontSize: '22px', fontWeight: '900', fontFamily: 'Georgia, serif', letterSpacing: '1px' }}>
            ♪ {COMPANY_NAME}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>
            {game.songs.length} songs · {sheetCount} sheets · {game.cardCount} cards
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}># Sheets:</label>
            <input
              type="number" min="1" max="500"
              value={String(Math.max(1, Math.round(parseInt(game.cardCountInput || '50') / 2)))}
              onChange={e => game.setCardCountInput(String(Math.max(2, parseInt(e.target.value || '1', 10) * 2)))}
              onBlur={() => game.applyCardCount(game.cardCountInput)}
              onKeyDown={e => { if (e.key === 'Enter') { game.applyCardCount(game.cardCountInput); e.target.blur(); } }}
              style={{ width: '60px', padding: '6px 8px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'center' }}
            />
          </div>

          <button onClick={() => setShowEditor(true)} style={btnStyle}>🎵 Songs &amp; Playlists</button>
          <button onClick={() => game.shuffleSongs()} disabled={game.songs.length < 25} style={{ ...btnStyle, opacity: game.songs.length < 25 ? 0.5 : 1 }}>🔀 Shuffle</button>
          <button onClick={handleStartGame} disabled={game.songs.length < 25} style={{ ...btnStyle, background: 'rgba(160,64,255,0.5)', border: '2px solid rgba(255,255,255,0.6)', opacity: game.songs.length < 25 ? 0.5 : 1 }}>🎮 Start Game</button>

          <button onClick={() => game.setCurrentView(v => v === 'grid' ? 'single' : 'grid')} style={btnStyle}>
            {game.currentView === 'grid' ? '📄 Single View' : '📋 All Sheets'}
          </button>

          {game.currentView === 'single' && (
            <>
              <button onClick={() => game.setCurrentCard(Math.max(0, currentSheetIdx - 1) * 2)} disabled={currentSheetIdx === 0} style={btnStyle}>◀</button>
              <span style={{ color: 'white', fontWeight: '700', alignSelf: 'center' }}>
                Sheet {currentSheetIdx + 1} of {sheetCount}
              </span>
              <button onClick={() => game.setCurrentCard(Math.min(sheetCount - 1, currentSheetIdx + 1) * 2)} disabled={currentSheetIdx === sheetCount - 1} style={btnStyle}>▶</button>
            </>
          )}

          <button onClick={game.resetGame} style={{ ...btnStyle, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)' }}>🔄 Reset</button>

          {game.currentView === 'single' ? (
            <button onClick={() => { document.body.classList.add('print-single'); window.print(); document.body.classList.remove('print-single'); }} style={{ background: 'white', border: 'none', color: COLORS.purple, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
              🖨️ Print This Sheet
            </button>
          ) : (
            <button onClick={() => window.print()} style={{ background: 'white', border: 'none', color: COLORS.purple, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
              🖨️ Print All Sheets
            </button>
          )}
        </div>
      </div>

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
              Click any cell to mark it · Print to get all {sheetCount} sheets (2 cards per sheet)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Array.from({ length: sheetCount }, (_, si) => {
                const s = buildSheet(si);
                return (
                  <BingoSheet
                    key={si}
                    sheetNumber={s.sheetNumber}
                    cards={s.cards}
                    cardIndices={s.cardIndices}
                    selected={s.selected}
                    onToggle={game.toggleCell}
                    currentCard={game.currentCard}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            {(() => {
              const s = buildSheet(currentSheetIdx);
              return (
                <BingoSheet
                  sheetNumber={s.sheetNumber}
                  cards={s.cards}
                  cardIndices={s.cardIndices}
                  selected={s.selected}
                  onToggle={game.toggleCell}
                  currentCard={game.currentCard}
                />
              );
            })()}
            <div className="no-print" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
              {Array.from({ length: sheetCount }, (_, si) => (
                <button key={si} onClick={() => game.setCurrentCard(si * 2)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${COLORS.purple}`, background: currentSheetIdx === si ? COLORS.purple : 'white', color: currentSheetIdx === si ? 'white' : COLORS.purple, fontWeight: '700', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                  {si + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
        @page { size: letter landscape; margin: 0.25in; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          div[style*="minHeight: 100vh"] { background: white !important; }
          div[style*="padding: 24px"] { padding: 0 !important; }
          div[style*="flex-direction: column"][style*="gap: 24px"] { gap: 0 !important; }
          .bingo-sheet {
            display: flex !important; flex-direction: column !important;
            height: 8in !important;
            break-after: page !important; page-break-after: always !important;
            margin: 0 !important; border-radius: 0 !important;
            border: none !important; box-shadow: none !important;
            background: white !important; overflow: visible !important;
          }
          .bingo-sheet:last-child { break-after: auto !important; page-break-after: auto !important; }
          .bingo-sheet-cards { display: flex !important; flex: 1 !important; gap: 18px !important; padding: 0 36px !important; align-items: center !important; justify-content: center !important; }
          .card-wrapper { flex: 0 0 44% !important; display: flex !important; flex-direction: column !important; }
          .bingo-card { flex: 1 !important; border-radius: 10px !important; }
          .sheet-footer { display: flex !important; flex-shrink: 0 !important; }
          body.print-single .bingo-sheet { display: none !important; }
          body.print-single .bingo-sheet:has(.current-card) { display: flex !important; height: 8in !important; }
        }
      `}</style>
    </div>
  );
}
