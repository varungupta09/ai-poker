import { v4 as uuidv4 } from "uuid";
import {
  Action,
  Chips,
  GameConfig,
  GameState,
  PlayerId,
  PublicGameState,
  SeatId,
} from "./types";
import { initHand, applyAction } from "./gameState";

interface Table {
  id: string;
  config: GameConfig;
  players: { id: PlayerId; seat: SeatId; stack: Chips }[];
  buttonSeat: SeatId;
  nextHandId: number;
  currentState: GameState | null;
}

const tables = new Map<string, Table>();

export function createTable(config: GameConfig): Table {
  const id = uuidv4();
  const table: Table = {
    id,
    config,
    players: [],
    buttonSeat: 0,
    nextHandId: 1,
    currentState: null,
  };
  tables.set(id, table);
  return table;
}

export function getTable(id: string): Table | undefined {
  return tables.get(id);
}

export function joinTable(tableId: string, playerId: PlayerId, stack: Chips): Table {
  const table = tables.get(tableId);
  if (!table) throw new Error("Table not found");
  if (table.players.length >= table.config.maxSeats) {
    throw new Error("Table is full");
  }
  const existing = table.players.find((p) => p.id === playerId);
  if (existing) {
    throw new Error("Player already seated at table");
  }
  const occupiedSeats = table.players.map((p) => p.seat).sort((a, b) => a - b);
  let seat = 0;
  while (occupiedSeats.includes(seat)) {
    seat += 1;
  }
  table.players.push({ id: playerId, seat, stack });
  return table;
}

export function startHand(tableId: string): GameState {
  const table = tables.get(tableId);
  if (!table) throw new Error("Table not found");
  if (table.players.length < 2) {
    throw new Error("Need at least two players to start a hand");
  }
  const state = initHand(
    table.id,
    table.config,
    table.players,
    table.buttonSeat,
    table.nextHandId,
  );
  table.currentState = state;
  table.buttonSeat = (table.buttonSeat + 1) % table.players.length;
  table.nextHandId += 1;
  return state;
}

export function applyTableAction(tableId: string, seat: SeatId, action: Action): GameState {
  const table = tables.get(tableId);
  if (!table) throw new Error("Table not found");
  if (!table.currentState) throw new Error("No active hand");
  const next = applyAction(table.currentState, seat, action);
  table.currentState = next;
  return next;
}

export function getPublicState(tableId: string): PublicGameState | null {
  const table = tables.get(tableId);
  if (!table || !table.currentState) return null;
  const state = table.currentState;
  return {
    id: state.id,
    buttonSeat: state.buttonSeat,
    street: state.street,
    board: state.board,
    pots: state.pots,
    toActSeat: state.toActSeat,
    players: state.players.map((p) => ({
      id: p.id,
      seat: p.seat,
      stack: p.stack,
      bet: p.bet,
      hasFolded: p.hasFolded,
      isAllIn: p.isAllIn,
      holeCards: p.holeCards,
    })),
    handId: state.handId,
    isHandOver: state.isHandOver,
  };
}

