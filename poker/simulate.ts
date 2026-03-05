/*
  poker/simulate.ts
  Runs N hands with random/call agents and asserts engine correctness.

  Key invariant checked every hand:
    chips_in_at_start === chips_distributed_to_winners

  Run:
    npx ts-node --project poker/tsconfig.json poker/simulate.ts
*/

import { RandomAgent, CallAgent } from "./agent"
import { runHand, setAgentStack, getAgentStack } from "./runHand"
import { TableConfig } from "./gameTypes"

const N_HANDS   = 2000
const BUY_IN    = 1_000
const CONFIG: TableConfig = { smallBlind: 10, bigBlind: 20 }

// ── Setup agents ──────────────────────────────────────────────────────────────
const agents = [
  new RandomAgent("random-1"),
  new RandomAgent("random-2"),
  new CallAgent("caller-1"),
  new RandomAgent("random-3"),
]

for (const a of agents) setAgentStack(a, BUY_IN)

// ── Stats ─────────────────────────────────────────────────────────────────────
let handsPlayed   = 0
let errors        = 0
let chipErrors    = 0
let showdowns     = 0
let uncontested   = 0

for (let i = 0; i < N_HANDS; i++) {
  // Re-buy any busted agents so we can keep running
  for (const a of agents) {
    if (getAgentStack(a) < CONFIG.bigBlind * 2) setAgentStack(a, BUY_IN)
  }

  const dealerIndex = i % agents.length
  const chipsAtStart = agents.reduce((sum, a) => sum + getAgentStack(a), 0)

  let result
  try {
    result = runHand(agents, { dealerIndex, config: CONFIG })
    handsPlayed++
  } catch (e) {
    console.error(`Hand ${i} ERRORED:`, (e as Error).message)
    errors++
    // Restore stacks to avoid cascading corruption
    for (const a of agents) setAgentStack(a, BUY_IN)
    continue
  }

  // runHand already credits winnings; check total chips are conserved
  const chipsAfter = agents.reduce((sum, a) => sum + getAgentStack(a), 0)
  if (chipsAfter !== chipsAtStart) {
    console.error(
      `Hand ${i} CHIP LEAK: started=${chipsAtStart} ended=${chipsAfter} diff=${chipsAfter - chipsAtStart}`,
      result.winners,
    )
    chipErrors++
  }

  const isShowdown = result.winners.some(w => w.handDescription !== "Uncontested")
  if (isShowdown) showdowns++
  else uncontested++
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log("─────────────────────────────────")
console.log(`Hands played : ${handsPlayed} / ${N_HANDS}`)
console.log(`Errors       : ${errors}`)
console.log(`Chip errors  : ${chipErrors}`)
console.log(`Showdowns    : ${showdowns}`)
console.log(`Uncontested  : ${uncontested}`)
console.log("─────────────────────────────────")

const allOk = errors === 0 && chipErrors === 0
console.log(allOk ? "✓ All good." : "✗ Failures detected — see above.")
process.exit(allOk ? 0 : 1)
