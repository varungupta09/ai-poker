/*
  poker/server/gameManager.ts

  Manages interactive game sessions where a human player competes against
  AI agents (CallAgent, FoldAgent, RandomAgent).

  Session lifecycle:
    createGame → startHand → [applyHumanAction →]* startHand → ...

  After each human action, agent turns are automatically resolved until
  it is the human's turn again or the hand ends.
*/

import { v4 as uuidv4 } from "uuid"
import { Agent, CallAgent, FoldAgent, RandomAgent, getPublicState } from "../agent"
import { RmxAgent } from "../../dev_agents/rm/rmx"
import {
  applyAction,
  getLegalActions,
  initHand,
  isHandOver,
  LegalActions,
  maybeAdvanceStreet,
} from "../gameState"
import { Action, ActionType, GameState, TableConfig, WinnerResult } from "../gameTypes"

// ── Player / Agent types ──────────────────────────────────────────────────────

export type AgentType = "call" | "fold" | "random" | "rmx"
export type PlayerType = "human" | AgentType

export interface PlayerSpec {
  /** Unique identifier — also used as the in-game player id */
  id: string
  type: PlayerType
  /** Starting stack (also used for auto-rebuy if a player busts) */
  startingStack: number
}

// ── Action log entry (per-hand) ───────────────────────────────────────────────

export interface ActionLogEntry {
  street: string
  playerId: string
  action: string
  amount?: number
}

// ── Session ───────────────────────────────────────────────────────────────────

export interface GameSession {
  id: string
  config: TableConfig
  specs: PlayerSpec[]
  /** AI agents keyed by player id (human players have no entry here) */
  agents: Map<string, Agent>
  /** null when the game has no human player (full auto-play mode) */
  humanId: string | null
  state: GameState | null
  dealerIndex: number
  handNumber: number
  /** Persistent chip counts across hands */
  stacks: Map<string, number>
  log: ActionLogEntry[]
  handOver: boolean
}

// ── Public snapshot returned by all endpoints ─────────────────────────────────

export interface RoundSnapshot {
  /** Current game state (hole cards of other players are hidden for the human) */
  state: GameState | null
  /** Pre-computed legal actions for the human (null when it's not their turn) */
  legalActions: LegalActions | null
  isHumanTurn: boolean
  handOver: boolean
  log: ActionLogEntry[]
  /** Populated only when handOver === true */
  winners: WinnerResult[] | null
  /** Current chip counts across all seats */
  stacks: Record<string, number>
}

// ── In-memory store ───────────────────────────────────────────────────────────

const sessions = new Map<string, GameSession>()

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAgent(id: string, type: AgentType): Agent {
  switch (type) {
    case "call":   return new CallAgent(id)
    case "fold":   return new FoldAgent(id)
    case "random": return new RandomAgent(id)
    case "rmx":    return new RmxAgent(id)
  }
}

function buildSnapshot(session: GameSession): RoundSnapshot {
  const { state, humanId, log, handOver, stacks } = session

  if (!state) {
    return {
      state: null,
      legalActions: null,
      isHumanTurn: false,
      handOver: false,
      log,
      winners: null,
      stacks: Object.fromEntries(stacks),
    }
  }

  // Filter hole cards so the human only sees their own
  const filteredState = humanId ? getPublicState(state, humanId) : state

  const isOver = handOver || isHandOver(state)
  const isHumanTurn =
    !isOver &&
    humanId !== null &&
    state.players[state.toActIndex]?.id === humanId

  // During a hand show real-time chips; after the hand show finalised stacks
  const stacksObj: Record<string, number> = {}
  if (isOver) {
    for (const [id, amt] of stacks) stacksObj[id] = amt
  } else {
    for (const p of state.players) stacksObj[p.id] = p.stack
  }

  return {
    state: filteredState,
    legalActions: isHumanTurn ? getLegalActions(state) : null,
    isHumanTurn,
    handOver: isOver,
    log,
    winners: isOver ? (state.winners ?? null) : null,
    stacks: stacksObj,
  }
}

/**
 * Continuously resolves agent turns until it is the human's turn or the hand ends.
 * Safe to call even when no agents remain (no-op).
 */
