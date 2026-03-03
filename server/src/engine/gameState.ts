import {
  Action,
  Chips,
  GameConfig,
  GameState,
  PlayerId,
  PlayerState,
  Pot,
  SeatId,
  Street,
} from "./types";
import { makeDeck, shuffle } from "./deck";
import { compareHands, evaluateBestHand } from "./handEvaluator";

function cloneState(state: GameState): GameState {
  return {
    ...state,
    deck: [...state.deck],
    board: [...state.board],
    players: state.players.map((p) => ({ ...p, holeCards: [...p.holeCards] })),
    pots: state.pots.map((p) => ({ amount: p.amount, eligibleSeatIds: [...p.eligibleSeatIds] })),
    handHistory: [...state.handHistory],
    actedThisRound: { ...state.actedThisRound },
  };
}

function nextSeatId(state: GameState, from: SeatId): SeatId | null {
  const seats = state.players.map((p) => p.seat).sort((a, b) => a - b);
  if (seats.length === 0) return null;
  const idx = seats.indexOf(from);
  const ordered = idx >= 0 ? [...seats.slice(idx + 1), ...seats.slice(0, idx + 1)] : seats;
  for (const seat of ordered) {
    const player = state.players.find((p) => p.seat === seat);
    if (!player) continue;
    if (!player.hasFolded && !player.isAllIn && player.stack > 0) {
      return seat;
    }
  }
  return null;
}

function getPlayer(state: GameState, seat: SeatId): PlayerState {
  const p = state.players.find((pl) => pl.seat === seat);
  if (!p) throw new Error(`No player at seat ${seat}`);
  return p;
}

function activePlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.hasFolded);
}

function activeNonAllIn(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.hasFolded && !p.isAllIn && p.stack > 0);
}

function currentMaxBet(state: GameState): Chips {
  return state.players.reduce((max, p) => (p.bet > max ? p.bet : max), 0);
}

function recomputePots(players: PlayerState[]): Pot[] {
  const contributions = players
    .map((p) => ({ seat: p.seat, committed: p.totalCommitted }))
    .filter((c) => c.committed > 0);
  if (contributions.length === 0) return [];

  contributions.sort((a, b) => a.committed - b.committed);
  const distinctLevels: Chips[] = [];
  for (const c of contributions) {
    if (!distinctLevels.includes(c.committed)) distinctLevels.push(c.committed);
  }

  const pots: Pot[] = [];
  let prevLevel = 0;
  for (const level of distinctLevels) {
    const eligible = contributions.filter((c) => c.committed >= level).map((c) => c.seat);
    const layerAmount = (level - prevLevel) * eligible.length;
    if (layerAmount > 0) {
      const existing = pots[pots.length - 1];
      if (existing && JSON.stringify(existing.eligibleSeatIds.sort()) === JSON.stringify(eligible.slice().sort())) {
        existing.amount += layerAmount;
      } else {
        pots.push({ amount: layerAmount, eligibleSeatIds: eligible });
      }
      prevLevel = level;
    }
  }
  return pots;
}

function contribute(state: GameState, seat: SeatId, amount: Chips): void {
  const player = getPlayer(state, seat);
  if (amount <= 0) return;
  if (amount > player.stack) {
    throw new Error("Cannot contribute more than stack");
  }
  player.stack -= amount;
  player.bet += amount;
  player.totalCommitted += amount;
  if (player.stack === 0) {
    player.isAllIn = true;
  }
  state.pots = recomputePots(state.players);
}

function resetBetsForNewStreet(state: GameState): void {
  for (const p of state.players) {
    p.bet = 0;
  }
  state.actedThisRound = {};
  state.lastAggressorSeat = null;
  state.minRaiseTo = null;
  state.lastRaiseSize = null;
}

function allNonAllInHaveActedAndMatched(state: GameState): boolean {
  const candidates = activeNonAllIn(state);
  if (candidates.length === 0) return true;
  const maxBet = currentMaxBet(state);
  for (const p of candidates) {
    if (!state.actedThisRound[p.seat]) return false;
    if (p.bet !== maxBet) return false;
  }
  return true;
}

