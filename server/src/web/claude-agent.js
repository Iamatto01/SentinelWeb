import fs from "node:fs/promises";
import path from "node:path";

const HUGGING_FACE_API_URL =
  process.env.HUGGING_FACE_API_URL ||
  "https://router.huggingface.co/v1/chat/completions";

const DEFAULT_MODELS = [
  "Qwen/Qwen2.5-72B-Instruct",
  "Qwen/Qwen2.5-32B-Instruct",
  "meta-llama/Llama-3.1-8B-Instruct",
];

function getCandidateModels() {
  const configured = (process.env.HUGGING_FACE_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return configured.length ? configured : DEFAULT_MODELS;
}

const INSPIRATION_SITES = [
  "Stripe (payment platform - modern, minimal design with great typography)",
  "Vercel (deployment platform - sleek dark mode, interactive elements)",
  "Figma (design tool - collaborative interface, clean product showcase)",
  "ProductHunt (product discovery - clean cards, trending layout)",
  "Dribbble (design inspiration - portfolio showcase style)",
  "Notion (workspace - database-like interface, minimalist)",
  "Framer (design tool - animated, modern gradient usage)",
  "Linear (issue tracking - polished dark UI, smooth interactions)",
];

export async function generateWebsite() {
  const apiKey = (process.env.HUGGING_FACE_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("HUGGING_FACE_API_KEY is not set");
  }

  const randomSites = INSPIRATION_SITES.slice(0, 3).join(", ");

  const systemPrompt = `You are an expert website designer and frontend developer.
Generate unique, modern, and visually appealing websites inspired by real-world sites.
Focus on creating websites that are NOT simple or repetitive - make them sophisticated with:
- Interesting layouts and grid systems
- Modern color schemes and gradients
- Smooth animations and transitions
- Professional typography
- Real content themes (e.g., SaaS, portfolio, marketplace, community)

Always return VALID, production-ready HTML with embedded CSS and JavaScript.`;

  const userPrompt = `Generate a complete, unique, and sophisticated HTML website inspired by sites like: ${randomSites}

Requirements:
1. Create ONE full HTML file with embedded CSS and JavaScript
2. Make it visually interesting with modern design patterns
3. Include real content (not Lorem Ipsum placeholder hell)
4. Add smooth animations and interactive elements
5. Use professional color schemes with gradients
6. Make it responsive and modern
7. Each website should be DIFFERENT from the last - create varied concepts

Return ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>.
Include all CSS in <style> tags and JS in <script> tags.`;

  const models = getCandidateModels();
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(HUGGING_FACE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 4000,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Try next model if provider does not support this one.
        if (
          response.status === 400 &&
          errorText.includes("model_not_supported")
        ) {
          lastError = new Error(
            `Hugging Face model not supported: ${model} (${errorText})`
          );
          continue;
        }

        throw new Error(
          `Hugging Face API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      const htmlContent = data?.choices?.[0]?.message?.content?.trim();

      if (!htmlContent) {
        throw new Error("No generated content returned from Hugging Face");
      }

      // Validate it's HTML
      if (!htmlContent.includes("<!DOCTYPE") && !htmlContent.includes("<html")) {
        throw new Error("Generated content is not valid HTML");
      }

      return {
        html: htmlContent,
        timestamp: new Date().toISOString(),
        model,
      };
    } catch (error) {
      lastError = error;
    }
  }

  console.error("Error generating website:", lastError);
  throw lastError;
}

export async function saveGeneratedWebsite(htmlContent, folder = "pending") {
  const dataDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../../data/generated"
  );
  const folderPath = path.join(dataDir, folder);

  try {
    await fs.mkdir(folderPath, { recursive: true });

    const timestamp = Date.now();
    const filename = `website-${timestamp}.html`;
    const filepath = path.join(folderPath, filename);

    await fs.writeFile(filepath, htmlContent, "utf-8");

    return {
      id: timestamp,
      filename,
      filepath,
      folder,
    };
  } catch (error) {
    console.error("Error saving website:", error);
    throw error;
  }
}

export async function moveWebsite(fromFolder, toFolder, timestamp) {
  const dataDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../../data/generated"
  );
  const fromPath = path.join(dataDir, fromFolder, `website-${timestamp}.html`);
  const toPath = path.join(dataDir, toFolder, `website-${timestamp}.html`);

  try {
    const content = await fs.readFile(fromPath, "utf-8");
    await fs.mkdir(path.join(dataDir, toFolder), { recursive: true });
    await fs.writeFile(toPath, content, "utf-8");

    // Keep the original in pending so items are not removed automatically.
    return { success: true, from: fromFolder, to: toFolder, copied: true };
  } catch (error) {
    console.error("Error moving website:", error);
    throw error;
  }
}

export async function getPendingWebsites() {
  const dataDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../../data/generated/pending"
  );

  try {
    const files = await fs.readdir(dataDir);
    const websites = [];

    for (const file of files) {
      if (file.endsWith(".html")) {
        const timestamp = parseInt(
          file.replace("website-", "").replace(".html", "")
        );
        websites.push({
          id: timestamp,
          filename: file,
        });
      }
    }

    return websites.sort((a, b) => b.id - a.id);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Error reading pending websites:", error);
    throw error;
  }
}

export async function getWebsiteContent(folder, timestamp) {
  const dataDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../../data/generated"
  );
  const filepath = path.join(dataDir, folder, `website-${timestamp}.html`);

  try {
    const content = await fs.readFile(filepath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error reading website:", error);
    throw error;
  }
}
