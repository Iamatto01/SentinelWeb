import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "url";

function resolveDataDir() {
  const cwd = process.cwd();
  // If started from /server, use /server/data. Otherwise use /server/data under project root.
  if (path.basename(cwd).toLowerCase() === "server") return path.resolve(cwd, "data");
  return path.resolve(cwd, "server", "data");
}

const dataDir = resolveDataDir();

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
  return readJson("catalogue.json", { CATEGORIES: [], STYLES: [], ITEMS: [] });
}

export async function setCatalogue(payload) {
  await writeJson("catalogue.json", payload);
}

export async function getConfig() {
  return readJson("config.json", {});
}

export async function setConfig(payload) {
  await writeJson("config.json", payload);
}
