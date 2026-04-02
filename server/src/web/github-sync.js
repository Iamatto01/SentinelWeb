import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const GITHUB_REPO = "Iamatto01/SentinelWeb";
const GITHUB_BRANCH = "main";

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
  } catch {
    return null;
  }
}

export async function commitFileToGitHub(filePath, content, message) {
  if (!process.env.GITHUB_TOKEN) {
    console.warn("GITHUB_TOKEN not set, skipping commit");
    return;
  }

  try {
    const [owner, repo] = GITHUB_REPO.split("/");
    const sha = await getSha(filePath);

    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message,
      content: Buffer.from(content).toString("base64"),
      branch: GITHUB_BRANCH,
      ...(sha && { sha }),
    });

    console.log(`✓ Committed to GitHub: ${filePath}`);
    return response.data;
  } catch (error) {
    console.error("GitHub commit error:", error.message);
    throw error;
  }
}

export async function commitApprovedWebsite(websiteId, htmlContent) {
  return commitFileToGitHub(
    `generated-websites/website-${websiteId}.html`,
    htmlContent,
    `Add generated website #${websiteId}\n\nApproved website design via SentinelWeb`
  );
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