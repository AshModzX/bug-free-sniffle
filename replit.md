# JuttiDot.com — Shop Website

A complete shop website for JuttiDot.com, a traditional Kolhapuri/Jutti footwear store in Kathmandu, Nepal. Includes a public storefront and a password-protected admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the full site (port 8080, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `ADMIN_PASSWORD` — admin panel password (default: `admin123`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: `data.json` (flat-file, read/write via fs)
- Image uploads: Multer (saved to `public/uploads/`)
- Admin auth: Random token in-memory sessions, cookie-based
- Frontend: Plain HTML + CSS + vanilla JS (no framework)

## Where things live

- `artifacts/api-server/data.json` — shop data (categories & items), source of truth
- `artifacts/api-server/public/` — all static HTML, CSS, JS
- `artifacts/api-server/public/uploads/` — uploaded item images
- `artifacts/api-server/src/routes/shop.ts` — all shop API routes
- `artifacts/api-server/src/app.ts` — Express app with static file serving

## Shop Pages

- `/` — Homepage: hero, category cards, featured items, store info
- `/products.html` — Filterable product grid with item modal
- `/about.html` — Shop story, contact info, embedded map
- `/contact.html` — Contact form + address/hours
- `/admin.html` — Admin panel (login required)

## API Endpoints

- `GET /api/categories` — list all categories
- `GET /api/items?category=...` — list items (optionally filtered)
- `POST /api/items` — add item (auth required)
- `PUT /api/items/:id` — update item (auth required)
- `DELETE /api/items/:id` — delete item (auth required)
- `POST /api/items/:id/image` — upload item image (auth required, multipart)
- `POST /api/categories` — add category (auth required)
- `DELETE /api/categories/:id` — delete category + items (auth required)
- `POST /api/login` — login with ADMIN_PASSWORD
- `POST /api/logout` — clear session
- `GET /api/auth/check` — check auth status
- `POST /api/contact` — contact form submission

## Architecture decisions

- Flat-file `data.json` keeps the shop simple — no database required. Swap for Postgres later if needed.
- Admin auth uses random 32-byte hex tokens stored in an in-memory Map with 8h TTL. Restarting the server clears all sessions.
- Express 5 wildcard routes require `/{*any}` syntax (not `*`).
- esbuild bundles everything to `dist/index.mjs`; file paths must use `path.join(fileURLToPath(import.meta.url), '../...')` relative to `dist/`.
- Static files served from `public/` before API routes — direct file paths take priority.

## Product

A 5-category shoe store (Women's Juttis, Men's Kolhapuri, Kids', Wedding, Accessories) with 17 seed items. Admin can change item images via file upload, edit name/price/description, and add/delete items and categories.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- esbuild bundles all TS to `dist/index.mjs` — path resolution in shop.ts uses `path.join(__dirname, '../data.json')` where `__dirname` = `dist/` at runtime. One level up (`../`) reaches `api-server/`, **not** `../../`.
- Express 5 requires `/{*any}` for wildcard catch-all routes (old `*` syntax throws PathError).
- ADMIN_PASSWORD defaults to `admin123` if not set. Change this in production.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
