/*
  dev_agents/rm/rmx.ts
  rmx — an advanced heuristic No-Limit Texas Hold'em agent.

  Strategy pillars:
    1. Preflop hand strength  — Chen-style scoring + suited/connected bonuses
    2. Postflop equity        — fast Monte Carlo simulation (~200 rollouts)
    3. Position awareness     — wider ranges and more aggression in late position
    4. Pot odds               — only call when equity > pot-odds break-even
    5. Bet sizing variety     — sizes scale with hand strength and street
    6. Bluff frequency        — semi-bluff draws; occasional stone-cold bluff in position
*/

import { Agent } from "../../poker/agent"
import { Action, ActionType, GameState, Street } from "../../poker/gameTypes"
import { LegalActions } from "../../poker/gameState"
import { Card, Rank, Suit, HandRank } from "../../poker/types"
import { evaluate7, compareHands } from "../../poker/handEvaluator"

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTE_CARLO_ROLLOUTS = 200

// ── Helpers: deck ─────────────────────────────────────────────────────────────

const ALL_RANKS: Rank[] = [2,3,4,5,6,7,8,9,10,11,12,13,14]
const ALL_SUITS: Suit[]  = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]

function fullDeck(): Card[] {
  const deck: Card[] = []
  for (const rank of ALL_RANKS)
    for (const suit of ALL_SUITS)
      deck.push({ rank, suit })
  return deck
}

function cardKey(c: Card): string {
  return `${c.rank}${c.suit}`
}

// Remove known cards from the full deck to get an "unknown" deck.
function remainingDeck(known: Card[]): Card[] {
  const used = new Set(known.map(cardKey))
  return fullDeck().filter(c => !used.has(cardKey(c)))
}

// Fisher-Yates shuffle (in-place).
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Equity estimation via Monte Carlo ─────────────────────────────────────────

/**
 * Estimates the equity (0-1) of `myCards` + `board` vs `numOpponents` random hands.
 * Uses `rollouts` random completions of the board and random opponent hole cards.
 */
function estimateEquity(
  myCards: Card[],
  board: Card[],
  numOpponents: number,
  rollouts: number = MONTE_CARLO_ROLLOUTS,
): number {
  const boardNeeded = 5 - board.length
  let wins = 0
  let ties = 0

  for (let i = 0; i < rollouts; i++) {
    const deck = shuffle(remainingDeck([...myCards, ...board]))
    let deckIdx = 0

    // Deal random hands to opponents
    const oppHands: Card[][] = []
    for (let o = 0; o < numOpponents; o++) {
      oppHands.push([deck[deckIdx++], deck[deckIdx++]])
    }

    // Complete the board
    const runout = board.concat(deck.slice(deckIdx, deckIdx + boardNeeded))

    // Evaluate all hands
    const myEval  = evaluate7([...myCards, ...runout])
    const oppEvals = oppHands.map(h => evaluate7([...h, ...runout]))

    // Did I beat all opponents?
    const myBeat = oppEvals.every(opp => compareHands(myEval, opp) > 0)
    const myTied = !myBeat && oppEvals.every(opp => compareHands(myEval, opp) >= 0)

    if (myBeat) wins++
    else if (myTied) ties++
  }

  return (wins + ties * 0.5) / rollouts
}

// ── Preflop hand strength ─────────────────────────────────────────────────────

/**
 * Returns a preflop score 0-1 for two hole cards.
 * Based on Chen formula approximation + suited/connected adjustments.
 */
function preflopScore(cards: Card[]): number {
  const [a, b] = cards.sort((x, y) => y.rank - x.rank) // descending
  const hi = a.rank
  const lo = b.rank
  const suited  = a.suit === b.suit
  const gap     = hi - lo  // 0 = pair
  const isPair  = gap === 0

  // Base score from high card
  let score = 0
  if (hi === Rank.Ace)   score = 10
  else if (hi === Rank.King)  score = 8
  else if (hi === Rank.Queen) score = 7
  else if (hi === Rank.Jack)  score = 6
  else score = hi / 2

  // Pair bonus
  if (isPair) {
    score = Math.max(score * 2, 5)
    if (hi >= Rank.Jack) score += 4
    if (hi === Rank.Ace) score += 4
  }

  // Suited bonus
  if (suited && !isPair) score += 2

  // Connectedness penalty for gap
  if (!isPair) {
    if (gap === 0) { /* no gap — already handled */ }
    else if (gap === 1) score -= 1
    else if (gap === 2) score -= 2
    else if (gap === 3) score -= 4
    else score -= 5

    // One-gap straight possibilities involving broadway (A-K, A-Q, K-Q, K-J, Q-J, Q-T, J-T)
    if (hi >= Rank.Ten && lo >= Rank.Ten && gap <= 4) score += 1
  }

  // Normalize to 0-1 (max raw score ~26 for AA)
  return Math.max(0, Math.min(1, score / 26))
}

