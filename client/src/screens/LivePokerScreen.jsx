/*
  client/src/screens/LivePokerScreen.jsx
  Interactive poker: You vs AI agents, powered by the poker/server game server.

  Expects setScreen + optional screenParams:
    { playerId?, playerCount?, smallBlind?, bigBlind?, startingStack? }
*/

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "../lib/supabaseClient"

const API = import.meta.env.VITE_POKER_API_URL ?? "http://localhost:3001"

// ── Card helpers ────────────────────────────────────────────────────────────

const RANK_LABEL = { 14: "A", 13: "K", 12: "Q", 11: "J", 10: "10" }
const SUIT_SYMBOL = { h: "♥", d: "♦", c: "♣", s: "♠" }
const IS_RED = { h: true, d: true, c: false, s: false }

function rankStr(rank) {
  return RANK_LABEL[rank] ?? String(rank)
}

function CardFace({ card, size = "md" }) {
  const w  = size === "lg" ? 64 : size === "sm" ? 32 : 48
  const h  = size === "lg" ? 90 : size === "sm" ? 44 : 68
  const fs = size === "lg" ? 18 : size === "sm" ? 11 : 14
  const ss = size === "lg" ? 26 : size === "sm" ? 16 : 20
  const red = IS_RED[card.suit]

  return (
    <div style={{
      width: w, height: h, borderRadius: 7,
      background: "#f8fafc",
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      padding: "5px 6px",
      boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
      flexShrink: 0,
      userSelect: "none",
    }}>
      <div style={{ fontFamily: "Georgia,serif", fontSize: fs, fontWeight: 700, color: red ? "#dc2626" : "#1e293b", lineHeight: 1 }}>
        {rankStr(card.rank)}
      </div>
      <div style={{ textAlign: "center", fontFamily: "Georgia,serif", fontSize: ss, color: red ? "#dc2626" : "#1e293b", lineHeight: 1 }}>
        {SUIT_SYMBOL[card.suit]}
      </div>
      <div style={{ fontFamily: "Georgia,serif", fontSize: fs, fontWeight: 700, color: red ? "#dc2626" : "#1e293b", lineHeight: 1, alignSelf: "flex-end", transform: "rotate(180deg)" }}>
        {rankStr(card.rank)}
      </div>
    </div>
  )
}

function CardBack({ size = "md" }) {
  const w = size === "lg" ? 64 : size === "sm" ? 32 : 48
  const h = size === "lg" ? 90 : size === "sm" ? 44 : 68
  return (
    <div style={{
      width: w, height: h, borderRadius: 7,
      background: "linear-gradient(135deg, #1e1b4b, #312e81)",
      border: "1.5px solid rgba(99,102,241,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
      fontSize: size === "sm" ? 14 : 20,
      flexShrink: 0,
    }}>🂠</div>
  )
}

function CardSlot({ size = "md" }) {
  const w = size === "lg" ? 64 : 48
  const h = size === "lg" ? 90 : 68
  return (
    <div style={{
      width: w, height: h, borderRadius: 7,
      border: "1.5px dashed rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.03)",
      flexShrink: 0,
    }} />
  )
}

// ── Pot calc ────────────────────────────────────────────────────────────────

function calcPot(state) {
  if (!state) return 0
  return state.pots?.reduce((s, p) => s + p.amount, 0) ?? 0
}

// ── Bot panel component ─────────────────────────────────────────────────────

const BOT_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#0ea5e9"]

