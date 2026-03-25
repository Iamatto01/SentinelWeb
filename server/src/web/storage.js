import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "url";
import { createClient } from "@libsql/client";

function resolveDataDir() {
  const cwd = process.cwd();
  // If started from /server, use /server/data. Otherwise use /server/data under project root.
  if (path.basename(cwd).toLowerCase() === "server") return path.resolve(cwd, "data");
  return path.resolve(cwd, "server", "data");
}

const dataDir = resolveDataDir();
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || "";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || "";

let tursoClient = null;

function hasTursoConfig() {
  return Boolean(TURSO_DATABASE_URL);
}

function getTursoClient() {
  if (!hasTursoConfig()) return null;
  if (!tursoClient) {
    tursoClient = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN || undefined,
    });
  }
  return tursoClient;
}

async function ensureTursoSchema() {
  const client = getTursoClient();
  if (!client) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS kv_store (
      k TEXT PRIMARY KEY,
      v TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
}

async function getKv(key) {
  const client = getTursoClient();
  if (!client) return null;
  const rs = await client.execute({ sql: "SELECT v FROM kv_store WHERE k = ?", args: [key] });
  return rs.rows?.[0]?.v ?? null;
}

async function setKv(key, valueObj) {
  const client = getTursoClient();
  if (!client) return;
  await client.execute({
    sql: `
      INSERT INTO kv_store (k, v, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(k) DO UPDATE SET
        v = excluded.v,
        updated_at = excluded.updated_at
    `,
    args: [key, JSON.stringify(valueObj), Date.now()],
  });
}

async function readJson(fileName, fallback) {
  try {
    const p = path.join(dataDir, fileName);
    const txt = await fs.readFile(p, "utf8");
    return JSON.parse(txt);
  } catch {
    return fallback;
  }
}

async function writeJson(fileName, obj) {
  const p = path.join(dataDir, fileName);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(obj, null, 2), "utf8");
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findProjectRoot() {
  const cwd = process.cwd();
  const candidates = [cwd, path.resolve(cwd, "..")];
  for (const candidate of candidates) {
    const p = path.join(candidate, "catalogue", "catalogue-data.js");
    if (await fileExists(p)) return candidate;
  }
  // Fallback: assume cwd is project root
  return cwd;
}

export async function getProjectRoot() {
  return findProjectRoot();
}

async function readFrontendDefaults() {
  // Pull defaults from existing static files if present.
  const projectRoot = await findProjectRoot();
  const catalogueModulePath = path.join(projectRoot, "catalogue", "catalogue-data.js");
  const configModulePath = path.join(projectRoot, "catalogue", "config.js");

  const [hasCatalogue, hasConfig] = await Promise.all([
    fileExists(catalogueModulePath),
    fileExists(configModulePath),
  ]);

  const defaults = { catalogue: null, config: null };

  if (hasCatalogue) {
    const mod = await import(pathToFileURL(catalogueModulePath));
    defaults.catalogue = {
      CATEGORIES: mod.CATEGORIES || [],
      STYLES: mod.STYLES || [],
      ITEMS: mod.ITEMS || [],
    };
  }

  if (hasConfig) {
    const mod = await import(pathToFileURL(configModulePath));
    defaults.config = mod.CONTACT || mod.default || {};
  }

  return defaults;
}

export async function ensureSeedData() {
  if (hasTursoConfig()) {
    await ensureTursoSchema();
    const defaults = await readFrontendDefaults();
    const [catRaw, cfgRaw] = await Promise.all([getKv("catalogue"), getKv("config")]);
    if (!catRaw) await setKv("catalogue", defaults.catalogue || { CATEGORIES: [], STYLES: [], ITEMS: [] });
    if (!cfgRaw) await setKv("config", defaults.config || {});
    return;
  }

  await fs.mkdir(dataDir, { recursive: true });

  const cataloguePath = path.join(dataDir, "catalogue.json");
  const configPath = path.join(dataDir, "config.json");

  const [catExists, cfgExists] = await Promise.all([
    fileExists(cataloguePath),
    fileExists(configPath),
  ]);

  if (catExists && cfgExists) return;

  const defaults = await readFrontendDefaults();

  if (!catExists) {
    await fs.writeFile(
      cataloguePath,
      JSON.stringify(defaults.catalogue || { CATEGORIES: [], STYLES: [], ITEMS: [] }, null, 2),
      "utf8"
    );
  }
  if (!cfgExists) {
    await fs.writeFile(configPath, JSON.stringify(defaults.config || {}, null, 2), "utf8");
  }
}

export async function getCatalogue() {
  if (hasTursoConfig()) {
    try {
      await ensureTursoSchema();
      const raw = await getKv("catalogue");
      return raw ? JSON.parse(raw) : { CATEGORIES: [], STYLES: [], ITEMS: [] };
    } catch {
      return { CATEGORIES: [], STYLES: [], ITEMS: [] };
    }
  }
  return readJson("catalogue.json", { CATEGORIES: [], STYLES: [], ITEMS: [] });
}

export async function setCatalogue(payload) {
  if (hasTursoConfig()) {
    await ensureTursoSchema();
    await setKv("catalogue", payload);
    return;
  }
  await writeJson("catalogue.json", payload);
}

export async function getConfig() {
  if (hasTursoConfig()) {
    try {
      await ensureTursoSchema();
      const raw = await getKv("config");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  return readJson("config.json", {});
}

export async function setConfig(payload) {
  if (hasTursoConfig()) {
    await ensureTursoSchema();
    await setKv("config", payload);
    return;
  }
  await writeJson("config.json", payload);
}
