import { useState, useEffect, useRef } from "react";
import { useMockStore } from "../state/mockStore.js";
import { BADGE_CONFIG } from "../mocks/mockLeaderboardSeed.js";
import { activeAgent } from "../mocks/mockAgents.js";

// ─── Pill badge ───────────────────────────────────────────────────────────────
function Badge({ label }) {
  const cfg = BADGE_CONFIG[label] || BADGE_CONFIG["New"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 999,
      fontFamily: '"Press Start 2P", monospace', fontSize: 7,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
      letterSpacing: 0.5, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ─── YOU pill ─────────────────────────────────────────────────────────────────
function YouPill() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 999,
      fontFamily: '"Press Start 2P", monospace', fontSize: 6,
      background: "rgba(224,27,45,0.18)", border: "1px solid rgba(224,27,45,0.5)",
      color: "#e01b2d", letterSpacing: 0.5, marginLeft: 6,
    }}>YOU</span>
  );
}

// ─── Live pulse ───────────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "#22c55e",
        boxShadow: "0 0 8px #22c55e",
        display: "inline-block",
        animation: "livePulse 1.4s ease-in-out infinite",
      }} />
      <span style={{
        fontFamily: '"Press Start 2P", monospace', fontSize: 6,
        color: "#22c55e", letterSpacing: 0.5,
      }}>LIVE</span>
    </span>
  );
}

// ─── Elo delta float badge ────────────────────────────────────────────────────
function EloDeltaFloat({ delta, visible }) {
  const color = delta >= 0 ? "#10b981" : "#ef4444";
  return (
    <span style={{
      fontFamily: '"Press Start 2P", monospace', fontSize: 8,
      color,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(-14px)" : "translateY(0px)",
      transition: "all 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      display: "inline-block", marginLeft: 6,
      textShadow: `0 0 10px ${color}88`,
      pointerEvents: "none",
    }}>
      {delta >= 0 ? "+" : ""}{delta}
    </span>
  );
}

// ─── Rank medal ───────────────────────────────────────────────────────────────
function RankMedal({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 14 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 14 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 14 }}>🥉</span>;
  return (
    <span style={{
      fontFamily: '"Press Start 2P", monospace', fontSize: 10,
      color: rank <= 10 ? "#eab308" : "rgba(255,255,255,0.35)",
    }}>{rank}</span>
  );
}

// ─── Streak display ───────────────────────────────────────────────────────────
function StreakDisplay({ streak }) {
  if (!streak) return <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>—</span>;
  return (
    <span style={{
      fontFamily: '"Press Start 2P", monospace', fontSize: 8,
      color: streak >= 5 ? "#f59e0b" : "#10b981",
    }}>
      {streak >= 5 ? "🔥" : "↑"} {streak}W
    </span>
  );
}

// ─── W/L ratio bar ────────────────────────────────────────────────────────────
function WLBar({ wins, losses }) {
  const total = wins + losses || 1;
  const pct   = Math.round((wins / total) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 70 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "#10b981" }}>{wins}W</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "#ef4444" }}>{losses}L</span>
      </div>
      <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, #10b981, #34d399)",
          borderRadius: 99,
        }} />
      </div>
    </div>
  );
}

