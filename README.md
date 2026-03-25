# SentinalWeb

A polished catalogue for selling small website templates online.

- 10 categories
- 50 products (5 per category)
- 31 unique live template pages (30+ target exceeded)
- Search / filter / sort
- Product detail modal
- Admin backend with email magic-link login
- Visual WYSIWYG template editor (click-to-edit + modules + image insertion)

## Run the catalogue (simple)

Open `index.html` in your browser.

If your browser blocks ES modules when opening from file://, use a tiny local server:

### Option A: Python (if installed)

```bash
python -m http.server 5173
```

Then open: `http://localhost:5173/`

Main entry point:

- `http://localhost:5173/`

### Option B: Node (if installed)

```bash
npx serve .
```

## Customize for your business

### 1) Change your contact links

Edit `CONTACT` in `catalogue/config.js`:

- `whatsappNumberInternational` (recommended)
- `email`

The “Buy this template” button will open WhatsApp or Email with a prefilled message.

## Template previews (one website per example)

Open any template in the catalogue and click **Open preview**.

Direct link format:

`/catalogue/<slug>/<slug>.html` (example: `/catalogue/bakery_luxe/bakery_luxe.html`)

### 2) Change catalogue products

Edit the data in `catalogue/catalogue-data.js`:

- Categories: `CATEGORIES`
- Products: `ITEMS`

Each product has:

- `sku` (template code)
- `name`, `short`, `pitch`
- `price`
- `pages`, `bestFor`, `includes`, `tags`
- `accent` colors (used for thumbnails)

## Next step (later)

When you want, we can add:

- real checkout
- auto delivery (download link)
- admin panel to add/edit templates
- preview pages for each template

## Admin backend (email login)

Start backend:

```bash
cd server
npm install
npm run dev
```

Admin UI:

- `http://localhost:5174/admin/`

### Visual template editor workflow

1) Login in admin dashboard
2) Open a template from the template library panel
3) Click text directly inside the preview iframe to edit copy
4) Insert image URL into selected element
5) Add modular layout boxes (hero, feature, cards)
6) Save template HTML back to file

### Gmail setup (send login link to your inbox)

1) Turn on Google 2-Step Verification
2) Create an **App Password** (Google Account → Security → App passwords)
3) Create `server/.env` (copy from `server/.env.example`) and set:

```env
PUBLIC_BASE_URL=http://localhost:5174

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=SentinalWeb <yourgmail@gmail.com>
```

If SMTP is not set, the backend prints the login link to the console (dev mode).

## Optional: Turso database backend

By default, catalogue/config are saved in `server/data/*.json`.

To use Turso key-value storage instead:

1) Create a Turso database
2) Add these env vars in `server/.env`:

```env
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

When `TURSO_DATABASE_URL` is set, the backend stores catalogue/config in Turso and auto-creates the table.

## Deploy on Render

This repository now supports running from the repo root on Render.

Recommended Render Web Service settings:

- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Why this works:

- Root `package.json` runs `npm --prefix server install` during `postinstall`
- Root `start` script runs the backend from `server/src/server.js`
- The backend serves both API routes and static files from the project root

Environment variables to set in Render:

- `PORT` (Render provides this automatically)
- `PUBLIC_BASE_URL` (your Render service URL)
- `CORS_ORIGIN` or `CORS_ORIGINS` (comma-separated)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (if using email login)