function BotPanel({ player, lastAction, isWinner, startingStack, colorIdx, isYourAgent, showCards }) {
  const color = isYourAgent ? "#06b6d4" : BOT_COLORS[colorIdx % BOT_COLORS.length]
  const pct   = Math.min(100, Math.round((player.stack / startingStack) * 100))
  const hasFolded = player.hasFolded

  return (
    <div style={{
      background: "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      border: `1.5px solid ${isWinner ? "rgba(16,185,129,0.5)" : hasFolded ? "rgba(255,255,255,0.04)" : `${color}33`}`,
      borderRadius: 14,
      padding: "14px 16px",
      opacity: hasFolded ? 0.45 : 1,
      transition: "all 0.3s",
      boxShadow: isWinner ? "0 0 20px rgba(16,185,129,0.15)" : "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8,
          background: `linear-gradient(135deg, ${color}, ${color}88)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#fff",
          flexShrink: 0, boxShadow: `0 0 8px ${color}44`,
        }}>{isYourAgent ? "RX" : "AI"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: isYourAgent ? "#67e8f9" : "#fff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isYourAgent ? "YOU (RMX)" : player.id}
          </div>
          <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            {hasFolded ? "Folded" : player.isAllIn ? "All-in" : "Active"}
          </div>
        </div>
        {isWinner && (
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "#10b981", padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>WIN</span>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>
        {showCards && player.holeCards?.length === 2
          ? player.holeCards.map((c, i) => <CardFace key={i} card={c} size="sm" />)
          : [0, 1].map((i) => <CardBack key={i} size="sm" />)
        }
      </div>

      {/* Stack bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Stack</span>
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: isWinner ? "#10b981" : color }}>
            {player.stack.toLocaleString()}
          </span>
        </div>
        <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.max(2, pct)}%`, borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}cc)`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* Last action bubble */}
      <div style={{
        background: "rgba(0,0,0,0.3)", borderRadius: 7, padding: "7px 11px",
        fontFamily: "Inter,sans-serif", fontSize: 11,
        color: lastAction ? "#fff" : "rgba(255,255,255,0.22)",
        minHeight: 32, display: "flex", alignItems: "center",
      }}>
        {lastAction || "Waiting…"}
      </div>
    </div>
  )
}

// ── Action log ──────────────────────────────────────────────────────────────

function ActionLog({ entries }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [entries.length])

  function colorFor(entry) {
    if (entry.type === "divider") return { bg: "transparent", border: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.35)" }
    if (entry.type === "winner")  return { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.35)", text: "#6ee7b7" }
    if (entry.type === "dealer")  return { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", text: "#fcd34d" }
    if (entry.type === "you")     return { bg: "rgba(224,27,45,0.1)", border: "rgba(224,27,45,0.3)", text: "#fca5a5" }
    return { bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)", text: "rgba(255,255,255,0.7)" }
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, padding: "2px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
      {entries.map((entry, i) => {
        const c = colorFor(entry)
        return (
          <div key={i} style={{
            padding: entry.type === "divider" ? "5px 0" : "6px 10px",
            borderRadius: 6,
            background: c.bg,
            border: `1px solid ${c.border}`,
            fontFamily: entry.type === "divider" ? '"Press Start 2P", monospace' : "Inter,sans-serif",
            fontSize: entry.type === "divider" ? 9 : 11,
            color: c.text,
            textAlign: entry.type === "divider" ? "center" : "left",
            lineHeight: 1.4,
            letterSpacing: entry.type === "divider" ? 0.5 : 0,
          }}>{entry.text}</div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

// ── Community cards ─────────────────────────────────────────────────────────

function CommunityBoard({ cards }) {
  const slots = [null, null, null, null, null]
  ;(cards ?? []).forEach((c, i) => { slots[i] = c })

  return (
    <div style={{
      background: "radial-gradient(ellipse at center, #065f46 0%, #064e3b 50%, #022c22 100%)",
      border: "8px solid #374151",
      outline: "3px solid #1f2937",
      borderRadius: 80,
      padding: "24px 40px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      boxShadow: "0 0 60px rgba(0,0,0,0.7), inset 0 0 40px rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {slots.map((card, i) =>
          card ? <CardFace key={i} card={card} /> : <CardSlot key={i} />
        )}
      </div>
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>
        COMMUNITY CARDS
      </div>
    </div>
  )
}

// ── Action buttons ──────────────────────────────────────────────────────────

function ActionButtons({ legalActions, onAction, disabled }) {
  const [betInput, setBetInput] = useState("")
  const acts = legalActions?.actions ?? []

  const canCheck = acts.includes("check")
  const canCall  = acts.includes("call")
  const canFold  = acts.includes("fold")
  const canBet   = acts.includes("bet")
  const canRaise = acts.includes("raise")

  const needsAmount = canBet || canRaise
  const min = legalActions?.minBetOrRaise ?? 0
  const max = legalActions?.maxBetOrRaise ?? 0

  function submit(type, amount) {
    if (disabled) return
    onAction({ type, amount })
    setBetInput("")
  }

  const btnBase = {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 9,
    borderRadius: 8,
    padding: "10px 18px",
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Primary action row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {canFold && (
          <button onClick={() => submit("fold")} disabled={disabled} style={{ ...btnBase, background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.4)" }}>
            ✕ Fold
          </button>
        )}
        {canCheck && (
          <button onClick={() => submit("check")} disabled={disabled} style={{ ...btnBase, background: "rgba(100,116,139,0.2)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }}>
            ✓ Check
          </button>
        )}
        {canCall && (
          <button onClick={() => submit("call")} disabled={disabled} style={{ ...btnBase, background: "rgba(16,185,129,0.2)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.4)" }}>
            📞 Call {legalActions?.callAmount ? `(${legalActions.callAmount})` : ""}
          </button>
        )}
      </div>

      {/* Bet / Raise row */}
      {needsAmount && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="number"
            value={betInput}
            min={min}
            max={max}
            placeholder={`${min}–${max}`}
            onChange={(e) => setBetInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && betInput) submit(canBet ? "bet" : "raise", Number(betInput)) }}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#fff",
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9,
              width: 110,
              outline: "none",
            }}
          />
          {/* Quick-pick buttons */}
          {[
            { label: "Min", val: min },
            { label: "½ Pot", val: null }, // computed at render
            { label: "All-in", val: max },
          ].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => setBetInput(String(val ?? min))}
              style={{
                ...btnBase,
                padding: "8px 10px",
                fontSize: 8,
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >{label}</button>
          ))}
          <button
            onClick={() => { if (betInput) submit(canBet ? "bet" : "raise", Number(betInput)) }}
            disabled={disabled || !betInput}
            style={{ ...btnBase, background: "rgba(224,27,45,0.25)", color: "#fca5a5", border: "1px solid rgba(224,27,45,0.5)" }}
          >
            {canBet ? "💰 Bet" : "⬆ Raise"}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Winners banner ──────────────────────────────────────────────────────────

function WinnersBanner({ winners, onNextHand, yourId, agentLabel }) {
  if (!winners || winners.length === 0) return null

  function displayName(playerId) {
    if (playerId === yourId) return agentLabel ? `You (${agentLabel})` : "You"
    return playerId
  }

  return (
    <div style={{
      background: "rgba(16,185,129,0.12)",
      border: "1px solid rgba(16,185,129,0.4)",
      borderRadius: 12,
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    }}>
      <div>
        {winners.map((w, i) => (
          <div key={i} style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "#6ee7b7", marginBottom: 2 }}>
            🏆 <strong>{displayName(w.playerId)}</strong> wins {w.potAmount.toLocaleString()} chips
            {w.handDescription && w.handDescription !== "Uncontested" ? ` — ${w.handDescription}` : ""}
          </div>
        ))}
      </div>
      {onNextHand && (
        <button
          onClick={onNextHand}
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 9,
            background: "rgba(16,185,129,0.25)",
            color: "#34d399",
            border: "1px solid rgba(16,185,129,0.6)",
            borderRadius: 8,
            padding: "10px 18px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Deal Next Hand →
        </button>
      )}
    </div>
  )
}

// ── Agent decision engine ───────────────────────────────────────────────────
// Pure function — given legalActions + strategy_config, returns an action.

function computeAgentAction(legalActions, cfg) {
  const aggression = cfg?.aggression      ?? 50
  const bluffFreq  = cfg?.bluff_frequency ?? 50
  const riskTol    = cfg?.risk_tolerance  ?? 50
  const acts       = legalActions?.actions ?? []
  const min        = legalActions?.minBetOrRaise ?? 0
  const r          = () => Math.random() * 100

  // Free action: check available
  if (acts.includes("check")) {
    // Bet if aggressive enough
    if (acts.includes("bet") && r() < aggression * 0.65) {
      return { type: "bet", amount: min }
    }
    return { type: "check" }
  }

  // Facing a bet
  if (acts.includes("call")) {
    // Fold if risk-averse and not bluffing
    if (r() > riskTol && r() > bluffFreq) {
      return acts.includes("fold") ? { type: "fold" } : { type: "call" }
    }
    // Re-raise if aggressive
    if (acts.includes("raise") && r() < aggression * 0.45) {
      return { type: "raise", amount: min }
    }
    return { type: "call" }
  }

  if (acts.includes("fold")) return { type: "fold" }
  return { type: acts[0] ?? "fold" }
}

// ── Lobby / setup panel ─────────────────────────────────────────────────────

const BOT_OPTIONS = [
  { type: "random", label: "Random" },
  { type: "call",   label: "Caller" },
  { type: "fold",   label: "Folder" },
  { type: "rmx",    label: "RM7X" },
]

function Lobby({ onStart, serverOnline }) {
  const [playerCount, setPlayerCount] = useState(3)
  const [smallBlind, setSmallBlind]   = useState(10)
  const [bigBlind, setBigBlind]       = useState(20)
  const [startingStack, setStack]     = useState(1000)
  const [botTypes, setBotTypes]       = useState(["random", "call"])
  const [watchMode, setWatchMode]     = useState(false)
  const [userAgents, setUserAgents]   = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)

  useEffect(() => {
    async function loadUserAgents() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("user_agents")
        .select("id, agent_name, strategy_config")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (data?.length) {
        setUserAgents(data)
        setSelectedAgent(data[0].id)
      }
    }
    loadUserAgents()
  }, [])

  function updateBot(idx, type) {
    const next = [...botTypes]
    next[idx] = type
    setBotTypes(next)
  }

  // botTypes length = playerCount - 1  (your seat + bots)
  const bots = Array.from({ length: playerCount - 1 }, (_, i) => botTypes[i] ?? "random")

  function handleStart() {
    const agentData  = userAgents.find((a) => a.id === selectedAgent)
    const agentConfig = agentData?.strategy_config ?? null
    const agentName   = agentData?.agent_name ?? null
    onStart({ playerCount, smallBlind, bigBlind, startingStack, botTypes: bots, watchMode, selectedAgent, agentConfig, agentName })
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fff",
    fontFamily: "Inter,sans-serif",
    fontSize: 13,
    width: 80,
    outline: "none",
  }

  const labelStyle = {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 8,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 6,
    display: "block",
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "80vh", gap: 32,
    }}>
      {serverOnline === false && (
        <div style={{
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)", borderRadius: 10,
          padding: "12px 20px", maxWidth: 420, fontFamily: "Inter,sans-serif", fontSize: 12, color: "#fca5a5", textAlign: "center",
        }}>
          Game server is not running. Start it in a terminal: <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>cd poker/server && npm run dev</code>
        </div>
      )}
      <div>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 14, color: "#fff", textAlign: "center", marginBottom: 8 }}>
          POKER vs AI BOTS
        </div>
        <div style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
          {watchMode ? "Watch your agent battle the bots!" : "You play as the human. Bots act automatically."}
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        minWidth: 320,
      }}>
        {/* Your seat */}
        <div>
          <label style={labelStyle}>YOUR SEAT</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setWatchMode(false)}
              style={{
                fontFamily: "Inter,sans-serif",
                fontSize: 12,
                padding: "8px 14px",
                borderRadius: 7,
                border: !watchMode ? "1.5px solid #06b6d4" : "1.5px solid rgba(255,255,255,0.12)",
                background: !watchMode ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.04)",
                color: !watchMode ? "#67e8f9" : "rgba(255,255,255,0.55)",
                cursor: "pointer",
              }}
            >▶ Play (Human)</button>
            {userAgents.length === 0 ? (
              <button
                onClick={() => setWatchMode(true)}
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: 12,
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: watchMode ? "1.5px solid #06b6d4" : "1.5px solid rgba(255,255,255,0.12)",
                  background: watchMode ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.04)",
                  color: watchMode ? "#67e8f9" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                }}
              >👁 Watch (RM7X)</button>
            ) : (
              userAgents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setWatchMode(true); setSelectedAgent(a.id) }}
                  style={{
                    fontFamily: "Inter,sans-serif",
                    fontSize: 12,
                    padding: "8px 14px",
                    borderRadius: 7,
                    border: watchMode && selectedAgent === a.id
                      ? "1.5px solid #06b6d4"
                      : "1.5px solid rgba(255,255,255,0.12)",
                    background: watchMode && selectedAgent === a.id
                      ? "rgba(6,182,212,0.2)"
                      : "rgba(255,255,255,0.04)",
                    color: watchMode && selectedAgent === a.id
                      ? "#67e8f9"
                      : "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                  }}
                >👁 {a.agent_name}</button>
              ))
            )}
          </div>
        </div>

        {/* Player count */}
        <div>
          <label style={labelStyle}>TOTAL PLAYERS (2–6)</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 9,
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: playerCount === n ? "1.5px solid #e01b2d" : "1.5px solid rgba(255,255,255,0.12)",
                  background: playerCount === n ? "rgba(224,27,45,0.2)" : "rgba(255,255,255,0.04)",
                  color: playerCount === n ? "#fca5a5" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                }}
              >{n}</button>
            ))}
          </div>
        </div>

        {/* Bot types */}
        <div>
          <label style={labelStyle}>{watchMode ? "OTHER BOTS" : "BOT TYPES"}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bots.map((bt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", width: 50, flexShrink: 0 }}>Bot {i + 1}</span>
                {BOT_OPTIONS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => updateBot(i, type)}
                    style={{
                      fontFamily: "Inter,sans-serif",
                      fontSize: 11,
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: bt === type ? "1.5px solid #6366f1" : "1.5px solid rgba(255,255,255,0.1)",
                      background: bt === type ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                      color: bt === type ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                    }}
                  >{label}</button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Blinds + stack */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>SMALL BLIND</label>
            <input type="number" value={smallBlind} min={1} onChange={(e) => setSmallBlind(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>BIG BLIND</label>
            <input type="number" value={bigBlind} min={smallBlind * 2} onChange={(e) => setBigBlind(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>STARTING STACK</label>
            <input type="number" value={startingStack} min={bigBlind * 10} onChange={(e) => setStack(Number(e.target.value))} style={{ ...inputStyle, width: 100 }} />
          </div>
        </div>

        <button
          onClick={handleStart}
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 10,
            background: "linear-gradient(135deg, #e01b2d, #ef4444)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "14px 0",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(224,27,45,0.4)",
            marginTop: 4,
          }}
        >▶ START GAME</button>
      </div>
    </div>
  )
}

// ── Seat chip (player avatar on the table) ─────────────────────────────────

const SEAT_PLAYER_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#0ea5e9", "#a855f7"]

// Default human silhouette avatar — same for every player at the table.
// Color ring distinguishes players; the shape is always a person.
function PersonAvatar({ color, size = 46, isWinner, isToAct, isYou }) {
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      {/* Active-turn glow ring */}
      {isToAct && (
        <div style={{
          position: "absolute", inset: -7, borderRadius: "50%",
          border: "2px solid #fcd34d",
          boxShadow: "0 0 16px rgba(252,211,77,0.65)",
          animation: "livePulse 1s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      )}
      {/* Circular body */}
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(150deg, ${color}cc 0%, ${color}44 100%)`,
        border: `2.5px solid ${isWinner ? "#10b981" : isYou ? color : `${color}88`}`,
        boxShadow: isWinner
          ? "0 0 20px rgba(16,185,129,0.55)"
          : `0 0 12px ${color}55`,
        overflow: "hidden",
        transition: "all 0.3s",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}>
        {/* Human silhouette — head + shoulders */}
        <svg viewBox="0 0 46 46" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
          {/* Head */}
          <circle cx="23" cy="16" r="9" fill="rgba(255,255,255,0.90)" />
          {/* Shoulders / torso — wide ellipse rising from the bottom */}
          <ellipse cx="23" cy="46" rx="16" ry="13" fill="rgba(255,255,255,0.82)" />
        </svg>
      </div>
    </div>
  )
}

