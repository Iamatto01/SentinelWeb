# 🎨 OpenClaw Website Generator - Complete Setup Guide

## 📋 What You Have

A complete AI-powered website generator system that:
- ✨ Generates sophisticated HTML/CSS/JS websites every 5 minutes
- 👁️ Shows previews in a beautiful React approval dashboard
- ✅ Lets you approve designs one-by-one
- 📦 Auto-commits approved sites to your GitHub repo
- 🎯 Creates unique, non-repetitive designs inspired by real websites

---

## 🔧 Prerequisites

1. **Node.js** (v18+) - Already checked in package.json
2. **Claude API Key** - https://console.anthropic.com/
3. **GitHub Token** - https://github.com/settings/tokens (repo scope)
4. **Git Repository** - Iamatto01/SentinelWeb (already configured)

---

## ⚙️ Installation

### Step 1: Set Environment Variables

Edit `server/.env` (created for you):

```bash
# Your Claude API key
CLAUDE_API_KEY=sk-ant-[your-key-here]

# Your GitHub personal token
GITHUB_TOKEN=ghp_[your-token-here]
```

### Step 2: Get API Keys

#### Claude API Key:
1. Go to https://console.anthropic.com/
2. Sign in (or create account)
3. Click "API keys" in left sidebar
4. Create new key → Copy it
5. Paste into `.env` → `CLAUDE_API_KEY=sk-ant-...`

#### GitHub Token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Check `repo` scope (full control of private repositories)
4. Generate → Copy token
5. Paste into `.env` → `GITHUB_TOKEN=ghp_...`

### Step 3: Install Dependencies

```bash
cd server
npm install
```

### Step 4: Start the Server

```bash
npm run dev
```

You should see:
```
Admin backend running: http://localhost:5174
🚀 Starting website generation loop (every 300000s)
```

### Step 5: Open the Dashboard

Visit: **http://localhost:5174/generator**

---

## 🎮 Using the Generator

### Dashboard Features

1. **Generate Now** - Create a single website immediately
2. **Start 5min Loop** - Auto-generate every 5 minutes
3. **Pending Queue** - Shows all generated websites waiting for approval
4. **Live Preview** - See designs in card format
5. **Approve** - ✓ Commit to GitHub
6. **Reject** - ✕ Delete design
7. **View Full** - Open in full window

### Workflow

```
1. Click "Start 5min Loop"
   ↓
2. Generation runs every 5 minutes
   ↓
3. Websites appear in Pending queue
   ↓
4. Preview designs in dashboard
   ↓
5. Click Approve or Reject
   ↓
6. Approved sites auto-commit to GitHub!
```

---

## 📁 File Structure

```
server/
├── src/
│   ├── server.js                 # Main Express app
│   └── web/
│       ├── claude-agent.js       # Claude API integration
│       ├── generator-api.js      # REST endpoints
│       ├── generation-loop.js    # 5-minute loop manager
│       ├── github-sync.js        # GitHub auto-commit
│       └── ... (existing routers)
├── data/
│   └── generated/
│       ├── pending/              # Waiting approval
│       ├── approved/             # Committed to GitHub
│       └── rejected/             # Discarded
├── .env                          # Your API keys
└── package.json                  # Dependencies
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:5174/api/generator`

### Generate Website
```bash
POST /generate
Response: { success: true, id: 1709305342123, filename: "website-1709305342123.html" }
```

### Get Pending Websites
```bash
GET /pending
Response: { websites: [{id: 1709305342123, filename: "website-1709305342123.html"}, ...] }
```

### View Website
```bash
GET /pending/1709305342123
Response: HTML content
```

### Approve (commit to GitHub)
```bash
POST /approve/1709305342123
Response: { success: true, message: "Website approved and committed to GitHub" }
```

### Reject
```bash
POST /reject/1709305342123
Response: { success: true, message: "Website rejected" }
```

---

## 🌐 Access Points

| URL | Purpose |
|-----|---------|
| http://localhost:5174/generator | Approval dashboard |
| http://localhost:5174/api/generator/pending | List pending websites (JSON) |
| http://localhost:5174/api/generator/pending/{id} | View website HTML |

---

## 🐛 Troubleshooting

### Error: "CLAUDE_API_KEY not set"
- [ ] Set `CLAUDE_API_KEY=sk-ant-...` in `.env`
- [ ] Restart server

### Error: "GITHUB_TOKEN is not set"
- [ ] Optional - only needed for auto-commits
- [ ] Set in `.env` if you want it

### No websites generating
- [ ] Check server console for errors
- [ ] Verify Claude API key is correct
- [ ] Try "Generate Now" button manually

### Generated website looks broken
- [ ] Claude occasional fails - just reject and retry
- [ ] Check Claude API quota/limits

### GitHub commits not working
- [ ] Verify GitHub token has `repo` scope
- [ ] Check token isn't expired
- [ ] Verify repo path is: `Iamatto01/SentinelWeb`

---

## 📊 Monitoring

### Dashboard
- Real-time preview of pending websites
- Live generation status
- Queue counter

### Server Logs
```
✓ Website queued: website-1709305342123.html
✓ Committed to GitHub: generated-websites/website-1709305342123.html
```

### File System
```
server/data/generated/
├── pending/       # Currently waiting
├── approved/      # Successfully committed
└── rejected/      # User rejected
```

---

## 🎯 Next Steps

1. ✅ Set API keys in `.env`
2. ✅ Run `npm run dev`
3. ✅ Visit http://localhost:5174/generator
4. ✅ Click "Start 5min Loop"
5. ✅ Wait for first generation (5 min) or click "Generate Now"
6. ✅ Approve/Reject designs
7. ✅ Check GitHub repo for committed sites

---

## 📝 Important Notes

- Each website is unique (Claude varies designs)
- Generation takes ~10-30 seconds per website
- Approved sites are saved to `server/data/generated/approved/`
- GitHub commits go to `Iamatto01/SentinelWeb` repo in `generated-websites/` folder
- Loop pauses between generations to avoid API rate limits

---

## 🆘 Need Help?

Check the server console output for detailed error messages. All operations log to console with ✓ (success) or ❌ (error) prefixes.

**Happy generating!** 🚀
