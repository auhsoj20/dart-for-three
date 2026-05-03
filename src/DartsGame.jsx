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
      <div className="dg-container">
        <h1 className="dg-title">🎯 Dart 501 – 3 Spieler</h1>
        <div className="dg-card">
          <h2 className="dg-section-title">Spielernamen</h2>
          {names.map((name, i) => (
            <div key={i} className="dg-input-row">
              <label className="dg-label">Spieler {i + 1}</label>
              <input
                className="dg-text-input"
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
          <button className="dg-btn dg-btn-primary" onClick={startGame}>
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
      <div className="dg-container">
        <h1 className="dg-title">🎯 Dart 501 – Spielende</h1>
        <div className="dg-card dg-card-center">
          <div className="dg-trophy-icon">🏆</div>
          <h2 className="dg-section-title dg-winner-title">
            {winner.name} gewinnt!
          </h2>
          <p className="dg-muted dg-mb-24">
            {winner.throws.length} Aufnahme(n) gespielt
          </p>
          <h3 className="dg-section-title">Ergebnis</h3>
          <table className="dg-table">
            <thead>
              <tr>
                <th className="dg-th">Spieler</th>
                <th className="dg-th">Aufnahmen</th>
                <th className="dg-th">Restpunkte</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={i} className={i === winnerIdx ? "dg-winner-row" : ""}>
                  <td className="dg-td">{i === winnerIdx ? "🏆 " : ""}{p.name}</td>
                  <td className="dg-td">{p.throws.length}</td>
                  <td className="dg-td">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dg-action-row dg-mt-24">
            <button className="dg-btn dg-btn-secondary" onClick={undo}>
              ↩ Letzten Wurf rückgängig
            </button>
            <button className="dg-btn dg-btn-primary" onClick={reset}>
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
    <div className="dg-container">
      <h1 className="dg-title">🎯 Dart 501</h1>

      {/* Scoreboard */}
      <div className="dg-scoreboard">
        {players.map((p, i) => (
          <div
            key={i}
            className={`dg-score-card${i === currentIdx ? " dg-score-card-active" : ""}`}
          >
            <div className="dg-player-name">{p.name}</div>
            <div className="dg-player-score">{p.score}</div>
            <div className="dg-player-throws">
              {p.throws.length} Aufnahme{p.throws.length !== 1 ? "n" : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Input / Pending finish */}
      <div className="dg-card">
        {pendingFinish ? (
          <div>
            <p className="dg-confirm-text">
              {currentPlayer.name} trifft genau <strong>{pendingFinish.scored}</strong> – war der letzte Pfeil ein Doppel?
            </p>
            <div className="dg-btn-row">
              <button className="dg-btn dg-btn-primary" onClick={() => confirmFinish(true)}>
                ✅ Ja, Doppel (Gewonnen!)
              </button>
              <button className="dg-btn dg-btn-danger" onClick={() => confirmFinish(false)}>
                ❌ Nein, kein Doppel (Bust)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitThrow}>
            <p className="dg-turn-text">
              {currentPlayer.name} ist dran –{" "}
              <span className="dg-remaining">Rest: {currentPlayer.score}</span>
            </p>
            {checkoutHints && (
              <p className="dg-hint">💡 Checkout: {checkoutHints}</p>
            )}
            <div className="dg-input-row">
              <input
                ref={inputRef}
                className="dg-number-input"
                type="number"
                min={0}
                max={180}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Punkte (0–180)"
              />
              <button type="submit" className="dg-btn dg-btn-primary">
                Bestätigen
              </button>
            </div>
            {error && <p className="dg-error">{error}</p>}
          </form>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="dg-card">
          <div className="dg-history-header">
            <h3 className="dg-history-title">Verlauf</h3>
            <button className="dg-btn dg-btn-secondary" onClick={undo}>
              ↩ Rückgängig
            </button>
          </div>
          <table className="dg-table">
            <thead>
              <tr>
                <th className="dg-th">Spieler</th>
                <th className="dg-th">Geworfen</th>
                <th className="dg-th">Vorher</th>
                <th className="dg-th">Nachher</th>
                <th className="dg-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h, i) => (
                <tr key={i} className={h.bust ? "dg-bust-row" : ""}>
                  <td className="dg-td">{players[h.playerIdx].name}</td>
                  <td className="dg-td">{h.attempted}</td>
                  <td className="dg-td">{h.before}</td>
                  <td className="dg-td">{h.after}</td>
                  <td className="dg-td">
                    {h.bust
                      ? <span className="dg-bust-text">Bust – {h.reason}</span>
                      : <span className="dg-ok-text">✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset */}
      <div className="dg-reset-row">
        <button className="dg-btn dg-btn-secondary" onClick={reset}>
          🔄 Spiel zurücksetzen
        </button>
      </div>
    </div>
  );
}
