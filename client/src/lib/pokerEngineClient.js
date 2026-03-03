const BASE_URL = import.meta.env.VITE_POKER_ENGINE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with ${res.status}`);
  }
  return res.json();
}

export async function createTable(config = {}) {
  return request("/tables", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function joinTable(tableId, playerId, stack = 1000) {
  return request(`/tables/${tableId}/join`, {
    method: "POST",
    body: JSON.stringify({ playerId, stack }),
  });
}

export async function startHand(tableId) {
  return request(`/tables/${tableId}/start-hand`, { method: "POST" });
}

export async function sendAction(tableId, seatId, action) {
  return request(`/tables/${tableId}/action`, {
    method: "POST",
    body: JSON.stringify({ seatId, ...action }),
  });
}

export async function getState(tableId) {
  return request(`/tables/${tableId}/state`, { method: "GET" });
}

/** Turn engine card { rank, suit } into "Ah", "Kd" style for MatchScreen. */
function cardStr(c) {
  if (!c) return "";
  const r = { 11: "J", 12: "Q", 13: "K", 14: "A" }[c.rank] ?? String(c.rank);
  return r + c.suit;
}

/** Run a short match on the engine and return events in mockMatchEvents format for MatchScreen. */
export async function runEngineMatch(numHands = 3) {
  const table = await createTable({ maxSeats: 2, smallBlind: 5, bigBlind: 10 });
  const tableId = table.id;
  await joinTable(tableId, "a", 1000);
  await joinTable(tableId, "b", 1000);

  const events = [];
  const seatToActor = (seat) => (seat === 0 ? "a" : "b");

  for (let handNumber = 1; handNumber <= numHands; handNumber++) {
    let state = await startHand(tableId);
    const prevStacks = { a: state.players.find((p) => p.seat === 0)?.stack ?? 1000, b: state.players.find((p) => p.seat === 1)?.stack ?? 1000 };
    const pot0 = (state.pots || []).reduce((s, p) => s + p.amount, 0);
    events.push({ handNumber, type: "hand_start", payload: { stacks: { ...prevStacks }, pot: pot0 } });

    let prevStreet = state.street;

    while (state && !state.isHandOver) {
      const toAct = state.toActSeat;
      if (toAct == null) break;
      const player = state.players.find((p) => p.seat === toAct);
      if (!player || player.hasFolded || player.isAllIn) break;
      const maxBet = Math.max(...state.players.map((p) => p.bet), 0);
      const toCall = maxBet - player.bet;
      let action = { type: "fold" };
      if (toCall <= 0) action = { type: "check" };
      else if (player.stack >= toCall) action = { type: "call" };
      const verb = action.type === "call" ? "calls" : action.type === "check" ? "checks" : "folds";
      const amount = action.type === "call" ? Math.min(toCall, player.stack) : 0;
      const actor = seatToActor(toAct);
      try {
        state = await sendAction(tableId, toAct, action);
      } catch {
        break;
      }
      const stacks = {};
      state.players.forEach((p) => { stacks[seatToActor(p.seat)] = p.stack; });
      const pot = (state.pots || []).reduce((s, p) => s + p.amount, 0);
      events.push({ handNumber, type: "action", payload: { actor, verb, amount, pot, stacks } });

      if (state.street !== prevStreet) {
        if (state.street === "flop" && state.board && state.board.length >= 3) {
          const cards = state.board.slice(0, 3).map(cardStr);
          events.push({ handNumber, type: "deal_flop", payload: { cards, pot, stacks } });
        } else if (state.street === "turn" && state.board && state.board.length >= 4) {
          const card = cardStr(state.board[3]);
          events.push({ handNumber, type: "deal_turn", payload: { card, pot, stacks } });
        } else if (state.street === "river" && state.board && state.board.length >= 5) {
          const card = cardStr(state.board[4]);
          events.push({ handNumber, type: "deal_river", payload: { card, pot, stacks } });
        }
        prevStreet = state.street;
      }
    }

    state = await getState(tableId);
    const stacks = {};
    state.players.forEach((p) => { stacks[seatToActor(p.seat)] = p.stack; });
    const handA = (state.players.find((p) => p.seat === 0)?.holeCards || []).map(cardStr);
    const handB = (state.players.find((p) => p.seat === 1)?.holeCards || []).map(cardStr);
    const winnerSeat = state.players.reduce((best, p) => (p.stack > (best?.stack ?? -1) ? p : best), null)?.seat;
    const winnerActor = winnerSeat != null ? seatToActor(winnerSeat) : "a";
    // Engine clears pots when hand ends, so use last non-zero pot we recorded this hand
    const handEventsWithPot = events.filter((e) => e.handNumber === handNumber && (e.payload?.pot ?? 0) > 0);
    const totalPot = handEventsWithPot.length > 0 ? handEventsWithPot[handEventsWithPot.length - 1].payload.pot : pot0;
    events.push({
      handNumber,
      type: "showdown",
      payload: {
        winnerActor,
        handA: handA.length === 2 ? handA : ["??", "??"],
        handB: handB.length === 2 ? handB : ["??", "??"],
        reason: state.street === "showdown" ? "Showdown" : "Win by fold",
      },
    });
    const finalStacks = {};
    state.players.forEach((p) => { finalStacks[seatToActor(p.seat)] = p.stack; });
    events.push({
      handNumber,
      type: "pot_awarded",
      payload: { actor: winnerActor, amount: totalPot, stacks: finalStacks },
    });
  }

  const lastState = await getState(tableId);
  const finalStacks = {};
  (lastState?.players || []).forEach((p) => { finalStacks[seatToActor(p.seat)] = p.stack; });
  const winner = finalStacks.a >= finalStacks.b ? "a" : "b";
  events.push({
    handNumber: numHands,
    type: "match_end",
    payload: { winner, finalStacks, reason: "Match complete" },
  });

  return events;
}

