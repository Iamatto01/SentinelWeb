import express from "express";
import {
  generateWebsite,
  saveGeneratedWebsite,
  getPendingWebsites,
  getWebsiteContent,
  moveWebsite,
} from "./claude-agent.js";

export function createWebsiteGeneratorRouter() {
  const router = express.Router();

  // Generate a new website
  router.post("/generate", async (req, res) => {
    try {
      const generated = await generateWebsite();
      const saved = await saveGeneratedWebsite(generated.html, "pending");

      res.json({
        success: true,
        id: saved.id,
        filename: saved.filename,
        timestamp: generated.timestamp,
      });
    } catch (error) {
      console.error("Generation error:", error);
      res
        .status(500)
        .json({
          error: error.message || "Failed to generate website",
        });
    }
  });

  // Get all pending websites
  router.get("/pending", async (req, res) => {
    try {
      const websites = await getPendingWebsites();
      res.json({ websites });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific website content
  router.get("/:folder/:id", async (req, res) => {
    try {
      const { folder, id } = req.params;
      const content = await getWebsiteContent(folder, id);
      res.type("html").send(content);
    } catch (error) {
      res.status(404).json({ error: "Website not found" });
    }
  });

  // Approve a website (move from pending to approved)
  router.post("/approve/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await moveWebsite("pending", "approved", id);
      res.json({ success: true, message: "Website approved" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reject a website (move from pending to rejected)
  router.post("/reject/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await moveWebsite("pending", "rejected", id);
      res.json({ success: true, message: "Website rejected" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
