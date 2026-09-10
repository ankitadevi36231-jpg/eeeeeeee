/* ============================================================
   isaiyaa.bd — Premium Digital Store
   Backend server: Express + JSON file storage (NO database)
   ============================================================ */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '36231';

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---------------- tiny JSON storage (no database) ---------------- */
const readJSON = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); }
  catch { return fallback; }
};
const writeJSON = (file, data) => {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
  return data;
};
const products = () => readJSON('products.json', []);
const orders   = () => readJSON('orders.json', []);
const reviews  = () => readJSON('reviews.json', []);
const settings = () => Object.assign({}, DEFAULT_SETTINGS, readJSON('settings.json', {}));


/* ---------------- uploads (multer) ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.png').toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

/* ---------------- body parsers (must be BEFORE all routes) ---------------- */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* ============================================================
   PUBLIC API
   ============================================================ */
const DEFAULT_SETTINGS = {
  siteName: 'isaiyaa.bd',
  tagline: 'Premium Digital Store of Bangladesh',
  whatsapp: '8801824554565',
  whatsappDisplay: '01824554565',
  telegram: 'Devoloper_Emon',
  telegramBotToken: '',
  telegramChatId: '',
  usdRate: 122,
  logo: 'https://i.postimg.cc/h4NZkpY8/image.png',
  payments: {}
};

/* site config for the storefront (always fresh) */
app.get('/api/config', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const s = settings();
  res.json({
    siteName: s.siteName,
    tagline: s.tagline,
    logo: s.logo,
    whatsapp: s.whatsapp,
    whatsappDisplay: s.whatsappDisplay,
    telegram: s.telegram,
    usdRate: s.usdRate,
    payments: Object.entries(s.payments || {})
      .filter(([, p]) => p.enabled !== false)
      .map(([key, p]) => ({ key, label: p.label, logo: p.logo, number: p.number, accountType: p.accountType, instructions: p.instructions }))
  });
});

/* live crypto conversion rates */
app.get('/api/rates', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await fetchRates());
});

/* products */
app.get('/api/products', (req, res) => {
  let list = products();
  const { category } = req.query;
  if (category) list = list.filter(p => p.category === category);
  res.json(list);
});

