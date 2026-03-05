/*
  poker/runHand.ts
  Runs one complete No-Limit Texas Hold'em hand end-to-end.

  Usage:
    const result = runHand(agents, { dealerIndex: 0, config: { smallBlind: 50, bigBlind: 100 } })
*/

import { GameState, WinnerResult } from "./gameTypes"
import {
  initHand,
  getLegalActions,
  applyAction,
  maybeAdvanceStreet,
  isHandOver,
} from "./gameState"
import { Agent, getPublicState } from "./agent"
import { TableConfig } from "./gameTypes"

export interface HandConfig {
  dealerIndex: number
  config: TableConfig
}

export interface HandResult {
  /** Final GameState (street === Showdown) */
  finalState: GameState
  /** Who won what from which pot */
  winners: WinnerResult[]
  /** Full action log — useful for replay and debugging */
  log: ActionLogEntry[]
}

export interface ActionLogEntry {
  street: string
  playerId: string
  action: string
  amount?: number
}

// ── runHand ───────────────────────────────────────────────────────────────────
// Drives a complete hand from deal to showdown.
// Throws if any agent returns an illegal action (bug in agent).
export function runHand(agents: Agent[], handConfig: HandConfig): HandResult {
  if (agents.length < 2 || agents.length > 6) {
    throw new Error(`runHand requires 2-6 agents, got ${agents.length}`)
  }

  const seats = agents.map((a) => {
    const stack = getAgentStack(a)
    return { id: a.id, stack }
  })

  let state: GameState = initHand(seats, handConfig.dealerIndex, handConfig.config)
  const log: ActionLogEntry[] = []

  // Safety valve: max actions per hand = players × streets × raises
  const maxActions = agents.length * 4 * 20
  let actionCount = 0

  while (!isHandOver(state)) {
    // Auto-advance if the betting round is already complete
    // (e.g. all players all-in — deal remaining streets automatically)
    const advanced = maybeAdvanceStreet(state)
    if (advanced !== state) {
      state = advanced
      continue
    }

    if (isHandOver(state)) break

    const actingPlayer = state.players[state.toActIndex]
    const agent = agents.find((a) => a.id === actingPlayer.id)
    if (!agent) throw new Error(`No agent found for player id "${actingPlayer.id}"`)

    const legal = getLegalActions(state)
    if (legal.actions.length === 0) {
      // This player can't act (all-in / folded) — advance will handle it
      state = maybeAdvanceStreet(state)
      continue
    }

    const observation = getPublicState(state, actingPlayer.id)
    const action = agent.decide(observation, legal)

    log.push({
      street: state.street,
      playerId: actingPlayer.id,
      action: action.type,
      amount: action.amount,
    })

    state = applyAction(state, action)
    state = maybeAdvanceStreet(state)

    if (++actionCount > maxActions) {
      throw new Error(`runHand exceeded ${maxActions} actions — possible infinite loop`)
    }
  }

  const winners = state.winners ?? []

  // Sync agent stacks from the final game state (reflects all bets deducted),
  // then add winnings on top. This is the only correct way to track chips:
  // stackMap was never decremented during play, so we must replace it here.
  for (const agent of agents) {
    const player = state.players.find((p) => p.id === agent.id)
    if (player) setAgentStack(agent, player.stack)
  }
  for (const w of winners) {
    const agent = agents.find((a) => a.id === w.playerId)
    if (agent) addToAgentStack(agent, w.potAmount)
  }

  return { finalState: state, winners, log }
}

// ── Stack tracking ─────────────────────────────────────────────────────────────
// Agents carry their own stack so runHand can rotate hands without re-seating.
// We store it on the agent object directly (simple, no external map needed).

const stackMap = new WeakMap<Agent, number>()

export function setAgentStack(agent: Agent, amount: number): void {
  stackMap.set(agent, amount)
}

export function getAgentStack(agent: Agent): number {
  const s = stackMap.get(agent)
  if (s === undefined) throw new Error(`Agent "${agent.id}" has no stack set. Call setAgentStack() first.`)
  return s
}

export function addToAgentStack(agent: Agent, amount: number): void {
  stackMap.set(agent, (stackMap.get(agent) ?? 0) + amount)
}

// ── deductBlindFromAgent ──────────────────────────────────────────────────────
// initHand deducts blinds from seat stacks, so we need the agent stack to
// already reflect buy-in. runHand reads stacks at the start of each hand
// from the agent's tracked stack, which already has prior winnings/losses
// reflected by the credit-back above.
//
// For the first hand of a session, call setAgentStack(agent, buyIn) before runHand.
