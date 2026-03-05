import { initHand, getLegalActions, applyAction, maybeAdvanceStreet, isHandOver, resolveShowdown } from "../gameState"
import { ActionType, Street } from "../gameTypes"

let passed = 0, failed = 0
function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) { console.log(`✓ ${label}`, extra ?? ""); passed++ }
  else { console.error(`✗ ${label}`, extra ?? ""); failed++ }
}

const config = { smallBlind: 50, bigBlind: 100 }
const seats = [
  { id: "alice", stack: 1000 },
  { id: "bob",   stack: 1000 },
  { id: "carol", stack: 1000 },
]

// ── Test: initHand ─────────────────────────────────────────────────────────
const state0 = initHand(seats, 0, config)
check("initHand: street is Preflop", state0.street === Street.Preflop)
check("initHand: 3 players", state0.players.length === 3)
check("initHand: each player has 2 hole cards", state0.players.every(p => p.holeCards.length === 2))
check("initHand: SB posted 50", state0.players[state0.sbIndex].betThisStreet === 50)
check("initHand: BB posted 100", state0.players[state0.bbIndex].betThisStreet === 100)
check("initHand: currentBet is 100", state0.currentBet === 100)
check("initHand: deck has 52 - 6 = 46 cards", state0.deck.length === 46)
check("initHand: no winners yet", state0.winners === null)

// ── Test: getLegalActions for first actor (UTG) ──────────────────────────────
const legal = getLegalActions(state0)
check("getLegalActions: fold available", legal.actions.includes(ActionType.Fold))
check("getLegalActions: call available (not check)", legal.actions.includes(ActionType.Call) && !legal.actions.includes(ActionType.Check))
check("getLegalActions: raise available", legal.actions.includes(ActionType.Raise))
check("getLegalActions: callAmount = 100", legal.callAmount === 100)
check("getLegalActions: minRaise >= 200", legal.minBetOrRaise >= 200)

// ── Test: applyAction fold ───────────────────────────────────────────────────
const stateAfterFold = applyAction(state0, { type: ActionType.Fold })
check("applyAction fold: player hasFolded", stateAfterFold.players[state0.toActIndex].hasFolded === true)

// ── Test: applyAction call ───────────────────────────────────────────────────
const stateAfterCall = applyAction(state0, { type: ActionType.Call })
const caller = stateAfterCall.players[state0.toActIndex]
check("applyAction call: betThisStreet = 100", caller.betThisStreet === 100)
check("applyAction call: stack reduced by 100", caller.stack === 900)

// ── Test: applyAction raise ──────────────────────────────────────────────────
const stateAfterRaise = applyAction(state0, { type: ActionType.Raise, amount: 300 })
check("applyAction raise: currentBet updated to 300", stateAfterRaise.currentBet === 300)
check("applyAction raise: minRaiseTo updated", stateAfterRaise.minRaiseTo === 500)

// ── Test: illegal action throws ──────────────────────────────────────────────
let threw = false
try { applyAction(state0, { type: ActionType.Check }) } catch { threw = true }
check("applyAction: check is illegal when there's a bet", threw)

// ── Test: fast-forward a full hand (all call, then fold on flop) ─────────────
let s = state0
// UTG call
s = applyAction(s, { type: ActionType.Call })
// SB call
s = applyAction(s, { type: ActionType.Call })
// BB check (option)
s = applyAction(s, { type: ActionType.Check })
// Advance to flop
s = maybeAdvanceStreet(s)
check("after preflop: street is Flop", s.street === Street.Flop)
check("after preflop: 3 community cards", s.communityCards.length === 3)
check("after preflop: betThisStreet reset to 0", s.players.every(p => p.betThisStreet === 0))

// SB folds on flop, BB bets, UTG folds → SB folds → BB wins uncontested
// First to act post-flop is seat left of dealer (dealer=0, so seat 1 = SB)
s = applyAction(s, { type: ActionType.Check })  // SB checks
s = applyAction(s, { type: ActionType.Bet, amount: 100 })  // BB bets
s = applyAction(s, { type: ActionType.Fold })   // UTG folds
s = applyAction(s, { type: ActionType.Fold })   // SB folds
s = maybeAdvanceStreet(s)
check("hand over after all but one fold", isHandOver(s))
check("winner is BB (uncontested)", s.winners !== null && s.winners[0].playerId === seats[state0.bbIndex].id)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