function SeatChip({ player, colorIdx, isYou, isYourAgent, agentLabel, showCards, lastAction, isWinner, isToAct }) {
  const color  = (isYou || isYourAgent) ? "#06b6d4" : SEAT_PLAYER_COLORS[colorIdx % SEAT_PLAYER_COLORS.length]
  const folded = player?.hasFolded
  const cards  = player?.holeCards ?? []

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: folded ? 0.38 : 1, transition: "all 0.3s" }}>

      {/* Mini cards — shown when hole cards are known */}
      {cards.length === 2 && (
        <div style={{ display: "flex", gap: 3, marginBottom: 2 }}>
          {showCards
            ? cards.map((c, i) => <CardFace key={i} card={c} size="sm" />)
            : [0, 1].map((i) => <CardBack key={i} size="sm" />)
          }
        </div>
      )}

      {/* Human avatar — same silhouette for everyone, color ring distinguishes players */}
      <PersonAvatar
        color={color}
        isWinner={isWinner}
        isToAct={isToAct}
        isYou={isYou || isYourAgent}
      />

      {/* Name + stack + last action box */}
      <div style={{
        background: "rgba(0,0,0,0.78)", borderRadius: 7, padding: "4px 8px",
        textAlign: "center", backdropFilter: "blur(8px)",
        border: `1px solid ${color}20`, minWidth: 82,
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 6,
          color: (isYou || isYourAgent) ? "#67e8f9" : "rgba(255,255,255,0.65)",
          marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {isYourAgent ? `YOU · ${agentLabel ?? "RMX"}` : isYou ? "YOU" : player.id}
        </div>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: isWinner ? "#10b981" : "#fcd34d" }}>
          {player.stack.toLocaleString()}
        </div>
        {lastAction && (
          <div style={{
            marginTop: 4, fontFamily: "Inter,sans-serif", fontSize: 10,
            color: "rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.07)", borderRadius: 4, padding: "2px 5px",
          }}>
            {lastAction}
          </div>
        )}
      </div>

      {isWinner && (
        <div style={{
          fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: "#10b981",
          background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.45)",
          borderRadius: 4, padding: "2px 7px",
        }}>WIN</div>
      )}
    </div>
  )
}

