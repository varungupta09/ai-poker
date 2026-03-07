import { useState, useEffect, useRef } from "react";
import { activeAgent } from "../mocks/mockAgents.js";
import { mockMatchEvents } from "../mocks/mockMatchEvents.js";

function toDisplayAgent(agent, fallback) {
  const a = agent ?? fallback;
  if (!a) return { name: "Agent", avatar: "?", color: "#94a3b8", style: "—" };
  const name = a.name ?? "Agent";
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return {
    name,
    avatar: a.avatar ?? initials,
    color: a.color ?? "#e01b2d",
    style: a.style ?? a.type ?? "—",
  };
}

// ─── Card helpers ─────────────────────────────────────────────────────────────

const SUIT_SYMBOLS = { h: "♥", d: "♦", c: "♣", s: "♠" };
const SUIT_COLORS  = { h: "#ef4444", d: "#ef4444", c: "#1e293b", s: "#1e293b" };

function parseCard(str) {
  if (!str) return null;
  const suit = str[str.length - 1];
  const rank = str.slice(0, -1);
  return { rank, suit, symbol: SUIT_SYMBOLS[suit] || suit, red: suit === "h" || suit === "d" };
}

// ─── Board Card ───────────────────────────────────────────────────────────────

function BoardCard({ cardStr, revealed }) {
  const card = parseCard(cardStr);
  if (!card) return (
    <div style={{
      width: 52, height: 72,
      borderRadius: 7,
      border: "1.5px dashed rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.03)",
    }} />
  );

  return (
    <div style={{
      width: 52,
      height: 72,
      borderRadius: 7,
      background: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "5px 6px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      animation: revealed ? "cardReveal 0.35s ease-out" : "none",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, lineHeight: 1, color: SUIT_COLORS[card.suit] }}>
        {card.rank}
      </div>
      <div style={{
        textAlign: "center",
        fontFamily: "Georgia, serif",
        fontSize: 20,
        lineHeight: 1,
        color: SUIT_COLORS[card.suit],
      }}>
        {card.symbol}
      </div>
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1,
        color: SUIT_COLORS[card.suit],
        alignSelf: "flex-end",
        transform: "rotate(180deg)",
      }}>
        {card.rank}
      </div>
    </div>
  );
}

// ─── Agent Hand Cards ─────────────────────────────────────────────────────────

function HandCard({ cardStr, faceUp }) {
  const card = faceUp ? parseCard(cardStr) : null;
  return (
    <div style={{
      width: 36, height: 50, borderRadius: 5,
      background: faceUp ? "#f8fafc" : "linear-gradient(135deg, #1e1b4b, #312e81)",
      border: faceUp ? "none" : "1.5px solid rgba(99,102,241,0.4)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: faceUp ? "3px 4px" : 0,
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      overflow: "hidden",
      alignItems: faceUp ? "stretch" : "center",
    }}>
      {faceUp && card ? (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "Georgia, serif", color: SUIT_COLORS[card.suit] }}>{card.rank}</div>
          <div style={{ fontSize: 14, textAlign: "center", fontFamily: "Georgia, serif", color: SUIT_COLORS[card.suit] }}>{card.symbol}</div>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "Georgia, serif", color: SUIT_COLORS[card.suit], alignSelf: "flex-end", transform: "rotate(180deg)" }}>{card.rank}</div>
        </>
      ) : (
        <div style={{ fontSize: 18, color: "rgba(129,140,248,0.4)", alignSelf: "center", marginTop: "auto", marginBottom: "auto" }}>🂠</div>
      )}
    </div>
  );
}

// ─── Agent Panel ──────────────────────────────────────────────────────────────

