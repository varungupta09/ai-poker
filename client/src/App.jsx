import { useState, useCallback } from "react";
import PokerTable from "./components/PokerTable.jsx";
import Crowd from "./components/Crowd.jsx";

// ── Deck helpers ──────────────────────────────────────────────────────────────
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function makeDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ suit, rank, red: suit === "♥" || suit === "♦" });
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Initial player config ─────────────────────────────────────────────────────
const INITIAL_PLAYERS = [
  { id: "you",    name: "You",       position: "bottom", cards: [], chips: 1000 },
  { id: "left",   name: "Agent_L",   position: "left",   cards: [], chips: 1000 },
  { id: "right",  name: "Agent_R",   position: "right",  cards: [], chips: 1000 },
  { id: "dealer", name: "Dealer",    position: "top",    cards: [], chips: null  },
];

const PHASES = ["waiting", "preflop", "flop", "turn", "river", "showdown"];

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]             = useState("player");
  const [phase, setPhase]           = useState("waiting");
  const [players, setPlayers]       = useState(INITIAL_PLAYERS);
  const [community, setCommunity]   = useState([]);
  const [deck, setDeck]             = useState([]);
  const [dealerPeeking, setDealerPeeking] = useState(false);
  const [peekHint, setPeekHint]     = useState(false);
  const [pot, setPot]               = useState(0);
  const [crowdTrigger, setCrowdTrigger] = useState(0);

  // ── Deal hole cards ─────────────────────────────────────────────────────────
  const deal = useCallback(() => {
    const d = shuffle(makeDeck());
    let idx = 0;

    const newPlayers = INITIAL_PLAYERS.map((p) => ({
      ...p,
      cards: [d[idx++], d[idx++]],
    }));

    setDeck(d.slice(idx));
    setPlayers(newPlayers);
    setCommunity([]);
    setPot(120); // small + big blind
    setPhase("preflop");
    setDealerPeeking(false);
    setPeekHint(false);
    setCrowdTrigger((n) => n + 1);
  }, []);

  // ── Advance street ──────────────────────────────────────────────────────────
  const nextStreet = useCallback(() => {
    setPhase((prev) => {
      const idx = PHASES.indexOf(prev);
      const next = PHASES[Math.min(idx + 1, PHASES.length - 1)];

      setDeck((d) => {
        const remaining = [...d];
        if (next === "flop")      setCommunity([remaining.shift(), remaining.shift(), remaining.shift()]);
        if (next === "turn")      setCommunity((c) => [...c, remaining.shift()]);
        if (next === "river")     setCommunity((c) => [...c, remaining.shift()]);
        if (next === "showdown")  { /* reveal all – already handled by faceUp logic */ }
        return remaining;
      });

      setPot((p) => (next !== "showdown" ? p + Math.floor(Math.random() * 150 + 50) : p));
      setCrowdTrigger((n) => n + 1);
      return next;
    });
  }, []);

  // ── Dealer peek ─────────────────────────────────────────────────────────────
  const triggerPeek = useCallback(() => {
    if (view !== "dealer") {
      setPeekHint(true);
      setTimeout(() => setPeekHint(false), 2000);
    }
    setDealerPeeking(true);
    setTimeout(() => setDealerPeeking(false), 2200);
  }, [view]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = () => {
    setPlayers(INITIAL_PLAYERS);
    setCommunity([]);
    setDeck([]);
    setPhase("waiting");
    setPot(0);
    setDealerPeeking(false);
    setPeekHint(false);
  };

  const phaseLabel = phase.toUpperCase();
  const canAdvance  = phase !== "waiting" && phase !== "showdown";
  const isDealerView = view === "dealer";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="view-bar">
        <span className="view-bar-title">♠ PokerAI</span>

        {/* View tabs */}
        <div className="view-tabs">
          {[
            { key: "player",  label: "👤 Your Seat" },
            { key: "topdown", label: "🦅 Bird's Eye" },
            { key: "dealer",  label: "🃏 Dealer View" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`ctrl-btn ${view === key ? "active" : ""}`}
              style={{ fontSize: 8 }}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="phase-tag">{phaseLabel}</span>
      </div>

      {/* ── Table + Crowd ────────────────────────────────────────────── */}
      <div className="venue">
        <Crowd trigger={crowdTrigger} />
        <div className="venue-spotlight" />
        <PokerTable
          view={view}
          players={players}
          community={community}
          dealerPeeking={dealerPeeking}
          pot={pot}
          peekHint={peekHint}
        />
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div className="controls">
        {phase === "waiting" ? (
          <button className="ctrl-btn primary" onClick={deal}>
            🃏 Deal Hand
          </button>
        ) : (
          <>
            <button className="ctrl-btn" onClick={reset}>
              ↩ Reset
            </button>

            <button
              className="ctrl-btn primary"
              disabled={!canAdvance}
              onClick={nextStreet}
            >
              {phase === "river" ? "🏆 Showdown" : "▶ Next Street"}
            </button>

            <button
              className="ctrl-btn"
              onClick={triggerPeek}
              disabled={phase === "showdown"}
            >
              👀 Dealer Peeks
            </button>
          </>
        )}

        {/* Hint for dealer view mechanic */}
        <span
          style={{
            fontSize: 8,
            fontFamily: '"Press Start 2P", monospace',
            color: "rgba(255,255,255,0.3)",
            marginLeft: 8,
          }}
        >
          {isDealerView
            ? "You see dealer cards (you're the dealer)"
            : phase !== "waiting"
            ? "Switch to Dealer View to see their cards"
            : ""}
        </span>
      </div>
    </div>
  );
}
