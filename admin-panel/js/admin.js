/* =========================================================
   isaiyaa.bd — Admin Panel JS
   ========================================================= */
(function () {
  'use strict';
  const { esc, money, timeAgo, fmtDate, toast } = window.ISY;

  const LOGOS = {
    bkash: 'https://i.postimg.cc/y8LddgcQ/image.png',
    nagad: 'https://i.postimg.cc/YSVC65Xv/image.png',
    binance: 'https://i.postimg.cc/vHMHtLvJ/image.png',
    btc: 'https://i.postimg.cc/Sx1Sq0b7/image.png',
    ltc: 'https://i.postimg.cc/LsqH8yHY/image.png'
  };
  const METHOD_NAMES = { bkash: 'bKash', nagad: 'Nagad', binance: 'Binance Pay', btc: 'Bitcoin', ltc: 'Litecoin' };
  const CAT_LABELS = { vpn: 'VPN', accounts: 'Premium Account', cards: 'Card', apps: 'App', facebook: 'Facebook', courses: 'Course', other: 'Other' };
  const VIEW_TITLES = { dashboard: 'Dashboard', orders: 'Orders', products: 'Products', reviews: 'Reviews', settings: 'Settings' };

  /* ---------------- Auth & API ---------------- */
  let PW = sessionStorage.getItem('isy_admin') || '';
  let orders = [];
  let orderFilter = 'all';
  let orderQ = '';
  let editingProductId = null;

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'x-admin-password': PW }, opts.headers || {});
    return fetch(path, opts).then(async res => {
      if (res.status === 401) { logout(); throw new Error('Session expired. Please login again.'); }
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Request failed');
      return j;
    });
  }

  const $ = id => document.getElementById(id);

  /* ---------------- Login / logout ---------------- */
  function showApp() {
    $('loginScreen').hidden = true;
    $('loginScreen').style.display = 'none';
    $('adminApp').hidden = false;
    bootApp();
  }

  function logout() {
    PW = '';
    sessionStorage.removeItem('isy_admin');
    $('adminApp').hidden = true;
    $('loginScreen').style.display = '';
    $('loginScreen').hidden = false;
  }

  async function tryLogin(password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('Wrong password. Please try again.');
    PW = password;
    sessionStorage.setItem('isy_admin', password);
    showApp();
  }

  function initLogin() {
    const doLogin = async () => {
      const err = $('loginError');
      err.style.display = 'none';
      try {
        await tryLogin($('loginPass').value);
      } catch (e) {
        err.textContent = e.message;
        err.style.display = 'block';
      }
    };
    $('loginBtn').addEventListener('click', doLogin);
    $('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    $('logoutBtn').addEventListener('click', logout);
    if (PW) {
      tryLogin(PW).catch(() => logout());
    }
  }

  /* ---------------- View switching ---------------- */
  function switchView(view) {
    document.querySelectorAll('.side-link').forEach(b => b.classList.toggle('active', b.getAttribute('data-view') === view));
    document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== 'view-' + view);
    $('viewTitle').textContent = VIEW_TITLES[view] || view;
    $('addProductBtn').hidden = view !== 'products';
    if (view === 'dashboard') loadDashboard();
    if (view === 'orders') loadOrders();
    if (view === 'products') loadProducts();
    if (view === 'reviews') loadReviews();
    if (view === 'settings') loadSettings();
  }

  function initNav() {
    document.querySelectorAll('.side-link').forEach(b =>
      b.addEventListener('click', () => switchView(b.getAttribute('data-view'))));
  }

  /* ---------------- Dashboard ---------------- */
  async function loadDashboard() {
    try {
      const s = await api('/api/admin/stats');
      $('statCards').innerHTML =
        statCard('🛒', s.totalOrders, 'Total Orders', '') +
        statCard('⏳', s.pending, 'Pending', 'gold') +
        statCard('✅', s.completed, 'Completed', 'green') +
        statCard('💰', '৳' + s.revenue.toLocaleString('en-US'), 'Revenue (Completed)', 'blue') +
        statCard('📦', s.activeProducts + '/' + s.totalProducts, 'Active Products', '') +
        statCard('⭐', s.totalReviews, 'Reviews', '');

      const pending = s.pending || 0;
      const badge = $('pendingBadge');
      badge.hidden = pending === 0;
      badge.textContent = pending;

      const rec = orders.length ? orders : await api('/api/admin/orders');
      orders = rec;
      $('recentOrdersWrap').innerHTML = ordersTableHTML(rec.slice(0, 6), true);
      wireOrderTable($('recentOrdersWrap'), true);
    } catch (e) { toast(e.message, 'error'); }
  }

  function statCard(ic, val, label, cls) {
    return '<div class="stat-card ' + (cls || '') + '"><span class="ic">' + ic + '</span><b>' + esc(String(val)) + '</b><span>' + esc(label) + '</span></div>';
  }

  /* ---------------- Orders ---------------- */
  function statusBadge(st) { return '<span class="st-badge st-' + esc(st) + '">' + esc(st) + '</span>'; }

  function methodCell(m) {
    return '<div class="m-cell"><img src="' + LOGOS[m] + '" alt="">' + esc(METHOD_NAMES[m] || m) + '</div>';
  }

  function ordersTableHTML(list, compact) {
    if (!list.length) return '<table class="adm"><tr><td class="tbl-empty">No orders found. Orders placed on the store will appear here.</td></tr></table>';
    return '<table class="adm"><thead><tr>' +
      '<th>Order ID</th><th>Product</th><th>Price</th><th>Method</th><th>Paid</th><th>TrxID</th><th>WhatsApp</th><th>Proof</th><th>Status</th>' + (compact ? '' : '<th>Actions</th>') +
      '</tr></thead><tbody>' +
      list.map(o => {
        const waUrl = 'https://wa.me/' + o.whatsapp;
        const statusCell = statusBadge(o.status) + (compact ? '' :
          '<br><select class="st-select" data-status="' + esc(o.id) + '" style="margin-top:6px">' +
          ['pending', 'processing', 'completed', 'cancelled'].map(s =>
            '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>');
        const actions = compact ? '' :
          '<td><div class="tbl-btns">' +
          '<a class="icon-btn" href="' + waUrl + '" target="_blank" rel="noopener" title="WhatsApp customer">💬</a>' +
          '<button class="icon-btn del" data-del="' + esc(o.id) + '" title="Delete order">🗑</button></div></td>';
        return '<tr data-oid="' + esc(o.id) + '">' +
          '<td><span class="mono">#' + esc(o.id) + '</span><span class="sub">' + fmtDate(o.createdAt) + '</span></td>' +
          '<td class="td-title">' + esc(o.productTitle) + '</td>' +
          '<td><b style="color:var(--green)">' + money(o.price) + '</b></td>' +
          '<td>' + methodCell(o.method) + '</td>' +
          '<td><span class="mono">' + esc(o.payAmount) + ' ' + esc(o.payCurrency) + '</span></td>' +
          '<td>' + (o.trxId ? '<span class="mono">' + esc(o.trxId) + '</span>' : '<span style="color:var(--muted)">—</span>') + '</td>' +
          '<td><a href="' + waUrl + '" target="_blank" rel="noopener" style="color:var(--green);font-weight:700">+' + esc(o.whatsapp) + '</a></td>' +
          '<td><button class="icon-btn" data-shot="' + esc(o.screenshot) + '" title="View screenshot">🖼</button></td>' +
          '<td>' + statusCell + '</td>' + actions +
          '</tr>';
      }).join('') + '</tbody></table>';
  }

  function wireOrderTable(root, compact) {
    root.querySelectorAll('[data-shot]').forEach(b => b.addEventListener('click', () => openShot(b.getAttribute('data-shot'))));
    if (compact) return;
    root.querySelectorAll('[data-status]').forEach(sel => sel.addEventListener('change', async () => {
      try {
        await api('/api/admin/orders/' + sel.getAttribute('data-status'), {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: sel.value })
        });
        const o = orders.find(x => x.id === sel.getAttribute('data-status'));
        if (o) o.status = sel.value;
        toast('Order status updated ✓', 'success');
        loadDashboard();
      } catch (e) { toast(e.message, 'error'); }
    }));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      confirmDialog('🗑', 'Delete this order?', 'The order and its payment screenshot will be removed permanently.', async () => {
        await api('/api/admin/orders/' + b.getAttribute('data-del'), { method: 'DELETE' });
        orders = orders.filter(o => o.id !== b.getAttribute('data-del'));
        renderOrders();
        loadDashboard();
        toast('Order deleted', 'success');
      });
    }));
  }

  function filteredOrders() {
    return orders.filter(o => {
      if (orderFilter !== 'all' && o.status !== orderFilter) return false;
      if (orderQ) {
        const q = orderQ.toLowerCase();
        return (o.id + ' ' + (o.trxId || '') + ' ' + o.whatsapp + ' ' + o.productTitle).toLowerCase().includes(q);
      }
      return true;
    });
  }

  function renderOrders() {
    const wrap = $('ordersWrap');
    wrap.innerHTML = ordersTableHTML(filteredOrders(), false);
    wireOrderTable(wrap, false);
  }

  async function loadOrders() {
    try {
      orders = await api('/api/admin/orders');
      renderOrders();
    } catch (e) { toast(e.message, 'error'); }
  }

  function initOrderControls() {
    $('orderFilters').addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $('orderFilters').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      orderFilter = chip.getAttribute('data-f');
      renderOrders();
    });
    $('orderSearch').addEventListener('input', e => { orderQ = e.target.value.trim(); renderOrders(); });
  }

  /* ---------------- Products ---------------- */
  let products = [];

  function productsTableHTML() {
    if (!products.length) return '<table class="adm"><tr><td class="tbl-empty">No products yet. Click "+ Add Product" to create your first product.</td></tr></table>';
    return '<table class="adm"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead><tbody>' +
      products.map(p => {
        const thumb = p.image ? '<img class="tbl-thumb" src="' + esc(p.image) + '" alt="">'
          : '<div class="tbl-thumb" style="display:flex;align-items:center;justify-content:center;font-size:20px">⭐</div>';
        return '<tr>' +
          '<td><div style="display:flex;align-items:center;gap:12px">' + thumb +
          '<div class="td-title">' + esc(p.title) + '</div></div></td>' +
          '<td>' + esc(CAT_LABELS[p.category] || p.category) + '</td>' +
          '<td><b style="color:var(--green)">' + money(p.price) + '</b></td>' +
          '<td>' + (p.active !== false ? '<span class="st-badge st-completed">active</span>' : '<span class="st-badge st-cancelled">hidden</span>') + '</td>' +
          '<td><span class="sub" style="margin:0">' + fmtDate(p.createdAt) + '</span></td>' +
          '<td><div class="tbl-btns">' +
          '<a class="icon-btn" href="/product.html?id=' + encodeURIComponent(p.id) + '" target="_blank" rel="noopener" title="View on store">👁</a>' +
          '<button class="icon-btn" data-edit="' + esc(p.id) + '" title="Edit">✏️</button>' +
          '<button class="icon-btn del" data-delprod="' + esc(p.id) + '" title="Delete">🗑</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table>';
  }

  function wireProductTable() {
    const wrap = $('productsWrap');
    wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openProductModal(products.find(p => p.id === b.getAttribute('data-edit')))));
    wrap.querySelectorAll('[data-delprod]').forEach(b => b.addEventListener('click', () => {
      confirmDialog('🗑', 'Delete this product?', 'It will be removed from the store permanently.', async () => {
        await api('/api/admin/products/' + b.getAttribute('data-delprod'), { method: 'DELETE' });
        products = products.filter(p => p.id !== b.getAttribute('data-delprod'));
        $('productsWrap').innerHTML = productsTableHTML();
        wireProductTable();
        toast('Product deleted', 'success');
      });
    }));
  }

  async function loadProducts() {
    try {
      products = await api('/api/admin/products');
      $('productsWrap').innerHTML = productsTableHTML();
      wireProductTable();
    } catch (e) { toast(e.message, 'error'); }
  }

  /* Product modal */
  function openProductModal(p) {
    editingProductId = p ? p.id : null;
    $('prodModalTitle').textContent = p ? 'Edit Product' : 'Add Product';
    const f = $('prodForm');
    f.reset();
    $('prodError').style.display = 'none';
    $('prodImgPrev').hidden = true;
    if (p) {
      f.title.value = p.title;
      f.category.value = p.category;
      f.price.value = p.price;
      f.active.value = p.active === false ? 'false' : 'true';
      f.description.value = p.description || '';
      f.features.value = (p.features || []).join('\n');
      f.imageUrl.value = p.image && !p.image.startsWith('/uploads/') ? p.image : '';
      if (p.image) { $('prodImgPrev').src = p.image; $('prodImgPrev').hidden = false; }
    }
    $('prodModal').classList.add('open');
  }

  function closeProductModal() { $('prodModal').classList.remove('open'); }

  function initProductModal() {
    $('addProductBtn').addEventListener('click', () => openProductModal(null));
    $('prodModalClose').addEventListener('click', closeProductModal);
    $('prodCancel').addEventListener('click', closeProductModal);
    $('prodModal').addEventListener('click', e => { if (e.target === $('prodModal')) closeProductModal(); });
    $('prodImgFile').addEventListener('change', e => {
      const f = e.target.files[0];
      if (f) { $('prodImgPrev').src = URL.createObjectURL(f); $('prodImgPrev').hidden = false; }
      else { $('prodImgPrev').hidden = true; }
    });
    $('prodForm').addEventListener('submit', async e => {
      e.preventDefault();
      const err = $('prodError');
      err.style.display = 'none';
      const f = $('prodForm');
      const fd = new FormData();
      fd.append('title', f.title.value);
      fd.append('category', f.category.value);
      fd.append('price', f.price.value);
      fd.append('active', f.active.value);
      fd.append('description', f.description.value);
      fd.append('features', f.features.value);
      fd.append('imageUrl', f.imageUrl.value);
      if (f.image.files[0]) fd.append('image', f.image.files[0]);
      const btn = $('prodSave');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const res = editingProductId
          ? await api('/api/admin/products/' + editingProductId, { method: 'PUT', body: fd })
          : await api('/api/admin/products', { method: 'POST', body: fd });
        closeProductModal();
        toast(editingProductId ? 'Product updated ✓' : 'Product added ✓', 'success');
        products = await api('/api/admin/products');
        $('productsWrap').innerHTML = productsTableHTML();
        wireProductTable();
      } catch (ex) {
        err.textContent = ex.message; err.style.display = 'block';
      }
      btn.disabled = false; btn.textContent = '💾 Save Product';
    });
  }

  /* ================= Orders ================= */

  function statusBadge(s) {
    const map = { pending: 'warn', confirmed: 'ok', delivered: 'ok', cancelled: 'bad' };
    return '<span class="badge ' + (map[s] || '') + '">' + s + '</span>';
  }

  function ordersTableHTML(list) {
    if (!list.length) return '<div class="empty-state"><p>No orders yet.</p></div>';
    return '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      ['Order ID', 'Product', 'Customer', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map(h => '<th>' + h + '</th>').join('') +
      '</tr></thead><tbody>' +
      list.map(o => {
        const cust = escapeHTML(o.customerName || '') + '<br><small>' + escapeHTML(o.phone || o.email || '') + '</small>';
        return '<tr>' +
          '<td><code>' + escapeHTML(o._id || o.id || '') + '</code></td>' +
          '<td>' + escapeHTML(o.productTitle || o.product || '') + '</td>' +
          '<td>' + cust + '</td>' +
          '<td>' + money(o.amount) + '</td>' +
          '<td>' + escapeHTML(o.method || o.paymentMethod || '') + '</td>' +
          '<td>' + statusBadge(o.status || 'pending') + '</td>' +
          '<td>' + (o.createdAt ? new Date(o.createdAt).toLocaleString() : '') + '</td>' +
          '<td class="actions-cell">' +
          '<button class="btn btn-sm btn-ghost" data-view-order="' + escapeHTML(o._id || o.id || '') + '">👁 View</button>' +
          '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function wireOrdersTable() {
    document.querySelectorAll('[data-view-order]').forEach(b => b.addEventListener('click', () => {
      const o = orders.find(x => (x._id || x.id) === b.getAttribute('data-view-order'));
      if (o) openOrderModal(o);
    }));
  }

  async function loadOrders() {
    orders = await api('/api/admin/orders');
    $('ordersWrap').innerHTML = ordersTableHTML(orders);
    wireOrdersTable();
  }

  function openOrderModal(o) {
    const rows = [
      ['Order ID', '<code>' + escapeHTML(o._id || o.id || '') + '</code>'],
      ['Product', escapeHTML(o.productTitle || o.product || '')],
      ['Customer', escapeHTML(o.customerName || '')],
      ['Phone', escapeHTML(o.phone || '')],
      ['Email', escapeHTML(o.email || '')],
      ['Amount', money(o.amount)],
      ['Payment Method', escapeHTML(o.method || o.paymentMethod || '')],
      ['Transaction ID', escapeHTML(o.transactionId || '')],
      ['Note', escapeHTML(o.note || '')],
      ['Status', statusBadge(o.status || 'pending')],
      ['Date', o.createdAt ? new Date(o.createdAt).toLocaleString() : '']
    ].map(r => '<div class="kv"><span>' + r[0] + '</span><div>' + r[1] + '</div></div>').join('');
    const proof = o.paymentProof ? '<img src="' + escapeHTML(o.paymentProof) + '" alt="proof" style="max-width:100%;border-radius:10px;margin-top:8px">' : '';
    $('orderDetail').innerHTML = rows + proof;
    $('orderModal').classList.add('open');
  }

  function initOrderModal() {
    $('orderModalClose').addEventListener('click', () => $('orderModal').classList.remove('open'));
    $('orderModal').addEventListener('click', e => { if (e.target === $('orderModal')) $('orderModal').classList.remove('open'); });
  }