function AgentPanel({ label, name, avatar, color, stack, lastAction, style: agentStyle, isWinner, showCards, cards }) {
  const pct = Math.round((stack / 2000) * 100);
  const rankColor = isWinner === true ? "#10b981" : isWinner === false ? "#e01b2d" : color;

  return (
    <div style={{
      background: "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      border: `1.5px solid ${isWinner === true ? "rgba(16,185,129,0.4)" : isWinner === false ? "rgba(224,27,45,0.4)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 14,
      padding: "16px 18px",
      boxShadow: isWinner === true ? "0 0 20px rgba(16,185,129,0.12)" : "none",
      transition: "all 0.4s ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: `linear-gradient(135deg, ${color}, ${color}88)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "#fff",
          flexShrink: 0,
          boxShadow: `0 0 10px ${color}44`,
        }}>{avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8, color: "#fff", marginBottom: 3,
          }}>{name}</div>
          <div style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 10, color: "rgba(255,255,255,0.4)",
          }}>{label}</div>
        </div>
        {isWinner === true && (
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7, color: "#10b981",
            padding: "2px 6px", borderRadius: 4,
            background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)",
          }}>WIN</span>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, justifyContent: "center" }}>
        {(cards || ["??", "??"]).map((c, i) => (
          <HandCard key={i} cardStr={c} faceUp={showCards} />
        ))}
      </div>

      {/* Stack */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Stack</span>
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 9, color: rankColor,
          }}>{stack.toLocaleString()}</span>
        </div>
        <div style={{
          height: 3, borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${Math.max(2, pct)}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Style tag */}
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 7, color: color,
        padding: "3px 8px", borderRadius: 4,
        background: `${color}15`,
        border: `1px solid ${color}33`,
        display: "inline-block",
        marginBottom: 10,
      }}>{agentStyle}</div>

      {/* Last action */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        borderRadius: 7,
        padding: "8px 12px",
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        color: lastAction ? "#fff" : "rgba(255,255,255,0.25)",
        minHeight: 36,
        display: "flex",
        alignItems: "center",
      }}>
        {lastAction || "Waiting…"}
      </div>
    </div>
  );
}

// ─── Action Log ───────────────────────────────────────────────────────────────

function ActionLog({ entries }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries.length]);

  const typeColor = {
    a: { bg: "rgba(224,27,45,0.1)", border: "rgba(224,27,45,0.3)", text: "#fca5a5" },
    b: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", text: "#a5b4fc" },
    dealer: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", text: "#fcd34d" },
    divider: { bg: "transparent", border: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.25)" },
    showdown: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#6ee7b7" },
    winner: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.4)", text: "#10b981" },
  };

  return (
    <div style={{
      height: "100%",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      padding: "4px 2px",
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(255,255,255,0.1) transparent",
    }}>
      {entries.map((entry, i) => {
        const colors = typeColor[entry.type] || typeColor.a;
        return (
          <div
            key={i}
            style={{
              padding: entry.type === "divider" ? "6px 0" : "6px 10px",
              borderRadius: 6,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              fontFamily: entry.type === "divider" ? '"Press Start 2P", monospace' : "Inter, sans-serif",
              fontSize: entry.type === "divider" ? 10 : 11,
              color: colors.text,
              letterSpacing: entry.type === "divider" ? 0.5 : 0,
              textAlign: entry.type === "divider" ? "center" : "left",
              animation: "fadeIn 0.2s ease-out",
              lineHeight: 1.4,
            }}
          >
            {entry.text}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Poker Table Panel ────────────────────────────────────────────────────────

function PokerTablePanel({ board, pot, currentHand }) {
  // Which board cards are "new" (last 1-3 to be revealed)
  const slots = [null, null, null, null, null];
  board.forEach((c, i) => { slots[i] = c; });

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
    }}>
      {/* Felt table */}
      <div style={{
        background: "radial-gradient(ellipse at center, #065f46 0%, #064e3b 50%, #022c22 100%)",
        border: "8px solid #374151",
        outline: "3px solid #1f2937",
        borderRadius: 120,
        padding: "32px 48px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        boxShadow: "0 0 60px rgba(0,0,0,0.7), inset 0 0 40px rgba(0,0,0,0.3)",
        minWidth: 320,
      }}>
        {/* Pot */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(0,0,0,0.35)",
          padding: "6px 16px",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <span style={{ fontSize: 14 }}>🪙</span>
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 10,
            color: "#fcd34d",
          }}>POT: {pot}</span>
        </div>

        {/* Community cards */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {slots.map((card, i) => (
            <BoardCard key={i} cardStr={card} revealed={!!card} />
          ))}
        </div>

        {/* Board label */}
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: 2,
        }}>COMMUNITY CARDS</div>
      </div>
    </div>
  );
}

// ─── Match Header ─────────────────────────────────────────────────────────────

