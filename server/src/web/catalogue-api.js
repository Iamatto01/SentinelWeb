import express from "express";
import { requireAdmin } from "./auth.js";
import { sendAdminNotificationEmail } from "./auth.js";
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
    await sendAdminNotificationEmail(
      "SentinelWeb catalogue updated",
      `The catalogue was updated by ${req.adminEmail || "an admin"}.\n\nSummary:\n${JSON.stringify(payload, null, 2)}`
    );
    res.json({ ok: true });
  });

  return router;
}
