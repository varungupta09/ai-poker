# BotBluff

Run the game from the repo root.

## 1. Install dependencies

```bash
cd client   && npm install
cd ../poker/server && npm install
```

Optional (legacy engine, not used by Agent Lab or live play):

```bash
cd ../server && npm install
```

## 2. Start the app

**Test match** (Agent Lab) and **Live poker** (you vs AI) both use the **poker game server** (`poker/server/`). You only need the client and that server.

**Terminal 1 – game server (port 3001)**  
```bash
cd poker/server
npm run dev
```

**Terminal 2 – client (Vite, usually port 5173)**  
```bash
cd client
npm run dev
```

Then open the client URL (e.g. http://localhost:5173):

- **Agents → Test → Start Test Match** — runs a short agent-vs-agent match using the poker engine and shows it in MatchScreen.
- **Play vs AI Bots** (e.g. from the offline view) — play interactively against AI; same game server.

The client uses `http://localhost:3001` (or `VITE_POKER_API_URL` if set) for both flows.

---

### Optional: legacy engine (port 4000)

The `server/` directory contains a separate tables API (create table, join, start hand, action by seat). It is **no longer used** by the Agent Lab test match or by live play; both use the poker directory’s rules and `poker/server` instead. You can still run it for other tooling or experiments:

```bash
cd server
npm run dev
```

Set `VITE_POKER_ENGINE_URL` in the client only if you need to point something at this engine.

## Summary

| Part        | Path            | Command       | Port  | Used by                                    |
|-------------|-----------------|---------------|-------|--------------------------------------------|
| Client      | `client/`       | `npm run dev` | 5173  | All UI                                     |
| Game server | `poker/server/` | `npm run dev` | 3001  | Test match (Agent Lab) + Live poker (vs AI) |

Environment (optional): in `client/` set `VITE_POKER_API_URL` if the game server runs on a different host/port.