// ── Poker table view — all players seated around the felt ────────────────────

// Seat positions [left%, top%] for up to 5 bots, arranged in the top arc.
// Chips use transform:translate(-50%,0) so they hang DOWN from the anchor point.
const SEAT_LAYOUT = [
  [{ l: 50, t: 11 }],
  [{ l: 26, t: 13 }, { l: 74, t: 13 }],
  [{ l: 14, t: 21 }, { l: 50, t: 9  }, { l: 86, t: 21 }],
  [{ l: 9,  t: 28 }, { l: 33, t: 11 }, { l: 67, t: 11 }, { l: 91, t: 28 }],
  [{ l: 5,  t: 36 }, { l: 24, t: 13 }, { l: 50, t: 9  }, { l: 76, t: 13 }, { l: 95, t: 36 }],
]

function PokerTableView({ players, community, pot, isSpectating, agentLabel, lastActions, winnerIds, toActId }) {
  const yourId    = isSpectating ? "rmx-you" : "you"
  const youPlayer = players.find(p => p.id === yourId)
  const bots      = players.filter(p => p.id !== yourId)
  const n         = Math.min(5, bots.length)
  const positions = SEAT_LAYOUT[n - 1] ?? SEAT_LAYOUT[4]

  return (
    <div style={{ position: "relative", width: "100%", height: 520, flexShrink: 0 }}>

      {/* Felt ellipse */}
      <div style={{
        position: "absolute", left: "50%", top: "47%",
        transform: "translate(-50%, -50%)",
        width: "66%", height: 270,
        background: "radial-gradient(ellipse at center, #0a6b4a 0%, #065538 55%, #033020 100%)",
        borderRadius: "50%",
        border: "12px solid #4b5563",
        outline: "4px solid #374151",
        boxShadow: "0 8px 80px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.5)",
      }} />

      {/* Pot display */}
      <div style={{
        position: "absolute", left: "50%", top: "30%",
        transform: "translateX(-50%)", zIndex: 5,
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(0,0,0,0.65)", padding: "5px 16px", borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(6px)",
        whiteSpace: "nowrap",
      }}>
        <span style={{ fontSize: 14 }}>🪙</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: "#fcd34d" }}>
          POT: {pot.toLocaleString()}
        </span>
      </div>

      {/* Community cards */}
      <div style={{
        position: "absolute", left: "50%", top: "47%",
        transform: "translate(-50%, -50%)",
        zIndex: 5, display: "flex", gap: 8, alignItems: "center",
      }}>
        {[0, 1, 2, 3, 4].map(i => {
          const card = (community ?? [])[i]
          return card ? <CardFace key={i} card={card} /> : <CardSlot key={i} />
        })}
      </div>

      {/* Bot seat chips — positioned around the top arc */}
      {bots.slice(0, 5).map((bot, i) => {
        const pos = positions[i] ?? positions[positions.length - 1]
        return (
          <div key={bot.id} style={{
            position: "absolute",
            left: `${pos.l}%`, top: `${pos.t}%`,
            transform: "translate(-50%, 0)",
            zIndex: 6,
          }}>
            <SeatChip
              player={bot}
              colorIdx={i}
              isYourAgent={isSpectating && bot.id === "rmx-you"}
              agentLabel={agentLabel}
              showCards={isSpectating && bot.id === "rmx-you"}
              lastAction={lastActions[bot.id] ?? null}
              isWinner={winnerIds.has(bot.id)}
              isToAct={bot.id === toActId}
            />
          </div>
        )
      })}

      {/* Your seat chip — bottom center, hangs upward */}
      {youPlayer && (
        <div style={{
          position: "absolute",
          left: "50%", bottom: "2%",
          transform: "translate(-50%, 0)",
          zIndex: 6,
        }}>
          <SeatChip
            player={youPlayer}
            colorIdx={-1}
            isYou={!isSpectating}
            isYourAgent={isSpectating}
            agentLabel={agentLabel}
            showCards={isSpectating}
            lastAction={lastActions[yourId] ?? null}
            isWinner={winnerIds.has(yourId)}
            isToAct={yourId === toActId}
          />
        </div>
      )}
    </div>
  )
}

