/*
  poker/gameState.ts
  Pure functions for No-Limit Texas Hold'em hand lifecycle.

  Every function takes a GameState and returns a NEW GameState (or a result).
  Nothing is ever mutated in place — safe for agent self-play, replay logs, and tests.

  Call order per hand:
    initHand → loop { getLegalActions → applyAction → maybeAdvanceStreet } → resolveShowdown
*/

import { HandRank, Card } from "./types"
import { newShuffledDeck, drawCards } from "./deck"
import { evaluate7, compareHands } from "./handEvaluator"
import { callAmount, minRaiseTo, maxRaiseTo, allInReopensAction, buildPots } from "./betting"
import {
  Action,
  ActionType,
  GameState,
  PlayerState,
  Pot,
  Street,
  TableConfig,
  WinnerResult,
} from "./gameTypes"

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextSeatIndex(current: number, total: number): number {
  return (current + 1) % total
}

// Returns the next seat (wrapping) that hasn't folded and isn't all-in.
// Returns null if no such player exists (hand is effectively over).
function nextActiveIndex(
  from: number,
  players: PlayerState[],
  stopBefore: number | null = null, // stop if we loop all the way around
): number | null {
  const n = players.length
  let idx = nextSeatIndex(from, n)
  let steps = 0
  while (steps < n) {
    if (idx === stopBefore) return null
    const p = players[idx]
    if (!p.hasFolded && !p.isAllIn) return idx
    idx = nextSeatIndex(idx, n)
    steps++
  }
  return null
}

// Number of players who haven't folded.
function activePlayers(players: PlayerState[]): PlayerState[] {
  return players.filter((p) => !p.hasFolded)
}

// Players who can still act (not folded, not all-in).
function actionablePlayers(players: PlayerState[]): PlayerState[] {
  return players.filter((p) => !p.hasFolded && !p.isAllIn)
}

// Deep-clone a GameState so we never mutate the original.
function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState
}

// Reconstruct a hand-rank label for WinnerResult description.
function handRankLabel(rank: HandRank): string {
  const labels: Record<HandRank, string> = {
    [HandRank.HighCard]:       "High Card",
    [HandRank.OnePair]:        "One Pair",
    [HandRank.TwoPair]:        "Two Pair",
    [HandRank.ThreeOfAKind]:   "Three of a Kind",
    [HandRank.Straight]:       "Straight",
    [HandRank.Flush]:          "Flush",
    [HandRank.FullHouse]:      "Full House",
    [HandRank.FourOfAKind]:    "Four of a Kind",
    [HandRank.StraightFlush]:  "Straight Flush",
  }
  return labels[rank]
}

// ── initHand ──────────────────────────────────────────────────────────────────
// Builds the initial GameState for a new hand.
//
// seats: ordered array of { id, stack } — seat order is preserved as-is.
// dealerIndex: which seat is the button this hand.
// config: table config (blinds etc.)
//
// Side effects: shuffles a new deck, deals 2 hole cards per player, posts blinds.
export function initHand(
  seats: Array<{ id: string; stack: number }>,
  dealerIndex: number,
  config: TableConfig,
): GameState {
  if (seats.length < 2) throw new Error("Need at least 2 players")

  const n = seats.length

  // Build initial PlayerState for each seat
  const players: PlayerState[] = seats.map((s, i) => ({
    id: s.id,
    seatIndex: i,
    stack: s.stack,
    holeCards: [],
    betThisStreet: 0,
    hasFolded: false,
    isAllIn: false,
  }))

  // Determine blind positions
  // Heads-up (2 players): dealer posts SB, other posts BB
  const sbIndex = n === 2 ? dealerIndex : nextSeatIndex(dealerIndex, n)
  const bbIndex = nextSeatIndex(sbIndex, n)

  // Shuffle and deal
  const deck = newShuffledDeck()
  for (const p of players) {
    p.holeCards = drawCards(deck, 2)
  }

  // Post blinds
  const { smallBlind, bigBlind } = config

  function postBlind(player: PlayerState, amount: number): void {
    const actual = Math.min(amount, player.stack)
    player.stack -= actual
    player.betThisStreet = actual
    if (player.stack === 0) player.isAllIn = true
  }

  postBlind(players[sbIndex], smallBlind)
  postBlind(players[bbIndex], bigBlind)

  // First to act preflop: seat after BB
  const firstToAct = nextSeatIndex(bbIndex, n)

  // Initial min-raise is one big blind
  const initialMinRaiseTo = bigBlind * 2

  const initialPot: Pot = {
    amount: 0,
    eligiblePlayerIds: players.map((p) => p.id),
  }

  return {
    config,
    players,
    dealerIndex,
    sbIndex,
    bbIndex,
    toActIndex: firstToAct,
    currentBet: bigBlind,
    minRaiseTo: initialMinRaiseTo,
    lastAggressorIndex: bbIndex,
    numActionsThisStreet: 0,
    // All players (including BB who gets option) must act at least once preflop
    actionsToClose: players.filter((p) => !p.hasFolded && !p.isAllIn).length,
    street: Street.Preflop,
    communityCards: [],
    deck,
    pots: [initialPot],
    winners: null,
  }
}

