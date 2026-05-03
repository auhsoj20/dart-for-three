import { useState, useMemo, useRef, useEffect } from "react";

const START_SCORE = 501;
const DEFAULT_NAMES = ["Spieler 1", "Spieler 2", "Spieler 3"];
const QUICK_CHIPS = [26, 41, 45, 60, 81, 100, 140, 180, 0];

const CHECKOUT_HINTS = {
  170: "T20 T20 Bull", 167: "T20 T19 Bull", 164: "T20 T18 Bull",
  161: "T20 T17 Bull", 160: "T20 T20 D20", 158: "T20 T20 D19",
  157: "T20 T19 D20", 156: "T20 T20 D18", 155: "T20 T19 D19",
  154: "T20 T18 D20", 153: "T20 T19 D18", 152: "T20 T20 D16",
  151: "T20 T17 D20", 150: "T20 T18 D18", 149: "T20 T19 D16",
  148: "T20 T20 D14", 147: "T20 T17 D18", 146: "T20 T18 D16",
  145: "T20 T15 D20", 144: "T20 T20 D12", 143: "T20 T17 D16",
  142: "T20 T14 D20", 141: "T20 T19 D12", 140: "T20 T20 D10",
  139: "T19 T14 D20", 138: "T20 T18 D12", 137: "T20 T15 D16",
  136: "T20 T20 D8", 135: "Bull T17 D17", 134: "T20 T14 D16",
  133: "T20 T19 D8", 132: "Bull Bull D16", 131: "T20 T13 D16",
  130: "T20 T18 D8", 129: "T19 T16 D12", 128: "T18 T14 D16",
  127: "T20 T17 D8", 126: "T19 T19 D6", 125: "T20 T15 D10",
  124: "T20 T16 D8", 123: "T19 T16 D9", 122: "T18 T18 D7",
  121: "T20 T11 D14", 120: "T20 S20 D20", 119: "T19 T12 D13",
  118: "T20 S18 D20", 117: "T20 S17 D20", 116: "T20 S16 D20",
  115: "T20 S15 D20", 114: "T20 S14 D20", 113: "T20 S13 D20",
  112: "T20 S12 D20", 111: "T20 S11 D20", 110: "T20 S10 D20",
  109: "T20 S9 D20", 108: "T20 S16 D16", 107: "T19 S10 D20",
  106: "T20 S6 D20", 105: "T20 S13 D16", 104: "T18 S18 D16",
  103: "T19 S10 D18", 102: "T20 S10 D16", 101: "T17 S10 D20",
  100: "T20 D20", 99: "T19 S10 D16", 98: "T20 D19", 97: "T19 D20",
  96: "T20 D18", 95: "T19 D19", 94: "T18 D20", 93: "T19 D18",
  92: "T20 D16", 91: "T17 D20", 90: "T20 D15", 89: "T19 D16",
  88: "T20 D14", 87: "T17 D18", 86: "T18 D16", 85: "T15 D20",
  84: "T20 D12", 83: "T17 D16", 82: "Bull D16", 81: "T19 D12",
  80: "T20 D10", 79: "T19 D11", 78: "T18 D12", 77: "T19 D10",
  76: "T20 D8", 75: "T17 D12", 74: "T14 D16", 73: "T19 D8",
  72: "T16 D12", 71: "T13 D16", 70: "T18 D8", 69: "T19 D6",
  68: "T20 D4", 67: "T17 D8", 66: "T10 D18", 65: "T19 D4",
  64: "T16 D8", 63: "T13 D12", 62: "T10 D16", 61: "T15 D8",
  60: "S20 D20", 59: "S19 D20", 58: "S18 D20", 57: "S17 D20",
  56: "S16 D20", 55: "S15 D20", 54: "S14 D20", 53: "S13 D20",
  52: "S12 D20", 51: "S11 D20", 50: "Bull", 49: "S9 D20",
  48: "S16 D16", 47: "S15 D16", 46: "S14 D16", 45: "S13 D16",
  44: "S12 D16", 43: "S11 D16", 42: "S10 D16", 41: "S9 D16",
  40: "D20", 38: "D19", 36: "D18", 34: "D17", 32: "D16",
  30: "D15", 28: "D14", 26: "D13", 24: "D12", 22: "D11",
  20: "D10", 18: "D9", 16: "D8", 14: "D7", 12: "D6",
  10: "D5", 8: "D4", 6: "D3", 4: "D2", 2: "D1",
};

const createPlayers = (names) =>
  names.map((name, index) => ({
    name: name.trim() || DEFAULT_NAMES[index],
    score: START_SCORE,
    throws: [],
  }));

