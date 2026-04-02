import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";

import { createAuthRouter } from "./web/auth.js";
import { createCatalogueRouter } from "./web/catalogue-api.js";
import { createConfigRouter } from "./web/config-api.js";
import { createTemplateRouter } from "./web/template-api.js";
import { createWebsiteGeneratorRouter } from "./web/generator-api.js";
import { ensureSeedData } from "./web/storage.js";
import { startGenerationLoop } from "./web/generation-loop.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

await ensureSeedData();

const PORT = Number(process.env.PORT || 5174);
const HUGGING_FACE_API_KEY = (process.env.HUGGING_FACE_API_KEY || "").trim();
// Dev-friendly default: mirror request origin (works with VS Code Live Server like 127.0.0.1:5501)
// For production, set CORS_ORIGIN or CORS_ORIGINS explicitly.
const ORIGIN = process.env.CORS_ORIGIN || "*";
const ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl (no Origin header)
      if (!origin) return cb(null, true);
      if (ORIGINS.length > 0) return cb(null, ORIGINS.includes(origin));
      // fall back to single origin setting; if set to '*', mirror request origin
      if (ORIGIN === "*") return cb(null, origin);
      return cb(null, ORIGIN);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// API
app.use("/api/auth", createAuthRouter());
app.use("/api/catalogue", createCatalogueRouter());
app.use("/api/config", createConfigRouter());
app.use("/api/templates", createTemplateRouter());
app.use("/api/generator", createWebsiteGeneratorRouter());

// Static site (serve project root)
const root = path.resolve(__dirname, "../../");
app.use(express.static(root));

// Serve index.html for the root route
app.get("/", (_req, res) => {
  res.sendFile(path.join(root, "index.html"));
});

app.get("/generator", (_req, res) => {
  res.sendFile(path.join(root, "generator.html"));
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, async () => {
  console.log(`Admin backend running: http://localhost:${PORT}`);
  console.log(`Serving static root: ${root}`);
  console.log(`CORS origin: ${ORIGIN}`);
  if (ORIGINS.length) console.log(`CORS origins: ${ORIGINS.join(", ")}`);

  // Start the website generation loop (5 minutes interval)
  // Keep this in sync with src/web/claude-agent.js credential requirements.
  const hasUsableHuggingFaceKey =
    HUGGING_FACE_API_KEY.length > 0 && !/x{4,}/i.test(HUGGING_FACE_API_KEY);

  if (hasUsableHuggingFaceKey) {
    try {
      await startGenerationLoop(5 * 60 * 1000); // 5 minutes
    } catch (error) {
      console.error("Failed to start generation loop:", error.message);
    }
  } else {
    console.warn(
      "⚠️ HUGGING_FACE_API_KEY missing/placeholder - website generation loop disabled"
    );
  }
});
