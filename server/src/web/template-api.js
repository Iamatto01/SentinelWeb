import express from "express";
import fs from "node:fs/promises";
import path from "node:path";

import { requireAdmin } from "./auth.js";
import { getProjectRoot } from "./storage.js";

function titleFromSlug(slug) {
  return slug
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function safeSlug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
}

async function getTemplateRoot() {
  const projectRoot = await getProjectRoot();
  return path.join(projectRoot, "catalogue");
}

async function listTemplateFiles() {
  const templateRoot = await getTemplateRoot();
  const entries = await fs.readdir(templateRoot, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = safeSlug(entry.name);
    if (!slug) continue;

    const filePath = path.join(templateRoot, slug, `${slug}.html`);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      items.push({
        slug,
        name: titleFromSlug(slug),
        filePath,
        url: `/catalogue/${slug}/${slug}.html`,
        updatedAt: stat.mtime.toISOString(),
      });
    } catch {
      // ignore invalid folders
    }
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

async function resolveTemplatePath(slug) {
  const cleanSlug = safeSlug(slug);
  if (!cleanSlug) return null;
  const templateRoot = await getTemplateRoot();
  const filePath = path.join(templateRoot, cleanSlug, `${cleanSlug}.html`);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;
    return { slug: cleanSlug, filePath };
  } catch {
    return null;
  }
}

export function createTemplateRouter() {
  const router = express.Router();

  router.get("/", async (_req, res) => {
    const items = await listTemplateFiles();
    res.json({
      count: items.length,
      meetsThirtyTemplateTarget: items.length >= 30,
      items,
    });
  });

  router.get("/:slug", async (req, res) => {
    const resolved = await resolveTemplatePath(req.params.slug);
    if (!resolved) return res.status(404).json({ error: "Template not found" });
    const html = await fs.readFile(resolved.filePath, "utf8");
    return res.json({
      slug: resolved.slug,
      name: titleFromSlug(resolved.slug),
      url: `/catalogue/${resolved.slug}/${resolved.slug}.html`,
      html,
    });
  });

  router.put("/:slug", requireAdmin, async (req, res) => {
    const resolved = await resolveTemplatePath(req.params.slug);
    if (!resolved) return res.status(404).json({ error: "Template not found" });

    const html = String(req.body?.html || "").trim();
    if (!html || !html.toLowerCase().includes("<html")) {
      return res.status(400).json({ error: "Invalid HTML payload" });
    }

    await fs.writeFile(resolved.filePath, `${html}\n`, "utf8");
    return res.json({ ok: true, slug: resolved.slug });
  });

  return router;
}
