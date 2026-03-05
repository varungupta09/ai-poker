/*
  poker/agent.ts
  Agent interface + built-in test agents.

  An Agent is anything that implements decide().
  The engine never calls anything else on an agent.
*/

import { Action, ActionType, GameState } from "./gameTypes"
import { getLegalActions, LegalActions } from "./gameState"

// ── Public observation ────────────────────────────────────────────────────────
// What an agent actually sees: the full GameState but with all OTHER players'
// hole cards blanked out (hidden-info filter).
export function getPublicState(state: GameState, forPlayerId: string): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === forPlayerId ? p : { ...p, holeCards: [] },
    ),
  }
}

// ── Agent interface ───────────────────────────────────────────────────────────
export interface Agent {
  readonly id: string
  /**
   * Called once per turn.
   * @param observation  GameState with other players' hole cards hidden.
   * @param legal        Pre-computed legal actions + amount ranges.
   * @returns            The action this agent wants to take.
   */
  decide(observation: GameState, legal: LegalActions): Action
}

// ── CallAgent ─────────────────────────────────────────────────────────────────
// Always calls (or checks if free). Never folds, never raises.
export class CallAgent implements Agent {
  constructor(public readonly id: string) {}

  decide(_obs: GameState, legal: LegalActions): Action {
    if (legal.actions.includes(ActionType.Check)) return { type: ActionType.Check }
    if (legal.actions.includes(ActionType.Call))  return { type: ActionType.Call }
    return { type: ActionType.Fold }
  }
}

// ── FoldAgent ─────────────────────────────────────────────────────────────────
// Always folds unless checking is free.
export class FoldAgent implements Agent {
  constructor(public readonly id: string) {}

  decide(_obs: GameState, legal: LegalActions): Action {
    if (legal.actions.includes(ActionType.Check)) return { type: ActionType.Check }
    return { type: ActionType.Fold }
  }
}

// ── RandomAgent ───────────────────────────────────────────────────────────────
// Picks a uniformly random legal action.
// For Bet/Raise picks a random amount between min and max (capped to all-in).
export class RandomAgent implements Agent {
  constructor(public readonly id: string) {}

  decide(_obs: GameState, legal: LegalActions): Action {
    const pick = legal.actions[Math.floor(Math.random() * legal.actions.length)]

    if (pick === ActionType.Bet || pick === ActionType.Raise) {
      const min = legal.minBetOrRaise
      const max = legal.maxBetOrRaise
      // Random integer between min and max inclusive
      const amount = min + Math.floor(Math.random() * (max - min + 1))
      return { type: pick, amount }
    }

    return { type: pick }
  }
}
