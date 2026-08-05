import { useState, useEffect, useCallback } from "react";

const SYMBOLS = [
  { id: "jag1", color: "#2e2a24", render: (c) => <path d="M6 26 Q14 10 20 22 T34 14" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" /> },
  { id: "jag2", color: "#8a4a2b", render: (c) => <path d="M8 12 Q18 24 24 12 T36 24" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" /> },
  { id: "blot1", color: "#24304a", render: (c) => <ellipse cx="20" cy="20" rx="12" ry="9" fill={c} /> },
  { id: "blot2", color: "#7a2620", render: (c) => (<><circle cx="14" cy="16" r="6" fill={c} /><circle cx="26" cy="24" r="7" fill={c} /></>) },
  { id: "hatch", color: "#d4b26a", render: (c) => (<><line x1="8" y1="8" x2="32" y2="32" stroke={c} strokeWidth="2" /><line x1="8" y1="18" x2="22" y2="32" stroke={c} strokeWidth="2" /><line x1="18" y1="8" x2="32" y2="22" stroke={c} strokeWidth="2" /></>) },
  { id: "drip", color: "#2e2a24", render: (c) => <path d="M20 6 C18 16 24 20 20 30 C18 34 22 36 20 38" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" /> },
  { id: "cross", color: "#8a4a2b", render: (c) => (<><rect x="17" y="6" width="6" height="28" fill={c} /><rect x="6" y="17" width="28" height="6" fill={c} /></>) },
  { id: "dots", color: "#d4b26a", render: (c) => (<>{[[10,10],[28,12],[14,26],[28,28]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="3" fill={c} />))}</>) },
];

function buildDeck() {
  const pairs = [...SYMBOLS, ...SYMBOLS].map((s, i) => ({ ...s, key: `${s.id}-${i}` }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

const TIME_LIMIT = 120;

export default function MintGame({ onWin }) {
  const [deck, setDeck] = useState(buildDeck);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [status, setStatus] = useState("playing");

  useEffect(() => {
    if (status !== "playing") return;
    if (timeLeft <= 0) {
      setStatus("lost");
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, status]);

  useEffect(() => {
    if (matched.length === deck.length && deck.length > 0) {
      setStatus("won");
      onWin?.();
    }
  }, [matched, deck.length, onWin]);

  const handleFlip = useCallback((index) => {
    if (status !== "playing") return;
    if (flipped.includes(index) || matched.includes(index)) return;
    if (flipped.length === 2) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      const [a, b] = next;
      if (deck[a].id === deck[b].id) {
        setTimeout(() => {
          setMatched((m) => [...m, a, b]);
          setFlipped([]);
        }, 400);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  }, [flipped, matched, deck, status]);

  const restart = () => {
    setDeck(buildDeck());
    setFlipped([]);
    setMatched([]);
    setTimeLeft(TIME_LIMIT);
    setStatus("playing");
  };

  if (status === "won") {
    return (
      <div className="game-result">
        <p className="game-result-title">SOLVED</p>
        <p className="game-result-sub">Minting unlocked.</p>
      </div>
    );
  }

  return (
    <div className="mint-game">
      <div className="game-header">
        <p className="game-title">MATCH THE MARKS TO UNLOCK MINTING</p>
        <p className={`game-timer ${timeLeft <= 10 ? "urgent" : ""}`}>{timeLeft}s</p>
      </div>

      {status === "lost" ? (
        <div className="game-result">
          <p className="game-result-title">TIME'S UP</p>
          <button className="btn-solid" onClick={restart}>TRY AGAIN</button>
        </div>
      ) : (
        <div className="game-grid">
          {deck.map((card, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i);
            return (
              <button
                key={card.key}
                className={`game-card ${isFlipped ? "flipped" : ""} ${matched.includes(i) ? "matched" : ""}`}
                onClick={() => handleFlip(i)}
                aria-label={isFlipped ? card.id : "hidden card"}
              >
                {isFlipped ? (
                  <svg viewBox="0 0 40 40" width="100%" height="100%">{card.render(card.color)}</svg>
                ) : (
                  <span className="game-card-back" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
