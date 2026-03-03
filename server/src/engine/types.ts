export type Suit = "h" | "d" | "c" | "s";

// We use numeric ranks internally for easier comparison.
// 2–14 where 14 = Ace.
export type Rank =
  | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 // J
  | 12 // Q
  | 13 // K
  | 14; // A

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type SeatId = number;
export type PlayerId = string;
export type Chips = number;

export type ActionType = "fold" | "check" | "call" | "bet" | "raise";

export interface Action {
  type: ActionType;
  amount?: Chips; // required for bet/raise, ignored otherwise
}

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown";

export interface PlayerState {
  id: PlayerId;
  seat: SeatId;
  stack: Chips;
  bet: Chips; // chips committed in the current betting round
  totalCommitted: Chips; // total committed this hand across all streets
  hasFolded: boolean;
  isAllIn: boolean;
  holeCards: Card[];
}

export interface Pot {
  amount: Chips;
  eligibleSeatIds: SeatId[];
}

export interface GameConfig {
  smallBlind: Chips;
  bigBlind: Chips;
  maxSeats: number;
}

export interface HandHistoryEntry {
  street: Street | "blinds" | "init";
  seat: SeatId | null;
  action: ActionType | "post_small_blind" | "post_big_blind";
  amount: Chips;
}

export interface GameState {
  id: string;
  config: GameConfig;
  buttonSeat: SeatId;
  street: Street;
  deck: Card[];
  board: Card[];
  players: PlayerState[];
  pots: Pot[];
  toActSeat: SeatId | null;
  lastAggressorSeat: SeatId | null;
  minRaiseTo: Chips | null;
   lastRaiseSize: Chips | null;
   actedThisRound: Record<SeatId, boolean>;
   streetStartSeat: SeatId | null;
  handId: number;
  handHistory: HandHistoryEntry[];
  isHandOver: boolean;
}

export interface EvaluatedHand {
  category: HandCategory;
  // Lexicographically comparable score; higher is better.
  score: number[];
  bestFive: Card[];
}

export type HandCategory =
  | "high_card"
  | "one_pair"
  | "two_pair"
  | "three_of_a_kind"
  | "straight"
  | "flush"
  | "full_house"
  | "four_of_a_kind"
  | "straight_flush"
  | "royal_flush";

export interface PublicPlayerView {
  id: PlayerId;
  seat: SeatId;
  stack: Chips;
  bet: Chips;
  hasFolded: boolean;
  isAllIn: boolean;
  holeCards?: Card[];
}

export interface PublicGameState {
  id: string;
  buttonSeat: SeatId;
  street: Street;
  board: Card[];
  pots: Pot[];
  toActSeat: SeatId | null;
  players: PublicPlayerView[];
  handId: number;
  isHandOver: boolean;
}

