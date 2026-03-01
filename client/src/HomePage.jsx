import { useState, useEffect, useRef } from "react";
import PokerTableSimulation from "./components/PokerTableSimulation.jsx";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_AGENT = {
  name: "DeepStack v2.1",
  rank: "Gold II",
  elo: 1482,
  winRate: 58.4,
  matches: 342,
  avatar: "🤖",
};

const MOCK_FEED = [
  { id: 1, type: "win",   text: "DeepStack v2.1 defeated AlphaFoldBot",   meta: "2s ago  •  +18 ELO" },
  { id: 2, type: "event", text: "Corporate League match starting now",      meta: "just now  •  4 agents" },
  { id: 3, type: "info",  text: "New agent NeuralAce entered Top 10",      meta: "12s ago" },
  { id: 4, type: "win",   text: "RiverBot crushed TexasGhost in finals",   meta: "34s ago  •  +22 ELO" },
  { id: 5, type: "loss",  text: "Maverick64 eliminated from tournament",   meta: "1m ago  •  -11 ELO" },
  { id: 6, type: "event", text: "Friday Night Invitational — 3 slots left", meta: "2m ago" },
  { id: 7, type: "win",   text: "ShadowCalc beat Bluff-O-Matic 3–1",      meta: "3m ago  •  +14 ELO" },
  { id: 8, type: "info",  text: "Season 3 rankings locked in 2 hours",     meta: "4m ago" },
  { id: 9, type: "win",   text: "PokerBot9000 wins pot of 4,200 chips",    meta: "5m ago" },
  { id: 10,type: "loss",  text: "LuckyDraw folded under pressure",         meta: "6m ago  •  -9 ELO" },
];

const COSMETICS = [
  { id: 1, name: "Neon Felt",      type: "Table Skin",   emoji: "🟩", price: "250 coins", bg: "linear-gradient(135deg,#065f46,#064e3b)" },
  { id: 2, name: "Royal Chips",    type: "Chip Style",   emoji: "🔵", price: "180 coins", bg: "linear-gradient(135deg,#1e3a8a,#1e40af)" },
  { id: 3, name: "Cyber Shade",    type: "Agent Avatar", emoji: "🤖", price: "320 coins", bg: "linear-gradient(135deg,#3b0764,#5b21b6)" },
  { id: 4, name: "Blaze Table",    type: "Table Skin",   emoji: "🔥", price: "400 coins", bg: "linear-gradient(135deg,#7f1d1d,#b91c1c)" },
  { id: 5, name: "Gold Rush",      type: "Chip Style",   emoji: "🥇", price: "220 coins", bg: "linear-gradient(135deg,#78350f,#b45309)" },
  { id: 6, name: "Ghost Agent",    type: "Agent Avatar", emoji: "👻", price: "290 coins", bg: "linear-gradient(135deg,#1f2937,#374151)" },
  { id: 7, name: "Arctic Felt",    type: "Table Skin",   emoji: "❄️", price: "270 coins", bg: "linear-gradient(135deg,#0c4a6e,#0369a1)" },
];

const PERF_BARS = [32, 55, 48, 70, 62, 80, 58, 74, 68, 85, 72, 91];

const NAV_LINKS = ["Play", "Watch", "Tournaments", "Leaderboard"];

const STORE_TABS = ["All", "Table Skins", "Chip Styles", "Avatars"];

// ─── Navbar ──────────────────────────────────────────────────────────────────

const NAV_LINK_MAP = {
  Play:        "offline",
  Watch:       "offline",
  Tournaments: "leaderboard",
  Leaderboard: "leaderboard",
};

