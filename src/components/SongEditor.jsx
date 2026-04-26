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
                  First time? Add <code>http://127.0.0.1:5173</code> as a redirect URI in your Spotify Developer app, then paste your Client ID into <code>src/config.js</code>.
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
