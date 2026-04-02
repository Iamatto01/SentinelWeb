# 🎨 OpenClaw Website Generator

> AI-powered website generator that creates a new unique website every 5 minutes, with a beautiful React dashboard for approval and auto-commits to GitHub.

## ✨ Features

- **🤖 Claude AI Generation** - Creates unique, sophisticated HTML/CSS/JS websites
- **⏰ Continuous Loop** - Generates new designs every 5 minutes automatically
- **👁️ Live Dashboard** - React approval UI with real-time previews
- **✅ One-by-One Approval** - Filter and approve only the designs you love
- **📦 Auto GitHub Commits** - Approved websites auto-commit to your repo
- **🎨 Real-World Inspired** - Designs inspired by: Stripe, Vercel, Figma, ProductHunt
- **🌈 Unique Diversity** - Each website is different (no repetition)

## 🚀 Quick Start

### 1. Get API Keys
- **Claude** → https://console.anthropic.com/ (get `sk-ant-...` key)
- **GitHub** → https://github.com/settings/tokens (create with `repo` scope)

### 2. Configure
Edit `server/.env`:
```env
CLAUDE_API_KEY=sk-ant-xxxxx
GITHUB_TOKEN=ghp_xxxxx
```

### 3. Run
```bash
cd server
npm install
npm run dev
```

### 4. Access Dashboard
Visit: **http://localhost:5174/generator**

## 🎮 Dashboard Usage

```
START 5MIN LOOP
       ↓
[New websites generated every 5 minutes]
       ↓
Live Preview in Queue
       ↓
APPROVE           or        REJECT
    ↓                          ↓
GitHub Commit          Discarded
```

### Controls
| Button | Action |
|--------|--------|
| ✨ Generate Now | Create one website immediately |
| ▶️ Start 5min Loop | Enable automatic generation every 5 minutes |
| 👁️ View Full | Open in fullscreen |
| ✓ Approve | Commit to GitHub repo |
| ✕ Reject | Delete design |

## 📁 What Was Created

### Backend (Node.js)
```
server/src/web/
├── claude-agent.js          # Claude API integration
├── generator-api.js         # REST API endpoints
├── generation-loop.js       # 5-minute timer loop
└── github-sync.js           # GitHub auto-commit
```

### Frontend (React)
```
generator.html              # Approval dashboard (real-time)
```

### Storage
```
server/data/generated/
├── pending/                 # Waiting for approval
├── approved/                # Committed to GitHub
└── rejected/                # User-rejected
```

### Configuration
```
server/.env                  # Your API keys
server/.env.example          # Template
```

## 📚 Documentation

| File | Purpose |
|------|---------|
| `GENERATOR_SETUP.md` | Complete setup guide with troubleshooting |
| `HOW_IT_WORKS.md` | Architecture & detailed flow diagrams |
| `SETUP_INSTRUCTIONS.txt` | Quick reference guide |

## 📡 API Endpoints

All endpoints at `/api/generator/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pending` | List pending websites |
| POST | `/generate` | Generate new website |
| GET | `/:folder/:id` | View website HTML |
| POST | `/approve/:id` | Approve & commit to GitHub |
| POST | `/reject/:id` | Reject & discard |

### Example Usage

```bash
# Generate a website
curl -X POST http://localhost:5174/api/generator/generate

# View pending websites
curl http://localhost:5174/api/generator/pending

# Approve website (commits to GitHub)
curl -X POST http://localhost:5174/api/generator/approve/1709305342123

# View website content
curl http://localhost:5174/api/generator/pending/1709305342123
```

## 🧠 How Claude Generation Works

### What Claude Creates
- ✅ Complete HTML websites with embedded CSS and JavaScript
- ✅ Modern, sophisticated designs
- ✅ Responsive layouts
- ✅ Smooth animations and interactions
- ✅ Real content (not Lorem Ipsum)
- ✅ Professional color schemes and gradients

### Inspiration Sources
Claude analyzes designs from:
- Stripe (payment platforms - modern, minimal)
- Vercel (deployment - sleek dark UI)
- Figma (design tool - collaborative)
- ProductHunt (product discovery - trending layout)
- Dribbble (design inspiration - portfolio style)
- Notion (workspace - minimalist)
- Framer (design tool - animated)
- Linear (issue tracking - polished)

