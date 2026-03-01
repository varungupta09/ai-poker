import { useState } from "react";
import { activeAgent, opponents } from "../mocks/mockAgents.js";

// ─── Mode Card ────────────────────────────────────────────────────────────────

function ModeCard({ title, description, tag, enabled, selected, onClick }) {
  return (
    <button
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      style={{
        position: "relative",
        background: selected
          ? "linear-gradient(135deg, rgba(224,27,45,0.18) 0%, rgba(224,27,45,0.06) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        border: selected ? "1.5px solid #e01b2d" : "1.5px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "20px 22px",
        textAlign: "left",
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.45,
        transition: "all 0.18s ease",
        width: "100%",
        boxShadow: selected ? "0 0 18px rgba(224,27,45,0.18)" : "none",
      }}
      className="ps-mode-card"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 10,
          color: selected ? "#e01b2d" : "#fff",
          letterSpacing: 0.5,
        }}>{title}</span>
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          padding: "3px 8px",
          borderRadius: 4,
          background: enabled ? (selected ? "rgba(224,27,45,0.25)" : "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.05)",
          color: enabled ? (selected ? "#e01b2d" : "rgba(255,255,255,0.5)") : "rgba(255,255,255,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>{tag}</span>
      </div>
      <p style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        color: "rgba(255,255,255,0.55)",
        margin: 0,
        lineHeight: 1.5,
      }}>{description}</p>
      {selected && (
        <div style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#e01b2d",
          boxShadow: "0 0 8px #e01b2d",
        }} />
      )}
    </button>
  );
}

// ─── Agent Header Card ────────────────────────────────────────────────────────

function AgentHeaderCard({ agent }) {
  const rankColor = {
    "Gold II": "#ca8a04",
    "Gold I": "#ca8a04",
    "Gold III": "#ca8a04",
    "Platinum I": "#0891b2",
    "Silver I": "#64748b",
  }[agent.rank] || "#94a3b8";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      background: "linear-gradient(135deg, rgba(224,27,45,0.12) 0%, rgba(224,27,45,0.03) 100%)",
      border: "1.5px solid rgba(224,27,45,0.3)",
      borderRadius: 14,
      padding: "18px 22px",
      marginBottom: 28,
    }}>
      {/* Avatar */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 10,
        background: "linear-gradient(135deg, #ef4444, #991b1b)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 13,
        color: "#fff",
        flexShrink: 0,
        boxShadow: "0 0 16px rgba(239,68,68,0.35)",
      }}>{agent.avatar}</div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 11,
            color: "#fff",
          }}>{agent.name}</span>
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            padding: "2px 7px",
            borderRadius: 4,
            background: "rgba(224,27,45,0.2)",
            color: "#e01b2d",
            border: "1px solid rgba(224,27,45,0.4)",
          }}>ACTIVE</span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: rankColor,
            fontWeight: 600,
          }}>{agent.rank}</span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>·</span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            {agent.elo} ELO
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>·</span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            {agent.winRate}% WR
          </span>
        </div>
      </div>

      {/* Style pill */}
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 7,
        padding: "4px 10px",
        borderRadius: 6,
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>{agent.style}</div>
    </div>
  );
}

// ─── Opponent Card ────────────────────────────────────────────────────────────

function OpponentCard({ opp, selected, onClick }) {
  const diffColor = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" }[opp.difficulty] || "#94a3b8";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        background: selected
          ? "rgba(224,27,45,0.12)"
          : "rgba(255,255,255,0.03)",
        border: selected ? "1.5px solid #e01b2d" : "1.5px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "12px 14px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        textAlign: "left",
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${opp.color}, ${opp.color}88)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 9,
        color: "#fff",
        flexShrink: 0,
      }}>{opp.avatar}</div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#fff" }}>
            {opp.name}
          </span>
          <span style={{ fontSize: 10, color: diffColor, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
            {opp.difficulty}
          </span>
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
          {opp.rank} · {opp.elo} ELO · {opp.style}
        </div>
      </div>

      {selected && (
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#e01b2d", boxShadow: "0 0 8px #e01b2d",
        }} />
      )}
    </button>
  );
}

// ─── Play Screen ──────────────────────────────────────────────────────────────

