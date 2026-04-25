import { useState, useCallback, useMemo, useRef, useEffect } from "react";

const DEFAULT_SONGS = [
  "The Best of Both Worlds", "Who Said", "Just Like You", "Pumpin' Up the Party",
  "If We Were a Movie", "I Got Nerve", "The Other Side of Me", "This Is the Life",
  "I Learned from You", "Nobody's Perfect", "Make Some Noise", "Rock Star",
  "Old Blue Jeans", "Life's What You Make It", "Mixed Up", "True Friend",
  "We Got the Party", "He Could Be the One", "Ice Cream Freeze (Let's Chill)",
  "Ordinary Girl", "I'm Still Good", "Gonna Get This", "Supergirl",
  "Let's Get Crazy", "Bigger Than Us", "You and Me Together", "Talk Is Cheap",
  "Spotlight", "Are You Ready", "Let's Do This", "Back to Tennessee",
  "Backwards", "Hoedown Throwdown", "It's All Right Here", "Don't Wanna Be Torn",
  "Welcome to Hollywood", "Every Little Thing She Does", "Wherever I Go",
  "Barefoot Cinderella", "The Good Life", "Bless the Broken Road",
  "Game Over", "Dream", "See You Again (HM)", "Shining Star",
  "When You Wish Upon a Star",
  "See You Again", "Start All Over", "G.N.O. (Girl's Night Out)",
  "The Last Goodbye", "Right Here", "Good and Broken", "Clear", "As I Am",
  "East Northumberland High", "I Miss You", "Breakout", "7 Things",
  "Fly on the Wall", "Bottom of the Ocean", "Wake Up America",
  "These Four Walls", "Goodbye", "Kicking and Screaming", "Simple Song",
  "Full Circle", "Before the Storm", "Party in the U.S.A.", "The Climb",
  "The Time of Our Lives", "When I Look at You", "Can't Be Tamed",
  "Who Owns My Heart", "Take Me Along", "Liberty Walk", "Stay",
  "Robot", "Forgiveness and Love", "Permanent December",
  "Two More Lonely People", "Scars", "My Heart Beats for Love",
  "Every Rose Has Its Thorn", "DC", "Obsessed",
  "Butterfly Fly Away", "The Climb (Miley)", "I Hope You Find It",
  "You'll Always Find Your Way Back Home", "Dream All Day",
  "Rockstar", "Are You Ready (Miley)",
];

const STORAGE_KEY = "bingo-playlists";

