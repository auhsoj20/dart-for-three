import { useState, useMemo, useRef, useEffect } from "react";

const START_SCORE = 501;
const DEFAULT_NAMES = ["Spieler 1", "Spieler 2", "Spieler 3"];

const CHECKOUT_HINTS = {
  170: "T20 T20 Bull", 167: "T20 T19 Bull", 164: "T20 T18 Bull", 161: "T20 T17 Bull",
  160: "T20 T20 D20", 158: "T20 T20 D19", 157: "T20 T19 D20", 156: "T20 T20 D18",
  155: "T20 T19 D19", 154: "T20 T18 D20", 153: "T20 T19 D18", 152: "T20 T20 D16",
  151: "T20 T17 D20", 150: "T20 T18 D18", 149: "T20 T19 D16", 148: "T20 T20 D14",
  147: "T20 T17 D18", 146: "T20 T18 D16", 145: "T20 T15 D20", 144: "T20 T20 D12",
  143: "T20 T17 D16", 142: "T20 T14 D20", 141: "T20 T19 D12", 140: "T20 T20 D10",
  139: "T19 T14 D20", 138: "T20 T18 D12", 137: "T20 T15 D16", 136: "T20 T20 D8",
  135: "Bull T17 D17", 134: "T20 T14 D16", 133: "T20 T19 D8", 132: "Bull Bull D16",
  131: "T20 T13 D16", 130: "T20 T18 D8", 129: "T19 T16 D12", 128: "T18 T14 D16",
  127: "T20 T17 D8", 126: "T19 T19 D6", 125: "T20 T15 D10", 124: "T20 T16 D8",
  123: "T19 T16 D9", 122: "T18 T18 D7", 121: "T20 T11 D14", 120: "T20 S20 D20",
  119: "T19 T12 D13", 118: "T20 S18 D20", 117: "T20 S17 D20", 116: "T20 S16 D20",
  115: "T20 S15 D20", 114: "T20 S14 D20", 113: "T20 S13 D20", 112: "T20 S12 D20",
  111: "T20 S11 D20", 110: "T20 S10 D20", 109: "T20 S9 D20", 108: "T20 S16 D16",
  107: "T19 S10 D20", 106: "T20 S6 D20", 105: "T20 S13 D16", 104: "T18 S18 D16",
  103: "T19 S10 D18", 102: "T20 S10 D16", 101: "T17 S10 D20", 100: "T20 D20",
  99: "T19 S10 D16", 98: "T20 D19", 97: "T19 D20", 96: "T20 D18", 95: "T19 D19",
  94: "T18 D20", 93: "T19 D18", 92: "T20 D16", 91: "T17 D20", 90: "T20 D15",
  89: "T19 D16", 88: "T20 D14", 87: "T17 D18", 86: "T18 D16", 85: "T15 D20",
  84: "T20 D12", 83: "T17 D16", 82: "Bull D16", 81: "T19 D12", 80: "T20 D10",
  79: "T19 D11", 78: "T18 D12", 77: "T19 D10", 76: "T20 D8", 75: "T17 D12",
  74: "T14 D16", 73: "T19 D8", 72: "T16 D12", 71: "T13 D16", 70: "T18 D8",
  69: "T19 D6", 68: "T20 D4", 67: "T17 D8", 66: "T10 D18", 65: "T19 D4",
  64: "T16 D8", 63: "T13 D12", 62: "T10 D16", 61: "T15 D8", 60: "S20 D20",
  59: "S19 D20", 58: "S18 D20", 57: "S17 D20", 56: "S16 D20", 55: "S15 D20",
  54: "S14 D20", 53: "S13 D20", 52: "S12 D20", 51: "S11 D20", 50: "Bull",
  49: "S9 D20", 48: "S16 D16", 47: "S15 D16", 46: "S14 D16", 45: "S13 D16",
  44: "S12 D16", 43: "S11 D16", 42: "S10 D16", 41: "S9 D16", 40: "D20",
  38: "D19", 36: "D18", 34: "D17", 32: "D16", 30: "D15", 28: "D14", 26: "D13",
  24: "D12", 22: "D11", 20: "D10", 18: "D9", 16: "D8", 14: "D7", 12: "D6",
  10: "D5", 8: "D4", 6: "D3", 4: "D2", 2: "D1",
};

