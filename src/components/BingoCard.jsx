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
