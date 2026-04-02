# 🎯 Website Generator - How It Works

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR DASHBOARD                           │
│              http://localhost:5174/generator                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ▼ (React Frontend)
  ┌────────────────────────────────────────────────┐
  │  • View pending websites                       │
  │  • Click "Generate Now" or "Start 5min Loop"   │
  │  • See live previews                           │
  │  • Approve/Reject designs                      │
  └────────────────┬─────────────────────────────┬─┘
                   │                             │
        (GET/POST /api/generator/...)            │
                   ▼                             │
  ┌──────────────────────────────────────────────┴───┐
  │           EXPRESS SERVER (Node.js)               │
  │           http://localhost:5174                  │
  ├────────────────────────────────────────────────┬─┤
  │  generator-api.js                              │ │
  │  • /generate          → Trigger generation     │ │
  │  • /pending           → List queued sites      │ │
  │  • /:folder/:id       → Serve HTML             │ │
  │  • /approve/:id       → Move & commit          │ │
  │  • /reject/:id        → Delete design          │ │
  ├────────────────────────────────────────────────┤ │
  │  generation-loop.js                            │ │
  │  • Runs every 5 minutes                        │ │
  │  • Calls generateWebsite()                     │ │
  │  • Saves to /pending folder                    │ │
  ├────────────────────────────────────────────────┤ │
  │  claude-agent.js                               │ │
  │  • Calls Claude API                            │ │
  │  • Generates unique HTML/CSS/JS                │ │
  │  • Inspired by: Stripe, Vercel, Figma, etc     │ │
  ├────────────────────────────────────────────────┤ │
  │  github-sync.js                                │ │
  │  • When you approve: commits to GitHub         │ │
  │  • Repo: Iamatto01/SentinelWeb                 │ │
  │  • Folder: generated-websites/                 │ │
  └────────────────────────────────────────────────┬─┘
                   │
                   ├─────────────────┬──────────────┐
                   ▼                 ▼              ▼
  ┌──────────────────────┐  ┌──────────────────┐  ┌─────────────┐
  │  Local File System   │  │  Claude API      │  │ GitHub API  │
  │                      │  │                  │  │             │
  │  data/generated/     │  │ (claude.ai)      │  │ (github.com)│
  │  ├── pending/        │  │                  │  │             │
  │  │   ├─ 1709305...   │  │ Generates:       │  │ Auto-commits│
  │  │   └─ 1709305...   │  │ • HTML           │  │ to your     │
  │  │                   │  │ • CSS            │  │ repo        │
  │  ├── approved/       │  │ • JavaScript     │  │             │
  │  │   └─ 1709305...   │  │ • Unique Design  │  │ Status:     │
  │  │                   │  │                  │  │ ✅ Latest   │
  │  └── rejected/       │  │                  │  │ Commit:     │
  │      └─ 1709305...   │  │                  │  │ Add          │
  │                      │  │                  │  │ generated    │
  └──────────────────────┘  └──────────────────┘  │ website     │
                                                   └─────────────┘
```

---

## 📊 Data Flow - Step by Step

### 1️⃣ **You Click "Generate Now"**
```
Browser → POST /api/generator/generate
          ↓
Server → generateWebsite() from claude-agent.js
          ↓
Claude API → Generates HTML (with CSS + JS embedded)
          ↓
Server → saveGeneratedWebsite(html, "pending")
          ↓
File System → server/data/generated/pending/website-1709305342123.html
          ↓
Response → { success: true, id: 1709305342123 }
          ↓
Browser → Refreshes dashboard, shows new preview
```

### 2️⃣ **Generation Loop Runs Every 5 Minutes**
```
Timer (5 min) → startGenerationLoop()
          ↓
generateAndQueue() → Same as step 1, but automated
          ↓
Repeats every 5 minutes
```

### 3️⃣ **You Click "Approve"**
```
Browser → POST /api/generator/approve/1709305342123
          ↓
Server → moveWebsite("pending", "approved", id)
          ↓
Server → commitApprovedWebsite(id, htmlContent)
          ↓
GitHub API → Creates commit in Iamatto01/SentinelWeb
          ↓
File System → Moves from pending/ to approved/
          ↓
GitHub → Commit shows up in your repo!
```

### 4️⃣ **You Click "Reject"**
```
Browser → POST /api/generator/reject/1709305342123
          ↓
Server → moveWebsite("pending", "rejected", id)
          ↓