function advanceStreet(state: GameState): void {
  if (state.isHandOver) return;
  const streets: Street[] = ["preflop", "flop", "turn", "river", "showdown"];
  const idx = streets.indexOf(state.street);
  const next = streets[Math.min(idx + 1, streets.length - 1)];
  state.street = next;
  resetBetsForNewStreet(state);

  if (next === "flop") {
    state.deck.shift();
    state.board.push(state.deck.shift() as any);
    state.board.push(state.deck.shift() as any);
    state.board.push(state.deck.shift() as any);
  } else if (next === "turn" || next === "river") {
    state.deck.shift();
    state.board.push(state.deck.shift() as any);
  }

  if (next === "showdown") {
    state.toActSeat = null;
    resolveShowdown(state);
  } else {
    const btn = state.buttonSeat;
    const candidates = state.players
      .map((p) => p.seat)
      .sort((a, b) => a - b);
    const startSeat = next === "preflop"
      ? getBlindSeats(state).bigBlindSeat
      : btn;
    const first = nextSeatId(state, startSeat);
    state.toActSeat = first;
    state.streetStartSeat = first;
  }
}

function getBlindSeats(state: GameState): { smallBlindSeat: SeatId; bigBlindSeat: SeatId } {
  const seats = state.players.map((p) => p.seat).sort((a, b) => a - b);
  const btnIdx = seats.indexOf(state.buttonSeat);
  const sbSeat = seats[(btnIdx + 1) % seats.length];
  const bbSeat = seats[(btnIdx + 2) % seats.length];
  return { smallBlindSeat: sbSeat, bigBlindSeat: bbSeat };
}

function awardUncontested(state: GameState): void {
  const remaining = activePlayers(state);
  if (remaining.length !== 1) return;
  const winner = remaining[0];
  const totalPot = state.pots.reduce((sum, p) => sum + p.amount, 0);
  winner.stack += totalPot;
  state.pots = [];
  state.isHandOver = true;
  state.toActSeat = null;
}

function resolveShowdown(state: GameState): void {
  const livePlayers = activePlayers(state);
  if (livePlayers.length === 0) {
    state.isHandOver = true;
    return;
  }

  for (const pot of state.pots) {
    const contenders = livePlayers.filter((p) => pot.eligibleSeatIds.includes(p.seat));
    if (contenders.length === 0) continue;

    const hands = contenders.map((p) => ({
      player: p,
      hand: evaluateBestHand(p.holeCards, state.board),
    }));

    let best = hands[0];
    const winners = [best];
    for (let i = 1; i < hands.length; i += 1) {
      const comp = compareHands(hands[i].hand, best.hand);
      if (comp > 0) {
        best = hands[i];
        winners.length = 0;
        winners.push(hands[i]);
      } else if (comp === 0) {
        winners.push(hands[i]);
      }
    }

    const share = Math.floor(pot.amount / winners.length);
    let remainder = pot.amount - share * winners.length;
    for (const w of winners) {
      w.player.stack += share;
      if (remainder > 0) {
        w.player.stack += 1;
        remainder -= 1;
      }
    }
  }

  state.pots = [];
  state.isHandOver = true;
}

export function initHand(
  id: string,
  config: GameConfig,
  players: { id: PlayerId; seat: SeatId; stack: Chips }[],
  buttonSeat: SeatId,
  handId: number,
): GameState {
  const deck = shuffle(makeDeck());
  const playerStates: PlayerState[] = players.map((p) => ({
    id: p.id,
    seat: p.seat,
    stack: p.stack,
    bet: 0,
    totalCommitted: 0,
    hasFolded: false,
    isAllIn: p.stack === 0,
    holeCards: [],
  }));

  // Deal 2 hole cards to each player from the top of the deck.
  let deckIdx = 0;
  for (const ps of playerStates) {
    ps.holeCards = [deck[deckIdx]!, deck[deckIdx + 1]!];
    deckIdx += 2;
  }

  const state: GameState = {
    id,
    config,
    buttonSeat,
    street: "preflop",
    deck: deck.slice(deckIdx),
    board: [],
    players: playerStates,
    pots: [],
    toActSeat: null,
    lastAggressorSeat: null,
    minRaiseTo: null,
    lastRaiseSize: null,
    actedThisRound: {},
    streetStartSeat: null,
    handId,
    handHistory: [],
    isHandOver: false,
  };

  const { smallBlindSeat, bigBlindSeat } = getBlindSeats(state);
  contribute(state, smallBlindSeat, config.smallBlind);
  state.handHistory.push({
    street: "blinds",
    seat: smallBlindSeat,
    action: "post_small_blind",
    amount: config.smallBlind,
  });

  contribute(state, bigBlindSeat, config.bigBlind);
  state.handHistory.push({
    street: "blinds",
    seat: bigBlindSeat,
    action: "post_big_blind",
    amount: config.bigBlind,
  });

  const firstToAct = nextSeatId(state, bigBlindSeat);
  state.toActSeat = firstToAct;
  state.streetStartSeat = firstToAct;
  state.lastAggressorSeat = bigBlindSeat;
  state.minRaiseTo = config.bigBlind * 2;
  state.lastRaiseSize = config.bigBlind;

  return state;
}

