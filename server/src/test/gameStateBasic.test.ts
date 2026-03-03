import { initHand, applyAction } from "../engine/gameState";
import { GameConfig, PlayerId } from "../engine/types";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

export function runGameStateBasicTests(): void {
  const config: GameConfig = { smallBlind: 5, bigBlind: 10, maxSeats: 6 };
  const players = [
    { id: "A" as PlayerId, seat: 0, stack: 1000 },
    { id: "B" as PlayerId, seat: 1, stack: 1000 },
  ];

  let state = initHand("table-1", config, players, 0, 1);
  const totalChipsBefore = state.players.reduce((sum, p) => sum + p.stack, 0)
    + state.pots.reduce((sum, p) => sum + p.amount, 0);

  // One player folds preflop, other should win blinds.
  const toAct = state.toActSeat;
  if (toAct == null) throw new Error("Expected someone to act");
  state = applyAction(state, toAct, { type: "fold" });

  assert(state.isHandOver, "Hand should be over after fold in heads-up");
  const totalChipsAfter = state.players.reduce((sum, p) => sum + p.stack, 0)
    + state.pots.reduce((sum, p) => sum + p.amount, 0);
  assert(totalChipsBefore === totalChipsAfter, "Total chips should be conserved");
}

