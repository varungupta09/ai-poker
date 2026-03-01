import { useState, useEffect, useRef } from "react";
import { activeAgent } from "../mocks/mockAgents.js";
import { mockResultStats } from "../mocks/mockAgents.js";

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ target, prefix = "", suffix = "", duration = 1200, color = "#fff" }) {
  const [val, setVal] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();
    function tick(now) {
      const t = Math.min((now - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return (
    <span style={{ color }}>{prefix}{val.toLocaleString()}{suffix}</span>
  );
}

// ─── Elo Delta Display ────────────────────────────────────────────────────────

function EloDelta({ delta, isWinner }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  const sign = delta >= 0 ? "+" : "";
  const color = delta >= 0 ? "#10b981" : "#ef4444";
  const sign2 = isWinner ? "+" : "-";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
    }}>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 28,
        color,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(10px)",
        transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        textShadow: `0 0 20px ${color}88`,
      }}>
        {isWinner ? "+" : "-"}{Math.abs(delta)}
      </div>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 7,
        color: "rgba(255,255,255,0.3)",
        letterSpacing: 1,
      }}>ELO</div>
    </div>
  );
}

// ─── Rank Progress Bar ────────────────────────────────────────────────────────

function RankProgress({ rank, currentPct, newPct }) {
  const [animPct, setAnimPct] = useState(currentPct);
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(newPct), 800);
    return () => clearTimeout(t);
  }, [newPct]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "16px 20px",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 10,
        alignItems: "center",
      }}>
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8, color: "#ca8a04",
        }}>{rank}</span>
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7, color: "rgba(255,255,255,0.35)",
        }}>{Math.round(animPct)}% to next rank</span>
      </div>
      <div style={{
        height: 8, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${animPct}%`,
          borderRadius: 999,
          background: "linear-gradient(90deg, #ca8a04, #eab308)",
          transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 0 10px rgba(234,179,8,0.5)",
        }} />
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 6,
        fontFamily: "Inter, sans-serif",
        fontSize: 10,
        color: "rgba(255,255,255,0.25)",
      }}>
        <span>Gold II</span>
        <span>Gold I</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, suffix = "", color = "#fff" }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10,
      padding: "14px 16px",
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 16,
        color,
        marginBottom: 6,
      }}>{value}{suffix}</div>
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        color: "rgba(255,255,255,0.35)",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}>{label}</div>
    </div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────

export default function ResultScreen({ setScreen, setScreenParams, screenParams }) {
  const opponent = screenParams?.opponent;
  const stats = mockResultStats;
  const isWinner = stats.winner === "a";
  const eloDelta = stats.eloDelta;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const agentB = opponent || { name: "AggroBot", avatar: "AB", color: "#d97706", style: "Aggressive" };

  function handleReplay() {
    setScreen("match");
  }

  function handleTestAgain() {
    setScreen("play");
  }

  function handleAgentLab() {
    setScreen("agents");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      backgroundImage: isWinner
        ? "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 55%)"
        : "radial-gradient(ellipse at 50% 0%, rgba(224,27,45,0.08) 0%, transparent 55%)",
      overflowY: "auto",
      padding: "0 0 60px",
    }}>
      {/* Nav bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
      }}>
        <button
          onClick={handleAgentLab}
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8, color: "rgba(255,255,255,0.5)",
            background: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6, padding: "6px 12px",
            cursor: "pointer",
          }}
        >← Agent Lab</button>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "rgba(255,255,255,0.25)" }}>/</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "rgba(255,255,255,0.5)" }}>Match</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "rgba(255,255,255,0.25)" }}>/</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: isWinner ? "#10b981" : "#e01b2d" }}>Result</span>
      </div>

      <div style={{
        maxWidth: 740,
        margin: "0 auto",
        padding: "48px 24px 0",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.5s ease",
      }}>
        {/* Winner Banner */}
        <div style={{
          textAlign: "center",
          marginBottom: 48,
        }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: 3,
            marginBottom: 16,
            textTransform: "uppercase",
          }}>{isWinner ? "Victory" : "Defeat"}</div>

          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 26,
            color: isWinner ? "#10b981" : "#e01b2d",
            textShadow: isWinner ? "0 0 30px rgba(16,185,129,0.5)" : "0 0 30px rgba(224,27,45,0.5)",
            lineHeight: 1.4,
            marginBottom: 12,
          }}>
            {isWinner ? activeAgent.name : agentB.name}
          </div>

          <div style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 36,
          }}>
            {isWinner
              ? `${activeAgent.name} wins by chip count after 20 hands`
              : `${agentB.name} wins by chip count after 20 hands`
            }
          </div>

          {/* VS block */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
          }}>
            {/* Agent A */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: "linear-gradient(135deg, #ef4444, #991b1b)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: '"Press Start 2P", monospace', fontSize: 16, color: "#fff",
                boxShadow: isWinner ? "0 0 24px rgba(16,185,129,0.4)" : "none",
                border: isWinner ? "2px solid rgba(16,185,129,0.5)" : "2px solid transparent",
              }}>{activeAgent.avatar}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#fff", fontWeight: 600 }}>
                {activeAgent.name}
              </div>
              <EloDelta delta={isWinner ? eloDelta : -eloDelta} isWinner={isWinner} />
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 10, color: "#ef4444",
              }}>{stats.finalStacks.a.toLocaleString()}</div>
            </div>

            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 14, color: "rgba(255,255,255,0.2)",
            }}>VS</div>

            {/* Agent B */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: `linear-gradient(135deg, ${agentB.color}, ${agentB.color}88)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: '"Press Start 2P", monospace', fontSize: 16, color: "#fff",
                boxShadow: !isWinner ? "0 0 24px rgba(16,185,129,0.4)" : "none",
                border: !isWinner ? "2px solid rgba(16,185,129,0.5)" : "2px solid transparent",
              }}>{agentB.avatar}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#fff", fontWeight: 600 }}>
                {agentB.name}
              </div>
              <EloDelta delta={!isWinner ? eloDelta : -eloDelta} isWinner={!isWinner} />
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 10, color: agentB.color,
              }}>{stats.finalStacks.b.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Rank Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 12,
          }}>RANK PROGRESS</div>
          <RankProgress rank={activeAgent.rank} currentPct={62} newPct={isWinner ? 74 : 54} />
        </div>

        {/* Match Stats */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 14,
          }}>MATCH STATS</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}>
            <StatCard label="Hands Played" value={stats.handsPlayed} color="#fff" />
            <StatCard label="VPIP" value={stats.vpip} suffix="%" color="#60a5fa" />
            <StatCard label="Aggression" value={stats.aggression} suffix="%" color="#f59e0b" />
            <StatCard label="Avg Pot" value={stats.avgPot} color="#a78bfa" />
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 12,
          }}>
            <StatCard label="Hands Won" value={stats.handsWon} color="#10b981" />
            <StatCard label="Biggest Pot" value={stats.biggestPot} color="#fcd34d" />
            <StatCard label="Net Chips" value={isWinner ? `+${stats.finalStacks.a - 1000}` : `${stats.finalStacks.a - 1000}`} color={isWinner ? "#10b981" : "#ef4444"} />
          </div>
        </div>

        {/* CTAs */}
        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <button
            onClick={handleReplay}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.7)",
              border: "1.5px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "13px 22px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >↺ Replay Match</button>

          <button
            onClick={handleTestAgain}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9,
              background: "rgba(224,27,45,0.1)",
              color: "#e01b2d",
              border: "1.5px solid rgba(224,27,45,0.3)",
              borderRadius: 10,
              padding: "13px 22px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(224,27,45,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(224,27,45,0.1)"; }}
          >⟳ Test Again</button>

          <button
            onClick={handleAgentLab}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9,
              background: "linear-gradient(135deg, #e01b2d, #b91c1c)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "13px 22px",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(224,27,45,0.35)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 32px rgba(224,27,45,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(224,27,45,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >← Back to Agent Lab</button>
        </div>
      </div>
    </div>
  );
}