// ── getLegalActions ────────────────────────────────────────────────────────────
// Returns what the current player is allowed to do (and the valid amount range
// for Bet/Raise).
export interface LegalActions {
  actions: ActionType[]
  callAmount: number     // chips needed to call (0 if check is available)
  minBetOrRaise: number  // minimum total bet-to / raise-to amount
  maxBetOrRaise: number  // maximum (player's stack + already committed)
}

export function getLegalActions(state: GameState): LegalActions {
  const player = state.players[state.toActIndex]

  if (player.hasFolded || player.isAllIn || state.street === Street.Showdown) {
    return { actions: [], callAmount: 0, minBetOrRaise: 0, maxBetOrRaise: 0 }
  }

  const toCall = callAmount(player, state.currentBet)
  const canCheck = toCall === 0
  const canCall = toCall > 0
  const maxBet = maxRaiseTo(player)

  const legalActions: ActionType[] = [ActionType.Fold]

  if (canCheck) {
    legalActions.push(ActionType.Check)
  } else {
    legalActions.push(ActionType.Call)
  }

  // Bet is only available if no bet exists yet this street
  if (state.currentBet === 0 && maxBet > 0) {
    legalActions.push(ActionType.Bet)
  }

  // Raise is only available if there's already a bet to raise
  if (state.currentBet > 0 && maxBet > state.currentBet) {
    legalActions.push(ActionType.Raise)
  }

  const minBet = state.currentBet === 0
    ? state.config.bigBlind           // minimum bet is 1 BB
    : minRaiseTo(state.currentBet, state.minRaiseTo - state.currentBet)

  return {
    actions: legalActions,
    callAmount: toCall,
    minBetOrRaise: Math.min(minBet, maxBet), // cap at stack (all-in)
    maxBetOrRaise: maxBet,
  }
}

