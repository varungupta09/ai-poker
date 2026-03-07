/**
 * Poker match client — uses the poker game server (poker/server, port 3001)
 * for both "Test Match" (Agent Lab) and live play. Events are in the format
 * expected by MatchScreen (hand_start, action, deal_flop, deal_turn, deal_river,
 * showdown, pot_awarded, match_end).
 */

const GAME_API_URL = import.meta.env.VITE_POKER_API_URL || "http://localhost:3001";

async function gameRequest(path, options = {}) {
  const res = await fetch(`${GAME_API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with ${res.status}`);
  }
  return res.json();
}

/** Turn poker engine card { rank, suit } into "Ah", "Kd" style for MatchScreen. */
function cardStr(c) {
  if (!c) return "";
  const r = { 11: "J", 12: "Q", 13: "K", 14: "A" }[c.rank] ?? String(c.rank);
  return r + c.suit;
}

const ACTION_TO_VERB = {
  fold: "folds",
  check: "checks",
  call: "calls",
  bet: "bets",
  raise: "raises",
};

/**
 * Run a match using the poker directory engine (game server). Creates a game
 * with two agents (no human), runs numHands by calling start-hand; each hand
 * is played out by the server. Converts snapshots + log into MatchScreen events.
 *
 * @param {number} numHands
 * @param {{ smallBlind?: number, bigBlind?: number, agentA?: string, agentB?: string }} options
 * @returns {Promise<Array<{ handNumber: number, type: string, payload: object }>>}
 */
export async function runPokerGameMatch(numHands = 3, options = {}) {
  const smallBlind = options.smallBlind ?? 5;
  const bigBlind = options.bigBlind ?? 10;
  const agentA = options.agentA ?? "random";
  const agentB = options.agentB ?? "random";

  const createRes = await gameRequest("/game", {
    method: "POST",
    body: JSON.stringify({
      players: [
        { id: "a", type: agentA, startingStack: 1000 },
        { id: "b", type: agentB, startingStack: 1000 },
      ],
      config: { smallBlind, bigBlind },
    }),
  });

  const gameId = createRes.gameId;
  const events = [];
  let stacks = { ...createRes.stacks };

  for (let handNumber = 1; handNumber <= numHands; handNumber++) {
    const snap = await gameRequest(`/game/${gameId}/start-hand`, { method: "POST" });

    if (!snap.state || !snap.handOver) {
      events.push({
        handNumber,
        type: "hand_start",
        payload: { stacks: { ...stacks }, pot: 0 },
      });
      events.push({
        handNumber,
        type: "pot_awarded",
        payload: { actor: "a", amount: 0, stacks: { ...stacks } },
      });
      if (snap.stacks) stacks = { ...snap.stacks };
      continue;
    }

    const state = snap.state;
    const log = snap.log || [];
    const config = state.config || { smallBlind, bigBlind };
    const sb = config.smallBlind ?? 10;
    const bb = config.bigBlind ?? 20;
    const communityCards = state.communityCards || [];
    const players = state.players || [];

    // Stacks at start of this hand (before blinds)
    events.push({
      handNumber,
      type: "hand_start",
      payload: { stacks: { ...stacks }, pot: sb + bb },
    });

    // Replay: apply blinds then each log entry
    const sbIndex = state.sbIndex ?? 0;
    const bbIndex = state.bbIndex ?? 1;
    const sbId = players[sbIndex]?.id ?? "a";
    const bbId = players[bbIndex]?.id ?? "b";
    let runningStacks = { ...stacks };
    runningStacks[sbId] = (runningStacks[sbId] ?? 1000) - sb;
    runningStacks[bbId] = (runningStacks[bbId] ?? 1000) - bb;
    let pot = sb + bb;
    let prevStreet = "preflop";

    for (let i = 0; i < log.length; i++) {
      const entry = log[i];
      const actor = entry.playerId;
      const verb = ACTION_TO_VERB[entry.action] || entry.action + "s";
      const amount = entry.amount ?? 0;

      if (amount > 0) {
        runningStacks[actor] = (runningStacks[actor] ?? 0) - amount;
        pot += amount;
      }

      // Street change: emit deal_flop / deal_turn / deal_river before this action
      const street = entry.street || "preflop";
      if (street !== prevStreet) {
        if (street === "flop" && communityCards.length >= 3) {
          const cards = communityCards.slice(0, 3).map(cardStr);
          events.push({
            handNumber,
            type: "deal_flop",
            payload: { cards, pot, stacks: { ...runningStacks } },
          });
        } else if (street === "turn" && communityCards.length >= 4) {
          events.push({
            handNumber,
            type: "deal_turn",
            payload: {
              card: cardStr(communityCards[3]),
              pot,
              stacks: { ...runningStacks },
            },
          });
        } else if (street === "river" && communityCards.length >= 5) {
          events.push({
            handNumber,
            type: "deal_river",
            payload: {
              card: cardStr(communityCards[4]),
              pot,
              stacks: { ...runningStacks },
            },
          });
        }
        prevStreet = street;
      }

      events.push({
        handNumber,
        type: "action",
        payload: {
          actor,
          verb,
          amount,
          pot,
          stacks: { ...runningStacks },
        },
      });
    }

    // Showdown and pot_awarded
    const winnerResults = snap.winners || [];
    const winnerActor =
      winnerResults.length > 0 ? winnerResults[0].playerId : players[0]?.id ?? "a";
    const handDescriptions = winnerResults.map((w) => w.handDescription).filter(Boolean);
    const reason =
      handDescriptions.length > 0
        ? handDescriptions[0]
        : state.street === "showdown"
          ? "Showdown"
          : "Win by fold";

    const playerA = players.find((p) => p.id === "a");
    const playerB = players.find((p) => p.id === "b");
    const handA = (playerA?.holeCards || []).map(cardStr);
    const handB = (playerB?.holeCards || []).map(cardStr);
    const totalPot = state.pots?.reduce((s, p) => s + p.amount, 0) ?? pot;

    events.push({
      handNumber,
      type: "showdown",
      payload: {
        winnerActor,
        handA: handA.length === 2 ? handA : ["??", "??"],
        handB: handB.length === 2 ? handB : ["??", "??"],
        reason,
      },
    });

    stacks = { ...snap.stacks };
    events.push({
      handNumber,
      type: "pot_awarded",
      payload: { actor: winnerActor, amount: totalPot, stacks: { ...stacks } },
    });
  }

  const winner = (stacks.a ?? 0) >= (stacks.b ?? 0) ? "a" : "b";
  events.push({
    handNumber: numHands,
    type: "match_end",
    payload: { winner, finalStacks: { ...stacks }, reason: "Match complete" },
  });

  return events;
}

/**
 * Run a short test match and return events in the format expected by MatchScreen.
 * Uses the poker game server (poker directory engine). Same as runPokerGameMatch;
 * name kept for backward compatibility with QueueScreen.
 */
export async function runEngineMatch(numHands = 3) {
  return runPokerGameMatch(numHands, {
    smallBlind: 5,
    bigBlind: 10,
    agentA: "random",
    agentB: "random",
  });
}