// ─── Single leaderboard row ───────────────────────────────────────────────────
function LeaderboardRow({ entry, isYou, showDelta, lastDelta, onViewAgent, animDelay }) {
  const [hovered, setHovered] = useState(false);
  const [deltaVisible, setDeltaVisible] = useState(false);

  useEffect(() => {
    if (isYou && showDelta) {
      const t = setTimeout(() => setDeltaVisible(true), animDelay + 200);
      const t2 = setTimeout(() => setDeltaVisible(false), animDelay + 2400);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [isYou, showDelta, animDelay]);

  const rowBg = isYou
    ? "linear-gradient(90deg, rgba(224,27,45,0.08) 0%, rgba(224,27,45,0.03) 100%)"
    : hovered
    ? "rgba(255,255,255,0.035)"
    : "transparent";

  const borderLeft = isYou ? "3px solid rgba(224,27,45,0.6)" : "3px solid transparent";

  return (
    <div
      className="lb-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "52px 1fr 130px 110px 120px 90px 110px",
        gap: 8,
        alignItems: "center",
        padding: "11px 16px",
        borderRadius: 8,
        background: rowBg,
        borderLeft,
        marginLeft: isYou ? -3 : 0,
        transition: "background 0.15s",
        boxShadow: isYou ? "inset 0 0 24px rgba(224,27,45,0.04)" : "none",
        cursor: "default",
        animation: `fadeIn 0.35s ease both`,
        animationDelay: `${animDelay}ms`,
      }}
    >
      {/* Rank */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 40 }}>
        <RankMedal rank={entry.rank} />
      </div>

      {/* Agent */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: isYou
            ? "linear-gradient(135deg, #e01b2d, #991b1b)"
            : entry.rank <= 3
            ? "linear-gradient(135deg, #eab308, #a16207)"
            : "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "#fff",
          flexShrink: 0,
          boxShadow: isYou ? "0 0 12px rgba(224,27,45,0.3)" : "none",
        }}>
          {entry.agentName.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
              color: isYou ? "#fff" : "rgba(255,255,255,0.9)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{entry.agentName}</span>
            {isYou && <YouPill />}
          </div>
          {entry.isLive && <LiveDot />}
        </div>
      </div>

      {/* Owner */}
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        @{entry.ownerName}
      </div>

      {/* Elo */}
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <span style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 11,
          color: entry.rank <= 3 ? "#eab308" : "rgba(255,255,255,0.85)",
        }}>{entry.elo.toLocaleString()}</span>
        {isYou && showDelta && (
          <EloDeltaFloat delta={lastDelta} visible={deltaVisible} />
        )}
      </div>

      {/* W/L */}
      <WLBar wins={entry.wins} losses={entry.losses} />

      {/* Streak */}
      <div><StreakDisplay streak={entry.streak} /></div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          onClick={() => onViewAgent(entry.agentId)}
          className="lb-action-btn"
          style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 7,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
            borderRadius: 6, padding: "5px 8px",
            cursor: "pointer", whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
        >View</button>
        {entry.rank <= 3 && (
          <span style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 6,
            color: "#22c55e",
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 5, padding: "4px 6px", whiteSpace: "nowrap",
          }}>Watch</span>
        )}
      </div>
    </div>
  );
}

// ─── Column headers ───────────────────────────────────────────────────────────
function TableHeader() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "52px 1fr 130px 110px 120px 90px 110px",
      gap: 8, padding: "8px 16px 6px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      marginBottom: 4,
    }}>
      {["Rank", "Agent", "Owner", "Elo", "W / L", "Streak", "Actions"].map((h, i) => (
        <div key={i} style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          color: "rgba(255,255,255,0.25)", letterSpacing: 1,
          textAlign: i === 0 ? "center" : "left",
        }}>{h}</div>
      ))}
    </div>
  );
}

// ─── Right panel ─────────────────────────────────────────────────────────────
function RightPanel({ board }) {
  const topThree = board.slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top agents live */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12, padding: "16px",
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          color: "rgba(255,255,255,0.3)", letterSpacing: 1,
          marginBottom: 14,
        }}>TOP AGENTS LIVE</div>
        {topThree.map((e, i) => (
          <div key={e.agentId} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 0",
            borderBottom: i < topThree.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#eab308", minWidth: 16 }}>#{i + 1}</span>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: "linear-gradient(135deg, #eab308, #a16207)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "#fff",
              flexShrink: 0,
            }}>{e.agentName.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.agentName}</div>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "#eab308" }}>{e.elo}</div>
            </div>
            {e.isLive && <LiveDot />}
          </div>
        ))}
      </div>

      {/* Prize pool teaser */}
      <div style={{
        background: "linear-gradient(135deg, rgba(234,179,8,0.06), rgba(234,179,8,0.02))",
        border: "1px solid rgba(234,179,8,0.18)",
        borderRadius: 12, padding: "16px",
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          color: "rgba(234,179,8,0.6)", letterSpacing: 1, marginBottom: 10,
        }}>THIS WEEK'S POOL</div>
        <div style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 20,
          color: "#eab308",
          textShadow: "0 0 20px rgba(234,179,8,0.4)",
          marginBottom: 6,
        }}>$2,400</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
          Tournament prize pool launches with Season 1. Qualifier spots available soon.
        </div>
        <div style={{
          marginTop: 10, padding: "6px 10px",
          background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)",
          borderRadius: 6,
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          color: "rgba(234,179,8,0.6)", textAlign: "center",
        }}>Season 1 — Coming Soon</div>
      </div>

      {/* Quick filters summary */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12, padding: "16px",
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 12,
        }}>QUICK STATS</div>
        {[
          { label: "Total Agents", value: "50" },
          { label: "Matches Today", value: "1,204" },
          { label: "Active Right Now", value: "38" },
          { label: "Season", value: "Beta" },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between",
            padding: "7px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{label}</span>
            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "rgba(255,255,255,0.75)" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "global", label: "Global" },
  { key: "weekly", label: "Weekly" },
  { key: "friends", label: "Friends", locked: true },
  { key: "corporate", label: "Corporate", locked: true },
];