function loadPlaylists() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePlaylists(playlists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

function shuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildFileMap(files, songs) {
  const map = new Map();
  const fileArr = Array.from(files);
  for (const song of songs) {
    const normSong = normalize(song);
    // Exact match first
    let match = fileArr.find(f => normalize(f.name.replace(/\.[^.]+$/, "")) === normSong);
    // Containment match
    if (!match) {
      match = fileArr.find(f => {
        const normFile = normalize(f.name.replace(/\.[^.]+$/, ""));
        return normFile.includes(normSong) || normSong.includes(normFile);
      });
    }
    if (match) {
      map.set(song, { url: URL.createObjectURL(match), originalName: match.name });
    }
  }
  return map;
}

function generateCard(songList, cardIndex) {
  const shuffled = shuffle(songList, cardIndex * 999983 + 42);
  return shuffled.slice(0, 25);
}

const EMPTY_ROW = Array(25).fill(false);

function BingoCard({ card, index, isSelected, onToggle, isCurrent }) {
  return (
    <div
      className={`bingo-card${isCurrent ? " current-card" : ""}`}
      style={{
        background: "white", border: "3px solid #c2185b", borderRadius: "12px",
        overflow: "hidden", pageBreakInside: "avoid", breakInside: "avoid",
        boxShadow: "0 4px 20px rgba(194,24,91,0.15)", position: "relative",
      }}
    >
      <div style={{ background: "linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%)", padding: "8px 12px 6px", textAlign: "center" }}>
        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "sans-serif" }}>
          Queen City
        </div>
        <div style={{ fontSize: "26px", fontWeight: "900", color: "white", letterSpacing: "2px", lineHeight: 1.1, fontFamily: "Georgia, serif", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
          SINGO
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1px", background: "#f8bbd9", padding: "1px" }}>
        {card.map((song, i) => (
          <div key={i}
            style={{
              background: isSelected[i] ? "#fce4ec" : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              textAlign: "center", padding: "3px 2px", minHeight: "52px",
              fontSize: "10px", fontWeight: "500", color: "#4a0030",
              lineHeight: 1.2, fontFamily: "sans-serif", cursor: "pointer",
              transition: "background 0.2s", wordBreak: "break-word", hyphens: "auto",
            }}
            onClick={() => onToggle(i)}
          >{song}</div>
        ))}
      </div>
    </div>
  );
}

function SongEditor({ songs, activePlaylist, onSave, onClose }) {
  const [list, setList] = useState(() => [...songs]);
  const [addInput, setAddInput] = useState("");
  const [playlists, setPlaylists] = useState(loadPlaylists);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [tab, setTab] = useState("edit");
  const fileRef = useRef();
  const addInputRef = useRef();

  const isValid = list.length >= 25;

  function addSong() {
    const val = addInput.trim();
    if (!val) return;
    if (!list.includes(val)) setList(prev => [...prev, val]);
    setAddInput("");
    addInputRef.current?.focus();
  }

  function removeSong(i) {
    setList(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target.result;
      const parsed = raw.includes("\n") ? raw.split("\n") : raw.split(",");
      const cleaned = parsed.map(s => s.trim()).filter(Boolean);
      setList(prev => {
        const combined = [...prev, ...cleaned];
        return [...new Set(combined)];
      });
      setTab("edit");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleSavePlaylist() {
    const name = saveNameInput.trim();
    if (!name || !isValid) return;
    const updated = { ...playlists, [name]: list };
    setPlaylists(updated);
    savePlaylists(updated);
    setSaveNameInput("");
  }

  function handleLoadPlaylist(name) {
    setList([...playlists[name]]);
    setTab("edit");
  }

  function handleDeletePlaylist(name) {
    const updated = { ...playlists };
    delete updated[name];
    setPlaylists(updated);
    savePlaylists(updated);
  }

  const btnBase = {
    padding: "8px 14px", borderRadius: "8px", fontWeight: "700",
    fontSize: "13px", cursor: "pointer", border: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "stretch", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} />
      <div style={{ width: "460px", maxWidth: "100vw", background: "white", display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%)", padding: "20px 24px" }}>
          <div style={{ color: "white", fontSize: "18px", fontWeight: "800", fontFamily: "Georgia, serif" }}>🎵 Song Lists</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", marginTop: "4px" }}>Add, remove, or upload songs</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #f8bbd9" }}>
          {[["edit", "✏️ Edit Songs"], ["playlists", `📂 Playlists (${Object.keys(playlists).length})`]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "12px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px",
              background: tab === id ? "#fce4ec" : "white",
              color: tab === id ? "#e91e8c" : "#888",
              borderBottom: tab === id ? "3px solid #e91e8c" : "3px solid transparent",
            }}>{label}</button>
          ))}
        </div>

        {tab === "edit" && (
          <>
            {/* Add song input */}
            <div style={{ padding: "12px 24px", background: "#fce4ec", display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                ref={addInputRef}
                value={addInput}
                onChange={e => setAddInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSong()}
                placeholder="Type a song name and press +"
                style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "2px solid #f48fb1", outline: "none", fontSize: "13px", color: "#4a0030", background: "white" }}
              />
              <button
                onClick={addSong}
                disabled={!addInput.trim()}
                style={{ ...btnBase, width: "36px", height: "36px", padding: 0, fontSize: "20px", lineHeight: 1, borderRadius: "50%", background: addInput.trim() ? "#e91e8c" : "#e0e0e0", color: "white", flexShrink: 0 }}
              >+</button>
              <input ref={fileRef} type="file" accept=".txt,.csv" style={{ display: "none" }} onChange={handleFileUpload} />
              <button onClick={() => fileRef.current.click()} style={{ ...btnBase, background: "#9c27b0", color: "white", fontSize: "12px", padding: "8px 12px", whiteSpace: "nowrap" }}>
                📁 Upload
              </button>
            </div>

            {/* Stats + reset */}
            <div style={{ padding: "6px 24px", background: "#fce4ec", borderBottom: "1px solid #f8bbd9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#880e4f", fontWeight: "600" }}>
                {list.length} songs
                {!isValid && <span style={{ color: "#d32f2f" }}> · ⚠ Need 25+</span>}
              </span>
              <button onClick={() => setList([...DEFAULT_SONGS])} style={{ ...btnBase, background: "none", border: "1px solid #e91e8c", color: "#e91e8c", fontSize: "11px", padding: "4px 10px" }}>
                Reset to defaults
              </button>
            </div>

            {/* Song list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px", display: "flex", flexDirection: "column", gap: "4px"  }}>
              {list.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb", fontSize: "14px" }}>No songs yet. Add one above or upload a file.</div>
              )}
              {list.map((song, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "8px", background: i % 2 === 0 ? "#fafafa" : "white", border: "1px solid #f8bbd9" }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "#4a0030" }}>{song}</span>
                  <button
                    onClick={() => removeSong(i)}
                    style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "#fce4ec", color: "#e91e8c", fontWeight: "900", fontSize: "14px", cursor: "pointer", lineHeight: 1, padding: 0, flexShrink: 0 }}
                  >✕</button>
                </div>
              ))}
            </div>

            {/* Save as playlist */}
            <div style={{ padding: "12px 24px", background: "#f3e5f5", display: "flex", gap: "8px" }}>
              <input
                value={saveNameInput}
                onChange={e => setSaveNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSavePlaylist()}
                placeholder="Save as playlist..."
                style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "2px solid #ce93d8", outline: "none", fontSize: "13px", color: "#4a0030" }}
              />
              <button
                onClick={handleSavePlaylist}
                disabled={!saveNameInput.trim() || !isValid}
                style={{ ...btnBase, background: saveNameInput.trim() && isValid ? "#9c27b0" : "#e0e0e0", color: saveNameInput.trim() && isValid ? "white" : "#9e9e9e", cursor: saveNameInput.trim() && isValid ? "pointer" : "not-allowed" }}
              >Save</button>
            </div>

            {/* Apply button */}
            <div style={{ padding: "12px 24px 20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => { if (isValid) onSave(list); }}
                disabled={!isValid}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: isValid ? "linear-gradient(135deg, #e91e8c, #9c27b0)" : "#e0e0e0", color: isValid ? "white" : "#9e9e9e", fontWeight: "800", fontSize: "14px", cursor: isValid ? "pointer" : "not-allowed" }}
              >Apply &amp; Regenerate Cards</button>
              <button onClick={onClose} style={{ ...btnBase, border: "2px solid #e91e8c", background: "white", color: "#e91e8c", padding: "12px 18px", fontSize: "14px"  }}>Cancel</button>
            </div>
          </>
        )}

        {tab === "playlists" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#9e9e9e", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>Built-in</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fafafa", border: "2px solid #f8bbd9", borderRadius: "10px" }}>
                <div>
                  <div style={{ fontWeight: "700", color: "#4a0030", fontSize: "14px" }}>Hannah Montana / Miley Cyrus</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{DEFAULT_SONGS.length} songs</div>
                </div>
                <button onClick={() => { setList([...DEFAULT_SONGS]); setTab("edit"); }} style={{ ...btnBase, background: "#e91e8c", color: "white", fontSize: "12px", padding: "6px 14px" }}>Load</button>
              </div>
            </div>
            {Object.keys(playlists).length > 0 && (
              <div>
                <div style={{ fontSize: "11px", color: "#9e9e9e", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", margin: "16px 0 8px" }}>Saved</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {Object.entries(playlists).map(([name, songArr]) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fafafa", border: "2px solid #f8bbd9", borderRadius: "10px" }}>
                      <div>
                        <div style={{ fontWeight: "700", color: "#4a0030", fontSize: "14px" }}>{name}</div>
                        <div style={{ fontSize: "12px", color: "#888" }}>{songArr.length} songs</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleLoadPlaylist(name)} style={{ ...btnBase, background: "#e91e8c", color: "white", fontSize: "12px", padding: "6px 14px" }}>Load</button>
                        <button onClick={() => handleDeletePlaylist(name)} style={{ ...btnBase, background: "white", border: "1px solid #e0e0e0", color: "#999", fontSize: "12px", padding: "6px 10px" }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Object.keys(playlists).length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb", fontSize: "14px" }}>
                No saved playlists yet.<br /><span style={{ fontSize: "12px" }}>Edit your songs and save them with a name.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GameModeSetup({ songs, onStart, onClose }) {
  const [fileMap, setFileMap] = useState(null);
  const [unmatched, setUnmatched] = useState([]);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const fileInputRef = useRef();

  const btnBase = {
    padding: "8px 14px", borderRadius: "8px", fontWeight: "700",
    fontSize: "13px", cursor: "pointer", border: "none",
  };

  function handleFiles(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const map = buildFileMap(files, songs);
    setFileMap(map);
    setUnmatched(songs.filter(s => !map.has(s)));
  }

  function handleStart() {
    if (!fileMap || fileMap.size === 0) return;
    const matched = Array.from(fileMap.keys());
    const queue = shuffle(matched, Date.now());
    onStart(fileMap, queue);
  }

  const matchCount = fileMap ? fileMap.size : 0;
  const canStart = matchCount >= 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "32px", width: "480px", maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#1a0033", fontFamily: "Georgia, serif" }}>🎮 Game Mode Setup</div>
          <button onClick={onClose} style={{ ...btnBase, background: "none", color: "#999", fontSize: "18px", padding: "4px 8px" }}>✕</button>
        </div>

        <div style={{ marginBottom: "20px", color: "#555", fontSize: "14px" }}>
          Upload your MP3 files. The app will match them to song names automatically.
        </div>

        <input ref={fileInputRef} type="file" multiple accept="audio/*" style={{ display: "none" }} onChange={handleFiles} />
        <button onClick={() => fileInputRef.current.click()} style={{ ...btnBase, background: "linear-gradient(135deg, #e91e8c, #9c27b0)", color: "white", width: "100%", padding: "14px", fontSize: "15px", marginBottom: "16px" }}>
          📂 Select Audio Files
        </button>

        {fileMap !== null && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ padding: "12px 16px", borderRadius: "10px", background: canStart ? "#e8f5e9" : "#ffebee", border: `2px solid ${canStart ? "#4caf50" : "#f44336"}`, marginBottom: "8px" }}>
              <span style={{ fontWeight: "700", color: canStart ? "#2e7d32" : "#c62828", fontSize: "15px" }}>
                {canStart ? `✓ ${matchCount} of ${songs.length} songs matched` : `⚠ 0 of ${songs.length} songs matched`}
              </span>
            </div>

            {unmatched.length > 0 && (
              <div>
                <button onClick={() => setShowUnmatched(v => !v)} style={{ ...btnBase, background: "none", color: "#e91e8c", border: "1px solid #e91e8c", fontSize: "12px", padding: "5px 12px" }}>
                  {showUnmatched ? "▲" : "▼"} {unmatched.length} unmatched songs
                </button>
                {showUnmatched && (
                  <div style={{ marginTop: "8px", maxHeight: "140px", overflowY: "auto", background: "#fafafa", border: "1px solid #eee", borderRadius: "8px", padding: "8px 12px" }}>
                    {unmatched.map((s, i) => (
                      <div key={i} style={{ fontSize: "12px", color: "#666", padding: "2px 0", borderBottom: i < unmatched.length - 1 ? "1px solid #eee" : "none" }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!canStart}
          style={{ ...btnBase, width: "100%", padding: "14px", fontSize: "15px", background: canStart ? "linear-gradient(135deg, #1a0033, #6a0080)" : "#e0e0e0", color: canStart ? "white" : "#9e9e9e", cursor: canStart ? "pointer" : "not-allowed" }}
        >
          🚀 Start Game
        </button>
      </div>
    </div>
  );
}

function DJPanel({ fileMap, queue, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);

  const currentSong = queue[currentIndex] ?? null;
  const isEnd = currentIndex >= queue.length;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleTimeUpdate() {
      setElapsed(audio.currentTime);
      if (audio.currentTime >= 30) {
        audio.pause();
        setIsPlaying(false);
      }
    }
    function handleError() {
      setAudioError("Failed to load audio file.");
      setIsPlaying(false);
    }
    function handleEnded() {
      setIsPlaying(false);
    }

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  function handlePlay() {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    const entry = fileMap.get(currentSong);
    if (!entry) return;
    setAudioError(null);
    if (audio.src !== entry.url) {
      audio.src = entry.url;
      audio.currentTime = 0;
      setElapsed(0);
    }
    audio.play().then(() => setIsPlaying(true)).catch(() => {
      setAudioError("Playback failed. Check browser autoplay settings.");
      setIsPlaying(false);
    });
  }

  function handlePause() {
    audioRef.current?.pause();
    setIsPlaying(false);
  }

  function handleReveal() {
    setIsRevealed(true);
  }

  function handleNext() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setIsPlaying(false);
    setIsRevealed(false);
    setElapsed(0);
    setAudioError(null);
    setCurrentIndex(i => i + 1);
  }

  const progressPct = Math.min((elapsed / 30) * 100, 100);
  const isRed = elapsed > 25;

  const btnBase = {
    borderRadius: "10px", fontWeight: "700", cursor: "pointer", border: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#1a0033", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "sans-serif" }}>
      <audio ref={audioRef} />

      {/* Header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px" }}>
        <button onClick={onExit} style={{ ...btnBase, background: "rgba(255,255,255,0.1)", color: "white", padding: "8px 16px", fontSize: "13px", border: "1px solid rgba(255,255,255,0.25)" }}>
          ✕ Exit
        </button>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: "600" }}>
          {isEnd ? "All songs played!" : `Song ${currentIndex + 1} of ${queue.length}`}
        </div>
      </div>

      {/* Main content */}
      {isEnd ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "16px" }}>🎉</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#e91e8c" }}>All songs played!</div>
          <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "8px" }}>Game over. Great job hosting!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "28px", width: "100%", maxWidth: "520px", padding: "0 24px" }}>

          {/* Song title */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>🎵 Now Playing</div>
            <div style={{
              fontSize: "28px", fontWeight: "900", fontFamily: "Georgia, serif",
              filter: isRevealed ? "none" : "blur(8px)",
              transition: "filter 0.4s ease",
              color: "white", textAlign: "center", lineHeight: 1.3,
              userSelect: isRevealed ? "auto" : "none",
            }}>
              {currentSong}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", height: "12px", overflow: "hidden", marginBottom: "6px" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: isRed ? "#f44336" : "#e91e8c", borderRadius: "8px", transition: "width 0.1s linear, background 0.3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              <span>{Math.floor(elapsed)}s</span>
              <span>30s</span>
            </div>
          </div>

          {/* Audio error */}
          {audioError && (
            <div style={{ background: "rgba(244,67,54,0.2)", border: "1px solid #f44336", borderRadius: "8px", padding: "10px 16px", color: "#ff8a80", fontSize: "13px", textAlign: "center" }}>
              ⚠ {audioError}
            </div>
          )}

          {/* Play/Pause button */}
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            style={{ ...btnBase, background: "linear-gradient(135deg, #e91e8c, #9c27b0)", color: "white", padding: "18px 48px", fontSize: "22px", boxShadow: "0 8px 32px rgba(233,30,140,0.4)" }}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          {/* Secondary row */}
          <div style={{ display: "flex", gap: "16px", width: "100%" }}>
            <button
              onClick={handleReveal}
              disabled={isRevealed}
              style={{ ...btnBase, flex: 1, padding: "14px", fontSize: "15px", background: isRevealed ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)", color: isRevealed ? "rgba(255,255,255,0.3)" : "white", border: "1px solid rgba(255,255,255,0.2)", cursor: isRevealed ? "not-allowed" : "pointer" }}
            >
              👁 Reveal
            </button>
            <button
              onClick={handleNext}
              disabled={isEnd}
              style={{ ...btnBase, flex: 1, padding: "14px", fontSize: "15px", background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              ⏭ Next Song
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [songs, setSongs] = useState(() => [...new Set(DEFAULT_SONGS)]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [cardCount, setCardCount] = useState(50);
  const [cardCountInput, setCardCountInput] = useState("50");
  const [selected, setSelected] = useState(() => Array.from({ length: 50 }, () => Array(25).fill(false)));

  useEffect(() => {
    setCardCountInput(String(cardCount));
    setSelected(prev => {
      if (prev.length === cardCount) return prev;
      return Array.from({ length: cardCount }, (_, i) => prev[i] ?? Array(25).fill(false));
    });
    setCurrentCard(c => Math.min(c, cardCount - 1));
  }, [cardCount]);
  const [currentView, setCurrentView] = useState("grid");
  const [currentCard, setCurrentCard] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [gameModePhase, setGameModePhase] = useState(null);
  const [gameFileMap, setGameFileMap] = useState(null);
  const [gameQueue, setGameQueue] = useState([]);

  useEffect(() => {
    return () => {
      if (gameFileMap) for (const { url } of gameFileMap.values()) URL.revokeObjectURL(url);
    };
  }, [gameFileMap]);

  const cards = useMemo(() => Array.from({ length: cardCount }, (_, i) => generateCard(songs, i)), [songs, cardCount]);

  const toggleCell = useCallback((cardIdx, cellIdx) => {
    setSelected(prev => {
      const next = prev.map(c => [...c]);
      next[cardIdx][cellIdx] = !next[cardIdx][cellIdx];
      return next;
    });
  }, []);

  const handleSaveSongs = (newSongs) => {
    setSongs(newSongs);
    setSelected(Array.from({ length: cardCount }, () => Array(25).fill(false)));
    setCurrentCard(0);
    setShowEditor(false);
  };

  const btnStyle = { background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8eaf6 100%)", fontFamily: "sans-serif" }}>
      <div className="no-print" style={{ background: "linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <div>
          <div style={{ color: "white", fontSize: "22px", fontWeight: "900", fontFamily: "Georgia, serif", letterSpacing: "1px" }}>🎤 HM &amp; Miley Bingo Generator</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
            {songs.length} songs · {cardCount} unique cards{activePlaylist ? ` · ${activePlaylist}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label style={{ color: "white", fontWeight: "700", fontSize: "13px" }}># Cards:</label>
            <input
              type="number" min="1" max="500" value={cardCountInput}
              onChange={e => setCardCountInput(e.target.value)}
              onBlur={() => { const v = parseInt(cardCountInput); if (v >= 1 && v <= 500) setCardCount(v); else setCardCountInput(String(cardCount)); }}
              onKeyDown={e => { if (e.key === "Enter") { const v = parseInt(cardCountInput); if (v >= 1 && v <= 500) setCardCount(v); else setCardCountInput(String(cardCount)); e.target.blur(); } }}
              style={{ width: "60px", padding: "6px 8px", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.2)", color: "white", fontWeight: "700", fontSize: "13px", textAlign: "center" }}
            />
          </div>
          <button onClick={() => setShowEditor(true)} style={btnStyle}>🎵 Songs &amp; Playlists</button>
          <button onClick={() => setGameModePhase("setup")} style={{ ...btnStyle, background: "rgba(106,0,128,0.5)", border: "2px solid rgba(255,255,255,0.6)" }}>🎮 Game Mode</button>
          <button onClick={() => setCurrentView(v => v === "grid" ? "single" : "grid")} style={btnStyle}>
            {currentView === "grid" ? "📄 Single View" : "📋 All Cards"}
          </button>
          {currentView === "single" && (
            <>
              <button onClick={() => setCurrentCard(c => Math.max(0, c - 1))} disabled={currentCard === 0} style={btnStyle}>◀</button>
              <span style={{ color: "white", fontWeight: "700", alignSelf: "center" }}>Card {currentCard + 1} / {cardCount}</span>
              <button onClick={() => setCurrentCard(c => Math.min(cardCount - 1, c + 1))} disabled={currentCard === cardCount - 1} style={btnStyle}>▶</button>
            </>
          )}
          <button onClick={() => setSelected(Array.from({ length: cardCount }, () => Array(25).fill(false)))} style={{ ...btnStyle, background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)" }}>🔄 Reset</button>
          {currentView === "single" ? (
            <button onClick={() => { document.body.classList.add("print-single"); window.print(); document.body.classList.remove("print-single"); }} style={{ background: "white", border: "none", color: "#e91e8c", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "800", fontSize: "13px" }}>
              🖨️ Print This Card
            </button>
          ) : (
            <button onClick={() => window.print()} style={{ background: "white", border: "none", color: "#e91e8c", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "800", fontSize: "13px" }}>
              🖨️ Print All Cards
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {currentView === "grid" ? (
          <>
            <div className="no-print" style={{ textAlign: "center", marginBottom: "20px", color: "#880e4f", fontSize: "13px", fontStyle: "italic" }}>
              Click any cell to mark it · Print to get all {cardCount} physical cards
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {cards.map((card, i) => (
                <BingoCard key={i} card={card} index={i} isSelected={selected[i] ?? EMPTY_ROW} onToggle={(cellIdx) => toggleCell(i, cellIdx)} />
              ))}
            </div>
          </>
        ) : (
          <div style={{ maxWidth: "420px", margin: "0 auto" }}>
            <BingoCard card={cards[currentCard]} index={currentCard} isSelected={selected[currentCard] ?? EMPTY_ROW} onToggle={(cellIdx) => toggleCell(currentCard, cellIdx)} isCurrent={true} />
            <div className="no-print" style={{ marginTop: "16px", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px" }}>
              {Array.from({ length: cardCount }, (_, i) => (
                <button key={i} onClick={() => setCurrentCard(i)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid #e91e8c", background: currentCard === i ? "#e91e8c" : "white", color: currentCard === i ? "white" : "#e91e8c", fontWeight: "700", fontSize: "10px", cursor: "pointer", padding: 0 }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEditor && <SongEditor songs={songs} activePlaylist={activePlaylist} onSave={handleSaveSongs} onClose={() => setShowEditor(false)} />}

      {gameModePhase === "setup" && (
        <GameModeSetup
          songs={songs}
          onStart={(fileMap, queue) => {
            setGameFileMap(fileMap);
            setGameQueue(queue);
            setGameModePhase("playing");
          }}
          onClose={() => setGameModePhase(null)}
        />
      )}
      {gameModePhase === "playing" && (
        <DJPanel
          fileMap={gameFileMap}
          queue={gameQueue}
          onExit={() => {
            setGameModePhase(null);
            setGameFileMap(null);
            setGameQueue([]);
          }}
        />
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
