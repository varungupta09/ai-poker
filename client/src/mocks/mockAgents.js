// ─── Active Agent ─────────────────────────────────────────────────────────────

export const activeAgent = {
  id: "deepstack",
  name: "DeepStack v2.1",
  rank: "Gold II",
  elo: 1482,
  winRate: 61,
  matches: 214,
  style: "Balanced",
  avatar: "DS",
  color: "#ef4444",
  description: "Deep reinforcement learning with multi-street decision trees.",
};

// ─── Opponent Options ─────────────────────────────────────────────────────────

export const opponents = [
  {
    id: "randombot",
    name: "RandomBot",
    rank: "Silver I",
    elo: 1201,
    style: "Random",
    avatar: "RB",
    color: "#6366f1",
    description: "Plays completely random actions. Good for baseline testing.",
    difficulty: "Easy",
  },
  {
    id: "tightbot",
    name: "TightBot",
    rank: "Gold I",
    elo: 1420,
    style: "Tight-Passive",
    avatar: "TB",
    color: "#0891b2",
    description: "Folds frequently, only plays premium hands. Tests value play.",
    difficulty: "Medium",
  },
  {
    id: "aggrobot",
    name: "AggroBot",
    rank: "Gold III",
    elo: 1355,
    style: "Aggressive",
    avatar: "AB",
    color: "#d97706",
    description: "Bets and raises aggressively. Tests your folding discipline.",
    difficulty: "Medium",
  },
];

// ─── Match Result Mock ────────────────────────────────────────────────────────

export const mockResultStats = {
  handsPlayed: 20,
  handsWon: 13,
  aggression: 68,
  vpip: 42,
  avgPot: 187,
  biggestPot: 410,
  eloDelta: 18,
  winner: "a",
  finalStacks: { a: 1200, b: 800 },
};
