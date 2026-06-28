# JuttiDot.com — Shop Website

Handcrafted traditional Kolhapuri/Jutti footwear store based in Kathmandu, Nepal.

## Quick Start

```bash
npm install
npm start
```

Then open http://localhost:3000

## Environment Variables

Create a `.env` file (or set these in your host's dashboard):

| Variable | Default | Description |
|---|---|---|
| `ADMIN_PASSWORD` | `admin123` | Password for the admin panel |
| `PORT` | `3000` | Port the server listens on |

> **Important:** Change `ADMIN_PASSWORD` before going live!

## Pages

| URL | Description |
|---|---|
| `/` | Homepage — hero, categories, featured items |
| `/products.html` | Filterable product grid |
| `/about.html` | Store story + Google Map |
| `/contact.html` | Contact form |
| `/admin.html` | Admin panel (password protected) |

## Admin Panel

1. Go to `/admin.html`
2. Enter your `ADMIN_PASSWORD`
3. **Change item images** — click "📷 Change Image" next to any item
4. **Edit** name, price, description inline
5. **Add / delete** items and categories

## Deploying to Vercel

1. Push this folder to a GitHub repo
2. Import into Vercel
3. Set `ADMIN_PASSWORD` in Vercel → Settings → Environment Variables
4. Deploy — Vercel will run `npm install && npm start` automatically

> Note: `data.json` is written to disk at runtime. On Vercel (serverless), writes won't persist between deploys. For a persistent store, swap `data.json` for a database like Vercel Postgres or MongoDB Atlas.

## Deploying to Railway / Render / Fly.io

These platforms run a persistent Node.js process, so `data.json` writes **will** persist. Just connect your repo and set the `ADMIN_PASSWORD` env var.

## Folder Structure

```
juttidot-shop/
├── server.js          ← Express server (all API + static serving)
├── package.json
├── data.json          ← Shop data (categories & items)
├── .env.example
└── public/
    ├── index.html     ← Homepage
    ├── products.html  ← Shop grid
    ← about.html      ← About page
    ├── contact.html   ← Contact form
    ├── admin.html     ← Admin panel
    ├── css/
    │   └── style.css
    ├── js/
    │   └── main.js
    └── uploads/       ← Uploaded images go here
```
