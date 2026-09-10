/* ============================================================
   isaiyaa.bd — Admin Panel Logic
   ============================================================ */
'use strict';

const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const fmtBDT = n => '৳' + Number(n || 0).toLocaleString('en-US');

const METHOD_LABELS = { bkash: 'bKash', nagad: 'Nagad', binance: 'Binance Pay', btc: 'Bitcoin (BTC)', ltc: 'Litecoin (LTC)' };
const CATS = {
  vpn: { label: 'Premium VPN', icon: '🛡️' }, account: { label: 'Premium Accounts', icon: '👤' },
  card: { label: 'Visa / Master Cards', icon: '💳' }, apps: { label: 'Premium Apps', icon: '📱' },
  social: { label: 'Social Media', icon: '🌐' }, course: { label: 'Premium Courses', icon: '🎓' },
  other: { label: 'Other', icon: '✨' }
};

let TOKEN = localStorage.getItem('isa_token');
if (!TOKEN) location.href = '/admin/';

async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    ...opts,
    headers: { 'x-admin-token': TOKEN, ...(opts.headers || {}) }
  });
  if (res.status === 401) {
    localStorage.removeItem('isa_token');
    location.href = '/admin/';
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(msg, type) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 3200);
}

function waNum(n) {
  let s = String(n || '').replace(/\D/g, '');
  if (s.startsWith('0')) s = '88' + s;
  return s;
}

/* ---------------- tabs ---------------- */
function switchTab(name) {
  $$('.snav').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('main > section').forEach(s => { s.hidden = s.id !== 'tab-' + name; });
  if (name === 'dash') loadStats();
  if (name === 'orders') loadOrders();
  if (name === 'products') loadProducts();
  if (name === 'reviews') loadReviews();
  if (name === 'settings') loadSettings();
}

$$('.snav').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
$$('[data-goto]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.goto)));
$('#logout').addEventListener('click', () => {
  localStorage.removeItem('isa_token');
  location.href = '/admin/';
});

/* ---------------- dashboard ---------------- */
async function loadStats() {
  try {
    const s = await api('/admin/stats');
    $('#statCards').innerHTML = `
      <div class="stat"><div class="ic p">🛒</div><div><b>${s.orders}</b><span>Total Orders</span></div></div>
      <div class="stat"><div class="ic g">⏳</div><div><b>${s.pending}</b><span>Pending Review</span></div></div>
      <div class="stat"><div class="ic v">✅</div><div><b>${s.delivered}</b><span>Delivered</span></div></div>
      <div class="stat"><div class="ic g">💰</div><div><b>${fmtBDT(s.revenue)}</b><span>Confirmed Revenue</span></div></div>
      <div class="stat"><div class="ic p">📦</div><div><b>${s.products}</b><span>Products</span></div></div>
      <div class="stat"><div class="ic r">⭐</div><div><b>${s.pendingReviews}</b><span>Reviews to Approve</span></div></div>`;
    $('#pillOrders').textContent = s.pending || '';
    $('#pillReviews').textContent = s.pendingReviews || '';

    const orders = await api('/admin/orders');
    const recent = orders.slice(0, 6);
    $('#recentOrders').innerHTML = recent.length ? recent.map(o => `
      <tr>
        <td><span class="oid">${esc(o.id)}</span><br><small style="color:var(--muted)">${esc(o.createdAtText || '')}</small></td>
        <td class="ttl"><b>${esc(o.productTitle)}</b></td>
        <td class="price-cell">${fmtBDT(o.priceBDT)}</td>
        <td>${esc(METHOD_LABELS[o.paymentMethod] || o.paymentMethod)}</td>
        <td><span class="chip ${esc(o.status)}">${esc(o.status)}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="empty-td">No orders yet</td></tr>';
  } catch (e) { toast(e.message, 'err'); }
}
/* ---------------- orders ---------------- */
let ALL_ORDERS = [];

async function loadOrders() {
  try {
    ALL_ORDERS = await api('/admin/orders');
    renderOrders();
  } catch (e) { toast(e.message, 'err'); }
}

function renderOrders() {
  const f = $('#orderFilter').value;
  const q = $('#orderSearch').value.trim().toLowerCase();
  let list = ALL_ORDERS;
  if (f !== 'all') list = list.filter(o => o.status === f);
  if (q) list = list.filter(o =>
    o.productTitle.toLowerCase().includes(q) ||
    (o.trxId || '').toLowerCase().includes(q) ||
    (o.whatsapp || '').includes(q) ||
    (o.id || '').toLowerCase().includes(q));

  const body = $('#ordersBody');
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="10" class="empty-td">No orders found</td></tr>';
    return;
  }
  body.innerHTML = list.map(o => `
    <tr>
      <td><span class="oid">${esc(o.id)}</span><br><small style="color:var(--muted)">${esc(o.createdAtText || new Date(o.createdAt).toLocaleString())}</small></td>
      <td class="ttl"><b>${esc(o.productTitle)}</b></td>
      <td class="price-cell">${fmtBDT(o.priceBDT)}</td>
      <td>${esc(METHOD_LABELS[o.paymentMethod] || o.paymentMethod)}</td>
      <td class="mono">${esc(o.amountDisplay || '—')}</td>
      <td class="mono">${o.trxId ? esc(o.trxId) : '—'}</td>
      <td><a class="mono" style="color:#25d366" href="https://wa.me/${waNum(o.whatsapp)}" target="_blank" rel="noopener">${esc(o.whatsapp)}</a></td>
      <td>${o.screenshot ? `<img class="shot-thumb" src="${esc(o.screenshot)}" alt="proof" data-lightbox="${esc(o.screenshot)}">` : '—'}</td>
      <td>
        <select class="status-select" data-status="${esc(o.id)}">
          ${['pending', 'confirmed', 'delivered', 'rejected'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('')}
        </select>
      </td>
      <td style="white-space:nowrap;">
        <button class="wa-btn" data-wa="${esc(o.id)}" title="Send delivery message on WhatsApp">💬 Deliver</button>
        <button class="del-btn" data-delorder="${esc(o.id)}" title="Delete order">🗑</button>
      </td>
    </tr>`).join('');
}

$('#orderFilter').addEventListener('change', renderOrders);
$('#orderSearch').addEventListener('input', renderOrders);
$('#refreshOrders').addEventListener('click', loadOrders);

$('#ordersBody').addEventListener('change', async e => {
  const sel = e.target.closest('[data-status]');
  if (!sel) return;
  try {
    await api(`/admin/orders/${sel.dataset.status}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: sel.value })
    });
    toast(`Order marked as ${sel.value.toUpperCase()}`, 'ok');
    loadStats();
  } catch (err) { toast(err.message, 'err'); }
});

