import { useState, useEffect, useRef } from "react";
import PokerTable from "./PokerTable.jsx";

// ── Deck helpers ─────────────────────────────────────────────────────────────
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

const PLAYER_NAMES = ["DeepStack", "AlphaFold", "NeuralBluff", "PokerBot9000", "ShadowCall", "QuantumFold", "Maverick", "BlazeFold"];
const ACTIONS = ["check", "bet", "raise", "call", "fold"];
const ACTION_LABELS = {
  check: "✓ Check",
  bet: "💰 Bet",
  raise: "⬆ Raise",
  call: "📞 Call",
  fold: "🏳 Fold",
};

function getRandomName(exclude = []) {
  const available = PLAYER_NAMES.filter((n) => !exclude.includes(n));
  return available[Math.floor(Math.random() * available.length)];
}

function getRandomAction(canCheck = true, mustCall = false) {
  if (mustCall) {
    const options = ["call", "raise", "fold"];
    return options[Math.floor(Math.random() * options.length)];
  }
  if (canCheck) {
    const options = ["check", "bet"];
    return options[Math.floor(Math.random() * options.length)];
  }
  return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
}

// ── Auto-playing poker simulation hook ───────────────────────────────────────
function usePokerSimulation() {
  const [tick, setTick] = useState(0);
  const s = useRef({
    players: [],
    community: [],
    pot: 0,
    phase: "idle",
    action: null,
    winner: null,
    roundNumber: 1,
    showdown: false,
    deck: [],
  });
  const timer = useRef(null);

  const rerender = () => setTick((n) => n + 1);
  const after = (fn, ms) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fn();
      rerender();
    }, ms);
  };

  const steps = useRef({});

  steps.current.startRound = (num) => {
    const n1 = getRandomName();
    const n2 = getRandomName([n1]);
    const n3 = getRandomName([n1, n2]);
    const deck = shuffle(makeDeck());
    let i = 0;
    s.current = {
      players: [
        { id: "p1", name: n1, position: "bottom", cards: [deck[i++], deck[i++]], chips: 1000, folded: false },
        { id: "p2", name: n2, position: "left", cards: [deck[i++], deck[i++]], chips: 1000, folded: false },
        { id: "p3", name: n3, position: "right", cards: [deck[i++], deck[i++]], chips: 1000, folded: false },
        { id: "dealer", name: "Dealer", position: "top", cards: [], chips: null, folded: false },
      ],
      community: [],
      pot: 30,
      phase: "preflop",
      action: { player: "Dealer", action: "🃏 Dealing cards..." },
      winner: null,
      showdown: false,
      roundNumber: num ?? s.current.roundNumber,
      deck: deck.slice(i),
      bets: { p1: 0, p2: 0, p3: 0 },
    };
    rerender();
    after(steps.current.preflop, 1600);
  };

  steps.current.preflop = () => {
    const active = s.current.players.filter((p) => p.id !== "dealer" && !p.folded);
    const actor = active[Math.floor(Math.random() * active.length)];
    const action = getRandomAction(false, true);
    if (action === "fold") {
      s.current.players = s.current.players.map((p) => (p.id === actor.id ? { ...p, folded: true } : p));
      s.current.action = { player: actor.name, action: ACTION_LABELS.fold };
    } else {
      const bet = action === "raise" ? Math.floor(Math.random() * 100 + 50) : 20;
      s.current.pot += bet;
      s.current.bets[actor.id] = (s.current.bets[actor.id] || 0) + bet;
      s.current.action = { player: actor.name, action: `${ACTION_LABELS[action]} ${bet}` };
    }
    s.current.phase = "preflop";
    after(steps.current.dealFlop, 1600);
  };

  steps.current.dealFlop = () => {
    const [c1, c2, c3, ...rest] = s.current.deck;
    s.current.community = [c1, c2, c3];
    s.current.deck = rest;
    s.current.action = { player: "Dealer", action: "📤 Flop dealt" };
    s.current.phase = "flop";
    after(steps.current.flop, 1600);
  };

  steps.current.flop = () => {
    const active = s.current.players.filter((p) => p.id !== "dealer" && !p.folded);
    if (active.length <= 1) { steps.current.endRound(); return; }
    const actor = active[Math.floor(Math.random() * active.length)];
    const action = getRandomAction(true, Math.random() > 0.5);
    if (action === "fold") {
      s.current.players = s.current.players.map((p) => (p.id === actor.id ? { ...p, folded: true } : p));
      s.current.action = { player: actor.name, action: ACTION_LABELS.fold };
    } else if (action !== "check") {
      const bet = Math.floor(Math.random() * 150 + 30);
      s.current.pot += bet;
      s.current.bets[actor.id] = (s.current.bets[actor.id] || 0) + bet;
      s.current.action = { player: actor.name, action: `${ACTION_LABELS[action]} ${bet}` };
    } else {
      s.current.action = { player: actor.name, action: ACTION_LABELS.check };
    }
    after(steps.current.dealTurn, 1600);
  };

  steps.current.dealTurn = () => {
    const [card, ...rest] = s.current.deck;
    s.current.community = [...s.current.community, card];
    s.current.deck = rest;
    s.current.action = { player: "Dealer", action: "📤 Turn dealt" };
    s.current.phase = "turn";
    after(steps.current.turn, 1600);
  };

  steps.current.turn = () => {
    const active = s.current.players.filter((p) => p.id !== "dealer" && !p.folded);
    if (active.length <= 1) { steps.current.endRound(); return; }
    const actor = active[Math.floor(Math.random() * active.length)];
    const action = getRandomAction(true, Math.random() > 0.5);
    if (action === "fold") {
      s.current.players = s.current.players.map((p) => (p.id === actor.id ? { ...p, folded: true } : p));
      s.current.action = { player: actor.name, action: ACTION_LABELS.fold };
    } else if (action !== "check") {
      const bet = Math.floor(Math.random() * 200 + 50);
      s.current.pot += bet;
      s.current.bets[actor.id] = (s.current.bets[actor.id] || 0) + bet;
      s.current.action = { player: actor.name, action: `${ACTION_LABELS[action]} ${bet}` };
    } else {
      s.current.action = { player: actor.name, action: ACTION_LABELS.check };
    }
    after(steps.current.dealRiver, 1600);
  };

  steps.current.dealRiver = () => {
    const [card, ...rest] = s.current.deck;
    s.current.community = [...s.current.community, card];
    s.current.deck = rest;
    s.current.action = { player: "Dealer", action: "📤 River dealt" };
    s.current.phase = "river";
    after(steps.current.river, 1600);
  };

  steps.current.river = () => {
    const active = s.current.players.filter((p) => p.id !== "dealer" && !p.folded);
    if (active.length <= 1) { steps.current.endRound(); return; }
    const actor = active[Math.floor(Math.random() * active.length)];
    const action = getRandomAction(true, Math.random() > 0.3);
    if (action === "fold") {
      s.current.players = s.current.players.map((p) => (p.id === actor.id ? { ...p, folded: true } : p));
      s.current.action = { player: actor.name, action: ACTION_LABELS.fold };
    } else if (action !== "check") {
      const bet = Math.floor(Math.random() * 300 + 100);
      s.current.pot += bet;
      s.current.bets[actor.id] = (s.current.bets[actor.id] || 0) + bet;
      s.current.action = { player: actor.name, action: `${ACTION_LABELS[action]} ${bet}` };
    } else {
      s.current.action = { player: actor.name, action: ACTION_LABELS.check };
    }
    after(steps.current.showdown, 1600);
  };

  steps.current.showdown = () => {
    const active = s.current.players.filter((p) => p.id !== "dealer" && !p.folded);
    const winner = active[Math.floor(Math.random() * active.length)] || s.current.players[0];
    s.current.winner = winner;
    s.current.showdown = true;
    s.current.phase = "showdown";
    s.current.action = { player: "Dealer", action: "🎴 Showdown!" };
    s.current.bets = { p1: 0, p2: 0, p3: 0 };
    after(steps.current.endRound, 1200);
  };

  steps.current.endRound = () => {
    const active = s.current.players.filter((p) => p.id !== "dealer" && !p.folded);
    const winner = s.current.winner || active[Math.floor(Math.random() * active.length)] || s.current.players[0];
    s.current.winner = winner;
    s.current.showdown = true;
    s.current.action = { player: winner.name, action: `🏆 Wins ${s.current.pot} chips!` };
    s.current.phase = "complete";
    after(() => steps.current.startRound(s.current.roundNumber + 1), 3500);
  };

  useEffect(() => {
    after(() => steps.current.startRound(1), 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const cur = s.current;
  return {
    simPlayers: cur.players,
    simCommunity: cur.community,
    simPot: cur.pot,
    simPhase: cur.phase,
    simAction: cur.action,
    simWinner: cur.winner,
    roundNumber: cur.roundNumber,
    showdown: cur.showdown,
    simBets: cur.bets || {},
  };
}

// ── PokerTableSimulation component ───────────────────────────────────────────
export default function PokerTableSimulation() {
  const {
    simPlayers, simCommunity, simPot, simPhase,
    simAction, simWinner, roundNumber, showdown, simBets,
  } = usePokerSimulation();

  const phaseColors = {
    preflop: "#6366f1",
    flop: "#10b981",
    turn: "#f59e0b",
    river: "#e01b2d",
    showdown: "#ffd700",
    complete: "#ffd700",
    idle: "#666",
  };

  const phaseColor = phaseColors[simPhase] || "#666";

  return (
    <section className="pts-wrapper">
      {/* Header row */}
      <div className="pts-header">
        <div className="pts-header-left">
          <span className="pts-live-dot" />
          <span className="pts-live-label">LIVE SIMULATION</span>
          <span className="pts-round">Round #{roundNumber}</span>
        </div>
        <div className="pts-phase-badge" style={{ background: phaseColor + "22", borderColor: phaseColor, color: phaseColor }}>
          {simPhase.toUpperCase()}
        </div>
      </div>

      {/* Action ticker */}
      {simAction && (
        <div className="pts-ticker">
          <span className="pts-ticker-player">{simAction.player}</span>
          <span className="pts-ticker-sep">›</span>
          <span className="pts-ticker-action">{simAction.action}</span>
        </div>
      )}

      {/* Table render */}
      <div className="pts-table-container">
        <PokerTable
          view="topdown"
          players={simPlayers}
          community={simCommunity}
          dealerPeeking={false}
          pot={simPot}
          peekHint={false}
          showAllCards={showdown}
          highlightWinner={simWinner?.id}
          bets={simBets}
        />
      </div>

      {/* Footer stats */}
      <div className="pts-footer">
        <div className="pts-stat">
          <span className="pts-stat-label">POT</span>
          <span className="pts-stat-value" style={{ color: "#ffd700" }}>{simPot} chips</span>
        </div>
        <div className="pts-stat">
          <span className="pts-stat-label">COMMUNITY</span>
          <span className="pts-stat-value">{simCommunity.length} / 5 cards</span>
        </div>
        {simWinner && simPhase === "complete" && (
          <div className="pts-stat">
            <span className="pts-stat-label">WINNER</span>
            <span className="pts-stat-value" style={{ color: "#ffd700" }}>🏆 {simWinner.name}</span>
          </div>
        )}
      </div>
    </section>
  );
}
