/*
Responsibilities of this file:
1. Create a 52-card deck
2. Shuffle it correctly
3. Draw cards from the deck
*/

import { Card, Rank, Suit } from "./types"

/*
Create a standard 52-card deck in a deterministic order.
Function returns an array of Card objects.
Ex: [
 { rank: Rank.Two, suit: Suit.Clubs },
 { rank: Rank.Three, suit: Suit.Clubs },
 ...
]
*/
export function createFullDeck(): Card[] {
  const suits: Suit[] = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]
  const ranks: Rank[] = [
    Rank.Two,
    Rank.Three,
    Rank.Four,
    Rank.Five,
    Rank.Six,
    Rank.Seven,
    Rank.Eight,
    Rank.Nine,
    Rank.Ten,
    Rank.Jack,
    Rank.Queen,
    Rank.King,
    Rank.Ace,
  ]

  const deck: Card[] = []

  // loop will run 4 times (once per suit), and 13 ranks per suit
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit })
    }
  }

  return deck
}

// Shuffle the deck IN PLACE (mutates the input array).
// Uses the modern Fisher–Yates / Knuth shuffle.
export function shuffleInPlace(cards: Card[]): void {
  // optional check - just in case
  if (cards.length <= 1) return

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
}

// Convenience helper: creates a fresh deck and returns a shuffled copy.
// (More predictable / testable than relying on mutation at call sites.)
export function newShuffledDeck(): Card[] {
  const deck = createFullDeck()
  shuffleInPlace(deck)
  return deck
}

// Draw a single card from the deck (removes it from the deck).
export function drawCard(deck: Card[]): Card {
  if (deck.length === 0) {
    throw new Error("Cannot draw from an empty deck")
  }

  const card = deck.pop()

  if (!card) {
    throw new Error("Unexpected undefined card draw")
  }

  return card
}

// Draw N cards from the deck (in order of drawing), removing them from the deck.
export function drawCards(deck: Card[], n: number): Card[] {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`drawCards: n must be a non-negative integer, got ${n}`)
  }
  if (deck.length < n) {
    throw new Error(`Cannot draw ${n} cards from a deck of size ${deck.length}`)
  }

  const cards: Card[] = []
  for (let k = 0; k < n; k++) {
    cards.push(drawCard(deck))
  }
  return cards
}