export function applyAction(state: GameState, seat: SeatId, action: Action): GameState {
  if (state.isHandOver) {
    throw new Error("Hand is already over");
  }
  if (state.toActSeat === null) {
    throw new Error("No player is scheduled to act");
  }
  if (seat !== state.toActSeat) {
    throw new Error("It is not this player's turn");
  }

  const next = cloneState(state);
  const player = getPlayer(next, seat);
  if (player.hasFolded || player.isAllIn || player.stack < 0) {
    throw new Error("Player cannot act in current state");
  }

  const maxBet = currentMaxBet(next);

  const recordHistory = (type: Action["type"], amount: Chips) => {
    next.handHistory.push({
      street: next.street,
      seat,
      action: type,
      amount,
    });
  };

  if (action.type === "fold") {
    player.hasFolded = true;
    player.bet = 0;
    next.actedThisRound[seat] = true;
    recordHistory("fold", 0);
  } else if (action.type === "check") {
    if (player.bet !== maxBet) {
      throw new Error("Cannot check facing a bet");
    }
    next.actedThisRound[seat] = true;
    recordHistory("check", 0);
  } else if (action.type === "call") {
    const toCall = maxBet - player.bet;
    if (toCall <= 0) {
      next.actedThisRound[seat] = true;
      recordHistory("check", 0);
    } else {
      contribute(next, seat, Math.min(toCall, player.stack));
      next.actedThisRound[seat] = true;
      recordHistory("call", toCall);
    }
  } else if (action.type === "bet" || action.type === "raise") {
    if (action.amount == null || action.amount <= 0) {
      throw new Error("Bet/raise amount must be positive");
    }
    const targetBet = action.amount;
    if (targetBet <= player.bet) {
      throw new Error("New bet must be greater than current bet");
    }
    if (targetBet > player.bet + player.stack) {
      throw new Error("Bet exceeds stack");
    }

    if (action.type === "bet" && maxBet > 0) {
      throw new Error("Cannot bet when a bet is already present; must raise");
    }
    if (action.type === "raise" && maxBet === 0) {
      throw new Error("Cannot raise without an existing bet; must bet");
    }

    const extra = targetBet - player.bet;
    const previousMaxBet = maxBet;

    contribute(next, seat, extra);
    next.lastAggressorSeat = seat;
    next.actedThisRound[seat] = true;

    const raiseSize = targetBet - previousMaxBet;
    const requiredMinRaise = next.lastRaiseSize ?? next.config.bigBlind;
    if (extra < requiredMinRaise && player.stack > 0) {
      throw new Error("Raise size below minimum");
    }

    next.minRaiseTo = previousMaxBet + raiseSize * 2;
    next.lastRaiseSize = raiseSize;
    recordHistory(action.type, extra);
  } else {
    throw new Error(`Unsupported action type: ${action.type as string}`);
  }

  const remainingActive = activePlayers(next);
  if (remainingActive.length === 1) {
    awardUncontested(next);
    return next;
  }

  if (allNonAllInHaveActedAndMatched(next)) {
    advanceStreet(next);
  } else {
    const from = seat;
    const nxt = nextSeatId(next, from);
    next.toActSeat = nxt;
  }

  return next;
}

