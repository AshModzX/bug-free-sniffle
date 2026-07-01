import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import pino from "pino";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data.json");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const logger = pino({ level: "info" });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")); }
  catch { return { categories: [], items: [] }; }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const activeSessions = new Map();
function createToken() {
  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
  return token;
}
function isValidToken(token) {
  if (!token) return false;
  const expiry = activeSessions.get(token);
  if (!expiry || Date.now() > expiry) { activeSessions.delete(token); return false; }
  return true;
}
function requireAuth(req, res, next) {
  if (!isValidToken(req.cookies?.auth_token)) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

const app = express();
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));

const api = express.Router();

api.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === (process.env.ADMIN_PASSWORD ?? "admin123")) {
    const token = createToken();
    res.cookie("auth_token", token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000, sameSite: "lax" });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

api.post("/logout", (req, res) => {
  const token = req.cookies?.auth_token;
  if (token) activeSessions.delete(token);
  res.clearCookie("auth_token");
  res.json({ success: true });
});

api.get("/auth/check", (req, res) => {
  res.json({ authenticated: isValidToken(req.cookies?.auth_token) });
});

api.get("/categories", (_req, res) => res.json(readData().categories));

api.post("/categories", requireAuth, (req, res) => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: "Name required" }); return; }
  const data = readData();
  const category = { id: `cat-${crypto.randomUUID().split("-")[0]}`, name, description: description ?? "" };
  data.categories.push(category);
  writeData(data);
  res.status(201).json(category);
});

api.delete("/categories/:id", requireAuth, (req, res) => {
  const data = readData();
  const idx = data.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  data.categories.splice(idx, 1);
  data.items = data.items.filter(i => i.categoryId !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

api.get("/items", (req, res) => {
  const data = readData();
  const cat = req.query.category;
  res.json(cat ? data.items.filter(i => i.categoryId === cat) : data.items);
});

api.post("/items", requireAuth, (req, res) => {
  const { name, description, price, categoryId } = req.body;
  if (!name || !categoryId) { res.status(400).json({ error: "name and categoryId required" }); return; }
  const data = readData();
  const item = {
    id: `item-${crypto.randomUUID().split("-")[0]}`,
    categoryId, name,
    description: description ?? "",
    price: Number(price) || 0,
    image: "https://placehold.co/300x200/c8860a/ffffff?text=New+Item",
    images: [],
  };
  data.items.push(item);
  writeData(data);
  res.status(201).json(item);
});

api.put("/items/:id", requireAuth, (req, res) => {
  const data = readData();
  const item = data.items.find(i => i.id === req.params.id);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  const { name, description, price, categoryId } = req.body;
  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  if (price !== undefined) item.price = Number(price);
  if (categoryId !== undefined) item.categoryId = categoryId;
  writeData(data);
  res.json(item);
});

api.delete("/items/:id", requireAuth, (req, res) => {
  const data = readData();
  const idx = data.items.findIndex(i => i.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  data.items.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

api.post("/items/:id/image", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  const data = readData();
  const item = data.items.find(i => i.id === req.params.id);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  item.image = `/uploads/${req.file.filename}`;
  if (!item.images) item.images = [];
  item.images[0] = item.image;
  writeData(data);
  res.json({ imageUrl: item.image });
});

api.post("/contact", (req, res) => {
  const { name, email, message } = req.body;
  logger.info({ name, email, message }, "Contact form submission");
  res.json({ success: true, message: "Thank you! We will get back to you soon." });
});

app.use("/api", api);

app.get("/*any", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`JuttiDot server running on http://localhost:${PORT}`));