const getAverage = (throwsList) => {
  if (!throwsList.length) return "—";
  const total = throwsList.reduce((sum, entry) => sum + entry.scored, 0);
  return (total / throwsList.length).toFixed(1);
};

const getLastThrowLabel = (throwsList) => {
  if (!throwsList.length) return "—";
  const last = throwsList[throwsList.length - 1];
  return last.bust ? "BUST" : String(last.scored);
};

export default function DartsGame() {
  const [phase, setPhase] = useState("setup");
  const [names, setNames] = useState(["", "", ""]);
  const [players, setPlayers] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pendingFinish, setPendingFinish] = useState(null);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (phase === "playing" && !pendingFinish && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, currentIdx, pendingFinish]);

  const startGame = () => {
    setPlayers(createPlayers(names));
    setHistory([]);
    setCurrentIdx(0);
    setWinnerIdx(null);
    setPendingFinish(null);
    setInput("");
    setError("");
    setPhase("playing");
  };

  const resetGame = () => {
    if (!window.confirm("Spiel wirklich zurücksetzen?")) return;
    setPhase("setup");
    setPlayers([]);
    setHistory([]);
    setWinnerIdx(null);
    setCurrentIdx(0);
    setPendingFinish(null);
    setInput("");
    setError("");
  };

  const applyThrow = (attempted, finishedOnDouble) => {
    const current = players[currentIdx];
    if (!current) return;
    const remaining = current.score - attempted;
    let bust = false;
    let reason = "";
    let newScore = current.score;
    let scored = attempted;

    if (remaining < 0) {
      bust = true;
      reason = "Überworfen";
    } else if (remaining === 1) {
      bust = true;
      reason = "Rest 1 (nicht ausspielbar)";
    } else if (remaining === 0 && !finishedOnDouble) {
      bust = true;
      reason = "Kein Doppel";
    } else {
      newScore = remaining;
    }

    if (bust) scored = 0;

    const throwEntry = {
      scored,
      attempted,
      bust,
      reason,
      finishedOnDouble: !bust && finishedOnDouble,
    };

    const updatedPlayers = players.map((player, index) =>
      index === currentIdx
        ? { ...player, score: newScore, throws: [...player.throws, throwEntry] }
        : player
    );

    setPlayers(updatedPlayers);
    setHistory((prev) => [
      ...prev,
      {
        playerIdx: currentIdx,
        scored,
        attempted,
        before: current.score,
        after: newScore,
        bust,
        reason,
        finishedOnDouble: !bust && finishedOnDouble,
      },
    ]);

    if (newScore === 0 && !bust) {
      setWinnerIdx(currentIdx);
      setPhase("finished");
      return;
    }

    setCurrentIdx((idx) => (idx + 1) % players.length);
  };

  const submitThrow = (event) => {
    event?.preventDefault();
    setError("");
    const val = parseInt(input, 10);
    if (Number.isNaN(val) || val < 0 || val > 180) {
      setError("Bitte eine Zahl zwischen 0 und 180 eingeben.");
      return;
    }

    const current = players[currentIdx];
    const remaining = current.score - val;
    if (remaining === 0) {
      setPendingFinish({ scored: val });
      return;
    }

    applyThrow(val, false);
    setInput("");
  };

  const confirmFinish = (onDouble) => {
    if (!pendingFinish) return;
    applyThrow(pendingFinish.scored, onDouble);
    setPendingFinish(null);
    setInput("");
  };

  const undo = () => {
    if (pendingFinish) {
      setPendingFinish(null);
      setInput("");
      setError("");
      return;
    }
    if (!history.length) return;
    const last = history[history.length - 1];
    const updated = [...players];
    const player = updated[last.playerIdx];
    updated[last.playerIdx] = {
      ...player,
      score: last.before,
      throws: player.throws.slice(0, -1),
    };

    setPlayers(updated);
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIdx(last.playerIdx);
    setWinnerIdx(null);
    setPhase("playing");
    setInput("");
    setError("");
  };

  const checkoutHint = useMemo(() => {
    if (phase !== "playing") return null;
    const score = players[currentIdx]?.score;
    return CHECKOUT_HINTS[score] || null;
  }, [players, currentIdx, phase]);

  const currentPlayer = players[currentIdx];

  return (
    <div className="darts-root">
      <div className="darts-container">
        <header className="darts-header">
          <div>
            <h1 className="darts-title">501 · Double Out</h1>
            <p className="darts-subtitle">Drei Spieler · ein Brett · ein Sieger</p>
          </div>
          {phase !== "setup" && (
            <button className="darts-btn darts-btn-secondary" onClick={resetGame}>
              Spiel zurücksetzen
            </button>
          )}
        </header>

        {phase === "setup" ? (
          <div className="darts-card darts-setup-card">
            <h2 className="darts-card-title">Spielernamen</h2>
            <div className="darts-setup-list">
              {names.map((name, index) => (
                <div className="darts-setup-row" key={index}>
                  <div className="darts-setup-index">{index + 1}</div>
                  <input
                    className="darts-setup-input"
                    value={name}
                    onChange={(event) => {
                      const updated = [...names];
                      updated[index] = event.target.value;
                      setNames(updated);
                    }}
                    placeholder={DEFAULT_NAMES[index]}
                  />
                </div>
              ))}
            </div>
            <button className="darts-btn darts-btn-primary" onClick={startGame}>
              Spiel starten
            </button>
          </div>
        ) : (
          <>
            <div className="darts-player-grid">
              {players.map((player, index) => {
                const isActive = phase === "playing" && index === currentIdx;
                const isWinner = phase === "finished" && index === winnerIdx;
                return (
                  <div
                    key={player.name}
                    className={`darts-player-card${isActive ? " is-active" : ""}${isWinner ? " is-winner" : ""}`}
                  >
                    <div className="darts-player-header">
                      <span className="darts-player-name">{player.name}</span>
                      {isWinner && <span className="darts-win-badge">★ Sieg</span>}
                    </div>
                    <div className="darts-player-score">{player.score}</div>
                    <div className="darts-player-footer">
                      <span>Ø {getAverage(player.throws)}</span>
                      <span>Letzter: {getLastThrowLabel(player.throws)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {phase === "playing" && currentPlayer && (
              <div className="darts-card darts-input-card">
                <div className="darts-card-top">
                  <span className="darts-label">AUFNAHME VON</span>
                  <span className="darts-current-name">{currentPlayer.name}</span>
                </div>

                {pendingFinish ? (
                  <div className="darts-finish-prompt">
                    <p className="darts-finish-text">
                      {currentPlayer.name} – mögliches Finish! Wurde mit einem Doppel beendet?
                    </p>
                    <div className="darts-button-row">
                      <button className="darts-btn darts-btn-success" onClick={() => confirmFinish(true)}>
                        Ja – Doppel ✓
                      </button>
                      <button className="darts-btn darts-btn-muted" onClick={() => confirmFinish(false)}>
                        Nein – Bust
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {checkoutHint && (
                      <div className="darts-checkout-hint">
                        <span className="darts-checkout-label">Checkout</span>
                        <span>{checkoutHint}</span>
                      </div>
                    )}
                    <form onSubmit={submitThrow} className="darts-input-form">
                      <div className="darts-input-row">
                        <input
                          ref={inputRef}
                          className="darts-number-input"
                          type="number"
                          min={0}
                          max={180}
                          value={input}
                          onChange={(event) => {
                            setInput(event.target.value);
                            setError("");
                          }}
                          placeholder="Punkte (0–180)"
                        />
                        <button type="submit" className="darts-btn darts-btn-primary">
                          Eintragen
                        </button>
                      </div>
                      {error && <p className="darts-error">{error}</p>}
                    </form>

                    <div className="darts-chip-row">
                      {QUICK_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          className="darts-chip"
                          onClick={() => {
                            setInput(String(chip));
                            setError("");
                          }}
                        >
                          {chip === 0 ? "0 (verfehlt)" : chip}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {history.length > 0 && (
              <div className="darts-card darts-history-card">
                <div className="darts-history-header">
                  <h3 className="darts-card-title">Verlauf</h3>
                  <button className="darts-btn darts-btn-secondary" onClick={undo}>
                    Letzten Wurf rückgängig
                  </button>
                </div>
                <div className="darts-history-list">
                  {[...history].reverse().map((entry, index) => (
                    <div className="darts-history-item" key={`${entry.playerIdx}-${index}`}>
                      <div className="darts-history-left">
                        <span className="darts-history-name">{players[entry.playerIdx].name}</span>
                        <span className="darts-history-arrow">
                          {entry.before} → {entry.after}
                        </span>
                      </div>
                      <div className="darts-history-right">
                        {entry.bust ? (
                          <span className="darts-history-bust">
                            BUST ({entry.attempted}) – {entry.reason}
                          </span>
                        ) : (
                          <span className="darts-history-score">+{entry.scored}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase === "finished" && (
              <div className="darts-finish-actions">
                <button className="darts-btn darts-btn-secondary" onClick={undo}>
                  Letzten Wurf rückgängig
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