// ── Position awareness ────────────────────────────────────────────────────────

/** Returns how "late" the acting player is relative to the dealer (0=earliest, 1=latest/button). */
function positionFactor(state: GameState): number {
  const n = state.players.length
  const dealer = state.dealerIndex
  const me = state.toActIndex
  // Seats after the dealer are "later" positions
  const seatsAfterDealer = (me - dealer + n) % n
  return seatsAfterDealer / (n - 1) // 0 → UTG (early), 1 → BTN (late)
}

// ── Draw detection ────────────────────────────────────────────────────────────

interface DrawInfo {
  flushDraw: boolean   // 4 to a flush
  oesd: boolean        // open-ended straight draw
  gutshot: boolean     // inside straight draw
}

function detectDraws(myCards: Card[], board: Card[]): DrawInfo {
  const all = [...myCards, ...board]
  const suitCounts: Record<string, number> = {}
  for (const c of all) {
    suitCounts[c.suit] = (suitCounts[c.suit] ?? 0) + 1
  }
  const flushDraw = Object.values(suitCounts).some(n => n === 4)

  const ranks = [...new Set(all.map(c => c.rank))].sort((a, b) => a - b)
  let oesd = false
  let gutshot = false
  for (let i = 0; i < ranks.length - 3; i++) {
    const span = ranks[i + 3] - ranks[i]
    if (span === 3) oesd = true
    else if (span === 4) gutshot = true
  }

  return { flushDraw, oesd, gutshot }
}

// ── Bet sizing ────────────────────────────────────────────────────────────────

/** Returns an amount to bet/raise given pot, stack, and a "pressure" factor (0-1). */
function chooseBetSize(
  legal: LegalActions,
  pot: number,
  pressure: number, // 0=small, 1=pot-sized+
): number {
  const min = legal.minBetOrRaise
  const max = legal.maxBetOrRaise
  // Bet fractions of pot: 0.5x, 0.75x, 1x, 1.5x depending on pressure
  const fraction = 0.4 + pressure * 1.1 // 0.4–1.5x pot
  const target = Math.round(pot * fraction)
  return Math.max(min, Math.min(max, target))
}

// ── Core decision logic ───────────────────────────────────────────────────────

/**
 * Compute pot odds break-even equity.
 * If equity >= this, calling is +EV.
 */
function potOddsEquity(callAmt: number, pot: number): number {
  if (callAmt === 0) return 0
  return callAmt / (pot + callAmt)
}

// ── rmx Agent ─────────────────────────────────────────────────────────────────

export class RmxAgent implements Agent {
  readonly id: string

  constructor(id: string = "rmx") {
    this.id = id
  }

  decide(obs: GameState, legal: LegalActions): Action {
    const me = obs.players[obs.toActIndex]
    const board = obs.communityCards
    const myCards = me.holeCards
    const street = obs.street
    const pos = positionFactor(obs)

    // Total pot across all sub-pots
    const pot = obs.pots.reduce((s, p) => s + p.amount, 0) + me.betThisStreet

    // Number of opponents still in the hand
    const numOpponents = obs.players.filter(
      p => p.id !== me.id && !p.hasFolded
    ).length

    // ── Preflop ──────────────────────────────────────────────────────────────
    if (street === Street.Preflop) {
      return this._preflopDecide(obs, legal, myCards, pos, pot, numOpponents)
    }

    // ── Postflop (Flop / Turn / River) ───────────────────────────────────────
    return this._postflopDecide(obs, legal, myCards, board, pos, pot, numOpponents)
  }

  // ── Preflop strategy ──────────────────────────────────────────────────────

