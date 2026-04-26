import { GAME_NAME, COMPANY_NAME, COLORS } from '../config.js';

export default function BingoCard({ card, isSelected, onToggle, isCurrent }) {
  return (
    <div
      className={`bingo-card${isCurrent ? ' current-card' : ''}`}
      style={{
        background: 'white',
        border: '4px solid #888',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ padding: '5px 10px 4px', borderBottom: '2px solid #ccc' }}>
        <div style={{ fontSize: '7px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'sans-serif', lineHeight: 1, marginBottom: '2px' }}>
          {COMPANY_NAME}
        </div>
        <div style={{ fontSize: '15px', fontWeight: '900', color: COLORS.purple, fontFamily: 'Georgia, serif', letterSpacing: '1px', lineHeight: 1 }}>
          {GAME_NAME}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}>
        {card.map((song, i) => (
          <div
            key={i}
            style={{
              borderRight: i % 5 !== 4 ? '2px solid #ccc' : 'none',
              borderBottom: i < 20 ? '2px solid #ccc' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '2px 4px', minHeight: '73px',
              fontSize: '9px', fontWeight: '500', color: '#222',
              lineHeight: 1.2, fontFamily: 'sans-serif', cursor: 'pointer',
              background: isSelected[i] ? COLORS.purplePale : 'white',
              transition: 'background 0.15s',
              wordBreak: 'break-word', hyphens: 'auto',
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