export default function DartsGame() {
  const [phase, setPhase] = useState("setup"); // setup | playing | finished
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [players, setPlayers] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [history, setHistory] = useState([]); // {playerIdx, scored, before, after, bust, reason}
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pendingFinish, setPendingFinish] = useState(null); // {scored}
  const [winnerIdx, setWinnerIdx] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (phase === "playing" && inputRef.current) inputRef.current.focus();
  }, [phase, currentIdx, pendingFinish]);

  const startGame = () => {
    setPlayers(names.map((n, i) => ({ name: n.trim() || DEFAULT_NAMES[i], score: START_SCORE, throws: [] })));
    setCurrentIdx(0);
    setHistory([]);
    setWinnerIdx(null);
    setPhase("playing");
  };

  const applyThrow = (scored, finishedOnDouble) => {
    const cur = players[currentIdx];
    const remaining = cur.score - scored;
    let bust = false;
    let reason = null;
    let newScore = cur.score;
    let throwScored = scored;

    if (remaining < 0) {
      bust = true; reason = "Überworfen";
    } else if (remaining === 0 && !finishedOnDouble) {
      bust = true; reason = "Kein Doppel";
    } else if (remaining === 1) {
      bust = true; reason = "Rest 1 (nicht ausspielbar)";
    } else {
      newScore = remaining;
    }

    if (bust) throwScored = 0;

    const updated = [...players];
    updated[currentIdx] = {
      ...cur,
      score: newScore,
      throws: [...cur.throws, { scored: throwScored, attempted: scored, bust, reason, finishedOnDouble: !bust && finishedOnDouble }],
    };
    setPlayers(updated);
    setHistory((h) => [...h, { playerIdx: currentIdx, scored: throwScored, attempted: scored, before: cur.score, after: newScore, bust, reason }]);

    if (newScore === 0 && !bust) {
      setWinnerIdx(currentIdx);
      setPhase("finished");
      return;
    }
    setCurrentIdx((idx) => (idx + 1) % players.length);
  };

  const submitThrow = (e) => {
    e?.preventDefault();
    setError("");
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 0 || val > 180) {
      setError("Bitte eine Zahl zwischen 0 und 180 eingeben.");
      return;
    }
    const cur = players[currentIdx];
    const remaining = cur.score - val;
    if (remaining === 0) {
      setPendingFinish({ scored: val });
      return;
    }
    applyThrow(val, false);
    setInput("");
  };

  const confirmFinish = (onDouble) => {
    applyThrow(pendingFinish.scored, onDouble);
    setPendingFinish(null);
    setInput("");
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const updated = [...players];
    const p = updated[last.playerIdx];
    updated[last.playerIdx] = {
      ...p,
      score: last.before,
      throws: p.throws.slice(0, -1),
    };
    setPlayers(updated);
    setHistory((h) => h.slice(0, -1));
    setCurrentIdx(last.playerIdx);
    setWinnerIdx(null);
    setPhase("playing");
    setInput("");
    setError("");
  };

  const reset = () => {
    if (!confirm("Spiel wirklich zurücksetzen?")) return;
    setPhase("setup");
    setPlayers([]);
    setHistory([]);
    setWinnerIdx(null);
    setInput("");
    setError("");
  };

  const checkoutHints = useMemo(() => {
    if (phase !== "playing") return null;
    const s = players[currentIdx]?.score;
    return CHECKOUT_HINTS[s] || null;
  }, [players, currentIdx, phase]);

  // ── SETUP PHASE ────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎯 Dart 501 – 3 Spieler</h1>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Spielernamen</h2>
          {names.map((name, i) => (
            <div key={i} style={styles.inputRow}>
              <label style={styles.label}>Spieler {i + 1}</label>
              <input
                style={styles.textInput}
                value={name}
                onChange={(e) => {
                  const updated = [...names];
                  updated[i] = e.target.value;
                  setNames(updated);
                }}
                placeholder={DEFAULT_NAMES[i]}
              />
            </div>
          ))}
          <button style={styles.primaryBtn} onClick={startGame}>
            Spiel starten
          </button>
        </div>
      </div>
    );
  }

  // ── FINISHED PHASE ─────────────────────────────────────────────────────────
  if (phase === "finished") {
    const winner = players[winnerIdx];
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎯 Dart 501 – Spielende</h1>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
          <h2 style={{ ...styles.sectionTitle, color: "#f59e0b" }}>
            {winner.name} gewinnt!
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>
            {winner.throws.length} Aufnahme(n) gespielt
          </p>
          <h3 style={styles.sectionTitle}>Ergebnis</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Spieler</th>
                <th style={styles.th}>Aufnahmen</th>
                <th style={styles.th}>Restpunkte</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={i} style={i === winnerIdx ? { background: "#fef3c7" } : {}}>
                  <td style={styles.td}>{i === winnerIdx ? "🏆 " : ""}{p.name}</td>
                  <td style={styles.td}>{p.throws.length}</td>
                  <td style={styles.td}>{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button style={styles.secondaryBtn} onClick={undo}>
              ↩ Letzten Wurf rückgängig
            </button>
            <button style={styles.primaryBtn} onClick={reset}>
              Neues Spiel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING PHASE ──────────────────────────────────────────────────────────
  const currentPlayer = players[currentIdx];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎯 Dart 501</h1>

      {/* Scoreboard */}
      <div style={styles.scoreBoard}>
        {players.map((p, i) => (
          <div
            key={i}
            style={{
              ...styles.scoreCard,
              ...(i === currentIdx ? styles.scoreCardActive : {}),
            }}
          >
            <div style={styles.playerName}>{p.name}</div>
            <div style={styles.playerScore}>{p.score}</div>
            <div style={styles.playerThrows}>
              {p.throws.length} Aufnahme{p.throws.length !== 1 ? "n" : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Input / Pending finish */}
      <div style={styles.card}>
        {pendingFinish ? (
          <div>
            <p style={{ fontWeight: 600, marginBottom: 12 }}>
              {currentPlayer.name} trifft genau <strong>{pendingFinish.scored}</strong> – war der letzte Pfeil ein Doppel?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={styles.primaryBtn} onClick={() => confirmFinish(true)}>
                ✅ Ja, Doppel (Gewonnen!)
              </button>
              <button style={styles.dangerBtn} onClick={() => confirmFinish(false)}>
                ❌ Nein, kein Doppel (Bust)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitThrow}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              {currentPlayer.name} ist dran –{" "}
              <span style={{ color: "#2563eb" }}>Rest: {currentPlayer.score}</span>
            </p>
            {checkoutHints && (
              <p style={styles.hint}>💡 Checkout: {checkoutHints}</p>
            )}
            <div style={styles.inputRow}>
              <input
                ref={inputRef}
                style={styles.numberInput}
                type="number"
                min={0}
                max={180}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Punkte (0–180)"
              />
              <button type="submit" style={styles.primaryBtn}>
                Bestätigen
              </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
          </form>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Verlauf</h3>
            <button style={styles.secondaryBtn} onClick={undo}>
              ↩ Rückgängig
            </button>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Spieler</th>
                <th style={styles.th}>Geworfen</th>
                <th style={styles.th}>Vorher</th>
                <th style={styles.th}>Nachher</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h, i) => (
                <tr key={i} style={h.bust ? { background: "#fee2e2" } : {}}>
                  <td style={styles.td}>{players[h.playerIdx].name}</td>
                  <td style={styles.td}>{h.attempted}</td>
                  <td style={styles.td}>{h.before}</td>
                  <td style={styles.td}>{h.after}</td>
                  <td style={styles.td}>
                    {h.bust ? <span style={{ color: "#dc2626" }}>Bust – {h.reason}</span> : <span style={{ color: "#16a34a" }}>✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button style={styles.secondaryBtn} onClick={reset}>
          🔄 Spiel zurücksetzen
        </button>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  container: {
    maxWidth: 700,
    margin: "0 auto",
    padding: "24px 16px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#1f2937",
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 24,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 16,
    marginTop: 0,
  },
  scoreBoard: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    background: "#f3f4f6",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
  },
  scoreCardActive: {
    background: "#eff6ff",
    border: "2px solid #2563eb",
  },
  playerName: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
    color: "#374151",
  },
  playerScore: {
    fontSize: 36,
    fontWeight: 700,
    color: "#1f2937",
    lineHeight: 1,
  },
  playerThrows: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  inputRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    minWidth: 80,
    fontWeight: 500,
    fontSize: 14,
  },
  textInput: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
  },
  numberInput: {
    flex: 1,
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 18,
    outline: "none",
  },
  primaryBtn: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "8px 16px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  dangerBtn: {
    padding: "10px 20px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  hint: {
    background: "#fef9c3",
    border: "1px solid #fde047",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 14,
    marginBottom: 12,
    color: "#713f12",
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    marginTop: 4,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "6px 10px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
    color: "#374151",
  },
  td: {
    padding: "6px 10px",
    borderBottom: "1px solid #f3f4f6",
  },
};
