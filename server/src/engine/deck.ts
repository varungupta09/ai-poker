import { Card, Rank, Suit } from "./types";

const SUITS: Suit[] = ["h", "d", "c", "s"];

const RANKS: Rank[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, // J
  12, // Q
  13, // K
  14, // A
];

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