// ── Main screen ─────────────────────────────────────────────────────────────

export default function LivePokerScreen({ setScreen }) {
  const HUMAN_ID = "you"
  const [gameId,   setGameId]   = useState(null)
  const [config,   setConfig]   = useState(null)
  const [specs,    setSpecs]    = useState(null)
  const [snap,     setSnap]     = useState(null)
  const [log,      setLog]      = useState([])  // display log entries
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [handNum,  setHandNum]  = useState(0)
  const startingStack = useRef(1000)
  const [isSpectating, setIsSpectating] = useState(false)
  const [paused,       setPaused]       = useState(false)
  const [countdown,    setCountdown]    = useState(null)
  const [agentConfig,  setAgentConfig]  = useState(null)
  const [agentName,    setAgentName]    = useState(null)
  const [serverOnline, setServerOnline] = useState(null) // null = unknown, true/false after check

  // Build display log from snap.log
  function buildDisplayLog(rawLog, street) {
    const entries = []
    let lastStreet = null
    for (const e of rawLog) {
      if (e.street !== lastStreet) {
        entries.push({ type: "divider", text: `── ${e.street.toUpperCase()} ──` })
        lastStreet = e.street
      }
      const actionStr = e.amount ? `${e.action} ${e.amount}` : e.action
      entries.push({ type: e.playerId === HUMAN_ID ? "you" : "bot", text: `${e.playerId}: ${actionStr}` })
    }
    return entries
  }

  const API_TIMEOUT_MS = 15000

  // Check if game server is reachable (when in lobby)
  useEffect(() => {
    if (gameId) return
    let cancelled = false
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 5000)
    fetch(`${API}/health`, { signal: controller.signal })
      .then((r) => r.ok)
      .then((ok) => { if (!cancelled) setServerOnline(ok) })
      .catch(() => { if (!cancelled) setServerOnline(false) })
      .finally(() => clearTimeout(id))
    return () => { cancelled = true; controller.abort() }
  }, [gameId])

  async function apiPost(path, body = {}, options = {}) {
    const timeout = options.timeout ?? API_TIMEOUT_MS
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(id)
      const text = await res.text()
      let json = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch (_) {
        if (!res.ok) throw new Error("Game server returned an error. Is the correct server running on port 3001?")
      }
      if (!res.ok) throw new Error(json.error ?? "Server error")
      return json
    } catch (e) {
      clearTimeout(id)
      if (e.name === "AbortError") throw new Error("Game server took too long to respond. Is it running?")
      if (e.message === "Failed to fetch" || e.message?.includes("NetworkError")) throw new Error("Cannot reach game server. Start it with: cd poker/server && npm run dev")
      throw e
    }
  }

  // ── Create game from lobby settings ──────────────────────────────────────

  async function handleLobbyStart({ playerCount, smallBlind, bigBlind, startingStack: stack, botTypes, watchMode, agentConfig: cfg, agentName: aName }) {
    setLoading(true)
    setError(null)
    try {
      startingStack.current = stack
      setIsSpectating(watchMode)
      setAgentConfig(cfg ?? null)
      setAgentName(aName ?? null)

      if (watchMode && cfg) {
        console.log(
          `%c🤖 Agent: ${aName}`,
          "color: #06b6d4; font-weight: bold; font-size: 14px;"
        )
        console.log("Strategy config:", {
          base_style:      cfg.base_style,
          aggression:      cfg.aggression,
          bluff_frequency: cfg.bluff_frequency,
          risk_tolerance:  cfg.risk_tolerance,
          looseness:       cfg.looseness,
        })
      }
      setPaused(false)
      // If watchMode with a user agent config: type "human" so server waits for client action.
      // If watchMode with RM7X (no agentConfig): type "rmx", server handles it automatically.
      const agentSeatType = (watchMode && cfg) ? "human" : "rmx"
      const players = watchMode
        ? [
            { id: "rmx-you", type: agentSeatType, startingStack: stack },
            ...botTypes.map((type, i) => ({ id: `Bot ${i + 1}`, type, startingStack: stack })),
          ]
        : [
            { id: HUMAN_ID, type: "human", startingStack: stack },
            ...botTypes.map((type, i) => ({ id: `Bot ${i + 1}`, type, startingStack: stack })),
          ]
      const gameConfig = { smallBlind, bigBlind }
      const data = await apiPost("/game", { players, config: gameConfig })
      setGameId(data.gameId)
      setConfig(gameConfig)
      setSpecs(players)
      setLog([{ type: "dealer", text: watchMode ? "Game created — spectator mode, auto-dealing…" : "Game created — click Deal to start!" }])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Start / deal next hand ────────────────────────────────────────────────

  const dealHand = useCallback(async (gid) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiPost(`/game/${gid}/start-hand`)
      setSnap(data)
      setHandNum((n) => n + 1)
      const entries = [
        { type: "divider", text: `── HAND ${handNum + 1} ──` },
        ...buildDisplayLog(data.log, data.state?.street),
      ]
      setLog((prev) => [...prev, ...entries])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [handNum])

  // ── Human action ──────────────────────────────────────────────────────────

  async function handleAction(action) {
    if (!gameId || loading) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiPost(`/game/${gameId}/action`, action)
      setSnap(data)
      // Append new log entries
      const newEntries = buildDisplayLog(data.log, data.state?.street)
      // Append fresh entries that aren't already shown (compare length)
      setLog((prev) => {
        // Rebuild from full log each time (simplest, avoids duplication)
        const base = prev.filter((e) => e.type === "divider" && e.text.startsWith("── HAND"))
        const handHeaders = base
        // Keep hand headers, replace the last hand's body
        const lastHandHeader = [...prev].reverse().findIndex((e) => e.type === "divider" && e.text.startsWith("── HAND"))
        const cut = lastHandHeader === -1 ? 0 : prev.length - lastHandHeader - 1
        const preserved = prev.slice(0, prev.length - cut)
        return [...preserved, ...buildDisplayLog(data.log, data.state?.street)]
      })
      if (data.handOver && data.winners?.length) {
        const winText = data.winners.map((w) => `🏆 ${w.playerId} wins ${w.potAmount}`).join("  ")
        setLog((prev) => [...prev, { type: "winner", text: winText }])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Auto-act: fire when it's the user agent's turn ───────────────────────
  useEffect(() => {
    if (!isSpectating || !agentConfig || !snap?.isHumanTurn || snap?.handOver || loading) return
    // Simulate a short "thinking" delay (0.8 – 1.5 s)
    const delay = 800 + Math.random() * 700
    const timer = setTimeout(() => {
      const action = computeAgentAction(snap.legalActions, agentConfig)
      handleAction(action)
    }, delay)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap?.isHumanTurn, snap?.handOver, isSpectating, agentConfig, loading])

  // ── Spectator auto-deal effect ────────────────────────────────────────────
  // Depends on `snap` (object reference) so it re-fires every time new hand
  // data arrives — even when both old and new snaps have handOver=true.
  const handOver = snap?.handOver ?? false
  useEffect(() => {
    if (!isSpectating || !gameId || paused || loading) return
    if (!snap) {
      // First hand: deal immediately
      dealHand(gameId)
      return
    }
    if (snap.handOver) {
      // Start countdown from 2.5 and deal when it hits 0
      const DELAY = 2500
      const TICK  = 100
      let remaining = DELAY
      setCountdown(remaining / 1000)
      const interval = setInterval(() => {
        remaining -= TICK
        setCountdown(Math.max(0, remaining / 1000))
        if (remaining <= 0) {
          clearInterval(interval)
          setCountdown(null)
          dealHand(gameId)
        }
      }, TICK)
      return () => { clearInterval(interval); setCountdown(null) }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, isSpectating, gameId, paused, loading])

  // ── Lobby screen ──────────────────────────────────────────────────────────

  if (!gameId) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff" }}>
        <div style={{ padding: "12px 20px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setScreen("home")} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>← Back</button>
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "#e01b2d" }}>LIVE POKER</span>
          {error && <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#f87171", marginLeft: 12 }}>{error}</span>}
        </div>
        {loading
          ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", gap: 16, fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            <div>Connecting to server…</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>If this hangs, start the server: cd poker/server && npm run dev</div>
          </div>
          : <Lobby onStart={handleLobbyStart} serverOnline={serverOnline} />
        }
      </div>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────

  const state    = snap?.state
  const players  = state?.players ?? []
  const humanP   = players.find((p) => p.id === HUMAN_ID)
  const botPlayers = isSpectating ? players : players.filter((p) => p.id !== HUMAN_ID)
  const community  = state?.communityCards ?? []
  const pot        = calcPot(state)
  const isMyTurn   = snap?.isHumanTurn && !snap?.handOver
  // handOver is already declared above (used in effects)

  // Figure out last action per player (all players, including human)
  const lastActions = {}
  const rawLog = snap?.log ?? []
  for (const e of rawLog) {
    lastActions[e.playerId] = e.amount ? `${e.action} ${e.amount}` : e.action
  }

  // Winner set
  const winnerIds = new Set((snap?.winners ?? []).map((w) => w.playerId))

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", display: "flex", flexDirection: "column" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "10px 20px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => setScreen("home")} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>← Exit</button>

        {/* LIVE dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(224,27,45,0.15)", border: "1px solid rgba(224,27,45,0.4)", borderRadius: 6, padding: "4px 10px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e01b2d", animation: "livePulse 1s ease-in-out infinite", boxShadow: "0 0 6px #e01b2d" }} />
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#e01b2d" }}>LIVE</span>
        </div>

        {/* SPECTATING badge */}
        {isSpectating && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.5)", borderRadius: 6, padding: "4px 12px" }}>
            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#67e8f9" }}>👁 SPECTATING</span>
            <button
              onClick={() => setPaused((p) => !p)}
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, background: paused ? "rgba(6,182,212,0.3)" : "rgba(0,0,0,0.3)", color: paused ? "#67e8f9" : "rgba(255,255,255,0.5)", border: "1px solid rgba(6,182,212,0.4)", borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}
            >{paused ? "▶ Resume" : "⏸ Pause"}</button>
          </div>
        )}

        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "#fff", background: "rgba(255,255,255,0.06)", padding: "5px 12px", borderRadius: 6 }}>
          HAND {handNum}
        </div>

        {/* Street badge */}
        {state && (
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", padding: "5px 10px", borderRadius: 6 }}>
            {state.street?.toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Stacks overview */}
        {snap?.stacks && Object.entries(snap.stacks).map(([id, amt]) => (
          <div key={id} style={{ fontFamily: "Inter,sans-serif", fontSize: 11,
            color: (isSpectating ? id === "rmx-you" : id === HUMAN_ID) ? "#fcd34d" : "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 6 }}>
            {id}: {amt.toLocaleString()}
          </div>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Centre: poker table + controls */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* All players seated around the table */}
          <PokerTableView
            players={players}
            community={community}
            pot={pot}
            isSpectating={isSpectating}
            agentLabel={agentName ?? "RMX"}
            lastActions={lastActions}
            winnerIds={winnerIds}
            toActId={state && !handOver ? state.players[state.toActIndex]?.id : null}
          />

          {/* Controls below the table */}
          <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

            {/* Winners banner */}
            {handOver && snap?.winners && (
              <WinnersBanner
                winners={snap.winners}
                onNextHand={isSpectating ? null : () => dealHand(gameId)}
                yourId={isSpectating ? "rmx-you" : HUMAN_ID}
                agentLabel={agentName}
              />
            )}

            {/* Your hole cards — large display in human mode */}
            {!isSpectating && humanP && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>YOUR HAND</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {humanP.holeCards?.length === 2
                    ? humanP.holeCards.map((c, i) => <CardFace key={i} card={c} size="lg" />)
                    : [0, 1].map((i) => <CardSlot key={i} size="lg" />)
                  }
                </div>
                {humanP.hasFolded && <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#ef4444" }}>FOLDED</div>}
                {humanP.isAllIn  && <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "#f59e0b" }}>ALL-IN</div>}
                {humanP.betThisStreet > 0 && !handOver && (
                  <div style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    Bet this street: {humanP.betThisStreet}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons / deal button / spectator countdown */}
            {isSpectating ? (
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "rgba(6,182,212,0.7)", textAlign: "center" }}>
                {loading
                  ? "Dealing…"
                  : handOver
                    ? paused
                      ? "⏸ Paused"
                      : (
                        <span>
                          Next hand in{" "}
                          <span style={{ color: "#67e8f9", fontVariantNumeric: "tabular-nums" }}>
                            {countdown !== null ? countdown.toFixed(1) : "0.0"}
                          </span>
                          s
                        </span>
                      )
                    : "Watching agents play…"
                }
              </div>
            ) : !state ? (
              <button
                onClick={() => dealHand(gameId)}
                disabled={loading}
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, background: "linear-gradient(135deg, #e01b2d, #ef4444)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 0 20px rgba(224,27,45,0.4)" }}
              >
                {loading ? "Dealing…" : "🃏 Deal Hand"}
              </button>
            ) : isMyTurn ? (
              <div style={{ width: "100%", maxWidth: 520 }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "#fcd34d", marginBottom: 10, textAlign: "center" }}>YOUR TURN</div>
                <ActionButtons legalActions={snap?.legalActions} onAction={handleAction} disabled={loading} />
              </div>
            ) : handOver ? null : (
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                {loading ? "Processing…" : "Waiting for bots…"}
              </div>
            )}

            {error && (
              <div style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 16px", maxWidth: 420, textAlign: "center" }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right: action log */}
        <div style={{ width: 240, padding: "16px 12px", borderLeft: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 10, letterSpacing: 1 }}>ACTION LOG</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ActionLog entries={log} />
          </div>
        </div>
      </div>
    </div>
  )
}
