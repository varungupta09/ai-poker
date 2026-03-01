/**
 * mockHistorySeed.js — Pre-seeded match history for the active agent.
 * Most recent match first.
 */

const now = Date.now();
const hr  = 3_600_000;
const day = 86_400_000;

export const historySeed = [
  {
    matchId:      "match-seed-01",
    opponentName: "GTOMaster",
    opponentId:   "gtomaster",
    outcome:      "win",
    eloDelta:     +22,
    timestamp:    now - hr * 2,
    replayRef:    "match-seed-01",
    stats: { handsPlayed: 20, handsWon: 13, vpip: 42, aggression: 68, avgPot: 187, biggestPot: 410 },
  },
  {
    matchId:      "match-seed-02",
    opponentName: "BluffMachine",
    opponentId:   "bluffmachine",
    outcome:      "loss",
    eloDelta:     -18,
    timestamp:    now - hr * 5,
    replayRef:    "match-seed-02",
    stats: { handsPlayed: 20, handsWon: 8,  vpip: 38, aggression: 54, avgPot: 210, biggestPot: 520 },
  },
  {
    matchId:      "match-seed-03",
    opponentName: "RiverRat",
    opponentId:   "riverrat",
    outcome:      "win",
    eloDelta:     +19,
    timestamp:    now - hr * 11,
    replayRef:    "match-seed-03",
    stats: { handsPlayed: 20, handsWon: 12, vpip: 45, aggression: 72, avgPot: 198, biggestPot: 480 },
  },
  {
    matchId:      "match-seed-04",
    opponentName: "CardShark Elite",
    opponentId:   "cardshark",
    outcome:      "loss",
    eloDelta:     -21,
    timestamp:    now - day,
    replayRef:    "match-seed-04",
    stats: { handsPlayed: 20, handsWon: 9,  vpip: 36, aggression: 50, avgPot: 225, biggestPot: 600 },
  },
  {
    matchId:      "match-seed-05",
    opponentName: "FlopWhiz",
    opponentId:   "flopwhiz",
    outcome:      "win",
    eloDelta:     +16,
    timestamp:    now - day - hr * 3,
    replayRef:    "match-seed-05",
    stats: { handsPlayed: 20, handsWon: 14, vpip: 48, aggression: 60, avgPot: 178, biggestPot: 390 },
  },
  {
    matchId:      "match-seed-06",
    opponentName: "TurboBet v1.2",
    opponentId:   "turbobet",
    outcome:      "win",
    eloDelta:     +14,
    timestamp:    now - day * 2,
    replayRef:    "match-seed-06",
    stats: { handsPlayed: 20, handsWon: 12, vpip: 40, aggression: 65, avgPot: 200, biggestPot: 450 },
  },
  {
    matchId:      "match-seed-07",
    opponentName: "RazorSharp",
    opponentId:   "razorsharp",
    outcome:      "loss",
    eloDelta:     -24,
    timestamp:    now - day * 2 - hr * 6,
    replayRef:    "match-seed-07",
    stats: { handsPlayed: 20, handsWon: 7,  vpip: 33, aggression: 44, avgPot: 240, biggestPot: 700 },
  },
  {
    matchId:      "match-seed-08",
    opponentName: "StackSurge",
    opponentId:   "stacksurge",
    outcome:      "win",
    eloDelta:     +12,
    timestamp:    now - day * 3,
    replayRef:    "match-seed-08",
    stats: { handsPlayed: 20, handsWon: 13, vpip: 43, aggression: 70, avgPot: 190, biggestPot: 420 },
  },
  {
    matchId:      "match-seed-09",
    opponentName: "EchidnaBot v2",
    opponentId:   "echidna",
    outcome:      "loss",
    eloDelta:     -20,
    timestamp:    now - day * 4,
    replayRef:    "match-seed-09",
    stats: { handsPlayed: 20, handsWon: 9,  vpip: 37, aggression: 52, avgPot: 215, biggestPot: 550 },
  },
  {
    matchId:      "match-seed-10",
    opponentName: "IronCurtain AI",
    opponentId:   "ironcurtain",
    outcome:      "win",
    eloDelta:     +17,
    timestamp:    now - day * 5,
    replayRef:    "match-seed-10",
    stats: { handsPlayed: 20, handsWon: 11, vpip: 41, aggression: 63, avgPot: 202, biggestPot: 460 },
  },
];

// ─── Relative-time helper ─────────────────────────────────────────────────────

export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 2)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
