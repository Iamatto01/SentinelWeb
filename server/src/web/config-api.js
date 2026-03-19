import express from "express";
import { requireAdmin } from "./auth.js";
import { getConfig, setConfig } from "./storage.js";

export function createConfigRouter() {
  const router = express.Router();

  // Public read
  router.get("/", async (_req, res) => {
    const data = await getConfig();
    res.json(data);
  });

  // Admin write
  router.put("/", requireAdmin, async (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }
    await setConfig(payload);
    res.json({ ok: true });
  });

  return router;
}
