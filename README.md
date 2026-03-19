# SentinalWeb

A polished catalogue for selling small website templates online.

- 10 categories
- 50 products (5 per category)
- Search / filter / sort
- Product detail modal
- Admin backend with email magic-link login
- Client-ready editing dashboard

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
