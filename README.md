# JuttiDot.com — Shop Website

Traditional Kolhapuri/Jutti footwear store — Kathmandu, Nepal.

## Quick Start (local)

```bash
npm install
npm start
# → http://localhost:3000
```

Admin login password: `admin123` (change it before going live!)

---

## Deploying to Vercel

This project includes a `vercel.json` — Vercel will detect it automatically.

1. Push this folder to a **GitHub repo**
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In **Environment Variables**, add:
   - `ADMIN_PASSWORD` = `your-secret-password`
4. Click **Deploy**

> ⚠️ **Vercel limitation:** Vercel is serverless, so file uploads and item edits
> are held in memory and **reset when the server restarts** (i.e. after each deploy
> or after ~10 min of inactivity). For permanent storage, use Railway, Render, or
> Fly.io instead (see below).

---

## Deploying to Railway (recommended — data persists)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Add env var: `ADMIN_PASSWORD=your-secret-password`
4. Railway auto-detects Node.js and runs `npm start`

---

## Deploying to Render (free tier available)

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service** → connect repo
3. Build command: `npm install`  
   Start command: `npm start`
4. Add env var: `ADMIN_PASSWORD=your-secret-password`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ADMIN_PASSWORD` | `admin123` | Admin panel password — **change this!** |
| `PORT` | `3000` | Port (set automatically by most hosts) |

---

## Pages

| URL | Description |
|---|---|
| `/` | Homepage |
| `/products.html` | Filterable product grid |
| `/about.html` | Store story + map |
| `/contact.html` | Contact form |
| `/admin.html` | Admin panel (password protected) |

---

## Folder Structure

```
juttidot-shop/
├── server.js          ← All backend logic (Express + API)
├── package.json
├── vercel.json        ← Vercel deployment config
├── data.json          ← Shop data (categories & items)
├── .env.example
└── public/
    ├── index.html
    ├── products.html
    ├── about.html
    ├── contact.html
    ├── admin.html
    ├── css/style.css
    ├── js/main.js
    └── uploads/       ← Uploaded product images
```
