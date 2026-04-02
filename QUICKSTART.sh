#!/bin/bash

# 🚀 QUICKSTART - Website Generator

echo "========================================="
echo "   🎨 OpenClaw Website Generator"
echo "========================================="
echo ""
echo "⚡ QUICK START (3 Steps)"
echo ""

# Check if we're in the right directory
if [ ! -d "server" ]; then
  echo "❌ Error: Run this from the SentinelWeb directory"
  exit 1
fi

echo "Step 1️⃣: Get API Keys"
echo "  • Claude: https://console.anthropic.com/"
echo "  • GitHub: https://github.com/settings/tokens"
echo ""

echo "Step 2️⃣: Edit server/.env"
echo "  CLAUDE_API_KEY=sk-ant-xxxxx"
echo "  GITHUB_TOKEN=ghp_xxxxx"
echo ""

echo "Step 3️⃣: Start Server"
echo "  cd server"
echo "  npm run dev"
echo ""

echo "========================================="
echo "Then visit: http://localhost:5174/generator"
echo "========================================="
echo ""

echo "✅ Files Created:"
echo "  ✓ server/src/web/claude-agent.js      (Claude API)"
echo "  ✓ server/src/web/generator-api.js     (REST API)"
echo "  ✓ server/src/web/generation-loop.js   (5min timer)"
echo "  ✓ server/src/web/github-sync.js       (GitHub auto-commit)"
echo "  ✓ generator.html                      (Approval UI)"
echo "  ✓ server/.env                         (Config)"
echo ""

echo "📚 Documentation:"
echo "  → GENERATOR_SETUP.md (full guide)"
echo ""

echo "🎯 Ready to go!"
