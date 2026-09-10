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