function Navbar({ onAgents, onNavigate }) {
  const [storeOpen, setStoreOpen] = useState(false);
  const [storeTab, setStoreTab] = useState("All");
  const storeRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (storeRef.current && !storeRef.current.contains(e.target)) {
        setStoreOpen(false);
      }
    }
    if (storeOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [storeOpen]);

  const filtered =
    storeTab === "All"
      ? COSMETICS
      : COSMETICS.filter((c) => c.type === storeTab.slice(0, -1)); // strip trailing "s"

  // storeTab "Table Skins" → "Table Skin", "Chip Styles" → "Chip Style", "Avatars" → "Avatar"
  const tabFilter = (item) => {
    if (storeTab === "All") return true;
    const map = { "Table Skins": "Table Skin", "Chip Styles": "Chip Style", "Avatars": "Agent Avatar" };
    return item.type === map[storeTab];
  };

  const visibleItems = COSMETICS.filter(tabFilter);

  return (
    <nav className="hp-navbar">
      <div className="hp-logo">
        <div className="hp-logo-badge">♠</div>
        <span className="hp-logo-text">PokerAI</span>
      </div>

      <div className="hp-nav-links">
        {NAV_LINKS.map((link) => (
          <button
            key={link}
            className="hp-nav-link"
            onClick={() => onNavigate?.(NAV_LINK_MAP[link])}
          >{link}</button>
        ))}
        <button className="hp-nav-link" onClick={onAgents}>Agents</button>

        {/* Store button + dropdown — sits inline after Leaderboard */}
        <div className="hp-store-anchor" ref={storeRef}>
          <button
            className={`hp-nav-link hp-store-btn ${storeOpen ? "active" : ""}`}
            onClick={() => setStoreOpen((o) => !o)}
          >
            Store
          </button>

          {storeOpen && (
            <div className="hp-store-dropdown">
              {/* Header */}
              <div className="hp-store-header">
                <div>
                  <div className="hp-section-label" style={{ marginBottom: 4 }}>Cosmetics</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Store</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Balance:</div>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#fbbf24" }}>
                    1,240 🪙
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="hp-store-tabs">
                {STORE_TABS.map((tab) => (
                  <button
                    key={tab}
                    className={`hp-store-tab ${storeTab === tab ? "active" : ""}`}
                    onClick={() => setStoreTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Items grid */}
              <div className="hp-store-grid">
                {visibleItems.map((item) => (
                  <div key={item.id} className="hp-store-item">
                    <div className="hp-store-item-visual" style={{ background: item.bg }}>
                      {item.emoji}
                    </div>
                    <div className="hp-store-item-name">{item.name}</div>
                    <div className="hp-store-item-type">{item.type}</div>
                    <button className="hp-store-item-btn">{item.price}</button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="hp-store-footer">
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  New items drop every Friday
                </span>
                <button className="hp-btn-ghost" style={{ fontSize: 11, padding: "6px 14px" }}>
                  View full store →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="hp-btn-primary" style={{ padding: "8px 18px", fontSize: 9, animation: "none" }}>
          + New Agent
        </button>
        <div className="hp-nav-avatar" title="Profile">🎭</div>
      </div>
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ onPlayOffline }) {
  return (
    <section className="hp-hero">
      <div className="hp-hero-bg-pattern" />
      <div className="hp-hero-content">
        {/* Left */}
        <div className="hp-hero-left">
          <div className="hp-hero-badge">
            <span className="hp-live-dot" />
            3,421 Matches Live Now
          </div>

          <h1 className="hp-hero-title">
            YOUR AGENT.<br />
            <span className="red">YOUR GLORY.</span>
          </h1>
          <p className="hp-hero-sub">
            Build AI poker agents and watch them compete for ELO, prizes, and
            arcade glory — no manual play required.
          </p>

          {/* Agent card */}
          <div className="hp-hero-agent-card">
            <div className="hp-agent-avatar">{MOCK_AGENT.avatar}</div>
            <div className="hp-agent-info">
              <div className="hp-agent-name">{MOCK_AGENT.name}</div>
              <div className="hp-agent-meta">
                <span className="hp-rank-badge">{MOCK_AGENT.rank}</span>
                <span className="hp-elo">ELO {MOCK_AGENT.elo}</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 20, color: "#4ade80", fontWeight: 700 }}>▲</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>+34 today</div>
            </div>
          </div>

          <div className="hp-hero-btns">
            <button className="hp-btn-primary" onClick={onPlayOffline}>▶ PLAY MATCH</button>
            <button className="hp-btn-ghost">◉ Watch Live Games</button>
          </div>
        </div>

        {/* Right — live simulation */}
        <div className="hp-hero-right">
          <div className="hp-hero-sim-wrap">
            <PokerTableSimulation />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────

function useCountdown(initialSeconds) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── Game Modes ───────────────────────────────────────────────────────────────

function GameModesSection({ onPlayOffline }) {
  const countdown = useCountdown(7 * 3600 + 23 * 60 + 10);

  const modes = [
    {
      icon: "⚔️",
      name: "Ranked Arena",
      desc: "Climb the global leaderboard with your agent. Every match counts.",
      btnLabel: "Play Ranked",
      featured: true,
      onClick: onPlayOffline,
    },
    {
      icon: "🎲",
      name: "Casual Play",
      desc: "Test strategies without affecting your rank. Experiment freely.",
      btnLabel: "Play Casual",
      featured: false,
      onClick: onPlayOffline,
    },
    {
      icon: "📡",
      name: "Live Arena",
      desc: "Watch agents battle in real time. Drop in on any match in progress.",
      btnLabel: "Browse Matches",
      stat: "3,421 matches live",
      featured: false,
    },
    {
      icon: "🏆",
      name: "Tournaments",
      desc: "Compete in scheduled events and win prizes. Glory awaits.",
      btnLabel: "View Schedule",
      countdown,
      featured: false,
    },
    {
      icon: "🔬",
      name: "Agent Lab",
      desc: "Create, configure, and backtest your AI agents before deploying.",
      btnLabel: "Open Lab",
      featured: false,
    },
  ];

  return (
    <section className="hp-section">
      <div className="hp-section-label">Game Modes</div>
      <h2 className="hp-section-title">Choose your battlefield</h2>
      <div className="hp-modes-grid">
        {modes.map((mode) => (
          <div key={mode.name} className={`hp-mode-card ${mode.featured ? "featured" : ""}`}>
            <div className="hp-mode-icon">{mode.icon}</div>
            <div className="hp-mode-name">{mode.name}</div>
            <div className="hp-mode-desc">{mode.desc}</div>
            {mode.stat && <div className="hp-mode-stat">● {mode.stat}</div>}
            {mode.countdown && (
              <div className="hp-countdown">NEXT: {mode.countdown}</div>
            )}
            <button className="hp-mode-btn" onClick={mode.onClick}>
              {mode.btnLabel}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Progression Panel ────────────────────────────────────────────────────────

function ProgressionPanel() {
  const barColors = [
    "#ef4444", "#f87171", "#dc2626", "#ef4444", "#f87171",
    "#dc2626", "#ef4444", "#b91c1c", "#ef4444", "#f87171", "#dc2626", "#ef4444",
  ];

  return (
    <div className="hp-bento-card">
      <div className="hp-section-label" style={{ marginBottom: 16 }}>Your Progress</div>

      {/* Rank */}
      <div className="hp-prog-rank">
        <div className="hp-prog-rank-icon">🥇</div>
        <div className="hp-prog-rank-info">
          <div className="hp-prog-rank-name">GOLD II</div>
          <div className="hp-prog-top-label">Top 12% of players · ELO 1482</div>
        </div>
      </div>

      {/* Stats */}
      <div className="hp-prog-stat-row">
        <div className="hp-prog-stat">
          <div className="hp-prog-stat-num" style={{ color: "#4ade80" }}>58.4%</div>
          <div className="hp-prog-stat-label">Win Rate</div>
        </div>
        <div className="hp-prog-stat">
          <div className="hp-prog-stat-num">342</div>
          <div className="hp-prog-stat-label">Matches</div>
        </div>
        <div className="hp-prog-stat">
          <div className="hp-prog-stat-num" style={{ color: "#fbbf24" }}>+34</div>
          <div className="hp-prog-stat-label">ELO Today</div>
        </div>
      </div>

      {/* Performance graph */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          Last 12 matches
        </div>
        <div className="hp-perf-graph">
          {PERF_BARS.map((h, i) => (
            <div
              key={i}
              className="hp-bar"
              style={{
                height: `${h}%`,
                background: h > 70
                  ? "linear-gradient(to top, #dc2626, #f87171)"
                  : "linear-gradient(to top, rgba(220,38,38,0.3), rgba(220,38,38,0.5))",
              }}
            />
          ))}
        </div>
      </div>

      {/* ELO bar */}
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden", height: 6, marginTop: 16 }}>
        <div style={{ width: "62%", height: "100%", background: "linear-gradient(90deg, #dc2626, #f87171)", borderRadius: 6 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Gold II — 1400</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Gold I — 1600</span>
      </div>
    </div>
  );
}

// ─── Live Activity Feed ───────────────────────────────────────────────────────

function LiveActivityFeed() {
  // duplicate for seamless loop
  const doubled = [...MOCK_FEED, ...MOCK_FEED];

  return (
    <div className="hp-bento-card">
      <div className="hp-feed-header">
        <div className="hp-feed-title">Live Activity</div>
        <div className="hp-feed-live">
          <span className="hp-live-dot" />
          Live
        </div>
      </div>
      <div className="hp-feed-scroll">
        <div className="hp-feed-items">
          {doubled.map((item, i) => (
            <div key={i} className={`hp-feed-item ${item.type}`}>
              <div className="hp-feed-item-text">{item.text}</div>
              {item.meta && <div className="hp-feed-item-meta">{item.meta}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const links = ["About", "Terms", "Privacy", "Contact", "Discord"];
  return (
    <footer className="hp-footer">
      <div className="hp-footer-logo">♠ PokerAI</div>
      <div className="hp-footer-links">
        {links.map((l) => (
          <button key={l} className="hp-footer-link">{l}</button>
        ))}
      </div>
      <div className="hp-footer-copy">© 2026 PokerAI — All rights reserved</div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function HomePage({ onPlayOffline, onAgents, onNavigate }) {
  return (
    <div className="hp-shell">
      <Navbar onAgents={onAgents} onNavigate={onNavigate} />
      <HeroSection onPlayOffline={onPlayOffline} />

      <hr className="hp-section-divider" />
      <GameModesSection onPlayOffline={onPlayOffline} />

      {/* Bento row */}
      <hr className="hp-section-divider" />
      <section className="hp-section">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div className="hp-section-label" style={{ marginBottom: 0 }}>Stats &amp; Activity</div>
        </div>
        <h2 className="hp-section-title">Your Dashboard</h2>
        <div className="hp-bento-grid">
          <ProgressionPanel />
          <LiveActivityFeed />
        </div>
      </section>

      <Footer />
    </div>
  );
}
