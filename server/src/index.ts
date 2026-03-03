import express from "express";
import cors from "cors";
import { router as apiRouter } from "./api/routes";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Poker engine server listening on port ${port}`);
});