function MatchHeader({ currentHand, totalHands, elapsed, isPlaying, onPause, onResume, onReplay, onExit, manualAdvance, onNext, showNextGameButton, nextButtonLabel }) {
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 20px",
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      flexShrink: 0,
    }}>
      {/* LIVE badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(224,27,45,0.15)",
        border: "1px solid rgba(224,27,45,0.4)",
        borderRadius: 6,
        padding: "4px 10px",
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#e01b2d",
          animation: "livePulse 1s ease-in-out infinite",
          boxShadow: "0 0 6px #e01b2d",
        }} />
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#e01b2d" }}>LIVE</span>
      </div>

      {/* Hand counter */}
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 9,
        color: "#fff",
        background: "rgba(255,255,255,0.06)",
        padding: "5px 12px",
        borderRadius: 6,
      }}>
        HAND {currentHand}/{totalHands}
      </div>

      {/* Timer */}
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 9,
        color: "rgba(255,255,255,0.5)",
      }}>{mins}:{secs}</div>

      <div style={{ flex: 1 }} />

      {/* Test match: Next game / View results (shown only between hands or at match end) */}
      {showNextGameButton && onNext && (
        <button
          onClick={onNext}
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            background: nextButtonLabel === "View results" ? "rgba(99,102,241,0.25)" : "rgba(16,185,129,0.2)",
            color: nextButtonLabel === "View results" ? "#a5b4fc" : "#34d399",
            border: nextButtonLabel === "View results" ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(16,185,129,0.5)",
            borderRadius: 6,
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >{nextButtonLabel}</button>
      )}

      {/* Auto-replay controls (hidden in manual-advance mode) */}
      {!manualAdvance && (
        <>
          <button
            onClick={isPlaying ? onPause : onResume}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 8,
              background: "rgba(255,255,255,0.07)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
            }}
          >{isPlaying ? "⏸ Pause" : "▶ Resume"}</button>

          <button
            onClick={onReplay}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 8,
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
            }}
          >↺ Replay</button>
        </>
      )}

      <button
        onClick={onExit}
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8,
          background: "rgba(224,27,45,0.12)",
          color: "rgba(224,27,45,0.8)",
          border: "1px solid rgba(224,27,45,0.25)",
          borderRadius: 6,
          padding: "6px 14px",
          cursor: "pointer",
        }}
      >✕ Exit</button>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function MatchProgressBar({ currentHand, totalHands }) {
  const pct = Math.round((currentHand / totalHands) * 100);
  return (
    <div style={{
      padding: "12px 20px",
      background: "rgba(0,0,0,0.5)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          color: "rgba(255,255,255,0.3)",
        }}>MATCH PROGRESS</span>
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          color: "rgba(255,255,255,0.3)",
        }}>HAND {currentHand}/{totalHands}</span>
      </div>
      <div style={{
        height: 5, borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 999,
          background: "linear-gradient(90deg, #e01b2d, #ef4444)",
          transition: "width 0.6s ease",
          boxShadow: "0 0 8px rgba(224,27,45,0.5)",
        }} />
      </div>
    </div>
  );
}

// ─── Match Screen ─────────────────────────────────────────────────────────────

const INITIAL_MATCH_STATE = {
  hand: 1,
  board: [],
  pot: 0,
  stacks: { a: 1000, b: 1000 },
  lastAction: { a: null, b: null },
  actionLog: [],
  winner: null,
  showCards: false,
  handA: null,
  handB: null,
};

function formatAction(verb, amount) {
  const v = verb.charAt(0).toUpperCase() + verb.slice(1);
  return amount && amount > 0 ? `${v} ${amount}` : v;
}