function runAgents(session: GameSession): void {
  const { agents, humanId } = session
  const MAX_ITERS = 500
  let iters = 0

  while (session.state && !isHandOver(session.state)) {
    // Advance street if the current betting round is finished
    const advanced = maybeAdvanceStreet(session.state)
    if (advanced !== session.state) {
      session.state = advanced
      continue
    }

    if (isHandOver(session.state)) break

    const toActId = session.state.players[session.state.toActIndex]?.id

    // Stop when it's the human's turn
    if (toActId === humanId) break

    const agent = agents.get(toActId)
    if (!agent) {
      // Should never happen — defensive break
      break
    }

    const legal = getLegalActions(session.state)
    if (legal.actions.length === 0) {
      // Player can't act; advance the street
      session.state = maybeAdvanceStreet(session.state)
      continue
    }

    const obs = getPublicState(session.state, toActId)
    const action = agent.decide(obs, legal)

    session.log.push({
      street: session.state.street,
      playerId: toActId,
      action: action.type,
      amount: action.amount,
    })

    session.state = applyAction(session.state, action)
    session.state = maybeAdvanceStreet(session.state)

    if (++iters > MAX_ITERS) {
      throw new Error("Agent loop exceeded iteration limit — possible engine bug")
    }
  }

  // Final street advance in case the last action closed the hand
  if (session.state && !isHandOver(session.state)) {
    session.state = maybeAdvanceStreet(session.state)
  }

  if (session.state && isHandOver(session.state)) {
    session.handOver = true
    syncStacksAfterHand(session)
  }
}

/**
 * After a hand ends, sync each player's chip count from the final game state
 * (bets already deducted) and then credit pot winnings.
 */
function syncStacksAfterHand(session: GameSession): void {
  if (!session.state) return

  // The state player.stack already reflects chips after all bets are deducted
  for (const p of session.state.players) {
    session.stacks.set(p.id, p.stack)
  }

  // Add pot winnings
  for (const w of session.state.winners ?? []) {
    const current = session.stacks.get(w.playerId) ?? 0
    session.stacks.set(w.playerId, current + w.potAmount)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Create a new game session. */
export function createGame(specs: PlayerSpec[], config: TableConfig): GameSession {
  if (specs.length < 2 || specs.length > 6) {
    throw new Error("A game requires 2–6 players")
  }

  const humanSpecs = specs.filter((s) => s.type === "human")
  if (humanSpecs.length > 1) {
    throw new Error("At most one human player is supported per game")
  }

  const id = uuidv4()

  const agents = new Map<string, Agent>()
  for (const spec of specs) {
    if (spec.type !== "human") {
      agents.set(spec.id, makeAgent(spec.id, spec.type as AgentType))
    }
  }

  const stacks = new Map<string, number>()
  for (const spec of specs) {
    stacks.set(spec.id, spec.startingStack)
  }

  const session: GameSession = {
    id,
    config,
    specs,
    agents,
    humanId: humanSpecs[0]?.id ?? null,
    state: null,
    dealerIndex: 0,
    handNumber: 0,
    stacks,
    log: [],
    handOver: false,
  }

  sessions.set(id, session)
  return session
}

/** Retrieve an existing session by id. */
export function getGame(id: string): GameSession | undefined {
  return sessions.get(id)
}

/**
 * Deal a new hand. Rotates the dealer button, resets hand-level state,
 * auto-rebuys busted players, and runs agents until the human must act.
 */
export function startHand(session: GameSession): RoundSnapshot {
  const n = session.specs.length

  // Rotate dealer after the first hand
  if (session.handNumber > 0) {
    session.dealerIndex = (session.dealerIndex + 1) % n
  }

  session.handNumber++
  session.log = []
  session.handOver = false

  // Build seat list from persistent stacks; auto-rebuy busted players
  const minPlayable = session.config.bigBlind * 2
  const seats = session.specs.map((spec) => {
    let stack = session.stacks.get(spec.id) ?? spec.startingStack
    if (stack < minPlayable) {
      stack = spec.startingStack
    }
    session.stacks.set(spec.id, stack)
    return { id: spec.id, stack }
  })

  session.state = initHand(seats, session.dealerIndex, session.config)

  // Let agents take their turns until the human needs to act (or hand ends)
  runAgents(session)

  return buildSnapshot(session)
}

/**
 * Apply the human player's action, then let agents respond until it is the
 * human's turn again or the hand ends.
 */
export function applyHumanAction(session: GameSession, action: Action): RoundSnapshot {
  if (!session.state) {
    throw new Error("No active hand — call POST /game/:id/start-hand first")
  }
  if (session.handOver || isHandOver(session.state)) {
    throw new Error("The hand has already ended — start a new hand")
  }

  const toActId = session.state.players[session.state.toActIndex]?.id

  // If there is a human player, enforce it's their turn
  if (session.humanId !== null && toActId !== session.humanId) {
    throw new Error("It is not the human player's turn")
  }

  const legal = getLegalActions(session.state)
  if (!legal.actions.includes(action.type)) {
    throw new Error(
      `Illegal action "${action.type}". Legal actions: ${legal.actions.join(", ")}`,
    )
  }

  session.log.push({
    street: session.state.street,
    playerId: toActId,
    action: action.type,
    amount: action.amount,
  })

  session.state = applyAction(session.state, action)
  session.state = maybeAdvanceStreet(session.state)

  // Let agents respond
  runAgents(session)

  return buildSnapshot(session)
}

/** Return the current snapshot without modifying state. */
export function getSnapshot(session: GameSession): RoundSnapshot {
  return buildSnapshot(session)
}