// ── applyAction ───────────────────────────────────────────────────────────────
// Returns a new GameState after the current player performs `action`.
// Throws if the action is illegal.
export function applyAction(state: GameState, action: Action): GameState {
  if (state.street === Street.Showdown) {
    throw new Error("Cannot apply action: hand is over")
  }

  const legal = getLegalActions(state)
  if (!legal.actions.includes(action.type)) {
    throw new Error(
      `Illegal action ${action.type} for player at seat ${state.toActIndex}. Legal: ${legal.actions.join(", ")}`,
    )
  }

  const next = cloneState(state)
  const player = next.players[next.toActIndex]
  const n = next.players.length

  switch (action.type) {
    case ActionType.Fold: {
      player.hasFolded = true
      next.actionsToClose = Math.max(0, next.actionsToClose - 1)
      break
    }

    case ActionType.Check: {
      // No chips move
      next.actionsToClose = Math.max(0, next.actionsToClose - 1)
      break
    }

    case ActionType.Call: {
      const toCall = callAmount(player, next.currentBet)
      player.stack -= toCall
      player.betThisStreet += toCall
      if (player.stack === 0) player.isAllIn = true
      next.actionsToClose = Math.max(0, next.actionsToClose - 1)
      break
    }

    case ActionType.Bet: {
      const amount = action.amount ?? 0
      if (amount < legal.minBetOrRaise || amount > legal.maxBetOrRaise) {
        throw new Error(
          `Bet amount ${amount} out of range [${legal.minBetOrRaise}, ${legal.maxBetOrRaise}]`,
        )
      }
      const chips = amount - player.betThisStreet
      player.stack -= chips
      player.betThisStreet = amount
      if (player.stack === 0) player.isAllIn = true

      const raiseSize = amount - next.currentBet
      next.currentBet = amount
      next.minRaiseTo = amount + raiseSize
      next.lastAggressorIndex = next.toActIndex
      // Everyone else who can act must respond
      next.actionsToClose = next.players.filter(
        (p) => !p.hasFolded && !p.isAllIn && p.seatIndex !== player.seatIndex,
      ).length
      break
    }

    case ActionType.Raise: {
      const amount = action.amount ?? 0
      if (amount < legal.minBetOrRaise || amount > legal.maxBetOrRaise) {
        throw new Error(
          `Raise amount ${amount} out of range [${legal.minBetOrRaise}, ${legal.maxBetOrRaise}]`,
        )
      }
      const chips = amount - player.betThisStreet
      player.stack -= chips
      player.betThisStreet = amount
      if (player.stack === 0) player.isAllIn = true

      const isAllInRaise = player.isAllIn
      const raiseSize = amount - next.currentBet
      const reopens = isAllInRaise
        ? allInReopensAction(amount, next.currentBet, next.minRaiseTo - next.currentBet)
        : true

      next.currentBet = amount
      if (reopens) {
        next.minRaiseTo = amount + raiseSize
        next.lastAggressorIndex = next.toActIndex
        // Full raise — everyone else must respond
        next.actionsToClose = next.players.filter(
          (p) => !p.hasFolded && !p.isAllIn && p.seatIndex !== player.seatIndex,
        ).length
      } else {
        // Partial all-in raise — does not reopen action; just consume this player's turn
        next.actionsToClose = Math.max(0, next.actionsToClose - 1)
      }
      break
    }
  }

  next.numActionsThisStreet += 1

  // Advance toActIndex to next player who can still act
  const acted = next.toActIndex
  let candidate = nextSeatIndex(acted, n)
  let steps = 0

  while (steps < n) {
    const p = next.players[candidate]
    if (!p.hasFolded && !p.isAllIn) break
    candidate = nextSeatIndex(candidate, n)
    steps++
  }

  next.toActIndex = candidate
  return next
}

// ── isBettingRoundComplete ─────────────────────────────────────────────────────
// Returns true when the current betting street is finished and we should advance.
export function isBettingRoundComplete(state: GameState): boolean {
  if (state.street === Street.Showdown) return false

  const active = activePlayers(state.players)

  // Only one player left — everyone else folded
  if (active.length === 1) return true

  // All remaining active players are all-in or folded (no one can act)
  if (actionablePlayers(state.players).length === 0) return true

  // All active players must have matched the current bet (or be all-in),
  // AND the actionsToClose counter must have reached zero.
  const allEqual = active.every(
    (p) => p.betThisStreet === state.currentBet || p.isAllIn,
  )

  return allEqual && state.actionsToClose === 0
}

// ── maybeAdvanceStreet ────────────────────────────────────────────────────────
// If the betting round is complete, advances the street, deals community cards,
// resets per-street state. If already at river, moves to Showdown.
// If hand is over early (only one active player), also moves to Showdown.
// Returns the same state untouched if the round is not yet complete.
export function maybeAdvanceStreet(state: GameState): GameState {
  if (!isBettingRoundComplete(state)) return state

  const next = cloneState(state)

  // Collect street bets into the pot
  collectBetsIntoPot(next)

  const active = activePlayers(next.players)

  // Early win: everyone else folded
  if (active.length === 1) {
    next.street = Street.Showdown
    next.winners = awardUncontested(next, active[0].id)
    return next
  }

  // Advance street
  switch (next.street) {
    case Street.Preflop:
      next.communityCards.push(...drawCards(next.deck, 3)) // flop
      next.street = Street.Flop
      break
    case Street.Flop:
      next.communityCards.push(...drawCards(next.deck, 1)) // turn
      next.street = Street.Turn
      break
    case Street.Turn:
      next.communityCards.push(...drawCards(next.deck, 1)) // river
      next.street = Street.River
      break
    case Street.River:
      next.street = Street.Showdown
      next.winners = resolveShowdown(next)
      return next
    case Street.Showdown:
      return next // no-op
  }

  // Reset per-street state for the new betting round
  for (const p of next.players) {
    p.betThisStreet = 0
  }
  next.currentBet = 0
  next.numActionsThisStreet = 0
  next.actionsToClose = actionablePlayers(next.players).length

  // Post-flop action starts left of dealer
  const firstToAct = findFirstToActPostFlop(next)
  next.toActIndex = firstToAct
  next.lastAggressorIndex = firstToAct
  next.minRaiseTo = next.config.bigBlind

  return next
}

