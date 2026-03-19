import express from "express";
import { requireAdmin } from "./auth.js";
import { getCatalogue, setCatalogue } from "./storage.js";

export function createCatalogueRouter() {
  const router = express.Router();

  // Public read (for frontend)
  router.get("/", async (_req, res) => {
    const data = await getCatalogue();
    res.json(data);
  });

  // Admin write
  router.put("/", requireAdmin, async (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }
    await setCatalogue(payload);
    res.json({ ok: true });
  });

  return router;
}
