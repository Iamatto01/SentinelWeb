#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🎨 Website Generator - Verification Checklist           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PASS="✅"
FAIL="❌"
WARN="⚠️"
INFO="ℹ️"

# Check if we're in the right directory
if [ ! -d "server" ]; then
  echo "$FAIL Being in correct directory"
  echo "   Run this from SentinelWeb root directory"
  exit 1
else
  echo "$PASS In SentinelWeb directory"
fi

# Check Node version
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo "$PASS Node.js installed: $NODE_VERSION"
else
  echo "$FAIL Node.js not installed"
  exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo "$PASS npm installed: $NPM_VERSION"
else
  echo "$FAIL npm not installed"
  exit 1
fi

echo ""
echo "📁 Checking Files..."

# Check backend files
if [ -f "server/src/web/claude-agent.js" ]; then
  echo "$PASS claude-agent.js"
else
  echo "$FAIL claude-agent.js"
fi

if [ -f "server/src/web/generator-api.js" ]; then
  echo "$PASS generator-api.js"
else
  echo "$FAIL generator-api.js"
fi

if [ -f "server/src/web/generation-loop.js" ]; then
  echo "$PASS generation-loop.js"
else
  echo "$FAIL generation-loop.js"
fi

if [ -f "server/src/web/github-sync.js" ]; then
  echo "$PASS github-sync.js"
else
  echo "$FAIL github-sync.js"
fi

if [ -f "generator.html" ]; then
  echo "$PASS generator.html (React UI)"
else
  echo "$FAIL generator.html (React UI)"
fi

echo ""
echo "📦 Checking Dependencies..."

if [ -f "server/package.json" ]; then
  echo "$PASS package.json exists"

  if grep -q "@anthropic-ai/sdk" server/package.json; then
    echo "$PASS @anthropic-ai/sdk dependency"
  else
    echo "$FAIL @anthropic-ai/sdk dependency"
  fi

  if grep -q "octokit" server/package.json; then
    echo "$PASS octokit dependency"
  else
    echo "$FAIL octokit dependency"
  fi
else
  echo "$FAIL package.json"
fi

# Check if node_modules exists
if [ -d "server/node_modules" ]; then
  echo "$PASS node_modules installed"
else
  echo "$WARN node_modules not installed (run: npm install)"
fi

echo ""
echo "⚙️  Checking Configuration..."

if [ -f "server/.env" ]; then
  echo "$PASS .env file exists"

  if grep -q "CLAUDE_API_KEY=" server/.env; then
    if grep -q "CLAUDE_API_KEY=sk-ant-" server/.env; then
      echo "$PASS CLAUDE_API_KEY has correct format"
    else
      echo "$WARN CLAUDE_API_KEY needs value (sk-ant-xxxxx)"
    fi
  else
    echo "$WARN CLAUDE_API_KEY not found in .env"
  fi

  if grep -q "GITHUB_TOKEN=" server/.env; then
    if grep -q "GITHUB_TOKEN=ghp_" server/.env; then
      echo "$PASS GITHUB_TOKEN has correct format"
    else
      echo "$INFO GITHUB_TOKEN optional for GitHub commits"
    fi
  else
    echo "$INFO GITHUB_TOKEN optional for GitHub commits"
  fi
else
  echo "$WARN .env file not found"
fi

echo ""
echo "📚 Checking Documentation..."

[ -f "GENERATOR_SETUP.md" ] && echo "$PASS GENERATOR_SETUP.md" || echo "$WARN GENERATOR_SETUP.md"
[ -f "HOW_IT_WORKS.md" ] && echo "$PASS HOW_IT_WORKS.md" || echo "$WARN HOW_IT_WORKS.md"
[ -f "README_GENERATOR.md" ] && echo "$PASS README_GENERATOR.md" || echo "$WARN README_GENERATOR.md"

echo ""
echo "🔍 Checking Server Configuration..."

if grep -q "createWebsiteGeneratorRouter" server/src/server.js; then
  echo "$PASS Generator router registered"
else
  echo "$FAIL Generator router not registered"
fi

if grep -q "startGenerationLoop" server/src/server.js; then
  echo "$PASS generation loop starter configured"
else
  echo "$FAIL generation loop not configured"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    SUMMARY & NEXT STEPS                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "1️⃣  GET API KEYS:"
echo "   Claude: https://console.anthropic.com/"
echo "   GitHub: https://github.com/settings/tokens"
echo ""

echo "2️⃣  UPDATE server/.env:"
echo "   CLAUDE_API_KEY=sk-ant-[your-key]"
echo "   GITHUB_TOKEN=ghp_[your-token]"
echo ""

echo "3️⃣  INSTALL DEPENDENCIES (if not done):"
echo "   cd server"
echo "   npm install"
echo ""

echo "4️⃣  START SERVER:"
echo "   npm run dev"
echo ""

echo "5️⃣  OPEN DASHBOARD:"
echo "   http://localhost:5174/generator"
echo ""

echo "6️⃣  ENJOY!"
echo "   Click 'Start 5min Loop' and watch websites generate ✨"
echo ""
