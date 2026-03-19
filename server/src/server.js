import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";

import { createAuthRouter } from "./web/auth.js";
import { createCatalogueRouter } from "./web/catalogue-api.js";
import { createConfigRouter } from "./web/config-api.js";
import { ensureSeedData } from "./web/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

await ensureSeedData();

const PORT = Number(process.env.PORT || 5174);
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

// Static site (serve project root)
const root = path.resolve(__dirname, "../../");
app.use(express.static(root));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Admin backend running: http://localhost:${PORT}`);
  console.log(`Serving static root: ${root}`);
  console.log(`CORS origin: ${ORIGIN}`);
  if (ORIGINS.length) console.log(`CORS origins: ${ORIGINS.join(", ")}`);
});
