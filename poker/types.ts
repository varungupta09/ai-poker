/*
This file defines the fundamental building blocks of the game.
every file will import this.
*/

export enum Suit {
  Clubs = "c",
  Diamonds = "d",
  Hearts = "h",
  Spades = "s"
}

export enum Rank {
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
  Ace = 14
}

// Represents a single playing card (e.g., Ace of Spades)
export interface Card {
  rank: Rank
  suit: Suit
}

// Hand categories from weakest to strongest
export enum HandRank {
  HighCard = 1,
  OnePair = 2,
  TwoPair = 3,
  ThreeOfAKind = 4,
  Straight = 5,
  Flush = 6,
  FullHouse = 7,
  FourOfAKind = 8,
  StraightFlush = 9,
}

export interface EvaluatedHand {
  rank: HandRank
  // Lexicographic tie breakers (highest first). Example: for TwoPair Aces+Kings with 9 kicker => [14, 13, 9]
  tiebreakers: Rank[]
  // The 5 cards that form the best hand (for showing the winner)
  bestFive: Card[]
}