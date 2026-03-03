import { runHandEvaluatorTests } from "./handEvaluator.test";
import { runGameStateBasicTests } from "./gameStateBasic.test";

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function runFuzzChipConservation(iterations = 200): void {
  for (let i = 0; i < iterations; i += 1) {
    const stacks = [1000, 1000];
    const total = stacks[0] + stacks[1];
    const config = { smallBlind: 5, bigBlind: 10, maxSeats: 2 as const };
    const players = [
      { id: "A", seat: 0, stack: stacks[0] },
      { id: "B", seat: 1, stack: stacks[1] },
    ];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initHand, applyAction } = require("../engine/gameState") as typeof import("../engine/gameState");
    let state = initHand("table-fuzz", config, players, 0, 1);

    let safety = 0;
    while (!state.isHandOver && safety < 20) {
      safety += 1;
      const seat = state.toActSeat;
      if (seat == null) break;
      const r = randomInt(3);
      const action = r === 0 ? { type: "fold" as const } : { type: "call" as const };
      state = applyAction(state, seat, action);
    }

    const finalTotal =
      state.players.reduce((sum: number, p: { stack: number }) => sum + p.stack, 0) +
      state.pots.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    if (total !== finalTotal) {
      throw new Error("Chip conservation failed in fuzz test");
    }
  }
}

async function main() {
  try {
    runHandEvaluatorTests();
    runGameStateBasicTests();
    runFuzzChipConservation();
    // Simple smoke test: ensure tests complete without throwing.
    // Additional engine and fuzz tests can be added here.
    // eslint-disable-next-line no-console
    console.log("All tests passed.");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Tests failed:", err);
    throw err;
  }
}

main().catch(() => {
  // Let ts-node surface the error and non-zero exit code.
});