$('#ordersBody').addEventListener('click', async e => {
  const waBtn = e.target.closest('[data-wa]');
  if (waBtn) {
    const o = ALL_ORDERS.find(x => x.id === waBtn.dataset.wa);
    if (!o) return;
    const msg = `Hello! ✅ Your order ${o.id} for "${o.productTitle}" has been confirmed.\n\nYour product is being delivered now. Thank you for shopping with isaiyaa.bd! 💜`;
    window.open(`https://wa.me/${waNum(o.whatsapp)}?text=${encodeURIComponent(msg)}`, '_blank');
    try {
      await api(`/admin/orders/${o.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });
    } catch {}
    return;
  }
  const del = e.target.closest('[data-delorder]');
  if (del) {
    if (!confirm('Delete this order permanently?')) return;
    try {
      await api(`/admin/orders/${del.dataset.delorder}`, { method: 'DELETE' });
      toast('Order deleted', 'ok');
      loadOrders();
      loadStats();
    } catch (err) { toast(err.message, 'err'); }
  }
});

/* lightbox */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-lightbox]');
  if (t) { $('#lightboxImg').src = t.dataset.lightbox; $('#lightbox').classList.add('open'); }
  else if (e.target.closest('.lightbox')) $('#lightbox').classList.remove('open');
});
/* ---------------- products ---------------- */
let PRODUCTS = [];
let pfImageFile = null;

async function loadProducts() {
  try {
    PRODUCTS = await api('/admin/products');
    renderAdminProducts();
  } catch (e) { toast(e.message, 'err'); }
}

function renderAdminProducts() {
  const wrap = $('#admProdList');
  if (!PRODUCTS.length) {
    wrap.innerHTML = '<div class="card">No products yet. Click "+ Add Product" to create your first product.</div>';
    return;
  }
  wrap.innerHTML = PRODUCTS.map(p => {
    const c = CATS[p.category] || CATS.other;
    const img = p.image ? `<img src="${esc(p.image)}" alt="">` : c.icon;
    return `
    <div class="aprod">
      <div class="thumb">${img}</div>
      <div class="body">
        <span class="cat">${esc(c.label)}</span>
        <h3>${esc(p.title)}</h3>
        <div class="price">${fmtBDT(p.price)}</div>
        <div class="meta">
          <span>📦 Stock: ${p.stock}</span>
          ${p.badge ? `<span>🏅 ${esc(p.badge)}</span>` : ''}
          ${p.featured ? '<span>⭐ Featured</span>' : ''}
        </div>
        <div class="acts">
          <button class="act-btn" data-edit="${esc(p.id)}">✏ Edit</button>
          <button class="del-btn" data-delprod="${esc(p.id)}">🗑 Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openProdModal(p) {
  $('#prodModalTitle').textContent = p ? 'Edit Product' : 'Add Product';
  $('#pfId').value = p ? p.id : '';
  $('#pfTitle').value = p ? p.title : '';
  $('#pfCategory').value = p ? p.category : 'vpn';
  $('#pfBadge').value = p ? (p.badge || '') : '';
  $('#pfPrice').value = p ? p.price : '';
  $('#pfOldPrice').value = p && p.oldPrice ? p.oldPrice : '';
  $('#pfStock').value = p ? p.stock : 10;
  $('#pfDesc').value = p ? p.description : '';
  $('#pfFeatures').value = p ? (p.features || []).join('\n') : '';
  $('#pfFeatured').checked = p ? !!p.featured : false;
  pfImageFile = null;
  $('#pfImage').value = '';
  $('#pfImgHint').innerHTML = p && p.image
    ? `<img src="${esc(p.image)}" alt=""><small style="color:var(--muted)">Click to change image</small>`
    : '📤 Click to upload image<br><small>or leave empty for default</small>';
  $('#prodOverlay').classList.add('open');
}

$('#btnAddProduct').addEventListener('click', () => openProdModal(null));

$('#pfImage').addEventListener('change', () => {
  const f = $('#pfImage').files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) { toast('Image too large (max 5MB)', 'err'); $('#pfImage').value = ''; return; }
  pfImageFile = f;
  const hint = $('#pfImgHint');
  hint.innerHTML = `<img src="${URL.createObjectURL(f)}" alt=""><small style="color:var(--muted)">Click to change</small>`;
});

$('#prodForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('#pfId').value;
  const fd = new FormData();
  fd.append('title', $('#pfTitle').value);
  fd.append('category', $('#pfCategory').value);
  fd.append('badge', $('#pfBadge').value);
  fd.append('price', $('#pfPrice').value);
  fd.append('oldPrice', $('#pfOldPrice').value || 0);
  fd.append('stock', $('#pfStock').value || 0);
  fd.append('description', $('#pfDesc').value);
  fd.append('features', $('#pfFeatures').value);
  fd.append('featured', $('#pfFeatured').checked ? 'true' : 'false');
  if (pfImageFile) fd.append('image', pfImageFile);

  const btn = $('#pfSave');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    if (id) await api(`/admin/products/${id}`, { method: 'PUT', body: fd });
    else await api('/admin/products', { method: 'POST', body: fd });
    toast(id ? 'Product updated!' : 'Product added!', 'ok');
    $('#prodOverlay').classList.remove('open');
    loadProducts();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Save Product';
  }
});

$('#admProdList').addEventListener('click', async e => {
  const ed = e.target.closest('[data-edit]');
  if (ed) {
    const p = PRODUCTS.find(x => x.id === ed.dataset.edit);
    if (p) openProdModal(p);
    return;
  }
  const del = e.target.closest('[data-delprod]');
  if (del) {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await api(`/admin/products/${del.dataset.delprod}`, { method: 'DELETE' });
      toast('Product deleted', 'ok');
      loadProducts();
    } catch (err) { toast(err.message, 'err'); }
  }
});

/* modal close */
$$('[data-close]').forEach(b => b.addEventListener('click', () => $('#' + b.dataset.close).classList.remove('open')));
$$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));
/* ---------------- reviews ---------------- */
async function loadReviews() {
  try {
    const list = await api('/admin/reviews');
    $('#pillReviews').textContent = list.filter(r => !r.approved).length || '';
    const wrap = $('#revList');
    if (!list.length) { wrap.innerHTML = '<div class="card">No reviews yet.</div>'; return; }
    wrap.innerHTML = list.map(r => `
      <div class="rev-item">
        <div style="flex:1;min-width:0;">
          <div class="st">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          <p class="txt">"${esc(r.text)}"</p>
          <div class="who"><b>${esc(r.name)}</b><span>${new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
            <span class="chip ${r.approved ? 'delivered' : 'pending'}" style="margin-left:10px;">${r.approved ? 'APPROVED' : 'PENDING'}</span>
          </div>
        </div>
        <div class="acts">
          <button class="act-btn" data-togglerev="${esc(r.id)}">${r.approved ? '🙈 Unapprove' : '✅ Approve'}</button>
          <button class="del-btn" data-delrev="${esc(r.id)}">🗑</button>
        </div>
      </div>`).join('');
  } catch (e) { toast(e.message, 'err'); }
}