  private _preflopDecide(
    obs: GameState,
    legal: LegalActions,
    myCards: Card[],
    pos: number,
    pot: number,
    numOpponents: number,
  ): Action {
    const score = preflopScore(myCards)
    const config = obs.config

    // Position-adjusted thresholds (calibrated to the 0–1 score distribution:
    // non-pair hands top out ~0.46 for AKs; small pairs sit 0.19–0.38;
    // JJ+ jump to 0.62+ due to pair bonus, KK=0.77, AA=1.0)
    const openThreshold  = 0.30 - pos * 0.08   // 0.30 UTG → 0.22 BTN  (99+, ATo+, KQo)
    const raiseThreshold = 0.40 - pos * 0.07   // 0.40 UTG → 0.33 BTN  (JJ+, AQs+, AKo)
    const threebet       = 0.65                 // QQ+

    const canRaise = legal.actions.includes(ActionType.Raise)
    const canBet   = legal.actions.includes(ActionType.Bet)
    const canCheck = legal.actions.includes(ActionType.Check)

    // Premium hand — always raise / 3-bet
    if (score >= threebet) {
      if (canRaise || canBet) {
        const amt = chooseBetSize(legal, pot, 0.85)
        return { type: canRaise ? ActionType.Raise : ActionType.Bet, amount: amt }
      }
      return { type: ActionType.Call }
    }

    // Strong hand — raise for value
    if (score >= raiseThreshold && (canRaise || canBet)) {
      const amt = chooseBetSize(legal, pot, 0.65)
      return { type: canRaise ? ActionType.Raise : ActionType.Bet, amount: amt }
    }

    // Playable hand — call (enter the pot)
    if (score >= openThreshold) {
      if (canCheck) return { type: ActionType.Check }
      return { type: ActionType.Call }
    }

    // Marginal — occasionally call in late position with speculative hands
    if (score >= 0.19 && pos >= 0.6 && canCheck) return { type: ActionType.Check }
    if (score >= 0.22 && pos >= 0.7 && legal.callAmount <= config.bigBlind * 2) {
      return { type: ActionType.Call }
    }

    // Fold everything else
    if (canCheck) return { type: ActionType.Check }
    return { type: ActionType.Fold }
  }

  // ── Postflop strategy ──────────────────────────────────────────────────────

  private _postflopDecide(
    obs: GameState,
    legal: LegalActions,
    myCards: Card[],
    board: Card[],
    pos: number,
    pot: number,
    numOpponents: number,
  ): Action {
    const equity = estimateEquity(myCards, board, numOpponents)
    const draws  = detectDraws(myCards, board)

    // Effective draw equity bump (semi-bluff value)
    let effectiveEquity = equity
    if (draws.oesd)      effectiveEquity += 0.17
    if (draws.flushDraw) effectiveEquity += 0.19
    if (draws.gutshot)   effectiveEquity += 0.08

    const callAmt = legal.callAmount
    const breakEven = potOddsEquity(callAmt, pot)

    const canRaise = legal.actions.includes(ActionType.Raise)
    const canBet   = legal.actions.includes(ActionType.Bet)
    const canCheck = legal.actions.includes(ActionType.Check)
    const canCall  = legal.actions.includes(ActionType.Call)

    // ── Strong hand (>65% equity): go for value ──────────────────────────────
    if (effectiveEquity >= 0.65) {
      if (canBet || canRaise) {
        const pressure = Math.min(1, (effectiveEquity - 0.65) * 3 + 0.5)
        const amt = chooseBetSize(legal, pot, pressure)
        return { type: canBet ? ActionType.Bet : ActionType.Raise, amount: amt }
      }
      if (canCall) return { type: ActionType.Call }
    }

    // ── Medium hand (45-65%): pot-odds call or small bet ─────────────────────
    if (effectiveEquity >= 0.45) {
      // Bet for thin value in late position
      if ((canBet || canRaise) && pos >= 0.5 && equity >= 0.50) {
        const amt = chooseBetSize(legal, pot, 0.35)
        return { type: canBet ? ActionType.Bet : ActionType.Raise, amount: amt }
      }
      if (canCheck) return { type: ActionType.Check }
      if (canCall && effectiveEquity >= breakEven) return { type: ActionType.Call }
      if (canCheck) return { type: ActionType.Check }
    }

    // ── Draw (semi-bluff): sometimes bet, sometimes call ─────────────────────
    const hasGoodDraw = draws.oesd || draws.flushDraw
    if (hasGoodDraw && effectiveEquity >= breakEven) {
      // Semi-bluff in position on flop/turn; call river draws
      if ((canBet || canRaise) && pos >= 0.5 && obs.street !== Street.River) {
        const bluffFrequency = 0.45 + pos * 0.2 // 45-65% of the time
        if (Math.random() < bluffFrequency) {
          const amt = chooseBetSize(legal, pot, 0.5)
          return { type: canBet ? ActionType.Bet : ActionType.Raise, amount: amt }
        }
      }
      if (canCall) return { type: ActionType.Call }
      if (canCheck) return { type: ActionType.Check }
    }

    // ── Weak hand: pot odds check or fold ────────────────────────────────────
    // Occasional stone-cold bluff in late position (low frequency)
    if (pos >= 0.8 && (canBet || canRaise) && Math.random() < 0.08) {
      const amt = chooseBetSize(legal, pot, 0.7)
      return { type: canBet ? ActionType.Bet : ActionType.Raise, amount: amt }
    }

    if (canCheck) return { type: ActionType.Check }
    if (canCall && effectiveEquity >= breakEven) return { type: ActionType.Call }
    return { type: ActionType.Fold }
  }
}