// ── isHandOver ─────────────────────────────────────────────────────────────────
export function isHandOver(state: GameState): boolean {
  return state.street === Street.Showdown
}

// ── resolveShowdown ───────────────────────────────────────────────────────────
// Evaluates all remaining hands and awards each pot to the best hand(s).
// In case of a tie, the pot is split evenly (remainder chip goes to earliest seat).
export function resolveShowdown(state: GameState): WinnerResult[] {
  const active = activePlayers(state.players)
  const community = state.communityCards

  if (community.length !== 5) {
    throw new Error(`Showdown requires 5 community cards, got ${community.length}`)
  }

  // Evaluate each active player's best hand
  const evaluations = new Map(
    active.map((p) => [p.id, evaluate7([...p.holeCards, ...community])])
  )

  const results: WinnerResult[] = []

  for (const pot of state.pots) {
    const eligible = pot.eligiblePlayerIds.filter((id) =>
      active.some((p) => p.id === id),
    )

    if (eligible.length === 0) continue

    // Rank eligible players best → worst
    const ranked = [...eligible].sort((a, b) => {
      const ea = evaluations.get(a)!
      const eb = evaluations.get(b)!
      return compareHands(eb, ea) // descending
    })

    const best = evaluations.get(ranked[0])!

    // All players who tie the best hand share this pot
    const winners = ranked.filter(
      (id) => compareHands(evaluations.get(id)!, best) === 0,
    )

    const share = Math.floor(pot.amount / winners.length)
    let remainder = pot.amount - share * winners.length

    for (const id of winners) {
      results.push({
        playerId: id,
        potAmount: share + (remainder-- > 0 ? 1 : 0),
        handDescription: handRankLabel(evaluations.get(id)!.rank),
      })
    }
  }

  return results
}

// ── Internal helpers ───────────────────────────────────────────────────────────

// Move all betThisStreet amounts into the combined pot.
// Rebuilds side pots correctly for any all-in situations.
function collectBetsIntoPot(state: GameState): void {
  // Build a totalCommitted map from what's already in pots + street bets
  const existingPotTotal = state.pots.reduce((sum, p) => sum + p.amount, 0)

  // We track total committed per player across the hand.
  // Simple approach: gather street bets and merge with any existing side-pot math.
  // For correctness we rebuild pots from scratch using betThisStreet additions.

  const committedThisStreet = new Map<string, number>()
  for (const p of state.players) {
    committedThisStreet.set(p.id, p.betThisStreet)
  }

  const foldedIds = new Set(state.players.filter((p) => p.hasFolded).map((p) => p.id))

  // Build new side-pots from this street's bets
  const newPots = buildPots(committedThisStreet, foldedIds)

  // Merge: add existing pot amounts to first (main) pot, append new side pots
  if (state.pots.length > 0 && newPots.length > 0) {
    // Add whatever was already in pots to the main pot total
    const alreadyIn = state.pots.reduce((s, p) => s + p.amount, 0)
    newPots[0].amount += alreadyIn
    state.pots = newPots
  } else if (newPots.length > 0) {
    state.pots = newPots
  }
  // else: nothing was bet this street, leave pots alone
}

// Award the whole pot to one player (everyone else folded).
function awardUncontested(state: GameState, winnerId: string): WinnerResult[] {
  const total = state.pots.reduce((s, p) => s + p.amount, 0)
  return [{ playerId: winnerId, potAmount: total, handDescription: "Uncontested" }]
}

// Post-flop: first to act is the first active player left of the dealer.
function findFirstToActPostFlop(state: GameState): number {
  const n = state.players.length
  let idx = nextSeatIndex(state.dealerIndex, n)
  for (let i = 0; i < n; i++) {
    const p = state.players[idx]
    if (!p.hasFolded && !p.isAllIn) return idx
    idx = nextSeatIndex(idx, n)
  }
  // All remaining players are all-in — pick dealer+1 as nominal seat
  return nextSeatIndex(state.dealerIndex, n)
}