File System → Moves from pending/ to rejected/
          ↓
Dashboard → Website disappears from queue
```

---

## 🧠 Claude Generation Details

### System Prompt (Claude is instructed to):
- ✅ Create sophisticated, modern websites
- ✅ Use real-world design inspiration (Stripe, Vercel, Figma, etc.)
- ✅ Include smooth animations and transitions
- ✅ Write valid, production-ready HTML
- ✅ Embed all CSS and JavaScript
- ✅ Make each design UNIQUE and diverse
- ✅ Use professional color schemes and gradients
- ✅ Include real content (not Lorem Ipsum)

### Output Format:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      /* All CSS embedded here */
    </style>
  </head>
  <body>
    <!-- Real HTML structure -->
    <script>
      // All JS embedded here for interactivity
    </script>
  </body>
</html>
```

---

## 💾 File Storage Organization

```
server/data/generated/
│
├── pending/
│   ├── website-1709305342123.html    ← Just generated, waiting approval
│   ├── website-1709305342456.html
│   └── website-1709305342789.html
│
├── approved/
│   ├── website-1709305340000.html    ← You approved this
│   └── website-1709305340111.html    └─ Now in GitHub repo
│
└── rejected/
    ├── website-1709305338888.html    ← You rejected this
    └── website-1709305338999.html    ← Kept for history
```

---

## 🔐 Environment Variables Explained

```env
# Required for API requests
CLAUDE_API_KEY=sk-ant-xxxxx
├─ Get from: https://console.anthropic.com/
├─ Rate limit: Pay-as-you-go
└─ Used by: claude-agent.js

# Optional for GitHub auto-commits
GITHUB_TOKEN=ghp_xxxxx
├─ Get from: https://github.com/settings/tokens
├─ Scope: repo (full control of private repos)
└─ Used by: github-sync.js

# Existing config
JWT_SECRET=...              (for auth/sessions)
ADMIN_EMAILS=...            (allowed users)
PUBLIC_BASE_URL=...         (your backend URL)
```

---

## 🚦 Status Indicators

### Dashboard Shows:
- **🟢 Generating...** - Claude is creating a website
- **🟡 Pending (5)** - 5 websites waiting for approval
- **🟢 ✓ Approved** - Successfully committed to GitHub
- **🔴 ✕ Rejected** - Moved to history

### Server Logs Show:
```
✓ Website queued: website-1709305342123.html
✓ Committed to GitHub: generated-websites/website-1709305342123.html
❌ Generation failed: API error
```

---

## ⚡ Performance Notes

| Operation | Time | Notes |
|-----------|------|-------|
| Generate | 10-30s | Claude API response time |
| Save | <100ms | Local file write |
| Preview Load | <500ms | Browser iframe |
| GitHub Commit | 1-3s | GitHub API |
| Dashboard Refresh | <1s | React update |

---

## 🎨 Design Variation Strategy

Claude is instructed to create DIFFERENT designs each time:
- Random inspiration sites selected from: Stripe, Vercel, Figma, ProductHunt, Dribbble, Notion, Framer, Linear
- Different color schemes each generation
- Varied layouts: Hero + Features, Grid showcase, Card layout, etc.
- Different content themes: SaaS, Portfolio, Marketplace, Community, etc.
- Mix of animations: Parallax, fade-in, hover effects, scroll triggers

Result: **No two websites look the same!**

---

## 🔄 Continuous Workflow

```
Hour 1:
  :00 → Generate #1 (pending)
  :05 → Your review
  :05 → Approve #1 → GitHub commit
  :10 → Generate #2 (pending)
  :30 → Reject #2 → Discarded
  :40 → Generate #3 → You reject
  :50 → Generate #4 → You approve → GitHub commit

Hour 2:
  :00 → Generate #5
  :05 → Generate #6
  ... (continues forever!)
```

---

## ✅ What's Complete

- ✅ Claude API integration
- ✅ Continuous generation loop (5 min)
- ✅ Approval queue system
- ✅ GitHub auto-commit
- ✅ React dashboard with previews
- ✅ REST API endpoints
- ✅ File storage system
- ✅ Configuration (.env)

---

## 🚣 Next Steps for You

1. Get API keys
2. Set in `.env`
3. Run `npm run dev`
4. Visit `/generator`
5. Start generating!

**Enjoy your AI design factory! 🎨✨**
