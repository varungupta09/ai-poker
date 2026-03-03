import { Card, Rank } from "../engine/types";
import { evaluateBestHand, compareHands } from "../engine/handEvaluator";

function card(rank: Rank, suit: "h" | "d" | "c" | "s"): Card {
  return { rank, suit };
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

export function runHandEvaluatorTests(): void {
  // High card vs one pair.
  const board1 = [card(2, "h"), card(7, "d"), card(9, "c"), card(11, "s"), card(4, "h")];
  const aHigh = evaluateBestHand([card(14, "h"), card(8, "d")], board1);
  const bPair = evaluateBestHand([card(7, "c"), card(3, "d")], board1);
  assert(aHigh.category === "high_card", "Expected high card for A-high hand");
  assert(bPair.category === "one_pair", "Expected one pair for 7x hand");
  assert(compareHands(bPair, aHigh) === 1, "One pair should beat high card");

  // Flush.
  const board2 = [card(2, "h"), card(6, "h"), card(9, "h"), card(13, "h"), card(4, "c")];
  const flushHand = evaluateBestHand([card(10, "h"), card(3, "d")], board2);
  assert(flushHand.category === "flush", "Expected flush category");

  // Full house vs flush.
  const board3 = [card(2, "h"), card(2, "d"), card(9, "c"), card(9, "d"), card(4, "s")];
  const fullHouse = evaluateBestHand([card(9, "h"), card(3, "c")], board3);
  const weakerFlush = evaluateBestHand([card(10, "h"), card(6, "h")], [
    card(2, "h"), card(5, "h"), card(9, "h"), card(12, "h"), card(4, "c"),
  ]);
  assert(fullHouse.category === "full_house", "Expected full house");
  assert(compareHands(fullHouse, weakerFlush) === 1, "Full house should beat flush");

  // Straight detection including wheel (A-2-3-4-5).
  const wheelBoard = [card(14, "d"), card(2, "c"), card(3, "h"), card(4, "s"), card(9, "d")];
  const wheelHand = evaluateBestHand([card(5, "c"), card(8, "h")], wheelBoard);
  assert(wheelHand.category === "straight", "Expected straight (wheel)");

  // Straight flush vs four of a kind.
  const sfBoard = [card(10, "h"), card(11, "h"), card(12, "h"), card(13, "h"), card(2, "c")];
  const straightFlush = evaluateBestHand([card(9, "h"), card(3, "d")], sfBoard);
  const quadsBoard = [card(7, "h"), card(7, "d"), card(7, "c"), card(7, "s"), card(2, "h")];
  const quadsHand = evaluateBestHand([card(5, "d"), card(9, "c")], quadsBoard);
  assert(straightFlush.category === "straight_flush" || straightFlush.category === "royal_flush", "Expected straight flush");
  assert(quadsHand.category === "four_of_a_kind", "Expected four of a kind");
  assert(compareHands(straightFlush, quadsHand) === 1, "Straight flush should beat four of a kind");
}

