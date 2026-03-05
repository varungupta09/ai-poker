// poker/handEvaluator.ts
import { Card, EvaluatedHand, HandRank, Rank, Suit } from "./types"

function countRanks(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>()

  for (const card of cards) {
    const prev = counts.get(card.rank) ?? 0
    counts.set(card.rank, prev + 1)
  }

  return counts
}

function groupBySuit(cards: Card[]): Map<Suit, Card[]> {
  const groups = new Map<Suit, Card[]>()

  for (const card of cards) {
    const arr = groups.get(card.suit)
    if (arr) {
      arr.push(card)
    } else {
      groups.set(card.suit, [card])
    }
  }

  return groups
}

function uniqueRanksDesc(cards: Card[]): Rank[] {
  const set = new Set<number>()
  for (const c of cards) set.add(c.rank)

  return Array.from(set)
    .sort((a, b) => b - a)
    .map((n) => n as Rank)
}

function findStraightFromRanks(ranksDesc: Rank[]): Rank[] | null {
  if (ranksDesc.length < 5) return null

  // Convert to numbers for easier math (Rank is numeric enum, so this is safe)
  const nums = ranksDesc.map((r) => r as number)

  // Ace-low handling: if Ace is present, add "1" as an extra low Ace possibility
  // Example: [14, 5, 4, 3, 2] becomes [14, 5, 4, 3, 2, 1]
  if (nums.includes(Rank.Ace)) {
    nums.push(1)
  }

  // We want to scan for any run of 5 consecutive numbers.
  // Because ranksDesc is sorted high->low, nums is also high->low (until the trailing 1).
  let run: number[] = [nums[0]]

  for (let i = 1; i < nums.length; i++) {
    const prev = run[run.length - 1]
    const curr = nums[i]

    if (curr === prev) {
      // shouldn't happen if ranksDesc is unique, but safe guard
      continue
    }

    if (curr === prev - 1) {
      run.push(curr)
      if (run.length === 5) {
        // Convert run back into Rank[]
        // Note: if the run contains 1, we turn that back into Ace.
        return run.map((n) => (n === 1 ? Rank.Ace : (n as Rank)))
      }
    } else {
      // reset run starting at current number
      run = [curr]
    }
  }

  return null
}

function topNCardsByRankDesc(cards: Card[], n: number): Card[] {
  return [...cards]
    .sort((a, b) => (b.rank as number) - (a.rank as number))
    .slice(0, n)
}

function ranksWithCountDesc(rankCounts: Map<Rank, number>, count: number): Rank[] {
  const ranks: Rank[] = []
  for (const [rank, c] of rankCounts.entries()) {
    if (c === count) ranks.push(rank)
  }
  return ranks.sort((a, b) => (b as number) - (a as number))
}

