'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Config ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Data helpers ──────────────────────────────────────────────────────────────
function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return { categories: [], items: [] }; }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── Auth ──────────────────────────────────────────────────────────────────────
const sessions = new Map(); // token → expiry ms

function createToken() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
  return token;
}
function validToken(token) {
  if (!token) return false;
  const exp = sessions.get(token);
  if (!exp || Date.now() > exp) { sessions.delete(token); return false; }
  return true;
}
function requireAuth(req, res, next) {
  if (!validToken(req.cookies && req.cookies.auth_token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomUUID() + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    const token = createToken();
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000, sameSite: 'lax' });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/logout', (req, res) => {
  const token = req.cookies && req.cookies.auth_token;
  if (token) sessions.delete(token);
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: validToken(req.cookies && req.cookies.auth_token) });
});

// ── Category routes ───────────────────────────────────────────────────────────
app.get('/api/categories', (_req, res) => {
  res.json(readData().categories);
});

app.post('/api/categories', requireAuth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const data = readData();
  const category = { id: 'cat-' + crypto.randomUUID().split('-')[0], name, description: description || '' };
  data.categories.push(category);
  writeData(data);
  res.status(201).json(category);
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
  const data = readData();
  const idx = data.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.categories.splice(idx, 1);
  data.items = data.items.filter(i => i.categoryId !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// ── Item routes ───────────────────────────────────────────────────────────────
app.get('/api/items', (req, res) => {
  const data = readData();
  const cat = req.query.category;
  res.json(cat ? data.items.filter(i => i.categoryId === cat) : data.items);
});

app.post('/api/items', requireAuth, (req, res) => {
  const { name, description, price, categoryId } = req.body;
  if (!name || !categoryId) return res.status(400).json({ error: 'name and categoryId required' });
  const data = readData();
  const item = {
    id: 'item-' + crypto.randomUUID().split('-')[0],
    categoryId,
    name,
    description: description || '',
    price: Number(price) || 0,
    image: 'https://placehold.co/300x200/c8860a/ffffff?text=New+Item',
  };
  data.items.push(item);
  writeData(data);
  res.status(201).json(item);
});

app.put('/api/items/:id', requireAuth, (req, res) => {
  const data = readData();
  const item = data.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { name, description, price, categoryId } = req.body;
  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  if (price !== undefined) item.price = Number(price);
  if (categoryId !== undefined) item.categoryId = categoryId;
  writeData(data);
  res.json(item);
});

app.delete('/api/items/:id', requireAuth, (req, res) => {
  const data = readData();
  const idx = data.items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.items.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

app.post('/api/items/:id/image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const data = readData();
  const item = data.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.image = '/uploads/' + req.file.filename;
  writeData(data);
  res.json({ imageUrl: item.image });
});

// ── Contact ───────────────────────────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('[Contact]', { name, email, message });
  res.json({ success: true, message: 'Thank you for reaching out! We will get back to you soon.' });
});

// ── Catch-all: serve index.html ───────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`JuttiDot shop running at http://localhost:${PORT}`);
});