const MODES = [
  {
    id: "test",
    title: "Test Match",
    description: "Scripted 20-hand session against a mock opponent. Instant results with full spectator replay.",
    tag: "Enabled",
    enabled: true,
  },
  {
    id: "casual",
    title: "Casual",
    description: "Relaxed play against real opponents with no ranking on the line.",
    tag: "Coming Soon",
    enabled: false,
  },
  {
    id: "ranked",
    title: "Ranked",
    description: "Compete on the ladder and climb seasonal ELO brackets.",
    tag: "Coming Soon",
    enabled: false,
  },
];

const HAND_OPTIONS = [
  { value: 20, label: "20 hands", sub: "Demo length", enabled: true },
  { value: 100, label: "100 hands", sub: "Full session · Soon", enabled: false },
];

export default function PlayScreen({ setScreen, setScreenParams, onBack }) {
  const [selectedMode, setSelectedMode] = useState("test");
  const [selectedOpponent, setSelectedOpponent] = useState(opponents[0].id);
  const [selectedHands, setSelectedHands] = useState(20);

  const opponent = opponents.find((o) => o.id === selectedOpponent) || opponents[0];

  function handleStart() {
    setScreenParams({ matchId: "mock-1", opponent, hands: selectedHands });
    setScreen("queue");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(224,27,45,0.08) 0%, transparent 60%)",
      overflowY: "auto",
      padding: "0 0 60px",
    }}>
      {/* Nav bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: "rgba(255,255,255,0.5)",
            background: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >← Agent Lab</button>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "rgba(255,255,255,0.25)" }}>/</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#e01b2d" }}>Test Match</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "36px 24px 0" }}>
        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 18,
            color: "#fff",
            margin: "0 0 8px",
            lineHeight: 1.5,
          }}>Configure Match</h1>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            margin: 0,
          }}>Choose a game mode, pick your opponent, and launch a test session.</p>
        </div>

        {/* Active agent */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: "rgba(255,255,255,0.35)",
            marginBottom: 10,
            letterSpacing: 1,
          }}>ACTIVE AGENT</div>
          <AgentHeaderCard agent={activeAgent} />
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          {/* Left col: Mode + Hands */}
          <div>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 8,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 12,
              letterSpacing: 1,
            }}>GAME MODE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {MODES.map((m) => (
                <ModeCard
                  key={m.id}
                  {...m}
                  selected={selectedMode === m.id}
                  onClick={() => setSelectedMode(m.id)}
                />
              ))}
            </div>

            {/* Match length */}
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 8,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 12,
              letterSpacing: 1,
            }}>MATCH LENGTH</div>
            <div style={{ display: "flex", gap: 10 }}>
              {HAND_OPTIONS.map((h) => (
                <button
                  key={h.value}
                  onClick={h.enabled ? () => setSelectedHands(h.value) : undefined}
                  disabled={!h.enabled}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 10,
                    border: selectedHands === h.value && h.enabled
                      ? "1.5px solid #e01b2d"
                      : "1.5px solid rgba(255,255,255,0.08)",
                    background: selectedHands === h.value && h.enabled
                      ? "rgba(224,27,45,0.12)"
                      : "rgba(255,255,255,0.03)",
                    cursor: h.enabled ? "pointer" : "not-allowed",
                    opacity: h.enabled ? 1 : 0.4,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 9,
                    color: selectedHands === h.value && h.enabled ? "#e01b2d" : "#fff",
                    marginBottom: 4,
                  }}>{h.label}</div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                  }}>{h.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right col: Opponent */}
          <div>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 8,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 12,
              letterSpacing: 1,
            }}>SELECT OPPONENT</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {opponents.map((opp) => (
                <OpponentCard
                  key={opp.id}
                  opp={opp}
                  selected={selectedOpponent === opp.id}
                  onClick={() => setSelectedOpponent(opp.id)}
                />
              ))}
            </div>

            {/* Opponent preview */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 7,
                color: "rgba(255,255,255,0.3)",
                marginBottom: 6,
                letterSpacing: 1,
              }}>OPPONENT PROFILE</div>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
                margin: 0,
                lineHeight: 1.6,
              }}>{opponent.description}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 36,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            {activeAgent.name} vs {opponent.name} · {selectedHands} hands
          </div>
          <button
            onClick={handleStart}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 10,
              background: "linear-gradient(135deg, #e01b2d, #b91c1c)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "14px 28px",
              cursor: "pointer",
              boxShadow: "0 0 24px rgba(224,27,45,0.4)",
              transition: "all 0.18s ease",
              letterSpacing: 0.5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 36px rgba(224,27,45,0.6)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 24px rgba(224,27,45,0.4)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Start Test Match →
          </button>
        </div>
      </div>
    </div>
  );
}
