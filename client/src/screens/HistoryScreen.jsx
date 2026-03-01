import { useState } from "react";
import { useMockStore } from "../state/mockStore.js";
import { relativeTime } from "../mocks/mockHistorySeed.js";

// ─── Outcome badge ────────────────────────────────────────────────────────────
function OutcomeBadge({ outcome }) {
  const win = outcome === "win";
  return (
    <div style={{
      width: 56,
      padding: "5px 0",
      textAlign: "center",
      borderRadius: 7,
      fontFamily: '"Press Start 2P", monospace', fontSize: 9,
      background: win ? "rgba(16,185,129,0.12)" : "rgba(224,27,45,0.12)",
      border: `1px solid ${win ? "rgba(16,185,129,0.35)" : "rgba(224,27,45,0.35)"}`,
      color: win ? "#10b981" : "#e01b2d",
      letterSpacing: 0.5,
      flexShrink: 0,
    }}>
      {win ? "WIN" : "LOSS"}
    </div>
  );
}

// ─── Elo delta badge ──────────────────────────────────────────────────────────
function EloBadge({ delta }) {
  const pos = delta >= 0;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 9px", borderRadius: 6,
      fontFamily: '"Press Start 2P", monospace', fontSize: 9,
      background: pos ? "rgba(16,185,129,0.10)" : "rgba(224,27,45,0.10)",
      border: `1px solid ${pos ? "rgba(16,185,129,0.3)" : "rgba(224,27,45,0.3)"}`,
      color: pos ? "#10b981" : "#e01b2d",
    }}>
      {pos ? "+" : ""}{delta}
    </div>
  );
}

// ─── Stat mini row ────────────────────────────────────────────────────────────
function MiniStat({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "rgba(255,255,255,0.8)" }}>{value}</span>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
    </div>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────
