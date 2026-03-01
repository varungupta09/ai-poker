import { useState, useEffect, useRef } from "react";
import { activeAgent } from "../mocks/mockAgents.js";

// ─── Queue Toast ──────────────────────────────────────────────────────────────

function FoundToast({ opponent, visible }) {
  return (
    <div style={{
      position: "fixed",
      top: 28,
      left: "50%",
      transform: `translate(-50%, ${visible ? 0 : -80}px)`,
      opacity: visible ? 1 : 0,
      transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
      zIndex: 100,
      background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.06))",
      border: "1.5px solid rgba(16,185,129,0.45)",
      borderRadius: 12,
      padding: "12px 22px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      backdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      whiteSpace: "nowrap",
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#10b981",
        boxShadow: "0 0 8px #10b981",
        animation: "livePulse 1s infinite",
      }} />
      <span style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 9,
        color: "#10b981",
      }}>Opponent Found!</span>
      <span style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 13,
        color: "#fff",
        fontWeight: 600,
      }}>{opponent?.name}</span>
    </div>
  );
}

// ─── Queue Screen ─────────────────────────────────────────────────────────────

export default function QueueScreen({ setScreen, screenParams }) {
  const opponent = screenParams?.opponent;
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("searching"); // "searching" | "found" | "loading"
  const [toastVisible, setToastVisible] = useState(false);
  const [dots, setDots] = useState("");
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const TOTAL_MS = 4200;

  useEffect(() => {
    startRef.current = performance.now();

    function tick(now) {
      const elapsed = now - startRef.current;
      const pct = Math.min((elapsed / TOTAL_MS) * 100, 100);
      setProgress(pct);

      if (pct >= 48 && pct < 52) {
        setPhase("found");
        setToastVisible(true);
      }
      if (pct >= 75) {
        setPhase("loading");
      }

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Navigate to match
        setTimeout(() => setScreen("match"), 200);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Animated dots
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 420);
    return () => clearInterval(id);
  }, []);

  const statusLabel = phase === "searching"
    ? `Searching for opponent${dots}`
    : phase === "found"
    ? "Opponent found!"
    : `Starting match${dots}`;

  const statusColor = phase === "found" ? "#10b981" : phase === "loading" ? "#f59e0b" : "#e01b2d";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      backgroundImage: "radial-gradient(ellipse at 50% 30%, rgba(224,27,45,0.07) 0%, transparent 65%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient rings */}
      <div style={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        border: "1px solid rgba(224,27,45,0.06)",
        animation: "qs-ring-expand 3s ease-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 350,
        height: 350,
        borderRadius: "50%",
        border: "1px solid rgba(224,27,45,0.09)",
        animation: "qs-ring-expand 3s ease-out infinite 1s",
        pointerEvents: "none",
      }} />

      <FoundToast opponent={opponent} visible={toastVisible} />

      {/* Logo mark */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: "linear-gradient(135deg, #e01b2d, #7f1d1d)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 22,
        color: "#fff",
        marginBottom: 32,
        boxShadow: `0 0 32px rgba(224,27,45,0.35)`,
      }}>P</div>

      {/* Spinner */}
      <div style={{ position: "relative", width: 100, height: 100, marginBottom: 36 }}>
        {/* Outer ring */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid rgba(224,27,45,0.15)",
        }} />
        {/* Spinning arc */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#e01b2d",
          borderRightColor: "rgba(224,27,45,0.4)",
          animation: "spin 0.9s linear infinite",
        }} />
        {/* Inner dot */}
        <div style={{
          position: "absolute",
          inset: "30%",
          borderRadius: "50%",
          background: "rgba(224,27,45,0.12)",
          border: "1.5px solid rgba(224,27,45,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#e01b2d",
            boxShadow: "0 0 8px #e01b2d",
            animation: "livePulse 1.2s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Status text */}
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 13,
        color: statusColor,
        marginBottom: 10,
        letterSpacing: 1,
        transition: "color 0.3s",
        textAlign: "center",
      }}>{statusLabel}</div>

      <div style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 13,
        color: "rgba(255,255,255,0.35)",
        marginBottom: 48,
        textAlign: "center",
      }}>
        {phase !== "found"
          ? `${activeAgent.name} · ${activeAgent.elo} ELO`
          : `Matched with ${opponent?.name} · ${opponent?.elo} ELO`}
      </div>

      {/* Progress bar */}
      <div style={{ width: 320, marginBottom: 24 }}>
        <div style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 999,
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, #e01b2d, #ef4444)`,
            transition: "width 0.06s linear",
            boxShadow: "0 0 10px rgba(224,27,45,0.6)",
          }} />
          {/* Shimmer */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s linear infinite",
            borderRadius: 999,
          }} />
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          color: "rgba(255,255,255,0.2)",
        }}>
          <span>Matchmaking</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Queue details */}
      <div style={{
        display: "flex",
        gap: 32,
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        color: "rgba(255,255,255,0.25)",
      }}>
        <span>Region: US-East</span>
        <span>·</span>
        <span>Mode: Test Match</span>
        <span>·</span>
        <span>Queue: 1</span>
      </div>
    </div>
  );
}
