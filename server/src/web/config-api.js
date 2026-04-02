import express from "express";
import { requireAdmin } from "./auth.js";
import { sendAdminNotificationEmail } from "./auth.js";
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
    await sendAdminNotificationEmail(
      "SentinelWeb config updated",
      `The site config was updated by ${req.adminEmail || "an admin"}.\n\nSummary:\n${JSON.stringify(payload, null, 2)}`
    );
    res.json({ ok: true });
  });

  return router;
}
