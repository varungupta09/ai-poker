/*
  poker/server/index.ts
  Express server for interactive poker: human vs AI agents.

  Start:
    cd poker/server && npm install && npm run dev

  ── API ───────────────────────────────────────────────────────────────────────

  POST /game
    Create a new game session.
    Body: {
      players: Array<{ id: string, type: "human"|"call"|"fold"|"random", startingStack: number }>,
      config?: { smallBlind?: number, bigBlind?: number }
    }
    Response: { gameId, players, config, stacks }

  POST /game/:id/start-hand
    Deal a new hand. Agent turns are resolved automatically until the human
    must act (or the entire hand finishes if there is no human).
    Response: RoundSnapshot

  GET /game/:id/state
    Return the current game snapshot.
    Response: RoundSnapshot

  POST /game/:id/action
    Submit the human player's action, then resolve agent turns.
    Body: { type: "fold"|"check"|"call"|"bet"|"raise", amount?: number }
    Response: RoundSnapshot

  ── RoundSnapshot shape ───────────────────────────────────────────────────────
    {
      state: GameState | null,     // filtered — other players' hole cards hidden
      legalActions: {              // non-null only on human's turn
        actions: string[],
        callAmount: number,
        minBetOrRaise: number,
        maxBetOrRaise: number
      } | null,
      isHumanTurn: boolean,
      handOver: boolean,
      log: Array<{ street, playerId, action, amount? }>,
      winners: Array<{ playerId, potAmount, handDescription }> | null,
      stacks: Record<string, number>  // chips per player (persists across hands)
    }
*/

import express from "express"
import cors from "cors"
import {
  createGame,
  getGame,
  startHand,
  applyHumanAction,
  getSnapshot,
  PlayerSpec,
} from "./gameManager"
import { ActionType, TableConfig } from "../gameTypes"

const app = express()

app.use(cors())
app.use(express.json())

// ── POST /game ──────────────────────────────────────────────────────────────
// Create a new game session.
app.post("/game", (req, res) => {
  try {
    const { players, config } = req.body as {
      players?: PlayerSpec[]
      config?: Partial<TableConfig>
    }

    if (!Array.isArray(players) || players.length < 2 || players.length > 6) {
      res.status(400).json({ error: "players must be an array of 2–6 player objects" })
      return
    }

    for (const p of players) {
      if (!p.id || typeof p.id !== "string") {
        res.status(400).json({ error: "Each player requires a non-empty string id" })
        return
      }
      if (!["human", "call", "fold", "random", "rmx"].includes(p.type)) {
        res.status(400).json({ error: `Unknown player type "${p.type}". Use: human, call, fold, random, rmx` })
        return
      }
      if (typeof p.startingStack !== "number" || p.startingStack <= 0) {
        res.status(400).json({ error: `Player "${p.id}" needs a positive startingStack` })
        return
      }
    }

    const tableConfig: TableConfig = {
      smallBlind: config?.smallBlind ?? 10,
      bigBlind:   config?.bigBlind   ?? 20,
    }

    const session = createGame(players, tableConfig)

    res.status(201).json({
      gameId:  session.id,
      players: session.specs,
      config:  tableConfig,
      stacks:  Object.fromEntries(session.stacks),
    })
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})

// ── POST /game/:id/start-hand ───────────────────────────────────────────────
// Deal a new hand.
app.post("/game/:id/start-hand", (req, res) => {
  try {
    const session = getGame(req.params.id)
    if (!session) {
      res.status(404).json({ error: "Game not found" })
      return
    }
    res.json(startHand(session))
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})

// ── GET /game/:id/state ─────────────────────────────────────────────────────
// Get the current snapshot (safe to poll).
app.get("/game/:id/state", (req, res) => {
  try {
    const session = getGame(req.params.id)
    if (!session) {
      res.status(404).json({ error: "Game not found" })
      return
    }
    res.json(getSnapshot(session))
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})

// ── POST /game/:id/action ───────────────────────────────────────────────────
// Submit the human player's action.
app.post("/game/:id/action", (req, res) => {
  try {
    const session = getGame(req.params.id)
    if (!session) {
      res.status(404).json({ error: "Game not found" })
      return
    }

    const { type, amount } = req.body as { type?: string; amount?: number }

    const validTypes: string[] = Object.values(ActionType)
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({
        error: `type is required. Valid values: ${validTypes.join(", ")}`,
      })
      return
    }

    res.json(applyHumanAction(session, { type: type as ActionType, amount }))
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`Poker game server →  http://localhost:${PORT}`)
  console.log()
  console.log("Quick-start example:")
  console.log(`  curl -s -X POST http://localhost:${PORT}/game \\`)
  console.log(`    -H 'Content-Type: application/json' \\`)
  console.log(`    -d '{"players":[{"id":"you","type":"human","startingStack":1000},`)
  console.log(`         {"id":"bot1","type":"random","startingStack":1000},`)
  console.log(`         {"id":"bot2","type":"call","startingStack":1000}],`)
  console.log(`         "config":{"smallBlind":10,"bigBlind":20}}'`)
})
