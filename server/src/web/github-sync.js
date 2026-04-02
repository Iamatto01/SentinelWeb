import { Octokit } from "octokit";
import fs from "node:fs/promises";
import path from "node:path";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const GITHUB_REPO = "Iamatto01/SentinelWeb";
const GITHUB_BRANCH = "main";

async function getFilePathContent(filepath) {
  try {
    return await fs.readFile(filepath, "utf-8");
  } catch (error) {
    return null;
  }
}

async function getSha(filePath) {
  try {
    const [owner, repo] = GITHUB_REPO.split("/");
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: GITHUB_BRANCH,
    });
    return response.data.sha;
  } catch (error) {
    return null;
  }
}

export async function commitApprovedWebsite(websiteId, htmlContent) {
  if (!process.env.GITHUB_TOKEN) {
    console.warn("GITHUB_TOKEN not set, skipping commit");
    return;
  }

  try {
    const [owner, repo] = GITHUB_REPO.split("/");
    const filepath = `generated-websites/website-${websiteId}.html`;
    const message = `Add generated website #${websiteId}\n\nApproved website design via Claude agent`;

    // Get existing SHA if file exists
    const sha = await getSha(filepath);

    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filepath,
      message,
      content: Buffer.from(htmlContent).toString("base64"),
      branch: GITHUB_BRANCH,
      ...(sha && { sha }),
    });

    console.log(`✓ Committed to GitHub: ${filepath}`);
    return response.data;
  } catch (error) {
    console.error("GitHub commit error:", error.message);
    throw error;
  }
}

export async function validateGitHubAccess() {
  if (!process.env.GITHUB_TOKEN) {
    return { valid: false, message: "GITHUB_TOKEN not set" };
  }

  try {
    const [owner, repo] = GITHUB_REPO.split("/");
    await octokit.rest.repos.get({ owner, repo });
    return { valid: true, message: "GitHub access validated" };
  } catch (error) {
    return { valid: false, message: error.message };
  }
}
