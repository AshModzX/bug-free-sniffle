import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "../data.json");
const PUBLIC_DIR = path.join(__dirname, "../public");
const UPLOADS_DIR = path.join(__dirname, "../public/uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

interface ShopData {
  categories: Category[];
  items: Item[];
}
interface Category {
  id: string;
  name: string;
  description: string;
}
interface Item {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

function readData(): ShopData {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { categories: [], items: [] };
  }
}
function writeData(data: ShopData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const activeSessions = new Map<string, number>();

function createToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
  return token;
}
function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const expiry = activeSessions.get(token);
  if (!expiry || Date.now() > expiry) {
    activeSessions.delete(token ?? "");
    return false;
  }
  return true;
}
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.["auth_token"] as string | undefined;
  if (!isValidToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

const router = Router();

router.post("/login", (req: Request, res: Response): void => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "admin123";
  if (password === adminPassword) {
    const token = createToken();
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

router.post("/logout", (req: Request, res: Response): void => {
  const token = req.cookies?.["auth_token"] as string | undefined;
  if (token) activeSessions.delete(token);
  res.clearCookie("auth_token");
  res.json({ success: true });
});

router.get("/auth/check", (req: Request, res: Response): void => {
  const token = req.cookies?.["auth_token"] as string | undefined;
  res.json({ authenticated: isValidToken(token) });
});

router.get("/categories", (_req: Request, res: Response): void => {
  const data = readData();
  res.json(data.categories);
});

router.post("/categories", requireAuth, (req: Request, res: Response): void => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name) { res.status(400).json({ error: "Name required" }); return; }
  const data = readData();
  const category: Category = {
    id: `cat-${crypto.randomUUID().split("-")[0]}`,
    name,
    description: description ?? "",
  };
  data.categories.push(category);
  writeData(data);
  res.status(201).json(category);
});

router.delete("/categories/:id", requireAuth, (req: Request, res: Response): void => {
  const data = readData();
  const idx = data.categories.findIndex((c) => c.id === req.params["id"]);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  data.categories.splice(idx, 1);
  data.items = data.items.filter((i) => i.categoryId !== req.params["id"]);
  writeData(data);
  res.json({ success: true });
});

router.get("/items", (req: Request, res: Response): void => {
  const data = readData();
  const category = req.query["category"] as string | undefined;
  const items = category ? data.items.filter((i) => i.categoryId === category) : data.items;
  res.json(items);
});

router.post("/items", requireAuth, (req: Request, res: Response): void => {
  const { name, description, price, categoryId } = req.body as {
    name?: string; description?: string; price?: string | number; categoryId?: string;
  };
  if (!name || !categoryId) { res.status(400).json({ error: "name and categoryId required" }); return; }
  const data = readData();
  const item: Item = {
    id: `item-${crypto.randomUUID().split("-")[0]}`,
    categoryId,
    name,
    description: description ?? "",
    price: Number(price) || 0,
    image: "https://placehold.co/300x200/c8860a/ffffff?text=New+Item",
  };
  data.items.push(item);
  writeData(data);
  res.status(201).json(item);
});

router.put("/items/:id", requireAuth, (req: Request, res: Response): void => {
  const data = readData();
  const item = data.items.find((i) => i.id === req.params["id"]);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  const { name, description, price, categoryId } = req.body as Partial<Item>;
  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  if (price !== undefined) item.price = Number(price);
  if (categoryId !== undefined) item.categoryId = categoryId;
  writeData(data);
  res.json(item);
});

router.delete("/items/:id", requireAuth, (req: Request, res: Response): void => {
  const data = readData();
  const idx = data.items.findIndex((i) => i.id === req.params["id"]);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  data.items.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

router.post(
  "/items/:id/image",
  requireAuth,
  upload.single("image"),
  (req: Request, res: Response): void => {
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
    const data = readData();
    const item = data.items.find((i) => i.id === req.params["id"]);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    item.image = `/uploads/${req.file.filename}`;
    writeData(data);
    res.json({ imageUrl: item.image });
  }
);

router.post("/contact", (req: Request, res: Response): void => {
  const { name, email, message } = req.body as { name?: string; email?: string; message?: string };
  req.log?.info({ name, email, message }, "Contact form submission");
  res.json({ success: true, message: "Thank you for reaching out! We will get back to you soon." });
});

export default router;