// ─── Dropdown filter ─────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6, color: "rgba(255,255,255,0.7)",
          fontFamily: "Inter, sans-serif", fontSize: 12,
          padding: "6px 10px", cursor: "pointer", outline: "none",
        }}
      >
        {options.map(o => <option key={o} value={o} style={{ background: "#111" }}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Leaderboard Screen ───────────────────────────────────────────────────────
export default function LeaderboardScreen({ setScreen, setScreenParams }) {
  const store = useMockStore();
  const [tab, setTab]     = useState("global");
  const [season, setSeason]   = useState("Beta");
  const [region, setRegion]   = useState("All Regions");
  const [mode, setMode]       = useState("All Modes");
  const [showDelta, setShowDelta] = useState(false);
  const didAnimate = useRef(false);

  // Animate Elo delta badge once after first mount if lastEloDelta is set
  useEffect(() => {
    if (store.lastEloDelta && !didAnimate.current) {
      didAnimate.current = true;
      setShowDelta(true);
      const t = setTimeout(() => setShowDelta(false), 3000);
      return () => clearTimeout(t);
    }
  }, [store.lastEloDelta]);

  const board = tab === "weekly" ? store.leaderboard.weekly : store.leaderboard.global;

  function handleViewAgent(agentId) {
    setScreenParams?.({ agentId });
    setScreen("agents");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      backgroundImage: "radial-gradient(ellipse at 50% -10%, rgba(224,27,45,0.07) 0%, transparent 50%)",
      overflowY: "auto",
      paddingBottom: 60,
    }}>
      {/* ── Top nav ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <button
          onClick={() => setScreen("home")}
          style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 8,
            color: "rgba(255,255,255,0.5)", background: "none",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
            padding: "6px 12px", cursor: "pointer",
          }}
        >← Home</button>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "rgba(255,255,255,0.2)" }}>/</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#e01b2d" }}>Leaderboard</span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setScreen("history")}
            style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 7,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)", borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            }}
          >Match History</button>
          <button
            onClick={() => setScreen("agents")}
            style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 7,
              background: "rgba(224,27,45,0.1)", border: "1px solid rgba(224,27,45,0.3)",
              color: "#e01b2d", borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            }}
          >Agent Lab</button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 0" }}>
        {/* ── Page title ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 8,
            color: "rgba(255,255,255,0.25)", letterSpacing: 2,
            textTransform: "uppercase", marginBottom: 10,
          }}>Arena Rankings</div>
          <h1 style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "clamp(18px, 3vw, 28px)", color: "#fff",
            margin: 0, lineHeight: 1.5,
          }}>Leaderboard</h1>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 20,
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => !t.locked && setTab(t.key)}
              style={{
                fontFamily: '"Press Start 2P", monospace', fontSize: 8,
                padding: "11px 20px",
                background: "none", border: "none",
                borderBottom: tab === t.key ? "2px solid #e01b2d" : "2px solid transparent",
                color: t.locked
                  ? "rgba(255,255,255,0.2)"
                  : tab === t.key
                  ? "#fff"
                  : "rgba(255,255,255,0.45)",
                cursor: t.locked ? "not-allowed" : "pointer",
                letterSpacing: 0.5,
                transition: "color 0.15s, border-color 0.2s",
                marginBottom: -1,
                position: "relative",
              }}
            >
              {t.label}
              {t.locked && (
                <span style={{
                  marginLeft: 6, fontSize: 7,
                  fontFamily: '"Press Start 2P", monospace',
                  color: "rgba(255,255,255,0.2)",
                }}>🔒</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <FilterDropdown
            label="Season"
            options={["Beta", "Season 1 (soon)"]}
            value={season}
            onChange={setSeason}
          />
          <FilterDropdown
            label="Region"
            options={["All Regions", "NA", "EU", "APAC"]}
            value={region}
            onChange={setRegion}
          />
          <FilterDropdown
            label="Mode"
            options={["All Modes", "6-Max", "9-Max", "Heads-Up"]}
            value={mode}
            onChange={setMode}
          />
        </div>

        {/* ── Main content grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 260px",
          gap: 24,
          alignItems: "start",
        }}>
          {/* ── Table ── */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
            <TableHeader />
            <div style={{ padding: "4px 0 8px" }}>
              {board.map((entry, i) => (
                <LeaderboardRow
                  key={entry.agentId}
                  entry={entry}
                  isYou={entry.agentId === store.activeAgentId}
                  showDelta={showDelta}
                  lastDelta={store.lastEloDelta}
                  onViewAgent={handleViewAgent}
                  animDelay={Math.min(i * 25, 400)}
                />
              ))}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div style={{ position: "sticky", top: 90 }}>
            <RightPanel board={board} />
          </div>
        </div>
      </div>
    </div>
  );
}