app.get('/api/products/:id', (req, res) => {
  const p = products().find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

/* reviews */
app.get('/api/reviews', (req, res) => {
  res.json(reviews().filter(r => r.approved).sort((a, b) => b.createdAt - a.createdAt));
});

app.post('/api/reviews', (req, res) => {
  const { name, rating, text } = req.body || {};
  if (!name || !text || !rating) return res.status(400).json({ error: 'Missing fields' });
  const r = {
    id: 'r_' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex'),
    name: String(name).slice(0, 60),
    rating: Math.max(1, Math.min(5, parseInt(rating) || 5)),
    text: String(text).slice(0, 600),
    approved: false,
    createdAt: Date.now()
  };
  writeJSON('reviews.json', [...reviews(), r]);
  res.json({ ok: true, message: 'Thank you! Your review will appear after admin approval.' });
});

/* place an order (screenshot upload) */
app.post('/api/orders', upload.single('screenshot'), async (req, res) => {
  try {
    const { productId, productTitle, priceBDT, paymentMethod, amountDisplay, amountUSD, trxId, whatsapp } = req.body || {};
    if (!productTitle || !priceBDT || !paymentMethod || !whatsapp)
      return res.status(400).json({ error: 'Missing order details' });

    const s = settings();
    const pm = (s.payments || {})[paymentMethod];
    const validMethods = ['bkash', 'nagad', 'binance', 'btc', 'ltc'];
    if (!validMethods.includes(paymentMethod) || !pm || pm.enabled === false)
      return res.status(400).json({ error: 'Payment method unavailable' });

    const needTrx = ['bkash', 'nagad'].includes(paymentMethod);
    if (needTrx && !trxId) return res.status(400).json({ error: 'Transaction ID is required' });
    if (!req.file) return res.status(400).json({ error: 'Payment screenshot is required' });

    const wa = String(whatsapp).replace(/[^\d]/g, '');
    if (wa.length < 10) return res.status(400).json({ error: 'Invalid WhatsApp number' });

    const d = new Date();
    const id = `ORD-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const order = {
      id,
      productId: productId || '',
      productTitle: String(productTitle).slice(0, 120),
      priceBDT: Number(priceBDT) || 0,
      paymentMethod,
      amountDisplay: String(amountDisplay || '').slice(0, 60),
      amountUSD: Number(amountUSD) || 0,
      trxId: trxId ? String(trxId).slice(0, 60) : '',
      whatsapp: wa,
      screenshot: '/uploads/' + req.file.filename,
      status: 'pending',
      note: '',
      createdAt: d.getTime(),
      createdAtText: d.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })
    };
    writeJSON('orders.json', [order, ...orders()]);

    const lines = [
      `🛒 <b>New Order — ${s.siteName}</b>`,
      `━━━━━━━━━━━━━━━━━`,
      `🆔 Order: <b>${id}</b>`,
      `📦 Product: ${order.productTitle}`,
      `💰 Price: ৳${order.priceBDT}`,
      `💳 Method: ${pm.label}`
    ];
    if (!needTrx && order.amountDisplay) lines.push(`🪙 Paid Amount: ${order.amountDisplay}`);
    if (order.trxId) lines.push(`🔗 TRX ID: <code>${order.trxId}</code>`);
    lines.push(`📲 Customer WhatsApp: ${wa}`);
    lines.push(`🕒 ${order.createdAtText}`);
    lines.push(`━━━━━━━━━━━━━━━━━`);
    lines.push(`✅ Verify payment → deliver via WhatsApp`);

    notifyTelegram(lines.join('\n'), path.join(UPLOAD_DIR, req.file.filename));
    res.json({ ok: true, orderId: id });
  } catch (e) {
    console.error('[order] error:', e);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

/* ---------------- static files ---------------- */
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

/* ---------------- admin auth ---------------- */
const sessions = new Map(); // token -> lastUsed
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token && sessions.has(token)) { sessions.set(token, Date.now()); return next(); }
  res.status(401).json({ error: 'Unauthorized' });
}
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [t, ts] of sessions) if (ts < cutoff) sessions.delete(t);
}, 60 * 60 * 1000);

/* ---------------- crypto rates (live from Binance, cached 5 min) ---------------- */
let rateCache = { ts: 0, data: null };
async function fetchRates() {
  if (rateCache.data && Date.now() - rateCache.ts < 5 * 60 * 1000) return rateCache.data;
  const fallback = { BTCUSDT: 97000, LTCUSDT: 105, usdRate: settings().usdRate, source: 'fallback' };
  try {
    const [btc, ltc] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: AbortSignal.timeout(6000) }).then(r => r.json()),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=LTCUSDT', { signal: AbortSignal.timeout(6000) }).then(r => r.json())
    ]);
    const data = {
      BTCUSDT: parseFloat(btc.price) || fallback.BTCUSDT,
      LTCUSDT: parseFloat(ltc.price) || fallback.LTCUSDT,
      usdRate: settings().usdRate,
      source: 'binance'
    };
    rateCache = { ts: Date.now(), data };
    return data;
  } catch {
    rateCache = { ts: Date.now(), data: fallback };
    return fallback;
  }
}

/* ---------------- telegram notification (free order alerts) ---------------- */
async function notifyTelegram(text, photoPath) {
  const s = settings();
  if (!s.telegramBotToken || !s.telegramChatId) {
    console.log('[telegram] bot not configured — skipped notification');
    return false;
  }
  try {
    let res;
    if (photoPath && fs.existsSync(photoPath)) {
      const fd = new FormData();
      fd.append('chat_id', s.telegramChatId);
      fd.append('caption', text);
      fd.append('photo', new Blob([fs.readFileSync(photoPath)]), path.basename(photoPath));
      res = await fetch(`https://api.telegram.org/bot${s.telegramBotToken}/sendPhoto`, { method: 'POST', body: fd });
    } else {
      res = await fetch(`https://api.telegram.org/bot${s.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: s.telegramChatId, text, parse_mode: 'HTML' })
      });
    }
    console.log('[telegram] notification sent:', res.ok);
    return res.ok;
  } catch (e) {
    console.error('[telegram] error:', e.message);
    return false;
  }
}

/* ============================================================
   ADMIN API (protected by x-admin-token)
   ============================================================ */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (String(password) !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now());
  res.json({ ok: true, token });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const o = orders(), ps = products(), rs = reviews();
  const revenue = o.filter(x => x.status === 'confirmed' || x.status === 'delivered').reduce((s, x) => s + (x.priceBDT || 0), 0);
  res.json({
    orders: o.length,
    pending: o.filter(x => x.status === 'pending').length,
    delivered: o.filter(x => x.status === 'delivered').length,
    revenue,
    products: ps.length,
    reviews: rs.length,
    pendingReviews: rs.filter(r => !r.approved).length
  });
});

/* ----- products (admin list) ----- */
app.get('/api/admin/products', requireAdmin, (req, res) => res.json(products()));

/* ----- orders ----- */
app.get('/api/admin/orders', requireAdmin, (req, res) => res.json(orders()));

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const list = orders();
  const i = list.findIndex(x => x.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Order not found' });
  const { status, note } = req.body || {};
  if (status && ['pending', 'confirmed', 'delivered', 'rejected'].includes(status)) list[i].status = status;
  if (typeof note === 'string') list[i].note = note.slice(0, 300);
  writeJSON('orders.json', list);
  res.json(list[i]);
});

app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  writeJSON('orders.json', orders().filter(x => x.id !== req.params.id));
  res.json({ ok: true });
});

/* ----- products (CRUD) ----- */
const CATEGORIES = ['vpn', 'account', 'card', 'apps', 'social', 'course', 'other'];
function sanitizeProduct(body) {
  const b = body || {};
  const features = String(b.features || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12);
  return {
    title: String(b.title || '').slice(0, 120).trim(),
    category: CATEGORIES.includes(b.category) ? b.category : 'other',
    price: Math.max(0, Number(b.price) || 0),
    oldPrice: Math.max(0, Number(b.oldPrice) || 0),
    stock: Math.max(0, parseInt(b.stock) || 0),
    badge: String(b.badge || '').slice(0, 20),
    description: String(b.description || '').slice(0, 4000),
    features,
    featured: b.featured === 'true' || b.featured === true
  };
}

app.post('/api/admin/products', requireAdmin, upload.single('image'), (req, res) => {
  const data = sanitizeProduct(req.body);
  if (!data.title) return res.status(400).json({ error: 'Title is required' });
  const p = {
    id: 'p_' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex'),
    ...data,
    image: req.file ? '/uploads/' + req.file.filename : '',
    createdAt: Date.now()
  };
  writeJSON('products.json', [p, ...products()]);
  res.json(p);
});

app.put('/api/admin/products/:id', requireAdmin, upload.single('image'), (req, res) => {
  const list = products();
  const i = list.findIndex(x => x.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Product not found' });
  const data = sanitizeProduct(req.body);
  if (!data.title) return res.status(400).json({ error: 'Title is required' });
  if (req.file) {
    if (list[i].image && list[i].image.startsWith('/uploads/')) { try { fs.unlinkSync(path.join(__dirname, list[i].image)); } catch {} }
    list[i].image = '/uploads/' + req.file.filename;
  }
  list[i] = { ...list[i], ...data };
  writeJSON('products.json', list);
  res.json(list[i]);
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const list = products();
  const p = list.find(x => x.id === req.params.id);
  if (p && p.image && p.image.startsWith('/uploads/')) { try { fs.unlinkSync(path.join(__dirname, p.image)); } catch {} }
  writeJSON('products.json', list.filter(x => x.id !== req.params.id));
  res.json({ ok: true });
});

/* ----- reviews moderation ----- */
app.get('/api/admin/reviews', requireAdmin, (req, res) => res.json(reviews().sort((a, b) => b.createdAt - a.createdAt)));

app.put('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  const list = reviews();
  const i = list.findIndex(x => x.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Review not found' });
  list[i].approved = req.body && req.body.approved !== undefined ? !!req.body.approved : !list[i].approved;
  writeJSON('reviews.json', list);
  res.json(list[i]);
});

app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  writeJSON('reviews.json', reviews().filter(x => x.id !== req.params.id));
  res.json({ ok: true });
});

/* ----- settings ----- */
app.get('/api/admin/settings', requireAdmin, (req, res) => res.json(settings()));

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const s = Object.assign({}, DEFAULT_SETTINGS, settings());
  const b = req.body || {};
  ['siteName', 'tagline', 'whatsapp', 'whatsappDisplay', 'telegram', 'telegramBotToken', 'telegramChatId', 'logo'].forEach(k => {
    if (typeof b[k] === 'string') s[k] = b[k].slice(0, 300);
  });
  if (b.usdRate !== undefined) {
    const r = Number(b.usdRate);
    if (r > 0) { s.usdRate = r; rateCache.ts = 0; }
  }
  if (b.payments && typeof b.payments === 'object') {
    for (const key of Object.keys(s.payments)) {
      const np = b.payments[key];
      if (!np) continue;
      s.payments[key] = {
        ...s.payments[key],
        enabled: !!np.enabled,
        label: String(np.label || s.payments[key].label).slice(0, 40),
        number: String(np.number ?? s.payments[key].number).slice(0, 200),
        accountType: String(np.accountType ?? (s.payments[key].accountType || '')).slice(0, 40),
        instructions: String(np.instructions ?? (s.payments[key].instructions || '')).slice(0, 500)
      };
    }
  }
  writeJSON('settings.json', s);
  res.json(s);
});

app.post('/api/admin/telegram-test', requireAdmin, async (req, res) => {
  const ok = await notifyTelegram('✅ <b>Test Message</b>\nisaiyaa.bd order notifications are working perfectly!');
  res.json({ ok, message: ok ? 'Test notification sent! Check your Telegram.' : 'Failed: check Bot Token & Chat ID in Settings.' });
});

/* ----- 404 + error handler ----- */
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500)
     .json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : (err.message || 'Server error') });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ============================================');
  console.log('   isaiyaa.bd — server is running ✅');
  console.log(`   Storefront : http://localhost:${PORT}`);
  console.log(`   Admin Panel: http://localhost:${PORT}/admin  (password: ${ADMIN_PASSWORD})`);
  console.log('  ============================================');
  console.log('');
});