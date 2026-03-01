/**
 * mockLeaderboardSeed.js
 * Seeded leaderboard with 50 entries.
 * The active agent (DeepStack v2.1 / id: "deepstack") is included at rank ~12.
 */

// agentId, agentName, ownerName, elo, wins, losses, streak, badge
// badge options: "Legend" | "Pro" | "Rising" | "New" | "Bot"

export const leaderboardSeed = [
  { agentId: "neuralking",   agentName: "NeuralKing v4",    ownerName: "apex_labs",    elo: 2104, wins: 512, losses: 88,  streak: 9,  badge: "Legend", isLive: true  },
  { agentId: "omegabot",    agentName: "OmegaBot Ω",        ownerName: "sigma_dev",    elo: 2041, wins: 477, losses: 99,  streak: 6,  badge: "Legend", isLive: true  },
  { agentId: "psibot",      agentName: "PsiBot 9000",       ownerName: "quant_ai",     elo: 1991, wins: 430, losses: 110, streak: 4,  badge: "Legend", isLive: false },
  { agentId: "alphashuffle", agentName: "AlphaShuffle",     ownerName: "dan_m",        elo: 1950, wins: 398, losses: 122, streak: 2,  badge: "Pro",    isLive: true  },
  { agentId: "gtomaster",   agentName: "GTOMaster",         ownerName: "chen_xl",      elo: 1912, wins: 361, losses: 134, streak: 3,  badge: "Pro",    isLive: false },
  { agentId: "echidna",     agentName: "Echidna v2",        ownerName: "r_steele",     elo: 1878, wins: 340, losses: 141, streak: 0,  badge: "Pro",    isLive: false },
  { agentId: "razorsharp",  agentName: "RazorSharp",        ownerName: "k_hayes",      elo: 1845, wins: 312, losses: 155, streak: 5,  badge: "Pro",    isLive: true  },
  { agentId: "bluffmachine",agentName: "BluffMachine",      ownerName: "lena_v",       elo: 1820, wins: 299, losses: 167, streak: 1,  badge: "Pro",    isLive: false },
  { agentId: "ironcurtain", agentName: "IronCurtain AI",    ownerName: "g_patel",      elo: 1794, wins: 285, losses: 170, streak: 0,  badge: "Pro",    isLive: false },
  { agentId: "cardshark",   agentName: "CardShark Elite",   ownerName: "t_nguyen",     elo: 1761, wins: 271, losses: 183, streak: 3,  badge: "Rising", isLive: false },
  { agentId: "riverrat",    agentName: "RiverRat",          ownerName: "marco_p",      elo: 1738, wins: 254, losses: 190, streak: 2,  badge: "Rising", isLive: false },
  { agentId: "deepstack",   agentName: "DeepStack v2.1",    ownerName: "You",          elo: 1482, wins: 130, losses: 84,  streak: 0,  badge: "Rising", isLive: false }, // ← active agent
  { agentId: "postfloptxn", agentName: "PostflopAI Txn",    ownerName: "s_kim",        elo: 1710, wins: 240, losses: 198, streak: 1,  badge: "Rising", isLive: false },
  { agentId: "callmaster",  agentName: "CallMaster 3",      ownerName: "j_brooks",     elo: 1689, wins: 228, losses: 204, streak: 0,  badge: "Rising", isLive: false },
  { agentId: "flopwhiz",    agentName: "FlopWhiz",          ownerName: "ali_t",        elo: 1671, wins: 215, losses: 210, streak: 4,  badge: "Rising", isLive: false },
  { agentId: "turbobet",    agentName: "TurboBet v1.2",     ownerName: "mia_c",        elo: 1654, wins: 201, losses: 212, streak: 0,  badge: "Rising", isLive: false },
  { agentId: "stacksurge",  agentName: "StackSurge",        ownerName: "h_okonkwo",    elo: 1637, wins: 198, losses: 218, streak: 2,  badge: "Rising", isLive: false },
  { agentId: "foldmonkey",  agentName: "FoldMonkey",        ownerName: "vera_p",       elo: 1618, wins: 187, losses: 221, streak: 0,  badge: "Rising", isLive: false },
  { agentId: "aceace",      agentName: "AceAce",            ownerName: "nick_r",       elo: 1600, wins: 179, losses: 224, streak: 1,  badge: "Rising", isLive: false },
  { agentId: "steelnerve",  agentName: "SteelNerve",        ownerName: "priya_k",      elo: 1584, wins: 168, losses: 228, streak: 0,  badge: "Rising", isLive: false },
  { agentId: "dawnraider",  agentName: "DawnRaider",        ownerName: "felix_o",      elo: 1567, wins: 160, losses: 231, streak: 3,  badge: "Rising", isLive: false },
  { agentId: "midnightpush",agentName: "MidnightPush",      ownerName: "cass_d",       elo: 1551, wins: 153, losses: 234, streak: 0,  badge: "Rising", isLive: false },
  { agentId: "solverbot",   agentName: "SolverBot lite",    ownerName: "dev_x9",       elo: 1539, wins: 148, losses: 239, streak: 0,  badge: "Bot",    isLive: false },
  { agentId: "chipsniper",  agentName: "ChipSniper",        ownerName: "yolanda_t",    elo: 1524, wins: 141, losses: 242, streak: 2,  badge: "Rising", isLive: false },
  { agentId: "potodds",     agentName: "PotOdds Pro",       ownerName: "raj_mn",       elo: 1509, wins: 135, losses: 245, streak: 1,  badge: "Rising", isLive: false },
  { agentId: "floppyfold",  agentName: "FloppyFold",        ownerName: "liz_w",        elo: 1496, wins: 132, losses: 247, streak: 0,  badge: "Bot",    isLive: false },
  { agentId: "raiseking",   agentName: "RaiseKing Alpha",   ownerName: "omar_s",       elo: 1471, wins: 127, losses: 250, streak: 1,  badge: "Rising", isLive: false },
  { agentId: "vegasmode",   agentName: "VegasMode",         ownerName: "tina_f",       elo: 1455, wins: 121, losses: 253, streak: 0,  badge: "Rising", isLive: false },
  { agentId: "nutflush",    agentName: "NutFlush AI",       ownerName: "carl_n",       elo: 1440, wins: 116, losses: 256, streak: 0,  badge: "New",    isLive: false },
  { agentId: "wheelbot",    agentName: "WheelBot",          ownerName: "dom_r",        elo: 1426, wins: 110, losses: 260, streak: 2,  badge: "New",    isLive: false },
  { agentId: "grintastic",  agentName: "Grintastic v0.3",   ownerName: "beta_user",    elo: 1412, wins: 104, losses: 263, streak: 0,  badge: "New",    isLive: false },
  { agentId: "stackbuster", agentName: "StackBuster",       ownerName: "alan_w",       elo: 1398, wins:  99, losses: 266, streak: 1,  badge: "New",    isLive: false },
  { agentId: "flopkinaze",  agentName: "FlopKinaze",        ownerName: "beta_user_2",  elo: 1384, wins:  94, losses: 268, streak: 0,  badge: "New",    isLive: false },
  { agentId: "blindthief",  agentName: "BlindThief",        ownerName: "reginald_t",   elo: 1370, wins:  88, losses: 271, streak: 0,  badge: "New",    isLive: false },
  { agentId: "allindave",   agentName: "AllInDave",         ownerName: "dave_p",       elo: 1355, wins:  83, losses: 274, streak: 3,  badge: "New",    isLive: false },
  { agentId: "passivepete", agentName: "PassivePete",       ownerName: "pete_s",       elo: 1341, wins:  78, losses: 278, streak: 0,  badge: "New",    isLive: false },
  { agentId: "streetbot",   agentName: "StreetBot v2",      ownerName: "street_ai",    elo: 1327, wins:  74, losses: 280, streak: 0,  badge: "Bot",    isLive: false },
  { agentId: "microgrind",  agentName: "MicroGrind AI",     ownerName: "grind_lab",    elo: 1313, wins:  70, losses: 283, streak: 1,  badge: "Bot",    isLive: false },
  { agentId: "holdemhero",  agentName: "HoldemHero",        ownerName: "nora_q",       elo: 1299, wins:  66, losses: 285, streak: 0,  badge: "New",    isLive: false },
  { agentId: "blankslate",  agentName: "BlankSlate v1",     ownerName: "anon_9012",    elo: 1285, wins:  62, losses: 288, streak: 0,  badge: "New",    isLive: false },
  { agentId: "randombot",   agentName: "RandomBot",         ownerName: "ai_sandbox",   elo: 1201, wins:  45, losses: 301, streak: 0,  badge: "Bot",    isLive: false },
  { agentId: "tinyblind",   agentName: "TinyBlind",         ownerName: "sarah_bl",     elo: 1260, wins:  58, losses: 290, streak: 0,  badge: "New",    isLive: false },
  { agentId: "slowplay",    agentName: "SlowPlay AI",       ownerName: "tommy_s",      elo: 1247, wins:  55, losses: 293, streak: 0,  badge: "New",    isLive: false },
  { agentId: "luckypunch",  agentName: "LuckyPunch",        ownerName: "jamie_l",      elo: 1234, wins:  52, losses: 296, streak: 2,  badge: "New",    isLive: false },
  { agentId: "checkcheck",  agentName: "CheckCheck v0.1",   ownerName: "newbie_01",    elo: 1220, wins:  49, losses: 298, streak: 0,  badge: "New",    isLive: false },
  { agentId: "foldbot",     agentName: "FoldBot Basic",     ownerName: "newbie_02",    elo: 1188, wins:  41, losses: 305, streak: 0,  badge: "Bot",    isLive: false },
  { agentId: "zerobrain",   agentName: "ZeroBrain",         ownerName: "debug_run",    elo: 1174, wins:  37, losses: 308, streak: 0,  badge: "Bot",    isLive: false },
  { agentId: "minimalist",  agentName: "Minimalist AI",     ownerName: "v_russo",      elo: 1161, wins:  33, losses: 310, streak: 0,  badge: "New",    isLive: false },
  { agentId: "testbot99",   agentName: "TestBot 99",        ownerName: "ci_pipeline",  elo: 1148, wins:  28, losses: 313, streak: 0,  badge: "Bot",    isLive: false },
  { agentId: "alphadraft",  agentName: "AlphaDraft v0.1",   ownerName: "fresh_start",  elo: 1100, wins:  18, losses: 320, streak: 0,  badge: "New",    isLive: false },
];

// Badge color map
export const BADGE_CONFIG = {
  Legend: { bg: "rgba(234,179,8,0.15)",  border: "rgba(234,179,8,0.45)",  color: "#eab308" },
  Pro:    { bg: "rgba(224,27,45,0.12)",  border: "rgba(224,27,45,0.4)",   color: "#e01b2d" },
  Rising: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)", color: "#818cf8" },
  New:    { bg: "rgba(255,255,255,0.06)",border: "rgba(255,255,255,0.12)",color: "rgba(255,255,255,0.5)" },
  Bot:    { bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.3)",   color: "#4ade80" },
};
