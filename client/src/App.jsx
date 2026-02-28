import { useState, useCallback, useEffect, useRef } from "react";
import PokerTable from "./components/PokerTable.jsx";
import Crowd from "./components/Crowd.jsx";
import CountryPokerTable from "./venues/CountryPokerTable.jsx";
import HomePage from "./HomePage.jsx";
import AgentLab from "./AgentLab.jsx";

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

// ── Simulation player names ────────────────────────────────────────────────────
const PLAYER_NAMES = ["Ace", "Maverick", "Blaze", "Shadow", "Lucky", "Duke", "Phoenix", "Storm"];
const ACTIONS = ["check", "bet", "raise", "call", "fold"];
const ACTION_LABELS = {
  check: "✓ Check",
  bet: "💰 Bet",
  raise: "⬆️ Raise",
  call: "📞 Call",
  fold: "🏳️ Fold",
};

function getRandomName(exclude = []) {
  const available = PLAYER_NAMES.filter(n => !exclude.includes(n));
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

// ── Landing blocks ──────────────────────────────────────────────────────────
function LandingCard({ title, label, description, action, onAction }) {
  return (
    <div className="home-card">
      <div className="home-card-head">
        <span className="pill pill-ghost">{label}</span>
        {action ? (
          <button className="pill pill-link" onClick={onAction}>{action}</button>
        ) : null}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// ── Auto-playing poker simulation ───────────────────────────────────────────
function usePokerSimulation() {
  const [tick, setTick] = useState(0);
  const s = useRef({
    players: [], community: [], pot: 0,
    phase: "idle", action: null, winner: null,
    roundNumber: 1, showdown: false, deck: [],
  });
  const timer = useRef(null);

  const rerender = () => setTick(n => n + 1);

  const after = (fn, ms) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { fn(); rerender(); }, ms);
  };

  // All step functions stored in a ref to avoid stale closures / circular deps
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
        { id: "p2", name: n2, position: "left",   cards: [deck[i++], deck[i++]], chips: 1000, folded: false },
        { id: "p3", name: n3, position: "right",  cards: [deck[i++], deck[i++]], chips: 1000, folded: false },
        { id: "dealer", name: "Dealer", position: "top", cards: [], chips: null, folded: false },
      ],
      community: [], pot: 30,
      phase: "preflop",
      action: { player: "Dealer", action: "🃏 Dealing cards..." },
      winner: null, showdown: false,
      roundNumber: num ?? s.current.roundNumber,
      deck: deck.slice(i),
      bets: { p1: 0, p2: 0, p3: 0 },
    };
    rerender();
    after(steps.current.preflop, 1600);
  };

  steps.current.preflop = () => {
    const active = s.current.players.filter(p => p.id !== "dealer" && !p.folded);
    const actor = active[Math.floor(Math.random() * active.length)];
    const action = getRandomAction(false, true);
    if (action === "fold") {
      s.current.players = s.current.players.map(p => p.id === actor.id ? { ...p, folded: true } : p);
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
    const active = s.current.players.filter(p => p.id !== "dealer" && !p.folded);
    if (active.length <= 1) { steps.current.endRound(); return; }
    const actor = active[Math.floor(Math.random() * active.length)];
    const action = getRandomAction(true, Math.random() > 0.5);
    if (action === "fold") {
      s.current.players = s.current.players.map(p => p.id === actor.id ? { ...p, folded: true } : p);
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
    const active = s.current.players.filter(p => p.id !== "dealer" && !p.folded);
    if (active.length <= 1) { steps.current.endRound(); return; }
    const actor = active[Math.floor(Math.random() * active.length)];
    const action = getRandomAction(true, Math.random() > 0.5);
    if (action === "fold") {
      s.current.players = s.current.players.map(p => p.id === actor.id ? { ...p, folded: true } : p);
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
    const active = s.current.players.filter(p => p.id !== "dealer" && !p.folded);
    if (active.length <= 1) { steps.current.endRound(); return; }
    const actor = active[Math.floor(Math.random() * active.length)];
    const action = getRandomAction(true, Math.random() > 0.3);
    if (action === "fold") {
      s.current.players = s.current.players.map(p => p.id === actor.id ? { ...p, folded: true } : p);
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
    const active = s.current.players.filter(p => p.id !== "dealer" && !p.folded);
    const winner = active[Math.floor(Math.random() * active.length)] || s.current.players[0];
    s.current.winner = winner;
    s.current.showdown = true;
    s.current.phase = "showdown";
    s.current.action = { player: "Dealer", action: "🎴 Showdown!" };
    // Sweep chips into pot
    s.current.bets = { p1: 0, p2: 0, p3: 0 };
    after(steps.current.endRound, 1200);
  };

  steps.current.endRound = () => {
    const active = s.current.players.filter(p => p.id !== "dealer" && !p.folded);
    const winner = s.current.winner || active[Math.floor(Math.random() * active.length)] || s.current.players[0];
    s.current.winner = winner;
    s.current.showdown = true;
    s.current.action = { player: winner.name, action: `🏆 Wins ${s.current.pot} chips!` };
    s.current.phase = "complete";
    after(() => steps.current.startRound(s.current.roundNumber + 1), 3500);
  };

  // Kick off on mount
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

function LandingScreen({ onSelect }) {
  const { simPlayers, simCommunity, simPot, simPhase, simAction, simWinner, roundNumber, showdown, simBets } = usePokerSimulation();

  return (
    <div className="home-shell home-shell-scroll">
      <div className="home-grid-overlay" />

      <header className="home-header">
        <div className="logo-cluster">
          <div className="logo-badge"><span className="logo-letter">P</span></div>
          <div>
            <p className="logo-title">PokerAI</p>
            <p className="logo-sub">Agents Arena</p>
          </div>
        </div>
        <nav className="home-nav">
          <button className="nav-link" onClick={() => onSelect("offline")}>Arena</button>
          <button className="nav-link" onClick={() => onSelect("leaderboards")}>Ladder</button>
          <button className="nav-link" onClick={() => onSelect("online")}>Start</button>
        </nav>
        <button className="home-cta primary" onClick={() => onSelect("online")}>
          Join beta
        </button>
      </header>

      <main className="home-hero-grid">
        <div className="home-hero-block">
          <div className="badge">Classic Poker League</div>
          <h1 className="arcade">
            PokerAI
            <span className="gradient-text"> where code plays for keeps</span>
          </h1>
          <p className="home-lede">
            Build a poker agent or sit in yourself. Fire up instant offline tables, peek at the coming online lobby, and watch the ladder take shape.
          </p>
          <div className="home-cta-row">
            <button className="home-cta primary" onClick={() => onSelect("offline")}>
              Play offline
            </button>
            <button className="home-cta ghost" onClick={() => onSelect("online")}>
              Play online
            </button>
          </div>
          <div className="home-meta-row">
            <span className="pill pill-soft">Instant deals</span>
            <span className="pill pill-soft">Local sim</span>
            <span className="pill pill-soft">Leaderboard brewing</span>
          </div>
        </div>

        <div className="home-options">
          <LandingCard
            title="Play online"
            label="Live soon"
            description="Join live rooms with friends and bots. We are wiring up the lobby now."
            action="Notify me"
            onAction={() => onSelect("online")}
          />
          <LandingCard
            title="Play offline"
            label="Solo sandbox"
            description="Instantly jump into the animated table and practice reads with AI dealers."
            action="Enter table"
            onAction={() => onSelect("offline")}
          />
          <LandingCard
            title="Leaderboards"
            label="Coming soon"
            description="Track streaks, biggest pots, and late-night heaters."
            action="Preview"
            onAction={() => onSelect("leaderboards")}
          />
        </div>
      </main>

      {/* Live Poker Simulation */}
      <section className="home-sim">
        <div className="home-sim-header">
          <span className="pill pill-soft">Live simulation</span>
          <span className="sim-counter">{simPhase.toUpperCase()}</span>
        </div>
        
        {/* Action ticker */}
        {simAction && (
          <div className="sim-action-ticker">
            <span className="sim-action-player">{simAction.player}:</span>
            <span className="sim-action-text">{simAction.action}</span>
          </div>
        )}
        
        <div className="home-sim-table">
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
        
        {/* Pot display */}
        <div className="sim-pot-display">
          <span className="sim-pot-label">POT</span>
          <span className="sim-pot-amount">{simPot}</span>
        </div>
      </section>
    </div>
  );
}

function ComingSoonScreen({ title, eyebrow, onBack, body }) {
  return (
    <div className="home-shell">
      <div className="home-glow" />
      <div className="home-soon">
        <div className="home-soon-head">
          <button className="pill pill-link" onClick={onBack}>← Back</button>
          <span className="pill pill-ghost">{eyebrow}</span>
        </div>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="soon-row">
          <div className="soon-badge">Red & white lobby</div>
          <div className="soon-badge">Matchmaking</div>
          <div className="soon-badge">Tables in QA</div>
        </div>
        <button className="home-cta primary" onClick={onBack}>Return home</button>
      </div>
    </div>
  );
}

function LeaderboardScreen({ onBack }) {
  return (
    <div className="home-shell">
      <div className="home-glow" />
      <div className="home-leaderboard">
        <div className="home-soon-head">
          <button className="pill pill-link" onClick={onBack}>← Back</button>
          <span className="pill pill-ghost">Leaderboards</span>
        </div>
        <h2>Leaderboard coming soon</h2>
        <p>We are still wiring up the telemetry. Expect streaks, MTT highs, and brag-worthy pots.</p>
        <div className="leaderboard-rows">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="leaderboard-row">
              <div className="skeleton rank">{idx + 1}</div>
              <div className="skeleton name" />
              <div className="skeleton chips" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]         = useState("home"); // "home" | "online" | "offline" | "leaderboards"
  const [view, setView]             = useState("player");
  const [venue, setVenue]           = useState("country"); // "arena" | "country"
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

  const goHome = () => {
    reset();
    setScreen("home");
  };

  const phaseLabel = phase.toUpperCase();
  const canAdvance  = phase !== "waiting" && phase !== "showdown";
  const isDealerView = view === "dealer";

  if (screen === "home") {
    return (
      <HomePage
        onPlayOffline={() => setScreen("offline")}
        onAgents={() => setScreen("agents")}
      />
    );
  }

  if (screen === "agents") {
    return <AgentLab onBackHome={() => setScreen("home")} />;
  }

  if (screen === "online") {
    return (
      <ComingSoonScreen
        title="Online play is almost here"
        eyebrow="Play online"
        onBack={goHome}
        body="Invite friends, sit at private tables, and co-play with AI helpers. The lobby is opening soon."
      />
    );
  }

  if (screen === "leaderboards") {
    return <LeaderboardScreen onBack={goHome} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* ── Navigation back to landing ───────────────────────────── */}
      <div className="home-topline">
        <button className="pill pill-link" onClick={goHome}>← Home</button>
        <div className="pill pill-ghost">Offline sandbox</div>
        <div className="pill pill-soft">Local only</div>
      </div>

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

        {/* Venue tabs */}
        <div className="view-tabs" style={{ marginLeft: 16, borderLeft: "1px solid rgba(255,255,255,0.12)", paddingLeft: 16 }}>
          {[
            { key: "arena",   label: "🏟 Arena" },
            { key: "country", label: "🌾 Country" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`ctrl-btn ${venue === key ? "active" : ""}`}
              style={{ fontSize: 8 }}
              onClick={() => setVenue(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="phase-tag">{phaseLabel}</span>
      </div>

      {/* ── Table + Crowd ────────────────────────────────────────────── */}
      {venue === "arena" ? (
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
      ) : (
        <CountryPokerTable
          view={view}
          players={players}
          community={community}
          dealerPeeking={dealerPeeking}
          pot={pot}
          peekHint={peekHint}
        />
      )}

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
