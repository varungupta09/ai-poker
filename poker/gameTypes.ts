/*
  poker/gameTypes.ts
  Pure types, enums, and interfaces for Texas Hold'em No-Limit game state.
  No logic lives here.
*/

import { Card } from "./types"

// ── Streets ────────────────────────────────────────────────────────────────────
export enum Street {
  Preflop  = "preflop",
  Flop     = "flop",
  Turn     = "turn",
  River    = "river",
  Showdown = "showdown",
}

// ── Actions ────────────────────────────────────────────────────────────────────
export enum ActionType {
  Fold  = "fold",
  Check = "check",
  Call  = "call",
  Bet   = "bet",
  Raise = "raise",
}

// An action submitted by a player. amount is only meaningful for Bet and Raise
// (the total bet/raise TO, not just the increment).
export interface Action {
  type: ActionType
  // For Bet: the total bet size placed this street.
  // For Raise: the total amount raised TO (i.e. the new currentBet after this raise).
  // Omit / 0 for Fold, Check, Call.
  amount?: number
}

// ── Player ─────────────────────────────────────────────────────────────────────
export interface PlayerState {
  id: string           // unique player/agent identifier
  seatIndex: number    // 0-based seat at the table
  stack: number        // chips behind (not yet committed this hand)
  holeCards: Card[]    // exactly 2 after deal; empty before deal

  // Street-scoped amounts (reset each new street)
  betThisStreet: number  // chips put in on the current street so far

  // Hand-scoped flags
  hasFolded: boolean
  isAllIn: boolean
}

// ── Pot ────────────────────────────────────────────────────────────────────────
// A single pot (main or side). eligiblePlayerIds lists who can win it.
export interface Pot {
  amount: number
  eligiblePlayerIds: string[]
}

// ── Config ─────────────────────────────────────────────────────────────────────
// Passed once at table creation; does not change during a hand.
export interface TableConfig {
  smallBlind: number
  bigBlind: number
  // minBuyIn / maxBuyIn are lobby concerns, not engine concerns — omitted here
}

// ── GameState ──────────────────────────────────────────────────────────────────
// Fully describes the game at any moment. applyAction() takes one and returns
// the next one; nothing is mutated in place.
export interface GameState {
  // Table setup (constant within a hand)
  config: TableConfig

  // Seats (ordered by seatIndex; array index === seatIndex)
  players: PlayerState[]

  // Position indices into `players`
  dealerIndex: number   // button
  sbIndex: number       // small blind seat
  bbIndex: number       // big blind seat

  // Betting state for the current street
  toActIndex: number        // seat index of the player who must act next
  currentBet: number        // highest total bet placed on this street so far
  minRaiseTo: number        // minimum legal total raise-to on this street
  lastAggressorIndex: number | null  // seat that made the last bet/raise (for minRaise calc)
  numActionsThisStreet: number       // informational only
  // How many more players must act before this betting round ends.
  // Decremented on fold/check/call; reset to (other actionable players) on bet/raise.
  actionsToClose: number

  // Community cards & deck
  street: Street
  communityCards: Card[]    // 0-3-4-5 cards depending on street
  deck: Card[]              // remaining shuffled deck

  // Pots (main + any side pots built as players go all-in)
  pots: Pot[]

  // Hand result (populated only when street === Showdown)
  winners: WinnerResult[] | null
}

// ── Showdown Result ────────────────────────────────────────────────────────────
export interface WinnerResult {
  playerId: string
  potAmount: number      // chips awarded from a specific pot
  handDescription: string // e.g. "Full House"  (for UI)
}
