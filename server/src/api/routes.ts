import express from "express";
import { Action, GameConfig, PlayerId, SeatId } from "../engine/types";
import {
  applyTableAction,
  createTable,
  getPublicState,
  getTable,
  joinTable,
  startHand,
} from "../engine/tableManager";

export const router = express.Router();

router.post("/tables", (req, res) => {
  try {
    const body = req.body as Partial<GameConfig>;
    const config: GameConfig = {
      maxSeats: body.maxSeats ?? 6,
      smallBlind: body.smallBlind ?? 5,
      bigBlind: body.bigBlind ?? 10,
    };
    const table = createTable(config);
    res.json({ id: table.id, config: table.config });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/tables/:id/join", (req, res) => {
  try {
    const { id } = req.params;
    const { playerId, stack } = req.body as { playerId: PlayerId; stack: number };
    const table = joinTable(id, playerId, stack ?? 1000);
    res.json({
      id: table.id,
      players: table.players,
      config: table.config,
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/tables/:id/start-hand", (req, res) => {
  try {
    const { id } = req.params;
    const state = startHand(id);
    res.json(getPublicState(id));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/tables/:id/action", (req, res) => {
  try {
    const { id } = req.params;
    const { seatId, type, amount } = req.body as { seatId: SeatId; type: Action["type"]; amount?: number };
    const action: Action = { type, amount };
    applyTableAction(id, seatId, action);
    res.json(getPublicState(id));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/tables/:id/state", (req, res) => {
  try {
    const { id } = req.params;
    const table = getTable(id);
    if (!table) {
      res.status(404).json({ error: "Table not found" });
      return;
    }
    res.json(getPublicState(id));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

