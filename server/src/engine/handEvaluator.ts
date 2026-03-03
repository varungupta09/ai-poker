import { Card, EvaluatedHand, HandCategory, Rank } from "./types";

// Category ordering: higher is better.
const HAND_CATEGORY_SCORE: Record<HandCategory, number> = {
  high_card: 0,
  one_pair: 1,
  two_pair: 2,
  three_of_a_kind: 3,
  straight: 4,
  flush: 5,
  full_house: 6,
  four_of_a_kind: 7,
  straight_flush: 8,
  royal_flush: 9,
};

type RankCount = { rank: Rank; count: number };

function sortDescending<T>(arr: T[], getKey: (t: T) => number): T[] {
  return [...arr].sort((a, b) => getKey(b) - getKey(a));
}

function getRankCounts(cards: Card[]): RankCount[] {
  const map = new Map<Rank, number>();
  for (const c of cards) {
    map.set(c.rank, (map.get(c.rank) ?? 0) + 1);
  }
  const counts: RankCount[] = [];
  for (const [rank, count] of map.entries()) {
    counts.push({ rank, count });
  }
  return sortDescending(counts, (rc) => rc.count * 100 + rc.rank);
}

function getSuitGroups(cards: Card[]): Map<string, Card[]> {
  const bySuit = new Map<string, Card[]>();
  for (const c of cards) {
    const list = bySuit.get(c.suit) ?? [];
    list.push(c);
    bySuit.set(c.suit, list);
  }
  for (const [suit, list] of bySuit.entries()) {
    bySuit.set(
      suit,
      sortDescending(list, (c) => c.rank),
    );
  }
  return bySuit;
}

function uniqueRanksDescending(cards: Card[]): Rank[] {
  const seen = new Set<Rank>();
  const result: Rank[] = [];
  const sorted = sortDescending(cards, (c) => c.rank);
  for (const c of sorted) {
    if (!seen.has(c.rank)) {
      seen.add(c.rank);
      result.push(c.rank);
    }
  }
  return result;
}

function findStraight(ranks: Rank[]): Rank | null {
  if (ranks.length < 5) return null;
  const unique = Array.from(new Set(ranks)).sort((a, b) => a - b);

  // Handle wheel straight (A-2-3-4-5).
  let augmented = unique;
  if (unique.includes(14)) {
    augmented = [1 as Rank, ...unique.filter((r) => r !== 14)];
  }

  let run = 1;
  let bestHigh: number | null = null;
  for (let i = 1; i < augmented.length; i += 1) {
    if (augmented[i] === (augmented[i - 1] as number) + 1) {
      run += 1;
      if (run >= 5) {
        bestHigh = augmented[i];
      }
    } else if (augmented[i] !== augmented[i - 1]) {
      run = 1;
    }
  }

  if (bestHigh == null) return null;
  // Map wheel back to actual high card 5 when needed.
  if (bestHigh === 5 && unique.includes(14)) {
    return 5 as Rank;
  }
  return bestHigh as Rank;
}

function buildStraightCards(cards: Card[], highRank: Rank): Card[] {
  const needed: Rank[] = [];
  if (highRank === 5) {
    needed.push(5 as Rank, 4 as Rank, 3 as Rank, 2 as Rank, 14 as Rank);
  } else {
    for (let r = highRank; r >= (highRank - 4); r -= 1) {
      needed.push(r as Rank);
    }
  }
  const result: Card[] = [];
  const used = new Set<number>();
  for (const rank of needed) {
    for (let i = 0; i < cards.length; i += 1) {
      if (used.has(i)) continue;
      const c = cards[i];
      if (c.rank === rank || (rank === 5 && c.rank === 14 && needed.includes(14))) {
        result.push(c);
        used.add(i);
        break;
      }
    }
  }
  return result;
}

function evaluateFlush(cards: Card[]): { category: HandCategory; bestFive: Card[] } | null {
  const suits = getSuitGroups(cards);
  for (const list of suits.values()) {
    if (list.length >= 5) {
      return {
        category: "flush",
        bestFive: list.slice(0, 5),
      };
    }
  }
  return null;
}

function evaluateStraight(cards: Card[]): { category: HandCategory; bestFive: Card[] } | null {
  const ranks = uniqueRanksDescending(cards);
  const high = findStraight(ranks);
  if (!high) return null;
  const bestFive = buildStraightCards(
    sortDescending(cards, (c) => c.rank),
    high,
  );
  return { category: "straight", bestFive };
}

function evaluateStraightFlush(cards: Card[]): { category: HandCategory; bestFive: Card[] } | null {
  const suits = getSuitGroups(cards);
  let best: { category: HandCategory; bestFive: Card[] } | null = null;
  for (const list of suits.values()) {
    if (list.length < 5) continue;
    const ranks = uniqueRanksDescending(list);
    const high = findStraight(ranks);
    if (!high) continue;
    const bestFive = buildStraightCards(list, high);
    const isRoyal = bestFive.every((c) => c.rank >= 10);
    const category: HandCategory = isRoyal ? "royal_flush" : "straight_flush";
    if (!best) {
      best = { category, bestFive };
    } else {
      const currentHigh = Math.max(...best.bestFive.map((c) => c.rank));
      const candidateHigh = Math.max(...bestFive.map((c) => c.rank));
      if (candidateHigh > currentHigh) {
        best = { category, bestFive };
      }
    }
  }
  return best;
}