function HistoryRow({ entry, onReplay, animDelay }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const s = entry.stats || {};

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
        background: hovered ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.012)",
        overflow: "hidden",
        transition: "border-color 0.15s, background 0.15s, transform 0.12s",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 18px rgba(0,0,0,0.25)" : "none",
        animation: `fadeIn 0.3s ease both`,
        animationDelay: `${animDelay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "16px 20px", flexWrap: "wrap",
      }}>
        <OutcomeBadge outcome={entry.outcome} />

        {/* Opponent info */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#fff",
            }}>{entry.opponentName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
                color: "#fff",
              }}>vs {entry.opponentName}</div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: 11,
                color: "rgba(255,255,255,0.3)", marginTop: 1,
              }}>{relativeTime(entry.timestamp)}</div>
            </div>
          </div>
        </div>

        {/* Elo delta */}
        <EloBadge delta={entry.eloDelta} />

        {/* Mini stats (if available) */}
        {s.handsPlayed && (
          <div style={{ display: "flex", gap: 18, padding: "0 8px", borderLeft: "1px solid rgba(255,255,255,0.06)", marginLeft: 4 }}>
            <MiniStat label="Hands" value={s.handsPlayed} />
            <MiniStat label="Won" value={s.handsWon} />
            <MiniStat label="VPIP" value={`${s.vpip}%`} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(x => !x)}
            style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 7,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 6, padding: "7px 10px", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >{expanded ? "▲ Less" : "▼ Details"}</button>

          <button
            onClick={() => onReplay(entry)}
            style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 7,
              background: "rgba(224,27,45,0.1)",
              border: "1px solid rgba(224,27,45,0.3)",
              color: "#e01b2d",
              borderRadius: 6, padding: "7px 12px", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(224,27,45,0.2)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(224,27,45,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(224,27,45,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
          >▶ Replay</button>
        </div>
      </div>

      {/* Expanded stats panel */}
      {expanded && s.handsPlayed && (
        <div style={{
          padding: "14px 20px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.2)",
          display: "flex", gap: 24, flexWrap: "wrap",
          animation: "fadeIn 0.2s ease both",
        }}>
          <MiniStat label="Hands Played" value={s.handsPlayed} />
          <MiniStat label="Hands Won" value={s.handsWon} />
          <MiniStat label="VPIP" value={`${s.vpip}%`} />
          <MiniStat label="Aggression" value={`${s.aggression}%`} />
          <MiniStat label="Avg Pot" value={s.avgPot} />
          <MiniStat label="Biggest Pot" value={s.biggestPot} />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <span style={{
              fontFamily: "Inter, sans-serif", fontSize: 11,
              color: "rgba(255,255,255,0.2)",
            }}>ID: {entry.matchId}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ onRunMatch }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "80px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
    }}>
      <div style={{ fontSize: 48 }}>🃏</div>
      <div style={{
        fontFamily: '"Press Start 2P", monospace', fontSize: 13, color: "#fff",
        lineHeight: 1.8,
      }}>No matches yet</div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 340, lineHeight: 1.6 }}>
        Run a test match to start building your history. Your results, Elo deltas, and replays will appear here.
      </div>
      <button
        onClick={onRunMatch}
        style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 9,
          background: "linear-gradient(135deg, #e01b2d, #b91c1c)",
          color: "#fff", border: "none", borderRadius: 10,
          padding: "14px 24px", cursor: "pointer",
          boxShadow: "0 0 20px rgba(224,27,45,0.4)",
          transition: "all 0.18s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(224,27,45,0.55)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(224,27,45,0.4)"; }}
      >→ Run a Test Match</button>
    </div>
  );
}

// ─── Summary bar ─────────────────────────────────────────────────────────────
function SummaryBar({ history }) {
  if (!history.length) return null;
  const wins   = history.filter(h => h.outcome === "win").length;
  const losses = history.length - wins;
  const netElo = history.reduce((acc, h) => acc + h.eloDelta, 0);
  const winRate = Math.round((wins / history.length) * 100);

  return (
    <div style={{
      display: "flex", gap: 0,
      borderRadius: 10, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.07)",
      marginBottom: 24,
    }}>
      {[
        { label: "Matches", value: history.length, color: "#fff" },
        { label: "Wins", value: wins, color: "#10b981" },
        { label: "Losses", value: losses, color: "#e01b2d" },
        { label: "Win Rate", value: `${winRate}%`, color: "#60a5fa" },
        { label: "Net Elo", value: netElo >= 0 ? `+${netElo}` : netElo, color: netElo >= 0 ? "#10b981" : "#e01b2d" },
      ].map(({ label, value, color }, i, arr) => (
        <div key={label} style={{
          flex: 1, padding: "14px 16px", textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 13, color, marginBottom: 5 }}>{value}</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── History Screen ───────────────────────────────────────────────────────────
export default function HistoryScreen({ setScreen, setScreenParams }) {
  const store = useMockStore();
  const history = store.matchHistory;

  function handleReplay(entry) {
    setScreenParams?.({ matchId: entry.matchId, replay: true });
    setScreen("match");
  }

  function handleRunMatch() {
    setScreen("play");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      backgroundImage: "radial-gradient(ellipse at 50% -10%, rgba(224,27,45,0.06) 0%, transparent 50%)",
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
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#e01b2d" }}>Match History</span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setScreen("leaderboard")}
            style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 7,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)", borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            }}
          >Leaderboard</button>
          <button
            onClick={handleRunMatch}
            style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 7,
              background: "rgba(224,27,45,0.1)", border: "1px solid rgba(224,27,45,0.3)",
              color: "#e01b2d", borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            }}
          >+ New Match</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 0" }}>
        {/* ── Title ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 8,
            color: "rgba(255,255,255,0.25)", letterSpacing: 2,
            textTransform: "uppercase", marginBottom: 10,
          }}>Recent Activity</div>
          <h1 style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "clamp(16px, 2.5vw, 24px)", color: "#fff",
            margin: 0, lineHeight: 1.6,
          }}>Match History</h1>
        </div>

        {/* ── Summary ── */}
        <SummaryBar history={history} />

        {/* ── List ── */}
        {history.length === 0 ? (
          <EmptyState onRunMatch={handleRunMatch} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((entry, i) => (
              <HistoryRow
                key={entry.matchId}
                entry={entry}
                onReplay={handleReplay}
                animDelay={Math.min(i * 40, 500)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
