/*
  poker/betting.ts
  Pure betting math for No-Limit Texas Hold'em.
  No state mutation — all functions take values and return values.
*/

import { PlayerState, Pot } from "./gameTypes"

// ── Call amount ────────────────────────────────────────────────────────────────
// How many MORE chips does this player need to put in to call?
// Capped at their remaining stack (all-in call).
export function callAmount(player: PlayerState, currentBet: number): number {
  const owed = currentBet - player.betThisStreet
  return Math.min(owed, player.stack)
}

// ── Min raise-to ──────────────────────────────────────────────────────────────
// In NLHE the minimum raise is: currentBet + lastRaiseSize.
// lastRaiseSize is tracked externally (stored in GameState.minRaiseTo already
// encodes the full raise-to, so we just expose it here for clarity).
// Returns the minimum total amount the current player must raise TO.
export function minRaiseTo(currentBet: number, lastRaiseSize: number): number {
  return currentBet + lastRaiseSize
}

// ── Max raise-to (no-limit) ───────────────────────────────────────────────────
// A player can raise to at most their full stack + whatever they already put in.
export function maxRaiseTo(player: PlayerState): number {
  return player.stack + player.betThisStreet
}

// ── Does an all-in re-open action? ────────────────────────────────────────────
// Standard NLHE rule: an all-in that is LESS than a full raise does NOT reopen
// the action to players who have already acted this street.
// An all-in >= a full raise DOES reopen action.
export function allInReopensAction(
  allInAmountTo: number,  // the total all-in raise-to amount
  currentBet: number,
  lastRaiseSize: number,
): boolean {
  const fullRaiseTo = currentBet + lastRaiseSize
  return allInAmountTo >= fullRaiseTo
}

// ── Side-pot builder ──────────────────────────────────────────────────────────
// Given final committed totals per player (across the entire hand), builds the
// correct set of pots with proper eligibility.
//
// totalCommitted: map of playerId -> total chips put in over the whole hand
// foldedIds: set of playerIds who folded (they contribute to pots but can't win)
//
// Returns an array of Pot objects ordered main-pot first.
export function buildPots(
  totalCommitted: Map<string, number>,
  foldedIds: Set<string>,
): Pot[] {
  // Work with a mutable copy
  const remaining = new Map(totalCommitted)
  const pots: Pot[] = []

  while (true) {
    // Find smallest non-zero commitment
    let minCommit = Infinity
    for (const [, amount] of remaining) {
      if (amount > 0 && amount < minCommit) minCommit = amount
    }
    if (!isFinite(minCommit)) break

    // All players contribute up to minCommit to this pot level
    let potAmount = 0
    const eligible: string[] = []

    for (const [id, amount] of remaining) {
      const contrib = Math.min(amount, minCommit)
      potAmount += contrib
      remaining.set(id, amount - contrib)
      if (!foldedIds.has(id) && amount > 0) {
        eligible.push(id)
      }
    }

    // Remove players no longer contributing
    for (const [id, amount] of remaining) {
      if (amount === 0) remaining.delete(id)
    }

    if (potAmount > 0) {
      pots.push({ amount: potAmount, eligiblePlayerIds: eligible })
    }
  }

  return pots
}