export function evaluateBestHand(hole: Card[], board: Card[]): EvaluatedHand {
  const cards = [...hole, ...board];
  if (cards.length < 5) {
    throw new Error("Need at least 5 cards to evaluate hand");
  }

  // Straight flush / royal flush.
  const straightFlush = evaluateStraightFlush(cards);
  if (straightFlush) {
    const { category, bestFive } = straightFlush;
    const high = Math.max(...bestFive.map((c) => c.rank));
    return {
      category,
      bestFive,
      score: [HAND_CATEGORY_SCORE[category], high],
    };
  }

  const rankCounts = getRankCounts(cards);
  const countsByRank = new Map<Rank, number>();
  for (const rc of rankCounts) {
    countsByRank.set(rc.rank, rc.count);
  }

  const quads = rankCounts.filter((rc) => rc.count === 4).map((rc) => rc.rank);
  const trips = rankCounts.filter((rc) => rc.count === 3).map((rc) => rc.rank);
  const pairs = rankCounts.filter((rc) => rc.count === 2).map((rc) => rc.rank);

  // Four of a kind.
  if (quads.length > 0) {
    const quadRank = quads[0];
    const quadCards = cards.filter((c) => c.rank === quadRank).slice(0, 4);
    const kicker = sortDescending(
      cards.filter((c) => c.rank !== quadRank),
      (c) => c.rank,
    )[0];
    const bestFive = [...quadCards, kicker];
    return {
      category: "four_of_a_kind",
      bestFive,
      score: [HAND_CATEGORY_SCORE.four_of_a_kind, quadRank, kicker.rank],
    };
  }

  // Full house.
  if (trips.length > 0 && (pairs.length > 0 || trips.length > 1)) {
    const tripRank = trips[0];
    const remainingTripsOrPairs = [
      ...trips.slice(1),
      ...pairs,
    ].sort((a, b) => b - a);
    const pairRank = remainingTripsOrPairs[0];
    const tripCards = cards.filter((c) => c.rank === tripRank).slice(0, 3);
    const pairCards = cards.filter((c) => c.rank === pairRank).slice(0, 2);
    const bestFive = [...tripCards, ...pairCards];
    return {
      category: "full_house",
      bestFive,
      score: [HAND_CATEGORY_SCORE.full_house, tripRank, pairRank],
    };
  }

  // Flush.
  const flush = evaluateFlush(cards);
  if (flush) {
    const { bestFive } = flush;
    const ranks = bestFive.map((c) => c.rank).sort((a, b) => b - a);
    return {
      category: "flush",
      bestFive,
      score: [HAND_CATEGORY_SCORE.flush, ...ranks],
    };
  }

  // Straight.
  const straight = evaluateStraight(cards);
  if (straight) {
    const { bestFive } = straight;
    const high = Math.max(...bestFive.map((c) => c.rank === 14 && bestFive.some((x) => x.rank === 5) ? 5 : c.rank));
    return {
      category: "straight",
      bestFive,
      score: [HAND_CATEGORY_SCORE.straight, high],
    };
  }

  // Three of a kind.
  if (trips.length > 0) {
    const tripRank = trips[0];
    const tripCards = cards.filter((c) => c.rank === tripRank).slice(0, 3);
    const kickers = sortDescending(
      cards.filter((c) => c.rank !== tripRank),
      (c) => c.rank,
    ).slice(0, 2);
    const bestFive = [...tripCards, ...kickers];
    return {
      category: "three_of_a_kind",
      bestFive,
      score: [
        HAND_CATEGORY_SCORE.three_of_a_kind,
        tripRank,
        kickers[0]?.rank ?? 0,
        kickers[1]?.rank ?? 0,
      ],
    };
  }

  // Two pair.
  if (pairs.length >= 2) {
    const [highPair, lowPair] = pairs.sort((a, b) => b - a).slice(0, 2);
    const pairCards = cards.filter((c) => c.rank === highPair).slice(0, 2)
      .concat(cards.filter((c) => c.rank === lowPair).slice(0, 2));
    const kicker = sortDescending(
      cards.filter((c) => c.rank !== highPair && c.rank !== lowPair),
      (c) => c.rank,
    )[0];
    const bestFive = [...pairCards, kicker];
    return {
      category: "two_pair",
      bestFive,
      score: [
        HAND_CATEGORY_SCORE.two_pair,
        highPair,
        lowPair,
        kicker?.rank ?? 0,
      ],
    };
  }

  // One pair.
  if (pairs.length === 1) {
    const pairRank = pairs[0];
    const pairCards = cards.filter((c) => c.rank === pairRank).slice(0, 2);
    const kickers = sortDescending(
      cards.filter((c) => c.rank !== pairRank),
      (c) => c.rank,
    ).slice(0, 3);
    const bestFive = [...pairCards, ...kickers];
    return {
      category: "one_pair",
      bestFive,
      score: [
        HAND_CATEGORY_SCORE.one_pair,
        pairRank,
        kickers[0]?.rank ?? 0,
        kickers[1]?.rank ?? 0,
        kickers[2]?.rank ?? 0,
      ],
    };
  }

  // High card.
  const sorted = sortDescending(cards, (c) => c.rank).slice(0, 5);
  const highRanks = sorted.map((c) => c.rank);
  return {
    category: "high_card",
    bestFive: sorted,
    score: [HAND_CATEGORY_SCORE.high_card, ...highRanks],
  };
}

export function compareHands(a: EvaluatedHand, b: EvaluatedHand): -1 | 0 | 1 {
  const len = Math.max(a.score.length, b.score.length);
  for (let i = 0; i < len; i += 1) {
    const av = a.score[i] ?? 0;
    const bv = b.score[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