$('#refreshReviews').addEventListener('click', loadReviews);

$('#revList').addEventListener('click', async e => {
  const tog = e.target.closest('[data-togglerev]');
  if (tog) {
    try {
      await api(`/admin/reviews/${tog.dataset.togglerev}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      toast('Review updated', 'ok');
      loadReviews();
      loadStats();
    } catch (err) { toast(err.message, 'err'); }
    return;
  }
  const del = e.target.closest('[data-delrev]');
  if (del) {
    if (!confirm('Delete this review?')) return;
    try {
      await api(`/admin/reviews/${del.dataset.delrev}`, { method: 'DELETE' });
      toast('Review deleted', 'ok');
      loadReviews();
      loadStats();
    } catch (err) { toast(err.message, 'err'); }
  }
});

/* ---------------- settings ---------------- */
let SETTINGS = null;

async function loadSettings() {
  try {
    SETTINGS = await api('/admin/settings');
    $('#setName').value = SETTINGS.siteName || '';
    $('#setTagline').value = SETTINGS.tagline || '';
    $('#setWa').value = SETTINGS.whatsapp || '';
    $('#setWaDisplay').value = SETTINGS.whatsappDisplay || '';
    $('#setTg').value = SETTINGS.telegram || '';
    $('#setUsd').value = SETTINGS.usdRate || 122;
    $('#setBotToken').value = SETTINGS.telegramBotToken || '';
    $('#setChatId').value = SETTINGS.telegramChatId || '';
    renderPmSettings();
  } catch (e) { toast(e.message, 'err'); }
}

function renderPmSettings() {
  const wrap = $('#pmSettings');
  wrap.innerHTML = Object.entries(SETTINGS.payments || {}).map(([key, p]) => `
    <div class="pm-set" data-key="${esc(key)}">
      <div class="pm-set-head">
        <img src="${esc(p.logo)}" alt="">
        <b>${esc(p.label)}</b>
        <label class="en"><input type="checkbox" data-f="enabled" ${p.enabled !== false ? 'checked' : ''}> Enabled</label>
      </div>
      <div class="grid2">
        <div><label>Display Label</label><input data-f="label" value="${esc(p.label)}"></div>
        <div><label>Account Type (optional)</label><input data-f="accountType" value="${esc(p.accountType || '')}"></div>
        <div class="full"><label>Number / ID / Wallet Address (customers will pay here)</label><input data-f="number" value="${esc(p.number || '')}"></div>
        <div class="full"><label>Payment Instructions (one step per line)</label><textarea data-f="instructions">${esc(p.instructions || '')}</textarea></div>
      </div>
    </div>`).join('');
}

$('#saveSettings').addEventListener('click', async () => {
  const payments = {};
  $$('#pmSettings .pm-set').forEach(box => {
    const key = box.dataset.key;
    const get = f => $(`[data-f="${f}"]`, box).value;
    payments[key] = {
      enabled: $(`[data-f="enabled"]`, box).checked,
      label: get('label'),
      accountType: get('accountType'),
      number: get('number'),
      instructions: get('instructions')
    };
  });
  const body = {
    siteName: $('#setName').value,
    tagline: $('#setTagline').value,
    whatsapp: $('#setWa').value,
    whatsappDisplay: $('#setWaDisplay').value,
    telegram: $('#setTg').value,
    telegramBotToken: $('#setBotToken').value,
    telegramChatId: $('#setChatId').value,
    usdRate: $('#setUsd').value,
    payments
  };
  const btn = $('#saveSettings');
  btn.disabled = true;
  try {
    SETTINGS = await api('/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    renderPmSettings();
    toast('Settings saved! Refresh the website (F5) to see changes.', 'ok');
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
  }
});

$('#testTg').addEventListener('click', async () => {
  const btn = $('#testTg');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  try {
    const r = await api('/admin/telegram-test', { method: 'POST' });
    toast(r.message, r.ok ? 'ok' : 'err');
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = '✈ Send Test Message';
  }
});

/* ---------------- boot ---------------- */
loadStats();
switchTab('dash');