### Generation Process
```javascript
generateWebsite()
  ↓
[Claude analyzes inspiration]
  ↓
[Creates unique design variations]
  ↓
[Returns complete HTML with CSS + JS]
  ↓
[Saved to pending folder]
```

## 🔄 Workflow Example

```
15:00 → Generate #1 → Dashboard shows preview
15:05 → You approve #1 → Commits to GitHub
15:10 → Generate #2 → Dashboard shows preview
15:15 → Generate #3 → Dashboard shows 2 pending
15:15 → You reject #2 → Removed from queue
15:20 → You approve #3 → Commits to GitHub
15:25 → Generate #4 → Dashboard shows 1 pending
... (continues every 5 minutes)
```

## 📊 File Organization

### Local Storage
```
server/data/generated/
├── pending/
│   ├── website-1709305342123.html  ← Just generated
│   └── website-1709305342456.html
├── approved/
│   ├── website-1709305340000.html  ← Sent to GitHub
│   └── website-1709305340111.html
└── rejected/
    ├── website-1709305338888.html  ← User rejected
    └── website-1709305338999.html
```

### GitHub Storage
```
Iamatto01/SentinelWeb/
└── generated-websites/
    ├── website-1709305340000.html
    ├── website-1709305340111.html
    └── ... (each approved site commits here)
```

## ⚙️ Configuration

### Environment Variables
```env
# Required for generation
CLAUDE_API_KEY=sk-ant-xxxxx
└─ Get from: https://console.anthropic.com/

# Optional for GitHub commits
GITHUB_TOKEN=ghp_xxxxx
└─ Get from: https://github.com/settings/tokens
```

### Generation Settings
- **Interval**: 5 minutes (configurable in code)
- **Model**: Claude Opus 4.6 (highest quality)
- **Max Tokens**: 8000 (enough for full website)
- **Repository**: `Iamatto01/SentinelWeb`

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Nothing generating | Verify `CLAUDE_API_KEY` in `.env` |
| GitHub commits fail | Ensure `GITHUB_TOKEN` has `repo` scope |
| Preview not loading | Check browser console for errors |
| Server won't start | Run `npm install` in server/ folder |
| Rate limit errors | Claude API account may need billing setup |

## 📈 Performance

| Operation | Time |
|-----------|------|
| Generation | 10-30s |
| File Save | <100ms |
| GitHub Commit | 1-3s |
| Dashboard Refresh | <1s |

## 🎯 Use Cases

- **Design Inspiration** - Get fresh design ideas automatically
- **Portfolio Building** - Create diverse portfolio of generated sites
- **Design Testing** - Test how users respond to AI-generated designs
- **Demo Material** - Showcase AI capabilities with real examples
- **Rapid Prototyping** - Quickly explore design variations

## ✅ What's Included

- ✅ Claude API integration (generates)
- ✅ Express API server (manages)
- ✅ React dashboard (previews)
- ✅ GitHub integration (auto-commits)
- ✅ File storage system (pending/approved/rejected)
- ✅ 5-minute generation loop
- ✅ Complete documentation
- ✅ Configuration files

## 🚀 Next Steps

1. **Set API Keys** → Edit `server/.env`
2. **Start Server** → `npm run dev` in server/
3. **Open Dashboard** → http://localhost:5174/generator
4. **Click "Start 5min Loop"** → Starts auto-generation
5. **Review & Approve** → Your designs ship to GitHub!

## 📖 Documentation

- **GENERATOR_SETUP.md** - Complete setup instructions
- **HOW_IT_WORKS.md** - Architecture and flow diagrams
- **SETUP_INSTRUCTIONS.txt** - Quick reference

## 🔐 Security Notes

- Cache API keys only in `.env` (never commit)
- GitHub token should have minimal scope (repo only)
- Claude API is called from backend (safe)
- All generated files stored locally first

## 📝 License

Part of SentinelWeb project

---

**Ready to generate?** 🎨✨

```bash
cd SentinelWeb/server
npm run dev
```

Then visit: http://localhost:5174/generator
