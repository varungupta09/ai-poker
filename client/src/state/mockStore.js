/**
 * mockStore.js — In-memory SPA state store.
 * No router, no backend. Persists for the duration of the browser session.
 *
 * Exported API:
 *   getState()                       → current state snapshot
 *   subscribe(listener)              → () => unsubscribe
 *   setActiveAgent(agentId)
 *   recordMatchResult(matchSummary)  → updates Elo, history, leaderboard
 *   resetSession()
 */

import { leaderboardSeed } from "../mocks/mockLeaderboardSeed.js";
import { historySeed }     from "../mocks/mockHistorySeed.js";
import { activeAgent }     from "../mocks/mockAgents.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortByElo(arr) {
  return [...arr].sort((a, b) => b.elo - a.elo).map((e, i) => ({ ...e, rank: i + 1 }));
}

function generateMatchId() {
  return "match-" + Math.random().toString(36).slice(2, 9);
}

// ─── Initial state factory ────────────────────────────────────────────────────

function buildInitialState() {
  const globalBoard = sortByElo(leaderboardSeed.map(e => ({ ...e })));
  // Weekly board: same agents but slightly shuffle Elo ±30 to feel distinct
  const weeklyBoard = sortByElo(
    leaderboardSeed.map(e => ({
      ...e,
      elo: e.elo + Math.round((Math.random() - 0.5) * 60),
      wins:   Math.round(e.wins   * 0.3),
      losses: Math.round(e.losses * 0.3),
      streak: Math.floor(Math.random() * 7),
    }))
  );

  return {
    activeAgentId: activeAgent.id,
    agents: [activeAgent],
    leaderboard: {
      global: globalBoard,
      weekly: weeklyBoard,
    },
    matchHistory: [...historySeed],
    lastEloDelta:  null,   // set after a match → drives animation
    lastMatchId:   null,
  };
}

// ─── Module-level mutable state ───────────────────────────────────────────────

let _state = buildInitialState();
const _listeners = new Set();

function _emit() {
  _listeners.forEach(fn => fn(_state));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getState() {
  return _state;
}

export function subscribe(listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export function setActiveAgent(agentId) {
  _state = { ..._state, activeAgentId: agentId };
  _emit();
}

/**
 * recordMatchResult — call this from ResultScreen when a match ends.
 *
 * @param {{
 *   matchId?: string,
 *   opponentName: string,
 *   opponentId?: string,
 *   outcome: "win" | "loss",
 *   eloDelta: number,
 *   timestamp?: string | number,
 *   stats?: object,
 *   replayRef?: string,
 * }} matchSummary
 */
export function recordMatchResult(matchSummary) {
  const {
    matchId       = generateMatchId(),
    opponentName  = "Unknown",
    opponentId    = "unknown",
    outcome       = "win",
    eloDelta      = 0,
    timestamp     = Date.now(),
    stats         = {},
    replayRef     = null,
  } = matchSummary;

  const signedDelta = outcome === "win" ? Math.abs(eloDelta) : -Math.abs(eloDelta);

  // 1. Patch active agent Elo in leaderboard global
  const updatedGlobal = sortByElo(
    _state.leaderboard.global.map(row =>
      row.agentId === _state.activeAgentId
        ? {
            ...row,
            elo:     row.elo + signedDelta,
            wins:    outcome === "win"  ? row.wins  + 1 : row.wins,
            losses:  outcome === "loss" ? row.losses + 1 : row.losses,
            streak:  outcome === "win"  ? row.streak + 1 : 0,
          }
        : row
    )
  );

  // 2. Same for weekly
  const updatedWeekly = sortByElo(
    _state.leaderboard.weekly.map(row =>
      row.agentId === _state.activeAgentId
        ? {
            ...row,
            elo:     row.elo + signedDelta,
            wins:    outcome === "win"  ? row.wins  + 1 : row.wins,
            losses:  outcome === "loss" ? row.losses + 1 : row.losses,
            streak:  outcome === "win"  ? row.streak + 1 : 0,
          }
        : row
    )
  );

  // 3. Prepend match history entry (most recent first)
  const historyEntry = {
    matchId,
    opponentName,
    opponentId,
    outcome,
    eloDelta: signedDelta,
    timestamp,
    stats,
    replayRef,
  };

  _state = {
    ..._state,
    leaderboard: {
      global: updatedGlobal,
      weekly: updatedWeekly,
    },
    matchHistory: [historyEntry, ..._state.matchHistory].slice(0, 50), // cap at 50
    lastEloDelta: signedDelta,
    lastMatchId:  matchId,
  };

  _emit();
  return _state;
}

export function resetSession() {
  _state = buildInitialState();
  _emit();
}

// ─── React hook helper ────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react";

export function useMockStore() {
  return useSyncExternalStore(subscribe, getState);
}