// Public API: evaluate best 5-card hand from 7 cards (2 hole + 5 community)
export function evaluate7(cards: Card[]): EvaluatedHand {
  if (cards.length !== 7) {
    throw new Error(`evaluate7 expects 7 cards, got ${cards.length}`)
  }

  const rankCounts = countRanks(cards)
  const suitGroups = groupBySuit(cards)
  const ranksDesc = uniqueRanksDesc(cards)

  // ── Straight Flush (includes Royal Flush) ───────────────────────────────────
  for (const [, suitCards] of suitGroups) {
    if (suitCards.length >= 5) {
      const sfRun = findStraightFromRanks(uniqueRanksDesc(suitCards))
      if (sfRun) {
        const bestFive = sfRun.map((r) => suitCards.find((c) => c.rank === r)!)
        return {
          rank: HandRank.StraightFlush,
          tiebreakers: [sfRun[0]], // highest card in the straight
          bestFive,
        }
      }
    }
  }

  // ── Four of a Kind ──────────────────────────────────────────────────────────
  const quads = ranksWithCountDesc(rankCounts, 4)
  if (quads.length >= 1) {
    const quadRank = quads[0]
    const quadCards = cards.filter((c) => c.rank === quadRank)
    const kicker = cards
      .filter((c) => c.rank !== quadRank)
      .sort((a, b) => (b.rank as number) - (a.rank as number))[0]
    return {
      rank: HandRank.FourOfAKind,
      tiebreakers: [quadRank, kicker.rank],
      bestFive: [...quadCards, kicker],
    }
  }

  // ── Full House ──────────────────────────────────────────────────────────────
  // "trips" = ranks with exactly 3 copies; "pairs" = ranks with exactly 2 copies.
  // Edge case: two sets of trips in 7 cards (e.g. KKK 888 x) — lower set acts as the pair.
  const trips = ranksWithCountDesc(rankCounts, 3)
  const pairs = ranksWithCountDesc(rankCounts, 2)

  if (trips.length >= 1 && (pairs.length >= 1 || trips.length >= 2)) {
    const threeRank = trips[0]
    const pairRank = trips.length >= 2 ? trips[1] : pairs[0]
    const threeCards = cards.filter((c) => c.rank === threeRank).slice(0, 3)
    const pairCards = cards.filter((c) => c.rank === pairRank).slice(0, 2)
    return {
      rank: HandRank.FullHouse,
      tiebreakers: [threeRank, pairRank],
      bestFive: [...threeCards, ...pairCards],
    }
  }

  // ── Flush ───────────────────────────────────────────────────────────────────
  for (const [, suitCards] of suitGroups) {
    if (suitCards.length >= 5) {
      const bestFive = topNCardsByRankDesc(suitCards, 5)
      return {
        rank: HandRank.Flush,
        tiebreakers: bestFive.map((c) => c.rank),
        bestFive,
      }
    }
  }

  // ── Straight ────────────────────────────────────────────────────────────────
  const straight = findStraightFromRanks(ranksDesc)
  if (straight) {
    // Each rank in the run may appear multiple times in `cards`; just pick one card per rank.
    const bestFive = straight.map((r) => cards.find((c) => c.rank === r)!)
    return {
      rank: HandRank.Straight,
      tiebreakers: [straight[0]], // highest card in the straight
      bestFive,
    }
  }

  // ── Three of a Kind ─────────────────────────────────────────────────────────
  if (trips.length >= 1) {
    const tripRank = trips[0]
    const tripCards = cards.filter((c) => c.rank === tripRank).slice(0, 3)
    const kickers = cards
      .filter((c) => c.rank !== tripRank)
      .sort((a, b) => (b.rank as number) - (a.rank as number))
      .slice(0, 2)
    return {
      rank: HandRank.ThreeOfAKind,
      tiebreakers: [tripRank, ...kickers.map((c) => c.rank)],
      bestFive: [...tripCards, ...kickers],
    }
  }

  // ── Two Pair ────────────────────────────────────────────────────────────────
  // With 7 cards it's possible to have 3 pairs — we take the top 2 and best kicker.
  if (pairs.length >= 2) {
    const highPairRank = pairs[0]
    const lowPairRank = pairs[1]
    const highPairCards = cards.filter((c) => c.rank === highPairRank).slice(0, 2)
    const lowPairCards = cards.filter((c) => c.rank === lowPairRank).slice(0, 2)
    const kicker = cards
      .filter((c) => c.rank !== highPairRank && c.rank !== lowPairRank)
      .sort((a, b) => (b.rank as number) - (a.rank as number))[0]
    return {
      rank: HandRank.TwoPair,
      tiebreakers: [highPairRank, lowPairRank, kicker.rank],
      bestFive: [...highPairCards, ...lowPairCards, kicker],
    }
  }

  // ── One Pair ─────────────────────────────────────────────────────────────────
  if (pairs.length >= 1) {
    const pairRank = pairs[0]
    const pairCards = cards.filter((c) => c.rank === pairRank).slice(0, 2)
    const kickers = cards
      .filter((c) => c.rank !== pairRank)
      .sort((a, b) => (b.rank as number) - (a.rank as number))
      .slice(0, 3)
    return {
      rank: HandRank.OnePair,
      tiebreakers: [pairRank, ...kickers.map((c) => c.rank)],
      bestFive: [...pairCards, ...kickers],
    }
  }

  // ── High Card ────────────────────────────────────────────────────────────────
  const bestFive = topNCardsByRankDesc(cards, 5)
  return {
    rank: HandRank.HighCard,
    tiebreakers: bestFive.map((c) => c.rank),
    bestFive,
  }
}

// Compare two evaluated hands.
// Returns: 1 if a wins, -1 if b wins, 0 if tie.
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.rank !== b.rank) return a.rank > b.rank ? 1 : -1

  const len = Math.max(a.tiebreakers.length, b.tiebreakers.length)
  for (let i = 0; i < len; i++) {
    const ar = a.tiebreakers[i] ?? 0
    const br = b.tiebreakers[i] ?? 0
    if (ar !== br) return ar > br ? 1 : -1
  }

  return 0
}