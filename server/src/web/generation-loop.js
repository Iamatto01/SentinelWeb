import { generateWebsite, saveGeneratedWebsite } from "./claude-agent.js";
import { commitApprovedWebsite } from "./github-sync.js";

let generationInterval = null;
let isGenerating = false;

export async function startGenerationLoop(intervalMs = 5 * 60 * 1000) {
  if (generationInterval) {
    console.log("Generation loop already running");
    return;
  }

  console.log(
    `🚀 Starting website generation loop (every ${intervalMs / 1000}s)`
  );

  // Generate immediately
  await generateAndQueue();

  // Then generate periodically
  generationInterval = setInterval(async () => {
    await generateAndQueue();
  }, intervalMs);

  return { status: "running", interval: intervalMs };
}

export async function stopGenerationLoop() {
  if (generationInterval) {
    clearInterval(generationInterval);
    generationInterval = null;
    console.log("Generation loop stopped");
    return { status: "stopped" };
  }
  return { status: "not running" };
}

async function generateAndQueue() {
  if (isGenerating) {
    console.log("Generation already in progress, skipping...");
    return;
  }

  isGenerating = true;
  try {
    console.log("🔄 Generating new website...");
    const generated = await generateWebsite();
    const saved = await saveGeneratedWebsite(generated.html, "pending");
    await commitApprovedWebsite(saved.id, generated.html);
    console.log(`✓ Website queued: ${saved.filename}`);
    return saved;
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  } finally {
    isGenerating = false;
  }
}

export async function approveAndCommit(websiteId, htmlContent) {
  try {
    await commitApprovedWebsite(websiteId, htmlContent);
    return { success: true, message: "Website committed to GitHub" };
  } catch (error) {
    console.error("Approval error:", error);
    return { success: false, error: error.message };
  }
}

export function getGenerationStatus() {
  return {
    running: generationInterval !== null,
    isGenerating,
  };
}