export default function MatchScreen({ setScreen, setScreenParams, screenParams, eventsOverride, isTestMatchOverride }) {
  const opponent  = screenParams?.opponent;
  const matchId   = screenParams?.matchId || "mock-1";
  const events    = eventsOverride ?? screenParams?.events ?? mockMatchEvents[matchId] ?? [];
  const totalHands = events.length
    ? Math.max(...events.map((e) => e.handNumber || 0), 1)
    : 20;
  // Test match = event stream ends with "match_end" (from runPokerGameMatch). No refs/params needed.
  const isTestMatchStream = events.length > 0 && events[events.length - 1]?.type === "match_end";
  const manualAdvance = isTestMatchStream;

  const agentA = toDisplayAgent(screenParams?.agent, activeAgent);
  const agentB = toDisplayAgent(opponent, { name: "AggroBot", avatar: "AB", color: "#d97706", style: "Aggressive" });

  const [matchState, setMatchState] = useState({ ...INITIAL_MATCH_STATE });
  const [eventIdx, setEventIdx]     = useState(0);
  const [isPlaying, setIsPlaying]   = useState(true);
  const [elapsed, setElapsed]       = useState(0);
  const [replayKey, setReplayKey]   = useState(0);

  const timerRef   = useRef(null);
  const clockRef   = useRef(null);
  const isPlayingRef = useRef(true);

  // Keep ref in sync
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Clock
  useEffect(() => {
    clockRef.current = setInterval(() => {
      if (isPlayingRef.current) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(clockRef.current);
  }, [replayKey]);

  // Process a single event and return a new state
  function applyEvent(ev, state) {
    const next = { ...state, actionLog: [...state.actionLog] };
    const { type, payload, handNumber } = ev;

    switch (type) {
      case "hand_start": {
        next.hand = handNumber;
        next.board = [];
        next.showCards = false;
        next.winner = null;
        next.handA = null;
        next.handB = null;
        next.pot = payload.pot ?? 15;
        if (payload.stacks) next.stacks = { ...payload.stacks };
        next.lastAction = { a: null, b: null };
        next.actionLog = [
          { type: "divider", text: `── Hand ${handNumber} ──` },
          ...next.actionLog,
        ];
        break;
      }
      case "action": {
        const { actor, verb, amount, pot, stacks } = payload;
        const name = actor === "a" ? agentA.name : agentB.name;
        const actionStr = formatAction(verb, amount);
        if (pot !== undefined) next.pot = pot;
        if (stacks) next.stacks = { ...stacks };
        next.lastAction = { ...next.lastAction, [actor]: actionStr };
        next.actionLog = [
          { type: actor, text: `${name}: ${actionStr}` },
          ...next.actionLog,
        ];
        break;
      }
      case "deal_flop": {
        const { cards, pot, stacks } = payload;
        next.board = [...cards];
        if (pot !== undefined) next.pot = pot;
        if (stacks) next.stacks = { ...stacks };
        next.actionLog = [
          { type: "dealer", text: `Flop: ${cards.join(" ")}` },
          ...next.actionLog,
        ];
        break;
      }
      case "deal_turn": {
        const { card, pot, stacks } = payload;
        next.board = [...next.board, card];
        if (pot !== undefined) next.pot = pot;
        if (stacks) next.stacks = { ...stacks };
        next.actionLog = [
          { type: "dealer", text: `Turn: ${card}` },
          ...next.actionLog,
        ];
        break;
      }
      case "deal_river": {
        const { card, pot, stacks } = payload;
        next.board = [...next.board, card];
        if (pot !== undefined) next.pot = pot;
        if (stacks) next.stacks = { ...stacks };
        next.actionLog = [
          { type: "dealer", text: `River: ${card}` },
          ...next.actionLog,
        ];
        break;
      }
      case "showdown": {
        next.showCards = true;
        if (payload.handA && Array.isArray(payload.handA)) next.handA = payload.handA;
        if (payload.handB && Array.isArray(payload.handB)) next.handB = payload.handB;
        next.actionLog = [
          { type: "showdown", text: `SHOWDOWN — ${payload.reason}` },
          ...next.actionLog,
        ];
        break;
      }
      case "pot_awarded": {
        const { actor, amount, stacks } = payload;
        const name = actor === "a" ? agentA.name : agentB.name;
        if (stacks) next.stacks = { ...stacks };
        next.winner = actor;
        next.actionLog = [
          { type: "winner", text: `🏆 ${name} wins ${amount}` },
          ...next.actionLog,
        ];
        break;
      }
      case "match_end": {
        const winnerName = payload.winner === "b" ? agentB.name : agentA.name;
        next.actionLog = [
          { type: "winner", text: `MATCH OVER — ${winnerName} wins!` },
          ...next.actionLog,
        ];
        break;
      }
      default: break;
    }
    return next;
  }

  // Advance event loop. For test match (stream ends with match_end): pause before hand_start (except first) and match_end.
  useEffect(() => {
    if (!isPlaying) return;
    if (eventIdx >= events.length) return;

    const ev = events[eventIdx];
    const isHandStart = ev?.type === "hand_start";
    const isMatchEnd = ev?.type === "match_end";
    const isTestMatch = events.length > 0 && events[events.length - 1]?.type === "match_end";
    const shouldPause = isTestMatch && (isMatchEnd || (isHandStart && eventIdx > 0));

    if (shouldPause) {
      return () => {};
    }

    const delay = isHandStart ? 900 : 700 + Math.random() * 500;

    timerRef.current = setTimeout(() => {
      if (!isPlayingRef.current) return;
      setMatchState((prev) => {
        const newState = applyEvent(ev, prev);
        return newState;
      });
      if (ev.type === "match_end") {
        setTimeout(() => {
          if (isPlayingRef.current) setScreen("result");
        }, 1400);
      } else {
        setEventIdx((i) => i + 1);
      }
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [eventIdx, isPlaying, replayKey, events]);

  function handleNext() {
    if (eventIdx >= events.length) {
      setScreen("result");
      return;
    }
    const ev = events[eventIdx];
    setMatchState((prev) => applyEvent(ev, prev));
    setEventIdx((i) => i + 1);
    if (ev.type === "match_end") {
      setScreen("result");
    }
  }

  function handlePause() {
    setIsPlaying(false);
    clearTimeout(timerRef.current);
  }

  function handleResume() {
    setIsPlaying(true);
  }

  function handleReplay() {
    clearTimeout(timerRef.current);
    setMatchState({ ...INITIAL_MATCH_STATE });
    setEventIdx(0);
    setElapsed(0);
    setIsPlaying(true);
    setReplayKey((k) => k + 1);
  }

  function handleExit() {
    clearTimeout(timerRef.current);
    setScreen("play");
  }

  const { hand, board, pot, stacks, lastAction, actionLog, winner, showCards, handA, handB } = matchState;

  // Reverse log so newest is at bottom for display (we prepend, so reverse for display)
  const displayLog = [...actionLog].reverse();

  return (
    <div style={{
      height: "100vh",
      background: "#080810",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(224,27,45,0.06) 0%, transparent 55%)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <MatchHeader
        currentHand={hand}
        totalHands={totalHands}
        elapsed={elapsed}
        isPlaying={isPlaying}
        onPause={handlePause}
        onResume={handleResume}
        onReplay={handleReplay}
        onExit={handleExit}
        manualAdvance={manualAdvance}
        onNext={manualAdvance ? handleNext : undefined}
        showNextGameButton={manualAdvance && eventIdx < events.length && ((events[eventIdx]?.type === "hand_start" && eventIdx > 0) || events[eventIdx]?.type === "match_end")}
        nextButtonLabel={eventIdx < events.length && events[eventIdx]?.type === "match_end" ? "View results" : "Next game"}
      />

      {/* Main 3-column layout */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "260px 1fr 260px",
        gap: 0,
        overflow: "hidden",
        minHeight: 0,
      }}>
        {/* Left: Action Log */}
        <div style={{
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "10px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: "rgba(255,255,255,0.25)",
            letterSpacing: 1,
            flexShrink: 0,
          }}>ACTION LOG</div>
          <div style={{ flex: 1, overflow: "hidden", padding: "8px 10px 8px 12px" }}>
            <ActionLog entries={displayLog} />
          </div>
        </div>

        {/* Center: Table */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}>
          <PokerTablePanel board={board} pot={pot} currentHand={hand} />
        </div>

        {/* Right: Agent panels */}
        <div style={{
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "16px 14px",
          overflowY: "auto",
        }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: 1,
          }}>AGENTS</div>

          <AgentPanel
            label="Your Agent"
            name={agentA.name}
            avatar={agentA.avatar}
            color={agentA.color}
            stack={stacks.a}
            lastAction={lastAction.a}
            style={agentA.style}
            isWinner={winner === null ? null : winner === "a"}
            showCards={showCards}
            cards={handA ?? ["??", "??"]}
          />

          <div style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            textAlign: "center",
            letterSpacing: 2,
          }}>VS</div>

          <AgentPanel
            label="Opponent"
            name={agentB.name}
            avatar={agentB.avatar}
            color={agentB.color}
            stack={stacks.b}
            lastAction={lastAction.b}
            style={agentB.style}
            isWinner={winner === null ? null : winner === "b"}
            showCards={showCards}
            cards={handB ?? ["??", "??"]}
          />

          {/* Stack summary */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: "10px 14px",
            marginTop: 4,
          }}>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7, color: "rgba(255,255,255,0.25)", marginBottom: 8, letterSpacing: 1,
            }}>CHIP COUNTS</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{agentA.name.split(" ")[0]}</span>
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#ef4444" }}>{stacks.a}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{agentB.name.split(" ")[0]}</span>
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: agentB.color }}>{stacks.b}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom progress bar */}
      <MatchProgressBar currentHand={hand} totalHands={totalHands} />
    </div>
  );
}
