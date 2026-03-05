import { callAmount, minRaiseTo, maxRaiseTo, allInReopensAction, buildPots } from "../betting"
import { PlayerState } from "../gameTypes"

let passed = 0, failed = 0
function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) { console.log(`✓ ${label}`, extra ?? ""); passed++ }
  else { console.error(`✗ ${label}`, extra ?? ""); failed++ }
}

// Helper: build a minimal PlayerState for testing
function makePlayer(stack: number, betThisStreet = 0): PlayerState {
  return {
    id: "p",
    seatIndex: 0,
    stack,
    holeCards: [],
    betThisStreet,
    hasFolded: false,
    isAllIn: false,
  }
}

// ── callAmount ─────────────────────────────────────────────────────────────────
check("callAmount: normal call", callAmount(makePlayer(1000, 0), 100) === 100)
check("callAmount: already put in some", callAmount(makePlayer(900, 100), 300) === 200)
check("callAmount: all-in cap", callAmount(makePlayer(50, 0), 200) === 50)
check("callAmount: already matched current bet", callAmount(makePlayer(900, 100), 100) === 0)
check("callAmount: zero currentBet = 0 owed", callAmount(makePlayer(500, 0), 0) === 0)

// ── minRaiseTo ─────────────────────────────────────────────────────────────────
check("minRaiseTo: first raise from BB (100 + 100 = 200)", minRaiseTo(100, 100) === 200)
check("minRaiseTo: re-raise (300 + 200 = 500)", minRaiseTo(300, 200) === 500)
check("minRaiseTo: raise after limp (0 + 100 = 100 not applicable; bet case)", minRaiseTo(0, 100) === 100)

// ── maxRaiseTo ─────────────────────────────────────────────────────────────────
check("maxRaiseTo: full stack, nothing committed", maxRaiseTo(makePlayer(1000, 0)) === 1000)
check("maxRaiseTo: stack + already committed", maxRaiseTo(makePlayer(700, 300)) === 1000)
check("maxRaiseTo: all-in player with 0 stack", maxRaiseTo(makePlayer(0, 200)) === 200)

// ── allInReopensAction ─────────────────────────────────────────────────────────
// currentBet=200, lastRaiseSize=200 → fullRaiseTo=400
check("allInReopensAction: full raise reopens", allInReopensAction(400, 200, 200) === true)
check("allInReopensAction: partial all-in does NOT reopen", allInReopensAction(350, 200, 200) === false)
check("allInReopensAction: exactly fullRaiseTo reopens", allInReopensAction(400, 200, 200) === true)
check("allInReopensAction: one chip short does NOT reopen", allInReopensAction(399, 200, 200) === false)

// ── buildPots ──────────────────────────────────────────────────────────────────

// Simple: 3 players all put in the same amount — one main pot, all eligible
{
  const committed = new Map([["alice", 200], ["bob", 200], ["carol", 200]])
  const pots = buildPots(committed, new Set())
  check("buildPots: equal commitments → 1 pot", pots.length === 1, pots)
  check("buildPots: correct total", pots[0].amount === 600)
  check("buildPots: all 3 eligible", pots[0].eligiblePlayerIds.length === 3)
}

// One player folded — they contribute but aren't eligible
{
  const committed = new Map([["alice", 200], ["bob", 200], ["carol", 200]])
  const pots = buildPots(committed, new Set(["carol"]))
  check("buildPots: folded player ineligible", !pots[0].eligiblePlayerIds.includes("carol"))
  check("buildPots: folded player still contributes to total", pots[0].amount === 600)
  check("buildPots: only 2 eligible", pots[0].eligiblePlayerIds.length === 2)
}

// Classic all-in side-pot: alice all-in for 100, bob and carol commit 300
// Main pot: 100×3 = 300 (all eligible)
// Side pot: 200×2 = 400 (bob + carol only)
{
  const committed = new Map([["alice", 100], ["bob", 300], ["carol", 300]])
  const pots = buildPots(committed, new Set())
  check("buildPots: 2 pots when one player all-in short", pots.length === 2, pots)
  check("buildPots: main pot = 300", pots[0].amount === 300)
  check("buildPots: main pot: all 3 eligible", pots[0].eligiblePlayerIds.length === 3)
  check("buildPots: side pot = 400", pots[1].amount === 400)
  check("buildPots: side pot: only bob + carol", pots[1].eligiblePlayerIds.length === 2)
  check("buildPots: alice NOT in side pot", !pots[1].eligiblePlayerIds.includes("alice"))
}

// Two all-ins at different levels: alice=50, bob=150, carol=300
// Pot 1: 50×3=150 (all 3)
// Pot 2: 100×2=200 (bob + carol)
// Pot 3: 150×1=150 (carol only)
{
  const committed = new Map([["alice", 50], ["bob", 150], ["carol", 300]])
  const pots = buildPots(committed, new Set())
  check("buildPots: 3 pots for 3 different all-in levels", pots.length === 3, pots)
  check("buildPots: [3-level] pot 1 = 150", pots[0].amount === 150)
  check("buildPots: [3-level] pot 2 = 200", pots[1].amount === 200)
  check("buildPots: [3-level] pot 3 = 150", pots[2].amount === 150)
  check("buildPots: [3-level] pot 1 all eligible", pots[0].eligiblePlayerIds.length === 3)
  check("buildPots: [3-level] pot 2: bob+carol", pots[1].eligiblePlayerIds.length === 2)
  check("buildPots: [3-level] pot 3: carol only", pots[2].eligiblePlayerIds.length === 1 && pots[2].eligiblePlayerIds[0] === "carol")
}

// Fold into a side pot: alice=100, bob=200 (fold), carol=200
// alice all-in at 100; bob folded; carol the only remaining player for side pot
{
  const committed = new Map([["alice", 100], ["bob", 200], ["carol", 200]])
  const pots = buildPots(committed, new Set(["bob"]))
  check("buildPots: folded player contributes to both levels", pots[0].amount + (pots[1]?.amount ?? 0) === 500)
  check("buildPots: folded bob not eligible anywhere", pots.every(p => !p.eligiblePlayerIds.includes("bob")))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
